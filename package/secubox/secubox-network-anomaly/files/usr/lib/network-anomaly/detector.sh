#!/bin/sh
# Network Anomaly Detection Library

STATE_DIR="/var/lib/network-anomaly"
BASELINE_FILE="$STATE_DIR/baseline.json"
ALERTS_FILE="$STATE_DIR/alerts.json"

# Initialize state directory
init_state() {
	mkdir -p "$STATE_DIR"
	[ -f "$ALERTS_FILE" ] || echo '[]' > "$ALERTS_FILE"
}

# Get current network stats
collect_stats() {
	local stats="{}"

	# Interface bandwidth (bytes)
	local rx_bytes=0 tx_bytes=0
	for iface in $(ls /sys/class/net/ 2>/dev/null | grep -v lo); do
		local rx=$(cat /sys/class/net/$iface/statistics/rx_bytes 2>/dev/null || echo 0)
		local tx=$(cat /sys/class/net/$iface/statistics/tx_bytes 2>/dev/null || echo 0)
		rx_bytes=$((rx_bytes + rx))
		tx_bytes=$((tx_bytes + tx))
	done

	# Connection counts from conntrack
	local total_conn=0 new_conn=0 established=0
	if [ -f /proc/net/nf_conntrack ]; then
		total_conn=$(wc -l < /proc/net/nf_conntrack)
		new_conn=$(grep -c "TIME_WAIT\|SYN_SENT" /proc/net/nf_conntrack 2>/dev/null || echo 0)
		established=$(grep -c "ESTABLISHED" /proc/net/nf_conntrack 2>/dev/null || echo 0)
	fi

	# Unique destination ports
	local unique_ports=0
	if [ -f /proc/net/nf_conntrack ]; then
		unique_ports=$(awk -F'[ =]' '/dport/ {print $NF}' /proc/net/nf_conntrack 2>/dev/null | sort -u | wc -l)
	fi

	# DNS queries (from dnsmasq log or AdGuard)
	local dns_queries=0
	if [ -f /var/log/dnsmasq.log ]; then
		dns_queries=$(grep -c "query\[" /var/log/dnsmasq.log 2>/dev/null || echo 0)
	fi

	# Failed connections
	local failed_conn=0
	if [ -f /proc/net/nf_conntrack ]; then
		failed_conn=$(grep -c "UNREPLIED" /proc/net/nf_conntrack 2>/dev/null || echo 0)
	fi

	# Protocol distribution
	local tcp_conn=$(grep -c "tcp" /proc/net/nf_conntrack 2>/dev/null || echo 0)
	local udp_conn=$(grep -c "udp" /proc/net/nf_conntrack 2>/dev/null || echo 0)

	# Output JSON
	cat <<EOF
{
	"timestamp": "$(date -Iseconds)",
	"rx_bytes": $rx_bytes,
	"tx_bytes": $tx_bytes,
	"total_connections": $total_conn,
	"new_connections": $new_conn,
	"established": $established,
	"unique_ports": $unique_ports,
	"dns_queries": $dns_queries,
	"failed_connections": $failed_conn,
	"tcp_connections": $tcp_conn,
	"udp_connections": $udp_conn
}
EOF
}

# Update baseline with exponential moving average
update_baseline() {
	local current_stats="$1"
	local alpha=0.1  # EMA smoothing factor

	if [ ! -f "$BASELINE_FILE" ]; then
		echo "$current_stats" > "$BASELINE_FILE"
		return
	fi

	# For simplicity, just keep rolling average in a file
	# Real implementation would use proper EMA calculation
	echo "$current_stats" > "$STATE_DIR/current.json"
}

# Detect bandwidth anomaly
detect_bandwidth_anomaly() {
	local current="$1"
	local threshold="$2"

	[ ! -f "$BASELINE_FILE" ] && return 1

	local baseline_rx=$(jsonfilter -i "$BASELINE_FILE" -e '@.rx_bytes' 2>/dev/null || echo 0)
	local current_rx=$(echo "$current" | jsonfilter -e '@.rx_bytes' 2>/dev/null || echo 0)

	[ "$baseline_rx" -eq 0 ] && return 1

	local ratio=$((current_rx * 100 / baseline_rx))
	[ "$ratio" -gt "$threshold" ] && return 0
	return 1
}

# Detect connection flood
detect_connection_flood() {
	local current="$1"
	local threshold="$2"

	local new_conn=$(echo "$current" | jsonfilter -e '@.new_connections' 2>/dev/null || echo 0)
	[ "$new_conn" -gt "$threshold" ] && return 0
	return 1
}

# Detect port scan (many unique ports to single host)
detect_port_scan() {
	local current="$1"
	local threshold="$2"

	local unique_ports=$(echo "$current" | jsonfilter -e '@.unique_ports' 2>/dev/null || echo 0)
	[ "$unique_ports" -gt "$threshold" ] && return 0
	return 1
}

