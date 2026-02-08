#!/bin/sh
#
# SecuBox RPCD - AppStore Operations
# Catalog, apps, versions, widgets
#

# Register methods
list_methods_appstore() {
	add_method "get_appstore_apps"
	add_method "list_apps"
	add_method_str "get_appstore_app" "app_id"
	add_method_str "install_appstore_app" "app_id"
	add_method_str "remove_appstore_app" "app_id"
	add_method "get_catalog_sources"
	add_method_str "set_catalog_source" "source"
	add_method_str "sync_catalog" "source"
	add_method "check_updates"
	add_method_str "get_app_versions" "app_id"
	json_add_object "get_changelog"
		json_add_string "app_id" "string"
		json_add_string "from_version" "string"
		json_add_string "to_version" "string"
	json_close_object
	add_method_str "get_widget_data" "app_id"
	add_method_str "get_app_manifest" "app_id"
}

# Handle method calls
handle_appstore() {
	local method="$1"
	case "$method" in
		get_appstore_apps)
			_do_get_appstore_apps
			;;
		list_apps)
			_do_list_apps
			;;
		get_appstore_app)
			read_input_json
			local app_id=$(get_input "app_id")
			_do_get_appstore_app "$app_id"
			;;
		install_appstore_app)
			read_input_json
			local app_id=$(get_input "app_id")
			if /usr/sbin/secubox-appstore install "$app_id" >/dev/null 2>&1; then
				json_success "App installed successfully"
			else
				json_error "Installation failed" "Check system logs for more information"
			fi
			;;
		remove_appstore_app)
			read_input_json
			local app_id=$(get_input "app_id")
			if /usr/sbin/secubox-appstore remove "$app_id" >/dev/null 2>&1; then
				json_success "App removed successfully"
			else
				json_error "Removal failed" "Check system logs for more information"
			fi
			;;
		get_catalog_sources)
			_do_get_catalog_sources
			;;
		set_catalog_source)
			read_input_json
			local source=$(get_input "source")
			_do_set_catalog_source "$source"
			;;
		sync_catalog)
			read_input_json
			local source=$(get_input "source")
			if /usr/sbin/secubox-appstore sync ${source:+"$source"} 2>&1; then
				json_init
				json_add_boolean "success" 1
				json_add_string "message" "Catalog synced successfully"
				[ -n "$source" ] && json_add_string "source" "$source"
				json_dump
			else
				json_error "Sync failed"
			fi
			;;
		check_updates)
			/usr/sbin/secubox-appstore check-updates --json
			;;
		get_app_versions)
			read_input_json
			local app_id=$(get_input "app_id")
			_do_get_app_versions "$app_id"
			;;
		get_changelog)
			read_input_json
			local app_id=$(get_input "app_id")
			local from_version=$(get_input "from_version")
			local to_version=$(get_input "to_version")
			/usr/sbin/secubox-appstore changelog "$app_id" ${from_version:+"$from_version"} ${to_version:+"$to_version"}
			;;
		get_widget_data)
			read_input_json
			local app_id=$(get_input "app_id")
			_do_get_widget_data "$app_id"
			;;
		get_app_manifest)
			read_input_json
			local app_id=$(get_input "app_id")
			local manifest="/usr/share/secubox/plugins/$app_id/manifest.json"
			if [ -f "$manifest" ]; then
				cat "$manifest"
			else
				json_error "Manifest not found" "$app_id"
			fi
			;;
		*)
			return 1
			;;
	esac
}

