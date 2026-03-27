# SecuBox OpenWrt Wiki

Welcome to the **SecuBox** documentation wiki. SecuBox is a privacy-focused mesh network appliance built on OpenWrt 24.10.

---

## Quick Start

| Topic | Description |
|-------|-------------|
| [Installation](Installation.md) | Getting started with SecuBox |
| [Quick Start Guide](Quick-Start.md) | First-time setup and configuration |
| [Architecture](Architecture.md) | System architecture overview |
| [Module Catalog](Modules.md) | Complete list of 80+ modules |

---

## Module Categories

### Core & Mesh

| Module | Description | Screenshot |
|--------|-------------|------------|
| [SecuBox Core](modules/Core.md) | Base utilities and shared libraries | ![](../screenshots/router/core.png) |
| [Mesh Network](modules/Mesh.md) | Mesh daemon, topology, gate election | ![](../screenshots/router/mesh.png) |
| [P2P Network](modules/P2P.md) | Decentralized gossip protocol | ![](../screenshots/router/p2p.png) |
| [MirrorNet](modules/MirrorNet.md) | Mesh orchestration and mirroring | ![](../screenshots/router/mirror.png) |
| [Identity](modules/Identity.md) | DID:plc, key rotation, trust scoring | ![](../screenshots/router/identity.png) |

### Security (15 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [CrowdSec Dashboard](modules/CrowdSec.md) | IDS/IPS with threat intelligence | ![](../screenshots/router/crowdsec.png) |
| [WAF Filters](modules/WAF.md) | mitmproxy Web Application Firewall | ![](../screenshots/router/waf.png) |
| [Threat Analyst](modules/ThreatAnalyst.md) | AI-powered threat correlation | ![](../screenshots/router/threat-analyst.png) |
| [DNS Guard](modules/DNSGuard.md) | DNS anomaly detection | ![](../screenshots/router/dnsguard.png) |
| [Auth Guardian](modules/AuthGuardian.md) | Authentication monitoring | ![](../screenshots/router/auth.png) |
| [Client Guardian](modules/ClientGuardian.md) | Client access control | ![](../screenshots/router/clients.png) |
| [MAC Guardian](modules/MACGuardian.md) | MAC address management | ![](../screenshots/router/mac.png) |
| [IoT Guard](modules/IoTGuard.md) | IoT device security | ![](../screenshots/router/iot.png) |
| [IP Blocklist](modules/IPBlocklist.md) | IP blocking and management | ![](../screenshots/router/ipblocklist.png) |
| [ZKP Verification](modules/ZKP.md) | Zero-knowledge proof | ![](../screenshots/router/zkp.png) |
| [CVE Triage](modules/CVETriage.md) | AI vulnerability analysis | ![](../screenshots/router/cve.png) |
| [Security Threats](modules/SecurityThreats.md) | Threat overview dashboard | ![](../screenshots/router/threats.png) |
| [Cookie Tracker](modules/CookieTracker.md) | Cookie analysis | ![](../screenshots/router/cookies.png) |
| [Avatar Tap](modules/AvatarTap.md) | Session capture and replay | ![](../screenshots/router/avatar-tap.png) |
| [Interceptor](modules/Interceptor.md) | Traffic interception control | ![](../screenshots/router/interceptor.png) |

### Network (12 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [Network Modes](modules/NetworkModes.md) | Router/AP/Bridge configuration | ![](../screenshots/router/netmodes.png) |
| [Bandwidth Manager](modules/Bandwidth.md) | Traffic monitoring and limits | ![](../screenshots/router/bandwidth.png) |
| [Traffic Shaper](modules/TrafficShaper.md) | QoS and traffic prioritization | ![](../screenshots/router/traffic.png) |
| [HAProxy](modules/HAProxy.md) | Load balancer and reverse proxy | ![](../screenshots/router/haproxy.png) |
| [Virtual Hosts](modules/VHosts.md) | Virtual host management | ![](../screenshots/router/vhost.png) |
| [CDN Cache](modules/CDNCache.md) | Content caching proxy | ![](../screenshots/router/cdn.png) |
| [Network Tweaks](modules/NetworkTweaks.md) | Advanced network settings | ![](../screenshots/router/tweaks.png) |
| [Routes Status](modules/RoutesStatus.md) | Route monitoring | ![](../screenshots/router/routes.png) |
| [SAAS Relay](modules/SAASRelay.md) | SaaS service relay | ![](../screenshots/router/saas.png) |
| [Network Diag](modules/NetDiag.md) | Network diagnostics | ![](../screenshots/router/netdiag.png) |
| [MQTT Bridge](modules/MQTTBridge.md) | MQTT protocol bridge | ![](../screenshots/router/mqtt.png) |
| [KSM Manager](modules/KSMManager.md) | Kernel shared memory | ![](../screenshots/router/ksm.png) |

