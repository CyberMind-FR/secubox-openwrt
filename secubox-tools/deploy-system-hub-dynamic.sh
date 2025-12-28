#!/bin/bash
# Deploy System Hub - Dynamic Components
# Responsive component cards leveraging SecuBox module detection

ROUTER="root@192.168.8.191"

echo "🚀 Deploying System Hub Dynamic Components to $ROUTER"
echo ""

echo "🔧 Deploying enhanced RPCD backend..."
scp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub \
    "$ROUTER:/usr/libexec/rpcd/"

echo "📄 Deploying components view..."
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/components.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

echo "🎨 Deploying components CSS..."
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/components.css \
    "$ROUTER:/www/luci-static/resources/system-hub/"

echo "📡 Deploying updated API..."
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

echo "🔄 Setting permissions and restarting services..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.system-hub"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/system-hub/components.js"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/system-hub/components.css"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/system-hub/api.js"
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "✅ System Hub Dynamic Components deployed successfully!"
echo ""
echo "🎯 New Features:"
echo "   • Dynamic component detection (leverages SecuBox)"
echo "   • Responsive card grid layout"
echo "   • Category filter tabs (All/Security/Monitoring/Network/System)"
echo "   • Real-time status indicators"
echo "   • Component versions displayed"
echo "   • Quick action buttons (Start/Stop/Restart/Dashboard)"
echo "   • Auto-refresh every 30 seconds"
echo "   • Unified component management"
echo ""
echo "👉 Refresh your browser (Ctrl+Shift+R) and go to System Hub → Components"
echo ""
