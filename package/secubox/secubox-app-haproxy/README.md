# SecuBox HAProxy App

HAProxy reverse proxy with automatic SSL/TLS certificate management via ACME (Let's Encrypt).

## Features

- **LXC Container Isolation** - HAProxy runs in isolated container
- **Automatic HTTPS** - ACME certificate issuance and renewal
- **Zero-Downtime Certificates** - Webroot mode keeps HAProxy running during issuance
- **Virtual Hosts** - Multiple domains with automatic routing
- **Load Balancing** - Round-robin, least connections, source IP
- **Health Checks** - Automatic backend health monitoring
- **Stats Dashboard** - Real-time statistics on port 8404

## Certificate Management

### ACME Webroot Mode (Zero Downtime)

HAProxy handles ACME challenges internally - no restart required:

```
Internet → Port 80 → HAProxy
                        │
                        ├─ /.well-known/acme-challenge/
                        │        ↓
                        │   acme_challenge backend (:8402)
                        │        ↓
                        │   busybox httpd serves challenge files
                        │
                        └─ Other paths → normal backends
```

### Request a Certificate

```bash
# Production certificate (trusted by browsers)
haproxyctl cert add example.com

# Staging certificate (for testing, not trusted)
uci set haproxy.acme.staging='1'
uci commit haproxy
haproxyctl cert add example.com
```

### Prerequisites for ACME

1. **DNS** - Domain must point to your server's public IP
2. **Port 80** - Must be accessible from internet (firewall/NAT)
3. **Email** - Configure in LuCI > Services > HAProxy > Settings

### Certificate Commands

```bash
haproxyctl cert list              # List installed certificates
haproxyctl cert add <domain>      # Request new certificate
haproxyctl cert renew [domain]    # Renew certificate(s)
haproxyctl cert remove <domain>   # Remove certificate
haproxyctl cert import <domain>   # Import existing cert
```

## Configuration

### UCI Options

```bash
# Main settings
uci set haproxy.main.enabled='1'
uci set haproxy.main.http_port='80'
uci set haproxy.main.https_port='443'
uci set haproxy.main.stats_port='8404'

# ACME settings
uci set haproxy.acme.email='admin@example.com'
uci set haproxy.acme.staging='0'        # 0=production, 1=staging
uci set haproxy.acme.key_type='ec-256'  # ec-256, ec-384, rsa-2048, rsa-4096

uci commit haproxy
```

### Create a Virtual Host

```bash
# Via CLI
haproxyctl vhost add example.com mybackend --ssl --acme

# Via UCI
uci set haproxy.example=vhost
uci set haproxy.example.domain='example.com'
uci set haproxy.example.backend='mybackend'
uci set haproxy.example.ssl='1'
uci set haproxy.example.ssl_redirect='1'
uci set haproxy.example.acme='1'
uci set haproxy.example.enabled='1'
uci commit haproxy
haproxyctl generate && haproxyctl reload
```

### Create a Backend

```bash
# Via CLI
haproxyctl backend add myapp --server 192.168.1.100:8080

# Via UCI
uci set haproxy.myapp=backend
uci set haproxy.myapp.name='myapp'
uci set haproxy.myapp.mode='http'
uci set haproxy.myapp.balance='roundrobin'
uci set haproxy.myapp.enabled='1'

uci set haproxy.myapp_srv1=server
uci set haproxy.myapp_srv1.backend='myapp'
uci set haproxy.myapp_srv1.address='192.168.1.100'
uci set haproxy.myapp_srv1.port='8080'
uci set haproxy.myapp_srv1.check='1'
uci commit haproxy
```

## CLI Reference

```bash
haproxyctl status          # Show status
haproxyctl start           # Start HAProxy
haproxyctl stop            # Stop HAProxy
haproxyctl restart         # Restart HAProxy
haproxyctl reload          # Reload configuration
haproxyctl generate        # Regenerate config file
haproxyctl validate        # Validate configuration

haproxyctl vhost list      # List virtual hosts
haproxyctl backend list    # List backends
haproxyctl cert list       # List certificates
haproxyctl stats           # Show runtime statistics
```

## Troubleshooting

### Certificate Issuance Fails

1. **Check DNS resolution:**
   ```bash
   nslookup example.com
   ```

2. **Verify port 80 is accessible:**
   ```bash
   # From external server
   curl -I http://example.com/.well-known/acme-challenge/test
   ```

3. **Check HAProxy is running:**
   ```bash
   haproxyctl status
   ```

4. **Review logs:**
   ```bash
   logread | grep -i acme
   logread | grep -i haproxy
   ```

### HAProxy Won't Start

1. **Validate configuration:**
   ```bash
   haproxyctl validate
   ```

2. **Check certificate files:**
   ```bash
   ls -la /srv/haproxy/certs/
   ```

3. **Review container logs:**
   ```bash
   lxc-attach -n haproxy -- cat /var/log/haproxy.log
   ```

## File Locations

| Path | Description |
|------|-------------|
| `/etc/config/haproxy` | UCI configuration |
| `/srv/haproxy/config/haproxy.cfg` | Generated HAProxy config |
| `/srv/haproxy/certs/` | SSL certificates |
| `/etc/acme/` | ACME account and cert data |
| `/var/www/acme-challenge/` | ACME challenge webroot |
| `/srv/lxc/haproxy/` | LXC container rootfs |

## License

MIT License - Copyright (C) 2025 CyberMind.fr
