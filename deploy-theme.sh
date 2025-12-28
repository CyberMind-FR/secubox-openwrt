#!/bin/bash

# Deploy luci-theme-secubox to OpenWrt router
# Usage: ./deploy-theme.sh [router_host]

set -e

ROUTER_HOST="${1:-root@192.168.8.191}"
THEME_DIR="luci-theme-secubox"
TARGET_BASE="/www/luci-static/resources"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploying luci-theme-secubox to $ROUTER_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if theme directory exists
if [ ! -d "$THEME_DIR" ]; then
    echo "❌ Error: $THEME_DIR directory not found"
    exit 1
fi

# Create backup on router
echo "📦 Creating backup..."
ssh "$ROUTER_HOST" "if [ -d '$TARGET_BASE/secubox-theme' ]; then \
    cp -r '$TARGET_BASE/secubox-theme' '$TARGET_BASE/secubox-theme.bak.$(date +%Y%m%d_%H%M%S)'; \
    echo '✓ Backup created'; \
else \
    echo '✓ No existing theme to backup'; \
fi"

# Create target directory
echo "📁 Creating target directory..."
ssh "$ROUTER_HOST" "mkdir -p '$TARGET_BASE'"

# Create tarball of theme files
echo "📦 Creating theme tarball..."
TARBALL="/tmp/secubox-theme-$(date +%Y%m%d_%H%M%S).tar.gz"
(cd "$THEME_DIR/htdocs/luci-static/resources" && tar czf "$TARBALL" secubox-theme/)

# Copy to router
echo "🚀 Uploading theme to router..."
scp "$TARBALL" "$ROUTER_HOST:/tmp/secubox-theme.tar.gz"

# Extract on router
echo "📂 Extracting theme..."
ssh "$ROUTER_HOST" "cd '$TARGET_BASE' && tar xzf /tmp/secubox-theme.tar.gz && rm /tmp/secubox-theme.tar.gz"

# Set correct permissions
echo "🔐 Setting permissions..."
ssh "$ROUTER_HOST" "find '$TARGET_BASE/secubox-theme' -type f -name '*.css' -exec chmod 644 {} \; && \
    find '$TARGET_BASE/secubox-theme' -type f -name '*.js' -exec chmod 644 {} \; && \
    find '$TARGET_BASE/secubox-theme' -type f -name '*.json' -exec chmod 644 {} \; && \
    find '$TARGET_BASE/secubox-theme' -type d -exec chmod 755 {} \;"

# Clear LuCI cache
echo "🧹 Clearing LuCI cache..."
ssh "$ROUTER_HOST" "rm -rf /tmp/luci-*"

# Restart services
echo "🔄 Restarting services..."
ssh "$ROUTER_HOST" "/etc/init.d/uhttpd restart"

# Cleanup local tarball
rm -f "$TARBALL"

# Verify installation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh "$ROUTER_HOST" "if [ -f '$TARGET_BASE/secubox-theme/theme.js' ]; then \
    echo '✅ Theme controller: OK'; \
    echo '✅ CSS files: \$(find $TARGET_BASE/secubox-theme -name \"*.css\" | wc -l)'; \
    echo '✅ JS files: \$(find $TARGET_BASE/secubox-theme -name \"*.js\" | wc -l)'; \
    echo '✅ Translation files: \$(find $TARGET_BASE/secubox-theme/i18n -name \"*.json\" | wc -l)'; \
else \
    echo '❌ Theme installation failed'; \
    exit 1; \
fi"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Theme deployed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Usage in modules:"
echo "   'require secubox-theme/theme as Theme';"
echo ""
echo "📚 Documentation:"
echo "   - README: luci-theme-secubox/README.md"
echo "   - API Reference: luci-theme-secubox/USAGE.md"
echo ""
