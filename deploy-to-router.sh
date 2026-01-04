#!/bin/bash
#
# Deploy SecuBox AppStore Updates to Router
#
# This script rebuilds and deploys the updated packages to your OpenWrt router.
#

set -e  # Exit on error

# Configuration
ROUTER_IP="${ROUTER_IP:-192.168.8.191}"
ROUTER_USER="${ROUTER_USER:-root}"
BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "======================================"
echo "SecuBox AppStore Update Deployment"
echo "======================================"
echo ""
echo "Build directory: $BUILD_DIR"
echo "Router: $ROUTER_USER@$ROUTER_IP"
echo ""

# Step 1: Rebuild packages
echo "[1/5] Rebuilding packages..."
cd "$BUILD_DIR"

if [ ! -f "./secubox-tools/local-build.sh" ]; then
    echo "ERROR: local-build.sh not found!"
    echo "Are you in the correct directory?"
    exit 1
fi

echo "Building secubox-core..."
./secubox-tools/local-build.sh build secubox-core

echo "Building luci-app-secubox-admin..."
./secubox-tools/local-build.sh build luci-app-secubox-admin

echo ""
echo "✓ Packages rebuilt successfully"
echo ""

# Step 2: Find built packages
echo "[2/5] Locating built packages..."

# Packages are in secubox-tools/build/x86-64/ when using local-build.sh
SECUBOX_CORE_PKG=$(find secubox-tools/build/x86-64 -name "secubox-core_*.ipk" 2>/dev/null | sort -V | tail -1)
SECUBOX_ADMIN_PKG=$(find secubox-tools/build/x86-64 -name "luci-app-secubox-admin_*.ipk" 2>/dev/null | sort -V | tail -1)

# Fallback: check SDK bin directory
if [ -z "$SECUBOX_CORE_PKG" ]; then
    SECUBOX_CORE_PKG=$(find secubox-tools/sdk/bin/packages -name "secubox-core_*.ipk" 2>/dev/null | sort -V | tail -1)
fi
if [ -z "$SECUBOX_ADMIN_PKG" ]; then
    SECUBOX_ADMIN_PKG=$(find secubox-tools/sdk/bin/packages -name "luci-app-secubox-admin_*.ipk" 2>/dev/null | sort -V | tail -1)
fi

if [ -z "$SECUBOX_CORE_PKG" ] || [ -z "$SECUBOX_ADMIN_PKG" ]; then
    echo "ERROR: Could not find built packages!"
    echo "Searched in:"
    echo "  - secubox-tools/build/x86-64/"
    echo "  - secubox-tools/sdk/bin/packages/"
    exit 1
fi

echo "Found:"
echo "  - $SECUBOX_CORE_PKG"
echo "  - $SECUBOX_ADMIN_PKG"
echo ""

# Step 3: Copy to router
echo "[3/5] Copying packages to router..."

scp "$SECUBOX_CORE_PKG" "$SECUBOX_ADMIN_PKG" "$ROUTER_USER@$ROUTER_IP:/tmp/"

echo ""
echo "✓ Packages copied to router /tmp/"
echo ""

# Step 4: Install on router
echo "[4/5] Installing packages on router..."

ssh "$ROUTER_USER@$ROUTER_IP" << 'ENDSSH'
set -e

cd /tmp

echo "Installing secubox-core..."
opkg install --force-reinstall secubox-core_*.ipk

echo "Installing luci-app-secubox-admin..."
opkg install --force-reinstall luci-app-secubox-admin_*.ipk

echo ""
echo "Installed packages:"
opkg list-installed | grep secubox | grep -E "(secubox-core|luci-app-secubox-admin)"

echo ""
echo "Restarting RPCD..."
/etc/init.d/rpcd restart

echo ""
echo "Verifying ACL file..."
if [ -f /usr/share/rpcd/acl.d/luci-app-secubox-admin.json ]; then
    echo "✓ ACL file exists"
    if grep -q "get_catalog_sources" /usr/share/rpcd/acl.d/luci-app-secubox-admin.json; then
        echo "✓ ACL contains new methods"
    else
        echo "⚠ ACL file missing new methods!"
    fi
else
    echo "✗ ACL file not found!"
fi

echo ""
echo "Cleaning up /tmp..."
rm -f /tmp/secubox-core_*.ipk /tmp/luci-app-secubox-admin_*.ipk

ENDSSH

echo ""
echo "✓ Packages installed on router"
echo ""

# Step 5: Verify
echo "[5/5] Verifying installation..."

ssh "$ROUTER_USER@$ROUTER_IP" << 'ENDSSH'
echo "Testing RPC methods..."

# Test catalog sources
if ubus -S call luci.secubox get_catalog_sources 2>&1 | grep -q "sources"; then
    echo "✓ get_catalog_sources works"
else
    echo "✗ get_catalog_sources failed"
fi

# Test check updates
if ubus -S call luci.secubox check_updates 2>&1 | grep -qE "updates|{"; then
    echo "✓ check_updates works"
else
    echo "✗ check_updates failed"
fi

ENDSSH

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Clear your browser cache (Ctrl+Shift+R)"
echo "2. Reload the LuCI admin interface"
echo "3. Navigate to Admin Control → Catalog Sources or Updates"
echo ""
echo "If issues persist:"
echo "- Check browser console for errors"
echo "- Verify ACL permissions: ssh $ROUTER_USER@$ROUTER_IP 'cat /usr/share/rpcd/acl.d/luci-app-secubox-admin.json'"
echo "- Test RPC: ssh $ROUTER_USER@$ROUTER_IP 'ubus -S call luci.secubox get_catalog_sources'"
echo ""
