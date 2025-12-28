# Traffic Shaper - Advanced QoS Control

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active


LuCI application for advanced traffic shaping and Quality of Service (QoS) management using Linux Traffic Control (TC) and CAKE qdisc.

## Features

- **Traffic Class Management**: Create and manage bandwidth allocation classes with guaranteed (rate) and maximum (ceil) limits
- **Priority-Based Scheduling**: 8-level priority system for fine-grained traffic prioritization
- **Classification Rules**: Flexible rule system to classify traffic by:
  - Port numbers (source/destination)
  - IP addresses (source/destination)
  - DSCP markings
  - Protocol type
- **Real-Time Statistics**: Monitor per-class packet counts, byte counts, and drop statistics
- **Quick Presets**: One-click application of optimized configurations:
  - Gaming & Low-Latency
  - Video Streaming
  - Work From Home
  - Balanced (Default)
- **Visual Dashboard**: Traffic flow diagram with priority color coding
- **Multi-Interface Support**: Configure QoS on WAN, LAN, or any network interface

## Installation

```bash
opkg update
opkg install luci-app-traffic-shaper
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependencies

- `luci-base`: LuCI web interface framework
- `rpcd`: RPC daemon for backend communication
- `tc`: Linux traffic control utility
- `kmod-sched-core`: Kernel traffic scheduling modules
- `kmod-sched-cake`: CAKE qdisc kernel module

## Usage

### Access the Interface

Navigate to: **Network → Traffic Shaper**

The interface provides 5 main views:

1. **Overview**: Dashboard with status cards and traffic flow visualization
2. **Traffic Classes**: CRUD interface for bandwidth classes
3. **Classification Rules**: CRUD interface for traffic matching rules
4. **Statistics**: Real-time statistics for all traffic classes
5. **Presets**: Quick-apply optimized configurations

### Creating Traffic Classes

1. Go to **Network → Traffic Shaper → Traffic Classes**
2. Click **Add** to create a new class
3. Configure:
   - **Name**: Descriptive name (e.g., "Video Streaming")
   - **Priority**: 1 (highest) to 8 (lowest)
   - **Guaranteed Rate**: Minimum bandwidth (e.g., "5mbit")
   - **Maximum Rate (Ceil)**: Maximum allowed bandwidth (e.g., "50mbit")
   - **Interface**: Network interface (wan, lan, etc.)
   - **Enable**: Activate the class
4. Click **Save & Apply**

### Priority Guidelines

- **Priority 1-2**: Critical traffic (VoIP, gaming, real-time applications)
- **Priority 3-4**: Important traffic (video streaming, VPN)
- **Priority 5-6**: Normal traffic (web browsing, email)
- **Priority 7-8**: Bulk traffic (downloads, backups)

### Creating Classification Rules

1. Go to **Network → Traffic Shaper → Classification Rules**
2. Click **Add** to create a new rule
3. Configure:
   - **Traffic Class**: Select destination class
   - **Match Type**: Port, IP, DSCP, or Protocol
   - **Match Value**: Value to match
   - **Enable**: Activate the rule
4. Click **Save & Apply**

### Example Rules

| Match Type | Match Value | Description |
|------------|-------------|-------------|
| Destination Port | `80,443` | HTTP/HTTPS web traffic |
| Destination Port | `22` | SSH connections |
| Destination Port | `53` | DNS queries |
| Source IP | `192.168.1.0/24` | All traffic from LAN subnet |
| Destination IP | `8.8.8.8` | Traffic to Google DNS |
| DSCP | `EF` | Expedited Forwarding (VoIP) |
| Protocol | `udp` | All UDP traffic |

### Using Presets

1. Go to **Network → Traffic Shaper → Presets**
2. Review available presets and their configurations
3. Click **Apply This Preset** on your desired profile
4. Confirm the action (this will replace existing configuration)

## Configuration

### UCI Configuration

Configuration is stored in `/etc/config/traffic-shaper`:

```
config class 'gaming'
	option name 'Gaming Traffic'
	option priority '1'
	option rate '10mbit'
	option ceil '50mbit'
	option interface 'wan'
	option enabled '1'

config rule 'gaming_ports'
	option class 'gaming'
	option match_type 'dport'
	option match_value '3074,27015,25565'
	option enabled '1'
