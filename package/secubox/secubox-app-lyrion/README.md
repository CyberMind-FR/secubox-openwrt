English | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox Lyrion Music Server

Lyrion Music Server (formerly Logitech Media Server / Squeezebox Server) for SecuBox-powered OpenWrt systems.

## Overview

Runs Lyrion in a Debian Bookworm LXC container with:
- Official Lyrion Debian package (v9.x)
- Full audio codec support (FLAC, MP3, AAC, etc.)
- Squeezebox player discovery (UDP 3483)
- Web interface on configurable port (default: 9000)

## Installation

```sh
opkg install secubox-app-lyrion
lyrionctl install   # Creates Debian LXC container
/etc/init.d/lyrion enable
/etc/init.d/lyrion start
```

## Configuration

UCI config file: `/etc/config/lyrion`

```
config lyrion 'main'
    option enabled '0'
    option port '9000'
    option data_path '/srv/lyrion'
    option media_path '/srv/media'
    option memory_limit '1G'
    option extra_media_paths '/mnt/usb:/mnt/usb'
```

### Extra Media Paths

Mount additional media directories (space-separated):
```
option extra_media_paths '/mnt/MUSIC /mnt/USB:/music/usb'
```

## Usage

```sh
# Service management
/etc/init.d/lyrion start
/etc/init.d/lyrion stop
/etc/init.d/lyrion restart

# Controller CLI
lyrionctl status      # Show container status
lyrionctl install     # Create Debian LXC container
lyrionctl destroy     # Remove container (preserves config)
lyrionctl update      # Rebuild container with latest Lyrion
lyrionctl logs        # View server logs
lyrionctl logs -f     # Follow logs
lyrionctl shell       # Open shell in container
lyrionctl runtime     # Show detected runtime
```

## Container Architecture

The container uses Debian Bookworm with:
- Official Lyrion repository packages
- Bind mounts for config (`/srv/lyrion`) and media
- Shared host networking for player discovery
- Memory limits via cgroup2

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 9000 | TCP | Web interface |
| 9090 | TCP | CLI/RPC interface |
| 3483 | TCP | Slim Protocol (players) |
| 3483 | UDP | Player discovery |

## Files

- `/etc/config/lyrion` -- UCI configuration
- `/usr/sbin/lyrionctl` -- Controller CLI
- `/srv/lyrion/` -- Persistent config and cache
- `/srv/lxc/lyrion/` -- LXC container rootfs

## Dependencies

- `lxc` (or `docker`)
- `debootstrap` (auto-installed for LXC)
- `wget`, `tar`

## License

Apache-2.0
