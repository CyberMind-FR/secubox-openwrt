# SecuBox Service Registry

Unified service aggregation dashboard with automatic publishing to HAProxy (clearnet) and Tor (hidden services), including health monitoring and QR code generation.

## Features

- **Service Discovery** - Automatically detects running services from:
  - HAProxy vhosts
  - Tor hidden services
  - Direct listening ports (netstat)
  - LXC containers
- **One-Click Publishing** - Publish services to clearnet and/or Tor
- **Health Monitoring** - Real-time DNS, certificate, and firewall status
- **URL Readiness Checker** - Verify domain configuration before going live
- **QR Codes** - Generate QR codes for easy mobile access
- **Landing Page** - Auto-generated static HTML with all published services

## Dashboard

### Health Summary Bar

Shows overall system status at a glance:
- Firewall ports 80/443 status
- HAProxy container status
- Tor daemon status
- DNS resolution count
- Certificate health count

### URL Readiness Checker

Before publishing a service, verify the domain is properly configured:

1. Enter a domain in the checker (e.g., `example.com`)
2. Click "Check" to verify:
   - **DNS Resolution** - Domain resolves to expected IP
   - **Firewall Ports** - Ports 80 and 443 open from WAN
   - **SSL Certificate** - Valid certificate with expiry status
   - **HAProxy** - Reverse proxy container running

The checker provides actionable recommendations when issues are found.

### Service Health Indicators

Each published service shows inline health badges:

| Badge | Meaning |
|-------|---------|
| 🌐 | DNS resolving correctly |
| ❌ | DNS resolution failed |
| 🔒 | Certificate valid (30+ days) |
| ⚠️ | Certificate expiring soon (7-30 days) |
| 🔴 | Certificate critical (<7 days) |
| 💀 | Certificate expired |
| ⚪ | No certificate configured |
| 🧅 | Tor hidden service enabled |

## Publishing a Service

### Quick Publish (LuCI)

1. Go to **Services > Service Registry**
2. Find your service in "Discovered Services"
3. Click 📤 to quick publish
4. Optionally add:
   - Domain (creates HAProxy vhost + requests ACME cert)
   - Tor hidden service

### CLI Publishing

```bash
# List discovered services
secubox-registry list

# Publish with domain (clearnet)
secubox-registry publish myapp 8080 --domain app.example.com

# Publish with Tor hidden service
secubox-registry publish myapp 8080 --tor

# Publish with both
secubox-registry publish myapp 8080 --domain app.example.com --tor

# Unpublish
secubox-registry unpublish myapp
```

### What Happens on Publish

When you publish a service with a domain:

1. **Backend Created** - HAProxy backend pointing to local port
2. **Vhost Created** - HAProxy vhost for the domain
3. **Firewall Opened** - Ports 80/443 opened from WAN (auto)
4. **Certificate Requested** - ACME certificate via Let's Encrypt
5. **Landing Page Updated** - Static HTML regenerated

## Health Check API

### Check Single Domain

```bash
ubus call luci.service-registry check_service_health '{"domain":"example.com"}'
```

Response:
```json
{
  "success": true,
  "domain": "example.com",
  "dns": {
    "status": "ok",
    "resolved_ip": "203.0.113.10"
  },
  "certificate": {
    "status": "ok",
    "days_left": 45
  },
  "firewall": {
    "status": "ok",
    "http_open": true,
    "https_open": true
  },
  "haproxy": {
    "status": "running"
  }
}
```

### Check All Services

```bash
ubus call luci.service-registry check_all_health
```

Response includes aggregated health for all published domains.

## Troubleshooting

### DNS Not Resolving

1. Verify DNS A record points to your public IP
2. Check with: `nslookup example.com`
3. DNS propagation can take up to 48 hours

### Firewall Ports Closed

1. Check firewall rules: `uci show firewall | grep HAProxy`
2. Ports should open automatically on publish
3. Manual fix:
   ```bash
   uci add firewall rule
   uci set firewall.@rule[-1].name='HAProxy-HTTP'
   uci set firewall.@rule[-1].src='wan'
   uci set firewall.@rule[-1].dest_port='80'
   uci set firewall.@rule[-1].proto='tcp'
   uci set firewall.@rule[-1].target='ACCEPT'
   uci commit firewall
   /etc/init.d/firewall reload
   ```

### Certificate Missing

1. Ensure domain DNS is configured correctly
2. Ensure port 80 is accessible from internet
3. Request certificate via HAProxy:
   ```bash
   haproxyctl cert add example.com
   ```

### 503 Service Unavailable

Common causes:
1. **Backend not running** - Check if the service is actually listening
2. **Wrong backend port** - Verify HAProxy backend configuration
3. **HAProxy not running** - Check container status

```bash
# Check service is listening
netstat -tln | grep :8080

# Check HAProxy status
haproxyctl status

# Check HAProxy config
haproxyctl validate
```

## Configuration

### UCI Settings

```bash
# Main settings
uci set service-registry.main.enabled='1'
uci set service-registry.main.auto_tor='0'        # Auto-create Tor on publish
uci set service-registry.main.auto_haproxy='0'    # Auto-create HAProxy on publish
uci set service-registry.main.landing_auto_regen='1'

# Provider toggles
uci set service-registry.haproxy.enabled='1'
uci set service-registry.tor.enabled='1'
uci set service-registry.direct.enabled='1'
uci set service-registry.lxc.enabled='1'

uci commit service-registry
```

## File Locations

| Path | Description |
|------|-------------|
| `/etc/config/service-registry` | UCI configuration |
| `/www/secubox-services.html` | Generated landing page |
| `/usr/sbin/secubox-registry` | CLI tool |
| `/usr/sbin/secubox-landing-gen` | Landing page generator |
| `/usr/libexec/rpcd/luci.service-registry` | RPCD backend |

## RPCD Methods

| Method | Description |
|--------|-------------|
| `list_services` | List all services from all providers |
| `publish_service` | Publish a service to HAProxy/Tor |
| `unpublish_service` | Remove service from HAProxy/Tor |
| `check_service_health` | Check DNS/cert/firewall for domain |
| `check_all_health` | Batch health check all services |
| `generate_landing_page` | Regenerate static landing page |

## License

MIT License - Copyright (C) 2025 CyberMind.fr
