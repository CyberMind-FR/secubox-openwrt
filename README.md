# SecuBox - Security Suite for OpenWrt

[![Build OpenWrt Packages](https://github.com/gkerma/secubox/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/gkerma/secubox/actions/workflows/build-openwrt-packages.yml)
[![Test & Validate](https://github.com/gkerma/secubox/actions/workflows/test-validate.yml/badge.svg)](https://github.com/gkerma/secubox/actions/workflows/test-validate.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

## 📚 Documentation pour Développeurs

**NOUVEAU (2025-12-26):** Guides complets de développement disponibles!

| Guide | Description | Public |
|-------|-------------|--------|
| **[DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md)** | ⭐ Guide complet: Design System, RPCD/ubus, ACL, JavaScript, CSS, Debugging (100+ pages) | Développeurs, IA assistants |
| **[QUICK-START.md](./QUICK-START.md)** | ⚡ Aide-mémoire rapide: Règles critiques, commandes, templates de code | Développeurs expérimentés |
| **[CLAUDE.md](./CLAUDE.md)** | 🏗️ Architecture & Build: SDK OpenWrt, structure fichiers, CI/CD | Claude Code, automation |
| **[deploy-module-template.sh](./deploy-module-template.sh)** | 🚀 Script de déploiement standardisé avec backup automatique | DevOps |

**⚠️ Règles Critiques:**
1. RPCD naming: fichier = objet ubus (`luci.system-hub`)
2. Menu paths: path menu = fichier vue (`system-hub/overview.js`)
3. Permissions: RPCD=755, CSS/JS=644
4. **TOUJOURS valider:** `./secubox-tools/validate-modules.sh`

**Design System (v0.3.0):** Inspiré de [demo Cybermind](https://cybermind.fr/apps/system-hub/demo.html)
- Palette dark: `#0a0a0f` (fond), `#6366f1→#8b5cf6` (gradients)
- Fonts: Inter (texte), JetBrains Mono (valeurs)
- CSS classes: `.sh-*` (System Hub), `.sb-*` (SecuBox)

---

## 🎯 Overview

SecuBox is a comprehensive security and network management suite for OpenWrt, providing a unified ecosystem of specialized dashboards and tools. All modules are compiled automatically for multiple OpenWrt architectures via GitHub Actions.

---

## 📦 SecuBox Modules

### 🎛️ Core Control

#### **luci-app-secubox** - SecuBox Central Hub
Unified security dashboard providing central management for all SecuBox components.

**Features:**
- Centralized dashboard for all modules
- Integrated monitoring and management
- Unified navigation interface

[View Details](luci-app-secubox/README.md)

---

#### **luci-app-system-hub** - System Control Center
Central control and remote assistance dashboard for OpenWrt.

**Features:**
- 🧩 Component management (start/stop/restart all services)
- 💚 Health monitoring with score (0-100) and recommendations
- 🖥️ Remote assistance via RustDesk integration
- 🔍 Diagnostic collection with anonymization
- 📋 Unified logs from all components
- 📅 Scheduled tasks (health reports, backups)

[View Details](luci-app-system-hub/README.md)

---

### 🔒 Security & Monitoring

#### **luci-app-crowdsec-dashboard** - Collaborative Security
Modern dashboard for CrowdSec intrusion prevention on OpenWrt.

**Features:**
- 🛡️ Real-time ban monitoring and alerts
- 📊 Decision management (view, search, ban/unban IPs)
- 📈 Metrics dashboard (engine stats, parsers, scenarios)
- 🌍 Geographic threat visualization
- ⚡ Auto-refresh with dark cybersecurity theme

[View Details](luci-app-crowdsec-dashboard/README.md)

---

#### **luci-app-netdata-dashboard** - Real-time Monitoring
System monitoring dashboard with live metrics visualization.

**Features:**
- 📊 CPU, memory, disk, network monitoring
- 🌡️ Temperature sensor readings
- ⚙️ Process monitor with resource usage
- 🎨 Animated gauges and sparklines
- 🔄 2-second auto-refresh

[View Details](luci-app-netdata-dashboard/README.md)

---

### 🌐 Network Intelligence

#### **luci-app-netifyd-dashboard** - Deep Packet Inspection
Network intelligence dashboard with DPI for OpenWrt.

**Features:**
- 🔍 Application detection (Netflix, YouTube, Zoom, etc.)
- 📡 Protocol identification (HTTP, HTTPS, DNS, QUIC)
- 🔄 Live network flow tracking
- 💻 Automatic device discovery
- 📊 Traffic categorization (Web, Streaming, Gaming, VoIP)

[View Details](luci-app-netifyd-dashboard/README.md)

---

#### **luci-app-network-modes** - Network Configuration
Configure different network operation modes with one click.

**Features:**
- 🔍 **Sniffer Bridge Mode**: Transparent inline bridge for traffic analysis with Netifyd DPI
- 👁️ **Sniffer Passive Mode**: Out-of-band monitoring via SPAN/TAP for zero-impact forensics
- 📶 **Access Point**: WiFi AP with 802.11r/k/v roaming and band steering
- 🔄 **Relay/Extender**: Network relay with WireGuard VPN and MTU optimization
- 🌐 **Router Mode**: Full router with proxy, HTTPS frontend, and virtual hosts
- 🎛️ One-click mode switching with automatic backup
- 📊 Real-time interface and service status monitoring

[View Details](luci-app-network-modes/README.md)

---

### 🔐 VPN & Access Control

#### **luci-app-wireguard-dashboard** - VPN Management
Modern WireGuard VPN monitoring dashboard.

**Features:**
- 🔐 Tunnel status monitoring
- 👥 Peer management (active/idle/inactive)
- 📊 Per-peer traffic statistics
- ⚙️ Configuration visualization
- 🔒 Secure (private keys never exposed)

[View Details](luci-app-wireguard-dashboard/README.md)

---

#### **luci-app-client-guardian** - Network Access Control
NAC system with captive portal, quarantine, and parental controls.

**Features:**
- 🔍 Real-time client detection and monitoring
- 🏠 Zone management (LAN, IoT, Guest, Quarantine)
- ⏳ Default quarantine policy for new clients
- 🚪 Modern captive portal with authentication
- 👨‍👩‍👧‍👦 Parental controls (time limits, content filtering)
- 🔔 SMS/Email alerts for security events

[View Details](luci-app-client-guardian/README.md)

---

#### **luci-app-auth-guardian** - Authentication System
Comprehensive authentication and session management.

**Features:**
- 🎨 Customizable captive portal
- 🔑 OAuth integration (Google, GitHub, Facebook, Twitter)
- 🎟️ Voucher system with time/bandwidth limits
- 🍪 Secure session management
- ⏭️ MAC/IP/Domain bypass rules

[View Details](luci-app-auth-guardian/README.md)

---

### 📊 Bandwidth & Traffic

#### **luci-app-bandwidth-manager** - QoS & Quotas
Advanced bandwidth management with automatic media detection.

**Features:**
- 🎯 8 configurable QoS priority classes
- 📊 Daily and monthly bandwidth quotas
- 🎬 Automatic media detection (VoIP, Gaming, Streaming)
- ⏰ Time-based scheduling (peak/off-peak)
- 👥 Per-client statistics and controls

[View Details](luci-app-bandwidth-manager/README.md)

---

#### **luci-app-media-flow** - Media Traffic Detection
Advanced streaming and media traffic monitoring.

**Features:**
- 🎬 Real-time streaming service detection
- 📡 Protocol identification (RTSP, HLS, DASH, RTP)
- 📞 VoIP/Video call monitoring
- 📊 Per-service bandwidth tracking
- 📈 Quality of experience metrics

**Supported Services:**
- Netflix, YouTube, Twitch, Disney+
- Spotify, Apple Music, Tidal
- Zoom, Teams, Google Meet, WebEx

[View Details](luci-app-media-flow/README.md)

---

### 🚀 Performance & Services

#### **luci-app-cdn-cache** - Bandwidth Optimization
Local CDN cache proxy for bandwidth savings.

**Features:**
- 💾 Smart caching of frequently accessed content
- 📊 Real-time hit ratio and bandwidth savings stats
- 📋 Configurable policies by domain/extension
- 🔧 Automatic purge and preload capabilities
- 📈 Statistical graphs and trends

**Cache Policies:**
- Windows Update, Linux Repos
- Static content (JS, CSS, images)
- Configurable TTL per content type

[View Details](luci-app-cdn-cache/README.md)

---

#### **luci-app-vhost-manager** - Virtual Hosts
Virtual host and local SaaS gateway management.

**Features:**
- 🏠 Internal virtual hosts with custom domains
- ↪️ External service redirection
- 🔒 SSL/TLS with Let's Encrypt or self-signed
- ⚙️ Automatic nginx reverse proxy configuration

**Supported Services:**
- Nextcloud, GitLab, Jellyfin
- Home Assistant and more

[View Details](luci-app-vhost-manager/README.md)

---

## 🏗️ Supported Architectures

SecuBox packages are automatically compiled for all major OpenWrt architectures:

### ARM 64-bit (AArch64)
| Target | Devices |
|--------|---------|
| `aarch64-cortex-a53` | ESPRESSObin, Sheeva64, BananaPi R64 |
| `aarch64-cortex-a72` | MOCHAbin, Raspberry Pi 4, NanoPi R4S |
| `aarch64-generic` | Rock64, Pine64, QEMU ARM64 |
| `mediatek-filogic` | GL.iNet MT3000, BananaPi R3 |
| `rockchip-armv8` | NanoPi R4S/R5S, FriendlyARM |
| `bcm27xx-bcm2711` | Raspberry Pi 4, Compute Module 4 |

### ARM 32-bit
| Target | Devices |
|--------|---------|
| `arm-cortex-a7-neon` | Orange Pi, BananaPi, Allwinner |
| `arm-cortex-a9-neon` | Linksys WRT, Turris Omnia |
| `qualcomm-ipq40xx` | Google WiFi, Zyxel NBG6617 |
| `qualcomm-ipq806x` | Netgear R7800, R7500 |

### MIPS
| Target | Devices |
|--------|---------|
| `mips-24kc` | TP-Link Archer, Ubiquiti |
| `mipsel-24kc` | Xiaomi, GL.iNet, Netgear |
| `mipsel-74kc` | Broadcom BCM47xx |

### x86
| Target | Devices |
|--------|---------|
| `x86-64` | PC, VMs, Docker, Proxmox |
| `x86-generic` | Legacy PC, old Atom |

---

## 📁 Repository Structure

```
secubox/
├── .github/
│   └── workflows/
│       ├── build-openwrt-packages.yml    # Multi-arch build CI
│       ├── build-secubox-images.yml      # Custom image builder
│       └── test-validate.yml             # Tests & validation
├── luci-app-secubox/                     # Central hub
├── luci-app-system-hub/                  # System control center
├── luci-app-crowdsec-dashboard/          # CrowdSec security
├── luci-app-netdata-dashboard/           # System monitoring
├── luci-app-netifyd-dashboard/           # DPI & traffic analysis
├── luci-app-wireguard-dashboard/         # WireGuard VPN
├── luci-app-network-modes/               # Network configuration
├── luci-app-client-guardian/             # NAC & captive portal
├── luci-app-auth-guardian/               # Authentication
├── luci-app-bandwidth-manager/           # QoS & quotas
├── luci-app-media-flow/                  # Media detection
├── luci-app-cdn-cache/                   # CDN proxy cache
├── luci-app-vhost-manager/               # Virtual hosts
├── makefiles/                            # Reference makefiles
├── secubox-tools/                        # Repair & debug tools
└── templates/                            # Package templates
```

### Package Structure (Standard LuCI App)
```
luci-app-*/
├── Makefile                              # OpenWrt package definition
├── README.md                             # Module documentation
├── htdocs/luci-static/resources/
│   ├── view/*/                           # JavaScript UI views
│   └── */
│       ├── api.js                        # RPC API client
│       └── dashboard.css                 # Module styles
└── root/
    ├── etc/config/                       # UCI configuration
    └── usr/
        ├── libexec/rpcd/                 # RPCD backend (shell/exec)
        └── share/
            ├── luci/menu.d/              # Menu JSON
            └── rpcd/acl.d/               # ACL permissions JSON
```

---

## 🚀 Installation

### Option 1: From Pre-built Packages

Download the latest packages from [GitHub Releases](https://github.com/gkerma/secubox/releases):

```bash
# Install individual modules
opkg update
opkg install luci-app-secubox_*.ipk

# Or install specific modules
opkg install luci-app-system-hub_*.ipk
opkg install luci-app-crowdsec-dashboard_*.ipk
opkg install luci-app-client-guardian_*.ipk
```

### Option 2: Build from Source

```bash
# Clone into OpenWrt SDK package directory
cd ~/openwrt-sdk/package/
git clone https://github.com/gkerma/secubox.git

# Build all packages
cd ~/openwrt-sdk/
make package/secubox/luci-app-secubox/compile V=s
make package/secubox/luci-app-system-hub/compile V=s
# ... etc for other modules
```

### Option 3: Add to OpenWrt Feed

Add to `feeds.conf.default`:
```
src-git secubox https://github.com/gkerma/secubox.git
```

Then:
```bash
./scripts/feeds update secubox
./scripts/feeds install -a -p secubox
make menuconfig  # Select modules under LuCI > Applications
make V=s
```

---

## 🔧 Development

### Create a New Module

```bash
# Copy template
cp -r templates/luci-app-template luci-app-newmodule

# Edit Makefile
cd luci-app-newmodule
vi Makefile  # Update PKG_NAME, PKG_VERSION, LUCI_TITLE, LUCI_DEPENDS

# Create required files
mkdir -p htdocs/luci-static/resources/{view/newmodule,newmodule}
mkdir -p root/usr/{libexec/rpcd,share/{luci/menu.d,rpcd/acl.d}}

# Implement your module...
```

### Test Locally

```bash
# Build package
make package/luci-app-newmodule/compile V=s

# Package will be in bin/packages/<arch>/base/
scp bin/packages/*/base/luci-app-newmodule_*.ipk root@router:/tmp/

# Install on router
ssh root@router
opkg install /tmp/luci-app-newmodule_*.ipk
/etc/init.d/rpcd restart
```

### Run Tests

```bash
# Lint and validate
shellcheck luci-app-*/root/usr/libexec/rpcd/*
jsonlint luci-app-*/root/usr/share/luci/menu.d/*.json
jsonlint luci-app-*/root/usr/share/rpcd/acl.d/*.json

# Or use GitHub Actions workflow
git push  # Triggers test-validate.yml
```

---

## 🤖 CI/CD

### Automated Builds

Packages are compiled automatically when:
- **Push to main/master**: Test compilation
- **Pull Request**: Validation and testing
- **Tag `v*`**: Release creation with all architectures

### Manual Build

1. Go to **Actions** → **Build OpenWrt Packages**
2. Click **Run workflow**
3. Select build options:
   - **Package name**: Choose a specific package or leave empty for all packages
   - **OpenWrt version**: 25.12.0-rc1, 24.10.5, 23.05.5, or SNAPSHOT
   - **Architectures**: `all` or comma-separated list

#### Build All Packages

Leave "Package name" empty and select architectures:

```bash
# Architecture examples
all                                    # All supported architectures
x86-64                                 # x86_64 only
aarch64-cortex-a53,aarch64-cortex-a72  # ARM64 devices
mips-24kc,mipsel-24kc                  # MIPS routers
```

#### Build Single Package

Select a specific package from the dropdown to build only that module:

- `luci-app-secubox` - Central Hub
- `luci-app-system-hub` - System Control Center
- `luci-app-crowdsec-dashboard` - CrowdSec Security
- `luci-app-netdata-dashboard` - System Monitoring
- `luci-app-netifyd-dashboard` - DPI & Traffic Analysis
- `luci-app-wireguard-dashboard` - WireGuard VPN
- `luci-app-network-modes` - Network Configuration
- `luci-app-client-guardian` - NAC & Captive Portal
- `luci-app-auth-guardian` - Authentication System
- `luci-app-bandwidth-manager` - QoS & Quotas
- `luci-app-media-flow` - Media Detection
- `luci-app-cdn-cache` - CDN Proxy Cache
- `luci-app-vhost-manager` - Virtual Hosts

**Use case**: Quickly test a single module after making changes, without waiting for all packages to build.

### Download Artifacts

1. Go to **Actions** → Select workflow run
2. Click on the run
3. Download **Artifacts** at bottom of page

Artifacts are organized by architecture:
```
packages-x86-64/
  ├── luci-app-secubox_1.0.0-1_all.ipk
  ├── luci-app-system-hub_1.0.0-1_all.ipk
  ├── luci-app-crowdsec-dashboard_1.0.0-1_all.ipk
  ├── ...
  └── SHA256SUMS
```

---

## 📊 OpenWrt Compatibility

| Version | Status | Notes |
|---------|--------|-------|
| 25.12.0-rc1 | 🧪 Testing | Latest RC, for testing only |
| 24.10.x | ✅ Supported | **Recommended** (latest stable) |
| 23.05.x | ✅ Supported | Previous stable |
| 22.03.x | ✅ Supported | LTS |
| 21.02.x | ⚠️ Partial | End of support |
| SNAPSHOT | ✅ Supported | Unstable, bleeding edge |

---

## 🧰 SecuBox Tools

### secubox-repair.sh
Automated repair tool for all SecuBox modules.

**Features:**
- Auto-detect and fix Makefile issues
- Generate missing RPCD files
- Validate package structure
- Batch repair all modules

```bash
./secubox-tools/secubox-repair.sh
```

### secubox-debug.sh
Debug and diagnostic tool for development.

**Features:**
- Validate package structure
- Check dependencies
- Test RPCD backends
- Generate diagnostic reports

```bash
./secubox-tools/secubox-debug.sh luci-app-module-name
```

---

## 🏷️ Creating Releases

```bash
# Create versioned tag
git tag -a v1.2.0 -m "Release 1.2.0: Add new features"
git push origin v1.2.0
```

The release will be created automatically with:
- Individual `.tar.gz` archives per architecture
- Global archive with all architectures
- SHA256 checksums
- Auto-generated release notes

---

## 🔗 Links

- **Documentation**: [CyberMind SecuBox](https://cybermind.fr/secubox)
- **Website**: [CyberMind.fr](https://cybermind.fr)
- **OpenWrt SDK**: [Documentation](https://openwrt.org/docs/guide-developer/using_the_sdk)
- **LuCI Development**: [Wiki](https://github.com/openwrt/luci/wiki)
- **Issue Tracker**: [GitHub Issues](https://github.com/gkerma/secubox/issues)

---

## 📄 License

Apache-2.0 © 2025 CyberMind.fr

Individual modules may have additional licensing terms - see each module's README.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👤 Author

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

---

**Made with ❤️ in France 🇫🇷**
