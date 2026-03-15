# SecuBox UI & Theme History

_Last updated: 2026-03-14 (Droplet Publisher)_

1. **Unified Dashboard Refresh (2025-12-20)**  
   - Dashboard received the "sh-page-header" layout, hero stats, and SecuNav top tabs.  
   - Introduced shared `secubox/common.css` design tokens.

2. **Modules & Monitoring Modernization (2025-12-24)**  
   - Modules view adopted the same header/tabs plus live chip counters.  
   - Monitoring cards switched to SVG sparkline charts with auto-refresh.

3. **Alerts + Settings Overhaul (2025-12-27)**  
   - Alerts page now mirrors the dashboard style, dynamic header chips, and filtering controls.  
   - Settings view gained the SecuNav tabs, chips, and shared design language.

4. **Theme Synchronisation & Deployment (2025-12-28)**  
   - All SecuBox views call `Theme.init()` to respect dark/light/system preferences.  
   - Navigation bar now darkens automatically for dark/cyberpunk themes.  
   - Monitoring menu entry simplified (no `/overview` shim) to prevent LuCI tab duplication.

5. **Router Deployment Notes**  
   - Use `secubox-tools/deploy-secubox-dashboard.sh` for view-only pushes.  
   - Use `secubox-tools/deploy-secubox-v0.1.2.sh` for RPCD/config updates.  
   - Always clear `/tmp/luci-*` after copying UI assets.

6. **SecuBox v0.5.0-A Polish (2025-12-29)**
   - Monitoring and Modules views drop legacy hero/filter UIs; all tabs now use SecuNav styling.
   - Help/Bonus page adopts the shared header, navbar entry, and chips.
   - Alerts buttons use `sh-btn` components; nav + title chips inherit theme colors.

7. **Multi-Instance Support (2026-01-20)**
   - CrowdSec LAPI port configuration fix for multi-instance deployments.
   - Streamlit and HexoJS gain multi-instance management support.
   - HAProxy enhanced with instance-specific configuration.

8. **HexoJS Build & Publish Integration (2026-01-21)**
   - Added LuCI interface for Gitea-based Hexo build and publish workflows.
   - Automated Git operations for static site generation.

9. **ARM64 Toolchain Build Requirement (2026-01-27)**
   - Discovered SIGILL crashes on ARM64 (MochaBin) due to LSE atomics in SDK-built Go binaries.
   - Documented requirement: Go/CGO packages (crowdsec, netifyd) MUST use full OpenWrt toolchain.
   - SDK produces binaries with LSE atomic instructions that crash on some Cortex-A72 CPUs.
   - Updated CLAUDE.md, secubox-tools/README.md with toolchain build rules.

10. **Documentation Regeneration (2026-01-27)**
    - README.md updated to v0.16.0 with all 38 modules categorized.
    - Added build requirement table distinguishing SDK vs toolchain builds.
    - secubox-tools/README.md updated to v1.1.0 with SDK vs toolchain guidance.

11. **Service Registry & HAProxy ACME v0.15.0 (2026-01-28)**
    - `service-registry`: Unified service aggregation dashboard with dynamic health checks, URL readiness wizard, public IP detection, and external port checks.
    - `haproxy`: Webroot ACME mode (no HAProxy restart), async cert workflow, auto-open firewall when publishing.
    - Menu reorganization: CrowdSec, Threat Monitor, Network Diagnostics, WireGuard all moved to LuCI Services menu.
    - `tor-shield`: Exit node hostname (reverse DNS), presets with immediate activation, excluded destinations for CDN/direct, master protection switch.
    - `network-tweaks`: AdGuard Home DNS control, CDN cache and WPAD proxy controls, cumulative impact counters for HAProxy vhosts/LXC/firewall.
    - `client-guardian`: Safe defaults, emergency clear, and safety limits.
    - `metablogizer`: Improved site creation and HAProxy integration.
    - Portal: HTTP health checks and speedtest integration.
    - CrowdSec: Dynamic LAPI port detection.
    - 30 commits, 15 feat / 12 fix / 3 refactor.

12. **App Store KISS Evolution & Dependency Cleanup (2026-01-29)**
    - Renamed `luci-app-secubox-bonus` to `secubox-app-bonus` (feeds-based architecture).
    - Implemented KISS Evolution for app store: feeds, profiles, skills, feedback system.
    - Stripped all libc/libubox/libubus/libuci dependencies from SecuBox packages.
    - Added `PKG_FLAGS:=nonshared` to prevent automatic libc dependency injection.

13. **P2P Hub & SecuBox Console (2026-01-30)**
    - `secubox-p2p`: Full P2P Hub with globe peer visualization, Hub Registry, Services Registry, parallel component sources, auto-self mesh, master deployment, DNS bridge, WireGuard mirror, Gitea repository creation, mesh backup, test cloning, gigogne distribution mode, and mDNS service publishing.
    - `secubox-console`: Linux host TUI frontend with CLI tools lexical reference.
    - `cdn-cache`: Added MITM SSL bump support for HTTPS caching.
    - `metablogizer`: Tor hidden service integration, DNS resolution fixes, permissions fixes.
    - `streamlit`: ZIP upload with selective tree extraction.
    - `crowdsec-dashboard`: Extensible theming system (later removed), UCI ubus permissions.
    - `secubox-core`: P2P Hub API and wizard-first menu.
    - `secubox-app-bonus`: Added `secubox-feed install all` command.
    - 40+ commits — largest single-day effort in project history.

14. **P2P MirrorBox & Factory Dashboard (2026-01-31)**
    - `secubox-p2p` v0.6.0: MirrorBox NetMesh Catalog with DNS federation, distributed mesh services panel, WAN IP and WireGuard tunnel redundancy, mDNS service publishing, REST API for mesh visibility.
    - `secubox-factory`: Unified dashboard with signed Merkle snapshots and HMAC-style signing for OpenWrt compatibility.
    - `portal`: KISS redesign with service categorization.
    - `crowdsec-dashboard`: KISS rewrite, console enrollment, CrowdSec theme integration, dynamic port/path detection.
    - `secubox-swiss`: Unified CLI tool for SecuBox operations.
    - `jitsi`: Jitsi Meet video conferencing integration.
    - `mitmproxy`: HAProxy backend inspection, token auth, enhanced threat detection analytics v2.0.
    - `secubox-core`: P2P mesh API endpoints for console discovery.

15. **KISS UI Rewrites & DNS Guard (2026-02-01)**
    - `streamlit`: KISS UI redesign with instances management, Gitea integration, and multiple upload bug fixes.
    - `metablogizer`: KISS UI redesign with backend status display.
    - `ollama`: KISS UI rewrite with model suggestions and thermal monitoring.
    - `netdiag`: Thermal monitoring integration.
    - `dnsguard`: New DNS Guard app with provider lookup methods.
    - `haproxy`: AdGuard Home detection, improved service discovery, reserved ports with listening verification.
    - `p2p`: Distributed catalog with Gitea sync and health probing.
    - `mitmproxy`: Enhanced threat patterns; moved to Security menu.
    - `network-tweaks`: Moved to Network menu.
    - `crowdsec-dashboard`: Nav path fixes, alerts/countries display fixes.
    - `wireguard-dashboard`: QR code generation fix.
    - `exposure`: Reserved ports with listening verification.

16. **WAF Auto-Ban & Security Hardening (2026-02-02)**
    - `waf`: Sensitivity-based auto-ban system with CrowdSec integration and comprehensive CVE detection patterns (including CVE-2025-15467).
    - `mitmproxy`: WAN protection mode for incoming traffic inspection; LAN transparent proxy disabled by default.
    - `simplex`: SimpleX Chat self-hosted messaging servers.
    - `crowdsec`: KISS setup simplification, CAPI enrollment status, restored working setup page.
    - `local-build`: Added missing toolchain package shorthands and feeds path fix.
    - WAF auto-ban statistics added to dashboards.

17. **Mesh Security & MAC Guardian (2026-02-03)**
    - `mac-guardian`: New WiFi MAC security monitor with DHCP lease protection for odhcpd.
    - `master-link`: Secure mesh onboarding with dynamic join IPK generation.
    - `security-threats`: KISS rewrite with mesh threat intelligence, LXC mitmproxy detection.
    - `p2p`: Decentralized threat intelligence sharing via mesh.
    - `tor-shield`: Server mode for split-routing with public IP preservation.
    - `wireguard-dashboard`: jshn bypass for QR code (argument size limit), peer private key persistence in UCI, server endpoint persistence.
    - `localai`: gte-small preset, RPC expect unwrapping and chat JSON escaping fixes.
    - `lyrion`: WAN access checkbox for firewall rules, networking fixes for device discovery.
    - `tools`: SecuBox image builder and sysupgrade scripts.
    - RPCD/LuCI frontend guidelines added to CLAUDE.md.
    - KISS READMEs added for all 46 remaining packages.

18. **New Packages & Exposure Redesign (2026-02-04)**
    - `jellyfin`: New media server package with LXC container, uninstall/update/backup, HAProxy integration, and LuCI actions.
    - `zigbee2mqtt`: Complete rewrite from Docker to LXC Alpine container.
    - `device-intel`: New device intelligence package with OUI emoji display (BusyBox compatibility fixes, SDK build pattern alignment).
    - `dns-provider`: New DNS provider management package.
    - `exposure`: KISS redesign with enriched service names, vhost integration, DNS domain sorting; toggle switch fix.
    - `streamlit`: Chunked upload to bypass uhttpd 64KB JSON limit, UTF-8 `.py` file upload fix, auto-install requirements from ZIP, non-standard filename support.
    - `crowdsec-dashboard`: Decisions list fix (wrong RPC expect key).
    - RPCD: BusyBox ash `local` keyword compatibility fix (wrap call handlers in function).
    - `glances`: Full host system visibility — LXC bind mounts for `/rom`, `/overlay`, `/boot`, `/srv`, Docker socket at `/run/docker.sock` (symlink loop fix), `@exit_after` fs plugin patch (multiprocessing fails in LXC), host hostname via `lxc.uts.name`, OpenWrt OS identity from `/etc/openwrt_release`, pre-generated `/etc/mtab` from host `/proc/mounts`.
    - `zigbee2mqtt`: Direct `/dev/ttyUSB0` passthrough (socat TCP bridge fails ASH protocol), adapter `ezsp`→`ember` (z2m 2.x), `ZIGBEE2MQTT_DATA` env var, `mosquitto-nossl` dependency.
    - `smbfs`: New SMB/CIFS remote mount manager package — UCI config, `smbfsctl` CLI (add/remove/mount/umount/test/status), auto-mount init script, credentials storage, Jellyfin+Lyrion integration, catalog entry.
    - `jellyfin`: KISS READMEs for both backend and LuCI packages.
    - `domoticz`: Rewrite from Docker to LXC Debian container with native binary from GitHub releases. LuCI dashboard with IoT integration status (Mosquitto, Zigbee2MQTT, MQTT bridge), service lifecycle, HAProxy, mesh P2P, logs. `domoticzctl` with `configure-mqtt` (auto Mosquitto+Z2M bridge), `configure-haproxy`, `backup/restore`, `mesh-register`, `uninstall`. UCI extended with mqtt/network/mesh sections. Catalog updated.
    - LXC cgroup2 fix: Added `lxc.tty.max`, `lxc.pty.max`, `lxc.cgroup2.devices.allow` for standard character devices, and `lxc.seccomp.profile` disable to fix terminal allocation failures on cgroup v2 systems. Applied to `streamlit` and `domoticz`.
    - `metablogizer`: Chunked upload to bypass uhttpd 64KB JSON limit (same pattern as Streamlit). Added `upload_chunk` and `upload_finalize` RPCD methods, binary file support via ArrayBuffer read.
    - `p2p`: P2P App Store Emancipation — decentralized package distribution across mesh peers.
      CGI API: `/api/factory/packages` (local catalog JSON), `/api/factory/packages-sync` (aggregated mesh catalog).
      RPCD: 7 new methods for peer packages, fetch, sync, feed settings.
      CLI: `secubox-feed peers/search/fetch-peer/fetch-any/sync-peers` commands.
      LuCI: `packages.js` view under MirrorBox > App Store with LOCAL/PEER badges, unified catalog, one-click fetch/install.
      UCI: `config p2p_feed` section with share_feed, auto_sync, sync_interval, prefer_local, cache_ttl.
    - `rustdesk`: New self-hosted RustDesk relay server package — pre-built ARM64 binaries from GitHub releases (hbbs/hbbr), auto-key generation, `rustdeskctl` CLI with install/status/keygen/logs/configure-firewall/mesh-register.
    - `guacamole`: New Apache Guacamole clientless remote desktop gateway — LXC Debian container with guacd + Tomcat, UCI-based connection management (SSH/VNC/RDP), `guacamolectl` CLI with install/add-ssh/add-vnc/add-rdp/list-connections/configure-haproxy.
    - `services.js`: Fixed RPC expect unwrapping bug causing empty local services list.
    - `content-pkg`: New content distribution system — `secubox-content-pkg` CLI packages Metablogizer sites and Streamlit apps as IPKs for P2P mesh distribution. Auto-publish hooks in metablogizerctl/streamlitctl. `secubox-feed sync-content` auto-installs content packages from peers. Sites get HAProxy vhosts, Streamlit apps run as service instances.
    - `devstatus.js`: New Development Status widget under MirrorBox > Dev Status — generative/dynamic dashboard with real-time polling, Gitea commit activity (15 recent commits), repository stats, MirrorBox App Store package counts (local/peer/unique), v1.0 progress bar (0-100%) with 8 milestone categories, color-coded completion indicators.

19. **ksmbd & UI Consistency (2026-02-05)**
    - `ksmbd`: New `secubox-app-ksmbd` mesh media server package — `ksmbdctl` CLI with enable/disable/status/add-share/remove-share/list-shares/add-user/mesh-register, UCI config with pre-configured shares (Media, Jellyfin, Lyrion, Backup), Avahi mDNS announcement, P2P mesh registration.
    - `client-guardian`: Ported to `sh-page-header` chip layout with 6 status chips (Online, Approved, Quarantine, Banned, Threats, Zones).
    - `auth-guardian`: Ported to `sh-page-header` chip layout with 4 status chips (Status, Sessions, Portal, Method), sessions table, quick actions card.

20. **Navigation Component Refactoring (2026-02-05)**
    - `secubox/nav.js`: Unified navigation widget with auto-theme initialization.
      - `renderTabs(active)`: Main SecuBox tabs with automatic Theme.init() and CSS loading.
      - `renderCompactTabs(active, tabs, options)`: Compact variant for nested modules.
      - `renderBreadcrumb(moduleName, icon)`: Back-navigation to SecuBox dashboard.
    - Eliminated ~1000 lines of duplicate CSS from module nav files.
    - Updated modules: `cdn-cache`, `client-guardian`, `crowdsec-dashboard`, `media-flow`, `mqtt-bridge`, `system-hub`.
    - Views no longer need to require Theme separately or manually load CSS.

21. **Monitoring UX Improvements (2026-02-05)**
    - Empty-state loading animation for charts during 5-second data collection warmup.
      - Animated "Collecting data..." overlay with pulsing dots.
      - Chart legend shows "Waiting" → "Live" transition.
      - Cyberpunk theme support for empty state styling.
    - Dynamic bandwidth units via new `formatBits()` helper.
      - Network rates now display in bits (Kbps/Mbps/Gbps) instead of bytes.
      - Uses SI units (1000 base) for industry-standard notation.
      - Dash placeholder ("— ↓ · — ↑") before first data point.

22. **Punk Exposure Emancipate CLI (2026-02-05)**
    - `secubox-exposure emancipate <service> <port> <domain> [--tor] [--dns] [--mesh] [--all]`
      - Unified multi-channel exposure: Tor + DNS/SSL + Mesh in single command.
      - Creates DNS A record via `dnsctl`, HAProxy vhost, requests certificate.
      - Publishes to mesh via `secubox-p2p publish`.
      - Stores emancipation state in UCI for status tracking.
    - `secubox-exposure revoke <service> [--tor] [--dns] [--mesh] [--all]`
      - Inverse of emancipate: removes exposure from selected channels.
      - Cleans up DNS records, HAProxy vhosts, certificates, mesh publishing.
    - Enhanced `status` command shows emancipated services with active channels.

23. **Punk Exposure LuCI Dashboard (2026-02-05)**
    - RPCD handler extended with three new methods:
      - `emancipate` - orchestrates multi-channel exposure via CLI
      - `revoke` - removes exposure from selected channels
      - `get_emancipated` - returns list of emancipated services with channel status
    - API wrapper (`exposure/api.js`) exports `emancipate()`, `revoke()`, `getEmancipated()`.
    - ACL updated in `luci-app-exposure.json` for new methods.
    - Dashboard UI enhancements:
      - New Mesh column with toggle switch (blue theme)
      - Emancipate button in header with rocket emoji
      - Multi-channel modal with Tor/DNS/Mesh checkboxes
      - Mesh badge count in header stats
    - CSS additions: `.exp-badge-mesh`, `.mesh-slider`, `.exp-btn-action`.

24. **Jellyfin Post-Install Setup Wizard (2026-02-05)**
    - 4-step modal wizard for first-time Jellyfin configuration.
    - RPCD methods added to `luci.jellyfin`:
      - `get_wizard_status` - checks container state and wizard completion
      - `set_wizard_complete` - marks wizard as finished in UCI
      - `add_media_path` / `remove_media_path` - manage media library entries
      - `get_media_paths` - returns configured media libraries
    - Wizard auto-triggers when installed but `wizard_complete=0`.
    - Steps: Welcome (Docker/container checks), Media (add paths), Network (domain/HAProxy), Complete.
    - New CSS file `jellyfin/wizard.css` with step indicators and form styling.
    - Makefile updated to install CSS resources.

25. **MAC Guardian Feed Integration (2026-02-05)**
    - Built and added `secubox-app-mac-guardian` and `luci-app-mac-guardian` IPKs to bonus feed.
    - Synced `luci-app-mac-guardian` to local-feed (backend was already synced).
    - Updated `apps-local.json` catalog with proper metadata:
      - `luci-app-mac-guardian`: category "security", icon "wifi", description "WiFi MAC address security monitor with spoofing detection"
      - `secubox-app-mac-guardian`: icon "wifi", description "WiFi MAC security backend with CrowdSec integration"
    - Package features: MAC spoofing detection, OUI anomaly detection, MAC floods, CrowdSec scenarios integration.

26. **Fanzine v3 Roadmap Alignment (2026-02-06)**
    - Restructured TODO.md and WIP.md to align with SecuBox Fanzine v3 4-layer architecture:
      - **Couche 1 — Core Mesh**: 35+ modules, v0.18 priorities, testing/validation, CVE Layer 7
      - **Couche 2 — AI Gateway**: Data Classifier, 6 Autonomous Agents, MCP Server, provider hierarchy
      - **Couche 3 — MirrorNetworking**: EnigmaBox → MirrorNet, dual transport, Services Mirrors, VoIP/Matrix
      - **Couche 4 — Roadmap**: v0.18/v0.19/v1.0/v1.1+ milestones, certifications (ANSSI, ISO, NIS2)
    - Added strategic reference to Fanzine v3 document.
    - Consolidated completed items under "Resolved" section.
    - Created version milestone checklists for tracking progress.

27. **LocalAI Upgrade to v3.9.0 (2026-02-06)**
    - Upgraded `secubox-app-localai` from v2.25.0 to v3.9.0.
    - New features in v3.9.0:
      - **Agent Jobs Panel**: Schedule and manage background agentic tasks via web UI and API
      - **Memory Reclaimer**: LRU eviction for loaded models, automatic VRAM cleanup
      - **VibeVoice backend**: New voice synthesis support
    - Updated README with complete CLI reference, model presets table, API endpoints.
    - Part of v0.18 AI Gateway roadmap (Couche 2).

28. **MCP Server Implementation (2026-02-06)**
    - Created `secubox-mcp-server` package — Model Context Protocol server for AI integration.
    - **Protocol**: JSON-RPC 2.0 over stdio, MCP version 2024-11-05.
    - **Core tools** (9 total):
      - `crowdsec.alerts`, `crowdsec.decisions` — CrowdSec threat intelligence
      - `waf.logs` — WAF/mitmproxy threat events
      - `dns.queries` — DNS statistics from AdGuard Home/dnsmasq
      - `network.flows` — Network traffic summary with interface stats
      - `system.metrics` — CPU, memory, disk, temperature monitoring
      - `wireguard.status` — VPN tunnel status with peer details
      - `uci.get`, `uci.set` — OpenWrt configuration access (set disabled by default)
    - **AI-powered tools** (5 total, require LocalAI):
      - `ai.analyze_threats` — AI analysis of CrowdSec alerts with recommendations
      - `ai.cve_lookup` — CVE vulnerability analysis with mitigation advice
      - `ai.suggest_waf_rules` — AI-suggested mitmproxy/WAF filter patterns
      - `ai.explain_ban` — Explain CrowdSec ban decisions in plain language
      - `ai.security_posture` — Full security assessment with scoring
    - **Security features**:
      - UCI-based tool whitelist — only allowed tools can be invoked
      - Sensitive data blocked in uci.get (password, secret, key, token)
      - uci.set disabled by default, requires explicit enable
      - Data classification support (local_only, sanitized, cloud_direct)
    - **Claude Desktop integration** via SSH:
      ```json
      {"mcpServers":{"secubox":{"command":"ssh","args":["root@192.168.255.1","/usr/bin/secubox-mcp"]}}}
      ```
    - Files: `secubox-mcp` main server, `protocol.sh` JSON-RPC handler, 8 tool modules.
    - Part of v0.18 AI Gateway roadmap (Couche 2).

29. **Threat Analyst Agent Implementation (2026-02-05)**
    - Created `secubox-threat-analyst` — AI-powered autonomous threat analysis and filter generation agent.
    - **Architecture**:
      - Collector: Gathers threats from CrowdSec, mitmproxy, netifyd DPI
      - Analyzer: LocalAI-powered intelligent analysis and pattern recognition
      - Generators: Rule creation for three targets
      - Appliers: Auto-apply or queue for approval
    - **Generated rule types**:
      - `mitmproxy`: Python filter class with IP blocklist, URL patterns, User-Agent detection
      - `CrowdSec`: YAML scenarios for AI-detected attack patterns
      - `WAF`: JSON rules for SQLi, XSS, path traversal, scanner detection
    - **CLI commands**: status, run, daemon, analyze, generate, gen-mitmproxy, gen-crowdsec, gen-waf, list-pending, approve, reject
    - **UCI configuration**: interval, LocalAI URL/model, auto-apply per target (mitmproxy auto, CrowdSec/WAF queued), min_confidence, max_rules_per_cycle
    - Created `luci-app-threat-analyst` — LuCI dashboard with AI chatbot.
    - **Dashboard features**:
      - Status panel: daemon state, LocalAI connectivity, threat counts
      - AI Chat: real-time conversation with threat analyst AI
      - Pending rules: approve/reject queue for generated rules
      - Threats table: recent security events with severity badges
    - **RPCD methods**: status, get_threats, get_alerts, get_pending, chat, analyze, generate_rules, approve_rule, reject_rule, run_cycle
    - Part of v0.18 AI Gateway roadmap (Couche 2).

30. **DNS Guard AI Migration (2026-02-06)**
    - Created `secubox-dns-guard` — AI-powered DNS anomaly detection daemon.
    - **Detection modules** (5 total):
      - `dga`: Domain Generation Algorithm detection via Shannon entropy analysis (threshold 3.2)
      - `tunneling`: DNS tunneling/exfiltration detection (subdomain length, base64/hex patterns, TXT rate)
      - `rate_anomaly`: Unusual query rate detection (queries/min, unique domains/min thresholds)
      - `known_bad`: Known malicious domain matching against external blocklists
      - `tld_anomaly`: Suspicious TLD detection (xyz, top, club, etc.) and punycode/IDN homograph detection
    - **LocalAI integration**:
      - Intelligent threat analysis and domain classification (BLOCK/MONITOR/SAFE)
      - Pattern analysis and malware family identification
      - Single domain analysis via CLI
    - **Approval workflow**:
      - Auto-apply mode for trusted detections
      - Queue mode for human approval (configurable per confidence threshold)
      - Pending blocks approval via CLI or LuCI
    - **CLI commands**: status, run, daemon, analyze, detect, check <domain>, stats, top-domains, top-clients, list-pending, approve/reject/approve-all
    - **UCI configuration**: interval, LocalAI URL/model, auto_apply_blocks, min_confidence (80%), max_blocks_per_cycle, per-detector settings
    - Updated `luci-app-dnsguard` to v1.1.0:
      - New "AI Guard" tab with daemon toggle, alert/pending/blocked counts
      - Pending blocks approval panel with approve/reject actions
      - Real-time alerts panel with type-colored badges
      - "Analyze" tab with domain checker and detection module status
      - RPCD extended with 11 new methods: guard_status, get_alerts, get_pending, approve_block, reject_block, approve_all, ai_check, get_blocklist, unblock, get_stats, toggle_guard
    - Part of v0.18 AI Gateway roadmap (Couche 2).

31. **LocalAI Multi-Channel Emancipation (2026-02-06)**
    - Exposed LocalAI (port 8091) via Punk Exposure system with 3 channels:
      - **Tor**: `b7lmlfs3b55jhgqdwbn6unhjhlfflq6ch235xa2gsdvxe7toxcf7qyad.onion`
      - **DNS/SSL**: `localai.secubox.local` via HAProxy with ACME certificate
      - **mDNS**: `_secubox._tcp.local` mesh advertisement via Avahi
    - Command: `secubox-exposure emancipate localai 8091 localai.secubox.local --all`
    - Documented MirrorNetworking vision for v0.19:
      - Master/slave hierarchical domain delegation (*.sb → xxx.sb)
      - Service mirroring via reverse proxy chaining
      - Gossip-based exposure config sync
      - Submastering/multimixslaving architecture

32. **Threat Analyst KISS Dashboard v0.1.0 (2026-02-05)**
    - Regenerated `luci-app-threat-analyst` following CrowdSec dashboard KISS template pattern.
    - **Architectural changes**:
      - `api.js`: Migrated from plain object to `baseclass.extend()` pattern
      - `dashboard.css`: External CSS file (loaded dynamically in view)
      - `dashboard.js`: View-only JS following CrowdSec pattern with `view.extend()`
    - **CVE integration**:
      - System Health: New "CVE Alerts" indicator with warning icon (yellow) when CVEs detected
      - Threats table: New CVE column with hyperlinks to NVD (`https://nvd.nist.gov/vuln/detail/CVE-XXXX-XXXXX`)
      - CVE extraction: `extractCVE()` function in API parses CVE-YYYY-NNNNN patterns from scenarios
      - CVE row styling: Red-tinted background for CVE-related threats
    - **RPCD updates**:
      - Status method now returns `cve_alerts` count from CrowdSec alerts
      - Fixed output bug (grep `|| echo 0` causing double output)
    - **CSS additions**:
      - `.ta-health-icon.warning` for CVE alerts in health section
      - `.ta-cve-link` for NVD hyperlinks (red badge style)
      - `.ta-cve-row` for highlighted CVE threat rows
    - Following LuCI UI Generation Model Template v0.1.0 for future KISS modules.

33. **Unified Backup Manager & Custom Mail Server (2026-02-05)**
    - Created `secubox-app-backup` — unified backup system for LXC containers, UCI config, service data.
      - **CLI commands**: create (full/config/containers/services), list, restore, status, cleanup
      - **Container ops**: container list/backup/restore/backups
      - **Profile ops**: profile list/create/apply/share (delegates to secubox-profile)
      - **Remote sync**: sync --push/--pull (Gitea integration)
      - **Libraries**: containers.sh, config.sh, remote.sh
      - **Storage structure**: /srv/backups/{config,containers,services,profiles}
    - Created `luci-app-backup` — LuCI dashboard for backup management.
      - **Status panel**: storage path, usage, last backup times
      - **Quick actions**: Full/Config/Containers backup buttons
      - **Container table**: name, state, size, backup count, backup button
      - **Backup history**: file, type, size, date (sorted by timestamp)
      - **RPCD methods**: status, list, container_list, create, restore, cleanup, container_backup, container_restore
    - Created `secubox-app-mailserver` — custom Postfix + Dovecot mail server in LXC container.
      - **mailctl CLI**: install, start/stop/restart, status
      - **User management**: user add/del/list/passwd, alias add/list
      - **SSL**: ssl-setup (ACME DNS-01), ssl-status
      - **DNS integration**: dns-setup (creates MX, SPF, DMARC via dnsctl)
      - **Mesh backup**: mesh backup/restore/sync/add-peer/peers/enable/disable
      - **Webmail integration**: webmail status/configure (Roundcube container)
      - **Libraries**: container.sh, users.sh, mesh.sh
    - Enhanced `dnsctl` with subdomain generation and mail DNS:
      - `generate <service> [prefix]` — auto-create subdomain A record with public IP
      - `suggest [category]` — subdomain name suggestions (web, mail, dev, media, iot, security)
      - `mail-setup [host] [priority]` — create MX, SPF, DMARC records
      - `dkim-add [selector] <pubkey>` — add DKIM TXT record
    - Renamed `secbx-webmail` Docker container to `secubox-webmail` for consistency.

34. **HAProxy/Mailserver LXC cgroup Fixes & Documentation (2026-02-06)**
    - Fixed HAProxy LXC container cgroup mount failure:
      - Removed `lxc.mount.auto = proc:mixed sys:ro cgroup:mixed` which fails on cgroup v2 hosts
      - Simplified to explicit `lxc.mount.entry` bind mounts only
      - Updated `haproxyctl` `lxc_create_config()` function with working config
    - Fixed Docker-to-LXC mailserver connectivity:
      - Added socat TCP proxies on ports 10143/10025 in mailserver init.d script
      - Configured Dovecot with `disable_plaintext_auth = no` for local connections
      - Roundcube can now reach LXC mailserver via host-bridged ports
    - Documentation updates:
      - Added "LXC container fails with cgroup:mixed" section to FAQ-TROUBLESHOOTING.md
      - Updated CLAUDE.md Session Startup section to include FAQ-TROUBLESHOOTING.md consultation
      - Key recommendation: avoid `lxc.mount.auto` entirely, use explicit bind mounts

35. **Vortex DNS - Meshed Subdomain Delegation (2026-02-05)**
    - Created `secubox-vortex-dns` — meshed multi-dynamic subdomain delegation system.
    - **Modes**:
      - **Master**: Owns wildcard domain (*.secubox.io), delegates subzones to slaves
      - **Slave**: Receives delegated subdomain from master (node1.secubox.io)
      - **Submaster**: Hierarchical delegation (master → submaster → slaves)
      - **Standalone**: Default mode, mesh-only participation
    - **CLI commands** (`vortexctl`):
      - Master: `master init <domain>`, `master delegate <node> <zone>`, `master revoke <zone>`, `master list-slaves`
      - Slave: `slave join <master> <token>`, `slave leave`, `slave status`
      - Mesh: `mesh sync`, `mesh publish <service> <domain>`, `mesh unpublish`, `mesh status`
      - Submaster: `submaster promote`, `submaster demote`
      - General: `status`, `daemon`
    - **Mesh integration**:
      - First Peek: Auto-registers new services in mesh DNS
      - Gossip-based exposure config sync via `secubox-p2p`
      - Published services tracked in `/var/lib/vortex-dns/published.json`
    - **DNS provider integration**:
      - Uses `dnsctl` from `secubox-app-dns-provider` for programmatic DNS record management
      - Auto-creates wildcard A record on master init
      - NS/A records for zone delegation
    - Created `luci-app-vortex-dns` — LuCI dashboard.
      - Status panel: mode badge, enabled state, sync interval, last sync time
      - Master section: wildcard domain, DNS provider, delegated slave count, zones table
      - Slave section: parent master, delegated zone
      - Mesh section: gossip state, First Peek, peer count, published services
      - Actions: Sync Mesh, Initialize as Master, Join as Slave, Delegate Zone
    - **RPCD methods**: status, get_slaves, get_peers, get_published, master_init, delegate, revoke, slave_join, mesh_sync, mesh_publish
    - Part of v0.19 MirrorNetworking roadmap (Couche 3).

36. **Network Anomaly Detection Agent (2026-02-06)**
    - Created `secubox-network-anomaly` — AI-powered network traffic anomaly detection.
    - **Detection modules** (5 total):
      - `bandwidth_anomaly`: Traffic spike detection via EMA baseline comparison
      - `connection_flood`: Connection count threshold monitoring
      - `port_scan`: Unique destination port enumeration detection
      - `dns_anomaly`: DNS query volume anomaly detection
      - `protocol_anomaly`: TCP/UDP ratio deviation (flags >50% UDP as suspicious)
    - **Data collection**:
      - Interface bandwidth from `/sys/class/net/*/statistics/`
      - Connection tracking from `/proc/net/nf_conntrack`
      - DNS queries from dnsmasq/AdGuard logs
    - **CLI commands** (`network-anomalyctl`):
      - `status`, `run`, `daemon` — service control
      - `analyze` — LocalAI-powered threat assessment
      - `list-alerts`, `ack <id>`, `clear-alerts` — alert management
      - `baseline [reset]` — EMA baseline control
    - **UCI configuration**:
      - Thresholds: bandwidth_spike_percent (200%), new_connections_per_min (50), unique_ports_per_host (20), dns_queries_per_min (100)
      - Detection flags: per-detector enable/disable
      - LocalAI integration: url, model, min_confidence (75%)
      - Auto-block: optional CrowdSec integration
    - Created `luci-app-network-anomaly` — LuCI dashboard.
      - Status panel: daemon state, LocalAI, alert count, connection count
      - Health checks: daemon, LocalAI, auto-block, interval, last run
      - Network stats: real-time RX/TX, connections, unique ports
      - Actions: Run Detection, AI Analysis, Reset Baseline, Clear Alerts
      - Alerts table: time, type, severity, message, ack button
    - **RPCD methods**: status, get_alerts, get_stats, run, ack_alert, clear_alerts, reset_baseline, analyze
    - Part of v0.19 AI Gateway roadmap (Couche 2).

37. **LocalRecall AI Memory System (2026-02-06)**
    - Created `secubox-localrecall` — persistent memory for AI agents.
    - **Memory categories**:
      - `threats`: Security threat patterns and detections
      - `decisions`: Agent decisions with outcomes (approved/rejected/auto)
      - `patterns`: Learned behavioral patterns
      - `configs`: Configuration snapshots and changes
      - `conversations`: AI conversation context
    - **Memory storage**:
      - JSON-based storage in `/var/lib/localrecall/memories.json`
      - EMA-based importance scoring (1-10)
      - Access tracking with timestamps and counts
      - Category-based indexing
    - **CLI commands** (`localrecallctl`):
      - `status`, `add`, `get`, `search`, `list`, `recent`, `important`
      - `delete`, `cleanup`, `export`, `import`
      - `summarize`, `context`, `stats`
    - **LocalAI integration**:
      - `summarize_memories()` — AI-powered memory summarization
      - `auto_memorize()` — Extract key facts from text
      - `get_agent_context()` — Build context for agent tasks
      - `record_decision()`, `record_threat()` — Structured memory helpers
    - **UCI configuration**:
      - Retention: max_memories (1000), retention_days (90)
      - Categories: enable/disable per category
      - Agents: enable/disable per agent
      - Cleanup: auto_cleanup, cleanup_hour, keep_important
    - Created `luci-app-localrecall` — LuCI dashboard.
      - Stats: total/threats/decisions/patterns counts
      - Categories panel with icons and counts
      - Agent breakdown panel
      - Actions: AI Summary, Search, Cleanup, Export
      - Add memory form with category, importance, content
      - Recent memories table with delete
    - **RPCD methods**: status, get_memories, search, stats, add, delete, cleanup, summarize, export, import
    - Part of v0.19 AI Gateway roadmap (Couche 2).

38. **AI Insights Dashboard (2026-02-06)**
    - Created `luci-app-ai-insights` — unified AI security insights dashboard.
    - **Security Posture Score**:
      - 0-100 score with color-coded display (Excellent/Good/Fair/Poor/Critical)
      - Dynamic factor calculation: LocalAI status, agent online counts, CrowdSec alerts, CVE severity
      - Real-time score updates via polling
    - **Agent Status Grid**:
      - Visual cards for 4 agents: Threat Analyst, DNS Guard, Network Anomaly, CVE Triage
      - Online/offline status with color indicators
      - Alert count badges per agent
    - **Aggregated Alerts**:
      - Unified view of alerts from all agents
      - Source-colored badges (rule/alert/cve)
      - Relative timestamps
    - **Actions**:
      - Run All Agents — triggers detection cycles on all agents
      - AI Analysis — LocalAI-powered security assessment with recommendations
      - View Timeline — security events from system log (24h)
      - Link to LocalRecall memory dashboard
    - **RPCD methods**: status, get_alerts, get_posture, get_timeline, run_all, analyze
    - Part of v0.19 AI Gateway roadmap (Couche 2).

39. **MirrorNet Core Packages (2026-02-07)**
    - Created `secubox-mirrornet` — mesh orchestration core with 5 library modules.
    - **Identity module** (`identity.sh`):
      - DID generation: `did:plc:<16-char-fingerprint>` (AT Protocol compatible)
      - HMAC-SHA256 keypair management with Ed25519 fallback
      - Key rotation with backup, identity document export/import
      - Peer identity storage and resolution
    - **Reputation module** (`reputation.sh`):
      - Trust scoring (0-100) with decay and ban thresholds
      - Event logging: sync_success/failed, valid/invalid_ioc, fast/slow_response, offline/online
      - Trust levels: excellent (80+), good (60+), moderate (40+), low (20+), untrusted
      - Ban threshold (default 10), min_trust threshold (default 20)
    - **Mirror module** (`mirror.sh`):
      - Service mirroring via reverse proxy chaining
      - Upstream management with priority-based failover
      - HAProxy backend configuration generation
      - Health check integration with automatic failover
    - **Gossip module** (`gossip.sh`):
      - Enhanced gossip protocol with priority routing (critical > high > normal > low > background)
      - TTL-based message forwarding with configurable max_hops (default 5)
      - Deduplication with 5-minute window
      - Message types: ioc, peer_status, config_sync, service_announce, mirror_update, reputation_update
    - **Health module** (`health.sh`):
      - Per-peer latency and packet loss monitoring
      - HTTP health checks with configurable endpoints
      - Anomaly detection against EMA baselines
      - Alert generation with acknowledgment workflow
    - **CLI** (`mirrorctl`): 30+ commands for identity, reputation, mirror, gossip, health, daemon
    - **UCI configuration**: roles (master/submaster/peer), gossip interval, health thresholds, mirror settings
    - Created `luci-app-secubox-mirror` — LuCI dashboard.
      - Identity card: DID, hostname, role, version
      - Status grid: peers, messages, services, alerts
      - Peer reputation table with trust levels and reset action
      - Gossip stats: sent/received/forwarded/dropped
      - Health alerts with acknowledgment
      - Mirrored services table
    - **RPCD methods**: status, get_identity, get_peers, get_reputation, get_health, get_mirrors, get_gossip_stats, get_alerts, reset_reputation, ack_alert, add_mirror, trigger_failover, broadcast
    - Part of v0.19 MirrorNetworking roadmap (Couche 3).

