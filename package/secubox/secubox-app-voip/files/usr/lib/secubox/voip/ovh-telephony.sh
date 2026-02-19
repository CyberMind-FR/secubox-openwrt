#!/bin/sh
# OVH Telephony API client for SecuBox VoIP
# Handles SIP trunk provisioning and SMS gateway

# API endpoints
OVH_ENDPOINTS="
ovh-eu=https://eu.api.ovh.com/1.0
ovh-ca=https://ca.api.ovh.com/1.0
ovh-us=https://api.us.ovhcloud.com/1.0
"

# Get endpoint URL
_ovh_endpoint_url() {
	local endpoint="$1"
	echo "$OVH_ENDPOINTS" | grep "^${endpoint}=" | cut -d= -f2
}

# Initialize OVH API
ovh_init() {
	OVH_APP_KEY=$(uci -q get voip.ovh_telephony.app_key)
	OVH_APP_SECRET=$(uci -q get voip.ovh_telephony.app_secret)
	OVH_CONSUMER_KEY=$(uci -q get voip.ovh_telephony.consumer_key)
	OVH_ENDPOINT=$(uci -q get voip.ovh_telephony.endpoint || echo "ovh-eu")
	OVH_API_URL=$(_ovh_endpoint_url "$OVH_ENDPOINT")

	if [ -z "$OVH_APP_KEY" ] || [ -z "$OVH_APP_SECRET" ] || [ -z "$OVH_CONSUMER_KEY" ]; then
		echo "OVH API credentials not configured" >&2
		return 1
	fi

	if [ -z "$OVH_API_URL" ]; then
		echo "Invalid OVH endpoint: $OVH_ENDPOINT" >&2
		return 1
	fi

	return 0
}

# Generate OVH API signature
_ovh_sign() {
	local method="$1"
	local url="$2"
	local body="$3"
	local timestamp="$4"

	# Signature = SHA1(APP_SECRET + CONSUMER_KEY + METHOD + URL + BODY + TIMESTAMP)
	local to_sign="${OVH_APP_SECRET}+${OVH_CONSUMER_KEY}+${method}+${url}+${body}+${timestamp}"
	local signature=$(echo -n "$to_sign" | openssl dgst -sha1 -hex 2>/dev/null | awk '{print $2}')

	echo "\$1\$${signature}"
}

# Make OVH API request
_ovh_request() {
	local method="$1"
	local path="$2"
	local body="$3"

	local url="${OVH_API_URL}${path}"
	local timestamp=$(curl -s "${OVH_API_URL}/auth/time")
	local signature=$(_ovh_sign "$method" "$url" "$body" "$timestamp")

	local curl_opts="-s"
	curl_opts="$curl_opts -H 'X-Ovh-Application: ${OVH_APP_KEY}'"
	curl_opts="$curl_opts -H 'X-Ovh-Consumer: ${OVH_CONSUMER_KEY}'"
	curl_opts="$curl_opts -H 'X-Ovh-Timestamp: ${timestamp}'"
	curl_opts="$curl_opts -H 'X-Ovh-Signature: ${signature}'"
	curl_opts="$curl_opts -H 'Content-Type: application/json'"

	case "$method" in
		GET)
			eval curl $curl_opts "$url"
			;;
		POST)
			eval curl $curl_opts -X POST -d "'$body'" "$url"
			;;
		PUT)
			eval curl $curl_opts -X PUT -d "'$body'" "$url"
			;;
		DELETE)
			eval curl $curl_opts -X DELETE "$url"
			;;
	esac
}

# ---------- Telephony API ----------

# Get all billing accounts
ovh_get_billing_accounts() {
	_ovh_request GET "/telephony"
}

# Get SIP lines for a billing account
ovh_get_lines() {
	local billing_account="$1"
	_ovh_request GET "/telephony/${billing_account}/line"
}

# Get SIP line details
ovh_get_line_info() {
	local billing_account="$1"
	local service_name="$2"
	_ovh_request GET "/telephony/${billing_account}/line/${service_name}"
}

# Get SIP accounts for a line
ovh_get_sip_accounts() {
	local billing_account="$1"
	local service_name="$2"
	_ovh_request GET "/telephony/${billing_account}/line/${service_name}/sipAccounts"
}

# Get SIP account credentials
ovh_get_sip_info() {
	local billing_account="$1"
	local service_name="$2"
	local sip_account="$3"

	if [ -z "$sip_account" ]; then
		# Get first SIP account
		local accounts=$(ovh_get_sip_accounts "$billing_account" "$service_name")
		sip_account=$(echo "$accounts" | jsonfilter -e '@[0]' 2>/dev/null)
	fi

	_ovh_request GET "/telephony/${billing_account}/line/${service_name}/sipAccounts/${sip_account}"
}

# Reset SIP password
ovh_reset_sip_password() {
	local billing_account="$1"
	local service_name="$2"
	local sip_account="$3"

	_ovh_request POST "/telephony/${billing_account}/line/${service_name}/sipAccounts/${sip_account}/resetPassword" "{}"
}

# Get voicemail settings
ovh_get_voicemail() {
	local billing_account="$1"
	local service_name="$2"
	_ovh_request GET "/telephony/${billing_account}/voicemail/${service_name}"
}

