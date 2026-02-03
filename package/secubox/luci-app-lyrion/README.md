# LuCI Lyrion Music Server

Management dashboard for Lyrion Music Server (formerly Logitech Media Server / Squeezebox Server).

## Installation

```bash
opkg install luci-app-lyrion
```

## Access

LuCI menu: **Services -> Lyrion**

## Tabs

- **Overview** -- Service status, web UI link, player count
- **Settings** -- Port, data/media paths, memory limit, timezone, runtime

## RPCD Methods

Backend: `luci.lyrion`

| Method | Description |
|--------|-------------|
| `status` | Service and container status |
| `get_config` | Get current configuration |
| `save_config` | Save configuration |
| `install` | Install Lyrion container |
| `start` | Start Lyrion |
| `stop` | Stop Lyrion |
| `restart` | Restart Lyrion |
| `update` | Update to latest version |
| `logs` | Fetch service logs |

## Dependencies

- `luci-base`

## License

Apache-2.0
