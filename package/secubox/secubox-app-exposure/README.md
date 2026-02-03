# SecuBox Service Exposure Manager

Unified backend for managing service exposure: port conflict detection, Tor hidden services, and HAProxy SSL reverse proxy configuration.

## Installation

```sh
opkg install secubox-app-exposure
```

## Configuration

UCI config file: `/etc/config/secubox-exposure`

```
config exposure 'main'
    option enabled '1'
```

## Usage

```sh
# Check for port conflicts
secubox-exposure check-ports

# Manage Tor hidden services
secubox-exposure tor-add <service>
secubox-exposure tor-remove <service>

# Manage HAProxy reverse proxy entries
secubox-exposure haproxy-add <service>
secubox-exposure haproxy-remove <service>
```

## Files

- `/etc/config/secubox-exposure` -- UCI configuration
- `/usr/sbin/secubox-exposure` -- main CLI

## Dependencies

- `secubox-core`

## License

MIT
