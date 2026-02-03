# SecuBox Nextcloud

Self-hosted file sync and share platform running in Docker on OpenWrt. Provides calendar, contacts, collaborative editing, and file management.

## Installation

```bash
opkg install secubox-app-nextcloud
```

## Configuration

UCI config file: `/etc/config/nextcloud`

```bash
uci set nextcloud.main.enabled='1'
uci set nextcloud.main.domain='cloud.example.com'
uci set nextcloud.main.port='8080'
uci set nextcloud.main.admin_user='admin'
uci set nextcloud.main.data_dir='/srv/nextcloud/data'
uci commit nextcloud
```

## Usage

```bash
nextcloudctl start       # Start Nextcloud container
nextcloudctl stop        # Stop Nextcloud container
nextcloudctl status      # Show service status
nextcloudctl update      # Pull latest container image
nextcloudctl occ <cmd>   # Run Nextcloud occ command
nextcloudctl logs        # View container logs
```

## Features

- File sync and share with web, desktop, and mobile clients
- Calendar and contacts (CalDAV/CardDAV)
- Collaborative document editing
- Docker-based deployment with persistent storage

## Dependencies

- `dockerd`
- `docker`
- `containerd`

## License

Apache-2.0
