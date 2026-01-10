# Netifyd 5.2.1 Build Instructions for SecuBox OpenWrt

## Overview

Complete build instructions for integrating official Netifyd 5.2.1 into SecuBox OpenWrt solution.

## Package Structure

```
package/secubox/secubox-app-netifyd/
├── Makefile                  # OpenWrt package Makefile
├── Config.in                 # Package configuration options
├── README.md                 # Package documentation
├── INTEGRATION.md            # Integration guide
├── BUILD-INSTRUCTIONS.md     # This file
├── test-build.sh            # Automated build test script
├── files/
│   ├── netifyd.init         # Init script (procd)
│   ├── netifyd.config       # UCI configuration
│   └── functions.sh         # Helper functions
└── patches/                  # Patches (if needed)
```

## Prerequisites

### System Requirements

- **Build System:** x86_64 Linux (Ubuntu 20.04+ or Debian 11+ recommended)
- **Disk Space:** ~10 GB free
- **RAM:** 4 GB minimum, 8 GB recommended
- **Time:** ~30-60 minutes for full build

### Required Build Tools

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    clang \
    flex \
    bison \
    g++ \
    gawk \
    gcc-multilib \
    gettext \
    git \
    libncurses5-dev \
    libssl-dev \
    python3-distutils \
    rsync \
    unzip \
    zlib1g-dev \
    file \
    wget \
    curl \
    subversion \
    time \
    libelf-dev
```

## Quick Start

### Option 1: Automated Build Test

```bash
cd /path/to/secubox-openwrt/package/secubox/secubox-app-netifyd
./test-build.sh
```

This script will:
1. Check dependencies
2. Update feeds
3. Download source
4. Build package
5. Verify package contents

### Option 2: Manual Build

```bash
# 1. Navigate to OpenWrt root
cd /path/to/secubox-openwrt

# 2. Update feeds
./scripts/feeds update -a
./scripts/feeds install -a

# 3. Configure build
make menuconfig
# Navigate to: Network > netifyd
# Select: <*> netifyd

# Also select SecuBox components:
# SecuBox > <*> luci-app-secubox-netifyd

# 4. Download source
make package/secubox/secubox-app-netifyd/download V=s

# 5. Build package
make package/secubox/secubox-app-netifyd/compile V=s

# 6. Build LuCI app
make package/secubox/luci-app-secubox-netifyd/compile V=s
```

## Detailed Build Process

### Step 1: Prepare Build Environment

```bash
# Clone SecuBox OpenWrt (if not already done)
git clone https://github.com/your-repo/secubox-openwrt.git
cd secubox-openwrt

# Initialize and update feeds
./scripts/feeds update -a
./scripts/feeds install -a
```

### Step 2: Configure Package

```bash
# Run menuconfig
make menuconfig

# Navigate through menus:
# 1. Target System: (select your hardware)
# 2. Subtarget: (select your hardware variant)
# 3. Target Profile: (select your device)
#
# 4. Network >
#    <*> netifyd
#    [ ] Enable local flow export (optional)
#    [ ] Enable plugin support (optional)
#    [*] Auto-start on boot (recommended)
#
# 5. SecuBox >
#    <*> secubox-core
#    <*> luci-app-secubox-netifyd
#
# 6. Save and exit
```

### Step 3: Build

```bash
# Download all sources
make download V=s

# Build toolchain (first time only, takes ~30 minutes)
make toolchain/compile V=s

# Build netifyd package
make package/secubox/secubox-app-netifyd/compile V=s

# Build LuCI app
make package/secubox/luci-app-secubox-netifyd/compile V=s

# Or build everything at once
make V=s j=$(nproc)
```

### Step 4: Locate Built Packages

```bash
# Packages will be in:
find bin/packages -name "netifyd*.ipk"
find bin/packages -name "luci-app-secubox-netifyd*.ipk"

# Example output:
# bin/packages/aarch64_cortex-a53/secubox/netifyd_5.2.1-1_aarch64_cortex-a53.ipk
# bin/packages/aarch64_cortex-a53/secubox/luci-app-secubox-netifyd_1.0.1-1_all.ipk
```

## Installation on Device

### Transfer Packages

```bash
# Find device IP (usually 192.168.1.1 or 192.168.8.1)
DEVICE_IP="192.168.1.1"

# Copy packages
scp bin/packages/*/secubox/netifyd_*.ipk root@$DEVICE_IP:/tmp/
scp bin/packages/*/secubox/luci-app-secubox-netifyd_*.ipk root@$DEVICE_IP:/tmp/
```

### Install on Device

```bash
# SSH to device
ssh root@$DEVICE_IP

# On device:
# Update package list
opkg update

# Install netifyd (will install dependencies automatically)
opkg install /tmp/netifyd_*.ipk

# Install LuCI app
opkg install /tmp/luci-app-secubox-netifyd_*.ipk

# Start services
/etc/init.d/netifyd start
/etc/init.d/netifyd enable
/etc/init.d/rpcd reload