40. **SecuBox Identity Package (2026-02-07)**
    - Created `secubox-identity` — standalone DID identity management.
    - **Core module** (`core.sh`):
      - DID generation: `did:plc:<fingerprint>` from machine-id + MAC
      - Identity document creation (DID Document format with @context)
      - Peer identity import/export
      - Identity backup and restore
    - **Keys module** (`keys.sh`):
      - HMAC-SHA256 keypair generation (Ed25519 fallback if available)
      - Key rotation with configurable backup
      - Sign/verify operations
      - Key rotation check (configurable rotation_days: default 90)
    - **Trust module** (`trust.sh`):
      - Peer trust scoring (0-100)
      - Trust events: valid/invalid_signature, successful/failed_exchange, verified_identity, referred_by_trusted
      - Trust levels: verified, trusted, neutral, suspicious, untrusted
      - Ban functionality
    - **CLI** (`identityctl`): 25+ commands for DID, keys, peers, trust, backup
    - **UCI configuration**: did_method, key algorithm, rotation settings, trust thresholds

41. **P2P Intel Package (2026-02-07)**
    - Created `secubox-p2p-intel` — signed IOC sharing for mesh.
    - **Collector module** (`collector.sh`):
      - Source integrations: CrowdSec, mitmproxy, WAF, DNS Guard
      - Severity classification: critical, high, medium, low
      - Scenario-based severity mapping
    - **Signer module** (`signer.sh`):
      - Cryptographic signing of individual IOCs and batches
      - Batch hash verification (SHA256)
      - Identity integration for signer DID
    - **Validator module** (`validator.sh`):
      - Source trust verification (min_source_trust threshold)
      - Age validation (max_age_hours: default 168)
      - Format validation (IP, domain, URL, hash)
      - Local IP whitelist protection
    - **Applier module** (`applier.sh`):
      - Application methods: nftables (ipset), iptables, CrowdSec
      - Ban duration configuration (default 24h)
      - Approval workflow: auto-apply or queue for manual review
      - Pending queue management (approve/reject)
    - **CLI** (`p2p-intelctl`): 20+ commands for collect, sign, share, validate, apply, approve
    - **UCI configuration**: sources enable/disable, signing, validation settings, application method, auto-apply
    - **Daemon**: Configurable collect_interval (default 300s), auto_collect, auto_share, auto_apply
    - Part of v0.19 MirrorNetworking roadmap (Couche 3).

42. **Config Advisor - ANSSI CSPN Compliance (2026-02-07)**
    - Created `secubox-config-advisor` — security configuration analysis and hardening tool.
    - **ANSSI CSPN compliance framework**:
      - 7 check categories: network, firewall, authentication, encryption, services, logging, updates
      - 25+ security check rules with severity levels (critical, high, medium, low, info)
      - JSON rules database in `/usr/share/config-advisor/anssi-rules.json`
    - **Security check modules** (`checks.sh`):
      - Network: IPv6, management access restriction, SYN flood protection
      - Firewall: default deny policy, drop invalid packets, WAN port exposure
      - Authentication: root password, SSH key auth, SSH password auth
      - Encryption: HTTPS enabled, WireGuard configured, DNS encryption
      - Services: CrowdSec running, services bound to localhost
      - Logging: syslog enabled, log rotation configured
    - **Risk scoring module** (`scoring.sh`):
      - 0-100 score with severity weights (critical=40, high=25, medium=20, low=10, info=5)
      - Grade calculation (A-F) based on thresholds (90/80/70/60)
      - Risk level classification: critical, high, medium, low, minimal
      - Score history tracking and trend analysis
    - **ANSSI compliance module** (`anssi.sh`):
      - Compliance rate calculation (percentage of passing rules)
      - Report generation in text, JSON, and Markdown formats
      - Category filtering and strict mode
    - **Remediation module** (`remediate.sh`):
      - Auto-remediation for 7 checks: NET-002, NET-004, FW-001, FW-002, AUTH-003, CRYPT-001, LOG-002
      - Safe vs manual remediation separation
      - Dry-run mode for preview
      - LocalAI integration for AI-powered suggestions
      - Pending approvals queue
    - **CLI** (`config-advisorctl`):
      - Check commands: `check`, `check-category`, `results`
      - Compliance commands: `compliance`, `compliance-status`, `compliance-report`, `is-compliant`
      - Scoring commands: `score`, `score-history`, `score-trend`, `risk-summary`
      - Remediation commands: `remediate`, `remediate-dry`, `remediate-safe`, `remediate-pending`, `suggest`
      - Daemon mode with configurable check interval
    - Created `luci-app-config-advisor` — LuCI dashboard.
      - Dashboard: score circle, grade, risk level, compliance rate, last check time
      - Check results table with status icons
      - Score history table
      - Compliance view: summary cards, progress bar, results by category
      - Remediation view: quick actions, failed checks with apply buttons, pending approvals
      - Settings: framework selection, scoring weights, category toggles, LocalAI config
    - **RPCD methods**: status, results, score, compliance, check, pending, history, suggest, remediate, remediate_safe, set_config
    - **UCI configuration**: main (enabled, check_interval, auto_remediate), compliance (framework, strict_mode), scoring (passing_score, weights), categories (enable/disable), localai (url, model)
    - Part of v1.0.0 certification roadmap (ANSSI CSPN compliance tooling).

43. **Mail Server Port Fixes & Password Reset (2026-02-07)**
    - Fixed mail ports 587 (Submission), 465 (SMTPS), and 995 (POP3S) not listening.
    - **Root causes identified**:
      - Postfix master.cf missing submission and smtps service entries
      - Dovecot 10-master.conf had pop3s listener commented out
      - `dovecot-pop3d` package not installed in Alpine LXC container
    - **mailctl fix-ports command**:
      - Adds submission (587) service to Postfix master.cf with SASL auth
      - Adds smtps (465) service with TLS wrapper mode
      - Installs `dovecot-pop3d` if missing
      - Uncomments pop3/pop3s listeners in Dovecot 10-master.conf
      - Enables SSL on pop3s (995) and imaps (993) listeners
      - Restarts Postfix and Dovecot to apply changes
    - **LuCI password reset feature**:
      - Added "Reset Password" button in mail users table
      - Modal dialog with password and confirmation fields
      - RPCD `user_passwd` method with stdin JSON fallback
      - `callUserPasswd` RPC declaration in overview.js
    - **LuCI Fix Ports button**:
      - Added to Quick Actions section
      - RPCD `fix_ports` method wrapping CLI command
      - Visual feedback with modal spinner
    - Updated container.sh to include `dovecot-pop3d` in initial package list.

44. **MetaBlogizer KISS ULTIME MODE (2026-02-07)**
    - Added `metablogizerctl emancipate <name>` — one-command full exposure workflow.
    - **Workflow steps** (automated in sequence):
      - DNS Registration: Creates A record via `dnsctl` (Gandi/OVH based on availability)
      - Vortex Mesh: Publishes to mesh via `vortexctl mesh publish`
      - HAProxy: Creates backend, server, and vhost with SSL/ACME enabled
      - SSL Certificate: Requests ACME cert via `haproxyctl cert add` (webroot mode)
      - Zero-downtime Reload: Applies HAProxy config via SIGUSR2
    - **Helper functions**:
      - `_emancipate_dns()`: Public IP detection, subdomain extraction, dnsctl integration
      - `_emancipate_vortex()`: Mesh publication if vortex-dns enabled
      - `_emancipate_haproxy()`: UCI backend/server/vhost creation, haproxyctl generate
      - `_emancipate_ssl()`: ACME certificate request with status feedback
      - `_emancipate_reload()`: Graceful HAProxy reload with restart fallback
    - **Usage**: `metablogizerctl create myblog blog.example.com && metablogizerctl emancipate myblog`
    - **Tracking**: Stores `emancipated=1` and `emancipated_at` timestamp in UCI
    - Part of Punk Exposure architecture (multi-channel emancipation).

45. **LED Heartbeat & Vortex Dashboard Services (2026-02-06)**
    - Added LED heartbeat to `secubox-core` daemon for MochaBin RGB LEDs (led1).
    - **LED status indicators**:
      - Green flash: System healthy
      - Double red flash: Warning state (services down, high resource usage)
      - Long red flash: Error state
      - Blue flash: Boot/startup
    - **Configuration**:
      - `uci set secubox.main.led_heartbeat='1'` (enabled by default)
      - `uci set secubox.main.watchdog_interval='60'` (pulse every 60s)
    - **LED auto-detection**: Only activates if `/sys/class/leds/green:led1` exists.
    - **Vortex DNS dashboard enhancement**:
      - Added "Node Services" section showing published services
      - Displays domain links and vortex node URLs
      - Deduplicated service list with clickable links
    - Bumped `secubox-core` version to 0.10.0-r12.

46. **4-LED Status Dashboard (2026-02-06)**
    - Enhanced `secubox-core` with dedicated 4-LED status dashboard for MochaBin.
    - **LED assignments**:
      - `led1` (RGB): Global health status — green (healthy), yellow (warning), red (critical)
      - `led2` (RGB): Security threat level — green (safe), blue (activity), red (threats)
      - `led3` (RGB): Global capacity meter — color varies by CPU + network combined load
      - `mmc0`: Classic heartbeat — steady when stable, rapid blink on state changes
    - **Fast reactive loop**: 1.5-second heartbeat interval (down from 60s)
    - **Health scoring**: Combines services status, memory, disk usage
    - **Threat detection**: CrowdSec alerts + mitmproxy threat events
    - **Capacity monitoring**: Real-time CPU load + network throughput from `/proc`
    - Bumped `secubox-core` version to 0.10.0-r14.

47. **File Integrity Monitoring (2026-02-06)**
    - Created `secubox-integrity` — SHA256-based file integrity monitor.
    - **Monitored files**:
      - `/srv/haproxy/config/haproxy.cfg`
      - `/etc/config/haproxy`, `/etc/config/firewall`, `/etc/config/network`
      - `/etc/config/wireless`, `/etc/config/dropbear`
      - `/etc/passwd`, `/etc/shadow`
    - **CLI commands**: init, check, status, clear
    - **Cron integration**: Runs every 5 minutes via `/etc/cron.d/secubox-integrity`
    - **LED alert**: Triggers LED event pulse on file changes
    - **Logging**: System log and `/var/log/secubox/integrity.log`
    - Added to `secubox-core` Makefile with install rules.

48. **Custom Error Pages (2026-02-06)**
    - Created "End of the Internet" custom error page for HAProxy backend failures.
    - **Error pages generated**: 502, 503, 504 HTTP responses
    - **Design**: Full-page artistic "End of the Internet" message
    - **Location**: `/srv/haproxy/errors/{502,503,504}.http`
    - **Integration**: HAProxy serves custom pages for backend errors

49. **CrowdSec Dashboard Cache & Control Panel Fixes (2026-02-06)**
    - **CrowdSec Overview Collector v4**: Created `/usr/sbin/secubox-crowdsec-collector` for background stats collection.
      - Generates comprehensive JSON cache at `/tmp/secubox/crowdsec-overview.json`
      - Collects: service status, decisions (local + CAPI), alerts, bouncers, scenarios, GeoIP, LAPI/CAPI status
      - WAF stats: autoban status, sensitivity, bans today, threats today
      - Countries breakdown from alerts (top 10)
      - Uses jshn for valid JSON generation with subshell-safe array collection
      - Atomic writes with temp file + mv pattern
      - Cron entry: runs every minute
    - **RPCD Fast Path**: Patched `luci.crowdsec-dashboard` to read from cache first.
      - Cache freshness check (5 minute TTL)
      - Falls back to original slow cscli calls if cache stale/missing
    - **mitmproxy Local IP "Green Known"**: Patched `/data/addons/secubox_analytics.py` in mitmproxy container.
      - Skip threat logging for trusted local IPs (192.168.x.x, 10.x.x.x, 172.16-18.x.x, 127.x.x.x)
      - Local network traffic no longer pollutes threats.log
      - Autoban still correctly targets only external IPs
    - **Control Panel File Compatibility**: Fixed file naming mismatch.
      - Control Panel expected: health.json, crowdsec.json, mitmproxy.json
      - Collectors created: health-status.json, crowdsec-stats.json, mitmproxy-stats.json
      - Created symlinks for compatibility
      - Created missing files: threat.json, netifyd.json with proper structure
      - Updated stats collector to maintain symlinks on each run

50. **Local Mesh Domain Configuration (2026-02-07)**
    - Configured `.sblocal` as local mesh domain suffix for internal service discovery.
    - **DNS setup**: Added to dnsmasq local zones
    - **Host entries**: c3box.sblocal, evolution.sblocal, gk2.sblocal, gitea.sblocal, bazi.sblocal
    - **HAProxy vhosts**: HTTP vhosts for sblocal domains (no SSL, internal only)
    - **Purpose**: Local network service discovery without external DNS dependency
    - Enables LAN clients to access services via `<service>.sblocal`

51. **Evolution Streamlit Local Mirror (2026-02-07)**
    - Migrated Evolution dashboard from GitHub to local Gitea mirror.
    - **Source change**: `raw.githubusercontent.com` → `localhost:3001/gandalf/secubox-openwrt`
    - **Benefits**: Instant loading, no external dependency, works offline
    - **Cache TTL**: Reduced from 5 minutes to 1 minute for faster updates
    - **Gitea raw URL format**: `/raw/branch/master/<path>`

52. **LXC Container Stability & HAProxy Recovery (2026-02-07)**
    - **Root cause identified**: cgroup v2 incompatibility with `lxc.mount.auto = cgroup:mixed`
    - **Fix applied to ALL containers**: Removed `cgroup:mixed`, added cgroup v2 device permissions
    - **HAProxy fix**: Added `lxc.mount.auto = proc:mixed sys:ro` for /proc mount
    - **Containers fixed**: haproxy, streamlit, gitea, domoticz, glances, hexojs, lyrion, magicmirror2, mailserver, mitmproxy, picobrew, zigbee2mqtt
    - **HAProxy config regeneration**: Config was truncated to global/defaults only — regenerated full config with frontends/backends
    - **Streamlit apps restored**: Added `secubox_control:8511` to instances.conf, all 9 apps running
    - **Services confirmed operational**:
      - HAProxy: RUNNING with full SSL termination
      - Streamlit: 9 apps on ports 8501-8511
      - Gitea: RUNNING
      - CrowdSec: RUNNING
      - DNS (named): RUNNING
    - **External URLs verified**: gk2.secubox.in, evolution.gk2.secubox.in, control.gk2.secubox.in all returning HTTP 200

53. **Mailserver Postfix/Dovecot Maildir Path Alignment (2026-02-07)**
    - Fixed emails delivered but invisible in Roundcube webmail.
    - **Root cause**: Path mismatch between Postfix delivery and Dovecot mail_location.
      - Postfix delivered to: `/home/vmail/$domain/$user/new/`
      - Dovecot expected: `/home/vmail/$domain/$user/Maildir/new/`
    - **container.sh fixes**:
      - Changed mount point from `var/mail` to `home/vmail`
      - Changed `virtual_mailbox_base` from `/var/mail` to `/home/vmail`
      - Changed vmail user home from `/var/mail` to `/home/vmail`
    - **users.sh fixes**:
      - Create `$domain/$user/Maildir/{cur,new,tmp}` structure (was `$domain/$user/{cur,new,tmp}`)
      - Updated vmailbox entries to use `$domain/$user/Maildir/` suffix
    - Bumped `secubox-app-mailserver` version to 1.0.0-r2.
    - New mail verified delivering correctly to Maildir location.

54. **LED Fix & Double-Buffer Status Cache (2026-02-07)**
    - **LED mmc0 removed**: The 4th LED (mmc0) was causing the heartbeat loop to hang.
      - Removed `LED_MMC0` variable, `led_mmc0_heartbeat()` function, and mmc0 calls from loop
      - Now only 3 RGB LEDs controlled: led1 (health), led2 (threat), led3 (capacity)
    - **Double-buffer status caching**: Prevents blocking when multiple dashboards/APIs call status functions.
      - New `status_collector_loop()` runs in background, updates cache files atomically
      - Cache files: `/tmp/secubox/{health,threat,capacity}.json` with staggered intervals (15s/9s/3s)
      - Fast readers `get_health_score()`, `get_threat_level()`, `get_capacity()` — no subprocess calls
      - LED loop and dashboards/APIs now read from cache instantly
      - Uses atomic `mv` pattern for consistent reads during writes
    - Daemon starts status collector before LED loop for cache warmup.

55. **Triple-Pulse LED Heartbeat & Streamlit Emancipate (2026-02-06)**
    - **Triple-pulse LED heartbeat**: Organic "bump-bump-bump (pause)" pattern across RGB LEDs.
      - LED1 (health) leads, LED2 (threat) follows décalé, LED3 (capacity) trails
      - BusyBox-compatible: no fractional sleep, uses rapid burst + 3s rest
      - Intensity transitions (30-100%) create smooth cascade effect
    - **Avahi-publish fix**: Prevent duplicate processes via PID file tracking.
    - **Streamlit emancipate command**: KISS ULTIME MODE for full exposure workflow.
      - DNS A record (Gandi/OVH via dnsctl)
      - Vortex DNS mesh publication
      - HAProxy vhost with SSL + backend creation
      - ACME certificate request
      - Zero-downtime reload
      - Usage: `streamlitctl emancipate <app> [domain]`
    - **Evolution dashboard real-time upgrade**:
      - Auto-refresh with configurable intervals (30s/1m/2m/5m)
      - Real-time system metrics from double-buffer cache
      - Live console with debug level emojis (🔴🟠🟢🔵🟣)
      - Multiple log sources: SecuBox, Kernel, CrowdSec, System
    - **SecuBox Console app** (`secubox_console.py`):
      - Dedicated real-time console with 5s auto-refresh
      - Cyberpunk theme with metric cards
      - Live at: https://console.gk2.secubox.in/
    - **Commits**: 301dccec, a47ae965, 22caf0c9, aab58a2b, 7b77f839

56. **Vortex DNS Firewall Phase 1 (2026-02-11)**
    - Created `secubox-vortex-firewall` package — DNS-level threat blocking with ×47 multiplier.
    - Threat intel aggregator downloading from 3 feeds:
      - URLhaus (abuse.ch) — ~500 malware domains
      - OpenPhish — ~266 phishing domains
      - Malware Domains — additional malware list
    - SQLite-based blocklist database with domain deduplication.
    - dnsmasq integration via sinkhole hosts file (`/etc/dnsmasq.d/vortex-firewall.conf`).
    - ×47 vitality multiplier concept: each DNS block prevents ~47 malicious connections (C2 beacon rate × infection window).
    - CLI tool (`vortex-firewall`): intel update/status/search/add/remove, stats, start/stop/status.
    - RPCD handler with 8 methods: status, get_stats, get_feeds, get_blocked, search, update_feeds, block_domain, unblock_domain.
    - Fixed subshell issue with `pipe | while` by using temp files for jshn output.
    - Tested with 765 blocked domains across 3 threat feeds.

57. **Streamlit LuCI Dashboard Edit & Emancipate (2026-02-06)**
    - Added **Edit button** to Streamlit Apps table for editing app source code:
      - RPCD methods: `get_source`, `save_source` with base64 encoding
      - Modal code editor with syntax highlighting (monospace textarea)
      - Backup creation before save
    - Added **Emancipate button** for KISS ULTIME MODE exposure:
      - RPCD methods: `emancipate`, `get_emancipation`
      - Multi-channel modal showing DNS + Vortex + HAProxy + SSL workflow
      - Pre-check for existing instance (requires port for exposure)
      - Tracks emancipation status in UCI
    - Updated `streamlit/api.js` with 4 new API methods
    - Updated ACL permissions in `luci-app-streamlit.json`

57. **Fabricator Embedder & Service Profile Watchdog (2026-02-06)**
    - **Fabricator Embedder Tab**: Added 7th tab "🪟 Embedder" for creating unified portal pages.
      - Embeds Streamlit apps, MetaBlogizer sites, and custom URLs in single page
      - Three layouts: Grid (iframe grid), Tabs (tab-switching), Sidebar (navigation panel)
      - Auto-fetches available services from JSON endpoints
      - Deploys HTML portal to /www
    - **Service Profile Snapshot** (`/usr/sbin/secubox-profile-snapshot`):
      - `snapshot`: Captures current enabled/running services to UCI config
      - `check`: Returns JSON status comparing current vs expected
      - `watchdog`: Attempts to restart failed services
      - `list`: Displays profile with current status
      - Monitors: Core services (5), LXC containers (3), Streamlit apps (11), MetaBlogizer sites (14)
    - **Heartbeat Status** (`/usr/sbin/secubox-heartbeat-status`):
      - Returns JSON health score (0-100) with level (healthy/warning/critical)
      - Resource metrics: CPU load, memory %, disk %
      - Service counts: up/down
      - Exported to `/tmp/secubox/heartbeat.json` and `/www/heartbeat.json`
    - **Cron Integration**:
      - Watchdog runs every 5 minutes to auto-restart failed services
      - Heartbeat updates every minute for LED/dashboard status
    - **Fabricator Emancipation**: Published at https://fabric.gk2.secubox.in

58. **SecuBox Vhost Manager (2026-02-06)**
    - Created `secubox-vhost` CLI for subdomain management in secubox-core:
      - Manages external (`*.gk2.secubox.in`) and local (`*.gk2.sb.local`) domains
      - Commands: init, set-domain, list, enable, disable, add, sync, landing, dnsmasq
      - Generates dnsmasq config for local wildcard resolution
      - Creates HAProxy vhosts for both external and local domains
      - Generates default landing page at `/www/secubox-landing.html`
    - Added UCI config section for domain and vhost management:
      - `config domain 'external'` - base domain, wildcard settings
      - `config domain 'local'` - local domain suffix (default: sb.local)
      - `config vhost` sections for: console, control, metrics, crowdsec, factory, glances, play
    - Integrated into secubox-core daemon startup (vhost init after 5s delay)
    - Added to uci-defaults for firstboot initialization
    - Updated Makefile to install `secubox-vhost` script

59. **HAProxy "End of Internet" Default Page & http-request Support (2026-02-07)**
    - **End of Internet Page** (`/www/end-of-internet.html`):
      - Cyberpunk-style fallback page for unknown/unmatched domains
      - Animated matrix rain effect, glitch text, ASCII art logo
      - Real-time packet counter animation
      - Displays "REALITY NOT FOUND" error for unregistered domains
      - Fetches live stats from `/secubox-status.json` if available
    - **HAProxy Generator Enhancements** (`haproxyctl`):
      - Added `http-request` UCI option support for backends
      - Supports both single value and list of http-request directives
      - Static backends (http-request return) skip server config
      - Path-rewriting backends (http-request set-path) include servers
      - Backend validation: rejects IP:port format in backend names
    - **Default Backend Configuration**:
      - Set `end_of_internet` as default_backend for both HTTP and HTTPS frontends
      - Uses http-request set-path to serve /end-of-internet.html via uhttpd
      - Deployed page to /srv/haproxy for container access
    - **Commits**: e25509cb (backend validation), this session (http-request support)

60. **CrowdSec Dashboard Threat Origins Fix (2026-02-07)**
    - Fixed `[object Object]` display bug in Threat Origins widget
    - `parseCountries()` now correctly handles countries as array of objects
    - Data format: `[{country: "US", count: 67}, ...]` vs plain `{US: 67}`
    - Commit: 58b6dc1d

