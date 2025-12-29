# SecuBox MQTT Bridge

**Version:** 0.1.0  
**Status:** Draft

USB-aware MQTT orchestrator for SecuBox routers. The application discovers USB serial dongles, bridges sensor payloads to a built-in MQTT broker, and exposes dashboards/settings with SecuBox theme tokens.

## Views

- `overview.js` – broker status, metrics, quick actions.
- `devices.js` – USB/tasmota sensor list with pairing wizard.
- `settings.js` – broker credentials, topic templates, retention options, adapter preferences (enable/label/tty overrides).

## RPC Methods

- `status` – broker uptime, clients, last payloads.
- `list_devices` – detected USB devices & pairing state.
- `apply_settings` – broker credentials/storage.
- `trigger_pairing` – start pairing flow for sensors.

The LuCI views depend on the SecuBox theme bundle included in `luci-theme-secubox`.

## Daemon / Monitor

`/usr/sbin/mqtt-bridge-monitor` (started via `/etc/init.d/mqtt-bridge`) polls configured adapter presets, logs plug/unplug events, and updates `/etc/config/mqtt-bridge` with `detected`, `port`, `bus`, `device`, and `health` metadata. The Devices view consumes those values to surface Zigbee/serial presets along with `dmesg` hints for `/dev/tty*` alignment.

## Development Notes

See `.codex/apps/mqtt-bridge/WIP.md` for current tasks and `.codex/apps/mqtt-bridge/TODO.md` for backlog/high-level goals.