# Get call history
ovh_get_calls() {
	local billing_account="$1"
	local service_name="$2"
	_ovh_request GET "/telephony/${billing_account}/service/${service_name}/eventToken"
}

# ---------- SMS API ----------

# Get SMS accounts
ovh_get_sms_accounts() {
	_ovh_request GET "/sms"
}

# Get SMS account info
ovh_get_sms_info() {
	local service_name="$1"
	_ovh_request GET "/sms/${service_name}"
}

# Send SMS
ovh_send_sms() {
	local service_name="$1"
	local sender="$2"
	local receiver="$3"
	local message="$4"

	local body=$(cat <<EOF
{
  "charset": "UTF-8",
  "class": "phoneDisplay",
  "coding": "7bit",
  "message": "$message",
  "noStopClause": false,
  "priority": "high",
  "receivers": ["$receiver"],
  "sender": "$sender",
  "validityPeriod": 2880
}
EOF
)
	_ovh_request POST "/sms/${service_name}/jobs" "$body"
}

# Get incoming SMS
ovh_get_incoming_sms() {
	local service_name="$1"
	_ovh_request GET "/sms/${service_name}/incoming"
}

# Get specific incoming SMS
ovh_get_sms_message() {
	local service_name="$1"
	local sms_id="$2"
	_ovh_request GET "/sms/${service_name}/incoming/${sms_id}"
}

# ---------- Helper functions ----------

# Auto-provision OVH trunk to Asterisk
ovh_provision_trunk() {
	ovh_init || return 1

	local billing_account=$(uci -q get voip.ovh_telephony.billing_account)
	local service_name=$(uci -q get voip.ovh_telephony.service_name)

	# If not configured, get first available
	if [ -z "$billing_account" ]; then
		billing_account=$(ovh_get_billing_accounts | jsonfilter -e '@[0]' 2>/dev/null)
		[ -z "$billing_account" ] && {
			echo "No OVH billing accounts found" >&2
			return 1
		}
		uci set voip.ovh_telephony.billing_account="$billing_account"
	fi

	if [ -z "$service_name" ]; then
		service_name=$(ovh_get_lines "$billing_account" | jsonfilter -e '@[0]' 2>/dev/null)
		[ -z "$service_name" ] && {
			echo "No OVH SIP lines found" >&2
			return 1
		}
		uci set voip.ovh_telephony.service_name="$service_name"
	fi

	# Get SIP credentials
	local sip_info=$(ovh_get_sip_info "$billing_account" "$service_name")

	local sip_username=$(echo "$sip_info" | jsonfilter -e '@.username' 2>/dev/null)
	local sip_domain=$(echo "$sip_info" | jsonfilter -e '@.domain' 2>/dev/null)

	if [ -z "$sip_username" ] || [ -z "$sip_domain" ]; then
		echo "Failed to get SIP credentials" >&2
		return 1
	fi

	# Reset password to get new one
	local new_pass_info=$(ovh_reset_sip_password "$billing_account" "$service_name" "$sip_username")
	local sip_password=$(echo "$new_pass_info" | jsonfilter -e '@.password' 2>/dev/null)

	if [ -z "$sip_password" ]; then
		echo "Failed to get SIP password" >&2
		return 1
	fi

	# Save to UCI
	uci set voip.sip_trunk.enabled='1'
	uci set voip.sip_trunk.provider='ovh'
	uci set voip.sip_trunk.host="$sip_domain"
	uci set voip.sip_trunk.username="$sip_username"
	uci set voip.sip_trunk.password="$sip_password"
	uci commit voip

	# Generate Asterisk trunk config
	local trunk_conf="/srv/lxc/voip/rootfs/etc/asterisk/pjsip_trunk.conf"
	cat > "$trunk_conf" <<EOF
; OVH SIP Trunk - Auto-provisioned
; Billing Account: $billing_account
; Service: $service_name

[ovh-trunk]
type=registration
outbound_auth=ovh-auth
server_uri=sip:${sip_domain}
client_uri=sip:${sip_username}@${sip_domain}
retry_interval=60
expiration=3600

[ovh-auth]
type=auth
auth_type=userpass
username=${sip_username}
password=${sip_password}

[ovh-endpoint]
type=endpoint
context=from-trunk
disallow=all
allow=ulaw,alaw,g729
outbound_auth=ovh-auth
aors=ovh-aor
from_user=${sip_username}
direct_media=no
rtp_symmetric=yes
force_rport=yes
rewrite_contact=yes

[ovh-aor]
type=aor
contact=sip:${sip_domain}
qualify_frequency=60
EOF

	# Include in main config
	echo '#include "pjsip_trunk.conf"' >> "/srv/lxc/voip/rootfs/etc/asterisk/pjsip.conf"

	echo "OVH trunk provisioned successfully"
	echo "  Username: $sip_username"
	echo "  Domain:   $sip_domain"
	echo "  Password: (saved to UCI)"

	return 0
}

# Test OVH credentials
ovh_test_credentials() {
	ovh_init || return 1

	local result=$(ovh_get_billing_accounts)
	if echo "$result" | grep -q "^\["; then
		echo "OVH credentials valid"
		echo "Billing accounts: $result"
		return 0
	else
		echo "OVH credentials invalid or error: $result" >&2
		return 1
	fi
}
