# LuCI WireGuard Dashboard

Modern WireGuard VPN management interface for OpenWrt with setup wizard, peer management, and real-time monitoring.

## Features

- **Setup Wizard**: Create tunnels and peers in minutes with presets for common use cases
- **Dashboard Overview**: Real-time status of all tunnels and peers
- **Peer Management**: Add, remove, and configure peers with QR code generation
- **Traffic Monitoring**: Live bandwidth statistics per interface and peer
- **Client Config Export**: Generate configuration files and QR codes for mobile apps

## Installation

```bash
opkg update
opkg install luci-app-wireguard-dashboard
```

### Dependencies

- `wireguard-tools` - WireGuard userspace tools
- `luci-base` - LuCI web interface
- `qrencode` (optional) - For server-side QR code generation

## Setup Wizard

The wizard provides preset configurations for common VPN scenarios:

### Tunnel Presets

| Preset | Description | Default Port | Network |
|--------|-------------|--------------|---------|
| Road Warrior | Remote access for mobile users | 51820 | 10.10.0.0/24 |
| Site-to-Site | Connect two networks | 51821 | 10.20.0.0/24 |
| IoT Tunnel | Isolated tunnel for smart devices | 51822 | 10.30.0.0/24 |

### Peer Zone Presets

| Zone | Description | Tunnel Mode |
|------|-------------|-------------|
| Home User | Full network access | Full |
| Remote Worker | Office resources only | Split |
| Mobile Device | On-the-go access | Full |
| IoT Device | Limited VPN-only access | Split |
| Guest | Temporary visitor access | Full |
| Server/Site | Site-to-site connection | Split |

### Wizard Flow

1. **Select Tunnel Type** - Choose preset (Road Warrior, Site-to-Site, IoT)
2. **Configure Tunnel** - Set interface name, port, VPN network, public endpoint
3. **Select Peer Zones** - Choose which peer types to create
4. **Create** - Wizard generates keys, creates interface, adds peers, shows QR codes

## RPCD API

The dashboard communicates via `luci.wireguard-dashboard` RPCD object.

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `status` | - | Get overall WireGuard status |
| `interfaces` | - | List all WireGuard interfaces |
| `peers` | - | List all peers with status |
| `traffic` | - | Get traffic statistics |
| `generate_keys` | - | Generate new key pair + PSK |
| `create_interface` | name, private_key, listen_port, addresses, mtu | Create new WireGuard interface with firewall rules |
| `add_peer` | interface, name, allowed_ips, public_key, preshared_key, endpoint, persistent_keepalive | Add peer to interface |
| `remove_peer` | interface, public_key | Remove peer from interface |
| `interface_control` | interface, action (up/down/restart) | Control interface state |
| `generate_config` | interface, peer, private_key, endpoint | Generate client config file |
| `generate_qr` | interface, peer, private_key, endpoint | Generate QR code (requires qrencode) |

### Example: Create Interface via CLI

```bash
# Generate keys
keys=$(ubus call luci.wireguard-dashboard generate_keys '{}')
privkey=$(echo "$keys" | jsonfilter -e '@.private_key')

# Create interface
ubus call luci.wireguard-dashboard create_interface "{
  \"name\": \"wg0\",
  \"private_key\": \"$privkey\",
  \"listen_port\": \"51820\",
  \"addresses\": \"10.10.0.1/24\",
  \"mtu\": \"1420\"
}"
```

### Example: Add Peer via CLI

```bash
# Generate peer keys
peer_keys=$(ubus call luci.wireguard-dashboard generate_keys '{}')
peer_pubkey=$(echo "$peer_keys" | jsonfilter -e '@.public_key')
peer_psk=$(echo "$peer_keys" | jsonfilter -e '@.preshared_key')

# Add peer
ubus call luci.wireguard-dashboard add_peer "{
  \"interface\": \"wg0\",
  \"name\": \"Phone\",
  \"allowed_ips\": \"10.10.0.2/32\",
  \"public_key\": \"$peer_pubkey\",
  \"preshared_key\": \"$peer_psk\",
  \"persistent_keepalive\": \"25\"
}"
```

## Firewall Integration

When creating an interface via the wizard or `create_interface` API, the following firewall rules are automatically created:

1. **Zone** (`wg_<interface>`): INPUT/OUTPUT/FORWARD = ACCEPT
2. **Forwarding**: Bidirectional forwarding to/from `lan` zone
3. **WAN Rule**: Allow UDP traffic on listen port from WAN

## File Locations

| File | Purpose |
|------|---------|
| `/usr/libexec/rpcd/luci.wireguard-dashboard` | RPCD backend |
| `/www/luci-static/resources/wireguard-dashboard/api.js` | JavaScript API wrapper |
| `/www/luci-static/resources/view/wireguard-dashboard/*.js` | LuCI views |
| `/usr/share/luci/menu.d/luci-app-wireguard-dashboard.json` | Menu configuration |
| `/usr/share/rpcd/acl.d/luci-app-wireguard-dashboard.json` | ACL permissions |

## Troubleshooting

### Interface not coming up

```bash
# Check interface status
wg show wg0

# Check UCI configuration
uci show network.wg0

# Manually bring up
ifup wg0

# Check logs
logread | grep -i wireguard
```

### Peers not connecting

1. Verify firewall port is open: `iptables -L -n | grep 51820`
2. Check endpoint is reachable from client
3. Verify allowed_ips match on both ends
4. Check for NAT issues - enable PersistentKeepalive

### QR codes not generating

Install qrencode for server-side QR generation:
```bash
opkg install qrencode
```

The dashboard also supports client-side QR generation via JavaScript (no server dependency).

## License

Apache-2.0

## Author

CyberMind.fr - SecuBox Project
