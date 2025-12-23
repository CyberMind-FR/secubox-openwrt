# LuCI Network Modes Dashboard

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02+-blue)

Configure your OpenWrt router for different network operation modes with a modern, intuitive interface.

![Dashboard Preview](screenshots/dashboard-preview.png)

## 🎯 Network Modes

### 🔍 Sniffer / Passthrough Mode
Transparent Ethernet bridge without IP address for passive network analysis.
- **Bridge mode** without IP configuration
- **Promiscuous mode** for all traffic capture
- **Netifyd integration** for Deep Packet Inspection
- Perfect for network forensics and traffic analysis

### 📶 Access Point Mode
WiFi access point with advanced optimizations.
- **802.11r** Fast BSS Transition (roaming)
- **802.11k** Radio Resource Management
- **802.11v** BSS Transition Management
- **Band Steering** (prefer 5GHz)
- **Beamforming** support
- Channel and TX power configuration

### 🔄 Relay / Extender Mode
Network relay with WireGuard optimization.
- **Relayd** bridge for network extension
- **WireGuard VPN** integration
- **MTU optimization** for tunnels
- **MSS clamping** for TCP
- **TCP BBR** congestion control

### 🌐 Router Mode
Full router with WAN, proxy and HTTPS frontends.
- **WAN protocols**: DHCP, Static, PPPoE, L2TP
- **NAT/Masquerade** with firewall
- **Web Proxy**: Squid, TinyProxy, Privoxy
- **Transparent proxy** option
- **DNS over HTTPS** support
- **HTTPS Reverse Proxy**: Nginx, HAProxy, Caddy
- **Multiple virtual hosts** with Let's Encrypt

## ✨ Features

- 🎛️ One-click mode switching with backup
- 📊 Real-time interface and service status
- ⚡ Optimized configurations per mode
- 🔐 Secure settings management
- 📱 Responsive design
- 🎨 Modern dark theme

## Installation

### Prerequisites

- OpenWrt 21.02 or later
- LuCI web interface

### From Source

```bash
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/gkerma/luci-app-network-modes.git

cd ~/openwrt
./scripts/feeds update -a && ./scripts/feeds install -a
make menuconfig  # LuCI > Applications > luci-app-network-modes
make package/luci-app-network-modes/compile V=s
```

### Manual Installation

```bash
scp luci-app-network-modes_*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1 "opkg install /tmp/luci-app-network-modes_*.ipk"
/etc/init.d/rpcd restart
```

### Access

**Network → Network Modes**

## Mode-Specific Dependencies

### Sniffer Mode
```bash
opkg install netifyd
```

### Access Point Mode
```bash
opkg install hostapd-openssl  # For WPA3/802.11r
```

### Relay Mode
```bash
opkg install relayd wireguard-tools
```

### Router Mode
```bash
# Proxy
opkg install squid  # or tinyproxy, privoxy

# Reverse Proxy
opkg install nginx-ssl  # or haproxy

# Let's Encrypt
opkg install acme acme-dnsapi
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LuCI JavaScript                       │
│  (overview.js, sniffer.js, accesspoint.js, relay.js,    │
│                      router.js)                          │
└───────────────────────────┬─────────────────────────────┘
                            │ ubus RPC
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    RPCD Backend                          │
│             /usr/libexec/rpcd/network-modes             │
└───────────────────────────┬─────────────────────────────┘
                            │ UCI / Shell
                            ▼
┌─────────────────────────────────────────────────────────┐
│              OpenWrt Configuration                       │
│     /etc/config/network, wireless, firewall, dhcp       │
└─────────────────────────────────────────────────────────┘
```

## API Methods

| Method | Description |
|--------|-------------|
| `status` | Current mode, interfaces, services status |
| `modes` | List all modes with configurations |
| `sniffer_config` | Sniffer mode settings |
| `ap_config` | Access Point mode settings |
| `relay_config` | Relay mode settings |
| `router_config` | Router mode settings |
| `apply_mode` | Switch to a different mode |
| `update_settings` | Update mode-specific settings |
| `add_vhost` | Add virtual host (router mode) |
| `generate_config` | Generate config preview |

## Configuration File

Settings are stored in `/etc/config/network-modes`:

```
config network-modes 'config'
    option current_mode 'router'
    option last_change '2024-12-19 15:30:00'
    option backup_config '1'

config mode 'sniffer'
    option bridge_interface 'br-lan'
    option netifyd_enabled '1'
    option promiscuous '1'

config mode 'accesspoint'
    option wifi_channel 'auto'
    option wifi_htmode 'VHT80'
    option wifi_txpower '20'
    option roaming_enabled '1'

config mode 'relay'
    option wireguard_enabled '1'
    option mtu_optimization '1'
    option mss_clamping '1'

config mode 'router'
    option wan_protocol 'dhcp'
    option nat_enabled '1'
    option firewall_enabled '1'
    option proxy_enabled '0'
    option https_frontend '0'
```

## Security

- Mode switching creates automatic backups
- Private keys never exposed via API
- ACL-based access control
- Firewall auto-configuration

## Screenshots

### Overview
![Overview](screenshots/overview.png)

### Access Point Settings
![Access Point](screenshots/accesspoint.png)

### Router with Virtual Hosts
![Router](screenshots/router.png)

## Contributing

Contributions welcome! Please submit issues and pull requests.

## License

Apache License 2.0 - See [LICENSE](LICENSE)

## Credits

- Built for [OpenWrt](https://openwrt.org/)
- Developed by [Gandalf @ CyberMind.fr](https://cybermind.fr)

---

Made with ⚙️ for flexible networking
