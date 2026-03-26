# SecuBox Installation Guide

This guide covers installing SecuBox on OpenWrt 24.10.

---

## Requirements

### Hardware

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| CPU | ARMv8 / x86_64 | Cortex-A72 or better |
| RAM | 512 MB | 2 GB+ |
| Storage | 256 MB | 1 GB+ |
| Network | 1 Ethernet | 2+ Ethernet / WiFi |

### Supported Devices

- **MochaBin** (ARM64) - Primary reference platform
- **x86_64 VM** - VMware, VirtualBox, Proxmox, QEMU
- **Raspberry Pi 4** - With USB Ethernet adapter
- **Generic x86** - Any x86_64 with OpenWrt support

---

## Installation Methods

### Method 1: Pre-built Image (Recommended)

Download the pre-built SecuBox firmware image:

```bash
# For MochaBin ARM64
wget https://github.com/gkerma/secubox-openwrt/releases/latest/download/secubox-mochabin.img.gz
gunzip secubox-mochabin.img.gz
dd if=secubox-mochabin.img of=/dev/sdX bs=4M status=progress

# For x86_64 VM
wget https://github.com/gkerma/secubox-openwrt/releases/latest/download/secubox-x86-64.vmdk
```

### Method 2: Package Installation

Install SecuBox packages on existing OpenWrt:

```bash
# Add SecuBox feed
echo "src/gz secubox https://packages.secubox.in/releases/24.10" >> /etc/opkg/customfeeds.conf

# Update and install
opkg update
opkg install secubox-core secubox-mesh luci-theme-secubox

# Install all LuCI modules
opkg install luci-app-secubox-admin luci-app-crowdsec-dashboard \
    luci-app-wireguard-dashboard luci-app-haproxy
```

### Method 3: Build from Source

Build SecuBox using the OpenWrt SDK:

```bash
# Clone repository
git clone https://github.com/gkerma/secubox-openwrt.git
cd secubox-openwrt

# Sync local feed
for pkg in package/secubox/*/; do
  name=$(basename "$pkg")
  rsync -av --delete "$pkg" "secubox-tools/local-feed/$name/"
done

# Build packages
./secubox-tools/local-build.sh build luci-app-secubox
./secubox-tools/local-build.sh build secubox-core
```

---

## Post-Installation

### 1. Access LuCI

Open your browser and navigate to:

```
https://192.168.1.1
```

Default credentials:
- **Username**: `root`
- **Password**: `c3box`

### 2. Initial Configuration

1. Change the root password
2. Configure network interfaces
3. Set timezone and hostname
4. Enable SecuBox theme

### 3. Enable Services

```bash
# Start mesh daemon
/etc/init.d/secuboxd enable
/etc/init.d/secuboxd start

# Start CrowdSec
/etc/init.d/crowdsec enable
/etc/init.d/crowdsec start
```

---

## Upgrading

### Via sysupgrade

```bash
# Download latest firmware
wget https://github.com/gkerma/secubox-openwrt/releases/latest/download/secubox-sysupgrade.bin

# Upgrade (keep settings)
sysupgrade -v secubox-sysupgrade.bin
```

### Via opkg

```bash
opkg update
opkg upgrade secubox-core secubox-mesh luci-theme-secubox
```

---

## Troubleshooting

### Package conflicts

```bash
# Force reinstall
opkg install --force-reinstall secubox-core
```

### LuCI not loading

```bash
# Clear LuCI cache
rm -rf /tmp/luci-*
/etc/init.d/uhttpd restart
```

### Theme not applying

```bash
# Set theme via UCI
uci set luci.main.mediaurlbase=/luci-static/secubox
uci commit luci
```

---

See also:
- [Quick Start Guide](Quick-Start.md)
- [Architecture Overview](Architecture.md)
- [Module Catalog](Modules.md)

---

*SecuBox v1.0.0*
