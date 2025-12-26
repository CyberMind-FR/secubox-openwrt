# System Hub - Central Control Dashboard

Central system control and monitoring dashboard for OpenWrt with comprehensive system management capabilities.

## Features

### System Monitoring
- Real-time system information (hostname, model, uptime, kernel version)
- System health metrics with visual gauges (CPU, RAM, Disk)
- CPU load average (1min, 5min, 15min)
- Memory usage detailed breakdown
- Storage monitoring for all mount points
- Temperature monitoring (thermal zones)

### Service Management
- List all system services with status
- Start/Stop/Restart services
- Enable/Disable service autostart
- Real-time service status (running/stopped)
- Batch service management

### System Logs
- View system logs with configurable line count (50-1000 lines)
- Real-time log filtering
- Search logs by keyword
- Terminal-style log display

### Backup & Restore
- Create system configuration backup (tar.gz)
- Download backup archive
- Restore configuration from backup
- System reboot functionality

## Installation

```bash
opkg update
opkg install luci-app-system-hub
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependencies

- **luci-base**: LuCI framework
- **rpcd**: RPC daemon
- **coreutils**: Core utilities
- **coreutils-base64**: Base64 encoding/decoding

## Usage

### Web Interface

Navigate to **System → System Hub** in LuCI.

#### Overview Tab
- System information cards
- Health metrics with visual gauges:
  - CPU Load (percentage based on cores)
  - Memory Usage (percentage with MB breakdown)
  - Disk Usage (percentage with size info)
- CPU details (model, cores, load average)
- Temperature monitoring (color-coded: green < 60°C, orange < 80°C, red ≥ 80°C)
- Storage details for all mount points

#### Services Tab
- List of all system services
- Status indicators (running/stopped)
- Autostart status (enabled/disabled)
- Action buttons:
  - Start (for stopped services)
  - Stop (for running services)
  - Restart (for all services)
  - Enable/Disable autostart

#### System Logs Tab
- Log viewer with filter controls
- Configurable line count (50, 100, 200, 500, 1000)
- Keyword filtering
- Refresh logs on demand
- Terminal-style display (black background, green text)

#### Backup & Restore Tab
- Create and download configuration backup
- Upload and restore backup file
- System reboot with confirmation

### Command Line

#### Get System Status

```bash
ubus call luci.system-hub status
```

#### Get System Information

```bash
ubus call luci.system-hub get_system_info
```

Output:
```json
{
  "hostname": "openwrt",
  "model": "Raspberry Pi 4 Model B",
  "board": "rpi-4",
  "openwrt_version": "OpenWrt 23.05.0",
  "kernel": "5.15.134",
  "architecture": "aarch64",
  "uptime_seconds": 86400,
  "uptime_formatted": "1d 0h 0m",
  "local_time": "2025-12-24 10:30:00"
}
```

#### Get System Health

```bash
ubus call luci.system-hub get_health
```

Output:
```json
{
  "cpu": {
    "usage": 25,
    "status": "ok",
    "load_1m": "0.25",
    "load_5m": "0.30",
    "load_15m": "0.28",
    "cores": 4
  },
  "memory": {
    "total_kb": 4096000,
    "free_kb": 2048000,
    "available_kb": 3072000,
    "used_kb": 1024000,
    "buffers_kb": 512000,
    "cached_kb": 1536000,
    "usage": 25,
    "status": "ok"
  },
  "disk": {
    "total_kb": 30408704,
    "used_kb": 5447680,
    "usage": 19,
    "status": "ok"
  },
  "temperature": {
    "value": 45,
    "status": "ok"
  },
  "network": {
    "wan_up": true,
    "status": "ok"
  },
  "services": {
    "running": 35,
    "failed": 2
  },
  "score": 92,
  "timestamp": "2025-12-26 10:30:00",
  "recommendations": [
    "2 service(s) enabled but not running. Check service status."
  ]
}
```

#### List Services

```bash
ubus call luci.system-hub list_services
```

#### Manage Service

```bash
# Start a service
ubus call luci.system-hub service_action '{"service":"network","action":"start"}'

# Stop a service
ubus call luci.system-hub service_action '{"service":"network","action":"stop"}'

# Restart a service
ubus call luci.system-hub service_action '{"service":"network","action":"restart"}'

# Enable autostart
ubus call luci.system-hub service_action '{"service":"network","action":"enable"}'

# Disable autostart
ubus call luci.system-hub service_action '{"service":"network","action":"disable"}'
```

#### Get Logs

```bash
# Get last 100 lines
ubus call luci.system-hub get_logs '{"lines":100,"filter":""}'

