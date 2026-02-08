#!/bin/sh
#
# SecuBox RPCD Common Utilities
# Shared functions for all RPCD method modules
#

# Standard JSON success response
json_success() {
	local msg="${1:-Success}"
	json_init
	json_add_boolean "success" 1
	json_add_string "message" "$msg"
	json_dump
}

# Standard JSON error response
json_error() {
	local msg="${1:-Error}"
	local details="$2"
	json_init
	json_add_boolean "success" 0
	json_add_string "error" "$msg"
	[ -n "$details" ] && json_add_string "details" "$details"
	json_dump
}

# Check if a service/process is running
# Usage: check_service_running <process_name>
# Returns: 0 if running, 1 if not
check_service_running() {
	local name="$1"
	pgrep -f "$name" >/dev/null 2>&1
}

# Check if a port is listening
# Usage: check_port_listening <port>
# Returns: 0 if listening, 1 if not
check_port_listening() {
	local port="$1"
	# Try netstat first (most common on OpenWrt)
	if command -v netstat >/dev/null 2>&1; then
		netstat -tln 2>/dev/null | grep -q ":${port} "
		return $?
	fi
	# Fallback to /proc/net/tcp (always available)
	# Convert port to hex
	local hex_port=$(printf '%04X' "$port")
	grep -qi ":${hex_port} " /proc/net/tcp 2>/dev/null
}

# Read and parse JSON input from stdin
# Sets global variable: INPUT_JSON
read_input_json() {
	INPUT_JSON=""
	read -r INPUT_JSON
}

# Get a value from INPUT_JSON
# Usage: get_input <field>
get_input() {
	local field="$1"
	echo "$INPUT_JSON" | jsonfilter -e "@.$field" 2>/dev/null
}

# Get boolean from INPUT_JSON (returns 1 or 0)
get_input_bool() {
	local field="$1"
	local val=$(get_input "$field")
	case "$val" in
		true|1|yes) echo 1 ;;
		*) echo 0 ;;
	esac
}

# Get integer from INPUT_JSON with default
get_input_int() {
	local field="$1"
	local default="${2:-0}"
	local val=$(get_input "$field")
	[ -n "$val" ] && [ "$val" -eq "$val" ] 2>/dev/null && echo "$val" || echo "$default"
}

# Check if init.d service exists and is enabled
# Usage: check_init_service <service_name>
# Returns: running|stopped|disabled|not_installed
check_init_service() {
	local svc="$1"
	if [ ! -f "/etc/init.d/$svc" ]; then
		echo "not_installed"
		return
	fi
	if ! /etc/init.d/$svc enabled 2>/dev/null; then
		echo "disabled"
		return
	fi
	if /etc/init.d/$svc running 2>/dev/null; then
		echo "running"
	else
		echo "stopped"
	fi
}

# Check LXC container status
# Usage: check_lxc_status <container_name>
# Returns: running|stopped|not_installed
check_lxc_status() {
	local name="$1"
	if ! command -v lxc-info >/dev/null 2>&1; then
		echo "not_installed"
		return
	fi
	if lxc-info -n "$name" -s 2>/dev/null | grep -q "RUNNING"; then
		echo "running"
	elif lxc-info -n "$name" 2>/dev/null | grep -q "State"; then
		echo "stopped"
	else
		echo "not_installed"
	fi
}

# Get current timestamp in ISO format
get_timestamp() {
	date -Iseconds 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ
}

# Get system uptime in seconds
get_uptime_seconds() {
	cut -d. -f1 /proc/uptime
}

# Get load average (1 5 15 minute)
get_load_avg() {
	cut -d' ' -f1-3 /proc/loadavg
}

# Get memory usage percentage
get_memory_percent() {
	local mem_total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
	local mem_avail=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
	mem_avail=${mem_avail:-0}
	[ "$mem_total" -gt 0 ] && echo $(( (mem_total - mem_avail) * 100 / mem_total )) || echo 0
}

# Get disk usage percentage for root
get_disk_percent() {
	df / 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%'
}

#
# Method registration helpers
# Each module should call these in its list_methods_<domain>() function
#

# Add a method with no parameters
add_method() {
	local name="$1"
	json_add_object "$name"
	json_close_object
}

# Add a method with string parameter
add_method_str() {
	local name="$1"
	local param="$2"
	json_add_object "$name"
	json_add_string "$param" "string"
	json_close_object
}

# Add a method with multiple string parameters
add_method_strs() {
	local name="$1"
	shift
	json_add_object "$name"
	for param in "$@"; do
		json_add_string "$param" "string"
	done
	json_close_object
}

# Add a method with boolean parameter
add_method_bool() {
	local name="$1"
	local param="$2"
	json_add_object "$name"
	json_add_boolean "$param" "boolean"
	json_close_object
}

# Add a method with integer parameter
add_method_int() {
	local name="$1"
	local param="$2"
	json_add_object "$name"
	json_add_int "$param" "integer"
	json_close_object
}
