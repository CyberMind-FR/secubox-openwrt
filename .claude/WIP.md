# Work In Progress (Claude)

_Last updated: 2026-03-16 (DPI LAN Passive Analysis)_

> **Architecture Reference**: SecuBox Fanzine v3 — Les 4 Couches

---

## Recently Completed

### 2026-03-16

- **Dual-Stream DPI Phase 4 - LAN Passive Flow Analysis (Complete)**
  - New `dpi-lan-collector` daemon for passive br-lan monitoring
  - Zero MITM, zero caching - pure nDPI/conntrack flow observation
  - Tracks: active LAN clients (ARP), external destinations (conntrack), protocols
  - LuCI `lan-flows.js` view with real-time stats and 5s auto-refresh
  - 4 new RPCD methods: get_lan_status, get_lan_clients, get_lan_destinations, get_lan_protocols
  - Fixed protocol display bug ("TCPnull" → "TCP")
  - Removed mitmproxy-out container (WAF only needs mitmproxy-in)
  - Updated MITM detection to check mitmproxy-in specifically

### 2026-03-15

- **MAGIC·CHESS·360 Colorset + Sliders Enhancement (Complete)**
  - Added 15 color palettes to wall.maegia.tv TAO_SPECTRUM system
  - Colorsets: default, alchy, emojiz, punk, hollistique, tantrique, cosmique, solarix, oceanique, rainbow, fluo, phospho, vintage, tao, merkaba
  - Each colorset changes the animated prism colors cycling through the chess pieces
  - Added 3 control sliders (bottom-left):
    - Pixel: cell size zoom (3-40px)
    - Persp: auto-rotate perspective speed
    - Pan: mouse parallax strength (0-2x)
  - Colorset selector: 15 circular gradient buttons (top-left corner)
  - Keyboard shortcuts (1-9) for first 9, click for rest
  - LocalStorage persistence for user preference
  - Deployed to: https://wall.maegia.tv/

### 2026-03-14

- **Hub Generator v7 - NFO Integration Fix (Complete)**
  - Fixed BusyBox awk compatibility issue with bracket parsing
  - Single-pass awk extraction for 7 NFO fields (category, desc, keywords, caps, audience, icon, version)
  - Replaced `gsub(/[\[\]]/)` with two `sub()` calls for reliable section parsing
  - 110 NFO entries now correctly extracted from 239 total items
  - Capability and audience filter clouds working with actual values
  - Dynamic preview modal with eye button for live site preview

- **Module Manifest (NFO) System Extension (Complete)**
  - Flat-file UCI-style `.nfo` manifest format for Streamlit/MetaBlog apps
  - Sections: identity, description, tags, runtime, dependencies, exposure, launcher, settings, dynamics, mesh, media
  - `[dynamics]` section for AI/generative content integration with prompt_context, capabilities, input/output types
  - NFO parser library: `/usr/share/streamlit-forge/lib/nfo-parser.sh`
  - NFO validator library: `/usr/share/streamlit-forge/lib/nfo-validator.sh` (type-specific validation)
  - `slforge nfo` commands: init, init-all, info, edit, validate, json, install
  - `metablogizerctl nfo` commands: init, init-all, info, edit, validate, sync, json
  - Batch NFO generation for all installed apps/sites
  - RPCD methods: nfo_read, nfo_write, nfo_validate for LuCI integration
  - Reusable NFO viewer component (`nfo-viewer.js`) with collapsible sections
  - LuCI editor modal for NFO editing in Streamlit Forge
  - Hub generator reads full NFO metadata for category/description/capabilities
  - Metacatalog search enhanced with NFO indexing and filters
  - Full spec at `/usr/share/streamlit-forge/NFO-SPEC.md`

- **Streamlit On-Demand Launcher (Complete)**
  - New `secubox-app-streamlit-launcher` package
  - On-demand startup: Apps start only when first accessed (lazy loading)
  - Idle shutdown: Stop apps after configurable timeout (default 30 min)
  - Memory management: Force-stop low-priority apps when memory < threshold
  - Priority system (1-100): Higher priority = keep running longer
  - Always-on mode for critical apps that should never auto-stop
  - CLI: `streamlit-launcherctl daemon|status|list|start|stop|priority|check|check-memory`
  - Procd daemon with respawn for background monitoring
  - Access tracking via touch files in `/tmp/streamlit-access/`
  - Loading page template for cold-start user feedback
  - Updated `slforge` with launcher integration:
    - `slforge launcher status|priority|always-on` commands
    - Access tracking on app start
  - UCI config: `/etc/config/streamlit-launcher`
  - Documentation: Full README with architecture diagram

