# 🔐 mitmproxy - HTTPS Interception Proxy

Interactive HTTPS proxy for debugging, testing, and security analysis with transparent mode support and web-based traffic inspection.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Traffic Inspection** | View and analyze HTTP/HTTPS requests in real-time |
| 🖥️ **Web UI** | Built-in mitmweb interface for visual traffic analysis |
| 🎭 **Transparent Mode** | Intercept traffic automatically via nftables |
| 📜 **CA Certificate** | Generate and manage SSL interception certificates |
| 📊 **Statistics** | Track requests, unique hosts, and flow data |
| 🔄 **Request Replay** | Replay captured requests for testing |
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
    option enabled '0'
    option log_requests '1'
    option filter_cdn '0'
    option filter_media '0'
    option block_ads '0'

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
| `get_status` | Get service status |
| `service_start` | Start mitmproxy |
| `service_stop` | Stop mitmproxy |
| `service_restart` | Restart service |
| `install` | Install mitmproxy container |

### Configuration

| Method | Description |
|--------|-------------|
| `get_config` | Get main configuration |
| `get_all_config` | Get all configuration sections |
| `get_transparent_config` | Get transparent mode settings |
| `get_whitelist_config` | Get whitelist settings |
| `get_filtering_config` | Get filtering settings |
| `set_config` | Set configuration value |

### Statistics & Data

| Method | Description |
|--------|-------------|
| `get_stats` | Get traffic statistics |
| `get_requests` | Get captured requests |
| `get_top_hosts` | Get most requested hosts |
| `get_ca_info` | Get CA certificate info |
| `clear_data` | Clear captured data |

### Firewall

| Method | Description |
|--------|-------------|
| `firewall_setup` | Setup transparent mode rules |
| `firewall_clear` | Remove firewall rules |

### Example Usage

```bash
# Get status
ubus call luci.mitmproxy get_status

# Response:
{
  "enabled": true,
  "running": true,
  "installed": true,
  "docker_available": true,
  "web_port": 8081,
  "proxy_port": 8080,
  "listen_port": 8080,
  "web_url": "http://192.168.255.1:8081"
}

# Get statistics
ubus call luci.mitmproxy get_stats

# Response:
{
  "total_requests": 12500,
  "unique_hosts": 245,
  "flow_file_size": 47185920,
  "cdn_requests": 3200,
  "media_requests": 890,
  "blocked_ads": 156
}

# Get top hosts
ubus call luci.mitmproxy get_top_hosts '{"limit":10}'

# Response:
{
  "hosts": [
    { "host": "api.example.com", "count": 1234 },
    { "host": "cdn.cloudflare.com", "count": 890 }
  ]
}
```

## 🔒 CA Certificate

### Generate New Certificate

```bash
# Certificate is auto-generated on first start
# Located at: /srv/mitmproxy/certs/mitmproxy-ca-cert.pem
```

### Download Certificate

1. Access mitmweb UI at `http://192.168.255.1:8081`
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

MIT License - Copyright (C) 2025 CyberMind.fr
