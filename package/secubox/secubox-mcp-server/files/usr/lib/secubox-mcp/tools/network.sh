# SecuBox MCP Tool: Network Flow Statistics
# Provides traffic summary and interface statistics

tool_network_flows() {
	local args="$1"
	local iface=$(echo "$args" | jsonfilter -e '@.interface' 2>/dev/null)

	if [ -n "$iface" ]; then
		get_interface_stats "$iface"
	else
		get_all_interfaces_stats
	fi
}

get_interface_stats() {
	local iface="$1"
	local sysfs="/sys/class/net/${iface}/statistics"

	if [ ! -d "$sysfs" ]; then
		printf '{"interface":"%s","error":"Interface not found"}' "$iface"
		return 1
	fi

	local rx_bytes=$(cat "$sysfs/rx_bytes" 2>/dev/null || echo 0)
	local tx_bytes=$(cat "$sysfs/tx_bytes" 2>/dev/null || echo 0)
	local rx_packets=$(cat "$sysfs/rx_packets" 2>/dev/null || echo 0)
	local tx_packets=$(cat "$sysfs/tx_packets" 2>/dev/null || echo 0)
	local rx_errors=$(cat "$sysfs/rx_errors" 2>/dev/null || echo 0)
	local tx_errors=$(cat "$sysfs/tx_errors" 2>/dev/null || echo 0)
	local rx_dropped=$(cat "$sysfs/rx_dropped" 2>/dev/null || echo 0)
	local tx_dropped=$(cat "$sysfs/tx_dropped" 2>/dev/null || echo 0)

	# Get IP address
	local ipaddr=$(ip -4 addr show "$iface" 2>/dev/null | grep -oE 'inet [0-9.]+' | cut -d' ' -f2)

	# Get MAC address
	local mac=$(cat "/sys/class/net/${iface}/address" 2>/dev/null)

	# Get link state
	local state=$(cat "/sys/class/net/${iface}/operstate" 2>/dev/null)

	printf '{"interface":"%s","state":"%s","ip_address":"%s","mac_address":"%s","rx":{"bytes":%s,"packets":%s,"errors":%s,"dropped":%s},"tx":{"bytes":%s,"packets":%s,"errors":%s,"dropped":%s}}' \
		"$iface" "${state:-unknown}" "${ipaddr:-}" "${mac:-}" \
		"$rx_bytes" "$rx_packets" "$rx_errors" "$rx_dropped" \
		"$tx_bytes" "$tx_packets" "$tx_errors" "$tx_dropped"
}

get_all_interfaces_stats() {
	local json='{"interfaces":['
	local first=1

	# Get all network interfaces (excluding lo)
	for iface_path in /sys/class/net/*; do
		local iface=$(basename "$iface_path")
		[ "$iface" = "lo" ] && continue
		[ ! -d "$iface_path/statistics" ] && continue

		[ $first -eq 0 ] && json="${json},"
		first=0
		json="${json}$(get_interface_stats "$iface")"
	done

	json="${json}]"

	# Add total traffic summary
	local total_rx=0
	local total_tx=0

	for iface_path in /sys/class/net/*/statistics; do
		local iface=$(basename "$(dirname "$iface_path")")
		[ "$iface" = "lo" ] && continue

		local rx=$(cat "$iface_path/rx_bytes" 2>/dev/null || echo 0)
		local tx=$(cat "$iface_path/tx_bytes" 2>/dev/null || echo 0)
		total_rx=$((total_rx + rx))
		total_tx=$((total_tx + tx))
	done

	json="${json},\"total_rx_bytes\":$total_rx,\"total_tx_bytes\":$total_tx}"

	echo "$json"
}

# Get active connections
tool_network_connections() {
	local args="$1"
	local limit=$(echo "$args" | jsonfilter -e '@.limit' 2>/dev/null)
	[ -z "$limit" ] && limit=100

	# Get connections from conntrack
	if [ -f /proc/net/nf_conntrack ]; then
		local conns='['
		local first=1
		local count=0

		while IFS= read -r line && [ $count -lt $limit ]; do
			# Parse conntrack entry
			local proto=$(echo "$line" | grep -oE '^[a-z]+' | head -1)
			local src=$(echo "$line" | grep -oE 'src=[0-9.]+' | head -1 | cut -d= -f2)
			local dst=$(echo "$line" | grep -oE 'dst=[0-9.]+' | head -1 | cut -d= -f2)
			local sport=$(echo "$line" | grep -oE 'sport=[0-9]+' | head -1 | cut -d= -f2)
			local dport=$(echo "$line" | grep -oE 'dport=[0-9]+' | head -1 | cut -d= -f2)

			[ -z "$src" ] && continue

			[ $first -eq 0 ] && conns="${conns},"
			first=0
			conns="${conns}{\"proto\":\"$proto\",\"src\":\"$src\",\"dst\":\"$dst\",\"sport\":${sport:-0},\"dport\":${dport:-0}}"
			count=$((count + 1))
		done < /proc/net/nf_conntrack

		conns="${conns}]"
		printf '{"connections":%s,"count":%d}' "$conns" "$count"
	else
		echo '{"connections":[],"count":0,"error":"Conntrack not available"}'
	fi
}
