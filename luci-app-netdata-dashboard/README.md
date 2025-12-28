# LuCI Netdata Dashboard

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active


![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02+-orange)

Real-time system monitoring dashboard for OpenWrt with a modern, responsive interface inspired by Netdata.

![Dashboard Preview](screenshots/dashboard-preview.png)

## Features

### 📊 Real-time Monitoring
- **CPU Usage**: Gauge visualization with sparkline history
- **Memory**: Stacked bar showing used/buffers/cached/free
- **Disk**: Per-filesystem usage with visual bars
- **Network**: Interface statistics with RX/TX totals
- **Temperature**: Sensor readings from thermal zones
- **Load Average**: 1/5/15 minute load display

### 🖥️ System Information
- Hostname, model, kernel version
- OpenWrt version and target
- Uptime with days/hours/minutes display
- CPU cores and frequency

### 🌐 Network Details
- Interface list with IP addresses
- Link state and speed detection
- Connection tracking statistics
- Per-interface traffic breakdown

### ⚙️ Process Monitor
- Running/sleeping process counts
- Process list with PID, user, command
- Memory usage per process
- State visualization

### 🎨 Modern Design
- Dark theme optimized for monitoring
- Responsive grid layout
- Animated gauges and sparklines
- GitHub-inspired color palette

## Screenshots

### Real-time View
![Real-time](screenshots/realtime.png)

### Network Statistics
![Network](screenshots/network.png)

### Process Monitor
![Processes](screenshots/processes.png)

## Installation

### Prerequisites

- OpenWrt 21.02 or later
- LuCI web interface

### From Source (Recommended)

```bash
# Clone into OpenWrt build environment
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/YOUR_USERNAME/luci-app-netdata-dashboard.git

# Update feeds and install
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a

# Enable in menuconfig
make menuconfig
# Navigate to: LuCI > Applications > luci-app-netdata-dashboard

# Build package
make package/luci-app-netdata-dashboard/compile V=s
```

### Manual Installation

```bash
# Transfer package to router
scp luci-app-netdata-dashboard_1.0.0-1_all.ipk root@192.168.1.1:/tmp/

# Install on router
ssh root@192.168.1.1
opkg install /tmp/luci-app-netdata-dashboard_1.0.0-1_all.ipk

# Restart services
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Usage

After installation, access the dashboard at:

**Status → Netdata Dashboard**

The dashboard has four tabs:
1. **Real-time**: Overview with gauges and sparklines
2. **System**: Detailed system information
3. **Network**: Interface statistics
4. **Processes**: Process monitor

Data refreshes automatically every 2 seconds.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LuCI JavaScript                       │
│              (realtime.js, system.js, etc.)             │
└───────────────────────────┬─────────────────────────────┘
                            │ ubus RPC
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    RPCD Backend                          │
│               /usr/libexec/rpcd/netdata                 │
└───────────────────────────┬─────────────────────────────┘
                            │ reads
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Linux Proc/Sys                         │
│     /proc/stat, /proc/meminfo, /sys/class/thermal       │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Description |
|--------|-------------|
| `stats` | Quick overview (CPU%, memory%, load, etc.) |
| `cpu` | Detailed CPU statistics and per-core data |
| `memory` | Memory breakdown (total, free, buffers, cached) |
| `disk` | Filesystem usage and I/O statistics |
| `network` | Interface stats and connection tracking |
| `processes` | Process list and counts |
| `sensors` | Temperature sensor readings |
| `system` | System information (hostname, kernel, uptime) |

## Customization

### Modifying Refresh Rate

Edit the poll interval in the view files:

```javascript
// In realtime.js
poll.add(L.bind(this.refresh, this), 2); // 2 seconds
```

### Adding Custom Metrics

Extend the RPCD backend script at `/usr/libexec/rpcd/netdata` to add new data sources.

## Requirements

- OpenWrt 21.02+
- LuCI (luci-base)
- rpcd with luci module

## Dependencies

- `luci-base`
- `luci-lib-jsonc`
- `rpcd`
- `rpcd-mod-luci`

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

- Inspired by [Netdata](https://netdata.cloud/)
- Built for [OpenWrt](https://openwrt.org/)
- Developed by [Gandalf @ CyberMind.fr](https://cybermind.fr)

## Related Projects

- [luci-app-statistics](https://github.com/openwrt/luci/tree/master/applications/luci-app-statistics) - collectd-based statistics
- [Netdata](https://github.com/netdata/netdata) - Full Netdata agent (x86 only)

---

Made with ❤️ for the OpenWrt community
