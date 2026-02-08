#!/bin/sh
#
# SecuBox RPCD - Profile Management
# List, get, apply, validate, export, import profiles
#

# Register methods
list_methods_profiles() {
	add_method "listProfiles"
	add_method_str "getProfile" "profile"
	json_add_object "applyProfile"
		json_add_string "profile" "string"
		json_add_boolean "dryrun" "boolean"
	json_close_object
	add_method "rollbackProfile"
	add_method_str "validateProfile" "profile"
	json_add_object "export_profile"
		json_add_string "name" "string"
		json_add_boolean "include_feeds" "boolean"
	json_close_object
	json_add_object "import_profile"
		json_add_string "url" "string"
		json_add_string "mode" "string"
	json_close_object
	add_method_str "share_profile" "profile"
}

# Handle method calls
handle_profiles() {
	local method="$1"
	case "$method" in
		listProfiles)
			/usr/sbin/secubox-profile list --json
			;;
		getProfile)
			read_input_json
			local profile=$(get_input "profile")
			/usr/sbin/secubox-profile show "$profile"
			;;
		applyProfile)
			read_input_json
			local profile=$(get_input "profile")
			local dryrun=$(get_input "dryrun")
			local result=$(/usr/sbin/secubox-profile apply "$profile" ${dryrun:+--dryrun} 2>&1)
			if [ $? -eq 0 ]; then
				echo '{"success":true,"message":"Profile applied successfully"}'
			else
				echo "{\"success\":false,\"message\":\"Failed to apply profile\",\"error\":\"$result\"}"
			fi
			;;
		rollbackProfile)
			if [ -f /usr/sbin/secubox-recovery ]; then
				local result=$(/usr/sbin/secubox-recovery restore last 2>&1)
				if [ $? -eq 0 ]; then
					echo '{"success":true,"message":"Rolled back to last snapshot"}'
				else
					echo "{\"success\":false,\"message\":\"Rollback failed\",\"error\":\"$result\"}"
				fi
			else
				echo '{"success":false,"message":"Recovery system not available"}'
			fi
			;;
		validateProfile)
			read_input_json
			local profile=$(get_input "profile")
			/usr/sbin/secubox-profile validate "$profile"
			;;
		export_profile)
			read_input_json
			local name=$(get_input "name")
			local include_feeds=$(get_input "include_feeds")
			local args=""
			[ -n "$name" ] && args="$args --name \"$name\""
			[ "$include_feeds" = "true" ] && args="$args --include-feeds"
			local output="/tmp/secubox-profile-export-$$.json"
			eval /usr/sbin/secubox-profile export $args --output "$output" >/dev/null 2>&1
			if [ -f "$output" ]; then
				cat "$output"
				rm -f "$output"
			else
				json_error "Export failed"
			fi
			;;
		import_profile)
			read_input_json
			local url=$(get_input "url")
			local mode=$(get_input "mode")
			local result=$(/usr/sbin/secubox-profile import "$url" "${mode:---merge}" 2>&1)
			if [ $? -eq 0 ]; then
				json_success "Profile imported"
			else
				json_error "$result"
			fi
			;;
		share_profile)
			read_input_json
			local profile=$(get_input "profile")
			/usr/sbin/secubox-profile share "$profile"
			;;
		*)
			return 1
			;;
	esac
}
