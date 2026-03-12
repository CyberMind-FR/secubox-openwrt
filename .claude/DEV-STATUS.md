# SecuBox OpenWrt — Development Status

_Last Updated: 2026-03-09 | Version: 0.19.x | Total Packages: 185_

---

## Architecture Overview

SecuBox is a comprehensive security and services platform built on OpenWrt, organized in 4 architectural layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COUCHE 4: CERTIFICATION                              │
│  Config Advisor • ANSSI CSPN • CRA Compliance • SBOM • Security Audit      │
├─────────────────────────────────────────────────────────────────────────────┤
│                        COUCHE 3: MIRRORNET (P2P)                            │
│  Identity (DID) • Gossip Protocol • P2P Intel • Service Mirroring          │
├─────────────────────────────────────────────────────────────────────────────┤
│                        COUCHE 2: AI GATEWAY                                 │
│  LocalAI • Threat Analyst • DNS Guard AI • Network Anomaly • LocalRecall   │
├─────────────────────────────────────────────────────────────────────────────┤
│                        COUCHE 1: CORE MESH                                  │
│  HAProxy • CrowdSec • Mitmproxy WAF • Vortex DNS • WireGuard • LXC         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Completion Status

| Layer | Name | Progress | Key Components |
|-------|------|----------|----------------|
| 1 | Core Mesh | **85%** | 40+ modules, mesh networking, services |
| 2 | AI Gateway | **60%** | LocalAI, agents, MCP server |
| 3 | MirrorNet | **40%** | Vortex DNS, identity, gossip |
| 4 | Certification | **20%** | Config Advisor, ANSSI prep |

---

## 1. CORE INFRASTRUCTURE

### 1.1 SecuBox Core

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-core` | Backend | **Production** | Core libraries, shared functions, init system |
| `secubox-base` | Backend | **Production** | Base configuration, UCI defaults |
| `secubox-core-users` | Backend | **Production** | User management, authentication |
| `secubox-console` | Backend | **Production** | CLI tools, secuboxctl |
| `luci-app-secubox` | LuCI | **Production** | Central hub dashboard, module launcher |
| `luci-app-secubox-admin` | LuCI | **Production** | Administration panel |
| `luci-app-system-hub` | LuCI | **Production** | System health, services, diagnostics |
| `luci-theme-secubox` | Theme | **Production** | Dark-first design system |

**Key Features:**
- Centralized module management and status
- System health monitoring (CPU, RAM, disk, temperature)
- Service start/stop/restart controls
- Log aggregation and viewing
- Backup and restore functionality
- Remote access configuration

### 1.2 LXC Container Platform

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `luci-app-vm` | LuCI | **Production** | LXC container management |
| `secubox-app-*` | Backend | **Production** | 60+ containerized services |

**Running Containers (C3BOX gk2):**
```
gitea, mitmproxy-in, nextcloud, photoprism, jellyfin,
gotosocial, matrix, jitsi, peertube, prosody, wazuh,
localai, streamlit, webmail, lyrion, turn, ...
```

**Container Features:**
- Auto-start on boot
- Resource limits (memory, CPU)
- Network isolation
- Bind mount configurations
- cgroup v2 compatible

---

## 2. SECURITY LAYER

### 2.1 Intrusion Prevention (CrowdSec)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-crowdsec` | Backend | **Production** | CrowdSec LAPI + agent |
| `secubox-app-crowdsec-custom` | Backend | **Production** | Custom scenarios and parsers |
| `secubox-app-cs-firewall-bouncer` | Backend | **Production** | NFTables bouncer |
| `luci-app-crowdsec-dashboard` | LuCI | **Production** | Decisions, alerts, metrics |

**Key Features:**
- Real-time threat detection
- Community threat intelligence (CAPI)
- Custom scenarios: SSH brute-force, HTTP exploits, port scan
- NFTables integration with automatic ban/unban
- Alert dashboard with severity levels
- Bouncer management

**Metrics:**
- Active decisions
- Alerts per scenario
- Top attacking IPs
- Bouncer health

