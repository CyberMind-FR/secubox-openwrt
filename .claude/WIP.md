# Work In Progress (Claude)

_Last updated: 2026-02-06_

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

- **Vortex DNS** - Meshed multi-dynamic subdomain delegation (QUEUED)

### Just Completed (2026-02-06)

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

### Next Up — Couche 1

1. **Guacamole Pre-built Binaries**
   - Current LXC build-from-source approach is too slow
   - Need to find/create pre-built ARM64 binaries for guacd + Tomcat

2. **Mesh Onboarding Testing**
   - End-to-end test of master-link dynamic join IPK generation
   - Validate P2P threat intelligence with real CrowdSec alerts

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

### Packages to Build (v0.19)

| Package | Priority | Notes |
|---------|----------|-------|
| `secubox-mirrornet` | HIGH | Core mesh orchestration, gossip protocol |
| `secubox-identity` | HIGH | did:plc generation, key rotation |
| `secubox-p2p-intel` | MEDIUM | IoC signed gossip |
| `luci-app-secubox-mirror` | MEDIUM | Dashboard for peers, trust, services |

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

### Certifications

- ANSSI CSPN: Data Classifier + Mistral EU + offline mode
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
