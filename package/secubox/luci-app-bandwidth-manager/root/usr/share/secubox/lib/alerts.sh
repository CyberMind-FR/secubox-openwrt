#!/bin/sh
# SecuBox Alerts Library
# Shared alert functions for bandwidth manager and client guardian
# Version: 1.0.0

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

# Configuration paths
ALERT_CONFIG="/etc/config/bandwidth"
ALERT_HISTORY="/var/run/secubox/alert_history.json"
PENDING_ALERTS="/var/run/secubox/pending_alerts.json"

# Ensure runtime directories exist
init_alert_dirs() {
	mkdir -p /var/run/secubox
	[ -f "$ALERT_HISTORY" ] || echo '[]' > "$ALERT_HISTORY"
	[ -f "$PENDING_ALERTS" ] || echo '[]' > "$PENDING_ALERTS"
}

# Get alert settings
get_alert_setting() {
	local option="$1"
	local default="$2"
	config_load bandwidth
	config_get value alerts "$option" "$default"
	echo "$value"
}

# Send email notification
send_email() {
	local subject="$1"
	local body="$2"
	local recipient=""
	local smtp_server=""
	local smtp_port=""
	local smtp_user=""
	local smtp_password=""

	config_load bandwidth
	config_get recipient email recipient ""
	config_get smtp_server email smtp_server ""
	config_get smtp_port email smtp_port "587"
	config_get smtp_user email smtp_user ""
	config_get smtp_password email smtp_password ""

	[ -z "$recipient" ] && return 1
	[ -z "$smtp_server" ] && return 1

	# Use msmtp or sendmail if available
	if command -v msmtp >/dev/null 2>&1; then
		{
			echo "From: SecuBox <secubox@$(cat /proc/sys/kernel/hostname)>"
			echo "To: $recipient"
			echo "Subject: $subject"
			echo "Content-Type: text/plain; charset=utf-8"
			echo ""
			echo "$body"
		} | msmtp --host="$smtp_server" --port="$smtp_port" \
			--auth=on --user="$smtp_user" --passwordeval="echo '$smtp_password'" \
			--tls=on "$recipient" 2>/dev/null
		return $?
	elif command -v sendmail >/dev/null 2>&1; then
		{
			echo "From: SecuBox <secubox@$(cat /proc/sys/kernel/hostname)>"
			echo "To: $recipient"
			echo "Subject: $subject"
			echo "Content-Type: text/plain; charset=utf-8"
			echo ""
			echo "$body"
		} | sendmail -t 2>/dev/null
		return $?
	fi

	return 1
}

# Send SMS notification (Twilio)
send_sms() {
	local message="$1"
	local provider=""
	local account_sid=""
	local auth_token=""
	local from_number=""
	local to_number=""

	config_load bandwidth
	config_get provider sms provider "twilio"
	config_get account_sid sms account_sid ""
	config_get auth_token sms auth_token ""
	config_get from_number sms from_number ""
	config_get to_number sms to_number ""

	[ -z "$account_sid" ] && return 1
	[ -z "$auth_token" ] && return 1
	[ -z "$to_number" ] && return 1

	case "$provider" in
		twilio)
			[ -z "$from_number" ] && return 1
			curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$account_sid/Messages.json" \
				-u "$account_sid:$auth_token" \
				--data-urlencode "From=$from_number" \
				--data-urlencode "To=$to_number" \
				--data-urlencode "Body=$message" \
				>/dev/null 2>&1
			return $?
			;;
		*)
			return 1
			;;
	esac
}