### 2.2 Web Application Firewall (Mitmproxy)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-mitmproxy` | Backend | **Production** | Mitmproxy WAF in LXC |
| `luci-app-mitmproxy` | LuCI | **Production** | WAF dashboard, rules |

**Key Features:**
- HAProxy router mode (routes by Host header)
- Bot detection (User-Agent analysis)
- Admin hunting detection
- Auth attempt logging
- Request/response inspection
- Flow limits for memory management (`hardlimit=500`)
- Custom addons: `haproxy_router.py`, `secubox_analytics.py`

**Routes Configuration:**
- `/srv/mitmproxy/haproxy-routes.json` — 150+ domain routes
- Hot-reload on file change

### 2.3 DNS Firewall (Vortex)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-vortex-firewall` | Backend | **Production** | DNS-based firewall |
| `secubox-vortex-dns` | Backend | **Production** | Master DNS with RPZ |
| `luci-app-vortex-firewall` | LuCI | **Production** | Blocklist management |
| `luci-app-vortex-dns` | LuCI | **Production** | DNS zone editor |

**Key Features:**
- Response Policy Zone (RPZ) blocking
- Threat feed integration
- Custom blocklists
- Query logging and analytics
- NXDOMAIN for malicious domains

### 2.4 IP Blocklist Management

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-ipblocklist` | Backend | **Production** | IP blocklist aggregator |
| `luci-app-ipblocklist` | LuCI | **Production** | Blocklist dashboard |

**Supported Lists:**
- Spamhaus DROP/EDROP
- FireHOL Level 1-4
- Emerging Threats
- AbuseIPDB
- Custom lists

### 2.5 MAC Address Guardian

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-mac-guardian` | Backend | **Production** | MAC-based access control |
| `luci-app-mac-guardian` | LuCI | **Production** | MAC whitelist/blacklist UI |

### 2.6 Authentication & Access Control

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `luci-app-auth-guardian` | LuCI | **Production** | OAuth2, vouchers, splash pages |
| `luci-app-client-guardian` | LuCI | **Production** | NAC, captive portal, parental |
| `secubox-app-nodogsplash` | Backend | **Production** | Captive portal daemon |
| `secubox-app-auth-logger` | Backend | **Production** | Authentication logging |

**Features:**
- OAuth2 provider integration
- Time-limited voucher system
- Device authorization workflow
- Parental controls (time-based, content filtering)
- Guest network isolation

### 2.7 Tor Integration

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-tor` | Backend | **Production** | Tor hidden services |
| `luci-app-tor-shield` | LuCI | **Production** | Tor configuration UI |

**Features:**
- .onion hidden service creation
- Tor routing for specific clients
- Exit node blocking

---

## 3. NETWORK LAYER

### 3.1 Reverse Proxy (HAProxy)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-haproxy` | Backend | **Production** | HAProxy with SNI routing |
| `luci-app-haproxy` | LuCI | **Production** | Vhost management |

**Key Features:**
- SNI-based routing (crt-list)
- Let's Encrypt ACME integration
- 226 active vhosts on production
- 92 SSL certificates
- Backend health checks
- WAF bypass toggle (disabled by security policy)

**CLI Tools:**
- `haproxyctl vhost list/add/remove`
- `haproxyctl ssl renew`
- `haproxyctl reload`

### 3.2 Virtual Host Manager

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-vhost-manager` | Backend | **Production** | Vhost orchestration |
| `luci-app-vhost-manager` | LuCI | **Production** | Vhost dashboard |

**Features:**
- Domain → backend mapping
- SSL certificate status
- Internal vs external routing
- Redirect management

### 3.3 DNS Master

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-dns-master` | Backend | **Production** | BIND9 authoritative DNS |
| `luci-app-dns-master` | LuCI | **Production** | Zone file editor |

**Managed Zones:**
- maegia.tv (26 subdomains)
- ganimed.fr (5 subdomains)
- secubox.in (44 subdomains)
- sblocal (internal mesh)

**Features:**
- Zone file management via LuCI
- Serial auto-increment
- ACME DNS-01 challenge support
- Sync to `/etc/bind/zones/`

