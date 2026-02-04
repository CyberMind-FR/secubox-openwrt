# secubox-app-device-intel

Unified device inventory aggregating data from all SecuBox subsystems. Part of the SecuBox ecosystem.

## Overview

Pure aggregation layer that merges mac-guardian, client-guardian, DHCP, P2P mesh, exposure scanner, and emulator module data into a single device inventory with heuristic classification, user overrides, and cross-mesh visibility.

## Architecture

```
device-intelctl (CLI)
  └── functions.sh (aggregation library)
        ├── di_collect_mac_guardian()    → /var/run/mac-guardian/clients.db
        ├── di_collect_client_guardian() → UCI client-guardian
        ├── di_collect_dhcp()           → /tmp/dhcp.leases
        ├── di_collect_p2p_peers()      → ubus luci.secubox-p2p
        ├── di_collect_exposure()       → /proc/net/tcp
        └── di_collect_emulators()      → emulators/*.sh
              ├── usb.sh    → /sys/bus/usb/devices/
              ├── mqtt.sh   → mosquitto broker
              └── zigbee.sh → zigbee2mqtt / deCONZ API
```

## Data Flow

1. **Collect** — Query each data source in parallel
2. **Merge** — Key on MAC address, combine fields from all sources
3. **Classify** — Apply heuristic chain (user > emulator > mesh > port > vendor > hostname)
4. **Cache** — Store in `/tmp/device-intel/cache-devices.json` (configurable TTL)
5. **Serve** — CLI or RPCD returns unified JSON

## Classification Priority

| Priority | Source | Example |
|---|---|---|
| 1 | User override | UCI `device-intel.<mac>.type` |
| 2 | Emulator source | MQTT client → mqtt_device |
| 3 | Mesh peer match | P2P peer IP → mesh_peer |
| 4 | Port-based | Port 445 → storage |
| 5 | Vendor-based | Synology → storage |
| 6 | Hostname-based | `.*sensor.*` → iot_sensor |
| 7 | Fallback | unknown |

## Emulator Modules

KISS-styled pluggable device discovery:

- **usb.sh** — Walks `/sys/bus/usb/devices/`, classifies by bDeviceClass (storage, serial, HID, camera, audio, printer, wireless)
- **mqtt.sh** — Queries mosquitto broker via `$SYS` topics or logs
- **zigbee.sh** — Queries zigbee2mqtt HTTP API or deCONZ REST API

Each exports `emulate_<type>()` returning pipe-delimited device entries.

## CLI Usage

```bash
device-intelctl status                                    # Overview
device-intelctl list table                                # Tabular view
device-intelctl list json                                 # JSON output
device-intelctl show aa:bb:cc:dd:ee:ff                    # Device detail
device-intelctl classify                                  # Batch classify
device-intelctl set-type aa:bb:cc:dd:ee:ff iot_sensor     # Override type
device-intelctl set-label aa:bb:cc:dd:ee:ff "Temp Sensor" # Custom label
device-intelctl emulators                                 # Module status
device-intelctl mesh-list                                 # Mesh peer devices
device-intelctl export json > inventory.json              # Full export
```

## UCI Configuration

```
/etc/config/device-intel
  config device-intel 'main'     → enabled, cache_ttl, classify_interval
  config display 'display'       → view mode, grouping, refresh
  config emulator 'mqtt'         → broker_host, port, discovery_topic
  config emulator 'zigbee'       → coordinator, adapter, api_port
  config emulator 'usb'          → scan_interval, track_storage, track_serial
  config device_type '<id>'      → name, icon, color, vendor/hostname/port match rules
  config device '<mac_clean>'    → user overrides (type, label, capabilities, notes)
```

## Files

```
/etc/config/device-intel                          UCI configuration
/etc/init.d/device-intel                          procd init script
/usr/sbin/device-intelctl                         CLI controller
/usr/lib/secubox/device-intel/functions.sh        Core aggregation library
/usr/lib/secubox/device-intel/classify.sh         Heuristic classification engine
/usr/lib/secubox/device-intel/emulators/usb.sh    USB peripheral emulator
/usr/lib/secubox/device-intel/emulators/mqtt.sh   MQTT broker emulator
/usr/lib/secubox/device-intel/emulators/zigbee.sh Zigbee coordinator emulator
```

## Dependencies

- `jsonfilter` (OpenWrt native)
- `curl` (for emulator API calls)
- Optional: `secubox-app-mac-guardian`, `secubox-app-client-guardian`, `secubox-p2p`
