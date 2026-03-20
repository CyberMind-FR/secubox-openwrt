# LuCI Streamlit Dashboard

English | [Francais](README.fr.md) | [中文](README.zh.md)

LuCI web interface for managing Streamlit application instances with Gitea integration.

## Installation

```bash
opkg install luci-app-streamlit
```

## Access

LuCI > Services > Streamlit

## Tabs

- **Dashboard** -- Running instances, status, and resource usage
- **Settings** -- Instance configuration and Gitea repository integration

## Features

- Multi-instance Streamlit management
- Deploy apps from Gitea repositories
- Per-instance start/stop controls

## RPCD Methods

Service: `luci.streamlit`

## Dependencies

- `luci-base`
- `secubox-app-streamlit`

## License

Apache-2.0
