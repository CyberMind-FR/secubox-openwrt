#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# SecuBox Permissions Fix Script
# Automatically fixes file permissions for SecuBox modules
# Copyright (C) 2025 CyberMind.fr

set -e

LOG_TAG="secubox-fix-perms"

log_info() {
    logger -t "$LOG_TAG" -p info "$1"
    echo "[INFO] $1"
}

log_error() {
    logger -t "$LOG_TAG" -p err "$1"
    echo "[ERROR] $1" >&2
}

fix_rpcd_permissions() {
    log_info "Fixing RPCD script permissions..."

    local rpcd_scripts="
        /usr/libexec/rpcd/luci.secubox
        /usr/libexec/rpcd/luci.system-hub
        /usr/libexec/rpcd/luci.network-modes
        /usr/libexec/rpcd/luci.crowdsec-dashboard
        /usr/libexec/rpcd/luci.netdata-dashboard
        /usr/libexec/rpcd/luci.netifyd-dashboard
        /usr/libexec/rpcd/luci.wireguard-dashboard
        /usr/libexec/rpcd/luci.client-guardian
        /usr/libexec/rpcd/luci.bandwidth-manager
        /usr/libexec/rpcd/luci.auth-guardian
        /usr/libexec/rpcd/luci.media-flow
        /usr/libexec/rpcd/luci.vhost-manager
        /usr/libexec/rpcd/luci.traffic-shaper
        /usr/libexec/rpcd/luci.cdn-cache
        /usr/libexec/rpcd/luci.ksm-manager
    "

    local count=0
    for script in $rpcd_scripts; do
        if [ -f "$script" ]; then
            chmod 755 "$script" 2>/dev/null && count=$((count + 1))
        fi
    done

    log_info "Fixed $count RPCD scripts (755)"
}

fix_web_permissions() {
    log_info "Fixing web resources permissions..."

    # Fix CSS files
    local css_count=0
    if [ -d "/www/luci-static/resources" ]; then
        css_count=$(find /www/luci-static/resources -type f -name "*.css" -exec chmod 644 {} \; -print 2>/dev/null | wc -l)
    fi
    log_info "Fixed $css_count CSS files (644)"

    # Fix JS files
    local js_count=0
    if [ -d "/www/luci-static/resources" ]; then
        js_count=$(find /www/luci-static/resources -type f -name "*.js" -exec chmod 644 {} \; -print 2>/dev/null | wc -l)
    fi
    log_info "Fixed $js_count JS files (644)"
}

fix_config_permissions() {
    log_info "Fixing configuration file permissions..."

    local count=0

    # Fix ACL files
    for acl in /usr/share/rpcd/acl.d/luci-app-*.json; do
        if [ -f "$acl" ]; then
            chmod 644 "$acl" 2>/dev/null && count=$((count + 1))
        fi
    done

    # Fix menu files
    for menu in /usr/share/luci/menu.d/luci-app-*.json; do
        if [ -f "$menu" ]; then
            chmod 644 "$menu" 2>/dev/null && count=$((count + 1))
        fi
    done

    log_info "Fixed $count config files (644)"
}

restart_services() {
    log_info "Restarting services..."

    if /etc/init.d/rpcd restart >/dev/null 2>&1; then
        log_info "RPCD restarted successfully"
    else
        log_error "Failed to restart RPCD"
    fi

    if /etc/init.d/uhttpd restart >/dev/null 2>&1; then
        log_info "uHTTPd restarted successfully"
    else
        log_error "Failed to restart uHTTPd"
    fi
}

verify_permissions() {
    log_info "Verifying permissions..."

    local errors=0

    # Check RPCD scripts
    for script in /usr/libexec/rpcd/luci.*; do
        if [ -f "$script" ]; then
            local perms=$(ls -l "$script" 2>/dev/null | cut -c1-10)
            if [ "$perms" != "-rwxr-xr-x" ]; then
                log_error "Invalid permissions on $script: $perms (expected -rwxr-xr-x)"
                errors=$((errors + 1))
            fi
        fi
    done

    # Check critical files
    for file in /www/luci-static/resources/secubox/api.js /www/luci-static/resources/secubox/dashboard.css; do
        if [ -f "$file" ]; then
            local perms=$(ls -l "$file" 2>/dev/null | cut -c1-10)
            if [ "$perms" != "-rw-r--r--" ]; then
                log_error "Invalid permissions on $file: $perms (expected -rw-r--r--)"
                errors=$((errors + 1))
            fi
        fi
    done

    if [ $errors -eq 0 ]; then
        log_info "All permissions verified successfully"
        return 0
    else
        log_error "Found $errors permission errors"
        return 1
    fi
}

main() {
    echo "================================================"
    echo "  SecuBox Permissions Fix Script v0.3.1"
    echo "================================================"
    echo ""

    fix_rpcd_permissions
    fix_web_permissions
    fix_config_permissions

    echo ""
    restart_services

    echo ""
    verify_permissions

    echo ""
    echo "================================================"
    echo "  Permissions fix completed!"
    echo "================================================"
}

# Run if executed directly
if [ "${0##*/}" = "fix-permissions.sh" ]; then
    main "$@"
fi
