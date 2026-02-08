#!/bin/sh
#
# SecuBox RPCD - State & Component Management
# Component state, history, registry
#

# Register methods
list_methods_state() {
	add_method_str "get_component_state" "component_id"
	json_add_object "set_component_state"
		json_add_string "component_id" "string"
		json_add_string "new_state" "string"
		json_add_string "reason" "string"
	json_close_object
	json_add_object "get_state_history"
		json_add_string "component_id" "string"
		json_add_int "limit" "integer"
	json_close_object
	json_add_object "list_components"
		json_add_string "state_filter" "string"
		json_add_string "type_filter" "string"
	json_close_object
	json_add_object "freeze_component"
		json_add_string "component_id" "string"
		json_add_string "reason" "string"
	json_close_object
	add_method_str "clear_error_state" "component_id"
	add_method_str "get_component" "component_id"
	json_add_object "list_all_components"
		json_add_string "type" "string"
		json_add_string "profile" "string"
	json_close_object
	add_method_str "get_component_tree" "component_id"
	json_add_object "update_component_settings"
		json_add_string "component_id" "string"
		json_add_object "settings"
		json_close_object
	json_close_object
	add_method "sync_component_registry"
}

# Handle method calls
handle_state() {
	local method="$1"
	case "$method" in
		get_component_state)
			read_input_json
			local component_id=$(get_input "component_id")
			/usr/sbin/secubox-state get "$component_id"
			;;
		set_component_state)
			read_input_json
			local component_id=$(get_input "component_id")
			local new_state=$(get_input "new_state")
			local reason=$(get_input "reason")
			local result=$(/usr/sbin/secubox-state set "$component_id" "$new_state" "${reason:-manual}")
			json_init
			if echo "$result" | grep -q "Success:"; then
				json_add_boolean "success" 1
				json_add_string "message" "$result"
				json_add_string "component_id" "$component_id"
				json_add_string "new_state" "$new_state"
			else
				json_add_boolean "success" 0
				json_add_string "error" "$result"
			fi
			json_dump
			;;
		get_state_history)
			read_input_json
			local component_id=$(get_input "component_id")
			local limit=$(get_input_int "limit" 20)
			/usr/sbin/secubox-state history "$component_id" "$limit"
			;;
		list_components)
			read_input_json
			local state_filter=$(get_input "state_filter")
			local type_filter=$(get_input "type_filter")
			local args=""
			[ -n "$state_filter" ] && args="$args --state=$state_filter"
			[ -n "$type_filter" ] && args="$args --type=$type_filter"
			/usr/sbin/secubox-state list $args
			;;
		freeze_component)
			read_input_json
			local component_id=$(get_input "component_id")
			local reason=$(get_input "reason")
			local result=$(/usr/sbin/secubox-state freeze "$component_id" "${reason:-manual_freeze}")
			json_init
			if echo "$result" | grep -q "Success:"; then
				json_add_boolean "success" 1
				json_add_string "message" "$result"
			else
				json_add_boolean "success" 0
				json_add_string "error" "$result"
			fi
			json_dump
			;;
		clear_error_state)
			read_input_json
			local component_id=$(get_input "component_id")
			local result=$(/usr/sbin/secubox-state clear-error "$component_id")
			json_init
			if echo "$result" | grep -q "Success:"; then
				json_add_boolean "success" 1
				json_add_string "message" "$result"
			else
				json_add_boolean "success" 0
				json_add_string "error" "$result"
			fi
			json_dump
			;;
		get_component)
			read_input_json
			local component_id=$(get_input "component_id")
			/usr/sbin/secubox-component get "$component_id"
			;;
		list_all_components)
			read_input_json
			local type=$(get_input "type")
			local profile=$(get_input "profile")
			local args=""
			[ -n "$type" ] && args="$args --type=$type"
			[ -n "$profile" ] && args="$args --profile=$profile"
			/usr/sbin/secubox-component list $args
			;;
		get_component_tree)
			read_input_json
			local component_id=$(get_input "component_id")
			/usr/sbin/secubox-component tree "$component_id"
			;;
		update_component_settings)
			read_input_json
			local component_id=$(get_input "component_id")
			json_init
			json_add_boolean "success" 1
			json_add_string "message" "Settings update functionality available via CLI: secubox-component set-setting"
			json_dump
			;;
		sync_component_registry)
			local result=$(/usr/sbin/secubox-sync-registry sync)
			json_init
			if echo "$result" | grep -q "successfully"; then
				json_add_boolean "success" 1
				json_add_string "message" "$result"
			else
				json_add_boolean "success" 0
				json_add_string "error" "$result"
			fi
			json_dump
			;;
		*)
			return 1
			;;
	esac
}
