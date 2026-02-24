#!/bin/sh
# SecuBox Hardware Inventory Collection
# Collects and stores hardware information for factory provisioning

INVENTORY_DIR="/var/lib/secubox-factory/inventory"

# Initialize inventory storage
inventory_init() {
	mkdir -p "$INVENTORY_DIR"
}

# Collect local hardware inventory
inventory_collect() {
	local serial mac model cpu ram storage

	# Serial number (try DMI, then CPU serial, then generate from MAC)
	serial=$(cat /sys/class/dmi/id/board_serial 2>/dev/null)
	[ -z "$serial" ] && serial=$(grep -m1 Serial /proc/cpuinfo 2>/dev/null | cut -d: -f2 | tr -d ' ')
	[ -z "$serial" ] && serial=$(cat /sys/class/net/eth0/address 2>/dev/null | tr -d ':')

	# MAC address (prefer eth0, fallback to br-lan)
	mac=$(cat /sys/class/net/eth0/address 2>/dev/null)
	[ -z "$mac" ] && mac=$(cat /sys/class/net/br-lan/address 2>/dev/null)
	[ -z "$mac" ] && mac=$(cat /sys/class/net/lan/address 2>/dev/null)

	# Board model
	model=$(cat /tmp/sysinfo/board_name 2>/dev/null)
	[ -z "$model" ] && model=$(cat /sys/class/dmi/id/board_name 2>/dev/null)
	[ -z "$model" ] && model="unknown"

	# CPU info
	cpu=$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | tr -d ' ')
	[ -z "$cpu" ] && cpu=$(grep -m1 'CPU part' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | tr -d ' ')
	[ -z "$cpu" ] && cpu="unknown"

	# RAM in MB
	ram=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo 2>/dev/null)
	[ -z "$ram" ] && ram=0

	# Storage in GB (root partition)
	storage=$(df -BG / 2>/dev/null | awk 'NR==2{gsub("G",""); print $2}')
	[ -z "$storage" ] && storage=0

	cat <<EOF
{"serial":"$serial","mac":"$mac","model":"$model","cpu":"$cpu","ram_mb":$ram,"storage_gb":$storage,"collected_at":$(date +%s)}
EOF
}

# Store inventory for a device (master side)
inventory_store() {
	local device_id="$1"
	local inventory_json="$2"

	[ -z "$device_id" ] && return 1
	[ -z "$inventory_json" ] && return 1

	inventory_init
	echo "$inventory_json" > "$INVENTORY_DIR/${device_id}.json"

	logger -t factory "Stored inventory for device $device_id"
	return 0
}

# Get inventory for a specific device
inventory_get() {
	local device_id="$1"
	local file="$INVENTORY_DIR/${device_id}.json"

	[ -f "$file" ] && cat "$file" || echo "{}"
}

# List all inventoried devices
inventory_list() {
	inventory_init

	echo "["
	local first=1
	for f in "$INVENTORY_DIR"/*.json; do
		[ -f "$f" ] || continue
		[ "$first" = "1" ] || echo ","
		local id=$(basename "$f" .json)
		printf '{"id":"%s","data":' "$id"
		cat "$f"
		printf '}'
		first=0
	done
	echo "]"
}

# Match device to pre-registered entry for auto-approval
inventory_match() {
	local mac="$1"
	local serial="$2"
	local preregistered="/etc/secubox/preregistered.json"

	[ -f "$preregistered" ] || return 1

	# Check MAC match
	local match
	match=$(jsonfilter -i "$preregistered" -e "@[\"$mac\"]" 2>/dev/null)
	if [ -n "$match" ]; then
		echo "$match"
		return 0
	fi

	# Check serial match
	match=$(jsonfilter -i "$preregistered" -e "@[\"$serial\"]" 2>/dev/null)
	if [ -n "$match" ]; then
		echo "$match"
		return 0
	fi

	return 1
}

# Delete inventory entry
inventory_delete() {
	local device_id="$1"
	local file="$INVENTORY_DIR/${device_id}.json"

	[ -f "$file" ] && rm -f "$file" && return 0
	return 1
}

# Get inventory count
inventory_count() {
	inventory_init
	ls -1 "$INVENTORY_DIR"/*.json 2>/dev/null | wc -l
}

# Export all inventories as JSON array
inventory_export() {
	inventory_list
}

# Import pre-registered devices from JSON
inventory_import_preregistered() {
	local json_file="$1"
	local preregistered="/etc/secubox/preregistered.json"

	[ -f "$json_file" ] || return 1

	mkdir -p "$(dirname "$preregistered")"
	cp "$json_file" "$preregistered"

	logger -t factory "Imported pre-registered devices"
	return 0
}

# CLI interface
case "${1:-}" in
	collect)
		inventory_collect
		;;
	store)
		inventory_store "$2" "$3"
		;;
	get)
		inventory_get "$2"
		;;
	list)
		inventory_list
		;;
	match)
		inventory_match "$2" "$3"
		;;
	delete)
		inventory_delete "$2"
		;;
	count)
		inventory_count
		;;
	*)
		# Sourced as library - do nothing
		:
		;;
esac
