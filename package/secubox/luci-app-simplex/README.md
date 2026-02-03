# LuCI SimpleX Chat Server

LuCI web interface for managing a self-hosted SimpleX Chat relay -- privacy-first messaging with SMP and XFTP servers.

## Installation

```bash
opkg install luci-app-simplex
```

## Access

LuCI > Services > SimpleX Chat

## Features

- SMP (SimpleX Messaging Protocol) server management
- XFTP file transfer server management
- Server address and fingerprint display
- Service start/stop/restart controls
- Connection status monitoring

## RPCD Methods

Service: `luci.simplex`

## Dependencies

- `secubox-app-simplex`

## License

Apache-2.0
