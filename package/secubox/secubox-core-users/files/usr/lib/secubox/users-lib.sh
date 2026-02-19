#!/bin/sh
# SecuBox Users Library
# Common functions for user management

# Service detection functions
service_nextcloud_running() {
	[ -x /usr/sbin/nextcloudctl ] && lxc-info -n nextcloud 2>/dev/null | grep -q "RUNNING"
}

service_peertube_running() {
	[ -x /usr/sbin/peertubectl ] && lxc-info -n peertube 2>/dev/null | grep -q "RUNNING"
}

service_matrix_running() {
	[ -x /usr/sbin/matrixctl ] && lxc-info -n matrix 2>/dev/null | grep -q "RUNNING"
}

service_jabber_running() {
	[ -x /usr/sbin/jabberctl ] && lxc-info -n jabber 2>/dev/null | grep -q "RUNNING"
}

service_email_running() {
	[ -x /usr/sbin/mailserverctl ] && lxc-info -n mailserver 2>/dev/null | grep -q "RUNNING"
}

# Get list of running services
get_running_services() {
	local services=""
	service_nextcloud_running && services="$services nextcloud"
	service_peertube_running && services="$services peertube"
	service_matrix_running && services="$services matrix"
	service_jabber_running && services="$services jabber"
	service_email_running && services="$services email"
	echo "$services" | xargs
}

# Validate username
validate_username() {
	local username="$1"
	# Alphanumeric, underscore, hyphen, 3-32 chars
	echo "$username" | grep -qE '^[a-zA-Z][a-zA-Z0-9_-]{2,31}$'
}

# Validate email
validate_email() {
	local email="$1"
	echo "$email" | grep -qE '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
}

# Generate secure password
generate_secure_password() {
	local length="${1:-16}"
	head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c "$length"
}
