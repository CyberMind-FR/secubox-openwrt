#!/bin/sh
# SecuBox Device Intelligence — Core Aggregation Library
# Sources data from mac-guardian, client-guardian, DHCP, P2P, exposure, and emulators

. /lib/functions.sh

DI_CONFIG="device-intel"
DI_CACHE_DIR="/tmp/device-intel"
DI_CACHE_FILE="${DI_CACHE_DIR}/cache-devices.json"
DI_EMULATOR_DIR="/usr/lib/secubox/device-intel/emulators"

# ============================================================================
# Config helpers
# ============================================================================

di_uci_get() {
	uci -q get ${DI_CONFIG}.$1
}

di_cache_valid() {
	local ttl=$(di_uci_get main.cache_ttl)
	ttl=${ttl:-30}

	[ ! -f "$DI_CACHE_FILE" ] && return 1

	local now=$(date +%s)
	local mtime=$(date -r "$DI_CACHE_FILE" +%s 2>/dev/null)
	[ -z "$mtime" ] && return 1

	local age=$((now - mtime))
	[ "$age" -lt "$ttl" ] && return 0
	return 1
}

di_invalidate_cache() {
	rm -f "${DI_CACHE_DIR}"/cache*.json 2>/dev/null
}

# ============================================================================
# Data Source Collectors
# ============================================================================

# Collect mac-guardian client data → pipe-delimited lines
# Format: mac|vendor|iface|hostname|status|randomized|first_seen|last_seen
di_collect_mac_guardian() {
	local db="/var/run/mac-guardian/clients.db"
	local oui_db="/usr/lib/secubox/mac-guardian/oui.tsv"

	[ ! -f "$db" ] && return

	while IFS='|' read -r mac oui first_seen last_seen iface hostname status rest; do
		[ -z "$mac" ] && continue
		local vendor=""
		if [ -n "$oui" ] && [ -f "$oui_db" ]; then
			vendor=$(grep -i "^${oui}" "$oui_db" 2>/dev/null | cut -f2 | head -1)
		fi
		# Detect randomized MAC (local bit set)
		local randomized=0
		local second_char=$(echo "$mac" | cut -c2)
		case "$second_char" in
			2|3|6|7|a|b|e|f|A|B|E|F) randomized=1 ;;
		esac
		echo "mg|${mac}|${vendor}|${iface}|${hostname}|${status}|${randomized}|${first_seen}|${last_seen}"
	done < "$db"
}

# Collect client-guardian data via UCI
# Format: cg|mac|ip|hostname|zone|status|rx_bytes|tx_bytes|risk_score
di_collect_client_guardian() {
	local idx=0
	while uci -q get client-guardian.@client[$idx] >/dev/null 2>&1; do
		local mac=$(uci -q get client-guardian.@client[$idx].mac)
		local ip=$(uci -q get client-guardian.@client[$idx].ip)
		local hostname=$(uci -q get client-guardian.@client[$idx].hostname)
		local zone=$(uci -q get client-guardian.@client[$idx].zone)
		local status=$(uci -q get client-guardian.@client[$idx].status)
		local rx=$(uci -q get client-guardian.@client[$idx].rx_bytes)
		local tx=$(uci -q get client-guardian.@client[$idx].tx_bytes)
		local risk=$(uci -q get client-guardian.@client[$idx].risk_score)

		[ -n "$mac" ] && echo "cg|${mac}|${ip}|${hostname}|${zone}|${status}|${rx:-0}|${tx:-0}|${risk:-0}"
		idx=$((idx + 1))
	done
}

# Collect DHCP lease data
# Format: dhcp|mac|ip|hostname|expires
di_collect_dhcp() {
	local lease_file="/tmp/dhcp.leases"
	[ ! -f "$lease_file" ] && return

	while read -r expires mac ip hostname clientid; do
		[ -z "$mac" ] && continue
		[ "$mac" = "*" ] && continue
		echo "dhcp|${mac}|${ip}|${hostname}|${expires}"
	done < "$lease_file"
}

