#!/bin/sh
# mac-guardian core functions library
# All functions prefixed mg_

MG_VERSION="0.5.0"
MG_RUNDIR="/var/run/mac-guardian"
MG_DBFILE="$MG_RUNDIR/known.db"
MG_LOCKDIR="$MG_RUNDIR/lock"
MG_LOGFILE="/var/log/mac-guardian.log"
MG_EVENTS_LOG="/var/log/mac-guardian.log"
MG_OUI_FILE="/usr/lib/secubox/mac-guardian/oui.tsv"

# --- Config variables (populated by mg_load_config) ---
MG_ENABLED=0
MG_DEBUG=0
MG_SCAN_INTERVAL=30
MG_DETECT_RANDOM=1
MG_DETECT_OUI_DUP=1
MG_OUI_DUP_THRESHOLD=5
MG_DETECT_FLIP=1
MG_FLIP_WINDOW=300
MG_FLIP_THRESHOLD=10
MG_DETECT_SPOOF=1
MG_POLICY="alert"
MG_QUARANTINE_VLAN=""
MG_NOTIFY_CROWDSEC=1
MG_STATS_FILE="/var/run/mac-guardian/stats.json"
MG_STATS_INTERVAL=60
MG_MAX_LOG_SIZE=524288

# DHCP protection config
MG_DHCP_ENABLED=1
MG_DHCP_CLEANUP_STALE=1
MG_DHCP_DEDUP_HOSTNAMES=1
MG_DHCP_FLOOD_THRESHOLD=10
MG_DHCP_FLOOD_WINDOW=60
MG_DHCP_STALE_TIMEOUT=3600

# Whitelist arrays stored as newline-separated strings
MG_WL_MACS=""
MG_WL_OUIS=""

# Runtime counters
MG_START_TIME=""
MG_TOTAL_SCANS=0
MG_TOTAL_ALERTS=0

# ============================================================
# Init / Config
# ============================================================

mg_init() {
	mkdir -p "$MG_RUNDIR"
	touch "$MG_DBFILE"
	touch "$MG_EVENTS_LOG"
	MG_START_TIME=$(date +%s)
	MG_TOTAL_SCANS=0
	MG_TOTAL_ALERTS=0
}

mg_load_config() {
	. /lib/functions.sh

	config_load mac-guardian

	# main section
	config_get MG_ENABLED main enabled 0
	config_get MG_DEBUG main debug 0
	config_get MG_SCAN_INTERVAL main scan_interval 30

	# detection section
	config_get MG_DETECT_RANDOM detection random_mac 1
	config_get MG_DETECT_OUI_DUP detection oui_duplicates 1
	config_get MG_OUI_DUP_THRESHOLD detection oui_dup_threshold 5
	config_get MG_DETECT_FLIP detection mac_flip 1
	config_get MG_FLIP_WINDOW detection flip_window 300
	config_get MG_FLIP_THRESHOLD detection flip_threshold 10
	config_get MG_DETECT_SPOOF detection spoof_detection 1

	# enforcement section
	config_get MG_POLICY enforcement policy "alert"
	config_get MG_QUARANTINE_VLAN enforcement quarantine_vlan ""
	config_get MG_NOTIFY_CROWDSEC enforcement notify_crowdsec 1

	# reporting section
	config_get MG_STATS_FILE reporting stats_file "/var/run/mac-guardian/stats.json"
	config_get MG_STATS_INTERVAL reporting stats_interval 60
	config_get MG_MAX_LOG_SIZE reporting max_log_size 524288

	# dhcp protection section
	config_get MG_DHCP_ENABLED dhcp enabled 1
	config_get MG_DHCP_CLEANUP_STALE dhcp cleanup_stale 1
	config_get MG_DHCP_DEDUP_HOSTNAMES dhcp dedup_hostnames 1
	config_get MG_DHCP_FLOOD_THRESHOLD dhcp flood_threshold 10
	config_get MG_DHCP_FLOOD_WINDOW dhcp flood_window 60
	config_get MG_DHCP_STALE_TIMEOUT dhcp stale_timeout 3600

	# whitelist lists
	MG_WL_MACS=""
	MG_WL_OUIS=""

	_mg_add_wl_mac() {
		local val="$1"
		val=$(mg_normalize_mac "$val")
		if [ -z "$MG_WL_MACS" ]; then
			MG_WL_MACS="$val"
		else
			MG_WL_MACS="$MG_WL_MACS
$val"
		fi
	}

	_mg_add_wl_oui() {
		local val="$1"
		val=$(echo "$val" | tr 'a-f' 'A-F')
		if [ -z "$MG_WL_OUIS" ]; then
			MG_WL_OUIS="$val"
		else
			MG_WL_OUIS="$MG_WL_OUIS
$val"
		fi
	}

	config_list_foreach whitelist mac _mg_add_wl_mac
	config_list_foreach whitelist oui _mg_add_wl_oui
}

