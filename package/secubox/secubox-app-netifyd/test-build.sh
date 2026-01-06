#!/bin/bash
#
# Netifyd Build Test Script
# Tests the netifyd package build process
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENWRT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "================================"
echo "Netifyd 5.2.1 Build Test"
echo "================================"
echo ""
echo "OpenWrt Root: $OPENWRT_ROOT"
echo "Package Dir: $SCRIPT_DIR"
echo ""

# Check if we're in OpenWrt buildroot
if [ ! -f "$OPENWRT_ROOT/rules.mk" ]; then
    echo "ERROR: Not in OpenWrt buildroot"
    echo "Please run this script from the OpenWrt tree"
    exit 1
fi

cd "$OPENWRT_ROOT"

echo "Step 1: Checking dependencies..."
echo "================================"

# Check for required tools
for tool in make gcc g++ wget tar patch; do
    if ! command -v $tool &> /dev/null; then
        echo "ERROR: Required tool not found: $tool"
        exit 1
    fi
    echo "  ✓ $tool"
done

echo ""
echo "Step 2: Updating feeds..."
echo "================================"
./scripts/feeds update -a || true
./scripts/feeds install -a || true

echo ""
echo "Step 3: Checking package configuration..."
echo "================================"

if [ ! -f "$SCRIPT_DIR/Makefile" ]; then
    echo "ERROR: Makefile not found"
    exit 1
fi
echo "  ✓ Makefile exists"

if [ ! -f "$SCRIPT_DIR/files/netifyd.init" ]; then
    echo "ERROR: Init script not found"
    exit 1
fi
echo "  ✓ Init script exists"

if [ ! -f "$SCRIPT_DIR/files/netifyd.config" ]; then
    echo "ERROR: Config file not found"
    exit 1
fi
echo "  ✓ Config file exists"

echo ""
echo "Step 4: Preparing build..."
echo "================================"

# Ensure menuconfig has been run
if [ ! -f ".config" ]; then
    echo "WARNING: .config not found, running defconfig..."
    make defconfig
fi

echo ""
echo "Step 5: Downloading source..."
echo "================================"
make package/secubox/secubox-app-netifyd/download V=s

echo ""
echo "Step 6: Checking source..."
echo "================================"
if [ -f "dl/netifyd-5.2.1.tar.gz" ]; then
    echo "  ✓ Source downloaded successfully"
    ls -lh dl/netifyd-5.2.1.tar.gz
else
    echo "ERROR: Source not downloaded"
    exit 1
fi

echo ""
echo "Step 7: Cleaning previous build..."
echo "================================"
make package/secubox/secubox-app-netifyd/clean V=s

echo ""
echo "Step 8: Building package..."
echo "================================"
echo "This may take several minutes..."
echo ""

if make package/secubox/secubox-app-netifyd/compile V=s; then
    echo ""
    echo "================================"
    echo "BUILD SUCCESSFUL!"
    echo "================================"
    echo ""

    # Find built package
    PKG_FILE=$(find bin/packages -name "netifyd_5.2.1-*.ipk" 2>/dev/null | head -1)

    if [ -n "$PKG_FILE" ]; then
        echo "Package built successfully:"
        ls -lh "$PKG_FILE"
        echo ""
        echo "Install with:"
        echo "  scp $PKG_FILE root@router:/tmp/"
        echo "  ssh root@router 'opkg install /tmp/$(basename $PKG_FILE)'"
    else
        echo "WARNING: Package file not found in bin/packages"
    fi

else
    echo ""
    echo "================================"
    echo "BUILD FAILED!"
    echo "================================"
    echo ""
    echo "Check the build log above for errors"
    exit 1
fi

echo ""
echo "Step 9: Verifying package contents..."
echo "================================"

if [ -n "$PKG_FILE" ]; then
    echo "Package contents:"
    tar -tzf "$PKG_FILE" 2>/dev/null | head -20
    echo "  ... (showing first 20 files)"
fi

echo ""
echo "================================"
echo "Build test completed successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Install package on target device"
echo "2. Run: /etc/init.d/netifyd start"
echo "3. Check status: netifyd -s"
echo "4. View dashboard: luci-app-secubox-netifyd"
echo ""
