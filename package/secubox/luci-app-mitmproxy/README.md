# 🔐 mitmproxy - HTTPS Interception Proxy

Interactive HTTPS proxy for debugging, testing, and security analysis with transparent mode support and web-based traffic inspection.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Traffic Inspection** | View and analyze HTTP/HTTPS requests in real-time |
| 🖥️ **Web UI** | Built-in mitmweb interface with auto-auth token |
| 🎭 **Transparent Mode** | Intercept traffic automatically via nftables |
| 🛡️ **Threat Detection** | Detect SQL injection, XSS, command injection, Log4Shell |
| 🔗 **HAProxy Integration** | Inspect all vhost backends with threat detection |
| 📜 **CA Certificate** | Generate and manage SSL interception certificates |
| 📊 **CrowdSec Logging** | Log threats to CrowdSec for automatic blocking |
| ⚙️ **Filtering** | Filter and track CDN, media, ads, and trackers |
| 🛡️ **Whitelist** | Bypass interception for specific IPs/domains |

## 🚀 Quick Start

### Proxy Modes

| Mode | Icon | Description | Use Case |
|------|------|-------------|----------|
| 🎯 **Regular** | Configure clients manually | Testing specific apps |
| 🎭 **Transparent** | Auto-intercept via firewall | Network-wide inspection |
| ⬆️ **Upstream** | Forward to another proxy | Proxy chaining |
| ⬇️ **Reverse** | Reverse proxy mode | Backend analysis |

### Enable Transparent Mode

1. Go to **Security → mitmproxy → Settings**
2. Set **Proxy Mode** to `Transparent`
3. Enable **Transparent Firewall**
4. Click **Save & Apply**

### Install CA Certificate

For HTTPS interception, install the mitmproxy CA on client devices:

1. Configure device to use proxy (or use transparent mode)
2. Navigate to `http://mitm.it` from the device
3. Download and install the certificate for your OS
4. Trust the certificate in system settings

## 📊 Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  🔐 mitmproxy                              🟢 Running        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │ 📊 12.5K   │  │ 🌐 245     │  │ 💾 45 MB   │  │ 🔌 8080│ │
│  │ Requests   │  │ Hosts      │  │ Flow Data  │  │ Port   │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────┘ │
│                                                              │
│  🌐 Top Hosts                      🔒 CA Certificate         │
│  ┌──────────────────────────────┐ ┌─────────────────────────┐│
│  │ 🔗 api.example.com    1,234  │ │ 📜 mitmproxy CA         ││
│  │ 🔗 cdn.cloudflare.com   890  │ │ ✅ Certificate installed ││
│  │ 🔗 www.google.com       567  │ │ Expires: 2026-01-28     ││
│  │ 🔗 analytics.google.com 432  │ │ [⬇ Download]            ││
│  └──────────────────────────────┘ └─────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🔍 Request Capture

### Live Request Viewer

The Requests tab shows captured HTTP traffic in real-time:

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 Captured Requests                        ⏸ Pause         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [GET]  api.example.com/users         200  application/json │
│  [POST] auth.example.com/login        201  application/json │
│  [GET]  cdn.cloudflare.com/script.js  200  text/javascript  │
│  [GET]  www.google.com/search         200  text/html        │
│  [PUT]  api.example.com/user/123      204  -                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### View Request Details

Click on any request to see:
- Full request headers
- Response headers
- Cookies
- Request/response body (if captured)

## 🎭 Transparent Mode

### Architecture

```
  Client Device                    SecuBox Router
┌──────────────┐               ┌────────────────────────┐
│              │               │                        │
│  Browser     │◀── HTTP/S ──▶│  nftables REDIRECT     │
│              │               │         │              │
└──────────────┘               │         ▼              │
                               │  ┌──────────────────┐  │
                               │  │    mitmproxy     │  │
                               │  │   (port 8080)    │  │
                               │  └────────┬─────────┘  │
                               │           │            │
                               │           ▼            │
                               │     Internet          │
                               └────────────────────────┘
```

### Firewall Setup

When transparent mode is enabled, mitmproxy automatically creates nftables rules:

```bash
# HTTP redirect (port 80 → 8080)
nft add rule inet fw4 prerouting tcp dport 80 redirect to :8080

# HTTPS redirect (port 443 → 8080)
nft add rule inet fw4 prerouting tcp dport 443 redirect to :8080
```

## 🔗 HAProxy Backend Inspection

Route all HAProxy vhost traffic through mitmproxy for threat detection.

### Architecture

