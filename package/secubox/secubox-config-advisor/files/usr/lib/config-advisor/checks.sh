#!/bin/sh
# Config Advisor - Security Check Functions

. /lib/functions.sh

RESULTS_FILE="/var/lib/config-advisor/results.json"

# Initialize results storage
checks_init() {
    mkdir -p /var/lib/config-advisor
    echo '[]' > "$RESULTS_FILE"
}

# Record check result
_record_result() {
    local check_id="$1"
    local status="$2"
    local message="$3"
    local details="$4"

    local timestamp
    timestamp=$(date +%s)

    local result="{\"id\":\"$check_id\",\"status\":\"$status\",\"message\":\"$message\",\"details\":\"$details\",\"timestamp\":$timestamp}"

    local tmp_file="/tmp/check_results_$$.json"
    if [ -s "$RESULTS_FILE" ] && [ "$(cat "$RESULTS_FILE")" != "[]" ]; then
        sed 's/]$/,'"$result"']/' "$RESULTS_FILE" > "$tmp_file"
    else
        echo "[$result]" > "$tmp_file"
    fi
    mv "$tmp_file" "$RESULTS_FILE"
}

# Network checks
check_ipv6_disabled() {
    local ula_prefix
    ula_prefix=$(uci -q get network.globals.ula_prefix)

    if [ -z "$ula_prefix" ]; then
        _record_result "NET-001" "pass" "IPv6 ULA prefix not configured" ""
        return 0
    else
        _record_result "NET-001" "info" "IPv6 enabled with ULA prefix" "$ula_prefix"
        return 1
    fi
}

check_mgmt_restricted() {
    local wan_ssh wan_https
    wan_ssh=$(uci show firewall 2>/dev/null | grep -c "src='wan'.*dest_port='22'.*target='ACCEPT'")
    wan_https=$(uci show firewall 2>/dev/null | grep -c "src='wan'.*dest_port='443'.*target='ACCEPT'")

    if [ "$wan_ssh" -eq 0 ] && [ "$wan_https" -eq 0 ]; then
        _record_result "NET-002" "pass" "Management access restricted to LAN" ""
        return 0
    else
        _record_result "NET-002" "fail" "Management ports open on WAN" "SSH:$wan_ssh HTTPS:$wan_https"
        return 1
    fi
}

check_syn_flood_protection() {
    local syn_protect
    syn_protect=$(uci -q get firewall.@defaults[0].synflood_protect)

    if [ "$syn_protect" = "1" ]; then
        _record_result "NET-004" "pass" "SYN flood protection enabled" ""
        return 0
    else
        _record_result "NET-004" "fail" "SYN flood protection not enabled" ""
        return 1
    fi
}

# Firewall checks
check_default_deny() {
    local wan_input wan_forward
    wan_input=$(uci -q get firewall.wan.input || echo "ACCEPT")
    wan_forward=$(uci -q get firewall.wan.forward || echo "ACCEPT")

    if [ "$wan_input" = "REJECT" ] || [ "$wan_input" = "DROP" ]; then
        if [ "$wan_forward" = "REJECT" ] || [ "$wan_forward" = "DROP" ]; then
            _record_result "FW-001" "pass" "Default deny policy on WAN" "input=$wan_input forward=$wan_forward"
            return 0
        fi
    fi

    _record_result "FW-001" "fail" "WAN zone not properly restricted" "input=$wan_input forward=$wan_forward"
    return 1
}

check_drop_invalid() {
    local drop_invalid
    drop_invalid=$(uci -q get firewall.@defaults[0].drop_invalid)

    if [ "$drop_invalid" = "1" ]; then
        _record_result "FW-002" "pass" "Invalid packets dropped" ""
        return 0
    else
        _record_result "FW-002" "fail" "Invalid packets not dropped" ""
        return 1
    fi
}

