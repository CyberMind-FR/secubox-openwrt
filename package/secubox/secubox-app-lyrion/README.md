# SecuBox Lyrion Music Server

Lyrion Music Server (formerly Logitech Media Server / Squeezebox Server) for SecuBox-powered OpenWrt systems.

## Installation

```sh
opkg install secubox-app-lyrion
```

## Configuration

UCI config file: `/etc/config/lyrion`

```
config lyrion 'main'
    option enabled '0'
    option port '9000'
```

Supports Docker and LXC runtimes. The controller auto-detects the available runtime, preferring LXC for lower resource usage.

## Usage

```sh
# Start / stop the service
/etc/init.d/lyrion start
/etc/init.d/lyrion stop

# Controller CLI
lyrionctl status
lyrionctl install
lyrionctl remove
```

## Files

- `/etc/config/lyrion` -- UCI configuration
- `/usr/sbin/lyrionctl` -- controller CLI

## Dependencies

- `wget`
- `tar`

## License

Apache-2.0
