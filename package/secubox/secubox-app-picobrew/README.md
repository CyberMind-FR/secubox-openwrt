# SecuBox PicoBrew Server

Self-hosted PicoBrew brewing controller running in an LXC container. Provides recipe management, real-time brew session monitoring, and device connectivity for PicoBrew hardware.

## Installation

```bash
opkg install secubox-app-picobrew
```

## Configuration

UCI config file: `/etc/config/picobrew`

```bash
uci set picobrew.main.enabled='1'
uci set picobrew.main.port='8080'
uci commit picobrew
```

## Usage

```bash
picobrewctl start      # Start PicoBrew server
picobrewctl stop       # Stop PicoBrew server
picobrewctl status     # Show service status
picobrewctl logs       # View server logs
picobrewctl update     # Update server from git
```

## Features

- Recipe management and creation
- Real-time brew session monitoring
- PicoBrew device pairing and control
- Brew history and logging
- Runs isolated in LXC container

## Dependencies

- `jsonfilter`
- `wget-ssl`
- `tar`
- `lxc`
- `lxc-common`
- `git`

## License

Apache-2.0
