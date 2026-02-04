# SecuBox Jellyfin Media Server

Free media server for streaming movies, TV shows, music, and photos. Runs Jellyfin inside Docker on SecuBox-powered OpenWrt systems.

## Installation

```sh
opkg install secubox-app-jellyfin
jellyfinctl install
```

## Configuration

UCI config file: `/etc/config/jellyfin`

```
config jellyfin 'main'
    option enabled '0'
    option image 'jellyfin/jellyfin:latest'
    option data_path '/srv/jellyfin'
    option port '8096'
    option timezone 'Europe/Paris'

config jellyfin 'media'
    list media_path '/mnt/media/movies'
    list media_path '/mnt/media/music'

config jellyfin 'network'
    option domain 'jellyfin.secubox.local'
    option haproxy '0'
    option firewall_wan '0'

config jellyfin 'transcoding'
    option hw_accel '0'

config jellyfin 'mesh'
    option enabled '0'
```

## Usage

```sh
# Service control
/etc/init.d/jellyfin start
/etc/init.d/jellyfin stop

# Controller CLI
jellyfinctl install           # Pull Docker image and create container
jellyfinctl status            # Show container and integration status
jellyfinctl update            # Pull latest image and recreate container
jellyfinctl logs              # Show container logs (-f to follow)
jellyfinctl shell             # Open shell inside container
jellyfinctl backup            # Backup config and data
jellyfinctl restore <file>    # Restore from backup archive
jellyfinctl uninstall         # Stop and remove container and data

# Integrations
jellyfinctl configure-haproxy # Register HAProxy vhost with SSL
jellyfinctl remove-haproxy    # Remove HAProxy vhost
jellyfinctl configure-fw      # Open WAN firewall port
jellyfinctl remove-fw         # Close WAN firewall port
jellyfinctl register-mesh     # Register in SecuBox P2P mesh
jellyfinctl unregister-mesh   # Remove from mesh registry
```

Web UI: `http://<device-ip>:8096`

## Features

- Docker-based Jellyfin with full lifecycle management
- Multi-path media libraries (movies, music, photos, shows)
- Hardware GPU transcoding support
- HAProxy reverse proxy with SSL/ACME integration
- Firewall WAN port exposure
- SecuBox P2P mesh service registration
- Full config and data backup/restore
- Container shell access and log streaming

## Files

- `/etc/config/jellyfin` -- UCI configuration
- `/etc/init.d/jellyfin` -- procd service script
- `/usr/sbin/jellyfinctl` -- controller CLI

## Dependencies

- `dockerd`
- `docker`
- `containerd`

## License

Apache-2.0
