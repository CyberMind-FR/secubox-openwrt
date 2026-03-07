# SecuBox Development Roadmap

_Generated: 2026-03-07 | Based on WIP.md and HISTORY.md analysis_

> **Reference Architecture**: SecuBox Fanzine v3 — Les 4 Couches

---

## Executive Summary

SecuBox is progressing through 4 architectural layers toward v1.0 certification readiness:
- **Couche 1 (Core Mesh)**: ~85% complete — 40+ modules, mesh networking, services
- **Couche 2 (AI Gateway)**: ~60% complete — LocalAI, agents, MCP server
- **Couche 3 (MirrorNetworking)**: ~40% complete — Vortex DNS, identity, gossip
- **Couche 4 (Certification)**: ~20% complete — Config Advisor, ANSSI prep

---

## Version Milestones

### v0.19 — Core Stability (Target: 2026-03-15)
**Status: IN PROGRESS**

| Task | Status | Dependencies | Priority |
|------|--------|--------------|----------|
| PhotoPrism full indexing | In Progress | HFS+ mount fix | High |
| Avatar-Tap session replay | Complete | Mitmproxy integration | — |
| Vhosts-checker RPCD fix | Complete | — | — |
| Nextcloud Talk HPB (LXC) | Complete | coturn, NATS | — |
| All Docker→LXC migration | 95% | — | Medium |
| HAProxy crt-list SNI | Complete | — | — |
| Streamlit emancipate CLI | Complete | DNS, HAProxy, Vortex | — |

**Blockers:**
- PhotoPrism indexing 391k photos (~4k done, ~96h estimated)

---

### v0.20 — AI Gateway Expansion (Target: 2026-03-30)
**Status: PLANNED**

| Task | Dependencies | Combo Opportunities |
|------|--------------|---------------------|
| LocalAI v3.9.0 Agent Jobs | LocalAI running | + Threat Analyst |
| Threat Analyst auto-rules | LocalAI, CrowdSec | + DNS Guard AI |
| DNS Guard AI detection | LocalAI, Vortex Firewall | + Insider WAF |
| Network Anomaly AI | LocalAI, netifyd | + LocalRecall |
| LocalRecall memory persist | SQLite | + All AI agents |
| MCP Server tool expansion | LocalAI | + Claude Desktop |

**Requirements:**
- LocalAI operational (port 8091)
- Minimum 2GB RAM for AI models
- CrowdSec LAPI running

**Combos:**
- **AI Security Suite**: Threat Analyst + DNS Guard + Network Anomaly = comprehensive AI-powered defense
- **Memory-Enhanced Agents**: LocalRecall + any agent = contextual learning

---

### v0.21 — MirrorNet Phase 1 (Target: 2026-04-15)
**Status: PLANNED**

| Task | Dependencies | Combo Opportunities |
|------|--------------|---------------------|
| MirrorNet identity (DID) | secubox-identity | + P2P Intel |
| MirrorNet reputation | Identity | + IOC sharing |
| MirrorNet gossip protocol | WireGuard mesh | + Config sync |
| P2P Intel signed IOCs | Identity, CrowdSec | + Vortex Firewall |
| Service mirroring | HAProxy, Vortex DNS | + Load balancing |

**Requirements:**
- At least 2 SecuBox nodes for mesh testing
- WireGuard tunnels established
- Vortex DNS master configured

**Combos:**
- **Mesh Security**: P2P Intel + Reputation + IOC sharing = distributed threat defense
- **Service HA**: Mirroring + Health checks = automatic failover

---

### v0.22 — Station Cloning (Target: 2026-04-30)
**Status: PLANNED**

| Task | Dependencies | Priority |
|------|--------------|----------|
| Clone image builder | OpenWrt imagebuilder | High |
| TFTP boot server | uhttpd | Medium |
| Remote device flash | Dropbear SSH | Medium |
| Auto-mesh join | Master-link tokens | High |
| First-boot provisioning | UCI defaults | High |

**Requirements:**
- USB serial adapter for MochaBin
- Network connectivity between master/clone
- ~2GB storage for clone images

---

### v1.0 — Certification Ready (Target: 2026-06-01)
**Status: PLANNING**

| Task | Dependencies | Certification |
|------|--------------|---------------|
| Config Advisor ANSSI full | All security modules | ANSSI CSPN |
| SBOM pipeline complete | CVE gating | CRA Annex I |
| Vulnerability disclosure | SECURITY.md | CRA Art. 13 |
| Security documentation | All modules | ISO 27001 |
| Penetration test fixes | External audit | NIS2 |

