# LuCI InterceptoR Dashboard

Unified dashboard for SecuBox InterceptoR - "The Gandalf Proxy" transparent traffic interception system.

## Features

- **Health Score** - Overall interception coverage (0-100%)
- **5 Pillar Status Cards**:
  - WPAD Redirector - Auto-proxy discovery status
  - MITM Proxy - Threat detection and connection stats
  - CDN Cache - Hit ratio and bandwidth savings
  - Cookie Tracker - Tracking cookie detection
  - API Failover - Stale content serving status
- **Quick Links** - Direct access to individual module dashboards

## Installation

```bash
opkg install luci-app-interceptor
```

## Menu Location

SecuBox > InterceptoR > Overview

## Architecture

InterceptoR aggregates status from 5 interception pillars:

```
                    +-------------------+
                    |   InterceptoR     |
                    |    Dashboard      |
                    +-------------------+
                           |
    +------+------+--------+--------+------+
    |      |      |        |        |      |
  WPAD   MITM   CDN     Cookie   API
  Proxy  Proxy  Cache   Tracker  Failover
```

### Pillar Modules

| Pillar | Package | Function |
|--------|---------|----------|
| WPAD | luci-app-network-tweaks | Auto-proxy via DHCP/DNS |
| MITM | secubox-app-mitmproxy | HTTPS inspection, threat detection |
| CDN Cache | luci-app-cdn-cache | Content caching, bandwidth savings |
| Cookie Tracker | secubox-cookie-tracker | Cookie classification, tracking |
| API Failover | luci-app-cdn-cache | Stale-if-error, offline mode |

## RPCD Methods

| Method | Description |
|--------|-------------|
| `status` | Aggregated status from all pillars |
| `getPillarStatus` | Status for specific pillar |

## Health Score Calculation

- 20 points: WPAD enabled or enforcement active
- 20 points: mitmproxy running
- 20 points: CDN Cache (Squid) running
- 20 points: Cookie Tracker enabled
- 20 points: API Failover enabled

## Public Access

The `status` method is available to unauthenticated users for monitoring dashboards.

## Dependencies

- luci-base
- rpcd

Optional (for full functionality):
- luci-app-network-tweaks
- secubox-app-mitmproxy
- luci-app-cdn-cache
- secubox-cookie-tracker

## License

GPL-3.0
