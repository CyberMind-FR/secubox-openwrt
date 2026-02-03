# LuCI Mail-in-a-Box

Self-hosted mail server management dashboard (SMTP, IMAP, webmail).

## Installation

```bash
opkg install luci-app-mailinabox
```

## Access

LuCI menu: **Services -> Mail Server**

## Tabs

- **Overview** -- Service status, container health, domain configuration
- **Settings** -- Hostname, domain, service control

## RPCD Methods

Backend: `luci.mailinabox`

| Method | Description |
|--------|-------------|
| `status` | Service and container status |
| `get_config` | Get mail server configuration |
| `save_config` | Save hostname and domain settings |
| `install` | Install Mail-in-a-Box container |
| `start` | Start mail services |
| `stop` | Stop mail services |
| `restart` | Restart mail services |
| `logs` | Fetch service logs |

## Dependencies

- `luci-base`

## License

Apache-2.0
