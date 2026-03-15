# Dual-Stream DPI Architecture

_SecuBox Deep Packet Inspection with Parallel MITM and Passive Analysis_

## Overview

Dual-stream architecture separates traffic inspection into two parallel paths:
1. **MITM Stream** — Active inspection with SSL termination, WAF, content modification
2. **TAP Stream** — Passive mirroring with nDPI classification, zero latency impact

```
                         ┌─────────────────────────────────────────────┐
                         │              INTERNET                       │
                         └─────────────────┬───────────────────────────┘
                                           │
                         ┌─────────────────▼───────────────────────────┐
                         │            WAN INTERFACE                    │
                         │              (eth0)                         │
                         └─────────────────┬───────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            │
    ┌─────────────────────┐    ┌─────────────────────┐                  │
    │   STREAM 1: MITM    │    │  STREAM 2: TAP/DPI  │                  │
    │   (Active Path)     │    │  (Passive Mirror)   │                  │
    └─────────┬───────────┘    └─────────┬───────────┘                  │
              │                          │                              │
              ▼                          ▼                              │
    ┌─────────────────────┐    ┌─────────────────────┐                  │
    │     HAProxy         │    │   tc mirred/TAP     │                  │
    │  (SSL Termination)  │    │  (Port Mirroring)   │                  │
    └─────────┬───────────┘    └─────────┬───────────┘                  │
              │                          │                              │
              ▼                          ▼                              │
    ┌─────────────────────┐    ┌─────────────────────┐                  │
    │    mitmproxy        │    │     netifyd         │                  │
    │  (WAF + Analysis)   │    │   (nDPI Engine)     │                  │
    └─────────┬───────────┘    └─────────┬───────────┘                  │
              │                          │                              │
              ▼                          ▼                              │
    ┌─────────────────────┐    ┌─────────────────────┐                  │
    │   Double Buffer     │    │   Flow Collector    │                  │
    │ (Replay Analysis)   │    │  (Real-time Stats)  │                  │
    └─────────┬───────────┘    └─────────┬───────────┘                  │
              │                          │                              │
              └──────────────┬───────────┘                              │
                             │                                          │
                             ▼                                          │
              ┌─────────────────────────────────────┐                   │
              │        CORRELATION ENGINE           │                   │
              │  (Match MITM events + DPI flows)    │                   │
              └─────────────────────────────────────┘                   │
                             │                                          │
                             ▼                                          │
              ┌─────────────────────────────────────┐                   │
              │      UNIFIED THREAT ANALYTICS       │                   │
              │   (CrowdSec + Threat Scorecard)     │                   │
              └─────────────────────────────────────┘                   │
```

---

## Stream 1: MITM (Active Inspection)

### Purpose
- Full content inspection with SSL/TLS termination
- WAF rule enforcement (block malicious requests)
- Request/response modification capability
- Double-buffered replay for forensic analysis

### Components

| Component | Role | Package |
|-----------|------|---------|
| HAProxy | SSL termination, routing | `secubox-app-haproxy` |
| mitmproxy | HTTP inspection, WAF addon | `secubox-app-mitmproxy` |
| CrowdSec | Threat detection, banning | `crowdsec` |
| Double Buffer | Replay analysis queue | NEW: `secubox-dpi-buffer` |

### Double Buffer Implementation

```
┌──────────────────────────────────────────────────────────────┐
│                    DOUBLE BUFFER FLOW                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   REQUEST ──▶ [BUFFER A] ──▶ LIVE FORWARD ──▶ BACKEND        │
│                    │                                          │
│                    ▼                                          │
│              [BUFFER B] ──▶ ASYNC ANALYSIS                   │
│                    │                                          │
│                    ├──▶ Pattern matching                      │
│                    ├──▶ ML anomaly detection                  │
│                    ├──▶ Replay attack simulation              │
│                    └──▶ Forensic logging                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Buffer Strategy:**
- Buffer A: Live path, minimal latency, basic WAF rules
- Buffer B: Copy for deep analysis, async processing
- Ring buffer with configurable retention (default: 1000 requests)
- Triggered replay on CrowdSec alert for context gathering

### mitmproxy Addon: `dpi_buffer.py`

```python
# /srv/mitmproxy/addons/dpi_buffer.py
import json
import asyncio
from collections import deque
from mitmproxy import http, ctx

