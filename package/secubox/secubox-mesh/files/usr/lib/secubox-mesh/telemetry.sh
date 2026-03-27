#!/bin/sh
# SecuBox Mesh Telemetry Collection
# Collects system metrics for mesh sharing
# CyberMind — SecuBox — 2026

TELEMETRY_FILE="/var/lib/secubox-mesh/telemetry.json"

# Initialize telemetry
telemetry_init() {
    mkdir -p "$(dirname "$TELEMETRY_FILE")"
}

# Get CPU usage percentage
_get_cpu_percent() {
    local idle total
    local cpu_line

    cpu_line=$(head -1 /proc/stat)
    set -- $cpu_line

    shift  # Remove "cpu" prefix
    local user=$1 nice=$2 system=$3 idle_val=$4 iowait=$5

    total=$((user + nice + system + idle_val + iowait))
    idle=$idle_val

    # Calculate percentage (non-idle)
    if [ "$total" -gt 0 ]; then
        echo $(( (total - idle) * 100 / total ))
    else
        echo 0
    fi
}

# Get memory usage percentage
_get_memory_percent() {
    local total free buffers cached available
    local meminfo="/proc/meminfo"

    total=$(grep "^MemTotal:" "$meminfo" | awk '{print $2}')
    free=$(grep "^MemFree:" "$meminfo" | awk '{print $2}')
    buffers=$(grep "^Buffers:" "$meminfo" | awk '{print $2}')
    cached=$(grep "^Cached:" "$meminfo" | awk '{print $2}')
    available=$(grep "^MemAvailable:" "$meminfo" | awk '{print $2}')

    if [ -n "$available" ] && [ "$total" -gt 0 ]; then
        echo $(( (total - available) * 100 / total ))
    elif [ "$total" -gt 0 ]; then
        local used=$((total - free - buffers - cached))
        echo $(( used * 100 / total ))
    else
        echo 0
    fi
}

# Get disk usage percentage
_get_disk_percent() {
    local mount="${1:-/}"
    df "$mount" 2>/dev/null | tail -1 | awk '{print int($5)}'
}

# Get load average
_get_load_avg() {
    cut -d' ' -f1 /proc/loadavg
}

# Get uptime in seconds
_get_uptime() {
    cut -d. -f1 /proc/uptime
}

# Get network interface stats
_get_network_stats() {
    local interface="${1:-br-lan}"
    local rx_bytes tx_bytes

    rx_bytes=$(cat "/sys/class/net/$interface/statistics/rx_bytes" 2>/dev/null || echo 0)
    tx_bytes=$(cat "/sys/class/net/$interface/statistics/tx_bytes" 2>/dev/null || echo 0)

    echo "{\"rx_bytes\":$rx_bytes,\"tx_bytes\":$tx_bytes}"
}

# Get temperature (if available)
_get_temperature() {
    local temp=""

    # Try thermal zone
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null)
        [ -n "$temp" ] && temp=$((temp / 1000))
    fi

    # Try hwmon
    if [ -z "$temp" ] && [ -d /sys/class/hwmon ]; then
        for hwmon in /sys/class/hwmon/hwmon*/temp1_input; do
            [ -f "$hwmon" ] || continue
            temp=$(cat "$hwmon" 2>/dev/null)
            [ -n "$temp" ] && temp=$((temp / 1000))
            break
        done
    fi

    echo "${temp:-0}"
}

# Get WireGuard interface stats
_get_wireguard_stats() {
    local interface="${1:-wg0}"
    local peer_count=0
    local rx_total=0
    local tx_total=0

    if command -v wg >/dev/null 2>&1; then
        local stats
        stats=$(wg show "$interface" transfer 2>/dev/null)

        while read -r pubkey rx tx; do
            [ -z "$pubkey" ] && continue
            peer_count=$((peer_count + 1))
            rx_total=$((rx_total + rx))
            tx_total=$((tx_total + tx))
        done <<EOF
$stats
EOF
    fi

    echo "{\"peers\":$peer_count,\"rx_bytes\":$rx_total,\"tx_bytes\":$tx_total}"
}

# Get connection count
_get_connection_count() {
    local tcp udp

    if [ -f /proc/net/tcp ]; then
        tcp=$(( $(wc -l < /proc/net/tcp) - 1 ))
    else
        tcp=0
    fi

    if [ -f /proc/net/udp ]; then
        udp=$(( $(wc -l < /proc/net/udp) - 1 ))
    else
        udp=0
    fi

    echo "{\"tcp\":$tcp,\"udp\":$udp}"
}

# Collect all telemetry
telemetry_collect() {
    local timestamp cpu_percent memory_percent disk_percent
    local load_avg uptime_seconds temperature
    local network_stats wg_stats conn_stats

    timestamp=$(date -Iseconds)
    cpu_percent=$(_get_cpu_percent)
    memory_percent=$(_get_memory_percent)
    disk_percent=$(_get_disk_percent)
    load_avg=$(_get_load_avg)
    uptime_seconds=$(_get_uptime)
    temperature=$(_get_temperature)
    network_stats=$(_get_network_stats)
    wg_stats=$(_get_wireguard_stats)
    conn_stats=$(_get_connection_count)

    cat <<EOF
{
  "timestamp": "$timestamp",
  "cpu_percent": $cpu_percent,
  "memory_percent": $memory_percent,
  "disk_percent": $disk_percent,
  "load_avg": $load_avg,
  "uptime": $uptime_seconds,
  "temperature": $temperature,
  "network": $network_stats,
  "wireguard": $wg_stats,
  "connections": $conn_stats
}
EOF
}

# Store telemetry
telemetry_store() {
    telemetry_collect > "$TELEMETRY_FILE"
}

# Get latest telemetry
telemetry_get() {
    if [ -f "$TELEMETRY_FILE" ]; then
        cat "$TELEMETRY_FILE"
    else
        telemetry_collect
    fi
}

# Initialize on source
telemetry_init
