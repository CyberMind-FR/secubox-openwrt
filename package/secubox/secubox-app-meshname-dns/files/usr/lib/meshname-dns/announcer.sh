#!/bin/sh
# SPDX-License-Identifier: MIT
# Meshname DNS Announcer - Service announcement functions
#
# This file is sourced by meshnamectl

# Announce a service to the mesh
# Usage: announce_service <name> <port> <type>
announce_service() {
	local name="$1"
	local port="${2:-0}"
	local type="${3:-http}"

	local ygg_ipv6=$(get_ygg_ipv6)
	[ -z "$ygg_ipv6" ] && return 1

	local fqdn="${name}.ygg"
	local timestamp=$(date +%s)

	# Store in local registry
	local entry="{\"name\":\"$name\",\"fqdn\":\"$fqdn\",\"ipv6\":\"$ygg_ipv6\",\"port\":$port,\"type\":\"$type\",\"timestamp\":$timestamp}"

	# Update local file
	if [ -f "$LOCAL_FILE" ] && [ -s "$LOCAL_FILE" ] && [ "$(cat "$LOCAL_FILE")" != "{}" ]; then
		sed -i "s/^{/{\"$name\":$entry,/" "$LOCAL_FILE"
	else
		echo "{\"$name\":$entry}" > "$LOCAL_FILE"
	fi

	# Update hosts
	update_hosts_entry "$fqdn" "$ygg_ipv6"

	# Gossip broadcast
	if [ "$gossip_enabled" = "1" ]; then
		broadcast_announce "$name" "$fqdn" "$ygg_ipv6" "$port"
	fi

	logger -t meshname-dns "Announced: $fqdn -> $ygg_ipv6"
	return 0
}

# Revoke a service announcement
# Usage: revoke_service <name>
revoke_service() {
	local name="$1"
	local fqdn="${name}.ygg"

	# Remove from local registry
	if [ -f "$LOCAL_FILE" ]; then
		python3 -c "
import json, sys
name = sys.argv[1]
try:
    with open('$LOCAL_FILE') as f:
        data = json.load(f)
    if name in data:
        del data[name]
        with open('$LOCAL_FILE', 'w') as f:
            json.dump(data, f, indent=2)
except:
    pass
" "$name"
	fi

	# Remove from hosts
	remove_hosts_entry "$fqdn"

	# Gossip revocation
	if [ "$gossip_enabled" = "1" ]; then
		broadcast_revoke "$name" "$fqdn"
	fi

	logger -t meshname-dns "Revoked: $fqdn"
	return 0
}

# Re-announce all local services (used during sync)
reannounce_all() {
	[ -f "$LOCAL_FILE" ] || return 0

	local ygg_ipv6=$(get_ygg_ipv6)
	[ -z "$ygg_ipv6" ] && return 1

	python3 -c "
import json
try:
    with open('$LOCAL_FILE') as f:
        data = json.load(f)
    for name, info in data.items():
        print(f\"{name}|{info['fqdn']}|{info.get('port', 0)}\")
except:
    pass
" | while IFS='|' read -r name fqdn port; do
		[ -n "$name" ] && {
			broadcast_announce "$name" "$fqdn" "$ygg_ipv6" "$port"
			logger -t meshname-dns "Re-announced: $fqdn"
		}
	done
}

# Auto-announce services from exposure registry
auto_announce_exposed() {
	# Check exposure registry for local services
	local exposure_file="/var/lib/secubox/exposure/services.json"
	[ -f "$exposure_file" ] || return 0

	local ygg_ipv6=$(get_ygg_ipv6)
	[ -z "$ygg_ipv6" ] && return 0

	python3 -c "
import json
try:
    with open('$exposure_file') as f:
        services = json.load(f)
    for svc in services:
        if svc.get('mesh_enabled'):
            name = svc.get('name', '').replace('.', '-')
            port = svc.get('port', 0)
            if name:
                print(f'{name}|{port}')
except:
    pass
" | while IFS='|' read -r name port; do
		[ -n "$name" ] && announce_service "$name" "$port" "exposed"
	done
}
