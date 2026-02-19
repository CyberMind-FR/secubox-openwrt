#!/bin/sh
# OVH Telephony API helper functions
# Different from DNS API - uses /telephony endpoint

OVH_API_BASE=""

# Initialize OVH API based on endpoint
ovh_api_init() {
    local endpoint=$(uci -q get voip.ovh_telephony.endpoint)
    case "$endpoint" in
        ovh-eu|"") OVH_API_BASE="https://eu.api.ovh.com/1.0" ;;
        ovh-ca) OVH_API_BASE="https://ca.api.ovh.com/1.0" ;;
        ovh-us) OVH_API_BASE="https://api.us.ovhcloud.com/1.0" ;;
        *) OVH_API_BASE="https://eu.api.ovh.com/1.0" ;;
    esac
}

# Generate OVH API signature
ovh_sign() {
    local method="$1"
    local url="$2"
    local body="$3"
    local timestamp="$4"

    local app_secret=$(uci -q get voip.ovh_telephony.app_secret)
    local consumer_key=$(uci -q get voip.ovh_telephony.consumer_key)

    local to_sign="${app_secret}+${consumer_key}+${method}+${url}+${body}+${timestamp}"
    # Use openssl for SHA1 (sha1sum not available on OpenWrt)
    local hash=$(echo -n "$to_sign" | openssl dgst -sha1 2>/dev/null | sed 's/.*= //')
    echo "\$1\$${hash}"
}

# Make OVH API GET request
ovh_api_get() {
    local path="$1"
    
    ovh_api_init
    
    local app_key=$(uci -q get voip.ovh_telephony.app_key)
    local consumer_key=$(uci -q get voip.ovh_telephony.consumer_key)
    local url="${OVH_API_BASE}${path}"
    local timestamp=$(curl -s "${OVH_API_BASE}/auth/time")
    local signature=$(ovh_sign "GET" "$url" "" "$timestamp")
    
    curl -s \
        -H "X-Ovh-Application: $app_key" \
        -H "X-Ovh-Consumer: $consumer_key" \
        -H "X-Ovh-Timestamp: $timestamp" \
        -H "X-Ovh-Signature: $signature" \
        -H "Content-Type: application/json" \
        "$url"
}

# Make OVH API POST request
ovh_api_post() {
    local path="$1"
    local body="$2"
    
    ovh_api_init
    
    local app_key=$(uci -q get voip.ovh_telephony.app_key)
    local consumer_key=$(uci -q get voip.ovh_telephony.consumer_key)
    local url="${OVH_API_BASE}${path}"
    local timestamp=$(curl -s "${OVH_API_BASE}/auth/time")
    local signature=$(ovh_sign "POST" "$url" "$body" "$timestamp")
    
    curl -s \
        -X POST \
        -H "X-Ovh-Application: $app_key" \
        -H "X-Ovh-Consumer: $consumer_key" \
        -H "X-Ovh-Timestamp: $timestamp" \
        -H "X-Ovh-Signature: $signature" \
        -H "Content-Type: application/json" \
        -d "$body" \
        "$url"
}

# Get list of billing accounts
ovh_get_billing_accounts() {
    ovh_api_get "/telephony"
}

# Get SIP lines for a billing account
ovh_get_sip_lines() {
    local billing_account="$1"
    ovh_api_get "/telephony/$billing_account/line"
}

# Get SIP account credentials
ovh_get_sip_credentials() {
    local billing_account="$1"
    local service_name="$2"
    ovh_api_get "/telephony/$billing_account/line/$service_name/sipAccounts"
}

# Get line details
ovh_get_line_info() {
    local billing_account="$1"
    local service_name="$2"
    ovh_api_get "/telephony/$billing_account/line/$service_name"
}

# Get SMS accounts
ovh_get_sms_accounts() {
    ovh_api_get "/sms"
}

# Send SMS
ovh_send_sms() {
    local account="$1"
    local to="$2"
    local message="$3"
    local sender=$(uci -q get jabber.sms.sender)
    
    local body=$(cat <<JSONEOF
{
    "charset": "UTF-8",
    "class": "phoneDisplay",
    "coding": "7bit",
    "message": "$message",
    "noStopClause": true,
    "receivers": ["$to"],
    "sender": "$sender",
    "validityPeriod": 2880
}
JSONEOF
)
    
    ovh_api_post "/sms/$account/jobs" "$body"
}

# Get call history
ovh_get_call_history() {
    local billing_account="$1"
    local service_name="$2"
    ovh_api_get "/telephony/$billing_account/service/$service_name/voiceConsumption"
}
