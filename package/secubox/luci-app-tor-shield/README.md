English | [Francais](README.fr.md) | [中文](README.zh.md)

# Tor Shield - Anonymous Routing Made Simple

Network-wide privacy protection through the Tor network with one-click activation.

## ✨ Features

### 🛡️ Protection Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| 🌐 **Transparent Proxy** | All network traffic routed through Tor automatically | Full network anonymity |
| 🎯 **SOCKS Proxy** | Apps connect via SOCKS5 (127.0.0.1:9050) | Selective app protection |
| 🔓 **Bridge Mode** | Uses obfs4/meek bridges to bypass censorship | Restrictive networks |

### 🚀 Quick Start Presets

| Preset | Icon | Configuration |
|--------|------|---------------|
| **Full Anonymity** | 🛡️ | Transparent + DNS over Tor + Kill Switch |
| **Selective Apps** | 🎯 | SOCKS only, no kill switch |
| **Bypass Censorship** | 🔓 | Bridges enabled + obfs4 |

### 🔒 Security Features

- **🔐 Kill Switch** - Blocks all traffic if Tor disconnects
- **🌍 DNS over Tor** - Prevents DNS leaks
- **🔄 New Identity** - Request fresh circuits instantly
- **🔍 Leak Test** - Verify your protection is working
- **🧅 Hidden Services** - Host .onion sites

## 📊 Dashboard

The dashboard provides real-time monitoring:

```
┌──────────────────────────────────────────────────┐
│  🧅 Tor Shield                    🟢 Protected   │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────┐    Your Protection Status        │
│  │   🧅      │    ─────────────────────────      │
│  │  Toggle   │    Real IP:     192.168.x.x       │
│  │           │    Tor Exit:    185.220.x.x 🇩🇪   │
│  └────────────┘                                  │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🛡️ Full      │ 🎯 Selective │ 🔓 Censored  │ │
│  │ Anonymity    │ Apps         │ Bypass       │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  🔄 Circuits: 5  │ 📊 45 KB/s  │ ⏱ 2h 15m     │
│  📥 125 MB       │ 📤 45 MB    │              │
│                                                  │
│  ┌─────────┬─────────┬─────────┬─────────┐      │
│  │🟢Service│🟢Boot   │🟢DNS    │🟢Kill   │      │
│  │ Running │ 100%    │Protected│ Active  │      │
│  └─────────┴─────────┴─────────┴─────────┘      │
└──────────────────────────────────────────────────┘
```

## 🧅 Hidden Services

Host your services on the Tor network with .onion addresses:

```bash
# Via LuCI
Services → Tor Shield → Hidden Services → Add

# Via CLI
ubus call luci.tor-shield add_hidden_service '{"name":"mysite","local_port":80,"virtual_port":80}'

# Get onion address
cat /var/lib/tor/hidden_service_mysite/hostname
```

### Example Hidden Services

| Service | Local Port | Onion Port | Use Case |
|---------|-----------|------------|----------|
| Web Server | 80 | 80 | Anonymous website |
| SSH | 22 | 22 | Secure remote access |
| API | 8080 | 80 | Anonymous API endpoint |

## 🌉 Bridges

Bypass network censorship using Tor bridges:

### Bridge Types

| Type | Description | When to Use |
|------|-------------|-------------|
| **obfs4** | Obfuscated protocol | Most censored networks |
| **meek-azure** | Domain fronting via Azure | Highly restrictive networks |
| **snowflake** | WebRTC-based | Dynamic bridge discovery |

### Auto-Bridge Detection

```bash
# Enable automatic bridge selection
uci set tor-shield.main.auto_bridges=1
uci commit tor-shield
/etc/init.d/tor-shield restart
```

## 🔧 Configuration

### UCI Settings

