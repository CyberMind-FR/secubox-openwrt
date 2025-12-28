#!/bin/bash
# Deploy SecuBox + System Hub v0.1.1 with theme fixes

ROUTER="root@192.168.8.191"

echo "🚀 Deploying SecuBox + System Hub v0.1.1 to $ROUTER"
echo ""

echo "📦 Deploying SecuBox v0.1.1..."
# Deploy SecuBox RPCD backend
scp luci-app-secubox/root/usr/libexec/rpcd/luci.secubox \
    "$ROUTER:/usr/libexec/rpcd/"

# Deploy SecuBox ACL
scp luci-app-secubox/root/usr/share/rpcd/acl.d/luci-app-secubox.json \
    "$ROUTER:/usr/share/rpcd/acl.d/"

# Deploy SecuBox theme manager
scp luci-app-secubox/htdocs/luci-static/resources/secubox/theme.js \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy ALL SecuBox CSS (with theme variables)
scp luci-app-secubox/htdocs/luci-static/resources/secubox/*.css \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy ALL SecuBox views (with CSS loading)
scp luci-app-secubox/htdocs/luci-static/resources/view/secubox/*.js \
    "$ROUTER:/www/luci-static/resources/view/secubox/"

echo ""
echo "📦 Deploying System Hub v0.1.1..."
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
echo "✅ v0.1.1 deployed successfully!"
echo ""
echo "📋 Changelog v0.1.1:"
echo "   • Fixed: Theme switching now works in SecuBox visual display"
echo "   • Fixed: CSS variables properly loaded in all SecuBox views"
echo "   • Fixed: Hardcoded colors replaced with theme variables"
echo "   • Added: secubox.css loaded in dashboard, alerts, monitoring views"
echo "   • Theme coherence across ALL tabs in both plugins"
echo ""
echo "🎨 Theme features:"
echo "   • Dark mode: Deep backgrounds (#0f172a), light text (#f1f5f9)"
echo "   • Light mode: Bright backgrounds (#f8fafc), dark text (#0f172a)"
echo "   • System mode: Auto-detect from OS (prefers-color-scheme)"
echo ""
echo "🧪 Test now:"
echo "   1. Clear browser cache (Ctrl+Shift+R)"
echo "   2. Go to SecuBox → Settings → Change theme to 'Light'"
echo "   3. Refresh SecuBox Dashboard → Should be light!"
echo "   4. Refresh System Hub Overview → Should be light too!"
echo ""
echo "👉 Clear browser cache (Ctrl+Shift+R) and reload pages"
