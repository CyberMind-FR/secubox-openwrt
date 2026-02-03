# SecuBox Glances System Monitor

Cross-platform system monitoring tool running in an LXC container, with web UI and RESTful API.

## Installation

```sh
opkg install secubox-app-glances
```

## Configuration

UCI config file: `/etc/config/glances`

```
config glances 'main'
    option enabled '0'
    option port '61208'
```

## Usage

```sh
# Start / stop the service
/etc/init.d/glances start
/etc/init.d/glances stop

# Controller CLI
glancesctl status
glancesctl install
glancesctl remove
```

## Features

- Real-time CPU, memory, disk, and network monitoring
- Process list with resource usage
- Docker/Podman container monitoring
- Web-based UI accessible from any device
- RESTful JSON API for integrations
- Alert system for threshold monitoring

## Files

- `/etc/config/glances` -- UCI configuration
- `/usr/sbin/glancesctl` -- controller CLI

## Dependencies

- `wget`
- `tar`

## License

LGPL-3.0
