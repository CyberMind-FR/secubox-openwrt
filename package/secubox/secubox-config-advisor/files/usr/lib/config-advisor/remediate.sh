#!/bin/sh
# Config Advisor - Remediation Module

. /lib/functions.sh

REMEDIATION_LOG="/var/lib/config-advisor/remediation.log"
PENDING_FILE="/var/lib/config-advisor/pending_remediations.json"

# Initialize remediation storage
remediate_init() {
    mkdir -p /var/lib/config-advisor
    [ -f "$PENDING_FILE" ] || echo '[]' > "$PENDING_FILE"
}

# Log remediation action
_log_remediation() {
    local check_id="$1"
    local action="$2"
    local status="$3"
    local details="$4"

    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] $check_id: $action - $status - $details" >> "$REMEDIATION_LOG"
}

# Remediation functions for specific checks

# NET-002: Restrict management access
remediate_mgmt_restricted() {
    local dry_run="${1:-0}"

    if [ "$dry_run" = "1" ]; then
        echo "Would add firewall rules to restrict SSH and HTTPS to LAN only"
        return 0
    fi

    # Remove any WAN SSH/HTTPS rules
    local changed=0

    # This is a destructive operation - be careful
    # Only remove explicit WAN allow rules for management ports
    uci show firewall 2>/dev/null | grep -E "src='wan'.*dest_port='(22|443)'.*target='ACCEPT'" | \
    while read -r rule; do
        local rule_name
        rule_name=$(echo "$rule" | cut -d. -f2 | cut -d= -f1)
        if [ -n "$rule_name" ]; then
            uci delete "firewall.$rule_name"
            changed=1
            _log_remediation "NET-002" "Removed WAN rule" "success" "$rule_name"
        fi
    done

    if [ "$changed" = "1" ]; then
        uci commit firewall
        /etc/init.d/firewall reload
    fi

    echo '{"success": true, "action": "Restricted management access to LAN"}'
}

# NET-004: Enable SYN flood protection
remediate_syn_flood_protection() {
    local dry_run="${1:-0}"

    if [ "$dry_run" = "1" ]; then
        echo "Would enable synflood_protect in firewall defaults"
        return 0
    fi

    uci set firewall.@defaults[0].synflood_protect='1'
    uci commit firewall
    /etc/init.d/firewall reload

    _log_remediation "NET-004" "Enabled SYN flood protection" "success" ""
    echo '{"success": true, "action": "Enabled SYN flood protection"}'
}

# FW-001: Default deny policy
remediate_default_deny() {
    local dry_run="${1:-0}"

    if [ "$dry_run" = "1" ]; then
        echo "Would set WAN zone to input=REJECT, forward=REJECT"
        return 0
    fi

    uci set firewall.wan.input='REJECT'
    uci set firewall.wan.forward='REJECT'
    uci commit firewall
    /etc/init.d/firewall reload

    _log_remediation "FW-001" "Set default deny on WAN" "success" ""
    echo '{"success": true, "action": "Set default deny policy on WAN"}'
}

# FW-002: Drop invalid packets
remediate_drop_invalid() {
    local dry_run="${1:-0}"

    if [ "$dry_run" = "1" ]; then
        echo "Would enable drop_invalid in firewall defaults"
        return 0
    fi

    uci set firewall.@defaults[0].drop_invalid='1'
    uci commit firewall
    /etc/init.d/firewall reload

    _log_remediation "FW-002" "Enabled drop invalid" "success" ""
    echo '{"success": true, "action": "Enabled drop invalid packets"}'
}

# AUTH-003: Disable SSH password auth
remediate_ssh_no_root_password() {
    local dry_run="${1:-0}"

    # Safety check: ensure SSH keys exist first
    if [ ! -s /etc/dropbear/authorized_keys ]; then
        echo '{"success": false, "error": "Cannot disable password auth without SSH keys configured"}'
        return 1
    fi

    if [ "$dry_run" = "1" ]; then
        echo "Would disable password authentication for SSH"
        return 0
    fi

    uci set dropbear.@dropbear[0].PasswordAuth='off'
    uci set dropbear.@dropbear[0].RootPasswordAuth='off'
    uci commit dropbear
    /etc/init.d/dropbear restart

    _log_remediation "AUTH-003" "Disabled SSH password auth" "success" ""
    echo '{"success": true, "action": "Disabled SSH password authentication"}'
}

# CRYPT-001: Enable HTTPS
remediate_https_enabled() {
    local dry_run="${1:-0}"

    if [ "$dry_run" = "1" ]; then
        echo "Would enable HTTPS redirect in uhttpd"
        return 0
    fi

    uci set uhttpd.main.redirect_https='1'
    uci commit uhttpd
    /etc/init.d/uhttpd restart

    _log_remediation "CRYPT-001" "Enabled HTTPS redirect" "success" ""
    echo '{"success": true, "action": "Enabled HTTPS redirect"}'
}

