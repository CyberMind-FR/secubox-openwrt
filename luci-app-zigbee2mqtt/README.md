# LuCI App – Zigbee2MQTT

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

LuCI interface for managing the Docker-based Zigbee2MQTT service packaged in `secubox-app-zigbee2mqtt`.

## Features

- Displays service/container status, enablement, and quick actions (start/stop/restart/update).
- Runs prerequisite checks and full Docker installation (dockerd/containerd/image pull) via LuCI buttons.
- Provides a form to edit `/etc/config/zigbee2mqtt` (serial port, MQTT host, credentials, base topic, frontend port, channel, data path, docker image, timezone).
- Streams Docker logs directly in LuCI.
- Uses SecuBox design system and RPCD backend (`luci.zigbee2mqtt`).

## Requirements

- `secubox-app-zigbee2mqtt` package installed (provides CLI + procd service).
- Docker runtime (`dockerd`, `docker`, `containerd`) available on the router.
- Zigbee coordinator connected (e.g., `/dev/ttyACM0`).

## Installation

```sh
opkg update
opkg install secubox-app-zigbee2mqtt luci-app-zigbee2mqtt
```

Access via LuCI: **Services → SecuBox → Zigbee2MQTT**.

## Files

| Path | Purpose |
|------|---------|
| `htdocs/luci-static/resources/view/zigbee2mqtt/overview.js` | Main LuCI view. |
| `htdocs/luci-static/resources/zigbee2mqtt/api.js` | RPC bindings. |
| `root/usr/libexec/rpcd/luci.zigbee2mqtt` | RPC backend interacting with UCI and `zigbee2mqttctl`. |
| `root/usr/share/luci/menu.d/luci-app-zigbee2mqtt.json` | Menu entry. |
| `root/usr/share/rpcd/acl.d/luci-app-zigbee2mqtt.json` | ACL defaults. |

## RPC Methods

- `status` – Return UCI config, service enable/running state, Docker container list.
- `apply` – Update UCI fields, commit, and restart the service.
- `logs` – Tail container logs.
- `control` – Start/stop/restart service via init script.
- `update` – Pull latest image and restart.

## Development Notes

- Follow SecuBox design tokens (see `DOCS/DEVELOPMENT-GUIDELINES.md`).
- Keep RPC filenames aligned with ubus object name (`luci.zigbee2mqtt`).
- Validate with `./secubox-tools/validate-modules.sh`.

## Documentation

- Deployment walkthrough: [`docs/embedded/zigbee2mqtt-docker.md`](../docs/embedded/zigbee2mqtt-docker.md)
- CLI helper (`zigbee2mqttctl`) is packaged by `secubox-app-zigbee2mqtt`.
