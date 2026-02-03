# LuCI SecuBox Service Exposure Manager

Unified interface for exposing local services via Tor hidden services and HAProxy SSL reverse proxy, with port conflict detection.

## Installation

```bash
opkg install luci-app-exposure
```

## Access

LuCI menu: **SecuBox -> Network -> Service Exposure**

## Tabs

- **Overview** -- Scan listening services, detect port conflicts
- **Services** -- Manage exposed service ports
- **Tor Hidden** -- Create and manage .onion hidden services
- **SSL Proxy** -- Configure HAProxy SSL reverse proxy entries

## RPCD Methods

Backend: `luci.exposure`

| Method | Description |
|--------|-------------|
| `scan` | Scan all listening services and ports |
| `conflicts` | Detect port conflicts between services |
| `status` | Get exposure manager status |
| `tor_list` | List Tor hidden services |
| `ssl_list` | List SSL reverse proxy entries |
| `get_config` | Get exposure configuration |
| `fix_port` | Reassign a conflicting service port |
| `tor_add` | Add a Tor hidden service |
| `tor_remove` | Remove a Tor hidden service |
| `ssl_add` | Add an SSL reverse proxy entry |
| `ssl_remove` | Remove an SSL reverse proxy entry |

## Dependencies

- `luci-base`
- `secubox-app-exposure`

## License

Apache-2.0
