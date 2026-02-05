#!/bin/sh
# SecuBox VHost Manager - HAProxy Adapter

. /usr/lib/vhost-manager/backends.sh

# Create HAProxy backend and vhost
haproxy_add_vhost() {
	local domain="$1"
	local service="$2"
	local host="$3"
	local port="$4"
	local ssl="${5:-1}"
	local acme="${6:-1}"

	local section=$(sanitize_section_name "$domain")
	local backend_name="backend_${service}"

	# Create backend if not exists
	if ! uci -q get haproxy.$backend_name >/dev/null 2>&1; then
		uci set haproxy.$backend_name=backend
		uci set haproxy.${backend_name}_srv=server
		uci set haproxy.${backend_name}_srv.backend="$backend_name"
		uci set haproxy.${backend_name}_srv.address="$host"
		uci set haproxy.${backend_name}_srv.port="$port"
		uci set haproxy.${backend_name}_srv.check='inter 10s'
	fi

	# Create vhost
	uci set haproxy.$section=vhost
	uci set haproxy.$section.domain="$domain"
	uci set haproxy.$section.backend="$backend_name"
	uci set haproxy.$section.enabled='1'
	uci set haproxy.$section.ssl="$ssl"
	uci set haproxy.$section.ssl_redirect="$ssl"
	uci set haproxy.$section.acme="$acme"

	uci commit haproxy
	return 0
}

# Remove HAProxy vhost
haproxy_remove_vhost() {
	local domain="$1"
	local section=$(sanitize_section_name "$domain")

	uci delete haproxy.$section 2>/dev/null
	uci commit haproxy
	return 0
}

# Enable/disable HAProxy vhost
haproxy_set_enabled() {
	local domain="$1"
	local enabled="$2"
	local section=$(sanitize_section_name "$domain")

	uci set haproxy.$section.enabled="$enabled"
	uci commit haproxy
	return 0
}

# Regenerate and reload HAProxy
haproxy_reload() {
	if command -v haproxyctl >/dev/null 2>&1; then
		haproxyctl generate 2>/dev/null
		haproxyctl reload 2>/dev/null
	fi
}

# Get vhost status from HAProxy
haproxy_get_status() {
	local domain="$1"
	local section=$(sanitize_section_name "$domain")

	local enabled=$(uci -q get haproxy.$section.enabled)
	local ssl=$(uci -q get haproxy.$section.ssl)
	local acme=$(uci -q get haproxy.$section.acme)

	printf '{"enabled":"%s","ssl":"%s","acme":"%s"}' \
		"${enabled:-0}" "${ssl:-0}" "${acme:-0}"
}
