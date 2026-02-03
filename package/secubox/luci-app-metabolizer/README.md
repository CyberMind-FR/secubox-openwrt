# LuCI Metabolizer CMS

Content management system dashboard with Gitea integration and static site publishing.

## Installation

```bash
opkg install luci-app-metabolizer
```

## Access

LuCI menu: **Services -> Metabolizer CMS**

## Tabs

- **Overview** -- Service status, post count, Gitea sync state
- **Settings** -- CMS configuration

## RPCD Methods

Backend: `luci.metabolizer`

| Method | Description |
|--------|-------------|
| `status` | Service status and content statistics |
| `list_posts` | List published posts |
| `gitea_status` | Gitea repository sync status |
| `sync` | Sync content from source |
| `build` | Build static site |
| `publish` | Publish built site |
| `gitea_sync` | Sync with Gitea repository |

## Dependencies

- `luci-base`
- `secubox-app-metabolizer`

## License

Apache-2.0
