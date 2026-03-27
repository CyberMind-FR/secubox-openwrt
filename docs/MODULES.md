# SecuBox Module Catalog

Complete list of SecuBox packages for OpenWrt 24.10.

---

## Core Packages

| Package | Version | Description |
|---------|---------|-------------|
| `secubox-core` | 1.0.0 | Core utilities, scripts, and shared libraries |
| `secubox-mesh` | 1.0.0 | Mesh daemon with topology management and gate election |
| `secubox-identity` | 0.1.0 | DID:plc generation, key rotation, trust scoring |
| `secubox-mirrornet` | 0.1.0 | Mesh orchestration and gossip protocol |
| `secubox-p2p` | 0.6.0 | P2P decentralized network with blockchain sync |
| `secubox-p2p-intel` | 0.1.0 | IoC signed gossip, threat intelligence sharing |

## Security Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-crowdsec-dashboard` | 0.8.0 | CrowdSec IDS/IPS dashboard |
| `luci-app-mitmproxy` | 0.5.0 | WAF/TLS inspection proxy |
| `luci-app-secubox-security-threats` | 1.0.0 | Security threat analysis |
| `secubox-threat-analyst` | 1.0.0 | AI-powered threat correlation |
| `secubox-dns-guard` | 1.0.0 | DNS anomaly detection |
| `secubox-vortex-firewall` | 1.0.0 | Threat intel firewall |
| `luci-app-auth-guardian` | 0.4.0 | Authentication monitoring |
| `luci-app-client-guardian` | 0.4.0 | Client access control |
| `luci-app-mac-guardian` | 0.5.0 | MAC address management |
| `luci-app-zkp` | 1.0.0 | Zero-knowledge proof verification |

## Network Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-network-modes` | 0.5.0 | Network mode configuration |
| `luci-app-bandwidth-manager` | 0.5.0 | Bandwidth monitoring and limits |
| `luci-app-traffic-shaper` | 0.4.0 | QoS traffic shaping |
| `luci-app-haproxy` | 1.0.0 | HAProxy load balancer |
| `luci-app-vhost-manager` | 0.5.0 | Virtual host management |
| `luci-app-cdn-cache` | 0.5.0 | CDN caching proxy |
| `luci-app-network-tweaks` | 1.0.0 | Advanced network settings |
| `luci-app-routes-status` | 1.0.0 | Route status monitoring |

## Monitoring Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-netdata-dashboard` | 0.5.0 | Netdata system monitoring |
| `luci-app-secubox-netifyd` | 1.2.1 | Deep packet inspection |
| `luci-app-dpi-dual` | 1.0.0 | Dual-stream DPI analysis |
| `luci-app-device-intel` | 1.0.0 | Device fingerprinting |
| `luci-app-media-flow` | 0.6.4 | Media traffic analysis |
| `luci-app-watchdog` | 1.0.0 | Service health monitoring |
| `luci-app-metrics-dashboard` | 1.0.0 | System metrics dashboard |

## VPN & Mesh Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-wireguard-dashboard` | 0.7.0 | WireGuard VPN management |
| `luci-app-secubox-mesh` | 1.0.0 | Mesh network dashboard |
| `luci-app-secubox-p2p` | 0.1.0 | P2P network interface |
| `luci-app-secubox-mirror` | 0.1.0 | MirrorNet dashboard |
| `luci-app-master-link` | 1.0.0 | Node onboarding and linking |

## DNS Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-dns-master` | 1.0.0 | DNS server management |
| `luci-app-dnsguard` | 1.1.0 | DNS filtering and blocking |
| `luci-app-vortex-dns` | 1.0.0 | Vortex DNS firewall |
| `luci-app-meshname-dns` | 1.0.0 | Mesh DNS resolution |
| `luci-app-dns-provider` | 1.0.0 | External DNS provider API |

## Privacy Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-tor-shield` | 1.0.0 | Tor network integration |
| `luci-app-exposure` | 1.0.0 | Service exposure management |
| `luci-app-interceptor` | 1.0.0 | Traffic interception control |

## Publishing Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-metablogizer` | 1.1.0 | Static site generator |
| `luci-app-droplet` | 1.0.0 | Quick web publishing |
| `luci-app-streamlit-forge` | 1.0.0 | Streamlit app builder |
| `luci-app-metacatalog` | 1.0.0 | Content catalog |
| `luci-app-streamlit` | 1.0.0 | Streamlit dashboard |
| `luci-app-hexojs` | 1.0.0 | Hexo blog manager |

## App Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-jellyfin` | 1.0.0 | Jellyfin media server |
| `luci-app-lyrion` | 1.0.0 | Lyrion music server |
| `luci-app-gitea` | 1.0.0 | Gitea git server |
| `luci-app-nextcloud` | 1.0.0 | Nextcloud storage |
| `luci-app-peertube` | 1.1.0 | PeerTube video |
| `luci-app-photoprism` | 0.1.0 | PhotoPrism gallery |
| `luci-app-gotosocial` | 0.1.0 | GoToSocial federation |
| `luci-app-jitsi` | 1.0.0 | Jitsi video conferencing |

## System Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-secubox` | 0.7.1 | Main SecuBox settings |
| `luci-app-secubox-admin` | 1.0.0 | Admin dashboard |
| `luci-app-config-vault` | 1.0.0 | Configuration backup |
| `luci-app-smtp-relay` | 1.0.0 | SMTP relay settings |
| `luci-app-reporter` | 1.0.0 | Report generator |
| `luci-app-rtty-remote` | 0.1.0 | Remote terminal access |
| `luci-app-backup` | 1.0.0 | System backup |
| `luci-app-cloner` | 1.0.0 | Device cloning |
| `luci-app-system-hub` | 0.5.2 | System overview |

## AI Packages

| Package | Version | Description |
|---------|---------|-------------|
| `luci-app-ai-gateway` | 1.0.0 | AI provider routing |
| `luci-app-ai-insights` | 1.0.0 | AI-powered insights |
| `luci-app-localai` | 0.1.0 | LocalAI integration |
| `luci-app-ollama` | 0.1.0 | Ollama LLM server |
| `secubox-ai-gateway` | 1.0.0 | AI data sovereignty |
| `secubox-cve-triage` | 1.0.0 | AI CVE analysis |
| `secubox-network-anomaly` | 1.0.0 | AI network detection |

## Theme Package

| Package | Version | Description |
|---------|---------|-------------|
| `luci-theme-secubox` | 1.0.0 | CRT P31 phosphor green theme |

---

## Installation

### Via opkg

```bash
opkg update
opkg install luci-app-secubox-mesh
```

### Via SecuBox App Store

Navigate to **SecuBox → Apps** in LuCI and install from the catalog.

### Via local feed

```bash
# Add local feed
echo "src/gz secubox file:///www/secubox-feed" >> /etc/opkg/customfeeds.conf
opkg update
opkg install <package-name>
```

---

*Total packages: 75+ | Last updated: 2026-03-26*
