# nDPId - Deep Packet Inspection Daemon

Layer-7 deep packet inspection daemon based on nDPI. Identifies application protocols and classifies network traffic using a microservice architecture with bundled libndpi 5.x.

## Installation

```bash
opkg install secubox-app-ndpid
```

## Configuration

UCI config file: `/etc/config/ndpid`
Native config: `/etc/ndpid.conf`

```bash
uci set ndpid.main.enabled='1'
uci set ndpid.main.interface='br-lan'
uci commit ndpid
```

## Binaries

| Binary | Description |
|--------|-------------|
| `/usr/sbin/ndpid` | DPI capture daemon |
| `/usr/sbin/ndpisrvd` | JSON distributor service |

## Architecture

```
Network traffic --> ndpid (capture + classify) --> ndpisrvd (JSON distributor) --> consumers
```

ndpid captures packets, classifies protocols via libndpi, and sends detection events to ndpisrvd. Consumers connect to ndpisrvd for real-time flow data.

## Service Management

```bash
/etc/init.d/ndpid start
/etc/init.d/ndpid stop
/etc/init.d/ndpid status
```

## Dependencies

- `libpcap`
- `libjson-c`
- `libpthread`
- `zlib`
- `libstdcpp`

## License

GPL-3.0
