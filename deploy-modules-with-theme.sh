#!/bin/bash

# Deploy luci-app-secubox, network-modes, and system-hub with global theme support
# Usage: ./deploy-modules-with-theme.sh [router_host]

set -e

ROUTER_HOST="${1:-root@192.168.8.191}"
MODULES="luci-app-secubox luci-app-network-modes luci-app-system-hub"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploying SecuBox modules with global theme to $ROUTER_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Modules: secubox, network-modes, system-hub"
echo "Theme: Global CyberMood (secubox-theme)"
echo ""

for MODULE in $MODULES; do
    MODULE_NAME=$(basename "$MODULE" | sed 's/luci-app-//')
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Deploying $MODULE_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Create backup on router
    echo "📦 Creating backup..."
    ssh "$ROUTER_HOST" "if [ -d '/www/luci-static/resources/$MODULE_NAME' ]; then \
        cp -r '/www/luci-static/resources/$MODULE_NAME' '/www/luci-static/resources/$MODULE_NAME.bak.$(date +%Y%m%d_%H%M%S)'; \
        echo '✓ Backup created'; \
    else \
        echo '✓ No existing module to backup'; \
    fi"

    # Create tarball
    echo "📦 Creating tarball..."
    TARBALL="/tmp/${MODULE_NAME}-$(date +%Y%m%d_%H%M%S).tar.gz"
    (cd "$MODULE/htdocs/luci-static/resources" && tar czf "$TARBALL" "$MODULE_NAME" "view/$MODULE_NAME")

    # Upload
    echo "🚀 Uploading to router..."
    scp "$TARBALL" "$ROUTER_HOST:/tmp/${MODULE_NAME}.tar.gz"

    # Extract
    echo "📂 Extracting..."
    ssh "$ROUTER_HOST" "cd /www/luci-static/resources && tar xzf /tmp/${MODULE_NAME}.tar.gz && rm /tmp/${MODULE_NAME}.tar.gz"

    # Set permissions
    echo "🔐 Setting permissions..."
    ssh "$ROUTER_HOST" "find /www/luci-static/resources/$MODULE_NAME -type f -name '*.css' -exec chmod 644 {} \; && \
        find /www/luci-static/resources/$MODULE_NAME -type f -name '*.js' -exec chmod 644 {} \; && \
        find /www/luci-static/resources/$MODULE_NAME -type d -exec chmod 755 {} \; && \
        find /www/luci-static/resources/view/$MODULE_NAME -type f -name '*.js' -exec chmod 644 {} \; && \
        find /www/luci-static/resources/view/$MODULE_NAME -type d -exec chmod 755 {} \;"

    # Cleanup
    rm -f "$TARBALL"

    echo "✅ $MODULE_NAME deployed"
    echo ""
done

# Clear LuCI cache
echo "🧹 Clearing LuCI cache..."
ssh "$ROUTER_HOST" "rm -rf /tmp/luci-*"

# Restart services
echo "🔄 Restarting services..."
ssh "$ROUTER_HOST" "/etc/init.d/uhttpd restart"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for MODULE in $MODULES; do
    MODULE_NAME=$(basename "$MODULE" | sed 's/luci-app-//')
    echo "📦 $MODULE_NAME:"
    ssh "$ROUTER_HOST" "if [ -d '/www/luci-static/resources/$MODULE_NAME' ]; then \
        echo '  ✅ Module files: OK'; \
        echo '  ✅ Views: \$(find /www/luci-static/resources/view/$MODULE_NAME -name \"*.js\" | wc -l) files'; \
    else \
        echo '  ❌ Module deployment failed'; \
    fi"
done

echo ""
echo "Theme status:"
ssh "$ROUTER_HOST" "if [ -f '/www/luci-static/resources/secubox-theme/theme.js' ]; then \
    echo '  ✅ Global theme: Available'; \
else \
    echo '  ⚠️  Global theme: Not found (run ./deploy-theme.sh first)'; \
fi"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Updated modules now use:"
echo "   - 'require secubox-theme/theme as Theme'"
echo "   - Global CyberMood CSS variables"
echo "   - Dark/Light/Cyberpunk theme variants"
echo "   - Multi-language support (en, fr, de, es)"
echo ""
echo "🌐 Access modules:"
echo "   - SecuBox: http://$ROUTER_HOST/cgi-bin/luci/admin/secubox"
echo "   - Network Modes: http://$ROUTER_HOST/cgi-bin/luci/admin/secubox/network-modes"
echo "   - System Hub: http://$ROUTER_HOST/cgi-bin/luci/admin/secubox/system-hub"
echo ""
