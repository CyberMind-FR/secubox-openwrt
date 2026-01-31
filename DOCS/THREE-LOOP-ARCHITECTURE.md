# SecuBox Three-Loop Security Architecture

**Version:** 0.17.0 — First Public Release  
**Author:** Gérald Kerma (Gandalf) — CyberMind.FR  
**Date:** January 2026

---

## Executive Summary

SecuBox implements a **Three-Loop Security Model** that separates security operations into three distinct but interconnected feedback loops. Each loop operates at a different timescale and serves complementary functions, providing defense in depth from millisecond-level packet filtering to strategic threat intelligence evolution.

---

## The Three-Loop Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THREE-LOOP SECURITY ARCHITECTURE                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LOOP 3: STRATEGIC                               │   │
│  │            (Hours → Days → Weeks)                                   │   │
│  │                                                                     │   │
│  │   ┌──────────────────────────────────────────────────────────┐     │   │
│  │   │                 LOOP 2: TACTICAL                         │     │   │
│  │   │            (Minutes → Hours)                             │     │   │
│  │   │                                                          │     │   │
│  │   │   ┌─────────────────────────────────────────────────┐   │     │   │
│  │   │   │            LOOP 1: OPERATIONAL                  │   │     │   │
│  │   │   │         (Milliseconds → Seconds)                │   │     │   │
│  │   │   │                                                 │   │     │   │
│  │   │   │    DETECT → DECIDE → RESPOND → LEARN           │   │     │   │
│  │   │   │                                                 │   │     │   │
│  │   │   └─────────────────────────────────────────────────┘   │     │   │
│  │   │                                                          │     │   │
│  │   │   CORRELATE → ANALYZE → ADAPT → REFINE                  │     │   │
│  │   │                                                          │     │   │
│  │   └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │   AGGREGATE → TREND → PREDICT → EVOLVE                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Loop 1: Operational (Real-Time Response)

**Timescale:** Milliseconds to seconds  
**Function:** Immediate threat detection and automated response  
**Goal:** Stop attacks before damage occurs

### SecuBox Implementation

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECUBOX LOOP 1 — OPERATIONAL                    │
│                                                                     │
│  INGRESS                                                            │
│     │                                                               │
│     ▼                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   nftables   │───▶│   netifyd    │───▶│  CrowdSec    │          │
│  │   fw4 rules  │    │     DPI      │    │   Bouncer    │          │
│  │   BPF/XDP    │    │  (L7 proto)  │    │  (nft sets)  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                    DECISION ENGINE                      │        │
│  │  • Stateful connection tracking                         │        │
│  │  • Protocol anomaly detection                           │        │
│  │  • Reputation-based filtering                           │        │
│  │  • Rate limiting & connection caps                      │        │
│  └────────────────────────────────────────────────────────┘        │
│         │                                                           │
│         ▼                                                           │
│  ALLOW / BLOCK / RATE-LIMIT / REDIRECT                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Module | Function |
|-----------|--------|----------|
| **nftables/fw4** | OpenWrt core | Packet filtering at wire speed |
| **netifyd** | `luci-app-secubox-netifyd` | Layer 7 protocol identification |
| **nDPId** | `luci-app-ndpid` | Deep packet inspection (300+ protocols) |
| **CrowdSec Bouncer** | `luci-app-crowdsec-dashboard` | Real-time blocking enforcement |

### Performance Metrics

| Metric | Target | v0.17 Status |
|--------|--------|--------------|
| Packet decision latency | < 1ms | ✅ Achieved |
| DPI classification time | < 10ms | ✅ Achieved |
| Bouncer update propagation | < 1s | ✅ Achieved |
| Memory footprint | < 64MB | ✅ ~45MB typical |

---

## Loop 2: Tactical (Correlation & Adaptation)

**Timescale:** Minutes to hours  
**Function:** Pattern correlation, behavioral analysis, rule refinement  
**Goal:** Improve detection accuracy and reduce false positives

