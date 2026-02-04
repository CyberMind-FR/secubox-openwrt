# LuCI Jellyfin Dashboard

Web interface for managing Jellyfin media server with real-time status, container controls, and integration management.

## Installation

```bash
opkg install luci-app-jellyfin
```

## Access

LuCI menu: **Services -> Jellyfin**

## Sections

- **Service Status** -- Container state (running/stopped/not installed), uptime, Docker health, disk usage
- **Integration Status** -- HAProxy (disabled/pending/configured), Mesh P2P, Firewall WAN
- **Actions** -- Install, Start, Stop, Restart, Update, Backup, Uninstall, Open Web UI
- **Configuration** -- Port, image, data path, timezone, domain, HAProxy SSL, media paths, GPU transcoding, mesh toggle
- **Logs** -- Live container log viewer (last 50 lines)

## RPCD Methods

Backend: `luci.jellyfin`

| Method | Description |
|--------|-------------|
| `status` | Full service status, config, and integrations |
| `start` | Start Jellyfin container |
| `stop` | Stop Jellyfin container |
| `restart` | Restart Jellyfin container |
| `install` | Pull image and create container |
| `uninstall` | Remove container and data |
| `update` | Pull latest image and recreate |
| `configure_haproxy` | Register HAProxy vhost |
| `backup` | Create config/data backup |
| `restore` | Restore from backup archive |
| `logs` | Fetch container logs |

## Dependencies

- `luci-base`
- `secubox-app-jellyfin`

## License

Apache-2.0