# Log alert to history
log_alert() {
	local type="$1"
	local message="$2"
	local severity="${3:-info}"
	local timestamp=$(date +%s)
	local id=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "alert-$timestamp-$$")

	init_alert_dirs

	# Read existing history
	local history=""
	[ -f "$ALERT_HISTORY" ] && history=$(cat "$ALERT_HISTORY")
	[ -z "$history" ] && history="[]"

	# Create new alert entry
	json_init
	json_add_string "id" "$id"
	json_add_string "type" "$type"
	json_add_string "message" "$message"
	json_add_string "severity" "$severity"
	json_add_int "timestamp" "$timestamp"
	json_add_boolean "acknowledged" 0
	local new_alert=$(json_dump)
	json_cleanup

	# Prepend to history (keep last 100 alerts)
	echo "$history" | jsonfilter -e '@[0:99]' 2>/dev/null | {
		read old_alerts
		[ -z "$old_alerts" ] && old_alerts="[]"
		# Prepend new alert
		echo "[$new_alert${old_alerts#[}" > "$ALERT_HISTORY"
	}

	# Also add to pending if not acknowledged
	local pending=""
	[ -f "$PENDING_ALERTS" ] && pending=$(cat "$PENDING_ALERTS")
	[ -z "$pending" ] && pending="[]"

	echo "$pending" | {
		read old_pending
		[ -z "$old_pending" ] && old_pending="[]"
		echo "[$new_alert${old_pending#[}" > "$PENDING_ALERTS"
	}

	echo "$id"
}

# Acknowledge an alert
acknowledge_alert() {
	local alert_id="$1"

	init_alert_dirs

	# Remove from pending alerts
	if [ -f "$PENDING_ALERTS" ]; then
		local new_pending=$(jsonfilter -i "$PENDING_ALERTS" -e '@[*]' 2>/dev/null | \
			while read line; do
				local id=$(echo "$line" | jsonfilter -e '@.id' 2>/dev/null)
				[ "$id" != "$alert_id" ] && echo "$line"
			done | tr '\n' ',' | sed 's/,$//' | sed 's/^/[/' | sed 's/$/]/')
		[ -z "$new_pending" ] && new_pending="[]"
		echo "$new_pending" > "$PENDING_ALERTS"
	fi

	# Mark as acknowledged in history
	# Note: Full history update would require more complex JSON manipulation

	return 0
}

# Get pending alerts count
get_pending_count() {
	init_alert_dirs
	[ -f "$PENDING_ALERTS" ] || { echo "0"; return; }
	jsonfilter -i "$PENDING_ALERTS" -e '@[*]' 2>/dev/null | wc -l
}

# Check bandwidth thresholds
check_bandwidth_thresholds() {
	local threshold_80=$(get_alert_setting "quota_threshold_80" "0")
	local threshold_90=$(get_alert_setting "quota_threshold_90" "0")
	local threshold_100=$(get_alert_setting "quota_threshold_100" "0")

	# Get all quota configurations
	config_load bandwidth
	config_foreach check_quota_threshold quota
}

check_quota_threshold() {
	local section="$1"
	local name=""
	local limit=""
	local current=""
	local mac=""

	config_get name "$section" name ""
	config_get limit "$section" limit "0"
	config_get mac "$section" mac ""

	[ -z "$limit" ] || [ "$limit" = "0" ] && return

	# Get current usage from nlbwmon or similar
	if [ -n "$mac" ]; then
		current=$(get_device_usage "$mac")
	else
		current=$(get_total_usage)
	fi

	[ -z "$current" ] && current=0

	local percent=$((current * 100 / limit))

	local threshold_80=$(get_alert_setting "quota_threshold_80" "0")
	local threshold_90=$(get_alert_setting "quota_threshold_90" "0")
	local threshold_100=$(get_alert_setting "quota_threshold_100" "0")

	local alert_sent=0

	if [ "$percent" -ge 100 ] && [ "$threshold_100" = "1" ]; then
		send_threshold_alert "$name" "$percent" "exceeded" "$mac"
		alert_sent=1
	elif [ "$percent" -ge 90 ] && [ "$threshold_90" = "1" ] && [ "$alert_sent" = "0" ]; then
		send_threshold_alert "$name" "$percent" "critical" "$mac"
		alert_sent=1
	elif [ "$percent" -ge 80 ] && [ "$threshold_80" = "1" ] && [ "$alert_sent" = "0" ]; then
		send_threshold_alert "$name" "$percent" "warning" "$mac"
	fi
}

# Get device usage from nlbwmon
get_device_usage() {
	local mac="$1"
	local total=0

	if [ -f "/var/lib/nlbwmon/$(date +%Y%m%d).db" ]; then
		# Parse nlbwmon database for this MAC
		# Simplified - actual implementation would parse binary format
		total=0
	fi

	echo "$total"
}

