# secubox-app-device-intel — History

## v1.0.0 — 2026-02-04

### Initial Release

- Created `secubox-app-device-intel` package
  - UCI config: main settings, display preferences, 3 emulator modules (USB/MQTT/Zigbee), 10 device type rules, per-device override template
  - `device-intelctl` CLI: list, show, classify, set-type, set-label, summary, emulators, mesh-list, export, refresh, status
  - Core aggregation library (`functions.sh`): 6 data source collectors + emulator dispatcher + merge-on-MAC + caching
  - Classification engine (`classify.sh`): 7-level priority chain (user > emulator > mesh > port > vendor > hostname > fallback)
  - USB emulator: walks /sys/bus/usb/devices, classifies by bDeviceClass, detects storage mount points
  - MQTT emulator: queries mosquitto broker via $SYS topics, logs, or mosquitto_ctrl
  - Zigbee emulator: queries zigbee2mqtt HTTP API or deCONZ REST API, parses paired devices

- Created `luci-app-device-intel` package
  - RPCD handler: get_devices, get_device, get_summary, get_mesh_devices, get_emulators, get_device_types, classify_device, set_device_meta, refresh
  - Shared API module (`api.js`): 9 RPC method wrappers
  - Dashboard view: stat cards, source chips, type distribution grid, zone bar, recent devices
  - Devices view: filter bar, full device table, edit modal, detail modal
  - Emulators view: USB/MQTT/Zigbee status cards with mini device tables
  - Mesh view: peer cards, remote device table
  - Settings view: form.Map for all UCI sections (main, display, USB, MQTT, Zigbee)
  - Custom CSS (`common.css`): stat cards, type grid, source chips, device table, emulator cards
  - Menu under admin/secubox/device-intel (5 tabs)
  - ACL with cross-subsystem read access (mac-guardian, client-guardian, P2P, exposure)

### Design Decisions

- **Pure aggregation**: No data duplication — all data fetched at query time from existing subsystems
- **MAC as primary key**: All sources merged on MAC address; synthetic IDs (synth-usb-*, synth-mqtt-*, synth-zigbee-*) for non-MAC devices
- **File-based caching**: `/tmp/device-intel/cache-devices.json` with configurable TTL avoids repeated collection
- **Emulator modularity**: Each emulator is a standalone .sh file exporting `emulate_<type>()`, loaded only when enabled in UCI
- **Pipe-delimited intermediate format**: Collectors output `source|mac|field1|field2...` lines to temp files, merged by the aggregator
- **Classification decoupled from collection**: classify.sh is a separate library that can run independently or batch
