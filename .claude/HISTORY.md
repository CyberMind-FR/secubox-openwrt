# SecuBox UI & Theme History

_Last updated: 2026-02-15_

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
  - Issue: `.gk2.secubox.in` wildcard (port 4000) matched before specific routes like `apr.gk2.secubox.in` (port 8928)
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
