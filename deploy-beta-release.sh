#!/bin/bash
# Deploy SecuBox and System Hub v1.0.0-beta with unified theme system

ROUTER="root@192.168.8.191"

echo "🚀 Deploying SecuBox + System Hub v1.0.0-beta to $ROUTER"
echo ""

echo "📦 Deploying SecuBox v1.0.0-beta..."
# Deploy SecuBox RPCD backend
scp luci-app-secubox/root/usr/libexec/rpcd/luci.secubox \
    "$ROUTER:/usr/libexec/rpcd/"

# Deploy SecuBox ACL
scp luci-app-secubox/root/usr/share/rpcd/acl.d/luci-app-secubox.json \
    "$ROUTER:/usr/share/rpcd/acl.d/"

# Deploy SecuBox API
scp luci-app-secubox/htdocs/luci-static/resources/secubox/api.js \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy SecuBox theme manager
scp luci-app-secubox/htdocs/luci-static/resources/secubox/theme.js \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy SecuBox CSS
scp luci-app-secubox/htdocs/luci-static/resources/secubox/secubox.css \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy ALL SecuBox views
scp luci-app-secubox/htdocs/luci-static/resources/view/secubox/*.js \
    "$ROUTER:/www/luci-static/resources/view/secubox/"

echo ""
echo "📦 Deploying System Hub v1.0.0-beta..."
# Deploy System Hub RPCD backend
scp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub \
    "$ROUTER:/usr/libexec/rpcd/"

# Deploy System Hub API
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deploy System Hub theme manager
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/theme.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deploy System Hub CSS
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/dashboard.css \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deploy ALL System Hub views
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/*.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

echo ""
echo "🔧 Setting permissions and restarting services..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.secubox /usr/libexec/rpcd/luci.system-hub"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/secubox/*.js /www/luci-static/resources/secubox/*.css"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/system-hub/*.js /www/luci-static/resources/system-hub/*.css"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/secubox/*.js"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/system-hub/*.js"
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "✅ SecuBox + System Hub v1.0.0-beta deployed successfully!"
echo ""
echo "📋 What's new in v1.0.0-beta:"
echo "   • Unified theme system (dark/light/system)"
echo "   • Coherent skin across ALL tabs in both plugins"
echo "   • Single theme setting controls both SecuBox and System Hub"
echo "   • Theme preference stored in /etc/config/secubox"
echo ""
echo "🎨 Theme features:"
echo "   • Dark mode (default): Deep backgrounds, light text"
echo "   • Light mode: Bright backgrounds, dark text"
echo "   • System mode: Auto-detect from OS preferences"
echo ""
echo "🧪 Testing:"
echo "   1. Open any SecuBox tab - should show unified theme"
echo "   2. Open any System Hub tab - should show same theme"
echo "   3. Change theme in SecuBox Settings"
echo "   4. Refresh any tab - theme applies everywhere"
echo ""
echo "👉 Clear browser cache (Ctrl+Shift+R) and reload pages"
