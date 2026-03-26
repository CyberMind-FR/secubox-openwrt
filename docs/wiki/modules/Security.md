# Security Modules

SecuBox provides comprehensive security through 15 integrated modules.

---

## Overview

| Layer | Components |
|-------|------------|
| **Perimeter** | CrowdSec IDS/IPS, WAF (mitmproxy) |
| **Network** | DNS Guard, Vortex Firewall, IP Blocklist |
| **Access** | Auth Guardian, Client Guardian, MAC Guardian |
| **Verification** | ZKP, IoT Guard |
| **Analysis** | Threat Analyst, Avatar Tap, Cookie Tracker |

---

## CrowdSec Dashboard

**Package**: `luci-app-crowdsec-dashboard`

Intrusion Detection and Prevention System with collaborative threat intelligence.

![CrowdSec Dashboard](../../screenshots/router/crowdsec.png)

### Features

- Real-time alert monitoring
- Active decisions (bans, captchas)
- Scenario management
- Bouncer configuration
- CAPI integration (crowd-sourced blocklists)

### CLI

```bash
cscli decisions list          # View active bans
cscli alerts list             # View recent alerts
cscli scenarios list          # List installed scenarios
cscli bouncers list           # List bouncers
```

### RPCD Methods

| Method | Description |
|--------|-------------|
| `status` | Get CrowdSec service status |
| `get_overview` | Dashboard overview data |
| `get_decisions` | Active decisions list |
| `get_alerts` | Recent alerts |
| `add_decision` | Add manual ban |

---

## WAF Filters (mitmproxy)

**Package**: `luci-app-mitmproxy`

Web Application Firewall with TLS inspection.

![WAF](../../screenshots/router/waf.png)

### Features

- HTTP/HTTPS inspection
- Rule-based filtering
- Request/response modification
- SSL certificate generation
- HAProxy integration

### Architecture

```
Client → HAProxy → mitmproxy WAF → Backend Service
                      ↓
                  CrowdSec
```

### CLI

```bash
mitmproxyctl status           # Service status
mitmproxyctl sync-routes      # Sync HAProxy routes
mitmproxyctl reload           # Reload configuration
```

---

## DNS Guard

**Package**: `secubox-dns-guard` + `luci-app-dnsguard`

AI-powered DNS anomaly detection.

![DNS Guard](../../screenshots/router/dnsguard.png)

### Features

- DNS query analysis
- Anomaly detection (DGA, tunneling)
- Blocklist integration
- Real-time monitoring
- AI-powered threat scoring

### Detection Types

| Type | Description |
|------|-------------|
| DGA | Domain generation algorithm detection |
| Tunneling | DNS tunneling detection |
| Fast-flux | Fast-flux domain detection |
| Suspicious | Unusual query patterns |

---

## Auth Guardian

**Package**: `luci-app-auth-guardian`

Authentication monitoring and brute-force protection.

![Auth Guardian](../../screenshots/router/auth.png)

### Features

- Login attempt monitoring
- Brute-force detection
- Automatic blocking
- Session tracking
- Alert notifications

### Monitored Services

- LuCI web interface
- SSH
- VPN connections
- Custom services

---

## Client Guardian

**Package**: `luci-app-client-guardian`

Network client access control.

![Client Guardian](../../screenshots/router/clients.png)

### Features

- Client inventory
- Access policies
- Bandwidth limits
- Schedule-based access
- VLAN assignment

### Access Modes

| Mode | Description |
|------|-------------|
| Allow | Full network access |
| Guest | Limited internet only |
| Block | No network access |
| Schedule | Time-based access |

---

## MAC Guardian

**Package**: `luci-app-mac-guardian`

MAC address management and security.

![MAC Guardian](../../screenshots/router/mac.png)

### Features

- MAC address inventory
- Whitelist/blacklist
- Manufacturer lookup (OUI)
- Spoofing detection
- Alert notifications

---

## ZKP Verification

**Package**: `luci-app-zkp`

Zero-knowledge proof mesh verification.

![ZKP](../../screenshots/router/zkp.png)

### Features

- Peer identity verification
- Trust chain validation
- Cross-node verification
- Cryptographic proofs

### Use Cases

- Mesh peer authentication
- Service authorization
- Distributed trust

---

## IoT Guard

**Package**: `luci-app-iot-guard`

IoT device security isolation.

![IoT Guard](../../screenshots/router/iot.png)

### Features

- IoT device detection
- Network segmentation
- Traffic monitoring
- Firmware analysis
- Vulnerability scanning

### Security Profiles

| Profile | Description |
|---------|-------------|
| Isolated | No inter-device communication |
| Grouped | Communication within group only |
| Full | Standard network access |

---

## Threat Analyst

**Package**: `secubox-threat-analyst` + `luci-app-threat-analyst`

AI-powered threat correlation and analysis.

![Threat Analyst](../../screenshots/router/threat-analyst.png)

### Features

- Multi-source correlation (CrowdSec, WAF, DPI)
- AI-powered threat scoring
- Attack pattern detection
- Incident timeline
- Automated response

### Data Sources

- CrowdSec alerts
- WAF blocks
- DPI flows
- DNS queries
- Auth logs

---

## Avatar Tap

**Package**: `secubox-avatar-tap` + `luci-app-avatar-tap`

Session capture and replay for security analysis.

![Avatar Tap](../../screenshots/router/avatar-tap.png)

### Features

- Passive session capture
- Cookie/header recording
- Session replay
- Forensic analysis
- Export/import

### Use Cases

- Security testing
- Session analysis
- Incident investigation

---

## Configuration

### Enable All Security Modules

```bash
# Via UCI
uci set crowdsec.crowdsec.enabled='1'
uci set mitmproxy.main.enabled='1'
uci set secubox.security.auth_guardian='1'
uci set secubox.security.client_guardian='1'
uci commit

# Restart services
/etc/init.d/crowdsec restart
/etc/init.d/mitmproxy restart
```

### CrowdSec Scenarios

```bash
# Install common scenarios
cscli scenarios install crowdsecurity/ssh-bf
cscli scenarios install crowdsecurity/http-bf
cscli scenarios install crowdsecurity/http-crawl
```

---

See also:
- [Network Modules](Network.md)
- [AI Modules](AI.md)
- [Architecture](../Architecture.md)

---

*SecuBox v1.0.0*
