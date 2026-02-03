# SecuBox App Store CLI

Command-line helper for managing SecuBox App Store manifests.

## Installation

```sh
opkg install secubox-app
```

## Usage

```sh
# List available apps
secubox-app list

# Show app manifest details
secubox-app info <app-name>

# Install an app
secubox-app install <app-name>
```

Default plugin manifests are shipped under `/usr/share/secubox/plugins/`.

## Files

- `/usr/sbin/secubox-app` -- main CLI
- `/usr/share/secubox/plugins/` -- app manifests

## Dependencies

- `jsonfilter`

## License

Apache-2.0