class DPIBuffer:
    def __init__(self):
        self.buffer = deque(maxlen=1000)
        self.analysis_queue = asyncio.Queue()

    def request(self, flow: http.HTTPFlow):
        # Buffer A: forward immediately (default mitmproxy behavior)

        # Buffer B: queue for async analysis
        entry = {
            "ts": flow.request.timestamp_start,
            "method": flow.request.method,
            "host": flow.request.host,
            "path": flow.request.path,
            "headers": dict(flow.request.headers),
            "content_hash": hash(flow.request.content) if flow.request.content else None,
            "client_ip": flow.client_conn.peername[0],
        }
        self.buffer.append(entry)
        asyncio.create_task(self.async_analyze(entry))

    async def async_analyze(self, entry):
        # Deep analysis without blocking live traffic
        # - Pattern matching against threat signatures
        # - Anomaly scoring
        # - Write to /tmp/dpi-buffer/analysis.jsonl
        pass

    def get_context(self, client_ip, window_sec=60):
        """Get recent requests from same IP for context on alert"""
        import time
        now = time.time()
        return [e for e in self.buffer
                if e["client_ip"] == client_ip
                and now - e["ts"] < window_sec]

addons = [DPIBuffer()]
```

---

## Stream 2: TAP/Mirror (Passive DPI)

### Purpose
- Real-time traffic classification without MITM
- Zero latency impact on live traffic
- Protocol identification (nDPI: 300+ protocols)
- Flow statistics and bandwidth analysis
- Works with encrypted traffic (metadata analysis)

### Components

| Component | Role | Package |
|-----------|------|---------|
| tc mirred | Port mirroring | kernel/iproute2 |
| netifyd | nDPI flow analysis | `netifyd` |
| Flow Collector | Stats aggregation | `secubox-app-netifyd` |
| InfluxDB/Prometheus | Time-series storage | optional |

### Port Mirroring Setup

**Option A: Software TAP (tc mirred)**
```bash
# Mirror all WAN traffic to virtual interface for analysis
ip link add name tap0 type dummy
ip link set tap0 up

# Mirror ingress + egress from eth0 to tap0
tc qdisc add dev eth0 handle ffff: ingress
tc filter add dev eth0 parent ffff: protocol all u32 match u32 0 0 \
    action mirred egress mirror dev tap0

tc qdisc add dev eth0 handle 1: root prio
tc filter add dev eth0 parent 1: protocol all u32 match u32 0 0 \
    action mirred egress mirror dev tap0
```

**Option B: Hardware TAP/Port Mirror**
- Configure switch to mirror WAN port to dedicated analysis port
- Connect analysis port to SecuBox secondary NIC

### netifyd Configuration

```
# /etc/netifyd.conf additions
[capture]
; Capture on mirror interface only (passive)
interfaces = tap0

[flow]
; Enable detailed flow export
export_json = yes
export_path = /tmp/netifyd-flows/

[dpi]
; Full protocol detection
enable_ndpi = yes
ndpi_max_packets = 32
```

### Flow Collector Service

```bash
#!/bin/sh
# /usr/sbin/dpi-flow-collector

FLOW_DIR="/tmp/netifyd-flows"
STATS_FILE="/tmp/secubox/dpi-flows.json"

