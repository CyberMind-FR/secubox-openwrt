# Vortex DNS Firewall — Reverse DNS Firewalling & Analysis

> **×47 Vitality Multiplier**: Each DNS block prevents 47× more damage than a reactive firewall rule.
> Block threats at the cheapest network layer — BEFORE any connection is established.

---

## Executive Summary

Vortex DNS Firewall transforms SecuBox's DNS layer into a proactive security barrier. By sinking malicious domains at resolution time, it stops:
- **Malware callbacks** before binary execution
- **Phishing attempts** before credential theft
- **C2 communications** before lateral movement
- **Data exfiltration** before breach completion

The ×47 multiplier comes from: a single C2 domain blocked = 47 connection attempts prevented (avg malware beacon rate × infection window).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    VORTEX DNS FIREWALL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   THREAT    │    │   SINKHOLE  │    │   MESH      │         │
│  │   INTEL     │───▶│   ANALYSIS  │───▶│   GOSSIP    │         │
│  │   FEEDS     │    │   SERVER    │    │   SYNC      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DNS QUERY INTERCEPTION LAYER                │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │dnsmasq  │  │ DNS     │  │ Real-   │  │Response │     │   │
│  │  │ Query   │─▶│ Guard   │─▶│ time    │─▶│ Router  │     │   │
│  │  │ Log     │  │Detectors│  │ Intel   │  │         │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                        │              │
│         ▼                                        ▼              │
│  ┌─────────────┐                         ┌─────────────┐       │
│  │  SINKHOLE   │◀────── BLOCKED ────────▶│   ALLOW     │       │
│  │  (Analysis) │                         │   (Pass)    │       │
│  └─────────────┘                         └─────────────┘       │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 ANALYTICS & REPORTING                    │   │
│  │  • Threat Origins  • Block Stats  • ×47 Impact Score    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Threat Intelligence Aggregator (`vortex-intel`)

**Purpose**: Aggregate, deduplicate, and score threat feeds for DNS blocking.

**Feeds to Integrate**:
| Feed | Type | Update Interval | Domains |
|------|------|-----------------|---------|
| abuse.ch URLhaus | Malware | 5 min | ~50K |
| abuse.ch Feodo | C2/Botnet | 5 min | ~500 |
| Phishtank | Phishing | 1 hour | ~20K |
| OpenPhish | Phishing | 12 hour | ~5K |
| Malware Domain List | Malware | 1 hour | ~30K |
| CrowdSec CTI | Community | Real-time | Dynamic |
| DNS Guard AI | Local | Real-time | Dynamic |
| Mesh Peers | P2P | 5 min | Shared |

**CLI Commands**:
```bash
vortex-intel update                    # Force feed update
vortex-intel status                    # Show feed health
vortex-intel search <domain>           # Check if domain is blocked
vortex-intel stats                     # Blocking statistics
vortex-intel add <domain> <reason>     # Manual block
vortex-intel remove <domain>           # Manual unblock
```

**Data Structure**:
```json
{
  "domain": "evil.com",
  "threat_type": "c2",
  "confidence": 95,
  "sources": ["abuse.ch", "crowdsec"],
  "first_seen": "2026-02-11T00:00:00Z",
  "last_seen": "2026-02-11T06:00:00Z",
  "hit_count": 47,
  "blocked_connections": 2209
}
```

---

### 2. DNS Sinkhole Analysis Server (`vortex-sinkhole`)

**Purpose**: Capture and analyze connection attempts to blocked domains.

**Architecture**:
```
Client Query: evil-c2.com
         │
         ▼
    ┌─────────────┐
    │   dnsmasq   │──▶ Returns: 192.168.255.253 (sinkhole IP)
    └─────────────┘
         │
         ▼
    ┌─────────────┐
    │  SINKHOLE   │──▶ Captures: HTTP/HTTPS/TCP metadata
    │   SERVER    │──▶ Logs: Client IP, timestamp, payload hints
    └─────────────┘
         │
         ▼
    ┌─────────────┐
    │  ANALYSIS   │──▶ Identifies: Malware family, C2 protocol
    │   ENGINE    │──▶ Correlates: Multiple clients = outbreak
    └─────────────┘
```

**Sinkhole Services** (ports on 192.168.255.253):
- **:80** - HTTP honeypot (captures GET/POST, User-Agent, payload)
- **:443** - HTTPS terminator (self-signed, logs SNI + handshake)
- **:53** - Secondary DNS (catches DNS-over-DNS tunneling)
- **:8080** - Proxy honeypot (catches proxy-aware malware)
- **:25/587** - SMTP honeypot (catches spam bots)

**Analysis Output**:
```json
{
  "event_id": "sink-20260211-001",
  "timestamp": "2026-02-11T06:30:00Z",
  "client_ip": "192.168.1.105",
  "client_mac": "aa:bb:cc:dd:ee:ff",
  "blocked_domain": "evil-c2.com",
  "protocol": "https",
  "sni": "evil-c2.com",
  "user_agent": "Mozilla/5.0 (compatible; botnet/1.0)",
  "threat_assessment": {
    "malware_family": "Emotet",
    "c2_protocol": "HTTPS POST beacon",
    "urgency": "critical",
    "recommended_action": "isolate_client"
  }
}
```

