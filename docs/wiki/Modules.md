# SecuBox Module Catalog

Complete catalog of SecuBox packages for OpenWrt 24.10.

**Total Modules: 80+ LuCI apps | 40+ Backend packages**

---

## Core Packages

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `secubox-core` | 1.0.0 | Core utilities, scripts, shared libraries | - |
| `secubox-mesh` | 1.0.0 | Mesh daemon with topology and gate election | ![](../screenshots/router/mesh.png) |
| `secubox-identity` | 0.1.0 | DID:plc generation, key rotation, trust | - |
| `secubox-mirrornet` | 0.1.0 | Mesh orchestration, gossip protocol | ![](../screenshots/router/mirror.png) |
| `secubox-p2p` | 0.6.0 | P2P decentralized network with blockchain | ![](../screenshots/router/p2p.png) |
| `secubox-p2p-intel` | 0.1.0 | IoC signed gossip, threat intel sharing | - |

---

## Security Packages (15)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-crowdsec-dashboard` | 0.8.0 | CrowdSec IDS/IPS dashboard | ![](../screenshots/router/crowdsec.png) |
| `luci-app-mitmproxy` | 0.5.0 | WAF/TLS inspection proxy | ![](../screenshots/router/waf.png) |
| `luci-app-secubox-security-threats` | 1.0.0 | Security threat overview | ![](../screenshots/router/threats.png) |
| `secubox-threat-analyst` | 1.0.0 | AI-powered threat correlation | ![](../screenshots/router/threat-analyst.png) |
| `secubox-dns-guard` | 1.0.0 | DNS anomaly detection | ![](../screenshots/router/dnsguard.png) |
| `secubox-vortex-firewall` | 1.0.0 | Threat intel firewall | ![](../screenshots/router/vortex.png) |
| `luci-app-auth-guardian` | 0.4.0 | Authentication monitoring | ![](../screenshots/router/auth.png) |
| `luci-app-client-guardian` | 0.4.0 | Client access control | ![](../screenshots/router/clients.png) |
| `luci-app-mac-guardian` | 0.5.0 | MAC address management | ![](../screenshots/router/mac.png) |
| `luci-app-iot-guard` | 1.0.0 | IoT device security | ![](../screenshots/router/iot.png) |
| `luci-app-ipblocklist` | 1.0.0 | IP blocking management | ![](../screenshots/router/ipblocklist.png) |
| `luci-app-zkp` | 1.0.0 | Zero-knowledge proof verification | ![](../screenshots/router/zkp.png) |
| `luci-app-cookie-tracker` | 1.0.0 | Cookie analysis and tracking | ![](../screenshots/router/cookies.png) |
| `luci-app-avatar-tap` | 1.0.0 | Session capture and replay | ![](../screenshots/router/avatar-tap.png) |
| `luci-app-interceptor` | 1.0.0 | Traffic interception control | ![](../screenshots/router/interceptor.png) |

---

## Network Packages (12)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-network-modes` | 0.5.0 | Network mode configuration | ![](../screenshots/router/netmodes.png) |
| `luci-app-bandwidth-manager` | 0.5.0 | Bandwidth monitoring and limits | ![](../screenshots/router/bandwidth.png) |
| `luci-app-traffic-shaper` | 0.4.0 | QoS traffic shaping | ![](../screenshots/router/traffic.png) |
| `luci-app-haproxy` | 1.0.0 | HAProxy load balancer | ![](../screenshots/router/haproxy.png) |
| `luci-app-vhost-manager` | 0.5.0 | Virtual host management | ![](../screenshots/router/vhost.png) |
| `luci-app-cdn-cache` | 0.5.0 | CDN caching proxy | ![](../screenshots/router/cdn.png) |
| `luci-app-network-tweaks` | 1.0.0 | Advanced network settings | ![](../screenshots/router/tweaks.png) |
| `luci-app-routes-status` | 1.0.0 | Route status monitoring | ![](../screenshots/router/routes.png) |
| `luci-app-saas-relay` | 1.0.0 | SaaS service relay | ![](../screenshots/router/saas.png) |
| `luci-app-secubox-netdiag` | 1.0.0 | Network diagnostics | ![](../screenshots/router/netdiag.png) |
| `luci-app-mqtt-bridge` | 0.4.0 | MQTT protocol bridge | ![](../screenshots/router/mqtt.png) |
| `luci-app-ksm-manager` | 0.4.0 | Kernel shared memory | ![](../screenshots/router/ksm.png) |

---

