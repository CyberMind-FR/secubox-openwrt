# SecuBox DDoS Protection Guide

SecuBox provides **multi-layered DDoS protection** suitable for home, SOHO, and SMB deployments. This document describes the protection mechanisms and configuration options.

## Protection Layers Overview

| Layer | Component | Attack Types Mitigated |
|-------|-----------|------------------------|
| **L3** | OpenWrt Firewall | SYN flood, ICMP flood, IP spoofing |
| **L4** | nftables/iptables | Connection floods, port scans |
| **L4** | CrowdSec | Distributed attack detection |
| **L7** | HAProxy | HTTP flood, slowloris, request bombing |
| **L7** | mitmproxy WAF | Application-layer floods, bot attacks |
| **DNS** | Vortex Firewall | Botnet C2, DNS amplification |
| **Intel** | CrowdSec CAPI | Shared threat intelligence (50k+ nodes) |

## Layer 3/4 Protection

### SYN Flood Protection

OpenWrt firewall includes SYN cookies and SYN flood protection:

```bash
# Check current status
cat /proc/sys/net/ipv4/tcp_syncookies

# Enable via UCI
uci set firewall.@defaults[0].synflood_protect='1'
uci commit firewall
/etc/init.d/firewall restart
```

### Connection Tracking Limits

Increase conntrack table size for high-traffic scenarios:

```bash
# Check current limits
cat /proc/sys/net/netfilter/nf_conntrack_max
cat /proc/sys/net/netfilter/nf_conntrack_count

# Increase limit (add to /etc/sysctl.conf)
echo "net.netfilter.nf_conntrack_max=131072" >> /etc/sysctl.conf
sysctl -p
```

### Anti-Spoofing (Reverse Path Filter)

```bash
# Enable RP filter
echo 1 > /proc/sys/net/ipv4/conf/all/rp_filter

# Persist in /etc/sysctl.conf
echo "net.ipv4.conf.all.rp_filter=1" >> /etc/sysctl.conf
```

### ICMP Rate Limiting

```bash
# Limit ICMP responses (prevent ping flood amplification)
echo 1000 > /proc/sys/net/ipv4/icmp_ratelimit
echo 50 > /proc/sys/net/ipv4/icmp_msgs_per_sec
```

### Drop Invalid Packets

```bash
uci set firewall.@defaults[0].drop_invalid='1'
uci commit firewall
/etc/init.d/firewall restart
```

## CrowdSec Protection

CrowdSec provides behavior-based detection and collaborative threat intelligence.

### Install DDoS Collections

```bash
# HTTP flood detection
cscli collections install crowdsecurity/http-dos

# Base HTTP attack detection
cscli collections install crowdsecurity/base-http-scenarios

# Nginx/HAProxy specific
cscli collections install crowdsecurity/nginx
cscli collections install crowdsecurity/haproxy

# Restart to apply
/etc/init.d/crowdsec restart
```

### CrowdSec Scenarios for DDoS

| Scenario | Description | Ban Duration |
|----------|-------------|--------------|
| `crowdsecurity/http-dos-swithcing-ua` | Rapid user-agent switching | 4h |
| `crowdsecurity/http-generic-bf` | Generic HTTP bruteforce | 4h |
| `crowdsecurity/http-slow-bf` | Slowloris-style attacks | 4h |
| `crowdsecurity/http-crawl-non_statics` | Aggressive crawling | 4h |

### View Active Protections

```bash
# List installed scenarios
cscli scenarios list

# View active decisions (bans)
cscli decisions list

# View real-time metrics
cscli metrics
```

## HAProxy Rate Limiting

HAProxy provides connection and request rate limiting for published services.

### Global Connection Limits

Add to `/etc/haproxy/haproxy.cfg`:

```haproxy
global
    maxconn 4096

defaults
    maxconn 2000
    timeout connect 5s
    timeout client 30s
    timeout server 30s
```

### Per-Backend Rate Limiting

```haproxy
frontend https_in
    bind *:443 ssl crt /etc/haproxy/certs/

    # Rate limit: 100 requests/10s per IP
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }

    # Slow down aggressive clients
    http-request tarpit if { sc_http_req_rate(0) gt 50 }
```

### Connection Queue (Absorb Spikes)

```haproxy
backend myapp
    server app1 192.168.255.1:8080 maxconn 100 maxqueue 500
```

## mitmproxy L7 WAF

mitmproxy inspects HTTP/HTTPS traffic and detects application-layer attacks.

### Flood Detection