# Get last 500 lines with filter
ubus call luci.system-hub get_logs '{"lines":500,"filter":"error"}'
```

#### Create Backup

```bash
ubus call luci.system-hub backup_config
```

Returns backup data in base64 format with size and filename.

#### Restore Configuration

```bash
# Encode backup file to base64
DATA=$(base64 < backup.tar.gz | tr -d '\n')

# Restore
ubus call luci.system-hub restore_config "{\"data\":\"$DATA\"}"
```

#### Reboot System

```bash
ubus call luci.system-hub reboot
```

System will reboot after 3 seconds.

#### Get Storage Details

```bash
ubus call luci.system-hub get_storage
```

#### Get Settings

```bash
ubus call luci.system-hub get_settings
```

Output:
```json
{
  "general": {
    "auto_refresh": true,
    "health_check": true,
    "debug_mode": false,
    "refresh_interval": 30,
    "log_retention": 30
  },
  "thresholds": {
    "cpu_warning": 80,
    "cpu_critical": 95,
    "mem_warning": 80,
    "mem_critical": 95,
    "disk_warning": 80,
    "disk_critical": 95,
    "temp_warning": 70,
    "temp_critical": 85
  },
  "schedules": {
    "health_report": true,
    "backup_weekly": true,
    "log_cleanup": true
  },
  "upload": {
    "auto_upload": false,
    "url": "",
    "token": ""
  },
  "support": {
    "provider": "CyberMind.fr",
    "email": "support@cybermind.fr",
    "docs": "https://docs.cybermind.fr"
  }
}
```

#### Save Settings

```bash
ubus call luci.system-hub save_settings '{
  "auto_refresh": 1,
  "health_check": 1,
  "debug_mode": 0,
  "refresh_interval": 30,
  "log_retention": 30,
  "cpu_warning": 80,
  "cpu_critical": 95,
  "mem_warning": 80,
  "mem_critical": 95,
  "disk_warning": 80,
  "disk_critical": 95,
  "temp_warning": 70,
  "temp_critical": 85
}'
```

## ubus API Reference

### status()

Get comprehensive system status overview.

**Returns:**
```json
{
  "hostname": "openwrt",
  "model": "Device Model",
  "uptime": 86400,
  "health": {
    "cpu_load": "0.25",
    "mem_total_kb": 4096000,
    "mem_used_kb": 1024000,
    "mem_percent": 25
  },
  "disk_percent": 19,
  "service_count": 42
}
```

### get_system_info()

Get detailed system information.

### get_health()

Get comprehensive health metrics including CPU, memory, storage, and temperature.

### list_services()

List all system services with status.

**Returns:**
```json
{
  "services": [
    {
      "name": "network",
      "enabled": true,
      "running": true
    },
    {
      "name": "firewall",
      "enabled": true,
      "running": true
    }
  ]
}
```

### service_action(service, action)

Perform action on a service.

**Parameters:**
- `service`: Service name (required)
- `action`: Action to perform (start|stop|restart|enable|disable)

**Returns:**
```json
{
  "success": true,
  "message": "Service network start successful"
}
```

### get_logs(lines, filter)

Get system logs.

**Parameters:**
- `lines`: Number of lines to retrieve (default: 100)
- `filter`: Filter logs by keyword (optional)

**Returns:**
```json
{
  "logs": [
    "Dec 24 10:30:00 kernel: ...",
    "Dec 24 10:30:01 daemon.info dnsmasq[123]: ..."
  ]
}
```

### backup_config()

Create system configuration backup.

**Returns:**
```json
{
  "success": true,
  "data": "H4sIAAAAAAAAA...",
  "size": 12345,
  "filename": "backup-20251224-103000.tar.gz"
}
```

### restore_config(data)

Restore system configuration from backup.

**Parameters:**
- `data`: Base64-encoded backup data

**Returns:**
```json
{
  "success": true,
  "message": "Configuration restored successfully. Reboot required."
}
```

### reboot()

Reboot the system (3-second delay).

**Returns:**
```json
{
  "success": true,
  "message": "System reboot initiated"
}
```

### get_storage()

Get detailed storage information for all mount points.

### get_settings()

Get all system-hub configuration settings.

**Returns:**
```json
{
  "general": {
    "auto_refresh": true,
    "health_check": true,
    "debug_mode": false,
    "refresh_interval": 30,
    "log_retention": 30
  },
  "thresholds": {
    "cpu_warning": 80,
    "cpu_critical": 95,
    "mem_warning": 80,
    "mem_critical": 95,
    "disk_warning": 80,
    "disk_critical": 95,
    "temp_warning": 70,
    "temp_critical": 85
  },
  "schedules": {
    "health_report": true,
    "backup_weekly": true,
    "log_cleanup": true
  },
  "upload": {
    "auto_upload": false,
    "url": "",
    "token": ""
  },
  "support": {
    "provider": "CyberMind.fr",
    "email": "support@cybermind.fr",
    "docs": "https://docs.cybermind.fr"
  }
}
```

### save_settings(...)

Save system-hub configuration settings to UCI.

**Parameters:**
- `auto_refresh`: Enable auto-refresh (0|1)
- `health_check`: Enable automatic health checks (0|1)
- `debug_mode`: Enable debug mode (0|1)
- `refresh_interval`: Refresh interval in seconds
- `log_retention`: Log retention in days
- `cpu_warning`: CPU warning threshold (%)
- `cpu_critical`: CPU critical threshold (%)
- `mem_warning`: Memory warning threshold (%)
- `mem_critical`: Memory critical threshold (%)
- `disk_warning`: Disk warning threshold (%)
- `disk_critical`: Disk critical threshold (%)
- `temp_warning`: Temperature warning threshold (°C)
- `temp_critical`: Temperature critical threshold (°C)

**Returns:**
```json
{
  "success": true,
  "message": "Settings saved successfully"
}
```

## System Information Sources

- Hostname: `/proc/sys/kernel/hostname`
- Model: `/tmp/sysinfo/model`, `/proc/device-tree/model`
- Uptime: `/proc/uptime`
- OpenWrt version: `/etc/openwrt_release`
- Kernel: `uname -r`
- CPU info: `/proc/cpuinfo`
- Load average: `/proc/loadavg`
- Memory: `/proc/meminfo`
- Storage: `df -h`
- Temperature: `/sys/class/thermal/thermal_zone*/temp`
- Services: `/etc/init.d/*`

## Gauge Visualization

The overview page displays three circular gauges:

### CPU Load Gauge
- Percentage calculated from 1-minute load average divided by core count
- Green: < 75%
- Orange: 75-90%
- Red: > 90%

### Memory Gauge
- Percentage of memory used
- Shows "Used MB / Total MB"
- Color-coded like CPU

### Disk Gauge
- Percentage of root filesystem used
- Shows "Used / Total Size"
- Color-coded like CPU

## Security Considerations

- Service actions require write permissions in ACL
- Backup data contains sensitive configuration
- Reboot action is irreversible
- Log filtering does not sanitize sensitive data in logs

## Troubleshooting

### Services Not Showing

Check if services exist:
```bash
ls /etc/init.d/
```

### Health Metrics Not Accurate

Verify system files are accessible:
```bash
cat /proc/meminfo
cat /proc/loadavg
df -h
```

### Backup Creation Fails

Ensure sysupgrade is available:
```bash
which sysupgrade
```

### Temperature Not Displayed

Check thermal zones:
```bash
ls /sys/class/thermal/thermal_zone*/temp
```

## License

Apache-2.0

## Maintainer

CyberMind <contact@cybermind.fr>

## Version

0.1.0

## Changelog

### v0.1.0 (2025-12-26)
- **STABLE RELEASE** - Production ready
- Fixed overview.js: Updated to use new health data structure (cpu.usage, memory.usage, disk.usage instead of deprecated fields)
- Fixed health view: Complete restructure of get_health RPCD method with proper metrics
  - CPU: usage %, status (ok/warning/critical), load averages, cores count
  - Memory: usage %, status, detailed KB metrics
  - Disk: root filesystem usage %, status, size metrics
  - Temperature: system temperature with status
  - Network: WAN connectivity check
  - Services: running vs failed count
  - Overall health score: 0-100 based on all metrics
  - Dynamic recommendations: actionable alerts based on thresholds
- Fixed settings view: Complete implementation with UCI backend
  - Added get_settings and save_settings RPCD methods
  - General settings: auto-refresh, health check, debug mode, intervals
  - Alert thresholds: configurable CPU, memory, disk, temperature limits
  - Scheduled tasks configuration
  - Upload and support information
- Fixed ACL permissions: Added get_settings (read) and save_settings (write) to ACL
- Fixed API module: Correct usage of baseclass.extend() pattern
- Fixed view imports: Use 'require system-hub/api as API' instead of L.require()
- All 12 RPC methods working correctly
- Comprehensive validation passing

### v0.0.2
- Initial implementation with basic system monitoring and service management
