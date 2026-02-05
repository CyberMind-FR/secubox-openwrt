# Work In Progress (Claude)

_Last updated: 2026-02-06_

> **Architecture Reference**: SecuBox Fanzine v3 — Les 4 Couches

---

## Couche 1 — Core Mesh

### Recently Completed (2026-02-04/05)

- **MAC Guardian Feed Integration** — DONE (2026-02-05)
  - Both IPKs built and added to bonus feed
  - Catalog updated with security category, wifi icon

- **Punk Exposure Emancipate** — DONE (2026-02-05)
  - CLI: `emancipate` and `revoke` commands for multi-channel exposure
  - RPCD: 3 new methods in `luci.exposure`
  - Dashboard: Mesh column toggle, Emancipate modal

- **Jellyfin Post-Install Wizard** — DONE (2026-02-05)
  - 4-step modal wizard (Welcome, Media, Network, Complete)
  - RPCD methods for wizard status and media path management

- **Navigation Component Refactoring** — DONE (2026-02-05)
  - `SecuNav.renderTabs()` auto-inits theme and CSS
  - `renderCompactTabs()` for nested modules
  - Eliminated ~1000 lines of duplicate CSS

- **ksmbd Mesh Media Sharing** — DONE (2026-02-05)
  - `ksmbdctl` CLI with share management
  - Pre-configured shares: Media, Jellyfin, Lyrion, Backup

- **SMB/CIFS Remote Mount Manager** — DONE (2026-02-04)
  - `smbfsctl` CLI, UCI config, init script
  - Jellyfin and Lyrion media path integration

- **Domoticz IoT Integration** — DONE (2026-02-04)
  - LXC Debian container with native binary
  - MQTT auto-bridge, Zigbee2MQTT integration
  - `domoticzctl configure-mqtt` command

### In Progress

_None currently active_

### Next Up — Couche 1

1. **Guacamole Pre-built Binaries**
   - Current LXC build-from-source approach is too slow
   - Need to find/create pre-built ARM64 binaries for guacd + Tomcat

2. **Mesh Onboarding Testing**
   - End-to-end test of master-link dynamic join IPK generation
   - Validate P2P threat intelligence with real CrowdSec alerts

---

## Couche 2 — AI Gateway

### Next Up — v0.18 AI Components

1. **MCP Server Implementation**
   - Create `secubox-mcp-server` package
   - Implement MCP tools: crowdsec.alerts, waf.logs, dns.queries, network.flows, system.metrics, wireguard.status, uci.config
   - Integration with Claude Desktop, Cursor

2. **Threat Analyst Agent**
   - CrowdSec alert analysis and correlation
   - Automated threat severity assessment

3. **DNS Guard Migration**
   - Migrate current `luci-app-dnsguard` to AI-powered agent
   - DNS anomaly detection with ML patterns

4. **LocalAI Upgrade → 3.9**
   - Update `secubox-app-localai` to version 3.9
   - Add new model presets

---

## Couche 3 — MirrorNetworking

### Packages to Build (v0.19)

| Package | Priority | Notes |
|---------|----------|-------|
| `secubox-mirrornet` | HIGH | Core mesh orchestration, gossip protocol |
| `secubox-identity` | HIGH | did:plc generation, key rotation |
| `secubox-p2p-intel` | MEDIUM | IoC signed gossip |
| `luci-app-secubox-mirror` | MEDIUM | Dashboard for peers, trust, services |

### Communication Layer (v1.0)

- `secubox-voip` — Asterisk micro-PBX
- `secubox-matrix` — Conduit Matrix server

---

## Couche 4 — Roadmap Tracking

### v0.18.0 Progress

| Item | Status |
|------|--------|
| Core Mesh modules | 35+ DONE |
| Guacamole | DEFERRED |
| MCP Server | TODO |
| Threat Analyst | TODO |
| DNS Guard migration | TODO |
| LocalAI 3.9 | TODO |

### Certifications

- ANSSI CSPN: Data Classifier + Mistral EU + offline mode
- GDPR: Currently compliant
- ISO 27001, NIS2, SOC2: Planned for v1.1+

---

## Strategic Documents Received

- `SecuBox_LocalAI_Strategic_Analysis.html` — AI Management Layer roadmap
- `SecuBox_AI_Gateway_Hybrid_Architecture.html` — Hybrid Local/Cloud architecture
- `SecuBox_MirrorNetworking_Paradigm_Reversal.html` — EnigmaBox autopsy → MirrorNet
- `SecuBox_Fanzine_v3_Feb2026.html` — 4-layer architecture overview

---

## Known Bugs (Deferred)

- **Tor Shield / opkg conflict**: opkg downloads fail (`wget returned 4`) when Tor Shield is active. Likely DNS/routing interference.

---

## Blockers / Risks

- No automated regression tests for LuCI views; manual verification required after SCP deploy.
- Guacamole ARM64 pre-built binaries not readily available.
- MCP Server requires understanding of Model Context Protocol specification.