```

### Traffic Class Options

- `name`: Display name for the class
- `priority`: Priority level (1-8)
- `rate`: Guaranteed minimum bandwidth (format: `<number>[kmg]bit`)
- `ceil`: Maximum allowed bandwidth (format: `<number>[kmg]bit`)
- `interface`: Network interface name
- `enabled`: Enable/disable the class (0/1)

### Classification Rule Options

- `class`: Traffic class ID (UCI section name)
- `match_type`: Type of matching (`dport`, `sport`, `dst`, `src`, `dscp`, `protocol`)
- `match_value`: Value to match against
- `enabled`: Enable/disable the rule (0/1)

## Backend API

The RPCD backend (`luci.traffic-shaper`) provides these methods:

### Status Methods

- `status()`: Get current QoS system status
- `list_classes()`: List all traffic classes
- `list_rules()`: List all classification rules
- `get_stats()`: Get per-class statistics from TC

### Management Methods

- `add_class(name, priority, rate, ceil, interface)`: Create new class
- `update_class(id, name, priority, rate, ceil, interface, enabled)`: Update class
- `delete_class(id)`: Delete class
- `add_rule(class, match_type, match_value)`: Create classification rule
- `delete_rule(id)`: Delete rule

### Preset Methods

- `list_presets()`: Get available presets
- `apply_preset(preset_id)`: Apply preset configuration

## Technical Details

### Traffic Control Implementation

The module uses Linux Traffic Control (TC) with the following hierarchy:

1. **Root qdisc**: CAKE (Common Applications Kept Enhanced)
2. **Class hierarchy**: HTB (Hierarchical Token Bucket) for bandwidth allocation
3. **Filters**: U32 filters for traffic classification based on rules

### CAKE Features

- **Smart queuing**: Automatically manages queue sizes
- **Flow isolation**: Prevents single flows from monopolizing bandwidth
- **Latency reduction**: Minimizes bufferbloat
- **Per-host fairness**: Ensures fair bandwidth distribution

### Statistics Collection

Statistics are collected using `tc -s class show` and parsed to provide:
- Packet counts per class
- Byte counts per class
- Drop counts (packets dropped due to rate limiting)

Data is refreshed every 5 seconds in the Statistics view.

## Architecture

### Directory Structure

```
luci-app-traffic-shaper/
├── Makefile                              # OpenWrt package definition
├── README.md                             # This file
├── htdocs/luci-static/resources/
│   ├── view/traffic-shaper/              # JavaScript views
│   │   ├── overview.js                   # Dashboard view
│   │   ├── classes.js                    # Class management
│   │   ├── rules.js                      # Rule management
│   │   ├── stats.js                      # Statistics view
│   │   └── presets.js                    # Preset selection
│   └── traffic-shaper/
│       ├── api.js                        # RPC API client
│       └── dashboard.css                 # UI styles
└── root/
    ├── etc/config/
    │   └── traffic-shaper                # UCI configuration
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.traffic-shaper       # RPCD backend
        └── share/
            ├── luci/menu.d/              # Menu definition
            │   └── luci-app-traffic-shaper.json
            └── rpcd/acl.d/               # ACL permissions
                └── luci-app-traffic-shaper.json
```

### Frontend Components

- **Views**: LuCI views using `form.Map` and custom DOM rendering
- **API Client**: Wrapper for RPC calls with utility functions
- **Polling**: Auto-refresh for statistics (5-second interval)
- **Styling**: Custom CSS with priority color coding

### Backend Components

- **RPCD Script**: Shell script using jshn for JSON handling
- **UCI Integration**: Configuration stored in UCI format
- **TC Integration**: Direct TC commands for qdisc/class/filter management

## Troubleshooting

### Traffic Shaping Not Working

1. Verify CAKE module is loaded:
   ```bash
   lsmod | grep sch_cake
   ```

2. Check TC configuration:
   ```bash
   tc qdisc show
   tc class show dev wan
   tc filter show dev wan
   ```

3. Verify interface name:
   ```bash
   ip link show
   ```

### Classes Not Appearing

1. Restart RPCD:
   ```bash
   /etc/init.d/rpcd restart
   ```

2. Check UCI configuration:
   ```bash
   uci show traffic-shaper
   ```

3. Verify class is enabled:
   ```bash
   uci get traffic-shaper.<class_id>.enabled
   ```

### Statistics Not Updating

1. Check TC statistics:
   ```bash
   tc -s class show dev wan
   ```

2. Verify polling is active (check browser console)

3. Ensure classes are enabled and interface is correct

### Permission Errors

1. Verify ACL file is installed:
   ```bash
   ls -la /usr/share/rpcd/acl.d/luci-app-traffic-shaper.json
   ```

2. Check user permissions:
   ```bash
   ubus -v list luci.traffic-shaper
   ```

## Examples

### Example 1: Home Office Setup

**Classes**:
- Video Calls: Priority 1, 8mbit guaranteed, 50mbit max
- VPN Traffic: Priority 2, 10mbit guaranteed, 60mbit max
- Web Browsing: Priority 4, 5mbit guaranteed, 40mbit max

**Rules**:
- Zoom ports (8801-8810) → Video Calls
- Port 443 with VPN IP range → VPN Traffic
- Ports 80,443 → Web Browsing

### Example 2: Gaming + Streaming

**Classes**:
- Gaming: Priority 1, 5mbit guaranteed, 40mbit max
- Streaming: Priority 3, 15mbit guaranteed, 70mbit max
- Downloads: Priority 7, 2mbit guaranteed, 30mbit max

**Rules**:
- Gaming ports (3074, 27015, etc.) → Gaming
- Port 443 to Netflix/YouTube IPs → Streaming
- Port 80 → Downloads

### Example 3: Multi-User Household

Use the **Balanced** preset or create custom classes:
- High Priority: 10mbit → 60mbit (Priority 2)
- Normal: 15mbit → 80mbit (Priority 5)
- Bulk: 5mbit → 50mbit (Priority 7)

## Performance Considerations

- **CPU Usage**: TC processing uses minimal CPU on modern routers
- **Memory**: Each class uses ~1-2KB of kernel memory
- **Latency**: CAKE significantly reduces latency for interactive traffic
- **Throughput**: Minimal impact on total throughput (<1% overhead)

## License

Apache License 2.0

## Maintainer

SecuBox Project <secubox@example.com>

## Version

1.0.0

## See Also

- [Linux TC Documentation](https://man7.org/linux/man-pages/man8/tc.8.html)
- [CAKE qdisc](https://www.bufferbloat.net/projects/codel/wiki/Cake/)
- [OpenWrt Traffic Shaping](https://openwrt.org/docs/guide-user/network/traffic-shaping/start)
- [LuCI Development Guide](https://github.com/openwrt/luci/wiki)
