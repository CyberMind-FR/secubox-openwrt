#!/bin/sh
# SecuBox SMTP Relay - Shared Mail Library
# Source this file to use send_mail() in any SecuBox app
#
# Usage:
#   . /usr/lib/secubox/mail/smtp-relay.sh
#   send_mail "user@example.com" "Subject" "Body text"
#   send_html_mail "user@example.com" "Subject" "<h1>HTML Body</h1>"

. /lib/functions.sh

SMTP_CONFIG="smtp-relay"

# Global variables set by smtp_relay_load_config
smtp_enabled=""
smtp_mode=""
smtp_server=""
smtp_port=""
smtp_tls=""
smtp_ssl=""
smtp_auth=""
smtp_user=""
smtp_password=""
smtp_from=""
smtp_from_name=""
smtp_admin=""
smtp_helo=""

# Load SMTP configuration from UCI
smtp_relay_load_config() {
	config_load "$SMTP_CONFIG"

	config_get smtp_enabled main enabled '0'
	config_get smtp_mode main mode 'external'
	config_get auto_detect main auto_detect '1'

	# Auto-detect local mailserver if enabled
	if [ "$auto_detect" = "1" ] && [ "$smtp_mode" = "external" ]; then
		local mailserver_enabled mailserver_ip
		mailserver_enabled=$(uci -q get mailserver.main.enabled)
		mailserver_ip=$(uci -q get mailserver.server.ip_address)
		[ -z "$mailserver_ip" ] && mailserver_ip=$(uci -q get mailserver.main.ip_address)
		[ -z "$mailserver_ip" ] && mailserver_ip="127.0.0.1"

		if [ "$mailserver_enabled" = "1" ]; then
			# Check if mailserver is responsive on SMTP port
			if nc -z "$mailserver_ip" 25 2>/dev/null; then
				smtp_mode="local"
			fi
		fi
	fi

	# Load mode-specific settings
	case "$smtp_mode" in
		external)
			config_get smtp_server external server ''
			config_get smtp_port external port '587'
			config_get smtp_tls external tls '1'
			config_get smtp_ssl external ssl '0'
			config_get smtp_auth external auth '1'
			config_get smtp_user external user ''
			config_get smtp_password external password ''
			config_get smtp_from external from ''
			config_get smtp_from_name external from_name 'SecuBox'
			;;
		local)
			config_get smtp_server local server '127.0.0.1'
			config_get smtp_port local port '25'
			config_get smtp_tls local tls '0'
			config_get smtp_ssl local ssl '0'
			config_get smtp_auth local auth '0'
			config_get smtp_user local user ''
			config_get smtp_password local password ''
			config_get smtp_from local from ''
			smtp_from_name="SecuBox"
			;;
		direct)
			smtp_server=""
			smtp_port="25"
			smtp_tls="0"
			smtp_ssl="0"
			smtp_auth="0"
			config_get smtp_helo direct helo_domain ''
			;;
	esac

	# Load default recipients
	config_get smtp_admin recipients admin ''
}

# Build msmtp configuration file
# Arguments: $1 - output file path (optional)
# Returns: path to temp config file
smtp_relay_build_msmtp_config() {
	local conf_file="${1:-/tmp/msmtp-relay-$$.conf}"
	local hostname
	hostname=$(uci -q get system.@system[0].hostname || hostname)

	local tls_mode="off"
	local tls_starttls="off"

	if [ "$smtp_ssl" = "1" ]; then
		tls_mode="on"
		tls_starttls="off"
	elif [ "$smtp_tls" = "1" ]; then
		tls_mode="on"
		tls_starttls="on"
	fi

	cat > "$conf_file" << EOF
account default
host ${smtp_server}
port ${smtp_port}
auth $([ "$smtp_auth" = "1" ] && echo "on" || echo "off")
user ${smtp_user}
password ${smtp_password}
tls ${tls_mode}
tls_starttls ${tls_starttls}
tls_certcheck off
from ${smtp_from:-secubox@$hostname}
EOF
	chmod 600 "$conf_file"
	echo "$conf_file"
}

