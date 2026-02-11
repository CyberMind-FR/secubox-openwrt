#!/bin/sh
#
# SecuBox RPCD - Health & Diagnostics
# Network health, vital services, full health report, alerts
#

# Register methods
list_methods_health() {
	json_add_object "runDiagnostics"
		json_add_string "target" "string"
	json_close_object
	add_method "getHealth"
	add_method "get_network_health"
	add_method "get_vital_services"
	add_method "get_full_health_report"
	add_method "get_system_health"
	add_method "get_alerts"
}

# Handle method calls
handle_health() {
	local method="$1"
	case "$method" in
		runDiagnostics)
			read_input_json
			local target=$(get_input "target")
			/usr/sbin/secubox-diagnostics run "${target:-all}"
			;;
		getHealth)
			/usr/sbin/secubox-core health
			;;
		get_network_health)
			_do_network_health
			;;
		get_vital_services)
			_do_vital_services
			;;
		get_full_health_report)
			_do_full_health_report
			;;
		get_system_health)
			_do_system_health
			;;
		get_alerts)
			_do_get_alerts
			;;
		*)
			return 1
			;;
	esac
}

# Network health monitoring - detects CRC errors, link flapping
_do_network_health() {
	local DMESG_LINES=500
	local FLAP_THRESHOLD=5
	local CRC_THRESHOLD=10

	json_init
	json_add_string "timestamp" "$(get_timestamp)"
	json_add_object "interfaces"

	local overall="healthy"
	local critical_count=0
	local warning_count=0

	for iface_path in /sys/class/net/eth* /sys/class/net/wan* /sys/class/net/lan*; do
		[ -d "$iface_path" ] || continue
		[ -d "$iface_path/device" ] || continue
		local iface=$(basename "$iface_path")

		local current_state=$(cat "$iface_path/operstate" 2>/dev/null || echo "unknown")
		local crc_count=$(dmesg | tail -n $DMESG_LINES | grep -c "$iface.*crc error" 2>/dev/null)
		crc_count=${crc_count:-0}
		local link_up=$(dmesg | tail -n $DMESG_LINES | grep -c "$iface: Link is Up" 2>/dev/null)
		link_up=${link_up:-0}
		local link_down=$(dmesg | tail -n $DMESG_LINES | grep -c "$iface: Link is Down" 2>/dev/null)
		link_down=${link_down:-0}
		local link_changes=$((link_up + link_down))

		local status="ok"
		local issues=""

		if [ "$crc_count" -ge "$CRC_THRESHOLD" ]; then
			status="critical"
			issues="CRC errors ($crc_count)"
			critical_count=$((critical_count + 1))
		fi

		if [ "$link_changes" -ge "$FLAP_THRESHOLD" ]; then
			[ "$status" = "ok" ] && status="warning"
			[ -n "$issues" ] && issues="$issues; "
			issues="${issues}Link flapping ($link_changes changes)"
			warning_count=$((warning_count + 1))
		fi

		local rx_errors=$(cat "$iface_path/statistics/rx_errors" 2>/dev/null || echo 0)
		local tx_errors=$(cat "$iface_path/statistics/tx_errors" 2>/dev/null || echo 0)

		json_add_object "$iface"
		json_add_string "status" "$status"
		json_add_string "state" "$current_state"
		json_add_int "crc_errors" "$crc_count"
		json_add_int "link_changes" "$link_changes"
		json_add_int "rx_errors" "$rx_errors"
		json_add_int "tx_errors" "$tx_errors"
		json_add_string "issues" "$issues"
		json_close_object
	done

	json_close_object

	if [ "$critical_count" -gt 0 ]; then
		overall="critical"
	elif [ "$warning_count" -gt 0 ]; then
		overall="warning"
	fi

	json_add_string "overall" "$overall"
	json_add_int "critical_interfaces" "$critical_count"
	json_add_int "warning_interfaces" "$warning_count"

	if [ "$overall" != "healthy" ]; then
		json_add_array "recommendations"
		[ "$critical_count" -gt 0 ] && json_add_string "" "Check/replace Ethernet cables"
		[ "$critical_count" -gt 0 ] && json_add_string "" "Try different port on switch/modem"
		[ "$warning_count" -gt 0 ] && json_add_string "" "Monitor link stability"
		json_close_array
	fi

	json_dump
}

