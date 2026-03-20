# LuCI PicoBrew Dashboard

English | [Francais](README.fr.md) | [中文](README.zh.md)

LuCI web interface for managing PicoBrew brewing controllers -- recipe and session monitoring.

## Installation

```bash
opkg install luci-app-picobrew
```

## Access

LuCI > Services > PicoBrew

## Tabs

- **Dashboard** -- Brewing session status, recipe overview, and controller state
- **Settings** -- PicoBrew service configuration

## RPCD Methods

Service: `luci.picobrew`

## Dependencies

- `luci-base`
- `secubox-app-picobrew`

## License

Apache-2.0
