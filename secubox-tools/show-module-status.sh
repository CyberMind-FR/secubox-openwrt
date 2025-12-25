#!/bin/bash
# Show SecuBox Module Status
# Quick overview of all modules and their implementation status

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================"
echo "SecuBox Module Status"
echo "========================================"
echo

# Count modules
total_modules=$(find "$ROOT_DIR" -maxdepth 1 -type d -name "luci-app-*" | wc -l)
echo "Total Modules: $total_modules"
echo

# Show modules by category
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Core Control Modules"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

modules_core=(
    "secubox:SecuBox Central Hub"
    "system-hub:System Control Dashboard"
    "traffic-shaper:Advanced QoS & Traffic Shaping"
)

for module_info in "${modules_core[@]}"; do
    IFS=':' read -r module desc <<< "$module_info"
    if [ -d "$ROOT_DIR/luci-app-$module" ]; then
        views=$(find "$ROOT_DIR/luci-app-$module/htdocs/luci-static/resources/view" -name "*.js" 2>/dev/null | wc -l)
        echo "✅ luci-app-$module"
        echo "   $desc"
        echo "   Views: $views"
        echo
    else
        echo "❌ luci-app-$module (NOT FOUND)"
        echo
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Security & Monitoring"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

modules_security=(
    "crowdsec-dashboard:CrowdSec Security"
    "netdata-dashboard:System Monitoring"
)

for module_info in "${modules_security[@]}"; do
    IFS=':' read -r module desc <<< "$module_info"
    if [ -d "$ROOT_DIR/luci-app-$module" ]; then
        views=$(find "$ROOT_DIR/luci-app-$module/htdocs/luci-static/resources/view" -name "*.js" 2>/dev/null | wc -l)
        echo "✅ luci-app-$module"
        echo "   $desc"
        echo "   Views: $views"
        echo
    else
        echo "❌ luci-app-$module (NOT FOUND)"
        echo
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Network Intelligence"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

modules_network=(
    "netifyd-dashboard:Deep Packet Inspection"
    "network-modes:Network Mode Configuration"
)

for module_info in "${modules_network[@]}"; do
    IFS=':' read -r module desc <<< "$module_info"
    if [ -d "$ROOT_DIR/luci-app-$module" ]; then
        views=$(find "$ROOT_DIR/luci-app-$module/htdocs/luci-static/resources/view" -name "*.js" 2>/dev/null | wc -l)
        echo "✅ luci-app-$module"
        echo "   $desc"
        echo "   Views: $views"
        echo
    else
        echo "❌ luci-app-$module (NOT FOUND)"
        echo
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VPN & Access Control"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

modules_vpn=(
    "wireguard-dashboard:WireGuard VPN"
    "client-guardian:Network Access Control"
    "auth-guardian:Advanced Authentication"
)

for module_info in "${modules_vpn[@]}"; do
    IFS=':' read -r module desc <<< "$module_info"
    if [ -d "$ROOT_DIR/luci-app-$module" ]; then
        views=$(find "$ROOT_DIR/luci-app-$module/htdocs/luci-static/resources/view" -name "*.js" 2>/dev/null | wc -l)
        echo "✅ luci-app-$module"
        echo "   $desc"
        echo "   Views: $views"
        echo
    else
        echo "❌ luci-app-$module (NOT FOUND)"
        echo
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Bandwidth & Traffic Management"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

modules_bandwidth=(
    "bandwidth-manager:Bandwidth & Quota Management"
    "media-flow:Media Traffic Detection"
)

for module_info in "${modules_bandwidth[@]}"; do
    IFS=':' read -r module desc <<< "$module_info"
    if [ -d "$ROOT_DIR/luci-app-$module" ]; then
        views=$(find "$ROOT_DIR/luci-app-$module/htdocs/luci-static/resources/view" -name "*.js" 2>/dev/null | wc -l)
        echo "✅ luci-app-$module"
        echo "   $desc"
        echo "   Views: $views"
        echo
    else
        echo "❌ luci-app-$module (NOT FOUND)"
        echo
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Performance & Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

modules_perf=(
    "cdn-cache:CDN Proxy Cache"
    "vhost-manager:Virtual Host Manager"
)

for module_info in "${modules_perf[@]}"; do
    IFS=':' read -r module desc <<< "$module_info"
    if [ -d "$ROOT_DIR/luci-app-$module" ]; then
        views=$(find "$ROOT_DIR/luci-app-$module/htdocs/luci-static/resources/view" -name "*.js" 2>/dev/null | wc -l)
        echo "✅ luci-app-$module"
        echo "   $desc"
        echo "   Views: $views"
        echo
    else
        echo "❌ luci-app-$module (NOT FOUND)"
        echo
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Count files
js_files=$(find "$ROOT_DIR"/luci-app-*/htdocs -name "*.js" 2>/dev/null | wc -l)
rpcd_files=$(find "$ROOT_DIR"/luci-app-*/root/usr/libexec/rpcd -type f 2>/dev/null | wc -l)
json_files=$(find "$ROOT_DIR"/luci-app-*/root/usr/share -name "*.json" 2>/dev/null | wc -l)

echo "Total JavaScript files: $js_files"
echo "Total RPCD backends: $rpcd_files"
echo "Total JSON config files: $json_files"
echo

# Recent commits
echo "Recent Development:"
git log --oneline --decorate -5 2>/dev/null || echo "Git history not available"
echo

echo "For detailed status, see: MODULE_STATUS.md"
