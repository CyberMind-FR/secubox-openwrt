# LuCI MMPM Dashboard

LuCI web interface for managing MagicMirror modules via MMPM (MagicMirror Package Manager).

## Installation

```bash
opkg install luci-app-mmpm
```

## Access

LuCI > Services > MMPM

## Tabs

- **Dashboard** -- Service status and MagicMirror overview
- **Modules** -- Search, install, update, and remove MagicMirror modules
- **Web GUI** -- Embedded MMPM web interface
- **Settings** -- MMPM and MagicMirror configuration

## RPCD Methods

Service: `luci.mmpm`

## Dependencies

- `luci-base`
- `secubox-app-mmpm`

## License

Apache-2.0
