#!/bin/sh
#
# SecuBox RPCD - Skill Management
# List skills, get providers, install, check
#

# Register methods
list_methods_skills() {
	add_method "list_skills"
	add_method_str "get_skill_providers" "skill"
	add_method_str "install_skill" "skill"
	add_method_str "check_skills" "profile"
}

# Handle method calls
handle_skills() {
	local method="$1"
	case "$method" in
		list_skills)
			/usr/sbin/secubox-skill list --json
			;;
		get_skill_providers)
			read_input_json
			local skill=$(get_input "skill")
			_do_get_skill_providers "$skill"
			;;
		install_skill)
			read_input_json
			local skill=$(get_input "skill")
			local result=$(/usr/sbin/secubox-skill install "$skill" 2>&1)
			if [ $? -eq 0 ]; then
				json_init
				json_add_boolean "success" 1
				json_add_string "message" "Skill provider installed"
				json_add_string "skill" "$skill"
				json_dump
			else
				json_error "$result"
			fi
			;;
		check_skills)
			read_input_json
			local profile=$(get_input "profile")
			if [ -n "$profile" ]; then
				/usr/sbin/secubox-skill check "$profile"
			else
				/usr/sbin/secubox-skill check
			fi
			;;
		*)
			return 1
			;;
	esac
}

# Get skill providers from catalog
_do_get_skill_providers() {
	local skill="$1"
	local CATALOG_FILE="/usr/share/secubox/catalog.json"

	json_init
	json_add_string "skill" "$skill"
	json_add_array "providers"

	if [ -f "$CATALOG_FILE" ]; then
		local idx=0
		while true; do
			local pid=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[$idx].id" 2>/dev/null)
			[ -z "$pid" ] && break

			local caps=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[$idx].capabilities[@]" 2>/dev/null)
			for cap in $caps; do
				local cap_norm=$(echo "$cap" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
				if [ "$cap_norm" = "$skill" ]; then
					local pname=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[$idx].name" 2>/dev/null)
					local pstatus=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[$idx].status" 2>/dev/null)
					local featured=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[$idx].featured" 2>/dev/null)

					json_add_object ""
					json_add_string "id" "$pid"
					json_add_string "name" "$pname"
					json_add_string "status" "$pstatus"
					json_add_boolean "featured" "$([ "$featured" = "true" ] && echo 1 || echo 0)"

					local main_pkg=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[$idx].packages.required[0]" 2>/dev/null)
					local installed=0
					if [ -n "$main_pkg" ] && opkg list-installed 2>/dev/null | grep -q "^$main_pkg "; then
						installed=1
					fi
					json_add_boolean "installed" "$installed"
					json_close_object
					break
				fi
			done

			idx=$((idx + 1))
		done
	fi

	json_close_array
	json_dump
}
