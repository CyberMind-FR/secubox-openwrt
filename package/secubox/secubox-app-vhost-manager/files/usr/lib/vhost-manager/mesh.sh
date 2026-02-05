#!/bin/sh
# SecuBox VHost Manager - Mesh P2P Adapter

# Publish service to mesh
mesh_publish() {
	local service="$1"
	local port="$2"
	local domain="${3:-}"

	if command -v secubox-p2p >/dev/null 2>&1; then
		if [ -n "$domain" ]; then
			secubox-p2p publish "$service" "$port" --domain "$domain" 2>/dev/null
		else
			secubox-p2p publish "$service" "$port" 2>/dev/null
		fi
		return $?
	fi

	return 1
}

# Unpublish service from mesh
mesh_unpublish() {
	local service="$1"

	if command -v secubox-p2p >/dev/null 2>&1; then
		secubox-p2p unpublish "$service" 2>/dev/null
		return $?
	fi

	return 1
}

# Check if service is published to mesh
mesh_is_published() {
	local service="$1"

	if command -v secubox-p2p >/dev/null 2>&1; then
		secubox-p2p status 2>/dev/null | grep -q "\"$service\""
		return $?
	fi

	return 1
}

# Check if mesh is available
mesh_is_available() {
	command -v secubox-p2p >/dev/null 2>&1 && return 0
	return 1
}
