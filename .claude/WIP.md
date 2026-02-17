# Work In Progress (Claude)

_Last updated: 2026-02-17 (v0.20.6 - Mailserver/Nextcloud/DNS fixes + WebRadio)_

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

- **Vortex DNS Firewall Phase 1** — DONE (2026-02-11)
  - Created `secubox-vortex-firewall` package for DNS-level threat blocking
  - Threat intel aggregator (URLhaus, OpenPhish, Malware Domains feeds)
  - SQLite blocklist database with domain deduplication
  - dnsmasq integration via sinkhole hosts file
  - ×47 vitality multiplier concept
  - CLI tool: `vortex-firewall intel/stats/start/stop`
  - RPCD handler with 8 methods for LuCI integration
  - Tested: 765 domains blocked from 3 feeds
  - **Next phases**: Sinkhole server (Phase 2), DNS Guard integration (Phase 3), Mesh threat sharing (Phase 4), LuCI dashboard (Phase 5)

- **Vortex DNS** - Meshed multi-dynamic subdomain delegation (DONE 2026-02-05)
  - Created `secubox-vortex-dns` package with `vortexctl` CLI
  - Master/slave hierarchical DNS delegation
  - Wildcard domain management (*.domain.com)
  - First Peek auto-registration of services
  - Gossip-based exposure config sync via secubox-p2p
  - Created `luci-app-vortex-dns` dashboard

### Just Completed (2026-02-17)

- **WebRadio LuCI App** — DONE (2026-02-17)
  - Added `luci-app-webradio` package from webradio-openwrt project
  - 7 LuCI JS views: overview, server, playlist, schedule, jingles, live, security
  - RPCD backend with 15+ methods
  - CrowdSec integration for Icecast abuse detection
  - Programming grid scheduler with jingle support
  - Live audio input via DarkIce (ALSA)
  - Source: https://github.com/gkerma/webradio-openwrt

- **SecuBox Cloner MochaBin LED Fix** — DONE (2026-02-17)
  - Added i2c LED blacklist to clone provision scripts
  - Prevents PCA955x I2C bus lockup on MochaBin devices
  - Three-method fix: kernel bootarg, module removal, LED trigger disable
  - Clone backup generator includes 00-disable-i2c-leds firstboot script
  - Successfully cloned moka1 from c3box with sysupgrade method

- **Mailserver Dovecot Permissions Fix** — DONE (2026-02-17)
  - Fixed startup permissions: login/token-login directories owned by root:dovenull
  - Remove stale auth-token-secret.dat on startup (prevents "compromised token" errors)
  - Fixed users file permissions in user_add/user_passwd functions (644 root:dovecot)
  - Password reset no longer breaks authentication
  - Released in v0.20.6