# ============================================================
# Locking (mkdir-based)
# ============================================================

mg_lock() {
	local attempts=0
	local max_attempts=20

	while [ $attempts -lt $max_attempts ]; do
		if mkdir "$MG_LOCKDIR" 2>/dev/null; then
			echo $$ > "$MG_LOCKDIR/pid"
			return 0
		fi

		# Check for stale lock
		if [ -f "$MG_LOCKDIR/pid" ]; then
			local lock_pid
			lock_pid=$(cat "$MG_LOCKDIR/pid" 2>/dev/null)
			if [ -n "$lock_pid" ] && ! kill -0 "$lock_pid" 2>/dev/null; then
				mg_log "warn" "Removing stale lock from PID $lock_pid"
				rm -rf "$MG_LOCKDIR"
				continue
			fi
		fi

		attempts=$((attempts + 1))
		sleep 0.5
	done

	mg_log "err" "Failed to acquire lock after ${max_attempts} attempts"
	return 1
}

mg_unlock() {
	rm -rf "$MG_LOCKDIR"
}

# ============================================================
# MAC analysis
# ============================================================

mg_validate_mac() {
	local mac="$1"
	echo "$mac" | grep -qE '^[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5}$'
}

mg_normalize_mac() {
	echo "$1" | tr 'A-F' 'a-f'
}

mg_is_randomized() {
	local mac="$1"
	local first_octet
	first_octet=$(echo "$mac" | cut -d: -f1)
	[ $((0x$first_octet & 0x02)) -ne 0 ]
}

mg_get_oui() {
	local mac="$1"
	echo "$mac" | cut -d: -f1-3 | tr 'a-f' 'A-F'
}

mg_oui_lookup() {
	local mac="$1"
	local oui
	oui=$(mg_get_oui "$mac")
	if [ -f "$MG_OUI_FILE" ]; then
		grep -i "^${oui}	" "$MG_OUI_FILE" 2>/dev/null | head -1
	fi
}

# ============================================================
# Whitelist
# ============================================================

mg_is_whitelisted() {
	local mac="$1"
	mac=$(mg_normalize_mac "$mac")

	# Check UCI mac whitelist
	if [ -n "$MG_WL_MACS" ]; then
		echo "$MG_WL_MACS" | grep -qFx "$mac" && return 0
	fi

	# Check UCI OUI whitelist
	local oui
	oui=$(mg_get_oui "$mac")
	if [ -n "$MG_WL_OUIS" ]; then
		echo "$MG_WL_OUIS" | grep -qFx "$oui" && return 0
	fi

	# Check /etc/ethers
	if [ -f /etc/ethers ]; then
		grep -qi "^${mac}" /etc/ethers 2>/dev/null && return 0
	fi

	# Check known.db for trusted status
	local db_entry
	db_entry=$(mg_db_lookup "$mac")
	if [ -n "$db_entry" ]; then
		local status
		status=$(echo "$db_entry" | cut -d'|' -f7)
		[ "$status" = "trusted" ] && return 0
	fi

	return 1
}

# ============================================================
# known.db operations
# Format: MAC|OUI|FIRST_SEEN|LAST_SEEN|IFACE|HOSTNAME|STATUS
# ============================================================

mg_db_lookup() {
	local mac="$1"
	mac=$(mg_normalize_mac "$mac")
	grep -i "^${mac}|" "$MG_DBFILE" 2>/dev/null | head -1
}

