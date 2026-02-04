#!/bin/sh
# Cloudflare DNS Provider Adapter
# Requires: api_token, zone_id

CF_API_BASE="https://api.cloudflare.com/client/v4"

_cf_request() {
	local method="$1" path="$2" body="$3"
	local api_token=$(uci -q get dns-provider.cloudflare.api_token)

	local curl_args="-s -X $method"
	curl_args="$curl_args -H 'Content-Type: application/json'"
	curl_args="$curl_args -H 'Authorization: Bearer $api_token'"

	if [ -n "$body" ]; then
		eval curl $curl_args -d "'$body'" "'${CF_API_BASE}${path}'" 2>/dev/null
	else
		eval curl $curl_args "'${CF_API_BASE}${path}'" 2>/dev/null
	fi
}

dns_list() {
	local zone="$1"
	local zone_id=$(uci -q get dns-provider.cloudflare.zone_id)
	_cf_request GET "/zones/${zone_id}/dns_records?per_page=100"
}

dns_add() {
	local zone="$1" type="$2" subdomain="$3" target="$4" ttl="${5:-1}"
	local zone_id=$(uci -q get dns-provider.cloudflare.zone_id)

	local name="${subdomain}.${zone}"
	[ "$subdomain" = "@" ] && name="$zone"

	local body="{\"type\":\"${type}\",\"name\":\"${name}\",\"content\":\"${target}\",\"ttl\":${ttl},\"proxied\":false}"
	_cf_request POST "/zones/${zone_id}/dns_records" "$body"
}

dns_rm() {
	local zone="$1" type="$2" subdomain="$3"
	local zone_id=$(uci -q get dns-provider.cloudflare.zone_id)

	local name="${subdomain}.${zone}"
	[ "$subdomain" = "@" ] && name="$zone"

	# Find record ID
	local records=$(_cf_request GET "/zones/${zone_id}/dns_records?type=${type}&name=${name}")
	local record_id=$(echo "$records" | jsonfilter -e '@.result[0].id' 2>/dev/null)

	if [ -n "$record_id" ]; then
		_cf_request DELETE "/zones/${zone_id}/dns_records/${record_id}"
	else
		echo '{"success":false,"error":"Record not found"}'
	fi
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
	local result=$(_cf_request GET "/user/tokens/verify")
	if echo "$result" | jsonfilter -e '@.success' 2>/dev/null | grep -q "true"; then
		echo "ok"
	else
		echo "failed: $result"
	fi
}
