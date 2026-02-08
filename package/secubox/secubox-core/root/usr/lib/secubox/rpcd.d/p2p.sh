#!/bin/sh
#
# SecuBox RPCD - P2P Hub
# Peer management, catalog sharing
#

P2P_DIR="/var/lib/secubox/p2p"
P2P_PEERS_FILE="$P2P_DIR/peers.json"
P2P_CONFIG="$P2P_DIR/config.json"

# Register methods
list_methods_p2p() {
	add_method "p2p_get_peers"
	add_method "p2p_discover"
	json_add_object "p2p_add_peer"
		json_add_string "address" "string"
		json_add_string "name" "string"
	json_close_object
	add_method_str "p2p_remove_peer" "peer_id"
	add_method_str "p2p_get_peer_catalog" "peer_id"
	add_method_bool "p2p_share_catalog" "enabled"
	add_method "p2p_get_settings"
	json_add_object "p2p_set_settings"
		json_add_object "settings"
		json_close_object
	json_close_object
}

# Handle method calls
handle_p2p() {
	local method="$1"
	mkdir -p "$P2P_DIR"

	case "$method" in
		p2p_get_peers)
			_do_p2p_get_peers
			;;
		p2p_discover)
			_do_p2p_discover
			;;
		p2p_add_peer)
			read_input_json
			local address=$(get_input "address")
			local name=$(get_input "name")
			_do_p2p_add_peer "$address" "$name"
			;;
		p2p_remove_peer)
			read_input_json
			local peer_id=$(get_input "peer_id")
			_do_p2p_remove_peer "$peer_id"
			;;
		p2p_get_peer_catalog)
			read_input_json
			local peer_id=$(get_input "peer_id")
			_do_p2p_get_peer_catalog "$peer_id"
			;;
		p2p_share_catalog)
			read_input_json
			local enabled=$(get_input_bool "enabled")
			echo "{\"sharing_enabled\":$enabled}" > "$P2P_CONFIG"
			json_init
			json_add_boolean "success" 1
			json_add_boolean "sharing_enabled" "$enabled"
			json_dump
			;;
		p2p_get_settings)
			json_init
			if [ -f "$P2P_CONFIG" ]; then
				local sharing=$(jsonfilter -i "$P2P_CONFIG" -e '@.sharing_enabled' 2>/dev/null)
				json_add_boolean "sharing_enabled" "${sharing:-0}"
			else
				json_add_boolean "sharing_enabled" 0
			fi
			json_add_string "hub_version" "1.0.0"
			json_add_string "protocol" "http"
			json_add_int "port" 8080
			json_dump
			;;
		p2p_set_settings)
			read_input_json
			local sharing=$(echo "$INPUT_JSON" | jsonfilter -e '@.settings.sharing_enabled' 2>/dev/null)
			echo "{\"sharing_enabled\":${sharing:-false}}" > "$P2P_CONFIG"
			json_success "Settings updated"
			;;
		*)
			return 1
			;;
	esac
}

# Get peers list
_do_p2p_get_peers() {
	json_init
	json_add_array "peers"

	if [ -f "$P2P_PEERS_FILE" ]; then
		local idx=0
		while true; do
			local peer_id=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].id" 2>/dev/null)
			[ -z "$peer_id" ] && break

			local peer_name=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].name" 2>/dev/null)
			local peer_addr=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].address" 2>/dev/null)
			local peer_status=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].status" 2>/dev/null)
			local last_seen=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].last_seen" 2>/dev/null)

			json_add_object ""
			json_add_string "id" "$peer_id"
			json_add_string "name" "${peer_name:-$peer_id}"
			json_add_string "address" "$peer_addr"
			json_add_string "status" "${peer_status:-unknown}"
			json_add_string "last_seen" "$last_seen"
			json_close_object

			idx=$((idx + 1))
		done
	fi

	json_close_array
	json_dump
}

# mDNS discovery
_do_p2p_discover() {
	local discovered=0
	json_init
	json_add_array "peers"

	if command -v avahi-browse >/dev/null 2>&1; then
		avahi-browse -t -r _secubox._tcp 2>/dev/null | grep -E "^\+" | while read -r line; do
			local addr=$(echo "$line" | awk '{print $7}')
			local name=$(echo "$line" | awk '{print $4}')
			if [ -n "$addr" ]; then
				json_add_object ""
				json_add_string "address" "$addr"
				json_add_string "name" "$name"
				json_add_string "discovered" "mdns"
				json_close_object
				discovered=$((discovered + 1))
			fi
		done
	fi

	json_close_array
	json_add_int "discovered" "$discovered"
	json_dump
}

# Add peer
_do_p2p_add_peer() {
	local address="$1"
	local name="$2"

	local peer_id="peer_$(echo "$address" | md5sum | cut -c1-8)"

	[ ! -f "$P2P_PEERS_FILE" ] && echo '{"peers":[]}' > "$P2P_PEERS_FILE"

	local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
	local tmp_file="${P2P_PEERS_FILE}.tmp"
	{
		echo '{"peers":['
		if [ -f "$P2P_PEERS_FILE" ]; then
			jsonfilter -i "$P2P_PEERS_FILE" -e '@.peers[*]' 2>/dev/null | while read -r p; do
				echo "$p,"
			done
		fi
		echo "{\"id\":\"$peer_id\",\"name\":\"$name\",\"address\":\"$address\",\"status\":\"added\",\"last_seen\":\"$timestamp\"}"
		echo ']}'
	} > "$tmp_file"
	mv "$tmp_file" "$P2P_PEERS_FILE"

	json_init
	json_add_boolean "success" 1
	json_add_string "peer_id" "$peer_id"
	json_dump
}

# Remove peer
_do_p2p_remove_peer() {
	local peer_id="$1"

	if [ -f "$P2P_PEERS_FILE" ] && [ -n "$peer_id" ]; then
		local tmp_file="${P2P_PEERS_FILE}.tmp"
		{
			echo '{"peers":['
			local first=1
			local idx=0
			while true; do
				local id=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].id" 2>/dev/null)
				[ -z "$id" ] && break
				if [ "$id" != "$peer_id" ]; then
					[ "$first" -eq 0 ] && echo ","
					jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx]" 2>/dev/null
					first=0
				fi
				idx=$((idx + 1))
			done
			echo ']}'
		} > "$tmp_file"
		mv "$tmp_file" "$P2P_PEERS_FILE"
	fi

	json_success "Peer removed"
}

# Get peer catalog
_do_p2p_get_peer_catalog() {
	local peer_id="$1"

	local idx=0
	local peer_addr=""
	while true; do
		local id=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].id" 2>/dev/null)
		[ -z "$id" ] && break
		if [ "$id" = "$peer_id" ]; then
			peer_addr=$(jsonfilter -i "$P2P_PEERS_FILE" -e "@.peers[$idx].address" 2>/dev/null)
			break
		fi
		idx=$((idx + 1))
	done

	json_init

	if [ -n "$peer_addr" ]; then
		local catalog=$(wget -q -O - "http://${peer_addr}:8080/api/catalog" 2>/dev/null)
		if [ -n "$catalog" ]; then
			echo "$catalog"
			return
		fi
	fi

	json_add_array "apps"
	json_close_array
	json_add_string "error" "Could not fetch catalog from peer"
	json_dump
}
