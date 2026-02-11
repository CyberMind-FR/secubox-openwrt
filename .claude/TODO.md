# SecuBox TODOs (Claude Edition)

_Last updated: 2026-02-06_

> **Architecture Reference**: SecuBox Fanzine v3 — Les 4 Couches

---

## Resolved

- ~~Expose cyberpunk option inside SecuBox Settings~~ — Done: `THEME_CHOICES` now includes `cyberpunk` in `settings.js`.
- ~~Glances full system monitoring~~ — Done: LXC host bind mounts, Docker socket, fs plugin patch, hostname/OS identity (2026-02-04).
- ~~Zigbee2MQTT dongle connection~~ — Done: adapter `ezsp`→`ember`, `ZIGBEE2MQTT_DATA` env var, direct `/dev/ttyUSB0` passthrough (2026-02-04).
- ~~Metablogizer Upload Failures~~ — Done: Chunked upload to bypass uhttpd 64KB JSON limit (2026-02-04).
- ~~Chip Header Layout Migration~~ — Done: client-guardian and auth-guardian ported to `sh-page-header` + `renderHeaderChip()` (2026-02-05).
- ~~SMB/CIFS Shared Remote Directories~~ — Done: `secubox-app-smbfs` + `secubox-app-ksmbd` (2026-02-04/05).
- ~~P2P App Store Emancipation~~ — Done: P2P package distribution, packages.js view, devstatus.js widget (2026-02-04/05).
- ~~Navigation Component~~ — Done: `SecuNav.renderTabs()` auto-inits theme+CSS, `renderCompactTabs()` (2026-02-05).
- ~~Monitoring UX~~ — Done: Empty-state loading animation, dynamic bandwidth units via `formatBits()` (2026-02-05).
- ~~MAC Guardian Feed Integration~~ — Done: Both IPKs built and added to bonus feed (2026-02-05).
- ~~Punk Exposure Multi-Domain DNS~~ — Done: emancipate/revoke CLI, RPCD, Mesh column, Emancipate modal (2026-02-05).
- ~~Jellyfin Post-Install Wizard~~ — Done: 4-step modal wizard for media library configuration (2026-02-05).
- ~~Domoticz IoT Integration~~ — Done: LuCI dashboard, MQTT auto-bridge, Zigbee2MQTT integration (2026-02-04).
- ~~MCP Server~~ — Done: `secubox-mcp-server` with 9 core tools + 5 AI-powered tools (LocalAI integration), Claude Desktop via SSH (2026-02-06).

---

## Couche 1 — Core Mesh (35+ modules)

### v0.18 Module Priorities

| Package | Status | Notes |
|---------|--------|-------|
| `secubox-app-guacamole` | DEFERRED | LXC build-from-source too slow; needs pre-built binaries |
| `secubox-app-rustdesk` | DONE | Native hbbs/hbbr binaries, auto-key generation |
| `secubox-app-ksmbd` | DONE | Mesh media server with pre-configured shares |
| `secubox-app-domoticz` | DONE | LXC Debian, MQTT bridge, Zigbee2MQTT |
| `secubox-app-smbfs` | DONE | Client-side SMB mount manager |

### Testing & Validation

1. **Mesh Onboarding Testing**
   - master-link dynamic join IPK generation needs end-to-end testing on multi-node mesh.
   - P2P decentralized threat intelligence sharing needs validation with real CrowdSec alerts.

2. **WAF Auto-Ban Tuning**
   - Sensitivity thresholds may need adjustment based on real traffic patterns.
   - CVE detection patterns (including CVE-2025-15467) need false-positive analysis.

3. **Image Builder Validation**
   - `secubox-tools/` image builder and sysupgrade scripts need testing on physical hardware.

### Innovation CVE Layer 7

- WAF analysis via Modsec IP + traffic analysis + CrowdSec CVE detection
- Combines: `secubox-app-waf` + `mitmproxy` threat patterns + CrowdSec scenarios

### Docs & Tooling

- Document deployment scripts in `README.md` (what each script copies).
- Add lint/upload pre-check (LuCI `lua -l luci.dispatcher`) to prevent syntax errors before SCP.
- Capture screenshot baselines for dark/light/cyberpunk themes.
- Automate browser cache busting (append `?v=<git sha>` to view URLs).

---

## Couche 2 — AI Gateway

### Data Classifier (Sovereignty Engine)

| Classification | Description | Destination |
|----------------|-------------|-------------|
| LOCAL ONLY | Raw network data, IPs, MACs, logs | Never leaves device |
| SANITIZED | IPs scrubbed, anonymized patterns | Mistral EU (opt-in) |
| CLOUD DIRECT | Generic queries, no sensitive data | Claude/GPT (opt-in) |

**Package**: `secubox-ai-gateway` — LiteLLM Proxy (port 4000) + Data Classifier + MCP Server

### 6 Autonomous Agents

| Agent | Phase | Description |
|-------|-------|-------------|
| Threat Analyst | v0.18 | CrowdSec alert analysis, threat correlation |
| DNS Guard | v0.18 | DNS anomaly detection, migration from current |
| CVE Triage | v0.19 | Vulnerability prioritization, patch recommendations |
| Network Anomaly | v0.19 | Traffic pattern analysis, baseline deviation |
| Log Analyzer | v0.19 | Cross-log correlation, incident timeline |
| Config Advisor | v1.0 | ANSSI compliance prep, configuration hardening |

### MCP Server — Le lien manquant

SecuBox MCP Server exposes device context to AI agents via Model Context Protocol:

**MCP Tools**:
- `crowdsec.alerts` — Active threats and decisions
- `waf.logs` — Web application firewall events
- `dns.queries` — DNS query logs and anomalies
- `network.flows` — Traffic flow summaries
- `system.metrics` — CPU, memory, disk, temperature
- `wireguard.status` — VPN tunnel status
- `uci.config` — OpenWrt configuration access

**Integration targets**: Claude Desktop, Cursor, VS Code, custom agents

### AI Provider Hierarchy

1. **Mistral** (EU sovereign, GDPR compliant) — Priority 1
2. **Claude** — Priority 2
3. **GPT** — Priority 3
4. **Gemini** — Priority 4
5. **xAI** — Priority 5

All cloud providers are **opt-in**. Offline resilience: local tier always active.

---

## Couche 3 — MirrorNetworking

### EnigmaBox → MirrorNet Paradigm Reversal

> Zero central authority: each box IS the network.

### Dual Transport Architecture

| Tier | Protocol | Purpose |
|------|----------|---------|
| Tier 1 | WireGuard | Known peers, trusted mesh |
| Tier 2 | Yggdrasil | Discovery, extended mesh (optional) |

### Services Mirrors (P2P Gossip)

- **Threat Intel**: IoC signed gossip, distributed threat intelligence
- **AI Inference**: Distributed model inference across mesh
- **Reputation**: Trust scoring, peer reputation
- **Config & Updates**: P2P configuration sync, firmware distribution

### New Packages Roadmap

| Package | Version | Description |
|---------|---------|-------------|
| `secubox-mirrornet` | v0.19 | Core mesh orchestration, gossip protocol |
| `secubox-identity` | v0.19 | did:plc generation, key rotation, trust scoring |
| `secubox-p2p-intel` | v0.19 | IoC signed gossip, threat intelligence |
| `luci-app-secubox-mirror` | v0.19 | Dashboard for peers, trust, services |
| `secubox-voip` | v1.0 | Asterisk micro-PBX, SIP/SRTP over mesh |
| `secubox-matrix` | v1.0 | Conduit Matrix server (~15MB RAM) |
| `secubox-factory` | v1.0 | Auto-provisioning via mesh P2P |
| `yggdrasil-secubox` | v1.1+ | Yggdrasil overlay + meshname DNS |

### Communication Layer

- **VoIP E2E**: Asterisk/SRTP direct over WireGuard mesh (no exit server)
- **Matrix E2EE**: Conduit federation on mesh
- **Mesh Email**: Optional, deferred

---

## Couche 4 — Roadmap

### v0.18.0 — MirrorBox Core v1.0

- [x] LocalAI upgrade → 3.9 (Done 2026-02-06)
- [x] MCP Server implementation (Done 2026-02-06)
- [x] Threat Analyst agent (Done 2026-02-05)
- [x] DNS Guard AI migration (Done 2026-02-06)
- [x] LocalAI multi-channel emancipation (Done 2026-02-06)
- [ ] Guacamole pre-built binaries (DEFERRED)

### v0.19.0 — AI Expansion + MirrorNet

- [x] CVE Triage agent (Done 2026-02-06)
- [x] Network Anomaly agent (Done 2026-02-06)
- [x] LocalRecall memory integration (Done 2026-02-06)
- [x] AI Insights dashboard (Done 2026-02-06)
- [x] MirrorNet core packages: (Done 2026-02-07)
  - [x] `secubox-mirrornet` — Mesh orchestration, gossip protocol
  - [x] `secubox-identity` — did:plc generation, trust scoring
  - [x] `secubox-p2p-intel` — IoC signed gossip
  - [x] `luci-app-secubox-mirror` — Dashboard for peers, trust, services
- [x] Master/Slave CDN Architecture:
  - [x] Wildcard domain delegation (*.secubox.io concept) — `secubox-vortex-dns` (2026-02-05)
  - [x] Service mirroring via reverse proxy chaining — `mirrorctl` (2026-02-07)
  - [x] Gossip-based exposure config sync — `vortexctl mesh sync` (2026-02-05)
  - [x] Hierarchical submastering/multimixslaving — `vortexctl submaster` (2026-02-05)

### v1.0.0 — Full Stack

- [x] Config Advisor (ANSSI prep) — Done 2026-02-07
- [ ] P2P Mesh Intelligence
- [ ] Factory auto-provisioning
- [ ] VoIP integration
- [ ] Matrix integration

### v1.1+ — Extended Mesh

- [ ] Yggdrasil overlay
- [ ] Meshname DNS
- [ ] Extended peer discovery

### Certifications Ciblees

| Certification | Status | Target |
|---------------|--------|--------|
| ANSSI CSPN | In Progress | v1.0 |
| ISO 27001 | Planned | v1.1 |
| NIS2 | Planned | v1.1 |
| CE | Planned | v1.0 |
| GDPR | Compliant | Current |
| SOC2 | Planned | v1.2 |

**ANSSI CSPN Strategy**: Data Classifier + Mistral EU + offline mode = triple sovereignty proof

---

## Deferred / Backlog

### Tor Shield / opkg Bug

- opkg downloads fail (`wget returned 4`) when Tor Shield is active.
- Direct `wget` to full URL works — likely DNS/routing interference.
- Investigate: opkg proxy settings, Tor split-routing exclusions for package repos.

### v2 Long-term

- Nextcloud self-hosted cloud storage
- SSMTP / mail host / MX record management
- Reverse MWAN WireGuard peers (multi-WAN failover over mesh)

---

## Veille Cyber — Février 2026

_Space for current threat intelligence and security news relevant to SecuBox development._

- CVE-2025-15467: WAF detection patterns added
- [ ] Monitor for new CrowdSec scenarios
- [ ] Track OpenWrt security advisories