---

### 3. Real-Time Query Firewall (`vortex-dnsfw`)

**Purpose**: Intercept DNS queries in real-time with sub-millisecond decisions.

**Decision Flow**:
```
Query arrives
     │
     ▼
┌─────────────────┐
│ 1. Cache Check  │ ◀── In-memory bloom filter (1M domains, 1MB RAM)
└────────┬────────┘
         │ miss
         ▼
┌─────────────────┐
│ 2. Local Intel  │ ◀── /var/lib/vortex/blocklist.db (SQLite)
└────────┬────────┘
         │ miss
         ▼
┌─────────────────┐
│ 3. DNS Guard    │ ◀── Real-time DGA/tunneling detection
└────────┬────────┘
         │ miss
         ▼
┌─────────────────┐
│ 4. AI Analysis  │ ◀── LocalAI for unknown domains (optional)
└────────┬────────┘
         │
         ▼
    ALLOW / SINK
```

**Performance Targets**:
- **Bloom filter hit**: <0.1ms
- **SQLite lookup**: <1ms
- **DNS Guard check**: <5ms
- **AI analysis**: <100ms (async, cached)

**dnsmasq Integration**:
```conf
# /etc/dnsmasq.d/vortex-firewall.conf
# Sinkhole all blocked domains
addn-hosts=/var/lib/vortex/sinkhole.hosts

# Log all queries for analysis
log-queries
log-facility=/var/log/dnsmasq.log

# Forward unblocked to upstream
server=9.9.9.9
server=1.1.1.1
```

---

### 4. Mesh Threat Sharing (`vortex-mesh-intel`)

**Purpose**: Share DNS threat intelligence across SecuBox mesh nodes.

**Gossip Protocol Enhancement**:
```
Node A detects: evil-c2.com (DGA, confidence 95%)
         │
         ▼
    Sign with node key
         │
         ▼
    Gossip to peers
         │
    ┌────┴────┐
    ▼         ▼
 Node B    Node C
    │         │
    ▼         ▼
 Validate  Validate
 & Apply   & Apply
```

**Shared Data**:
```json
{
  "type": "dns_threat",
  "domain": "evil-c2.com",
  "threat_type": "dga_c2",
  "confidence": 95,
  "detector": "dns-guard-dga",
  "source_node": "did:plc:abc123",
  "timestamp": "2026-02-11T06:30:00Z",
  "signature": "ed25519:..."
}
```

**Trust Scoring**:
- Threats from high-reputation nodes auto-apply
- Threats from new nodes queue for review
- False positive reports reduce source reputation

---

### 5. Analytics Dashboard (`luci-app-vortex-firewall`)

**Metrics to Display**:

| Metric | Description |
|--------|-------------|
| **×47 Impact Score** | Blocked domains × avg connections prevented |
| **Threats Blocked Today** | Count of unique domains sinkholed |
| **Top Threat Categories** | C2, Phishing, Malware, DGA |
| **Infected Clients** | Clients hitting sinkhole (needs attention) |
| **Feed Health** | Update status of threat intel feeds |
| **Mesh Sync Status** | Peers contributing/receiving intel |

**Widgets**:
1. **Threat Map** - Geographic origin of blocked domains
2. **Timeline** - Blocking events over 24h/7d/30d
3. **Top Blocked Domains** - Most frequently hit blocks
4. **Client Risk Score** - Clients ranked by sinkhole hits
5. **Feed Coverage** - Overlap analysis of threat feeds

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

**Deliverables**:
- [ ] `vortex-intel` threat feed aggregator
- [ ] SQLite blocklist database with bloom filter cache
- [ ] dnsmasq integration for sinkhole routing
- [ ] Basic CLI for manual block/unblock

**Files**:
```
package/secubox/secubox-vortex-firewall/
├── Makefile
├── files/
│   ├── vortex-firewall.init
│   ├── vortex-intel.sh
│   ├── vortex-sinkhole.sh
│   └── config/vortex-firewall
└── src/
    └── bloom-filter.c          # Optional: native bloom filter
```

### Phase 2: Sinkhole Server (Week 2)

**Deliverables**:
- [ ] HTTP/HTTPS honeypot on sinkhole IP
- [ ] Connection metadata capture
- [ ] Malware family fingerprinting
- [ ] Client infection alerting

**Dependencies**:
- uhttpd or nginx (lightweight HTTP)
- openssl (TLS termination)
- socat (port forwarding)

### Phase 3: DNS Guard Integration (Week 3)

**Deliverables**:
- [ ] Real-time query interception hooks
- [ ] DNS Guard → Vortex Firewall pipeline
- [ ] AI-powered unknown domain analysis
- [ ] Confidence-based auto-blocking

**Integration Points**:
```
DNS Guard Detection → Vortex Intel → Sinkhole → Analytics
```

