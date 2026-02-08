#!/bin/sh
#
# SecuBox RPCD - Dashboard Data
# Dashboard summary, public IPs, quick actions, logs
#

# Register methods
list_methods_dashboard() {
	add_method "get_dashboard_data"
	add_method "get_public_ips"
	add_method "refresh_public_ips"
	add_method_str "quick_action" "action"
	json_add_object "getLogs"
		json_add_string "service" "string"
		json_add_int "lines" "integer"
	json_close_object
}

# Handle method calls
handle_dashboard() {
	local method="$1"
	case "$method" in
		get_dashboard_data)
			_do_dashboard_data
			;;
		get_public_ips)
			_do_public_ips
			;;
		refresh_public_ips)
			_do_refresh_public_ips
			;;
		quick_action)
			read_input_json
			local action=$(get_input "action")
			_do_quick_action "$action"
			;;
		getLogs)
			read_input_json
			local service=$(get_input "service")
			local lines=$(get_input_int "lines" 100)
			_do_get_logs "$service" "$lines"
			;;
		*)
			return 1
			;;
	esac
}

# Dashboard summary data (optimized - no slow appstore call)
_do_dashboard_data() {
	json_init

	# Fast module counting
	local total_modules=0
	local running_modules=0
	local CATALOG_FILE="/usr/share/secubox/catalog.json"
	if [ -f "$CATALOG_FILE" ]; then
		total_modules=$(jsonfilter -i "$CATALOG_FILE" -e '@.plugins[*].id' 2>/dev/null | wc -l)
	fi
	[ -z "$total_modules" ] || [ "$total_modules" -eq 0 ] && total_modules=0

	# Count running LXC containers
	local lxc_running=$(lxc-ls --running 2>/dev/null | wc -w)
	lxc_running=${lxc_running:-0}

	# Count running init services that are SecuBox-related
	local svc_running=0
	for svc in crowdsec tor haproxy netifyd syslog-ng; do
		if pgrep -f "$svc" >/dev/null 2>&1; then
			svc_running=$((svc_running + 1))
		fi
	done

	running_modules=$((lxc_running + svc_running))

	# Get system info
	local uptime_seconds=$(get_uptime_seconds)
	local load_avg=$(get_load_avg)

	json_add_object "status"
	json_add_string "version" "0.8.0"
	json_add_int "uptime" "$uptime_seconds"
	json_add_string "load" "$load_avg"
	json_close_object

	json_add_object "counts"
	json_add_int "total" "$total_modules"
	json_add_int "running" "$running_modules"
	json_add_int "lxc_running" "$lxc_running"
	json_add_int "services_running" "$svc_running"
	json_close_object

	json_dump
}

# Public IPs (cached)
_do_public_ips() {
	json_init

	local cache_v4="/tmp/secubox_public_ipv4"
	local cache_v6="/tmp/secubox_public_ipv6"
	local ipv4="" ipv6=""

	[ -f "$cache_v4" ] && ipv4=$(cat "$cache_v4" 2>/dev/null)
	[ -f "$cache_v6" ] && ipv6=$(cat "$cache_v6" 2>/dev/null)

	# Fallback: get from interface
	if [ -z "$ipv4" ]; then
		ipv4=$(ip -4 addr show scope global 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)
	fi
	if [ -z "$ipv6" ]; then
		ipv6=$(ip -6 addr show scope global 2>/dev/null | grep -oE '[0-9a-f:]+::[0-9a-f:]+' | head -1)
	fi

	json_add_string "ipv4" "${ipv4:-N/A}"
	json_add_string "ipv6" "${ipv6:-N/A}"
	json_add_boolean "ipv4_available" "$([ -n "$ipv4" ] && [ "$ipv4" != "N/A" ] && echo 1 || echo 0)"
	json_add_boolean "ipv6_available" "$([ -n "$ipv6" ] && [ "$ipv6" != "N/A" ] && echo 1 || echo 0)"

	json_dump
}

# Refresh public IPs in background
_do_refresh_public_ips() {
	json_init
	(
		for svc in "https://api.ipify.org" "https://ipv4.icanhazip.com"; do
			local ipv4=$(curl -4 -s --connect-timeout 2 --max-time 3 "$svc" 2>/dev/null | tr -d '\n')
			[ -n "$ipv4" ] && { echo "$ipv4" > /tmp/secubox_public_ipv4; break; }
		done
		for svc in "https://api64.ipify.org" "https://ipv6.icanhazip.com"; do
			local ipv6=$(curl -6 -s --connect-timeout 2 --max-time 3 "$svc" 2>/dev/null | tr -d '\n')
			[ -n "$ipv6" ] && { echo "$ipv6" > /tmp/secubox_public_ipv6; break; }
		done
	) &
	json_add_boolean "success" 1
	json_dump
}

# Quick actions
_do_quick_action() {
	local action="$1"
	json_init

	case "$action" in
		restart_services)
			for svc in haproxy crowdsec tor netifyd; do
				if [ -x "/etc/init.d/$svc" ]; then
					/etc/init.d/$svc restart 2>/dev/null &
				elif [ -x "/usr/sbin/${svc}ctl" ]; then
					/usr/sbin/${svc}ctl restart 2>/dev/null &
				fi
			done
			json_add_boolean "success" 1
			json_add_string "message" "Services restart initiated"
			;;
		restart_*)
			local svc_name="${action#restart_}"
			if [ -x "/etc/init.d/$svc_name" ]; then
				/etc/init.d/$svc_name restart 2>/dev/null
				json_add_boolean "success" 1
				json_add_string "message" "Service $svc_name restarted"
			elif [ -x "/usr/sbin/${svc_name}ctl" ]; then
				/usr/sbin/${svc_name}ctl restart 2>/dev/null
				json_add_boolean "success" 1
				json_add_string "message" "Service $svc_name restarted"
			else
				json_add_boolean "success" 0
				json_add_string "message" "Service $svc_name not found"
			fi
			;;
		update_packages)
			opkg update 2>/dev/null &
			json_add_boolean "success" 1
			json_add_string "message" "Package update initiated"
			;;
		view_logs)
			json_add_boolean "success" 1
			json_add_string "redirect" "/cgi-bin/luci/admin/status/syslog"
			;;
		export_config)
			if [ -x "/usr/sbin/secubox-recovery" ]; then
				local snapshot_name="export-$(date +%Y%m%d-%H%M%S)"
				/usr/sbin/secubox-recovery snapshot "$snapshot_name" 2>/dev/null
				json_add_boolean "success" 1
				json_add_string "message" "Configuration exported as $snapshot_name"
			else
				json_add_boolean "success" 0
				json_add_string "message" "Recovery system not available"
			fi
			;;
		*)
			json_add_boolean "success" 0
			json_add_string "message" "Unknown action: $action"
			;;
	esac

	json_dump
}

# Get logs
_do_get_logs() {
	local service="$1"
	local lines="$2"

	json_init
	json_add_array "logs"
	if [ -n "$service" ]; then
		logread -e "$service" | tail -n "$lines" | while read -r line; do
			json_add_string "" "$line"
		done
	else
		logread | tail -n "$lines" | while read -r line; do
			json_add_string "" "$line"
		done
	fi
	json_close_array
	json_dump
}
