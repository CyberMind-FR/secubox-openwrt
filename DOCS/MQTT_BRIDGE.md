# MQTT Bridge Module

**Version:** 0.1.0  
**Status:** Draft  

SecuBox MQTT Bridge exposes USB dongles and IoT sensors through a themed LuCI interface.

## Components

- **Overview** – broker health, connected adapters, recent payloads.
- **Devices** – paired USB devices with status (online/offline).
- **Settings** – broker credentials, base topic templates, retention.

## RPC API (`luci.mqtt-bridge`)

| Method | Description |
|--------|-------------|
| `status` | Broker metrics, stored payloads, and current settings. |
| `list_devices` | Enumerates paired USB/sensor nodes. |
| `trigger_pairing` | Opens pairing window (2 minutes). |
| `apply_settings` | Persists broker/bridge configuration. |

`status` now also includes a `profiles` array describing detected USB/Zigbee presets. Each entry exposes:

| Field | Description |
| ----- | ----------- |
| `id` | Internal preset identifier (e.g. `zigbee_usb2134`). |
| `label` | Friendly adapter name from USB descriptors. |
| `vendor` / `product` | USB VID:PID pair. |
| `bus` / `device` | Linux bus/device numbers as seen in `dmesg`/`lsusb`. |
| `port` | Resolved `/dev/tty*` path when available. |
| `detected` | Boolean flag (`true` when the dongle is currently attached). |
| `notes` | Human readable hints rendered in the Devices view. |

## Files

```
luci-app-mqtt-bridge/
 ├── htdocs/luci-static/resources/view/mqtt-bridge/*.js
 ├── htdocs/luci-static/resources/mqtt-bridge/common.css
 ├── root/usr/libexec/rpcd/luci.mqtt-bridge
 ├── root/usr/share/luci/menu.d/luci-app-mqtt-bridge.json
 ├── root/usr/share/rpcd/acl.d/luci-app-mqtt-bridge.json
└── root/etc/config/mqtt-bridge
```

## Zigbee / SMSC USB2134B profile

The Devices tab now surfaces a preset for the "Bus 003 Device 002: ID 0424:2134 SMSC USB2134B" bridge that is commonly flashed with Zigbee coordinator firmware. The LuCI view consumes the `profiles` array explained above and displays the current detection state together with the tty hint.

To verify the dongle manually:

```bash
dmesg | tail -n 40 | grep -E '0424:2134|usb 3-1'
lsusb -d 0424:2134
ls /dev/ttyACM* /dev/ttyUSB* 2>/dev/null
```

Typical kernel log:

```
[ 6456.735692] usb 3-1.1: USB disconnect, device number 3
[ 6459.021458] usb 3-1.1: new full-speed USB device number 4 using xhci-hcd
```

Match the reported Bus/Device numbers with `/sys/bus/usb/devices/*/busnum` and `/sys/bus/usb/devices/*/devnum`; the RPC helper inspects those files and publishes the resolved `/dev/tty*` path (when exported under `/sys/bus/usb/devices/*/tty`). If the adapter is not plugged in, the UI still renders the preset so operators know exactly which VID/PID pair to look for.

Once the tty node is confirmed, update `/etc/config/mqtt-bridge` and restart the bridge service to bind Zigbee traffic to the MQTT topics defined in the Settings tab.

## Adapter monitor daemon

The package now installs a lightweight watcher (`/usr/sbin/mqtt-bridge-monitor`) that keeps SecuBox informed about attached adapters:

- Configured via `config monitor 'monitor'` (interval in seconds) and `config adapter '...'` sections inside `/etc/config/mqtt-bridge`.
- Managed with the standard init script: `service mqtt-bridge start|stop|status`.
- Writes state transitions to the system log (`logread -e mqtt-bridge-monitor`).
- Updates each adapter section with `detected`, `port`, `bus`, `device`, `health`, and `last_seen`, which the LuCI Devices tab now surfaces.
- The MQTT Settings view exposes the same adapter entries so you can enable/disable presets, rename labels, or override `/dev/tty*` assignments without leaving the UI.

Use `uci show mqtt-bridge.adapter` to inspect the persisted metadata, or `ubus call luci.mqtt-bridge status` to see the JSON payload consumed by the UI.

## Next steps

- Add real daemon integration with Mosquitto.
- Support TLS and per-device topics.
- Emit SecuBox alerts on sensor thresholds.

See `.codex/apps/mqtt-bridge/TODO.md` for the evolving backlog.