### 3.4 DNS Provider Integration

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-dns-provider` | Backend | **Beta** | External DNS API |
| `luci-app-dns-provider` | LuCI | **Beta** | Provider configuration |

**Supported Providers:**
- Gandi LiveDNS
- Cloudflare
- OVH
- Route53

### 3.5 WireGuard VPN

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `luci-app-wireguard-dashboard` | LuCI | **Production** | WireGuard management |

**Features:**
- Interface creation/management
- Peer QR code generation
- Traffic statistics
- Auto-key generation
- Mobile client export

### 3.6 Network Modes

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `luci-app-network-modes` | LuCI | **Production** | Topology switcher |

**Modes:**
- Router (default)
- Access Point
- Bridge
- Repeater
- Sniffer (promiscuous)

### 3.7 Bandwidth Management

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `luci-app-bandwidth-manager` | LuCI | **Production** | QoS and quotas |
| `luci-app-traffic-shaper` | LuCI | **Production** | Advanced shaping |

**Features:**
- SQM/CAKE integration
- Per-client quotas
- Priority classes
- Scheduled rules
- Usage graphs

---

## 4. SERVICES LAYER

### 4.1 Media Services

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-jellyfin` | Backend | **Production** | Media streaming server |
| `luci-app-jellyfin` | LuCI | **Production** | Jellyfin management |
| `secubox-app-photoprism` | Backend | **Production** | Photo management |
| `luci-app-photoprism` | LuCI | **Beta** | PhotoPrism dashboard |
| `secubox-app-lyrion` | Backend | **Production** | Music server (LMS) |
| `luci-app-lyrion` | LuCI | **Production** | Lyrion management |
| `secubox-app-peertube` | Backend | **Production** | Video platform |
| `luci-app-peertube` | LuCI | **Beta** | PeerTube dashboard |
| `luci-app-media-hub` | LuCI | **Production** | Unified media dashboard |
| `luci-app-media-flow` | LuCI | **Production** | Streaming analytics |

### 4.2 Communication Services

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-matrix` | Backend | **Production** | Matrix homeserver |
| `luci-app-matrix` | LuCI | **Production** | Matrix management |
| `secubox-app-jabber` | Backend | **Production** | Prosody XMPP |
| `luci-app-jabber` | LuCI | **Production** | XMPP dashboard |
| `secubox-app-jitsi` | Backend | **Production** | Video conferencing |
| `luci-app-jitsi` | LuCI | **Production** | Jitsi management |
| `secubox-app-simplex` | Backend | **Beta** | SimpleX Chat server |
| `luci-app-simplex` | LuCI | **Beta** | SimpleX dashboard |
| `secubox-app-gotosocial` | Backend | **Production** | Fediverse server |
| `luci-app-gotosocial` | LuCI | **Production** | GoToSocial management |
| `secubox-app-voip` | Backend | **Beta** | VoIP/SIP services |
| `luci-app-voip` | LuCI | **Beta** | VoIP configuration |

### 4.3 Cloud Services

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-nextcloud` | Backend | **Production** | Nextcloud + Talk HPB |
| `luci-app-nextcloud` | LuCI | **Production** | Nextcloud dashboard |
| `secubox-app-mailserver` | Backend | **Production** | Email (Postfix/Dovecot) |
| `luci-app-mailserver` | LuCI | **Beta** | Mail configuration |
| `secubox-app-roundcube` | Backend | **Production** | Webmail client |
| `secubox-app-gitea` | Backend | **Production** | Git hosting |
| `luci-app-gitea` | LuCI | **Production** | Gitea management |