# LOG-002: Configure log rotation
remediate_log_rotation() {
    local dry_run="${1:-0}"

    if [ "$dry_run" = "1" ]; then
        echo "Would set log size to 128KB"
        return 0
    fi

    uci set system.@system[0].log_size='128'
    uci commit system
    /etc/init.d/system reload

    _log_remediation "LOG-002" "Configured log rotation" "success" "128KB"
    echo '{"success": true, "action": "Configured log rotation to 128KB"}'
}

# Queue remediation for approval
remediate_queue() {
    local check_id="$1"
    local action="$2"
    local timestamp
    timestamp=$(date +%s)

    local entry="{\"check_id\":\"$check_id\",\"action\":\"$action\",\"queued_at\":$timestamp,\"status\":\"pending\"}"

    local tmp_file="/tmp/pending_rem_$$.json"
    if [ -s "$PENDING_FILE" ] && [ "$(cat "$PENDING_FILE")" != "[]" ]; then
        sed 's/]$/,'"$entry"']/' "$PENDING_FILE" > "$tmp_file"
    else
        echo "[$entry]" > "$tmp_file"
    fi
    mv "$tmp_file" "$PENDING_FILE"

    logger -t config-advisor "Queued remediation: $check_id - $action"
    echo '{"success": true, "queued": true}'
}

# Get pending remediations
remediate_get_pending() {
    cat "$PENDING_FILE"
}

# Apply single remediation
remediate_apply() {
    local check_id="$1"
    local dry_run="${2:-0}"

    case "$check_id" in
        NET-002) remediate_mgmt_restricted "$dry_run" ;;
        NET-004) remediate_syn_flood_protection "$dry_run" ;;
        FW-001) remediate_default_deny "$dry_run" ;;
        FW-002) remediate_drop_invalid "$dry_run" ;;
        AUTH-003) remediate_ssh_no_root_password "$dry_run" ;;
        CRYPT-001) remediate_https_enabled "$dry_run" ;;
        LOG-002) remediate_log_rotation "$dry_run" ;;
        *)
            echo "{\"success\": false, \"error\": \"No remediation available for $check_id\"}"
            return 1
            ;;
    esac
}

# Apply all safe remediations
remediate_apply_safe() {
    local dry_run="${1:-0}"

    local applied=0
    local failed=0

    # Safe remediations (non-destructive)
    for check_id in NET-004 FW-002 CRYPT-001 LOG-002; do
        if remediate_apply "$check_id" "$dry_run" 2>/dev/null | grep -q '"success": true'; then
            applied=$((applied + 1))
        else
            failed=$((failed + 1))
        fi
    done

    echo "{\"applied\": $applied, \"failed\": $failed, \"dry_run\": $([ "$dry_run" = "1" ] && echo "true" || echo "false")}"
}

# Get remediation suggestions using LocalAI
remediate_suggest() {
    local check_id="$1"

    local localai_enabled localai_url localai_model
    localai_enabled=$(uci -q get config-advisor.localai.enabled || echo "0")
    localai_url=$(uci -q get config-advisor.localai.url || echo "http://127.0.0.1:8091")
    localai_model=$(uci -q get config-advisor.localai.model || echo "mistral")

    if [ "$localai_enabled" != "1" ]; then
        # Return static suggestion
        local rule_info
        rule_info=$(jsonfilter -i /usr/share/config-advisor/anssi-rules.json \
            -e '@.categories[*].rules[*]' 2>/dev/null | grep "\"id\":\"$check_id\"" | head -1)

        if [ -n "$rule_info" ]; then
            local remediation
            remediation=$(echo "$rule_info" | jsonfilter -e '@.remediation' 2>/dev/null)
            echo "{\"check_id\": \"$check_id\", \"suggestion\": \"$remediation\", \"source\": \"static\"}"
        else
            echo "{\"check_id\": \"$check_id\", \"suggestion\": \"No remediation available\", \"source\": \"none\"}"
        fi
        return
    fi

    # Get AI suggestion
    local prompt="You are a security configuration advisor. The security check '$check_id' has failed. Provide a concise remediation recommendation for OpenWrt. Be specific and actionable."

    local response
    response=$(curl -s -X POST "$localai_url/v1/chat/completions" \
        -H "Content-Type: application/json" \
        -d "{\"model\":\"$localai_model\",\"messages\":[{\"role\":\"user\",\"content\":\"$prompt\"}],\"max_tokens\":200}" \
        --connect-timeout 10 2>/dev/null)

    if [ -n "$response" ]; then
        local suggestion
        suggestion=$(echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null)
        echo "{\"check_id\": \"$check_id\", \"suggestion\": \"$suggestion\", \"source\": \"ai\"}"
    else
        # Fallback to static
        remediate_suggest "$check_id"
    fi
}

# Get remediation log
remediate_get_log() {
    local lines="${1:-50}"

    if [ -f "$REMEDIATION_LOG" ]; then
        tail -n "$lines" "$REMEDIATION_LOG"
    else
        echo "No remediation log available"
    fi
}

# Initialize on source
remediate_init