### 2026-03-13

- **Configuration Vault System (Complete)**
  - New `secubox-app-config-vault` + `luci-app-config-vault` packages
  - Git-based config versioning with auto-commit and auto-push
  - 9 configuration modules: users, network, services, security, system, containers, reporter, dns, mesh
  - CLI: `configvaultctl init|backup|restore|push|pull|status|history|diff|modules|export-clone|import-clone`
  - RPCD: status, modules, history, diff, backup, restore, push, pull, init, export_clone
  - Gitea integration: Private repo sync (`gandalf/secubox-config-vault`)
  - LuCI Dashboard: KISS-themed with status rings, module table, commit history, quick actions
  - Export/import clone tarballs for device provisioning and cloning
  - Menu: SecuBox → System → Config Vault

- **System Hardware Report (Complete)**
  - Added new report type to `secubox-app-reporter`
  - CLI: `secubox-reportctl generate system`
  - CPU/Memory/Disk/Temperature gauges with animated rings
  - Environmental impact card: Power usage (W), daily kWh, CO₂ emissions
  - CPU load histogram (24-bar visualization)
  - Health recommendations based on system metrics
  - Top processes table and debug log viewer
  - Network interface stats (RX/TX per interface)
  - BusyBox-compatible collectors using /proc filesystem
  - KissTheme dark styling with responsive layout

- **SecuBox Report Generator (Complete)**
  - New `secubox-app-reporter` + `luci-app-reporter` packages
  - Two report types:
    - Development Status: health score, HISTORY.md completions, WIP items, roadmap
    - Services Distribution: Tor services (5), DNS/SSL vhosts (243), mesh services (1)
  - CLI: `secubox-reportctl generate|send|schedule|status|preview|list|clean`
  - RPCD: status, list_reports, generate, send, schedule, delete_report, test_email
  - LuCI Dashboard: KISS-themed overview, quick actions, reports list, schedule config
  - Email delivery via msmtp/sendmail with MIME multipart HTML
  - KissTheme dark styling with responsive layout
  - UCI config for SMTP and cron scheduling
  - Deployed and tested on router: `/www/reports/`
  - Menu: SecuBox → System → Report Generator

### 2026-03-12

- **SecuBox Watchdog - Service Health Monitor (Complete)**
  - New `secubox-app-watchdog` + `luci-app-watchdog` packages
  - Monitors: LXC containers (haproxy, mitmproxy-in/out, streamlit), host services (crowdsec, uhttpd, dnsmasq), HTTPS endpoints
  - CLI: watchdogctl status/check/check-recover/watch/restart-container/restart-service/logs
  - Auto-recovery: detects stopped containers/services and restarts them
  - RPCD: status, get_containers, get_services, get_endpoints, restart_*, check, get_logs
  - LuCI Dashboard: Real-time status with 10s polling, restart buttons, log viewer
  - Alert cooldown and log rotation
  - Procd service + cron fallback
  - Fixed HAProxy missing backends (luci_direct, fallback) and port mismatch

- **RTTY Remote Control Phase 4 - Session Replay (Complete)**
  - Avatar-Tap integration: passive session capture via mitmproxy WAF
  - CLI: tap-sessions, tap-show, tap-replay, tap-export, tap-import
  - RPCD: 6 new methods (get_tap_status, get_tap_sessions, get_tap_session, replay_to_node, export_session, import_session)
  - LuCI: session-replay.js view with stats, filters, replay panel, import/export
  - Menu: System Hub → Session Replay
  - Tested: 10 captured sessions from multiple domains

### 2026-03-11

- **Streamlit Forge Phase 2 - Gitea Integration (Complete)**
  - CLI: `slforge edit/pull/push/preview` commands
  - Gitea API integration with token auth
  - Auto-creates org/repo on first edit
  - RPCD: 5 new methods (gitea_status, edit, pull, push, preview)
  - LuCI: Gitea status card, Edit/Pull buttons, editor modal
  - Preview generation: HTML capture + SVG placeholder