## Monitoring Packages (10)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-metrics-dashboard` | 1.0.0 | System metrics dashboard | ![](../screenshots/router/metrics.png) |
| `luci-app-netdata-dashboard` | 0.5.0 | Netdata system monitoring | ![](../screenshots/router/netdata.png) |
| `luci-app-secubox-netifyd` | 1.2.1 | Deep packet inspection | ![](../screenshots/router/dpi.png) |
| `luci-app-dpi-dual` | 1.0.0 | Dual-stream DPI analysis | ![](../screenshots/router/dpi-dual.png) |
| `luci-app-device-intel` | 1.0.0 | Device fingerprinting | ![](../screenshots/router/device-intel.png) |
| `luci-app-media-flow` | 0.6.4 | Media traffic analysis | ![](../screenshots/router/mediaflow.png) |
| `luci-app-watchdog` | 1.0.0 | Service health monitoring | ![](../screenshots/router/watchdog.png) |
| `luci-app-glances` | 1.0.0 | System overview (Glances) | ![](../screenshots/router/glances.png) |
| `secubox-network-anomaly` | 1.0.0 | AI network anomaly detection | ![](../screenshots/router/anomaly.png) |
| `luci-app-ndpid` | 1.1.2 | nDPI daemon interface | ![](../screenshots/router/ndpid.png) |

---

## VPN & Mesh Packages (7)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-wireguard-dashboard` | 0.7.0 | WireGuard VPN management | ![](../screenshots/router/wireguard.png) |
| `luci-app-secubox-mesh` | 1.0.0 | Mesh network dashboard | ![](../screenshots/router/mesh.png) |
| `luci-app-secubox-p2p` | 0.1.0 | P2P network interface | ![](../screenshots/router/p2p.png) |
| `luci-app-secubox-mirror` | 0.1.0 | MirrorNet dashboard | ![](../screenshots/router/mirror.png) |
| `luci-app-master-link` | 1.0.0 | Node onboarding and linking | ![](../screenshots/router/master-link.png) |
| `luci-app-openclaw` | 1.0.0 | OpenClaw VPN integration | ![](../screenshots/router/openclaw.png) |
| `luci-app-turn` | 1.0.0 | TURN/STUN server | ![](../screenshots/router/turn.png) |

---

## DNS Packages (6)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-dns-master` | 1.0.0 | DNS server management | ![](../screenshots/router/dns.png) |
| `luci-app-dnsguard` | 1.1.0 | DNS filtering and blocking | ![](../screenshots/router/dnsguard.png) |
| `luci-app-vortex-dns` | 1.0.0 | Vortex DNS firewall | ![](../screenshots/router/vortex-dns.png) |
| `luci-app-meshname-dns` | 1.0.0 | Mesh DNS resolution | ![](../screenshots/router/meshname.png) |
| `luci-app-dns-provider` | 1.0.0 | External DNS provider API | ![](../screenshots/router/dns-provider.png) |
| `secubox-app-adguardhome` | 1.0.0 | AdGuard Home ad blocking | ![](../screenshots/router/adguard.png) |

---

## Privacy Packages (4)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-tor-shield` | 1.0.0 | Tor network integration | ![](../screenshots/router/tor.png) |
| `luci-app-tor` | 1.0.0 | Tor hidden services | ![](../screenshots/router/tor-services.png) |
| `luci-app-exposure` | 1.0.0 | Service exposure management | ![](../screenshots/router/exposure.png) |
| `luci-app-interceptor` | 1.0.0 | Traffic interception control | ![](../screenshots/router/interceptor.png) |

---

## Publishing Packages (8)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-metablogizer` | 1.1.0 | Static site generator | ![](../screenshots/router/metablogizer.png) |
| `luci-app-droplet` | 1.0.0 | Quick web publishing | ![](../screenshots/router/droplet.png) |
| `luci-app-streamlit-forge` | 1.0.0 | Streamlit app builder | ![](../screenshots/router/streamforge.png) |
| `luci-app-streamlit` | 1.0.0 | Streamlit dashboard | ![](../screenshots/router/streamlit.png) |
| `luci-app-metacatalog` | 1.0.0 | Content catalog | ![](../screenshots/router/metacatalog.png) |
| `luci-app-hexojs` | 1.0.0 | Hexo blog manager | ![](../screenshots/router/hexo.png) |
| `luci-app-metabolizer` | 1.0.0 | Content processor | ![](../screenshots/router/metabolizer.png) |
| `luci-app-repo` | 1.0.0 | Package repository | ![](../screenshots/router/repo.png) |

---

