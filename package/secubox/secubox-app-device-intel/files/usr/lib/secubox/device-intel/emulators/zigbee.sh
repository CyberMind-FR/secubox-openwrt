#!/bin/sh
# SecuBox Device Intelligence — Zigbee Coordinator + Paired Devices Emulator
# Discovers Zigbee devices from zigbee2mqtt or deCONZ bridge
# Returns pipe-delimited lines: emu|synth-zigbee-IEEE|zigbee|friendly_name|model|capabilities

emulate_zigbee() {
	local adapter=$(uci -q get device-intel.zigbee.adapter)
	local api_port=$(uci -q get device-intel.zigbee.api_port)
	local coordinator=$(uci -q get device-intel.zigbee.coordinator)
	adapter=${adapter:-zigbee2mqtt}
	api_port=${api_port:-8099}

	case "$adapter" in
		zigbee2mqtt)
			_zigbee_from_z2m "$api_port"
			;;
		deconz)
			_zigbee_from_deconz "$api_port"
			;;
		*)
			# Check if coordinator device exists
			if [ -c "$coordinator" ] 2>/dev/null; then
				echo "emu|synth-zigbee-coordinator|zigbee|Zigbee Coordinator|${coordinator}|coordinator"
			fi
			;;
	esac
}

_zigbee_from_z2m() {
	local port="$1"

	# Try zigbee2mqtt HTTP API
	local response=$(curl -s --connect-timeout 3 "http://127.0.0.1:${port}/api/devices" 2>/dev/null)
	[ -z "$response" ] && return

	# Parse device list
	# zigbee2mqtt returns JSON array of device objects
	local idx=0
	while true; do
		local ieee=$(echo "$response" | jsonfilter -e "@[$idx].ieee_address" 2>/dev/null)
		[ -z "$ieee" ] && break

		local friendly=$(echo "$response" | jsonfilter -e "@[$idx].friendly_name" 2>/dev/null)
		local model=$(echo "$response" | jsonfilter -e "@[$idx].definition.model" 2>/dev/null)
		local vendor=$(echo "$response" | jsonfilter -e "@[$idx].definition.vendor" 2>/dev/null)
		local dev_type=$(echo "$response" | jsonfilter -e "@[$idx].type" 2>/dev/null)

		# Skip the coordinator itself
		[ "$dev_type" = "Coordinator" ] && {
			idx=$((idx + 1))
			continue
		}

		# Determine capabilities from device type
		local capabilities="zigbee"
		case "$dev_type" in
			EndDevice)
				# Heuristic from model name
				case "$model" in
					*SNZB-02*|*TH01*|*temp*) capabilities="temperature,humidity" ;;
					*SNZB-03*|*motion*|*PIR*) capabilities="motion" ;;
					*SNZB-04*|*contact*|*door*) capabilities="contact" ;;
					*SNZB-01*|*button*) capabilities="button" ;;
					*plug*|*switch*|*relay*) capabilities="switch" ;;
					*bulb*|*light*|*LED*) capabilities="light" ;;
					*) capabilities="sensor" ;;
				esac
				;;
			Router)
				capabilities="router,switch"
				;;
		esac

		local ieee_clean=$(echo "$ieee" | tr -d ':' | tr 'A-F' 'a-f')
		local synth_id="synth-zigbee-${ieee_clean}"
		local display="${friendly:-Zigbee ${ieee}}"
		local model_info="${vendor:+${vendor} }${model:-unknown}"

		echo "emu|${synth_id}|zigbee|${display}|${model_info}|${capabilities}"

		idx=$((idx + 1))
	done
}

_zigbee_from_deconz() {
	local port="$1"

	# deCONZ REST API — need API key from config or discover
	local api_key=$(uci -q get device-intel.zigbee.deconz_api_key)
	[ -z "$api_key" ] && return

	# Get lights
	local lights=$(curl -s --connect-timeout 3 \
		"http://127.0.0.1:${port}/api/${api_key}/lights" 2>/dev/null)
	if [ -n "$lights" ]; then
		echo "$lights" | jsonfilter -e '@[*]' 2>/dev/null | while read -r light; do
			local name=$(echo "$light" | jsonfilter -e '@.name' 2>/dev/null)
			local model=$(echo "$light" | jsonfilter -e '@.modelid' 2>/dev/null)
			local manuf=$(echo "$light" | jsonfilter -e '@.manufacturername' 2>/dev/null)
			local uid=$(echo "$light" | jsonfilter -e '@.uniqueid' 2>/dev/null)
			[ -z "$uid" ] && continue

			local uid_clean=$(echo "$uid" | tr -d ':-' | tr 'A-F' 'a-f')
			echo "emu|synth-zigbee-${uid_clean}|zigbee|${name}|${manuf} ${model}|light"
		done
	fi

	# Get sensors
	local sensors=$(curl -s --connect-timeout 3 \
		"http://127.0.0.1:${port}/api/${api_key}/sensors" 2>/dev/null)
	if [ -n "$sensors" ]; then
		echo "$sensors" | jsonfilter -e '@[*]' 2>/dev/null | while read -r sensor; do
			local name=$(echo "$sensor" | jsonfilter -e '@.name' 2>/dev/null)
			local model=$(echo "$sensor" | jsonfilter -e '@.modelid' 2>/dev/null)
			local manuf=$(echo "$sensor" | jsonfilter -e '@.manufacturername' 2>/dev/null)
			local uid=$(echo "$sensor" | jsonfilter -e '@.uniqueid' 2>/dev/null)
			local stype=$(echo "$sensor" | jsonfilter -e '@.type' 2>/dev/null)
			[ -z "$uid" ] && continue

			local caps="sensor"
			case "$stype" in
				ZHATemperature) caps="temperature" ;;
				ZHAHumidity) caps="humidity" ;;
				ZHAPresence|ZHAOpenClose) caps="motion" ;;
				ZHASwitch) caps="button" ;;
				ZHALightLevel) caps="light_sensor" ;;
			esac

			local uid_clean=$(echo "$uid" | tr -d ':-' | tr 'A-F' 'a-f')
			echo "emu|synth-zigbee-${uid_clean}|zigbee|${name}|${manuf} ${model}|${caps}"
		done
	fi
}
