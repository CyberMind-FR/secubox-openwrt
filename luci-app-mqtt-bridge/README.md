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

`/usr/sbin/mqtt-bridge` (started via `/etc/init.d/mqtt-bridge`) polls configured adapter presets, logs plug/unplug events, and updates `/etc/config/mqtt-bridge` with `detected`, `port`, `bus`, `device`, `health`, and `last_seen` metadata. The daemon also keeps `mqtt-bridge.stats.*` fresh (clients, messages/sec, uptime) and executes automation rules defined in the config. The Devices/Settings views consume those values to surface Zigbee/serial presets along with `dmesg` hints for `/dev/tty*` alignment.

Legacy `/usr/sbin/mqtt-bridge-monitor` is kept as a wrapper for backwards compatibility and now simply execs the unified daemon.

## Topic templates & rules

`/etc/config/mqtt-bridge` ships with starter `config template` entries (Zigbee/Modbus) describing MQTT topic patterns per device type. You can add/override templates and the RPC API exposes them so LuCI (or automation tooling) can build device-specific topics dynamically.

`config rule` sections define automation hooks. The daemon currently supports `type adapter_status` with `action alert|rescan`. When adapter health transitions (e.g. online → missing) the matching rule logs to syslog and appends to `/tmp/mqtt-bridge-alerts.log`, which you can ingest into SecuBox Alerts or other systems.

## Development Notes

See `.codex/apps/mqtt-bridge/WIP.md` for current tasks and `.codex/apps/mqtt-bridge/TODO.md` for backlog/high-level goals.
