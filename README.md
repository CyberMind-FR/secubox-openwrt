# SecuBox - Security Suite for OpenWrt

**Version:** 1.0.0-beta
**Last Updated:** 2026-03-15
**Status:** Beta — Ready for Pen Testing & Bug Bounty
**Modules:** 86 LuCI Applications

🌐 **Languages:** English | [Français](README.fr.md) | [中文](README.zh.md)

[![Build OpenWrt Packages](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/CyberMind-FR/secubox-openwrt?include_prereleases&label=release)](https://github.com/CyberMind-FR/secubox-openwrt/releases)

---

## Overview

SecuBox is a comprehensive security and network management suite for OpenWrt, providing a unified ecosystem of 86 specialized dashboards and tools. The platform implements a **Four-Layer Architecture** for defense in depth, featuring AI-powered threat analysis, P2P mesh networking, and multi-channel service exposure.

**Website:** [secubox.maegia.tv](https://secubox.maegia.tv)
**Publisher:** [CyberMind.fr](https://cybermind.fr)

---

## Four-Layer Architecture

```
+============================================================+
|              LAYER 4: MESH NETWORKING                       |
|              MirrorNet / P2P Hub / Services Mirrors         |
|  +--------------------------------------------------------+ |
|  |           LAYER 3: AI GATEWAY                          | |
|  |           MCP Server / Threat Analyst / DNS Guard      | |
|  |  +----------------------------------------------------+ | |
|  |  |         LAYER 2: TACTICAL                          | | |
|  |  |         CrowdSec / WAF / Scenarios                 | | |
|  |  |  +------------------------------------------------+ | | |
|  |  |  |       LAYER 1: OPERATIONAL                     | | | |
|  |  |  |       fw4 / DPI / Bouncer / HAProxy            | | | |
|  |  |  +------------------------------------------------+ | | |
|  |  +----------------------------------------------------+ | |
|  +--------------------------------------------------------+ |
+============================================================+
```

| Layer | Function | Time Scale | SecuBox Components |
|-------|----------|------------|-------------------|
| **Layer 1** | Real-time blocking | ms → seconds | nftables/fw4, netifyd DPI, CrowdSec Bouncer |
| **Layer 2** | Pattern correlation | minutes → hours | CrowdSec Agent/LAPI, mitmproxy WAF, Scenarios |
| **Layer 3** | AI analysis | minutes → hours | MCP Server, Threat Analyst, DNS Guard |
| **Layer 4** | Mesh networking | continuous | P2P Hub, MirrorBox, Services Registry |

---

## Key Features

### Security

- **CrowdSec Integration** — Real-time threat intelligence, CAPI enrollment, auto-banning
- **mitmproxy WAF** — HTTPS inspection with CVE detection, sensitivity-based auto-ban
- **Deep Packet Inspection** — netifyd/nDPId protocol analysis
- **MAC Guardian** — WiFi MAC spoofing detection with CrowdSec integration
- **DNS Guard** — AI-powered DGA, tunneling, and anomaly detection

### AI Gateway

- **MCP Server** — Model Context Protocol for Claude Desktop integration
- **Threat Analyst** — Autonomous AI agent for threat analysis and rule generation
- **LocalAI** — Self-hosted LLM with model management

### Mesh Networking

- **P2P Hub** — Decentralized peer discovery with globe visualization
- **MirrorBox** — Distributed service catalog with auto-sync
- **App Store** — P2P package distribution across mesh peers
- **Master Link** — Secure mesh onboarding with dynamic IPK generation

### Service Exposure

- **Punk Exposure** — Multi-channel service emancipation (Tor + DNS/SSL + Mesh)
- **HAProxy** — Load balancer with webroot ACME, auto-SSL
- **Tor Shield** — .onion hidden services with split-routing

### Media & Content

- **Jellyfin** — LXC media server with setup wizard
- **Lyrion** — Music server with CIFS integration
- **Zigbee2MQTT** — LXC Alpine container for IoT
- **Domoticz** — Home automation with MQTT bridge

---

## SecuBox Modules (86 Total)

### Core (6 modules)

| Module | Description |
|--------|-------------|
| luci-app-secubox | Central dashboard/Hub |
| luci-app-secubox-portal | Unified entry point with tabs |
| luci-app-secubox-admin | Admin control center |
| secubox-app-bonus | App store and documentation |
| luci-app-system-hub | System control with backup |
| luci-theme-secubox | KISS UI theme |

### Security (15 modules)

| Module | Description |
|--------|-------------|
| luci-app-crowdsec-dashboard | CrowdSec monitoring |
| luci-app-security-threats | Unified netifyd + CrowdSec |
| luci-app-client-guardian | Captive portal, parental controls |
| luci-app-auth-guardian | OAuth2/OIDC, vouchers |
| luci-app-exposure | Service exposure manager |
| luci-app-tor-shield | Tor anonymization |
| luci-app-mitmproxy | HTTPS inspection WAF |
| luci-app-mac-guardian | WiFi MAC security |
| luci-app-dns-guard | AI-powered DNS anomaly |
| luci-app-waf | Web Application Firewall |
| luci-app-threat-analyst | AI threat analysis |
| luci-app-ksm-manager | Key/HSM management |
| luci-app-master-link | Mesh onboarding |
| luci-app-routes-status | VHosts route checker |
| secubox-mcp-server | MCP protocol server |

### Network (12 modules)

| Module | Description |
|--------|-------------|
| luci-app-haproxy | Load balancer with SSL |
| luci-app-wireguard-dashboard | WireGuard VPN |
| luci-app-vhost-manager | Nginx reverse proxy |
| luci-app-network-modes | Sniffer/AP/Relay/Router |
| luci-app-network-tweaks | DNS & proxy controls |
| luci-app-dns-provider | DNS provider API |
| luci-app-cdn-cache | CDN optimization |
| luci-app-bandwidth-manager | QoS and quotas |
| luci-app-traffic-shaper | TC/CAKE shaping |
| luci-app-mqtt-bridge | USB-to-MQTT IoT |
| luci-app-media-flow | Streaming detection |
| luci-app-netdiag | Network diagnostics |

### DPI (2 modules)

| Module | Description |
|--------|-------------|
| luci-app-ndpid | nDPId deep packet inspection |
| luci-app-netifyd | netifyd flow monitoring |

### P2P Mesh (4 modules)

| Module | Description |
|--------|-------------|
| luci-app-p2p | P2P Hub with MirrorBox |
| luci-app-service-registry | Service catalog |
| luci-app-device-intel | Device intelligence |
| secubox-content-pkg | Content distribution |

### AI/LLM (4 modules)

| Module | Description |
|--------|-------------|
| luci-app-localai | LocalAI v3.9.0 |
| luci-app-ollama | Ollama LLM |
| luci-app-glances | System monitoring |
| luci-app-netdata-dashboard | Netdata real-time |

### Media (7 modules)

| Module | Description |
|--------|-------------|
| luci-app-jellyfin | Media server (LXC) |
| luci-app-lyrion | Music server |
| luci-app-zigbee2mqtt | Zigbee gateway (LXC) |
| luci-app-domoticz | Home automation (LXC) |
| luci-app-ksmbd | SMB/CIFS shares |
| luci-app-smbfs | Remote mount manager |
| luci-app-magicmirror2 | Smart display |

### Content Platforms (6 modules)

| Module | Description |
|--------|-------------|
| luci-app-gitea | Git platform |
| luci-app-hexojs | Static site generator |
| luci-app-metablogizer | Metabolizer CMS |
| luci-app-streamlit | Streamlit apps |
| luci-app-picobrew | PicoBrew server |
| luci-app-jitsi | Video conferencing |

### Remote Access (3 modules)

| Module | Description |
|--------|-------------|
| luci-app-rustdesk | RustDesk relay |
| luci-app-guacamole | Clientless desktop |
| luci-app-simplex | SimpleX Chat |

### *Plus 27 additional supporting packages...*

---

## Supported Architectures

| Architecture | Targets | Example Devices |
|--------------|---------|-----------------|
| **ARM64** | aarch64-cortex-a53/a72, mediatek-filogic, rockchip-armv8 | MOCHAbin, NanoPi R4S/R5S, GL.iNet MT3000, Raspberry Pi 4 |
| **ARM32** | arm-cortex-a7/a9-neon, qualcomm-ipq40xx | Turris Omnia, Google WiFi |
| **MIPS** | mips-24kc, mipsel-24kc | TP-Link Archer, Xiaomi |
| **x86** | x86-64 | PC, VMs, Docker, Proxmox |

---

## Installation

### From Pre-built Packages

```bash
opkg update
opkg install luci-app-secubox-portal_*.ipk
opkg install luci-app-crowdsec-dashboard_*.ipk
```

### Build from Source

```bash
# Clone into OpenWrt SDK
cd ~/openwrt-sdk/package/
git clone https://github.com/CyberMind-FR/secubox-openwrt.git secubox

# Build
make package/secubox/luci-app-secubox-portal/compile V=s
```

### Add as Feed

```
src-git secubox https://github.com/CyberMind-FR/secubox-openwrt.git
```

---

## MCP Integration (Claude Desktop)

SecuBox includes an MCP server for AI integration:

```json
{
  "mcpServers": {
    "secubox": {
      "command": "ssh",
      "args": ["root@192.168.255.1", "/usr/bin/secubox-mcp"]
    }
  }
}
```

**Available tools:** `crowdsec.alerts`, `crowdsec.decisions`, `waf.logs`, `dns.queries`, `network.flows`, `system.metrics`, `wireguard.status`, `ai.analyze_threats`, `ai.cve_lookup`, `ai.suggest_waf_rules`

---

## Roadmap

| Version | Status | Focus |
|---------|--------|-------|
| **v0.17** | Released | Core Mesh, 38 modules |
| **v0.18** | Released | P2P Hub, AI Gateway, 86 modules |
| **v0.19** | Released | Full P2P intelligence |
| **v1.0** | **Beta** | Pen testing, bug bounty, ANSSI prep |
| **v1.1** | Planned | ANSSI certification, GA release |

### Beta Release

See [BETA-RELEASE.md](BETA-RELEASE.md) for security testing guidelines and bug bounty scope.

### Default Credentials (VM Appliance)

- **Username:** root
- **Password:** c3box (change on first login!)

---

## Links

- **Website**: [secubox.maegia.tv](https://secubox.maegia.tv)
- **GitHub**: [github.com/CyberMind-FR/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **Publisher**: [CyberMind.fr](https://cybermind.fr)
- **Issues**: [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)

---

## License

Apache-2.0 © 2024-2026 CyberMind.fr

---

## Author

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

**Ex Tenebris, Lux Securitas**

Made in France