check_wan_ports_closed() {
    local open_ports
    open_ports=$(uci show firewall 2>/dev/null | grep -c "src='wan'.*target='ACCEPT'")

    if [ "$open_ports" -le 2 ]; then
        _record_result "FW-003" "pass" "Minimal ports open on WAN" "count=$open_ports"
        return 0
    else
        _record_result "FW-003" "warn" "Multiple ports open on WAN" "count=$open_ports"
        return 1
    fi
}

# Authentication checks
check_root_password_set() {
    local root_hash
    root_hash=$(grep "^root:" /etc/shadow 2>/dev/null | cut -d: -f2)

    if [ -n "$root_hash" ] && [ "$root_hash" != "!" ] && [ "$root_hash" != "*" ] && [ "$root_hash" != "" ]; then
        _record_result "AUTH-001" "pass" "Root password is set" ""
        return 0
    else
        _record_result "AUTH-001" "fail" "Root password not set" ""
        return 1
    fi
}

check_ssh_key_auth() {
    local authorized_keys="/etc/dropbear/authorized_keys"

    if [ -s "$authorized_keys" ]; then
        local key_count
        key_count=$(wc -l < "$authorized_keys")
        _record_result "AUTH-002" "pass" "SSH keys configured" "keys=$key_count"
        return 0
    else
        _record_result "AUTH-002" "warn" "No SSH keys configured" "Password auth only"
        return 1
    fi
}

check_ssh_no_root_password() {
    local password_auth
    password_auth=$(uci -q get dropbear.@dropbear[0].PasswordAuth)

    if [ "$password_auth" = "off" ] || [ "$password_auth" = "0" ]; then
        _record_result "AUTH-003" "pass" "SSH password auth disabled" ""
        return 0
    else
        _record_result "AUTH-003" "warn" "SSH password auth enabled" ""
        return 1
    fi
}

# Encryption checks
check_https_enabled() {
    local https_enabled redirect_https
    https_enabled=$(uci -q get uhttpd.main.listen_https)
    redirect_https=$(uci -q get uhttpd.main.redirect_https)

    if [ -n "$https_enabled" ]; then
        if [ "$redirect_https" = "1" ]; then
            _record_result "CRYPT-001" "pass" "HTTPS enabled with redirect" ""
            return 0
        else
            _record_result "CRYPT-001" "warn" "HTTPS enabled but no redirect" ""
            return 0
        fi
    else
        _record_result "CRYPT-001" "fail" "HTTPS not configured" ""
        return 1
    fi
}

check_wireguard_configured() {
    local wg_interfaces
    wg_interfaces=$(uci show network 2>/dev/null | grep -c "proto='wireguard'")

    if [ "$wg_interfaces" -gt 0 ]; then
        _record_result "CRYPT-003" "pass" "WireGuard configured" "interfaces=$wg_interfaces"
        return 0
    else
        _record_result "CRYPT-003" "info" "WireGuard not configured" ""
        return 1
    fi
}

check_dns_encrypted() {
    # Check for AdGuard Home or stubby
    if pgrep -x AdGuardHome >/dev/null 2>&1; then
        _record_result "CRYPT-004" "pass" "AdGuard Home running (encrypted DNS)" ""
        return 0
    elif pgrep -x stubby >/dev/null 2>&1; then
        _record_result "CRYPT-004" "pass" "Stubby running (DoT)" ""
        return 0
    else
        _record_result "CRYPT-004" "warn" "No encrypted DNS resolver detected" ""
        return 1
    fi
}

# Service checks
check_crowdsec_enabled() {
    if pgrep crowdsec >/dev/null 2>&1; then
        _record_result "SVC-003" "pass" "CrowdSec is running" ""
        return 0
    else
        _record_result "SVC-003" "fail" "CrowdSec not running" ""
        return 1
    fi
}

check_services_localhost() {
    local exposed_services=0

    # Check common services
    if netstat -tln 2>/dev/null | grep -q "0.0.0.0:8091"; then
        exposed_services=$((exposed_services + 1))
    fi

    if [ "$exposed_services" -eq 0 ]; then
        _record_result "SVC-002" "pass" "Services properly bound" ""
        return 0
    else
        _record_result "SVC-002" "warn" "Some services bound to 0.0.0.0" "count=$exposed_services"
        return 1
    fi
}