22. **Stats Evolution & Fabricator (2026-02-07)**
    - Silenced CrowdSec kernel log spam (deny_log=0 in bouncer config)
    - Added metablogizer-json to cron for blog site status updates
    - Created Widget Fabricator Streamlit app (port 8520): Collectors, Apps, Blogs, Services, Widgets
    - Added bot whitelist to mitmproxy WAF (Facebook, Google, Bing, etc.) to prevent false positive SSRF alerts
    - Fixed Streamlit ZIP upload with extract_zip_flatten() for nested root directories
    - Emancipated yijing-360 and fabricator apps with DNS + SSL
    - **Fabricator Live Data Update**: All pages now use actual UCI configs and JSON cache files
      - Collectors: shows real scripts, JSON cache with run/view buttons
      - Apps: live UCI streamlit instances with test/restart/open
      - Blogs: reads metablogizer sites from UCI with test/rebuild/expose
      - Services: real HAProxy vhosts/backends from UCI
      - Widgets: reads /tmp/secubox/*.json with live stats display
    - Commit: bfd2ed7c

23. **La Livrée d'Hermès Gallery (2026-02-07)**
    - Deployed lldh.gk2.secubox.in with full 82-image gallery
    - Added YouTube background music embed with autoplay/loop
    - Toggle button (🎵) for mute/unmute control
    - Multi-domain SSL: added lldh.ganimed.fr (OVH DNS) as secondary domain
    - Both domains share same backend (metablog_lldh on port 8914)

24. **Stats Evolution Plan Complete (2026-02-07)**
    - **Phase 1**: Stats infrastructure with 17 JSON cache files, cron collectors
    - **Phase 2**: Landing page JSON symlinks for gk2.secubox.in access
    - **Phase 3**: Widget Fabricator with live UCI/JSON data on all pages
    - **Phase 4**: Full integration - Fabricator in landing page instances
    - All JSON endpoints verified: streamlit-instances, metablogizer-sites, secubox-status, heartbeat

25. **yijing360 Deployment (2026-02-07)**
    - Fixed port conflict: console (8515), yijing360 (8521)
    - Deployed yijing-360.zip with generator.py
    - Emancipated: yijing360.gk2.secubox.in with SSL

26. **HAProxy Multi-Certificate SNI Fix (2026-02-07)**
    - Fixed multi-domain SSL certificate handling using `crt-list` instead of directory mode
    - Added `generate_certs_list()` function in haproxyctl to create certs.list from .pem files
    - Updated `haproxy-sync-certs` to regenerate certs.list after syncing ACME certs
    - HTTPS frontend now uses `crt-list /opt/haproxy/certs/certs.list` for reliable SNI matching
    - Each certificate's SANs and CN are extracted to create explicit domain-to-cert mappings
    - Fallback to directory mode if certs.list doesn't exist (backwards compatible)

27. **HAProxy Backend IP Fix (2026-02-07)**
    - Fixed localhost (127.0.0.1) usage in HAProxy backends - must use 192.168.255.1 (host bridge IP)
    - HAProxy runs in LXC container, cannot reach host services via 127.0.0.1
    - Added auto-conversion in RPCD handler: 127.0.0.1/localhost → 192.168.255.1
    - Fixed CLI tools: secubox-exposure, jellyfinctl, jitsctl, simplexctl, secubox-subdomain
    - Fixed Fabricator Streamlit Services page backend creation
    - Fixed HAProxy config templates for jitsi

28. **Station Cloner/Deployer Implementation (2026-02-08)**
    - Created `secubox-tools/secubox-clone-station.sh` — host-side cloning orchestrator for dual USB serial.
      - Commands: detect, pull, flash, verify, clone (full workflow), console, uboot, env-backup
      - Integrates with MOKATOOL (`mochabin_tool.py`) for serial console automation
      - Uses ASU API (firmware-selector.openwrt.org) for building clone images
      - TFTP serving for network boot with auto-generated U-Boot commands
    - Created `secubox-core/root/usr/sbin/secubox-cloner` — on-device clone manager CLI.
      - Commands: build, serve, token, status, list, export
      - Builds ext4 images for same device type (required for partition resize)
      - Generates clone provision scripts for TFTP download
      - Integrates with master-link for mesh join tokens
    - Created `secubox-core/root/etc/uci-defaults/50-secubox-clone-provision` — first-boot provisioning.
      - Step 1: Resize root partition to full disk (parted + resize2fs)
      - Step 2: Discover master via mDNS or network scan
      - Step 3: Configure as mesh peer (master-link UCI)
      - Step 4: Join mesh with token or request approval
    - Enhanced `secubox-master-link`:
      - Added `ml_clone_token_generate()` for auto-approve clone tokens (24h TTL)
      - Added `ml_token_is_auto_approve()` for token type detection
      - Updated `ml_join_request()` to auto-approve clone tokens
      - New CLI commands: clone-token, register-token
    - Updated `secubox` CLI:
      - Added `secubox clone` command group (build, serve, token, status, list, export)
      - Added `secubox master-link` command group (status, peers, token, clone-token, join, approve, pending)
    - **Clone workflow**:
      1. Master: `secubox clone build && secubox clone serve --start`
      2. Host: `./secubox-clone-station.sh clone` (detects, pulls, flashes target)
      3. Target boots, resizes root, auto-joins mesh with pre-approved token
    - Part of v0.19 mesh deployment automation.

29. **Evolution Dashboard Real-Time Commits (2026-02-08)**
    - Enhanced `secubox-app-streamlit-evolution` with live GitHub commits display.
    - New "🚀 Devel" tab (first tab) showing real-time development activity:
      - Commits Today / This Week / Contributors / Stars metrics
      - Commit type distribution (feat/fix/docs/refactor/chore)
      - Recent commits list with:
        - Short hash (7 chars) with link to GitHub
        - Commit message (80 char truncated)
        - Author name
        - Relative time (e.g., "2h ago", "just now")
      - Commit type color-coding (green=feat, red=fix, orange=docs, purple=refactor)
      - Repository stats (forks, watchers, open issues)
    - GitHub API integration:
      - `fetch_commits(limit=30)` with 1-minute cache TTL for near real-time updates
      - `fetch_repo_info()` for repository statistics
      - `parse_commit_type()` for conventional commit parsing
      - `format_time_ago()` for human-readable timestamps
      - `get_commit_stats()` for daily/weekly aggregation
    - Cyberpunk theme styling for commits (matching existing dashboard theme)
    - Live indicator animation (pulsing green dot)

30. **SecuBox Metrics Dashboard (2026-02-09)**
    - Added new SecuBox Metrics view under Status menu.
    - Features web traffic country statistics panel.
    - Integrated with `luci.secubox-security-threats` RPCD backend.
    - Visit stats include: requests by country, by host, by type, bots vs humans.
    - Tag: v0.19.14

31. **CrowdSec Dashboard Decision Count Fix (2026-02-09)**
    - Fixed Active Bans showing 0 when 100+ decisions existed.
    - Root cause: `--no-api` flag returned empty, jsonfilter couldn't count arrays.
    - Fix: Use `cscli decisions list -o json | jq 'length'` with grep fallback.
    - Tag: v0.19.15

32. **Active Sessions Panel (2026-02-10)**
    - Added active sessions panel to SecuBox Metrics.
    - Tracks: Tor circuits, HTTPS visitors, Streamlit sessions, Mitmproxy connections, SSH sessions.
    - New RPCD method `get_active_sessions` in dashboard.sh.
    - Uses netstat/who for session counting.
    - Tag: v0.19.15

33. **Live Real-Time Metrics Dashboard (2026-02-10)**
    - Rewrote secubox-metrics.js for continuous live updates.
    - 3-second polling interval with poll.add().
    - Data-attributes for efficient DOM targeting (no page rebuilds).
    - CSS pulse animation on value changes.
    - Live indicator with timestamp display.
    - Efficient updateValue/updateBar/updateList methods.
    - Tag: v0.19.16

34. **Cloning Station LuCI Dashboard (2026-02-11)**
    - Created `luci-app-cloner` package for station cloning management.
    - Dashboard shows: device type, TFTP status, image info, tokens, clones.
    - Quick actions: Build Image, Start/Stop TFTP, New Token, Auto-Approve Token.
    - Clone images table with TFTP-ready status.
    - Token management with create/delete functionality.
    - U-Boot flash commands display when TFTP is running.
    - RPCD handler with 10 methods for status, images, tokens, clones.
    - Tag: v0.19.20

35. **System Hub KISS Rewrite (2026-02-11)**
    - Rewrote `luci-app-system-hub/overview.js` to KISS style.
    - Self-contained inline CSS, no external dependencies.
    - 6 status cards: Hostname/Model, Uptime, Services, CPU Load, Temperature, Health Score.
    - 3 resource bars: Memory, Storage, CPU Usage with color-coded progress.
    - Quick Actions panel: System Settings, Reboot, Backup/Flash.
    - Services table showing top 10 with running/stopped badges.
    - 5-second live polling with efficient data-stat DOM updates.
    - Full dark mode support via prefers-color-scheme media query.
    - Uses `luci.system-hub` RPC: status, get_health, list_services.

36. **SecuBox Dashboard KISS Rewrite (2026-02-11)**
    - Rewrote `luci-app-secubox/dashboard.js` to KISS style.
    - Removed all external dependencies (secubox/api, secubox-theme, secubox/nav, secubox-portal/header).
    - Self-contained with inline CSS and direct RPC calls.
    - Header with status chips: Version, Modules, Running, Alerts, Health Score.
    - Stats cards: Total Modules, Installed, Active, Health Score, Alerts.
    - System Health panel with 4 metric bars: CPU, Memory, Storage, Network.
    - Public IPs panel with IPv4/IPv6 display.
    - Modules table with top 8 modules, status badges, version info.
    - Quick Actions: Restart Services, Update Packages, View Logs, Export Config.
    - Alert Timeline with severity-colored items.
    - 15-second live polling for health, alerts, IPs.
    - Full dark mode support.

58. **IoT Guard Implementation (2026-02-11)**
    - Created `secubox-iot-guard` package — IoT device isolation, classification, and security monitoring.
    - **Device Classification**:
      - OUI-based classification with 100+ IoT manufacturer prefixes
      - 10 device classes: camera, thermostat, lighting, plug, assistant, media, lock, sensor, diy, mixed
      - Traffic-based classification from cloud dependency tracking
      - Hostname-based classification fallback
    - **Risk Scoring**:
      - 0-100 risk score with vendor risk, anomaly penalty, cloud dependency penalty
      - Risk levels: low (20), medium (50), high (80)
      - Auto-isolation threshold configurable (default 80)
    - **Anomaly Detection**:
      - Bandwidth spike detection (Nx above baseline)
      - New destination tracking
      - Port scan behavior detection
      - Time-based anomaly (unusual activity hours)
    - **Integration Points**:
      - Client Guardian: Zone assignment (IoT zone)
      - MAC Guardian: L2 blocking/trust
      - Vortex Firewall: DNS filtering for IoT malware feeds
      - Bandwidth Manager: Rate limiting
    - **CLI** (`iot-guardctl`): status, list, show, scan, isolate, trust, block, anomalies, cloud-map, daemon
    - **UCI Configuration**: main settings, zone policy, vendor rules, allowlist, blocklist
    - **Baseline Profiles**: JSON profiles for camera, thermostat, plug, assistant device classes
    - Created `luci-app-iot-guard` — LuCI dashboard with KISS-style views.
    - **Dashboard Views**:
      - Overview: Security score, device counts, risk distribution, anomaly timeline
      - Devices: Filterable table with device details, isolate/trust/block actions
      - Policies: Vendor classification rules management
      - Settings: UCI form for configuration
    - **RPCD Handler**: 11 methods (status, get_devices, get_device, get_anomalies, scan, isolate/trust/block_device, get_vendor_rules, add/delete_vendor_rule, get_cloud_map)
    - **ACL**: Public access for status and device list via `unauthenticated` group

59. **InterceptoR "Gandalf Proxy" Implementation (2026-02-11)**
    - Created `luci-app-interceptor` — unified dashboard for 5-pillar transparent traffic interception.
    - **Dashboard Features**:
      - Health Score (0-100%) with color-coded display
      - 5 Pillar Status Cards: WPAD Redirector, MITM Proxy, CDN Cache, Cookie Tracker, API Failover
      - Per-pillar stats: threats, connections, hit ratio, trackers, stale serves
      - Quick links to individual module dashboards
    - **RPCD Handler** (`luci.interceptor`):
      - `status`: Aggregates status from all 5 pillars
      - `getPillarStatus`: Individual pillar details
      - Health score calculation: 20 points per active pillar
      - Checks: WPAD PAC file, mitmproxy LXC, Squid process, Cookie Tracker UCI, API Failover UCI
    - Created `secubox-cookie-tracker` package — Cookie classification database + mitmproxy addon.
      - **SQLite database** (`/var/lib/cookie-tracker/cookies.db`): domain, name, category, seen times, blocked status
      - **Categories**: essential, functional, analytics, advertising, tracking
      - **mitmproxy addon** (`mitmproxy-addon.py`): Real-time cookie extraction from Set-Cookie headers
      - **Known trackers** (`known-trackers.tsv`): 100+ tracker domains (Google Analytics, Facebook, DoubleClick, etc.)
      - **CLI** (`cookie-trackerctl`): status, list, classify, block, report --json
      - **Init script**: procd service with SQLite database initialization
    - Enhanced `luci-app-network-tweaks` with WPAD safety net:
      - Added `setWpadEnforce`/`getWpadEnforce` RPCD methods
      - Added `setup_wpad_enforce()` iptables function for non-compliant clients
      - Redirect TCP 80/443 to Squid proxy for WPAD-ignoring clients
    - Enhanced `luci-app-cdn-cache` with API failover config:
      - Added `api_failover` UCI section: stale_if_error, offline_mode, collapsed_forwarding
      - Modified init.d to generate API failover Squid config (refresh_pattern with stale-if-error)
      - Created `/etc/hotplug.d/iface/99-cdn-offline` for WAN up/down detection
      - Automatic offline mode on WAN down, disable on WAN up
    - Configured `.sblocal` mesh domain via BIND zone file:
      - Created `/etc/bind/zones/sblocal.zone` for internal service discovery
      - Added c3box.sblocal A record pointing to 192.168.255.1
    - Part of InterceptoR transparent proxy architecture (Peek/Poke/Emancipate model).

60. **3-Tier Stats Persistence & Evolution (2026-02-11)**
    - Created `secubox-stats-persist` — 3-tier caching for never-trashed stats.
    - **3-Tier Cache Architecture**:
      - Tier 1: RAM cache (`/tmp/secubox/*.json`) — 3-30 second updates
      - Tier 2: Volatile buffer — atomic writes with tmp+mv pattern
      - Tier 3: Persistent storage (`/srv/secubox/stats/`) — survives reboot
    - **Time-Series Evolution**:
      - Hourly snapshots (24h retention) per collector
      - Daily aggregates (30d retention) with min/max/avg
      - Combined timeline JSON with all collectors
    - **Heartbeat Line**:
      - Real-time 60-sample buffer (3min window)
      - Combined "influence" score: (health×40 + inv_threat×30 + inv_capacity×30)/100
      - Updated every 3 seconds via daemon loop
    - **Evolution View**:
      - 48-hour combined metrics graph
      - Health, Threat, Capacity, and Influence scores per hour
      - JSON output for dashboard sparklines
    - **Boot Recovery**:
      - On daemon start, recovers cache from persistent storage
      - Ensures stats continuity across reboots
    - **RPCD Methods**:
      - `get_timeline`: 24h evolution for all collectors
      - `get_evolution`: Combined influence score timeline
      - `get_heartbeat_line`: Real-time 3min buffer
      - `get_stats_status`: Persistence status and current values
      - `get_history`: Historical data for specific collector
      - `get_collector_cache`: Current cache value for collector
    - **Cron Jobs**:
      - Every 5min: Persist cache to /srv (backup)
      - Every hour: Generate timeline and evolution
      - Daily: Aggregate hourly to daily, cleanup old data
    - Integrated into `secubox-core` daemon startup (r16).
    - Bumped `secubox-core` version to 0.10.0-r16.

49. **InterceptoR Services Dashboard (2026-02-11)**
    - Created `luci.services-registry` RPCD handler with 4 methods:
      - `getServices`: All init.d services with enable/running status
      - `getPublished`: HAProxy vhosts and Tor onion URLs
      - `getMetrics`: System metrics (uptime, load, memory, CrowdSec stats)
      - `getAll`: Combined aggregation of all service data
    - Created `services.js` KISS-style dashboard with 5 tabs:
      - **Published**: HAProxy vhosts, Tor onions with live URLs
      - **Proxies**: mitmproxy instances with web UI links
      - **Services**: Running daemons with enable/running badges
      - **Dashboards**: LuCI app links for navigation
      - **Metrics**: System health, CrowdSec alerts/bans
    - Service emoji registry for visual identification (30+ mappings)
    - 10-second live polling via `poll.add()`
    - Fixed `kiss-theme.js` singleton pattern (`baseclass.singleton(KissThemeClass)`)
    - Updated ACL with `luci.services-registry` methods

50. **mitmproxy Multi-Instance Support (2026-02-11)**
    - Updated init.d script with `config_foreach start_instance instance`
    - Updated `mitmproxyctl` with new commands:
      - `list-instances`: Show all configured instances with status
      - `service-run <instance>`: Start specific instance
      - `service-stop <instance>`: Stop specific instance
    - UCI configuration for dual instances:
      - `out`: LAN→Internet transparent proxy (port 8888/8089)
      - `in`: WAF/services upstream proxy (port 8889/8090)
    - README updated with multi-instance documentation

51. **InterceptoR Plan Verification Complete (2026-02-12)**
    - Verified all 5 phases of InterceptoR "Gandalf Proxy" plan are fully implemented:
      - Phase 1: WPAD Safety Net — `setup_wpad_enforce()` in `network-tweaks-sync`
      - Phase 2: Cookie Tracker — `secubox-cookie-tracker` + `luci-app-cookie-tracker`
      - Phase 3: API Failover — `cdn-cache` UCI config + `99-cdn-offline` hotplug
      - Phase 4: CrowdSec Scenarios — 8 scenarios in `secubox-mitmproxy-threats.yaml`
      - Phase 5: Unified Dashboard — `luci-app-interceptor` with 5-pillar status
    - CrowdSec scenarios include: SQLi, XSS, command injection, SSRF, CVE exploitation, bot scanners, shell hunters
    - Plan file updated to reflect completion status

52. **InterceptoR Insider WAF - 6th Pillar (2026-02-12)**
    - Added Insider WAF as 6th pillar to InterceptoR for LAN client threat detection.
    - **RPCD handler updates** (`luci.interceptor`):
      - New `get_insider_waf_status()` function tracking insider threats, blocked clients, exfil attempts, DNS anomalies
      - Health score recalculated for 6 pillars (17 points each)
      - Detects threats from internal IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    - **LuCI dashboard updates** (`overview.js`):
      - New "Insider WAF" pillar card with 🔒 icon
      - Stats: insider threats, blocked clients, exfil attempts, DNS anomalies
      - Description: "LAN threat detection"
    - **CrowdSec insider threat scenarios** (`secubox-insider-threats.yaml`):
      - `secubox/insider-c2-beacon` — C2 beacon detection from LAN hosts
      - `secubox/insider-exfiltration` — Data exfiltration attempts (large uploads, base64, DNS)
      - `secubox/insider-dns-tunnel` — DNS tunneling/DGA from internal hosts
      - `secubox/insider-lateral-movement` — Lateral movement within LAN
      - `secubox/insider-cryptominer` — Cryptominer activity detection
      - `secubox/insider-iot-botnet` — IoT botnet C2 (Mirai, Gafgyt, Mozi)
      - `secubox/insider-bad-tld` — Suspicious outbound to high-risk TLDs
      - `secubox/insider-high-volume` — Unusual high-volume outbound traffic
    - Updated `secubox-app-crowdsec-custom` Makefile to install new scenarios

53. **DDoS Protection Hardening Profile (2026-02-12)**
    - **Config Advisor DDoS checks** (`checks.sh`):
      - DDOS-001: SYN cookies enabled
      - DDOS-002: Connection tracking limit (65536+)
      - DDOS-003: CrowdSec http-dos collection installed
      - DDOS-004: ICMP rate limiting
      - DDOS-005: Reverse path filtering (anti-spoofing)
      - DDOS-006: HAProxy connection limits (maxconn)
      - DDOS-007: mitmproxy WAF active (L7 flood detection)
      - DDOS-008: Vortex DNS firewall (botnet C2 blocking)
    - **ANSSI rules JSON** (`anssi-rules.json`):
      - New "ddos" category with 8 rules and remediation steps
    - **Documentation** (`DOCS/DDOS-PROTECTION.md`):
      - Complete DDoS protection guide
      - Layer-by-layer explanation (L3/L4/L7/DNS)
      - Configuration examples for all components
      - Quick hardening checklist
      - Monitoring commands during attacks
      - Limitations and upstream protection options (Cloudflare, etc.)

54. **HAProxy vhosts.js KISS Migration (2026-02-12)**
    - Rewrote HAProxy Virtual Hosts dashboard to use KissTheme.
    - Self-contained inline CSS using KISS variables.
    - Removed external `dashboard.css` dependency.
    - Add vhost form with domain/backend/SSL inputs.
    - Vhosts table with status badges and actions (edit/toggle/delete).
    - Edit modal and delete confirmation dialogs.
    - Toast notifications for user feedback.

55. **InterceptoR LXC Detection Fix (2026-02-12)**
    - Changed LXC container status detection from `lxc-ls` to `lxc-info`.
    - `lxc-info -n mitmproxy -s` provides direct state query (more reliable).
    - Fixed container name from `secbx-mitmproxy` to `mitmproxy`.
    - Applied to all pillar status checks in `luci.interceptor` RPCD handler.

56. **HAProxy backends.js KISS Migration (2026-02-12)**
    - Rewrote HAProxy Backends dashboard to use KissTheme.
    - Removed external `dashboard.css` dependency.
    - Replaced all `hp-` classes with `kiss-` classes and inline styles.
    - Backend cards with server lists, health check info.
    - Add backend form with mode, balance algorithm, health check options.
    - Add/edit server modals with quick service selector for auto-fill.
    - Delete confirmations and toast notifications.
    - Consistent styling with vhosts.js KISS migration.

57. **HAProxy stats.js KISS Migration (2026-02-12)**
    - Rewrote HAProxy Statistics dashboard to use KissTheme.
    - Removed CSS import via style element.
    - Stats iframe with KISS-styled border.
    - Logs viewer with line count selector and refresh button.
    - Empty state for disabled stats or stopped service.

58. **Cloning Station Dashboard Enhancements (2026-02-13)**
    - Major enhancement to `luci-app-cloner` with 5-tab dashboard and 10 new RPCD methods.
    - **Build Progress UI**:
      - Real-time log streaming from `/tmp/cloner-build.log` via base64 encoding
      - Progress bar with stage indicators (initializing, downloading, building, packaging, complete, failed)
      - Color-coded stage icons and animated progress fill
      - RPCD method: `build_log` with lines/offset params
    - **Serial Console Tab**:
      - Port detection and selection via `serial_ports` method
      - Live serial output display with Start/Stop/Clear controls
      - Command input with Enter-to-send support
      - Polling-based serial read with 500ms interval
      - RPCD methods: `serial_ports`, `serial_read`, `serial_write`
    - **Clone History Tab**:
      - JSON-based history tracking in `/var/run/secubox/clone-history.json`
      - Records: timestamp, device, image, status, token
      - Relative time display (e.g., "2h ago")
      - Clear history functionality
      - RPCD methods: `history_list`, `history_add`, `history_clear`
    - **Image Manager Tab**:
      - Storage overview with clone/TFTP directory sizes
      - Usage progress bar with available space display
      - Image cards with details button (size, checksum, modified, valid)
      - Delete image functionality
      - RPCD methods: `storage_info`, `image_details`, `image_rename`
    - **Overview Tab Improvements**:
      - 4-column stats grid with live polling
      - Storage info card with dual-directory display
      - Token management with copy-to-clipboard
      - U-Boot flash commands with copy button
    - Tab navigation with 5-second refresh polling
    - Updated ACL with 13 read and 9 write methods

59. **Cloning Station Remote Device Management (2026-02-13)**
    - Added 6th "Remotes" tab for managing remote SecuBox devices.
    - **SSH Key Authentication**:
      - Generates dropbear Ed25519 keypair on master
      - Uses dbclient (dropbear SSH client) instead of OpenSSH for OpenWrt compatibility
      - Auto-copies public key to remote devices' authorized_keys
    - **Remote Device Features**:
      - Add/remove remote devices by IP and name
      - Network scan discovers SecuBox devices on subnet
      - Remote status retrieves: hostname, model, version, uptime, LuCI accessibility
    - **Remote Flash Workflow**:
      - Select image from local TFTP/clone directory
      - Optional token injection for mesh join
      - Image upload via dbclient (pipe-based SCP alternative)
      - Token, master hostname, and master IP embedded in image
      - Triggers sysupgrade with keep_settings option
    - **RPCD Methods** (7 new):
      - `list_remotes`, `add_remote`, `remove_remote`: Remote device management
      - `remote_status`: SSH-based device info retrieval
      - `remote_upload`: Image upload via dbclient
      - `remote_flash`: Complete flash workflow with token injection
      - `scan_network`: Discover SecuBox devices on LAN
    - **BusyBox Compatibility Fixes**:
      - Replaced `grep -P` (Perl regex) with `grep -oE` for IP extraction
      - Uses dropbear's dbclient with `-i` key and `-y` auto-accept
    - Updated ACL with 4 read methods and 4 write methods for remotes
    - Tested with moka1 (192.168.255.125) - MOCHAbin running OpenWrt 24.10.5

60. **GoToSocial Fediverse Server Deployment (2026-02-13)**
    - Deployed GoToSocial v0.17.0 ActivityPub server on C3BOX.
    - **Installation**:
      - Direct execution mode (no LXC - v0.18.0 has cgroup panics)
      - Binary at `/srv/gotosocial/gotosocial` (ARM64)
      - Data at `/srv/gotosocial/` (database, storage, web assets)
      - Downloaded from Codeberg releases (GitHub redirects fail on wget)
    - **Configuration**:
      - Domain: `social.gk2.secubox.in`
      - Port: 8484 (internal)
      - SQLite database with WAL mode
      - Web templates and assets from release tarball
    - **Admin User Created**:
      - Username: `admin`
      - Email: `admin@secubox.in`
      - Promoted to admin + moderator role
    - **HAProxy Exposure**:
      - Backend: `gotosocial` → `192.168.255.1:8484`
      - Vhost: `social_gk2_secubox_in` with SSL redirect
      - Uses wildcard certificate `*.gk2.secubox.in` (Let's Encrypt)
      - Added domain to certs.list for SNI matching
    - **UCI Configuration**:
      - `haproxy.gotosocial` backend
      - `haproxy.gotosocial_srv` server entry
      - `haproxy.social_gk2_secubox_in` vhost
      - `haproxy.cert_social_gk2_secubox_in` certificate
      - `gotosocial.main.host`, `gotosocial.proxy.*` settings
    - **Key Fixes**:
      - Config.yaml paths: `/data/` → `/srv/gotosocial/`
      - Backend address: HAProxy in LXC cannot reach 127.0.0.1, must use LAN IP
      - WASM compilation: ~90 seconds on ARM64 at startup
    - Live at: https://social.gk2.secubox.in

23. **GoToSocial LXC Migration + Pinafore Client Hub (2026-02-14)**
    - **GoToSocial Architecture Change**:
      - Migrated from direct host execution to LXC container
      - Using Alpine 3.21 rootfs with gcompat for glibc compatibility
      - GoToSocial v0.17.0 statically linked binary
      - Data bind-mounted at `/data` inside container
      - Container runs with `lxc.net.0.type = none` (host networking)
    - **LXC Container Benefits**:
      - Isolated environment with proper cgroup limits
      - Easier upgrades (replace rootfs or binary only)
      - Consistent execution environment
    - **gotosocialctl Updates**:
      - `install`: Creates Alpine LXC rootfs + installs GoToSocial
      - `start/stop`: Uses `lxc-start -d` / `lxc-stop`
      - `user create/password`: Works via chroot or lxc-attach
      - `shell`: Opens interactive shell in container
    - **Pinafore Client Hub Added**:
      - New package: `secubox-app-pinafore`
      - Landing page with links to Pinafore, Elk, Semaphore
      - All clients pre-configured with instance domain
      - `pinaforectl emancipate` for HAProxy exposure
    - **Login Issue Resolution**:
      - Form field is `username` not `email` (GoToSocial quirk)
      - Admin user: `admin@secubox.in` / `TestAdmin123!`

## 2026-02-14: Fixed Streamlit apps + WAF compatibility

### Problem
- Streamlit apps showing blank page with loading spinner when accessed via public URLs
- Direct access to backends (192.168.255.1:xxxx) worked fine
- Issue was mitmproxy WAF not handling WebSocket connections properly

### Root Cause
- HAProxy `waf_enabled=1` routed ALL vhosts through `mitmproxy_inspector` backend
- mitmproxy's `haproxy_router` addon wasn't properly handling WebSocket upgrade connections
- WebSocket connections disconnected immediately, breaking Streamlit's real-time UI

### Solution
1. Added `waf_bypass` option to `/usr/sbin/haproxyctl`:
   - Vhosts with `waf_bypass=1` route directly to their backends
   - Other vhosts still go through mitmproxy WAF
2. Set `waf_bypass=1` for Streamlit vhosts (yling, bazi, bweep, bweek, wuyun, pix, hermes, evolution, control)
3. Updated haproxy_router.py addon with WebSocket event handlers (for future improvement)

### Files Modified
- `/usr/sbin/haproxyctl` - Added waf_bypass option check
- `/srv/mitmproxy-in/addons/haproxy_router.py` - Added WebSocket handlers
- `/srv/lxc/mitmproxy-in/config` - Enabled HAPROXY_ROUTER_ENABLED=1

### Result
- Streamlit apps work with full WebSocket support
- Other services still protected by mitmproxy WAF
- Hybrid approach balances security and functionality

## 2026-02-14: Docker to LXC Migration - Mail Services

### Converted Services
1. **Mailserver** (Docker `secubox-mailserver` → LXC `mailserver`)
   - Alpine Linux with Postfix + Dovecot
   - IP: 192.168.255.30
   - Ports: SMTP (25), SMTPS (465), Submission (587), IMAP (143), IMAPS (993)
   - User: `admin@secubox.in` / `NDdC73130`

2. **Roundcube Webmail** (Docker `secubox-webmail` → LXC `roundcube`)
   - Alpine Linux with nginx + PHP-FPM + Roundcube 1.6.12
   - Host networking, port 8027
   - Connected to mailserver at ssl://192.168.255.30:993

### LXC Configurations
- `/srv/lxc/mailserver/config` - Mail server container
- `/srv/lxc/roundcube/config` - Webmail container
- `/srv/lxc/mailserver/rootfs/opt/start-mail.sh` - Startup script
- `/srv/lxc/roundcube/rootfs/opt/start-roundcube.sh` - Startup script

### Result
- Docker containers removed
- Services accessible via https://webmail.gk2.secubox.in
- Auto-start via `/etc/init.d/secubox-lxc`

## 2026-02-14: Docker to LXC Migration - Jellyfin

### Converted Service
- **Jellyfin** (Docker `secbx-jellyfin` → LXC `jellyfin`)
  - Debian-based (exported from Docker image)
  - IP: 192.168.255.31
  - Port: 8096
  - Jellyfin 10.11.6

### LXC Configuration
- `/srv/lxc/jellyfin/config` - Container config with bind mounts
- `/srv/lxc/jellyfin/rootfs/opt/start-jellyfin.sh` - Startup script
- Mounts: /srv/SHARE (media, ro), /srv/jellyfin/config, /srv/jellyfin/cache

### HAProxy Updates
- Updated `haproxy.cfg5726ed_media.address` to 192.168.255.31
- Added `waf_bypass=1` for media.maegia.tv
- Disabled Docker jellyfin init script (`/etc/init.d/jellyfin`)

### Auto-start Script
Updated `/etc/init.d/secubox-lxc` to manage all LXC containers:
- haproxy, mailserver, roundcube, jellyfin

### Result
- All Docker containers removed
- Jellyfin accessible via https://media.maegia.tv
- Full LXC-based infrastructure

## 2026-02-14: Domoticz Exposure & WAF Redirect Fix

### Domoticz Exposed via HAProxy
- **Domain:** https://home.maegia.tv
- **Backend:** 127.0.0.1:8084 (LXC with host networking)
- **DNS:** A record added via Gandi API
- **SSL:** Let's Encrypt certificate issued

### HAProxy Configuration
- Created `domoticz_web` backend
- Created `home_maegia_tv` vhost with `waf_bypass=1`
- SSL certificate: `/srv/haproxy/certs/home.maegia.tv.pem`

### WAF Redirect Loop Fix
- **Issue:** mitmproxy causing 301 redirect loops for multiple vhosts
- **Root cause:** mitmproxy-in in "reverse" mode without proper HAProxy router addon
- **Fix:** Added `waf_bypass=1` to affected vhosts (gk2.secubox.in, home.maegia.tv)
- **Additional fix:** Updated mitmproxy-in LXC config to enable HAProxy router mode

### Domoticz Configuration
- Reset admin password via SQLite
- Added local network bypass for HAProxy access
- LXC container: `/srv/lxc/domoticz/` with USB passthrough for Zigbee

### Result
- https://home.maegia.tv → Domoticz (200 OK)
- https://gk2.secubox.in → GK2 Hub (200 OK, redirect loop fixed)

## 2026-02-14: Vhost Routing Fixes & Glances Installation

### Mitmproxy Routes Duplicate Fix
- **Issue:** Multiple vhosts showing mixed/wrong content (sdlc, console, control)
- **Root cause:** Duplicate entries in `/srv/mitmproxy-in/haproxy-routes.json`
  - `console.gk2.secubox.in` appeared twice (8501 then 8081 - second wins)
  - `control.gk2.secubox.in` appeared twice (8511 then 8081 - second wins)
- **Fix:** Removed duplicate entries, kept correct Streamlit ports

### Service Backend Fixes
- **play.maegia.tv:** Changed backend from `mitmproxy_inspector` to `streamlit_yijing` (port 8501)
- **client.gk2.secubox.in:** Enabled `pinafore_srv` server with health check
- **social.gk2.secubox.in:** Started GoToSocial LXC container

### Pinafore Static Server
- Added uhttpd instance on port 4002 for Mastodon client landing page
- Serves `/srv/pinafore/index.html` with links to Mastodon web clients

### Glances Installation
- Installed `python3-pip` via opkg
- Installed Glances 4.5.0.4 via pip3 with dependencies:
  - bottle, fastapi, uvicorn, psutil, jinja2, pydantic
- Created dummy `/usr/lib/python3.11/webbrowser.py` for headless operation
- Started Glances web server on port 61208

### Verified Services
| Service | URL | Status |
|---------|-----|--------|
| sdlc.gk2.secubox.in | MetaBlog SDLC | ✓ HTTP 200 |
| console.gk2.secubox.in | Streamlit Console | ✓ HTTP 200 |
| control.gk2.secubox.in | Streamlit Control | ✓ HTTP 200 |
| play.maegia.tv | Streamlit Yijing | ✓ HTTP 200 |
| glances.gk2.secubox.in | Glances Monitor | ✓ HTTP 200 |
| social.gk2.secubox.in | GoToSocial | ✓ Working |
| client.gk2.secubox.in | Pinafore Landing | ✓ HTTP 200 |

### Total Operational
- 70+ vhosts verified working
- 55 SSL certificates active
- WAF/mitmproxy routing stable

## 2026-02-14: C3BOX SDLC Full Service Verification

### All 70 Services Verified Operational

Comprehensive verification of all services listed on C3BOX SDLC dashboard (https://sdlc.gk2.secubox.in/).

### Services by Zone

| Zone | Count | Status |
|------|-------|--------|
| *.cybermind.fr | 2 | ✓ All 200 |
| *.cybermood.eu | 2 | ✓ All 200 |
| *.ganimed.fr | 2 | ✓ All 200 |
| *.maegia.tv | 19 | ✓ All OK |
| *.secubox.in | 29 | ✓ All OK |
| *.sb.local | 4 | Local access |
| *.secubox.local | 2 | Local access |

### Streamlit Apps (20 verified)
basic, bazi, bweek, bweep, console, control, cpf, evolution, fabric, fabricator, ftvm, hermes, papyrus, pdf, photocloud, pix, play, wuyun, yijing360, yling

### MetaBlog Sites (15 verified)
bday, clock, comic, eval, geo, gondwana, lldh, sdlc, wanted, devel, gandalf, gk2, how2, press, presse

### Infrastructure Services
- Glances monitoring (port 61208)
- GoToSocial federation (port 8484)
- Jellyfin media (port 8096)
- Mail server (Postfix/Dovecot)
- Webmail (Roundcube)
- LocalAI (port 8091)

### Mesh Statistics
- **Total Vhosts**: 77 configured
- **SSL Certificates**: 52 active
- **LXC Containers**: 5 running (haproxy, mitmproxy-in, jellyfin, gotosocial, domoticz)
- **Public IP**: 82.67.100.75

## 2026-02-14: WAF Architecture Configuration

### WAF Routing Strategy
Configured mitmproxy WAF filtering with selective bypass:

**Through WAF (mitmproxy filtering enabled):**
- All Streamlit apps (20+) - security analysis active
- All MetaBlogizer sites (15+) - security analysis active
- Standard web vhosts for logging and threat detection

**WAF Bypass (direct HAProxy → backend):**
| Service | Reason |
|---------|--------|
| media.maegia.tv | Jellyfin streaming incompatible |
| localai.secubox.in | AI API performance |
| mail.secubox.in | Mail protocols |
| glances.gk2.secubox.in | Monitoring API |
| social.gk2.secubox.in | ActivityPub federation |
| webmail.gk2.secubox.in | Roundcube webmail |
| client.gk2.secubox.in | Mastodon client |
| All path ACLs (/gk2/*) | mitmproxy routes by host only |

### Path ACL Fix
- Path-based routing (`secubox.in/gk2/*`) requires `waf_bypass=1`
- mitmproxy haproxy_router.py routes by hostname, not path
- 38 path ACLs configured with waf_bypass for direct routing

### Architecture
```
Client → HAProxy → mitmproxy (WAF) → Backend (Streamlit/MetaBlog)
Client → HAProxy → Backend (Infrastructure - bypass WAF)
Client → HAProxy → Backend (Path ACLs - bypass WAF)
```

## 2026-02-14: Streamlit WebSocket WAF Bypass

### Issue
Streamlit apps stopped displaying correctly after enabling WAF.

### Root Cause
Streamlit uses WebSockets (`_stcore/stream`) for real-time communication. mitmproxy MITM interception breaks WebSocket connections due to:
- Certificate validation issues (self-signed MITM cert)
- Connection upgrade handling incompatibility
- Stream state corruption

### Fix
Re-enabled `waf_bypass=1` for all 20 Streamlit apps. Trade-off: Streamlit apps bypass WAF filtering in favor of functionality.

### Affected Apps
basic, bazi, bweek, bweep, console, control, cpf, evolution, fabric, fabricator, ftvm, hermes, papyrus, pdf, photocloud, pix, play, wuyun, yijing360, yling

## 2026-02-14: MetaBlogizer SDLC Content Restoration

### Issue
`sdlc.gk2.secubox.in` displayed GK2 Hub landing page template instead of original content.

### Root Cause
GK2 Hub generator script had overwritten the local `index.html` with auto-generated service catalog page. Original content ("Les Seigneurs de La Chambre - Présentation Cinématique") was preserved in git history.

### Fix
```bash
cd /srv/metablogizer/sites/sdlc
git checkout HEAD -- index.html
```

### Verification
- Site now displays medieval/renaissance cinematic presentation
- Title: "Les Seigneurs de La Chambre - Présentation Cinématique"
- Description: "seigneurs de la Chambre" (from UCI config)

### 2026-02-14: Wazuh SIEM LuCI Dashboard Integration
- **Created luci-app-wazuh package** - unified Wazuh SIEM monitoring dashboard
  - 4 views: Overview, Alerts, FIM (File Integrity), Agents
  - SysWarden-inspired 4-layer security visualization:
    - Layer 1: Vortex Firewall + nftables (kernel-level)
    - Layer 2: CrowdSec + Bouncer (IPS)
    - Layer 3: Wazuh Manager (SIEM/XDR)
    - Layer 4: mitmproxy + HAProxy (WAF)
- **RPCD handler (luci.wazuh)** with 12 API methods:
  - get_overview, get_agent_status, get_manager_status
  - get_alerts, get_alert_summary
  - get_fim_events, get_fim_config
  - list_agents, get_crowdsec_correlation
  - start_agent, stop_agent, restart_agent
- **API wrapper (wazuh/api.js)** with helper functions for alert levels and timestamps
- **Fixed jshn segfault issue** - simplified to printf-based JSON output
- Tested all RPCD methods via ubus calls

### 2026-02-14: mitmproxy WAF Wildcard Route Priority Fix
- **Fixed wildcard route matching in haproxy_router.py**
  - Issue: `.gk2.secubox.in` wildcard (port 4050) matched before specific routes like `apr.gk2.secubox.in` (port 8928)
  - Root cause: Python code expected `*.domain` format but HAProxy generates `.domain` format
  - Fix: Support both `*.domain` and `.domain` wildcard formats
  - Fix: Sort wildcards by length (longest/most specific first) to ensure proper priority
- **Added auto-reload capability**
  - Routes file mtime checked every 10 requests
  - Automatically reloads routes.json if file modified
  - No container restart needed for route updates
- **Updated metablogizerctl integration**
  - `_emancipate_mitmproxy()` now uses `mitmproxyctl sync-routes` instead of direct file manipulation
  - Ensures HAProxy and mitmproxy routes stay in sync
  - MetaBlogizer sites now properly routed through WAF

### 2026-02-15: PeerTube Video Platform Package
- **Created secubox-app-peertube package** - federated video streaming platform
  - LXC container with Debian Bookworm base image
  - Stack: PostgreSQL 15, Redis 7, Node.js 18 LTS, FFmpeg
  - `peertubectl` CLI with 15+ commands:
    - Container: install, uninstall, update, start, stop, status, logs, shell
    - User mgmt: admin create-user, admin reset-password, admin list-users
    - Live: live enable, live disable, live status (RTMP on port 1935)
    - Exposure: configure-haproxy, emancipate
    - Backup: backup, restore (PostgreSQL dump)
  - HAProxy integration with extended timeouts (3600s) for streaming/WebSocket
  - Full emancipation workflow: DNS → Vortex → HAProxy → ACL → SSL → Mesh → Mitmproxy → Reload
- **UCI config sections:**
  - main: enabled, data_path, videos_path, memory_limit, timezone
  - server: hostname, port, https, webserver_hostname
  - live: enabled, rtmp_port, max_duration, allow_replay, transcoding_enabled
  - transcoding: enabled, threads, allow_audio_files, hls_enabled, resolutions
  - storage: external_enabled, s3_endpoint, s3_region, s3_bucket, s3_access_key, s3_secret_key
  - network: domain, haproxy, haproxy_ssl, firewall_wan
  - admin: email, initial_password

### 2026-02-15: PeerTube LuCI Dashboard
- **Created luci-app-peertube package**
  - RPCD handler (luci.peertube) with 11 methods:
    - status, start, stop, install, uninstall, update, logs
    - emancipate, live_enable, live_disable, configure_haproxy
  - ACL permissions: read (status, logs), write (all actions)
  - Menu entry: Admin → Services → PeerTube
- **Dashboard features:**
  - Install wizard with features list and requirements
  - Status badge (Running/Stopped) with access URL
  - Service info: hostname, port, admin email
  - Live streaming toggle with enable/disable buttons
  - HAProxy configuration status with configure button
  - Emancipate form for public exposure
  - Logs viewer with refresh button

### 2026-02-15: Generative LuCI Navigation Tree
- **Created luci.secubox-portal RPCD backend** for dynamic component discovery
  - `get_tree`: Auto-discovers all `luci-app-*` packages, groups by category
  - `get_containers`: Lists LXC containers from `/srv/lxc/` with running state
  - `get_vhosts`: Lists HAProxy vhosts from UCI with domain/backend/ssl info
  - Categories: SecuBox Core, Security, Media & Streaming, Network & Proxy, Development & CMS, IoT & Home, AI & Communication, System & Management, Other SecuBox Apps
- **Updated luci-tree.js** with dynamic RPC-based interface
  - Three tabs: LuCI Apps, Containers, Vhosts
  - Refresh button for live updates without page reload
  - Stats row showing categories, links, packages, containers, vhosts counts
  - Search functionality for filtering modules
  - Cyberpunk dark theme with green/cyan accents
- **ACL permissions** for unauthenticated portal access to tree methods

### 2026-02-15: PeerTube Configuration Fixes
- **Redis ARM64-COW-BUG**: Added `ignore-warnings ARM64-COW-BUG` to redis.conf
- **Redis sentinel**: Disabled (using standalone Redis, not sentinel cluster)
- **RTMPS**: Disabled (no SSL key file needed for live streaming)
- **HAProxy WAF bypass**: Added `waf_bypass=1` to tube.gk2.secubox.in vhost
  - Without bypass, mitmproxy WAF stripped Host header causing OAuth errors
  - PeerTube validates requests against configured webserver.hostname
- **Listen hostname**: Set to `0.0.0.0` (not domain name) for proper binding
- **Webserver hostname**: Set to `tube.gk2.secubox.in` for OAuth validation

### 2026-02-15: HAProxy & Mitmproxy WAF Fixes
- **HAProxy reload fix** in haproxyctl
  - HAProxy reads from `/etc/haproxy/haproxy.cfg` inside container
  - Config was generated at `/opt/haproxy/config/haproxy.cfg` but not copied
  - Added `lxc_exec cp /opt/haproxy/config/haproxy.cfg /etc/haproxy/haproxy.cfg` before reload signal
- **Mitmproxy Host header preservation** in haproxy_router.py
  - Fixed PeerTube OAuth "Invalid client" error when WAF enabled
  - Issue: `flow.request.host = backend[0]` was modifying the Host header
  - Fix: Save original Host header, set backend destination, restore Host header
  - Backends that validate Host (PeerTube OAuth, etc.) now work through WAF
- **WAF global reset**
  - Removed `waf_bypass=1` from 70 vhosts and path ACLs
  - All traffic now routes through mitmproxy for inspection
  - Streamlit apps, infrastructure services all WAF-enabled
- **Committed**: f3f6eb4e - fix(haproxy,mitmproxy): Fix config reload and preserve Host header

### 2026-02-15: PeerTube Email Configuration
- **Configured SMTP** for local mailserver (192.168.255.30)
  - Port 25, no TLS, disable_starttls=true (internal network)
  - Auth: admin@secubox.in
  - From: peertube@secubox.in
- **Fixed self-signed certificate error**
  - Mailserver STARTTLS was enabled with self-signed cert
  - Set `disable_starttls: true` in production.yaml
- **Added peertube@secubox.in alias** to mailserver virtual aliases
- PeerTube now sends registration confirmations and password resets

### 2026-02-15: Wazuh Agent Watchdog
- **Added watchdog** to wazuh-agent startup script
  - Checks every 60 seconds if `wazuh-agentd` is running
  - Automatically restarts Wazuh service if process dies
  - Logs restart events to `/var/log/wazuh-watchdog.log`
- **Root cause**: wazuh-agentd process had stopped, agent showed disconnected
- **Committed**: 851910e1 - feat(wazuh): Add watchdog to wazuh-agent startup script

### 2026-02-15: Service Fixes
- **Roundcube webmail**: Container was stopped, started it
- **Wazuh dashboard**: Added waf_bypass (HTTPS backend incompatible with HTTP WAF)
- **Streamlit evolution**: Instance was not running, added on port 8510
- **Streamlit Gitea sync**: Pushed 4 missing apps (cineposter_fixed, pdf_slideshow, pharmacopoeia_secubox, wuyun_liuqi)
- **RTMP firewall**: Opened port 1935 for PeerTube live streaming

### 2026-02-15: Mailserver gk2 Account Restoration
- **Restored gk2@secubox.in** user from backup
  - Container was reinstalled on Feb 14, only admin@ was recreated
  - Found gk2 credentials in `/srv/backups/mailserver/config-20260206-171132.tar.gz`
  - Extracted password hash and added to `/etc/dovecot/users` in container
  - Created maildir at `/var/mail/secubox.in/gk2/{cur,new,tmp}`
- **Data loss**: Maildir was already empty in Feb 6 backup (emails lost before backup)
- **Root cause**: mailserver container reinstallation did not restore all users

### 2026-02-15: Gitea Repository Privacy Fix
- **Verified** streamlitctl creates repos with `private:true` by default
- **Fixed** `secubox-evolution` repo which was public → now private
- **API call**: `PATCH /api/v1/repos/gandalf/secubox-evolution` with `{"private":true}`
- All 30 Gitea repos now private

### 2026-02-15: Mitmproxy WAF Dashboard Data Path Fix
- **Fixed** RPCD handler reading from wrong data path
  - Was reading from `/srv/mitmproxy` (outbound instance, no threats)
  - Now reads from `/srv/mitmproxy-in` (WAF input instance)
- **Added** `WAF_DATA_PATH` constant for clarity
- **Updated methods**: get_status, get_alerts, get_threat_stats, get_subdomain_metrics, clear_alerts
- **Fixed** container running check to detect mitmproxy-in and mitmproxy-out
- **Result**: Dashboard now shows 997 threats today, 29 pending autobans
- **Committed**: 42d85c4d

### 2026-02-15: PeerTube Transcoding Jobs Fix
- **Root cause**: Videos stuck with `waitTranscoding=true` not showing in public listing
- **Investigation**: Found `runnerJob` table with 6 jobs stuck in state=1 (pending)
- **Problem**: Admin enabled "remote runners" for transcoding but no runners registered
- **Fix**: Set `waitTranscoding=false` directly in PostgreSQL database
  ```sql
  UPDATE video SET "waitTranscoding" = false WHERE "waitTranscoding" = true;
  ```
- **Result**: 2 videos now visible in public listing
- **Future fix**: Disable remote runners in admin panel, use local ffmpeg transcoding

### 2026-02-15: GK2 Hub Landing Page Subdomain URLs
- **Updated** `gk2hub-generate` script to use direct subdomain URLs
- **Previous**: Used redirect paths like `https://secubox.in/gk2/jellyfin`
- **New**: Uses subdomain URLs like `https://media.gk2.secubox.in`
- **Changes**:
  - Infrastructure section: media, localai, webmail, feed, tube, social, wazuh
  - MetaBlogizer: HAProxy vhost lookup for automatic subdomain detection
  - Added more icons for new service types
- **Result**: 67 services with proper subdomain URLs

### 2026-02-16: Nextcloud LXC Enhancement
- **Migrated** secubox-app-nextcloud from Docker to LXC (Debian 12 based)
- **Complete rewrite** of `nextcloudctl` CLI (1018 lines):
  - Commands: install, uninstall, update, status, logs, shell, occ, backup, restore, ssl-enable, ssl-disable
  - Downloads Debian 12 rootfs from LXC image server
  - Installs full stack: Nginx, MariaDB, Redis, PHP 8.2-FPM, Nextcloud
  - Automated database setup and configuration
- **New UCI config schema** with sections: main, db, redis, ssl, backup
- **Enhanced RPCD backend** (366 lines) with 15 methods:
  - status, get_config, save_config, install, start, stop, restart
  - update, backup, restore, list_backups, ssl_enable, ssl_disable, occ, logs
- **KISS Dashboard** (725 lines) with:
  - Install view with feature cards
  - Overview tab with stats grid (Status, Version, Users, Storage)
  - Backups tab with create/restore functionality
  - SSL tab for HAProxy/ACME integration
  - Logs tab for operation monitoring
- **Updated dependencies**:
  - secubox-app-nextcloud: +lxc +lxc-common +tar +wget-ssl +jsonfilter +openssl-util +unzip +xz
  - luci-app-nextcloud: +luci-lib-secubox +secubox-app-nextcloud
- **Updated ACL** with all new RPCD methods
- **Updated menu** to SecuBox path (admin/secubox/services/nextcloud)

### 2026-02-16: Nextcloud SSL, WAF Rules & Mail Autoconfig

**Nextcloud Production Deploy:**
- Fixed nginx port conflict (80→8080) to avoid HAProxy collision
- Fixed PHP-FPM socket path to use `php8.2-fpm.sock`
- Fixed nginx routing with rewrite rule for `/apps/*` URLs
- Configured HAProxy SSL: https://cloud.gk2.secubox.in
- Updated mitmproxy routes for direct backend access (port 8080)
- **Commits**: 5b6bf856, 2bc2eac9

**WAF Rules for Nextcloud & Roundcube:**
- Added 20 CVE-based rules to `/srv/mitmproxy/waf-rules.json`
- **Nextcloud patterns**: CVE-2023-49791 (Text SSE RCE), CVE-2024-22403 (Dashboard XSS), CVE-2024-37315 (User Enum), CVE-2024-22212 (Federation SQLi)
- **Roundcube patterns**: CVE-2024-37383 (Skin RCE), CVE-2023-5631 (Stored XSS), CVE-2020-35730 (Upload RCE), CVE-2023-43770 (Link XSS)
- Common patterns: path traversal, config file access, script injection

**Mail Client Autoconfig:**
- DNS records added to `secubox.in.zone`:
  - `autoconfig.gk2.secubox.in`, `autodiscover.gk2.secubox.in` (A/AAAA)
  - `_imaps._tcp.gk2.secubox.in` SRV 0 0 993 mail.gk2.secubox.in
  - `_submission._tcp.gk2.secubox.in` SRV 0 0 587 mail.gk2.secubox.in
- Autoconfig XML at `/.well-known/autoconfig/mail/config-v1.1.xml`
- Mozilla/Thunderbird format with IMAP (993/143) and SMTP (587/465)
- HAProxy vhosts and mitmproxy routes configured

### 2026-02-16: Mailserver LuCI KISS Enhancement

**IMAP Connectivity Fix:**
- Fixed hairpin NAT issue for internal clients (Nextcloud container)
- Added `/etc/hosts` override in Nextcloud container: `mail.gk2.secubox.in` → `192.168.255.30`
- Added firewall rules for mail ports (IMAP 993, SMTP 587/465)

**LuCI Dashboard KISS Regeneration:**
- Complete rewrite of `overview.js` (672 lines) with full KISS theme styling:
  - Header with server FQDN
  - 4-column stats grid (Status, Users, Storage, SSL)
  - Control buttons (Start/Stop, DNS Setup, SSL Setup, Fix Ports, Backup)
  - Port status cards with visual indicators (SMTP, Submission, SMTPS, IMAPS, IMAP)
  - Two-column layout: Users table + Aliases table
  - Webmail (Roundcube) card with status badge and quick actions
  - Connection info panel with IMAP/SMTP server details
  - Live polling with 10s refresh
- Updated ACL with `fix_ports`, `alias_del` methods
- Added Mail Server + Nextcloud to KISS theme navigation sidebar

**Files Modified:**
- `luci-app-mailserver/htdocs/.../overview.js` (rewritten)
- `luci-app-mailserver/root/usr/share/rpcd/acl.d/luci-app-mailserver.json`
- `luci-app-secubox-portal/htdocs/.../kiss-theme.js` (nav update)

### 2026-02-16: DNS Master LuCI App

**New Package: secubox-app-dns-master**
- BIND DNS zone management CLI tool (`dnsmaster`)
- Commands: status, zone-list, zone-show, zone-add, records-json, record-add, record-del, reload, check, logs, backup
- JSON output support for LuCI integration
- Auto serial bump on zone modifications
- Zone validation via `named-checkzone`
- UCI config: `/etc/config/dns-master`

**New Package: luci-app-dns-master**
- KISS-themed dashboard with:
  - 4-column stats grid (Status, Zones, Records, TTL)
  - Control buttons (Reload BIND, Check Zones, Backup All, Add Zone)
  - Interactive zones table with Edit/Check/Backup actions
  - Inline records editor with type-colored badges
  - Add Zone modal for creating new DNS zones
  - Add Record modal with type dropdown (A, AAAA, MX, TXT, CNAME, SRV, NS, PTR)
  - Delete record with confirmation
  - Live polling with 10s refresh
- RPCD backend: 10 methods (status, zones, records, add_record, del_record, add_zone, reload, check, logs, backup)
- Added DNS Master to KISS theme Network category

**Files Created:**
- `secubox-app-dns-master/Makefile`
- `secubox-app-dns-master/files/etc/config/dns-master`
- `secubox-app-dns-master/files/usr/sbin/dnsmaster`
- `luci-app-dns-master/Makefile`
- `luci-app-dns-master/root/usr/libexec/rpcd/luci.dns-master`
- `luci-app-dns-master/root/usr/share/luci/menu.d/luci-app-dns-master.json`
- `luci-app-dns-master/root/usr/share/rpcd/acl.d/luci-app-dns-master.json`
- `luci-app-dns-master/htdocs/luci-static/resources/view/dns-master/overview.js`


### 2026-02-16: HexoCMS Multi-Instance Enhancement

**Backend Enhancement: secubox-app-hexojs**
- Added backup/restore commands:
  - `hexoctl backup [instance] [name]` - Create full backup
  - `hexoctl backup list` - List all backups with size/timestamp
  - `hexoctl backup delete <name>` - Delete backup
  - `hexoctl restore <name> [instance]` - Restore from backup
- Added GitHub clone support:
  - `hexoctl github clone <repo_url> [instance] [branch]` - Clone from GitHub
  - Supports full Hexo sites with auto npm install
- Added Gitea push support:
  - `hexoctl gitea push [instance] [message]` - Push changes to Gitea
- Added quick-publish command:
  - `hexoctl quick-publish [instance]` - Clean + build + publish in one step
- Added JSON status commands:
  - `hexoctl status-json` - Full container and instance status
  - `hexoctl instance-list-json` - Instance list for RPCD

**RPCD Enhancement: luci.hexojs**
- Added 15 new methods:
  - Instance management: `list_instances`, `create_instance`, `delete_instance`, `start_instance`, `stop_instance`
  - Backup/restore: `list_backups`, `create_backup`, `restore_backup`, `delete_backup`
  - Git integration: `github_clone`, `gitea_push`, `quick_publish`
- Updated ACL with new permissions (read + write)

**Frontend Enhancement: luci-app-hexojs**
- Rewrote `overview.js` with KISS theme:
  - 4-column stats grid (Instances, Posts, Drafts, Backups)
  - Quick actions bar: New Instance, Clone from GitHub/Gitea, New Post, Settings
  - Instance cards with status indicators:
    - Controls: Start/Stop, Quick Publish, Backup, Editor, Preview, Delete
    - Port and domain display
    - Running status badge
  - Backup table with restore/delete actions
  - Create Instance modal (name, title, port)
  - Delete Instance modal with data deletion option
  - GitHub/Gitea clone modal (repo URL, instance, branch)
  - Gitea push modal (commit message)
  - Quick Publish modal with progress
- Updated API with 12 new RPC declarations

**Files Modified:**
- `secubox-app-hexojs/files/usr/sbin/hexoctl` (new commands)
- `luci-app-hexojs/root/usr/libexec/rpcd/luci.hexojs` (new methods)
- `luci-app-hexojs/htdocs/luci-static/resources/hexojs/api.js` (new declarations)
- `luci-app-hexojs/htdocs/luci-static/resources/view/hexojs/overview.js` (KISS rewrite)
- `luci-app-hexojs/root/usr/share/rpcd/acl.d/luci-app-hexojs.json` (new permissions)

### 2026-02-16: Mail Server Alias Management

**Backend Enhancement: secubox-app-mailserver**
- Added `alias_del` function to `users.sh`:
  - Removes alias from valias file
  - Updates Postfix maps
- Added `alias del <alias>` command to `mailctl`

**RPCD Enhancement: luci.mailserver**
- Fixed `alias_add` to read JSON from stdin (ubus compatibility)
- Added `alias_del` method for deleting aliases
- Both methods now work via ubus call

**Files Modified:**
- `secubox-app-mailserver/files/usr/lib/mailserver/users.sh`
- `secubox-app-mailserver/files/usr/sbin/mailctl`
- `luci-app-mailserver/root/usr/libexec/rpcd/luci.mailserver`

### 2026-02-16: Mail Autoconfig & Repair Features

**Mail Autoconfig Setup**
- Created autoconfig files for automatic mail client configuration:
  - `config-v1.1.xml` - Mozilla Thunderbird format
  - `autodiscover.xml` - Microsoft Outlook format  
  - `email.mobileconfig` - Apple iOS/macOS format
- Set up uhttpd instance on port 8025 to serve autoconfig files
- Added HAProxy backends with waf_bypass for autoconfig.secubox.in and autoconfig.gk2.secubox.in
- Created mailctl autoconfig-setup and autoconfig-status commands

**LuCI Enhancement: luci-app-mailserver**
- Added `user_repair` method for mailbox repair (doveadm force-resync)
- Added repair button (🔧) to user actions in overview
- Updated ACL with new permission

**LuCI Enhancement: luci-app-nextcloud**
- Added `list_users` method to list Nextcloud users
- Added `reset_password` method for password reset via OCC
- Updated ACL with new permissions

**Files Modified:**
- `luci-app-mailserver/root/usr/libexec/rpcd/luci.mailserver`
- `luci-app-mailserver/htdocs/luci-static/resources/view/mailserver/overview.js`
- `luci-app-mailserver/root/usr/share/rpcd/acl.d/luci-app-mailserver.json`
- `luci-app-nextcloud/root/usr/libexec/rpcd/luci.nextcloud`
- `luci-app-nextcloud/root/usr/share/rpcd/acl.d/luci-app-nextcloud.json`

### 2026-02-16: Mailserver Password Reset Fix

**Bug Fix: secubox-app-mailserver**
- Fixed SHA512-CRYPT hash corruption in `user_passwd` and `user_add` functions
- Root cause: `$6$` prefix was being interpreted as shell variable when passed through nested shell commands
- Fix: Use `printf` instead of `echo`, write to temp file before piping to container
- Corrected dovecot passwd format: uid:gid 102:105 (vmail user) with `userdb_mail=maildir:/var/mail/domain/user`

**Files Modified:**
- `secubox-app-mailserver/files/usr/lib/mailserver/users.sh`

### 2026-02-16: Nextcloud User Management & WAF Fixes

**LuCI Enhancement: luci-app-nextcloud**
- Added Users tab with user list from OCC
- Added password reset modal for user password changes
- Fixed list_users JSON parsing for Nextcloud user:displayname format

**Nextcloud Mail Integration Fix**
- Set `app.mail.verify-tls-peer=false` to allow self-signed certs
- Set `allow_local_remote_servers=true` for local IMAP access
- Added mailserver certificate to Nextcloud trusted CA store

**WAF/Mitmproxy Route Sync Fix**
- Fixed mitmproxy routes sync between host (/srv/mitmproxy) and container (/srv/mitmproxy-in)
- Enabled WAF for cloud.gk2.secubox.in
- Routes file must be copied to /srv/mitmproxy-in/haproxy-routes.json for mitmproxy-in container

**Files Modified:**
- `luci-app-nextcloud/htdocs/luci-static/resources/view/nextcloud/overview.js`
- `luci-app-nextcloud/root/usr/libexec/rpcd/luci.nextcloud`

**Dovecot Permission Fix (Permanent)**
- Fixed anvil-auth-penalty socket permission issues that caused authentication failures
- Added /run/dovecot permission setup to container startup script (start-mail.sh)
- Ensures correct ownership (dovecot:dovecot) before and after dovecot starts

**Files Modified:**
- `secubox-app-mailserver/files/usr/sbin/mailserverctl` (create_startup_script function)

### 2026-02-16: Mail Reception Fix

**nftables Rules Missing:**
- Port 25 missing from `input_wan` accept rules
- Mail ports missing from `forward_wan` chain (blocked by `drop_to_wan`)
- Fix: Added accept rules for ports 25, 143, 465, 587, 993 in both chains

**Postfix LMDB Fix:**
- Alpine Linux uses LMDB, not Berkeley DB hash
- `virtual_mailbox_maps = hash:` caused "unsupported dictionary type" error
- Fix: Changed to `lmdb:/etc/postfix/vmailbox`

**vmailbox Sync:**
- gk2@secubox.in was missing from vmailbox file
- Added user and rebuilt postmap

**Files Modified:**
- `secubox-app-mailserver/files/usr/sbin/mailserverctl`
- UCI firewall rules persisted for mail port forwarding

### 2026-02-16: Mailctl Firewall & Nextcloud Upgrade

**mailctl Firewall Rules Enhancement:**
- Updated `cmd_firewall_setup()` to add UCI firewall rules for mail ports
- Added input rules for WAN acceptance (ports 25, 143, 465, 587, 993)
- Added forward rules for WAN-to-LAN mailserver forwarding
- Rules now persist across firewall restarts via UCI config

**Nextcloud Upgrade to 31.0.14:**
- Upgraded from 30.0.17 → 31.0.14 using OCC updater
- All apps updated (mail, tasks, external, spreed/Talk)
- Database schema migrations completed successfully
- System running with maintenance mode disabled

**Files Modified:**
- `secubox-app-mailserver/files/usr/sbin/mailctl` (cmd_firewall_setup function)

### 2026-02-17: v0.20.6 Release - Mailserver, Nextcloud & DNS Master Fixes

**Mailserver Dovecot Permissions:**
- Fixed startup script: create login/token-login/empty directories with correct ownership
- Set root:dovenull ownership on login directories (mode 0750)
- Remove stale auth-token-secret.dat on startup (prevents "compromised token" errors)
- Fixed users.sh: user_add and user_passwd now set correct permissions (644 root:dovecot)
- Password reset no longer breaks authentication

**Nextcloud Nginx Fix:**
- Removed overly aggressive `/apps/` location block that was breaking SVG icons
- Static files (.svg, .css, .js) now served correctly
- Added cron job setup for background tasks (every 5 minutes)

**DNS Master POSIX Compatibility:**
- Fixed bump_serial() function for busybox ash compatibility
- Replaced bash-specific ${var:0:8} with POSIX cut -c1-8
- Replaced $((10#$var + 1)) with expr
- del_record now works via RPCD

**LXC Container Auto-Start:**
- Enabled lxc.start.auto = 1 for mailserver, roundcube, nextcloud
- Containers now survive reboots

**Files Modified:**
- `secubox-app-mailserver/files/usr/sbin/mailserverctl`
- `secubox-app-mailserver/files/usr/lib/mailserver/users.sh`
- `secubox-app-nextcloud/files/usr/sbin/nextcloudctl`
- `secubox-app-dns-master/files/usr/sbin/dnsmaster`

**Release:** v0.20.6

### 2026-02-17: WebRadio LuCI App

**luci-app-webradio Package:**
- Added complete WebRadio management interface for OpenWrt
- Dashboard with server status, listeners, now playing info
- Icecast/Ezstream server configuration
- Playlist management with shuffle and upload
- Programming grid scheduler with jingle support
- Live audio input via DarkIce (ALSA)
- Security: SSL/TLS configuration, rate limiting, CrowdSec integration

**Components:**
- 7 LuCI JS views: overview, server, playlist, schedule, jingles, live, security
- RPCD backend (luci.webradio) with 15+ methods
- Scheduler script for cron-based programming grid
- CrowdSec parser and scenarios for Icecast abuse detection
- UCI config for webradio scheduling

**Files Added:**
- `package/secubox/luci-app-webradio/` (17 files, 3337 lines)

**Source Repository:**
- https://github.com/gkerma/webradio-openwrt

### 2026-02-17: Nextcloud LXC Package Enhancement

**nextcloudctl Enhancements:**
- Updated Nextcloud version to 31.0.5
- Added LXC auto-start (lxc.start.auto = 1) for boot persistence
- Added memory limit cgroup configuration (lxc.cgroup2.memory.max)
- Fixed nginx /apps/ path for static assets (CSS, JS, SVG icons)

**RPCD Backend (luci.nextcloud):**
- Added `uninstall` method
- Added `get_storage` method for disk usage stats
- Added `delete_backup` method
- Total: 20 RPCD methods

**LuCI Dashboard:**
- Added Storage tab with disk usage visualization
- Added disk usage progress bar
- Added storage breakdown (user data, backups, total)
- Added delete button for backups
- Enhanced backup management UX

**Files Modified:**
- `secubox-app-nextcloud/files/usr/sbin/nextcloudctl`
- `luci-app-nextcloud/root/usr/libexec/rpcd/luci.nextcloud`
- `luci-app-nextcloud/htdocs/.../overview.js`
- `luci-app-nextcloud/root/usr/share/rpcd/acl.d/luci-app-nextcloud.json`
- `secubox-app-nextcloud/README.md` (full rewrite)

### 2026-02-17: Security KISS Dashboard Enhancements

**Service Monitoring Extensions:**
- Added ndpid (nDPI daemon) to security-threats RPCD status method
- Added Wazuh SIEM to security services monitoring
- Dashboard now shows 6 services: CrowdSec, Wazuh, netifyd, ndpid, mitmproxy, Threat Intel

**Files Modified:**
- `luci-app-secubox-security-threats/root/usr/libexec/rpcd/luci.secubox-security-threats`
- `luci-app-secubox-security-threats/htdocs/.../dashboard.js`

### 2026-02-17: APPS Portal Extensions

**Services Category:**
- Added Streamlit to portal apps (Python data apps and dashboards)
- Added MetaBlogizer to portal apps (AI-powered blog generation)

**Files Modified:**
- `luci-app-secubox-portal/htdocs/.../apps.js`

### 2026-02-17: Container Maintenance

**Fixes:**
- Jellyfin: Started stopped container, enabled auto-start
- Webmail: Restarted dead PHP-FPM process in roundcube container
- Both services now operational

### 2026-02-17: Mailserver Migration Alpine → Debian

**Problem:**
- Alpine Linux mailserver had persistent Dovecot permission issues
- imap-login process couldn't access auth sockets due to UID/GID mismatches
- Webmail logins timing out repeatedly

**Solution:**
- Created new Debian 12 (Bookworm) LXC container
- Installed Postfix + Dovecot with proper Debian packages
- Migrated mail data, users, SSL certificates
- Fixed passwd-file format for Debian Dovecot

**Configuration:**
- Container: `/srv/lxc/mailserver/` (Debian 12)
- IP: 192.168.255.30 (unchanged)
- Ports: 25, 143, 587, 993
- Mail storage: `/var/mail/` with vmail user (uid 5000)
- Old Alpine backup: `/srv/lxc/mailserver-alpine-backup/`

### 2026-02-17: mitmproxy WAF Filters UI

**New LuCI View:**
- Added "WAF Filters" tab to mitmproxy security interface
- Displays all 10 WAF detection categories with enable/disable toggles
- Categories: sqli, xss, lfi, rce, cve_2024, scanners, webmail, api_abuse, nextcloud, roundcube
- Summary stats: total categories, active filters, rule count
- Expandable rules tables showing patterns, descriptions, CVE links

**RPCD Methods:**
- `get_waf_rules` - Returns WAF rules JSON from `/srv/mitmproxy/waf-rules.json`
- `toggle_waf_category` - Enable/disable category in rules file

**Files Created/Modified:**
- `luci-app-mitmproxy/htdocs/.../view/mitmproxy/waf-filters.js` (new)
- `luci-app-mitmproxy/root/usr/libexec/rpcd/luci.mitmproxy` (added methods)
- `luci-app-mitmproxy/root/usr/share/luci/menu.d/luci-app-mitmproxy.json` (menu entry)
- `luci-app-mitmproxy/root/usr/share/rpcd/acl.d/luci-app-mitmproxy.json` (ACL permissions)

### 2026-02-19: Jabber/XMPP Server Packages (Prosody)

**New Packages:**
- `secubox-app-jabber` - LXC-based Prosody XMPP server
- `luci-app-jabber` - LuCI dashboard for Jabber management

**Features:**
- Debian 12 (Bookworm) LXC container with Prosody XMPP server
- Full XMPP support: C2S (5222), S2S (5269), HTTP/BOSH (5280)
- Multi-User Chat (MUC) rooms with message archiving
- HTTP upload for file sharing (10MB default)
- BOSH and WebSocket support for web clients
- SSL/TLS encryption with auto-generated certificates
- Server-to-server federation capability

**CLI Commands (jabberctl):**
- `install/uninstall` - Container lifecycle
- `start/stop/restart/status` - Service control
- `user add/del/passwd/list` - User management
- `room create/delete/list` - MUC room management
- `emancipate <domain>` - Public exposure with HAProxy + SSL + DNS

**LuCI Dashboard:**
- Status overview with service state and user count
- Service controls (start/stop/update/uninstall)
- User management (add/delete users)
- Emancipate workflow for public exposure
- Connection info display (XMPP, BOSH, WebSocket URLs)
- Log viewer with refresh

### 2026-02-19: Jabber/XMPP Deployment and Fixes

**Deployment:**
- Installed Jabber at xchat.gk2.secubox.in
- Created admin user: admin@xchat.gk2.secubox.in
- Fixed pf.gk2.secubox.in routing (was pointing to jabber, now streamlit_prompt)

**Fixes Applied:**
- Fixed Prosody process detection (lua.*prosody pattern instead of prosody)
- Fixed startup script to run Prosody as prosody user (not root)
- Fixed SSL certificate generation (openssl instead of prosodyctl)
- Added xchat.gk2.secubox.in route to mitmproxy-in haproxy-routes.json
- Fixed route IP from 127.0.0.1 to 192.168.255.1 for container accessibility

### 2026-02-19: VoIP + Jabber Integration (Asterisk PBX)

**New Packages:**
- `secubox-app-voip` - LXC-based Asterisk PBX server
- `luci-app-voip` - LuCI dashboard for VoIP management

**Features:**
- Debian 12 (Bookworm) LXC container with Asterisk PBX
- OVH Telephony API integration for SIP trunk auto-provisioning
- SIP extension management with PJSIP
- Asterisk ARI/AMI support for call control
- Click-to-call web interface
- HAProxy integration with WebRTC support
- Procd service management

**CLI Commands (voipctl):**
- `install/uninstall` - Container lifecycle
- `start/stop/restart/status` - Service control
- `ext add/del/passwd/list` - Extension management
- `trunk add ovh/manual` - SIP trunk configuration
- `trunk test/status` - Trunk connectivity testing
- `call/hangup/calls` - Call origination and control
- `vm list/play/delete` - Voicemail management
- `configure-haproxy` - WebRTC proxy setup
- `emancipate <domain>` - Public exposure

**OVH Telephony Integration (ovh-telephony.sh):**
- API signature generation (HMAC-SHA1)
- Billing accounts and SIP lines discovery
- SIP credentials retrieval and password reset
- SMS sending via OVH SMS API
- Auto-provisioning flow for trunk configuration

**LuCI Dashboard (luci-app-voip):**
- Overview with container/Asterisk/trunk status
- Extensions management (add/delete)
- Trunks configuration (OVH auto-provision, manual)
- Click-to-call dialer with extension selector
- Active calls display with live polling
- Quick dial buttons for extensions
- Logs viewer

**Jabber VoIP Integration (Phase 3):**
- Jingle VoIP support via mod_external_services
- STUN/TURN server configuration
- SMS relay via OVH (messages to sms@domain)
- Voicemail notifications via Asterisk AMI → XMPP
- New jabberctl commands: jingle enable/disable/status, sms config/send, voicemail-notify
- New RPCD methods: jingle_status/enable/disable, sms_status/config/send, voicemail_status/config
- Updated UCI config with jingle, sms, and voicemail sections

**Files Created:**
- `package/secubox/secubox-app-voip/Makefile`
- `package/secubox/secubox-app-voip/files/etc/config/voip`
- `package/secubox/secubox-app-voip/files/etc/init.d/voip`
- `package/secubox/secubox-app-voip/files/usr/sbin/voipctl`
- `package/secubox/secubox-app-voip/files/usr/lib/secubox/voip/ovh-telephony.sh`
- `package/secubox/luci-app-voip/Makefile`
- `package/secubox/luci-app-voip/root/usr/libexec/rpcd/luci.voip`
- `package/secubox/luci-app-voip/root/usr/share/luci/menu.d/luci-app-voip.json`
- `package/secubox/luci-app-voip/root/usr/share/rpcd/acl.d/luci-app-voip.json`
- `package/secubox/luci-app-voip/htdocs/.../voip/api.js`
- `package/secubox/luci-app-voip/htdocs/.../view/voip/overview.js`
- `package/secubox/luci-app-voip/htdocs/.../view/voip/extensions.js`
- `package/secubox/luci-app-voip/htdocs/.../view/voip/trunks.js`
- `package/secubox/luci-app-voip/htdocs/.../view/voip/click-to-call.js`

**Files Modified:**
- `package/secubox/secubox-app-jabber/files/usr/sbin/jabberctl` (added VoIP integration)
- `package/secubox/secubox-app-jabber/files/etc/config/jabber` (jingle/sms/voicemail sections)
- `package/secubox/luci-app-jabber/root/usr/libexec/rpcd/luci.jabber` (VoIP methods)
- `package/secubox/luci-app-jabber/root/usr/share/rpcd/acl.d/luci-app-jabber.json` (VoIP ACL)

37. **WAF VoIP/XMPP Protection & Jitsi Meet (2026-02-19)**
    - Added 4 new WAF categories to mitmproxy for VoIP/Jabber protection:
      - `voip`: 12 SIP/VoIP security patterns (header injection, ARI abuse, AMI injection)
      - `xmpp`: 10 XMPP/Jabber patterns (XSS, XXE, BOSH hijack, OOB file access)
      - `cve_voip`: 9 CVE patterns for Asterisk/FreePBX/Kamailio/OpenSIPS
      - `cve_xmpp`: 8 CVE patterns for Prosody/ejabberd/Tigase/Strophe
    - Updated `waf-rules.json` to version 1.1.0 with comprehensive attack detection
    - Added autoban options `ban_voip` and `ban_xmpp` for automatic IP blocking
    - Updated `mitmproxy-waf-sync` to include new categories in JSON sync

    - **Self-Hosted Jitsi Meet**: Full deployment in LXC container
      - Prosody XMPP server on port 5380 (internal only)
      - Jicofo conference focus component
      - JVB (Jitsi Videobridge) for WebRTC media
      - Nginx reverse proxy on port 9088
      - HAProxy vhost at `meet.gk2.secubox.in` with Let's Encrypt SSL
      - WAF bypass enabled for WebRTC compatibility
      - Webchat updated to use self-hosted Jitsi instead of meet.jit.si
      - Full video conferencing capability without external dependencies

38. **VoIP PBX Package (2026-02-19)**
    - Created `secubox-app-voip` package for Asterisk PBX in LXC container
      - OVH SIP trunk auto-provisioning via Telephony API
      - Extension management with voicemail support
      - Click-to-call functionality
      - WebRTC support via PJSIP
    - Created `luci-app-voip` LuCI interface
      - Overview dashboard with status cards
      - Extension management view
      - SIP trunk configuration
      - Click-to-call dialer with dialpad
    - Key files:
      - `/usr/sbin/voipctl` - Main control script
      - `/usr/lib/secubox/voip/ovh-telephony.sh` - OVH API helper
      - `/usr/lib/secubox/voip/asterisk-config.sh` - Config generator
    - Fixed Jitsi Meet ThreadPoolExecutor crash by changing Jicofo REST port (8888→8878)

39. **Jabber VoIP LuCI Integration (2026-02-19)**
    - Updated `luci-app-jabber` with full VoIP integration sections in overview.js:
      - **Jingle VoIP**: Enable/Disable toggle, STUN server config, TURN status display
      - **SMS Relay**: OVH API status indicator, sender name config, test SMS send form
      - **Voicemail Notifications**: AMI connection info, notification JID configuration
    - Added 9 new RPC methods to `jabber/api.js`:
      - `jingleStatus`, `jingleEnable`, `jingleDisable`
      - `smsStatus`, `smsConfig`, `smsSend`
      - `voicemailStatus`, `voicemailConfig`
    - Updated `overview.js` with VoIP sections after Connection Info:
      - Status badges for enabled/disabled states
      - STUN/TURN server configuration inputs
      - SMS test form with phone number and message fields
      - Voicemail JID configuration with Configure button
    - ACL already configured in previous RPCD backend update
    - Key files modified:
      - `package/secubox/luci-app-jabber/htdocs/luci-static/resources/jabber/api.js`
      - `package/secubox/luci-app-jabber/htdocs/luci-static/resources/view/jabber/overview.js`

40. **VoIP Call Recording Feature (2026-02-19)**
    - Added comprehensive call recording system to `secubox-app-voip`:
      - Asterisk MixMonitor integration for automatic call recording
      - Configurable recording format (wav) and retention policy
      - Daily directory organization (YYYYMMDD/HHMMSS-caller-dest.wav)
    - New `voipctl rec` commands:
      - `rec enable` / `rec disable` - Toggle call recording
      - `rec status` - JSON status with statistics
      - `rec list [date]` - List recordings by date
      - `rec play <file>` - Play recording
      - `rec download <file>` - Get file path/content
      - `rec delete <file>` - Delete recording
      - `rec cleanup [days]` - Remove old recordings
    - New LuCI recordings view (`voip/recordings.js`):
      - Status dashboard with total/today counts and storage used
      - Enable/Disable toggle buttons
      - Cleanup old recordings button
      - Date filter for browsing recordings
      - Play, Download, Delete actions for each recording
      - In-browser audio player with base64 content support
    - RPCD methods added to `luci.voip`:
      - `rec_status`, `rec_enable`, `rec_disable`
      - `rec_list`, `rec_delete`, `rec_download`, `rec_cleanup`
    - UCI config section: `config recording 'recording'` with enabled/format/retention_days
    - Menu entry: Services → VoIP PBX → Recordings
    - Note: OVH SIP trunk registration requires correct password from OVH Manager

41. **Matrix Homeserver Integration (2026-02-19)**
    - Created `secubox-app-matrix` package for Conduit Matrix server:
      - Lightweight Rust-based homeserver (~15MB binary, ~500MB RAM)
      - LXC Debian Bookworm container with pre-built ARM64/x86_64 binaries
      - E2EE messaging with federation support
      - RocksDB database for performance
    - New `matrixctl` CLI commands:
      - `install`, `uninstall`, `update` - Container lifecycle
      - `start`, `stop`, `restart`, `status` - Service control
      - `user add/del/passwd/list` - User management
      - `room list/create/delete` - Room management
      - `federation test/status` - Federation testing
      - `configure-haproxy`, `emancipate <domain>` - Punk Exposure
      - `identity link/unlink` - DID integration
      - `mesh publish/unpublish` - P2P service registry
      - `backup`, `restore` - Data persistence
    - Created `luci-app-matrix` LuCI dashboard:
      - Install wizard for new deployments
      - Status card with running state, version, features
      - Service controls (Start/Stop/Update/Uninstall)
      - User management form
      - Emancipate form for public exposure
      - Identity integration section (DID linking)
      - Mesh publication toggle
      - Logs viewer with refresh
    - RPCD methods (18 total): status, logs, start, stop, install, uninstall, update,
      emancipate, configure_haproxy, user_add, user_del, federation_status,
      identity_status, identity_link, identity_unlink, mesh_status, mesh_publish, mesh_unpublish
    - UCI config sections: main, server, federation, admin, database, network, identity, mesh
    - v1.0.0 roadmap: Matrix integration complements VoIP/Jabber for full mesh communication stack
    - Files created:
      - `package/secubox/secubox-app-matrix/` (Makefile, UCI, init.d, matrixctl)
      - `package/secubox/luci-app-matrix/` (RPCD, ACL, menu, overview.js, api.js)

25. **HexoJS KISS Static Upload & Multi-User Authentication (2026-02-20)**
    - Added multi-user/multi-instance authentication:
      - HAProxy Basic Auth integration with apr1 password hashing
      - `hexoctl user add/del/passwd/list/grant/revoke` commands
      - `hexoctl auth enable/disable/status/haproxy` commands
      - UCI config sections for users and per-instance auth
    - KISS Static Upload workflow (no Hexo build process):
      - `hexoctl static create <name>` - Create static-only site
      - `hexoctl static upload <file> [inst]` - Upload HTML/CSS/JS directly
      - `hexoctl static publish [inst]` - Copy to /www/ for uhttpd serving
      - `hexoctl static quick <file> [inst]` - One-command upload + publish
      - `hexoctl static list [inst]` - List static files
      - `hexoctl static serve [inst]` - Python/busybox httpd server
      - `hexoctl static delete <name>` - Delete static instance
    - Goal: Fast publishing experiment (KISSS) for HTML files without Node.js/Hexo build
    - Tested and verified on router with immediate uhttpd serving

26. **SaaS Relay CDN Caching & Session Replay (2026-02-20)**
    - Enhanced `secubox-app-saas-relay` with CDN caching layer and multi-user session replay
    - CDN Cache features:
      - Configurable cache profiles: minimal, gandalf (default), aggressive
      - Profile-based caching rules (content types, TTL, max size, exclude patterns)
      - File-based cache storage with metadata for expiry tracking
      - Cache-Control header respect (max-age, no-store, private)
      - `X-SaaSRelay-Cache: HIT/MISS` header for debugging
    - Session Replay features:
      - Three modes: shared (default), per_user, master
      - Shared mode: All SecuBox users share same session cookies
      - Per-user mode: Each user gets their own session storage
      - Master mode: One user (admin) authenticates, others replay their session
    - New CLI commands:
      - `saasctl cache {status|clear|profile|enable|disable}` - Cache management
      - `saasctl session {status|mode|master|enable|disable}` - Session management
    - Enhanced mitmproxy addon (415 lines) with:
      - Response caching before network request
      - Cache key generation with SHA-256 URL hashing
      - Per-user session file storage with fallback to master
      - Activity logging with emoji indicators
    - UCI config sections added: cache, cache_profile (3), session_replay
    - Config JSON export for container: config.json + services.json

27. **Matrix Homeserver (Conduit) Integration (2026-02-20)**
    - E2EE mesh messaging using Conduit Matrix homeserver (v0.10.12)
    - `secubox-app-matrix` package with LXC container management:
      - Pre-built ARM64 Conduit binary from GitLab artifacts
      - Debian Bookworm base, RocksDB backend
      - 512MB RAM limit, persistent data in /srv/matrix
    - `matrixctl` CLI tool (1279 lines):
      - Container: install, uninstall, update, check, shell
      - Service: start, stop, restart, status, logs
      - Users: add, del, passwd, list
      - Rooms: list, create, delete
      - Federation: test, status
      - Exposure: configure-haproxy, emancipate
      - Identity: link, unlink, status (DID integration)
      - Mesh: publish, unpublish
      - Backup: backup, restore
    - `luci-app-matrix` dashboard:
      - Install wizard for first-time setup
      - Status cards with feature badges
      - Service controls
      - User management form
      - Emancipate (public exposure) form
      - Identity/DID linking section
      - P2P mesh publication toggle
      - Logs viewer with refresh
    - RPCD methods (17 total): status, logs, start, stop, install, uninstall, update,
      emancipate, configure_haproxy, user_add, user_del, federation_status,
      identity_status, identity_link, identity_unlink, mesh_status, mesh_publish, mesh_unpublish
    - UCI config sections: main, server, federation, admin, database, network, identity, mesh
    - Matrix API responding with v1.1-v1.12 support
    - Files: `package/secubox/secubox-app-matrix/`, `package/secubox/luci-app-matrix/`

28. **Log Denoising for System Hub (2026-02-20)**
    - Added smart log denoising to System Hub inspired by SysWarden patterns (Evolution #3)
    - Three denoising modes:
      - **RAW**: All logs displayed without filtering (default)
      - **SMART**: Known threat IPs highlighted, all logs visible, noise ratio computed
      - **SIGNAL_ONLY**: Only new/unknown threats shown, known IPs filtered out
    - Noise filtering integrates with:
      - IP Blocklist (Evolution #1): ipset with 100k+ blocked IPs
      - CrowdSec decisions: Active bans from threat detection
    - RPCD methods added to `luci.system-hub`:
      - `get_denoised_logs(lines, filter, mode)`: Returns logs with noise ratio stats
      - `get_denoise_stats()`: Returns known threat counts and blocklist status
    - LuCI dashboard enhancements:
      - Denoise mode selector panel (RAW/SMART/SIGNAL ONLY)
      - Mode description tooltip
      - Noise ratio percentage indicator with color coding
      - Known threats counter from ipblocklist + CrowdSec
      - Warning badge when IP Blocklist disabled
      - Side panel metrics include noise stats when filtering active
    - Implementation:
      - Extracts IPs from log lines using regex
      - Skips private/local IP ranges (10.*, 172.16-31.*, 192.168.*, 127.*)
      - Checks both nftables sets and iptables ipsets for compatibility
      - Queries CrowdSec decisions via `cscli decisions list`
    - Part of SysWarden Evolution plan (Evolution #3 of 4)
    - Files modified:
      - `luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub`
      - `luci-app-system-hub/root/usr/share/rpcd/acl.d/luci-app-system-hub.json`
      - `luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js`
      - `luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/logs.js`
      - `luci-app-system-hub/Makefile` (version bumped to 0.5.2-r1)

28. **IP Blocklist - Static Threat Defense Layer (2026-02-20)**
    - Evolution #1 from SysWarden-inspired EVOLUTION-PLAN.md
    - Created `secubox-app-ipblocklist` backend package:
      - `ipblocklist-update.sh` - Main update script with ipset management
      - UCI config: sources (blocklist URLs), whitelist, update interval
      - Cron hourly update job
      - Supports nftables (fw4) and legacy iptables backends
      - Default sources: Data-Shield (~100k IPs), Firehol Level 1
      - CLI: start, stop, update, flush, status, test, logs
    - Created `luci-app-ipblocklist` dashboard:
      - Status card: entry count, memory usage, last update
      - Enable/Disable toggle, Update Now, Flush buttons
      - Test IP form with blocked/allowed result
      - Sources manager with add/remove URLs
      - Whitelist manager with add/remove entries
      - Logs viewer with monospace output
    - RPCD methods (12 total): status, logs, sources, whitelist, update, flush,
      test_ip, set_enabled, add_source, remove_source, add_whitelist, remove_whitelist
    - Architecture: Layer 1 pre-emptive blocking before CrowdSec Layer 2 reactive
    - Files: `package/secubox/secubox-app-ipblocklist/`, `package/secubox/luci-app-ipblocklist/`

29. **AbuseIPDB Reporter - Evolution #2 (2026-02-20)**
    - Evolution #2 from SysWarden-inspired EVOLUTION-PLAN.md
    - Added AbuseIPDB reporting to CrowdSec Dashboard (v0.8.0):
      - New "AbuseIPDB" tab in CrowdSec Dashboard navigation
      - UCI config `/etc/config/crowdsec_abuseipdb` for API key and settings
      - `crowdsec-reporter.sh` CLI tool for IP reporting
      - Cron job for automatic reporting every 15 minutes
    - Reporter features:
      - Report CrowdSec blocked IPs to AbuseIPDB community database
      - Check IP reputation with confidence score
      - Cooldown to prevent duplicate reports (15 min default)
      - Daily/weekly/total stats tracking
      - Rate limiting with 1-second delay between reports
    - RPCD handler `luci.crowdsec-abuseipdb` with 9 methods:
      - status, history, check_ip, report, set_enabled
      - set_api_key, get_config, save_config, logs
    - Dashboard features:
      - Status card with reported counts
      - Enable/Disable and Report Now buttons
      - API key configuration form
      - IP reputation checker
      - Recent reports history table
      - Logs viewer
    - Attack categories: 18 (Brute-Force), 21 (Web App Attack)
    - Files: `luci-app-crowdsec-dashboard/root/usr/sbin/crowdsec-reporter.sh`,
      `luci-app-crowdsec-dashboard/htdocs/luci-static/resources/view/crowdsec-dashboard/reporter.js`

30. **Log Denoising RPCD Fix (2026-02-21)**
    - Fixed `get_denoise_stats` RPCD method returning "No response" (exit code 251)
    - Root cause: `jsonfilter -e '@[*]'` doesn't work with CrowdSec JSON output
    - Solution: Use `grep -c '"id":'` to count CrowdSec decisions instead
    - Added fallback safety checks for empty/invalid counts
    - Added missing ipset existence check before trying to list IPs
    - Version bumped to 0.5.2-r2
    - Files modified: `luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub`

31. **PeerTube Auto-Upload Import (2026-02-21)**
    - Enhanced video import to automatically upload to PeerTube after yt-dlp download
    - Flow: Download → Extract metadata → OAuth authentication → API upload → Cleanup
    - New features:
      - OAuth token acquisition from UCI-stored admin credentials
      - Video upload via PeerTube REST API (POST /api/v1/videos/upload)
      - Real-time job status polling with `import_job_status` method
      - Progress indicator in LuCI UI (downloading → uploading → completed)
      - Automatic cleanup of temp files after successful upload
    - RPCD methods:
      - `import_video`: Now includes auto-upload (replaces download-only)
      - `import_job_status`: Poll import job progress by job_id
    - Prerequisites: Admin password stored in UCI (`uci set peertube.admin.password`)
    - Version bumped to 1.1.0
    - Files modified:
      - `luci-app-peertube/root/usr/libexec/rpcd/luci.peertube`
      - `luci-app-peertube/htdocs/luci-static/resources/view/peertube/overview.js`
      - `luci-app-peertube/htdocs/luci-static/resources/peertube/api.js`
      - `luci-app-peertube/root/usr/share/rpcd/acl.d/luci-app-peertube.json`

32. **Streamlit KISS One-Click Features (2026-02-21)**
    - Simplified dashboard to KISS UI pattern with status badges
    - New RPCD methods:
      - `upload_and_deploy`: One-click upload creates app + instance + starts
      - `emancipate_instance`: Create HAProxy vhost with SSL for instance
      - `unpublish`: Remove HAProxy vhost while preserving instance
      - `set_auth_required`: Toggle authentication requirement
      - `get_exposure_status`: Get all instances with cert validity/expiry
    - Dashboard features:
      - One-click deploy form (name + domain + file upload)
      - Instances table with status badges (Running/Stopped, SSL valid/missing)
      - Action buttons: Start/Stop, Expose/Unpublish, Auth toggle
    - Version bumped to 1.0.0-r11
    - Files modified:
      - `luci-app-streamlit/root/usr/libexec/rpcd/luci.streamlit`
      - `luci-app-streamlit/htdocs/luci-static/resources/view/streamlit/dashboard.js`
      - `luci-app-streamlit/htdocs/luci-static/resources/streamlit/api.js`
      - `luci-app-streamlit/root/usr/share/rpcd/acl.d/luci-app-streamlit.json`

33. **MetaBlogizer KISS One-Click Features (2026-02-21)**
    - Applied same KISS UI pattern from Streamlit to MetaBlogizer
    - New RPCD methods:
      - `upload_and_create_site`: One-click deploy with auto HAProxy setup
      - `unpublish_site`: Remove HAProxy vhost while preserving content
      - `set_auth_required`: Toggle authentication requirement per site
      - `get_sites_exposure_status`: Exposure/cert status for all sites
    - Dashboard features:
      - One-click deploy form (name + domain + file upload)
      - Sites table with status badges (Running, SSL OK/missing, Auth)
      - Action buttons: Share, Upload, Expose/Unpublish, Lock/Unlock, Delete
    - Files modified:
      - `luci-app-metablogizer/root/usr/libexec/rpcd/luci.metablogizer`
      - `luci-app-metablogizer/htdocs/luci-static/resources/view/metablogizer/dashboard.js`
      - `luci-app-metablogizer/htdocs/luci-static/resources/metablogizer/api.js`
      - `luci-app-metablogizer/root/usr/share/rpcd/acl.d/luci-app-metablogizer.json`

54. **Matrix/Conduit E2EE Messaging Integration (2026-02-21)**
    - New `secubox-app-matrix` package — Conduit Matrix homeserver in LXC container.
    - New `luci-app-matrix` package — LuCI dashboard for Matrix management.
    - **Backend (matrixctl CLI)**:
      - Container lifecycle: `install`, `uninstall`, `update`
      - Service control: `start`, `stop`, `restart`, `status`
      - User management: `user add/del/passwd/list`
      - Room management: `room create/delete/list`
      - Exposure: `configure-haproxy`, `emancipate <domain>`
      - Identity: `identity link/unlink` (DID integration)
      - Mesh: `mesh publish/unpublish` (P2P service discovery)
      - Backup: `backup`, `restore`
    - **RPCD methods (17 total)**:
      - Read: `status`, `logs`, `federation_status`, `identity_status`, `mesh_status`
      - Write: `start`, `stop`, `install`, `uninstall`, `update`, `emancipate`, `configure_haproxy`, `user_add`, `user_del`, `identity_link`, `identity_unlink`, `mesh_publish`, `mesh_unpublish`
    - **Dashboard features**:
      - Install wizard for first-time setup
      - Status cards with connection badges
      - Service controls (Start/Stop/Restart)
      - User management table
      - Emancipate form for public exposure
      - Identity/DID integration section
      - Mesh publication controls
      - Log viewer
    - Container: Debian Bookworm arm64 + pre-built Conduit binary (~15MB)
    - Resources: 512MB RAM, 2GB storage
    - Catalog: Added to apps-local.json with "messaging" category
    - Files:
      - `secubox-app-matrix/`: Makefile, UCI config, init script, matrixctl (1279 lines)
      - `luci-app-matrix/`: RPCD handler (461 lines), ACL, menu, overview.js (377 lines), api.js (137 lines)

55. **SecuBox KISS UI Full Regeneration (2026-02-21)**
    - Complete KISS pattern rewrite of all core SecuBox LuCI views.
    - Removed legacy dependencies: SecuNav, Theme, Cascade, SbHeader.
    - All views now use inline CSS with dark mode support via `prefers-color-scheme`.
    - Unified styling across all SecuBox views with KissTheme.wrap().
    - **Files rewritten**:
      - `modules.js`: 565→280 lines — Module grid with filter tabs, install/enable actions
      - `monitoring.js`: 442→245 lines — Live SVG charts, system stats, 5s polling
      - `alerts.js`: 451→255 lines — Alert timeline, severity filters, dismiss actions
      - `settings.js`: 540→220 lines — UCI form with header chips
      - `services.js`: 1334→410 lines — Services registry, provider status, health checks
    - **Total reduction**: 3,332→1,410 lines (~58% less code)
    - **CSS optimization**: services.js reduced from 680 to 170 lines of inline CSS
    - All views share consistent styling patterns:
      - `.sb-header` with chips for stats
      - `.sb-grid` responsive card layouts
      - `.sb-btn` action buttons with hover states
      - Dark mode via CSS media queries
    - No external CSS file dependencies — fully self-contained views

56. **Lyrion Stream Integration (2026-02-21)**
    - New `secubox-app-squeezelite` package — Virtual Squeezebox player for Lyrion Music Server.
    - New `secubox-app-lyrion-bridge` package — Audio bridge from Squeezelite to WebRadio/Icecast.
    - **Squeezelite CLI (squeezelitectl)**:
      - Service control: `start`, `stop`, `restart`, `enable`, `disable`, `status`
      - Connection: `discover` (auto-find Lyrion), `connect [server]`, `disconnect`
      - Audio: `devices` (list outputs), `output [device]` (set output)
      - Streaming: `fifo enable [path]`, `fifo disable`, `fifo status`
    - **Lyrion Bridge CLI (lyrionstreamctl)**:
      - Setup: `setup [lyrion-ip]` — Full pipeline configuration
      - Service: `start`, `stop`, `restart`, `enable`, `disable`, `status`
      - Config: `config mount|bitrate|name|server [value]`
      - Operations: `expose <domain>` (HAProxy+SSL), `logs [lines]`
    - **Pipeline Architecture**:
      - Lyrion Server → Squeezelite (FIFO output /tmp/squeezelite.pcm)
      - Squeezelite → FFmpeg (PCM to MP3 encoding)
      - FFmpeg → Icecast (HTTP streaming)
    - **FFmpeg Bridge (ffmpeg-bridge.sh)**:
      - Reads PCM from FIFO (s16le, 44100Hz, stereo)
      - Encodes to MP3 (configurable bitrate, default 192kbps)
      - Streams to Icecast mount point
      - Auto-syncs metadata from Lyrion (artist/title)
      - Auto-reconnect on stream errors
    - UCI configs: `/etc/config/squeezelite`, `/etc/config/lyrion-bridge`
    - Files:
      - `secubox-app-squeezelite/`: Makefile, UCI config, init script, squeezelitectl
      - `secubox-app-lyrion-bridge/`: Makefile, UCI config, init script, lyrionstreamctl, ffmpeg-bridge.sh

57. **TURN Server for WebRTC (2026-02-21)**
    - New `secubox-app-turn` package — coturn-based TURN/STUN server for NAT traversal.
    - Required for Jitsi Meet when direct P2P connections fail (symmetric NAT, firewalls).
    - **TURN CLI (turnctl)**:
      - Service: `start`, `stop`, `restart`, `enable`, `disable`, `status`
      - Setup: `setup-jitsi [jitsi-domain] [turn-domain]` — Configure for Jitsi Meet
      - SSL: `ssl [domain]` — Generate/install SSL certificates
      - Network: `expose [domain]` — Configure DNS and firewall rules
      - Auth: `credentials [user] [ttl]` — Generate time-limited WebRTC credentials
      - Testing: `test [host]` — Test TURN connectivity
      - Logs: `logs [lines]` — View server logs
    - **Ports**: 3478 (STUN/TURN), 5349 (TURN over TLS), 49152-65535 (media relay)
    - **Security**: 
      - HMAC-SHA1 time-limited credentials (REST API compatible)
      - Blocked peer IPs: RFC1918, localhost, link-local
      - Auto-generated static auth secret
    - **Jitsi Integration**: Added `jitsctl setup-turn [domain]` command
    - UCI config: `/etc/config/turn` (sections: main, ssl, limits, log)
    - Files:
      - `secubox-app-turn/Makefile`
      - `secubox-app-turn/files/etc/config/turn`
      - `secubox-app-turn/files/etc/init.d/turn`
      - `secubox-app-turn/files/usr/sbin/turnctl`
    - Modified:
      - `secubox-app-jitsi/files/usr/sbin/jitsctl` — Added `setup-turn` command

58. **WebRadio LuCI & Lyrion Bridge UI (2026-02-21)**
    - New `luci-app-webradio/view/webradio/lyrion.js` — Lyrion Stream Bridge dashboard.
    - **Lyrion Bridge Tab Features**:
      - Architecture diagram: Lyrion → Squeezelite → FIFO → FFmpeg → Icecast
      - Live status cards: Lyrion online, Squeezelite running, FFmpeg encoding, Mount active
      - Now Playing display with artist/title from Icecast metadata
      - Listener count from Icecast stats
      - Quick Setup: One-click pipeline configuration with Lyrion IP input
      - Bridge Control: Start/Stop buttons for the streaming pipeline
      - Stream URL: Direct link + embedded HTML5 audio player
    - **RPCD Methods Added** (luci.webradio):
      - `bridge_status` — Get Lyrion/Squeezelite/FFmpeg/Mount status
      - `bridge_start` — Start streaming pipeline
      - `bridge_stop` — Stop streaming pipeline
      - `bridge_setup [lyrion_server]` — Configure full pipeline
    - ACL updated: `luci-app-webradio.json` with bridge methods
    - Menu updated: Added "Lyrion Bridge" tab (order 80)
    - Files:
      - `luci-app-webradio/htdocs/luci-static/resources/view/webradio/lyrion.js` (196 lines)
      - Modified: `luci.webradio` RPCD handler, ACL, menu

59. **TURN Server LuCI Dashboard (2026-02-21)**
    - New `luci-app-turn` package — Full TURN server management UI.
    - **Overview Tab Features**:
      - Status chips: Running/Stopped, Realm, Port
      - Service Control: Start, Stop, Enable/Disable Autostart
      - Port Status: UDP 3478, TCP 5349 with listening indicators
      - External IP detection for STUN responses
      - Jitsi Integration: One-click setup with domain inputs
      - SSL & Expose: Certificate generation and DNS/firewall configuration
      - Credential Generator: Time-limited TURN credentials (JSON output)
      - Logs viewer: Real-time server logs
    - **RPCD Handler** (luci.turn):
      - `status` — Service and port status
      - `start/stop/enable/disable` — Service control
      - `setup_jitsi [jitsi_domain] [turn_domain]` — Jitsi configuration
      - `ssl [domain]` — SSL certificate setup
      - `expose [domain]` — DNS and firewall configuration
      - `credentials [username] [ttl]` — Generate WebRTC credentials
      - `logs [lines]` — Fetch server logs
    - KISS UI pattern with inline CSS and dark mode support
    - Files:
      - `luci-app-turn/Makefile`
      - `luci-app-turn/htdocs/luci-static/resources/view/turn/overview.js` (229 lines)
      - `luci-app-turn/root/usr/libexec/rpcd/luci.turn` (shell RPCD handler)
      - `luci-app-turn/root/usr/share/luci/menu.d/luci-app-turn.json`
      - `luci-app-turn/root/usr/share/rpcd/acl.d/luci-app-turn.json`

60. **WebRadio HTTPS Stream via HAProxy (2026-02-21)**
    - Configured `stream.gk2.secubox.in` for HTTPS audio streaming.
    - **Problem Solved**: Mixed content blocking — HTTPS player cannot load HTTP audio.
    - **HAProxy Configuration**:
      - New backend `icecast_lyrion` with HTTP/1.1 forced (`proto=h1`, `http_reuse=never`)
      - Vhost `stream.gk2.secubox.in` → Icecast port 8000 with WAF bypass
      - Let's Encrypt SSL certificate via ACME webroot mode
    - **Web Player Updated** (`/srv/webradio/player/index.html`):
      - Stream URL: `https://stream.gk2.secubox.in/lyrion`
      - Status JSON: `https://stream.gk2.secubox.in/status-json.xsl`
      - Removes mixed content errors in browser
    - **Portal Integration**: WebRadio added to SecuBox portal (Cloud & Media section)
    - **Endpoints**:
      - `https://radio.gk2.secubox.in/` — Web player interface
      - `https://stream.gk2.secubox.in/lyrion` — HTTPS audio stream
      - `https://stream.gk2.secubox.in/status-json.xsl` — Icecast metadata

61. **Release v0.26.0 (2026-02-21)**
    - Tagged and pushed v0.26.0 with all WebRadio/TURN/Lyrion features.
    - **New Packages**:
      - `luci-app-webradio` — Web radio management + Lyrion bridge tab
      - `luci-app-turn` — TURN/STUN server UI for WebRTC
      - `secubox-app-lyrion-bridge` — Lyrion → Icecast streaming pipeline
      - `secubox-app-squeezelite` — Virtual Squeezebox audio player
      - `secubox-app-turn` — TURN server with Jitsi integration
      - `secubox-app-webradio` — Icecast web radio server
    - **Highlights**:
      - HTTPS streaming via HAProxy (stream.gk2.secubox.in)
      - Schedule-based programming with jingles
      - CrowdSec security integration
      - Time-limited TURN credentials for WebRTC
    - 31 files changed, 3542 insertions

62. **TURN Server Nextcloud Talk Integration (2026-02-21)**
    - New `turnctl setup-nextcloud [turn-domain] [use-port-443]` command.
    - Configures coturn for Nextcloud Talk compatibility:
      - Uses port 443 by default (best firewall traversal)
      - Generates static-auth-secret if not exists
      - Auto-detects external IP
      - Sets up SSL certificate
    - Outputs ready-to-paste settings for Nextcloud Talk admin:
      - STUN server: `turn.domain:3478`
      - TURN server: `turn.domain:443`
      - TURN secret + protocol settings
    - LuCI integration:
      - New "Nextcloud Talk" section in TURN overview
      - One-click setup with settings display
      - RPC method: `setup_nextcloud`
    - ACL updated with `setup_nextcloud` permission
    - Files modified:
      - `secubox-app-turn/files/usr/sbin/turnctl` (+70 lines)
      - `luci-app-turn/htdocs/luci-static/resources/view/turn/overview.js`
      - `luci-app-turn/root/usr/libexec/rpcd/luci.turn`
      - `luci-app-turn/root/usr/share/rpcd/acl.d/luci-app-turn.json`

63. **PeerTube Transcript & AI Analysis Tool (2026-02-21)**
    - New `peertube-analyse` CLI tool (778 lines, POSIX-compatible).
    - **Pipeline Architecture**:
      1. **Metadata**: yt-dlp --dump-json → `<slug>.meta.json`
      2. **Subtitles**: PeerTube API check + yt-dlp download → VTT → TXT
      3. **Whisper**: ffmpeg audio extraction → local transcription (fallback)
      4. **Claude AI**: Structured intelligence analysis → Markdown report
    - **CLI Flags**:
      - `--url <url>` — PeerTube video URL
      - `--no-whisper` — Subtitles only, disable Whisper
      - `--force-whisper` — Force transcription even with subtitles
      - `--no-analyse` — Skip Claude AI analysis
      - `--model <name>` — Whisper model (tiny/base/small/medium/large-v3)
      - `--lang <code>` — Language code (default: fr)
    - **Output Structure**:
      ```
      ./output/<slug>/
      ├── <slug>.meta.json      # Video metadata
      ├── <slug>.fr.vtt         # Original subtitles (if available)
      ├── <slug>.transcript.txt # Plain text transcript
      └── <slug>.analyse.md     # Claude AI analysis
      ```
    - **Claude Analysis Structure**:
      1. Résumé exécutif (5 lignes max)
      2. Thèmes principaux et sous-thèmes
      3. Acteurs/entités mentionnés
      4. Points factuels clés et révélations
      5. Angle narratif et biais éventuels
      6. Pertinence cybersécurité/renseignement
      7. Questions ouvertes
    - **Technical Features**:
      - POSIX-compatible (OpenWrt, Alpine, Debian)
      - Colored terminal output (ANSI)
      - Graceful degradation (works without Whisper/Claude)
      - VTT → TXT conversion with deduplication
      - Transcript truncation at 12k chars for API limits
      - Supports whisper, whisper-cpp, and whisper.cpp (main)
    - Package version bumped to 1.1.0
    - Files:
      - `secubox-app-peertube/files/usr/sbin/peertube-analyse` (778 lines)
      - `secubox-app-peertube/Makefile` (updated)

64. **PeerTube Analyse Web Interface & Portal (2026-02-21)**
    - Created standalone web interface for PeerTube video analysis.
    - **URL**: https://analyse.gk2.secubox.in/peertube-analyse/
    - **Web Interface Features**:
      - Cyberpunk-themed design matching SecuBox portal
      - Video URL input with example presets
      - Options: Force Whisper, No AI Analysis, Model/Language selection
      - Progress status bar with live polling
      - Tabbed results: Analysis (Markdown), Transcript, Metadata
      - Copy to clipboard functionality
    - **CGI Backend**:
      - `/cgi-bin/peertube-analyse` — Start analysis (POST)
      - `/cgi-bin/peertube-analyse-status` — Poll job status (GET)
      - Async job system with background processing
      - JSON API with job_id for polling
    - **RPCD Integration**:
      - Added `analyse` and `analyse_status` methods to `luci.peertube`
      - ACL permissions updated for read/write access
    - **Portal Integration**:
      - New "Intelligence & Analyse" section in SecuBox portal
      - Added PeerTube Analyse and Radio Stream services
    - **HAProxy/SSL**:
      - Domain: analyse.gk2.secubox.in
      - Let's Encrypt certificate auto-provisioned
      - Routing via uhttpd backend (static content)
    - Files:
      - `secubox-app-peertube/files/www/peertube-analyse/index.html`
      - `secubox-app-peertube/files/www/cgi-bin/peertube-analyse`
      - `secubox-app-peertube/files/www/cgi-bin/peertube-analyse-status`
      - `luci-app-peertube/root/usr/libexec/rpcd/luci.peertube` (updated)
      - `luci-app-secubox-portal/root/www/gk2-hub/portal.html` (updated)

28. **PeerTube Analyse Bug Fix (2026-02-21)**
    - Fixed jq error "null (null) has no keys" in metadata extraction.
    - Root cause: PeerTube yt-dlp output doesn't include `automatic_captions` field.
    - Fix: Added null-coalescing in jq filter: `((.automatic_captions // {}) | keys)`
    - Also fixed `subtitles` field for consistency.
    - Cleaned up duplicate HAProxy vhost entry for cloud.gk2.secubox.in.

29. **Nextcloud nginx 403 Fix (2026-02-21)**
    - **Issue:** `/apps/dashboard/`, `/apps/files/`, `/apps/spreed/` returning 403 Forbidden
    - **Root cause:** nginx `try_files $uri $uri/ /index.php$request_uri` was matching directories and failing to serve index
    - **Fix:** Changed to `try_files $uri /index.php$request_uri` (removed `$uri/`)
    - **File:** `/etc/nginx/sites-enabled/nextcloud` in nextcloud LXC container
    - Also reset brute force protection for 192.168.255.1
    - Reset admin password to `secubox123`

30. **PeerTube Analyse Limitations Documented (2026-02-21)**
    - Tool requires either existing subtitles OR Whisper installed
    - YouTube videos blocked by PO token requirement for subtitle access
    - PeerTube videos on tube.gk2 have no captions uploaded
    - Metadata extraction works; transcript step fails without subtitles/Whisper

31. **PeerTube Video Import with Multi-Track Subtitles (2026-02-21)**
    - New `peertube-import` CLI tool for importing videos from YouTube, Vimeo, and 1000+ sites.
    - **Features:**
      - Download video via yt-dlp (best quality MP4)
      - Extract metadata (title, description, tags)
      - Download subtitles in multiple languages (configurable)
      - Upload video to PeerTube via API
      - Upload each subtitle track via `/api/v1/videos/{id}/captions/{lang}`
    - **CLI Interface:**
      ```bash
      peertube-import --lang fr,en,de,es https://youtube.com/watch?v=xxx
      peertube-import --privacy 2 --channel 1 https://vimeo.com/xxx
      ```
    - **Portal Integration:**
      - New "Video Import" card in Intelligence & Analyse section
      - Modal dialog with URL input, language selection, privacy options
      - Progress bar with live status updates
      - Direct link to imported video on completion
    - **CGI Endpoints:**
      - `POST /cgi-bin/peertube-import` — Start import job
      - `GET /cgi-bin/peertube-import-status?job_id=xxx` — Poll status
    - **Authentication:**
      - Supports PEERTUBE_TOKEN env var
      - UCI config: `peertube.api.username` / `peertube.api.password`
      - OAuth client credential flow for token acquisition
    - Package version bumped to 1.2.0
    - **Files:**
      - `secubox-app-peertube/files/usr/sbin/peertube-import` (new)
      - `secubox-app-peertube/files/www/cgi-bin/peertube-import` (new)
      - `secubox-app-peertube/files/www/cgi-bin/peertube-import-status` (new)
      - `luci-app-secubox-portal/root/www/gk2-hub/portal.html` (updated)
      - `secubox-app-peertube/Makefile` (updated)

31. **PeerTube Import Fixes (2026-02-21)**
    - Fixed stdout/stderr separation in `peertube-import` script
    - Changed UCI config path from `peertube.api.*` to `peertube.admin.*`
    - Fixed yt-dlp output redirection to prevent mixing with function return values
    - Fixed curl response handling in upload functions (use temp file, not 2>&1)
    - Upgraded yt-dlp to 2026.2.4 for YouTube compatibility
    - Installed Node.js (20.20.0) for yt-dlp JavaScript runtime support
    - Verified end-to-end import flow: YouTube → download → subtitles → PeerTube upload


32. **MetaBlogizer Vhost Auto-Creation Fix (2026-02-22)**
    - Fixed `create_site_from_upload` and `upload_and_create_site` methods missing HAProxy vhost creation.
    - All three site creation methods now:
      - Create HAProxy backend + server (direct to uhttpd port)
      - Create HAProxy vhost pointing to `mitmproxy_inspector` (WAF routing)
      - Add mitmproxy route in `/srv/mitmproxy-in/haproxy-routes.json`
    - Ensures all MetaBlogizer sites go through WAF inspection (security policy compliance).
    - Uploaded sites now immediately accessible via HTTPS domain.

33. **GK2 Hub Generator v3 (2026-02-22)**
    - Complete rewrite of hub-generator with dynamic multi-view portal.
    - **Features:**
      - Automatic categorization: Intelligence, Développement, Documentation, Finance, Média, etc.
      - Iframe thumbnail previews showing real site content
      - Tag cloud with category counts
      - Category tabs with emoji indicators
      - Instant search by domain/name/category
      - Three view modes: Grid, List, Compact
      - Auto-refresh every 5 minutes via cron
    - Created explicit HAProxy vhosts for all 54 MetaBlogizer sites with `waf_bypass=1` and `priority=50`.
    - Fixed wildcard `.gk2.secubox.in` routing to use `vortex_hub` with `priority=999` (processed last).
    - Fixed missing mitmproxy routes for `admin.gk2.secubox.in` and `hub.gk2.secubox.in`.
    - **Files:**
      - `secubox-app-gk2hub/files/usr/sbin/hub-generator` (new)

34. **Nextcloud Talk High Performance Backend Package (2026-02-22)**
    - New `secubox-app-talk-hpb` package for Nextcloud Talk signaling server.
    - **Features:**
      - TURN/STUN server for WebRTC media relay
      - Signaling server for presence and call coordination
      - Auto-generates secure secrets (turn, signaling, internal)
      - HAProxy vhost auto-creation for signaling domain
      - Docker-based deployment (ghcr.io/nextcloud-releases/aio-talk)
    - **CLI Interface:**
      ```bash
      talk-hpbctl setup nextcloud.example.com signaling.example.com
      talk-hpbctl show-config  # Display Nextcloud admin settings
      talk-hpbctl test         # Verify signaling server
      ```
    - **Files:**
      - `secubox-app-talk-hpb/files/usr/sbin/talk-hpbctl` (new)
      - `secubox-app-talk-hpb/files/etc/init.d/talk-hpb` (new)
      - `secubox-app-talk-hpb/files/etc/config/talk-hpb` (new)

35. **MetaBlogizer Reliability Improvements (2026-02-22)**
    - **Edit button:** Added site edit functionality in LuCI dashboard.
    - **Domain change handling:** HAProxy vhost republished when domain changes (delete old + create new).
    - **Mitmproxy route fix:** Replaced fragile sed-based JSON manipulation with Python for reliable JSON parsing.
    - **SSL cert mapping:** Auto-adds UCI cert entries for wildcard SSL certificates (*.gk2.secubox.in.pem) on site creation.
    - Sites now work immediately after one-click deploy without manual HAProxy reload.

36. **GK2 Hub Authentication Integration (2026-02-23)**
    - Protected MetaBlogizer sites (auth_required=1) hidden until user login.
    - Login banner displayed when unauthenticated with protected content present.
    - Uses sessionStorage `secubox_token` from secubox-core portal-auth system.
    - Lock badge icon on protected site cards.
    - Search and category filters respect authentication state.
    - **Files:**
      - `secubox-app-gk2hub/files/usr/sbin/hub-generator` (updated)

37. **HAProxy HTTP/2 Auth Bug Fix (2026-02-23)**
    - Fixed inconsistent HTTP Basic Auth behavior with HTTP/2 multiplexing.
    - Protected vhosts randomly returned 200 (bypass) or 401 (auth required) when using HTTP/2.
    - Root cause: HTTP/2 connection multiplexing caused HAProxy's `http_auth()` to inconsistently evaluate auth rules.
    - **Fix:** Disabled HTTP/2 ALPN negotiation, reverting to HTTP/1.1 only.
    - All protected MetaBlogizer sites (sa, ab, dgse, dcb, ccom) now consistently require authentication.
    - **Files:**
      - `secubox-app-haproxy/files/usr/sbin/haproxyctl` (alpn h2,http/1.1 → alpn http/1.1)
      - `secubox-app-haproxy/files/usr/share/haproxy/templates/default.cfg` (updated)
      - `secubox-app-haproxy/files/etc/config/haproxy` (updated)

38. **Service Stability & LED Pulse Fix (2026-02-24)**
    - **CrowdSec Autostart Fix:**
      - Root cause: Machine registration mismatch between credentials file (`secubox-local`) and database (old UUID-style name).
      - Fix: Re-registered machine with `cscli machines add secubox-local --auto --force`.
      - Downloaded GeoLite2-City.mmdb (63MB) via `cscli hub update`.
      - CrowdSec now starts automatically after reboot.
    - **LED Pulse SPUNK ALERT Fix:**
      - Root cause: `secubox-led-pulse` was checking `lxc-attach -n haproxy -- pgrep haproxy` but HAProxy runs on host, not in LXC.
      - Fix: Changed to `pgrep haproxy` (host process check).
      - Committed: `8a51a3e6 fix(led-pulse): Check HAProxy on host instead of LXC container`.
    - **Docker nextcloud-talk-hpb Restore:**
      - Fixed corrupted Docker storage layer (`GetImageBlob: no such file or directory`).
      - Restarted dockerd, re-pulled image, container now healthy.
    - **cloud.gk2.secubox.in 503 Fix:**
      - Changed backend from `mitmproxy_inspector` to `nextcloud` (WAF was disabled for this vhost).
    - **LXC Autostart Configuration:**
      - Enabled `lxc.start.auto = 1` for mailserver and roundcube containers.
    - **Metrics Page Fix:**
      - Created symlink `/srv/mitmproxy/threats.log` → `/srv/mitmproxy-in/threats.log`.
      - Metrics page now displays visitor data, traffic stats, and threat analytics.
    - **Webmail Fix:**
      - Fixed HAProxy vhost backend: `roundcube` → `webmail` (correct backend name).
      - Reset password for `ragondin@secubox.in`.
      - Cleared Roundcube sessions and restarted PHP-FPM to fix cached credentials.
    - **Verification:** All 14 LXC containers + 6 core services + 6 web endpoints confirmed running.
    - **Files:**
      - `secubox-core/root/usr/sbin/secubox-led-pulse` (fixed HAProxy check)

39. **HAProxy Config Sync Fix (2026-02-24)**
    - Fixed issue where MetaBlogizer uploads resulted in 404 errors.
    - Root cause: HAProxy config generated to `/srv/haproxy/config/haproxy.cfg` but HAProxy reads from `/etc/haproxy.cfg`.
    - **Fix in `luci.metablogizer`:**
      - `reload_haproxy()` now syncs config to `/etc/haproxy.cfg` and `/opt/haproxy/config/` after generation.
    - **Fix in `haproxyctl`:**
      - `generate_config()` now copies config to `/etc/haproxy.cfg` after generation.
    - Sites now work immediately after upload without manual intervention.
    - **Files:**
      - `luci-app-metablogizer/root/usr/libexec/rpcd/luci.metablogizer`
      - `secubox-app-haproxy/files/usr/sbin/haproxyctl`

40. **ZKP Hamiltonian Cryptographic Library (2026-02-24)**
    - Created `zkp-hamiltonian` package implementing Zero-Knowledge Proofs based on Hamiltonian Cycle problem (Blum 1986).
    - **Cryptographic Implementation:**
      - SHA3-256 commitments via OpenSSL EVP API
      - Fiat-Shamir heuristic for NIZK transformation
      - Fisher-Yates shuffle for uniform random permutations
      - Constant-time memory comparison (timing attack resistant)
      - Secure memory zeroing with compiler barrier
    - **Library API:**
      - `zkp_prove()` - Generate NIZK proof of Hamiltonian cycle knowledge
      - `zkp_verify()` - Verify proof (stateless, O(n²))
      - `zkp_generate_graph()` - Generate random graphs with guaranteed Hamiltonian cycle
      - `zkp_serialize_*()` / `zkp_deserialize_*()` - Binary serialization (big-endian, portable)
    - **CLI Tools:**
      - `zkp_keygen` - Generate graph + Hamiltonian cycle (prover secret)
      - `zkp_prover` - Create proof from graph + key
      - `zkp_verifier` - Verify proof against graph
    - **Test Coverage:**
      - 41 tests across 4 test suites (crypto, graph, protocol, serialize)
      - Completeness, soundness, tamper detection, anti-replay verification
    - **Specifications:**
      - C99, targets OpenWrt ARM64 (MochaBin Cortex-A72)
      - Graph size: 4-50 nodes (configurable MAX_N=50)
      - Proof size: ~160KB for n=50
    - **Files:**
      - `zkp-hamiltonian/src/{zkp_crypto,zkp_graph,zkp_prove,zkp_verify,zkp_serialize}.c`
      - `zkp-hamiltonian/include/{zkp_hamiltonian,zkp_crypto,zkp_graph,zkp_types}.h`
      - `zkp-hamiltonian/tools/{zkp_keygen,zkp_prover,zkp_verifier}.c`
      - `zkp-hamiltonian/tests/{test_crypto,test_graph,test_protocol,test_serialize}.c`
      - `zkp-hamiltonian/CMakeLists.txt`
    - **Commit:** `65539368 feat(zkp-hamiltonian): Add Zero-Knowledge Proof library based on Hamiltonian Cycle`

41. **ZKP Mesh Authentication Integration (2026-02-24)**
    - Integrated Zero-Knowledge Proofs into SecuBox master-link mesh authentication system.
    - **Architecture:**
      - Each node has ZKP identity (public graph + secret Hamiltonian cycle)
      - Challenge-response authentication between mesh peers
      - Blockchain acknowledgment of successful verifications
    - **New API Endpoints:**
      - `GET /api/master-link/zkp-challenge` — Generate authentication challenge with TTL
      - `POST /api/master-link/zkp-verify` — Verify ZKP proof, record to blockchain
      - `GET /api/zkp/graph` — Serve node's public ZKP graph (base64)
    - **New Shell Functions in master-link.sh:**
      - `ml_zkp_init()` — Initialize ZKP identity on first boot
      - `ml_zkp_status()` — Return ZKP configuration status
      - `ml_zkp_challenge()` — Generate challenge with UUID and expiry
      - `ml_zkp_prove()` — Generate proof for given challenge
      - `ml_zkp_verify()` — Verify peer's proof against trusted graph
      - `ml_zkp_trust_peer()` — Store peer's public graph for future verification
      - `ml_zkp_get_graph()` — Return base64-encoded public graph
    - **Blockchain Acknowledgment:**
      - New block type: `peer_zkp_verified`
      - Records: peer_fp, proof_hash, challenge_id, result, verified_by
    - **UCI Configuration:**
      - `zkp_enabled` — Toggle ZKP authentication
      - `zkp_fingerprint` — Auto-derived from graph hash (SHA256[0:16])
      - `zkp_require_on_join` — Require ZKP proof for new peers
      - `zkp_challenge_ttl` — Challenge validity in seconds (default 30)
    - **Verification Test Results:**
      - Master (192.168.255.1): ZKP identity initialized, fingerprint `7c5ead2b4e4b0106`
      - API verification flow tested: challenge → proof → verify → blockchain record
      - `peer_zkp_verified` block successfully recorded to chain
    - **Files:**
      - `secubox-master-link/files/usr/lib/secubox/master-link.sh` (ZKP functions)
      - `secubox-master-link/files/www/api/zkp/graph` (new)
      - `secubox-master-link/files/www/api/master-link/zkp-challenge` (new)
      - `secubox-master-link/files/www/api/master-link/zkp-verify` (new)
      - `secubox-master-link/files/etc/config/master-link` (ZKP options)

41. **MetaBlogizer Upload Workflow Fix (2026-02-24)**
    - Sites now work immediately after upload without needing unpublish + expose.
    - **Root cause:** Upload created HAProxy vhost and mitmproxy route file entry, but mitmproxy never received a reload signal to activate the route.
    - **Fix:** `reload_haproxy()` now calls `mitmproxyctl sync-routes` to ensure mitmproxy picks up new routes immediately after vhost creation.
    - **Files:**
      - `luci-app-metablogizer/root/usr/libexec/rpcd/luci.metablogizer`
    - **Commit:** `ec8e96a7 fix(metablogizer): Auto-sync mitmproxy routes on HAProxy reload`

42. **LuCI ZKP Dashboard (2026-02-24)**
    - Created `luci-app-zkp` package for ZKP Hamiltonian cryptographic proofs.
    - **Dashboard Features:**
      - Status display: library version, saved keys count, storage paths
      - Key generation: node count (4-50), edge density selector
      - Prove/Verify workflow with visual ACCEPT/REJECT results
      - Keys table with Prove, Verify, Delete actions
      - KISS theme with dark mode support
    - **RPCD Methods:** status, keygen, prove, verify, list_keys, delete_key, get_graph
    - **Menu Location:** Status > ZKP Cryptography
    - Note: Requires `zkp-hamiltonian` CLI tools to be built for ARM64
    - **Files:**
      - `luci-app-zkp/htdocs/luci-static/resources/view/zkp/overview.js`
      - `luci-app-zkp/root/usr/libexec/rpcd/luci.zkp`
    - **Commit:** `b60d7fd0 feat(luci-app-zkp): Add ZKP Hamiltonian cryptographic dashboard`

43. **ZKP Hamiltonian ARM64 Build & Deployment (2026-02-24)**
    - Built `zkp-hamiltonian` package for ARM64 (aarch64_cortex-a72) using full OpenWrt toolchain.
    - **Build Notes:**
      - SDK lacks target OpenSSL headers; must use full toolchain in `secubox-tools/openwrt/`
      - Fixed `ZKP_MAX_N` macro redefinition by adding `#ifndef` guard in `zkp_types.h`
      - Fixed RPCD script CLI flags: `-r` for ratio (not `-d`), `-o` for output prefix
    - **Deployed CLI Tools:**
      - `zkp_keygen` - 75KB binary
      - `zkp_prover` - 76KB binary
      - `zkp_verifier` - 75KB binary
    - **Verification:** Full workflow tested on router (keygen → prove → verify → ACCEPT)
    - **Files:**
      - `zkp-hamiltonian/Makefile` (moved from openwrt/ subdirectory)
      - `zkp-hamiltonian/include/zkp_types.h` (ZKP_MAX_N guard)
      - `luci-app-zkp/root/usr/libexec/rpcd/luci.zkp` (CLI flag fixes)


44. **WAF CVE-2025-14528 Router Botnet Detection (2026-02-24)**
    - Added new `router_botnet` WAF category for IoT/router exploitation attempts.
    - **CVE-2025-14528 Detection:**
      - D-Link DIR-803 getcfg.php credential leak
      - AUTHORIZED_GROUP parameter manipulation
      - Newline injection bypass (%0a, %0d)
      - SERVICES=DEVICE.ACCOUNT enumeration
    - **Additional Router Exploit Patterns:**
      - D-Link hedwig.cgi, HNAP, service.cgi RCE
      - UPnP SOAP injection
      - Goform command injection
      - ASUS infosvr/apply.cgi exploits
      - TP-Link/Netgear command exec patterns
      - Zyxel zhttpd shell injection
    - **Mirai-Variant Botnet Scanner Detection:**
      - User-Agent signatures: Mirai, Hajime, Mozi, BotenaGo, Gafgyt, etc.
      - Router wget/curl payload injection
      - Telnet enable attempts
    - **Files Modified:**
      - `secubox-app-mitmproxy/files/srv/mitmproxy/waf-rules.json` (19 new patterns)
      - `secubox-app-mitmproxy/files/srv/mitmproxy/addons/secubox_analytics.py`
      - `secubox-app-mitmproxy/files/etc/config/mitmproxy`
      - `secubox-app-mitmproxy/files/usr/sbin/mitmproxy-waf-sync`
    - **Sources:** [CrowdSec Threat Intel](https://www.crowdsec.net/vulntracking-report/cve-2025-14528), [Global Security Mag](https://www.globalsecuritymag.com/old-routers-new-botnets-active-exploitation-of-cve-2025-14528.html)


45. **MetaBlogizer Quick Publish WAF Route Fix (2026-02-24)**
    - Fixed 404 errors after site upload/publish in MetaBlogizer.
    - **Root Cause:** HAProxy vhosts created with `backend=mitmproxy_inspector` but no `original_backend` field.
      - `mitmproxyctl sync-routes` needs `original_backend` to determine where to forward traffic after WAF inspection.
      - Without it, mitmproxy had no route and returned 404.
    - **Fix:** Added `original_backend=$backend_name` to all 3 vhost creation locations:
      - `method_create_site` (line 491)
      - `method_emancipate_site` (line 1210)
      - `method_upload_and_create_site` (line 2001)
    - **Integration:** `reload_haproxy()` calls `mitmproxyctl sync-routes` which now properly syncs all routes.
    - **Verification:** `rcve.gk2.secubox.in` now returns HTTP 200 with correct content.
    - **Files Modified:**
      - `luci-app-metablogizer/root/usr/libexec/rpcd/luci.metablogizer`


46. **ZKP Join Flow Integration (2026-02-24)**
    - Enhanced mesh join protocol to support ZKP (Zero-Knowledge Proof) authentication.
    - **Join Request Enhancement** (`ml_join_request()`):
      - Now accepts `zkp_proof` (base64) and `zkp_graph` (base64) parameters
      - Verifies proof against provided graph using `zkp_verifier`
      - Validates fingerprint matches SHA256(graph)[0:16]
      - Auto-stores peer's graph in `/etc/secubox/zkp/peers/` on successful verification
      - Records `zkp_verified` and `zkp_proof_hash` in request file
    - **Join Approval Enhancement** (`ml_join_approve()`):
      - Auto-fetches peer's ZKP graph if not already stored during join
      - Records `zkp_graph_stored` status in approval response
      - Blockchain `peer_approved` blocks now include `zkp_verified` field
    - **Peer-side Join** (`ml_join_with_zkp()`):
      - New function for ZKP-authenticated mesh joining
      - Generates ZKP proof using local identity keypair
      - Uses ZKP fingerprint (from graph hash) instead of factory fingerprint
      - Auto-stores master's graph for mutual authentication
    - **API Update** (`/api/master-link/join`):
      - Accepts `zkp_proof` and `zkp_graph` fields in POST body
    - **Configuration**:
      - `zkp_require_on_join`: When set to 1, rejects joins without valid ZKP proof
    - **Verification:** Clone joined with `zkp_verified: true`, graphs exchanged bidirectionally
    - **Files Modified:**
      - `secubox-master-link/files/usr/lib/secubox/master-link.sh`
      - `secubox-master-link/files/www/api/master-link/join`


47. **LuCI ZKP Dashboard (2026-02-24)**
    - Enhanced `luci-app-master-link` with ZKP authentication status visualization.
    - **Overview Tab - ZKP Status Section:**
      - ZKP Identity card: fingerprint display, copy button, generation status
      - ZKP Tools card: installation status for zkp_keygen/prover/verifier
      - Trusted Peers card: count of stored peer graphs
      - Purple theme (violet gradient) for ZKP elements
      - Enabled/Disabled badge next to section title
    - **Peer Table Enhancement:**
      - New "Auth" column showing authentication method
      - `zkpBadge()` helper function for visual indicators:
        - 🔐 ZKP badge (purple) for ZKP-verified peers
        - TOKEN badge (gray) for token-only authentication
    - **Design:**
      - Purple accent colors (#8b5cf6, #a855f7, #c084fc) for ZKP elements
      - Consistent with SecuBox KISS theme guidelines
    - **Files Modified:**
      - `luci-app-master-link/htdocs/luci-static/resources/view/secubox/master-link.js`


48. **MirrorNet Ash Compatibility Fix (2026-02-24)**
    - Fixed process substitution (`< <(cmd)`) incompatibility with BusyBox ash shell.
    - **Pattern replaced:** `while read; do ... done < <(jsonfilter ...)`
    - **Ash-compatible pattern:** `jsonfilter ... | while read; do ... done` with temp files for variable persistence
    - **Files fixed:**
      - `secubox-mirrornet/files/usr/lib/mirrornet/mirror.sh` (3 instances)
      - `secubox-mirrornet/files/usr/lib/mirrornet/gossip.sh` (3 instances)
      - `secubox-mirrornet/files/usr/lib/mirrornet/health.sh` (1 instance)
      - `secubox-mirrornet/files/usr/lib/mirrornet/identity.sh` (1 instance - for loop fix)
    - **Tested:** `mirrorctl status`, `mirror-add`, `mirror-upstream`, `mirror-check`, `mirror-haproxy` all working
    - **Deployed:** Both master (192.168.255.1) and clone (192.168.255.156) routers


49. **Mesh Blockchain Sync (2026-02-24)**
    - Fixed blockchain chain synchronization between mesh nodes.
    - **Chain Append Fix:**
      - `chain_add_block()`: Uses awk to safely insert new blocks before `] }` ending
      - Handles JSON with/without trailing newlines and varying whitespace
      - Compacts multi-line blocks to single line for clean insertion
    - **Chain Merge Fix:**
      - `chain_merge_block()`: Same awk-based approach for remote block merging
      - Validates block structure and prev_hash linkage before merging
    - **Sync Endpoint Fix:**
      - `/api/chain/since/<hash>`: Now properly returns only blocks after given hash
      - Returns JSON array of blocks (not full chain)
      - Supports partial hash matching
    - **Sync Function Fix:**
      - `sync_with_peer()`: Properly fetches and merges missing blocks
      - Uses `chain_merge_block()` for each received block
      - Stores block data in blocks directory
    - **Verification:**
      - Master→Clone sync: Block 70 synced successfully
      - Clone→Master sync: Block 69 synced successfully
      - Both nodes at height 70 with matching hash
      - JSON validity confirmed via Python parser
    - **Files Modified:**
      - `secubox-core/root/usr/lib/secubox/p2p-mesh.sh`
      - `secubox-core/root/www/api/chain`


50. **Factory Auto-Provisioning (2026-02-24)**
    - Zero-touch provisioning for new mesh devices
    - **Hardware Inventory Collection:**
      - `inventory.sh`: Collect serial, MAC, model, CPU, RAM, storage
      - Store inventories in `/var/lib/secubox-factory/inventory/`
      - Pre-registered device matching for auto-approval
    - **Profile-Based Configuration:**
      - `profiles.sh`: Match devices by MAC prefix, model, or serial pattern
      - 7 pre-built profiles: default, enterprise, home-basic, home-office, home-security, media-server, smart-home
      - UCI commands, packages, and services per profile
    - **Discovery Mode:**
      - New devices can register without pre-shared tokens
      - Master maintains pending queue for manual approval
      - Auto-approve option for pre-registered MAC/serial devices
      - `discovery_window` option for timed open enrollment
    - **Bulk Token Generation:**
      - Generate up to 100 tokens per batch
      - Profile assignment per token
      - Batch tracking with `batch_id`
    - **Clone Provision Enhancements:**
      - Hardware inventory on first boot
      - Discovery-based join (poll for approval)
      - Fallback to legacy token-based join
    - **RPCD Methods Added:**
      - `pending_devices`: List devices awaiting approval
      - `approve_device`: Approve with profile assignment
      - `reject_device`: Reject with reason
      - `bulk_tokens`: Generate token batches
      - `inventory`: List hardware inventories
      - `list_profiles`: List available profiles
      - `discovery_status`: Get discovery mode state
      - `toggle_discovery`: Enable/disable discovery mode
      - `import_preregistered`: Import MAC/serial list
    - **UCI Options:**
      - `discovery_mode`: Enable zero-touch provisioning
      - `auto_approve_known`: Auto-approve pre-registered devices
      - `discovery_window`: Time limit for discovery (seconds)
      - `default_profile`: Profile for auto-approved devices
    - **Files Modified:**
      - `master-link.sh`: Added 8 discovery/bulk functions
      - `master-link` UCI config: Added 4 discovery options
      - `50-secubox-clone-provision`: Added inventory collection and discovery join
      - `luci.cloner` RPCD: Added 9 new methods with JSON object responses
      - `luci-app-cloner.json` ACL: Added permissions for new methods
    - **Files Created:**
      - `inventory.sh`: Hardware inventory library
      - `profiles.sh`: Profile management library
      - `default.json`: Default peer profile template
    - **Fix Applied:**
      - `p2p-mesh.sh`: Silenced usage output when sourced as library
    - **Tested:** All RPCD methods working via ubus, discovery mode toggle, bulk tokens

27. **Mailserver Dovecot UID/GID Fix (2026-02-25)**
    - Fixed Roundcube IMAP "Internal error" caused by Dovecot running as wrong user (uid 102 instead of 5000)
    - **Problem:** Dovecot config had hardcoded uid=102/gid=105 from Alpine defaults, but vmail user is uid=5000/gid=5000
    - **Files Modified:**
      - `mailserverctl`: Fixed 7 uid/gid references (102→5000, 105→5000)
      - `dovecot.conf` template: Changed mail_uid/gid, first_valid_uid/last_valid_uid
      - `configure_postfix`: Changed virtual_uid_maps/virtual_gid_maps
      - `cmd_add_user`: Changed passwd file uid:gid entries

28. **Factory Dashboard LuCI Implementation (2026-02-25)**
    - Added Factory tab to Cloning Station (`luci-app-cloner/overview.js`)
    - **Features:**
      - Discovery Mode Toggle: Enable/disable zero-touch provisioning with visual status
      - Pending Devices: List and approve/reject devices awaiting provisioning with profile assignment
      - Bulk Token Generator: Generate multiple tokens at once with profile selection
      - Hardware Inventory: Table view of discovered device specs (MAC, Model, CPU, RAM, Storage)
    - **RPC Declarations Added:**
      - `callPendingDevices`, `callApproveDevice`, `callRejectDevice`
      - `callBulkTokens`, `callInventory`, `callListProfiles`
      - `callDiscoveryStatus`, `callToggleDiscovery`
    - **State Properties Added:**
      - `pendingDevices`, `hwInventory`, `profiles`, `discoveryStatus`, `generatedTokens`
    - **Render Functions Added:**
      - `renderFactoryTab()`: Main tab with stats grid and two-column layout
      - `renderPendingDevices()`: Device cards with approve/reject buttons
      - `renderGeneratedTokens()`: Token list with copy functionality
      - `renderInventory()`: Kiss-table with hardware specs
    - **Event Handlers Added:**
      - `handleToggleDiscovery()`, `handleApproveDevice()`, `handleRejectDevice()`
      - `handleGenerateBulkTokens()`, `handleCopyAllTokens()`, `refreshFactory()`
    - **Polling:** Factory data included in 5-second refresh when on Factory tab
    - **UI Pattern:** KISS theme components (stat boxes, cards, tables, buttons)

29. **Cloner Image Builder Version/Profile Support (2026-02-25)**
    - Enhanced `secubox-cloner` CLI with OpenWrt version selection and package profiles
    - **New CLI Options:**
      - `--version VER`: Select OpenWrt version (24.10.5, 24.10.0, 23.05.5, 23.05.4)
      - `--profile PROFILE`: Select package profile (slim, core, full)
      - `secubox-cloner versions`: List available versions and profiles
    - **Package Profiles:**
      - `slim`: Minimal OpenWrt (LuCI + network essentials only)
      - `core`: Slim + SecuBox mesh (master-link, p2p, secubox-core)
      - `full`: Clone all installed SecuBox packages from current device
    - **New RPCD Methods:**
      - `list_versions`: Returns available OpenWrt versions with latest flag
      - `list_build_profiles`: Returns available package profiles with descriptions
      - `build_image`: Now accepts `version` and `profile` parameters
    - **Files Modified:**
      - `secubox-core/root/usr/sbin/secubox-cloner`: Added version/profile parsing and build_via_asu profile logic
      - `luci-app-cloner/root/usr/libexec/rpcd/luci.cloner`: Added list_versions, list_build_profiles, updated build_image
      - `luci-app-cloner/root/usr/share/rpcd/acl.d/luci-app-cloner.json`: Added permissions for new methods
    - **Tested:** CLI help, versions command, RPCD methods via ubus all working

30. **MetaBlogizer HAProxy Stability Fix (2026-02-25)**
    - **Root Cause Identified:** Multiple HAProxy instances (container + host) were both listening on ports 80/443, causing random routing and intermittent 404 errors for all sites
    - **Fix Applied:**
      - Disabled host HAProxy service (`/etc/init.d/haproxy disable`)
      - Container HAProxy is now the sole handler for web traffic
    - **Auto-Republish Feature Added:**
      - When files are uploaded to an emancipated site, `metablogizerctl publish` is now called automatically
      - This ensures uhttpd and HAProxy routing stay in sync after content updates
    - **Files Modified:**
      - `luci-app-metablogizer/root/usr/libexec/rpcd/luci.metablogizer`: Added auto-republish in `method_upload_finalize()`
    - **Sites Fixed:** rfg, form, facb, plainte all returning HTTP 200 consistently
    - **Verified:** 20 consecutive tests all returned 200 (previously ~50% failure rate)

31. **HAProxy Host/Container Architecture Permanent Fix (2026-02-25)**
    - **Problem:** Host HAProxy kept restarting alongside container HAProxy due to:
      - `haproxyctl` called `/etc/init.d/haproxy start|reload` which started host HAProxy
      - ACME cron jobs and certificate scripts also called host init script
      - ACME triggers in procd could restart host HAProxy
    - **Permanent Fix Applied:**
      - Renamed `/etc/init.d/haproxy` to `/etc/init.d/haproxy.host-disabled` to prevent any trigger
      - Added `lxc_start_bg()` function to `haproxyctl` for starting container in background
      - Added `lxc_reload()` function for reloading container HAProxy
      - Replaced all `/etc/init.d/haproxy start|reload` calls with container-aware functions
      - Fixed `haproxy-sync-certs` script to use `haproxyctl reload` instead of init script
    - **Files Modified:**
      - `secubox-app-haproxy/files/usr/sbin/haproxyctl`: Added lxc_start_bg, lxc_reload; fixed ACME cert handling
      - `secubox-app-haproxy/files/usr/sbin/haproxy-sync-certs`: Uses haproxyctl reload instead of init script
    - **Verified:** 20 consecutive tests all returned HTTP 200 across all sites

32. **Streamlit Gitea Integration & WAF Enhancements (2026-02-25)**
    - **Auto Gitea Push on Emancipate:**
      - Added automatic Gitea push when instance is emancipated
      - Also pushes on app rename (keeps code in sync with Gitea)
    - **WAF (mitmproxy) Integration:**
      - Emancipate now routes through `mitmproxy_inspector` backend by default (all traffic WAF-protected)
      - Adds mitmproxy route entry for domain → streamlit port
      - Restarts mitmproxy to pick up new routes
      - Uses `haproxyctl reload` instead of restart for smooth reloads
    - **Enhanced Rename Functions:**
      - `rename_app()` now actually renames app folder/file (not just display name)
      - Updates all instance references when app ID changes
      - `rename_instance()` can now change domain, updates HAProxy vhost and mitmproxy routes
    - **WAF Status Display:**
      - Dashboard shows WAF badge for exposed instances
      - `get_exposure_status()` returns `waf_enabled` field
      - Blue "WAF" badge displayed next to exposure status
    - **Files Modified:**
      - `luci-app-streamlit/root/usr/libexec/rpcd/luci.streamlit`: emancipate_instance, rename_app, rename_instance, get_exposure_status
      - `luci-app-streamlit/htdocs/luci-static/resources/view/streamlit/dashboard.js`: WAF badge display

33. **Streamlit CLI Emancipate Fix & Container Reload (2026-02-25)**
    - **CLI Emancipate UCI Fix:**
      - `streamlitctl emancipate` now sets `waf_enabled="1"` in instance UCI
      - Previously only set `emancipated` and `domain`
    - **Container-Aware Reload:**
      - `_emancipate_reload()` now uses `haproxyctl reload` (container reload)
      - Previously used deprecated `/etc/init.d/haproxy restart` (host init script)
      - Properly verifies LXC container status after reload
    - **Verified:** test2.gk2.secubox.in emancipation successful with WAF enabled
    - **Files Modified:**
      - `secubox-app-streamlit/files/usr/sbin/streamlitctl`: Added waf_enabled UCI field, use haproxyctl reload

34. **Portal Password Change & MetaBlogizer Upload Fix (2026-02-25)**
    - **Portal Password Change:**
      - New "Account" section with "Change Password" and "My Services" cards
      - Password change modal with current/new/confirm fields
      - RPC method `change_password` verifies current password, syncs to all services
      - Syncs to: email (mailserver), jabber, nextcloud
      - Matrix/PeerTube noted as manual update required
    - **MetaBlogizer Upload Fix:**
      - `method_upload_file` now auto-republishes emancipated sites (was only in finalize)
      - `cmd_publish` now auto-pushes to Gitea if enabled
      - Uses `haproxyctl reload` (container-aware)
    - **Files Modified:**
      - `luci-app-secubox-users/root/usr/libexec/rpcd/luci.secubox-users`: New change_password method
      - `luci-app-secubox-portal/root/www/gk2-hub/portal.html`: Account section + password modal
      - `luci-app-metablogizer/root/usr/libexec/rpcd/luci.metablogizer`: Auto-republish on upload
      - `secubox-app-metablogizer/files/usr/sbin/metablogizerctl`: Gitea push on publish

35. **Streamlit KISS Upload & Service Fixes (2026-02-25)**
    - **Streamlit KISS Upload:**
      - Auto-detects ZIP files by magic bytes (PK header)
      - Extracts app.py from ZIP archives automatically
      - Adds UTF-8 encoding declaration to Python files
      - Installs requirements.txt dependencies in background
      - Restarts instance on re-upload for immediate update
      - Matches MetaBlogizer KISS pattern
    - **Mailserver POP3S Fix:**
      - Added `pop3` to dovecot protocols (was only imap lmtp)
      - POP3S (995) now listening alongside IMAPS (993)
    - **Alerte Streamlit Fix:**
      - Extracted app.py from incorrectly saved ZIP file
      - Installed missing qrcode/python-dotenv dependencies
      - Added route to mitmproxy-in for WAF inspection
    - **Files Modified:**
      - `luci-app-streamlit/root/usr/libexec/rpcd/luci.streamlit`: upload_app, upload_and_deploy with KISS ZIP handling

36. **ALERTE.DEPOT Whistleblower Platform (2026-02-25)**
    - **Anonymous Whistleblower Application (Loi Waserman compliant):**
      - Pseudonymized submissions - no personal data required
      - Token-based tracking (16-char alphanumeric tokens)
      - Three modes: Submit / Track / Admin
      - SecuBox Users authentication for investigators
      - Gitea backend (private repo: gandalf/alertes-depot)
      - QR code generation for attestations
    - **Tracking Portal:**
      - Token lookup searches Gitea issues
      - Status display with visual badges
      - Two-way communication with investigators
      - Add supplementary information capability
    - **Admin Dashboard:**
      - SecuBox Users RPCD authentication
      - Case management with status workflow
      - Internal notes vs public responses
      - Statistics overview
    - **Security & Compliance:**
      - Audit trail blockchain (/srv/secubox/mesh/alertes-chain.json)
      - Deadline monitoring cron (7-day ack, 3-month response)
      - Immutable hash chain for all actions
    - **Dual-Channel Access:**
      - HTTPS: alerte.gk2.secubox.in (production SSL cert)
      - Tor: i7j46m67zvdksfhddbq273yydpuo5xvewsl2fjl5zlycjyo4qelysnid.onion
    - **Files:**
      - `/srv/streamlit/apps/alerte_depot/app.py`: Full whistleblower platform
      - `/srv/secubox/mesh/alertes-chain.json`: Audit blockchain
      - `/usr/sbin/alerte-depot-cron`: Deadline monitor

37. **VoIP Voice Recorder Configuration (2026-02-25)**
    - **Voice Recorder Mode:**
      - All incoming calls sent directly to voicemail
      - Automatic email notification with WAV attachment
      - OVH SIP trunk integration for official number
    - **Email Integration:**
      - Created voicemail@secubox.in account in mailserver
      - Configured msmtp in VoIP container
      - Email subject template with caller ID
    - **Files:**
      - `/srv/lxc/voip/rootfs/etc/asterisk/voicemail.conf`
      - `/srv/lxc/voip/rootfs/etc/asterisk/extensions.conf`
      - `/srv/lxc/voip/rootfs/etc/msmtprc`

38. **ALERTE.DEPOT Authentication Fix (2026-02-25)**
    - **Container HTTP Auth:**
      - Streamlit container cannot access host `ubus` directly
      - Changed authenticate_admin() from subprocess to HTTP API
      - Uses http://127.0.0.1/ubus JSON-RPC endpoint
    - **SecuBox Users Integration:**
      - Admin login validates via luci.secubox-users RPCD
      - Session tokens stored in /tmp/secubox-sessions/
      - 24-hour token expiry
    - **Test Credentials:**
      - gk2 / Gk2Test2026
      - ragondin / Secubox@2026

39. **VoIP WebRTC Phone Integration (2026-02-26)**
    - **WebRTC Phone Working:**
      - Browser-based SIP phone using JsSIP 3.11.1
      - Bypasses ISP SIP blocking via WebSocket over HTTPS
      - Full call flow: Browser → WSS → HAProxy → Asterisk → OVH SIP → PSTN
    - **Infrastructure:**
      - HAProxy path routing: `/ws` → Asterisk WSS (8089), default → static files
      - Local JsSIP library at `/www/voip/js/jssip.min.js` (CDN MIME issues)
      - Phone accessible at https://voip.gk2.secubox.in/voip/phone.html
    - **Dial Plan Support:**
      - `_0XXXXXXXXX` — French national format (0775744172)
      - `_+XXXXXXXXXXX` — International with + prefix
      - `_00XXXXXXXXX.` — International with 00 prefix
      - `_XXX/_XXXX` — Internal extensions
    - **LuCI VoIP Fixes:**
      - RPCD luci.voip: Fixed `local` keyword outside function
      - Extensions list: Fixed pipe subshell with config_foreach pattern
      - Recordings API: Fixed array wrapping for JS frontend
    - **Files:**
      - `/www/voip/phone.html` — WebRTC phone interface
      - `/www/voip/js/jssip.min.js` — JsSIP library
      - `/usr/libexec/rpcd/luci.voip` — RPCD backend
      - `/srv/lxc/voip/rootfs/etc/asterisk/extensions.conf` — Dial plan

40. **ZKP Cross-Node Verification (2026-02-26)**
    - **Bidirectional ZKP Authentication:**
      - Master (aarch64) and Clone (x86_64) can cryptographically verify each other
      - Hamiltonian cycle zero-knowledge proof protocol
      - No secrets exchanged — only public graphs shared
    - **ZKP Keys Generated:**
      - Master: `master_node` (50 nodes, 100 edges, 408 bytes graph)
      - Clone: `clone_node` (50 nodes, 100 edges, 408 bytes graph)
    - **Verification Results:**
      - Master → Clone: **ACCEPT** (clone verified master's proof)
      - Clone → Master: **ACCEPT** (master verified clone's proof)
    - **Cross-Architecture Support:**
      - Deployed x86_64 ZKP binaries to clone from build-x86 directory
      - Binaries: zkp_keygen, zkp_prover, zkp_verifier
      - Proofs: 40-80KB, verification < 1 second
    - **Files:**
      - `/var/lib/zkp/graphs/` — Public graphs for verification
      - `/var/lib/zkp/keys/` — Secret Hamiltonian cycles (NEVER share)
      - `/var/lib/zkp/proofs/` — Generated proofs

41. **Mesh Blockchain Bidirectional Sync (2026-02-26)**
    - **Sync Testing:**
      - Master → Clone: 112 blocks synced successfully
      - Clone added block 113 (type: clone_test, node: clone1)
      - Clone → Master: Block 113 merged back to master
    - **Architecture:**
      - Both nodes at identical chain height with matching hash
      - Threat intelligence propagates bidirectionally
      - Manual sync via direct chain.json copy (curl/avahi deps missing on clone)

42. **MetaBlogizer & Portal RPC Performance (2026-02-26)**
    - **MetaBlogizer list_sites Optimization:**
      - Rewrote `method_list_sites` RPCD handler with single-pass awk parsing
      - Pre-fetch listening ports, HAProxy backends, and Tor services in one call each
      - Eliminated 400+ UCI calls per request (78 sites × 5+ calls per site)
      - Fixed awk `getline` variable corruption producing invalid JSON
      - Execution time: 30+ seconds → 0.23 seconds
    - **Portal get_vhosts Optimization:**
      - Same single-pass awk pattern for 191 vhosts
      - Execution time: 30+ seconds → 0.24 seconds

43. **Nextcloud Talk Signaling LXC Migration (2026-02-26)**
    - **Docker → LXC Conversion:**
      - Built signaling server v2.0.4 (Go 1.24.0) in Debian LXC container
      - NATS v2.10.22 for message queue (pre-built ARM64 binary)
      - Custom init script for non-systemd container
    - **Configuration:**
      - Signaling server on port 8083 (avoiding Docker 8082 conflict)
      - Session keys truncated to 16/32 bytes (was 64, caused key length error)
      - Backend allowed: cloud.gk2.secubox.in
      - TURN servers: signaling.gk2.secubox.in:3478 (UDP/TCP)
    - **HAProxy Integration:**
      - Updated `talk_hpb_signaling` backend server port: 8082 → 8083
      - SSL certificate issued via ACME webroot
    - **Nextcloud Configuration:**
      - Set `spreed.signaling_servers` via occ command
      - Endpoint: `https://signaling.gk2.secubox.in/standalone-signaling/`

44. **Nextcloud Talk Full Stack Fix (2026-02-26)**
    - **MIME Type Fix:**
      - Problem: CSS/JS blocked with "incorrect MIME type (text/html)"
      - Fix: Added proper `/apps/` location block serving static assets directly
    - **403 on /apps/ Fix:**
      - Problem: /apps/dashboard/ and /apps/spreed/ returning 403
      - Fix: Route non-static /apps/ requests to `index.php` via rewrite
    - **Signaling Endpoint Fix:**
      - Problem: "Failed to send message to signaling server" - 404
      - Root cause: Nextcloud used `/standalone-signaling/` prefix, server uses `/api/v1/`
      - Fix: Updated `spreed.signaling_servers` to `https://signaling.gk2.secubox.in/`
    - Talk conversations and video calls now fully functional

45. **Mail Server Webmail Detection Fix (2026-02-26)**
    - **Problem:** Webmail status showing "Stopped" despite Roundcube LXC running
    - **Root Cause:** RPCD handler only checked Docker, not LXC containers
    - **Fix:** Added `webmail.type` UCI option check, use `lxc-info` for LXC type
    - Webmail status now correctly shows "Running" for LXC containers

46. **CrowdSec HAProxy Bouncer - Dual Layer WAF (2026-02-26)**
    - **Purpose:** IP-level blocking at HAProxy before mitmproxy WAF inspection
    - **Implementation:**
      - Created `/srv/haproxy/lua/crowdsec.lua` - Lua bouncer script
      - Queries CrowdSec LAPI on port 8190 for IP decisions
      - In-memory cache with 60s TTL (30s negative cache)
      - Fail-open design: allows traffic if API unreachable
      - Skips internal IPs (127.x, 192.168.x, 10.x)
    - **HAProxy Integration:**
      - `lua-load /opt/haproxy/lua/crowdsec.lua` in global section
      - `http-request lua.crowdsec_check` in HTTP/HTTPS frontends
      - `http-request deny deny_status 403 if { var(txn.blocked) -m str 1 }`
    - **Registered Bouncer:** `haproxy-bouncer` in CrowdSec with API key
    - **Result:** Dual-layer WAF protection
      - Layer 1: CrowdSec HAProxy bouncer (IP reputation, 60s cache)
      - Layer 2: mitmproxy WAF (request inspection, CVE detection)
    - All 13 MetaBlogizer sites verified working with dual WAF
    - **CrowdSec MCP:** Added crowdsec-local-mcp for AI-generated WAF rules

47. **Nextcloud Apps 403 Fix - try_files Directory Match (2026-02-27)**
    - **Problem:** `/apps/spreed/` and `/apps/dashboard/` returning 403 Forbidden
    - **Root Cause:** nginx `try_files $uri $uri/ /index.php$request_uri;` checks `$uri/`
      - `/apps/spreed/` exists as a real directory in filesystem
      - nginx finds directory, tries to serve index, no index file → 403
    - **Fix:** Changed to `try_files $uri /index.php$request_uri;`
      - Removed `$uri/` directory check from try_files
      - All non-file requests now route directly to PHP front controller
    - **Result:** Talk (/apps/spreed/) returns 303 redirect, Dashboard returns 401 (auth required)

48. **OpenClaw AI Assistant - LuCI Package (2026-02-27)**
    - **secubox-app-openclaw:** Backend package with UCI config and CLI
      - Multi-provider support: Anthropic (Claude), OpenAI (GPT), Ollama (local)
      - `openclawctl` CLI: install, configure, set-provider, set-api-key, test-api
      - Integrations: Telegram, Discord, Slack, Email, Calendar (CalDAV)
    - **luci-app-openclaw:** Complete LuCI web interface
      - Chat view: Real-time AI conversation with markdown rendering
      - Settings view: Provider/model/API key configuration with connection test
      - Integrations view: Enable/configure messaging and productivity integrations
      - RPCD backend: 9 ubus methods (status, get_config, set_config, list_models, chat, test_api, get_history, clear_history, install, update)
      - ACL permissions for read/write operations

49. **OpenClaw Gemini API Integration (2026-02-27)**
    - **Problem:** Gemini 1.5 models deprecated/removed (404 errors)
    - **Fix:** Updated RPCD handler model list to current Gemini 2.x series:
      - `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-flash-latest`
    - Tested successfully with `gemini-2.5-flash` (higher rate limits than 2.0)
    - LuCI chat and settings views working with Gemini provider

50. **WAF Auto-Ban Tuning & False Positive Fix (2026-02-27)**
    - **Problem:** LuCI static resources flagged as "waf_bypass" (high severity)
      - Affected URLs: `/luci-static/resources/cbi.js?v=26.021.66732~4b823e3`
    - **Root Cause:** Different `secubox_analytics.py` versions across mitmproxy instances
      - `/srv/mitmproxy-in/` had different file hash than `/srv/mitmproxy/`
      - Stale Python bytecode cache (.pyc files) still loading old code
    - **Fix:**
      - Synced identical `secubox_analytics.py` to all three mitmproxy instances
      - Cleared `__pycache__` directories in all addons folders
      - Restarted mitmproxy services
    - **Result:** No more false positives on LuCI/Nextcloud static resources
    - **Autoban Sensitivity Fix:**
      - UCI config uses `sensitivity='strict'` but code expected `'aggressive'`
      - Added `'strict'` as alias for `'aggressive'` in `_should_autoban()` function
      - Both values now trigger threshold=1 (immediate ban) behavior
    - **Verified Working:**
      - `.env` probes correctly detected as `path_scan` / `config_hunting`
      - Autoban config properly loaded: `sensitivity=strict`, `min_severity=medium`

51. **Centralized WAF Route Management (2026-02-28)**
    - **Problem:** Multiple services (metablogizerctl, streamlitctl, mitmproxyctl) each
      managed mitmproxy routes independently, causing mixups and stale routes
    - **Solution:** Centralized route registry in secubox-core
    - **New Components:**
      - `/etc/config/secubox-routes` - UCI config for central route registry
      - `/usr/sbin/secubox-route` - CLI for route management with source tracking
    - **CLI Commands:**
      - `secubox-route add <domain> <host> <port> <source>` - Add route with provenance
      - `secubox-route remove <domain>` - Remove route
      - `secubox-route list` - List all routes by source (haproxy/metablogizer/streamlit)
      - `secubox-route sync` - Generate mitmproxy routes file from registry
      - `secubox-route import-all` - Import from HAProxy, MetaBlogizer, Streamlit
      - `secubox-route status` - Show registry status with route counts by source
    - **Updated Services:**
      - `metablogizerctl`: Uses `secubox-route add` instead of `mitmproxyctl sync-routes`
      - `streamlitctl`: Uses `secubox-route add` with explicit domain/port
      - `peertubectl`: Uses `secubox-route add` for emancipation workflow
      - `vhost-manager/mitmproxy.sh`: Prefers secubox-route when available
      - `mitmproxyctl sync-routes`: Delegates to `secubox-route import-all`
    - **Behaviors:**
      - Auto-sync to all mitmproxy instances (mitmproxy, mitmproxy-in, mitmproxy-out)
      - Skip wildcard domains (`.gk2.secubox.in`) - return 404 WAF page
      - Skip LuCI routes (port 8081) - never route to admin interface
    - **Result:** Single source of truth, no more route mixups, easy debugging

52. **Meshname DNS - Decentralized .ygg Domain Resolution (2026-02-28)**
    - **Feature:** Decentralized DNS for Yggdrasil mesh networks
    - **New Packages:**
      - `secubox-app-meshname-dns`: Core service with `meshnamectl` CLI
      - `luci-app-meshname-dns`: LuCI dashboard for service management
    - **Architecture:**
      - Services announce `.ygg` domains via existing gossip protocol (`meshname_announce` type)
      - dnsmasq integration via `/tmp/hosts/meshname` dynamic hosts file
      - Cross-node resolution: master announces → clone can resolve via gossip
    - **CLI Commands:**
      - `meshnamectl announce <name> [port]` - Announce service as <name>.ygg
      - `meshnamectl revoke <name>` - Stop announcing service
      - `meshnamectl resolve <domain>.ygg` - Resolve domain to IPv6
      - `meshnamectl list` - List known .ygg domains
      - `meshnamectl sync` - Force sync with mesh peers
      - `meshnamectl status` - Show meshname DNS status
    - **RPCD Methods:** status, list, announce, revoke, resolve, sync, get_config, set_config
    - **LuCI Dashboard:** Status card, local services table, remote domains table, resolve test
    - **Integration:** Added `meshname_announce` handler to mirrornet gossip.sh

53. **Matrix/Element Self-Hosted Chat (2026-02-28)**
    - **Feature:** E2E encrypted federated chat via Conduit Matrix homeserver + Element Web client
    - **Infrastructure:**
      - Matrix homeserver: Conduit (Rust, lightweight) in LXC container
      - Matrix API: `https://matrix.gk2.secubox.in` (port 8008 internal)
      - Element Web: `https://chat.gk2.secubox.in` (uhttpd on port 8088)
    - **Configuration:**
      - Conduit config at `/etc/conduit/conduit.toml` inside `matrix` LXC
      - Element config at `/srv/matrix/element/config.json` (brand: "SecuBox Chat")
      - UCI config: `/etc/config/matrix` with server, federation, mesh settings
    - **HAProxy Integration:**
      - Both domains routed through mitmproxy WAF inspector
      - SSL certificates via ACME (Let's Encrypt production)
      - Routes added to central secubox-route registry
    - **uhttpd Instance:**
      - Dedicated `element` instance serving `/srv/matrix/element/`
      - Listen on `192.168.255.1:8088`
    - **Features:**
      - Federation enabled with trusted servers (matrix.org)
      - Registration via token: `n5MCOgUH9bmfM7I5uCWfA`
      - E2E cross-signing supported

54. **Yggdrasil Extended Peer Discovery (2026-02-28)**
    - **Feature:** Automatic peer discovery and trust-verified auto-peering for Yggdrasil mesh
    - **New Package:** `secubox-app-yggdrasil-discovery`
    - **CLI Tool:** `yggctl` with 15+ commands:
      - `yggctl self` - Show node's Yggdrasil info (IPv6, pubkey, hostname)
      - `yggctl peers` - Show current Yggdrasil peers
      - `yggctl announce` - Announce node to mesh via gossip
      - `yggctl discover` - List discovered SecuBox nodes
      - `yggctl auto-connect` - Connect to trusted discovered peers
      - `yggctl bootstrap {list|add|remove|connect}` - Manage bootstrap peers
      - `yggctl status` - Show discovery status and stats
      - `yggctl enable/disable` - Toggle auto-discovery
    - **Gossip Integration:**
      - Added `yggdrasil_peer` message type to mirrornet gossip protocol
      - `gossip_announce_yggdrasil()` helper function
      - Gossip handler at `/usr/lib/yggdrasil-discovery/gossip-handler.sh`
    - **Trust Verification:**
      - Master-link fingerprint verification for auto-peering
      - ZKP fingerprint support
      - Reputation score threshold (default: 50)
      - Configurable via `require_trust` and `min_trust_score` options
    - **Auto-Peering:**
      - Automatic connection to trusted discovered peers
      - Yggdrasil IPv6 range validation (200::/7)
      - Duplicate peer prevention
    - **UCI Configuration:**
      - `yggdrasil-discovery.main` - enabled, auto_announce, auto_peer, require_trust
      - `yggdrasil-discovery.bootstrap` - list of bootstrap peer URIs
    - **Daemon:**
      - Periodic announcement daemon (`daemon.sh`)
      - Configurable announce interval (default: 300s)

55. **Tor Shield opkg Bug Fix (2026-02-28)**
    - **Root Cause:** DNS queries for package repositories went through Tor DNS, which is slow/unreliable
    - **Symptom:** `opkg update` failed with "wget returned 4" when Tor Shield was active
    - **Fix:** Added dnsmasq bypass for excluded domains
    - **Implementation:**
      - `setup_dnsmasq_bypass()` generates `/tmp/dnsmasq.d/tor-shield-bypass.conf`
      - Excluded domains resolve directly via upstream DNS (WAN DNS or fallback to 1.1.1.1)
      - `cleanup_dnsmasq_bypass()` removes config on Tor Shield stop
    - **Default Exclusions:**
      - OpenWrt repos: `downloads.openwrt.org`, `openwrt.org`, `mirror.leaseweb.com`
      - NTP servers: `pool.ntp.org`, `time.google.com`, `time.cloudflare.com`
      - Let's Encrypt ACME: `acme-v02.api.letsencrypt.org`
      - DNS provider APIs: `api.gandi.net`, `api.ovh.com`, `api.cloudflare.com`
      - Security feeds: `services.nvd.nist.gov`, `cve.mitre.org`
    - Two-level bypass: dnsmasq (DNS resolution) + iptables (traffic routing)

56. **HAProxy Portal 503 Fix (2026-02-28)**
    - **Root Cause:** Vhost for `192.168.255.1` had malformed backend: `backend='--backend'`
    - **Symptom:** Portal returned "503 End of Internet" when accessing `https://192.168.255.1`
    - **Investigation:**
      - LuCI worked directly on port 8081, HAProxy container was stopped
      - Container exit logs showed: `unable to find required use_backend: '--backend'`
      - The `haproxyctl vhost add` command parsing incorrectly captured `--backend` as literal value
    - **Fix:**
      - Corrected UCI: `uci set haproxy.vhost_192_168_255_1.backend='luci_default'`
      - Disabled ACME (certs can't be issued for IP addresses): `acme='0'`
      - Regenerated HAProxy config: `haproxyctl generate`
      - Restarted container: `lxc-start -n haproxy`
    - Portal now returns 200 and redirects to LuCI

57. **AI Gateway - Data Sovereignty Engine (2026-02-28)**
    - Created `secubox-ai-gateway` package for ANSSI CSPN compliance
    - **Data Classifier (Sovereignty Engine):**
      - `LOCAL_ONLY`: IPs, MACs, credentials, keys, logs → LocalAI only
      - `SANITIZED`: PII that can be scrubbed → Mistral EU (opt-in)
      - `CLOUD_DIRECT`: Generic queries → Any provider (opt-in)
    - **Provider Hierarchy:** LocalAI (P0) > Mistral EU (P1) > Claude (P2) > GPT (P3) > Gemini (P4) > xAI (P5)
    - **OpenAI-compatible API** on port 4050:
      - POST /v1/chat/completions
      - POST /v1/completions
      - GET /v1/models
      - GET /health
    - **CLI (`aigatewayctl`):**
      - `classify <text>` - Test classification
      - `sanitize <text>` - Test sanitization
      - `provider list/enable/disable/test` - Provider management
      - `audit stats/tail/export` - Compliance logging
      - `offline-mode on/off` - Force LOCAL_ONLY
    - **PII Sanitizer:** IPv4/IPv6, MAC addresses, credentials, private keys, hostnames
    - **RPCD Backend:** 11 ubus methods for LuCI integration
    - **Audit Logging:** JSONL format with timestamps, classification decisions, patterns matched
    - All cloud providers opt-in, default LOCAL_ONLY
    - Key ANSSI compliance points: Data sovereignty, EU preference, audit trail, offline capability

58. **Pre-Deploy Lint Script (2026-02-28)**
    - Created `secubox-tools/pre-deploy-lint.sh` for comprehensive syntax validation before deployment
    - **JavaScript Validation:**
      - Full syntax checking via Node.js `--check` (when available)
      - Fallback pattern-based checks for common errors
      - Detects: debugger statements, console.log, missing 'use strict'
      - LuCI-specific: validates require statement format
    - **JSON Validation:**
      - Menu.d and acl.d syntax verification
      - Python json.tool for proper parsing
    - **Shell Script Validation:**
      - Bash/sh syntax checking via `-n` flag
      - shellcheck integration when available
      - RPCD-specific checks: JSON output, method dispatcher
    - **CSS Validation:**
      - Unclosed brace detection
      - Common typo detection
    - **Integration with quick-deploy.sh:**
      - Auto-runs before LuCI app deployment (default)
      - `--lint` / `--no-lint` flags for control
      - Prevents deployment if syntax errors detected
    - **Usage:**
      - `./secubox-tools/pre-deploy-lint.sh luci-app-system-hub`
      - `./secubox-tools/pre-deploy-lint.sh --all`
      - `./secubox-tools/quick-deploy.sh --app system-hub` (lint runs automatically)

59. **Nextcloud Integration Enhancements (2026-03-01)**
    - **WAF-Safe SSL Routing:**
      - `ssl-enable` now routes through `mitmproxy_inspector` backend
      - Automatically adds route to `/srv/mitmproxy/haproxy-routes.json`
      - Traffic flow: Client → HAProxy → mitmproxy (WAF) → Nextcloud
      - Prevents WAF bypass vulnerability
    - **Scheduled Backups:**
      - `nextcloudctl setup-backup-cron` creates cron jobs
      - Supports hourly, daily, weekly schedules (from UCI config)
      - Automatic cleanup of old backups (configurable retention)
    - **Email/SMTP Integration:**
      - `nextcloudctl setup-mail <host> [port] [user] [pass] [from]`
      - Supports Gmail, local mailserver, Mailcow configurations
      - Auto-configures TLS for ports 587/465
    - **CalDAV/CardDAV Connection Info:**
      - `nextcloudctl connections` shows all sync URLs
      - iOS, Android (DAVx5), Thunderbird instructions
      - Desktop client and mobile app links
    - **New RPCD Methods:**
      - `get_connections` - Returns all sync URLs
      - `setup_mail` - Configure SMTP via LuCI
      - `setup_backup_cron` - Enable scheduled backups via LuCI

60. **Reverse MWAN WireGuard v2 - Phase 1 (2026-03-01)**
    - WireGuard mesh peers as backup internet uplinks via mwan3 failover
    - **CLI (`wgctl`) uplink commands:**
      - `uplink list` - Discover available uplink peers from mesh
      - `uplink add <peer>` - Add peer as backup uplink
      - `uplink remove <peer>` - Remove peer uplink
      - `uplink status` - Show failover status
      - `uplink test <peer>` - Test connectivity through peer
      - `uplink failover enable/disable` - Toggle automatic failover
      - `uplink priority <peer> <weight>` - Set peer priority
      - `uplink offer` - Advertise this node as uplink provider
      - `uplink withdraw` - Stop advertising as uplink
    - **Uplink Library (`/usr/lib/wireguard-dashboard/uplink.sh`):**
      - Gossip protocol integration via secubox-p2p
      - `advertise_uplink_offer()` / `withdraw_uplink_offer()` - Mesh announcement
      - `get_peer_uplink_offers()` - Query mesh for available uplinks
      - `create_uplink_interface()` - WireGuard interface creation with IP allocation
      - `add_to_mwan3()` / `remove_from_mwan3()` - mwan3 failover integration
      - `test_uplink_connectivity()` / `measure_uplink_latency()` - Health checks
    - **RPCD Backend (9 new methods):**
      - Read: `uplink_status`, `uplinks`
      - Write: `add_uplink`, `remove_uplink`, `test_uplink`, `offer_uplink`, `withdraw_uplink`, `set_uplink_priority`, `set_uplink_failover`
    - **UCI Config (`/etc/config/wireguard_uplink`):**
      - Global settings: auto_failover, failover_threshold, ping_interval
      - Provider settings: offering state, bandwidth/latency advertisement
      - Per-uplink config: interface, peer_pubkey, endpoint, priority, weight
    - **Architecture:**
      - Uplink pool uses 172.31.x.x/16 range
      - mwan3 policy-based failover with configurable weights
      - Gossip-based peer discovery via P2P mesh
    - Phase 2 pending: LuCI dashboard with uplink column in peers table

61. **VirtualBox Image Builder Validation (2026-03-01)**
    - Fresh OpenWrt 24.10.5 image boots successfully in VirtualBox
    - Network connectivity confirmed (IPv6 link-local + IPv4)
    - Fixed mitmproxy routing for matrix.gk2.secubox.in and alerte.gk2.secubox.in
    - Identified corrupted c3box-vm images from Feb 23 - need rebuild
    - ASU firmware builder working with MochaBin preseeds embedded

62. **Reverse MWAN WireGuard v2 - Phase 2 (2026-03-02)**
    - **LuCI Dashboard for Mesh Uplinks:**
      - New "Mesh Uplinks" tab in WireGuard Dashboard (`uplinks.js`)
      - Status cards: Uplink Status, Active Uplinks count, Mesh Offers, Provider Mode
      - Quick actions: Offer Uplink, Withdraw Uplink, Toggle Auto-Failover
    - **Active Uplinks Table:**
      - Interface, Peer, Endpoint, Priority/Weight columns
      - Status badges (active/testing/unknown)
      - Actions: Test connectivity, Set priority, Remove uplink
    - **Peer Offers Grid:**
      - Card-based display of available mesh uplink offers
      - Shows node ID, bandwidth (Mbps), latency (ms), public key
      - "Use as Uplink" button to add peer as backup route
    - **API Additions (`api.js`):**
      - `getUplinkStatus`, `getUplinks` - Status retrieval
      - `addUplink`, `removeUplink` - Uplink management
      - `testUplink` - Connectivity testing
      - `offerUplink`, `withdrawUplink` - Provider mode
      - `setUplinkPriority`, `setUplinkFailover` - Configuration
    - **Menu Entry:** Added "Mesh Uplinks" at order 45 (after Traffic Stats)
    - **10-second polling** for live status updates
    - **Help section** explaining mesh uplink architecture
    - Completes Reverse MWAN WireGuard v2 feature

63. **AI Gateway LuCI Dashboard (2026-03-03)**
    - **Created `luci-app-ai-gateway` package** for Data Sovereignty Engine web interface
    - **4 Views with KISS Theme:**
      - **Overview:** Status cards (port, providers, requests), classification tier legend, provider hierarchy grid, audit statistics, service controls (start/stop/restart), offline mode toggle
      - **Providers:** 6 provider cards (LocalAI, Mistral, Claude, OpenAI, Gemini, xAI), enable/disable toggles, API key management, test connectivity buttons, tier badges (LOCAL/EU/CLOUD)
      - **Classifier:** Interactive classification testing tool, example inputs with expected tiers, real-time classification with pattern matching display, destination routing explanation
      - **Audit Log:** ANSSI CSPN compliance audit viewer, classification distribution chart, stats grid (LOCAL_ONLY/SANITIZED/CLOUD_DIRECT), JSONL log viewer with color-coded entries
    - **Menu Structure:** Admin > Services > AI Gateway with 4 tabs
    - **ACL Permissions:** Read methods (status, config, providers, audit, classify) and write methods (set_provider, offline_mode, test, start/stop/restart)
    - **Dark Mode Support:** Full dark theme compatibility across all views
    - **Live Polling:** 10-30 second auto-refresh for status and audit stats
    - **ANSSI CSPN Emphasis:** Information boxes explaining data sovereignty compliance
    - Completes AI Gateway full-stack implementation (backend + LuCI)

64. **Vortex DNS Firewall Phase 2 - Sinkhole Server (2026-03-03)**
    - **Sinkhole HTTP/HTTPS server** for capturing blocked domain connections
    - **Architecture:**
      - HTTP handler (`sinkhole-http-handler.sh`) via socat TCP listener
      - HTTPS support with OpenSSL TLS termination
      - Extracts domain from Host header
      - Records events to SQLite database
      - Returns warning page with block details
    - **Warning Page Features:**
      - Modern responsive design with dark gradient theme
      - Displays: blocked domain, threat type, client IP, timestamp
      - Explains why connection was blocked
      - SecuBox branding
    - **CLI Commands:**
      - `sinkhole start/stop/status` - Server management
      - `sinkhole logs [N]` - View last N events
      - `sinkhole export [file]` - Export events to JSON
      - `sinkhole gencert` - Generate self-signed HTTPS certificate
      - `sinkhole clear` - Clear event log
    - **RPCD Methods (5 new):**
      - `sinkhole_status` - Server status and event statistics
      - `sinkhole_events` - Retrieve captured events
      - `sinkhole_stats` - Top clients, top domains, event types
      - `sinkhole_toggle` - Enable/disable sinkhole server
      - `sinkhole_clear` - Clear event database
    - **LuCI Sinkhole Dashboard:**
      - Status card with toggle switch for enable/disable
      - Stats cards: total events, today's events, infected clients, unique domains
      - Top infected clients table with activity bars
      - Top blocked domains table
      - Event log viewer with clear function
      - 15-second polling for live updates
    - **Infected Client Detection:**
      - Clients attempting blocked domain connections are flagged
      - SOC visibility into compromised devices
      - Malware behavior analysis capability
    - **Dependencies added:** socat, openssl-util
    - Transforms Vortex from passive blocker to active threat analyzer

65. **Vortex DNS Firewall Phase 3 - DNS Guard Integration (2026-03-03)**
    - Integrated DNS Guard AI detection engine with Vortex Firewall.
    - **Enhanced Import with Metadata:**
      - Reads alerts.json with full detection context (type, confidence, reason)
      - Maps DNS Guard types: dga, tunneling, known_bad, tld_anomaly, rate_anomaly
      - Preserves confidence scores in blocklist database
      - Fallback to basic import from threat_domains.txt
    - **CLI Commands (4 new):**
      - `dnsguard status` - Show DNS Guard service and integration health
      - `dnsguard sync` - Force sync detections from DNS Guard
      - `dnsguard export` - Push Vortex intel back to DNS Guard blocklists
      - `dnsguard alerts [N]` - View recent DNS Guard alerts
    - **Bidirectional Feed:**
      - Vortex imports DNS Guard detections automatically
      - Vortex can export threat intel back to DNS Guard blocklists
      - Enables unified threat database across both systems
    - **RPCD Methods (3 new):**
      - `dnsguard_status` - Service status, alert/pending counts, detection breakdown
      - `dnsguard_alerts` - Retrieve recent alerts with metadata
      - `dnsguard_sync` - Trigger sync from DNS Guard
    - **LuCI DNS Guard Dashboard:**
      - Service status card (running/stopped/not installed)
      - Stats cards: alert count, pending approvals, imported to Vortex
      - Detection types breakdown with colored badges
      - Sync button with last sync timestamp
      - Recent alerts table with confidence bars
    - Phase 3 completes the integration between DNS Guard (AI detection) and Vortex Firewall (DNS blocking).

66. **Vortex DNS Firewall Phase 4 - Mesh Threat Sharing (2026-03-03)**
    - Integrated Vortex Firewall with secubox-p2p threat intelligence system.
    - **Domain IOC Support:**
      - Extended threat-intel.sh to support domain-based IOCs (not just IPs)
      - Added `ti_collect_vortex()` function to extract high-confidence domains
      - Domain IOCs applied to Vortex Firewall blocklist on receipt
    - **CLI Commands (5 new):**
      - `mesh status` - Show mesh threat sharing status
      - `mesh publish` - Publish local domains to mesh
      - `mesh sync` - Sync and apply threats from mesh
      - `mesh received [N]` - Show threats received from mesh
      - `mesh peers` - Show peer contribution statistics
    - **RPCD Methods (5 new):**
      - `mesh_status` - Mesh sharing status and stats
      - `mesh_received` - List received IOCs with trust scores
      - `mesh_publish` - Trigger publish operation
      - `mesh_sync` - Trigger sync and apply
      - `mesh_peers` - Peer contribution data
    - **LuCI Mesh Dashboard:**
      - Status cards: local/received/applied IOCs, domains shared, peers
      - Publish and Sync action buttons
      - Peer contributors grid with trust badges
      - Received threats table with severity/trust/status
    - **Trust Model Integration:**
      - Direct peers: Full trust, apply all threats
      - Transitive peers: Apply high severity only
      - Unknown: Skip (logged for review)
    - **Collection Criteria:**
      - Domains with confidence >= 85%
      - Domains with hit_count > 0 (locally verified)
      - Excludes private/local domains
    - Completes the Vortex DNS Firewall 4-phase implementation.

67. **Vortex Sinkhole Server Fix (2026-03-03)**
    - Fixed sinkhole server startup issues discovered via LuCI dashboard screenshot.
    - **HAProxy Bind Configuration:**
      - Changed HAProxy from wildcard `*:80`/`*:443` to specific IP `192.168.255.1:80`/`192.168.255.1:443`
      - Allows sinkhole to bind to dedicated IP `192.168.255.253:80`/`192.168.255.253:443`
    - **Missing Scripts Deploy:**
      - Created `/usr/lib/vortex-firewall/` directory on router
      - Deployed sinkhole-http.sh, sinkhole-http-handler.sh, sinkhole-https.sh
    - **Process Detection Fix:**
      - Changed pgrep patterns from `vortex-sinkhole-http` to `sinkhole-http-handler`
      - HTTPS detection updated to check PID file + SSL backend availability
    - **HTTPS Server Limitation:**
      - Socat package compiled without SSL support on this router
      - HTTPS sinkhole now shows "Limited (no SSL)" status when full SSL unavailable
      - Added `https_limited` field to RPCD response
      - Updated LuCI view to show warning color for limited mode
    - **Final Status:**
      - HTTP Server: Running (full functionality)
      - HTTPS Server: Limited mode (blocked HTTPS domains show browser cert warning)

68. **WAF Auto-Ban Tuning (2026-03-03)**
    - Identified false positive pattern: Amazonbot (legitimate crawler) being banned for "waf_bypass"
    - **Root cause**: Gitea URL parameters (`whitespace=ignore-xxx`, `display=source`) incorrectly triggering WAF bypass detection
    - **Autoban configuration tuning:**
      - Added Amazon, OpenAI, Meta to `whitelist_bots` (previously only Facebook, Google, Bing, Twitter, LinkedIn)
      - Changed sensitivity from `strict` to `moderate`
      - Increased moderate threshold from 3 to 5 attempts
      - Extended moderate window from 300s to 600s (10 minutes)
    - **CrowdSec scenario tuning:**
      - Updated `secubox-mitmproxy-waf-bypass.yaml`:
        - Added filter `evt.Parsed.is_bot != 'true'` to skip known bots
        - Increased capacity from 5 to 10
        - Extended leakspeed from 60s to 120s
        - Reduced blackhole from 30m to 15m
    - **Cleared incorrectly banned IPs:** Removed all waf_bypass decisions
    - **Result:** Legitimate crawlers (Amazon, Meta, OpenAI) no longer banned for normal Gitea browsing

69. **Image Builder Validation (2026-03-03)**
    - Validated `secubox-tools/secubox-image.sh` and `secubox-sysupgrade.sh` scripts
    - **Syntax validation:**
      - `secubox-image.sh`: Bash syntax OK
      - `secubox-sysupgrade.sh`: POSIX sh compatible (uses jsonfilter, not jq)
      - `resize-openwrt-image.sh`: Bash syntax OK
    - **ASU API testing:**
      - Verified API connectivity to sysupgrade.openwrt.org
      - Confirmed all device profiles are valid:
        - `globalscale_mochabin` (mvebu/cortexa72) ✓
        - `globalscale_espressobin` (mvebu/cortexa53) ✓
        - `generic` (x86/64) ✓
      - Successfully queued test builds for all profiles
    - **Bug fix - Curl redirect handling:**
      - ASU API returns 301 redirects for some endpoints
      - Added `-L` flag to all curl calls in both scripts
      - Fixed: `secubox-image.sh` (5 curl calls)
      - Fixed: `secubox-sysupgrade.sh` (4 curl calls)
    - **First-boot script validation:**
      - Extracted and validated shell syntax
      - 63 lines, 7 opkg calls, 10 log statements
    - **Tools available:** All required tools (gunzip, gzip, fdisk, sfdisk, parted, e2fsck, resize2fs, losetup, blkid, truncate) present

70. **Comprehensive Service Audit (2026-03-03)**
    - **WAF Enforcement:**
      - Disabled `waf_bypass='1'` on 21 vhosts that were incorrectly bypassing WAF
      - All HTTP traffic now routes through mitmproxy WAF for inspection
      - Regenerated and reloaded HAProxy configuration
    - **Mitmproxy WAF:**
      - Fixed service startup - restarted host `/etc/init.d/mitmproxy`
      - Verified port 8889 binding for mitmproxy-in (WAF inbound)
      - Confirmed HAProxy backend `mitmproxy_inspector` routing correctly
    - **Container Autostart:**
      - Enabled `lxc.start.auto=1` on 9 essential containers:
        haproxy, mitmproxy-in, streamlit, matrix, jabber, voip, gitea, domoticz, glances
      - Previously 5 containers had autostart enabled (nextcloud, mailserver, roundcube, jellyfin, peertube)
    - **Glances Container Fix:**
      - Root cause: cgroup mount failure with `cgroup:mixed` option
      - Simplified LXC config to `lxc.mount.auto = proc:mixed sys:ro` (no cgroup)
      - Container now starts successfully
    - **Service Inventory:**
      - 30 streamlit instances running
      - 95+ metablogizer sites configured
      - 18 LXC containers running: domoticz, gitea, glances, haproxy, jabber, jellyfin, lyrion, mailserver, matrix, mitmproxy-in, mitmproxy-out, nextcloud, peertube, roundcube, streamlit, voip, wazuh
    - **Health Verification:**
      - All core services responding (HTTP 301 redirect to HTTPS as expected):
        Nextcloud, Webmail, Jellyfin, Gitea, Matrix, PeerTube, Streamlit portal, Metablogizer sites
      - HAProxy backend health checks verified (`check` option on all servers)
      - External access requires upstream router port forwarding (82.67.100.75 → 192.168.255.1)

71. **AI Gateway Implementation (2026-03-04)**
    - **Data Classification Engine:**
      - 3-tier classification: `LOCAL_ONLY`, `SANITIZED`, `CLOUD_DIRECT`
      - Pattern detection: IPv4/IPv6, MAC addresses, private keys, credentials
      - Security tool references (crowdsec, iptables, nftables) auto-classified
    - **PII Sanitizer:**
      - IP anonymization (192.168.1.100 → 192.168.1.XXX)
      - Credential scrubbing (password=secret → password=[REDACTED])
    - **Provider Routing:**
      - LocalAI (priority 0, always enabled, local_only)
      - Mistral EU (priority 1, opt-in, sanitized)
      - Claude/OpenAI/Gemini/xAI (priority 2+, opt-in, cloud_direct)
    - **Package:** `secubox-ai-gateway` with `aigatewayctl` CLI
    - **RPCD Backend:** 11 methods for LuCI integration
    - **LuCI Frontend:** `luci-app-ai-gateway` with 4 views (Overview, Providers, Classify, Audit)
    - **Audit Logging:** ANSSI CSPN compliant JSON logs with timestamps

72. **SBOM Pipeline for CRA Annex I Compliance (2026-03-04)**
    - **Prerequisites Check (`scripts/check-sbom-prereqs.sh`):**
      - OpenWrt version validation (>= 22.03)
      - Auto-detect SDK location if not in buildroot
      - package-metadata.pl CycloneDX support check
      - Host tools: jq, sha256sum, git, perl
      - Optional tools: syft, grype, cyclonedx-cli (auto-install)
      - Kconfig: CONFIG_JSON_CYCLONEDX_SBOM setting
    - **SBOM Generator (`scripts/sbom-generate.sh`):**
      - 4 sources: OpenWrt native, SecuBox feed Makefiles, rootfs scan, firmware image
      - CycloneDX 1.6 primary output
      - SPDX 2.3 secondary output
      - SOURCE_DATE_EPOCH for reproducibility
      - Component merge and deduplication
    - **Feed Auditor (`scripts/sbom-audit-feed.sh`):**
      - PKG_HASH and PKG_LICENSE validation
      - MANIFEST.md generation
      - Suggested PKG_HASH from dl/ tarballs
    - **Makefile Targets:**
      - `make sbom` - Full generation
      - `make sbom-quick` - No rebuild
      - `make sbom-validate` - CycloneDX validation
      - `make sbom-scan` - Grype CVE scan
      - `make sbom-audit` - Feed audit
      - `make sbom-prereqs` - Check prerequisites
    - **GitHub Actions (`.github/workflows/sbom-release.yml`):**
      - Trigger: tags, workflow_dispatch, weekly schedule (CVE scan)
      - Jobs: sbom-generate, sbom-publish, sbom-cve-gate
      - Auto-create security issues for critical CVEs
    - **Documentation:**
      - `docs/sbom-pipeline.md` - Architecture, usage, CRA mapping
      - `SECURITY.md` - CRA Art. 13 §6 compliant disclosure policy
      - VEX policy reference

73. **Routes Status Dashboard & User Services (2026-03-04)**
    - **New Package: `luci-app-routes-status`**
      - HAProxy vhosts status dashboard
      - mitmproxy route configuration status (OUT/IN routes)
      - SSL certificate status indicators
      - WAF bypass detection (vhosts not using mitmproxy_inspector)
      - Route sync and add missing route actions
      - RPCD backend with optimized batch processing for 200+ vhosts
    - **Shell Scripting Fixes:**
      - `luci.network-modes`: Removed 60 lines of orphan dead code after `esac`
      - `luci.netdata-dashboard`: Fixed bash process substitution to POSIX awk
    - **Service User Extensions:**
      - `secubox-core-users`: Added gitea and jellyfin service support
      - `luci-app-secubox-users`: Added Jellyfin checkbox in frontend
    - **LXC Networking Fix:**
      - Discovered: LXC containers can't reach host's `127.0.0.1`
      - Fixed mitmproxy routes in nextcloudctl, metablogizerctl, mitmproxyctl
      - Use host LAN IP (192.168.255.1) instead of localhost for route targets
    - **Mailserver Recovery:**
      - Fixed webmail.gk2.secubox.in login error by starting mailserver container
      - Verified IMAP/SMTP connectivity (ports 143, 993, 25, 587, 465)

74. **February 2026 Milestones (2026-02-01 to 2026-02-28)**
    - **Mesh & P2P:**
      - ZKP Hamiltonian cryptographic authentication between mesh nodes
      - Mesh blockchain bidirectional sync (Master ↔ Clone)
      - P2P threat intelligence sharing (100+ IOC blocks)
      - Yggdrasil IPv6 overlay network with LAN multicast peering
      - Yggdrasil Extended Peer Discovery with gossip protocol
      - MirrorNet core package (identity, reputation, mirror, gossip, health)
      - Factory auto-provisioning with zero-touch device onboarding
    - **AI & Security:**
      - AI Gateway (Sovereignty Engine) with ANSSI CSPN compliance
      - 3-tier data classification: LOCAL_ONLY, SANITIZED, CLOUD_DIRECT
      - Provider hierarchy: LocalAI > Mistral EU > Claude > OpenAI > Gemini > xAI
      - DNS Guard AI migration with 5 detection modules
      - Threat Analyst autonomous agent with rule generation
      - MCP Server with 14 tools for Claude Desktop integration
      - CVE Triage agent with NVD integration
      - Network Anomaly agent with 5 detection modules
      - LocalRecall memory system for AI agents
      - Config Advisor for ANSSI CSPN compliance checking
    - **Communication:**
      - Matrix Homeserver (Conduit) with E2EE mesh messaging
      - VoIP (Asterisk PBX) with OVH trunk auto-provisioning
      - Jabber integration with Jingle VoIP and SMS relay
      - Self-hosted Jitsi Meet video conferencing
    - **Media & Content:**
      - PeerTube video platform with yt-dlp import
      - GoToSocial Fediverse server
      - Nextcloud LXC with nginx, PHP-FPM, Talk app
      - HexoJS multi-instance with GitHub/Gitea integration
      - MetaBlogizer KISS ULTIME MODE with one-command emancipation
      - WebRadio with CrowdSec integration
    - **Infrastructure:**
      - HAProxy path-based ACL routing with pattern length sorting
      - Mitmproxy multi-instance support (out/in)
      - Vortex Hub wildcard routing
      - Gandi DNS secondary setup with zone transfers
      - Custom mailserver (Postfix + Dovecot in LXC)
      - IoT Guard with OUI-based classification
      - IP Blocklist with nftables/iptables backends
      - AbuseIPDB reporter integration
      - Log denoising for System Hub
    - **Cloning & Deployment:**
      - Cloning Station with MOKATOOL integration
      - Remote device management via SSH
      - Clone history and image manager
      - Pre-deploy lint script for syntax validation
    - **LuCI Dashboards (KISS rewrites):**
      - SecuBox Dashboard, System Hub, Modules, Monitoring, Alerts, Settings
      - HAProxy (vhosts, backends, stats)
      - CrowdSec, Wazuh SIEM, mitmproxy WAF
      - VM Manager, Cookie Tracker, CDN Cache
      - InterceptoR Services Registry
    - **Bug Fixes:**
      - Tor Shield opkg DNS bypass
      - HAProxy Portal 503 fix
      - Mailserver Dovecot permissions
      - MirrorNet ash compatibility
      - Various POSIX shell fixes for BusyBox

75. **AI Gateway Login Command (2026-03-06)**
    - CLI: `aigatewayctl login [provider]` with credential validation
    - Rollback on authentication failure
    - RPCD: `login` method for LuCI integration
    - Format warnings for provider-specific API key patterns

76. **PhotoPrism Private Gallery (2026-03-06)**
    - LXC-based PhotoPrism deployment with SQLite backend
    - UCI-configurable originals path (`photoprism.main.originals_path`)
    - LuCI dashboard with KISS dark theme (stats, actions, settings)
    - Read-only mode support for HFS+ Apple Photos libraries
    - RPCD methods: status, get_config, set_config, get_stats, start, stop, index, import, emancipate
    - Sidecar and cache paths redirected to writable storage directory
    - Environment-aware lxc-attach helper for photoprism commands

77. **Vortex DNS Zone Management & Secondary DNS (2026-03-08)**
    - Zone management commands: `vortexctl zone list/dump/import/export/reload`
    - Secondary DNS commands: `vortexctl secondary list/add/remove`
    - Zone dump generates BIND format zone files from external DNS queries (dig)
    - Import configures dnsmasq as authoritative master with auth-zone
    - OVH secondary DNS support with AXFR zone transfer configuration
    - RPCD methods: zone_list, zone_dump, zone_import, zone_export, zone_reload, secondary_list, secondary_add, secondary_remove
    - ACL permissions updated for all new methods
    - Enables migration from Gandi/OVH hosted DNS to self-hosted authoritative DNS

78. **RTTY Remote Control Module (2026-03-08)**
    - **Phase 1 - RPCD Proxy:**
      - Backend: `secubox-app-rtty-remote` with `rttyctl` CLI
      - RPCD Proxy: Execute remote ubus calls to mesh nodes over HTTP JSON-RPC
      - CLI commands: `rttyctl nodes/rpc/rpc-list/rpc-batch/auth/sessions`
      - RPCD methods: status, get_nodes, rpc_call, rpc_list, get_sessions, connect
      - Local address detection for direct ubus access (bypasses auth limits)
    - **Phase 2 - Token-Based Shared Access:**
      - 6-character token codes grant RPC/terminal access without LuCI login
      - CLI commands: `rttyctl token generate/list/validate/revoke`, `rttyctl token-rpc`
      - RPCD methods: token_generate, token_list, token_validate, token_revoke, token_rpc
      - Support Panel: Generate code → Share → Support person connects
      - Configurable TTL (30m/1h/2h/4h), permission tracking, usage counter
    - **Phase 3 - Web Terminal:**
      - Web Terminal view embedding ttyd (port 7681) via iframe
      - Node selector for local/remote target selection
      - Remote detection: Direct ttyd connection or SSH fallback
      - RPCD method: start_terminal
      - Fullscreen and refresh controls
    - **LuCI Views:**
      - Remote Control dashboard (RPC proxy interface)
      - Remote Support panel (token sharing)
      - Web Terminal (ttyd shell access)

79. **HAProxy Routes Health Check (2026-03-09)**
    - Backend: `/usr/sbin/service-health-check` script probes all routes in haproxy-routes.json
    - Modes: `down` (only failures), `all` (color-coded status), `json` (structured output)
    - RPCD method: `get_service_health` with 5-minute cache and force-refresh option
    - LuCI panel integration in Services view:
      - Stats display: Up/Down/Total counts, health percentage
      - Down services list with IP:port tooltips (shows first 10)
      - Refresh button for manual health check trigger
    - CSS styling with KISS theme integration
    - ACL permission: `get_service_health` added to read access

80. **admin.gk2.secubox.in WAF Routing (2026-03-09)**
    - Fixed admin panel routing through mitmproxy WAF
    - Route: admin.gk2.secubox.in → 192.168.255.1:8081 (LuCI internal port)
    - Modified haproxy_router.py to allow port 8081 routes (was blocked)
    - Domain now accessible via HTTPS through WAF with proper access control
      - Web Terminal (ttyd shell access)

81. **RezApp Forge - Docker to SecuBox App Converter (2026-03-11)**
    - Package: `secubox-app-rezapp` with `rezappctl` CLI
    - UCI configuration: `/etc/config/rezapp` with catalog sources
    - Supported catalogs: Docker Hub, LinuxServer.io, GitHub Container Registry
    - CLI commands:
      - `rezappctl catalog list/add/remove` - Manage catalog sources
      - `rezappctl search <query>` - Search Docker images across catalogs
      - `rezappctl info <image>` - Show image details (tags, arch, ENV)
      - `rezappctl convert <image>` - Docker → LXC conversion
      - `rezappctl package <app>` - Generate SecuBox package structure
      - `rezappctl publish <app>` - Add to SecuBox addon catalog
    - Conversion workflow: pull → export → extract → generate LXC config
    - Templates: Makefile.tpl, init.d.tpl, ctl.tpl, config.tpl, start-lxc.tpl, lxc-config.tpl, manifest.tpl
    - Auto-generates procd init scripts, management CLIs, and UCI configs
    - Enables one-command Docker app deployment: convert → package → install

82. **Streamlit Forge Plan (2026-03-11)**
    - Comprehensive Streamlit app publishing platform specification
    - Features planned:
      - App upload and source management via Gitea
      - Multiple running instances with isolated configs
      - Auto-publishing to SecuBox dedicated spaces
      - Miniature preview/thumbnail generation
      - UCI configuration synchronization
      - Mesh AppStore publishing
      - Author workspace with blog integration
    - Templates: basic, dashboard, data-viewer, research-paper, slides, portfolio
    - Integration with: Gitea, HAProxy, Mitmproxy, MetaBlogizer, SecuBox P2P
    - Plan: `/home/reepost/.claude/plans/streamlit-forge.md`

83. **HAProxy Vhost Rename Feature (2026-03-11)**
    - Added `haproxyctl vhost rename <old> <new>` command
    - Renames vhost UCI section and all related configurations
    - Tested: MC360_Streamlit_BPM_v2.gk2.secubox.in → mc360.gk2.secubox.in

84. **Streamlit Forge - App Publishing Platform (2026-03-11)**
    - Package: `secubox-app-streamlit-forge` with `slforge` CLI
    - UCI configuration at `/etc/config/streamlit-forge`
    - 3 app templates: basic, dashboard, data-viewer
    - CLI commands:
      - `slforge create <name> --from-template <tpl>` - Create from template
      - `slforge start/stop/restart <app>` - Instance control
      - `slforge status/info/list` - Status and information
      - `slforge expose <app> --domain <d>` - HAProxy vhost + SSL
      - `slforge publish/unpublish <app>` - Mesh catalog management
    - Runs apps in Streamlit LXC container (mount: /srv/apps/)
    - Port-based status detection (works across LXC namespaces)
    - Wrapper script approach for reliable container execution
    - LuCI: `luci-app-streamlit-forge` with RPCD backend
      - Status dashboard with running/total/LXC cards
      - Create dialog with template selection
      - App table with Start/Stop/Open/Expose/Publish/Delete actions
      - Auto-refresh polling (10s interval)

85. **RezApp Forge LuCI Dashboard (2026-03-11)**
    - Package: `luci-app-rezapp` with RPCD backend
    - Menu: Services > RezApp Forge
    - Features:
      - Status cards (converted apps, catalogs, Docker status)
      - Docker Hub search with star ratings and descriptions
      - Convert dialog (name, tag, memory options)
      - Converted apps table with Package/Publish/Delete actions
    - RPCD methods: status, catalogs, apps, search, info, convert, package, publish, delete
    - ACL permissions for read/write operations

86. **SecuBox KISS Apps Catalog Update (2026-03-11)**
    - Added `luci-app-streamlit-forge` to catalog (productivity, lxc runtime)
      - Streamlit app publishing with templates, SSL exposure, mesh publishing
      - Featured as new release
    - Added `luci-app-rezapp` to catalog (system, native runtime)
      - Docker to LXC converter with catalog browsing, package generation
      - Featured as new release
    - Updated `new_releases` section with both apps
    - Total plugins: 37 → 39

87. **Streamlit Control Dashboard Phase 1 (2026-03-11)**
    - Package: `secubox-app-streamlit-control` - Modern Streamlit-based LuCI replacement
    - Inspired by metablogizer KISS design patterns
    - Architecture:
      - Python ubus client (`lib/ubus_client.py`) - JSON-RPC for RPCD communication
      - Authentication module (`lib/auth.py`) - LuCI session integration
      - KISS widgets library (`lib/widgets.py`) - Badges, status cards, QR codes
    - Pages:
      - Home (app.py) - System stats, service status, container quick controls
      - Sites (Metablogizer clone) - One-click deploy, sites table, action buttons
      - Streamlit - Streamlit Forge apps management
      - Containers - LXC container status and controls
      - Network - Interface status, WireGuard peers, mwan3 uplinks
      - Security - WAF status, CrowdSec decisions, firewall
      - System - Board info, packages, logs
    - Deployment:
      - Registered with Streamlit Forge on port 8531
      - Exposed via HAProxy at control.gk2.secubox.in
      - Routed through mitmproxy WAF (security policy compliant)
    - Fixed mitmproxy-in container startup (cgroup:mixed removal, routes JSON repair)

88. **Streamlit Control Dashboard Phase 2 (2026-03-11)**
    - RPCD integration for real data access
    - Authentication:
      - HTTPS with self-signed cert support (verify=False)
      - Dual auth: root (full access) + SecuBox users (read-only)
      - SecuBox users authenticate via `luci.secubox-users.authenticate`
    - ACL updates (`/usr/share/rpcd/acl.d/unauthenticated.json`):
      - Added read access: secubox-portal, metablogizer, haproxy, mitmproxy, crowdsec-dashboard, streamlit-forge
      - Allows dashboard viewing without system login
    - Fixed methods:
      - LXC containers: `luci.secubox-portal.get_containers` (luci.lxc doesn't exist)
      - CrowdSec: `luci.crowdsec-dashboard.status`
      - Fixed duplicate key error in Streamlit pages (enumerate with index)
    - Dashboard data verified: containers (11/32 running), HAProxy, WAF (16k threats), CrowdSec
    - Test user created: `testdash` / `Password123`

89. **Streamlit Control Dashboard Phase 3 (2026-03-11)**
    - Auto-refresh toggle:
      - Added to all main pages (Dashboard, Containers, Security, Streamlit, Network)
      - Configurable intervals: 10s, 30s, 60s
      - Manual refresh button
    - Permission-aware UI:
      - `can_write()` and `is_admin()` helper functions in auth.py
      - Action buttons hidden/disabled for SecuBox users (read-only access)
      - "View only" indicators for limited users
    - Containers page improvements:
      - Tabs for All/Running/Stopped filtering
      - Search filter by container name
      - Improved info panels with metrics display
      - Raw data expander
    - Security page improvements:
      - Better CrowdSec status parsing (handles various response formats)
      - Threat table with columns (IP, URL, Category, Severity, Time)
      - Stats tab with raw data viewer
    - Streamlit apps page:
      - Added restart button
      - Delete confirmation dialog
      - Open link buttons
    - Network page:
      - HAProxy search filter
      - Vhost count stats
      - WireGuard/DNS placeholders with setup hints

90. **CrowdSec Dashboard Bugfix (2026-03-11)**
    - Fixed: `TypeError: can't assign to property "countries" on 5: not an object`
    - Root cause: RPC error code 5 (UBUS_STATUS_NOT_FOUND) returned instead of object
    - Occurs when CrowdSec service is busy or temporarily unavailable
    - Fix: Added type check in `overview.js` render() and pollData() functions
    - `var s = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {}`
    - Deployed to router, cleared LuCI caches

91. **Meta Cataloger - Virtual Books (2026-03-11)**
    - New `secubox-app-metacatalog` package for content aggregation
    - Virtual Library concept: organizes MetaBlogizer sites, Streamlit apps into themed collections
    - CLI tool `/usr/sbin/metacatalogctl` with commands:
      - `sync` - Full scan + index + assign books + generate landing
      - `scan [source]` - Scan content sources (metablogizer, streamlit)
      - `index list|show|refresh` - Index management
      - `books list|show` - Virtual book management
      - `search <query>` - Full-text search
      - `status` - Catalog statistics
      - `landing` - Regenerate landing page
    - Content scanners:
      - MetaBlogizer: extracts title, description, languages, colors, canvas/audio detection
      - Streamlit: extracts from app.py and UCI config
    - Auto-assignment engine: matches entries to books via keywords and domain patterns
    - Default virtual books (6):
      - Divination (oracle, iching, hexagram)
      - Visualization (canvas, animation, 3d)
      - Analytics (dashboard, data, metrics)
      - Publications (blog, article, press)
      - Security (waf, firewall, crowdsec)
      - Media (video, audio, streaming)
    - Landing page: Tao prism fluoro theme with book shelf visualization
    - API endpoints: `/metacatalog/api/index.json`, `/metacatalog/api/books.json`
    - Initial sync: 120 entries indexed (118 MetaBlogs, 2 Streamlits)
    - BusyBox-compatible: uses sed instead of grep -P for regex extraction
    - Cron integration: hourly auto-sync via `/etc/cron.d/metacatalog`

92. **HAProxy Auto-Sync Mitmproxy Routes (2026-03-11)**
    - Fixed: New vhosts were missing mitmproxy route entries
    - `haproxyctl vhost add` now auto-runs `mitmproxyctl sync-routes` in background
    - `haproxyctl vhost remove` also triggers route sync
    - Prevents 404 WAF errors when adding new domains
    - Commit: 7cbd6406 "feat(haproxy): Auto-sync mitmproxy routes on vhost add/remove"

93. **Meta Cataloger Phase 2 & 3 (2026-03-11)**
    - **Phase 2: RPCD + LuCI Dashboard**
      - RPCD backend: `/usr/libexec/rpcd/luci.metacatalog`
      - 10 methods: list_entries, list_books, get_entry, get_book, search, get_stats, sync, scan, assign, unassign
      - LuCI view: `metacatalog/overview.js` with KISS theme
        - Header with stats chips (Entries, MetaBlogs, Streamlits, Books)
        - Sync Now button, Landing Page link
        - Virtual books shelf with entry previews
      - ACL file with read/write permissions
      - HAProxy vhost scanner: indexes all HAProxy domains as type "haproxy"
    - **Phase 3: Landing Page Enhancements**
      - Search functionality: real-time filter across all entries
      - Tab navigation: Collections (all books), All (full list), per-book filters
      - Scrollable book entries with max-height:300px
      - Entry type badges (metablog/red, streamlit/green, haproxy/blue)
      - Link to LuCI dashboard in footer
      - Template stored in `/usr/share/metacatalog/templates/landing.html.tpl`
    - Total entries: 246 (127 MetaBlogs, 14 Streamlits, 105 HAProxy)
    - Deployed at: https://catalog.gk2.secubox.in/metacatalog/
    - Persistent routes: `/srv/mitmproxy/manual-routes.json` for catalog/admin domains

94. **RTTY Remote Control Phase 3 (2026-03-08)**
    - Web Terminal view in LuCI
    - Embeds ttyd (port 7681) via secure iframe
    - Node selector for local/remote target selection
    - Remote detection: direct ttyd or SSH fallback
    - RPCD method: `start_terminal` returns terminal connection info
    - Menu entry: Remote Control → Remote Support → Web Terminal
    - Fullscreen toggle and refresh controls

95. **HERMÈS·360 Full I-Ching Translation (2026-03-11)**
    - Added full translations for all 64 hexagrams in 5 languages (DE, ES, PT, ZH, JA):
      - Image texts (_i): symbolic imagery section - 320 translations
      - Description texts (_d): hexagram meaning - 320 translations  
      - Judgment texts (_j): oracle guidance - 320 translations
      - Total: 960 new translation fields
    - Visual enhancements from wall.maegia.tv:
      - Canvas CSS filters: saturate(1.3) brightness(1.15) contrast(1.05)
      - Hover effect: saturate(1.4) brightness(1.25) contrast(1.08)
    - Added grid rendering during coin toss animation (drawGrid function)
    - File size: 1.7MB (up from 1.6MB with all translations)
    - Deployed to: https://lldh360.maegia.tv/

96. **HERMÈS·360 Language Switching Fix (2026-03-12)**
    - Fixed language switching for all hexagram texts (was only FR/EN, now all 7 languages)
    - Updated `getHexD`, `getHexJ`, `getHexI` functions to use dynamic field lookup (`LANG + '_d'`)
    - Added 320 hexagram name translations to `HNAMES_I18N` (DE/ES/PT/ZH/JA × 64)
    - Removed white background from canvas wrapper (`.cvwrap{background:transparent}`)
    - Mutation section now displays localized hexagram names
    - All 960 translations (descriptions, judgments, images) now accessible via language selector

97. **Streamlit Forge Phase 2 - Gitea Integration (2026-03-12)**
    - **CLI Commands**:
      - `slforge edit <app>` - Opens Gitea web editor, auto-creates repo if needed
      - `slforge pull <app>` - Pulls latest from Gitea, auto-restarts if running
      - `slforge push <app> [-m "msg"]` - Commits and pushes local changes to Gitea
      - `slforge preview <app>` - Generates HTML/SVG preview of running app
    - **Gitea API Integration**:
      - `gitea_api()` helper function with token auth
      - `gitea_ensure_org()` creates streamlit-apps org if missing
      - `gitea_create_repo()` initializes git repo and pushes to Gitea
      - Reads token from `/etc/config/gitea` UCI config
    - **RPCD Methods** (5 new):
      - `gitea_status` - Check Gitea availability and version
      - `edit` - Get Gitea editor URL for app
      - `pull` - Pull changes from Gitea
      - `push` - Push changes to Gitea
      - `preview` - Generate app preview
    - **LuCI Dashboard Updates**:
      - Gitea status card (version, online/offline)
      - Edit button (purple) opens Gitea editor modal
      - Pull button syncs latest changes
      - Modal shows direct link to Gitea editor
    - **Dependencies**: Git credentials configured via `.git-credentials`
    - **ACL**: Updated with new methods for read/write
98. **RTTY Remote Control Phase 4 - Session Replay (2026-03-12)**
    - **Avatar-Tap Integration**:
      - Session capture via mitmproxy WAF (passive, no traffic modification)
      - UCI config integration for database path (`/srv/lxc/streamlit/rootfs/srv/avatar-tap/sessions.db`)
      - Captures: auth headers, cookies, tokens, session data
    - **CLI Commands** (rttyctl):
      - `tap-sessions [domain]` - List captured sessions with optional domain filter
      - `tap-show <id>` - Show detailed session info (headers, cookies)
      - `tap-replay <id> <node>` - Replay captured session to remote mesh node
      - `tap-export <id> [file]` - Export session as JSON
      - `tap-import <file>` - Import session from JSON file
      - `json-tap-sessions` / `json-tap-session` - JSON output for RPCD
    - **RPCD Methods** (6 new):
      - `get_tap_status` - Avatar-Tap running state, session count, database path
      - `get_tap_sessions` - List all captured sessions
      - `get_tap_session` - Get single session details
      - `replay_to_node` - Replay session to target mesh node
      - `export_session` - Export session as base64 JSON
      - `import_session` - Import session from base64 JSON
    - **LuCI View** (`session-replay.js`):
      - Stats cards: total sessions, unique domains, recent activity, tap status
      - Sessions table with domain, method, path, captured time, use count
      - Filters: domain search, HTTP method dropdown
      - Replay panel: node selector, custom IP support, execution preview
      - View modal: session details with masked auth data
      - Import/Export: JSON file upload/download
    - **Menu**: System Hub → Session Replay
    - **ACL**: Updated with read (get_tap_*) and write (replay_*, export_, import_) permissions
    - **Tested**: 10 captured sessions from photos.gk2, cloud.gk2, api.anthropic.com, chatgpt.com

99. **SecuBox Watchdog - Service Health Monitor (2026-03-12)**
    - Created `secubox-app-watchdog` package for service health monitoring and auto-recovery
    - Created `luci-app-watchdog` package for LuCI dashboard integration
    - **Monitored Components**:
      - LXC Containers: haproxy, mitmproxy-in, mitmproxy-out, streamlit
      - Host Services: crowdsec, uhttpd, dnsmasq
      - HTTPS Endpoints: gk2.secubox.in, admin.gk2.secubox.in, lldh360.maegia.tv
    - **CLI Tool** (`watchdogctl`):
      - `status` - Show status of all monitored services with color output
      - `check` - Single health check without recovery
      - `check-recover` - Health check with automatic restart of failed services
      - `watch` - Continuous monitoring loop (procd managed)
      - `restart-container <name>` - Manual container restart
      - `restart-service <name>` - Manual service restart
      - `logs [N]` - View last N log entries
      - `clear-logs` - Clear log file and alert states
    - **Features**:
      - Alert cooldown to prevent spam (configurable, default 300s)
      - Log rotation (configurable max lines)
      - Critical service flagging
      - Container service start after LXC start (e.g., haproxy inside container)
    - **RPCD Methods**:
      - `status` - Full status with containers, services, endpoints
      - `get_containers` / `get_services` / `get_endpoints` - Individual lists
      - `restart_container` / `restart_service` - Remote restart via ubus
      - `check` - Trigger health check
      - `get_logs` / `clear_logs` - Log management
    - **LuCI Dashboard** (`watchdog/status.js`):
      - Real-time status with 10s polling
      - Containers table with restart buttons
      - Services table with restart buttons
      - Endpoints table with health indicators
      - Alert logs viewer with refresh/clear
      - "Run Check Now" button
    - **Auto-Recovery**: Cron job runs every minute, procd service runs continuous loop
    - **Files**:
      - `/etc/config/watchdog` - UCI configuration
      - `/usr/sbin/watchdogctl` - CLI tool
      - `/etc/init.d/watchdog` - procd service
      - `/etc/cron.d/watchdog` - Cron backup
      - `/usr/libexec/rpcd/luci.watchdog` - RPCD backend

100. **SecuBox Report Generator (2026-03-13)**
    - New `secubox-app-reporter` package for automated status reporting
    - **Two Report Types**:
      - Development Status: health score, HISTORY.md completions, WIP items, roadmap progress
      - Services Distribution: Tor hidden services (5), DNS/SSL vhosts (243), mesh services (1)
    - **CLI** (`/usr/sbin/secubox-reportctl`):
      - `generate <type>` - Generate report (dev|services|all)
      - `send <type>` - Generate + email report
      - `schedule <type>` - Set cron (daily|weekly|off)
      - `status` - Show generator status
      - `preview <type>` - Output to stdout
      - `list` - List generated reports
      - `clean` - Remove old reports
    - **Email Integration**:
      - msmtp/sendmail backend
      - MIME multipart HTML emails
      - UCI config for SMTP credentials
    - **HTML Output**:
      - KissTheme dark styling
      - Responsive card layout
      - Stats badges and health indicators
    - **LuCI Dashboard** (`luci-app-reporter`):
      - KISS-themed overview with status cards
      - Quick action cards for dev/services/all reports
      - Generate and Send buttons with email support
      - Reports list with view/delete actions
      - Schedule configuration (daily/weekly/off)
      - Email configuration status and test button
    - **RPCD Methods**:
      - `status` - Generator status and report counts
      - `list_reports` - List generated reports with metadata
      - `generate/send` - Create reports (optionally email)
      - `schedule` - Configure cron schedules
      - `delete_report` - Remove report files
      - `test_email` - Send test email
    - **Files**:
      - `/etc/config/secubox-reporter` - UCI configuration
      - `/usr/sbin/secubox-reportctl` - CLI tool
      - `/usr/share/secubox-reporter/lib/` - collectors.sh, formatters.sh, mailer.sh
      - `/usr/share/secubox-reporter/templates/` - HTML templates
      - `/etc/cron.d/secubox-reporter` - Scheduled reports
      - `/usr/libexec/rpcd/luci.reporter` - RPCD backend

101. **Configuration Vault System (2026-03-13)**
    - New `secubox-app-config-vault` package for versioned configuration backup
    - **Purpose**: Certification compliance, audit trail, cloning support for deployable SecuBox appliances
    - **Module-Based Organization**:
      - `users` - User Management & SSO (secubox-users, rpcd)
      - `network` - Network Configuration (network, firewall, dhcp)
      - `services` - Service Exposure & Distribution (secubox-exposure, haproxy, tor)
      - `security` - Security & WAF (crowdsec, mitmproxy)
      - `system` - System Settings (system, uhttpd)
      - `containers` - LXC Containers (lxc, lxc-auto + flat configs)
      - `reporter` - Report Generator (secubox-reporter)
      - `dns` - DNS & Domains (dns-provider, dnsmasq)
      - `mesh` - P2P Mesh Network (vortex, yggdrasil, wireguard)
    - **Gitea Integration**:
      - Auto-sync to private repository `gandalf/secubox-config-vault`
      - Push on commit (auto-push enabled)
      - Pull for recovery/restore
    - **CLI** (`/usr/sbin/configvaultctl`):
      - `init` - Initialize vault repository
      - `backup [module]` - Backup configs (all or specific module)
      - `restore <module>` - Restore module configs from vault
      - `push` - Push changes to Gitea
      - `pull` - Pull latest from Gitea
      - `status` - Show vault status
      - `history [n]` - Show last n config changes
      - `diff` - Show uncommitted changes
      - `modules` - List configured modules
      - `track <config>` - Track a config change (used by hooks)
      - `export-clone [file]` - Create deployment clone package
      - `import-clone <file>` - Import clone package
    - **Export/Import for Cloning**:
      - `export-clone` creates tar.gz with all configs + manifests
      - `import-clone` restores configs from clone package
      - Enables producing ready-to-use SecuBox installations
    - **LuCI Dashboard** (`luci-app-config-vault`):
      - KISS-themed overview with status rings
      - Quick actions: Backup All, Push/Pull to Gitea, Export Clone
      - Modules table with per-module backup buttons
      - Change history showing all commits
      - Repository info (branch, remote, last commit)
    - **RPCD Methods**:
      - `status` - Vault status and git info
      - `modules` - List modules with file counts
      - `history` - Commit history
      - `diff` - Uncommitted changes
      - `backup/restore` - Module operations
      - `push/pull` - Gitea sync
      - `init` - Initialize vault
      - `export_clone` - Create clone package
    - **Files**:
      - `/etc/config/config-vault` - UCI configuration
      - `/usr/sbin/configvaultctl` - CLI tool
      - `/usr/share/config-vault/lib/gitea.sh` - Gitea helpers
      - `/usr/share/config-vault/hooks/uci-track` - Change tracking hook
      - `/srv/config-vault/` - Git repository with versioned configs
      - `/usr/libexec/rpcd/luci.config-vault` - RPCD backend

102. **System Hardware Report (2026-03-13)**
    - Extended `secubox-app-reporter` with new system hardware report type
    - **Purpose**: Detailed system diagnostics, health monitoring, environmental impact awareness
    - **CLI**: `secubox-reportctl generate system`
    - **Features**:
      - CPU/Memory/Disk/Temperature gauges with animated rings
      - 24-bar CPU load histogram visualization
      - Environmental impact card (power/kWh/CO₂ estimates)
      - Health recommendations based on system metrics
      - Top processes table with status indicators
      - Network interface stats (RX/TX per interface)
      - Debug log viewer with severity highlighting
    - **Data Collectors** (`system-collector.sh`):
      - `get_cpu_usage` - /proc/stat based CPU percentage
      - `get_memory_info` - MemTotal/MemAvailable from /proc/meminfo
      - `get_disk_info` - Root filesystem usage via df
      - `get_temperature` - Thermal zone readings
      - `get_cpu_freq/model/cores` - CPU specifications
      - `estimate_power_watts` - ARM appliance power estimation
      - `generate_recommendations` - Threshold-based health tips
      - `get_debug_log` - Logread output with severity parsing
    - **Template**: `system-status.html.tpl` with KissTheme dark styling
    - **Files**:
      - `/usr/share/secubox-reporter/lib/system-collector.sh` - Data collection functions
      - `/usr/share/secubox-reporter/templates/system-status.html.tpl` - HTML template
    - **Technical Notes**:
      - BusyBox/ash compatible (no bash-specific syntax)
      - Uses awk for multiline HTML substitutions (sed limitations)
      - Temp files for dynamic content generation
      - /proc filesystem based for OpenWrt compatibility

103. **Streamlit On-Demand Launcher (2026-03-14)**
    - New `secubox-app-streamlit-launcher` package for resource optimization
    - **Purpose**: Reduce memory usage by starting apps only when accessed
    - **Features**:
      - On-demand startup (lazy loading)
      - Idle shutdown after configurable timeout (default: 30 min)
      - Memory pressure management (stop low-priority apps)
      - Priority system (1-100, higher = keep longer)
      - Always-on mode for critical apps
    - **CLI** (`/usr/sbin/streamlit-launcherctl`):
      - `daemon` - Background monitor process
      - `status/list` - Show app states and idle times
      - `start/stop` - Manual app control
      - `priority <app> <n>` - Set priority
      - `check/check-memory` - Manual idle/memory checks
    - **slforge Integration**:
      - `slforge launcher status` - Show launcher status
      - `slforge launcher priority <app> <n>` - Set priority
      - `slforge launcher always-on <app>` - Never auto-stop
      - Access tracking on app start
    - **Files**:
      - `/etc/config/streamlit-launcher` - UCI configuration
      - `/etc/init.d/streamlit-launcher` - Procd service
      - `/tmp/streamlit-access/` - Access tracking files
      - `/usr/share/streamlit-launcher/loading.html` - Cold-start page

104. **Module Manifest (NFO) System (2026-03-14)**
    - Introduced flat-file UCI-style `.nfo` manifest format for Streamlit apps and MetaBlogs.
    - NFO sections: identity, description, tags, runtime, dependencies, exposure, launcher, settings, dynamics, mesh, media.
    - `[dynamics]` section for AI/generative content integration:
      - `prompt_context` - Context for AI assistants
      - `capabilities` - What the app can do
      - `input_types` / `output_types` - Data formats
    - NFO parser library: `/usr/share/streamlit-forge/lib/nfo-parser.sh`
      - `nfo_parse()` - Parse NFO file
      - `nfo_get()` - Get value by section/key
      - `nfo_to_uci()` - Export to UCI config
      - `nfo_to_json()` - Export as JSON
      - `nfo_validate()` - Validate required fields
    - `slforge nfo` commands:
      - `init` - Generate README.nfo for existing app
      - `info` - Show NFO summary
      - `edit` - Edit manifest
      - `validate` - Validate NFO file
      - `json` - Export as JSON
      - `install` - Install app from directory with NFO
    - Universal installer script: `/usr/share/streamlit-forge/install.sh`
      - Reads README.nfo, installs dependencies, configures UCI
      - Creates catalog entry for mesh publishing
      - Runs post-install hooks
    - Hub generator v6 updated to read NFO metadata for category/description.
    - MetaBlog NFO template at `/usr/share/metablogizer/nfo-template.nfo`.
    - Full spec at `/usr/share/streamlit-forge/NFO-SPEC.md`.

105. **NFO System Extension - Full Integration (2026-03-14)**
    - Extended NFO system across all SecuBox content packages with batch generation.
    - **Schema Validator** (`/usr/share/streamlit-forge/lib/nfo-validator.sh`):
      - `nfo_validate_strict()` - Full validation with warnings
      - `nfo_validate_schema()` - Type-specific validation (streamlit, metablog, docker)
      - `nfo_get_missing_recommended()` - List recommended but missing fields
      - `nfo_get_completeness_score()` - Calculate completeness percentage (0-100)
    - **Batch NFO Generation**:
      - `slforge nfo init-all` - Generate NFO for all Streamlit apps
      - `metablogizerctl nfo init-all` - Generate NFO for all MetaBlog sites
      - Reports created/skipped/failed counts
    - **RPCD NFO Methods** (luci.streamlit-forge):
      - `nfo_read <app>` - Return NFO content as JSON
      - `nfo_write <app> <data>` - Update NFO from JSON
      - `nfo_validate <app>` - Validate and return warnings
    - **LuCI NFO Viewer Component** (`nfo-viewer.js`):
      - Reusable component for Streamlit Forge, Metacatalog, Service Registry
      - Collapsible sections (Identity, Description, Tags, Runtime, Dynamics, Mesh)
      - Validation status indicator with completeness badge
      - "Copy JSON" button for export
      - `render()` - Full viewer, `renderBadge()` - Compact badge
    - **LuCI NFO Editor Modal**:
      - "NFO" button in app cards opens editor modal
      - Form fields for key sections (identity, tags, runtime, dynamics)
      - Validation warnings display
      - Save/Cancel buttons with RPC integration
    - **Hub Generator Enhancement**:
      - Cards display NFO descriptions (description.short)
      - Keywords rendered as clickable tags
      - Capability badges from dynamics.capabilities
    - **Metacatalog Search Enhancement**:
      - NFO-based indexing for all entries
      - `--category` and `--capability` filters for search
      - Keywords, capabilities, audience in index
    - **Files**:
      - `/usr/share/streamlit-forge/lib/nfo-validator.sh` (new)
      - `/www/luci-static/resources/streamlit-forge/nfo-viewer.js` (new)
      - Updated: slforge, metablogizerctl, luci.streamlit-forge, hub-generator, metacatalogctl, overview.js

106. **Hub Generator v7 NFO Fix (2026-03-14)**
    - Fixed BusyBox awk compatibility issue with NFO section parsing
    - Problem: `gsub(/[\[\]]/, "")` didn't work reliably on BusyBox awk
    - Solution: Use two `sub()` calls instead for bracket removal
    - Single-pass awk extraction for 7 NFO fields
    - 110 NFO entries now correctly extracted from 239 total hub items
    - Capability and audience filter clouds display actual values
    - HAProxy vhost scanning: 102 services discovered
    - Dynamic preview modal with eye button for live site preview
    - Files: `/usr/sbin/hub-generator`

107. **Droplet Publisher (2026-03-14)**
    - One-drop content publishing: drag HTML/ZIP → instant site
    - Auto-detects content type (static/streamlit/hexo)
    - Creates vhosts at gk2.secubox.in by default
    - CLI: `dropletctl publish/list/remove/rename`
    - LuCI drag-drop interface at Services > Droplet
    - Registers with metablogizer or streamlit accordingly
    - Dark theme UI with gradient styling
    - RPCD backend with cgi-io upload integration
    - **Files**:
      - `/usr/sbin/dropletctl` (new)
      - `/usr/libexec/rpcd/luci.droplet` (new)
      - `/www/luci-static/resources/view/droplet/overview.js` (new)

108. **Newsbin - Usenet Search & Download (2026-03-14)**
    - SABnzbd LXC container using Debian rootfs (no Docker/Podman)
    - Downloads Debian LXC rootfs from images.linuxcontainers.org
    - Installs sabnzbdplus, unrar, par2, p7zip inside container
    - Container IP: 192.168.255.40:8085
    - NZBHydra2 package prepared (192.168.255.41:5076)
    - LuCI dashboard at Services > Newsbin
    - NNTP credentials: EWEKA account configured in UCI
    - RPCD backend with status/queue/history/search methods
    - Fixed BusyBox sh compatibility (local vars, json_add_boolean)
    - **Files**:
      - `secubox-app-sabnzbd/`: Makefile, UCI config, init.d, sabnzbdctl
      - `secubox-app-nzbhydra/`: Makefile, UCI config, init.d, nzbhydractl
      - `luci-app-newsbin/`: overview.js, RPCD handler, ACL, menu

109. **qBittorrent & WebTorrent - Torrent Services (2026-03-15)**
    - Both use Debian LXC containers (no Docker/Podman)
    - **qBittorrent** (`secubox-app-qbittorrent`):
      - Container IP: 192.168.255.42:8090
      - CLI: `qbittorrentctl install|start|stop|status|add|list|shell|configure-haproxy`
      - Default login: admin / adminadmin
      - Installs qbittorrent-nox via apt inside container
      - Torrent add via magnet links or URLs
    - **WebTorrent** (`secubox-app-webtorrent`):
      - Container IP: 192.168.255.43:8095
      - CLI: `webtorrentctl install|start|stop|status|add|list|shell|configure-haproxy`
      - Node.js streaming server with browser-based WebRTC support
      - Fixed webtorrent v2.x ESM incompatibility: pinned to v1.9.7 (last CommonJS version)
      - npm exact version install prevents semver resolution to breaking v2.x
      - In-browser streaming via `/stream/:infoHash/:path` endpoint
      - Dark-themed web UI with real-time torrent status
    - **Files**:
      - `secubox-app-qbittorrent/`: Makefile, UCI config, init.d, qbittorrentctl
      - `secubox-app-webtorrent/`: Makefile, UCI config, init.d, webtorrentctl

110. **MAGIC·CHESS·360 Colorset Enhancement (2026-03-15)**
    - Added colorset selector to wall.maegia.tv (MAGIC·CHESS·360) with 15 thematic color palettes
    - **Colorsets Added**:
      - `default` - Classic Gold & Cream (original)
      - `alchy` - Alchemical Mystique (green/gold/purple, alchemical symbols)
      - `emojiz` - Playful Rainbow (bright orange/pink, emoji icons)
      - `punk` - Cyberpunk Neon (magenta/cyan, tech/hacker icons)
      - `hollistique` - Earth Harmony (brown/teal, nature/yoga icons)
      - `tantrique` - Sacred Sensual (deep red/purple, spiritual symbols)
      - `cosmique` - Deep Space Nebula (violet/blue, planets/stars)
      - `solarix` - Solar Flare Energy (orange/gold, sun/fire icons)
      - `oceanique` - Deep Sea Mystery (cyan/aqua, marine life)
    - **Features**:
      - CSS custom properties for smooth theme transitions
      - Colorset selector UI with 15 circular gradient buttons
      - Keyboard shortcuts 1-9 for first 9, click for rest
      - LocalStorage persistence for user preference
      - Each colorset has 24 unique themed icons and labels
    - **Technical**:
      - Minimal patch to original (~5KB added, 190KB total)
      - No external dependencies (self-contained CSS/JS)
      - 3D perspective board with parallax mouse tracking
      - Pulse animations with random timing per cell
    - **Deployed**: https://wall.maegia.tv/

111. **MAGIC·CHESS·360 3D Joystick & Controls (2026-03-15)**
    - Added 2D joystick for true 3D CSS perspective transformation
    - **3D Controls**:
      - Joystick X-axis → `rotateY` ±45° (tilt plane left/right)
      - Joystick Y-axis → `rotateX` ±35° (tilt plane forward/back)
      - CSS `perspective: 1200px` on body for 3D depth
      - Canvas `transform-style: preserve-3d` for hardware acceleration
    - **Color Cycle Toggle**:
      - 🎨 button toggles automatic color spectrum animation
      - Default: OFF (fixed colors from selected colorset)
      - When ON: colors cycle through TAO_SPECTRUM with phase animation
    - **Additional Controls**:
      - Depth slider: zoom multiplier 0.5x to 2x
      - Pixel ring: click to cycle cell sizes (3-40px)
      - ↻ Auto-rotate button: continuous rotation animation
    - **Default Colorset**: RGB (simple red/green/blue)
    - **Deployed**: https://wall.maegia.tv/

### 2026-03-15

- **Dual-Stream DPI Architecture (Phase 1 Complete)**
  - New `secubox-dpi-dual` package: parallel MITM + Passive TAP deep packet inspection
  - Architecture: DUAL-STREAM-DPI.md comprehensive spec document
  - TAP Stream: tc mirred port mirroring → dummy interface → netifyd/nDPI analysis
  - Flow Collector: Stats aggregation from netifyd, writes `/tmp/secubox/dpi-flows.json`
  - Correlation Engine: Matches MITM WAF events + TAP flow data, CrowdSec integration
  - CLI: `dpi-dualctl` start/stop/status/flows/threats/mirror
  - Procd service: manages flow-collector + correlator instances
  - MITM Double Buffer: `dpi_buffer.py` mitmproxy addon (Phase 2 prep)
  - UCI config: `/etc/config/dpi-dual` with dual/mitm-only/tap-only modes
  - Files: mirror-setup.sh, dpi-flow-collector, dpi-correlator, dpi-dualctl, init.d/dpi-dual, dpi_buffer.py


- **Dual-Stream DPI Phase 2 - MITM Double Buffer + LuCI (Complete)**
  - Enhanced mitmproxy addon `dpi_buffer.py`:
    - Compiled regex for 6 threat categories (path_traversal, xss, sqli, lfi, rce, ssrf)
    - Scanner detection, optional blocking, request replay queue
  - New `luci-app-dpi-dual` package:
    - RPCD handler with 10 methods (status, flows, buffer, threats, correlation, control)
    - KISS dashboard with stream status cards, LED indicators, threats table
    - Protocol distribution, manual IP correlation
  - Streamlit control panel: Added DPI Dual card


- **Dual-Stream DPI Phase 3 - Correlation Engine + Timeline (Complete)**
  - Correlation library: IP reputation tracking, context gathering, CrowdSec integration
  - Enhanced correlator v2: Auto-ban, notifications, CLI commands
  - LuCI timeline view: Event cards, IP context modal, quick ban, search
  - 8 new RPCD methods for correlation access and control



- **Dual-Stream DPI Phase 4 - LAN Passive Flow Analysis (2026-03-15/16)**
  - New `dpi-lan-collector` daemon for passive br-lan monitoring
  - Zero MITM, zero caching - pure nDPI/conntrack flow observation
  - Tracks: active clients (ARP), destinations (conntrack), protocols (TCP/UDP/ICMP)
  - LuCI `lan-flows.js` view with real-time stats and 5s auto-refresh
  - 4 new RPCD methods: get_lan_status, get_lan_clients, get_lan_destinations, get_lan_protocols
  - UCI config `lan` section with interface, aggregate_interval, client_retention
  - Fixed protocol display bug ("TCPnull" → "TCP")
  - Removed mitmproxy-out container (not needed for WAF)
  - Updated MITM detection to check mitmproxy-in specifically

### 2026-03-16

- **Remote ttyd Deployment for Mesh Nodes (Complete)**
  - CLI commands: `rttyctl install <node|all> <app>`, `rttyctl install-status`, `rttyctl deploy-ttyd`
  - Installs packages on remote mesh nodes via RPC proxy to AppStore
  - Auto-enables and starts ttyd service after installation
  - `rttyctl install all <app>` - batch install across all mesh nodes
  - Node discovery from: master-link peers, WireGuard endpoints, P2P mesh
  - 4 new RPCD methods: install_remote, install_mesh, deploy_ttyd, install_status
  - ACL permissions updated for remote installation write actions
  - Use case: Deploy ttyd web terminal to all SecuBox nodes for browser-based SSH

- **Device Provisioning System (Complete)**
  - Auto-Restore: `import-clone <file> --apply` - auto-restores all modules after import
  - Remote Provisioning: `provision <node|all>` - pushes clone to remote nodes via RPC
  - First-Boot Pull: `pull-config <master>` - pulls config from master on new device
  - HTTP Serve: `serve-clone` - generates clone at /www/config-vault/ for HTTP download
  - CLI commands: restore-all, provision, pull-config, serve-clone
  - 6 new RPCD methods: restore_all, import_apply, provision, pull_config, export_clone_b64, serve_clone
  - Use case: Zero-touch provisioning of new SecuBox devices from master configuration

- **LuCI Provisioning & ttyd Deployment UI (Complete)**
  - Config Vault Dashboard: "Device Provisioning" card with Provision Remote, Serve via HTTP, Restore All buttons
  - RTTY Remote Dashboard: "Deploy ttyd to All" button and per-node ttyd button in actions column
  - Modal dialogs for confirmation, progress, and result display
  - Full mesh provisioning workflow now accessible via web UI

- **WAF Auto-Ban Tuning System (Complete)**
  - Configurable scoring weights via UCI `scoring` section
  - Sensitivity presets: low (0.7x), medium (1.0x), high (1.3x), custom
  - Whitelist support: IPs/CIDRs that skip auto-ban (`whitelist` section)
  - Configurable auto-ban duration and notification threshold
  - Reputation decay: Periodic score reduction for inactive IPs
  - CLI commands: `dpi-correlator tune`, `dpi-correlator whitelist`, `dpi-correlator decay`
  - 6 new RPCD methods: get_tuning, set_tuning, whitelist_add, whitelist_remove, whitelist_list, reset_reputation
  - UCi config updated with scoring weights, sensitivity, whitelist, decay options
  - Enables fine-tuning of auto-ban sensitivity for production traffic
