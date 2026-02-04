#!/bin/sh
# SecuBox Device Intelligence — Heuristic Classification Engine
#
# Priority chain:
#   1. User override (UCI device.<mac_clean>.type)
#   2. Emulator source (MQTT/Zigbee/USB → matching type)
#   3. Mesh peer match (IP in P2P peers → mesh_peer)
#   4. Port-based (exposure scan vs device_type.*.port_match)
#   5. Vendor-based (OUI vendor vs device_type.*.vendor_match)
#   6. Hostname-based (regex vs device_type.*.hostname_match)
#   7. Fallback → unknown

. /lib/functions.sh

DI_CONFIG="device-intel"

# Classify a single device
# Args: mac ip hostname vendor emulator_source [listening_ports]
# Output: device_type_id|source
di_classify_device() {
	local mac="$1" ip="$2" hostname="$3" vendor="$4" emu_source="$5" ports="$6"
	local mac_clean=$(echo "$mac" | tr -d ':' | tr 'A-F' 'a-f')

	# 1. User override
	local user_type=$(uci -q get ${DI_CONFIG}.${mac_clean}.type)
	if [ -n "$user_type" ]; then
		echo "${user_type}|user"
		return
	fi

	# 2. Emulator source
	if [ -n "$emu_source" ]; then
		echo "${emu_source}_device|emulator"
		return
	fi

	# 3. Mesh peer match (check P2P peers)
	if [ -n "$ip" ]; then
		local peers=$(ubus call luci.secubox-p2p get_peers 2>/dev/null)
		if [ -n "$peers" ] && echo "$peers" | grep -q "\"$ip\""; then
			echo "mesh_peer|p2p"
			return
		fi
	fi

	# 4-6. Rule-based classification from UCI device_type sections
	config_load "$DI_CONFIG"

	local match_result=""

	classify_against_rules() {
		local section="$1"
		[ -n "$match_result" ] && return

		# 4. Port-based matching
		if [ -n "$ports" ]; then
			local port_matches=""
			config_get port_matches "$section" port_match
			for pm in $port_matches; do
				if echo "$ports" | grep -qw "$pm"; then
					match_result="${section}|port"
					return
				fi
			done
		fi

		# 5. Vendor-based matching
		if [ -n "$vendor" ]; then
			local vendor_matches=""
			config_get vendor_matches "$section" vendor_match
			local vendor_lower=$(echo "$vendor" | tr 'A-Z' 'a-z')
			for vm in $vendor_matches; do
				local vm_lower=$(echo "$vm" | tr 'A-Z' 'a-z')
				if echo "$vendor_lower" | grep -qi "$vm_lower"; then
					match_result="${section}|vendor"
					return
				fi
			done
		fi

		# 6. Hostname-based matching (regex)
		if [ -n "$hostname" ]; then
			local host_matches=""
			config_get host_matches "$section" hostname_match
			local host_lower=$(echo "$hostname" | tr 'A-Z' 'a-z')
			for hm in $host_matches; do
				if echo "$host_lower" | grep -qE "$hm"; then
					match_result="${section}|hostname"
					return
				fi
			done
		fi
	}
	config_foreach classify_against_rules device_type

	if [ -n "$match_result" ]; then
		echo "$match_result"
		return
	fi

	# 7. Fallback
	echo "unknown|fallback"
}

# Batch classify all devices — runs classification on the full inventory
# and updates UCI with results for devices that are currently unclassified
di_classify_all() {
	local devices_json="$1"
	[ -z "$devices_json" ] && devices_json=$(cat /tmp/device-intel/cache-devices.json 2>/dev/null)
	[ -z "$devices_json" ] && return 1

	local count=0
	local classified=0

	# Process each device
	echo "$devices_json" | jsonfilter -e '@[*].mac' 2>/dev/null | while read -r mac; do
		[ -z "$mac" ] && continue
		# Skip synthetic entries
		case "$mac" in mesh-*|synth-*) continue ;; esac

		local mac_clean=$(echo "$mac" | tr -d ':' | tr 'A-F' 'a-f')

		# Skip if already has user override
		local existing=$(uci -q get ${DI_CONFIG}.${mac_clean}.type)
		[ -n "$existing" ] && continue

		# Get device attributes from JSON
		local ip=$(echo "$devices_json" | jsonfilter -e "@[@.mac='${mac}'].ip" 2>/dev/null)
		local hostname=$(echo "$devices_json" | jsonfilter -e "@[@.mac='${mac}'].hostname" 2>/dev/null)
		local vendor=$(echo "$devices_json" | jsonfilter -e "@[@.mac='${mac}'].vendor" 2>/dev/null)
		local emu=$(echo "$devices_json" | jsonfilter -e "@[@.mac='${mac}'].emulator_source" 2>/dev/null)

		local result=$(di_classify_device "$mac" "$ip" "$hostname" "$vendor" "$emu")
		local dtype=$(echo "$result" | cut -d'|' -f1)
		local dsrc=$(echo "$result" | cut -d'|' -f2)

		[ "$dtype" != "unknown" ] && classified=$((classified + 1))
		count=$((count + 1))
	done

	echo "Classified $classified of $count devices"
}
