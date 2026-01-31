# ⚡ HAProxy Manager - Reverse Proxy Dashboard

Enterprise-grade reverse proxy management with automatic SSL certificates, vhost configuration, and backend health monitoring.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 **Vhost Management** | Create and manage virtual hosts |
| 🔒 **ACME SSL** | Automatic Let's Encrypt certificates |
| ⚖️ **Load Balancing** | Round-robin, least-conn, source |
| 🏥 **Health Checks** | Backend server monitoring |
| 📊 **Statistics** | Real-time traffic dashboard |
| 🔧 **Config Generator** | Auto-generate HAProxy config |
| 🐳 **LXC Container** | Runs isolated in container |

## 🚀 Quick Start

### Create a Vhost

1. Go to **Services → HAProxy → Vhosts**
2. Click **+ Add Vhost**
3. Fill in:
   - **Domain**: `app.example.com`
   - **Backend**: Select or create
   - **SSL**: ✅ Enable
   - **ACME**: ✅ Auto-certificate
4. Click **Save & Apply**

### Architecture

```
                    ┌─────────────────────────────────┐
   Internet         │         HAProxy Container       │
       │            │  ┌─────────────────────────┐   │
       ▼            │  │      Frontend           │   │
  ┌─────────┐       │  │  :80 → :443 redirect   │   │
  │ Port 80 │──────►│  │  :443 → SSL terminate  │   │
  │Port 443 │       │  └──────────┬──────────────┘   │
  └─────────┘       │             │                  │
                    │             ▼                  │
                    │  ┌─────────────────────────┐   │
                    │  │      Backends           │   │
                    │  │  app.example.com →:8080 │   │
                    │  │  api.example.com →:3000 │   │
                    │  │  blog.example.com→:4000 │   │
                    │  └─────────────────────────┘   │
                    └─────────────────────────────────┘
```

## 📊 Dashboard

```
┌──────────────────────────────────────────────────────┐
│  ⚡ HAProxy                          🟢 Running      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📊 Statistics                                       │
│  ├─ 🌐 Vhosts: 5 active                             │
│  ├─ ⚙️ Backends: 8 configured                       │
│  ├─ 🔒 Certificates: 5 valid                        │
│  └─ 📈 Requests: 12.5K/min                          │
│                                                      │
│  🏥 Backend Health                                   │
│  ┌────────────┬────────┬────────┬─────────┐         │
│  │ Backend    │ Status │ Server │ Latency │         │
│  ├────────────┼────────┼────────┼─────────┤         │
│  │ webapp     │ 🟢 UP  │ 2/2    │ 12ms    │         │
│  │ api        │ 🟢 UP  │ 1/1    │ 8ms     │         │
│  │ blog       │ 🟡 DEG │ 1/2    │ 45ms    │         │
│  └────────────┴────────┴────────┴─────────┘         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 🌐 Vhost Configuration

### Create Vhost

```bash
ubus call luci.haproxy create_vhost '{
  "domain": "app.example.com",
  "backend": "webapp",
  "ssl": 1,
  "ssl_redirect": 1,
  "acme": 1,
  "enabled": 1
}'
```

### Vhost Options

| Option | Default | Description |
|--------|---------|-------------|
| `domain` | - | Domain name (required) |
| `backend` | - | Backend name to route to |
| `ssl` | 1 | Enable SSL/TLS |
| `ssl_redirect` | 1 | Redirect HTTP to HTTPS |
| `acme` | 1 | Auto-request Let's Encrypt cert |
| `enabled` | 1 | Vhost active |

### List Vhosts

```bash
ubus call luci.haproxy list_vhosts

# Response:
{
  "vhosts": [{
    "id": "app_example_com",
    "domain": "app.example.com",
    "backend": "webapp",
    "ssl": true,
    "ssl_redirect": true,
    "acme": true,
    "enabled": true,
    "cert_status": "valid",
    "cert_expiry": "2025-03-15"
  }]
}
```

## ⚙️ Backend Configuration

### Create Backend

```bash
ubus call luci.haproxy create_backend '{
  "name": "webapp",
  "mode": "http",
  "balance": "roundrobin"
}'
```

### Add Server to Backend

```bash
ubus call luci.haproxy create_server '{
  "backend": "webapp",
  "name": "srv1",
  "address": "192.168.255.10",
  "port": 8080,
  "weight": 100,
  "check": 1
}'
```

### Backend Modes

| Mode | Description |
|------|-------------|
| `http` | Layer 7 HTTP proxy |
| `tcp` | Layer 4 TCP proxy |

### Load Balancing

| Algorithm | Description |
|-----------|-------------|
| `roundrobin` | Rotate through servers |
| `leastconn` | Least active connections |
| `source` | Sticky by client IP |
| `uri` | Sticky by URI hash |

## 🔒 SSL Certificates

### ACME Auto-Certificates

When `acme: 1` is set:
1. HAProxy serves ACME challenge on port 80
2. Let's Encrypt validates domain ownership
3. Certificate stored in `/srv/haproxy/certs/`
4. Auto-renewal before expiry

### Manual Certificate

```bash
# Upload certificate
ubus call luci.haproxy upload_certificate '{
  "domain": "app.example.com",
  "cert": "<PEM certificate>",
  "key": "<PEM private key>"
}'
```

### Certificate Status

```bash
ubus call luci.haproxy list_certificates

