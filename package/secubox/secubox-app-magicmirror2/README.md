# SecuBox MagicMirror2

Open-source modular smart display platform running in an LXC container on SecuBox-powered OpenWrt systems.

## Installation

```sh
opkg install secubox-app-magicmirror2
```

## Configuration

UCI config file: `/etc/config/magicmirror2`

```
config magicmirror2 'main'
    option enabled '0'
    option port '8080'
```

## Usage

```sh
# Start / stop the service
/etc/init.d/magicmirror2 start
/etc/init.d/magicmirror2 stop

# Controller CLI
mm2ctl status
mm2ctl install
mm2ctl remove
```

## Features

- Modular architecture with hundreds of available modules
- Built-in module manager for easy installation
- Weather, calendar, news, and custom widgets
- Web-based configuration interface
- Kiosk mode for dedicated displays

## Files

- `/etc/config/magicmirror2` -- UCI configuration
- `/usr/sbin/mm2ctl` -- controller CLI

## Dependencies

- `wget`
- `tar`
- `jq`
- `zstd`

## License

Apache-2.0