### Monitoring (10 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [Metrics Dashboard](modules/Metrics.md) | System metrics overview | ![](../screenshots/router/metrics.png) |
| [Netdata](modules/Netdata.md) | Real-time system monitoring | ![](../screenshots/router/netdata.png) |
| [DPI (netifyd)](modules/DPI.md) | Deep packet inspection | ![](../screenshots/router/dpi.png) |
| [DPI Dual](modules/DPIDual.md) | Dual-stream DPI analysis | ![](../screenshots/router/dpi-dual.png) |
| [Device Intel](modules/DeviceIntel.md) | Device fingerprinting | ![](../screenshots/router/device-intel.png) |
| [Media Flow](modules/MediaFlow.md) | Media traffic analysis | ![](../screenshots/router/mediaflow.png) |
| [Watchdog](modules/Watchdog.md) | Service health monitoring | ![](../screenshots/router/watchdog.png) |
| [Glances](modules/Glances.md) | System overview | ![](../screenshots/router/glances.png) |
| [Network Anomaly](modules/NetworkAnomaly.md) | AI anomaly detection | ![](../screenshots/router/anomaly.png) |
| [nDPId](modules/nDPId.md) | nDPI daemon interface | ![](../screenshots/router/ndpid.png) |

### VPN & Mesh (6 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [WireGuard Dashboard](modules/WireGuard.md) | VPN tunnel management | ![](../screenshots/router/wireguard.png) |
| [Mesh Network](modules/Mesh.md) | SecuBox mesh daemon | ![](../screenshots/router/mesh.png) |
| [P2P Network](modules/P2P.md) | P2P gossip protocol | ![](../screenshots/router/p2p.png) |
| [MirrorNet](modules/MirrorNet.md) | Service mirroring | ![](../screenshots/router/mirror.png) |
| [Master Link](modules/MasterLink.md) | Node onboarding | ![](../screenshots/router/master-link.png) |
| [OpenClaw](modules/OpenClaw.md) | Claw VPN integration | ![](../screenshots/router/openclaw.png) |

### DNS (6 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [DNS Master](modules/DNSMaster.md) | DNS server management | ![](../screenshots/router/dns.png) |
| [DNS Guard](modules/DNSGuard.md) | DNS filtering and blocking | ![](../screenshots/router/dnsguard.png) |
| [Vortex DNS](modules/VortexDNS.md) | DNS firewall with threat intel | ![](../screenshots/router/vortex-dns.png) |
| [Meshname DNS](modules/MeshnameDNS.md) | Mesh DNS resolution (.ygg) | ![](../screenshots/router/meshname.png) |
| [DNS Provider](modules/DNSProvider.md) | External DNS API (OVH, Gandi) | ![](../screenshots/router/dns-provider.png) |
| [AdGuard Home](modules/AdGuard.md) | Ad blocking DNS | ![](../screenshots/router/adguard.png) |

### Privacy (4 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [Tor Shield](modules/TorShield.md) | Tor network integration | ![](../screenshots/router/tor.png) |
| [Exposure](modules/Exposure.md) | Service exposure (Tor/DNS/Mesh) | ![](../screenshots/router/exposure.png) |
| [ZKP](modules/ZKP.md) | Zero-knowledge proof verification | ![](../screenshots/router/zkp.png) |
| [Interceptor](modules/Interceptor.md) | Traffic interception control | ![](../screenshots/router/interceptor.png) |

### Publishing (8 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [Metablogizer](modules/Metablogizer.md) | Static site generator | ![](../screenshots/router/metablogizer.png) |
| [Droplet](modules/Droplet.md) | Quick web publishing | ![](../screenshots/router/droplet.png) |
| [Streamlit Forge](modules/StreamlitForge.md) | Streamlit app builder | ![](../screenshots/router/streamforge.png) |
| [Streamlit](modules/Streamlit.md) | Streamlit dashboard | ![](../screenshots/router/streamlit.png) |
| [Metacatalog](modules/Metacatalog.md) | Content catalog | ![](../screenshots/router/metacatalog.png) |
| [HexoJS](modules/HexoJS.md) | Hexo blog manager | ![](../screenshots/router/hexo.png) |
| [Metabolizer](modules/Metabolizer.md) | Content processor | ![](../screenshots/router/metabolizer.png) |
| [Repo](modules/Repo.md) | Package repository | ![](../screenshots/router/repo.png) |

