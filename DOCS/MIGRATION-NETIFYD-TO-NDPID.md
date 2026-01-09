# Migration Plan: Netifyd to nDPId

## Executive Summary

This document provides a comprehensive migration plan to replace **Netifyd v5.2.1** with **nDPId** in the SecuBox OpenWrt project while maintaining full compatibility with existing CrowdSec and Netdata consumers.

**Key Finding**: Both Netifyd and nDPId are built on top of **nDPI** (the underlying DPI library). Netifyd is essentially a feature-rich wrapper around nDPI with cloud integration, while nDPId is a minimalist, high-performance daemon with a microservice architecture.

---

## Current Architecture Analysis

### Netifyd Integration Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| Base Package | `secubox-app-netifyd` | Netifyd v5.2.1 DPI engine |
| LuCI App | `luci-app-secubox-netifyd` | Web UI with real-time monitoring |
| RPCD Backend | `/usr/libexec/rpcd/luci.secubox-netifyd` | 15 read + 9 write RPC methods |
| UCI Config | `/etc/config/secubox-netifyd` | Feature toggles, plugins, sinks |
| Status File | `/var/run/netifyd/status.json` | Summary statistics (NOT flows) |
| Socket | `/var/run/netifyd/netifyd.sock` | JSON streaming interface |
| Collector | `/usr/bin/netifyd-collector` | Periodic stats to `/tmp/netifyd-stats.json` |

### Current Data Consumers

1. **CrowdSec**: NO direct integration exists. Runs independently.
2. **Netdata**: Separate dashboard. Reads system metrics via `/proc`, not DPI data.
3. **LuCI Dashboard**: Primary consumer via RPCD backend.

### Netifyd Output Formats

**Summary Statistics** (`/var/run/netifyd/status.json`):
```json
{
  "flow_count": 150,
  "flows_active": 42,
  "devices": [...],
  "stats": {
    "br-lan": {
      "ip_bytes": 1234567,
      "wire_bytes": 1345678,
      "tcp": 1200,
      "udp": 300,
      "icmp": 50
    }
  },
  "dns_hint_cache": { "cache_size": 500 },
  "uptime": 86400
}
```

**Flow Data** (when sink enabled, not default):
```json
{
  "flow_id": "abc123",
  "src_ip": "192.168.1.100",
  "dst_ip": "8.8.8.8",
  "src_port": 54321,
  "dst_port": 443,
  "protocol": "tcp",
  "application": "google",
  "category": "search_engine",
  "bytes_rx": 1500,
  "bytes_tx": 500,
  "packets_rx": 10,
  "packets_tx": 5
}
```

---

## nDPId Architecture

### Core Components

| Component | Purpose |
|-----------|---------|
| **nDPId** | Traffic capture daemon using libpcap + libnDPI |
| **nDPIsrvd** | Broker that distributes events to multiple consumers |
| **libnDPI** | Core DPI library (shared with Netifyd) |

### nDPId Event System

**Message Format**: `[5-digit-length][JSON]\n`
```
01223{"flow_event_id":7,"flow_event_name":"detection-update",...}\n
```

**Event Categories**:

| Category | Events | Description |
|----------|--------|-------------|
| Error | 17 types | Packet processing failures, memory issues |
| Daemon | 4 types | init, shutdown, reconnect, status |
| Packet | 2 types | packet, packet-flow (base64 encoded) |
| Flow | 9 types | new, end, idle, update, detected, guessed, detection-update, not-detected, analyse |

### nDPId Flow Event Example

```json
{
  "flow_event_id": 5,
  "flow_event_name": "detected",
  "thread_id": 0,
  "packet_id": 12345,
  "source": "eth0",
  "flow_id": 1001,
  "flow_state": "finished",
  "flow_src_packets_processed": 15,
  "flow_dst_packets_processed": 20,
  "flow_first_seen": 1704067200000,
  "flow_src_last_pkt_time": 1704067260000,
  "flow_dst_last_pkt_time": 1704067258000,
  "flow_idle_time": 2000,
  "flow_src_tot_l4_payload_len": 1500,
  "flow_dst_tot_l4_payload_len": 2000,
  "l3_proto": "ip4",
  "src_ip": "192.168.1.100",
  "dst_ip": "142.250.185.78",
  "l4_proto": "tcp",
  "src_port": 54321,
  "dst_port": 443,
  "ndpi": {
    "proto": "TLS.Google",
    "proto_id": 91,
    "proto_by_ip": 0,
    "encrypted": 1,
    "breed": "Safe",
    "category_id": 5,
    "category": "Web"
  }
}
```

