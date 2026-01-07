# SecuBox Netifyd Deep Packet Inspection Interface

Complete LuCI interface for Netifyd DPI engine with real-time flow monitoring, application detection, and network analytics.

## Features

### Real-Time Monitoring
- **Live Flow Tracking**: Monitor active network flows in real-time via socket interface
- **Socket Integration**: Connect to Netifyd via TCP or Unix domain socket
- **Auto-Refresh**: Configurable polling intervals for live updates

### Application & Protocol Detection
- **Deep Packet Inspection**: Leverage Netifyd's DPI engine
- **Application Identification**: Detect and track applications (HTTP, HTTPS, SSH, DNS, etc.)
- **Protocol Analysis**: Identify network protocols and analyze traffic patterns
- **SSL/TLS Inspection**: Extract SSL certificate information and cipher details

### Device Tracking
- **Network Discovery**: Automatically detect devices on the network
- **Traffic Analytics**: Track upload/download statistics per device
- **MAC/IP Mapping**: Correlate MAC addresses with IP addresses
- **Last Seen Tracking**: Monitor device activity timestamps

### Service Management
- **Start/Stop/Restart**: Full control of Netifyd service
- **Enable/Disable**: Configure auto-start on boot
- **Status Monitoring**: View service health and uptime
- **Configuration**: Manage Netifyd settings via UCI

### Analytics & Reporting
- **Top Applications**: Visual charts of most-used applications
- **Top Protocols**: Protocol usage statistics
- **Traffic Statistics**: Total bytes, packets, and flow counts
- **Export Functionality**: Export flows to JSON or CSV format

## Requirements

- OpenWrt 21.02 or later
- LuCI (luci-base)
- netifyd package installed
- jq (for JSON processing)
- secubox-core

## Installation

### Via SecuBox App Store
```bash
# From LuCI Admin panel
Navigate to SecuBox → App Store → Search for "Netifyd"
Click "Install"
```

### Manual Installation
```bash
opkg update
opkg install luci-app-secubox-netifyd
service rpcd restart
```

## Configuration

### Basic Setup

1. Install netifyd:
```bash
opkg install netifyd
```

2. Configure netifyd socket (edit `/etc/netifyd.conf`):
```ini
[socket]
listen_path[0] = /var/run/netifyd/netifyd.sock
listen_address[0] = 127.0.0.1:7150
```

3. Start netifyd:
```bash
service netifyd start
service netifyd enable
```

4. Access LuCI interface:
```
Navigate to: SecuBox → Network Intelligence
```

### Advanced Configuration

Configure via LuCI Settings page or UCI:

```bash
uci set secubox-netifyd.settings.socket_address='127.0.0.1'
uci set secubox-netifyd.settings.socket_port='7150'
uci set secubox-netifyd.settings.auto_start='1'
uci set secubox-netifyd.monitoring.enable_app_detection='1'
uci set secubox-netifyd.analytics.enabled='1'
uci commit secubox-netifyd
```

## Usage

### Dashboard
- View real-time service status
- Monitor active flows, devices, and applications
- Quick statistics overview
- Service control buttons

### Live Flows
- Real-time flow table with auto-refresh
- Source/destination IP and ports
- Protocol and application detection
- Traffic statistics (bytes, packets, duration)
- Export flows to JSON/CSV

### Applications
- Top applications by traffic volume
- Flow counts per application
- Traffic percentage visualization
- Sortable application list

### Devices
- Active device list with MAC/IP addresses
- Upload/download statistics per device
- Last seen timestamps
- Total traffic tracking

### Settings
- Socket configuration (TCP/Unix)
- Flow retention and limits
- Monitoring toggles
- Analytics preferences
- Alert configuration

## API Methods

### Service Control
- `get_service_status` - Get Netifyd service status
- `service_start` - Start Netifyd service
- `service_stop` - Stop Netifyd service
- `service_restart` - Restart Netifyd service
- `service_enable` - Enable auto-start
- `service_disable` - Disable auto-start

### Data Retrieval
- `get_realtime_flows` - Get live flow data
- `get_flow_statistics` - Get flow statistics
- `get_top_applications` - Get top applications
- `get_top_protocols` - Get top protocols
- `get_detected_devices` - Get detected devices
- `get_dashboard` - Get dashboard summary

### Configuration
- `get_config` - Get current configuration
- `update_config` - Update configuration
- `get_interfaces` - Get monitored interfaces

### Utilities
- `clear_cache` - Clear flow cache
- `export_flows` - Export flows (JSON/CSV)

## Architecture

