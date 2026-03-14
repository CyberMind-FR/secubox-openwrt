#!/bin/sh
# System Hardware & Performance Data Collector (OpenWrt/BusyBox compatible)

# Get CPU usage percentage
get_cpu_usage() {
    # Use /proc/stat for more reliable reading
    read cpu user nice system idle rest < /proc/stat
    local total=$((user + nice + system + idle))
    local used=$((user + nice + system))
    [ "$total" -gt 0 ] && echo $((used * 100 / total)) || echo "0"
}

# Get memory usage (returns "used total")
get_memory_info() {
    local total=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
    local available=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
    [ -z "$available" ] && available=$(awk '/MemFree/{print int($2/1024)}' /proc/meminfo)
    local used=$((total - available))
    echo "$used $total"
}

# Get disk usage (returns "used total pct")
get_disk_info() {
    df / 2>/dev/null | awk 'NR==2{
        gsub(/[GMK%]/, "", $3); gsub(/[GMK%]/, "", $2); gsub(/%/, "", $5);
        print $3, $2, $5
    }'
}

# Get CPU temperature
get_temperature() {
    local temp=0
    # Try thermal zones
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo 0)
        [ "$temp" -gt 1000 ] && temp=$((temp / 1000))
    fi
    echo "$temp"
}

# Get CPU frequency
get_cpu_freq() {
    local freq=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null || echo 0)
    [ "$freq" -gt 0 ] && echo "$((freq / 1000)) MHz" || echo "N/A"
}

# Get CPU model
get_cpu_model() {
    grep -m1 "model name\|Hardware" /proc/cpuinfo 2>/dev/null | cut -d: -f2 | sed 's/^ //' | head -1 || echo "ARM Processor"
}

# Get CPU cores
get_cpu_cores() {
    grep -c "^processor" /proc/cpuinfo 2>/dev/null || echo "1"
}

# Get device model
get_device_model() {
    cat /tmp/sysinfo/model 2>/dev/null || echo "SecuBox Appliance"
}

# Get board name
get_board_name() {
    cat /tmp/sysinfo/board_name 2>/dev/null || uci -q get system.@system[0].hostname || echo "secubox"
}

# Get OpenWrt version
get_openwrt_version() {
    . /etc/openwrt_release 2>/dev/null
    echo "${DISTRIB_RELEASE:-Unknown}"
}

# Get kernel version
get_kernel_version() {
    uname -r
}

# Get architecture
get_architecture() {
    uname -m
}

# Get uptime formatted
get_uptime_formatted() {
    local uptime_sec=$(cut -d. -f1 /proc/uptime)
    local days=$((uptime_sec / 86400))
    local hours=$(( (uptime_sec % 86400) / 3600 ))
    local mins=$(( (uptime_sec % 3600) / 60 ))

    if [ "$days" -gt 0 ]; then
        echo "${days}d ${hours}h"
    else
        echo "${hours}h ${mins}m"
    fi
}

# Get load average
get_load_average() {
    cut -d' ' -f1-3 /proc/loadavg
}

# Get process count
get_process_count() {
    ps 2>/dev/null | wc -l
}

# Get top processes (simplified for OpenWrt)
get_top_processes() {
    ps w 2>/dev/null | head -11 | tail -10 | while read pid user vsz stat cmd; do
        [ -z "$pid" ] && continue
        local cpu_pct="0"
        local mem_pct="0"
        local cmd_short=$(echo "$cmd" | cut -c1-30)

        cat << PROCEOF
<tr>
  <td>$cmd_short</td>
  <td>$pid</td>
  <td><div class="process-bar"><div class="process-fill" style="width:5%"></div></div></td>
  <td>-</td>
  <td>$stat</td>
</tr>
PROCEOF
    done
}

