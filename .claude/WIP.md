# Work In Progress (Claude)

_Last updated: 2026-03-07 (lldh360 + cybaxe Vhosts Fix)_

> **Architecture Reference**: SecuBox Fanzine v3 — Les 4 Couches

---

## Recently Completed

### 2026-03-07

- **lldh360.maegia.tv Routing Fix**
  - Fixed mitmproxy routes: 127.0.0.1 → 192.168.255.1 (all 187 routes updated)
  - Disabled SSL redirect (DNS record doesn't exist yet for ACME)
  - Restored HAProxy config from backup (haproxyctl generate was corrupted)
  - Site now accessible via HTTP on port 9003

- **cybaxe.gk2.secubox.in Port Conflict Fix**
  - Changed port from 9000 to 9004 (9000 reserved for Lyrion Music Server)
  - Updated metablogizer, HAProxy backend, and mitmproxy routes
  - Created placeholder index.html (site content needs gitea sync)
  - Site now accessible via HTTPS

- **Mitmproxy-in Port Conflict Fix**
  - Changed mitmproxy-in WAF port from 8889 to 8890
  - Port 8889 conflicted with avatar-tap Streamlit service
  - Updated HAProxy mitmproxy_inspector backend configuration
  - Fixed HAProxy runtime state caching via socket command

- **Vhosts Recovery**
  - Started stopped LXC containers: jellyfin, jitsi, peertube, gotosocial, glances
  - Fixed glances container cgroup v2 config (cgroup.memory.limit_in_bytes → cgroup2.memory.max)
  - Fixed mitmproxy route IPs: 127.0.0.1 → 192.168.255.1 (LXC can't reach host localhost)
  - All 11 key vhosts now operational (jellyfin, social, glances, tube, meet, zoo, portal, cloud, photos, lyrion, streamlit)

- **Vhosts-Checker RPCD Fix**
  - Fixed XHR timeout issue in LuCI dashboard
  - Root cause: jshn overhead for 226 vhosts + subshell issues with pipes
  - Solution: Direct JSON output with printf, temp file instead of pipes
  - Deployed ACL file for authentication

- **ROADMAP.md Generation**
  - Created comprehensive roadmap from WIP and HISTORY analysis
  - Version milestones: v0.19 → v0.20 → v0.21 → v0.22 → v1.0
  - Critical path analysis and dependency graph
  - Resource requirements and risk register

- **Avatar-Tap Session Capture & Replay**
  - Backend: `secubox-avatar-tap` - passive network tap via mitmproxy
  - CLI: `avatar-tapctl` with start/stop/list/replay/label/delete commands
  - LuCI: `luci-app-avatar-tap` KISS dashboard with session table
  - Features: Cookie/auth header capture, session replay, SQLite storage
  - Runs in Streamlit LXC container on port 8889 (mitmproxy-in moved to 8890)
  - Future: Nitrokey/GPG integration for secure replay authorization

- **PhotoPrism Photo Gallery Deployment**
  - Linked /mnt/PHOTO (673GB, 391k photos) to PhotoPrism originals
  - Fixed HFS+ read-only mount issue (sidecar writes to storage/)
  - Indexing in progress: HEIC conversion, thumbnail generation, AI labels
  - HAProxy vhost + SSL cert for photos.gk2.secubox.in

- **Service Fixes & HAProxy Vhosts**
  - Fixed Lyrion music mount: /mnt/MUSIC (1.6TB) now accessible
  - Fixed Portal routing (was 503, now working)
  - Added missing vhosts: lyrion.gk2.secubox.in, streamlit.gk2.secubox.in
  - Requested and installed SSL certs for all 3 new domains
  - Fixed ACME webroot configuration (uhttpd home path)

- **Source Code Updates**
  - Updated default paths: Lyrion→/mnt/MUSIC, PhotoPrism→/mnt/PHOTO
  - Committed and pushed to master

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
