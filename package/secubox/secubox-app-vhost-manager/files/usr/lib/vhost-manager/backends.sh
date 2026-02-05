#!/bin/sh
# SecuBox VHost Manager - Backend Resolution Library
# Single source of truth for resolving backend addresses

# Resolve backend address from service/backend name
# Returns: "host:port" or empty string on failure
get_backend_address() {
	local service="$1"
	local backend_name="${2:-$service}"

	# Method 1: Check vhosts UCI (new canonical source)
	local host=$(uci -q get vhosts.$service.backend_host)
	local port=$(uci -q get vhosts.$service.backend_port)
	if [ -n "$host" ] && [ -n "$port" ]; then
		echo "$host:$port"
		return 0
	fi

	# Method 2: Check haproxy backend inline server field
	local server=$(uci -q get haproxy.$backend_name.server)
	if [ -n "$server" ]; then
		# Parse server spec: "name ip:port check [options]"
		local addr=$(echo "$server" | awk '{print $2}')
		if [ -n "$addr" ] && echo "$addr" | grep -q ':'; then
			echo "$addr"
			return 0
		fi
	fi

	# Method 3: Check haproxy separate server sections
	for srv in $(uci show haproxy 2>/dev/null | grep "=server$" | cut -d. -f2 | cut -d= -f1); do
		local srv_backend=$(uci -q get haproxy.$srv.backend)
		if [ "$srv_backend" = "$backend_name" ]; then
			local srv_addr=$(uci -q get haproxy.$srv.address)
			local srv_port=$(uci -q get haproxy.$srv.port)
			if [ -n "$srv_addr" ] && [ -n "$srv_port" ]; then
				echo "$srv_addr:$srv_port"
				return 0
			fi
		fi
	done

	return 1
}

# Validate backend is reachable (TCP check)
validate_backend() {
	local addr="$1"
	local host=$(echo "$addr" | cut -d: -f1)
	local port=$(echo "$addr" | cut -d: -f2)

	[ -z "$host" ] || [ -z "$port" ] && return 1

	# Try nc first, fall back to /dev/tcp
	if command -v nc >/dev/null 2>&1; then
		nc -z -w 2 "$host" "$port" 2>/dev/null && return 0
	fi

	# Fallback: check /proc/net/tcp for local ports
	if [ "$host" = "127.0.0.1" ] || [ "$host" = "localhost" ]; then
		local hex_port=$(printf "%04X" "$port")
		grep -q ":$hex_port " /proc/net/tcp 2>/dev/null && return 0
	fi

	return 1
}

# Get backend port from various sources
get_backend_port() {
	local service="$1"
	local addr=$(get_backend_address "$service")
	[ -n "$addr" ] && echo "$addr" | cut -d: -f2
}

# Get backend host from various sources
get_backend_host() {
	local service="$1"
	local addr=$(get_backend_address "$service")
	[ -n "$addr" ] && echo "$addr" | cut -d: -f1
}

# Sanitize domain name for use as UCI section name
sanitize_section_name() {
	echo "$1" | tr '.' '_' | tr '-' '_' | tr '[:upper:]' '[:lower:]'
}
