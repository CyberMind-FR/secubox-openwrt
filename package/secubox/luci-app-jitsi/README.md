# LuCI Jitsi Meet Configuration

Video conferencing service management for self-hosted Jitsi Meet.

## Installation

```bash
opkg install luci-app-jitsi
```

## Access

LuCI menu: **Services -> Jitsi Meet**

## Features

- Docker container orchestration (web, prosody, jicofo, jvb)
- Conference and participant statistics via JVB API
- User management for authenticated meetings
- Service logs viewer

## RPCD Methods

Backend: `luci.jitsi`

| Method | Description |
|--------|-------------|
| `status` | Container states, conference/participant stats |
| `start` | Start Jitsi containers |
| `stop` | Stop Jitsi containers |
| `restart` | Restart all containers |
| `install` | Install Jitsi stack |
| `generate_config` | Generate Jitsi configuration files |
| `add_user` | Add an authenticated user |
| `remove_user` | Remove a user |
| `list_users` | List registered users |
| `logs` | Fetch service logs |

## Dependencies

- `secubox-app-jitsi`

## License

Apache-2.0