mg_db_upsert() {
	local mac="$1"
	local iface="$2"
	local hostname="$3"

	mac=$(mg_normalize_mac "$mac")
	local oui
	oui=$(mg_get_oui "$mac")
	local now
	now=$(date +%s)
	local existing
	existing=$(mg_db_lookup "$mac")

	local tmpfile="${MG_DBFILE}.tmp.$$"

	if [ -z "$existing" ]; then
		# New entry
		local status="unknown"
		if mg_is_whitelisted "$mac"; then
			status="trusted"
		fi
		cp "$MG_DBFILE" "$tmpfile"
		echo "${mac}|${oui}|${now}|${now}|${iface}|${hostname}|${status}" >> "$tmpfile"
		mv "$tmpfile" "$MG_DBFILE"
	else
		# Update existing -- preserve first_seen and don't downgrade trusted/blocked
		local old_first old_status
		old_first=$(echo "$existing" | cut -d'|' -f3)
		old_status=$(echo "$existing" | cut -d'|' -f7)

		# Never downgrade trusted or blocked
		local new_status="$old_status"

		# Update hostname if we got a new one
		local old_hostname
		old_hostname=$(echo "$existing" | cut -d'|' -f6)
		[ -z "$hostname" ] && hostname="$old_hostname"

		local new_line="${mac}|${oui}|${old_first}|${now}|${iface}|${hostname}|${new_status}"

		grep -iv "^${mac}|" "$MG_DBFILE" > "$tmpfile" 2>/dev/null || true
		echo "$new_line" >> "$tmpfile"
		mv "$tmpfile" "$MG_DBFILE"
	fi
}

mg_db_set_status() {
	local mac="$1"
	local status="$2"

	mac=$(mg_normalize_mac "$mac")
	local existing
	existing=$(mg_db_lookup "$mac")
	[ -z "$existing" ] && return 1

	local old_status
	old_status=$(echo "$existing" | cut -d'|' -f7)

	# Never downgrade trusted to unknown, never change blocked
	if [ "$old_status" = "trusted" ] && [ "$status" = "unknown" ]; then
		return 0
	fi
	if [ "$old_status" = "blocked" ] && [ "$status" != "trusted" ]; then
		return 0
	fi

	local tmpfile="${MG_DBFILE}.tmp.$$"
	local f1 f2 f3 f4 f5 f6

	f1=$(echo "$existing" | cut -d'|' -f1)
	f2=$(echo "$existing" | cut -d'|' -f2)
	f3=$(echo "$existing" | cut -d'|' -f3)
	f4=$(echo "$existing" | cut -d'|' -f4)
	f5=$(echo "$existing" | cut -d'|' -f5)
	f6=$(echo "$existing" | cut -d'|' -f6)

	grep -iv "^${mac}|" "$MG_DBFILE" > "$tmpfile" 2>/dev/null || true
	echo "${f1}|${f2}|${f3}|${f4}|${f5}|${f6}|${status}" >> "$tmpfile"
	mv "$tmpfile" "$MG_DBFILE"
}

# ============================================================
# Hostname resolution
# ============================================================

