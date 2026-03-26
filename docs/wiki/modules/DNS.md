# DNS Modules

SecuBox provides 6 DNS management and security modules.

---

## Overview

| Layer | Components |
|-------|------------|
| **Server** | DNS Master (BIND) |
| **Security** | DNS Guard, Vortex DNS Firewall |
| **Resolution** | Meshname DNS, AdGuard Home |
| **External** | DNS Provider API |

---

## DNS Master

**Package**: `secubox-app-dns-master` + `luci-app-dns-master`

Primary DNS server (BIND).

![DNS Master](../../screenshots/router/dns.png)

### Features

- Zone management
- Record editing
- DNSSEC support
- Secondary DNS
- Zone transfers

### Record Types

| Type | Description |
|------|-------------|
| A | IPv4 address |
| AAAA | IPv6 address |
| CNAME | Alias |
| MX | Mail exchange |
| TXT | Text record |
| SRV | Service locator |

### CLI

```bash
dnsctl status                 # Status
dnsctl zone list              # List zones
dnsctl zone add example.com   # Add zone
dnsctl record add A www 1.2.3.4 # Add record
dnsctl reload                 # Reload BIND
```

---

## DNS Guard

**Package**: `secubox-dns-guard` + `luci-app-dnsguard`

AI-powered DNS anomaly detection.

![DNS Guard](../../screenshots/router/dnsguard.png)

### Features

- Query analysis
- Anomaly detection
- DGA detection
- Tunneling detection
- Real-time alerts

### Detection Types

| Type | Description |
|------|-------------|
| DGA | Domain generation algorithm |
| Tunneling | DNS data exfiltration |
| Fast-flux | Rapidly changing IPs |
| Typosquatting | Similar domain names |
| Suspicious | High entropy domains |

### CLI

```bash
dnsguardctl status            # Status
dnsguardctl analyze           # Run analysis
dnsguardctl alerts            # View alerts
dnsguardctl whitelist add x   # Add to whitelist
```

---

## Vortex DNS Firewall

**Package**: `secubox-vortex-dns` + `luci-app-vortex-dns`

Threat intelligence DNS firewall.

![Vortex DNS](../../screenshots/router/vortex-dns.png)

### Features

- Blocklist aggregation
- Real-time blocking
- Sinkhole server
- Mesh threat sharing
- Category filtering

### Blocklist Sources

| Source | Categories |
|--------|------------|
| CrowdSec | Threat intel |
| Pi-hole | Ads, tracking |
| Steven Black | Malware, phishing |
| Custom | User-defined |

### CLI

```bash
vortexctl status              # Status
vortexctl update              # Update blocklists
vortexctl block add domain    # Block domain
vortexctl stats               # View statistics
```

---

## Meshname DNS

**Package**: `secubox-app-meshname-dns` + `luci-app-meshname-dns`

Mesh DNS resolution (.ygg).

![Meshname](../../screenshots/router/meshname.png)

### Features

- Yggdrasil DNS resolution
- Mesh peer discovery
- Gossip-based sync
- Local caching
- Fallback resolution

### Resolution Flow

```
Query: mynode.ygg
  ↓
Local cache?
  ↓ No
Gossip lookup?
  ↓ No
Yggdrasil network?
  ↓
Response
```

### CLI

```bash
meshnameectl status           # Status
meshnameectl lookup mynode    # Lookup name
meshnameectl register myname  # Register name
meshnameectl peers            # View peers
```

---

## DNS Provider

**Package**: `secubox-app-dns-provider` + `luci-app-dns-provider`

External DNS provider API integration.

![DNS Provider](../../screenshots/router/dns-provider.png)

### Supported Providers

| Provider | Features |
|----------|----------|
| OVH | Zone management, API v1 |
| Gandi | LiveDNS API |
| Cloudflare | Zone API |
| Custom | RFC 2136 dynamic DNS |

### Features

- Automatic record updates
- ACME DNS-01 challenges
- Wildcard certificates
- Subdomain management

### CLI

```bash
dnsctl provider status        # Status
dnsctl provider list          # List providers
dnsctl provider add ovh       # Configure OVH
dnsctl add A subdomain 1.2.3.4 # Add record
```

---

## AdGuard Home

**Package**: `secubox-app-adguardhome`

Ad blocking DNS server.

![AdGuard](../../screenshots/router/adguard.png)

### Features

- Ad blocking
- Tracking protection
- Parental controls
- Per-client settings
- Query log

### Filter Lists

| List | Description |
|------|-------------|
| AdGuard | Default filter |
| EasyList | Ad blocking |
| Malware | Security |
| Social | Social tracking |

---

## Configuration

### Configure DNS Master

```bash
# Add zone
dnsctl zone add example.com

# Add records
dnsctl record add example.com A www 192.168.1.10
dnsctl record add example.com MX mail 10
dnsctl record add example.com TXT @ "v=spf1 mx -all"

# Enable DNSSEC
dnsctl dnssec enable example.com
```

### Configure Vortex DNS

```bash
# Enable firewall
uci set vortex-dns.main.enabled='1'
uci set vortex-dns.main.sinkhole='192.168.255.1'
uci commit vortex-dns

# Add blocklists
vortexctl source add https://example.com/blocklist.txt
vortexctl update
```

### Configure DNS Provider (OVH)

```bash
# Setup OVH API
dnsctl provider add ovh \
  --app-key="xxx" \
  --app-secret="xxx" \
  --consumer-key="xxx"

# Add record
dnsctl add A subdomain.example.com 1.2.3.4
```

---

## DNS Resolution Flow

```
Client Query
    ↓
┌─────────────┐
│  dnsmasq    │ ←── Local cache
└──────┬──────┘
       ↓
┌─────────────┐
│ DNS Guard   │ ←── Anomaly detection
└──────┬──────┘
       ↓
┌─────────────┐
│ Vortex DNS  │ ←── Blocklist check
└──────┬──────┘
       ↓
┌─────────────┐
│ DNS Master  │ ←── Local zones
└──────┬──────┘
       ↓
   Upstream DNS
```

---

See also:
- [Security Modules](Security.md)
- [Network Modules](Network.md)
- [Architecture](../Architecture.md)

---

*SecuBox v1.0.0*
