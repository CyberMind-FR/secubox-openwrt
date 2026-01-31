# SecuBox - Security Suite for OpenWrt

**Version:** 0.17.0 🎉 **First Public Release**  
**Last Updated:** 2026-01-31  
**Status:** Production Ready  
**Modules:** 38 LuCI Applications

[![Build OpenWrt Packages](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/CyberMind-FR/secubox-openwrt?include_prereleases&label=release)](https://github.com/CyberMind-FR/secubox-openwrt/releases)

## 🎉 First Public Release

SecuBox v0.17.0 marks the **First Public Release** of the project. All core features are now stable and ready for production deployment.

### What's Ready

- ✅ **38 LuCI modules** — Complete security and network management suite
- ✅ **Three-Loop Security Architecture** — Operational, Tactical, and Strategic defense layers
- ✅ **CrowdSec Integration** — Real-time threat intelligence and automated blocking
- ✅ **Deep Packet Inspection** — netifyd/nDPId protocol analysis
- ✅ **WireGuard VPN** — Encrypted mesh connectivity
- ✅ **Multi-architecture support** — ARM64, ARM32, MIPS, x86

### Coming Next (v0.18+)

- 🔵 **P2P Hub** — Decentralized threat intelligence sharing
- 🔵 **did:plc Identity** — Self-sovereign node identity for trust networks

---

## Overview

SecuBox is a comprehensive security and network management suite for OpenWrt, providing a unified ecosystem of 38 specialized dashboards and tools. All modules are compiled automatically for multiple OpenWrt architectures via GitHub Actions.

**Website:** [secubox.maegia.tv](https://secubox.maegia.tv)  
**Publisher:** [CyberMind.fr](https://cybermind.fr)

---

## Three-Loop Security Architecture

SecuBox implements a **Three-Loop Security Model** for defense in depth:

```
┌────────────────────────────────────────────────────────┐
│            LOOP 3: STRATEGIC                           │
│            (Hours → Days)                              │
│   ┌────────────────────────────────────────────────┐  │
│   │         LOOP 2: TACTICAL                       │  │
│   │         (Minutes → Hours)                      │  │
│   │   ┌────────────────────────────────────────┐  │  │
│   │   │      LOOP 1: OPERATIONAL               │  │  │
│   │   │      (Milliseconds → Seconds)          │  │  │
│   │   │   DETECT → DECIDE → BLOCK              │  │  │
│   │   └────────────────────────────────────────┘  │  │
│   │   CORRELATE → ANALYZE → ADAPT                 │  │
│   └────────────────────────────────────────────────┘  │
│   AGGREGATE → ANTICIPATE → EVOLVE                     │
└────────────────────────────────────────────────────────┘
```

| Loop | Function | SecuBox Modules |
|------|----------|-----------------|
| **Loop 1** | Real-time blocking | nftables/fw4, netifyd DPI, CrowdSec Bouncer |
| **Loop 2** | Pattern correlation | CrowdSec Agent/LAPI, Scenarios, Netdata |
| **Loop 3** | Threat intelligence | CrowdSec CAPI, Blocklists, P2P Hub (v0.18+) |

See [DOCS/THREE-LOOP-ARCHITECTURE.md](DOCS/THREE-LOOP-ARCHITECTURE.md) for detailed analysis.

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
├── secubox-tools/             # Build tools and local SDK
├── DOCS/                      # Documentation
│   ├── THREE-LOOP-ARCHITECTURE.md  # Security model analysis
│   ├── DEVELOPMENT-GUIDELINES.md
│   ├── QUICK-START.md
│   └── VALIDATION-GUIDE.md
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

## Roadmap

| Phase | Version | Status | Focus |
|-------|---------|--------|-------|
| **Core Mesh** | v0.17 | ✅ Released | Loops 1+2 complete |
| **Service Mesh** | v0.18 | 🔵 In Progress | P2P Hub foundation |
| **Intelligence Mesh** | v0.19 | ⚪ Planned | Full P2P intelligence |
| **AI Mesh** | v0.20 | ⚪ Planned | ML in Loop 2 |
| **Certification** | v1.0 | ⚪ Planned | ANSSI certification |

---

## Links

* **Website**: [secubox.maegia.tv](https://secubox.maegia.tv)
* **GitHub**: [github.com/CyberMind-FR/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
* **Publisher**: [CyberMind.fr](https://cybermind.fr)
* **Issues**: [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)

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

**Ex Tenebris, Lux Securitas**

🇫🇷 Made with love in France
