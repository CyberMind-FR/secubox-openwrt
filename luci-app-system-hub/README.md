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
    "model": "ARM Cortex-A72",
    "cores": 4
  },
  "load": {
    "1min": "0.25",
    "5min": "0.30",
    "15min": "0.28"
  },
  "memory": {
    "total_kb": 4096000,
    "free_kb": 2048000,
    "available_kb": 3072000,
    "used_kb": 1024000,
    "buffers_kb": 512000,
    "cached_kb": 1536000,
    "percent": 25
  },
  "storage": [
    {
      "filesystem": "/dev/mmcblk0p2",
      "size": "29G",
      "used": "5.2G",
      "available": "22G",
      "percent": 19,
      "mountpoint": "/"
    }
  ],
  "temperatures": [
    {
      "zone": "thermal_zone0",
      "celsius": 45
    }
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

SecuBox Project <support@secubox.com>

## Version

1.0.0
