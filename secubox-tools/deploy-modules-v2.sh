#!/bin/bash
# Deploy SecuBox Modules v2 - Responsive cards with versions and actions

ROUTER="root@192.168.8.191"

echo "🚀 Deploying SecuBox Modules v2 to $ROUTER"
echo ""

echo "📦 Deploying modules view and CSS..."
scp luci-app-secubox/htdocs/luci-static/resources/view/secubox/modules.js \
    "$ROUTER:/www/luci-static/resources/view/secubox/"

scp luci-app-secubox/htdocs/luci-static/resources/secubox/modules.css \
    "$ROUTER:/www/luci-static/resources/secubox/"

echo "📝 Deploying updated config with versions..."
scp luci-app-secubox/root/etc/config/secubox \
    "$ROUTER:/etc/config/secubox"

echo "🔧 Deploying updated RPCD backend..."
scp luci-app-secubox/root/usr/libexec/rpcd/luci.secubox \
    "$ROUTER:/usr/libexec/rpcd/"

echo "🔄 Setting permissions and restarting services..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.secubox"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/secubox/modules.js"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/secubox/modules.css"
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "✅ Modules v2 deployed successfully!"
echo ""
echo "🎨 New features:"
echo "   • Responsive grid layout"
echo "   • Module versions (v0.0.9)"
echo "   • Category filter tabs"
echo "   • Start/Stop/Restart actions"
echo "   • Dashboard quick links"
echo "   • Real-time status indicators"
echo "   • Modern card design with icons"
echo ""
echo "👉 Refresh your browser (Ctrl+Shift+R) and go to SecuBox → Modules"
