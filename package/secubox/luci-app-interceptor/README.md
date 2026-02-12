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

- SecuBox > InterceptoR > Overview - Health score and pillar status
- SecuBox > InterceptoR > Services - Dynamic services dashboard

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

## Services Dashboard

The Services tab provides a dynamic view of all SecuBox services with:

- **Published** - HAProxy vhosts and Tor onion services with live URLs
- **Proxies** - mitmproxy instances with status and web UI links
- **Services** - Running daemons with enable/running status
- **Dashboards** - LuCI app links for quick navigation
- **Metrics** - System health, memory, CrowdSec stats

Each service displays with its category emoji for quick visual identification.

## RPCD Methods

### luci.interceptor

| Method | Description |
|--------|-------------|
| `status` | Aggregated status from all pillars |
| `getPillarStatus` | Status for specific pillar |

### luci.services-registry

| Method | Description |
|--------|-------------|
| `getServices` | All init.d services with status |
| `getPublished` | HAProxy vhosts + Tor onion URLs |
| `getMetrics` | System metrics and CrowdSec stats |
| `getAll` | Combined: services, published, proxies, dashboards, metrics |

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
