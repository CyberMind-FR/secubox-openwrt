# LuCI Netifyd Dashboard

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02+-orange)

Network Intelligence dashboard with Deep Packet Inspection for OpenWrt. Visualize applications, protocols, and devices on your network in real-time.

![Dashboard Preview](screenshots/dashboard-preview.png)

## Features

### 🔍 Deep Packet Inspection
- Real-time application detection (Netflix, YouTube, Zoom, etc.)
- Protocol identification (HTTP, HTTPS, DNS, QUIC, etc.)
- Traffic categorization (Web, Streaming, Gaming, VoIP)

### 🔄 Network Flows
- Live connection tracking
- Source/destination visualization
- Per-flow bandwidth statistics
- Protocol breakdown (TCP/UDP/ICMP)

### 📱 Application Intelligence
- Traffic by application
- Category distribution
- Historical usage data
- Top bandwidth consumers

### 💻 Device Discovery
- Automatic device detection
- Vendor identification (MAC OUI lookup)
- Hostname resolution via DHCP
- Network interface mapping

### 🎨 Modern Interface
- Purple/blue cyberpunk theme
- Animated charts and donut graphs
- Responsive grid layout
- Real-time data updates

## Screenshots

### Overview Dashboard
![Overview](screenshots/overview.png)

### Network Flows
![Flows](screenshots/flows.png)

### Applications
![Applications](screenshots/applications.png)

### Devices
![Devices](screenshots/devices.png)

## Installation

### Prerequisites

- OpenWrt 21.02 or later
- Netifyd package installed
- LuCI web interface

```bash
# Install netifyd
opkg update
opkg install netifyd

# Enable and start
/etc/init.d/netifyd enable
/etc/init.d/netifyd start
```

### From Source

```bash
# Clone into OpenWrt build environment
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/gkerma/luci-app-netifyd-dashboard.git

# Update feeds and install
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a

# Enable in menuconfig
make menuconfig
# Navigate to: LuCI > Applications > luci-app-netifyd-dashboard

# Build package
make package/luci-app-netifyd-dashboard/compile V=s
```

### Manual Installation

```bash
# Transfer package to router
scp luci-app-netifyd-dashboard_1.0.0-1_all.ipk root@192.168.1.1:/tmp/

# Install on router
ssh root@192.168.1.1
opkg install /tmp/luci-app-netifyd-dashboard_1.0.0-1_all.ipk

# Restart services
/etc/init.d/rpcd restart
```

## Usage

After installation, access the dashboard at:

**Status → Netifyd Dashboard**

The dashboard has four tabs:
1. **Overview**: Quick stats, protocol distribution, top applications
2. **Flows**: Real-time connection table with DPI info
3. **Applications**: Detected applications with traffic breakdown
4. **Devices**: Network device discovery and identification

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LuCI JavaScript                       │
│         (overview.js, flows.js, applications.js)        │
└───────────────────────────┬─────────────────────────────┘
                            │ ubus RPC
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    RPCD Backend                          │
│            /usr/libexec/rpcd/netifyd-dashboard          │
└───────────────────────────┬─────────────────────────────┘
                            │ reads
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Netifyd Agent                        │
│           Deep Packet Inspection Engine                  │
│         /var/run/netifyd/status.json                    │
└───────────────────────────┬─────────────────────────────┘
                            │ inspects
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Network Traffic                        │
│              (br-lan, eth0, wlan0, etc.)                │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Description |
|--------|-------------|
| `status` | Netifyd daemon status, version, uptime |
| `stats` | Quick overview stats (flows, devices, bandwidth) |
| `flows` | Active network connections with DPI data |
| `applications` | Detected applications and traffic |
| `protocols` | Protocol distribution (TCP/UDP/ICMP) |
| `devices` | Discovered network devices |

## What is Netifyd?

[Netifyd](https://www.netify.ai/) is a deep packet inspection daemon that identifies applications and protocols on your network. It's the open-source engine behind Netify network intelligence.

Key capabilities:
- Layer 7 application identification
- 300+ protocol signatures
- 1000+ application signatures
- Machine learning classification
- Low CPU/memory footprint

## Requirements

- OpenWrt 21.02+
- netifyd (DPI engine)
- LuCI (luci-base)
- rpcd with luci module

## Dependencies

- `luci-base`
- `luci-lib-jsonc`
- `rpcd`
- `rpcd-mod-luci`
- `netifyd`

## Configuration

Netifyd configuration is in `/etc/netifyd.conf`. Key options:

```
# Interfaces to monitor
[capture]
interface = br-lan
interface = eth0.2

# Enable flow tracking
[flow]
enable = yes
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Credits

- Powered by [Netifyd](https://www.netify.ai/) DPI engine
- Built for [OpenWrt](https://openwrt.org/)
- Developed by [Gandalf @ CyberMind.fr](https://cybermind.fr)

## Related Projects

- [Netifyd](https://gitlab.com/netify.ai/public/netify-agent) - DPI engine
- [luci-app-nlbwmon](https://github.com/openwrt/luci) - Bandwidth monitor
- [luci-app-statistics](https://github.com/openwrt/luci) - collectd statistics

---

Made with 💜 for the OpenWrt community
