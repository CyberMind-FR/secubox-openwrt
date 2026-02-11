#!/bin/sh
#
# SecuBox RPCD - Core Methods
# Status, version, reload
#

# Register methods
list_methods_core() {
	add_method "getStatus"
	add_method "getVersion"
	add_method "reload"
}

# Handle method calls
handle_core() {
	local method="$1"
	case "$method" in
		getStatus)
			/usr/sbin/secubox-core status
			;;
		getVersion)
			json_init
			json_add_string "version" "0.8.0"
			json_add_string "core" "secubox-core"
			json_add_string "build_date" "$(date -u +%Y-%m-%d)"
			json_dump
			;;
		reload)
			/usr/sbin/secubox-core reload
			json_init
			json_add_boolean "success" 1
			json_dump
			;;
		*)
			return 1
			;;
	esac
}
