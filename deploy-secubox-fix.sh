#!/bin/bash
# Deploy SecuBox config fix - Module icons emoji fix

ROUTER="root@192.168.8.191"

echo "🔧 Deploying SecuBox config fix to $ROUTER"
echo ""

echo "📝 Backing up current config..."
ssh "$ROUTER" "cp /etc/config/secubox /etc/config/secubox.backup.$(date +%Y%m%d-%H%M%S)"

echo "📦 Deploying updated config with emoji icons..."
scp luci-app-secubox/root/etc/config/secubox "$ROUTER:/etc/config/secubox"

echo "🔄 Restarting RPCD..."
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "✅ Config deployed successfully!"
echo ""
echo "🎨 Fixed module icons:"
echo "   🛡️  CrowdSec Dashboard"
echo "   📊 Netdata Dashboard"
echo "   🔍 Netifyd Dashboard"
echo "   🔒 WireGuard Dashboard"
echo "   🌐 Network Modes"
echo "   👁️  Client Guardian"
echo "   ⚙️  System Hub"
echo "   📦 CDN Cache"
echo "   📡 Bandwidth Manager"
echo "   🔑 Auth Guardian"
echo "   ▶️  Media Flow"
echo "   🖥️  Virtual Host Manager"
echo "   📈 Traffic Shaper"
echo "   🔐 KSM Manager"
echo ""
echo "👉 Refresh your browser (Ctrl+Shift+R) to see the changes"