The `secubox_analytics.py` addon detects:
- Request rate spikes per IP
- Abnormal request patterns
- Bot signatures
- Automated scanning tools

### Enable WAF

```bash
# Start mitmproxy container
/etc/init.d/mitmproxy start

# Check status
mitmproxyctl status
```

### View Detected Threats

```bash
# Recent threats
tail -f /srv/mitmproxy/threats.log

# Threat statistics
mitmproxyctl stats
```

## Vortex DNS Firewall

Vortex blocks known botnet C2 domains and malware distribution sites at the DNS level.

### Enable Protection

```bash
# Update threat intelligence feeds
vortex-firewall intel update

# Start protection
vortex-firewall start

# Check stats
vortex-firewall stats
```

### Blocked Categories

- Malware distribution domains
- Botnet C2 servers (Mirai, Gafgyt, etc.)
- Phishing domains
- Cryptominer pools

## InterceptoR Insider WAF

The InterceptoR Insider WAF detects DDoS participation from compromised LAN devices:

- **C2 beacon detection** - Identifies infected devices calling home
- **DNS tunneling** - Detects data exfiltration via DNS
- **IoT botnet patterns** - Mirai, Gafgyt, Mozi signatures
- **Cryptominer activity** - Mining pool connections

### Check Insider Threats

```bash
# View InterceptoR status
ubus call luci.interceptor status

# Check for insider threats in logs
grep "insider" /srv/mitmproxy/threats.log
```

## Config Advisor DDoS Profile

Run the DDoS-specific compliance check:

```bash
# Run all checks including DDoS
config-advisorctl check

# Run DDoS checks only
config-advisorctl check --category ddos

# Auto-remediate DDoS issues
config-advisorctl remediate --category ddos
```

### DDoS Check Rules

| Rule ID | Check | Severity |
|---------|-------|----------|
| DDOS-001 | SYN cookies enabled | High |
| DDOS-002 | Connection tracking limit | Medium |
| DDOS-003 | CrowdSec http-dos installed | High |
| DDOS-004 | ICMP rate limiting | Medium |
| DDOS-005 | Reverse path filtering | High |
| DDOS-006 | HAProxy connection limits | Medium |
| DDOS-007 | mitmproxy WAF active | Medium |
| DDOS-008 | Vortex DNS firewall | Medium |

## Limitations

SecuBox is designed for home/SMB scale. It **cannot**:

- Absorb volumetric attacks larger than your WAN bandwidth
- Provide Anycast/CDN distribution
- Act as a scrubbing service

### For Serious DDoS Protection

Consider adding upstream protection:

1. **Cloudflare** - Free tier includes basic DDoS protection
2. **Cloudflare Spectrum** - TCP/UDP proxy for non-HTTP services
3. **AWS Shield** - If hosting on AWS
4. **OVH Anti-DDoS** - If using OVH hosting

### Hybrid Setup

```
Internet → Cloudflare (L3/L4/L7 scrubbing) → SecuBox (L7 WAF + insider detection)
```

## Quick Hardening Checklist

```bash
# 1. Enable firewall protections
uci set firewall.@defaults[0].synflood_protect='1'
uci set firewall.@defaults[0].drop_invalid='1'
uci commit firewall

# 2. Install CrowdSec DDoS collection
cscli collections install crowdsecurity/http-dos

# 3. Enable kernel protections
cat >> /etc/sysctl.conf << 'EOF'
net.ipv4.tcp_syncookies=1
net.ipv4.conf.all.rp_filter=1
net.ipv4.icmp_ratelimit=1000
net.netfilter.nf_conntrack_max=131072
EOF
sysctl -p

# 4. Start Vortex DNS firewall
vortex-firewall intel update
vortex-firewall start

# 5. Verify with Config Advisor
config-advisorctl check --category ddos
```

## Monitoring During Attack

```bash
# Real-time connection count
watch -n 1 'cat /proc/sys/net/netfilter/nf_conntrack_count'

# CrowdSec activity
watch -n 5 'cscli metrics'

# Active bans
cscli decisions list

# HAProxy stats (if enabled)
echo "show stat" | socat stdio /var/run/haproxy.sock

# mitmproxy threats
tail -f /srv/mitmproxy/threats.log
```

## Related Documentation

- [InterceptoR Overview](../package/secubox/luci-app-interceptor/README.md)
- [CrowdSec Dashboard](../package/secubox/luci-app-crowdsec-dashboard/README.md)
- [Vortex DNS Firewall](../package/secubox/VORTEX-DNS-FIREWALL.md)
- [Config Advisor](../package/secubox/secubox-config-advisor/README.md)