# Detect DNS anomaly
detect_dns_anomaly() {
	local current="$1"
	local threshold="$2"

	local dns_queries=$(echo "$current" | jsonfilter -e '@.dns_queries' 2>/dev/null || echo 0)
	[ "$dns_queries" -gt "$threshold" ] && return 0
	return 1
}

# Detect protocol anomaly (unusual TCP/UDP ratio)
detect_protocol_anomaly() {
	local current="$1"

	local tcp=$(echo "$current" | jsonfilter -e '@.tcp_connections' 2>/dev/null || echo 0)
	local udp=$(echo "$current" | jsonfilter -e '@.udp_connections' 2>/dev/null || echo 0)
	local total=$((tcp + udp))

	[ "$total" -eq 0 ] && return 1

	# Normal ratio is roughly 80% TCP, 20% UDP
	# Flag if UDP is more than 50%
	local udp_percent=$((udp * 100 / total))
	[ "$udp_percent" -gt 50 ] && return 0
	return 1
}

# Add alert
add_alert() {
	local type="$1"
	local severity="$2"
	local message="$3"
	local details="$4"

	local alert=$(cat <<EOF
{
	"id": "$(head -c 8 /dev/urandom | md5sum | head -c 16)",
	"type": "$type",
	"severity": "$severity",
	"message": "$message",
	"details": $details,
	"timestamp": "$(date -Iseconds)",
	"acknowledged": false
}
EOF
)

	# Append to alerts file (keep last 100)
	local alerts=$(cat "$ALERTS_FILE" 2>/dev/null || echo '[]')
	echo "$alerts" | jsonfilter -e '@[0:99]' 2>/dev/null > "$ALERTS_FILE.tmp" || echo '[]' > "$ALERTS_FILE.tmp"

	# Prepend new alert
	echo "[$alert," > "$ALERTS_FILE.new"
	tail -c +2 "$ALERTS_FILE.tmp" >> "$ALERTS_FILE.new"
	mv "$ALERTS_FILE.new" "$ALERTS_FILE"
	rm -f "$ALERTS_FILE.tmp"

	logger -t network-anomaly "[$severity] $type: $message"
}

# Run all detectors
run_detection() {
	local stats=$(collect_stats)
	local alerts_found=0

	# Load thresholds
	local bw_threshold=$(uci -q get network-anomaly.thresholds.bandwidth_spike_percent || echo 200)
	local conn_threshold=$(uci -q get network-anomaly.thresholds.new_connections_per_min || echo 50)
	local port_threshold=$(uci -q get network-anomaly.thresholds.unique_ports_per_host || echo 20)
	local dns_threshold=$(uci -q get network-anomaly.thresholds.dns_queries_per_min || echo 100)

	# Load detection flags
	local detect_bw=$(uci -q get network-anomaly.detection.bandwidth_anomaly || echo 1)
	local detect_conn=$(uci -q get network-anomaly.detection.connection_flood || echo 1)
	local detect_port=$(uci -q get network-anomaly.detection.port_scan || echo 1)
	local detect_dns=$(uci -q get network-anomaly.detection.dns_anomaly || echo 1)
	local detect_proto=$(uci -q get network-anomaly.detection.protocol_anomaly || echo 1)

	# Run detectors
	if [ "$detect_bw" = "1" ] && detect_bandwidth_anomaly "$stats" "$bw_threshold"; then
		add_alert "bandwidth_spike" "high" "Unusual bandwidth spike detected" "$stats"
		alerts_found=$((alerts_found + 1))
	fi

	if [ "$detect_conn" = "1" ] && detect_connection_flood "$stats" "$conn_threshold"; then
		add_alert "connection_flood" "high" "Connection flood detected" "$stats"
		alerts_found=$((alerts_found + 1))
	fi

	if [ "$detect_port" = "1" ] && detect_port_scan "$stats" "$port_threshold"; then
		add_alert "port_scan" "medium" "Possible port scan activity" "$stats"
		alerts_found=$((alerts_found + 1))
	fi

	if [ "$detect_dns" = "1" ] && detect_dns_anomaly "$stats" "$dns_threshold"; then
		add_alert "dns_anomaly" "medium" "Unusual DNS query volume" "$stats"
		alerts_found=$((alerts_found + 1))
	fi

	if [ "$detect_proto" = "1" ] && detect_protocol_anomaly "$stats"; then
		add_alert "protocol_anomaly" "low" "Unusual protocol distribution" "$stats"
		alerts_found=$((alerts_found + 1))
	fi

	# Update baseline
	update_baseline "$stats"

	echo "$alerts_found"
}
