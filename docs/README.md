# SecuBox OpenWrt Documentation

Welcome to the **SecuBox** documentation. SecuBox is a privacy-focused mesh network appliance built on OpenWrt 24.10.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Wiki Home](wiki/Home.md) | Main wiki with module navigation |
| [Installation](wiki/Installation.md) | Getting started guide |
| [Quick Start](wiki/Quick-Start.md) | First-time setup |
| [Architecture](wiki/Architecture.md) | System architecture overview |
| [Module Catalog](wiki/Modules.md) | Complete list of 80+ modules |

---

## Documentation Index

### User Guides

| Guide | Description |
|-------|-------------|
| [SCREENSHOTS.md](SCREENSHOTS.md) | Module screenshot gallery (111 modules) |
| [UI-GUIDE.md](UI-GUIDE.md) | CRT P31 theme design guide |
| [MODULES.md](MODULES.md) | Package catalog with versions |
| [API.md](API.md) | RPCD/ubus API reference |

### Module Documentation

| Category | Wiki Page | Modules |
|----------|-----------|---------|
| Security | [wiki/modules/Security.md](wiki/modules/Security.md) | 15 modules |
| Network | [wiki/modules/Network.md](wiki/modules/Network.md) | 12 modules |
| Monitoring | [wiki/modules/Monitoring.md](wiki/modules/Monitoring.md) | 10 modules |
| VPN & Mesh | [wiki/modules/Mesh.md](wiki/modules/Mesh.md) | 7 modules |
| DNS | [wiki/modules/DNS.md](wiki/modules/DNS.md) | 6 modules |
| Apps | [wiki/modules/Apps.md](wiki/modules/Apps.md) | 20 modules |
| System | [wiki/modules/System.md](wiki/modules/System.md) | 14 modules |
| AI | [wiki/modules/AI.md](wiki/modules/AI.md) | 8 modules |

### Development

| Document | Description |
|----------|-------------|
| [development-guidelines.md](development-guidelines.md) | Coding standards |
| [module-implementation-guide.md](module-implementation-guide.md) | Creating new modules |
| [luci-development-reference.md](luci-development-reference.md) | LuCI JavaScript guide |
| [validation-guide.md](validation-guide.md) | Testing and validation |

---

## Project Overview

**SecuBox** provides:

- **Security**: CrowdSec IDS/IPS, WAF with mitmproxy, network isolation
- **Mesh Networking**: WireGuard VPN, P2P gossip protocol, automatic peer discovery
- **AI Integration**: Local AI with LocalAI/Ollama, sovereign data classification
- **Privacy**: Tor integration, anonymous service exposure, ZKP verification
- **Modern UI**: LuCI-based dashboard with CRT P31 phosphor green terminal theme

### Module Statistics

| Category | Count |
|----------|-------|
| LuCI Apps | 80+ |
| Backend Packages | 40+ |
| Service Apps | 20+ |
| **Total** | **140+** |

---

## Directory Structure

```
docs/
├── README.md              # This file
├── SCREENSHOTS.md         # Screenshot gallery (111 modules)
├── MODULES.md             # Package catalog
├── API.md                 # API reference
├── UI-GUIDE.md            # Theme documentation
├── screenshots/
│   └── router/            # OpenWrt router screenshots
└── wiki/
    ├── Home.md            # Wiki home
    ├── Installation.md    # Installation guide
    ├── Quick-Start.md     # Quick start
    ├── Architecture.md    # Architecture overview
    ├── Modules.md         # Module catalog
    └── modules/
        ├── Security.md    # Security modules
        ├── Network.md     # Network modules
        ├── Mesh.md        # VPN & Mesh modules
        ├── DNS.md         # DNS modules
        ├── Apps.md        # Application modules
        ├── System.md      # System modules
        └── AI.md          # AI modules
```

---

## Theme: CRT P31 Phosphor Green

SecuBox uses a retro CRT terminal aesthetic:

| Element | Color |
|---------|-------|
| Primary | `#33ff66` (phosphor peak) |
| Background | `#050803` (tube black) |
| Font | Monospace (Courier Prime) |
| Effects | Scanlines, phosphor glow |

![Theme Preview](screenshots/router/portal.png)

See [UI-GUIDE.md](UI-GUIDE.md) for full theme documentation.

---

## CLI Quick Reference

```bash
# System
secubox status              # System status
secubox version             # Version info

# Mesh
secuboxctl status           # Mesh status
secuboxctl peers            # List peers

# Security
cscli decisions list        # CrowdSec bans
cscli alerts list           # Recent alerts

# Network
haproxyctl vhost list       # List vhosts
wgctl status                # WireGuard status

# AI
aigatewayctl status         # AI Gateway status
```

---

## API Usage

All LuCI modules expose RPCD/ubus APIs:

```bash
# List methods
ubus list | grep luci.secubox

# Call method
ubus call luci.secubox-mesh status

# With parameters
ubus call luci.secubox-mesh scan_full '{}'
```

See [API.md](API.md) for complete documentation.

---

## Development

### Quick Deploy

```bash
# Deploy JS views
scp htdocs/luci-static/resources/view/secubox/*.js \
    root@192.168.255.1:/www/luci-static/resources/view/secubox/

# Deploy RPCD handler
scp root/usr/libexec/rpcd/<handler> \
    root@192.168.255.1:/usr/libexec/rpcd/
ssh root@192.168.255.1 '/etc/init.d/rpcd restart'

# Clear caches
ssh root@192.168.255.1 'rm -rf /tmp/luci-*'
```

### Build Package

```bash
# Sync to local feed
rsync -av --delete package/secubox/<pkg>/ secubox-tools/local-feed/<pkg>/

# Build
./secubox-tools/local-build.sh build <pkg>
```

---

## Support

- **Repository**: [github.com/gkerma/secubox-openwrt](https://github.com/gkerma/secubox-openwrt)
- **Wiki**: [github.com/gkerma/secubox-openwrt/wiki](https://github.com/gkerma/secubox-openwrt/wiki)
- **Issues**: [github.com/gkerma/secubox-openwrt/issues](https://github.com/gkerma/secubox-openwrt/issues)

---

*SecuBox v1.0.0 | CyberMind 2026*
