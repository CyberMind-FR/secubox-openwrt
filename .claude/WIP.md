# Work In Progress (Claude)

_Last updated: 2026-03-06 (PhotoPrism Gallery)_

> **Architecture Reference**: SecuBox Fanzine v3 — Les 4 Couches

---

## Recently Completed

### 2026-03-06

- **PhotoPrism Private Photo Gallery**
  - Backend: `secubox-app-photoprism` with LXC container (Debian Bookworm)
  - CLI: `photoprismctl` with install/start/stop/index/import/emancipate commands
  - LuCI: `luci-app-photoprism` KISS dashboard with stats and actions
  - Features: AI face recognition, object detection, places/maps
  - HAProxy integration via mitmproxy (WAF-safe, no bypass)
  - SQLite database (simpler, no external DB), FFmpeg transcoding, HEIC support
  - Dependencies: libvips42 for image processing

- **AI Gateway `/login` Command**
  - CLI: `aigatewayctl login [provider]` - Interactive or scripted provider authentication
  - Validates credentials against provider API before saving
  - Rollback on validation failure (preserves previous credentials)
  - Format warnings: Claude keys should start with `sk-ant-`, OpenAI with `sk-`
  - RPCD: `login` method for LuCI frontend integration
  - ACL: Added write permission for `login` method

### 2026-03-04

- **SBOM Pipeline for CRA Annex I Compliance**
  - `scripts/check-sbom-prereqs.sh` - Prerequisites validation
  - `scripts/sbom-generate.sh` - Multi-source SBOM generation
  - `scripts/sbom-audit-feed.sh` - PKG_HASH/PKG_LICENSE feed audit
  - `.github/workflows/sbom-release.yml` - GitHub Actions with CVE gating
  - `SECURITY.md` - CRA Art. 13 §6 compliant vulnerability disclosure

- **AI Gateway Full-Stack Implementation**
  - 3-tier data classification: LOCAL_ONLY, SANITIZED, CLOUD_DIRECT
  - Provider routing: LocalAI > Mistral EU > Claude > OpenAI > Gemini > xAI
  - `aigatewayctl` CLI with classify/sanitize/provider/audit commands
  - `luci-app-ai-gateway` with 4 KISS-themed views

### 2026-03-03

- **Comprehensive Service Audit**
  - WAF Enforcement: Disabled `waf_bypass` on 21 vhosts
  - Container Autostart: Enabled on 9 essential containers
  - Glances Fix: Resolved cgroup mount issue
  - 18 LXC Containers Running

- **Vortex DNS Firewall Phases 1-4**
  - Threat intel aggregator, SQLite blocklist, dnsmasq integration
  - HTTP/HTTPS sinkhole server for infected client detection
  - DNS Guard AI detection integration
  - Mesh threat sharing via secubox-p2p blockchain

- **Image Builder Validation**
  - Validated `secubox-image.sh`, `secubox-sysupgrade.sh`
  - Fixed curl redirect issue: Added `-L` flag

### 2026-03-02

- **Reverse MWAN WireGuard v2 - Phase 2**
  - LuCI Dashboard for Mesh Uplinks
  - 9 RPC methods for uplink management
  - 10-second live polling

### 2026-03-01

- **Reverse MWAN WireGuard v2 - Phase 1**
  - WireGuard mesh peers as backup internet uplinks via mwan3 failover
  - `wgctl` CLI: uplink list/add/remove/status/test/failover
  - UCI config for global and per-uplink settings

- **Nextcloud Integration Enhancements**
  - WAF-safe SSL routing, scheduled backups, SMTP integration
  - CalDAV/CardDAV/WebDAV connection info display

---

## In Progress

- **Vortex DNS** - Meshed multi-dynamic subdomain delegation (DONE 2026-02-05)
  - `secubox-vortex-dns` package with `vortexctl` CLI
  - Master/slave hierarchical DNS delegation
  - Wildcard domain management

---

## Next Up

### v1.1+ Extended Mesh

1. **WAF Auto-Ban Tuning** (optional, as-needed)
   - Sensitivity threshold adjustment based on production traffic

### Backlog

- SSMTP / mail host / MX record management (v2)

---

## Strategic Documents

- `SecuBox_LocalAI_Strategic_Analysis.html` — AI Management Layer roadmap
- `SecuBox_AI_Gateway_Hybrid_Architecture.html` — Hybrid Local/Cloud architecture
- `SecuBox_MirrorNetworking_Paradigm_Reversal.html` — EnigmaBox autopsy → MirrorNet
- `SecuBox_Fanzine_v3_Feb2026.html` — 4-layer architecture overview

---

## Blockers / Risks

- No automated regression tests for LuCI views; manual verification required after SCP deploy.
- Guacamole ARM64 pre-built binaries not readily available.
