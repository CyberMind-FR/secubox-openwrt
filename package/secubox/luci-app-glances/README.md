# LuCI Glances Dashboard

System monitoring dashboard powered by Glances with embedded Web UI.

## Installation

```bash
opkg install luci-app-glances
```

## Access

LuCI menu: **SecuBox -> Monitoring -> Glances**

## Tabs

- **Dashboard** -- CPU, memory, disk, and network metrics at a glance
- **Web UI** -- Embedded Glances web interface with SecuBox theme
- **Settings** -- Monitoring intervals, alert thresholds, service control

## RPCD Methods

Backend: `luci.glances`

| Method | Description |
|--------|-------------|
| `get_status` | Service status and basic metrics |
| `get_config` | Get Glances configuration |
| `get_monitoring_config` | Get monitoring parameters |
| `get_alerts_config` | Get alert threshold settings |
| `get_web_url` | Get Glances Web UI URL |
| `service_start` | Start Glances |
| `service_stop` | Stop Glances |
| `service_restart` | Restart Glances |
| `set_config` | Update a configuration key |

## Dependencies

- `luci-base`
- `secubox-app-glances`

## License

Apache-2.0
