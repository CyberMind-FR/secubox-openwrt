# SecuBox - Security Suite for OpenWrt

**Version:** 0.15.3
**Last Updated:** 2025-01-14
**Status:** Active Development

[![Build OpenWrt Packages](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

## Overview

SecuBox is a comprehensive security and network management suite for OpenWrt, providing a unified ecosystem of specialized dashboards and tools. All modules are compiled automatically for multiple OpenWrt architectures via GitHub Actions.

**Website:** [secubox.cybermood.eu](https://secubox.cybermood.eu)
**Publisher:** [CyberMind.fr](https://cybermind.fr)

---

## SecuBox Modules

### Core

| Module | Version | Status | Description |
|--------|---------|--------|-------------|
| **luci-app-secubox-portal** | 1.0.2 | Stable | Unified dashboard and navigation |
| **luci-app-system-hub** | 0.5.1 | Stable | Central system management |
| **luci-app-secubox** | 1.0.0 | Stable | SecuBox central hub |

### Security & Monitoring

| Module | Version | Status | Description |
|--------|---------|--------|-------------|
| **luci-app-crowdsec-dashboard** | 0.7.0 | Stable | CrowdSec collaborative threat protection |
| **luci-app-netdata-dashboard** | 0.5.0 | Stable | Real-time system monitoring |
| **secubox-auth-logger** | 1.2.2 | Stable | Authentication failure logging for CrowdSec |

### Network & Access Control

| Module | Version | Status | Description |
|--------|---------|--------|-------------|
| **luci-app-client-guardian** | 0.4.0 | Stable | Parental controls and device management |
| **luci-app-auth-guardian** | 0.4.0 | Stable | Captive portal and authentication |
| **luci-app-network-modes** | 0.5.0 | Stable | Network configuration (router/AP/bridge) |
| **luci-app-wireguard-dashboard** | 0.5.0 | Stable | WireGuard VPN management |

### Bandwidth & Performance

| Module | Version | Status | Description |
|--------|---------|--------|-------------|
| **luci-app-bandwidth-manager** | 0.5.0 | Stable | QoS and bandwidth quotas |
| **luci-app-traffic-shaper** | 0.4.0 | Stable | Traffic prioritization |
| **luci-app-cdn-cache** | 0.5.0 | Stable | Local cache for games and updates |
| **luci-app-media-flow** | 0.6.3 | Beta | Multimedia streaming |

### Services & Integration

| Module | Version | Status | Description |
|--------|---------|--------|-------------|
| **luci-app-vhost-manager** | 0.5.0 | Stable | Virtual hosts management |
| **luci-app-mqtt-bridge** | 0.4.0 | Stable | MQTT home automation integration |
| **luci-app-ksm-manager** | 0.4.0 | Stable | Kernel memory optimization |
| **luci-app-network-tweaks** | 1.0.0 | Stable | Advanced network optimizations |

---

## Supported Architectures

### ARM 64-bit (AArch64)
| Target | Devices |
|--------|---------|
| `aarch64-cortex-a53` | ESPRESSObin, BananaPi R64 |
| `aarch64-cortex-a72` | MOCHAbin, Raspberry Pi 4, NanoPi R4S |
| `mediatek-filogic` | GL.iNet MT3000, BananaPi R3 |
| `rockchip-armv8` | NanoPi R4S/R5S, FriendlyARM |
| `bcm27xx-bcm2711` | Raspberry Pi 4, Compute Module 4 |

### ARM 32-bit
| Target | Devices |
|--------|---------|
| `arm-cortex-a7-neon` | Orange Pi, BananaPi, Allwinner |
| `arm-cortex-a9-neon` | Linksys WRT, Turris Omnia |
| `qualcomm-ipq40xx` | Google WiFi, Zyxel NBG6617 |

### MIPS
| Target | Devices |
|--------|---------|
| `mips-24kc` | TP-Link Archer, Ubiquiti |
| `mipsel-24kc` | Xiaomi, GL.iNet, Netgear |

### x86
| Target | Devices |
|--------|---------|
| `x86-64` | PC, VMs, Docker, Proxmox |

---

## Installation

### From Pre-built Packages

Download from [GitHub Releases](https://github.com/CyberMind-FR/secubox-openwrt/releases):

```bash
opkg update
opkg install luci-app-secubox-portal_*.ipk
opkg install luci-app-system-hub_*.ipk
opkg install luci-app-crowdsec-dashboard_*.ipk
```

### Build from Source

```bash
# Clone into OpenWrt SDK
cd ~/openwrt-sdk/package/
git clone https://github.com/CyberMind-FR/secubox-openwrt.git secubox

# Build
cd ~/openwrt-sdk/
make package/secubox/luci-app-secubox-portal/compile V=s
```

### Add as OpenWrt Feed

Add to `feeds.conf.default`:
```
src-git secubox https://github.com/CyberMind-FR/secubox-openwrt.git
```

Then:
```bash
./scripts/feeds update secubox
./scripts/feeds install -a -p secubox
make menuconfig  # Select modules under LuCI > Applications
make V=s
```

---

## Repository Structure

```
secubox-openwrt/
├── package/secubox/           # All SecuBox packages
│   ├── luci-app-secubox-portal/
│   ├── luci-app-system-hub/
│   ├── luci-app-crowdsec-dashboard/
│   ├── luci-app-client-guardian/
│   ├── luci-app-wireguard-dashboard/
│   ├── luci-app-network-modes/
│   ├── luci-app-bandwidth-manager/
│   ├── luci-app-traffic-shaper/
│   ├── luci-app-cdn-cache/
│   ├── luci-app-auth-guardian/
│   ├── luci-app-media-flow/
│   ├── luci-app-vhost-manager/
│   ├── luci-app-mqtt-bridge/
│   ├── luci-app-ksm-manager/
│   ├── luci-app-network-tweaks/
│   ├── secubox-auth-logger/
│   └── ...
├── secubox-tools/             # Build tools and local feed
├── docs/                      # Documentation
└── .github/workflows/         # CI/CD
```

---

## OpenWrt Compatibility

| Version | Status | Package Format |
|---------|--------|----------------|
| 25.x | Testing | `.apk` |
| 24.10.x | **Recommended** | `.ipk` |
| 23.05.x | Supported | `.ipk` |

---

## Development

### Developer Documentation

| Guide | Description |
|-------|-------------|
| [DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md) | Design System, RPCD/ubus, ACL, JavaScript |
| [QUICK-START.md](./QUICK-START.md) | Quick reference and code templates |
| [CLAUDE.md](./CLAUDE.md) | OpenWrt shell scripting guidelines |

### Critical Rules

1. **RPCD naming**: filename = ubus object (`luci.system-hub`)
2. **Menu paths**: path = view file (`system-hub/overview.js`)
3. **Permissions**: RPCD=755, CSS/JS=644
4. **Validate**: `./secubox-tools/validate-modules.sh`

---

## Public Pages

SecuBox includes public pages accessible without authentication:

- **Crowdfunding Campaign** - Support the project development
- **Bug Bounty Program** - Security vulnerability reporting
- **Development Status** - Modules list, roadmap, changelog

Access at: `https://your-secubox/cgi-bin/luci/secubox-public/`

---

## Links

- **Website**: [secubox.cybermood.eu](https://secubox.cybermood.eu)
- **GitHub**: [github.com/CyberMind-FR/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **Publisher**: [CyberMind.fr](https://cybermind.fr)
- **Issues**: [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)

---

## License

Apache-2.0 © 2025 CyberMind.fr

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Author

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

**Made with love in France**
