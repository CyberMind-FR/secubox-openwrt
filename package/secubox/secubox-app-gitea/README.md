# SecuBox Gitea Platform

Self-hosted lightweight Git service running in an LXC container on SecuBox-powered OpenWrt systems.

## Installation

```sh
opkg install secubox-app-gitea
```

## Configuration

UCI config file: `/etc/config/gitea`

```
config gitea 'main'
    option enabled '0'
    option http_port '3000'
    option ssh_port '2222'
```

## Usage

```sh
# Start / stop the service
/etc/init.d/gitea start
/etc/init.d/gitea stop

# Controller CLI
giteactl status
giteactl install
giteactl remove
giteactl backup
giteactl restore
```

## Features

- Git HTTP and SSH access
- Repository and user management via web UI
- SQLite database (embedded)
- Backup and restore support
- Runs in Alpine Linux LXC container

## Files

- `/etc/config/gitea` -- UCI configuration
- `/usr/sbin/giteactl` -- controller CLI

## Dependencies

- `jsonfilter`
- `wget-ssl`
- `tar`
- `lxc`
- `lxc-common`
- `git`

## License

MIT
