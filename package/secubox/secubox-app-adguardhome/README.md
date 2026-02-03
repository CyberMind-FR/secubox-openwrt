# SecuBox AdGuard Home

Network-wide ad blocker running in Docker on SecuBox-powered OpenWrt systems, with DNS-over-HTTPS/TLS support and detailed analytics.

## Installation

```sh
opkg install secubox-app-adguardhome
```

## Configuration

UCI config file: `/etc/config/adguardhome`

```
config adguardhome 'main'
    option enabled '0'
    option port '3000'
```

## Usage

```sh
# Start / stop the service
/etc/init.d/adguardhome start
/etc/init.d/adguardhome stop

# Controller CLI
adguardhomectl status
adguardhomectl install
adguardhomectl remove
```

## Files

- `/etc/config/adguardhome` -- UCI configuration
- `/etc/init.d/adguardhome` -- init script
- `/usr/sbin/adguardhomectl` -- controller CLI

## Dependencies

- `dockerd`
- `docker`
- `containerd`

## License

Apache-2.0