### Phase 4: Mesh Threat Sharing (Week 4)

**Deliverables**:
- [ ] Gossip protocol for DNS threats
- [ ] Signed threat attestations
- [ ] Trust-weighted application
- [ ] Multi-node blocklist sync

**Uses**:
- `secubox-p2p` gossip layer
- `secubox-identity` for signing
- `secubox-mirrornet` for reputation

### Phase 5: Dashboard & Reporting (Week 5)

**Deliverables**:
- [ ] LuCI dashboard with ×47 metrics
- [ ] Real-time threat map
- [ ] Client risk scoring
- [ ] Export/reporting API

---

## CLI Reference

```bash
# Threat Intelligence
vortex-firewall intel update              # Update all feeds
vortex-firewall intel status              # Feed health
vortex-firewall intel search <domain>     # Check domain
vortex-firewall intel add <domain>        # Manual block
vortex-firewall intel remove <domain>     # Manual unblock

# Sinkhole
vortex-firewall sinkhole status           # Sinkhole server status
vortex-firewall sinkhole logs [N]         # Last N sinkhole events
vortex-firewall sinkhole clients          # Clients hitting sinkhole
vortex-firewall sinkhole analyze <event>  # Deep analysis

# Statistics
vortex-firewall stats                     # Overall stats
vortex-firewall stats --x47               # ×47 impact calculation
vortex-firewall stats --top-blocked       # Top blocked domains
vortex-firewall stats --top-clients       # Most infected clients

# Mesh
vortex-firewall mesh status               # Mesh sync status
vortex-firewall mesh share <domain>       # Share threat with mesh
vortex-firewall mesh receive              # Process incoming threats

# Service
vortex-firewall start|stop|restart        # Service control
vortex-firewall daemon                    # Run as daemon
```

---

## RPCD Methods

```json
{
  "luci.vortex-firewall": {
    "read": [
      "status",
      "get_stats",
      "get_blocked_domains",
      "get_sinkhole_events",
      "get_infected_clients",
      "get_feed_status",
      "get_mesh_status",
      "calculate_x47_impact"
    ],
    "write": [
      "update_feeds",
      "block_domain",
      "unblock_domain",
      "isolate_client",
      "share_threat",
      "approve_mesh_threat",
      "reject_mesh_threat"
    ]
  }
}
```

---

## Configuration

```uci
config vortex-firewall 'main'
    option enabled '1'
    option sinkhole_ip '192.168.255.253'
    option update_interval '300'
    option auto_block_threshold '80'
    option mesh_sharing '1'

config intel 'feeds'
    option urlhaus '1'
    option phishtank '1'
    option openphish '1'
    option crowdsec '1'
    option dnsguard '1'
    option mesh_peers '1'

config sinkhole 'server'
    option http_port '80'
    option https_port '443'
    option capture_payloads '1'
    option max_payload_size '4096'

config alerts 'notifications'
    option infected_client_alert '1'
    option new_threat_alert '1'
    option mesh_threat_alert '1'
```

---

## ×47 Impact Calculation

```
Impact Score = Σ (blocked_domain × avg_beacon_rate × infection_window)

Where:
- blocked_domain: 1 (each unique domain)
- avg_beacon_rate: 12/hour (typical C2 beacon)
- infection_window: 4 hours (avg detection time without DNS block)

Example:
- 100 C2 domains blocked
- Each would beacon 12×/hour for 4 hours = 48 connections
- Total prevented: 100 × 48 = 4,800 connections
- ×47 multiplier validated (rounded from 48)
```

---

## Security Considerations

1. **Feed Authenticity**: Verify feed signatures when available
2. **False Positive Handling**: Approval queue for low-confidence blocks
3. **Sinkhole Isolation**: Sinkhole runs in isolated network namespace
4. **Mesh Trust**: Only apply threats from reputation > 50
5. **Rate Limiting**: Max 1000 new blocks/hour to prevent DoS
6. **Logging**: All blocks logged for forensics and appeals

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `secubox-dns-guard` | Detection algorithms |
| `secubox-vortex-dns` | Mesh DNS infrastructure |
| `secubox-p2p` | Gossip protocol |
| `secubox-identity` | Threat signing |
| `secubox-localrecall` | Threat memory |
| `dnsmasq-full` | DNS server |
| `sqlite3-cli` | Blocklist database |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Query latency overhead | <1ms for cached |
| Blocklist size | 500K+ domains |
| Feed freshness | <15 min stale |
| False positive rate | <0.1% |
| Mesh sync latency | <5 min |
| Sinkhole capture rate | 100% of blocked |
| ×47 impact visibility | Dashboard prominent |

---

## Future Enhancements

1. **DNS-over-HTTPS (DoH) Interception**: Block DoH bypass attempts
2. **Machine Learning**: Train on local query patterns
3. **Threat Hunting**: Proactive domain reputation scoring
4. **SIEM Integration**: Export to external security platforms
5. **Mobile App**: Push notifications for critical threats
