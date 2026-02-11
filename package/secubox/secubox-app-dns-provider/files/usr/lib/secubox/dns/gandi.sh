#!/bin/sh
# Gandi LiveDNS v5 Provider Adapter
# API: https://api.gandi.net/v5/
# Requires: api_key (Personal Access Token)
# Optional: sharing_id (organization ID for filtering/billing)

GANDI_API_BASE="https://api.gandi.net"

_gandi_request() {
	local method="$1" path="$2" body="$3"
	local api_key=$(uci -q get dns-provider.gandi.api_key)
	local sharing_id=$(uci -q get dns-provider.gandi.sharing_id)

	[ -z "$api_key" ] && { echo '{"error":"No API key configured"}'; return 1; }

	# Build query string with sharing_id if set
	local query=""
	[ -n "$sharing_id" ] && query="?sharing_id=$sharing_id"

	local url="${GANDI_API_BASE}${path}${query}"

	if [ -n "$body" ]; then
		curl -s -X "$method" \
			-H "Content-Type: application/json" \
			-H "Authorization: Bearer $api_key" \
			-d "$body" "$url" 2>/dev/null
	else
		curl -s -X "$method" \
			-H "Content-Type: application/json" \
			-H "Authorization: Bearer $api_key" \
			"$url" 2>/dev/null
	fi
}

dns_list() {
	local zone="$1"
	_gandi_request GET "/v5/livedns/domains/${zone}/records"
}

dns_add() {
	local zone="$1" type="$2" subdomain="$3" target="$4" ttl="${5:-3600}"
	local body="{\"rrset_type\":\"${type}\",\"rrset_ttl\":${ttl},\"rrset_values\":[\"${target}\"]}"
	_gandi_request POST "/v5/livedns/domains/${zone}/records/${subdomain}/${type}" "$body"
}

dns_rm() {
	local zone="$1" type="$2" subdomain="$3"
	_gandi_request DELETE "/v5/livedns/domains/${zone}/records/${subdomain}/${type}"
}

dns_verify() {
	local fqdn="$1"
	local result=$(nslookup "$fqdn" 2>/dev/null | grep -A1 "Name:" | tail -1)
	if [ -n "$result" ]; then
		echo "resolved"
	else
		echo "not_resolved"
	fi
}

dns_test_credentials() {
	local result=$(_gandi_request GET "/v5/livedns/domains")
	if echo "$result" | grep -q "fqdn"; then
		echo "ok"
	else
		echo "failed: $result"
	fi
}

# Get current IP for a record
dns_get() {
	local zone="$1" type="$2" subdomain="$3"
	[ -z "$subdomain" ] && subdomain="@"
	_gandi_request GET "/v5/livedns/domains/${zone}/records/${subdomain}/${type}"
}

# Update existing record (PUT for DynDNS)
dns_update() {
	local zone="$1" type="$2" subdomain="$3" target="$4" ttl="${5:-300}"
	[ -z "$subdomain" ] && subdomain="@"
	local body="{\"rrset_ttl\":${ttl},\"rrset_values\":[\"${target}\"]}"
	_gandi_request PUT "/v5/livedns/domains/${zone}/records/${subdomain}/${type}" "$body"
}

# DynDNS: Update A record with current WAN IP
dns_dyndns() {
	local zone="$1" subdomain="${2:-@}" ttl="${3:-300}"

	# Get current WAN IP
	local wan_ip=$(curl -s https://api.ipify.org 2>/dev/null)
	[ -z "$wan_ip" ] && wan_ip=$(curl -s https://ifconfig.me 2>/dev/null)
	[ -z "$wan_ip" ] && { echo '{"error":"Cannot detect WAN IP"}'; return 1; }

	# Get current DNS value
	local current=$(dns_get "$zone" "A" "$subdomain" | jsonfilter -e '@.rrset_values[0]' 2>/dev/null)

	if [ "$current" = "$wan_ip" ]; then
		echo "{\"status\":\"unchanged\",\"ip\":\"$wan_ip\"}"
		return 0
	fi

	# Update record
	local result=$(dns_update "$zone" "A" "$subdomain" "$wan_ip" "$ttl")
	if echo "$result" | grep -q "error"; then
		echo "$result"
		return 1
	fi

	echo "{\"status\":\"updated\",\"old_ip\":\"$current\",\"new_ip\":\"$wan_ip\"}"
}

# List all domains in account
dns_domains() {
	_gandi_request GET "/v5/livedns/domains"
}

# Get zone info
dns_zone_info() {
	local zone="$1"
	_gandi_request GET "/v5/livedns/domains/${zone}"
}
