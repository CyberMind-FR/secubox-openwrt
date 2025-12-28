#!/bin/bash
# Deploy SecuBox v0.1.2 - Dynamic Module Detection
# Real-time module auto-discovery with responsive cards

ROUTER="root@192.168.8.191"

echo "🚀 Deploying SecuBox v0.1.2 to $ROUTER"
echo ""

echo "📦 Deploying updated config..."
scp luci-app-secubox/root/etc/config/secubox \
    "$ROUTER:/etc/config/secubox"

echo "🔧 Deploying enhanced RPCD backend with auto-detection..."
scp luci-app-secubox/root/usr/libexec/rpcd/luci.secubox \
    "$ROUTER:/usr/libexec/rpcd/"

echo "📄 Deploying modules view..."
scp luci-app-secubox/htdocs/luci-static/resources/view/secubox/modules.js \
    "$ROUTER:/www/luci-static/resources/view/secubox/"

echo "🎨 Deploying modules CSS..."
scp luci-app-secubox/htdocs/luci-static/resources/secubox/modules.css \
    "$ROUTER:/www/luci-static/resources/secubox/"

echo "🔄 Setting permissions and restarting services..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.secubox"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/secubox/modules.js"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/secubox/modules.css"
ssh "$ROUTER" "chmod 644 /etc/config/secubox"
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "✅ SecuBox v0.1.2 deployed successfully!"
echo ""
echo "🎯 New Features:"
echo "   • Real-time module auto-detection via opkg"
echo "   • Dual-source module list (UCI + auto-detected)"
echo "   • Real version detection from installed packages"
echo "   • Auto-categorization for detected modules"
echo "   • Responsive card grid layout"
echo "   • Category filter tabs (All/Security/Monitoring/Network/System)"
echo "   • Module versions displayed on cards"
echo "   • Quick action buttons (Start/Stop/Restart/Dashboard)"
echo "   • Auto-refresh every 30 seconds"
echo "   • in_uci flag to distinguish module sources"
echo ""
echo "👉 Refresh your browser (Ctrl+Shift+R) and go to SecuBox → Modules"
echo ""