# Logging checks
check_syslog_enabled() {
    if pgrep logd >/dev/null 2>&1 || pgrep syslog >/dev/null 2>&1; then
        _record_result "LOG-001" "pass" "System logging enabled" ""
        return 0
    else
        _record_result "LOG-001" "fail" "System logging not running" ""
        return 1
    fi
}

check_log_rotation() {
    local log_size
    log_size=$(uci -q get system.@system[0].log_size)

    if [ -n "$log_size" ] && [ "$log_size" -gt 0 ]; then
        _record_result "LOG-002" "pass" "Log rotation configured" "size=${log_size}KB"
        return 0
    else
        _record_result "LOG-002" "warn" "Log rotation not configured" ""
        return 1
    fi
}

# Update checks
check_system_uptodate() {
    opkg update >/dev/null 2>&1
    local upgradable
    upgradable=$(opkg list-upgradable 2>/dev/null | wc -l)

    if [ "$upgradable" -eq 0 ]; then
        _record_result "UPD-001" "pass" "System is up to date" ""
        return 0
    else
        _record_result "UPD-001" "warn" "Packages need updating" "count=$upgradable"
        return 1
    fi
}

# ============================================
# DDoS Protection Checks
# ============================================

check_ddos_syn_cookies() {
    local syn_cookies
    syn_cookies=$(cat /proc/sys/net/ipv4/tcp_syncookies 2>/dev/null)

    if [ "$syn_cookies" = "1" ]; then
        _record_result "DDOS-001" "pass" "SYN cookies enabled" ""
        return 0
    else
        _record_result "DDOS-001" "fail" "SYN cookies not enabled" "Vulnerable to SYN flood"
        return 1
    fi
}

check_ddos_conntrack_limit() {
    local conntrack_max
    conntrack_max=$(cat /proc/sys/net/netfilter/nf_conntrack_max 2>/dev/null || echo "0")

    if [ "$conntrack_max" -ge 65536 ]; then
        _record_result "DDOS-002" "pass" "Connection tracking limit adequate" "max=$conntrack_max"
        return 0
    else
        _record_result "DDOS-002" "warn" "Connection tracking limit low" "max=$conntrack_max (recommend 65536+)"
        return 1
    fi
}

check_ddos_crowdsec_dos() {
    # Check if CrowdSec http-dos collection is installed
    if command -v cscli >/dev/null 2>&1; then
        local dos_installed
        dos_installed=$(cscli collections list -o json 2>/dev/null | grep -c "http-dos" || echo "0")

        if [ "$dos_installed" -gt 0 ]; then
            _record_result "DDOS-003" "pass" "CrowdSec http-dos collection installed" ""
            return 0
        else
            _record_result "DDOS-003" "warn" "CrowdSec http-dos collection not installed" "Run: cscli collections install crowdsecurity/http-dos"
            return 1
        fi
    else
        _record_result "DDOS-003" "fail" "CrowdSec not available" "Install crowdsec package"
        return 1
    fi
}

check_ddos_icmp_rate() {
    local icmp_rate
    icmp_rate=$(cat /proc/sys/net/ipv4/icmp_ratelimit 2>/dev/null || echo "0")

    if [ "$icmp_rate" -gt 0 ]; then
        _record_result "DDOS-004" "pass" "ICMP rate limiting enabled" "rate=$icmp_rate"
        return 0
    else
        _record_result "DDOS-004" "warn" "ICMP rate limiting not configured" ""
        return 1
    fi
}