while true; do
    # Aggregate flow stats
    total_flows=$(find "$FLOW_DIR" -name "*.json" -mmin -1 | wc -l)

    # Protocol distribution
    protocols=$(cat "$FLOW_DIR"/*.json 2>/dev/null | \
        jsonfilter -e '@.detected_protocol' | sort | uniq -c | \
        awk '{print "\""$2"\":"$1}' | paste -sd,)

    # Top talkers
    top_ips=$(cat "$FLOW_DIR"/*.json 2>/dev/null | \
        jsonfilter -e '@.local_ip' | sort | uniq -c | sort -rn | head -5)

    cat > "$STATS_FILE" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "flows_1min": $total_flows,
    "protocols": {$protocols},
    "mode": "passive_tap"
}
EOF

    # Cleanup old flows
    find "$FLOW_DIR" -name "*.json" -mmin +5 -delete

    sleep 10
done
```

---

## Correlation Engine

### Purpose
Match events from both streams to build unified threat picture:
- MITM WAF block → find corresponding nDPI flow
- nDPI suspicious protocol → check MITM logs for content
- Build IP reputation from both streams

### Implementation

```bash
#!/bin/sh
# /usr/sbin/dpi-correlator

MITM_LOG="/var/log/mitmproxy/access.log"
DPI_FLOWS="/tmp/netifyd-flows"
CORRELATED="/tmp/secubox/correlated-threats.json"

correlate_threat() {
    local ip="$1"
    local timestamp="$2"

    # Get MITM context (requests from this IP)
    mitm_context=$(grep "$ip" "$MITM_LOG" | tail -10 | jq -Rs .)

    # Get DPI flow info
    dpi_context=$(find "$DPI_FLOWS" -name "*.json" -exec grep -l "$ip" {} \; | \
        head -5 | xargs cat 2>/dev/null | jq -s .)

    echo "{\"ip\":\"$ip\",\"ts\":\"$timestamp\",\"mitm\":$mitm_context,\"dpi\":$dpi_context}"
}

# Watch for CrowdSec decisions and correlate
inotifywait -m /var/lib/crowdsec/data -e create -e modify | while read path action file; do
    if [ "$file" = "crowdsec.db" ]; then
        # New decision - get recent banned IPs
        cscli decisions list -o json | jq -r '.[]|.value' | while read ip; do
            correlate_threat "$ip" "$(date -Iseconds)" >> "$CORRELATED"
        done
    fi
done
```

---

## New Package: `secubox-dpi-dual`

### Package Structure

```
secubox-dpi-dual/
├── Makefile
├── files/
│   ├── etc/
│   │   ├── config/dpi-dual           # UCI config
│   │   └── init.d/dpi-dual           # procd service
│   ├── usr/
│   │   ├── sbin/
│   │   │   ├── dpi-dualctl           # CLI tool
│   │   │   ├── dpi-flow-collector    # Flow aggregator
│   │   │   └── dpi-correlator        # Event correlation
│   │   └── lib/
│   │       └── dpi-dual/
│   │           └── mirror-setup.sh   # tc mirred setup
│   └── srv/
│       └── mitmproxy/
│           └── addons/
│               └── dpi_buffer.py     # Double buffer addon
└── README.md
```

### UCI Configuration

```
# /etc/config/dpi-dual

config global 'settings'
    option enabled '1'
    option mode 'dual'                 # dual|mitm-only|tap-only
    option correlation '1'

config mitm 'mitm'
    option enabled '1'
    option buffer_size '1000'          # requests in double buffer
    option async_analysis '1'
    option replay_on_alert '1'

config tap 'tap'
    option enabled '1'
    option interface 'tap0'
    option mirror_source 'eth0'
    option mirror_mode 'software'      # software|hardware
    option flow_retention '300'        # seconds

config correlation 'correlation'
    option enabled '1'
    option window '60'                 # seconds to look back
    option output '/tmp/secubox/correlated-threats.json'
```

### CLI: `dpi-dualctl`

```bash
#!/bin/sh
# /usr/sbin/dpi-dualctl

case "$1" in
    start)
        /usr/lib/dpi-dual/mirror-setup.sh start
        /etc/init.d/netifyd restart
        /usr/sbin/dpi-flow-collector &
        /usr/sbin/dpi-correlator &
        ;;
    stop)
        /usr/lib/dpi-dual/mirror-setup.sh stop
        killall dpi-flow-collector dpi-correlator 2>/dev/null
        ;;
    status)
        echo "=== MITM Stream ==="
        pgrep -a mitmproxy | head -1
        echo "Buffer entries: $(wc -l < /tmp/dpi-buffer/entries.jsonl 2>/dev/null || echo 0)"
        echo
        echo "=== TAP Stream ==="
        pgrep -a netifyd | head -1
        echo "Flows (1min): $(cat /tmp/secubox/dpi-flows.json | jsonfilter -e '@.flows_1min' 2>/dev/null || echo 0)"
        echo
        echo "=== Correlation ==="
        echo "Threats correlated: $(wc -l < /tmp/secubox/correlated-threats.json 2>/dev/null || echo 0)"
        ;;
    flows)
        cat /tmp/secubox/dpi-flows.json | jq .
        ;;
    threats)
        tail -20 /tmp/secubox/correlated-threats.json | jq .
        ;;
    *)
        echo "Usage: $0 {start|stop|status|flows|threats}"
        ;;
esac
```

---

## Integration Points

### 1. CrowdSec Integration
- MITM WAF blocks → CrowdSec alerts
- Correlation engine enriches alerts with DPI flow data
- Unified ban decisions from both streams

### 2. LuCI Dashboard
- Dual-stream status widget
- MITM vs TAP traffic comparison
- Protocol distribution chart from nDPI
- Correlated threat timeline

### 3. Streamlit Control Panel
- Add DPI stream status to `secubox_control.py`
- Show buffer utilization
- Protocol pie chart
- Real-time flow counter

### 4. API Endpoints
```
GET /api/dpi/status          # Both streams status
GET /api/dpi/mitm/buffer     # Buffer contents
GET /api/dpi/tap/flows       # Recent flows
GET /api/dpi/correlated      # Correlated threats
POST /api/dpi/replay/{ip}    # Trigger replay analysis
```

---

## Implementation Phases

### Phase 1: TAP Stream (1-2 days)
- [ ] tc mirred setup script
- [ ] netifyd configuration for tap interface
- [ ] Flow collector service
- [ ] Basic stats in `/tmp/secubox/dpi-flows.json`

### Phase 2: MITM Double Buffer (2-3 days)
- [ ] mitmproxy addon `dpi_buffer.py`
- [ ] Async analysis pipeline
- [ ] Request replay capability
- [ ] Buffer stats endpoint

### Phase 3: Correlation Engine (1-2 days)
- [ ] Event matching logic
- [ ] CrowdSec integration
- [ ] Correlated threat output
- [ ] Context enrichment

### Phase 4: Integration (1-2 days)
- [ ] LuCI widgets
- [ ] Streamlit dashboard updates
- [ ] RPCD methods
- [ ] Documentation

---

## Performance Considerations

| Aspect | MITM Stream | TAP Stream |
|--------|-------------|------------|
| Latency | +5-20ms | 0ms |
| CPU | High (SSL, WAF) | Low (nDPI) |
| Memory | Buffer dependent | Minimal |
| Storage | Logs + buffer | Flow stats |
| Visibility | Full content | Metadata only |

**Recommended Hardware:**
- Dual-core minimum for parallel processing
- 2GB+ RAM for double buffer
- Dedicated NIC for TAP if high throughput

---

## Security Notes

1. **TAP stream is read-only** — cannot block, only observe
2. **MITM stream requires trust** — users must accept CA certificate
3. **Buffer data is sensitive** — encrypt at rest, limit retention
4. **Correlation logs contain PII** — follow data protection regulations

---

_Last updated: 2026-03-15_
_Author: SecuBox Architecture Team_