### 4.4 IoT & Home Automation

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-zigbee2mqtt` | Backend | **Production** | Zigbee gateway |
| `luci-app-zigbee2mqtt` | LuCI | **Production** | Z2M dashboard |
| `secubox-app-domoticz` | Backend | **Beta** | Home automation |
| `luci-app-domoticz` | LuCI | **Beta** | Domoticz UI |
| `luci-app-iot-guard` | LuCI | **Production** | IoT device isolation |
| `luci-app-mqtt-bridge` | LuCI | **Beta** | MQTT routing |

### 4.5 Remote Access

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-rtty-remote` | Backend | **Production** | Web terminal (rtty) |
| `luci-app-rtty-remote` | LuCI | **Production** | Remote terminal UI |
| `secubox-app-rustdesk` | Backend | **Beta** | Remote desktop |
| `secubox-app-guacamole` | Backend | **Alpha** | Web-based RDP/VNC |
| `secubox-app-turn` | Backend | **Production** | TURN/STUN server |
| `luci-app-turn` | LuCI | **Production** | TURN configuration |

**RTTY Remote Features:**
- Web-based terminal access
- Session management
- Support panel integration
- Device status monitoring

### 4.6 Development Tools

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-streamlit` | Backend | **Production** | Streamlit app hosting |
| `luci-app-streamlit` | LuCI | **Production** | Streamlit management |
| `secubox-app-hexojs` | Backend | **Production** | Static site generator |
| `luci-app-hexojs` | LuCI | **Production** | HexoJS dashboard |
| `secubox-app-metablogizer` | Backend | **Production** | Blog emancipation |
| `luci-app-metablogizer` | LuCI | **Production** | Blog management |

---

## 5. AI & INTELLIGENCE LAYER

### 5.1 AI Gateway

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-ai-gateway` | Backend | **Production** | AI orchestration |
| `secubox-app-localai` | Backend | **Production** | LocalAI inference |
| `luci-app-localai` | LuCI | **Production** | LocalAI dashboard |
| `secubox-app-ollama` | Backend | **Beta** | Ollama models |
| `luci-app-ollama` | LuCI | **Beta** | Ollama management |
| `luci-app-ai-gateway` | LuCI | **Production** | Unified AI dashboard |
| `luci-app-ai-insights` | LuCI | **Beta** | AI-powered analytics |

**LocalAI Features:**
- REST API (port 8091)
- Model management
- Embeddings generation
- Text completion
- Agent job support

### 5.2 Security AI Agents

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-threat-analyst` | Backend | **Beta** | AI threat analysis |
| `luci-app-threat-analyst` | LuCI | **Beta** | Threat analyst UI |
| `secubox-dns-guard` | Backend | **Beta** | AI DNS anomaly detection |
| `luci-app-dnsguard` | LuCI | **Beta** | DNS Guard dashboard |
| `secubox-network-anomaly` | Backend | **Beta** | Network behavior analysis |
| `luci-app-network-anomaly` | LuCI | **Beta** | Anomaly dashboard |

**Threat Analyst Features:**
- Log pattern analysis
- Attack classification
- Auto-rule generation for CrowdSec
- Severity scoring

### 5.3 Memory & Context

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-localrecall` | Backend | **Alpha** | Persistent AI memory |
| `luci-app-localrecall` | LuCI | **Alpha** | Memory management |
| `secubox-mcp-server` | Backend | **Beta** | Claude MCP integration |

**LocalRecall Features:**
- SQLite-based memory storage
- Context retrieval for agents
- Conversation history
- RAG capabilities

---

## 6. MESH & P2P LAYER

### 6.1 Master-Link (Node Hierarchy)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-master-link` | Backend | **Production** | Node onboarding |
| `luci-app-master-link` | LuCI | **Production** | Master/slave config |

**Features:**
- Token-based enrollment
- Configuration push
- Health monitoring
- Automatic failover

### 6.2 P2P Intelligence

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-p2p` | Backend | **Beta** | P2P mesh protocol |
| `luci-app-secubox-p2p` | LuCI | **Beta** | P2P dashboard |
| `secubox-p2p-intel` | Backend | **Alpha** | IOC sharing |

**Features:**
- Gossip-based propagation
- Signed IOC exchange
- Reputation scoring
- Service discovery

### 6.3 Identity & Trust

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-identity` | Backend | **Alpha** | DID-based identity |
| `secubox-mirrornet` | Backend | **Alpha** | Service mirroring |