---

## Migration Strategy

### Phase 1: Compatibility Layer Development

Create a translation daemon that converts nDPId events to Netifyd-compatible format.

**New Component**: `secubox-ndpid-compat`

```
nDPId → nDPIsrvd → secubox-ndpid-compat → Existing Consumers
                                        ↓
                    /var/run/netifyd/status.json (compatible)
                    /tmp/netifyd-stats.json (compatible)
                    RPCD backend (unchanged)
```

### Phase 2: Package Development

#### 2.1 New Package: `secubox-app-ndpid`

**Makefile**:
```makefile
PKG_NAME:=ndpid
PKG_VERSION:=1.7.0
PKG_RELEASE:=1
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/utoni/nDPId.git

DEPENDS:=+libndpi +libpcap +libjson-c +libpthread
```

**Build Requirements**:
- libnDPI ≥5.0.0
- libpcap
- libjson-c
- CMake build system

#### 2.2 New Package: `secubox-ndpid-compat`

Translation layer script that:
1. Connects to nDPIsrvd socket
2. Aggregates flow events into Netifyd-compatible format
3. Writes to `/var/run/netifyd/status.json`
4. Provides the same RPCD interface

### Phase 3: Output Format Translation

#### 3.1 Status File Translation Map

| Netifyd Field | nDPId Source | Translation Logic |
|---------------|--------------|-------------------|
| `flow_count` | Count of flow events | Increment on `new`, decrement on `end`/`idle` |
| `flows_active` | Active flow tracking | Count flows without `end`/`idle` events |
| `stats.{iface}.tcp` | `l4_proto == "tcp"` | Aggregate per interface |
| `stats.{iface}.udp` | `l4_proto == "udp"` | Aggregate per interface |
| `stats.{iface}.ip_bytes` | `flow_*_tot_l4_payload_len` | Sum per interface |
| `uptime` | Daemon `status` event | Direct mapping |

#### 3.2 Flow Data Translation Map

| Netifyd Field | nDPId Field | Notes |
|---------------|-------------|-------|
| `src_ip` | `src_ip` | Direct |
| `dst_ip` | `dst_ip` | Direct |
| `src_port` | `src_port` | Direct |
| `dst_port` | `dst_port` | Direct |
| `protocol` | `l4_proto` | Lowercase |
| `application` | `ndpi.proto` | Parse from "TLS.Google" → "google" |
| `category` | `ndpi.category` | Direct |
| `bytes_rx` | `flow_dst_tot_l4_payload_len` | Note: reversed (dst=rx from flow perspective) |
| `bytes_tx` | `flow_src_tot_l4_payload_len` | Note: reversed |

#### 3.3 Application Name Normalization

nDPId uses format like `TLS.Google`, `QUIC.YouTube`. Normalize to lowercase base:
```
TLS.Google → google
QUIC.YouTube → youtube
HTTP.Facebook → facebook
DNS → dns
```

### Phase 4: Consumer Compatibility

#### 4.1 CrowdSec Integration (NEW)

Since there's no existing CrowdSec integration, we can design it properly:

**Acquisition Configuration** (`/etc/crowdsec/acquis.d/ndpid.yaml`):
```yaml
source: file
filenames:
  - /tmp/ndpid-flows.log
labels:
  type: ndpid
---
source: journalctl
journalctl_filter:
  - "_SYSTEMD_UNIT=ndpid.service"
labels:
  type: syslog
```

**Parser** (`/etc/crowdsec/parsers/s02-enrich/ndpid-flows.yaml`):
```yaml
name: secubox/ndpid-flows
description: "Parse nDPId flow detection events"
filter: "evt.Parsed.program == 'ndpid'"
onsuccess: next_stage
statics:
  - parsed: flow_application
    expression: evt.Parsed.ndpi_proto
nodes:
  - grok:
      pattern: '%{IP:src_ip}:%{INT:src_port} -> %{IP:dst_ip}:%{INT:dst_port} %{WORD:proto} %{DATA:app}'
```

