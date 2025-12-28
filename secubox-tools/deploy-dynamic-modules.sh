#!/bin/bash
# Deploy Both SecuBox v0.1.2 and System Hub Dynamic Components
# Complete deployment of responsive, auto-detecting module/component system

ROUTER="root@192.168.8.191"

echo "🚀 Deploying Dynamic Module System to $ROUTER"
echo "=================================================="
echo ""

# ===== SecuBox v0.1.2 =====
echo "📦 [1/2] Deploying SecuBox v0.1.2..."
echo ""

echo "  → Config file..."
scp luci-app-secubox/root/etc/config/secubox \
    "$ROUTER:/etc/config/secubox"

echo "  → RPCD backend with auto-detection..."
scp luci-app-secubox/root/usr/libexec/rpcd/luci.secubox \
    "$ROUTER:/usr/libexec/rpcd/"

echo "  → Modules view..."
scp luci-app-secubox/htdocs/luci-static/resources/view/secubox/modules.js \
    "$ROUTER:/www/luci-static/resources/view/secubox/"

echo "  → Modules CSS..."
scp luci-app-secubox/htdocs/luci-static/resources/secubox/modules.css \
    "$ROUTER:/www/luci-static/resources/secubox/"

echo "  → Setting permissions..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.secubox"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/secubox/modules.js"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/secubox/modules.css"
ssh "$ROUTER" "chmod 644 /etc/config/secubox"

echo ""
echo "  ✅ SecuBox v0.1.2 deployed"
echo ""

# ===== System Hub Dynamic Components =====
echo "🧩 [2/2] Deploying System Hub Dynamic Components..."
echo ""

echo "  → RPCD backend..."
scp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub \
    "$ROUTER:/usr/libexec/rpcd/"

echo "  → Components view..."
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/components.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

echo "  → Components CSS..."
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/components.css \
    "$ROUTER:/www/luci-static/resources/system-hub/"

echo "  → API with getComponents..."
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

echo "  → Setting permissions..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.system-hub"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/system-hub/components.js"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/system-hub/components.css"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/system-hub/api.js"

echo ""
echo "  ✅ System Hub deployed"
echo ""

# ===== Restart Services =====
echo "🔄 Restarting services..."
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "=================================================="
echo "✅ Dynamic Module System Deployed Successfully!"
echo "=================================================="
echo ""
echo "🎯 Features Deployed:"
echo ""
echo "SecuBox v0.1.2:"
echo "  • Real-time module auto-detection via opkg"
echo "  • Dual-source module list (UCI + auto-detected)"
echo "  • Real version detection from installed packages"
echo "  • Auto-categorization for detected modules"
echo "  • Responsive card grid layout"
echo "  • Category filter tabs"
echo "  • Auto-refresh every 30 seconds"
echo ""
echo "System Hub - Components:"
echo "  • Dynamic component detection (leverages SecuBox)"
echo "  • Responsive card grid layout"
echo "  • Category filter tabs"
echo "  • Real-time status indicators"
echo "  • Quick action buttons"
echo "  • Auto-refresh every 30 seconds"
echo ""
echo "👉 Refresh your browser (Ctrl+Shift+R) to see changes:"
echo "   • SecuBox → Modules"
echo "   • System Hub → Components"
echo ""