```
Internet → HAProxy (SSL termination) → mitmproxy :8889 → Actual Backends
                                           ↓
                                    Threat Detection
                                           ↓
                                    CrowdSec Logging
```

### Enable HAProxy Inspection

```bash
# Via CLI
mitmproxyctl haproxy-enable

# What it does:
# 1. Syncs HAProxy backends to mitmproxy routes
# 2. Updates all vhosts to route through mitmproxy
# 3. Restarts both services
```

### Disable HAProxy Inspection

```bash
# Restore original backends
mitmproxyctl haproxy-disable
```

### Manual Route Sync

```bash
# Sync routes from HAProxy UCI without enabling inspection
mitmproxyctl sync-routes
```

### HAProxy Inspector Commands

| Command | Description |
|---------|-------------|
| `mitmproxyctl haproxy-enable` | Enable backend inspection |
| `mitmproxyctl haproxy-disable` | Restore original backends |
| `mitmproxyctl sync-routes` | Sync routes from HAProxy UCI |

## 🛡️ Threat Detection

The analytics addon detects 90+ attack patterns including:

| Category | Examples |
|----------|----------|
| **SQL Injection** | UNION SELECT, OR 1=1, time-based blind |
| **XSS** | script tags, event handlers, javascript: |
| **Command Injection** | shell commands, pipe injection |
| **Path Traversal** | ../../../etc/passwd |
| **SSRF** | internal IP access, metadata endpoints |
| **Log4Shell** | ${jndi:ldap://...} |
| **Admin Scanners** | /wp-admin, /phpmyadmin, /.env |

### View Threats

Threats are displayed in the LuCI dashboard with:
- Severity level (critical/high/medium/low)
- Attack pattern type
- Source IP and country
- Request path and method

### CrowdSec Integration

Detected threats are logged to `/var/log/crowdsec/mitmproxy-threats.log` for:
- Automatic IP blocking via CrowdSec bouncer
- Threat intelligence sharing
- Security analytics

## ⚙️ Configuration

### UCI Settings

```bash
# /etc/config/mitmproxy

config mitmproxy 'main'
    option enabled '1'
    option mode 'transparent'        # regular | transparent | upstream | reverse
    option proxy_port '8080'
    option web_host '0.0.0.0'
    option web_port '8081'
    option data_path '/srv/mitmproxy'
    option memory_limit '256M'
    option ssl_insecure '0'          # Accept invalid upstream certs
    option anticache '0'             # Strip cache headers
    option anticomp '0'              # Disable compression
    option flow_detail '1'           # Log detail level (0-4)

config transparent 'transparent'
    option enabled '1'
    option interface 'br-lan'
    option redirect_http '1'
    option redirect_https '1'
    option http_port '80'
    option https_port '443'

config whitelist 'whitelist'
    option enabled '1'
    list bypass_ip '192.168.255.0/24'
    list bypass_domain 'banking.com'

config filtering 'filtering'
    option enabled '1'
    option log_requests '1'
    option filter_cdn '0'
    option filter_media '0'
    option block_ads '0'
    option addon_script '/data/addons/secubox_analytics.py'

config haproxy_router 'haproxy_router'
    option enabled '0'
    option listen_port '8889'
    option threat_detection '1'
    option routes_file '/srv/mitmproxy/haproxy-routes.json'

config capture 'capture'
    option save_flows '0'
    option capture_request_headers '1'
    option capture_response_headers '1'
    option capture_request_body '0'
    option capture_response_body '0'
```

## 📡 RPCD API

### Service Control

| Method | Description |
|--------|-------------|
| `status` | Get service status (includes auth token) |
| `start` | Start mitmproxy |
| `stop` | Stop mitmproxy |
| `restart` | Restart service |
| `install` | Install mitmproxy container |

### Configuration

| Method | Description |
|--------|-------------|
| `settings` | Get all settings |
| `save_settings` | Save configuration |
| `set_mode` | Set proxy mode |

### Threat Detection

| Method | Description |
|--------|-------------|
| `alerts` | Get detected threats |
| `threat_stats` | Get threat statistics |
| `clear_alerts` | Clear all alerts |

### HAProxy Integration

| Method | Description |
|--------|-------------|
| `haproxy_enable` | Enable backend inspection |
| `haproxy_disable` | Restore original backends |
| `sync_routes` | Sync routes from HAProxy |

### Firewall

| Method | Description |
|--------|-------------|
| `setup_firewall` | Setup transparent mode rules |
| `clear_firewall` | Remove firewall rules |

### Example Usage

```bash
# Get status (includes auth token for Web UI)
ubus call luci.mitmproxy status

# Response:
{
  "enabled": true,
  "running": true,
  "installed": true,
  "web_port": 8081,
  "proxy_port": 8888,
  "mode": "regular",
  "token": "abc123xyz...",
  "haproxy_router_enabled": false,
  "haproxy_listen_port": 8889
}

# Get detected threats
ubus call luci.mitmproxy alerts

# Response:
{
  "success": true,
  "alerts": [
    {
      "time": "2026-01-31T12:00:00",
      "severity": "high",
      "pattern": "sql_injection",
      "method": "GET",
      "path": "/api?id=1' OR 1=1--",
      "ip": "192.168.1.100"
    }
  ]
}

# Enable HAProxy backend inspection
ubus call luci.mitmproxy haproxy_enable

# Response:
{
  "success": true,
  "message": "HAProxy backend inspection enabled"
}
```

## 🖥️ Web UI Access

The mitmweb UI requires authentication via token.

### Auto-Auth via LuCI

The LuCI dashboard shows the Web UI link with the token included:
```
http://192.168.255.1:8081/?token=abc123xyz
```

### Manual Token Access

```bash
# Token is stored in data directory
cat /srv/mitmproxy/.mitmproxy_token

# Or via RPCD
ubus call luci.mitmproxy status | jsonfilter -e '@.token'
```

## 🔒 CA Certificate

### Generate New Certificate

```bash
# Certificate is auto-generated on first start
# Located at: /srv/mitmproxy/mitmproxy-ca-cert.pem
```

### Download Certificate

1. Access mitmweb UI (use token from LuCI dashboard)
2. Or navigate to `http://mitm.it` from a proxied device
3. Download certificate for your platform

### Certificate Locations

| Path | Description |
|------|-------------|
| `/srv/mitmproxy/certs/mitmproxy-ca.pem` | CA private key + certificate |
| `/srv/mitmproxy/certs/mitmproxy-ca-cert.pem` | CA certificate only |
| `/srv/mitmproxy/certs/mitmproxy-ca-cert.cer` | Certificate (DER format) |

## 🛡️ Filtering & Analytics

### CDN Tracking

Track traffic to major CDN providers:
- Cloudflare
- Akamai
- Fastly
- AWS CloudFront
- Google Cloud CDN

### Media Streaming Tracking

Track streaming services:
- YouTube
- Netflix
- Spotify
- Twitch
- Amazon Prime Video

### Ad Blocking

Block known advertising and tracking domains with the built-in filter addon.

## 📁 File Locations

| Path | Description |
|------|-------------|
| `/etc/config/mitmproxy` | UCI configuration |
| `/srv/mitmproxy/` | Data directory |
| `/srv/mitmproxy/certs/` | CA certificates |
| `/srv/mitmproxy/flows/` | Captured flow files |
| `/var/lib/lxc/mitmproxy/` | LXC container root |
| `/usr/libexec/rpcd/luci.mitmproxy` | RPCD backend |

## 🛠️ Troubleshooting

### Service Won't Start

```bash
# Check container status
lxc-info -n mitmproxy

# Check logs
logread | grep mitmproxy

# Verify Docker is available
docker ps
```

### No Traffic Being Captured

1. **Regular mode**: Verify client proxy settings point to `192.168.255.1:8080`
2. **Transparent mode**: Check firewall rules with `nft list ruleset | grep redirect`
3. Verify mitmproxy is listening: `netstat -tln | grep 8080`

### HTTPS Interception Not Working

1. Install CA certificate on client device
2. Trust the certificate in system settings
3. Some apps use certificate pinning and cannot be intercepted

### Web UI Not Accessible

```bash
# Check web port is listening
netstat -tln | grep 8081

# Verify from router
curl -I http://127.0.0.1:8081

# Check firewall allows access
uci show firewall | grep mitmproxy
```

### Memory Issues

```bash
# Increase memory limit
uci set mitmproxy.main.memory_limit='512M'
uci commit mitmproxy
/etc/init.d/mitmproxy restart
```

## 🔒 Security Notes

1. **Sensitive Tool** - mitmproxy can intercept all network traffic including passwords. Use responsibly.
2. **CA Certificate** - Protect the CA private key. Anyone with access can intercept traffic.
3. **Whitelist Banking** - Add banking and financial sites to the bypass list.
4. **Disable When Not Needed** - Turn off transparent mode when not actively debugging.
5. **Audit Trail** - All captured requests may contain sensitive data.

## 📜 License

MIT License - Copyright (C) 2025-2026 CyberMind.fr
