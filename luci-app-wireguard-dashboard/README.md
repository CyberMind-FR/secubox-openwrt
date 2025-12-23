# LuCI WireGuard Dashboard

![Version](https://img.shields.io/badge/version-1.0.0-cyan)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02+-orange)

Modern and intuitive dashboard for WireGuard VPN monitoring on OpenWrt. Visualize tunnels, peers, and traffic in real-time.

![Dashboard Preview](screenshots/dashboard-preview.png)

## Features

### 🔐 Tunnel Status
- Real-time interface monitoring
- Public key display
- Listen port and MTU info
- Interface state (up/down)

### 👥 Peer Management
- Active/idle/inactive status
- Endpoint tracking
- Last handshake time
- Allowed IPs display
- Preshared key indicator

### 📊 Traffic Statistics
- Per-peer RX/TX bytes
- Per-interface totals
- Combined traffic view
- Visual progress bars

### ⚙️ Configuration View
- WireGuard config syntax display
- Interface and peer sections
- Tunnel visualization
- UCI integration info

### 🎨 Modern Interface
- Cyan/blue VPN tunnel theme
- Animated status indicators
- Responsive grid layout
- Real-time updates

## Screenshots

### Status Overview
![Status](screenshots/status.png)

### Peers List
![Peers](screenshots/peers.png)

### Traffic Statistics
![Traffic](screenshots/traffic.png)

### Configuration
![Config](screenshots/config.png)

## Installation

### Prerequisites

- OpenWrt 21.02 or later
- WireGuard installed (`kmod-wireguard`, `wireguard-tools`)
- LuCI web interface

```bash
# Install WireGuard
opkg update
opkg install kmod-wireguard wireguard-tools luci-proto-wireguard
```

### From Source

```bash
# Clone into OpenWrt build environment
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/gkerma/luci-app-wireguard-dashboard.git

# Update feeds and install
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a

# Enable in menuconfig
make menuconfig
# Navigate to: LuCI > Applications > luci-app-wireguard-dashboard

# Build package
make package/luci-app-wireguard-dashboard/compile V=s
```

### Manual Installation

```bash
# Transfer package to router
scp luci-app-wireguard-dashboard_1.0.0-1_all.ipk root@192.168.1.1:/tmp/

# Install on router
ssh root@192.168.1.1
opkg install /tmp/luci-app-wireguard-dashboard_1.0.0-1_all.ipk

# Restart services
/etc/init.d/rpcd restart
```

## Usage

After installation, access the dashboard at:

**VPN → WireGuard Dashboard**

The dashboard has four tabs:
1. **Status**: Overview with interfaces and active peers
2. **Peers**: Detailed peer information and status
3. **Traffic**: Bandwidth statistics per peer/interface
4. **Configuration**: Config file view and tunnel visualization

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LuCI JavaScript                       │
│          (status.js, peers.js, traffic.js)              │
└───────────────────────────┬─────────────────────────────┘
                            │ ubus RPC
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    RPCD Backend                          │
│           /usr/libexec/rpcd/wireguard-dashboard         │
└───────────────────────────┬─────────────────────────────┘
                            │ executes
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     wg show                              │
│                  WireGuard CLI Tool                      │
└───────────────────────────┬─────────────────────────────┘
                            │ manages
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   WireGuard Kernel Module                │
│                    Encrypted Tunnels                     │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Description |
|--------|-------------|
| `status` | Overall VPN status, interface/peer counts, total traffic |
| `interfaces` | Detailed interface info (pubkey, port, IPs, state) |
| `peers` | All peers with endpoint, handshake, traffic, allowed IPs |
| `traffic` | Per-peer and per-interface RX/TX statistics |
| `config` | Configuration display (no private keys exposed) |

## Peer Status Indicators

| Status | Meaning | Handshake Age |
|--------|---------|---------------|
| 🟢 Active | Recent communication | < 3 minutes |
| 🟡 Idle | No recent traffic | 3-10 minutes |
| ⚪ Inactive | No handshake | > 10 minutes or never |

## Requirements

- OpenWrt 21.02+
- `kmod-wireguard` (kernel module)
- `wireguard-tools` (wg command)
- `luci-proto-wireguard` (optional, for LuCI config)
- LuCI (luci-base)
- rpcd with luci module

## Dependencies

- `luci-base`
- `luci-lib-jsonc`
- `rpcd`
- `rpcd-mod-luci`
- `wireguard-tools`

## Security Notes

- Private keys are **never** exposed through the dashboard
- Only public keys and configuration are displayed
- All data is read-only (no config modifications)
- RPCD ACLs restrict access to authorized users

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

- Powered by [WireGuard®](https://www.wireguard.com/)
- Built for [OpenWrt](https://openwrt.org/)
- Developed by [Gandalf @ CyberMind.fr](https://cybermind.fr)

## Related Projects

- [luci-proto-wireguard](https://github.com/openwrt/luci) - WireGuard protocol support
- [wg-easy](https://github.com/WeeJeWel/wg-easy) - Web UI for WireGuard
- [wireguard-ui](https://github.com/ngoduykhanh/wireguard-ui) - Another WireGuard UI

---

Made with 🔐 for secure networking

*WireGuard is a registered trademark of Jason A. Donenfeld.*
