#!/bin/sh
# SecuBox VHost Manager - DNS Provider Adapter

# Create DNS A record for subdomain
dns_add_record() {
	local domain="$1"
	local ip="${2:-}"

	# Get public IP if not specified
	if [ -z "$ip" ]; then
		ip=$(curl -s --connect-timeout 5 https://ipv4.icanhazip.com 2>/dev/null | tr -d '\n')
	fi

	[ -z "$ip" ] && return 1

	# Extract subdomain and zone
	local zone=$(uci -q get dns-provider.main.zone)
	[ -z "$zone" ] && return 1

	local subdomain=$(echo "$domain" | sed "s/\\.${zone}$//")

	# Use dnsctl to add record
	if command -v dnsctl >/dev/null 2>&1; then
		dnsctl add A "$subdomain" "$ip" 300 2>/dev/null
		return $?
	fi

	return 1
}

# Remove DNS A record
dns_remove_record() {
	local domain="$1"

	local zone=$(uci -q get dns-provider.main.zone)
	[ -z "$zone" ] && return 1

	local subdomain=$(echo "$domain" | sed "s/\\.${zone}$//")

	if command -v dnsctl >/dev/null 2>&1; then
		dnsctl rm A "$subdomain" 2>/dev/null
		return $?
	fi

	return 1
}

# Verify DNS resolution
dns_verify() {
	local domain="$1"
	local expected_ip="$2"

	local resolved=$(nslookup "$domain" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}')

	[ "$resolved" = "$expected_ip" ] && return 0
	return 1
}

# Get current zone
dns_get_zone() {
	uci -q get dns-provider.main.zone
}
