#!/bin/sh
# SPDX-License-Identifier: MIT
# Meshname DNS Gossip Handler - Process incoming meshname_announce messages
#
# This file is called by mirrornet gossip when a meshname_announce message is received

MESHNAME_LIB="/usr/lib/meshname-dns"
STATE_DIR="/var/lib/meshname-dns"
DOMAINS_FILE="$STATE_DIR/domains.json"
HOSTS_FILE="/tmp/hosts/meshname"
LOG_TAG="meshname-dns"

# Source resolver functions
[ -f "$MESHNAME_LIB/resolver.sh" ] && . "$MESHNAME_LIB/resolver.sh"

# Initialize state
init_meshname_state() {
	mkdir -p "$STATE_DIR"
	mkdir -p "$(dirname "$HOSTS_FILE")"
	[ -f "$DOMAINS_FILE" ] || echo '{}' > "$DOMAINS_FILE"
	[ -f "$HOSTS_FILE" ] || touch "$HOSTS_FILE"
}

# Get local Yggdrasil IPv6
get_ygg_ipv6() {
	ip -6 addr show tun0 2>/dev/null | grep -oP '(?<=inet6 )2[0-9a-f:]+(?=/)' || \
	ip -6 addr show 2>/dev/null | grep -oP '(?<=inet6 )2[0-9a-f][0-9a-f]:[0-9a-f:]+(?=/)' | head -1
}

# Update hosts file entry
update_hosts_entry() {
	local fqdn="$1"
	local ipv6="$2"

	[ -z "$fqdn" ] || [ -z "$ipv6" ] && return 1

	sed -i "/ ${fqdn}$/d" "$HOSTS_FILE" 2>/dev/null
	echo "$ipv6 $fqdn" >> "$HOSTS_FILE"
	killall -HUP dnsmasq 2>/dev/null
}

# Remove hosts file entry
remove_hosts_entry() {
	local fqdn="$1"
	sed -i "/ ${fqdn}$/d" "$HOSTS_FILE" 2>/dev/null
	killall -HUP dnsmasq 2>/dev/null
}

# Handle incoming meshname_announce message
# Called by mirrornet gossip.sh when type="meshname_announce"
# Input: JSON message data (via stdin or argument)
handle_meshname_announce() {
	local message="$1"

	# If no argument, read from stdin
	[ -z "$message" ] && read -r message

	[ -z "$message" ] && return 1

	init_meshname_state

	# Parse message fields
	local name fqdn ipv6 port type origin

	name=$(echo "$message" | jsonfilter -e '@.name' 2>/dev/null)
	fqdn=$(echo "$message" | jsonfilter -e '@.fqdn' 2>/dev/null)
	ipv6=$(echo "$message" | jsonfilter -e '@.ipv6' 2>/dev/null)
	port=$(echo "$message" | jsonfilter -e '@.port' 2>/dev/null)
	type=$(echo "$message" | jsonfilter -e '@.type' 2>/dev/null)

	# Origin comes from the gossip envelope, not the data
	origin="${2:-unknown}"

	[ -z "$name" ] && {
		logger -t "$LOG_TAG" "Invalid meshname_announce: missing name"
		return 1
	}

	# Ensure fqdn
	[ -z "$fqdn" ] && fqdn="${name}.ygg"

	# Handle revocation
	if [ "$type" = "revoke" ] || [ -z "$ipv6" ]; then
		logger -t "$LOG_TAG" "Received revoke for $fqdn from $origin"

		# Remove from cache
		python3 -c "
import json, sys
name = sys.argv[1]
try:
    with open('$DOMAINS_FILE') as f:
        data = json.load(f)
    if name in data:
        del data[name]
        with open('$DOMAINS_FILE', 'w') as f:
            json.dump(data, f, indent=2)
except:
    pass
" "$name"

		remove_hosts_entry "$fqdn"
		return 0
	fi

	# Validate IPv6 address (must be Yggdrasil 200:/7 range)
	if ! echo "$ipv6" | grep -qE '^2[0-9a-f][0-9a-f]:'; then
		logger -t "$LOG_TAG" "Invalid Yggdrasil IPv6: $ipv6"
		return 1
	fi

	# Don't cache our own announcements
	local local_ipv6=$(get_ygg_ipv6)
	if [ "$ipv6" = "$local_ipv6" ]; then
		logger -t "$LOG_TAG" "Ignoring own announcement for $fqdn"
		return 0
	fi

	logger -t "$LOG_TAG" "Received announce: $fqdn -> $ipv6 from $origin"

	# Store in domains cache
	local timestamp=$(date +%s)
	python3 -c "
import json, sys
name, fqdn, ipv6, port, origin, ts = sys.argv[1:7]
try:
    with open('$DOMAINS_FILE') as f:
        data = json.load(f)
except:
    data = {}
data[name] = {
    'name': name,
    'fqdn': fqdn,
    'ipv6': ipv6,
    'port': int(port) if port else 0,
    'origin': origin,
    'cached_at': int(ts)
}
with open('$DOMAINS_FILE', 'w') as f:
    json.dump(data, f, indent=2)
" "$name" "$fqdn" "$ipv6" "${port:-0}" "$origin" "$timestamp"

	# Update hosts file
	update_hosts_entry "$fqdn" "$ipv6"

	logger -t "$LOG_TAG" "Cached: $fqdn -> $ipv6"
	return 0
}

# Main entry point for standalone testing
case "$1" in
	handle)
		shift
		handle_meshname_announce "$@"
		;;
	*)
		# Default: read message from stdin
		handle_meshname_announce
		;;
esac