- **HERMÈS·360 Full I-Ching Translation**
  - All 64 hexagrams translated in 5 languages (DE, ES, PT, ZH, JA):
    - Image texts (_i): 320 translations - symbolic imagery
    - Description texts (_d): 320 translations - hexagram meaning
    - Judgment texts (_j): 320 translations - oracle guidance
    - Total: 960 new translation fields added
  - Visual enhancements from wall.maegia.tv:
    - Canvas CSS filters: saturate(1.3) brightness(1.15) contrast(1.05)
    - Hover effect: saturate(1.4) brightness(1.25) contrast(1.08)
  - Added grid rendering during coin toss animation (drawGrid function)
  - File size: 1.7MB (up from 1.6MB)
  - Deployed to: https://lldh360.maegia.tv/

- **Meta Cataloger Phase 2 & 3 (Complete)**
  - **Phase 2: RPCD + LuCI**
    - RPCD backend: `luci.metacatalog` with 10 methods (list_entries, list_books, get_entry, get_book, search, get_stats, sync, scan, assign, unassign)
    - LuCI dashboard: KISS-themed overview with stats chips, virtual books shelf
    - HAProxy vhost scanner: Auto-indexes all HAProxy domains
    - ACL permissions for read/write operations
  - **Phase 3: Landing Page Enhancements**
    - Search functionality: Real-time filter across all entries
    - Tab navigation: Collections view, All entries view, per-book filters
    - Scrollable book entries with max-height
    - Link to LuCI dashboard in footer
    - Responsive grid layout
  - Deployed at: https://catalog.gk2.secubox.in/metacatalog/
  - Total entries: 246 (127 MetaBlogs, 14 Streamlits, 105 HAProxy)

- **Meta Cataloger - Virtual Books (Phase 1 Complete)**
  - New `secubox-app-metacatalog` package for unified content aggregation
  - Organizes MetaBlogizer sites, Streamlit apps into themed Virtual Books
  - CLI: `/usr/sbin/metacatalogctl` with sync/scan/index/books/search/status/landing
  - Scanners: MetaBlogizer (title, description, languages, colors, canvas/audio)
  - Scanners: Streamlit (from app.py and UCI config)
  - Auto-assignment: keyword + domain pattern matching to books
  - 6 default books: Divination, Visualization, Analytics, Publications, Security, Media
  - Landing page: Tao prism fluoro theme at `/www/metacatalog/index.html`
  - APIs: `/metacatalog/api/index.json`, `/metacatalog/api/books.json`
  - Initial sync: 120 entries (118 MetaBlogs, 2 Streamlits)
  - BusyBox-compatible: sed-based regex (no grep -P)
  - Cron: hourly auto-sync via `/etc/cron.d/metacatalog`

- **HAProxy Auto-Sync Mitmproxy Routes**
  - Fixed: New vhosts missing mitmproxy route entries causing 404 WAF errors
  - `haproxyctl vhost add/remove` now triggers `mitmproxyctl sync-routes`
  - Commit: 7cbd6406

- **CrowdSec Dashboard Performance Optimization**
  - **Problem**: `get_overview` RPC call was timing out (30s+), causing "TypeError: can't assign to property 'countries' on 5"
  - **Root cause**: Function made 12+ sequential `cscli` calls, each taking 2-5s with CAPI data
  - **Solution**: Pre-cached architecture with background refresh
    - Cache file: `/tmp/secubox/crowdsec-overview.json` (60s TTL)
    - `get_overview()` returns cached data instantly (0.08s)
    - `refresh_overview_cache()` runs via cron every minute
    - Background async refresh triggered when cache is stale
  - **Technical fixes**:
    - Reduced cscli calls from 12 to 4 (metrics, decisions, alerts, bouncers)
    - Extracted flat decisions array from nested alert structure using jsonfilter
    - Simplified alerts_raw to empty array (full alerts too large for ubus JSON)
    - Manual JSON building to avoid jshn argument size limits (BusyBox constraint)
    - Added `/etc/cron.d/crowdsec-dashboard` for periodic cache refresh
  - **Files modified**: `luci.crowdsec-dashboard` RPCD, Makefile
  - **Result**: Dashboard loads instantly, no more TypeError

