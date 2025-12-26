#!/bin/bash
# Deploy system-hub v0.0.3-alpha to router

ROUTER="root@192.168.8.191"

echo "🚀 Deploying system-hub v0.0.3-alpha to $ROUTER"
echo ""

# Deploy API module
echo "📦 Deploying API module..."
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deploy views
echo "📦 Deploying views..."
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/health.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/settings.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

# Deploy RPCD backend
echo "📦 Deploying RPCD backend..."
scp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub \
    "$ROUTER:/usr/libexec/rpcd/"

# Deploy ACL permissions
echo "📦 Deploying ACL permissions..."
scp luci-app-system-hub/root/usr/share/rpcd/acl.d/luci-app-system-hub.json \
    "$ROUTER:/usr/share/rpcd/acl.d/"

# Make RPCD script executable
echo "🔧 Setting permissions..."
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.system-hub"

# Restart RPCD
echo "🔄 Restarting RPCD..."
ssh "$ROUTER" "/etc/init.d/rpcd restart"

echo ""
echo "✅ Deployment complete!"
echo "👉 Clear browser cache (Ctrl+Shift+R) and reload the page"
