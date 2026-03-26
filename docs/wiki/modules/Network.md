# Network Modules

SecuBox provides comprehensive network management through 12 integrated modules.

---

## Overview

| Layer | Components |
|-------|------------|
| **Routing** | Network Modes, Traffic Shaper |
| **Proxy** | HAProxy, CDN Cache |
| **Monitoring** | Bandwidth Manager, Routes Status |
| **Services** | MQTT Bridge, KSM Manager |
| **Diagnostics** | Network Diag, Network Tweaks |

---

## Network Modes

**Package**: `luci-app-network-modes`

Network mode configuration (Router/AP/Bridge).

![Network Modes](../../screenshots/router/netmodes.png)

### Modes

| Mode | Description |
|------|-------------|
| Router | Full routing with NAT |
| AP | Access Point mode |
| Bridge | Transparent bridge |
| Mesh | Mesh node |
| Client | WISP client |

### Features

- One-click mode switching
- Interface auto-configuration
- VLAN support
- Firewall auto-adjustment

---

## HAProxy

**Package**: `secubox-app-haproxy` + `luci-app-haproxy`

Load balancer and reverse proxy.

![HAProxy](../../screenshots/router/haproxy.png)

### Features

- Virtual hosts (274+)
- SSL termination (ACME)
- Load balancing
- Health checks
- Statistics dashboard

### CLI

```bash
haproxyctl status             # Service status
haproxyctl vhost list         # List vhosts
haproxyctl vhost add <domain> # Add vhost
haproxyctl ssl request <domain> # Request SSL
haproxyctl reload             # Reload config
```

### Architecture

```
Internet → HAProxy (443/80) → mitmproxy WAF → Backend
                ↓
           SSL Termination
           Load Balancing
           ACL Routing
```

---

## Bandwidth Manager

**Package**: `luci-app-bandwidth-manager`

Traffic monitoring and bandwidth limits.

![Bandwidth](../../screenshots/router/bandwidth.png)

### Features

- Real-time monitoring
- Per-client limits
- Scheduled throttling
- Alert notifications
- Historical graphs

### Limit Types

| Type | Description |
|------|-------------|
| Upload | Upload bandwidth limit |
| Download | Download bandwidth limit |
| Combined | Total bandwidth limit |
| Burst | Burst allowance |

---

## Traffic Shaper

**Package**: `luci-app-traffic-shaper`

QoS and traffic prioritization.

![Traffic Shaper](../../screenshots/router/traffic.png)

### Features

- Application-based QoS
- Priority queues
- Bandwidth reservation
- Fair queuing
- Real-time stats

### Priority Classes

| Class | Applications |
|-------|--------------|
| Realtime | VoIP, gaming |
| Priority | Video, streaming |
| Normal | Web browsing |
| Bulk | Downloads, backups |

---

## Virtual Hosts

**Package**: `luci-app-vhost-manager`

Virtual host management.

![VHosts](../../screenshots/router/vhost.png)

### Features

- Domain management
- Backend configuration
- SSL certificate status
- WAF integration
- Redirect rules

---

## CDN Cache

**Package**: `luci-app-cdn-cache`

Content caching proxy.

![CDN Cache](../../screenshots/router/cdn.png)

### Features

- HTTP/HTTPS caching
- Cache policies
- Storage management
- Hit rate statistics
- Purge controls

---

## Routes Status

**Package**: `luci-app-routes-status`

Route monitoring and health checks.

![Routes](../../screenshots/router/routes.png)

### Features

- Route health checks
- Up/Down monitoring
- Response time tracking
- Alert notifications
- Historical data

---

## Network Tweaks

**Package**: `luci-app-network-tweaks`

Advanced network settings.

![Tweaks](../../screenshots/router/tweaks.png)

### Features

- Kernel parameters
- TCP optimization
- Buffer tuning
- Congestion control
- MTU configuration

---

## MQTT Bridge

**Package**: `luci-app-mqtt-bridge`

MQTT protocol bridge for IoT.

![MQTT](../../screenshots/router/mqtt.png)

### Features

- Broker configuration
- Bridge connections
- Topic mapping
- TLS support
- Authentication

---

## Network Diagnostics

**Package**: `luci-app-secubox-netdiag`

Network diagnostic tools.

![NetDiag](../../screenshots/router/netdiag.png)

### Features

- Ping/Traceroute
- DNS lookup
- Port scanning
- Bandwidth test
- Packet capture

---

## SAAS Relay

**Package**: `luci-app-saas-relay`

SaaS service relay.

![SAAS](../../screenshots/router/saas.png)

### Features

- API proxying
- Rate limiting
- Caching
- Authentication

---

## KSM Manager

**Package**: `luci-app-ksm-manager`

Kernel shared memory management.

![KSM](../../screenshots/router/ksm.png)

### Features

- Memory deduplication
- Page sharing stats
- Performance tuning
- Container optimization

---

## Configuration

### Enable Traffic Shaping

```bash
uci set traffic-shaper.main.enabled='1'
uci set traffic-shaper.main.wan='wan'
uci set traffic-shaper.main.download='100000'  # 100 Mbps
uci set traffic-shaper.main.upload='50000'     # 50 Mbps
uci commit traffic-shaper
```

### Configure HAProxy Vhost

```bash
# Add virtual host
haproxyctl vhost add myapp.example.com

# Configure backend
haproxyctl backend set myapp.example.com 192.168.255.10:8080

# Request SSL
haproxyctl ssl request myapp.example.com

# Reload
haproxyctl reload
```

### Bandwidth Limits

```bash
# Set client limit
uci add bandwidth-manager limit
uci set bandwidth-manager.@limit[-1].mac='00:11:22:33:44:55'
uci set bandwidth-manager.@limit[-1].download='10000'  # 10 Mbps
uci set bandwidth-manager.@limit[-1].upload='5000'     # 5 Mbps
uci commit bandwidth-manager
```

---

See also:
- [Security Modules](Security.md)
- [Monitoring Modules](Monitoring.md)
- [Architecture](../Architecture.md)

---

*SecuBox v1.0.0*