**Scenario** (`/etc/crowdsec/scenarios/ndpid-suspicious-app.yaml`):
```yaml
type: leaky
name: secubox/ndpid-suspicious-app
description: "Detect suspicious application usage"
filter: evt.Parsed.flow_application in ["bittorrent", "tor", "vpn_udp"]
groupby: evt.Parsed.src_ip
capacity: 5
leakspeed: 10m
blackhole: 1h
labels:
  remediation: true
```

#### 4.2 Netdata Integration (NEW)

Create custom Netdata collector for nDPId:

**Collector** (`/usr/lib/netdata/plugins.d/ndpid.chart.sh`):
```bash
#!/bin/bash
# nDPId Netdata collector

NDPID_STATUS="/var/run/netifyd/status.json"

# Chart definitions
cat << EOF
CHART ndpid.flows '' "Network Flows" "flows" ndpid ndpid.flows area
DIMENSION active '' absolute 1 1
DIMENSION total '' absolute 1 1
EOF

while true; do
    if [ -f "$NDPID_STATUS" ]; then
        active=$(jq -r '.flows_active // 0' "$NDPID_STATUS")
        total=$(jq -r '.flow_count // 0' "$NDPID_STATUS")
        echo "BEGIN ndpid.flows"
        echo "SET active = $active"
        echo "SET total = $total"
        echo "END"
    fi
    sleep 1
done
```

### Phase 5: Plugin System Migration

#### 5.1 IPSet Actions

Netifyd plugins → nDPId external processor:

| Netifyd Plugin | nDPId Equivalent |
|----------------|------------------|
| `libnetify-plugin-ipset.so` | External script consuming flow events |
| `libnetify-plugin-nftables.so` | External nftables updater |

**nDPId Flow Action Script** (`/usr/bin/ndpid-flow-actions`):
```bash
#!/bin/bash
# Process nDPId events and update ipsets

socat -u UNIX-RECV:/tmp/ndpid-actions.sock - | while read -r line; do
    # Parse 5-digit length prefix
    json="${line:5}"

    event=$(echo "$json" | jq -r '.flow_event_name')
    app=$(echo "$json" | jq -r '.ndpi.proto' | tr '.' '\n' | tail -1 | tr '[:upper:]' '[:lower:]')

    case "$event" in
        detected)
            case "$app" in
                bittorrent)
                    src_ip=$(echo "$json" | jq -r '.src_ip')
                    ipset add secubox-bittorrent "$src_ip" timeout 900 2>/dev/null
                    ;;
            esac
            ;;
    esac
done
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

1. [ ] Create `secubox-app-ndpid` package
2. [ ] Build nDPId + nDPIsrvd for OpenWrt
3. [ ] Test basic flow detection
4. [ ] Create UCI configuration schema

### Phase 2: Compatibility Layer (Week 3-4)

1. [ ] Develop `secubox-ndpid-compat` translation daemon
2. [ ] Implement status.json generation
3. [ ] Implement flow event aggregation
4. [ ] Test with existing LuCI dashboard

### Phase 3: RPCD Backend Update (Week 5)

1. [ ] Update RPCD methods to use nDPId data
2. [ ] Ensure all 15 read methods work
3. [ ] Ensure all 9 write methods work
4. [ ] Test LuCI application compatibility

### Phase 4: Consumer Integration (Week 6-7)

1. [ ] Create CrowdSec parser/scenario
2. [ ] Create Netdata collector
3. [ ] Test end-to-end data flow
4. [ ] Document new integrations

### Phase 5: Migration & Cleanup (Week 8)

1. [ ] Create migration script for existing users
2. [ ] Update documentation
3. [ ] Remove Netifyd package (optional, can coexist)
4. [ ] Final testing and release

---

## File Structure After Migration

```
package/secubox/
├── secubox-app-ndpid/              # NEW: nDPId package
│   ├── Makefile
│   ├── files/
│   │   ├── ndpid.config            # UCI config
│   │   ├── ndpid.init              # procd init script
│   │   └── ndpisrvd.init           # nDPIsrvd init
│   └── patches/                    # OpenWrt patches if needed
│
├── secubox-ndpid-compat/           # NEW: Compatibility layer
│   ├── Makefile
│   └── files/
│       ├── ndpid-compat.lua        # Translation daemon
│       ├── ndpid-flow-actions      # IPSet/nftables handler
│       └── ndpid-collector         # Stats aggregator
│
├── luci-app-secubox-netifyd/       # MODIFIED: Works with both
│   └── root/usr/libexec/rpcd/
│       └── luci.secubox-netifyd    # Updated for nDPId compat
│
└── secubox-app-netifyd/            # DEPRECATED: Keep for fallback
```

---

## Configuration Mapping

### UCI Config Translation

**Netifyd** (`/etc/config/secubox-netifyd`):
```
config settings 'settings'
    option enabled '1'
    option socket_type 'unix'

