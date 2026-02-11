# SecuBox IoT Guard

IoT device isolation, classification, and security monitoring for OpenWrt.

## Overview

IoT Guard provides automated IoT device management:

- **Auto-Classification** - Identifies IoT devices by vendor OUI and behavior
- **Risk Scoring** - Calculates security risk per device (0-100 scale)
- **Auto-Isolation** - Automatically quarantines high-risk devices
- **Anomaly Detection** - Monitors traffic patterns for behavioral anomalies
- **Cloud Mapping** - Tracks cloud services each device contacts

IoT Guard **orchestrates existing SecuBox modules** rather than reimplementing:

| Module | Integration |
|--------|-------------|
| Client Guardian | Zone assignment (IoT zone) |
| MAC Guardian | L2 blocking/trust |
| Vortex Firewall | DNS filtering (IoT malware feeds) |
| Bandwidth Manager | Rate limiting |

## Installation

```bash
opkg install secubox-iot-guard luci-app-iot-guard
```

## CLI Usage

```bash
# Overview status
iot-guardctl status

# Scan network for IoT devices
iot-guardctl scan

# List all devices
iot-guardctl list
iot-guardctl list --json

# Device details
iot-guardctl show AA:BB:CC:DD:EE:FF

# Isolate to IoT zone
iot-guardctl isolate AA:BB:CC:DD:EE:FF

# Trust device (add to allowlist)
iot-guardctl trust AA:BB:CC:DD:EE:FF

# Block device
iot-guardctl block AA:BB:CC:DD:EE:FF

# View anomalies
iot-guardctl anomalies

# Cloud dependency map
iot-guardctl cloud-map AA:BB:CC:DD:EE:FF
```

## Configuration

Edit `/etc/config/iot-guard`:

```
config iot-guard 'main'
    option enabled '1'
    option scan_interval '300'        # Network scan interval (seconds)
    option auto_isolate '1'           # Auto-isolate high-risk devices
    option auto_isolate_threshold '80' # Risk score threshold for auto-isolation
    option anomaly_detection '1'      # Enable anomaly detection
    option anomaly_sensitivity 'medium' # low/medium/high

config zone_policy 'isolation'
    option target_zone 'iot'          # Target zone for isolated devices
    option block_lan '1'              # Block LAN access
    option allow_internet '1'         # Allow internet access
    option bandwidth_limit '10'       # Rate limit (Mbps)

config vendor_rule 'ring'
    option vendor_pattern 'Ring|Amazon Ring'
    option oui_prefix '40:B4:CD'
    option device_class 'camera'
    option risk_level 'medium'
    option auto_isolate '1'

config allowlist 'trusted'
    list mac 'AA:BB:CC:DD:EE:FF'

config blocklist 'banned'
    list mac 'AA:BB:CC:DD:EE:FF'
```

## Device Classes

| Class | Description | Default Risk |
|-------|-------------|--------------|
| camera | IP cameras, video doorbells | medium |
| thermostat | Smart thermostats, HVAC | low |
| lighting | Smart bulbs, LED strips | low |
| plug | Smart plugs, outlets | medium |
| assistant | Voice assistants | medium |
| media | TVs, streaming devices | medium |
| lock | Smart locks | high |
| sensor | Motion, door/window sensors | low |
| diy | ESP32, Raspberry Pi | high |
| mixed | Multi-function devices | high |

## Risk Scoring

Risk score is calculated as:

```
score = base_risk + anomaly_penalty + cloud_penalty
```

- **base_risk**: 20 (low), 50 (medium), 80 (high) based on vendor/class
- **anomaly_penalty**: +10 per unresolved anomaly
- **cloud_penalty**: +10 if >10 cloud deps, +20 if >20 cloud deps

## Anomaly Types

| Type | Severity | Description |
|------|----------|-------------|
| bandwidth_spike | high | Traffic Nx above baseline |
| new_destination | low | First connection to domain |
| port_scan | high | Contacted many ports quickly |
| time_anomaly | medium | Activity at unusual hours |
| protocol_anomaly | medium | Unexpected protocol usage |

## OUI Database

IoT Guard includes an OUI database for ~100 common IoT manufacturers:

- Ring, Nest, Wyze, Eufy (cameras)
- Philips Hue, Lifx, Wiz (lighting)
- TP-Link Kasa/Tapo, Tuya (plugs)
- Amazon Echo, Google Home (assistants)
- Espressif, Raspberry Pi (DIY)
- Samsung, LG, Roku (media)

Add custom OUIs to `/usr/lib/secubox/iot-guard/iot-oui.tsv`:

```
AA:BB:CC	MyVendor	camera	medium
```

## Files

```
/etc/config/iot-guard                  # Configuration
/usr/sbin/iot-guardctl                 # CLI controller
/usr/lib/secubox/iot-guard/            # Library scripts
/usr/share/iot-guard/baseline-profiles/ # Traffic baselines
/var/lib/iot-guard/iot-guard.db        # SQLite database
```

## Dependencies

- secubox-core
- sqlite3-cli
- jsonfilter

## License

GPL-3.0
