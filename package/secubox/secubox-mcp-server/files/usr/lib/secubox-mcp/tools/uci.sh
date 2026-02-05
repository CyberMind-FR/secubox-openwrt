# SecuBox MCP Tool: UCI Configuration Access
# Read/write OpenWrt UCI configuration

tool_uci_get() {
	local args="$1"
	local key=$(echo "$args" | jsonfilter -e '@.key' 2>/dev/null)

	if [ -z "$key" ]; then
		echo '{"error":"Missing required parameter: key"}'
		return 1
	fi

	# Security: block access to sensitive configs
	case "$key" in
		*password*|*secret*|*key*|*token*)
			echo '{"error":"Access to sensitive configuration denied"}'
			return 1
			;;
	esac

	local value=$(uci -q get "$key" 2>/dev/null)

	if [ -n "$value" ]; then
		printf '{"key":"%s","value":"%s","found":true}' "$key" "$(json_escape "$value")"
	else
		printf '{"key":"%s","value":null,"found":false}' "$key"
	fi
}

tool_uci_set() {
	local args="$1"
	local key=$(echo "$args" | jsonfilter -e '@.key' 2>/dev/null)
	local value=$(echo "$args" | jsonfilter -e '@.value' 2>/dev/null)

	if [ -z "$key" ]; then
		echo '{"error":"Missing required parameter: key"}'
		return 1
	fi

	# Security: block write to sensitive configs
	case "$key" in
		*password*|*secret*|*key*|*token*|system.*|dropbear.*)
			echo '{"error":"Write access to sensitive configuration denied"}'
			return 1
			;;
	esac

	if uci set "${key}=${value}" 2>/dev/null && uci commit 2>/dev/null; then
		printf '{"key":"%s","value":"%s","success":true}' "$key" "$(json_escape "$value")"
	else
		printf '{"key":"%s","success":false,"error":"Failed to set value"}' "$key"
	fi
}

# List all UCI configs
tool_uci_list() {
	local args="$1"
	local config=$(echo "$args" | jsonfilter -e '@.config' 2>/dev/null)

	if [ -n "$config" ]; then
		# List sections in a specific config
		local sections=$(uci show "$config" 2>/dev/null | grep -E "^${config}\.[^.]+=" | cut -d'=' -f1 | cut -d'.' -f2 | sort -u)
		local json='['
		local first=1

		for section in $sections; do
			[ $first -eq 0 ] && json="${json},"
			first=0
			local type=$(uci -q get "${config}.${section}" 2>/dev/null)
			json="${json}{\"name\":\"$section\",\"type\":\"$type\"}"
		done

		json="${json}]"
		printf '{"config":"%s","sections":%s}' "$config" "$json"
	else
		# List all configs
		local configs='['
		local first=1

		for conf in /etc/config/*; do
			[ -f "$conf" ] || continue
			local name=$(basename "$conf")

			[ $first -eq 0 ] && configs="${configs},"
			first=0
			configs="${configs}\"$name\""
		done

		configs="${configs}]"
		printf '{"configs":%s}' "$configs"
	fi
}

# Show full config (filtered)
tool_uci_show() {
	local args="$1"
	local config=$(echo "$args" | jsonfilter -e '@.config' 2>/dev/null)

	if [ -z "$config" ]; then
		echo '{"error":"Missing required parameter: config"}'
		return 1
	fi

	# Security: block access to sensitive configs
	case "$config" in
		dropbear|rpcd|uhttpd)
			echo '{"error":"Access to sensitive configuration denied"}'
			return 1
			;;
	esac

	# Get config content (filter out sensitive values)
	local content=$(uci show "$config" 2>/dev/null | grep -v -E '(password|secret|key|token)=' | head -100)

	printf '{"config":"%s","content":"%s"}' "$config" "$(json_escape "$content")"
}
