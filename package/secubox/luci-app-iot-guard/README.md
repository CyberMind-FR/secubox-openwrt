# LuCI IoT Guard

LuCI dashboard for IoT Guard device isolation and security monitoring.

## Features

- **Overview Dashboard** - Security score, device counts, risk distribution
- **Device List** - Filterable table with device details
- **Device Actions** - Isolate, trust, or block devices
- **Cloud Mapping** - View cloud services each device contacts
- **Anomaly Alerts** - Real-time anomaly notifications
- **Policy Management** - Vendor classification rules
- **Settings** - Configure auto-isolation, thresholds, zones

## Installation

```bash
opkg install luci-app-iot-guard
```

Requires `secubox-iot-guard` backend package.

## Menu Location

SecuBox > Services > IoT Guard

## Screens

### Overview (`/iot-guard/overview`)

Dashboard with:
- Device count, isolated, blocked, high-risk stats
- Security score (0-100%)
- Device grid grouped by risk level
- Recent anomaly events

### Devices (`/iot-guard/devices`)

Device management table:
- MAC, IP, hostname, vendor, class, risk, score, zone, status
- Click to view device detail modal with cloud deps and anomalies
- Quick actions: Isolate, Trust, Block

### Policies (`/iot-guard/policies`)

Vendor classification rules:
- View/add/delete vendor rules
- Configure OUI prefix, pattern, class, risk level
- Device class reference table

### Settings (`/iot-guard/settings`)

Configuration options:
- Enable/disable service
- Scan interval
- Auto-isolation threshold
- Anomaly detection sensitivity
- Zone policy (block LAN, allow internet, bandwidth limit)
- Allowlist/blocklist management

## RPCD Methods

| Method | Description |
|--------|-------------|
| `status` | Dashboard stats |
| `get_devices` | List devices (optional filter) |
| `get_device` | Device detail with cloud map |
| `get_anomalies` | Recent anomaly events |
| `get_vendor_rules` | List classification rules |
| `get_cloud_map` | Device cloud dependencies |
| `scan` | Trigger network scan |
| `isolate_device` | Move device to IoT zone |
| `trust_device` | Add to allowlist |
| `block_device` | Block device |
| `add_vendor_rule` | Add classification rule |
| `delete_vendor_rule` | Delete classification rule |

## Public Access

The overview and device list are available publicly via the `unauthenticated` ACL group.

## Dependencies

- secubox-iot-guard
- luci-base

## License

GPL-3.0
