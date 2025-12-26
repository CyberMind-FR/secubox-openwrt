#!/bin/bash
# Deploy unified theme system to router
# SecuBox + System Hub theme coherence

ROUTER="root@192.168.8.191"

echo "🎨 Deploying unified theme system to $ROUTER"
echo ""

echo "📦 Deploying SecuBox components..."
# Deploy SecuBox RPCD backend (with get_theme method)
scp luci-app-secubox/root/usr/libexec/rpcd/luci.secubox \
    "$ROUTER:/usr/libexec/rpcd/"

# Deploy SecuBox ACL (with get_theme permission)
scp luci-app-secubox/root/usr/share/rpcd/acl.d/luci-app-secubox.json \
    "$ROUTER:/usr/share/rpcd/acl.d/"

# Deploy SecuBox API (with getTheme)
scp luci-app-secubox/htdocs/luci-static/resources/secubox/api.js \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy SecuBox theme manager
scp luci-app-secubox/htdocs/luci-static/resources/secubox/theme.js \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy SecuBox CSS (with dark/light variables)
scp luci-app-secubox/htdocs/luci-static/resources/secubox/secubox.css \
    "$ROUTER:/www/luci-static/resources/secubox/"

# Deploy SecuBox dashboard view (with theme integration)
scp luci-app-secubox/htdocs/luci-static/resources/view/secubox/dashboard.js \
    "$ROUTER:/www/luci-static/resources/view/secubox/"

echo ""
echo "📦 Deploying System Hub components..."
# Deploy System Hub theme manager
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/theme.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deploy System Hub CSS (with dark/light variables)
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/dashboard.css \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deploy System Hub overview view (with theme integration)
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

echo ""
echo "🔧 Setting permissions and restarting services..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.secubox"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/secubox/*.js /www/luci-static/resources/secubox/*.css"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/system-hub/*.js /www/luci-static/resources/system-hub/*.css"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/secubox/*.js"
ssh "$ROUTER" "chmod 644 /www/luci-static/resources/view/system-hub/*.js"
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "✅ Theme system deployed successfully!"
echo ""
echo "📋 Theme configuration:"
echo "   • Theme setting stored in: /etc/config/secubox (option theme)"
echo "   • Available themes: dark, light, system"
echo "   • Both SecuBox and System Hub use the same theme"
echo ""
echo "🧪 Testing:"
echo "   1. Open SecuBox Settings: http://192.168.8.191/cgi-bin/luci/admin/secubox/settings"
echo "   2. Change theme to 'light' and save"
echo "   3. Refresh both SecuBox and System Hub pages"
echo "   4. Both should switch to light theme"
echo ""
echo "👉 Clear browser cache (Ctrl+Shift+R) and reload pages"
