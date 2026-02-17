# SecuBox Nextcloud

Self-hosted file sync and collaboration platform running in a Debian LXC container on OpenWrt. Features MariaDB database, Redis caching, and Nginx web server.

## Installation

```bash
opkg install secubox-app-nextcloud luci-app-nextcloud
```

## Quick Start

```bash
# Install Nextcloud (creates LXC container)
nextcloudctl install

# Start service
/etc/init.d/nextcloud start

# Access web interface
# http://router-ip:8080
```

## Configuration

UCI config file: `/etc/config/nextcloud`

```bash
uci set nextcloud.main.enabled='1'
uci set nextcloud.main.domain='cloud.example.com'
uci set nextcloud.main.http_port='8080'
uci set nextcloud.main.admin_user='admin'
uci set nextcloud.main.memory_limit='1G'
uci set nextcloud.main.upload_max='512M'
uci commit nextcloud
```

## CLI Commands

```bash
nextcloudctl install          # Create Debian LXC, install Nextcloud stack
nextcloudctl uninstall        # Remove container (preserves data)
nextcloudctl update           # Update Nextcloud to latest version
nextcloudctl start            # Start Nextcloud service
nextcloudctl stop             # Stop Nextcloud service
nextcloudctl restart          # Restart Nextcloud service
nextcloudctl status           # Show service status (JSON)
nextcloudctl logs [-f]        # Show container logs
nextcloudctl shell            # Open shell in container

nextcloudctl occ <cmd>        # Run Nextcloud OCC command
nextcloudctl backup [name]    # Create backup of data and database
nextcloudctl restore <name>   # Restore from backup
nextcloudctl list-backups     # List available backups

nextcloudctl ssl-enable <domain>  # Register with HAProxy for SSL
nextcloudctl ssl-disable          # Remove HAProxy registration
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenWrt Host                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              LXC: nextcloud (Debian 12)               │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │  │
│  │  │ Nginx   │  │Nextcloud│  │ MariaDB │  │  Redis  │  │  │
│  │  │ :8080   │→ │ PHP-FPM │→ │ :3306   │  │ :6379   │  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │  │
│  │                    ↓                                  │  │
│  │         /srv/nextcloud (bind mount)                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           HAProxy (optional SSL termination)          │  │
│  │      cloud.example.com:443 → nextcloud:8080           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features

- File sync and share with web, desktop, and mobile clients
- Calendar and contacts (CalDAV/CardDAV)
- Collaborative document editing
- End-to-end encryption support
- Debian LXC container with PHP 8.2
- MariaDB database with optimized settings
- Redis caching for improved performance
- Nginx with Nextcloud-optimized config
- HAProxy integration for SSL/HTTPS
- Automated backup and restore
- Memory limit via cgroups
- Auto-start on boot

## Data Locations

```
/srv/nextcloud/
├── data/           # Nextcloud user data
├── config/         # Nextcloud config.php
└── backups/        # Automated backups
```

## SSL with HAProxy

```bash
# Enable HTTPS via HAProxy with Let's Encrypt
nextcloudctl ssl-enable cloud.example.com

# Access via HTTPS
https://cloud.example.com
```

## Dependencies

- `lxc` - Container runtime
- `lxc-common` - LXC utilities
- `tar`, `wget-ssl`, `unzip`, `xz` - Archive tools
- `jsonfilter` - JSON parsing
- `openssl-util` - SSL utilities

## License

Apache-2.0
