# SecuBox - Security Suite for OpenWrt

Unified security dashboard providing central management for:

- **CrowdSec** - Collaborative intrusion prevention
- **Netdata** - Real-time system monitoring
- **Netifyd** - Deep packet inspection and traffic analysis
- **WireGuard** - Modern VPN
- **Network Modes** - Simplified network configuration
- **Client Guardian** - Access control and captive portal
- **System Hub** - System control center
- **CDN Cache** - Bandwidth optimization proxy
- **Traffic Shaper** - QoS, priorities, and quotas

## Installation

```bash
opkg update
opkg install luci-app-secubox
```

## Building

```bash
# Clone into OpenWrt SDK
git clone https://github.com/youruser/luci-app-secubox.git package/luci-app-secubox
make package/luci-app-secubox/compile V=s
```

## License

MIT License - CyberMind Security