```
┌─────────────────────────────────────────────┐
│           LuCI Frontend (JavaScript)        │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Dashboard│ │  Flows   │ │Applications/ │ │
│  │         │ │          │ │   Devices    │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ RPC Calls
┌──────────────────▼──────────────────────────┐
│         RPCD Backend (Shell)                │
│  luci.secubox-netifyd                       │
│  ┌────────────────────────────────────────┐ │
│  │ Service Control │ Data Aggregation    │ │
│  │ Config Management │ Statistics        │ │
│  └────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ Socket/CLI
┌──────────────────▼──────────────────────────┐
│            Netifyd DPI Engine               │
│  ┌────────────────────────────────────────┐ │
│  │ Deep Packet Inspection                 │ │
│  │ Application Detection                  │ │
│  │ Protocol Analysis                      │ │
│  │ Flow Tracking                          │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Netifyd Socket Interface

Netifyd streams JSON data via:
- **TCP Socket**: `127.0.0.1:7150` (default)
- **Unix Socket**: `/var/run/netifyd/netifyd.sock`

### Example Flow Data Structure
```json
{
  "ip_orig": "192.168.1.100",
  "ip_resp": "93.184.216.34",
  "port_orig": 54321,
  "port_resp": 443,
  "protocol": "TCP",
  "application": "HTTPS",
  "bytes_orig": 12345,
  "bytes_resp": 98765,
  "packets_orig": 45,
  "packets_resp": 123,
  "duration": 120,
  "ssl_sni": "example.com"
}
```

## Troubleshooting

### Netifyd Not Starting
```bash
# Check netifyd installation
which netifyd

# Check configuration
cat /etc/netifyd.conf

# View logs
logread | grep netifyd

# Restart manually
/etc/init.d/netifyd restart
```

### Socket Connection Failed
```bash
# Test TCP socket
nc -z 127.0.0.1 7150

# Check netifyd process
ps | grep netifyd

# Verify socket configuration
grep listen /etc/netifyd.conf
```

### No Flow Data
```bash
# Check if netifyd is capturing
netifyd -s

# Verify interfaces
grep interface /etc/netifyd.conf

# Check dump file
cat /run/netifyd/sink-request.json
```

## Performance Considerations

- **Flow Limit**: Default 10,000 flows (configurable)
- **Retention**: Default 1 hour (configurable)
- **Polling Interval**: 3-10 seconds (configurable)
- **Display Limit**: 100 flows in UI (full export available)

## Security Notes

- Socket listens on localhost by default
- No external access without explicit configuration
- Flow data contains sensitive network information
- Recommend firewall rules if exposing socket externally

## Development

### File Structure
```
luci-app-secubox-netifyd/
├── Makefile
├── README.md
├── root/
│   ├── etc/config/secubox-netifyd
│   └── usr/
│       ├── libexec/rpcd/luci.secubox-netifyd
│       └── share/
│           ├── rpcd/acl.d/luci-app-secubox-netifyd.json
│           └── luci/menu.d/luci-app-secubox-netifyd.json
└── htdocs/luci-static/resources/
    ├── secubox-netifyd/
    │   ├── api.js
    │   └── netifyd.css
    └── view/secubox-netifyd/
        ├── dashboard.js
        ├── flows.js
        ├── applications.js
        ├── devices.js
        └── settings.js
```

## License

MIT License - Copyright (C) 2025 CyberMind.fr

## Links

- [Netifyd Official Site](https://www.netify.ai/)
- [Netifyd Documentation](https://www.netify.ai/documentation/)
- [OpenWrt Packages](https://openwrt.org/packages/)
- [SecuBox Project](https://github.com/CyberMind-FR/secubox-openwrt)

## Credits

- **Netify by eGloo**: Deep packet inspection engine
- **SecuBox Team**: LuCI integration and interface design
- **OpenWrt Community**: Platform and package ecosystem
## Collector Setup Script

Use `/usr/bin/netifyd-collector-setup` to enable the flow exporter and install the cron job
that runs `/usr/bin/netifyd-collector` every minute. The script accepts:

```
/usr/bin/netifyd-collector-setup [unix|tcp] [path_or_host[:port]]
```

Examples:

```
/usr/bin/netifyd-collector-setup unix /tmp/netifyd-flows.json
/usr/bin/netifyd-collector-setup tcp 127.0.0.1:9501
```

Each invocation updates `/etc/config/secubox-netifyd`, writes `/etc/netifyd.d/secubox-sink.conf`,
creates the cron entry (`* * * * * /usr/bin/netifyd-collector`), and restarts `netifyd`.
