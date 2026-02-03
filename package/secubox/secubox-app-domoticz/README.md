# SecuBox Domoticz

Home automation platform running in Docker on SecuBox-powered OpenWrt systems.

## Installation

```sh
opkg install secubox-app-domoticz
```

## Configuration

UCI config file: `/etc/config/domoticz`

```
config domoticz 'main'
    option enabled '0'
    option port '8080'
```

## Usage

```sh
# Start / stop the service
/etc/init.d/domoticz start
/etc/init.d/domoticz stop

# Controller CLI
domoticzctl status
domoticzctl install
domoticzctl remove
```

## Files

- `/etc/config/domoticz` -- UCI configuration
- `/etc/init.d/domoticz` -- init script
- `/usr/sbin/domoticzctl` -- controller CLI

## Dependencies

- `dockerd`
- `docker`
- `containerd`

## License

Apache-2.0
