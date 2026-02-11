#!/bin/sh
# SecuBox VHost Manager - Mitmproxy WAF Adapter

ROUTES_FILE="/srv/mitmproxy/haproxy-routes.json"

# Add route to mitmproxy routes file
mitmproxy_add_route() {
	local domain="$1"
	local host="$2"
	local port="$3"

	[ ! -f "$ROUTES_FILE" ] && echo '{}' > "$ROUTES_FILE"

	# Use jsonfilter to update (or fallback to sed)
	local temp_file="/tmp/routes_update_$$.json"

	if command -v jq >/dev/null 2>&1; then
		jq --arg d "$domain" --arg h "$host" --argjson p "$port" \
			'.[$d] = [$h, $p]' "$ROUTES_FILE" > "$temp_file" && \
			mv "$temp_file" "$ROUTES_FILE"
	else
		# Manual JSON update (basic)
		local current=$(cat "$ROUTES_FILE")
		if echo "$current" | grep -q "\"$domain\""; then
			# Update existing
			sed -i "s|\"$domain\": \\[[^]]*\\]|\"$domain\": [\"$host\", $port]|" "$ROUTES_FILE"
		else
			# Add new entry
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

	[ ! -f "$ROUTES_FILE" ] && return 0

	if command -v jq >/dev/null 2>&1; then
		local temp_file="/tmp/routes_update_$$.json"
		jq --arg d "$domain" 'del(.[$d])' "$ROUTES_FILE" > "$temp_file" && \
			mv "$temp_file" "$ROUTES_FILE"
	else
		# Basic removal (may leave trailing commas)
		sed -i "/\"$domain\":/d" "$ROUTES_FILE"
	fi

	return 0
}

# Sync all routes from vhosts config
mitmproxy_sync_routes() {
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
