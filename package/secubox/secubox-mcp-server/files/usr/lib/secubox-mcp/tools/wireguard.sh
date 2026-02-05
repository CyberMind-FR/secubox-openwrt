# SecuBox MCP Tool: WireGuard Status
# Provides VPN tunnel status for all WireGuard interfaces

tool_wireguard_status() {
	local args="$1"
	local iface=$(echo "$args" | jsonfilter -e '@.interface' 2>/dev/null)

	# Check if wg command is available
	if ! command -v wg >/dev/null 2>&1; then
		echo '{"error":"WireGuard tools not installed"}'
		return 1
	fi

	if [ -n "$iface" ]; then
		# Single interface
		get_wg_interface_json "$iface"
	else
		# All interfaces
		local interfaces=$(wg show interfaces 2>/dev/null)
		if [ -z "$interfaces" ]; then
			echo '{"interfaces":[]}'
			return 0
		fi

		local json='{"interfaces":['
		local first=1

		for iface in $interfaces; do
			[ $first -eq 0 ] && json="${json},"
			first=0
			json="${json}$(get_wg_interface_json "$iface")"
		done

		json="${json}]}"
		echo "$json"
	fi
}

get_wg_interface_json() {
	local iface="$1"

	# Get interface info
	local pubkey=$(wg show "$iface" public-key 2>/dev/null)
	local port=$(wg show "$iface" listen-port 2>/dev/null)
	local peers_raw=$(wg show "$iface" peers 2>/dev/null)
	local peer_count=$(echo "$peers_raw" | grep -c . 2>/dev/null || echo 0)

	# Traffic stats from sysfs
	local rx_bytes=0
	local tx_bytes=0
	if [ -f "/sys/class/net/${iface}/statistics/rx_bytes" ]; then
		rx_bytes=$(cat "/sys/class/net/${iface}/statistics/rx_bytes")
		tx_bytes=$(cat "/sys/class/net/${iface}/statistics/tx_bytes")
	fi

	# Get peer details
	local peers_json='['
	local first=1

	if [ -n "$peers_raw" ]; then
		for peer_pubkey in $peers_raw; do
			[ $first -eq 0 ] && peers_json="${peers_json},"
			first=0

			local endpoint=$(wg show "$iface" endpoints 2>/dev/null | grep "^$peer_pubkey" | cut -f2)
			local latest_handshake=$(wg show "$iface" latest-handshakes 2>/dev/null | grep "^$peer_pubkey" | cut -f2)
			local transfer=$(wg show "$iface" transfer 2>/dev/null | grep "^$peer_pubkey")
			local peer_rx=$(echo "$transfer" | awk '{print $2}')
			local peer_tx=$(echo "$transfer" | awk '{print $3}')

			# Calculate if peer is active (handshake within last 3 minutes)
			local active="false"
			local now=$(date +%s)
			if [ -n "$latest_handshake" ] && [ "$latest_handshake" != "0" ]; then
				local age=$((now - latest_handshake))
				[ $age -lt 180 ] && active="true"
			fi

			peers_json="${peers_json}{\"public_key\":\"${peer_pubkey}\",\"endpoint\":\"${endpoint:-null}\",\"latest_handshake\":${latest_handshake:-0},\"active\":${active},\"rx_bytes\":${peer_rx:-0},\"tx_bytes\":${peer_tx:-0}}"
		done
	fi

	peers_json="${peers_json}]"

	printf '{"interface":"%s","public_key":"%s","listen_port":%s,"peer_count":%d,"rx_bytes":%s,"tx_bytes":%s,"peers":%s}' \
		"$iface" "$pubkey" "${port:-0}" "$peer_count" "$rx_bytes" "$tx_bytes" "$peers_json"
}
