#!/bin/sh
# SecuBox TFTP Mesh Library
# Shared functions for mesh-based TFTP recovery

TFTP_ROOT="/srv/tftp"
RECOVERY_DIR="/srv/secubox/recovery"
MESH_RECOVERY_PORT=7331

# Get best recovery server from mesh
get_best_recovery_server() {
	local board="$1"
	local peers_file="/tmp/secubox-p2p-peers.json"
	local best_server=""
	local best_latency=9999

	[ -f "$peers_file" ] || return 1

	local peer_count=$(jsonfilter -i "$peers_file" -e '@.peers[*]' 2>/dev/null | wc -l)
	local i=0

	while [ $i -lt $peer_count ]; do
		local peer_addr=$(jsonfilter -i "$peers_file" -e "@.peers[$i].address" 2>/dev/null)
		local is_local=$(jsonfilter -i "$peers_file" -e "@.peers[$i].is_local" 2>/dev/null)

		[ "$is_local" = "true" ] && { i=$((i + 1)); continue; }
		[ -z "$peer_addr" ] && { i=$((i + 1)); continue; }

		# Check if peer has recovery service
		local start_time=$(date +%s%N 2>/dev/null || date +%s)
		local manifest=$(wget -q -T 2 -O - "http://$peer_addr:$MESH_RECOVERY_PORT/tftp/recovery-manifest.json" 2>/dev/null)
		local end_time=$(date +%s%N 2>/dev/null || date +%s)

		if [ -n "$manifest" ]; then
			# Check board compatibility if specified
			if [ -n "$board" ]; then
				local peer_board=$(echo "$manifest" | jsonfilter -e '@.board' 2>/dev/null)
				[ "$peer_board" != "$board" ] && { i=$((i + 1)); continue; }
			fi

			# Calculate latency
			local latency=$((end_time - start_time))
			if [ $latency -lt $best_latency ]; then
				best_latency=$latency
				best_server="$peer_addr"
			fi
		fi

		i=$((i + 1))
	done

	echo "$best_server"
}

# Sync recovery images from mesh
sync_recovery_from_mesh() {
	local peer_addr=$(get_best_recovery_server)

	if [ -z "$peer_addr" ]; then
		echo "No recovery servers available on mesh"
		return 1
	fi

	echo "Syncing recovery images from $peer_addr..."

	mkdir -p "$TFTP_ROOT"

	# Get manifest
	local manifest=$(wget -q -O - "http://$peer_addr:$MESH_RECOVERY_PORT/tftp/recovery-manifest.json")
	if [ -z "$manifest" ]; then
		echo "Failed to fetch manifest"
		return 1
	fi

	# Download each image
	echo "$manifest" | jsonfilter -e '@.images[*].name' 2>/dev/null | while read img; do
		if [ ! -f "$TFTP_ROOT/$img" ]; then
			echo "  Downloading: $img"
			wget -q -O "$TFTP_ROOT/$img" "http://$peer_addr:$MESH_RECOVERY_PORT/tftp/$img"
		fi
	done

	# Download U-Boot scripts
	echo "$manifest" | jsonfilter -e '@.uboot_scripts[*]' 2>/dev/null | while read scr; do
		if [ ! -f "$TFTP_ROOT/$scr" ]; then
			echo "  Downloading: $scr"
			wget -q -O "$TFTP_ROOT/$scr" "http://$peer_addr:$MESH_RECOVERY_PORT/tftp/$scr"
		fi
	done

	echo "Recovery sync complete"
}

# Broadcast recovery availability to mesh
broadcast_recovery_service() {
	local node_id=$(cat /var/run/secubox-p2p/node.id 2>/dev/null || hostname)
	local lan_ip=$(uci -q get network.lan.ipaddr || echo "192.168.1.1")

	# Create service announcement for P2P
	cat > /tmp/secubox-recovery-service.json << EOF
{
	"name": "tftp-recovery",
	"type": "recovery",
	"port": 69,
	"address": "$lan_ip",
	"node_id": "$node_id",
	"protocol": "tftp",
	"http_port": $MESH_RECOVERY_PORT
}
EOF

	# Register with local P2P daemon
	if [ -x /usr/sbin/secubox-p2p ]; then
		/usr/sbin/secubox-p2p register-service tftp-recovery 69 2>/dev/null
	fi
}