check_ddos_rp_filter() {
    local rp_filter
    rp_filter=$(cat /proc/sys/net/ipv4/conf/all/rp_filter 2>/dev/null || echo "0")

    if [ "$rp_filter" = "1" ]; then
        _record_result "DDOS-005" "pass" "Reverse path filtering enabled" "Anti-spoofing active"
        return 0
    else
        _record_result "DDOS-005" "warn" "Reverse path filtering disabled" "Vulnerable to IP spoofing"
        return 1
    fi
}

check_ddos_haproxy_limits() {
    # Check HAProxy connection limits
    if [ -f /etc/haproxy/haproxy.cfg ]; then
        local maxconn
        maxconn=$(grep -E "^\s*maxconn" /etc/haproxy/haproxy.cfg 2>/dev/null | head -1 | awk '{print $2}')

        if [ -n "$maxconn" ] && [ "$maxconn" -gt 0 ]; then
            _record_result "DDOS-006" "pass" "HAProxy connection limit set" "maxconn=$maxconn"
            return 0
        else
            _record_result "DDOS-006" "warn" "HAProxy maxconn not configured" "Recommend setting maxconn limit"
            return 1
        fi
    else
        _record_result "DDOS-006" "info" "HAProxy not installed" ""
        return 0
    fi
}

check_ddos_mitmproxy_waf() {
    # Check if mitmproxy WAF is running for DDoS detection
    if lxc-ls --running 2>/dev/null | grep -qE "mitmproxy|secbx-mitmproxy"; then
        _record_result "DDOS-007" "pass" "mitmproxy WAF running" "L7 flood detection active"
        return 0
    else
        _record_result "DDOS-007" "info" "mitmproxy WAF not running" "L7 protection inactive"
        return 1
    fi
}

check_ddos_vortex_firewall() {
    # Check Vortex DNS firewall for botnet C2 blocking
    if [ -f /var/lib/vortex-firewall/blocklist.db ]; then
        local blocked_count
        blocked_count=$(sqlite3 /var/lib/vortex-firewall/blocklist.db "SELECT COUNT(*) FROM domains;" 2>/dev/null || echo "0")

        if [ "$blocked_count" -gt 100 ]; then
            _record_result "DDOS-008" "pass" "Vortex DNS firewall active" "blocked=$blocked_count domains"
            return 0
        else
            _record_result "DDOS-008" "warn" "Vortex DNS firewall has few rules" "blocked=$blocked_count"
            return 1
        fi
    else
        _record_result "DDOS-008" "info" "Vortex DNS firewall not configured" ""
        return 1
    fi
}

# Run DDoS-specific checks
run_ddos_checks() {
    checks_init

    check_ddos_syn_cookies
    check_ddos_conntrack_limit
    check_ddos_crowdsec_dos
    check_ddos_icmp_rate
    check_ddos_rp_filter
    check_ddos_haproxy_limits
    check_ddos_mitmproxy_waf
    check_ddos_vortex_firewall

    cat "$RESULTS_FILE"
}

# Run all checks
run_all_checks() {
    checks_init

    # Network
    check_ipv6_disabled
    check_mgmt_restricted
    check_syn_flood_protection

    # Firewall
    check_default_deny
    check_drop_invalid
    check_wan_ports_closed

    # Authentication
    check_root_password_set
    check_ssh_key_auth
    check_ssh_no_root_password

    # Encryption
    check_https_enabled
    check_wireguard_configured
    check_dns_encrypted

    # Services
    check_crowdsec_enabled
    check_services_localhost

    # Logging
    check_syslog_enabled
    check_log_rotation

    # DDoS Protection
    check_ddos_syn_cookies
    check_ddos_conntrack_limit
    check_ddos_crowdsec_dos
    check_ddos_icmp_rate
    check_ddos_rp_filter
    check_ddos_haproxy_limits
    check_ddos_mitmproxy_waf
    check_ddos_vortex_firewall

    # Updates (can be slow)
    # check_system_uptodate

    cat "$RESULTS_FILE"
}

# Get results
get_results() {
    if [ -f "$RESULTS_FILE" ]; then
        cat "$RESULTS_FILE"
    else
        echo "[]"
    fi
}
