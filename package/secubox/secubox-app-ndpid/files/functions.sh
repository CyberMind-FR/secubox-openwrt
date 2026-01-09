#!/bin/sh
# nDPId shared functions for SecuBox
# Copyright (C) 2025 CyberMind.fr

# Paths
NDPID_RUNTIME_DIR="/var/run/ndpid"
NDPID_COLLECTOR_SOCK="${NDPID_RUNTIME_DIR}/collector.sock"
NDPID_DISTRIBUTOR_SOCK="${NDPID_RUNTIME_DIR}/distributor.sock"
NDPID_COMPAT_STATUS="/var/run/netifyd/status.json"
NDPID_FLOWS_FILE="/tmp/ndpid-flows.json"
NDPID_STATS_FILE="/tmp/ndpid-stats.json"

# Check if nDPId is running
ndpid_running() {
	pidof ndpid >/dev/null 2>&1
}

# Check if nDPIsrvd is running
ndpisrvd_running() {
	pidof ndpisrvd >/dev/null 2>&1
}

# Get nDPId version
ndpid_version() {
	ndpid -v 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?'
}

# Format bytes to human readable
format_bytes() {
	local bytes="${1:-0}"
	if [ "$bytes" -ge 1073741824 ]; then
		echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1073741824}") GB"
	elif [ "$bytes" -ge 1048576 ]; then
		echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1048576}") MB"
	elif [ "$bytes" -ge 1024 ]; then
		echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1024}") KB"
	else
		echo "${bytes} B"
	fi
}

# Parse nDPId JSON event (strip 5-digit length prefix)
parse_ndpid_event() {
	local raw="$1"
	echo "${raw:5}"
}

# Extract application name from nDPI proto string
# e.g., "TLS.Google" -> "google", "QUIC.YouTube" -> "youtube"
normalize_app_name() {
	local proto="$1"
	echo "$proto" | tr '.' '\n' | tail -1 | tr '[:upper:]' '[:lower:]'
}

# Get list of network interfaces suitable for monitoring
get_monitor_interfaces() {
	local ifaces=""
	# Get bridge interfaces
	for br in $(ls /sys/class/net/ 2>/dev/null | grep -E '^br-'); do
		ifaces="$ifaces $br"
	done
	# Get ethernet interfaces if no bridges
	if [ -z "$ifaces" ]; then
		for eth in $(ls /sys/class/net/ 2>/dev/null | grep -E '^eth[0-9]'); do
			ifaces="$ifaces $eth"
		done
	fi
	echo "$ifaces" | xargs
}

# Create ipsets for flow actions
create_action_ipsets() {
	# BitTorrent tracking
	ipset list secubox-bittorrent >/dev/null 2>&1 || \
		ipset create secubox-bittorrent hash:ip timeout 900 2>/dev/null

	# Streaming services tracking
	ipset list secubox-streaming >/dev/null 2>&1 || \
		ipset create secubox-streaming hash:ip timeout 1800 2>/dev/null

	# Blocked IPs
	ipset list secubox-blocked >/dev/null 2>&1 || \
		ipset create secubox-blocked hash:ip timeout 3600 2>/dev/null
}

# Add IP to ipset with timeout
add_to_ipset() {
	local ipset_name="$1"
	local ip="$2"
	local timeout="${3:-900}"
	ipset add "$ipset_name" "$ip" timeout "$timeout" 2>/dev/null
}

# Log message
ndpid_log() {
	local level="${1:-INFO}"
	shift
	logger -t ndpid "[$level] $*"
}
