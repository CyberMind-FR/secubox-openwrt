# luci-app-domoticz

LuCI web interface for managing the Domoticz home automation platform on SecuBox.

## Installation

```bash
opkg install luci-app-domoticz
```

Requires `secubox-app-domoticz` (installed as dependency).

## Features

- **Service Status**: Container status, Docker availability, disk usage, USB devices
- **IoT Integration**: Mosquitto broker status, Zigbee2MQTT status, MQTT bridge configuration
- **MQTT Auto-Setup**: One-click Mosquitto installation and broker configuration
- **Network**: HAProxy reverse proxy integration, WAN access control, domain configuration
- **Mesh P2P**: Register Domoticz in the SecuBox P2P mesh for multi-node discovery
- **Actions**: Install, start, stop, restart, update, backup, uninstall
- **Logs**: Live container log viewer

## RPCD Methods

| Method | Params | Description |
|--------|--------|-------------|
| `status` | — | Container, MQTT, Z2M, HAProxy, mesh status |
| `start` | — | Start Domoticz service |
| `stop` | — | Stop Domoticz service |
| `restart` | — | Restart Domoticz service |
| `install` | — | Pull Docker image and configure |
| `uninstall` | — | Remove container (preserves data) |
| `update` | — | Pull latest image and restart |
| `configure_mqtt` | — | Auto-configure Mosquitto and MQTT bridge |
| `configure_haproxy` | — | Register HAProxy vhost |
| `backup` | — | Create data backup |
| `restore` | path | Restore from backup file |
| `logs` | lines | Fetch container logs |

## Menu Location

Services > Domoticz

## Files

- `/usr/libexec/rpcd/luci.domoticz` — RPCD handler
- `/usr/share/rpcd/acl.d/luci-app-domoticz.json` — ACL permissions
- `/usr/share/luci/menu.d/luci-app-domoticz.json` — Menu entry
- `/www/luci-static/resources/view/domoticz/overview.js` — LuCI view

## Dependencies

- `secubox-app-domoticz`

## License

Apache-2.0
