# SecuBox UI & Theme History

_Last updated: 2026-02-06_

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
