#!/bin/sh

#
# SecuBox Common Helper Functions
# Shared utilities for SecuBox scripts
#

# Color codes
export SECUBOX_COLOR_RED='\033[0;31m'
export SECUBOX_COLOR_GREEN='\033[0;32m'
export SECUBOX_COLOR_YELLOW='\033[1;33m'
export SECUBOX_COLOR_BLUE='\033[0;34m'
export SECUBOX_COLOR_BOLD='\033[1m'
export SECUBOX_COLOR_NC='\033[0m'

# Logging functions
secubox_log_info() {
	logger -t secubox -p user.info "$*"
	echo "[INFO] $*"
}

secubox_log_warn() {
	logger -t secubox -p user.warn "$*"
	echo -e "${SECUBOX_COLOR_YELLOW}[WARN]${SECUBOX_COLOR_NC} $*"
}

secubox_log_error() {
	logger -t secubox -p user.err "$*"
	echo -e "${SECUBOX_COLOR_RED}[ERROR]${SECUBOX_COLOR_NC} $*"
}

secubox_log_success() {
	logger -t secubox -p user.notice "$*"
	echo -e "${SECUBOX_COLOR_GREEN}[SUCCESS]${SECUBOX_COLOR_NC} $*"
}

# Check if running as root
secubox_require_root() {
	if [ "$(id -u)" -ne 0 ]; then
		secubox_log_error "This operation requires root privileges"
		exit 1
	fi
}

# Check if SecuBox is initialized
secubox_is_initialized() {
	[ -f /var/run/secubox-firstboot ] && return 0
	return 1
}

# Get SecuBox version
secubox_get_version() {
	echo "0.8.0"
}

# Check if module is installed
secubox_module_is_installed() {
	local module_id="$1"
	local catalog_file="/usr/share/secubox/plugins/catalog/${module_id}.json"

	[ -f "$catalog_file" ] || return 1

	local packages=$(jsonfilter -i "$catalog_file" -e '@.packages.required[0]' 2>/dev/null)
	[ -z "$packages" ] && return 1

	opkg list-installed | grep -q "^$packages " && return 0
	return 1
}

# Get module status
secubox_module_get_status() {
	local module_id="$1"

	if secubox_module_is_installed "$module_id"; then
		echo "installed"
	else
		echo "available"
	fi
}

# Progress indicator
secubox_progress() {
	local current="$1"
	local total="$2"
	local message="$3"

	echo -e "[${current}/${total}] ${message}..."
}

# Confirm action
secubox_confirm() {
	local message="$1"
	local default="${2:-n}"

	if [ "$default" = "y" ]; then
		read -p "${message} [Y/n]: " response
		response=${response:-y}
	else
		read -p "${message} [y/N]: " response
		response=${response:-n}
	fi

	case "$response" in
		[Yy]|[Yy][Ee][Ss])
			return 0
			;;
		*)
			return 1
			;;
	esac
}

# Format bytes to human readable
secubox_format_bytes() {
	local bytes="$1"
	local units="B KB MB GB TB"
	local unit="B"

	for u in $units; do
		if [ "$bytes" -lt 1024 ]; then
			unit="$u"
			break
		fi
		bytes=$((bytes / 1024))
	done

	echo "${bytes}${unit}"
}

# Check internet connectivity
secubox_has_internet() {
	ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1 && return 0
	return 1
}

# Get device uptime in seconds
secubox_get_uptime() {
	cut -d'.' -f1 /proc/uptime
}

# Format uptime
secubox_format_uptime() {
	local uptime_sec=$(secubox_get_uptime)
	local days=$((uptime_sec / 86400))
	local hours=$(( (uptime_sec % 86400) / 3600 ))
	local minutes=$(( (uptime_sec % 3600) / 60 ))

	if [ "$days" -gt 0 ]; then
		echo "${days}d ${hours}h ${minutes}m"
	elif [ "$hours" -gt 0 ]; then
		echo "${hours}h ${minutes}m"
	else
		echo "${minutes}m"
	fi
}

# Check if service is running
secubox_service_is_running() {
	local service="$1"
	/etc/init.d/"$service" status >/dev/null 2>&1 && return 0
	return 1
}

# Restart service safely
secubox_service_restart() {
	local service="$1"

	if [ -f "/etc/init.d/$service" ]; then
		/etc/init.d/"$service" restart
		return $?
	else
		secubox_log_error "Service not found: $service"
		return 1
	fi
}

# Export all functions
export -f secubox_log_info
export -f secubox_log_warn
export -f secubox_log_error
export -f secubox_log_success
export -f secubox_require_root
export -f secubox_is_initialized
export -f secubox_get_version
export -f secubox_module_is_installed
export -f secubox_module_get_status
export -f secubox_progress
export -f secubox_confirm
export -f secubox_format_bytes
export -f secubox_has_internet
export -f secubox_get_uptime
export -f secubox_format_uptime
export -f secubox_service_is_running
export -f secubox_service_restart
