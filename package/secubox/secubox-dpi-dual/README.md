# SecuBox DPI Dual-Stream

Dual-stream Deep Packet Inspection architecture combining active MITM inspection with passive TAP analysis for comprehensive network security.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │            WAN INTERFACE            │
                    └─────────────────┬───────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          │
 ┌─────────────────────┐    ┌─────────────────────┐              │
 │   STREAM 1: MITM    │    │  STREAM 2: TAP/DPI  │              │
 │   (Active Path)     │    │  (Passive Mirror)   │              │
 └─────────┬───────────┘    └─────────┬───────────┘              │
           │                          │                          │
           ▼                          ▼                          │
 ┌─────────────────────┐    ┌─────────────────────┐              │
 │  HAProxy + MITM     │    │   tc mirred/TAP     │              │
 │  (SSL Termination)  │    │  (Port Mirroring)   │              │
 └─────────┬───────────┘    └─────────┬───────────┘              │
           │                          │                          │
           ▼                          ▼                          │
 ┌─────────────────────┐    ┌─────────────────────┐              │
 │   Double Buffer     │    │     netifyd         │              │
 │  (Async Analysis)   │    │   (nDPI Engine)     │              │
 └─────────┬───────────┘    └─────────┬───────────┘              │
           │                          │                          │
           └──────────────┬───────────┘                          │
                          │                                      │
                          ▼                                      │
           ┌─────────────────────────────────────┐               │
           │        CORRELATION ENGINE           │               │
           │  (IP Reputation + Context Match)    │               │
           └─────────────────────────────────────┘               │
```

## Features

### Stream 1: MITM (Active Inspection)
- Full content inspection with SSL/TLS termination
- WAF rule enforcement via mitmproxy
- Double-buffered request analysis
- Threat pattern detection (XSS, SQLi, LFI, RCE, SSRF, Path Traversal)
- Scanner detection (sqlmap, nikto, nmap, etc.)
- Optional request blocking for high-score threats

### Stream 2: TAP (Passive Analysis)
- Zero latency impact on live traffic
- Protocol identification via nDPI (300+ protocols)
- Flow statistics and bandwidth analysis
- Works with encrypted traffic (metadata analysis)
- Software (tc mirred) or hardware port mirroring

### Correlation Engine
- IP reputation tracking with score decay
- Event matching across both streams
- CrowdSec integration (decision watching, auto-ban)
- Full context gathering (MITM requests, WAF alerts, DPI flows)
- High-severity threat notifications

## Installation

```bash
opkg update
opkg install secubox-dpi-dual luci-app-dpi-dual
```

## CLI Usage

```bash
# Start/Stop/Restart
dpi-dualctl start
dpi-dualctl stop
dpi-dualctl restart

# Check status
dpi-dualctl status

# View flow statistics
dpi-dualctl flows

# View recent threats
dpi-dualctl threats 20

# Mirror control
dpi-dualctl mirror status
dpi-dualctl mirror start
dpi-dualctl mirror stop
```

### Correlator Commands

```bash
# Manual correlation
dpi-correlator correlate 192.168.1.100 waf_alert "suspicious_request" 75

# Get IP reputation
dpi-correlator reputation 192.168.1.100

# Get full context for IP
dpi-correlator context 192.168.1.100

# Search correlations
dpi-correlator search 192.168.1.100 50

# Show stats
dpi-correlator stats
```

## Configuration

Edit `/etc/config/dpi-dual`:

```
config global 'settings'
    option enabled '1'
    option mode 'dual'           # dual|mitm-only|tap-only
    option correlation '1'

config mitm 'mitm'
    option enabled '1'
    option buffer_size '1000'    # requests in double buffer
    option async_analysis '1'

config tap 'tap'
    option enabled '1'
    option interface 'tap0'
    option mirror_source 'eth0'
    option mirror_mode 'software' # software|hardware

config correlation 'correlation'
    option enabled '1'
    option watch_crowdsec '1'
    option auto_ban '0'
    option auto_ban_threshold '80'
    option notifications '1'
```

## LuCI Dashboard

Navigate to **SecuBox → DPI Dual-Stream**:

- **Overview**: Stream status, metrics, threats table
- **Correlation Timeline**: Event cards with IP context
- **Settings**: Full configuration interface

## Files

| File | Purpose |
|------|---------|
| `/usr/sbin/dpi-dualctl` | Main CLI tool |
| `/usr/sbin/dpi-flow-collector` | Flow aggregation service |
| `/usr/sbin/dpi-correlator` | Correlation engine |
| `/usr/lib/dpi-dual/mirror-setup.sh` | tc mirred port mirroring |
| `/usr/lib/dpi-dual/correlation-lib.sh` | Shared correlation functions |
| `/srv/mitmproxy/addons/dpi_buffer.py` | mitmproxy double buffer addon |
| `/etc/config/dpi-dual` | UCI configuration |
| `/etc/init.d/dpi-dual` | procd service |

## Output Files

| File | Content |
|------|---------|
| `/tmp/secubox/dpi-flows.json` | Flow statistics from TAP stream |
| `/tmp/secubox/dpi-buffer.json` | Buffer statistics from MITM |
| `/tmp/secubox/waf-alerts.json` | WAF threat alerts |
| `/tmp/secubox/correlated-threats.json` | Correlated threat log (JSONL) |
| `/tmp/secubox/ip-reputation.json` | IP reputation database |
| `/tmp/secubox/notifications.json` | High-severity threat notifications |

## Dependencies

- `netifyd` - nDPI-based flow analyzer
- `iproute2-tc` - Traffic control for port mirroring
- `jsonfilter` - JSON parsing (libubox)
- `coreutils-stat` - File statistics

## Performance

| Aspect | MITM Stream | TAP Stream |
|--------|-------------|------------|
| Latency | +5-20ms | 0ms |
| CPU | High (SSL, WAF) | Low (nDPI) |
| Memory | Buffer dependent | Minimal |
| Visibility | Full content | Metadata only |

## Security Notes

1. **TAP stream is read-only** — cannot block, only observe
2. **MITM stream requires CA trust** — users must accept certificate
3. **Buffer data is sensitive** — limited retention, auto-cleanup
4. **Correlation logs contain PII** — follow data protection regulations

## License

GPL-3.0

## Author

SecuBox Team <secubox@gk2.net>
