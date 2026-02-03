# CyberFeed - RSS Feed Aggregator

RSS feed aggregator for OpenWrt/SecuBox with RSS-Bridge support for social media feeds.

## Installation

```sh
opkg install secubox-app-cyberfeed
```

## Configuration

UCI config file: `/etc/config/cyberfeed`

Feed list: `/etc/cyberfeed/feeds.conf`

```
config cyberfeed 'main'
    option enabled '1'
    option refresh_interval '3600'
```

## Usage

```sh
# Fetch and update feeds
cyberfeed update

# List cached feeds
cyberfeed list

# Set up RSS-Bridge for social media feeds
rss-bridge-setup
```

Feed refresh runs automatically via cron when enabled.

## Files

- `/etc/config/cyberfeed` -- UCI configuration
- `/etc/cyberfeed/feeds.conf` -- feed URL list
- `/usr/bin/cyberfeed` -- main CLI
- `/usr/bin/rss-bridge-setup` -- RSS-Bridge installer

## Dependencies

- `wget-ssl`
- `jsonfilter`
- `coreutils-stat`

## License

MIT