# Get total network usage
get_total_usage() {
	local total=0

	# Sum all interface RX bytes
	for iface in /sys/class/net/*/statistics/rx_bytes; do
		[ -f "$iface" ] && {
			local bytes=$(cat "$iface")
			total=$((total + bytes))
		}
	done

	echo "$total"
}

# Send threshold alert
send_threshold_alert() {
	local name="$1"
	local percent="$2"
	local severity="$3"
	local mac="$4"

	local message="Bandwidth quota '$name' has reached ${percent}%"
	[ -n "$mac" ] && message="$message (Device: $mac)"

	# Log the alert
	log_alert "quota_threshold" "$message" "$severity"

	# Send notifications
	local email_enabled=$(get_alert_setting "email_enabled" "0")
	local sms_enabled=$(get_alert_setting "sms_enabled" "0")

	if [ "$email_enabled" = "1" ]; then
		send_email "[SecuBox] Bandwidth Alert: $severity" "$message"
	fi

	if [ "$sms_enabled" = "1" ]; then
		send_sms "SecuBox: $message"
	fi
}

# Check for new devices
check_new_devices() {
	local new_device_alert=$(get_alert_setting "new_device_alert" "0")
	[ "$new_device_alert" != "1" ] && return

	local known_devices="/var/run/secubox/known_devices"
	local current_devices=$(cat /proc/net/arp | awk 'NR>1 && $3!="0x0" {print $4}' | sort -u)

	mkdir -p /var/run/secubox
	[ -f "$known_devices" ] || touch "$known_devices"

	echo "$current_devices" | while read mac; do
		[ -z "$mac" ] && continue
		if ! grep -q "$mac" "$known_devices" 2>/dev/null; then
			# New device detected
			local message="New device connected: $mac"
			log_alert "new_device" "$message" "info"

			local email_enabled=$(get_alert_setting "email_enabled" "0")
			local sms_enabled=$(get_alert_setting "sms_enabled" "0")

			[ "$email_enabled" = "1" ] && send_email "[SecuBox] New Device Alert" "$message"
			[ "$sms_enabled" = "1" ] && send_sms "SecuBox: $message"

			echo "$mac" >> "$known_devices"
		fi
	done
}

# Check for high bandwidth usage
check_high_bandwidth() {
	local high_bandwidth_alert=$(get_alert_setting "high_bandwidth_alert" "0")
	[ "$high_bandwidth_alert" != "1" ] && return

	local threshold=$(get_alert_setting "high_bandwidth_threshold" "100") # Mbps
	local threshold_bytes=$((threshold * 1000000 / 8))

	# Get current bandwidth from /proc/net/dev
	local prev_file="/var/run/secubox/prev_bandwidth"
	local curr_total=0

	for iface in /sys/class/net/*/statistics/rx_bytes; do
		[ -f "$iface" ] && {
			local bytes=$(cat "$iface")
			curr_total=$((curr_total + bytes))
		}
	done

	if [ -f "$prev_file" ]; then
		local prev_total=$(cat "$prev_file")
		local diff=$((curr_total - prev_total))

		# Assuming 5 second interval
		local rate=$((diff / 5))

		if [ "$rate" -gt "$threshold_bytes" ]; then
			local rate_mbps=$((rate * 8 / 1000000))
			local message="High bandwidth usage detected: ${rate_mbps} Mbps"
			log_alert "high_bandwidth" "$message" "warning"

			local email_enabled=$(get_alert_setting "email_enabled" "0")
			local sms_enabled=$(get_alert_setting "sms_enabled" "0")

			[ "$email_enabled" = "1" ] && send_email "[SecuBox] High Bandwidth Alert" "$message"
			[ "$sms_enabled" = "1" ] && send_sms "SecuBox: $message"
		fi
	fi

	echo "$curr_total" > "$prev_file"
}

# Main check function (called by cron)
run_alert_checks() {
	local enabled=$(get_alert_setting "enabled" "0")
	[ "$enabled" != "1" ] && return

	check_bandwidth_thresholds
	check_new_devices
	check_high_bandwidth
}

# Test notification
test_notification() {
	local type="$1"

	case "$type" in
		email)
			send_email "[SecuBox] Test Notification" "This is a test email from SecuBox Bandwidth Manager."
			return $?
			;;
		sms)
			send_sms "SecuBox: Test notification"
			return $?
			;;
		*)
			return 1
			;;
	esac
}