### SecuBox Implementation

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECUBOX LOOP 2 — TACTICAL                       │
│                                                                     │
│  FROM LOOP 1                                                        │
│     │                                                               │
│     ▼                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   CrowdSec   │───▶│    LAPI      │───▶│  Scenarios   │          │
│  │    Agent     │    │  (local)     │    │  & Parsers   │          │
│  │   (logs)     │    │              │    │              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         │                   ▼                   │                   │
│         │           ┌──────────────┐            │                   │
│         │           │   Netdata    │            │                   │
│         │           │   Metrics    │            │                   │
│         │           │   & Alerts   │            │                   │
│         │           └──────────────┘            │                   │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                 CORRELATION ENGINE                      │        │
│  │  • Multi-source event correlation                       │        │
│  │  • Behavioral baseline deviation                        │        │
│  │  • Attack chain identification                          │        │
│  │  • False positive reduction                             │        │
│  └────────────────────────────────────────────────────────┘        │
│         │                                                           │
│         ▼                                                           │
│  DECISIONS → Loop 1 | ALERTS → Operator | INTEL → Loop 3           │
└─────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Module | Function |
|-----------|--------|----------|
| **CrowdSec Agent** | `luci-app-crowdsec-dashboard` | Log parsing and event generation |
| **CrowdSec LAPI** | `luci-app-crowdsec-dashboard` | Local decision engine |
| **Scenarios** | Custom + community | Attack pattern definitions |
| **Netdata** | `luci-app-netdata-dashboard` | Metrics and anomaly detection |

### Scenario Examples

| Scenario | Trigger | Action |
|----------|---------|--------|
| SSH brute force | 5 failures in 30s | Ban 4h |
| Port scan | 20 ports in 10s | Ban 24h |
| HTTP scanner | Known patterns | Ban 1h |
| DPI anomaly | Protocol mismatch | Alert + investigate |

### Feedback to Loop 1

| Tactical Output | Loop 1 Action |
|-----------------|---------------|
| New IP ban decision | Bouncer updates nft set |
| Protocol anomaly pattern | DPI rule enhancement |
| False positive identified | Whitelist/exception rule |
| Attack signature | Parser/scenario update |

---

## Loop 3: Strategic (Intelligence & Evolution)

**Timescale:** Hours to weeks  
**Function:** Threat intelligence, trend analysis, architecture evolution  
**Goal:** Anticipate threats and continuously improve security posture

### SecuBox Implementation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECUBOX LOOP 3 — STRATEGIC                       │
│                                                                     │
│  FROM LOOP 2                                                        │
│     │                                                               │
│     ▼                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   CrowdSec   │───▶│   Central    │───▶│  Community   │          │
│  │    CAPI      │    │     API      │    │  Blocklists  │          │
│  │   (upload)   │    │              │    │              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         │                   ▼                   │                   │
│         │           ┌──────────────┐            │                   │
│         │           │   P2P Hub    │◀───────────┘                   │
│         │           │  (v0.18+)    │                                │
│         │           └──────────────┘                                │
│         │                   │                                       │
│         ▼                   ▼                                       │
│  ┌────────────────────────────────────────────────────────┐        │
│  │               INTELLIGENCE ENGINE                       │        │
│  │  • Global threat landscape aggregation                  │        │
│  │  • Emerging threat early warning                        │        │
│  │  • Reputation scoring evolution                         │        │
│  │  • Architecture & policy recommendations                │        │
│  └────────────────────────────────────────────────────────┘        │
│         │                                                           │
│         ▼                                                           │
│  BLOCKLISTS → Loop 2 | POLICIES → Loop 1 | EVOLUTION → Next Release│
└─────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Module | Function |
|-----------|--------|----------|
| **CrowdSec CAPI** | `luci-app-crowdsec-dashboard` | Community intelligence exchange |
| **Blocklists** | Managed via CAPI | IP/domain reputation |
| **P2P Hub** | Planned v0.18+ | Decentralized intelligence sharing |

---

## P2P Hub: Evolving Loop 3 (v0.18+)

### Vision

