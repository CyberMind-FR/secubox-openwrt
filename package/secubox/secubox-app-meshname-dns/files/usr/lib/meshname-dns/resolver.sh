#!/bin/sh
# SPDX-License-Identifier: MIT
# Meshname DNS Resolver - Domain resolution functions
#
# This file is sourced by meshnamectl

# Resolve a .ygg domain to IPv6
# Usage: resolve_domain <domain>
# Returns: IPv6 address or empty string
resolve_domain() {
	local domain="$1"

	# Ensure .ygg suffix
	echo "$domain" | grep -q '\.ygg$' || domain="${domain}.ygg"

	# Check hosts file first (fastest)
	local ipv6=$(grep -w "$domain" "$HOSTS_FILE" 2>/dev/null | awk '{print $1}' | head -1)

	if [ -n "$ipv6" ]; then
		echo "$ipv6"
		return 0
	fi

	# Check local cache
	local name="${domain%.ygg}"
	if [ -f "$LOCAL_FILE" ]; then
		ipv6=$(python3 -c "
import json, sys
name = sys.argv[1]
try:
    with open('$LOCAL_FILE') as f:
        data = json.load(f)
    if name in data:
        print(data[name].get('ipv6', ''))
except:
    pass
" "$name")

		if [ -n "$ipv6" ]; then
			echo "$ipv6"
			return 0
		fi
	fi

	# Check remote domains cache
	if [ -f "$DOMAINS_FILE" ]; then
		ipv6=$(python3 -c "
import json, sys
name = sys.argv[1]
try:
    with open('$DOMAINS_FILE') as f:
        data = json.load(f)
    if name in data:
        print(data[name].get('ipv6', ''))
except:
    pass
" "$name")

		if [ -n "$ipv6" ]; then
			echo "$ipv6"
			return 0
		fi
	fi

	return 1
}

# Store a remote domain in cache
# Usage: cache_domain <name> <fqdn> <ipv6> <port> <origin>
cache_domain() {
	local name="$1"
	local fqdn="$2"
	local ipv6="$3"
	local port="${4:-0}"
	local origin="${5:-unknown}"

	[ -z "$name" ] || [ -z "$ipv6" ] && return 1

	# Don't cache local addresses
	local local_ipv6=$(get_ygg_ipv6)
	[ "$ipv6" = "$local_ipv6" ] && return 0

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
    'port': int(port),
    'origin': origin,
    'cached_at': int(ts)
}
with open('$DOMAINS_FILE', 'w') as f:
    json.dump(data, f, indent=2)
" "$name" "$fqdn" "$ipv6" "$port" "$origin" "$timestamp"

	# Update hosts file
	update_hosts_entry "$fqdn" "$ipv6"

	logger -t meshname-dns "Cached: $fqdn -> $ipv6 (from $origin)"
}

# Remove a domain from cache
# Usage: uncache_domain <name>
uncache_domain() {
	local name="$1"
	local fqdn="${name}.ygg"

	if [ -f "$DOMAINS_FILE" ]; then
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
	fi

	remove_hosts_entry "$fqdn"
	logger -t meshname-dns "Uncached: $fqdn"
}

# Clean expired entries from cache
# Usage: cleanup_cache [max_age_seconds]
cleanup_cache() {
	local max_age="${1:-86400}"  # Default 24 hours
	local current_time=$(date +%s)
	local cutoff=$((current_time - max_age))

	[ -f "$DOMAINS_FILE" ] || return 0

	python3 -c "
import json, sys
cutoff = int(sys.argv[1])
try:
    with open('$DOMAINS_FILE') as f:
        data = json.load(f)
    expired = []
    for name, info in data.items():
        if info.get('cached_at', 0) < cutoff:
            expired.append(name)
    for name in expired:
        del data[name]
        print(name)
    with open('$DOMAINS_FILE', 'w') as f:
        json.dump(data, f, indent=2)
except:
    pass
" "$cutoff" | while read -r name; do
		[ -n "$name" ] && {
			remove_hosts_entry "${name}.ygg"
			logger -t meshname-dns "Expired: ${name}.ygg"
		}
	done

	regenerate_hosts
}

# Get all cached domains
# Usage: list_cached_domains
# Output: JSON array
list_cached_domains() {
	if [ -f "$DOMAINS_FILE" ]; then
		cat "$DOMAINS_FILE"
	else
		echo '{}'
	fi
}

# Get domain count
count_cached_domains() {
	if [ -f "$DOMAINS_FILE" ] && [ -s "$DOMAINS_FILE" ]; then
		python3 -c "
import json
try:
    with open('$DOMAINS_FILE') as f:
        print(len(json.load(f)))
except:
    print(0)
"
	else
		echo 0
	fi
}
