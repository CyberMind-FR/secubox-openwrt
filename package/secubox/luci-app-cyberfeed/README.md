# LuCI CyberFeed Dashboard

RSS feed aggregator with social media support via RSS-Bridge integration.

## Installation

```bash
opkg install luci-app-cyberfeed
```

## Access

LuCI menu: **Services -> CyberFeed**

## Tabs

- **Dashboard** -- Feed status, item count, last sync time
- **Feeds** -- Add, remove, and manage RSS/Atom feed sources
- **Preview** -- Browse fetched feed items
- **Settings** -- Refresh interval, cache TTL, RSS-Bridge config

## RPCD Methods

Backend: `luci.cyberfeed`

| Method | Description |
|--------|-------------|
| `get_status` | Service status and feed statistics |
| `get_feeds` | List configured feeds |
| `get_items` | Get fetched feed items |
| `add_feed` | Add a new feed source |
| `delete_feed` | Remove a feed |
| `sync_feeds` | Trigger feed synchronization |
| `get_config` | Get current settings |
| `save_config` | Save settings |
| `rssbridge_status` | RSS-Bridge service status |
| `rssbridge_install` | Install RSS-Bridge |
| `rssbridge_control` | Start/stop RSS-Bridge |

## Dependencies

- `secubox-app-cyberfeed`

## License

Apache-2.0