- **Streamlit Control Dashboard Phase 3 (Complete)**
  - **Auto-refresh**: Toggle + interval selector on all main pages (10s/30s/60s)
  - **Permission-aware UI**: Hide/disable action buttons for SecuBox users (limited access)
  - **Containers page**: Tabs (All/Running/Stopped), search filter, improved info panels
  - **Security page**: Better CrowdSec status parsing, threat table with columns, raw data expander
  - **Streamlit apps page**: Restart button, delete confirmation dialog
  - **Network page**: HAProxy filter, vhost count stats, WireGuard/DNS placeholders
  - **Auth helpers**: `can_write()`, `is_admin()` functions for permission checks

- **CrowdSec Dashboard Bugfix**
  - Fixed: `TypeError: can't assign to property "countries" on 5: not an object`
  - Root cause: RPC error code 5 returned instead of object (transient service state)
  - Fix: Added type check in `overview.js` to treat non-objects as empty `{}`
  - Deployed fix to router, cleared LuCI caches

- **Streamlit Control Dashboard Phase 1 & 2 (Complete)**
  - Package: `secubox-app-streamlit-control` with Python ubus client
  - KISS-themed UI inspired by metablogizer design
  - 7 pages: Home, Sites, Streamlit, Containers, Network, Security, System
  - **Phase 2: RPCD Integration**
    - HTTPS connection with self-signed cert support
    - Dual auth: root (full access) + SecuBox users (read-only dashboard)
    - Updated ACL: `unauthenticated.json` allows dashboard data without login
    - Fixed LXC via `luci.secubox-portal.get_containers`
    - Fixed CrowdSec via `luci.crowdsec-dashboard.status`
    - All service status methods working (HAProxy, WAF, containers)
  - Deployed on port 8531, exposed at control.gk2.secubox.in
  - Test user: `testdash` / `Password123`

- **RezApp Forge - Docker to SecuBox App Converter (Complete)**
  - Package: `secubox-app-rezapp` with `rezappctl` CLI
  - UCI config: `/etc/config/rezapp` with catalog sources (Docker Hub, LinuxServer.io, GHCR)
  - Commands: catalog, search, info, import, convert, run, stop, package, publish, expose, list, cache
  - Docker to LXC workflow: pull → export → extract → generate LXC config
  - **Offline mode**: Convert from local tarball (--from-tar) or OCI directory (--from-oci)
  - **Runtime fallback**: Docker → Podman automatic fallback
  - **Network modes**: host (shared namespace), bridge (veth), none (isolated)
  - **ENV extraction**: Docker ENV vars → LXC environment + UCI config
  - **HAProxy integration**: `expose` command adds vhost + mitmproxy route
  - Templates: Makefile.tpl, init.d.tpl, ctl.tpl, config.tpl, start-lxc.tpl, lxc-config.tpl, manifest.tpl
  - **Tested**: Offline conversion from cached tarball, container runs successfully

- **Streamlit Forge Phase 1** (implemented)
  - Package: `secubox-app-streamlit-forge` with `slforge` CLI
  - UCI config for app management
  - 3 templates: basic, dashboard, data-viewer
  - Commands: create, start, stop, restart, status, list, info, delete, templates
  - Runs apps in Streamlit LXC container with proper mount paths
  - Port-based status detection (container PID namespaces)
  - HAProxy expose integration
  - Mesh catalog publish
  - **LuCI dashboard**: `luci-app-streamlit-forge` with create/start/stop/expose/publish

- **RezApp Forge LuCI**
  - Package: `luci-app-rezapp`
  - Dashboard with Docker search, conversion dialog
  - Converted apps table with Package/Publish/Delete
  - Status cards for apps count, catalogs, Docker status

- **SecuBox KISS Apps Catalog Update**
  - Added `luci-app-streamlit-forge` and `luci-app-rezapp` to catalog.json
  - Category: productivity (Streamlit), system (RezApp)
  - Featured in new_releases section
  - Total plugins: 37 → 39

- **HAProxy Vhost Rename Feature**
  - Added `haproxyctl vhost rename <old> <new>` command
  - Renamed MC360_Streamlit_BPM_v2.gk2.secubox.in → mc360.gk2.secubox.in

