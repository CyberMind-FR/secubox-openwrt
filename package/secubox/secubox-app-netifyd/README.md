# Netifyd 5.2.1 for OpenWrt / SecuBox

Complete OpenWrt package for Netify Agent (netifyd) version 5.2.1 - Deep Packet Inspection engine.

## Overview

This package provides the latest official Netify Agent compiled for OpenWrt/SecuBox with full integration support.

### Features

- **Deep Packet Inspection (DPI)** - Detects 300+ protocols and applications
- **Flow Classification** - Real-time network flow analysis
- **Protocol Detection** - Identifies HTTP, HTTPS, SSH, DNS, BitTorrent, etc.
- **Application Detection** - Recognizes specific applications (YouTube, Netflix, WhatsApp, etc.)
- **Device Tracking** - Monitors all devices on the network
- **Cloud Integration** - Optional upload to Netify.ai cloud for analytics
- **Local Export** - Can export data locally for custom processing
- **Low Resource Usage** - Optimized "lean and mean" build for embedded systems

### Version Information

- **Netifyd Version:** 5.2.1 (Latest Official Release)
- **Source:** https://download.netify.ai/source/netifyd-5.2.1.tar.gz
- **License:** GPL-3.0-or-later
- **Maintainer:** CyberMind <contact@cybermind.fr>

## Installation

### Prerequisites

Required dependencies are automatically installed:
- libcurl
- libmnl
- libnetfilter-conntrack
- libpcap
- zlib
- libpthread
- libstdcpp
- libjson-c
- ca-bundle

### Building from Source

```bash
# From OpenWrt buildroot
cd /path/to/secubox-openwrt

# Select package
make menuconfig
# Navigate to: Network > netifyd
# Select: <M> or <*>

# Build package
make package/secubox/secubox-app-netifyd/compile V=s

# Package will be in: bin/packages/*/secubox/netifyd_5.2.1-1_*.ipk
```

### Installing on Device

```bash
# Copy package to device
scp netifyd_5.2.1-1_*.ipk root@192.168.1.1:/tmp/

# On device
opkg install /tmp/netifyd_5.2.1-1_*.ipk
```

## Configuration

### Quick Start

```bash
# Edit configuration
vi /etc/config/netifyd

# Enable auto-configuration (recommended)
uci set netifyd.default.enabled='1'
uci set netifyd.default.autoconfig='1'
uci commit netifyd

# Start service
/etc/init.d/netifyd start
/etc/init.d/netifyd enable

# Check status
netifyd -s
```

### Manual Interface Configuration

If auto-detection doesn't work, configure interfaces manually:

```bash
# Configure internal (LAN) interface
uci add_list netifyd.default.internal_if='br-lan'

# Configure external (WAN) interface
uci add_list netifyd.default.external_if='br-wan'

# Commit and restart
uci commit netifyd
/etc/init.d/netifyd restart
```

### Advanced Configuration

Edit `/etc/netifyd.conf` for advanced settings:

```ini
[netifyd]
# Enable/disable features
enable-conntrack = yes
enable-netlink = yes

# Socket configuration
socket-host = 127.0.0.1
socket-port = 7150

# Flow settings
flow-expiry = 180
flow-max = 65536

# Sink configuration (cloud upload)
sink-url = https://sink.netify.ai/
```

### Configuration Options

In `/etc/config/netifyd`:

```
config netifyd 'default'
	option enabled '1'
	option autoconfig '1'

	# Additional options:
	list options '-t'  # Disable conntrack thread
	list options '--thread-detection-cores=2'  # Set DPI cores
	list options '-j /tmp/netifyd-flows.json'  # Local JSON export
	list options '-v'  # Verbose logging

	# Manual interfaces:
	list internal_if 'br-lan'
	list external_if 'br-wan'
```

## Usage

### Command Line

```bash
# Show version and features
netifyd -V

# Show running status
netifyd -s

# Show agent UUID
netifyd -p

# Test configuration
netifyd -t

# Enable cloud sink
netifyd --enable-sink

# Disable cloud sink
netifyd --disable-sink
```

### Service Control

```bash
# Start service
/etc/init.d/netifyd start

# Stop service
/etc/init.d/netifyd stop

# Restart service
/etc/init.d/netifyd restart

# Check status
/etc/init.d/netifyd status

# Enable auto-start
/etc/init.d/netifyd enable

# Disable auto-start
/etc/init.d/netifyd disable
```

### Monitoring

```bash
# View status JSON
cat /var/run/netifyd/status.json | jq .

# Check running process
ps | grep netifyd

# View logs
logread | grep netifyd

# Check socket
ls -la /var/run/netifyd/
```

## Integration with SecuBox

This package integrates seamlessly with `luci-app-secubox-netifyd`:

```bash
# Install both packages
opkg install netifyd luci-app-secubox-netifyd

# Access web interface
# Navigate to: Services > Netifyd Dashboard
```

## Data Export

### Cloud Export (Netify.ai)

```bash
# Enable cloud sink
netifyd --enable-sink

# Check sink status
netifyd -s | grep sink

# View data at: https://dashboard.netify.ai
```

### Local Export

```bash
# Configure local JSON export
uci add_list netifyd.default.options='-j /tmp/netifyd-flows.json'
uci commit netifyd
/etc/init.d/netifyd restart

# View local data
cat /tmp/netifyd-flows.json | jq .
```

### Socket Export

```bash
# Connect to Unix socket
socat - UNIX-CONNECT:/var/run/netifyd/netifyd.sock

# Or TCP socket (if enabled)
nc localhost 7150
```

## Troubleshooting

### Service Won't Start

```bash
# Check configuration
netifyd -t

# Check interfaces
ip link show

# Check kernel modules
lsmod | grep nf_conntrack

# View detailed logs
logread -f | grep netifyd &
/etc/init.d/netifyd start
```

### No Flow Data

```bash
# Verify netifyd is running
ps | grep netifyd

# Check status
netifyd -s

# Verify interfaces are up
ifconfig

# Check conntrack
cat /proc/net/nf_conntrack | wc -l
```

### High CPU/Memory Usage

```bash
# Reduce detection threads
uci add_list netifyd.default.options='--thread-detection-cores=1'

# Disable conntrack thread
uci add_list netifyd.default.options='-t'

# Limit max flows
# Edit /etc/netifyd.conf:
# flow-max = 10000

# Restart service
uci commit netifyd
/etc/init.d/netifyd restart
```

### Permission Issues

```bash
# Check directories
ls -la /var/run/netifyd/
ls -la /etc/netify.d/

# Fix permissions
chmod 755 /var/run/netifyd
chmod 755 /etc/netify.d

# Recreate directories if needed
rm -rf /var/run/netifyd
/etc/init.d/netifyd start
```

## Performance Tuning

### For Low-End Devices (< 256MB RAM)

```bash
# Minimal configuration
uci set netifyd.default.options='-t'
uci add_list netifyd.default.options='--thread-detection-cores=1'

# Edit /etc/netifyd.conf:
flow-max = 5000
flow-expiry = 60
```

### For High-End Devices (> 512MB RAM)

```bash
# Maximum performance
uci add_list netifyd.default.options='--thread-detection-cores=4'

# Edit /etc/netifyd.conf:
flow-max = 65536
flow-expiry = 300
```

## File Locations

- **Binary:** `/usr/sbin/netifyd`
- **Configuration:** `/etc/netifyd.conf`
- **UCI Config:** `/etc/config/netifyd`
- **Init Script:** `/etc/init.d/netifyd`
- **Runtime Data:** `/var/run/netifyd/`
- **Persistent Data:** `/etc/netify.d/`
- **Status File:** `/var/run/netifyd/status.json`
- **Socket:** `/var/run/netifyd/netifyd.sock`

## Build Options

### Compile-Time Options

In `make menuconfig`, configure:

```
Network > netifyd
  [*] Enable local flow export
  [ ] Enable plugin support
  [ ] Enable sink plugins
  [ ] Enable debug output
  [*] Auto-start on boot
```

### Minimal Build

For smallest size, disable optional features:

```bash
# Edit Makefile CONFIGURE_ARGS:
--disable-plugins
--disable-sink-plugins
--enable-lean-and-mean
```

## Security Considerations

- Netifyd requires raw packet capture capabilities
- Runs as root by default (required for packet capture)
- Cloud sink transmits flow metadata to Netify.ai
- Local Unix socket has 755 permissions by default
- Consider firewall rules if exposing TCP socket

## Updates

To update to a newer version:

```bash
# Edit Makefile
PKG_VERSION:=5.x.x
PKG_HASH:=<new-hash>

# Rebuild
make package/secubox/secubox-app-netifyd/{clean,compile}
```

## Support

- **Netify.ai:** https://www.netify.ai/
- **Documentation:** https://www.netify.ai/resources
- **GitHub:** https://github.com/eglooca/netifyd
- **SecuBox Issues:** [Your repository]

## License

This package is licensed under GPL-3.0-or-later, same as upstream netifyd.

## Credits

- **Upstream:** eGloo Incorporated (Netify.ai)
- **OpenWrt Package:** CyberMind.fr (SecuBox Integration)
- **Original OpenWrt Package:** OpenWrt Packages Team

## Changelog

### 5.2.1-1 (2025-01-05)
- Updated to official netifyd 5.2.1
- Complete repackage for SecuBox integration
- Enhanced init script with auto-detection
- Improved configuration helpers
- Added comprehensive documentation
- Optimized for embedded systems
