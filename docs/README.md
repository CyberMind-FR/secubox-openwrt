# SecuBox OpenWrt Documentation

Welcome to the SecuBox OpenWrt documentation. This directory contains comprehensive documentation for the SecuBox mesh network appliance running on OpenWrt 24.10.

## Quick Links

| Document | Description |
|----------|-------------|
| [SCREENSHOTS.md](SCREENSHOTS.md) | Module screenshot gallery (CRT P31 theme) |
| [UI-GUIDE.md](UI-GUIDE.md) | UI/UX design guide and theme documentation |
| [MODULES.md](MODULES.md) | Complete module catalog with descriptions |
| [API.md](API.md) | RPCD/ubus API reference |

## Project Overview

**SecuBox** is a privacy-focused mesh network appliance built on OpenWrt. It provides:

- 🛡️ **Security**: CrowdSec IDS/IPS, WAF with mitmproxy, network isolation
- 🌐 **Mesh Networking**: WireGuard VPN, P2P gossip protocol, automatic peer discovery
- 🤖 **AI Integration**: Local AI with LocalAI/Ollama, sovereign data classification
- 📡 **Privacy**: Tor integration, anonymous service exposure, ZKP verification
- 🎨 **Modern UI**: LuCI-based dashboard with CRT P31 phosphor green terminal theme

## Screenshots Directory

Screenshots are organized by platform:

```
docs/
├── screenshots/
│   └── router/       # MochaBin/ARM64 router screenshots
└── wiki/             # Multilingual documentation
```

## Theme: CRT P31 Phosphor Green

The SecuBox UI uses a retro CRT terminal aesthetic:

- **Primary Color**: `#33ff66` (phosphor peak green)
- **Background**: `#050803` (deep tube black)
- **Font**: Monospace (Courier Prime, IBM Plex Mono)
- **Effects**:
  - Scanline overlay
  - Phosphor glow on text
  - Terminal boot sequence animation

![Theme Preview](screenshots/router/portal.png)

## Module Categories

### Core
- `secubox-core` - Base configuration and utilities
- `secubox-mesh` - Mesh daemon with topology management
- `secubox-identity` - DID generation and trust scoring
- `secubox-p2p` - P2P gossip protocol

### Security (12 modules)
- CrowdSec Dashboard, WAF Filters, MITM Proxy
- DNS Guard, Vortex DNS Firewall
- Auth/Client/MAC Guardian, ZKP verification

### Network (8 modules)
- Network Modes, Bandwidth Manager, Traffic Shaper
- HAProxy, Virtual Hosts, CDN Cache

### Monitoring (6 modules)
- Netdata integration, DPI (netifyd)
- Device Intel, Media Flow, Watchdog, LAN Flows

### Publishing (4 modules)
- Metablogizer, Droplet, Streamlit Forge, Metacatalog

### AI (4 modules)
- AI Gateway (data sovereignty), AI Insights
- LocalAI, Ollama integration

## API Reference

All LuCI modules expose RPCD/ubus APIs:

```bash
# List available methods
ubus list | grep luci.secubox

# Call a method
ubus call luci.secubox-mesh status

# Example: Get mesh topology
ubus call luci.secubox-mesh topology
```

See [API.md](API.md) for complete method documentation.

## Development

### Quick Deploy (without rebuild)

```bash
# Deploy JS views
scp htdocs/luci-static/resources/view/secubox/*.js root@192.168.255.1:/www/luci-static/resources/view/secubox/

# Deploy RPCD handler
scp root/usr/libexec/rpcd/<handler> root@192.168.255.1:/usr/libexec/rpcd/
ssh root@192.168.255.1 '/etc/init.d/rpcd restart'
```

### Build Package

```bash
# Sync to local feed
rsync -av --delete package/secubox/<pkg>/ secubox-tools/local-feed/<pkg>/

# Build
./secubox-tools/local-build.sh build <pkg>
```

## Support

- **Repository**: [github.com/gkerma/secubox-openwrt](https://github.com/gkerma/secubox-openwrt)
- **Wiki**: [github.com/gkerma/secubox-openwrt/wiki](https://github.com/gkerma/secubox-openwrt/wiki)
- **Issues**: [github.com/gkerma/secubox-openwrt/issues](https://github.com/gkerma/secubox-openwrt/issues)

---

*SecuBox v1.0.0 | CyberMind — 2026*
