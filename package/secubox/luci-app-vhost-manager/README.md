# VHost Manager - Reverse Proxy & SSL Certificate Management

**Version:** 2.0.0
**Last Updated:** 2026-01-01
**Status:** Active


LuCI application for managing nginx reverse proxy virtual hosts and SSL certificates via Let's Encrypt with integrated service templates and redirect management.

## Features

### Internal Services Catalog (v2.0+)
- 🏠 **Pre-configured Service Templates** - 19 ready-to-deploy internal services
- 🚀 **One-Click Activation** - Deploy services with optimal SSL, auth, and WebSocket settings
- 📊 **Real-Time Status** - Auto-refresh dashboard showing active/configured services
- 🎯 **Smart Feature Detection** - Automatic SSL, authentication, and WebSocket configuration
- 📦 **Category Organization** - Services grouped by type (IoT, Media, Security, Productivity, etc.)
- 🔄 **Auto-Refresh** - Live updates every 10 seconds
- 🎨 **Modern Grid UI** - Responsive card-based layout with feature badges

### Redirect Rules Management (v2.0+)
- ↪️ **Pre-built Redirect Templates** - 6 common redirect patterns (CDN cache, privacy redirects, failover)
- 🎯 **HTTP Redirect Codes** - Support for 301 (permanent), 302 (temporary), 307 (temporary, preserve method)
- 🔄 **Template Activation** - One-click deployment of redirect rules
- 📊 **Active Redirects Dashboard** - Real-time status of configured redirects
- 🎨 **Category Organization** - Templates grouped by use case (Productivity, Media, Security, Network)
- 🔄 **Auto-Refresh** - Live updates every 10 seconds

### Virtual Host Management (v1.0+)
- Create and manage nginx reverse proxy configurations
- Support for HTTP and HTTPS virtual hosts
- Backend connectivity testing before deployment
- WebSocket protocol support
- HTTP Basic Authentication
- Automatic nginx reload on configuration changes
- **Enable/Disable toggle** - Quick service control without deletion
- **Remove button** - Clean VHost deletion with confirmation

### SSL Certificate Management (v1.0+)
- Let's Encrypt certificate provisioning via acme.sh
- Certificate status monitoring with expiry tracking
- Color-coded expiry warnings (red < 7 days, orange < 30 days)
- Certificate details viewer
- Automatic certificate renewal support

### Access Log Monitoring (v1.0+)
- Real-time nginx access log viewer
- Per-domain log filtering
- Configurable line display (50-500 lines)
- Terminal-style log display

### Profile Activation System (v2.0+)
- 🎯 **Template-Based Deployment** - Create VHosts from pre-configured templates
- 🔐 **Smart Feature Configuration** - Automatic SSL/Auth/WebSocket setup based on service requirements
- 📝 **Template Notes** - Contextual information displayed during activation
- ✅ **Confirmation Modals** - Review settings before deployment
- 🔄 **Activate/Deactivate** - Easy template management with visual feedback

## Installation

```bash
opkg update
opkg install luci-app-vhost-manager
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependencies

- **luci-base**: LuCI framework
- **rpcd**: RPC daemon for backend communication
- **nginx-ssl**: Nginx web server with SSL support
- **acme**: ACME client for Let's Encrypt certificates
- **curl**: HTTP client for backend testing

## Configuration

### UCI Configuration (`/etc/config/vhosts`)

Virtual hosts now live in `/etc/config/vhosts`, allowing other SecuBox components to declaratively install proxies. A default file is dropped during install; edit it like any other UCI config:

```bash
config global 'global'
	option enabled '1'
	option auto_reload '1'

config vhost 'myapp'
	option domain 'app.example.com'
	option upstream 'http://127.0.0.1:8080'
	option tls 'acme'          # off|acme|manual
	option cert_path '/etc/custom/fullchain.pem'   # used when tls=manual
	option key_path '/etc/custom/privkey.pem'
	option auth '1'
	option auth_user 'admin'
	option auth_pass 'secretpassword'
	option websocket '1'
	option enabled '1'