```bash
# /etc/config/tor-shield

config tor-shield 'main'
    option enabled '1'
    option mode 'transparent'      # transparent | socks
    option dns_over_tor '1'        # Route DNS through Tor
    option kill_switch '1'         # Block traffic if Tor fails
    option auto_bridges '0'        # Auto-detect censorship

config socks 'socks'
    option port '9050'
    option address '127.0.0.1'

config trans 'trans'
    option port '9040'
    option dns_port '9053'
    list excluded_ips '192.168.255.0/24'  # LAN bypass

config bridges 'bridges'
    option enabled '0'
    option type 'obfs4'

config security 'security'
    option exit_nodes ''           # Country codes: {us},{de}
    option exclude_exit_nodes ''   # Avoid: {ru},{cn}
    option strict_nodes '0'

config hidden_service 'hs_mysite'
    option enabled '1'
    option name 'mysite'
    option local_port '80'
    option virtual_port '80'
```

## 📡 RPCD API

### Status & Control

```bash
# Get status
ubus call luci.tor-shield status

# Enable with preset
ubus call luci.tor-shield enable '{"preset":"anonymous"}'

# Disable
ubus call luci.tor-shield disable

# Restart
ubus call luci.tor-shield restart

# Request new identity
ubus call luci.tor-shield new_identity

# Check for leaks
ubus call luci.tor-shield check_leaks
```

### Circuit Management

```bash
# Get active circuits
ubus call luci.tor-shield circuits

# Response:
{
  "circuits": [{
    "id": "123",
    "status": "BUILT",
    "path": "$A~Guard,$B~Middle,$C~Exit",
    "purpose": "GENERAL",
    "nodes": [
      {"fingerprint": "ABC123", "name": "Guard"},
      {"fingerprint": "DEF456", "name": "Middle"},
      {"fingerprint": "GHI789", "name": "Exit"}
    ]
  }]
}
```

### Hidden Services

```bash
# List hidden services
ubus call luci.tor-shield hidden_services

# Add hidden service
ubus call luci.tor-shield add_hidden_service '{"name":"web","local_port":80,"virtual_port":80}'

# Remove hidden service
ubus call luci.tor-shield remove_hidden_service '{"name":"web"}'
```

### Bandwidth Stats

```bash
# Get bandwidth
ubus call luci.tor-shield bandwidth

# Response:
{
  "read": 125000000,      # Total bytes downloaded
  "written": 45000000,    # Total bytes uploaded
  "read_rate": 45000,     # Current download rate (bytes/sec)
  "write_rate": 12000     # Current upload rate (bytes/sec)
}
```

## 🛠️ Troubleshooting

### Tor Won't Start

```bash
# Check logs
logread | grep -i tor

# Verify config
tor --verify-config -f /var/run/tor/torrc

# Check control socket
ls -la /var/run/tor/control
```

### Slow Connections

1. **Check bootstrap** - Wait for 100% completion
2. **Try bridges** - Network may be throttling Tor
3. **Change circuits** - Click "New Identity"
4. **Check exit nodes** - Some exits are slow

### DNS Leaks

```bash
# Verify DNS is routed through Tor
nslookup check.torproject.org

# Should resolve via Tor DNS (127.0.0.1:9053)
```

### Kill Switch Issues

```bash
# Check firewall rules
iptables -L -n | grep -i tor

# Verify kill switch config
uci get tor-shield.main.kill_switch
```

## 📁 File Locations

| Path | Description |
|------|-------------|
| `/etc/config/tor-shield` | UCI configuration |
| `/var/run/tor/torrc` | Generated Tor config |
| `/var/run/tor/control` | Control socket |
| `/var/lib/tor/` | Tor data directory |
| `/var/lib/tor/hidden_service_*/` | Hidden service keys |
| `/tmp/tor_exit_ip` | Cached exit IP |
| `/tmp/tor_real_ip` | Cached real IP |

## 🔐 Security Notes

1. **Kill Switch** - Always enable for maximum protection
2. **DNS Leaks** - Enable DNS over Tor to prevent leaks
3. **Hidden Services** - Keys in `/var/lib/tor/` are sensitive - back them up securely
4. **Exit Nodes** - Consider excluding certain countries for sensitive use
5. **Bridges** - Use if your ISP blocks or throttles Tor

## 📜 License

MIT License - Copyright (C) 2025 CyberMind.fr
