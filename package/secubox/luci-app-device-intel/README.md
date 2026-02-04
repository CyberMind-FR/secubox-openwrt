# luci-app-device-intel

LuCI web interface for SecuBox Device Intelligence.

## Overview

Unified device dashboard aggregating data from all SecuBox subsystems. Five views: Dashboard, Devices, Emulators, Mesh, Settings.

## Views

### Dashboard (`device-intel/dashboard`)
- Summary stat cards: Total, Online, Mesh Peers, At Risk
- Data source status chips: MAC Guardian, Client Guardian, DHCP, P2P
- Emulator status chips: USB, MQTT, Zigbee
- Device type distribution grid (cards with count and color)
- Zone distribution bar
- Recent devices table (last 5 by last_seen)

### Devices (`device-intel/devices`)
- Filter bar: text search, type dropdown, online/offline status
- Full device table: status dot, name, MAC, IP, vendor, type, zone, source, actions
- Edit modal: change label and device type override
- Detail modal: full device attributes
- Real-time filter updates without page reload

### Emulators (`device-intel/emulators`)
- USB card: system device count, discovered peripherals, mini table
- MQTT card: broker host/port, running status, discovered clients
- Zigbee card: adapter type, dongle path, dongle present, paired devices
- Link to settings for configuration

### Mesh (`device-intel/mesh`)
- Peer cards: name, IP, online/offline status
- Remote devices table: devices reported by mesh peers
- Source node column for cross-mesh attribution

### Settings (`device-intel/settings`)
- General: enable, cache TTL, auto-classify, classify interval, mesh timeout
- Display: default view, group by, show offline, show mesh peers, auto-refresh
- USB emulator: enable, scan interval, track storage, track serial
- MQTT emulator: enable, broker host/port, discovery topic, scan interval
- Zigbee emulator: enable, coordinator device, adapter type, API port, bridge topic

## RPCD Methods

| Method | Params | Description |
|---|---|---|
| `get_devices` | — | Full device inventory (cached) |
| `get_device` | mac | Single device details |
| `get_summary` | — | Stats + source/emulator status |
| `get_mesh_devices` | — | Mesh peers and remote devices |
| `get_emulators` | — | Emulator module status |
| `get_device_types` | — | Registered device type definitions |
| `classify_device` | mac | Run classification (single or all) |
| `set_device_meta` | mac, type, label | Update device override |
| `refresh` | — | Invalidate cache |

## Files

```
root/usr/libexec/rpcd/luci.device-intel                RPCD handler
root/usr/share/luci/menu.d/luci-app-device-intel.json  Menu (5 tabs)
root/usr/share/rpcd/acl.d/luci-app-device-intel.json   ACL
htdocs/.../resources/device-intel/api.js               Shared RPC API
htdocs/.../resources/device-intel/common.css            Dashboard CSS
htdocs/.../resources/view/device-intel/dashboard.js     Dashboard view
htdocs/.../resources/view/device-intel/devices.js       Device table
htdocs/.../resources/view/device-intel/emulators.js     Emulator cards
htdocs/.../resources/view/device-intel/mesh.js          Mesh peers
htdocs/.../resources/view/device-intel/settings.js      Settings form
```

## Dependencies

- `luci-base`
- `secubox-app-device-intel`