# Get apps from catalog with installation status
_do_get_appstore_apps() {
	local CATALOG_FILE="/usr/share/secubox/catalog.json"

	if [ -f "$CATALOG_FILE" ]; then
		local MODULES_JSON=$(/usr/sbin/secubox-appstore list --json 2>/dev/null)

		if [ -n "$MODULES_JSON" ]; then
			jq --argjson modules "$MODULES_JSON" '
				{
					apps: [.plugins[] | . as $app |
						($modules.modules // [] | map(select(.id == $app.id or .name == $app.id)) | first) as $mod |
						$app + {
							installed: (if $mod then ($mod.installed // false) else false end),
							enabled: (if $mod then ($mod.enabled // false) else false end),
							status: (if $mod then ($mod.status // "unknown") else "not_installed" end)
						}
					],
					categories: .categories
				}
			' "$CATALOG_FILE"
		else
			jq '{apps: .plugins, categories: .categories}' "$CATALOG_FILE"
		fi
	else
		echo '{"apps":[],"categories":{}}'
	fi
}

# List apps with wizard detection
_do_list_apps() {
	local CATALOG_FILE="/usr/share/secubox/catalog.json"
	local PLUGINS_DIR="/usr/share/secubox/plugins"
	local APPS_JSON='[]'

	if [ -f "$CATALOG_FILE" ]; then
		APPS_JSON=$(jq '.plugins' "$CATALOG_FILE")
	fi

	for plugin_dir in "$PLUGINS_DIR"/*; do
		[ -d "$plugin_dir" ] || continue
		local manifest="$plugin_dir/manifest.json"
		[ -f "$manifest" ] || continue

		local app_id=$(jq -r '.id // empty' "$manifest" 2>/dev/null)
		[ -n "$app_id" ] || continue

		local has_wizard=$(jq -e '.wizard.fields | length > 0' "$manifest" >/dev/null 2>&1 && echo "true" || echo "false")

		if [ "$has_wizard" = "true" ]; then
			local app_exists=$(echo "$APPS_JSON" | jq --arg id "$app_id" 'map(select(.id == $id)) | length')
			if [ "$app_exists" -gt 0 ]; then
				APPS_JSON=$(echo "$APPS_JSON" | jq --arg id "$app_id" \
					'map(if .id == $id then . + {has_wizard: true} else . end)')
			else
				local app_data=$(jq '{
					id: .id,
					name: .name,
					description: .description,
					version: .version,
					icon: "box",
					has_wizard: true,
					state: "available"
				}' "$manifest")
				APPS_JSON=$(echo "$APPS_JSON" | jq --argjson app "$app_data" '. + [$app]')
			fi
		fi
	done

	if [ -f "$CATALOG_FILE" ]; then
		jq -n --argjson apps "$APPS_JSON" --argjson cats "$(jq '.categories // {}' "$CATALOG_FILE")" \
			'{apps: $apps, categories: $cats}'
	else
		jq -n --argjson apps "$APPS_JSON" '{apps: $apps, categories: {}}'
	fi
}

# Get single app details
_do_get_appstore_app() {
	local app_id="$1"
	local CATALOG_DIR="/usr/share/secubox/plugins/catalog"
	local CATALOG_FILE="$CATALOG_DIR/${app_id}.json"

	if [ -f "$CATALOG_FILE" ]; then
		json_init
		cat "$CATALOG_FILE" | jsonfilter -e '@'
		local pkg=$(jsonfilter -i "$CATALOG_FILE" -e '@.packages.required[0]')
		if [ -n "$pkg" ] && opkg list-installed | grep -q "^$pkg "; then
			echo ',"installed":true'
		else
			echo ',"installed":false'
		fi
	else
		json_error "App not found" "$app_id"
	fi
}

# Get catalog sources
_do_get_catalog_sources() {
	local CONFIG_NAME="secubox-appstore"
	local METADATA_FILE="/var/lib/secubox/catalog-metadata.json"

	_add_default_src() {
		local name="$1" type="$2" url="$3" path="$4" priority="$5"
		json_add_object ""
		json_add_string "name" "$name"
		json_add_boolean "enabled" 1
		json_add_string "type" "$type"
		[ -n "$url" ] && json_add_string "url" "$url"
		[ -n "$path" ] && json_add_string "path" "$path"
		json_add_int "priority" "$priority"
		[ "$name" = "embedded" ] && json_add_boolean "active" 1 || json_add_boolean "active" 0
		json_add_string "status" "default"
		json_add_string "last_success" ""
		json_close_object
	}

	if [ ! -f "/etc/config/$CONFIG_NAME" ]; then
		json_init
		json_add_array "sources"
		_add_default_src "github" "remote" "https://raw.githubusercontent.com/CyberMind-FR/secubox-openwrt/refs/heads/master/package/secubox/secubox-core/root/usr/share/secubox/catalog.json" "" 1
		_add_default_src "embedded" "embedded" "" "/usr/share/secubox/catalog.json" 999
		json_close_array
		json_add_boolean "defaults" true
		json_add_string "message" "Catalog config missing, using built-in defaults"
		json_dump
		return
	fi

	json_init
	json_add_array "sources"

	. /lib/functions.sh
	config_load "$CONFIG_NAME"

	local active_source=""
	[ -f "$METADATA_FILE" ] && active_source=$(jsonfilter -i "$METADATA_FILE" -e '@.active_source' 2>/dev/null || echo "")

	local metadata_content=""
	[ -f "$METADATA_FILE" ] && metadata_content=$(cat "$METADATA_FILE" 2>/dev/null || echo "{}")

	local sources_count=0

	_add_src_info() {
		local section="$1"
		local enabled type url path priority
		config_get_bool enabled "$section" enabled 0
		config_get type "$section" type
		config_get url "$section" url
		config_get path "$section" path
		config_get priority "$section" priority 999

		json_add_object ""
		json_add_string "name" "$section"
		json_add_boolean "enabled" "$enabled"
		json_add_string "type" "$type"
		[ -n "$url" ] && json_add_string "url" "$url"
		[ -n "$path" ] && json_add_string "path" "$path"
		json_add_int "priority" "$priority"
		json_add_boolean "active" "$([ "$section" = "$active_source" ] && echo 1 || echo 0)"

		if [ -n "$metadata_content" ]; then
			local status=$(echo "$metadata_content" | jsonfilter -e "@.sources['$section'].status" 2>/dev/null || echo "")
			local last_success=$(echo "$metadata_content" | jsonfilter -e "@.sources['$section'].last_success" 2>/dev/null || echo "")
			[ -n "$status" ] && json_add_string "status" "$status"
			[ -n "$last_success" ] && json_add_string "last_success" "$last_success"
		fi
		json_close_object
		sources_count=$((sources_count + 1))
	}

	config_foreach _add_src_info source

	if [ "$sources_count" -eq 0 ]; then
		_add_default_src "github" "remote" "https://raw.githubusercontent.com/CyberMind-FR/secubox-openwrt/refs/heads/master/package/secubox/secubox-core/root/usr/share/secubox/catalog.json" "" 1
		_add_default_src "embedded" "embedded" "" "/usr/share/secubox/catalog.json" 999
		json_close_array
		json_add_boolean "defaults" true
		json_add_string "message" "Catalog config empty, using built-in defaults"
	else
		json_close_array
	fi

	json_dump
}

# Set catalog source
_do_set_catalog_source() {
	local source="$1"
	local CONFIG_NAME="secubox-appstore"
	local SECTION_NAME=$(uci -q show "$CONFIG_NAME" | grep "=settings" | head -n1 | cut -d'.' -f2 | cut -d'=' -f1)
	[ -z "$SECTION_NAME" ] && SECTION_NAME="main"

	if [ -n "$source" ]; then
		if uci set "${CONFIG_NAME}.${SECTION_NAME}.force_source=$source" >/dev/null 2>&1 && \
			uci commit "$CONFIG_NAME" >/dev/null 2>&1; then
			json_init
			json_add_boolean "success" 1
			json_add_string "message" "Catalog source set to: $source"
			json_dump
		else
			json_error "Failed to update UCI config"
		fi
	else
		json_error "No source specified"
	fi
}

# Get app versions
_do_get_app_versions() {
	local app_id="$1"
	local CATALOG_FILE="/usr/share/secubox/catalog.json"
	local METADATA_FILE="/var/lib/secubox/catalog-metadata.json"

	json_init

	if [ -f "$CATALOG_FILE" ]; then
		local pkg_version=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[@.id='$app_id'].pkg_version" 2>/dev/null)
		local app_version=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[@.id='$app_id'].app_version" 2>/dev/null)
		[ -n "$pkg_version" ] && json_add_string "catalog_pkg_version" "$pkg_version"
		[ -n "$app_version" ] && json_add_string "catalog_app_version" "$app_version"
	fi

	local pkg_name=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[@.id='$app_id'].packages.required[0]" 2>/dev/null)
	if [ -n "$pkg_name" ]; then
		local installed_version=$(opkg list-installed | grep "^$pkg_name " | awk '{print $3}')
		[ -n "$installed_version" ] && json_add_string "installed_version" "$installed_version"
	fi

	if [ -f "$METADATA_FILE" ]; then
		local update_available=$(jsonfilter -i "$METADATA_FILE" -e "@.installed_apps['$app_id'].update_available" 2>/dev/null)
		[ -n "$update_available" ] && json_add_boolean "update_available" "$update_available"
	fi

	json_add_string "app_id" "$app_id"
	json_dump
}

# Get widget data
_do_get_widget_data() {
	local app_id="$1"
	local CATALOG_FILE="/usr/share/secubox/catalog.json"

	json_init
	json_add_string "app_id" "$app_id"
	json_add_int "timestamp" "$(date +%s)"

	if [ -f "$CATALOG_FILE" ]; then
		local widget_enabled=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[@.id='$app_id'].widget.enabled" 2>/dev/null)

		if [ "$widget_enabled" = "true" ]; then
			json_add_boolean "widget_enabled" true

			local catalog_version=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[@.id='$app_id'].version" 2>/dev/null)
			local pkg_version=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[@.id='$app_id'].pkg_version" 2>/dev/null)
			[ -n "$catalog_version" ] && json_add_string "catalog_version" "$catalog_version"
			[ -n "$pkg_version" ] && json_add_string "pkg_version" "$pkg_version"

			local installed_version=""
			if [ -n "$pkg_version" ]; then
				local package_name=$(jsonfilter -i "$CATALOG_FILE" -e "@.plugins[@.id='$app_id'].packages.required[0]" 2>/dev/null)
				if [ -n "$package_name" ]; then
					installed_version=$(opkg info "$package_name" 2>/dev/null | awk '/^Version:/ {print $2}')
				fi
			fi
			[ -n "$installed_version" ] && json_add_string "installed_version" "$installed_version"

			json_add_boolean "installed" false
			json_add_boolean "running" false
			json_add_string "status" "unknown"

			json_add_array "metrics"
			json_close_array
		else
			json_add_boolean "widget_enabled" false
		fi
	else
		json_add_boolean "widget_enabled" false
	fi

	json_dump
}