- **Lyrion Music Server Upgrade (9.0.3 → 9.1.1)**
  - Diagnosed library showing 0 tracks (Perl XS module version mismatches)
  - Root cause: Alpine 3.19 Perl 5.038 incompatible with bundled modules
  - **Solution**: Rebuilt LXC container from official Docker image
    - Pulled `lmscommunity/lyrionmusicserver:stable` (Debian Bookworm based)
    - Exported Docker to tarball, extracted to LXC rootfs
    - Created `/start-lxc.sh` wrapper for LXC execution
    - Updated LXC config: UID 499 (squeezeboxserver), new paths
    - Fixed /srv/lyrion ownership for new UID
  - Library scan working: 81,430 files discovered
  - Preserved config in /srv/lyrion (prefs, logs, cache)

- **Metablogizer Package Conflict**
  - opkg install fails: `/etc/config/metablogizer` file conflict
  - Both `secubox-app-metablogizer` and `luci-app-metablogizer` provide same file
  - Workaround: Deploy scripts directly via SCP instead of package install
  - TODO: Fix package to use conffiles properly

### 2026-03-10

- **PeerTube Routing Fix**
  - tube.gk2.secubox.in was serving Lyrion instead of PeerTube (port conflict)
  - Lyrion moved from port 9001 → 9000 (server.prefs)
  - PeerTube moved from port 9001 → 9002 (production.yaml)
  - Fixed PeerTube database hostname: 192.168.255.1 → 127.0.0.1 (internal PostgreSQL)
  - Updated mitmproxy routes for both services
  - Both services now accessible: tube.gk2.secubox.in, lyrion.gk2.secubox.in

- **Metablogizer Port Conflict Prevention**
  - Fixed duplicate port detection in `get_next_port()` to check both uhttpd and metablogizer configs
  - Added `check-ports` command: Scans all sites for duplicate port assignments
  - Added `fix-ports` command: Auto-assigns new ports to duplicates
  - Fixed 4 duplicate port conflicts:
    - santefr.gk2.secubox.in: 8991 → 9010
    - ganimed.maegia.fr: 9004 → 9011
    - magic.maegia.tv: 8991 → 9012
    - cybaxe.gk2.secubox.in: 9000 → 9004 (earlier fix)
  - Fixed Makefile: Added empty `Build/Compile` rule for shell-only package

- **magic.maegia.tv Full Publication**
  - DNS A record added via Gandi API (`dnsctl -z maegia.tv add A magic`)
  - Fixed ACME webroot path mismatch (`/var/www/acme-challenge`)
  - SSL certificate issued and installed
  - Fixed missing `luci_direct` HAProxy backend

- **HAProxy Container Recovery**
  - Diagnosed container startup failure (missing backend reference)
  - Added `luci_direct` backend to generated config

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

(No active tasks)

### 2026-03-15

- **Dual-Stream DPI Architecture (Phase 3 Complete)**
  - Architecture doc: `package/secubox/DUAL-STREAM-DPI.md`
  - **Phase 1 - TAP Stream**: tc mirred, flow-collector, dpi-dualctl CLI
  - **Phase 2 - MITM Double Buffer**: Enhanced dpi_buffer.py, LuCI dashboard
  - **Phase 3 - Correlation Engine + Integration**:
    - **Correlation Library** (`correlation-lib.sh`):
      - IP reputation tracking with score decay
      - Full context gathering (MITM, DPI, WAF)
      - CrowdSec decision checking and notification
      - Correlation entry builder with all stream context
    - **Enhanced Correlator** (`dpi-correlator v2`):
      - Watches WAF alerts, CrowdSec decisions, DPI flows
      - Auto-ban for high-reputation IPs (configurable threshold)
      - Notification queue for high-severity threats
      - CLI: correlate, reputation, context, search, stats
    - **LuCI Timeline View** (`timeline.js`):
      - Correlation timeline with event cards
      - IP context modal (MITM requests, WAF alerts)
      - Quick ban button with CrowdSec integration
      - Search by IP functionality
      - Stats: total, high-threat, banned, unique IPs
    - **RPCD Methods** (8 new):
      - get_correlation_stats, get_ip_context, get_ip_reputation
      - get_timeline, search_correlations
      - ban_ip, set_auto_ban
    - **UCI Config**: auto_ban, auto_ban_threshold, notifications, reputation_decay

---

## Next Up

### v1.0 Release Prep

1. **Remote ttyd Deployment** - Auto-install ttyd on mesh nodes
2. **Device Provisioning** - Use Config Vault export-clone for SecuBox replication

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