**Requirements:**
- All v0.19-v0.22 complete
- External security audit
- Documentation review
- Test coverage >80%

---

## Critical Path Analysis

```
v0.19 ──┬──> v0.20 (AI) ──┬──> v0.21 (MirrorNet) ──> v1.0
        │                 │
        │                 └──> v0.22 (Cloning) ──────┘
        │
        └──> PhotoPrism (background, non-blocking)
```

**Parallel Tracks:**
1. **AI Track**: LocalAI → Agents → MCP → Memory (requires LocalAI operational)
2. **Mesh Track**: Identity → Gossip → P2P Intel → Mirroring (requires WireGuard mesh)
3. **Ops Track**: Cloning → Remote flash → Auto-provision (can start anytime)

---

## Dependency Graph

### Module Dependencies

```
                    ┌─────────────────┐
                    │   secubox-core  │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  HAProxy    │   │  CrowdSec   │   │  mitmproxy  │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ Vortex DNS  │   │Threat Analyst│   │ Cookie Tracker│
    └──────┬──────┘   └──────┬──────┘   └─────────────┘
           │                 │
    ┌──────▼──────┐   ┌──────▼──────┐
    │  MirrorNet  │   │  LocalAI    │
    └─────────────┘   └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │  AI Agents  │
                      └─────────────┘
```

### Service Dependencies

| Service | Requires | Provides |
|---------|----------|----------|
| HAProxy | LXC, SSL certs | Vhost routing, WAF bypass |
| CrowdSec | LAPI, scenarios | Threat decisions, bans |
| mitmproxy | HAProxy routes | WAF inspection, analytics |
| Vortex DNS | dnsmasq, DNS provider | DNS firewall, mesh domains |
| LocalAI | 2GB+ RAM | Inference API |
| Threat Analyst | LocalAI, CrowdSec | Auto-generated rules |
| MirrorNet | WireGuard, Identity | Gossip, mirroring |
| P2P Intel | Identity, CrowdSec | Signed IOC sharing |

---

## Resource Requirements

### Current Production (C3BOX gk2)

| Resource | Usage | Notes |
|----------|-------|-------|
| RAM | 8GB total, ~4GB free | PhotoPrism uses 3.7GB during indexing |
| Storage | 2TB NVMe, 1.6TB /mnt/MUSIC, 673GB /mnt/PHOTO | HFS+ read-only |
| LXC Containers | 18 running | Auto-start enabled |
| HAProxy Vhosts | 226 domains | 92 SSL certificates |
| Services | 40+ running | Monitored by heartbeat |

### Minimum for v1.0

| Resource | Requirement | Purpose |
|----------|-------------|---------|
| RAM | 4GB | Core services + LocalAI |
| Storage | 64GB + external | System + media |
| Network | WAN + LAN | HAProxy + mitmproxy |
| CPU | ARM64 4-core | Indexing, AI inference |

---

## Risk Register

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| PhotoPrism HFS+ writes | High | Sidecar to storage/, READONLY=true | Mitigated |
| RPCD timeout large responses | Medium | Direct JSON output, no jshn for arrays | Mitigated |
| LXC cgroup v2 compatibility | High | Remove cgroup:mixed, explicit device permissions | Mitigated |
| BusyBox command limitations | Medium | Fallback methods (no timeout, read -t, etc.) | Documented |
| Guacamole ARM64 binaries | Low | Manual build or alternative | Deferred |
| No automated UI tests | Medium | Manual verification post-deploy | Accepted |

---

## Quick Reference: Current Task Priorities

### Immediate (This Week)
1. ~~Vhosts-checker RPCD fix~~ ✅
2. ~~Nextcloud Talk HPB LXC~~ ✅
3. Monitor PhotoPrism indexing completion
4. Test all new vhosts (photos, lyrion, streamlit)

### Short-term (2 Weeks)
1. LocalAI Agent Jobs integration
2. Threat Analyst daemon tuning
3. MirrorNet identity module testing
4. Clone station documentation

### Medium-term (1 Month)
1. v0.20 AI Gateway features
2. P2P Intel mesh sharing
3. Remote device management
4. ANSSI compliance gaps

---

## Changelog

- 2026-03-07: Initial roadmap generated from WIP.md and HISTORY.md analysis
- Based on 60+ completed features since 2026-02-01
- 4 major version milestones defined
- Critical path and dependency graph established