```

> Legacy installations may still ship `/etc/config/vhost_manager` for backwards compatibility, but the RPC backend now generates `/etc/nginx/conf.d/*.conf` exclusively from `/etc/config/vhosts`.

### Options

#### Global Section
- `enabled`: Enable/disable VHost Manager (default: 1)
- `auto_reload`: Automatically reload nginx on config changes (default: 1)
- `log_retention`: Days to retain access logs (default: 30)

#### VHost Section
- `domain`: Domain name for this virtual host (required)
- `upstream`: Backend URL to proxy to (required, e.g., http://192.168.1.100:8080)
- `tls`: TLS strategy (`off`, `acme`, or `manual`)
- `cert_path` / `key_path`: Required when `tls=manual` to point to PEM files
- `auth`: Enable HTTP Basic Authentication (default: 0)
- `auth_user` / `auth_pass`: Credentials used when `auth=1`
- `websocket`: Enable WebSocket headers (default: 0)
- `enabled`: Disable the vhost without deleting it (default: 1)

## Usage

### Web Interface

Navigate to **Services → VHost Manager** in LuCI.

#### Overview Tab
- System status (Nginx running, ACME availability)
- Virtual host statistics (SSL enabled, auth protected, WebSocket)
- Certificate count and expiry status
- Recent virtual hosts list

#### Virtual Hosts Tab
- Add new virtual hosts
- Edit existing configurations
- Test backend connectivity before saving
- Enable/disable SSL, authentication, WebSocket
- Delete virtual hosts

#### Certificates Tab
- Request new Let's Encrypt certificates
- View installed certificates with expiry dates
- Certificate details viewer
- Color-coded expiry warnings

#### Logs Tab
- View nginx access logs per domain
- Select number of lines to display (50-500)
- Real-time log streaming

#### Internal Services Tab (v2.0+)

The Internal Services tab provides a catalog of 19 pre-configured service templates for popular self-hosted applications.

**Dashboard Metrics:**
- **Active** - Services currently enabled and running
- **Configured** - Total services with VHost entries
- **Available** - Total templates in catalog

**Active Services Grid:**

Each configured service displays:
- Service icon and name
- Status badge (Active/Disabled)
- Category and description
- Domain, backend URL, and port
- Feature badges (🔒 SSL, 🔐 Auth, ⚡ WebSocket)
- Three action buttons:
  - **Edit** - Navigate to VHost configuration
  - **Enable/Disable** - Toggle service status
  - **Remove** - Delete VHost configuration (with confirmation)

**Service Templates:**

Templates are organized by category:

| Category | Services |
|----------|----------|
| **Core Services** | LuCI UI |
| **Monitoring** | Netdata |
| **Security** | CrowdSec, Vaultwarden |
| **Network** | NoDogSplash, AdGuard Home, Uptime Kuma |
| **IoT & Home Automation** | Domoticz, Zigbee2MQTT, Home Assistant, MagicMirror² |
| **Media** | Lyrion Music Server, Jellyfin |
| **AI & Machine Learning** | LocalAI |
| **Productivity** | Citadel, ISPConfig, Mail-in-a-Box, Nextcloud, Gitea |
| **Hosting & Control Panels** | Portainer |

**Template Activation Workflow:**

1. Click **Activate** on any template
2. Review activation modal showing:
   - Service name and icon
   - Domain and backend URL
   - Required features (SSL, Auth, WebSocket)
   - Special notes (e.g., "Nextcloud handles its own authentication")
3. Click **Activate** to create VHost
4. Service automatically configured with optimal settings

**Example: Activating Nextcloud**

Template configuration:
```
Icon: ☁️
Name: Nextcloud
Domain: cloud.local
Backend: http://127.0.0.1:80
Port: 80
Category: Productivity
Features:
  - SSL/TLS required
  - WebSocket support
Notes: "Nextcloud handles its own authentication. Configure trusted domains in config.php."
```

After activation:
- VHost created at `cloud.local`
- SSL automatically configured (ACME mode)
- WebSocket headers enabled
- Backend proxied to port 80
- Service marked as "Active" in dashboard

#### Redirects Tab (v2.0+)

The Redirects tab manages nginx HTTP redirect rules with pre-built templates for common use cases.

**Dashboard Metrics:**
- **Active** - Currently enabled redirect rules
- **Total** - All configured redirects
- **Templates** - Available redirect templates

**Active Redirects Grid:**

Each configured redirect displays:
- Redirect icon (↪️)
- Domain name
- Status badge (Active/Disabled)
- From domain
- To URL
- HTTP code badge (301, 302, 307)
- Three action buttons:
  - **Edit** - Navigate to VHost configuration
  - **Enable/Disable** - Toggle redirect status
  - **Remove** - Delete redirect rule (with confirmation)

**Redirect Templates:**

| Template | HTTP Code | Category | Use Case |
|----------|-----------|----------|----------|
| **Nextcloud → LAN** | 301 | Productivity | Force remote users to LAN-hosted Nextcloud |
| **Steam CDN cache** | 302 | Media | Redirect downloads to on-prem cache |
| **YouTube → Invidious** | 307 | Media | Privacy-friendly YouTube redirect |
| **Mail failover** | 302 | Productivity | Failover to alternate mail service |
| **Ad Blocker Redirect** | 301 | Security | Redirect ad servers to localhost |
| **CDN → Local Cache** | 302 | Network | Cache CDN assets locally |

**HTTP Redirect Codes:**

- **301 (Permanent)** - Browser caches redirect, use for permanent moves
- **302 (Temporary)** - Browser doesn't cache, use for temporary redirects
- **307 (Temporary, Preserve Method)** - Like 302 but preserves HTTP method (POST/GET)

**Template Activation Workflow:**

1. Click **Activate** on any redirect template
2. Review activation modal showing:
   - Redirect name
   - From domain pattern
   - To URL
   - HTTP redirect code
3. Click **Activate** to create redirect
4. Redirect rule automatically configured

**Example: Steam CDN Cache**

Template configuration:
```
Icon: 🕹️
Name: Steam CDN cache
From: *.cdn.steamstatic.com
To: http://steamcache.lan
Code: 302
Category: Media
```

Generated nginx config:
```nginx
server {
    listen 80;
    server_name *.cdn.steamstatic.com;
    return 302 http://steamcache.lan$request_uri;
}
```

### Command Line

#### List Virtual Hosts

```bash
ubus call luci.vhost-manager list_vhosts
```

#### Get VHost Manager Status

```bash
ubus call luci.vhost-manager status
```

#### Add Virtual Host

```bash
ubus call luci.vhost-manager add_vhost '{
  "domain": "app.example.com",
  "backend": "http://192.168.1.100:8080",
  "tls_mode": "acme",
  "auth": true,
  "auth_user": "admin",
  "auth_pass": "secret",
  "websocket": true,
  "enabled": true
}'
```

#### Test Backend Connectivity

```bash
ubus call luci.vhost-manager test_backend '{
  "backend": "http://192.168.1.100:8080"
}'
```

#### Request SSL Certificate

```bash
ubus call luci.vhost-manager request_cert '{
  "domain": "app.example.com",
  "email": "admin@example.com"
}'
```

#### List Certificates

```bash
ubus call luci.vhost-manager list_certs
```

#### Reload Nginx

```bash
ubus call luci.vhost-manager reload_nginx
```

#### Get Access Logs

```bash
ubus call luci.vhost-manager get_access_logs '{
  "domain": "app.example.com",
  "lines": 100
}'
```

## Nginx Configuration

VHost Manager generates nginx configuration files in `/etc/nginx/conf.d/`.

### Example Generated Configuration (HTTP Only)

```nginx
server {
    listen 80;
    server_name app.example.com;

    access_log /var/log/nginx/app.example.com.access.log;
    error_log /var/log/nginx/app.example.com.error.log;

    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Example Generated Configuration (HTTPS with WebSocket)

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/acme/app.example.com/fullchain.cer;
    ssl_certificate_key /etc/acme/app.example.com/app.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/app.example.com.access.log;
    error_log /var/log/nginx/app.example.com.error.log;

    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### Example with Authentication

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/acme/app.example.com/fullchain.cer;
    ssl_certificate_key /etc/acme/app.example.com/app.example.com.key;

    location / {
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/htpasswd/app.example.com;

        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL Certificate Workflow

1. **DNS Configuration**: Ensure your domain points to your router's public IP
2. **Port Forwarding**: Forward ports 80 and 443 to your router
3. **Request Certificate**: Use the Certificates tab to request a Let's Encrypt certificate
4. **Configure VHost**: Enable SSL for your virtual host
5. **Monitor Expiry**: Certificates expire after 90 days, monitor in the Certificates tab

### ACME Certificate Locations

- Certificates: `/etc/acme/{domain}/fullchain.cer`
- Private keys: `/etc/acme/{domain}/{domain}.key`
- ACME account: `/etc/acme/account.conf`

## ubus API Reference

### status()

Get VHost Manager and nginx status.

**Returns:**
```json
{
  "nginx_running": true,
  "nginx_version": "1.23.3",
  "acme_available": true,
  "acme_version": "3.0.5",
  "vhost_count": 5
}
```

### list_vhosts()

List all configured virtual hosts.

**Returns:**
```json
{
  "vhosts": [
    {
      "domain": "app.example.com",
      "backend": "http://192.168.1.100:8080",
      "upstream": "http://192.168.1.100:8080",
      "tls_mode": "acme",
      "ssl": true,
      "cert_file": "/etc/acme/app.example.com/fullchain.cer",
      "cert_expires": "2025-03-15",
      "auth": true,
      "auth_user": "admin",
      "websocket": true,
      "enabled": true,
      "config_file": "/etc/nginx/conf.d/app.example.com.conf"
    }
  ]
}
```

### get_vhost(domain)

Get details for a specific virtual host.

**Parameters:**
- `domain`: Domain name

**Returns:**
```json
{
  "domain": "app.example.com",
  "backend": "http://192.168.1.100:8080",
  "tls_mode": "acme",
  "ssl": true,
  "cert_expires": "2025-03-15",
  "cert_issuer": "R3",
  "auth": true,
  "auth_user": "admin",
  "websocket": true,
  "enabled": true
}
```

### add_vhost(payload)

Add a new virtual host.

**Parameters:**
- `domain`: Domain name (required)
- `backend`: Backend URL (required)
- `tls_mode`: `off`, `acme`, or `manual` (required)
- `auth`: Enable authentication (boolean)
- `auth_user` / `auth_pass`: Credentials when auth is enabled
- `websocket`: Enable WebSocket (boolean)
- `enabled`: Disable the vhost without deleting (boolean)
- `cert_path` / `key_path`: Required when `tls_mode=manual`

**Returns:**
```json
{
  "success": true,
  "reload_required": true
}
```

### update_vhost(payload)

Update an existing virtual host.

**Parameters:** Same as `add_vhost`. Omitted fields retain their previous value.

**Returns:**
```json
{
  "success": true,
  "reload_required": true
}
```

### delete_vhost(domain)

Delete a virtual host.

**Parameters:**
- `domain`: Domain name

**Returns:**
```json
{
  "success": true,
  "reload_required": true
}
```

### test_backend(backend)

Test connectivity to a backend server.

**Parameters:**
- `backend`: Backend URL

**Returns:**
```json
{
  "backend": "http://192.168.1.100:8080",
  "reachable": true,
  "status": "Backend is reachable"
}
```

### request_cert(domain, email)

Request a Let's Encrypt SSL certificate.

**Parameters:**
- `domain`: Domain name (required)
- `email`: Email address for ACME account (required)

**Returns:**
```json
{
  "success": true,
  "message": "Certificate requested"
}
```

### list_certs()

List all installed SSL certificates.

**Returns:**
```json
{
  "certificates": [
    {
      "domain": "app.example.com",
      "subject": "CN=app.example.com",
      "issuer": "R3",
      "expires": "2025-03-15",
      "cert_file": "/etc/acme/app.example.com/fullchain.cer"
    }
  ]
}
```

### reload_nginx()

Reload nginx configuration.

**Returns:**
```json
{
  "success": true
}
```

### get_access_logs(domain, lines)

Get nginx access logs for a domain.

**Parameters:**
- `domain`: Domain name (required)
- `lines`: Number of lines to retrieve (default: 50)

**Returns:**
```json
{
  "domain": "app.example.com",
  "logs": [
    "192.168.1.50 - - [24/Dec/2025:10:30:15 +0000] \"GET / HTTP/1.1\" 200 1234",
    "192.168.1.51 - - [24/Dec/2025:10:30:16 +0000] \"GET /api HTTP/1.1\" 200 5678"
  ]
}
```

## Troubleshooting

### Nginx Won't Start

Check nginx configuration syntax:
```bash
nginx -t
```

View nginx error log:
```bash
logread | grep nginx
```

### Certificate Request Fails

Ensure:
1. Domain DNS points to your public IP
2. Ports 80 and 443 are forwarded to your router
3. Firewall allows incoming connections on ports 80 and 443
4. No other service is using port 80 (acme.sh needs it for validation)

Check ACME logs:
```bash
cat /var/log/acme.log
```

### Backend Unreachable

Test backend manually:
```bash
curl -I http://192.168.1.100:8080
```

Check if backend is listening:
```bash
netstat -tuln | grep 8080
```

### WebSocket Not Working

Ensure:
1. WebSocket support is enabled in virtual host configuration
2. Backend application supports WebSocket
3. No proxy timeouts are too short (default: 86400s)

### Authentication Not Working

Check htpasswd file exists:
```bash
ls -l /etc/nginx/.luci-app-vhost-manager_{domain}
```

Regenerate htpasswd file:
```bash
# Update UCI entry
uci set vhosts.myapp.auth='1'
uci set vhosts.myapp.auth_user='newuser'
uci set vhosts.myapp.auth_pass='newpass'
uci commit vhosts

# Trigger config regeneration
ubus call luci.vhost-manager update_vhost '{
  "domain": "myapp.example.com",
  "auth": true,
  "auth_user": "newuser",
  "auth_pass": "newpass"
}'
```

## Security Considerations

1. **SSL Certificates**: Always use HTTPS for production services
2. **Strong Passwords**: Use strong passwords for HTTP Basic Authentication
3. **Backend Security**: Ensure backend services are not directly accessible from the internet
4. **Firewall Rules**: Configure firewall to only allow necessary ports
5. **Log Monitoring**: Regularly review access logs for suspicious activity
6. **Certificate Renewal**: Monitor certificate expiry and ensure auto-renewal is working

## License

Apache-2.0

## Maintainer

SecuBox Project <support@secubox.com>

## Version

2.0.0
