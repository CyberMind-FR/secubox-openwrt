#!/bin/sh
#
# SecuBox RPCD - Snapshot/Recovery Management
# Create, list, restore snapshots
#

# Register methods
list_methods_snapshots() {
	add_method_str "createSnapshot" "name"
	add_method "listSnapshots"
	add_method_str "restoreSnapshot" "snapshot"
}

# Handle method calls
handle_snapshots() {
	local method="$1"
	case "$method" in
		createSnapshot)
			read_input_json
			local name=$(get_input "name")
			/usr/sbin/secubox-recovery snapshot "${name:-auto-$(date +%Y%m%d-%H%M%S)}"
			;;
		listSnapshots)
			/usr/sbin/secubox-recovery list --json
			;;
		restoreSnapshot)
			read_input_json
			local snapshot=$(get_input "snapshot")
			/usr/sbin/secubox-recovery rollback "$snapshot"
			;;
		*)
			return 1
			;;
	esac
}
