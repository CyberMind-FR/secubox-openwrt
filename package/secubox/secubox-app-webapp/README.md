# SecuBox Dashboard Web Application

Native web dashboard for SecuBox appliances. Provides real-time monitoring, service management, and CrowdSec security integration using rpcd/ubus authentication.

## Installation

```bash
opkg install secubox-app-webapp
```

## Configuration

UCI config file: `/etc/config/secubox-webapp`

```bash
uci set secubox-webapp.main.enabled='1'
uci set secubox-webapp.main.port='80'
uci commit secubox-webapp
```

## Setup

Run initial setup after installation:

```bash
/usr/sbin/secubox-webapp-setup
```

## Web Interface

Access the dashboard at `http://<router-ip>/secubox/index.html`. Authentication is handled through the native rpcd/ubus session system (same credentials as LuCI).

## Features

- Real-time system monitoring (CPU, memory, network)
- Service status and management
- CrowdSec threat dashboard integration
- Native rpcd/ubus authentication (no separate user database)

## Dependencies

- `uhttpd`
- `uhttpd-mod-ubus`
- `rpcd`
- `rpcd-mod-file`

## License

Apache-2.0
