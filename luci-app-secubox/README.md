# SecuBox Central Hub

Central management dashboard for the SecuBox security and network management suite for OpenWrt.

## Features

### Dashboard Overview
- Real-time system health monitoring (CPU, Memory, Disk, Network)
- Visual gauges with color-coded status indicators
- Module status grid with quick access links
- Aggregated alerts from all modules
- Quick action buttons for common tasks

### System Health Monitoring
- **CPU**: Load average and percentage with multi-core support
- **Memory**: RAM usage with total/used/available metrics
- **Disk**: Root filesystem usage and available space
- **Network**: Real-time RX/TX bandwidth statistics

### Quick Actions
- Restart RPCD service
- Restart uHTTPd web server
- Clear system cache
- Create configuration backup
- Restart network services
- Restart firewall

### Module Management
Auto-detection and status monitoring for all SecuBox modules:

**Security & Monitoring**
- **CrowdSec** - Collaborative threat intelligence
- **Netdata** - Real-time system monitoring
- **Netifyd** - Deep packet inspection
- **Client Guardian** - Network access control and captive portal
- **Auth Guardian** - Advanced authentication system

**Network Management**
- **WireGuard** - Modern VPN with QR codes
- **Network Modes** - Network topology configuration
- **Bandwidth Manager** - QoS and bandwidth quotas
- **Media Flow** - Media traffic detection and optimization
- **Traffic Shaper** - Advanced traffic shaping

**System & Performance**
- **System Hub** - Unified control center
- **CDN Cache** - Local caching proxy
- **Virtual Host Manager** - Virtual host configuration

## LuCI Menu Structure

The SecuBox hub organizes all modules into a hierarchical menu structure in LuCI:

```
SecuBox
├── Dashboard                  (Main overview and system health)
├── Modules                    (Module management view)
├── Security & Monitoring
│   ├── CrowdSec              (Collaborative threat intelligence)
│   ├── Netdata               (Real-time system monitoring)
│   ├── Netifyd               (Deep packet inspection)
│   ├── Client Guardian       (Network access control & captive portal)
│   └── Auth Guardian         (Advanced authentication system)
├── Network Management
│   ├── WireGuard             (Modern VPN with QR codes)
│   ├── Network Modes         (Network topology configuration)
│   ├── Bandwidth Manager     (QoS and bandwidth quotas)
│   ├── Media Flow            (Media traffic detection & optimization)
│   └── Traffic Shaper        (Advanced traffic shaping)
└── System & Performance
    ├── System Hub            (Unified control center)
    ├── CDN Cache             (Local caching proxy)
    └── Virtual Host Manager  (Virtual host configuration)
```

### Menu Registration

The hub defines three category parent menus that other SecuBox modules register under:

- **`admin/secubox/security`** - Security & Monitoring modules
- **`admin/secubox/network`** - Network Management modules
- **`admin/secubox/system`** - System & Performance modules

Each module automatically appears in the appropriate category when installed.

### Troubleshooting Menu Issues

If modules don't appear in the menu after installation:

1. **Restart services:**
   ```bash
   /etc/init.d/rpcd restart
   /etc/init.d/uhttpd restart
   ```

2. **Clear browser cache:** Press `Ctrl+Shift+R` to force reload

3. **Verify menu files exist:**
   ```bash
   ls -la /usr/share/luci/menu.d/luci-app-*.json
   ```

4. **Check ACL permissions:**
   ```bash
   ls -la /usr/share/rpcd/acl.d/luci-app-*.json
   ```

## RPCD API Methods

The hub provides a comprehensive RPC API via ubus:

- `status` - Get hub status and basic system info
- `modules` - List all SecuBox modules with status
- `modules_by_category` - Filter modules by category
- `module_info` - Get detailed info for a specific module
- `get_system_health` - Detailed system health metrics
- `get_alerts` - Aggregated alerts from all modules
- `get_dashboard_data` - All dashboard data in one call
- `quick_action` - Execute quick actions
- `start_module` / `stop_module` / `restart_module` - Module control
- `health` - System health checks
- `diagnostics` - Generate diagnostics bundle

## Installation

```bash
opkg update
opkg install luci-app-secubox
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Building

```bash
# Clone into OpenWrt SDK
git clone https://github.com/youruser/luci-app-secubox.git package/luci-app-secubox
make package/luci-app-secubox/compile V=s
```

## Configuration

Edit `/etc/config/secubox` to customize module definitions and settings.

## File Structure

```
luci-app-secubox/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/secubox/
│   │   ├── dashboard.js      # Main dashboard view
│   │   ├── modules.js         # Modules management view
│   │   └── settings.js        # Settings view
│   └── secubox/
│       ├── api.js             # RPC API client
│       └── secubox.css        # Dashboard styles
└── root/
    ├── etc/config/secubox     # UCI configuration
    └── usr/
        ├── libexec/rpcd/secubox              # RPCD backend
        └── share/
            ├── luci/menu.d/luci-app-secubox.json
            └── rpcd/acl.d/luci-app-secubox.json
```

## License

Apache-2.0 - Copyright (C) 2025 CyberMind.fr
