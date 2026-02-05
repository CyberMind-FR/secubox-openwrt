# Work In Progress (Claude)

## Active Threads

- **SMB/CIFS Remote Mount Manager**
  Status: DONE — package created (2026-02-04)
  Notes: New `secubox-app-smbfs` package with `smbfsctl` CLI, UCI config, init script, catalog entry.
  Integrates with Jellyfin and Lyrion media paths.

- **Jellyfin README**
  Status: DONE (2026-02-04)
  Notes: KISS READMEs created for both `secubox-app-jellyfin` and `luci-app-jellyfin`.

- **Glances Full System Monitoring**
  Status: COMPLETE (2026-02-04)
  Notes: LXC host bind mounts, Docker socket, fs plugin patch, hostname/OS identity.

- **Zigbee2mqtt LXC Rewrite**
  Status: COMPLETE (2026-02-04)
  Notes: Direct `/dev/ttyUSB0` passthrough, adapter `ezsp`→`ember`, `ZIGBEE2MQTT_DATA` env var.

## Strategic Documents Received

- `SecuBox_LocalAI_Strategic_Analysis.html` — AI Management Layer roadmap (LocalAI 3.9 + LocalAGI + MCP).
- `SecuBox_AI_Gateway_Hybrid_Architecture.html` — Hybrid Local/Cloud architecture (LiteLLM + Data Classifier + multi-provider).
- `SecuBox_MirrorNetworking_Paradigm_Reversal.html` — EnigmaBox autopsy → MirrorNet zero-central-authority architecture. Dual transport (WireGuard + Yggdrasil), VoIP E2E (Asterisk), Matrix/Conduit messaging, did:plc identity, P2P gossip threat intel, Mirror concepts (Threat Intel, AI Inference, Reputation, Config & Updates). New packages: secubox-mirrornet (v0.19), secubox-identity (v0.19), secubox-voip (v1.0), secubox-matrix (v1.0), secubox-p2p-intel (v0.19), yggdrasil-secubox (v1.1+), luci-app-secubox-mirror (v0.19). Crowdfunding target: 2027.

- **Domoticz IoT Integration**
  Status: DONE (2026-02-04)
  Notes: `luci-app-domoticz` created with RPCD handler, LuCI overview (status, MQTT, Z2M, HAProxy, mesh, logs).
  `domoticzctl` enhanced with `configure-mqtt`, `configure-haproxy`, `backup/restore`, `mesh-register`, `uninstall`.
  UCI config extended with mqtt, network, mesh sections. Catalog updated with LuCI package and IoT tags.

- **P2P App Store Emancipation**
  Status: DONE (2026-02-04)
  Notes: HTTP P2P package distribution across mesh peers.
  CGI endpoints: `/api/factory/packages`, `/api/factory/packages-sync`.
  RPCD methods: get_feed_peers, get_peer_packages, get_all_packages, fetch_package, sync_package_catalog, get_feed_settings, set_feed_settings.
  CLI commands: `secubox-feed peers/search/fetch-peer/fetch-any/sync-peers`.
  LuCI view: `packages.js` under MirrorBox > App Store.
  UCI config: `p2p_feed` section with share_feed, auto_sync, sync_interval, prefer_local.

- **RustDesk & Guacamole Remote Access**
  Status: PARTIAL (2026-02-04)
  Notes: `secubox-app-rustdesk` — WORKING: native hbbs/hbbr binaries from GitHub releases, auto-key generation.
  `secubox-app-guacamole` — DEFERRED: LXC build-from-source too slow; needs pre-built binaries or Docker approach.
  RustDesk deployed and tested on router (ports 21116-21117).

- **Development Status Widget**
  Status: DONE (2026-02-04)
  Notes: `devstatus.js` view under MirrorBox > Dev Status.
  - Generative/dynamic dashboard with real-time polling
  - Gitea commit activity and repository stats
  - MirrorBox App Store package counts (local/peer/unique)
  - Progress bar toward v1.0 (0-100%) with milestone tracking
  - 8 milestone categories with dynamic progress indicators
  Plan for later: cross-compile RustDesk binaries via toolchain.

- **Content Distribution System**
  Status: DONE (2026-02-04)
  Notes: `secubox-content-pkg` — auto-package Metablogizer sites and Streamlit apps as IPKs.
  Auto-publish hooks in metablogizerctl and streamlitctl.
  `secubox-feed sync-content` — auto-install content packages from mesh peers.
  P2P distribution: sites → HAProxy vhosts, Streamlit → service instances.

- **ksmbd Mesh Media Sharing**
  Status: DONE (2026-02-05)
  Notes: `secubox-app-ksmbd` package with `ksmbdctl` CLI, UCI config, pre-configured media shares.
  Commands: enable/disable/status/add-share/remove-share/list-shares/add-user/mesh-register.
  Default shares: Media, Jellyfin, Lyrion, Backup.

- **Chip Header Layout Port**
  Status: DONE (2026-02-05)
  Notes: `client-guardian` and `auth-guardian` overview.js updated to use `sh-page-header` chip layout.
  Shared CSS from `secubox/common.css`. Consistent with SecuBox dashboard design.

- **Navigation Component Refactoring**
  Status: DONE (2026-02-05)
  Notes: Unified navigation widget in `secubox/nav.js`.
  - `SecuNav.renderTabs()` now auto-inits theme and loads CSS (no more boilerplate in views).
  - `SecuNav.renderCompactTabs()` for nested modules (CDN Cache, CrowdSec, System Hub, etc.).
  - `SecuNav.renderBreadcrumb()` for back-navigation to SecuBox.
  - Updated module navs: cdn-cache, client-guardian, crowdsec-dashboard, media-flow, mqtt-bridge, system-hub.
  - Removed ~1000 lines of duplicate CSS from module nav files.

- **Monitoring UX Improvements**
  Status: DONE (2026-02-05)
  Notes: Empty-state loading and dynamic bandwidth units.
  - Empty-state overlay with animated dots during 5-second warmup.
  - Chart legend "Waiting" → "Live" transition.
  - `formatBits()` helper for network rates (Kbps/Mbps/Gbps).
  - Cyberpunk theme support for empty state.

## Next Up

1. Rebuild bonus feed with all 2026-02-04/05 changes (IPK files need rebuild).
   - Uncommitted: 91 IPK files in secubox-app-bonus/root/www/secubox-feed/
   - These are build artifacts that need SDK rebuild

## Known Bugs (Deferred)

- **Tor Shield / opkg conflict**: opkg downloads fail (`wget returned 4`) when Tor Shield is active. Direct `wget` to full URL works. Likely DNS/routing interference from Tor split-routing. To be fixed later.

## Blockers / Risks

- No automated regression tests for LuCI views; manual verification required after each SCP deploy.
- Glances + Zigbee2MQTT + SMB/CIFS source changes uncommitted in working tree.
- Strategic AI + MirrorNetworking documents noted but not yet implemented (v0.18+ roadmap).