# Get network interfaces stats
get_network_stats() {
    for iface in $(ls /sys/class/net/ 2>/dev/null | grep -v lo); do
        local rx=$(cat /sys/class/net/$iface/statistics/rx_bytes 2>/dev/null || echo 0)
        local tx=$(cat /sys/class/net/$iface/statistics/tx_bytes 2>/dev/null || echo 0)
        local state=$(cat /sys/class/net/$iface/operstate 2>/dev/null || echo "unknown")

        # Convert to MB
        local rx_mb=$((rx / 1048576))
        local tx_mb=$((tx / 1048576))

        cat << NETEOF
<div class="info-item">
  <div class="info-label">$iface ($state)</div>
  <div class="info-value">RX: ${rx_mb}MB / TX: ${tx_mb}MB</div>
</div>
NETEOF
    done
}

# Estimate power consumption
estimate_power_watts() {
    local cpu_pct=${1:-50}
    # Conservative estimate for ARM appliance: 5-15W range
    local base=5
    local max=15
    echo $((base + (max - base) * cpu_pct / 100))
}

# Generate CPU histogram (simulated)
generate_cpu_histogram() {
    local i=1
    while [ $i -le 24 ]; do
        local height=$((20 + (i * 3) % 60))
        echo "<div class=\"histogram-bar\" style=\"height:${height}%\"></div>"
        i=$((i + 1))
    done
}

# Generate health recommendations
generate_recommendations() {
    local cpu_pct=${1:-0}
    local mem_pct=${2:-0}
    local disk_pct=${3:-0}
    local temp=${4:-0}

    # CPU check
    if [ "$cpu_pct" -gt 80 ]; then
        echo '<li class="rec-item crit"><span class="rec-icon">⚠️</span><div class="rec-content"><div class="rec-title">High CPU Usage</div><div class="rec-desc">CPU usage is elevated. Consider optimizing running processes.</div></div></li>'
    else
        echo '<li class="rec-item ok"><span class="rec-icon">✅</span><div class="rec-content"><div class="rec-title">CPU Health Good</div><div class="rec-desc">CPU usage is within normal parameters.</div></div></li>'
    fi

    # Memory check
    if [ "$mem_pct" -gt 85 ]; then
        echo '<li class="rec-item warn"><span class="rec-icon">🧠</span><div class="rec-content"><div class="rec-title">High Memory Usage</div><div class="rec-desc">Memory usage is high. Consider restarting services.</div></div></li>'
    else
        echo '<li class="rec-item ok"><span class="rec-icon">✅</span><div class="rec-content"><div class="rec-title">Memory Health Good</div><div class="rec-desc">Memory usage is healthy.</div></div></li>'
    fi

    # Disk check
    if [ "$disk_pct" -gt 80 ]; then
        echo '<li class="rec-item warn"><span class="rec-icon">💾</span><div class="rec-content"><div class="rec-title">Disk Space Low</div><div class="rec-desc">Consider cleaning old logs and reports.</div></div></li>'
    else
        echo '<li class="rec-item ok"><span class="rec-icon">✅</span><div class="rec-content"><div class="rec-title">Disk Space Adequate</div><div class="rec-desc">Sufficient disk space available.</div></div></li>'
    fi

    # Eco tip
    echo '<li class="rec-item"><span class="rec-icon">🌱</span><div class="rec-content"><div class="rec-title">Energy Efficiency</div><div class="rec-desc">Your SecuBox uses low-power ARM architecture for minimal environmental impact.</div></div></li>'
}

# Get debug log
get_debug_log() {
    logread 2>/dev/null | tail -30 | while read line; do
        local level="level-info"
        case "$line" in
            *error*|*Error*|*fail*) level="level-err" ;;
            *warn*|*Warn*) level="level-warn" ;;
        esac
        echo "<div class=\"line\"><span class=\"$level\">$line</span></div>"
    done
}

# Get status class
get_status_class() {
    local pct=${1:-0}
    local type=${2:-usage}

    if [ "$type" = "temp" ]; then
        [ "$pct" -gt 70 ] && echo "crit" && return
        [ "$pct" -gt 55 ] && echo "warn" && return
    else
        [ "$pct" -gt 85 ] && echo "crit" && return
        [ "$pct" -gt 70 ] && echo "warn" && return
    fi
    echo ""
}