### 6.4 Mesh DNS

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-meshname-dns` | Backend | **Beta** | Mesh DNS resolution |
| `luci-app-meshname-dns` | LuCI | **Beta** | Mesh DNS config |
| `secubox-app-yggdrasil-discovery` | Backend | **Alpha** | Yggdrasil integration |

---

## 7. MONITORING & ANALYTICS

### 7.1 System Monitoring

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-glances` | Backend | **Production** | System metrics |
| `luci-app-glances` | LuCI | **Production** | Glances dashboard |
| `luci-app-netdata-dashboard` | LuCI | **Production** | Netdata integration |

### 7.2 Network Analytics

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-netifyd` | Backend | **Production** | Deep packet inspection |
| `luci-app-secubox-netifyd` | LuCI | **Production** | DPI dashboard |
| `secubox-app-ndpid` | Backend | **Production** | nDPI engine |
| `luci-app-ndpid` | LuCI | **Production** | Protocol detection UI |

**netifyd Features:**
- Application identification
- Device fingerprinting
- Flow analysis
- Top talkers
- Risk scoring

### 7.3 Security Analytics

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-wazuh` | Backend | **Production** | SIEM agent |
| `secubox-wazuh-manager` | Backend | **Production** | Wazuh manager |
| `luci-app-wazuh` | LuCI | **Production** | Wazuh dashboard |
| `luci-app-secubox-security-threats` | LuCI | **Production** | Threat overview |

### 7.4 Session Analytics

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-avatar-tap` | Backend | **Production** | Session recording |
| `luci-app-avatar-tap` | LuCI | **Production** | Session replay UI |
| `secubox-cookie-tracker` | Backend | **Production** | Cookie analytics |
| `luci-app-cookie-tracker` | LuCI | **Production** | Cookie dashboard |

**Avatar-Tap Features:**
- HTTP request/response capture
- Session replay
- User journey visualization
- Privacy-aware storage

---

## 8. ADMINISTRATION & COMPLIANCE

### 8.1 Configuration Management

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-backup` | Backend | **Production** | Backup/restore |
| `luci-app-backup` | LuCI | **Production** | Backup UI |
| `secubox-config-advisor` | Backend | **Beta** | Configuration audit |
| `luci-app-config-advisor` | LuCI | **Beta** | Compliance dashboard |
| `luci-app-cloner` | LuCI | **Alpha** | Station cloning |

**Config Advisor Checks:**
- ANSSI CSPN recommendations
- CRA Annex I compliance
- Security best practices
- Performance optimization

### 8.2 CVE & Vulnerability

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-cve-triage` | Backend | **Beta** | CVE monitoring |
| `luci-app-cve-triage` | LuCI | **Beta** | CVE dashboard |
| `secubox-app-cyberfeed` | Backend | **Production** | Threat feeds |
| `luci-app-cyberfeed` | LuCI | **Production** | Feed management |

### 8.3 Device Intelligence

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-device-intel` | Backend | **Production** | Device fingerprinting |
| `luci-app-device-intel` | LuCI | **Production** | Device database |

### 8.4 Service Registry

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `luci-app-service-registry` | LuCI | **Production** | Service catalog |
| `luci-app-routes-status` | LuCI | **Production** | Route monitoring |

---

## 9. EXPOSURE ENGINE (Punk Exposure)

### 9.1 Service Exposure

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-exposure` | Backend | **Production** | Exposure orchestrator |
| `luci-app-exposure` | LuCI | **Production** | Peek/Poke/Emancipate UI |

**Three-Verb Model:**
- **Peek**: Discover and scan services
- **Poke**: Configure exposure channels
- **Emancipate**: Activate multi-channel exposure

**Exposure Channels:**
1. **Tor** — .onion hidden services
2. **DNS/SSL** — HAProxy + ACME + DNS provider
3. **Mesh** — P2P service registry + gossip

**CLI:**
```bash
# Full emancipation
secubox-exposure emancipate myapp 8080 myapp.secubox.in --all