# Verify
netifyd -s
```

## Verification

### 1. Check Service Status

```bash
# On device:
/etc/init.d/netifyd status
ps | grep netifyd
netifyd -s
```

Expected output:
```
Netify Agent/5.2.1 (openwrt; aarch64; conntrack; netlink; ...)
✓ agent is running.
• agent timestamp: [current date/time]
• agent uptime: 0d 00:XX:XX
✓ active flows: XX
...
```

### 2. Check Data Files

```bash
# Status file should exist
cat /var/run/netifyd/status.json | jq .

# Socket should exist
ls -la /var/run/netifyd/netifyd.sock

# Should show: srwxr-xr-x 1 root root 0 ... netifyd.sock
```

### 3. Test RPCD Backend

```bash
# List available methods
ubus list | grep netifyd

# Test a call
ubus call luci.secubox-netifyd get_service_status

# Should return JSON with status information
```

### 4. Access Web Interface

```bash
# Open browser to:
http://[device-ip]/cgi-bin/luci/admin/secubox/netifyd/dashboard

# Navigate to: Services > Netifyd Dashboard

# Should see:
# - Service status (running/stopped)
# - Active flows count
# - Detected devices
# - Network statistics
```

## Troubleshooting Build Issues

### Issue: Download Fails

```bash
# Check download URL
curl -I https://download.netify.ai/source/netifyd-5.2.1.tar.gz

# If fails, update PKG_SOURCE_URL in Makefile
# Or download manually:
cd dl/
wget https://download.netify.ai/source/netifyd-5.2.1.tar.gz
cd ..
```

### Issue: Compilation Errors

```bash
# Clean and retry
make package/secubox/secubox-app-netifyd/clean
make package/secubox/secubox-app-netifyd/compile V=s 2>&1 | tee build.log

# Check build.log for errors

# Common fixes:
# 1. Missing dependencies - install via package manager
# 2. Toolchain issues - rebuild toolchain
# 3. Patch failures - check patches/ directory
```

### Issue: Missing Dependencies on Device

```bash
# On device, check what's missing:
opkg install /tmp/netifyd_*.ipk

# If dependencies missing, install them:
opkg update
opkg install libcurl libmnl libnetfilter-conntrack libpcap zlib libpthread

# Then retry netifyd install
```

## Build Customization

### Minimal Build (Smallest Size)

Edit `Makefile` CONFIGURE_ARGS:
```makefile
CONFIGURE_ARGS += \
	--enable-lean-and-mean \
	--disable-plugins \
	--disable-sink-plugins \
	--disable-libtcmalloc \
	--disable-jemalloc
```

### Debug Build

Edit `Makefile` CONFIGURE_ARGS:
```makefile
CONFIGURE_ARGS += \
	--enable-debug \
	--enable-debug-ether-type \
	--enable-debug-ndpi

TARGET_CFLAGS += -g -O0
```

### Custom Features

In `make menuconfig`:
```
Network > netifyd >
    [*] Enable local flow export
    [*] Enable plugin support
    [*] Enable sink plugins
    [ ] Enable debug output
```

## Build for Multiple Architectures

```bash
# Build for different targets
TARGET_ARCHS="aarch64_cortex-a53 arm_cortex-a9 x86_64"

for arch in $TARGET_ARCHS; do
    echo "Building for $arch..."
    make clean
    # Set target in menuconfig first
    make package/secubox/secubox-app-netifyd/compile V=s
    mkdir -p releases/$arch
    cp bin/packages/*/secubox/netifyd_*.ipk releases/$arch/
done
```

## Creating Release Packages

```bash
# Build all packages
make package/secubox/secubox-app-netifyd/compile V=s
make package/secubox/luci-app-secubox-netifyd/compile V=s

# Create release directory
mkdir -p releases/v5.2.1/

# Copy packages
cp bin/packages/*/secubox/netifyd_*.ipk releases/v5.2.1/
cp bin/packages/*/secubox/luci-app-secubox-netifyd_*.ipk releases/v5.2.1/

# Create checksums
cd releases/v5.2.1/
sha256sum *.ipk > SHA256SUMS
cd ../..

# Create tarball
tar czf secubox-netifyd-5.2.1-release.tar.gz releases/v5.2.1/
```

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Build Netifyd Package

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y build-essential ...
      - name: Build package
        run: |
          cd package/secubox/secubox-app-netifyd
          ./test-build.sh
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: netifyd-packages
          path: bin/packages/*/secubox/*.ipk
```

## Next Steps

After successful build and installation:

1. **Configuration:** Follow [README.md](README.md) for configuration options
2. **Integration:** See [INTEGRATION.md](INTEGRATION.md) for SecuBox integration
3. **Testing:** Run tests from [test-build.sh](test-build.sh)
4. **Documentation:** Read [README-FLOW-DATA.md](../luci-app-secubox-netifyd/README-FLOW-DATA.md) for flow data setup

## Support

- **Build Issues:** Check `build.log` and OpenWrt forums
- **Package Issues:** https://github.com/your-repo/issues
- **Netifyd Issues:** https://github.com/eglooca/netifyd/issues
- **OpenWrt Docs:** https://openwrt.org/docs/

## License

GPL-3.0-or-later (same as upstream netifyd)