config sink 'sink'
    option enabled '1'
    option type 'unix'
    option unix_path '/tmp/netifyd-flows.json'
```

**nDPId** (`/etc/config/secubox-ndpid`):
```
config ndpid 'main'
    option enabled '1'
    option interfaces 'br-lan br-wan'
    option collector_socket '/tmp/ndpid-collector.sock'

config ndpisrvd 'distributor'
    option enabled '1'
    option listen_socket '/tmp/ndpisrvd.sock'
    option tcp_port '7000'

config compat 'compat'
    option enabled '1'
    option netifyd_status '/var/run/netifyd/status.json'
    option netifyd_socket '/var/run/netifyd/netifyd.sock'
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Detection accuracy differences | Medium | Both use libnDPI; similar results expected |
| Performance regression | Low | nDPId is lighter; should improve performance |
| Plugin compatibility | High | Must reimplement flow actions externally |
| Breaking existing dashboards | High | Compatibility layer ensures same output format |
| Missing Netifyd features | Medium | Document feature gaps; prioritize critical ones |

### Features Comparison

| Feature | Netifyd | nDPId | Migration Impact |
|---------|---------|-------|------------------|
| Protocol detection | Yes | Yes | None |
| Application detection | Yes | Yes | None |
| Flow tracking | Yes | Yes | None |
| JSON output | Yes | Yes | Format translation needed |
| Socket streaming | Yes | Yes | Different format |
| Cloud integration | Yes | No | Feature removed |
| Plugin architecture | Built-in | External | Reimplement |
| Memory footprint | ~50MB | ~15MB | Improvement |
| Startup time | ~5s | ~1s | Improvement |

---

## Testing Plan

### Unit Tests

1. **Translation Accuracy**: Verify nDPId events correctly map to Netifyd format
2. **Statistics Aggregation**: Verify flow counts, bytes, packets match
3. **Application Detection**: Compare detection results between engines

### Integration Tests

1. **LuCI Dashboard**: All views render correctly
2. **RPCD Methods**: All 24 methods return expected data
3. **IPSet Actions**: BitTorrent/streaming detection triggers ipset updates
4. **CrowdSec Parsing**: Flow events parsed and scenarios trigger

### Performance Tests

1. **Throughput**: Measure max flows/second
2. **Memory**: Compare RAM usage under load
3. **CPU**: Compare CPU usage during traffic bursts

---

## Rollback Plan

If migration fails:

1. Stop nDPId services: `/etc/init.d/ndpid stop && /etc/init.d/ndpisrvd stop`
2. Start Netifyd: `/etc/init.d/netifyd start`
3. Compatibility layer auto-detects and switches source
4. No data loss; both can coexist

---

## References

