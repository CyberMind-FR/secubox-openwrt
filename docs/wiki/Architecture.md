# SecuBox Architecture

SecuBox is built on a 4-layer architecture designed for privacy, security, and decentralization.

---

## The 4 Layers (Les 4 Couches)

```
+--------------------------------------------------+
|            Layer 4: Roadmap & Governance         |
|         Version milestones, certifications       |
+--------------------------------------------------+
|            Layer 3: MirrorNetworking             |
|      P2P gossip, mesh orchestration, CDN         |
+--------------------------------------------------+
|            Layer 2: AI Gateway                   |
|    Data sovereignty, local inference, routing    |
+--------------------------------------------------+
|            Layer 1: Core Mesh                    |
|     OpenWrt, WireGuard, CrowdSec, HAProxy        |
+--------------------------------------------------+
```

---

## Layer 1: Core Mesh

The foundation layer running on OpenWrt 24.10.

### Components

| Component | Purpose |
|-----------|---------|
| **OpenWrt** | Base operating system |
| **WireGuard** | VPN tunnels for mesh |
| **CrowdSec** | IDS/IPS with threat intel |
| **HAProxy** | Reverse proxy, SSL termination |
| **mitmproxy** | WAF, TLS inspection |
| **dnsmasq** | DNS and DHCP |
| **LXC** | Container runtime |

### Mesh Daemon (`secuboxd`)

The mesh daemon handles:
- Peer discovery via mDNS (`_secubox._udp.local`)
- Topology management
- Gate election (weighted scoring)
- Cross-node telemetry

```
secubox-mesh/
├── secuboxd          # Main daemon
├── secuboxctl        # CLI interface
└── lib/
    ├── topology.sh   # Topology management
    ├── discovery.sh  # Peer discovery
    ├── election.sh   # Gate election
    └── telemetry.sh  # Metrics collection
```

---

## Layer 2: AI Gateway

Data sovereignty engine for AI operations.

### Data Classification

| Tier | Description | Destination |
|------|-------------|-------------|
| **LOCAL_ONLY** | Raw network data, IPs, MACs | Never leaves device |
| **SANITIZED** | Anonymized patterns | Mistral EU (opt-in) |
| **CLOUD_DIRECT** | Generic queries | Claude/GPT (opt-in) |

### Provider Routing

Priority order for AI requests:
1. LocalAI (local inference)
2. Mistral (EU sovereign)
3. Claude
4. OpenAI GPT
5. Gemini
6. xAI

### AI Agents

| Agent | Function |
|-------|----------|
| Threat Analyst | CrowdSec alert analysis |
| DNS Guard | DNS anomaly detection |
| CVE Triage | Vulnerability prioritization |
| Network Anomaly | Traffic pattern analysis |
| Config Advisor | ANSSI compliance |

---

## Layer 3: MirrorNetworking

Decentralized mesh orchestration.

### Dual Transport

| Tier | Protocol | Purpose |
|------|----------|---------|
| Tier 1 | WireGuard | Known peers, trusted mesh |
| Tier 2 | Yggdrasil | Discovery, extended mesh |

### Gossip Protocol

Services synchronized across the mesh:
- **Threat Intel**: IoC signed gossip
- **Service Registry**: Published services
- **Configuration**: Distributed config sync
- **AI Inference**: Distributed model queries

### Punk Exposure Model

Three-verb service exposure:

1. **Peek**: Discover and scan services
2. **Poke**: Configure exposure channels
3. **Emancipate**: Activate exposure

Channels:
- **Tor**: `.onion` hidden services
- **DNS/SSL**: HTTPS via HAProxy + ACME
- **Mesh**: P2P service registry

---

## Layer 4: Roadmap

Version governance and certifications.

### Milestones

| Version | Status | Features |
|---------|--------|----------|
| v0.18 | Done | MirrorBox Core |
| v0.19 | Done | AI Expansion |
| v1.0 | Done | Full Stack |
| v1.1 | Done | Extended Mesh |

### Target Certifications

- **ANSSI CSPN**: French security certification
- **CE**: European conformity
- **GDPR**: Data protection compliance
- **NIS2**: Network security directive

---

## Network Architecture

```
Internet
    │
    ▼
┌──────────────┐
│   HAProxy    │ ◄── SSL termination, routing
│  (LXC)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  mitmproxy   │ ◄── WAF, TLS inspection
│  (LXC)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   CrowdSec   │ ◄── IDS/IPS
│  (host)      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Services    │ ◄── Jellyfin, Nextcloud, etc.
│  (LXC)       │
└──────────────┘
```

---

## Directory Structure

```
package/secubox/
├── secubox-core/           # Base utilities
├── secubox-mesh/           # Mesh daemon
├── secubox-p2p/            # P2P protocol
├── secubox-identity/       # DID/trust
├── secubox-ai-gateway/     # AI routing
├── luci-app-*/             # LuCI modules (80+)
├── luci-theme-secubox/     # CRT P31 theme
└── secubox-app-*/          # Service packages
```

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `/etc/config/secubox` | Main SecuBox config |
| `/etc/config/secubox-mesh` | Mesh settings |
| `/etc/config/wireguard_*` | VPN tunnels |
| `/etc/config/crowdsec` | IDS/IPS config |
| `/etc/config/haproxy` | Reverse proxy |

---

See also:
- [Module Implementation Guide](Module-Implementation.md)
- [API Reference](API.md)
- [Development Guidelines](Development.md)

---

*SecuBox v1.0.0*
