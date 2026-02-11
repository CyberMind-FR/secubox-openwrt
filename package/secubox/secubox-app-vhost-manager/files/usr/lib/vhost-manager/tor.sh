#!/bin/sh
# SecuBox VHost Manager - Tor Hidden Service Adapter

# Create Tor hidden service
tor_add_service() {
	local service="$1"
	local port="$2"
	local vport="${3:-$port}"

	if command -v torctl >/dev/null 2>&1; then
		torctl hidden add "$service" "$port" "$vport" 2>/dev/null
		return $?
	fi

	# Fallback: direct UCI manipulation
	local section="hs_${service}"
	uci set tor-shield.$section=hidden_service
	uci set tor-shield.$section.name="$service"
	uci set tor-shield.$section.local_port="$port"
	uci set tor-shield.$section.virtual_port="$vport"
	uci set tor-shield.$section.enabled='1'
	uci commit tor-shield

	# Restart Tor to generate onion address
	/etc/init.d/tor restart 2>/dev/null &

	return 0
}

# Remove Tor hidden service
tor_remove_service() {
	local service="$1"

	if command -v torctl >/dev/null 2>&1; then
		torctl hidden remove "$service" 2>/dev/null
		return $?
	fi

	uci delete tor-shield.hs_${service} 2>/dev/null
	uci commit tor-shield
	return 0
}

# Get onion address for service
tor_get_onion() {
	local service="$1"
	local onion_file="/var/lib/tor/hidden_service_${service}/hostname"

	[ -f "$onion_file" ] && cat "$onion_file" | tr -d '\n'
}

# Check if Tor is available and running
tor_is_available() {
	command -v torctl >/dev/null 2>&1 || return 1
	pgrep tor >/dev/null 2>&1 || return 1
	return 0
}

# Wait for onion address generation (max 10 seconds)
tor_wait_for_onion() {
	local service="$1"
	local timeout="${2:-10}"
	local count=0

	while [ $count -lt $timeout ]; do
		local onion=$(tor_get_onion "$service")
		[ -n "$onion" ] && { echo "$onion"; return 0; }
		sleep 1
		count=$((count + 1))
	done

	return 1
}