The P2P Hub will enable **decentralized threat intelligence sharing** between SecuBox nodes without dependency on central services.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    P2P HUB ARCHITECTURE (v0.18+)                    │
│                                                                     │
│                         ┌───────────────┐                           │
│                         │   SecuBox A   │                           │
│                         │   (did:plc)   │                           │
│                         └───────┬───────┘                           │
│                                 │                                   │
│                    ┌────────────┼────────────┐                      │
│                    │            │            │                      │
│            ┌───────▼───────┐    │    ┌───────▼───────┐              │
│            │   SecuBox B   │    │    │   SecuBox C   │              │
│            │   (did:plc)   │    │    │   (did:plc)   │              │
│            └───────┬───────┘    │    └───────┬───────┘              │
│                    │            │            │                      │
│                    └────────────┼────────────┘                      │
│                                 │                                   │
│                         ┌───────▼───────┐                           │
│                         │   SecuBox D   │                           │
│                         │   (did:plc)   │                           │
│                         └───────────────┘                           │
│                                                                     │
│  TRANSPORT: WireGuard mesh (encrypted, authenticated)               │
│  IDENTITY: did:plc (key-rotatable, self-sovereign)                  │
│  PROTOCOL: Signed intelligence sharing via P2P gossip              │
└─────────────────────────────────────────────────────────────────────┘
```

### did:plc Identity Model

Inspired by ATProto/Bluesky, each SecuBox node will have a decentralized identifier:

| Layer | Function | Control |
|-------|----------|---------|
| **DID** | Permanent cryptographic identifier | Mathematical (irrevocable) |
| **Rotation keys** | Recovery from compromise | Human operator |
| **Signing keys** | Day-to-day operations | SecuBox node |

**Benefits:**
- Node identity survives key compromise (rotate without losing reputation)
- Trust relationships persist across key updates
- No central authority for identity management
- Interoperable with ATProto ecosystem

### Trust Model

| Trust Level | Source | Loop Integration |
|-------------|--------|------------------|
| **High** | Direct peers, long history | Loop 1 (immediate blocking) |
| **Medium** | Transitive trust, verified signatures | Loop 2 (correlation input) |
| **Low** | New nodes, unverified | Loop 3 only (review) |

---

## Integration Matrix

### Current State (v0.17)

| Loop | Component | Module | Status |
|------|-----------|--------|--------|
| 1 | nftables/fw4 | OpenWrt core | ✅ Complete |
| 1 | netifyd DPI | `luci-app-secubox-netifyd` | ✅ Complete |
| 1 | nDPId DPI | `luci-app-ndpid` | ✅ Complete |
| 1 | CrowdSec Bouncer | `luci-app-crowdsec-dashboard` | ✅ Complete |
| 2 | CrowdSec Agent | `luci-app-crowdsec-dashboard` | ✅ Complete |
| 2 | CrowdSec LAPI | `luci-app-crowdsec-dashboard` | ✅ Complete |
| 2 | Netdata | `luci-app-netdata-dashboard` | ✅ Complete |
| 2 | Custom Scenarios | `luci-app-secubox-security-threats` | ⚡ Partial |
| 3 | CrowdSec CAPI | `luci-app-crowdsec-dashboard` | ✅ Complete |
| 3 | Blocklists | Managed via CAPI | ✅ Complete |
| 3 | P2P Hub | Planned | 🔵 v0.18+ |

### Roadmap

| Phase | Version | Loop Focus | Status |
|-------|---------|------------|--------|
| Core Mesh | v0.17 | Loops 1+2 complete | ✅ Released |
| Service Mesh | v0.18 | Loop 3 P2P foundation | 🔵 Next |
| Intelligence Mesh | v0.19 | Full P2P intelligence | ⚪ Planned |
| AI Mesh | v0.20 | ML-enhanced Loop 2 | ⚪ Planned |
| Certification | v1.0 | ANSSI certification | ⚪ Planned |

---

## Summary

| Loop | Function | Timescale | v0.17 Status |
|------|----------|-----------|--------------|
| **Loop 1** | Operational (block threats) | ms → s | ✅ Complete |
| **Loop 2** | Tactical (correlate & adapt) | min → h | ✅ Complete |
| **Loop 3** | Strategic (intelligence & evolve) | h → days | ⚡ CAPI only |

**Loop 1** = Reflex → Block fast, block well  
**Loop 2** = Local intelligence → Understand patterns, adapt  
**Loop 3** = Collective intelligence → Share, anticipate, evolve

---

**Ex Tenebris, Lux Securitas**

*SecuBox v0.17.0 — First Public Release*  
*CyberMind.FR — January 2026*