## App Packages (20)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-jellyfin` | 1.0.0 | Jellyfin media server | ![](../screenshots/router/jellyfin.png) |
| `luci-app-lyrion` | 1.0.0 | Lyrion music server | ![](../screenshots/router/lyrion.png) |
| `luci-app-gitea` | 1.0.0 | Gitea git server | ![](../screenshots/router/gitea.png) |
| `luci-app-nextcloud` | 1.0.0 | Nextcloud cloud storage | ![](../screenshots/router/nextcloud.png) |
| `luci-app-peertube` | 1.1.0 | PeerTube video platform | ![](../screenshots/router/peertube.png) |
| `luci-app-photoprism` | 0.1.0 | PhotoPrism photo gallery | ![](../screenshots/router/photoprism.png) |
| `luci-app-gotosocial` | 0.1.0 | GoToSocial ActivityPub | ![](../screenshots/router/gotosocial.png) |
| `luci-app-jitsi` | 1.0.0 | Jitsi video conferencing | ![](../screenshots/router/jitsi.png) |
| `luci-app-matrix` | 1.0.0 | Matrix chat server | ![](../screenshots/router/matrix.png) |
| `luci-app-jabber` | 1.0.0 | Jabber XMPP server | ![](../screenshots/router/jabber.png) |
| `luci-app-simplex` | 1.0.0 | SimpleX private messaging | ![](../screenshots/router/simplex.png) |
| `luci-app-voip` | 1.0.0 | Asterisk VoIP PBX | ![](../screenshots/router/voip.png) |
| `luci-app-domoticz` | 1.0.0 | Home automation | ![](../screenshots/router/domoticz.png) |
| `luci-app-zigbee2mqtt` | 1.0.0 | Zigbee to MQTT bridge | ![](../screenshots/router/zigbee.png) |
| `luci-app-magicmirror2` | 0.4.0 | Smart mirror | ![](../screenshots/router/magicmirror.png) |
| `luci-app-mailserver` | 1.0.0 | Email server | ![](../screenshots/router/mailserver.png) |
| `luci-app-torrent` | 1.0.0 | BitTorrent client | ![](../screenshots/router/torrent.png) |
| `luci-app-webradio` | 1.0.0 | Internet radio | ![](../screenshots/router/webradio.png) |
| `luci-app-picobrew` | 1.0.0 | Brewing controller | ![](../screenshots/router/picobrew.png) |
| `luci-app-newsbin` | 1.0.0 | Usenet client | ![](../screenshots/router/newsbin.png) |

---

## System Packages (14)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-secubox` | 0.7.1 | Main SecuBox settings | ![](../screenshots/router/settings.png) |
| `luci-app-secubox-admin` | 1.0.0 | Admin control center | ![](../screenshots/router/admin.png) |
| `luci-app-system-hub` | 0.5.2 | System overview hub | ![](../screenshots/router/hub.png) |
| `luci-app-secubox-portal` | 0.7.0 | User portal | ![](../screenshots/router/portal.png) |
| `luci-app-config-vault` | 1.0.0 | Git-based config backup | ![](../screenshots/router/config-vault.png) |
| `luci-app-config-advisor` | 1.0.0 | ANSSI compliance advisor | ![](../screenshots/router/config-advisor.png) |
| `luci-app-smtp-relay` | 1.0.0 | SMTP relay settings | ![](../screenshots/router/smtp.png) |
| `luci-app-reporter` | 1.0.0 | Report generator | ![](../screenshots/router/reporter.png) |
| `luci-app-rtty-remote` | 0.1.0 | Remote terminal access | ![](../screenshots/router/rtty.png) |
| `luci-app-backup` | 1.0.0 | System backup | ![](../screenshots/router/backup.png) |
| `luci-app-cloner` | 1.0.0 | Device cloning | ![](../screenshots/router/cloner.png) |
| `luci-app-secubox-users` | 1.0.0 | User management | ![](../screenshots/router/users.png) |
| `luci-app-cyberfeed` | 0.1.1 | Threat feed manager | ![](../screenshots/router/cyberfeed.png) |
| `luci-app-rezapp` | 1.0.0 | Docker to LXC converter | ![](../screenshots/router/rezapp.png) |

---

## AI Packages (8)

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-app-ai-gateway` | 1.0.0 | AI provider routing | ![](../screenshots/router/ai-gateway.png) |
| `luci-app-ai-insights` | 1.0.0 | AI-powered insights | ![](../screenshots/router/ai-insights.png) |
| `luci-app-localai` | 0.1.0 | LocalAI integration | ![](../screenshots/router/localai.png) |
| `luci-app-ollama` | 0.1.0 | Ollama LLM server | ![](../screenshots/router/ollama.png) |
| `luci-app-localrecall` | 1.0.0 | AI memory system | ![](../screenshots/router/localrecall.png) |
| `luci-app-threat-analyst` | 1.0.0 | AI threat analysis | ![](../screenshots/router/threat-analyst.png) |
| `luci-app-cve-triage` | 1.0.0 | AI CVE triage | ![](../screenshots/router/cve.png) |
| `luci-app-network-anomaly` | 1.0.0 | AI anomaly detection | ![](../screenshots/router/anomaly.png) |

---

## Theme Package

| Package | Version | Description | Screenshot |
|---------|---------|-------------|------------|
| `luci-theme-secubox` | 1.0.0 | CRT P31 phosphor green theme | ![](../screenshots/router/theme.png) |

---

## Installation

### Via opkg

```bash
opkg update
opkg install luci-app-secubox-mesh
```

### Via SecuBox App Store

Navigate to **SecuBox > Apps** in LuCI and install from catalog.

### Via local feed

```bash
echo "src/gz secubox file:///www/secubox-feed" >> /etc/opkg/customfeeds.conf
opkg update
opkg install <package-name>
```

---

*Total packages: 80+ LuCI | Last updated: 2026-03-26*
