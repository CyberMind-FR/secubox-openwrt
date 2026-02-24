#!/bin/sh
# SecuBox Profile Management for Factory Provisioning
# Manages configuration profiles for new devices

PROFILE_DIR="/etc/secubox/profiles"
PROFILE_RULES="/etc/secubox/profile-rules.json"

# Initialize profile storage
profiles_init() {
	mkdir -p "$PROFILE_DIR"
}

# Match device to profile based on rules
# Priority: MAC prefix > Model > Serial prefix > Default
profile_match() {
	local mac="$1"
	local model="$2"
	local serial="$3"

	# If no rules file, return default
	[ -f "$PROFILE_RULES" ] || { echo "default"; return; }

	local profile

	# Check MAC prefix rules (first 3 octets = vendor)
	if [ -n "$mac" ]; then
		local mac_prefix=$(echo "$mac" | cut -d: -f1-3 | tr '[:lower:]' '[:upper:]')
		profile=$(jsonfilter -i "$PROFILE_RULES" -e "@.mac_prefix[\"$mac_prefix\"]" 2>/dev/null)
		[ -n "$profile" ] && { echo "$profile"; return; }
	fi

	# Check model rules
	if [ -n "$model" ]; then
		profile=$(jsonfilter -i "$PROFILE_RULES" -e "@.model[\"$model\"]" 2>/dev/null)
		[ -n "$profile" ] && { echo "$profile"; return; }
	fi

	# Check serial prefix rules (first 4 chars)
	if [ -n "$serial" ]; then
		local serial_prefix=$(echo "$serial" | cut -c1-4)
		profile=$(jsonfilter -i "$PROFILE_RULES" -e "@.serial_prefix[\"$serial_prefix\"]" 2>/dev/null)
		[ -n "$profile" ] && { echo "$profile"; return; }
	fi

	# Return default profile
	jsonfilter -i "$PROFILE_RULES" -e "@.default" 2>/dev/null || echo "default"
}

# Get profile content by name
profile_get() {
	local name="$1"
	local file="$PROFILE_DIR/${name}.json"

	[ -f "$file" ] && cat "$file" || echo "{}"
}

# List all available profiles
profile_list() {
	profiles_init

	echo "["
	local first=1
	for f in "$PROFILE_DIR"/*.json; do
		[ -f "$f" ] || continue
		[ "$first" = "1" ] || echo ","
		local name=$(basename "$f" .json)
		printf '{"name":"%s","config":' "$name"
		cat "$f"
		printf '}'
		first=0
	done
	echo "]"
}

# Get profile names only
profile_names() {
	profiles_init

	for f in "$PROFILE_DIR"/*.json; do
		[ -f "$f" ] || continue
		basename "$f" .json
	done
}

# Create or update a profile
profile_save() {
	local name="$1"
	local content="$2"

	[ -z "$name" ] && return 1
	[ -z "$content" ] && return 1

	profiles_init
	echo "$content" > "$PROFILE_DIR/${name}.json"

	logger -t factory "Saved profile: $name"
	return 0
}

# Delete a profile
profile_delete() {
	local name="$1"
	local file="$PROFILE_DIR/${name}.json"

	[ -f "$file" ] && rm -f "$file" && return 0
	return 1
}

# Apply profile to device (generates UCI commands)
profile_apply() {
	local profile_name="$1"
	local device_hostname="$2"

	local profile
	profile=$(profile_get "$profile_name")

	[ "$profile" = "{}" ] && { echo "# No profile found: $profile_name"; return 1; }

	# Generate UCI commands from profile
	echo "# Profile: $profile_name for $device_hostname"

	# Apply UCI commands
	echo "$profile" | jsonfilter -e '@.uci[*]' 2>/dev/null | while read -r cmd; do
		[ -n "$cmd" ] && echo "uci $cmd"
	done

	echo "uci commit"
}

# Get profile description
profile_description() {
	local name="$1"
	local file="$PROFILE_DIR/${name}.json"

	[ -f "$file" ] || { echo ""; return; }

	jsonfilter -i "$file" -e '@.description' 2>/dev/null || echo ""
}

# Validate profile JSON
profile_validate() {
	local name="$1"
	local file="$PROFILE_DIR/${name}.json"

	[ -f "$file" ] || { echo "not_found"; return 1; }

	# Check required fields
	local has_name=$(jsonfilter -i "$file" -e '@.name' 2>/dev/null)
	local has_uci=$(jsonfilter -i "$file" -e '@.uci' 2>/dev/null)

	if [ -n "$has_name" ]; then
		echo "valid"
		return 0
	else
		echo "missing_name"
		return 1
	fi
}

# Add rule for profile matching
profile_add_rule() {
	local rule_type="$1"  # mac_prefix, model, serial_prefix
	local key="$2"
	local profile="$3"

	[ -f "$PROFILE_RULES" ] || echo '{"mac_prefix":{},"model":{},"serial_prefix":{},"default":"default"}' > "$PROFILE_RULES"

	# This would need proper JSON manipulation
	# Simplified: log what should be added
	logger -t factory "Profile rule: $rule_type[$key] = $profile"
	return 0
}

# Set default profile
profile_set_default() {
	local profile="$1"

	[ -f "$PROFILE_RULES" ] || echo '{"mac_prefix":{},"model":{},"serial_prefix":{},"default":"default"}' > "$PROFILE_RULES"

	# Update default
	local tmp="/tmp/profile_rules_$$.json"
	sed "s/\"default\":\"[^\"]*\"/\"default\":\"$profile\"/" "$PROFILE_RULES" > "$tmp"
	mv "$tmp" "$PROFILE_RULES"

	logger -t factory "Set default profile: $profile"
	return 0
}

# CLI interface
case "${1:-}" in
	match)
		profile_match "$2" "$3" "$4"
		;;
	get)
		profile_get "$2"
		;;
	list)
		profile_list
		;;
	names)
		profile_names
		;;
	save)
		profile_save "$2" "$3"
		;;
	delete)
		profile_delete "$2"
		;;
	apply)
		profile_apply "$2" "$3"
		;;
	validate)
		profile_validate "$2"
		;;
	set-default)
		profile_set_default "$2"
		;;
	*)
		# Sourced as library - do nothing
		:
		;;
esac