- **Nextcloud 31.0.14 Upgrade & Fixes** — DONE (2026-02-17)
  - Upgraded from 30.0.17 to 31.0.14
  - Fixed nginx 403 on /apps/* paths (removed overly aggressive location block)
  - Added cron job setup for background tasks (every 5 minutes)
  - All apps updated: mail, tasks, external, spreed/Talk

- **DNS Master POSIX Fix** — DONE (2026-02-17)
  - Fixed bump_serial() bash-specific syntax for busybox ash compatibility
  - del_record now works via RPCD (was failing with "arithmetic syntax error")
  - All DNS Master LuCI buttons tested and working

- **LXC Container Auto-Start** — DONE (2026-02-17)
  - Enabled lxc.start.auto for mailserver, roundcube, nextcloud
  - Containers now survive reboots

- **Mailctl Firewall Rules** — DONE (2026-02-17)
  - Updated cmd_firewall_setup() with UCI firewall rules
  - Input rules for WAN (ports 25, 143, 465, 587, 993)
  - Forward rules for WAN-to-LAN mailserver

### Just Completed (2026-02-16)

- **HexoCMS Multi-Instance Enhancement** — DONE (2026-02-16)
  - Added backup/restore commands to hexoctl
  - Added GitHub clone support (`hexoctl github clone <url> [instance] [branch]`)
  - Added Gitea push support (`hexoctl gitea push [instance] [message]`)
  - Added quick-publish command (clean + build + publish)
  - Added status-json and instance-list-json for RPCD
  - Enhanced RPCD handler with 15 new methods:
    - Instance: list_instances, create_instance, delete_instance, start_instance, stop_instance
    - Backup: list_backups, create_backup, restore_backup, delete_backup
    - Git: github_clone, gitea_push, quick_publish
  - Rewrote LuCI dashboard with KISS theme:
    - Multi-instance management with cards
    - Instance controls: start/stop, quick publish, backup, editor, preview
    - GitHub/Gitea clone modals
    - Backup table with restore/delete
    - Stats grid: instances, posts, drafts, backups
    - Quick actions: new instance, clone from GitHub/Gitea, new post, settings
  - Updated API with 12 new RPC declarations
  - Updated ACL with new permissions

- **DNS Master LuCI App** — DONE (2026-02-16)
  - Created `secubox-app-dns-master` with `dnsmaster` CLI
  - Commands: status, zone-list, zone-add, records-json, record-add/del, reload, check, backup
  - Created `luci-app-dns-master` with KISS dashboard
  - Zones table with Edit/Check/Backup, Records editor with type badges
  - Add Zone/Record modals, live polling, auto serial bump
  - Added to KISS nav Network category

- **Mailserver LuCI KISS Regeneration** — DONE (2026-02-16)
  - Complete rewrite of overview.js with KISS theme
  - Fixed IMAP hairpin NAT issue (hosts override in Nextcloud container)
  - Fixed port 143 detection in RPCD script
  - Stats grid, port cards, users/aliases tables, webmail card
  - Added to KISS nav Apps category

- **Nextcloud LXC Production Deploy** — DONE (2026-02-16)
  - Installed on c3box with Debian 12 LXC
  - Fixed nginx port conflict (80→8080) with HAProxy
  - Fixed PHP-FPM socket path (php8.2-fpm.sock)
  - Fixed nginx routing (rewrite to index.php for /apps/*)
  - HAProxy SSL configured: https://cloud.gk2.secubox.in
  - Mitmproxy routes updated for direct backend access

- **WAF Rules for Nextcloud & Roundcube** — DONE (2026-02-16)
  - Added 20 CVE-based rules to `/srv/mitmproxy/waf-rules.json`
  - Nextcloud: CVE-2023-49791, CVE-2024-22403, CVE-2024-37315, etc.
  - Roundcube: CVE-2024-37383, CVE-2023-5631, CVE-2020-35730, etc.
  - Common attack patterns: path traversal, XSS, SQLi, RCE

- **Mail Client Autoconfig** — DONE (2026-02-16)
  - DNS records: autoconfig.*, autodiscover.*, SRV for _imaps/_submission
  - Autoconfig XML at `/.well-known/autoconfig/mail/config-v1.1.xml`
  - Mozilla/Thunderbird format with IMAP (993/143) and SMTP (587/465)
  - HAProxy vhost and mitmproxy routes configured

- **Nextcloud Upgrade 31.0.14** — DONE (2026-02-16)
  - Upgraded from 30.0.17 → 31.0.14 via OCC updater
  - All apps updated: mail, tasks, external, spreed/Talk
  - Database schema migrations completed

- **Mailctl Firewall Rules Persistence** — DONE (2026-02-16)
  - Updated `cmd_firewall_setup()` with UCI firewall rules
  - Input rules for WAN (ports 25, 143, 465, 587, 993)
  - Forward rules for WAN-to-LAN mailserver
  - Rules persist across firewall restarts

### Recently Completed (2026-02-15)

- **HAProxy & Mitmproxy WAF Fixes** — DONE (2026-02-15)
  - Fixed HAProxy reload: copy config to `/etc/haproxy/` before signal
  - Fixed mitmproxy Host header preservation for OAuth compatibility
  - Reset WAF globally: removed `waf_bypass` from 70 vhosts/ACLs
  - All traffic now routes through mitmproxy for inspection
  - Committed: f3f6eb4e

- **PeerTube Email Configuration** — DONE (2026-02-15)
  - Configured SMTP with local mailserver (192.168.255.30:25)
  - Fixed STARTTLS self-signed cert error (disable_starttls: true)
  - Password resets and notifications working

- **Wazuh Agent Watchdog** — DONE (2026-02-15)
  - Added watchdog loop to check wazuh-agentd every 60 seconds
  - Auto-restarts service if process dies
  - Logs to `/var/log/wazuh-watchdog.log`
  - Committed: 851910e1

- **Streamlit Gitea Integration** — DONE (2026-02-15)
  - Auto-push on first upload confirmed working
  - Pushed 4 missing apps to Gitea (cineposter_fixed, pdf_slideshow, pharmacopoeia_secubox, wuyun_liuqi)
  - 18 apps now have Gitea repos
  - Fixed `secubox-evolution` repo privacy (was public → now private)
  - All Gitea repos now created with `private:true` by default

- **Mailserver gk2 Account Restoration** — DONE (2026-02-15)
  - Container was reinstalled on Feb 14, only admin@ was recreated
  - Restored gk2@secubox.in from backup (config-20260206-171132.tar.gz)
  - Same password hash preserved (no password change needed)
  - Note: Maildir was already empty in backup (emails lost before Feb 6)

- **Mitmproxy WAF Dashboard Data Path Fix** — DONE (2026-02-15)
  - Dashboard was showing 0 threats because RPCD read from `/srv/mitmproxy` (out)
  - Fixed to read from `/srv/mitmproxy-in` (WAF input instance)
  - Now displays correct stats: 997 threats today, 29 pending autobans
  - Updated: get_status, get_alerts, get_threat_stats, get_subdomain_metrics
  - Committed: 42d85c4d

- **PeerTube Transcoding Jobs Fix** — DONE (2026-02-15)
  - Videos were stuck with `waitTranscoding=true` and not showing in public listing
  - Root cause: Admin enabled "remote runners" for transcoding but no runners registered
  - `runnerJob` table had 6 jobs stuck in pending state (state=1)
  - Fix: Set `waitTranscoding=false` directly in database to make videos visible
  - Alternative fix (for future uploads): Disable remote runners in admin panel, use local ffmpeg

- **GK2 Hub Landing Page Subdomain URLs** — DONE (2026-02-15)
  - Previous version used redirect paths (`secubox.in/gk2/service`)
  - Updated `gk2hub-generate` to use direct subdomain URLs (`service.gk2.secubox.in`)
  - Added HAProxy vhost lookup for automatic subdomain detection
  - Added PeerTube, GoToSocial, Wazuh to Infrastructure section
  - 67 services now display with proper subdomain URLs

- **PeerTube Video Platform Package** — DONE (2026-02-15)
  - Created `secubox-app-peertube` package for self-hosted video streaming
  - LXC Debian Bookworm container with PostgreSQL 15, Redis 7, Node.js 18, FFmpeg
  - `peertubectl` CLI with 15+ commands: install/uninstall/update/start/stop/status
  - Live streaming support with RTMP port 1935
  - HAProxy integration with extended timeouts (3600s) for streaming
  - Emancipation workflow for public exposure
  - User management: create-user, reset-password, list-users
  - Backup/restore PostgreSQL database
  - UCI config: main, server, live, transcoding, storage, network, admin sections
  - Fixed: Redis ARM64-COW-BUG via `ignore-warnings` config
  - Fixed: Redis sentinel disabled (using standalone Redis)
  - Fixed: RTMPS disabled (no SSL keys needed)
  - Fixed: HAProxy waf_bypass=1 for proper OAuth routing

- **PeerTube LuCI Dashboard** — DONE (2026-02-15)
  - Created `luci-app-peertube` package
  - RPRD handler with 11 methods: status, start, stop, install, uninstall, update, logs, emancipate, live_enable, live_disable, configure_haproxy
  - Dashboard with install wizard, status display, service controls
  - Live streaming toggle with firewall integration
  - HAProxy configuration button
  - Emancipate form for public exposure
  - Logs viewer with refresh

- **Generative LuCI Tree** — DONE (2026-02-15)
  - Created `luci.secubox-portal` RPCD backend for dynamic component discovery
  - Three RPC methods: get_tree, get_containers, get_vhosts
  - Auto-discovers all installed `luci-app-*` packages and groups by category:
    - SecuBox Core, Security, Media & Streaming, Network & Proxy
    - Development & CMS, IoT & Home, AI & Communication, System & Management
  - Discovers LXC containers from `/srv/lxc/` with running state
  - Discovers HAProxy vhosts from UCI with domain/backend/ssl info
  - Updated `luci-tree.js` with:
    - Three tabs: LuCI Apps, Containers, Vhosts
    - Refresh button for live updates
    - Stats showing packages, containers, vhosts counts
    - Search functionality for filtering
  - ACL permissions for unauthenticated portal access

### Just Completed (2026-02-14)

- **mitmproxy WAF Wildcard Route Priority Fix** — DONE (2026-02-14)
  - Fixed wildcard route matching in `haproxy_router.py`
  - Issue: `.gk2.secubox.in` wildcard (port 4000) matched before specific routes like `apr.gk2.secubox.in` (port 8928)
  - Fix: Support both `*.domain` and `.domain` wildcard formats
  - Fix: Sort wildcards by length (longest/most specific first)
  - Added auto-reload: Routes file checked every 10 requests, reloads if modified
  - Updated `metablogizerctl` to use `mitmproxyctl sync-routes` instead of direct file manipulation
  - MetaBlogizer sites now properly routed through WAF

- **Wazuh SIEM LuCI Dashboard** — DONE (2026-02-14)
  - Created `luci-app-wazuh` package for unified Wazuh security monitoring
  - 4 views: Overview, Alerts, File Integrity, Agents
  - SysWarden-inspired 4-layer security visualization
  - RPCD handler (luci.wazuh) with 12 API methods
  - CrowdSec integration for threat correlation display
  - Full RPCD testing verified via ubus calls

- **MetaBlogizer SDLC Content Restoration** — DONE (2026-02-14)
  - sdlc.gk2.secubox.in was showing GK2 Hub template instead of original content
  - GK2 Hub generator had overwritten local index.html
  - Original "Les Seigneurs de La Chambre - Présentation Cinématique" preserved in git
  - Restored via `git checkout HEAD -- index.html`
  - Site now correctly displaying cinematic presentation content

- **Streamlit WebSocket WAF Bypass** — DONE (2026-02-14)
  - Streamlit apps use WebSockets which are incompatible with MITM proxy
  - Re-added `waf_bypass=1` to all 20 Streamlit apps
  - Apps now route directly through HAProxy without mitmproxy filtering
  - Trade-off: Streamlit apps bypass WAF for WebSocket compatibility

- **WAF Architecture Configuration** — DONE (2026-02-14)
  - WAF (mitmproxy) enabled for Streamlit apps and MetaBlogizer sites
  - WAF bypass for infrastructure: Jellyfin, Mail, Glances, GoToSocial, Webmail
  - Path ACLs (`/gk2/*`) bypass WAF - mitmproxy routes by host only
  - 38 path ACLs configured with `waf_bypass=1`
  - Architecture: HAProxy → mitmproxy (WAF) → Backend (filtered) or HAProxy → Backend (bypass)

- **C3BOX SDLC Full Service Verification** — DONE (2026-02-14)
  - Verified all 70 services across 12 zones on C3BOX dashboard
  - Zones: *.cybermind.fr (2), *.cybermood.eu (2), *.ganimed.fr (2), *.maegia.tv (19), *.secubox.in (29), *.sb.local (4), *.secubox.local (2)
  - 20 Streamlit apps, 15 MetaBlog sites, infrastructure services
  - 77 vhosts configured, 52 SSL certificates, 5 LXC containers running
  - All public services returning HTTP 200

- **Mitmproxy Routes Duplicate Fix** — DONE (2026-02-14)
  - Fixed duplicate entries in `/srv/mitmproxy-in/haproxy-routes.json`
  - `console.gk2.secubox.in` and `control.gk2.secubox.in` had duplicate routes
  - Second entry (port 8081) was overriding correct Streamlit ports (8501/8511)
  - Removed duplicates, verified correct routing

- **Service Backend Fixes** — DONE (2026-02-14)
  - `play.maegia.tv`: Changed backend from `mitmproxy_inspector` to `streamlit_yijing`
  - `client.gk2.secubox.in`: Enabled `pinafore_srv` server with health check
  - Added uhttpd instance on port 4002 for Pinafore static landing page

- **Glances System Monitor** — DONE (2026-02-14)
  - Installed `python3-pip` via opkg
  - Installed Glances 4.5.0.4 via pip3 with dependencies
  - Created dummy `webbrowser.py` module for headless operation
  - Started Glances web server on port 61208
  - https://glances.gk2.secubox.in now operational

- **GoToSocial Service Start** — DONE (2026-02-14)
  - Enabled GoToSocial in UCI config
  - Started LXC container via `gotosocialctl start`
  - https://social.gk2.secubox.in operational

### Just Completed (2026-02-13)

- **GoToSocial Fediverse Server** — DONE (2026-02-13)
  - Deployed GoToSocial v0.17.0 ActivityPub server
  - Direct execution mode (v0.18.0 has cgroup panics)
  - Domain: `social.gk2.secubox.in` with wildcard SSL
  - HAProxy exposure with backend to 192.168.255.1:8484
  - Admin user created and promoted
  - SQLite database, web assets configured
  - Live at https://social.gk2.secubox.in

- **Cloning Station Remote Device Management** — DONE (2026-02-13)
  - 6-tab tabbed interface: Overview, Remotes, Build, Console, History, Images
  - Remote device management via UCI and RPCD
  - SSH key authentication setup using dropbear
  - Network scan for discovering SecuBox devices
  - Remote status: hostname, model, version, uptime
  - Image upload and remote flash with token injection
  - sysupgrade with keep_settings option
  - 7 new RPCD methods: list_remotes, add_remote, remove_remote, remote_status, remote_upload, remote_flash, scan_network
  - Uses dropbear's dbclient for SSH (OpenWrt native)

- **Cloning Station Dashboard Enhancements** — DONE (2026-02-13)
  - 5-tab tabbed interface: Overview, Build, Console, History, Images
  - Build Progress UI: real-time log streaming, stage indicators, progress bar
  - Serial Console: port selection, live output, command input (requires stty)
  - Clone History: JSON-based tracking with timestamp/device/status
  - Image Manager: storage info, image details modal, delete/rename
  - 10 new RPCD methods added with ACL permissions

### Just Completed (2026-02-08 PM)

- **Vortex Hub Wildcard Routing** — DONE (2026-02-08)
  - HAProxy wildcard domain support (`*.gk2.secubox.in`)
  - Subdomain-to-path rewriting: `{sub}.gk2.secubox.in/x` → `/{sub}/x`
  - New `match_type` option: exact, suffix, regex
  - Vortex fallback backend with `X-Vortex-Node` headers
  - Prepares infrastructure for distributed mesh node publishing

- **Mitmproxy WAF Subdomain Metrics** — DONE (2026-02-08)
  - Track requests/threats per subdomain in `secubox_analytics.py`
  - New RPCD method: `subdomain_metrics`
  - Metrics: requests, threats, protocols, methods, status codes, top URIs, countries
  - LuCI dashboard shows subdomain metrics instead of alerts

- **RPCD luci.secubox Modular Refactor** — DONE (2026-02-08)
  - Split 2544-line monolithic handler into 14 modules
  - Thin dispatcher + `/usr/lib/secubox/rpcd.d/*.sh` modules
  - Modules: core, modules, profiles, snapshots, health, dashboard, appstore, state, network, feeds, skills, feedback, p2p
  - Shared utilities in `_common.sh`

- **HAProxy Backend IP Fixes** — DONE (2026-02-08)
  - Fixed all `127.0.0.1` → `192.168.255.1` in backend configs
  - Cleaned up duplicate vhosts and invalid IP:port backend formats
  - Fixed `presse.cybermood.eu` routing
  - Fixed `streamlit_evolution` stale config in container

- **GK2 Node Service Mapping** — DONE (2026-02-08)
  - Complete map of 10 published domains
  - 9 active backends documented
  - Wildcard certificate ready for mesh

- **HAProxy Path-Based ACL Routing** — DONE (2026-02-08/09)
  - Added `_add_path_acl()` function to haproxyctl for UCI `acl` sections
  - Support for path_beg, path_end, path, path_reg, path_dir match types
  - Path ACLs processed before vhost ACLs (higher priority)
  - Fixed http_request list handling to avoid duplicate output
  - **Pattern Length Sorting** (2026-02-09): ACLs now sorted by pattern length (longest first)
    - Two-phase: `_collect_path_acl()` + `_emit_sorted_path_acls()`
    - Ensures `/gk2/evolution` matches before `/gk2`
  - Apex domain routing: `secubox.in/gk2/**` instead of `*.gk2.secubox.in`
  - Tested: `/gk2`, `/gk2/evolution`, `/gk2/control` all routing correctly

- **Gandi DNS Secondary Setup** — DONE (2026-02-08)
  - Configured BIND master to allow zone transfers to Gandi (217.70.177.40)
  - Added `also-notify` and `notify yes` for automatic zone updates
  - Synced all BIND zone records to Gandi LiveDNS via API
  - Updated registrar nameservers to Gandi LiveDNS (ns-*.gandi.net)
  - DNS propagation verified: all A, MX, wildcard records resolving correctly
  - Architecture: Registrar → Gandi LiveDNS ← synced from → BIND master

### Just Completed (2026-02-06/08)

- **Evolution Dashboard Real-Time Commits** — DONE (2026-02-08)
  - New "🚀 Devel" tab with live GitHub commits (1-min cache)
  - Commits Today / This Week / Contributors / Stars metrics
  - Commit type distribution with color-coding (feat/fix/docs/refactor)
  - Recent commits with hash, message, author, relative time
  - Repository stats (forks, watchers, open issues)
  - Cyberpunk-themed commit cards with pulsing live indicator

- **Station Cloner/Deployer** — DONE (2026-02-08)
  - Host-side `secubox-clone-station.sh` with MOKATOOL integration for dual USB serial control
  - On-device `secubox-cloner` CLI for build/serve/token/export
  - First-boot provisioning script with partition resize and mesh join
  - Master-link clone tokens with auto-approve for seamless onboarding
  - Added `secubox clone` and `secubox master-link` CLI command groups
  - Full workflow: build image on master → TFTP serve → flash target → auto-join mesh

- **Cloning Station LuCI Dashboard** — DONE (2026-02-11)
  - Created `luci-app-cloner` package with KISS-style dashboard
  - Status cards: device type, TFTP status, token count, clone count
  - Quick actions: Build Image, Start/Stop TFTP, New/Auto-Approve Token
  - Clone images table with size and TFTP-ready indicator
  - Token management with delete functionality
  - U-Boot flash commands display when TFTP active
  - RPCD handler: 10 methods (status, list_images, list_tokens, list_clones, etc.)

- **System Hub KISS Rewrite** — DONE (2026-02-11)
  - Rewrote `luci-app-system-hub/overview.js` to KISS style
  - Self-contained inline CSS, no external dependencies
  - 6 status cards: Hostname/Model, Uptime, Services, CPU Load, Temperature, Health Score
  - 3 resource bars: Memory, Storage, CPU Usage
  - Quick Actions + Services table with running/stopped badges
  - 5-second live polling with data-stat DOM updates
  - Full dark mode support

- **SecuBox Dashboard KISS Rewrite** — DONE (2026-02-11)
  - Rewrote `luci-app-secubox/dashboard.js` to KISS style
  - Removed all external deps (secubox/api, secubox-theme, secubox/nav, secubox-portal/header)
  - Header chips, stats cards, health panel, public IPs, modules table, quick actions, alerts
  - 15-second live polling
  - Full dark mode support

- **HAProxy "End of Internet" Default Page** — DONE (2026-02-07)
  - Cyberpunk fallback page for unknown/unmatched domains
  - Matrix rain animation, glitch text, ASCII art SecuBox logo
  - Added `http-request` UCI option support in haproxyctl generator
  - Path rewriting via `http-request set-path` for static content
  - Backend validation rejects IP:port misconfiguration

- **CrowdSec Threat Origins Fix** — DONE (2026-02-07)
  - Fixed `[object Object]` display bug in Threat Origins widget
  - `parseCountries()` now handles array format `[{country, count}]`

- **CrowdSec Dashboard Cache System** — DONE (2026-02-06)
  - Created `/usr/sbin/secubox-crowdsec-collector` v4 background stats collector
  - Generates `/tmp/secubox/crowdsec-overview.json` every minute via cron
  - RPCD fast path: reads cache first, falls back to slow cscli calls if stale
  - Fixes dashboard loading times from 5-10s to <100ms

- **mitmproxy Local IP "Green Known"** — DONE (2026-02-06)
  - Patched secubox_analytics.py to skip threat logging for trusted local IPs
  - Local network traffic (192.168.x, 10.x, 172.16-18.x) no longer pollutes threats.log
  - Autoban still correctly targets only external IPs

- **Control Panel File Compatibility** — DONE (2026-02-06)
  - Fixed file naming mismatch (health.json vs health-status.json, etc.)
  - Created symlinks for compatibility
  - Created missing cache files (threat.json, netifyd.json)
  - Updated stats collector to maintain symlinks on each run

- **LED Fix & Double-Buffer Status Cache** — DONE (2026-02-07)
  - Removed mmc0 LED (was blocking heartbeat loop)
  - Added `status_collector_loop()` background daemon
  - Cache files: `/tmp/secubox/{health,threat,capacity}.json`
  - Fast readers for LED loop and dashboards (no subprocess calls)

- **MetaBlogizer KISS ULTIME MODE** — DONE (2026-02-07)
  - Added `metablogizerctl emancipate` command
  - One-command workflow: DNS + Vortex + HAProxy + SSL + Reload
  - DNS registration via dnsctl (Gandi/OVH based on availability)
  - Vortex DNS mesh publication
  - HAProxy vhost with SSL and ACME
  - Zero-downtime reload via SIGUSR2

- **Streamlit LuCI Dashboard Edit & Emancipate** — DONE (2026-02-06)
  - Added Edit button with modal code editor (base64 encoding)
  - Added Emancipate button with KISS ULTIME MODE workflow
  - RPCD: `get_source`, `save_source`, `emancipate`, `get_emancipation`
  - API + ACL updated

- **SecuBox Vhost Manager** — DONE (2026-02-06)
  - Created `secubox-vhost` CLI for subdomain management
  - External (*.gk2.secubox.in) and local (*.gk2.sb.local) domain support
  - UCI config for vhosts: console, control, metrics, crowdsec, factory, glances, play
  - Default landing page generation
  - Integrated into secubox-core daemon and firstboot

### Completed (2026-02-06)

- **AI Insights Dashboard** — DONE
  - Created `luci-app-ai-insights` - unified view across all AI agents
  - Security posture scoring (0-100) with factor breakdown
  - Agent status grid: Threat Analyst, DNS Guard, Network Anomaly, CVE Triage
  - Aggregated alerts from all agents
  - Actions: Run All Agents, AI Analysis, View Timeline
  - Links to LocalRecall memory dashboard

- **LocalRecall Memory System** — DONE
  - Created `secubox-localrecall` - persistent memory for AI agents
  - Categories: threats, decisions, patterns, configs, conversations
  - LocalAI integration for semantic search and AI summarization
  - Created `luci-app-localrecall` dashboard with add/search/summarize

- **Network Anomaly Agent** — DONE
  - Created `secubox-network-anomaly` with 5 detection modules
  - Bandwidth spikes, connection floods, port scans, DNS anomalies, protocol anomalies
  - LocalAI integration for AI-powered analysis
  - Created `luci-app-network-anomaly` dashboard

- **CVE Triage Agent** — DONE
  - Created `secubox-cve-triage` - AI-powered CVE analysis and vulnerability management
  - Architecture: Collector → Analyzer → Recommender → Applier
  - NVD API integration for CVE data
  - CrowdSec CVE alert correlation
  - LocalAI-powered impact analysis
  - Approval workflow for patch recommendations
  - Multi-source monitoring: opkg, LXC, Docker
  - Created `luci-app-cve-triage` dashboard with alerts, pending queue, risk score

- **Webmail Login 401 Issue** — RESOLVED
  - Root cause: `config.docker.inc.php` overrode IMAP host to `ssl://mail.secubox.in:993`
  - Docker container couldn't resolve domain or connect via SSL
  - Fix: Changed to use socat proxy at `172.17.0.1:10143` (plaintext, internal)
  - Updated `mailctl webmail configure` to use proxy instead of direct SSL

- **Mail Send 451 "Temporary lookup failure"** — RESOLVED (2026-02-06)
  - Root cause: Alpine Postfix uses LMDB, not BerkeleyDB hash maps
  - `virtual_alias_maps = hash:/etc/postfix/virtual` was invalid
  - Postfix chroot `/var/spool/postfix/etc/resolv.conf` was missing
  - Fix: Changed setup.sh to use `lmdb:` prefix and copy resolv.conf to chroot
  - Added `mailctl fix-postfix` command to repair existing installations

- **Mail Port Hijacking External Connections** — RESOLVED (2026-02-06)
  - Root cause: firewall.user DNAT rules had no interface restriction
  - ALL port 993/587/etc traffic was redirected to local mailserver
  - This blocked Thunderbird from connecting to external mail (ssl0.ovh.net)
  - Fix: Added `-i $WAN_IF` to only redirect inbound WAN traffic

- **Mail Ports 587/465/995 Not Listening** — RESOLVED (2026-02-07)
  - Root cause: Postfix master.cf missing submission/smtps entries
  - Dovecot 10-master.conf had pop3s commented out
  - `dovecot-pop3d` package not installed in container
  - Fix: Added `mailctl fix-ports` command to enable all mail ports
  - Also added password reset for mail users in LuCI dashboard

- **BIND Zone Returning Internal IP** — RESOLVED (2026-02-07)
  - Root cause: `/etc/bind/zones/secubox.in.zone` had 192.168.255.1 (internal) instead of public IP
  - External DNS queries returned non-routable internal IP
  - Fix: Updated zone file with public IP 82.67.100.75 for all records

- **IPv6 DNS Support** — DONE (2026-02-07)
  - Added AAAA records to BIND zone and Gandi DNS
  - IPv6: `2a01:e0a:dec:c4e0:250:43ff:fe84:fb2f`
  - Records: @, mail, ns0, ns1, wildcard

- **nftables Mail Forwarding Rules** — DONE (2026-02-07)
  - Root cause: nftables `forward_wan` chain blocked DNAT'd mail traffic
  - iptables DNAT worked but nftables dropped packets before forwarding
  - Fix: Added explicit accept rules for mail ports (25,143,465,587,993,995)
  - Added both IPv4 and IPv6 forwarding rules
  - Persisted in `/etc/firewall.user`

- **Postfix/Dovecot Maildir Path Alignment** — DONE (2026-02-07)
  - Root cause: Postfix delivered to `/home/vmail/$domain/$user/new/` but Dovecot looks in `~/Maildir/new/`
  - Emails were delivered but invisible in Roundcube
  - Fix in `container.sh`: Mount to `home/vmail`, virtual_mailbox_base = `/home/vmail`
  - Fix in `users.sh`: Create `$domain/$user/Maildir/{cur,new,tmp}` structure
  - Updated vmailbox format to include `Maildir/` suffix

- **Inbound Port 25 Blocked by Free ISP** — RESOLVED (2026-02-16)
  - Free ISP blocks inbound port 25 on residential lines
  - Outbound mail works, inbound from external fails
  - Workaround options: VPS relay, Mailgun/SendGrid, or contact Free support

### Just Completed

- **Unified Backup Manager** — DONE (2026-02-05)
  - Created `secubox-app-backup` CLI for LXC containers, UCI config, service data
  - Created `luci-app-backup` dashboard with container list, backup history
  - Gitea remote sync and mesh backup support
  - RPCD handler with 8 methods

- **Custom Mail Server** — DONE (2026-02-05)
  - Created `secubox-app-mailserver` - Postfix + Dovecot in LXC container
  - `mailctl` CLI: user management, aliases, SSL, mesh backup
  - Webmail (Roundcube) integration
  - Mesh P2P mail backup sync

- **DNS Provider Enhanced** — DONE (2026-02-05)
  - Added `dnsctl generate` - auto-generate subdomain A records
  - Added `dnsctl suggest` - name suggestions by category
  - Added `dnsctl mail-setup` - MX, SPF, DMARC records
  - Added `dnsctl dkim-add` - DKIM TXT record

- **Subdomain Generator Tool** — DONE (2026-02-05)
  - `secubox-subdomain` CLI for generative subdomain management
  - Automates: DNS A record + HAProxy vhost + UCI registration
  - Uses wildcard certificate (*.zone) for instant SSL
  - Quick-add shortcuts for common services (gitea, grafana, jellyfin, etc.)
  - Part of Punk Exposure infrastructure

### Recently Completed (2026-02-07)

- **Mesh Onboarding Testing** — VALIDATED
  - Token generation: POST `/api/master-link/token` with HMAC tokens + TTL
  - IPK download: GET `/api/master-link/ipk?token=` serves pre-built 12KB IPK
  - Dynamic IPK: `ml_ipk_generate` creates join packages on-the-fly
  - Join flow: request → approval → peer added at depth+1
  - Blockchain: `peer_approved` blocks recorded correctly
  - Threat Intel: 288 local IOCs, 67 threat_ioc blocks in chain

### Just Completed (2026-02-12)

- **HAProxy stats.js KISS Migration** — DONE (2026-02-12)
  - Rewrote Statistics dashboard to use KissTheme
  - Stats iframe, logs viewer with refresh
  - Removed CSS import via style element

- **HAProxy backends.js KISS Migration** — DONE (2026-02-12)
  - Rewrote Backends dashboard to use KissTheme
  - Backend cards with server lists, health check info
  - Add/edit server modals with quick service selector
  - Removed external dashboard.css dependency

- **HAProxy vhosts.js KISS Migration** — DONE (2026-02-12)
  - Rewrote Virtual Hosts dashboard to use KissTheme
  - Self-contained inline CSS, removed external dashboard.css
  - Add vhost form, vhosts table, edit modal, delete confirmation

- **InterceptoR LXC Detection Fix** — DONE (2026-02-12)
  - Changed from `lxc-ls --running` to `lxc-info -n mitmproxy -s`
  - More reliable container state detection
  - Fixed container name from `secbx-mitmproxy` to `mitmproxy`

### Just Completed (2026-02-11)

- **InterceptoR Services Dashboard** — DONE (2026-02-11)
  - Created `luci.services-registry` RPCD handler with 4 methods
  - Aggregates: HAProxy vhosts, Tor onions, mitmproxy instances, init.d services, LuCI apps, system metrics
  - Dynamic KISS dashboard with 5 tabs: Published, Proxies, Services, Dashboards, Metrics
  - Service emoji registry for visual identification
  - CrowdSec stats integration (alerts, bans)
  - 10-second live polling
  - Fixed `kiss-theme.js` singleton pattern for LuCI module loading

- **mitmproxy Multi-Instance Support** — DONE (2026-02-11)
  - Updated init.d script with `config_foreach start_instance instance`
  - Updated mitmproxyctl with `list-instances`, instance-aware `service-run/stop`
  - UCI config for dual instances: out (LAN→Internet), in (WAF/services)
  - Cloned containers: mitmproxy-out, mitmproxy-in
  - Documented in README.md

- **Cookie Tracker LuCI Dashboard** — DONE (2026-02-11)
  - Created `luci-app-cookie-tracker` with KISS theme
  - RPCD handler with 6 methods: status, list, report, block, unblock, classify
  - Category breakdown visualization (essential, functional, analytics, advertising, tracking)
  - Top trackers list with one-click blocking
  - Blocked domains display
  - 69 known tracker domains pre-loaded
  - mitmproxy addon linked for cookie capture

- **CDN Cache KISS Theme** — DONE (2026-02-11)
  - Rewrote overview.js with full KISS styling
  - Circular gauge for hit ratio
  - Stats grid, top domains table, 10s polling

- **IoT Guard Implementation** — DONE (2026-02-11)
  - Created `secubox-iot-guard` package for IoT device isolation and security
  - OUI-based classification with 100+ IoT manufacturer prefixes
  - 10 device classes with risk scoring (0-100)
  - Anomaly detection: bandwidth spikes, new destinations, port scans, time anomalies
  - Integration: Client Guardian (zones), MAC Guardian (L2), Vortex Firewall (DNS), Bandwidth Manager (QoS)
  - CLI: `iot-guardctl` with status/list/show/scan/isolate/trust/block/anomalies/cloud-map
  - Created `luci-app-iot-guard` with KISS-style dashboard
  - 4 views: Overview, Devices, Policies, Settings
  - RPCD handler with 11 methods + public ACL for unauthenticated access

### Next Up — Couche 1

1. **Guacamole Pre-built Binaries**
   - Current LXC build-from-source approach is too slow
   - Need to find/create pre-built ARM64 binaries for guacd + Tomcat

2. **Multi-Node Mesh Testing**
   - Deploy second SecuBox node to test real peer-to-peer sync
   - Validate bidirectional threat intelligence sharing

---

## Couche 2 — AI Gateway

### Recently Completed (2026-02-06)

- **DNS Guard AI Migration** — DONE (2026-02-06)
  - Created `secubox-dns-guard` daemon with 5 detection modules:
    - DGA (Domain Generation Algorithm) detection via entropy analysis
    - DNS tunneling/exfiltration detection
    - Rate anomaly detection (queries/min, unique domains/min)
    - Known bad domain matching against blocklists
    - TLD anomaly detection (suspicious TLDs, punycode/IDN)
  - LocalAI integration for intelligent threat analysis
  - Approval workflow: auto-apply or queue for review
  - Updated `luci-app-dnsguard` v1.1.0 with:
    - AI Guard tab with pending blocks approval
    - Real-time alerts panel
    - Domain analysis with AI
    - Detection module status display

- **LocalAI Multi-Channel Emancipation** — DONE (2026-02-06)
  - Exposed LocalAI via Punk Exposure:
    - Tor: `b7lmlfs3b55jhgqdwbn6unhjhlfflq6ch235xa2gsdvxe7toxcf7qyad.onion`
    - DNS/SSL: `localai.secubox.local`
    - mDNS: `_secubox._tcp.local` (mesh advertised)

- **Threat Analyst Agent** — DONE (2026-02-05)
  - Created `secubox-threat-analyst` autonomous threat analysis daemon
  - Rule generation for mitmproxy (Python), CrowdSec (YAML), WAF (JSON)
  - Approval workflow: auto-apply mitmproxy, queue CrowdSec/WAF
  - Created `luci-app-threat-analyst` with AI chatbot dashboard
  - RPCD handler with 10 methods for status, chat, rules, approval

- **Threat Analyst KISS Dashboard v0.1.0** — DONE (2026-02-05)
  - Regenerated LuCI dashboard following CrowdSec KISS template pattern
  - External CSS loading, baseclass.extend() API pattern
  - CVE alerts in System Health section
  - CVE column in threats table with NVD hyperlinks
  - AI Security Assistant chat interface

- **MCP Server Implementation** — DONE (2026-02-06)
  - Created `secubox-mcp-server` package with JSON-RPC 2.0 over stdio
  - 9 core tools: crowdsec.alerts/decisions, waf.logs, dns.queries, network.flows, system.metrics, wireguard.status, uci.get/set
  - 5 AI-powered tools (via LocalAI): ai.analyze_threats, ai.cve_lookup, ai.suggest_waf_rules, ai.explain_ban, ai.security_posture
  - Claude Desktop integration via SSH

### Next Up — v0.18 AI Components

1. ~~**DNS Guard Migration**~~ — DONE (2026-02-06)

2. ~~**LocalAI Upgrade → 3.9**~~ — DONE (2026-02-06)
   - Upgraded to v3.9.0 with Agent Jobs Panel and Memory Reclaimer
   - Updated README with complete CLI reference and model presets

---

## Couche 3 — MirrorNetworking

### Just Completed (2026-02-07)

- **MirrorNet Core Package** — DONE
  - Created `secubox-mirrornet` with 5 library modules:
    - `identity.sh` - DID-based identity (did:plc:<fingerprint>), keypair generation, signing
    - `reputation.sh` - Peer trust scoring (0-100), event logging, decay, ban thresholds
    - `mirror.sh` - Service mirroring, upstream management, HAProxy backend generation
    - `gossip.sh` - Enhanced gossip protocol, priority routing, deduplication, TTL-based forwarding
    - `health.sh` - Peer health monitoring, latency/packet loss, anomaly detection, alerts
  - `mirrorctl` CLI with 30+ commands
  - UCI config for roles (master/submaster/peer), reputation, gossip, mirror, health settings

- **MirrorNet Dashboard** — DONE
  - Created `luci-app-secubox-mirror` with RPCD handler (15 methods)
  - Identity card with DID, hostname, role, version
  - Peer reputation table with trust levels and reset action
  - Gossip protocol stats (sent/received/forwarded/dropped)
  - Health alerts panel with acknowledgment
  - Mirrored services table

- **SecuBox Identity Package** — DONE
  - Created `secubox-identity` standalone identity management
  - DID generation (did:plc:<fingerprint>) compatible with AT Protocol
  - Keypair management (HMAC-SHA256, Ed25519 fallback)
  - Key rotation with backup
  - Peer identity storage and resolution
  - Trust scoring integration
  - `identityctl` CLI with 25+ commands

- **P2P Intel Package** — DONE
  - Created `secubox-p2p-intel` for signed IOC sharing
  - Collector: CrowdSec, mitmproxy, WAF, DNS Guard sources
  - Signer: Cryptographic signing of IOC batches
  - Validator: Source trust, age, format validation
  - Applier: nftables/iptables/CrowdSec application
  - Approval workflow for manual review
  - `p2p-intelctl` CLI with 20+ commands

### MirrorNet Packages Summary (v0.19)

| Package | Status | Description |
|---------|--------|-------------|
| `secubox-mirrornet` | DONE | Core mesh orchestration, gossip, health |
| `secubox-identity` | DONE | DID-based identity, key management, trust |
| `secubox-p2p-intel` | DONE | IOC signed gossip, validation, application |
| `luci-app-secubox-mirror` | DONE | Dashboard for peers, trust, services |

### Master/Slave CDN Architecture (User Vision)

> "multipoint CDN for SSL dependencies, root/master with *.sb, xxx.sb slaved, first peek meshed, submastering/multimixslaving"

Target architecture for service mirroring:
1. **Root Master** owns wildcard domain `*.secubox.io` (or similar)
2. **Slave Nodes** get delegated subdomains (`node1.secubox.io`)
3. **First Peek** = service discovery auto-registers in mesh
4. **Mirror Cascade** = master pushes exposure config to slaves
5. **Submastering** = hierarchical delegation (master → submaster → slaves)

Required components:
- Dynamic DNS delegation with zone transfer
- Service mirroring via reverse proxy chaining
- Gossip-based exposure config sync
- Trust hierarchy with certificate delegation

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
| MCP Server | DONE |
| Threat Analyst | DONE |
| DNS Guard AI Migration | DONE |
| LocalAI 3.9 | DONE |
| LocalAI Emancipation | DONE (Tor + DNS + mDNS) |

### v1.0.0 Progress

| Item | Status |
|------|--------|
| Config Advisor | DONE |
| ANSSI CSPN Compliance | DONE |
| Remediation Engine | DONE |
| LuCI Dashboard | DONE |

### Just Completed (2026-02-07)

- **Config Advisor Package** — DONE
  - Created `secubox-config-advisor` - ANSSI CSPN compliance checking daemon
  - 7 check categories, 25+ security rules
  - Risk scoring (0-100) with grade (A-F) and risk level
  - Auto-remediation for 7 checks with dry-run mode
  - LocalAI integration for AI-powered suggestions
  - `config-advisorctl` CLI with 20+ commands

- **Config Advisor Dashboard** — DONE
  - Created `luci-app-config-advisor` - LuCI dashboard
  - Score display with grade circle and risk level
  - Compliance view by category with pass/fail/warn badges
  - Remediation view with apply/preview buttons
  - Settings for framework, weights, categories, LocalAI

### Certifications

- ANSSI CSPN: Config Advisor compliance tool DONE
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
