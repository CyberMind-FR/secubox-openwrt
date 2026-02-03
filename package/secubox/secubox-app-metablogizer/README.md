# MetaBlogizer - Static Site Publisher

Static site publisher with automatic virtual host creation. Supports uhttpd (native) and nginx (LXC) backends.

## Installation

```bash
opkg install secubox-app-metablogizer
```

## Configuration

UCI config file: `/etc/config/metablogizer`

```bash
uci set metablogizer.main.enabled='1'
uci set metablogizer.main.backend='uhttpd'
uci set metablogizer.main.web_root='/srv/www'
uci commit metablogizer
```

## Usage

```bash
metablogizerctl create <site>        # Create a new site
metablogizerctl deploy <site>        # Deploy/publish site
metablogizerctl list                 # List managed sites
metablogizerctl remove <site>        # Remove a site
metablogizerctl vhost add <domain>   # Add virtual host
metablogizerctl status               # Show status
```

## Features

- Auto-vhost creation for new sites
- uhttpd (native OpenWrt) and nginx (LXC) backends
- Git-based content deployment

## Dependencies

- `git`
- `uhttpd`

## License

Apache-2.0