- [nDPId GitHub Repository](https://github.com/utoni/nDPId)
- [nDPI Library](https://github.com/ntop/nDPI)
- [Netifyd Documentation](https://www.netify.ai/documentation/)
- [CrowdSec Acquisition](https://docs.crowdsec.net/docs/data_sources/intro)
- [Netdata External Plugins](https://learn.netdata.cloud/docs/agent/collectors/plugins.d)

---

## Appendix A: nDPId Event Schema Reference

### Flow Event Fields

```json
{
  "flow_event_id": "integer (0-8)",
  "flow_event_name": "string (new|end|idle|update|detected|guessed|detection-update|not-detected|analyse)",
  "thread_id": "integer",
  "packet_id": "integer",
  "source": "string (interface name)",
  "flow_id": "integer",
  "flow_state": "string (skipped|finished|info)",
  "l3_proto": "string (ip4|ip6)",
  "src_ip": "string",
  "dst_ip": "string",
  "l4_proto": "string (tcp|udp|icmp|...)",
  "src_port": "integer",
  "dst_port": "integer",
  "flow_src_packets_processed": "integer",
  "flow_dst_packets_processed": "integer",
  "flow_first_seen": "integer (ms timestamp)",
  "flow_src_tot_l4_payload_len": "integer (bytes)",
  "flow_dst_tot_l4_payload_len": "integer (bytes)",
  "ndpi": {
    "proto": "string (e.g., TLS.Google)",
    "proto_id": "integer",
    "encrypted": "integer (0|1)",
    "breed": "string (Safe|Acceptable|Fun|Unsafe|...)",
    "category_id": "integer",
    "category": "string"
  }
}
```

### Daemon Status Event Fields

```json
{
  "daemon_event_id": 3,
  "daemon_event_name": "status",
  "global_ts_usec": "integer",
  "uptime": "integer (seconds)",
  "packets": "integer",
  "packet_bytes": "integer",
  "flows_active": "integer",
  "flows_idle": "integer",
  "flows_detected": "integer",
  "compressions": "integer",
  "decompressions": "integer"
}
```

---

## Appendix B: Sample Compatibility Layer Code

```lua
#!/usr/bin/env lua
-- secubox-ndpid-compat: nDPId to Netifyd format translator

local socket = require("socket")
local json = require("cjson")

local NDPISRVD_SOCK = "/tmp/ndpisrvd.sock"
local OUTPUT_STATUS = "/var/run/netifyd/status.json"
local UPDATE_INTERVAL = 1

-- State tracking
local state = {
    flows = {},
    flow_count = 0,
    flows_active = 0,
    stats = {},
    devices = {},
    uptime = 0,
    start_time = os.time()
}

-- Process incoming nDPId event
local function process_event(raw)
    -- Strip 5-digit length prefix
    local json_str = raw:sub(6)
    local ok, event = pcall(json.decode, json_str)
    if not ok then return end

    local event_name = event.flow_event_name or event.daemon_event_name

    if event_name == "new" then
        state.flows[event.flow_id] = event
        state.flow_count = state.flow_count + 1
        state.flows_active = state.flows_active + 1

    elseif event_name == "end" or event_name == "idle" then
        state.flows[event.flow_id] = nil
        state.flows_active = state.flows_active - 1

    elseif event_name == "detected" then
        if state.flows[event.flow_id] then
            state.flows[event.flow_id].detected = event.ndpi
        end
        -- Update interface stats
        local iface = event.source or "unknown"
        if not state.stats[iface] then
            state.stats[iface] = {ip_bytes=0, tcp=0, udp=0, icmp=0}
        end
        local proto = event.l4_proto or ""
        if proto == "tcp" then state.stats[iface].tcp = state.stats[iface].tcp + 1 end
        if proto == "udp" then state.stats[iface].udp = state.stats[iface].udp + 1 end
        if proto == "icmp" then state.stats[iface].icmp = state.stats[iface].icmp + 1 end
        local bytes = (event.flow_src_tot_l4_payload_len or 0) + (event.flow_dst_tot_l4_payload_len or 0)
        state.stats[iface].ip_bytes = state.stats[iface].ip_bytes + bytes

    elseif event_name == "status" then
        state.uptime = event.uptime or (os.time() - state.start_time)
    end
end

-- Generate Netifyd-compatible status.json
local function generate_status()
    return json.encode({
        flow_count = state.flow_count,
        flows_active = state.flows_active,
        stats = state.stats,
        devices = state.devices,
        uptime = state.uptime,
        dns_hint_cache = { cache_size = 0 }
    })
end

-- Main loop
local function main()
    -- Create output directory
    os.execute("mkdir -p /var/run/netifyd")

    local sock = socket.unix()
    local ok, err = sock:connect(NDPISRVD_SOCK)
    if not ok then
        print("Failed to connect to nDPIsrvd: " .. (err or "unknown"))
        os.exit(1)
    end

    sock:settimeout(0.1)

    local last_write = 0
    while true do
        local line, err = sock:receive("*l")
        if line then
            process_event(line)
        end

        -- Write status file periodically
        local now = os.time()
        if now - last_write >= UPDATE_INTERVAL then
            local f = io.open(OUTPUT_STATUS, "w")
            if f then
                f:write(generate_status())
                f:close()
            end
            last_write = now
        end
    end
end

main()
```

---

*Document Version: 1.0*
*Created: 2026-01-09*
*Author: Claude Code Assistant*