# Selective channels
secubox-exposure emancipate myapp 8080 --dns --mesh
secubox-exposure emancipate secret 8888 --tor
```

---

## 10. SPECIAL MODULES

### 10.1 Interceptor (MITM Analysis)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `luci-app-interceptor` | LuCI | **Beta** | SSL interception UI |

### 10.2 ZKP (Zero-Knowledge Proofs)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `zkp-hamiltonian` | Backend | **Alpha** | ZKP implementation |
| `luci-app-zkp` | LuCI | **Alpha** | ZKP dashboard |

### 10.3 OpenClaw (Automation)

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-openclaw` | Backend | **Beta** | Automation engine |
| `luci-app-openclaw` | LuCI | **Beta** | Workflow UI |

### 10.4 SaaS Relay

| Package | Type | Status | Description |
|---------|------|--------|-------------|
| `secubox-app-saas-relay` | Backend | **Beta** | SaaS integration |
| `luci-app-saas-relay` | LuCI | **Beta** | Relay configuration |

---

## Production Deployment (C3BOX gk2)

### Current Statistics

| Metric | Value |
|--------|-------|
| Total RAM | 8 GB |
| Available RAM | ~2.6 GB |
| LXC Containers | 18 running |
| HAProxy Vhosts | 226 domains |
| SSL Certificates | 92 |
| DNS Zones | 7 |
| DNS Records | 78 |
| Mitmproxy Routes | 150+ |

### Service Health

| Service | Status | Port |
|---------|--------|------|
| HAProxy | Running | 80, 443 |
| Mitmproxy WAF | Running | 22222 |
| CrowdSec LAPI | Running | 8080 |
| BIND DNS | Running | 53 |
| Gitea | Running | 3001, 2222 |
| LocalAI | Running | 8091 |
| Jellyfin | Running | 8096 |
| Nextcloud | Running | 8080 |

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.19.x | 2026-03 | RTTY Remote, DNS Master fixes, WAF memory optimization |
| 0.18.x | 2026-02 | Avatar-Tap, Streamlit emancipation, Talk HPB |
| 0.17.x | 2026-02 | Vortex DNS, P2P Intel, Config Advisor |
| 0.16.x | 2026-01 | HAProxy SNI, LXC migration, CrowdSec dashboard |

---

## Roadmap to v1.0

### v0.20 — AI Gateway Expansion (Target: 2026-03-30)
- [ ] LocalAI Agent Jobs
- [ ] Threat Analyst auto-rules
- [ ] DNS Guard AI detection
- [ ] Network Anomaly AI
- [ ] LocalRecall persistence

### v0.21 — MirrorNet Phase 1 (Target: 2026-04-15)
- [ ] MirrorNet identity (DID)
- [ ] Gossip protocol
- [ ] P2P Intel signed IOCs
- [ ] Service mirroring

### v0.22 — Station Cloning (Target: 2026-04-30)
- [ ] Clone image builder
- [ ] TFTP boot server
- [ ] Remote device flash
- [ ] Auto-mesh join

### v1.0 — Certification Ready (Target: 2026-06-01)
- [ ] ANSSI CSPN compliance
- [ ] CRA Annex I SBOM
- [ ] Security documentation
- [ ] Penetration test fixes

---

## Quick Reference

### Key CLI Tools

```bash
# HAProxy
haproxyctl vhost list|add|remove <domain>
haproxyctl ssl status|renew

# Mitmproxy
mitmproxyctl status|restart|routes

# CrowdSec
cscli decisions list
cscli alerts list
cscli bouncers list

# DNS
dnsctl zone list|add|sync
vortexctl mesh status

# Exposure
secubox-exposure peek
secubox-exposure emancipate <service> <port> <domain>

# System
secuboxctl status
secuboxctl service restart <name>
```

### Directory Structure

```
/etc/config/          # UCI configuration
/etc/bind/zones/      # DNS zone files
/srv/mitmproxy/       # WAF routes and addons
/srv/lxc/             # Container rootfs
/srv/gitea/           # Gitea data
/var/log/crowdsec.log # CrowdSec logs
```

---

_Document generated from 185 packages across 10 functional domains._
