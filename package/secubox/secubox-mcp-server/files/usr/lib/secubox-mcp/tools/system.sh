# SecuBox MCP Tool: System Metrics
# Provides CPU, memory, disk, temperature, and uptime data

tool_system_metrics() {
	local uptime_sec=$(cut -d' ' -f1 /proc/uptime)
	local uptime_int=${uptime_sec%.*}

	# Memory info
	local mem_total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
	local mem_free=$(awk '/MemFree/ {print $2}' /proc/meminfo)
	local mem_available=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
	local mem_buffers=$(awk '/Buffers/ {print $2}' /proc/meminfo)
	local mem_cached=$(awk '/^Cached/ {print $2}' /proc/meminfo)

	# Calculate used percentage
	local mem_used=$((mem_total - mem_available))
	local mem_pct=$((mem_used * 100 / mem_total))

	# Load average
	local load=$(cut -d' ' -f1-3 /proc/loadavg)
	local load_1m=$(echo "$load" | cut -d' ' -f1)
	local load_5m=$(echo "$load" | cut -d' ' -f2)
	local load_15m=$(echo "$load" | cut -d' ' -f3)

	# CPU info
	local cpu_cores=$(grep -c ^processor /proc/cpuinfo)

	# Temperature (if available)
	local temp="null"
	if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
		local temp_raw=$(cat /sys/class/thermal/thermal_zone0/temp)
		temp=$((temp_raw / 1000))
	fi

	# Disk usage for root and /srv
	local disk_root_total=$(df / 2>/dev/null | awk 'NR==2 {print $2}')
	local disk_root_used=$(df / 2>/dev/null | awk 'NR==2 {print $3}')
	local disk_root_pct=$(df / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}')

	local disk_srv_total="null"
	local disk_srv_used="null"
	local disk_srv_pct="null"
	if mountpoint -q /srv 2>/dev/null; then
		disk_srv_total=$(df /srv 2>/dev/null | awk 'NR==2 {print $2}')
		disk_srv_used=$(df /srv 2>/dev/null | awk 'NR==2 {print $3}')
		disk_srv_pct=$(df /srv 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}')
	fi

	# Hostname and model
	local hostname=$(cat /proc/sys/kernel/hostname)
	local model=$(cat /tmp/sysinfo/model 2>/dev/null || echo "Unknown")

	cat <<EOF
{"uptime_seconds":$uptime_int,"hostname":"$hostname","model":"$(json_escape "$model")","cpu":{"cores":$cpu_cores,"load_1m":$load_1m,"load_5m":$load_5m,"load_15m":$load_15m},"memory":{"total_kb":$mem_total,"free_kb":$mem_free,"available_kb":${mem_available:-$mem_free},"used_percent":$mem_pct},"disk":{"root":{"total_kb":${disk_root_total:-0},"used_kb":${disk_root_used:-0},"used_percent":${disk_root_pct:-0}},"srv":{"total_kb":${disk_srv_total},"used_kb":${disk_srv_used},"used_percent":${disk_srv_pct}}},"temperature_c":$temp}
EOF
}
