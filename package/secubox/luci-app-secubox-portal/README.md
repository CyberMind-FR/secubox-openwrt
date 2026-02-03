# SecuBox Portal

Unified web UI entry point for all SecuBox applications -- provides the top-level SecuBox navigation and tabbed dashboard.

## Installation

```bash
opkg install luci-app-secubox-portal
```

## Access

LuCI > SecuBox (top-level menu)

## Sections

- **Dashboard** -- Aggregated overview of all SecuBox services
- **Services** -- Container for service sub-menus
- **Apps** -- Application launcher and catalog
- **Settings** -- Global SecuBox settings

### Public Pages (no login required)

- Bug Bounty
- Crowdfunding Campaign
- Development Status

## Dependencies

- `luci-base`
- `luci-theme-secubox`

## License

Apache-2.0
