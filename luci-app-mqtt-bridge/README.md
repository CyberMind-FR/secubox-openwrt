# SecuBox MQTT Bridge

**Version:** 0.1.0  
**Status:** Draft

USB-aware MQTT orchestrator for SecuBox routers. The application discovers USB serial dongles, bridges sensor payloads to a built-in MQTT broker, and exposes dashboards/settings with SecuBox theme tokens.

## Views

- `overview.js` – broker status, metrics, quick actions.
- `devices.js` – USB/tasmota sensor list with pairing wizard.
- `settings.js` – broker credentials, topic templates, retention options.

## RPC Methods

- `status` – broker uptime, clients, last payloads.
- `list_devices` – detected USB devices & pairing state.
- `apply_settings` – broker credentials/storage.
- `trigger_pairing` – start pairing flow for sensors.

The LuCI views depend on the SecuBox theme bundle included in `luci-theme-secubox`.

## Development Notes

See `.codex/apps/mqtt-bridge/WIP.md` for current tasks and `.codex/apps/mqtt-bridge/TODO.md` for backlog/high-level goals.
