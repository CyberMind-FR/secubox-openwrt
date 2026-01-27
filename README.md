# SecuBox - Security Suite for OpenWrt

**Version:** 0.16.0
**Last Updated:** 2026-01-27
**Status:** Active Development
**Modules:** 38 LuCI Applications

[![Build OpenWrt Packages](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

## Overview

SecuBox is a comprehensive security and network management suite for OpenWrt, providing a unified ecosystem of 38 specialized dashboards and tools. All modules are compiled automatically for multiple OpenWrt architectures via GitHub Actions.

**Website:** [secubox.cybermood.eu](https://secubox.cybermood.eu)
**Publisher:** [CyberMind.fr](https://cybermind.fr)

---

## SecuBox Modules

### SecuBox Core (5 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-secubox** | 0.7.1 | Central dashboard/Hub for all SecuBox modules |
| **luci-app-secubox-portal** | 0.7.0 | Unified entry point with tabbed navigation |
| **luci-app-secubox-admin** | 1.0.0 | Admin control center with appstore and monitoring |
| **luci-app-secubox-bonus** | 0.2.0 | Documentation, local repo, and app store |
| **luci-app-system-hub** | 0.5.1 | Central system control with logs and backup |

### Security & Threat Management (9 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-crowdsec-dashboard** | 0.7.0 | Real-time CrowdSec security monitoring |
| **luci-app-secubox-security-threats** | 1.0.0 | Unified netifyd DPI + CrowdSec intelligence |
| **luci-app-client-guardian** | 0.4.0 | Network access, captive portal, parental controls |
| **luci-app-auth-guardian** | 0.4.0 | OAuth2/OIDC authentication, voucher system |
| **luci-app-exposure** | 1.0.0 | Service exposure manager |
| **luci-app-tor-shield** | 1.0.0 | Tor anonymization dashboard |
| **luci-app-mitmproxy** | 0.4.0 | HTTPS traffic inspection |
| **luci-app-cyberfeed** | 0.1.1 | Cyberpunk RSS feed aggregator |
| **luci-app-ksm-manager** | 0.4.0 | Cryptographic key/HSM management |

### Deep Packet Inspection (2 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-ndpid** | 1.1.2 | nDPId deep packet inspection dashboard |
| **luci-app-secubox-netifyd** | 1.2.1 | netifyd DPI with real-time flow monitoring |

### Network & Connectivity (8 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-vhost-manager** | 0.5.0 | Nginx reverse proxy with Let's Encrypt SSL |
| **luci-app-haproxy** | 1.0.0 | Load balancer with vhosts and SSL |
| **luci-app-wireguard-dashboard** | 0.7.0 | WireGuard VPN monitoring |
| **luci-app-network-modes** | 0.5.0 | Sniffer, AP, Relay, Router modes |
| **luci-app-network-tweaks** | 1.0.0 | Auto Proxy DNS & Hosts from vhosts |
| **luci-app-mqtt-bridge** | 0.4.0 | USB-to-MQTT IoT hub |
| **luci-app-cdn-cache** | 0.5.0 | Content delivery optimization |
| **luci-app-media-flow** | 0.6.4 | Streaming detection (Netflix, YouTube, Spotify) |

### Bandwidth & Traffic Management (2 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-bandwidth-manager** | 0.5.0 | QoS rules, client quotas, SQM integration |
| **luci-app-traffic-shaper** | 0.4.0 | TC/CAKE traffic shaping |

### Content & Web Platforms (5 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-gitea** | 1.0.0 | Gitea Platform management |
| **luci-app-hexojs** | 1.0.0 | Hexo static site generator |
| **luci-app-metabolizer** | 1.0.0 | Metabolizer CMS support |
| **luci-app-magicmirror2** | 0.4.0 | MagicMirror2 smart display |
| **luci-app-mmpm** | 0.2.0 | MagicMirror Package Manager |

### AI/LLM & Analytics (4 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-localai** | 0.1.0 | LocalAI LLM management |
| **luci-app-ollama** | 0.1.0 | Ollama LLM management |
| **luci-app-glances** | 1.0.0 | Glances system monitoring |
| **luci-app-netdata-dashboard** | 0.5.0 | Real-time Netdata monitoring |

### Streaming & Data Processing (2 modules)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-streamlit** | 1.0.0 | Streamlit Platform management |
| **luci-app-picobrew** | 1.0.0 | PicoBrew Server management |

### IoT & Smart Devices (1 module)

| Module | Version | Description |
|--------|---------|-------------|
| **luci-app-zigbee2mqtt** | 1.0.0 | Zigbee2MQTT docker management |

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
├── package/secubox/           # All 38 SecuBox LuCI packages
│   ├── luci-app-secubox/      # Core hub
│   ├── luci-app-secubox-portal/
│   ├── luci-app-secubox-admin/
│   ├── luci-app-crowdsec-dashboard/
│   ├── luci-app-secubox-netifyd/
│   ├── luci-app-haproxy/
│   ├── luci-app-streamlit/
│   ├── luci-app-gitea/
│   ├── luci-app-hexojs/
│   └── ... (38 modules total)
├── secubox-tools/             # Build tools and local SDK
│   ├── local-build.sh         # Local package builder
│   ├── validate-modules.sh    # Module validation
│   ├── openwrt/               # Full toolchain (for Go/native builds)
│   └── sdk/                   # OpenWrt SDK (for LuCI apps)
├── DOCS/                      # Documentation
│   ├── DEVELOPMENT-GUIDELINES.md
│   ├── QUICK-START.md
│   └── VALIDATION-GUIDE.md
└── .github/workflows/         # CI/CD
```

### Build Requirements

**SDK builds** (for LuCI apps - shell/Lua packages):
```bash
./secubox-tools/local-build.sh build luci-app-crowdsec-dashboard
```

**Full toolchain builds** (for Go/native packages):
```bash
cd secubox-tools/openwrt
make package/crowdsec/compile V=s
```

| Package | Build Type | Reason |
|---------|------------|--------|
| `crowdsec` | Toolchain | Go binary with CGO |
| `crowdsec-firewall-bouncer` | Toolchain | Go binary with CGO |
| `netifyd` | Toolchain | C++ native binary |
| `nodogsplash` | Toolchain | C native binary |
| All `luci-app-*` | SDK | Shell/Lua/JS packages |

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
| [DOCS/DEVELOPMENT-GUIDELINES.md](./DOCS/DEVELOPMENT-GUIDELINES.md) | Design System, RPCD/ubus, ACL, JavaScript |
| [DOCS/QUICK-START.md](./DOCS/QUICK-START.md) | Quick reference and code templates |
| [DOCS/VALIDATION-GUIDE.md](./DOCS/VALIDATION-GUIDE.md) | Module validation procedures |
| [CLAUDE.md](./CLAUDE.md) | OpenWrt shell scripting guidelines |
| [secubox-tools/README.md](./secubox-tools/README.md) | Build tools and SDK usage |

### Critical Rules

1. **RPCD naming**: filename = ubus object (`luci.system-hub`)
2. **Menu paths**: path = view file (`system-hub/overview.js`)
3. **Permissions**: RPCD=755, CSS/JS=644
4. **Validate**: `./secubox-tools/validate-modules.sh`
5. **Go/native packages**: Use full toolchain, not SDK

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

Apache-2.0 © 2024-2026 CyberMind.fr

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
