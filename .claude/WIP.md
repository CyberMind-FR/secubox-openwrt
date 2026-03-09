# Work In Progress (Claude)

_Last updated: 2026-03-09 (HAProxy Routes Health Check)_

> **Architecture Reference**: SecuBox Fanzine v3 — Les 4 Couches

---

## Recently Completed

### 2026-03-09

- **HAProxy Routes Health Check Panel**
  - Backend: `/usr/sbin/service-health-check` script checks all routes in haproxy-routes.json
  - RPCD method: `get_service_health` with 5-min cache and force-refresh option
  - LuCI panel: Up/Down/Total stats, health %, down services list
  - Refresh button for manual health check trigger
  - CSS styling with KISS theme integration
  - ACL permission added for read access
  - Deployed and tested: 174 routes, 21 down (intentionally stopped LXC containers)

- **admin.gk2.secubox.in WAF Routing Fix**
  - Added route through mitmproxy WAF (port 8081 for LuCI)
  - Fixed haproxy_router.py blocking 8081 routes
  - Domain now accessible through WAF with proper access control

- **Dev Status Widget v2.1 (Dynamic Dashboard)**
  - Complete redesign with 4-layer architecture visualization
  - 22+ features with dependency tracking (dependsOn/usedBy)
  - 80+ components with status indicators
  - Interactive filters: layer, status, category with localStorage persistence
  - Feature cards: click to expand, show full dependencies/components
  - Layer cards: click to filter features by layer
  - Interconnection graph showing feature dependencies
  - Milestone timeline to v1.0 with progress tracking
  - Production stats display (185 packages, 226 vhosts, etc.)
  - Auto-refresh with live RPCD data (60s interval)
  - ES5 compatible for older browsers
  - Standalone HTML page: `/dev-status.html` (no auth required)
  - Files: `dev-status-widget.js`, `dev-status.js`, `dev-status-standalone.html`

- **DNS Zone Configuration Sync**
  - Fixed BIND zone path mismatch: `/srv/dns/zones/` → `/etc/bind/zones/`
  - Added ganimed.fr zone declaration to `named.conf.zones`
  - Synced zone files between LuCI-managed and BIND-loaded paths

- **Mitmproxy WAF Memory Optimization**
  - Diagnosed memory leak (687MB RSS)
  - Added flow limits: `--set flow_detail=0 --set hardlimit=500`
  - Reduced memory to 77MB
  - Fixed `/srv/mitmproxy-in/haproxy-routes.json` for git.maegia.tv

- **Config Backups Repository**
  - Created `config-backups/` directory with BIND zones
  - Created private `secubox-configs` repo on local Gitea
  - Git remote: `git@git.maegia.tv:reepost/secubox-configs.git`

### 2026-03-08

- **RTTY Remote Control Module (Phase 3 - Web Terminal)**
  - Web Terminal view: Embeds ttyd (port 7681) via iframe
  - Node selector: Local/remote target selection
  - Remote detection: Direct ttyd connection or SSH fallback
  - RPCD method: start_terminal for remote node terminal info
  - Menu: Remote Control → Remote Support → Web Terminal
  - Fullscreen and refresh controls

- **RTTY Remote Control Module (Phase 2 - Token-Based Shared Access)**
  - Token authentication: 6-character codes grant RPC/terminal access without LuCI login
  - CLI commands: `rttyctl token generate/list/validate/revoke`, `rttyctl token-rpc`
  - RPCD methods: token_generate, token_list, token_validate, token_revoke, token_rpc
  - Support Panel: Generate code → Share → Support person connects without auth
  - Configurable TTL (30m/1h/2h/4h), permission tracking, usage counter
  - Local address detection: Direct ubus for local calls (bypasses HTTP auth limits)
  - Deployed and tested: Token RPC works for all ubus methods

