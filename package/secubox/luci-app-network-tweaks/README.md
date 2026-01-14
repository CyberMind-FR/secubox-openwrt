# Network Services Dashboard (luci-app-network-tweaks)

**Unified network services monitoring with dynamic component discovery, cumulative impact tracking, and automatic DNS/hosts synchronization**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Apache--2.0-green.svg)
![Platform](https://img.shields.io/badge/platform-OpenWrt-orange.svg)

## Overview

Network Services Dashboard (formerly Network Tweaks) combines automated VHost DNS synchronization with comprehensive network services monitoring. It provides real-time visibility into all network-impacting services, their cumulative effect on your system, and integrates with Network Modes for profile-based configuration.

### Key Features

#### Network Services Dashboard (v2.0+)
- 🔍 **Dynamic Component Discovery** - Automatically discovers network-relevant services from the SecuBox plugin catalog
- 📊 **Cumulative Impact Tracking** - Real-time metrics showing total DNS entries, VHosts, and exposed ports
- 🎯 **Network Mode Integration** - Sync settings controlled by network mode profiles
- 🔄 **Auto-Refresh** - Live updates every 10 seconds
- 📡 **Multi-Source Data Aggregation** - Combines manifest metadata, install state, runtime status, and VHost associations
- 🎨 **Modern Grid UI** - Responsive card-based layout with detailed component views

#### Core Synchronization (v1.0+)
- **Automatic DNS Generation** - Creates DNSmasq configuration entries for all enabled VHost domains
- **Hosts File Management** - Updates `/etc/hosts` with VHost domain entries
- **Real-time Synchronization** - Watches VHost configuration changes and auto-updates
- **LuCI Integration** - User-friendly web interface with status dashboard
- **Flexible Configuration** - Choose which features to enable (DNS, hosts, or both)
- **Network Awareness** - Auto-detects LAN IP or allows manual override

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Network Services Dashboard](#network-services-dashboard)
- [Core Synchronization](#core-synchronization)
- [Configuration](#configuration)
- [Network Mode Integration](#network-mode-integration)
- [Technical Documentation](#technical-documentation)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Changelog](#changelog)

## Installation

```bash
# Build the package
make package/luci-app-network-tweaks/compile

# Install on router
opkg install luci-app-network-tweaks_*.ipk

# Enable and start
/etc/init.d/network-tweaks enable
/etc/init.d/network-tweaks start
```

## Quick Start

1. **Access the Dashboard**:
   - Navigate to **Network → Network Services Dashboard** in LuCI

2. **View Network Impact**:
   - See active components, DNS entries, VHosts, and exposed ports at a glance
   - Monitor individual service status and contributions

3. **Configure Synchronization**:
   - Enable DNS and/or hosts synchronization
   - Choose auto-sync or manual mode

4. **Integrate with VHost Manager**:
   - Enable VHosts in VHost Manager
   - Network Tweaks automatically makes them resolvable on your LAN

## Network Services Dashboard

### Architecture

```
Plugin Catalog Manifests → Discovery Engine → Data Aggregation → Dashboard Display
         ↓                        ↓                   ↓                 ↓
    *.json files          Network filter       Unified data         Grid cards
    (metadata)           (ports/protocols)      model (JSON)         + metrics
```

### Dashboard Sections

#### 1. Impact Summary

Four metric cards showing overall network impact:

| Metric | Description |
|--------|-------------|
| **Active Components** | Services currently running |
| **DNS Entries** | Total DNS records managed |
| **Published VHosts** | Virtual hosts configured |
| **Exposed Ports** | Network ports opened |

#### 2. Network Mode Status

Shows:
- Current network mode (Router, DMZ, Travel, etc.)
- Mode-specific sync settings
- Whether DNS sync is enabled

#### 3. Components Grid

Responsive grid of component cards, each showing:

**Status Badges**:
- 🟢 **Running** - Service active
- 🔴 **Stopped** - Service installed but not running
- ⚪ **N/A** - No runtime available

**Install State**:
- **Installed** - All packages present
- **Partial** - Some packages missing
- **Available** - Ready to install

**Network Impact**:
- 🌐 **DNS Entries** - Number of DNS records
- 📡 **VHosts** - Published virtual hosts
- 🔌 **Ports** - Network ports exposed

**Contribution**:
- Shows how much this component adds to overall config

**Actions**:
- **Details** - View full component information

### Component Details Modal

Click **Details** on any card to see:

```
Component: AdGuard Home
Category: network
Install State: installed
Service State: running

Network Impact:
• DNS Entries: 1
• VHosts: 1
• Ports: 2

Capabilities:
[dns-filtering] [ad-blocking] [vhost-publish]
```

### Discovery Process

1. **Manifest Scanning**: Scans `/usr/share/secubox/plugins/catalog/*.json`
2. **Network Filtering**: Identifies apps with network impact:
   - `network.inbound_ports[]` - Apps exposing network ports
   - `network.protocols[]` - Apps using network protocols
   - `capabilities[]` - Network-related capabilities
3. **State Queries**:
   - **Install State**: via `opkg status` or `apk info`
   - **Runtime State**: via `docker ps` or init.d services
   - **VHost Associations**: matches to published VHosts
4. **Impact Calculation**: Counts DNS entries, hosts, ports, VHosts
5. **Aggregation**: Combines into unified JSON response

### Network Relevance Detection

An app appears in the dashboard if its manifest contains:

**Network Ports**:
```json
{
  "network": {
    "inbound_ports": [53, 3000]
  }
}
```

**Network Protocols**:
```json
{
  "network": {
    "protocols": ["http", "https", "dns"]
  }
}
```

**Network Capabilities**:
```json
{
  "capabilities": [
    "vhost-publish",
    "dns-filtering",
    "proxy",
    "firewall",
    "vpn",
    "network-service"
  ]
}
```

## Core Synchronization

### How It Works

1. **Monitors VHosts**: Watches `/etc/config/vhosts` for enabled virtual hosts
2. **Generates Entries**:
   - **DNSmasq**: Creates `/tmp/dnsmasq.d/50-vhosts.conf` with `address=/domain/ip` entries
   - **Hosts**: Appends entries to `/etc/hosts` in managed section
3. **Auto-Reloads**: Automatically reloads DNSmasq when changes are detected
4. **Triggers**:
   - VHost configuration changes (via UCI triggers)
   - Network interface up events (LAN)
   - Manual sync via LuCI or CLI

### Generated Files

#### DNSmasq Configuration
**Location**: `/tmp/dnsmasq.d/50-vhosts.conf`

```
# Auto-generated DNS entries for VHost Manager domains
# Managed by network-tweaks
# IP: 192.168.1.1
# Generated: 2026-01-01 12:00:00

address=/cloud.local/192.168.1.1
address=/adguard.local/192.168.1.1
address=/domoticz.local/192.168.1.1
```

#### Hosts Entries
**Appended to**: `/etc/hosts`

```
# Managed by network-tweaks
# Auto-generated hosts entries for VHost Manager domains
# Generated: 2026-01-01 12:00:00
192.168.1.1 cloud.local
192.168.1.1 adguard.local
192.168.1.1 domoticz.local
```

### Command Line Usage

```bash
# Synchronize all entries
network-tweaks-sync sync

# View current status
network-tweaks-sync status

# Clean up all managed entries
network-tweaks-sync cleanup
```

### Service Management

```bash
# Enable auto-start
/etc/init.d/network-tweaks enable

# Start service
/etc/init.d/network-tweaks start

# Reload configuration (triggers sync)
/etc/init.d/network-tweaks reload

# Check status
/etc/init.d/network-tweaks status
```

## Configuration

### Web Interface Settings

Found under **Configuration** section in the dashboard:

| Option | Default | Description |
|--------|---------|-------------|
| **Enable Network Tweaks** | ✓ | Master switch for DNS/hosts synchronization |
| **Auto Sync** | ✓ | Automatically sync when VHost config changes |
| **Sync DNSmasq** | ✓ | Generate DNSmasq config for local domain resolution |
| **Sync /etc/hosts** | ✓ | Update /etc/hosts file with VHost domains |
| **LAN Interface** | `lan` | Network interface for IP address detection |
| **Override IP Address** | _empty_ | Manually specify IP (leave empty for auto-detect) |

### Configuration File

Edit `/etc/config/network_tweaks`:

```
config global 'global'
	option enabled '1'            # Enable/disable Network Tweaks
	option auto_sync '1'          # Auto-sync on config changes
	option sync_hosts '1'         # Update /etc/hosts
	option sync_dnsmasq '1'       # Generate DNSmasq config
	option lan_interface 'lan'    # Interface to use for IP
	option default_ip ''          # Manual IP override (empty = auto-detect)
```

## Network Mode Integration

Each network mode profile includes network-tweaks settings:

### Router Mode (Default)
```
config mode 'router'
	option network_tweaks_enabled '1'
	option network_tweaks_sync_hosts '1'
	option network_tweaks_sync_dnsmasq '1'
	option network_tweaks_auto_sync '1'
```

### Sniffer Mode (Transparent)
```
config mode 'sniffer'
	option network_tweaks_enabled '0'    # Disabled for transparency
	option network_tweaks_sync_hosts '0'
	option network_tweaks_sync_dnsmasq '0'
```

### Other Modes
All other modes (DMZ, Access Point, Relay, Double NAT, Travel, Multi-WAN, VPN Relay) enable network-tweaks with full synchronization.

## Technical Documentation

### Backend RPC API

#### `getNetworkComponents`

Returns all network-relevant components with aggregated data.

**Request**: No parameters

**Response**:
```json
{
  "success": true,
  "components": [
    {
      "id": "adguardhome",
      "name": "AdGuard Home",
      "category": "network",
      "install_state": "installed",
      "service_state": "running",
      "network_impact": {
        "dns_entries": 1,
        "vhosts": 1,
        "ports": 2
      },
      "cumulative_contribution": {
        "dnsmasq_entries": 1,
        "hosts_entries": 1,
        "ports_opened": 2
      },
      "capabilities": ["dns-filtering", "vhost-publish"]
    }
  ],
  "cumulative_summary": {
    "total_components": 12,
    "active_components": 8,
    "total_dns_entries": 18,
    "total_vhosts": 6,
    "total_ports_exposed": 23
  },
  "network_mode": {
    "current_mode": "router",
    "mode_name": "Router",
    "sync_enabled": true
  }
}
```

#### `getCumulativeImpact`

Returns aggregated network impact summary.

**Request**: No parameters

**Response**:
```json
{
  "success": true,
  "total_components": 12,
  "active_components": 8,
  "total_dns_entries": 18,
  "total_vhosts": 6,
  "total_ports_exposed": 23
}
```

#### `setComponentEnabled`

Enable/disable component network features.

**Request**:
```json
{
  "app_id": "adguardhome",
  "enabled": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Component network features updated"
}
```

#### Legacy Methods

- `getStatus` - Status with VHost counts
- `syncNow` - Trigger immediate synchronization
- `getConfig` - Get current configuration
- `setConfig` - Update configuration

### CLI Integration

**UBUS Commands**:
```bash
# Get all components
ubus call luci.network-tweaks getNetworkComponents

# Get cumulative impact
ubus call luci.network-tweaks getCumulativeImpact

# Get configuration
ubus call luci.network-tweaks getConfig

# Trigger sync
ubus call luci.network-tweaks syncNow
```

### Frontend Architecture

**Main View**: `/luci-static/resources/view/network-tweaks/overview.js`

Key methods:
- `load()` - Initialize data and load CSS
- `renderDashboard()` - Build complete dashboard
- `renderCumulativeImpact()` - Impact summary cards
- `renderNetworkModeStatus()` - Mode indicator
- `renderComponentsGrid()` - Component cards
- `showComponentDetails()` - Details modal
- `pollData()` - Auto-refresh (10s interval)
- `updateDisplay()` - Live DOM update

**Styling**: `/luci-static/resources/network-tweaks/dashboard.css`

Responsive grid:
- Desktop: 4-column grid (200px min)
- Mobile: Single column
- Hover effects and animations
- Status color coding

## Troubleshooting

### Components Not Appearing

**Symptoms**: Dashboard shows "No network-impacting components detected"

**Solutions**:
1. Check plugin catalog exists:
   ```bash
   ls /usr/share/secubox/plugins/catalog/
   ```

2. Verify manifest format:
   ```bash
   cat /usr/share/secubox/plugins/catalog/adguardhome.json
   ```

3. Test RPC manually:
   ```bash
   ubus call luci.network-tweaks getNetworkComponents
   ```

### Service State Shows "N/A"

**Causes**:
- Docker not installed/running
- Init script doesn't exist
- Wrong `runtime` in manifest

**Solutions**:
1. For Docker apps:
   ```bash
   docker ps --filter "name=adguardhome"
   ```

2. For native services:
   ```bash
   /etc/init.d/service-name running
   ```

### DNS Resolution Not Working

**Solutions**:
1. Check dnsmasq config:
   ```bash
   cat /tmp/dnsmasq.d/50-vhosts.conf
   ```

2. Verify dnsmasq running:
   ```bash
   ps | grep dnsmasq
   ```

3. Check hosts file:
   ```bash
   cat /etc/hosts
   ```

4. Trigger manual sync:
   - Click **Sync Now** in dashboard
   - Or: `/usr/sbin/network-tweaks-sync sync`

5. Ensure clients use router as DNS:
   ```bash
   nslookup cloud.local
   ```

### Auto-Refresh Not Working

**Solutions**:
1. Check browser console for errors
2. Verify polling (10s interval)
3. Force reload: Ctrl+Shift+R

## Development

### Adding Custom Components

Create a plugin catalog entry:

```bash
# /usr/share/secubox/plugins/catalog/myapp.json
{
  "id": "myapp",
  "name": "My Custom App",
  "category": "network",
  "runtime": "native",
  "packages": ["myapp"],
  "network": {
    "inbound_ports": [8080],
    "protocols": ["http"]
  },
  "capabilities": ["vhost-publish"]
}
```

### Adding New RPC Methods

1. Declare in `list` section:
   ```bash
   json_add_object "myMethod"
   json_close_object
   ```

2. Implement in `call` section:
   ```bash
   myMethod)
       json_init
       json_add_boolean "success" 1
       # Implementation
       json_dump
       ;;
   ```

### Frontend Development

Add dashboard sections:

```javascript
renderDashboard: function() {
    return E('div', { 'class': 'network-tweaks-dashboard' }, [
        this.renderCumulativeImpact(),
        this.renderMyNewSection(),  // Add here
        this.renderComponentsGrid()
    ]);
}
```

## Example Workflows

### Setting up Nextcloud with Network Tweaks

1. Install Nextcloud:
   ```bash
   nextcloudctl install
   /etc/init.d/nextcloud start
   ```

2. Create VHost in VHost Manager:
   - Domain: `cloud.local`
   - Backend: `http://127.0.0.1:80`
   - SSL: Enabled
   - Enable VHost

3. Network Tweaks automatically:
   - Creates DNS entry: `cloud.local` → `192.168.1.1`
   - Updates hosts file
   - Reloads DNSmasq

4. Access from any device:
   - Open `https://cloud.local`
   - Domain resolves to router
   - Nginx forwards to Nextcloud

## Performance Considerations

### Response Times
- Typical RPC response: 200-500ms
- Dashboard initial load: 1-2s
- Auto-refresh impact: Minimal

### Polling
- Interval: 10 seconds
- CPU impact: Minimal
- Network: ~5KB per request
- Memory: Stable (no accumulation)

### Future Optimizations
- 30-second TTL cache for manifest scans
- Incremental discovery updates
- Background worker for heavy queries

## Dependencies

- `luci-base` - LuCI web interface
- `rpcd` - UBUS RPC daemon
- `luci-app-vhost-manager` - VHost Manager (source of domains)
- `dnsmasq` - DNS server

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Catalog                            │
│        /usr/share/secubox/plugins/catalog/*.json            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Discovery Engine (RPC)                          │
│         /usr/libexec/rpcd/luci.network-tweaks               │
│                                                               │
│  ┌────────────────────────────────────────────┐             │
│  │ discover_network_components()              │             │
│  │ ├─ check_network_relevance()              │             │
│  │ ├─ query_install_state()                  │             │
│  │ ├─ query_service_state()                  │             │
│  │ ├─ discover_vhost_associations()          │             │
│  │ └─ calculate_network_impact()             │             │
│  └────────────────────────────────────────────┘             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Frontend Dashboard                              │
│    /luci-static/resources/view/network-tweaks/overview.js  │
│                                                               │
│  ┌────────────────────────────────────────────┐             │
│  │ Impact Summary Cards                       │             │
│  │ Network Mode Status                        │             │
│  │ Components Grid (auto-refresh 10s)        │             │
│  │ Component Details Modal                    │             │
│  └────────────────────────────────────────────┘             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Synchronization Engine                          │
│            /usr/sbin/network-tweaks-sync                    │
│                                                               │
│  Reads: /etc/config/vhosts                                  │
│  Generates: /tmp/dnsmasq.d/50-vhosts.conf                  │
│  Updates: /etc/hosts                                        │
│  Reloads: dnsmasq                                           │
└─────────────────────────────────────────────────────────────┘
```

## Changelog

### v2.0.0 (2026-01-01) - Network Services Dashboard

**Major Features**:
- ✨ Dynamic component discovery from plugin catalog
- ✨ Cumulative impact tracking dashboard
- ✨ Network mode integration
- ✨ Grid-based UI with component cards
- ✨ Auto-refresh with 10-second polling
- ✨ Component details modal
- ✨ Responsive design with dark mode support

**Backend**:
- Added `getNetworkComponents` RPC method
- Added `getCumulativeImpact` RPC method
- Added `setComponentEnabled` RPC method
- Added 8 helper functions for discovery/aggregation
- Added network mode status integration

**Frontend**:
- Complete rewrite of `overview.js`
- New `dashboard.css` with grid system
- Impact summary cards
- Network mode indicator
- Component grid with status badges

**Configuration**:
- Added network-tweaks options to all 8 network modes
- Config remains backward compatible

### v1.0.0 - Initial Release (Network Tweaks)

- Basic VHost to DNS/hosts synchronization
- Manual sync trigger
- Simple statistics display
- Auto-sync on VHost changes
- Hotplug integration

## License

Apache-2.0

## Author

CyberMind Studio <contact@cybermind.fr>

## Support

- **Issues**: https://github.com/CyberMind-FR/secubox-openwrt/issues
- **Documentation**: This README
- **Version**: 2.0.0
- **Last Updated**: 2026-01-01

## Contributing

Contributions welcome! Please:
1. Test changes thoroughly
2. Update documentation
3. Follow existing code style
4. Submit PR with clear description
