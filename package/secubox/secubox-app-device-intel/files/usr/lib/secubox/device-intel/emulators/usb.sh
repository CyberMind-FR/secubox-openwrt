#!/bin/sh
# SecuBox Device Intelligence — USB Peripheral Emulator
# Discovers USB devices from /sys/bus/usb/devices/
# Returns pipe-delimited lines: emu|synth-usb-BUS:DEV|usb|product_name|vendor_name|capabilities

emulate_usb() {
	local track_storage=$(uci -q get device-intel.usb.track_storage)
	local track_serial=$(uci -q get device-intel.usb.track_serial)

	for devpath in /sys/bus/usb/devices/[0-9]*; do
		[ -d "$devpath" ] || continue

		# Skip root hubs and interfaces (contain ':')
		local devname=$(basename "$devpath")
		echo "$devname" | grep -q ':' && continue

		local id_vendor=$(cat "$devpath/idVendor" 2>/dev/null)
		local id_product=$(cat "$devpath/idProduct" 2>/dev/null)
		local manufacturer=$(cat "$devpath/manufacturer" 2>/dev/null)
		local product=$(cat "$devpath/product" 2>/dev/null)
		local serial=$(cat "$devpath/serial" 2>/dev/null)
		local dev_class=$(cat "$devpath/bDeviceClass" 2>/dev/null)
		local busnum=$(cat "$devpath/busnum" 2>/dev/null)
		local devnum=$(cat "$devpath/devnum" 2>/dev/null)

		# Skip hub devices (class 09)
		[ "$dev_class" = "09" ] && continue
		# Skip devices with no vendor ID (virtual)
		[ -z "$id_vendor" ] && continue
		# Skip 1d6b (Linux Foundation — virtual hubs)
		[ "$id_vendor" = "1d6b" ] && continue

		# Determine capabilities from device class
		local capabilities=""
		case "$dev_class" in
			08) # Mass Storage
				[ "$track_storage" = "1" ] || continue
				capabilities="storage"
				;;
			02|0a) # CDC / Serial
				[ "$track_serial" = "1" ] || continue
				capabilities="serial"
				;;
			03) # HID
				capabilities="input"
				;;
			0e) # Video
				capabilities="camera"
				;;
			01) # Audio
				capabilities="audio"
				;;
			06) # Imaging
				capabilities="imaging"
				;;
			07) # Printer
				capabilities="printer"
				;;
			e0) # Wireless
				capabilities="wireless"
				;;
			ff) # Vendor-specific — check for known Zigbee/Z-Wave dongles
				case "${id_vendor}:${id_product}" in
					10c4:ea60|10c4:8a2a) capabilities="zigbee_dongle" ;;
					0658:0200) capabilities="zwave_dongle" ;;
					*) capabilities="vendor_specific" ;;
				esac
				;;
			00) # Composite — check interface classes
				capabilities="composite"
				;;
			*)
				capabilities="other"
				;;
		esac

		local synth_id="synth-usb-${busnum}:${devnum}"
		local display_name="${product:-USB Device ${id_vendor}:${id_product}}"
		local vendor_name="${manufacturer:-}"

		# Check storage mount points
		local mount_info=""
		if [ "$capabilities" = "storage" ]; then
			for block in /sys/block/sd*; do
				[ -d "$block" ] || continue
				local block_dev=$(readlink -f "$block/device" 2>/dev/null)
				if echo "$block_dev" | grep -q "$devname"; then
					local bname=$(basename "$block")
					local size=$(cat "$block/size" 2>/dev/null)
					local size_gb=$((${size:-0} / 2097152))
					mount_info="${bname}:${size_gb}GB"
					break
				fi
			done
		fi

		# Output in emulator format
		if [ -n "$mount_info" ]; then
			echo "emu|${synth_id}|usb|${display_name} [${mount_info}]|${vendor_name}|${capabilities}"
		else
			echo "emu|${synth_id}|usb|${display_name}|${vendor_name}|${capabilities}"
		fi
	done
}
