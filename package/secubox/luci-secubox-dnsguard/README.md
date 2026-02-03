# SecuBox DNS Guard

Alternate LuCI package for privacy-focused DNS management -- same functionality as `luci-app-dnsguard`, integrated under the SecuBox security menu.

## Installation

```bash
opkg install luci-secubox-dnsguard
```

## Access

LuCI > SecuBox > Security > DNS Guard

## Features

- DNS filtering and ad blocking configuration
- Upstream DNS provider selection
- Query logging and statistics dashboard
- Blocklist management

## RPCD Methods

Service: `luci.dnsguard`

## Dependencies

- `luci-base`

## License

Apache-2.0
