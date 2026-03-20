English | [Francais](README.fr.md) | [中文](README.zh.md)

# RezApp Forge

Docker to SecuBox LXC App Converter.

## Overview

RezApp Forge converts Docker images into LXC containers and generates SecuBox addon packages. Browse Docker Hub, GHCR, and LinuxServer.io catalogs, convert images to LXC, and publish to the SecuBox app store.

## Features

- **Catalog Management** - Docker Hub, LinuxServer.io, GHCR support
- **Docker Search** - Search images across all enabled catalogs
- **Image Info** - View available tags and architectures
- **Docker to LXC** - Convert Docker images to LXC containers
- **Package Generation** - Auto-generate SecuBox addon packages
- **Catalog Publishing** - Add converted apps to SecuBox catalog

## Installation

```bash
opkg install secubox-app-rezapp
```

## CLI Usage

```bash
# Catalog management
rezappctl catalog list              # List enabled catalogs
rezappctl catalog add <name> <url>  # Add custom catalog
rezappctl catalog remove <name>     # Remove catalog

# Search Docker images
rezappctl search <query>            # Search all catalogs
rezappctl search heimdall           # Example: search for heimdall
rezappctl info <image>              # Show image details

# Convert Docker to LXC
rezappctl convert <image> [options]
  --name <app-name>     # Custom app name
  --tag <version>       # Image tag (default: latest)
  --memory <limit>      # Memory limit (default: 512M)

# Generate SecuBox package
rezappctl package <app-name>        # Create package from converted app

# Publish to catalog
rezappctl publish <app-name>        # Add manifest to SecuBox catalog

# List converted apps
rezappctl list                      # Show all converted apps
```

## Example Workflow

```bash
# 1. Search for an app
rezappctl search heimdall

# 2. Check available tags
rezappctl info linuxserver/heimdall

# 3. Convert to LXC
rezappctl convert linuxserver/heimdall --name heimdall --memory 512M

# 4. Generate SecuBox package
rezappctl package heimdall

# 5. Publish to catalog
rezappctl publish heimdall
```

## Configuration

UCI config: `/etc/config/rezapp`

```
config main 'main'
    option cache_dir '/srv/rezapp/cache'
    option output_dir '/srv/rezapp/generated'
    option apps_dir '/srv/rezapp/apps'
    option lxc_dir '/srv/lxc'
    option default_memory '512M'

config catalog 'dockerhub'
    option name 'Docker Hub'
    option type 'dockerhub'
    option enabled '1'

config catalog 'linuxserver'
    option name 'LinuxServer.io'
    option type 'dockerhub'
    option namespace 'linuxserver'
    option enabled '1'
```

## Conversion Process

1. **Pull** - Download Docker image
2. **Export** - Create container and export filesystem
3. **Extract** - Unpack to LXC rootfs
4. **Configure** - Generate LXC config from Docker metadata
5. **Wrap** - Create start script for LXC execution

## Generated Package Structure

```
/srv/rezapp/generated/secubox-app-<name>/
├── Makefile              # OpenWrt package makefile
├── files/
│   ├── etc/config/<name> # UCI configuration
│   ├── etc/init.d/<name> # Procd init script
│   └── usr/sbin/<name>ctl # Management CLI
└── README.md
```

## LuCI Interface

Install `luci-app-rezapp` for web interface at **Services > RezApp Forge**.

## Dependencies

- docker
- lxc, lxc-common
- curl, wget-ssl
- jsonfilter

## File Locations

| Path | Description |
|------|-------------|
| `/etc/config/rezapp` | UCI configuration |
| `/usr/sbin/rezappctl` | CLI tool |
| `/srv/rezapp/cache/` | Downloaded images |
| `/srv/rezapp/apps/` | Converted app metadata |
| `/srv/rezapp/generated/` | Generated packages |
| `/srv/lxc/<app>/` | LXC container rootfs |
| `/usr/share/rezapp/templates/` | Package templates |

## Templates

Templates at `/usr/share/rezapp/templates/`:

- `Makefile.tpl` - Package Makefile
- `init.d.tpl` - Procd init script
- `ctl.tpl` - Management CLI
- `config.tpl` - UCI defaults
- `start-lxc.tpl` - LXC startup wrapper
- `lxc-config.tpl` - LXC configuration
- `manifest.tpl` - App catalog manifest
