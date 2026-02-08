# Work In Progress (Claude)

_Last updated: 2026-02-08_

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

- **Vortex DNS** - Meshed multi-dynamic subdomain delegation (DONE 2026-02-05)
  - Created `secubox-vortex-dns` package with `vortexctl` CLI
  - Master/slave hierarchical DNS delegation
  - Wildcard domain management (*.domain.com)
  - First Peek auto-registration of services
  - Gossip-based exposure config sync via secubox-p2p
  - Created `luci-app-vortex-dns` dashboard

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

- **Inbound Port 25 Blocked by Free ISP** — KNOWN ISSUE
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
