#!/bin/sh
# SecuBox Auth Hook - CGI endpoint for LuCI authentication with logging
# Copyright (C) 2024 CyberMind.fr
#
# This CGI script intercepts login attempts and logs failures with the real client IP
# Call via: POST /cgi-bin/secubox-auth-hook
#
# Request body: {"username":"...", "password":"..."}
# Special: If password is "__SECUBOX_LOG_FAILURE__", just log the failure (used by JS hook)
# Response: Same as ubus session.login

. /usr/share/libubox/jshn.sh

LOG_FILE="/var/log/secubox-auth.log"
LOG_TAG="secubox-auth"

# Get client IP from CGI environment
CLIENT_IP="${REMOTE_ADDR:-127.0.0.1}"

# Handle X-Forwarded-For if present (reverse proxy)
if [ -n "$HTTP_X_FORWARDED_FOR" ]; then
    CLIENT_IP="${HTTP_X_FORWARDED_FOR%%,*}"
fi

# Sanitize IP (remove IPv6 brackets if present)
CLIENT_IP=$(echo "$CLIENT_IP" | sed 's/^\[//;s/\]$//')

# Log authentication failure
log_failure() {
    local user="$1"
    local ts=$(date "+%b %d %H:%M:%S")
    local hostname=$(cat /proc/sys/kernel/hostname 2>/dev/null || echo "OpenWrt")

    # Ensure log file exists
    [ -f "$LOG_FILE" ] || { touch "$LOG_FILE"; chmod 644 "$LOG_FILE"; }

    # Log to dedicated file for CrowdSec
    echo "$ts $hostname $LOG_TAG[$$]: authentication failure for $user from $CLIENT_IP via luci" >> "$LOG_FILE"

    # Also log to syslog
    logger -t "$LOG_TAG" -p auth.warning "authentication failure for $user from $CLIENT_IP via luci"
}

# Output HTTP headers
echo "Content-Type: application/json"
echo ""

# Handle GET request (for IP detection only)
if [ "$REQUEST_METHOD" = "GET" ]; then
    json_init
    json_add_string ip "$CLIENT_IP"
    json_add_string method "GET"
    json_dump
    exit 0
fi

# Handle POST request (login attempt or log-only)
if [ "$REQUEST_METHOD" = "POST" ]; then
    # Read POST body
    read -r body

    # Parse JSON input
    json_load "$body" 2>/dev/null
    if [ $? -ne 0 ]; then
        json_init
        json_add_boolean success 0
        json_add_string error "Invalid JSON"
        json_dump
        exit 0
    fi

    json_get_var username username
    json_get_var password password

    # Validate input
    if [ -z "$username" ]; then
        json_init
        json_add_boolean success 0
        json_add_string error "Missing username"
        json_dump
        exit 0
    fi

    # Check if this is a log-only request from our JS hook
    if [ "$password" = "__SECUBOX_LOG_FAILURE__" ]; then
        # Just log the failure - don't attempt login
        log_failure "$username"
        json_init
        json_add_boolean success 1
        json_add_string message "Auth failure logged"
        json_add_string ip "$CLIENT_IP"
        json_add_string username "$username"
        json_dump
        exit 0
    fi

    # Normal login flow - validate password
    if [ -z "$password" ]; then
        json_init
        json_add_boolean success 0
        json_add_string error "Missing password"
        json_dump
        exit 0
    fi

    # Attempt login via ubus
    result=$(ubus call session login "{\"username\":\"$username\",\"password\":\"$password\"}" 2>&1)
    rc=$?

    # Check if login failed
    # ubus returns error code or empty session on failure
    if [ $rc -ne 0 ]; then
        # ubus call failed
        log_failure "$username"
        json_init
        json_add_boolean success 0
        json_add_string error "Authentication failed"
        json_add_string ip "$CLIENT_IP"
        json_dump
    elif echo "$result" | grep -q '"ubus_rpc_session": ""'; then
        # Empty session token = failed login
        log_failure "$username"
        json_init
        json_add_boolean success 0
        json_add_string error "Invalid credentials"
        json_add_string ip "$CLIENT_IP"
        json_dump
    else
        # Check if result contains valid session
        session=$(echo "$result" | jsonfilter -e '@.ubus_rpc_session' 2>/dev/null)
        if [ -z "$session" ] || [ "$session" = "null" ]; then
            log_failure "$username"
            json_init
            json_add_boolean success 0
            json_add_string error "Invalid credentials"
            json_add_string ip "$CLIENT_IP"
            json_dump
        else
            # Login successful - return the session info
            echo "$result"
        fi
    fi
    exit 0
fi

# Unsupported method
json_init
json_add_boolean success 0
json_add_string error "Unsupported method"
json_dump
