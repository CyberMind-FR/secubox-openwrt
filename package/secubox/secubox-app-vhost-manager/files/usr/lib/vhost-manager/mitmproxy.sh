#!/bin/sh
# SecuBox VHost Manager - Mitmproxy WAF Adapter
# Uses centralized secubox-route registry when available

ROUTES_FILE="/srv/mitmproxy/haproxy-routes.json"

# Add route to mitmproxy routes file
mitmproxy_add_route() {
	local domain="$1"
	local host="$2"
	local port="$3"
	local source="${4:-vhost-manager}"

	# Prefer centralized route registry
	if command -v secubox-route >/dev/null 2>&1; then
		secubox-route add "$domain" "$host" "$port" "$source" 2>/dev/null
		return $?
	fi

	# Fallback: Direct file manipulation
	[ ! -f "$ROUTES_FILE" ] && echo '{}' > "$ROUTES_FILE"

	local temp_file="/tmp/routes_update_$$.json"

	if command -v jq >/dev/null 2>&1; then
		jq --arg d "$domain" --arg h "$host" --argjson p "$port" \
			'.[$d] = [$h, $p]' "$ROUTES_FILE" > "$temp_file" && \
			mv "$temp_file" "$ROUTES_FILE"
	else
		local current=$(cat "$ROUTES_FILE")
		if echo "$current" | grep -q "\"$domain\""; then
			sed -i "s|\"$domain\": \\[[^]]*\\]|\"$domain\": [\"$host\", $port]|" "$ROUTES_FILE"
		else
			if [ "$current" = "{}" ]; then
				echo "{\"$domain\": [\"$host\", $port]}" > "$ROUTES_FILE"
			else
				sed -i "s|}$|,\"$domain\": [\"$host\", $port]}|" "$ROUTES_FILE"
			fi
		fi
	fi

	return 0
}

# Remove route from mitmproxy routes file
mitmproxy_remove_route() {
	local domain="$1"

	# Prefer centralized route registry
	if command -v secubox-route >/dev/null 2>&1; then
		secubox-route remove "$domain" 2>/dev/null
		return $?
	fi

	# Fallback: Direct file manipulation
	[ ! -f "$ROUTES_FILE" ] && return 0

	if command -v jq >/dev/null 2>&1; then
		local temp_file="/tmp/routes_update_$$.json"
		jq --arg d "$domain" 'del(.[$d])' "$ROUTES_FILE" > "$temp_file" && \
			mv "$temp_file" "$ROUTES_FILE"
	else
		sed -i "/\"$domain\":/d" "$ROUTES_FILE"
	fi

	return 0
}

# Sync all routes from vhosts config
mitmproxy_sync_routes() {
	# Prefer centralized route registry
	if command -v secubox-route >/dev/null 2>&1; then
		secubox-route sync 2>/dev/null
		return $?
	fi

	if command -v mitmproxyctl >/dev/null 2>&1; then
		mitmproxyctl sync-routes 2>/dev/null
		return $?
	fi

	return 1
}

# Check if mitmproxy is available
mitmproxy_is_available() {
	command -v mitmproxyctl >/dev/null 2>&1 && return 0
	return 1
}

# Check if mitmproxy is running
mitmproxy_is_running() {
	local state=$(lxc-info -n mitmproxy 2>/dev/null | grep "State:" | awk '{print $2}')
	[ "$state" = "RUNNING" ] && return 0
	return 1
}