# Vital services monitoring
_do_vital_services() {
	json_init
	json_add_string "timestamp" "$(get_timestamp)"

	_check_svc() {
		local name="$1" category="$2" check_type="$3" check_value="$4" description="$5" critical="$6"
		local status="unknown" details=""

		case "$check_type" in
			process)
				if pgrep -f "$check_value" >/dev/null 2>&1; then
					status="running"
				else
					status="stopped"
				fi
				;;
			port)
				if check_port_listening "$check_value"; then
					status="running"
					details="Port $check_value listening"
				else
					status="stopped"
					details="Port $check_value not listening"
				fi
				;;
			init)
				status=$(check_init_service "$check_value")
				;;
			lxc)
				status=$(check_lxc_status "$check_value")
				;;
		esac

		json_add_object ""
		json_add_string "name" "$name"
		json_add_string "category" "$category"
		json_add_string "status" "$status"
		json_add_string "description" "$description"
		json_add_boolean "critical" "${critical:-0}"
		[ -n "$details" ] && json_add_string "details" "$details"
		json_close_object
	}

	# Core Infrastructure Services
	json_add_array "core"
	_check_svc "SSH" "remote" "port" "22" "Remote shell access" 1
	_check_svc "HTTPS Admin" "remote" "port" "8444" "LuCI admin interface" 1
	_check_svc "DNS" "network" "port" "53" "Domain name resolution" 1
	_check_svc "DHCP" "network" "process" "dnsmasq" "IP address assignment" 1
	_check_svc "Firewall" "security" "process" "fw4" "Network firewall" 1
	json_close_array

	# Security Services
	json_add_array "security"
	_check_svc "CrowdSec" "security" "process" "crowdsec" "Intrusion prevention" 1
	_check_svc "CrowdSec Bouncer" "security" "process" "crowdsec-firewall-bouncer" "Firewall bouncer" 1
	_check_svc "Tor" "privacy" "init" "tor" "Anonymous routing" 0
	json_close_array

	# Web Publishing Services
	json_add_array "publishers"
	_check_svc "HAProxy" "proxy" "lxc" "haproxy" "Load balancer & reverse proxy" 1
	_check_svc "HexoJS" "cms" "lxc" "hexojs" "Static blog generator" 0
	_check_svc "Gitea" "devops" "lxc" "gitea" "Git repository hosting" 0
	_check_svc "Streamlit" "app" "lxc" "streamlit" "Python web apps" 0
	json_close_array

	# Media & App Services
	json_add_array "apps"
	_check_svc "Lyrion" "media" "lxc" "lyrion" "Music streaming server" 0
	_check_svc "MagicMirror" "display" "lxc" "magicmirror2" "Smart mirror display" 0
	_check_svc "PicoBrew" "app" "lxc" "picobrew" "Brewing automation" 0
	json_close_array

	# Monitoring Services
	json_add_array "monitoring"
	_check_svc "Netifyd" "monitoring" "process" "netifyd" "Network intelligence" 0
	_check_svc "Syslog-ng" "logging" "process" "syslog-ng" "System logging" 1
	json_close_array

	# Calculate summary
	json_add_object "summary"
	local total=0
	for svc in /etc/init.d/*; do
		[ -x "$svc" ] || continue
		total=$((total + 1))
	done
	local lxc_running=$(lxc-ls --running 2>/dev/null | wc -w)
	local lxc_total=$(lxc-ls 2>/dev/null | wc -w)
	json_add_int "init_services" "$total"
	json_add_int "lxc_running" "${lxc_running:-0}"
	json_add_int "lxc_total" "${lxc_total:-0}"
	json_close_object

	json_dump
}

# Full health report
_do_full_health_report() {
	json_init
	json_add_string "timestamp" "$(get_timestamp)"
	json_add_string "hostname" "$(uci get system.@system[0].hostname 2>/dev/null || hostname)"

	# System info
	json_add_object "system"
	json_add_int "uptime" "$(get_uptime_seconds)"
	json_add_string "load" "$(get_load_avg)"
	local mem_pct=$(get_memory_percent)
	json_add_int "memory_percent" "$mem_pct"
	local disk_pct=$(get_disk_percent)
	json_add_int "disk_percent" "${disk_pct:-0}"
	json_close_object

	# Network Health Summary
	json_add_object "network"
	local net_overall="healthy"
	local net_issues=0
	for iface_path in /sys/class/net/eth* /sys/class/net/wan*; do
		[ -d "$iface_path" ] || continue
		[ -d "$iface_path/device" ] || continue
		local iface=$(basename "$iface_path")
		local crc=$(dmesg | tail -n 500 | grep -c "$iface.*crc error" 2>/dev/null)
		crc=${crc:-0}
		local flap=$(dmesg | tail -n 500 | grep -c "$iface: Link is" 2>/dev/null)
		flap=${flap:-0}
		if [ "$crc" -ge 10 ] || [ "$flap" -ge 10 ]; then
			net_overall="critical"
			net_issues=$((net_issues + 1))
			json_add_object "$iface"
			json_add_string "status" "critical"
			json_add_int "crc_errors" "$crc"
			json_add_int "link_changes" "$flap"
			json_close_object
		fi
	done
	json_add_string "overall" "$net_overall"
	json_add_int "issues" "$net_issues"
	json_close_object

	# Critical Services Status
	json_add_object "services"
	local svc_ok=0 svc_down=0
	for svc in sshd dropbear dnsmasq haproxy crowdsec; do
		if pgrep -x "$svc" >/dev/null 2>&1 || pgrep -f "$svc" >/dev/null 2>&1; then
			svc_ok=$((svc_ok + 1))
		else
			if [ -f "/etc/init.d/$svc" ] && /etc/init.d/$svc enabled 2>/dev/null; then
				svc_down=$((svc_down + 1))
			fi
		fi
	done
	local lxc_expected=$(lxc-ls 2>/dev/null | wc -w)
	local lxc_running=$(lxc-ls --running 2>/dev/null | wc -w)
	json_add_int "services_ok" "$svc_ok"
	json_add_int "services_down" "$svc_down"
	json_add_int "containers_running" "${lxc_running:-0}"
	json_add_int "containers_total" "${lxc_expected:-0}"
	if [ "$svc_down" -gt 0 ]; then
		json_add_string "overall" "warning"
	else
		json_add_string "overall" "healthy"
	fi
	json_close_object

	# Overall health score
	local health_score=100
	[ "$net_overall" = "critical" ] && health_score=$((health_score - 30))
	[ "$svc_down" -gt 0 ] && health_score=$((health_score - (svc_down * 10)))
	[ "$mem_pct" -gt 90 ] && health_score=$((health_score - 10))
	[ "${disk_pct:-0}" -gt 90 ] && health_score=$((health_score - 10))
	json_add_int "health_score" "$health_score"

	if [ "$health_score" -ge 80 ]; then
		json_add_string "overall_status" "healthy"
	elif [ "$health_score" -ge 50 ]; then
		json_add_string "overall_status" "warning"
	else
		json_add_string "overall_status" "critical"
	fi

	# Alerts
	json_add_array "alerts"
	[ "$net_overall" = "critical" ] && {
		json_add_object ""
		json_add_string "level" "critical"
		json_add_string "message" "Network interface issues detected - check cables"
		json_close_object
	}
	[ "$svc_down" -gt 0 ] && {
		json_add_object ""
		json_add_string "level" "warning"
		json_add_string "message" "$svc_down critical service(s) not running"
		json_close_object
	}
	[ "$mem_pct" -gt 90 ] && {
		json_add_object ""
		json_add_string "level" "warning"
		json_add_string "message" "High memory usage: ${mem_pct}%"
		json_close_object
	}
	json_close_array

	json_dump
}

# System health metrics
_do_system_health() {
	json_init

	local uptime_seconds=$(get_uptime_seconds)
	local load1=$(awk '{print $1}' /proc/loadavg)
	local cpu_count=$(grep -c ^processor /proc/cpuinfo)
	[ "$cpu_count" -le 0 ] && cpu_count=1
	local cpu_percent=$(awk -v load="$load1" -v cores="$cpu_count" 'BEGIN {printf "%.0f", (load / cores) * 100}')

	local mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
	local mem_free=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
	mem_free=${mem_free:-0}
	[ "$mem_total" -le 0 ] && mem_total=1
	local mem_used=$((mem_total - mem_free))
	local mem_percent=$(awk -v used="$mem_used" -v total="$mem_total" 'BEGIN {printf "%.0f", (used / total) * 100}')

	local disk_info=$(df / | tail -1)
	local disk_total=$(echo "$disk_info" | awk '{print $2}')
	local disk_used=$(echo "$disk_info" | awk '{print $3}')
	disk_used=${disk_used:-0}
	[ -z "$disk_total" ] || [ "$disk_total" -le 0 ] && { disk_total=0; disk_used=0; }
	local disk_free=$((disk_total - disk_used))
	local disk_percent=$(echo "$disk_info" | awk '{print $5}' | tr -d '%')
	[ -n "$disk_percent" ] || disk_percent=0

	local overall_score=$(awk -v c="$cpu_percent" -v m="$mem_percent" -v d="$disk_percent" 'BEGIN {printf "%.0f", 100 - ((c + m + d) / 3)}')

	json_add_int "uptime" "$uptime_seconds"

	local overall_status="healthy"
	[ "$overall_score" -le 70 ] && overall_status="warning"

	json_add_object "overall"
	json_add_int "score" "$overall_score"
	json_add_string "status" "$overall_status"
	json_close_object

	json_add_object "cpu"
	json_add_int "usage_percent" "$cpu_percent"
	json_add_string "load" "$(get_load_avg)"
	json_add_int "count" "$cpu_count"
	json_close_object

	json_add_object "memory"
	json_add_int "total_kb" "$mem_total"
	json_add_int "used_kb" "$mem_used"
	json_add_int "free_kb" "$mem_free"
	json_add_int "usage_percent" "$mem_percent"
	json_close_object

	json_add_object "disk"
	json_add_int "total_kb" "$disk_total"
	json_add_int "used_kb" "$disk_used"
	json_add_int "free_kb" "$disk_free"
	json_add_int "usage_percent" "$disk_percent"
	json_close_object

	json_dump
}

# Get system alerts
_do_get_alerts() {
	json_init
	json_add_array "alerts"

	local mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
	local mem_free=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
	local mem_percent=$(awk "BEGIN {printf \"%.0f\", (($mem_total - $mem_free) / $mem_total) * 100}")
	if [ "$mem_percent" -gt 90 ]; then
		json_add_object ""
		json_add_string "id" "high_memory"
		json_add_string "level" "warning"
		json_add_string "title" "High Memory Usage"
		json_add_string "message" "Memory usage is at ${mem_percent}%"
		json_add_int "timestamp" "$(date +%s)"
		json_close_object
	fi

	local disk_percent=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
	if [ "$disk_percent" -gt 85 ]; then
		json_add_object ""
		json_add_string "id" "high_disk"
		json_add_string "level" "warning"
		json_add_string "title" "High Disk Usage"
		json_add_string "message" "Disk usage is at ${disk_percent}%"
		json_add_int "timestamp" "$(date +%s)"
		json_close_object
	fi

	json_close_array
	json_dump
}