# Collect P2P mesh peers
# Format: p2p|id|address|name|status|services
di_collect_p2p_peers() {
	# Try ubus first
	local peers=$(ubus call luci.secubox-p2p get_peers 2>/dev/null)
	[ -z "$peers" ] && return

	echo "$peers" | jsonfilter -e '@.peers[*]' 2>/dev/null | while read -r peer_json; do
		local id=$(echo "$peer_json" | jsonfilter -e '@.id' 2>/dev/null)
		local addr=$(echo "$peer_json" | jsonfilter -e '@.address' 2>/dev/null)
		local name=$(echo "$peer_json" | jsonfilter -e '@.name' 2>/dev/null)
		local status=$(echo "$peer_json" | jsonfilter -e '@.status' 2>/dev/null)
		[ -n "$id" ] && echo "p2p|${id}|${addr}|${name}|${status}"
	done
}

# Collect exposure scan data (listening services by IP)
# Format: exp|ip|port|service_name
di_collect_exposure() {
	# Simple port scan from /proc/net/tcp
	local hex_ports=""
	while read -r sl local_addr rem_addr st rest; do
		[ "$st" != "0A" ] && continue  # 0A = LISTEN
		local hex_port=$(echo "$local_addr" | cut -d: -f2)
		local port=$((16#$hex_port))
		local hex_ip=$(echo "$local_addr" | cut -d: -f1)

		# Determine bind address
		local bind="local"
		[ "$hex_ip" = "00000000" ] && bind="all"

		echo "exp|${bind}|${port}"
	done < /proc/net/tcp 2>/dev/null
}

# ============================================================================
# Emulator Collection
# ============================================================================

di_collect_emulators() {
	for emu in usb mqtt zigbee; do
		local enabled=$(di_uci_get "${emu}.enabled")
		[ "$enabled" != "1" ] && continue
		local script="${DI_EMULATOR_DIR}/${emu}.sh"
		[ -f "$script" ] && {
			. "$script"
			emulate_${emu} 2>/dev/null
		}
	done
}

# ============================================================================
# Merge & Aggregate
# ============================================================================

# Merge all sources into a unified device map keyed by MAC
# Output: JSON array of device objects
di_aggregate_devices() {
	local tmp_dir="${DI_CACHE_DIR}/collect_$$"
	mkdir -p "$tmp_dir"

	# Collect from all sources
	di_collect_mac_guardian > "${tmp_dir}/mg.dat" 2>/dev/null
	di_collect_client_guardian > "${tmp_dir}/cg.dat" 2>/dev/null
	di_collect_dhcp > "${tmp_dir}/dhcp.dat" 2>/dev/null
	di_collect_p2p_peers > "${tmp_dir}/p2p.dat" 2>/dev/null
	di_collect_exposure > "${tmp_dir}/exp.dat" 2>/dev/null
	di_collect_emulators > "${tmp_dir}/emu.dat" 2>/dev/null

	# Build unified device map
	# Step 1: Extract all unique MACs
	local all_macs=$(cat "${tmp_dir}"/*.dat 2>/dev/null | \
		awk -F'|' '{print tolower($2)}' | \
		grep -E '^[0-9a-f]{2}(:[0-9a-f]{2}){5}$' | \
		sort -u)

	# Step 2: Build JSON output
	local first=1
	printf '['

	for mac in $all_macs; do
		[ $first -eq 1 ] && first=0 || printf ','

		# Defaults
		local ip="" hostname="" vendor="" iface="" online="false"
		local mg_status="" cg_zone="" cg_status="" randomized="false"
		local first_seen="" last_seen="" label="" device_type=""
		local device_type_source="" emulator_source="" rx=0 tx=0 risk=0
		local services="" source_node="local"

		# Mac-Guardian data
		local mg=$(grep "^mg|${mac}|" "${tmp_dir}/mg.dat" 2>/dev/null | head -1)
		if [ -n "$mg" ]; then
			vendor=$(echo "$mg" | cut -d'|' -f3)
			iface=$(echo "$mg" | cut -d'|' -f4)
			hostname=$(echo "$mg" | cut -d'|' -f5)
			mg_status=$(echo "$mg" | cut -d'|' -f6)
			local rand_flag=$(echo "$mg" | cut -d'|' -f7)
			[ "$rand_flag" = "1" ] && randomized="true"
			first_seen=$(echo "$mg" | cut -d'|' -f8)
			last_seen=$(echo "$mg" | cut -d'|' -f9)
		fi

		# Client-Guardian data
		local cg=$(grep "^cg|${mac}|" "${tmp_dir}/cg.dat" 2>/dev/null | head -1)
		if [ -n "$cg" ]; then
			local cg_ip=$(echo "$cg" | cut -d'|' -f3)
			[ -n "$cg_ip" ] && ip="$cg_ip"
			local cg_host=$(echo "$cg" | cut -d'|' -f4)
			[ -n "$cg_host" ] && [ -z "$hostname" ] && hostname="$cg_host"
			cg_zone=$(echo "$cg" | cut -d'|' -f5)
			cg_status=$(echo "$cg" | cut -d'|' -f6)
			rx=$(echo "$cg" | cut -d'|' -f7)
			tx=$(echo "$cg" | cut -d'|' -f8)
			risk=$(echo "$cg" | cut -d'|' -f9)
		fi

		# DHCP data
		local dhcp=$(grep "^dhcp|${mac}|" "${tmp_dir}/dhcp.dat" 2>/dev/null | head -1)
		if [ -n "$dhcp" ]; then
			local dhcp_ip=$(echo "$dhcp" | cut -d'|' -f3)
			[ -n "$dhcp_ip" ] && [ -z "$ip" ] && ip="$dhcp_ip"
			local dhcp_host=$(echo "$dhcp" | cut -d'|' -f4)
			[ -n "$dhcp_host" ] && [ "$dhcp_host" != "*" ] && [ -z "$hostname" ] && hostname="$dhcp_host"
			local dhcp_exp=$(echo "$dhcp" | cut -d'|' -f5)
			# Active lease = online
			local now=$(date +%s)
			[ -n "$dhcp_exp" ] && [ "$dhcp_exp" -gt "$now" ] 2>/dev/null && online="true"
		fi

		# Emulator data
		local emu=$(grep "^emu|${mac}|" "${tmp_dir}/emu.dat" 2>/dev/null | head -1)
		if [ -n "$emu" ]; then
			emulator_source=$(echo "$emu" | cut -d'|' -f3)
			local emu_label=$(echo "$emu" | cut -d'|' -f4)
			[ -n "$emu_label" ] && [ -z "$hostname" ] && hostname="$emu_label"
		fi

		# User override from UCI
		local mac_clean=$(echo "$mac" | tr -d ':')
		local user_type=$(uci -q get ${DI_CONFIG}.${mac_clean}.type)
		local user_label=$(uci -q get ${DI_CONFIG}.${mac_clean}.label)
		[ -n "$user_label" ] && label="$user_label"

		# Determine connection type
		local connection_type="ethernet"
		case "$iface" in
			wlan*|phy*) connection_type="wifi" ;;
		esac

		# Classify device
		if [ -n "$user_type" ]; then
			device_type="$user_type"
			device_type_source="user"
		elif [ -n "$emulator_source" ]; then
			device_type="${emulator_source}_device"
			device_type_source="emulator"
		fi

		# JSON output
		printf '{'
		printf '"mac":"%s"' "$mac"
		printf ',"ip":"%s"' "$ip"
		printf ',"hostname":"%s"' "$hostname"
		[ -n "$label" ] && printf ',"label":"%s"' "$label"
		printf ',"vendor":"%s"' "$vendor"
		printf ',"online":%s' "$online"
		printf ',"connection_type":"%s"' "$connection_type"
		printf ',"iface":"%s"' "$iface"
		printf ',"randomized":%s' "$randomized"
		[ -n "$mg_status" ] && printf ',"mg_status":"%s"' "$mg_status"
		[ -n "$cg_zone" ] && printf ',"cg_zone":"%s"' "$cg_zone"
		[ -n "$cg_status" ] && printf ',"cg_status":"%s"' "$cg_status"
		[ -n "$device_type" ] && printf ',"device_type":"%s"' "$device_type"
		[ -n "$device_type_source" ] && printf ',"device_type_source":"%s"' "$device_type_source"
		[ -n "$emulator_source" ] && printf ',"emulator_source":"%s"' "$emulator_source"
		printf ',"rx_bytes":%s' "${rx:-0}"
		printf ',"tx_bytes":%s' "${tx:-0}"
		printf ',"risk_score":%s' "${risk:-0}"
		printf ',"source_node":"%s"' "$source_node"
		[ -n "$first_seen" ] && printf ',"first_seen":%s' "$first_seen"
		[ -n "$last_seen" ] && printf ',"last_seen":%s' "$last_seen"
		printf '}'
	done

	# Add P2P mesh peers as pseudo-devices
	if [ -s "${tmp_dir}/p2p.dat" ]; then
		while IFS='|' read -r src id addr name status rest; do
			[ -z "$id" ] && continue
			[ $first -eq 1 ] && first=0 || printf ','
			printf '{'
			printf '"mac":"mesh-%s"' "$id"
			printf ',"ip":"%s"' "$(echo "$addr" | cut -d: -f1)"
			printf ',"hostname":"%s"' "$name"
			printf ',"online":%s' "$([ "$status" = "online" ] && echo true || echo false)"
			printf ',"device_type":"mesh_peer"'
			printf ',"device_type_source":"p2p"'
			printf ',"source_node":"mesh"'
			printf '}'
		done < "${tmp_dir}/p2p.dat"
	fi

	# Add emulator-only entries (no MAC)
	if [ -s "${tmp_dir}/emu.dat" ]; then
		grep "^emu|synth-" "${tmp_dir}/emu.dat" 2>/dev/null | while IFS='|' read -r src synth_id emu_type emu_name emu_model emu_caps; do
			[ -z "$synth_id" ] && continue
			[ $first -eq 1 ] && first=0 || printf ','
			printf '{'
			printf '"mac":"%s"' "$synth_id"
			printf ',"hostname":"%s"' "$emu_name"
			printf ',"vendor":"%s"' "$emu_model"
			printf ',"online":true'
			printf ',"device_type":"%s_device"' "$emu_type"
			printf ',"device_type_source":"emulator"'
			printf ',"emulator_source":"%s"' "$emu_type"
			printf ',"source_node":"local"'
			printf '}'
		done
	fi

	printf ']'

	# Cleanup
	rm -rf "$tmp_dir"
}

# Get cached or fresh device list
di_get_devices() {
	mkdir -p "$DI_CACHE_DIR"

	if di_cache_valid; then
		cat "$DI_CACHE_FILE"
	else
		di_aggregate_devices | tee "$DI_CACHE_FILE"
	fi
}

# ============================================================================
# Summary Statistics
# ============================================================================

di_get_summary() {
	local devices=$(di_get_devices)
	local total=0 online=0 mesh=0 iot=0 storage=0 compute=0

	# Count using jsonfilter
	total=$(echo "$devices" | jsonfilter -e '@[*].mac' 2>/dev/null | wc -l)
	online=$(echo "$devices" | jsonfilter -e '@[*]' 2>/dev/null | grep '"online":true' | wc -l)
	mesh=$(echo "$devices" | jsonfilter -e '@[*]' 2>/dev/null | grep '"device_type":"mesh_peer"' | wc -l)

	printf '{"total":%d,"online":%d,"mesh_peers":%d}' \
		"$total" "$online" "$mesh"
}

# ============================================================================
# Device Type Registry
# ============================================================================

di_get_device_types() {
	printf '['
	local first=1

	config_load "$DI_CONFIG"

	get_type() {
		local section="$1"
		local name icon color

		config_get name "$section" name
		config_get icon "$section" icon
		config_get color "$section" color

		[ -z "$name" ] && return

		[ $first -eq 1 ] && first=0 || printf ','
		printf '{"id":"%s","name":"%s","icon":"%s","color":"%s"}' \
			"$section" "$name" "$icon" "$color"
	}
	config_foreach get_type device_type

	printf ']'
}
