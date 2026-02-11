#!/bin/sh
#
# IoT Guard - Core Functions Library
#
# Common functions used by IoT Guard components.
#

# Load UCI functions
. /lib/functions.sh

# ============================================================================
# Configuration Helpers
# ============================================================================

iot_guard_enabled() {
    local enabled
    config_load iot-guard
    config_get_bool enabled main enabled 0
    return $((1 - enabled))
}

get_config_value() {
    local section="$1"
    local option="$2"
    local default="$3"

    local value
    config_load iot-guard
    config_get value "$section" "$option" "$default"
    echo "$value"
}

# ============================================================================
# MAC Address Utilities
# ============================================================================

normalize_mac() {
    echo "$1" | tr '[:lower:]' '[:upper:]' | tr -d ' -'
}

get_oui_prefix() {
    local mac="$1"
    echo "$mac" | cut -d':' -f1-3
}

mac_to_key() {
    # Convert MAC to database-safe key (replace : with _)
    echo "$1" | tr ':' '_'
}

# ============================================================================
# Device Lookup
# ============================================================================

get_device_ip() {
    local mac="$1"
    mac=$(normalize_mac "$mac")

    # Try ARP table
    arp -n 2>/dev/null | grep -i "$mac" | awk '{print $1}' | head -1
}

get_device_hostname() {
    local mac="$1"
    mac=$(normalize_mac "$mac")

    # Try DHCP leases
    if [ -f /tmp/dhcp.leases ]; then
        grep -i "$mac" /tmp/dhcp.leases | awk '{print $4}' | head -1
    fi
}

# ============================================================================
# Zone Management
# ============================================================================

get_device_zone() {
    local mac="$1"

    # Check Client Guardian if available
    if [ -x /usr/sbin/client-guardian ]; then
        /usr/sbin/client-guardian get-zone "$mac" 2>/dev/null
        return
    fi

    echo "lan"
}

set_device_zone() {
    local mac="$1"
    local zone="$2"

    if [ -x /usr/sbin/client-guardian ]; then
        /usr/sbin/client-guardian set-zone "$mac" "$zone" 2>/dev/null
    fi
}

# ============================================================================
# Risk Assessment
# ============================================================================

risk_level_to_score() {
    case "$1" in
        critical) echo 100 ;;
        high) echo 80 ;;
        medium) echo 50 ;;
        low) echo 20 ;;
        *) echo 40 ;;
    esac
}

score_to_risk_level() {
    local score="$1"

    if [ "$score" -ge 80 ]; then
        echo "high"
    elif [ "$score" -ge 50 ]; then
        echo "medium"
    elif [ "$score" -ge 20 ]; then
        echo "low"
    else
        echo "unknown"
    fi
}

# ============================================================================
# Integration Helpers
# ============================================================================

call_mac_guardian() {
    local action="$1"
    local mac="$2"

    [ -x /usr/sbin/mac-guardian ] || return 1

    case "$action" in
        trust)
            /usr/sbin/mac-guardian trust "$mac" 2>/dev/null
            ;;
        block)
            /usr/sbin/mac-guardian block "$mac" 2>/dev/null
            ;;
        status)
            /usr/sbin/mac-guardian status "$mac" 2>/dev/null
            ;;
    esac
}

call_bandwidth_manager() {
    local action="$1"
    local mac="$2"
    local profile="${3:-iot_limited}"

    [ -x /usr/sbin/bandwidth-manager ] || return 1

    case "$action" in
        set-profile)
            /usr/sbin/bandwidth-manager set-profile "$mac" "$profile" 2>/dev/null
            ;;
        get-profile)
            /usr/sbin/bandwidth-manager get-profile "$mac" 2>/dev/null
            ;;
    esac
}

call_vortex_firewall() {
    local action="$1"
    local domain="$2"

    [ -x /usr/sbin/vortex-firewall ] || return 1

    case "$action" in
        block)
            /usr/sbin/vortex-firewall intel add "$domain" "iot_malware" 2>/dev/null
            ;;
        check)
            /usr/sbin/vortex-firewall intel search "$domain" 2>/dev/null
            ;;
    esac
}

# ============================================================================
# Logging
# ============================================================================

iot_log() {
    local level="$1"
    shift
    logger -t "iot-guard" -p "daemon.$level" "$*"
}

iot_log_info() {
    iot_log "info" "$*"
}

iot_log_warn() {
    iot_log "warning" "$*"
}

iot_log_error() {
    iot_log "err" "$*"
}
