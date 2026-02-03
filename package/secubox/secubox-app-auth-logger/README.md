# SecuBox Authentication Failure Logger for CrowdSec

Logs authentication failures from LuCI/rpcd and Dropbear SSH for CrowdSec detection.

## Installation

```sh
opkg install secubox-app-auth-logger
```

## Usage

```sh
# Enable and start the service
/etc/init.d/secubox-app-auth-logger enable
/etc/init.d/secubox-app-auth-logger start
```

The auth monitor runs as a background daemon watching for login failures.

## What It Ships

- SSH failure monitoring (OpenSSH/Dropbear)
- LuCI web interface auth failure logging via CGI hook
- CrowdSec parser and bruteforce scenario
- CrowdSec acquisition configuration

## Files

- `/etc/init.d/secubox-app-auth-logger` -- init script
- `/usr/lib/secubox/auth-monitor.sh` -- auth failure monitor daemon

## Dependencies

- `rpcd`
- `uhttpd`

## License

Apache-2.0
