# SecuBox CrowdSec Firewall Bouncer

CrowdSec firewall bouncer with native nftables integration for IPv4 and IPv6 on OpenWrt. Go binary, version 0.0.31.

## Installation

```sh
opkg install secubox-app-cs-firewall-bouncer
```

## Configuration

UCI config file: `/etc/config/crowdsec`

The bouncer registers with the local CrowdSec LAPI and manages nftables sets to block malicious IPs.

## Usage

```sh
# Start / stop the service
/etc/init.d/crowdsec-firewall-bouncer start
/etc/init.d/crowdsec-firewall-bouncer stop

# Check bouncer status
cs-firewall-bouncer -version
```

## Files

- `/etc/config/crowdsec` -- UCI configuration
- `/etc/init.d/crowdsec-firewall-bouncer` -- init script
- `/usr/sbin/cs-firewall-bouncer` -- Go binary

## Build Notes

This is a Go package with CGO. It must be built with the full OpenWrt toolchain, not the SDK:

```sh
cd secubox-tools/openwrt
make package/secubox-app-cs-firewall-bouncer/compile V=s
```

## Dependencies

- `nftables`

## License

MIT
