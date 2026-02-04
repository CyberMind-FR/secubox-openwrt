#!/bin/sh
# Gandi LiveDNS v5 Provider Adapter
# Requires: api_key (Personal Access Token or API Key)

GANDI_API_BASE="https://api.gandi.net"

_gandi_request() {
	local method="$1" path="$2" body="$3"
	local api_key=$(uci -q get dns-provider.gandi.api_key)

	local curl_args="-s -X $method"
	curl_args="$curl_args -H 'Content-Type: application/json'"
	curl_args="$curl_args -H 'Authorization: Bearer $api_key'"

	if [ -n "$body" ]; then
		eval curl $curl_args -d "'$body'" "'${GANDI_API_BASE}${path}'" 2>/dev/null
	else
		eval curl $curl_args "'${GANDI_API_BASE}${path}'" 2>/dev/null
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