# Send email via SMTP relay
# Arguments:
#   $1 - recipient email
#   $2 - subject
#   $3 - body (plain text or HTML)
#   $4 - content type (optional: "text/plain" or "text/html", default: auto-detect)
# Returns: 0 on success, 1 on failure
send_mail() {
	local recipient="$1"
	local subject="$2"
	local body="$3"
	local content_type="${4:-}"

	# Load configuration
	smtp_relay_load_config

	[ "$smtp_enabled" != "1" ] && {
		echo "ERROR: SMTP relay is disabled" >&2
		return 1
	}

	# Use admin email if no recipient specified
	[ -z "$recipient" ] && recipient="$smtp_admin"

	[ -z "$recipient" ] && {
		echo "ERROR: No recipient specified" >&2
		return 1
	}

	local hostname
	hostname=$(uci -q get system.@system[0].hostname || hostname)
	local from_addr="${smtp_from:-secubox@$hostname}"
	local from_header="${smtp_from_name} <${from_addr}>"

	# Auto-detect content type from body
	if [ -z "$content_type" ]; then
		if echo "$body" | grep -qE '<html|<body|<div|<p>|<h[1-6]>|<table'; then
			content_type="text/html"
		else
			content_type="text/plain"
		fi
	fi

	# Build email headers
	local date_rfc
	date_rfc=$(date -R 2>/dev/null || date)

	local email_content
	email_content="Date: ${date_rfc}
From: ${from_header}
To: ${recipient}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: ${content_type}; charset=utf-8
X-Mailer: SecuBox SMTP Relay 1.0

${body}"

	# Try msmtp first (for external and local modes)
	if command -v msmtp >/dev/null 2>&1 && [ "$smtp_mode" != "direct" ]; then
		local msmtp_conf
		msmtp_conf=$(smtp_relay_build_msmtp_config)
		echo "$email_content" | msmtp -C "$msmtp_conf" "$recipient" 2>&1
		local result=$?
		rm -f "$msmtp_conf"
		return $result
	fi

	# Fallback to sendmail (for direct mode or if msmtp unavailable)
	if command -v sendmail >/dev/null 2>&1; then
		echo "$email_content" | sendmail -t 2>&1
		return $?
	fi

	echo "ERROR: No mail transport available (msmtp or sendmail required)" >&2
	return 1
}

# Send HTML email (convenience wrapper)
send_html_mail() {
	send_mail "$1" "$2" "$3" "text/html"
}

# Send plain text email (convenience wrapper)
send_text_mail() {
	send_mail "$1" "$2" "$3" "text/plain"
}

# Test SMTP configuration by sending a test email
# Arguments: $1 - recipient (optional, uses admin if not specified)
# Returns: 0 on success, 1 on failure
smtp_relay_test() {
	local recipient="${1:-}"

	smtp_relay_load_config

	[ -z "$recipient" ] && recipient="$smtp_admin"
	[ -z "$recipient" ] && {
		echo "ERROR: No test recipient available (set admin email in config)" >&2
		return 1
	}

	local hostname
	hostname=$(uci -q get system.@system[0].hostname || hostname)

	local test_body="This is a test email from SecuBox SMTP Relay.

Hostname: ${hostname}
Mode: ${smtp_mode}
Server: ${smtp_server:-direct delivery}
Port: ${smtp_port}
TLS: $([ "$smtp_tls" = "1" ] && echo "Yes" || echo "No")
Time: $(date)

If you received this message, your SMTP configuration is working correctly."

	send_mail "$recipient" "[SecuBox] SMTP Test - $hostname" "$test_body"
}

# Get SMTP relay status as JSON
smtp_relay_status() {
	smtp_relay_load_config

	local mailserver_detected="false"
	local mailserver_ip
	mailserver_ip=$(uci -q get mailserver.server.ip_address)
	[ -z "$mailserver_ip" ] && mailserver_ip=$(uci -q get mailserver.main.ip_address)

	if [ -n "$mailserver_ip" ] && nc -z "$mailserver_ip" 25 2>/dev/null; then
		mailserver_detected="true"
	fi

	local msmtp_available="false"
	local sendmail_available="false"
	command -v msmtp >/dev/null 2>&1 && msmtp_available="true"
	command -v sendmail >/dev/null 2>&1 && sendmail_available="true"

	cat << EOF
{
  "enabled": $([ "$smtp_enabled" = "1" ] && echo "true" || echo "false"),
  "mode": "${smtp_mode}",
  "server": "${smtp_server:-}",
  "port": ${smtp_port:-587},
  "tls": $([ "$smtp_tls" = "1" ] && echo "true" || echo "false"),
  "ssl": $([ "$smtp_ssl" = "1" ] && echo "true" || echo "false"),
  "auth": $([ "$smtp_auth" = "1" ] && echo "true" || echo "false"),
  "from": "${smtp_from:-}",
  "from_name": "${smtp_from_name:-SecuBox}",
  "admin_recipient": "${smtp_admin:-}",
  "local_mailserver_detected": ${mailserver_detected},
  "msmtp_available": ${msmtp_available},
  "sendmail_available": ${sendmail_available}
}
EOF
}