- **RTTY Remote Control Module (Phase 1 - RPCD Proxy)**
  - Backend: `secubox-app-rtty-remote` with `rttyctl` CLI
  - Frontend: `luci-app-rtty-remote` with KISS dashboard
  - RPCD Proxy: Execute remote ubus calls to mesh nodes over HTTP
  - CLI commands: `rttyctl nodes/rpc/rpc-list/rpc-batch/auth/sessions`
  - RPCD methods: status, get_nodes, rpc_call, rpc_list, get_sessions, connect
  - Session tracking with SQLite database
  - Master-link integration for authentication
  - Tested: `rttyctl rpc 127.0.0.1 system board` works

- **lldh360.maegia.tv BIND Zone Fix**
  - DNS was returning NXDOMAIN despite zone file existing
  - Root cause: BIND (named) is the authoritative DNS, not dnsmasq
  - Zone file `/srv/dns/zones/maegia.tv.zone` existed but wasn't registered in BIND
  - Added zone entry to `/etc/bind/named.conf.zones`
  - Restarted BIND (named), domain now resolves correctly
  - Site accessible via HTTPS (HTTP 200)

- **HAProxy mitmproxy Port Fix**
  - Changed mitmproxy-in WAF port from 8890 to 22222
  - Fixed UCI config regeneration issue (was overwriting manual edits)
  - All vhosts now routing correctly through WAF

- **Vortex DNS Zone Management & Secondary DNS**
  - Added zone commands: `vortexctl zone list/dump/import/export/reload`
  - Added secondary DNS commands: `vortexctl secondary list/add/remove`
  - Zone dump generates BIND format zone files in `/srv/dns/zones/`
  - Supports OVH as secondary DNS with AXFR zone transfer
  - RPCD methods: zone_list, zone_dump, zone_import, zone_export, zone_reload, secondary_list, secondary_add, secondary_remove
  - ACL permissions updated for all new methods
  - Enables importing zones from Gandi and becoming authoritative DNS master

- **Maegia Domains Audit & Fix**
  - Fixed 3 broken domains (503 errors): crt.maegia.tv, git.maegia.tv, glances.maegia.tv
  - Created missing vhost UCI configs for all 3 domains
  - Added mitmproxy routes: crt→8503, git→3001, glances→61208
  - Fixed ganimed.maegia.fr route IP: 127.0.0.1 → 192.168.255.1
  - Fixed lldh360.maegia.tv WAF bypass: metablog_lldh360 → mitmproxy_inspector
  - All 27 maegia domains now operational (4 have 404 content issues)

### 2026-03-07

- **HAProxy mitmproxy_inspector Backend Fix**
  - mitmproxy_inspector backend had NO server section (causing 503 for all WAF vhosts)
  - Added UCI server section: `mitmproxy_inspector_srv` pointing to 192.168.255.1:8890
  - Fixed haproxyctl duplicate userlist warning and _emit_sorted_path_acls indentation
  - All vhosts now correctly routing through WAF

- **Lyrion Routing Fix**
  - Changed lyrion vhost backend from `lyrion_web` to `mitmproxy_inspector`
  - Was bypassing WAF, now properly routed through mitmproxy-in

- **Jellyfin Route IP Fix**
  - Fixed mitmproxy route: 192.168.255.1 → 192.168.255.31 (container's actual IP)
  - Jellyfin container has dedicated veth interface on br-lan

- **lldh360.maegia.tv Routing Fix + SSL**
  - Fixed mitmproxy routes: 127.0.0.1 → 192.168.255.1 (all 187 routes updated)
  - Restored HAProxy config from backup (haproxyctl generate was corrupted)
  - Installed Let's Encrypt SSL certificate (valid until 2026-06-05)
  - Enabled HTTP→HTTPS redirect
  - Site now accessible via HTTPS
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

- **RTTY Remote Control Module (Phase 4 - Session Replay)**
  - Avatar-tap integration for session capture
  - Replay captured sessions to target nodes
  - Session export/import functionality

---

## Next Up

### v1.0 Release Prep

1. **Session Replay** - Avatar-tap integration for session capture/replay
2. **Remote ttyd Deployment** - Auto-install ttyd on mesh nodes

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