### Apps & Services (20 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [Jellyfin](modules/Jellyfin.md) | Media server | ![](../screenshots/router/jellyfin.png) |
| [Lyrion](modules/Lyrion.md) | Music server | ![](../screenshots/router/lyrion.png) |
| [Gitea](modules/Gitea.md) | Git server | ![](../screenshots/router/gitea.png) |
| [Nextcloud](modules/Nextcloud.md) | Cloud storage | ![](../screenshots/router/nextcloud.png) |
| [PeerTube](modules/PeerTube.md) | Video platform | ![](../screenshots/router/peertube.png) |
| [PhotoPrism](modules/PhotoPrism.md) | Photo gallery | ![](../screenshots/router/photoprism.png) |
| [GoToSocial](modules/GoToSocial.md) | ActivityPub social | ![](../screenshots/router/gotosocial.png) |
| [Jitsi](modules/Jitsi.md) | Video conferencing | ![](../screenshots/router/jitsi.png) |
| [Matrix](modules/Matrix.md) | Matrix chat server | ![](../screenshots/router/matrix.png) |
| [Jabber](modules/Jabber.md) | XMPP server | ![](../screenshots/router/jabber.png) |
| [SimpleX](modules/SimpleX.md) | Private messaging | ![](../screenshots/router/simplex.png) |
| [VoIP](modules/VoIP.md) | Asterisk PBX | ![](../screenshots/router/voip.png) |
| [TURN](modules/TURN.md) | TURN/STUN server | ![](../screenshots/router/turn.png) |
| [Domoticz](modules/Domoticz.md) | Home automation | ![](../screenshots/router/domoticz.png) |
| [Zigbee2MQTT](modules/Zigbee.md) | Zigbee bridge | ![](../screenshots/router/zigbee.png) |
| [MagicMirror2](modules/MagicMirror.md) | Smart mirror | ![](../screenshots/router/magicmirror.png) |
| [Mailserver](modules/Mailserver.md) | Email server | ![](../screenshots/router/mailserver.png) |
| [Torrent](modules/Torrent.md) | BitTorrent client | ![](../screenshots/router/torrent.png) |
| [Webradio](modules/Webradio.md) | Internet radio | ![](../screenshots/router/webradio.png) |
| [PicoBrew](modules/PicoBrew.md) | Brewing controller | ![](../screenshots/router/picobrew.png) |

### System (12 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [SecuBox Settings](modules/SecuBox.md) | Main configuration | ![](../screenshots/router/settings.png) |
| [SecuBox Admin](modules/Admin.md) | Admin dashboard | ![](../screenshots/router/admin.png) |
| [System Hub](modules/SystemHub.md) | System overview | ![](../screenshots/router/hub.png) |
| [SecuBox Portal](modules/Portal.md) | User portal | ![](../screenshots/router/portal.png) |
| [Config Vault](modules/ConfigVault.md) | Git-based config backup | ![](../screenshots/router/config-vault.png) |
| [Config Advisor](modules/ConfigAdvisor.md) | ANSSI compliance | ![](../screenshots/router/config-advisor.png) |
| [SMTP Relay](modules/SMTPRelay.md) | Email relay settings | ![](../screenshots/router/smtp.png) |
| [Reporter](modules/Reporter.md) | Report generator | ![](../screenshots/router/reporter.png) |
| [RTTY Remote](modules/RTTY.md) | Remote terminal access | ![](../screenshots/router/rtty.png) |
| [Backup](modules/Backup.md) | System backup | ![](../screenshots/router/backup.png) |
| [Cloner](modules/Cloner.md) | Device cloning | ![](../screenshots/router/cloner.png) |
| [Users](modules/Users.md) | User management | ![](../screenshots/router/users.png) |

### AI Features (8 modules)

| Module | Description | Screenshot |
|--------|-------------|------------|
| [AI Gateway](modules/AIGateway.md) | AI provider routing | ![](../screenshots/router/ai-gateway.png) |
| [AI Insights](modules/AIInsights.md) | AI-powered insights | ![](../screenshots/router/ai-insights.png) |
| [LocalAI](modules/LocalAI.md) | Local LLM inference | ![](../screenshots/router/localai.png) |
| [Ollama](modules/Ollama.md) | Ollama LLM server | ![](../screenshots/router/ollama.png) |
| [LocalRecall](modules/LocalRecall.md) | AI memory system | ![](../screenshots/router/localrecall.png) |
| [Threat Analyst](modules/ThreatAnalyst.md) | AI threat analysis | ![](../screenshots/router/threat-analyst.png) |
| [CVE Triage](modules/CVETriage.md) | AI vulnerability triage | ![](../screenshots/router/cve.png) |
| [Network Anomaly](modules/NetworkAnomaly.md) | AI anomaly detection | ![](../screenshots/router/anomaly.png) |

---

## Development

| Document | Description |
|----------|-------------|
| [Development Guidelines](Development.md) | Coding standards and practices |
| [Module Implementation](Module-Implementation.md) | How to create new modules |
| [LuCI Reference](LuCI-Reference.md) | LuCI JavaScript development |
| [API Reference](API.md) | RPCD/ubus API documentation |

---

## Theme: CRT P31 Phosphor Green

SecuBox uses a retro CRT terminal aesthetic:

- **Primary**: `#33ff66` (phosphor peak)
- **Background**: `#050803` (tube black)
- **Font**: Monospace (Courier Prime)
- **Effects**: Scanlines, phosphor glow

See [UI Guide](UI-Guide.md) for full theme documentation.

---

*SecuBox v1.0.0 | CyberMind 2026*
