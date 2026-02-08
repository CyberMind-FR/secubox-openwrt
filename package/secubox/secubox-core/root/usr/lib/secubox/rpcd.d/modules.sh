#!/bin/sh
#
# SecuBox RPCD - Module Management
# Install, remove, update, info
#

# Register methods
list_methods_modules() {
	add_method "getModules"
	add_method_str "getModuleInfo" "module"
	json_add_object "installModule"
		json_add_string "module" "string"
		json_add_boolean "dryrun" "boolean"
	json_close_object
	add_method_str "removeModule" "module"
	add_method_str "updateModule" "module"

	# Module control
	add_method_str "start_module" "module"
	add_method_str "stop_module" "module"
	add_method_str "restart_module" "module"
	add_method_str "enable_module" "module"
	add_method_str "disable_module" "module"
}

# Handle method calls
handle_modules() {
	local method="$1"
	case "$method" in
		getModules)
			/usr/sbin/secubox-appstore list --json
			;;
		getModuleInfo)
			read_input_json
			local module=$(get_input "module")
			/usr/sbin/secubox-appstore info "$module"
			;;
		installModule)
			read_input_json
			local module=$(get_input "module")
			local dryrun=$(get_input "dryrun")
			/usr/sbin/secubox-appstore install "$module" ${dryrun:+--dryrun}
			;;
		removeModule)
			read_input_json
			local module=$(get_input "module")
			/usr/sbin/secubox-appstore remove "$module"
			;;
		updateModule)
			read_input_json
			local module=$(get_input "module")
			/usr/sbin/secubox-appstore update "$module"
			;;
		start_module)
			read_input_json
			local module=$(get_input "module")
			if [ -x "/etc/init.d/$module" ]; then
				/etc/init.d/$module start
				json_success "Module $module started"
			else
				json_error "Module $module not found"
			fi
			;;
		stop_module)
			read_input_json
			local module=$(get_input "module")
			if [ -x "/etc/init.d/$module" ]; then
				/etc/init.d/$module stop
				json_success "Module $module stopped"
			else
				json_error "Module $module not found"
			fi
			;;
		restart_module)
			read_input_json
			local module=$(get_input "module")
			if [ -x "/etc/init.d/$module" ]; then
				/etc/init.d/$module restart
				json_success "Module $module restarted"
			else
				json_error "Module $module not found"
			fi
			;;
		enable_module)
			read_input_json
			local module=$(get_input "module")
			if [ -x "/etc/init.d/$module" ]; then
				/etc/init.d/$module enable
				json_success "Module $module enabled"
			else
				json_error "Module $module not found"
			fi
			;;
		disable_module)
			read_input_json
			local module=$(get_input "module")
			if [ -x "/etc/init.d/$module" ]; then
				/etc/init.d/$module disable
				json_success "Module $module disabled"
			else
				json_error "Module $module not found"
			fi
			;;
		*)
			return 1
			;;
	esac
}