mg_resolve_hostname() {
	local mac="$1"
	mac=$(mg_normalize_mac "$mac")
	local hostname=""

	# Check DHCP leases
	if [ -f /tmp/dhcp.leases ]; then
		hostname=$(awk -v m="$mac" 'tolower($2)==m {print $4; exit}' /tmp/dhcp.leases)
	fi

	# Check hosts files
	if [ -z "$hostname" ] || [ "$hostname" = "*" ]; then
		hostname=""
		for hfile in /tmp/hosts/*; do
			[ -f "$hfile" ] || continue
			local h
			h=$(awk -v m="$mac" 'tolower($0)~m {print $2; exit}' "$hfile" 2>/dev/null)
			if [ -n "$h" ]; then
				hostname="$h"
				break
			fi
		done
	fi

	echo "$hostname"
}

# ============================================================
# DHCP Lease Protection
# ============================================================

MG_DHCP_LEASES="/tmp/dhcp.leases"

mg_dhcp_read_leases() {
	local tmpfile="${MG_RUNDIR}/dhcp_leases.$$"
	if [ -f "$MG_DHCP_LEASES" ] && [ -s "$MG_DHCP_LEASES" ]; then
		cp "$MG_DHCP_LEASES" "$tmpfile"
	else
		: > "$tmpfile"
	fi
	echo "$tmpfile"
}

mg_dhcp_find_hostname_dupes() {
	[ "$MG_DHCP_DEDUP_HOSTNAMES" != "1" ] && return 0
	[ ! -f "$MG_DHCP_LEASES" ] || [ ! -s "$MG_DHCP_LEASES" ] && return 0

	local leases_copy
	leases_copy=$(mg_dhcp_read_leases)

	# Format: timestamp mac ip hostname clientid
	# Find hostnames that appear with more than one MAC
	local dupes_file="${MG_RUNDIR}/hostname_dupes.$$"
	awk '{print $4, $2, $1}' "$leases_copy" | \
		sort -k1,1 -k3,3n | \
		awk '
		{
			hostname=$1; mac=$2; ts=$3
			if (hostname != "*" && hostname != "" && hostname == prev_host && mac != prev_mac) {
				# Duplicate hostname with different MAC - print the older one
				if (ts < prev_ts) {
					print mac
				} else {
					print prev_mac
				}
			}
			prev_host=hostname; prev_mac=mac; prev_ts=ts
		}' | sort -u > "$dupes_file"

	if [ -s "$dupes_file" ]; then
		while read -r dup_mac; do
			[ -z "$dup_mac" ] && continue
			local hostname
			hostname=$(awk -v m="$dup_mac" 'tolower($2)==tolower(m) {print $4; exit}' "$leases_copy")
			mg_log_event "dhcp_hostname_conflict" "$dup_mac" "" "hostname=${hostname}"
			mg_dhcp_remove_lease "$dup_mac"
		done < "$dupes_file"
	fi

	rm -f "$dupes_file" "$leases_copy"
}

mg_dhcp_cleanup_stale() {
	[ "$MG_DHCP_CLEANUP_STALE" != "1" ] && return 0
	[ ! -f "$MG_DHCP_LEASES" ] || [ ! -s "$MG_DHCP_LEASES" ] && return 0

	local now
	now=$(date +%s)
	local cutoff=$((now - MG_DHCP_STALE_TIMEOUT))
	local stale_file="${MG_RUNDIR}/stale_leases.$$"

	# Find leases with timestamp older than cutoff
	awk -v cutoff="$cutoff" '$1 < cutoff {print $2}' "$MG_DHCP_LEASES" > "$stale_file"

	if [ -s "$stale_file" ]; then
		while read -r stale_mac; do
			[ -z "$stale_mac" ] && continue
			mg_log_event "dhcp_stale_removed" "$stale_mac" "" "timeout=${MG_DHCP_STALE_TIMEOUT}s"
			mg_dhcp_remove_lease "$stale_mac"
		done < "$stale_file"
	fi

	rm -f "$stale_file"
}

mg_dhcp_cleanup_stale_mac() {
	local target_mac="$1"
	[ "$MG_DHCP_CLEANUP_STALE" != "1" ] && return 0
	[ ! -f "$MG_DHCP_LEASES" ] || [ ! -s "$MG_DHCP_LEASES" ] && return 0

	local now
	now=$(date +%s)
	local cutoff=$((now - MG_DHCP_STALE_TIMEOUT))

	# Check if this specific MAC's lease is stale
	local lease_ts
	lease_ts=$(awk -v m="$target_mac" 'tolower($2)==tolower(m) {print $1; exit}' "$MG_DHCP_LEASES")
	[ -z "$lease_ts" ] && return 0

	if [ "$lease_ts" -lt "$cutoff" ] 2>/dev/null; then
		mg_log_event "dhcp_stale_removed" "$target_mac" "" "timeout=${MG_DHCP_STALE_TIMEOUT}s"
		mg_dhcp_remove_lease "$target_mac"
	fi
}

mg_dhcp_detect_flood() {
	[ "$MG_DHCP_ENABLED" != "1" ] && return 0
	[ ! -f "$MG_DHCP_LEASES" ] || [ ! -s "$MG_DHCP_LEASES" ] && return 0

	local now
	now=$(date +%s)
	local window_start=$((now - MG_DHCP_FLOOD_WINDOW))

	local recent_count
	recent_count=$(awk -v ws="$window_start" '$1 >= ws' "$MG_DHCP_LEASES" | wc -l)
	recent_count=$((recent_count + 0))

	if [ "$recent_count" -gt "$MG_DHCP_FLOOD_THRESHOLD" ]; then
		mg_log_event "dhcp_lease_flood" "" "" "leases=${recent_count} window=${MG_DHCP_FLOOD_WINDOW}s threshold=${MG_DHCP_FLOOD_THRESHOLD}"
	fi
}

mg_dhcp_remove_lease() {
	local mac="$1"
	[ -z "$mac" ] && return 1
	[ ! -f "$MG_DHCP_LEASES" ] && return 0

	local tmpfile="${MG_DHCP_LEASES}.tmp.$$"
	grep -iv " ${mac} " "$MG_DHCP_LEASES" > "$tmpfile" 2>/dev/null || : > "$tmpfile"
	mv "$tmpfile" "$MG_DHCP_LEASES"

	# Signal odhcpd to reload leases
	local odhcpd_pid
	odhcpd_pid=$(pgrep odhcpd)
	if [ -n "$odhcpd_pid" ]; then
		kill -HUP "$odhcpd_pid" 2>/dev/null
	fi
}

mg_dhcp_maintenance() {
	[ "$MG_DHCP_ENABLED" != "1" ] && return 0

	mg_dhcp_find_hostname_dupes
	mg_dhcp_cleanup_stale
	mg_dhcp_detect_flood
}

# ============================================================
# Logging
# ============================================================

mg_log() {
	local level="$1"
	local msg="$2"

	logger -t mac-guardian -p "daemon.${level}" "$msg"

	if [ "$MG_DEBUG" = "1" ] && [ "$level" = "debug" ]; then
		echo "[DEBUG] $msg" >&2
	fi
}

mg_log_event() {
	local event="$1"
	local mac="$2"
	local iface="$3"
	local details="$4"

	local ts
	ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +%s)

	# Sanitize fields for JSON safety (remove quotes and backslashes)
	mac=$(echo "$mac" | tr -d '"\\')
	iface=$(echo "$iface" | tr -d '"\\')
	details=$(echo "$details" | tr -d '"\\')
	event=$(echo "$event" | tr -d '"\\')

	local json_line="{\"ts\":\"${ts}\",\"event\":\"${event}\",\"mac\":\"${mac}\",\"iface\":\"${iface}\",\"details\":\"${details}\"}"

	echo "$json_line" >> "$MG_EVENTS_LOG"
	mg_log "notice" "EVENT ${event} mac=${mac} iface=${iface} ${details}"

	MG_TOTAL_ALERTS=$((MG_TOTAL_ALERTS + 1))
}

mg_log_rotate() {
	if [ ! -f "$MG_EVENTS_LOG" ]; then
		return 0
	fi

	local size
	size=$(wc -c < "$MG_EVENTS_LOG" 2>/dev/null || echo 0)

	if [ "$size" -gt "$MG_MAX_LOG_SIZE" ]; then
		cp "$MG_EVENTS_LOG" "${MG_EVENTS_LOG}.1"
		: > "$MG_EVENTS_LOG"
		mg_log "info" "Log rotated (was ${size} bytes)"
	fi
}

# ============================================================
# Detection
# ============================================================

mg_check_station() {
	local mac="$1"
	local signal="$2"
	local iface="$3"

	mac=$(mg_normalize_mac "$mac")

	# Validate MAC format
	if ! mg_validate_mac "$mac"; then
		mg_log "warn" "Invalid MAC format: $mac"
		return 1
	fi

	# Skip whitelisted
	if mg_is_whitelisted "$mac"; then
		mg_log "debug" "Whitelisted MAC: $mac"
		return 0
	fi

	local hostname
	hostname=$(mg_resolve_hostname "$mac")

	# Check existing status
	local existing
	existing=$(mg_db_lookup "$mac")
	if [ -n "$existing" ]; then
		local old_status
		old_status=$(echo "$existing" | cut -d'|' -f7)
		if [ "$old_status" = "blocked" ]; then
			mg_log "debug" "Blocked MAC seen again: $mac"
			mg_enforce "$mac" "$iface" "blocked_reappeared"
			return 0
		fi
	fi

	local is_new=0
	if [ -z "$existing" ]; then
		is_new=1
		mg_log_event "new_station" "$mac" "$iface" "hostname=${hostname}"
	fi

	# Update database
	mg_db_upsert "$mac" "$iface" "$hostname"

	# Randomized MAC detection
	if [ "$MG_DETECT_RANDOM" = "1" ] && mg_is_randomized "$mac"; then
		mg_log_event "randomized_mac" "$mac" "$iface" "locally_administered_bit_set"
		mg_db_set_status "$mac" "suspect"
		if [ "$MG_POLICY" != "alert" ]; then
			mg_enforce "$mac" "$iface" "randomized_mac"
		fi
	fi

	# Spoof detection: signal strength anomaly for known MAC
	if [ "$MG_DETECT_SPOOF" = "1" ] && [ -n "$signal" ] && [ -n "$existing" ]; then
		local old_iface
		old_iface=$(echo "$existing" | cut -d'|' -f5)
		if [ "$old_iface" != "$iface" ] && [ -n "$old_iface" ]; then
			mg_log_event "spoof_detected" "$mac" "$iface" "iface_change=${old_iface}->${iface}"
			mg_db_set_status "$mac" "suspect"
			mg_enforce "$mac" "$iface" "spoof_detected"
		fi
	fi
}

mg_detect_oui_anomaly() {
	local iface="$1"

	[ "$MG_DETECT_OUI_DUP" != "1" ] && return 0

	# Count STAs per OUI on this interface
	local oui_counts_file="${MG_RUNDIR}/oui_counts.$$"

	grep "|${iface}|" "$MG_DBFILE" 2>/dev/null | \
		cut -d'|' -f2 | sort | uniq -c | sort -rn > "$oui_counts_file"

	while read -r count oui; do
		if [ "$count" -gt "$MG_OUI_DUP_THRESHOLD" ]; then
			mg_log_event "oui_anomaly" "" "$iface" "oui=${oui} count=${count} threshold=${MG_OUI_DUP_THRESHOLD}"
		fi
	done < "$oui_counts_file"

	rm -f "$oui_counts_file"
}

mg_detect_mac_flip() {
	local iface="$1"

	[ "$MG_DETECT_FLIP" != "1" ] && return 0

	local now
	now=$(date +%s)
	local window_start=$((now - MG_FLIP_WINDOW))

	# Count MACs first seen within the window on this interface
	local count=0

	while IFS='|' read -r _mac _oui first_seen _last _if _host _status; do
		[ -z "$first_seen" ] && continue
		[ "$_if" != "$iface" ] && continue
		if [ "$first_seen" -ge "$window_start" ] 2>/dev/null; then
			count=$((count + 1))
		fi
	done < "$MG_DBFILE"

	if [ "$count" -gt "$MG_FLIP_THRESHOLD" ]; then
		mg_log_event "mac_flood" "" "$iface" "new_macs=${count} window=${MG_FLIP_WINDOW}s threshold=${MG_FLIP_THRESHOLD}"
	fi
}

# ============================================================
# Enforcement
# ============================================================

mg_enforce() {
	local mac="$1"
	local iface="$2"
	local reason="$3"

	mg_log "warn" "Enforcing policy=${MG_POLICY} on mac=${mac} iface=${iface} reason=${reason}"

	case "$MG_POLICY" in
		alert)
			# Log only -- already logged by caller
			;;
		quarantine|deny)
			# Try ebtables first
			if command -v ebtables >/dev/null 2>&1; then
				# Check if rule already exists
				if ! ebtables -L INPUT 2>/dev/null | grep -qi "$mac"; then
					ebtables -A INPUT -s "$mac" -j DROP 2>/dev/null
					ebtables -A FORWARD -s "$mac" -j DROP 2>/dev/null
					mg_log "notice" "ebtables DROP added for $mac"
				fi
			else
				# Fallback: hostapd deny ACL
				local hostapd_deny="/var/run/hostapd-${iface}.deny"
				if [ ! -f "$hostapd_deny" ] || ! grep -qi "$mac" "$hostapd_deny" 2>/dev/null; then
					echo "$mac" >> "$hostapd_deny"
					mg_log "notice" "Added $mac to hostapd deny ACL for $iface"
				fi
			fi

			# For deny policy, also deauthenticate
			if [ "$MG_POLICY" = "deny" ]; then
				if command -v hostapd_cli >/dev/null 2>&1; then
					hostapd_cli -i "$iface" deauthenticate "$mac" 2>/dev/null
					mg_log "notice" "Deauthenticated $mac from $iface"
				fi
			fi

			mg_db_set_status "$mac" "blocked"
			;;
	esac
}

mg_unenforce() {
	local mac="$1"
	mac=$(mg_normalize_mac "$mac")

	# Remove ebtables rules
	if command -v ebtables >/dev/null 2>&1; then
		ebtables -D INPUT -s "$mac" -j DROP 2>/dev/null
		ebtables -D FORWARD -s "$mac" -j DROP 2>/dev/null
	fi

	# Remove from hostapd deny ACLs
	local dfile
	for dfile in /var/run/hostapd-*.deny; do
		[ -f "$dfile" ] || continue
		local tmpf="${dfile}.tmp.$$"
		grep -iv "^${mac}$" "$dfile" > "$tmpf" 2>/dev/null || true
		mv "$tmpf" "$dfile"
	done
}

# ============================================================
# Stats
# ============================================================

mg_stats_generate() {
	local now
	now=$(date +%s)
	local uptime=0
	[ -n "$MG_START_TIME" ] && uptime=$((now - MG_START_TIME))

	local total_known=0 total_trusted=0 total_suspect=0 total_blocked=0 total_unknown=0

	if [ -f "$MG_DBFILE" ] && [ -s "$MG_DBFILE" ]; then
		total_known=$(wc -l < "$MG_DBFILE")
		total_trusted=$(grep -c '|trusted$' "$MG_DBFILE" 2>/dev/null || echo 0)
		total_suspect=$(grep -c '|suspect$' "$MG_DBFILE" 2>/dev/null || echo 0)
		total_blocked=$(grep -c '|blocked$' "$MG_DBFILE" 2>/dev/null || echo 0)
		total_unknown=$(grep -c '|unknown$' "$MG_DBFILE" 2>/dev/null || echo 0)
	fi

	local last_alert=""
	if [ -f "$MG_EVENTS_LOG" ] && [ -s "$MG_EVENTS_LOG" ]; then
		last_alert=$(tail -1 "$MG_EVENTS_LOG" 2>/dev/null)
	fi

	# Sanitize last_alert for JSON embedding
	last_alert=$(echo "$last_alert" | tr -d '\n')

	local stats_dir
	stats_dir=$(dirname "$MG_STATS_FILE")
	mkdir -p "$stats_dir"

	cat > "$MG_STATS_FILE" <<-STATS_EOF
	{"version":"${MG_VERSION}","uptime":${uptime},"scans":${MG_TOTAL_SCANS},"alerts":${MG_TOTAL_ALERTS},"clients":{"total":${total_known},"trusted":${total_trusted},"suspect":${total_suspect},"blocked":${total_blocked},"unknown":${total_unknown}},"last_alert":${last_alert:-null}}
	STATS_EOF
}

# ============================================================
# WiFi interface scanning
# ============================================================

mg_get_wifi_ifaces() {
	iwinfo 2>/dev/null | grep "ESSID" | awk '{print $1}'
}

mg_scan_iface() {
	local iface="$1"

	mg_log "debug" "Scanning interface: $iface"

	# Get associated stations
	local assoclist
	assoclist=$(iwinfo "$iface" assoclist 2>/dev/null) || return 0

	echo "$assoclist" | while read -r line; do
		# iwinfo assoclist format: "MAC_ADDR  SIGNAL  ..."
		local mac signal
		mac=$(echo "$line" | grep -oE '[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}' | head -1)
		[ -z "$mac" ] && continue

		signal=$(echo "$line" | grep -oE '[-][0-9]+ dBm' | grep -oE '[-][0-9]+' | head -1)

		mg_check_station "$mac" "$signal" "$iface"
	done

	# Run interface-level detections
	mg_detect_oui_anomaly "$iface"
	mg_detect_mac_flip "$iface"
}

mg_scan_all() {
	local ifaces
	ifaces=$(mg_get_wifi_ifaces)

	if [ -z "$ifaces" ]; then
		mg_log "debug" "No WiFi interfaces found"
		return 0
	fi

	mg_lock || return 1

	for iface in $ifaces; do
		mg_scan_iface "$iface"
	done

	mg_dhcp_maintenance

	MG_TOTAL_SCANS=$((MG_TOTAL_SCANS + 1))

	mg_unlock
}