# Response:
{
  "certificates": [{
    "domain": "app.example.com",
    "status": "valid",
    "issuer": "Let's Encrypt",
    "expiry": "2025-03-15",
    "days_left": 45
  }]
}
```

### Request Certificate Manually

```bash
ubus call luci.haproxy request_certificate '{"domain":"app.example.com"}'
```

## 📊 Statistics

### Get Stats

```bash
ubus call luci.haproxy get_stats

# Response:
{
  "frontend": {
    "requests": 125000,
    "bytes_in": 1234567890,
    "bytes_out": 9876543210,
    "rate": 150
  },
  "backends": [{
    "name": "webapp",
    "status": "UP",
    "servers_up": 2,
    "servers_total": 2,
    "requests": 45000,
    "response_time_avg": 12
  }]
}
```

### Stats Page

Access HAProxy stats at:
```
http://192.168.255.1:8404/stats
```

## 🔧 Configuration

### UCI Structure

```bash
# /etc/config/haproxy

config haproxy 'main'
    option enabled '1'
    option stats_port '8404'

config backend 'webapp'
    option name 'webapp'
    option mode 'http'
    option balance 'roundrobin'
    option enabled '1'

config server 'webapp_srv1'
    option backend 'webapp'
    option name 'srv1'
    option address '192.168.255.10'
    option port '8080'
    option weight '100'
    option check '1'
    option enabled '1'

config vhost 'app_example_com'
    option domain 'app.example.com'
    option backend 'webapp'
    option ssl '1'
    option ssl_redirect '1'
    option acme '1'
    option enabled '1'
```

### Generate Config

```bash
# Regenerate haproxy.cfg from UCI
ubus call luci.haproxy generate

# Reload HAProxy
ubus call luci.haproxy reload
```

### Validate Config

```bash
ubus call luci.haproxy validate

# Response:
{
  "valid": true,
  "message": "Configuration is valid"
}
```

## 📡 RPCD API

### Service Control

| Method | Description |
|--------|-------------|
| `status` | Get HAProxy status |
| `start` | Start HAProxy service |
| `stop` | Stop HAProxy service |
| `restart` | Restart HAProxy |
| `reload` | Reload configuration |
| `generate` | Generate config file |
| `validate` | Validate configuration |

### Vhost Management

| Method | Description |
|--------|-------------|
| `list_vhosts` | List all vhosts |
| `create_vhost` | Create new vhost |
| `update_vhost` | Update vhost |
| `delete_vhost` | Delete vhost |

### Backend Management

| Method | Description |
|--------|-------------|
| `list_backends` | List all backends |
| `create_backend` | Create backend |
| `delete_backend` | Delete backend |
| `create_server` | Add server to backend |
| `delete_server` | Remove server |

### Certificates

| Method | Description |
|--------|-------------|
| `list_certificates` | List all certs |
| `request_certificate` | Request ACME cert |
| `upload_certificate` | Upload manual cert |
| `delete_certificate` | Delete certificate |

## 📁 File Locations

| Path | Description |
|------|-------------|
| `/etc/config/haproxy` | UCI configuration |
| `/var/lib/lxc/haproxy/` | LXC container root |
| `/srv/haproxy/haproxy.cfg` | Generated config |
| `/srv/haproxy/certs/` | SSL certificates |
| `/srv/haproxy/acme/` | ACME challenges |
| `/usr/libexec/rpcd/luci.haproxy` | RPCD backend |
| `/usr/sbin/haproxyctl` | CLI tool |

## 🛠️ CLI Tool

### haproxyctl Commands

```bash
# Status
haproxyctl status

# List vhosts
haproxyctl vhosts

# Add vhost
haproxyctl vhost add app.example.com --backend webapp --ssl --acme

# Remove vhost
haproxyctl vhost del app.example.com

# List certificates
haproxyctl cert list

# Request certificate
haproxyctl cert add app.example.com

# Generate config
haproxyctl generate

# Reload
haproxyctl reload

# Validate
haproxyctl validate
```

## 🛠️ Troubleshooting

### HAProxy Won't Start

```bash
# Check container
lxc-info -n haproxy

# Start container
lxc-start -n haproxy

# Check logs
lxc-attach -n haproxy -- cat /var/log/haproxy.log
```

### 503 Service Unavailable

1. Check backend is configured:
   ```bash
   ubus call luci.haproxy list_backends
   ```
2. Verify server is reachable:
   ```bash
   curl http://192.168.255.10:8080
   ```
3. Check HAProxy logs

### Certificate Not Working

1. Ensure DNS resolves to your public IP
2. Ensure ports 80/443 accessible from internet
3. Check ACME challenge:
   ```bash
   curl http://app.example.com/.well-known/acme-challenge/test
   ```

### Config Validation Fails

```bash
# Show validation errors
lxc-attach -n haproxy -- haproxy -c -f /etc/haproxy/haproxy.cfg
```

## 🔒 Security

### Firewall Rules

HAProxy needs ports 80/443 open from WAN:

```bash
# Auto-created when vhost uses SSL
uci show firewall | grep HAProxy
```

### Rate Limiting

Add to backend config:
```
stick-table type ip size 100k expire 30s store http_req_rate(10s)
http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }
```

## 📜 License

MIT License - Copyright (C) 2025 CyberMind.fr
