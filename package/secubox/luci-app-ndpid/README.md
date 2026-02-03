# LuCI nDPId Dashboard

LuCI web interface for nDPId deep packet inspection -- real-time traffic analysis and protocol detection.

## Installation

```bash
opkg install luci-app-ndpid
```

## Access

LuCI > SecuBox > nDPId Intelligence

## Tabs

- **Dashboard** -- Live traffic statistics and protocol breakdown
- **Flows** -- Active network flows with detected application protocols
- **Settings** -- nDPId daemon configuration

## Helper Scripts

- `ndpid-compat` -- Compatibility layer for nDPId integration
- `ndpid-flow-actions` -- Flow event processing and actions
- `ndpid-collector` -- Traffic data collection and aggregation

## RPCD Methods

Service: `luci.ndpid`

## Dependencies

- `luci-base`
- `ndpid`
- `socat`
- `jq`

## License

Apache-2.0
