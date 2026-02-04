#!/bin/sh
# OVH DNS Provider Adapter
# Uses OVH API v1 with HMAC-SHA1 signed requests
# Requires: app_key, app_secret, consumer_key

OVH_API_BASE=""

_ovh_init() {
	local endpoint=$(uci -q get dns-provider.ovh.endpoint)
	case "${endpoint:-ovh-eu}" in
		ovh-eu)  OVH_API_BASE="https://eu.api.ovh.com/1.0" ;;
		ovh-ca)  OVH_API_BASE="https://ca.api.ovh.com/1.0" ;;
		ovh-us)  OVH_API_BASE="https://api.us.ovhcloud.com/1.0" ;;
		*)       OVH_API_BASE="https://eu.api.ovh.com/1.0" ;;
	esac
}

_ovh_sign() {
	local method="$1" url="$2" body="$3" timestamp="$4"
	local app_secret=$(uci -q get dns-provider.ovh.app_secret)
	local consumer_key=$(uci -q get dns-provider.ovh.consumer_key)
	local to_sign="${app_secret}+${consumer_key}+${method}+${url}+${body}+${timestamp}"
	echo "\$1\$$(echo -n "$to_sign" | openssl dgst -sha1 -hex | awk '{print $NF}')"
}

_ovh_request() {
	local method="$1" path="$2" body="$3"
	local app_key=$(uci -q get dns-provider.ovh.app_key)
	local consumer_key=$(uci -q get dns-provider.ovh.consumer_key)

	_ovh_init

	local url="${OVH_API_BASE}${path}"
	local timestamp=$(curl -s "${OVH_API_BASE}/auth/time" 2>/dev/null)
	[ -z "$timestamp" ] && timestamp=$(date +%s)

	local signature=$(_ovh_sign "$method" "$url" "$body" "$timestamp")

	local curl_args="-s -X $method"
	curl_args="$curl_args -H 'Content-Type: application/json'"
	curl_args="$curl_args -H 'X-Ovh-Application: $app_key'"
	curl_args="$curl_args -H 'X-Ovh-Consumer: $consumer_key'"
	curl_args="$curl_args -H 'X-Ovh-Timestamp: $timestamp'"
	curl_args="$curl_args -H 'X-Ovh-Signature: $signature'"

	if [ -n "$body" ]; then
		eval curl $curl_args -d "'$body'" "'$url'" 2>/dev/null
	else
		eval curl $curl_args "'$url'" 2>/dev/null
	fi
}

dns_list() {
	local zone="$1"
	local record_ids=$(_ovh_request GET "/domain/zone/${zone}/record")

	# record_ids is a JSON array of IDs, fetch each
	echo "$record_ids" | tr -d '[]' | tr ',' '\n' | while read -r rid; do
		[ -z "$rid" ] && continue
		_ovh_request GET "/domain/zone/${zone}/record/${rid}"
		echo ""
	done
}

dns_add() {
	local zone="$1" type="$2" subdomain="$3" target="$4" ttl="${5:-3600}"
	local body="{\"fieldType\":\"${type}\",\"subDomain\":\"${subdomain}\",\"target\":\"${target}\",\"ttl\":${ttl}}"
	_ovh_request POST "/domain/zone/${zone}/record" "$body"
	# Refresh zone
	_ovh_request POST "/domain/zone/${zone}/refresh" ""
}

dns_rm() {
	local zone="$1" type="$2" subdomain="$3"
	# Find record ID by type and subdomain
	local ids=$(_ovh_request GET "/domain/zone/${zone}/record?fieldType=${type}&subDomain=${subdomain}")
	echo "$ids" | tr -d '[]' | tr ',' '\n' | while read -r rid; do
		[ -z "$rid" ] && continue
		_ovh_request DELETE "/domain/zone/${zone}/record/${rid}"
	done
	_ovh_request POST "/domain/zone/${zone}/refresh" ""
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
	_ovh_init
	local result=$(_ovh_request GET "/auth/currentCredential")
	if echo "$result" | grep -q "credentialId"; then
		echo "ok"
	else
		echo "failed: $result"
	fi
}
