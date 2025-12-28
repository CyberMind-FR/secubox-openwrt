# VHost Manager - Reverse Proxy & SSL Certificate Management

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active


LuCI application for managing nginx reverse proxy virtual hosts and SSL certificates via Let's Encrypt.

## Features

### Virtual Host Management
- Create and manage nginx reverse proxy configurations
- Support for HTTP and HTTPS virtual hosts
- Backend connectivity testing before deployment
- WebSocket protocol support
- HTTP Basic Authentication
- Automatic nginx reload on configuration changes

### SSL Certificate Management
- Let's Encrypt certificate provisioning via acme.sh
- Certificate status monitoring with expiry tracking
- Color-coded expiry warnings (red < 7 days, orange < 30 days)
- Certificate details viewer
- Automatic certificate renewal support

### Access Log Monitoring
- Real-time nginx access log viewer
- Per-domain log filtering
- Configurable line display (50-500 lines)
- Terminal-style log display

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

### UCI Configuration

Edit `/etc/config/vhost_manager`:

```bash
config global 'global'
	option enabled '1'
	option auto_reload '1'
	option log_retention '30'

config vhost 'myapp'
	option domain 'app.example.com'
	option backend 'http://192.168.1.100:8080'
	option ssl '1'
	option auth '1'
	option auth_user 'admin'
	option auth_pass 'secretpassword'
	option websocket '1'
```

### Options

#### Global Section
- `enabled`: Enable/disable VHost Manager (default: 1)
- `auto_reload`: Automatically reload nginx on config changes (default: 1)
- `log_retention`: Days to retain access logs (default: 30)

#### VHost Section
- `domain`: Domain name for this virtual host (required)
- `backend`: Backend URL to proxy to (required, e.g., http://192.168.1.100:8080)
- `ssl`: Enable HTTPS (default: 0, requires valid SSL certificate)
- `auth`: Enable HTTP Basic Authentication (default: 0)
- `auth_user`: Username for authentication (required if auth=1)
- `auth_pass`: Password for authentication (required if auth=1)
- `websocket`: Enable WebSocket support (default: 0)

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
  "ssl": true,
  "auth": false,
  "websocket": true
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

VHost Manager generates nginx configuration files in `/etc/nginx/conf.d/vhosts/`.

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
      "ssl": true,
      "ssl_expires": "2025-03-15",
      "auth": false,
      "websocket": true
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
  "ssl": true,
  "ssl_expires": "2025-03-15",
  "auth": true,
  "auth_user": "admin",
  "websocket": true
}
```

### add_vhost(domain, backend, ssl, auth, websocket)

Add a new virtual host.

**Parameters:**
- `domain`: Domain name (required)
- `backend`: Backend URL (required)
- `ssl`: Enable SSL (boolean)
- `auth`: Enable authentication (boolean)
- `websocket`: Enable WebSocket (boolean)

**Returns:**
```json
{
  "success": true,
  "reload_required": true
}
```

### update_vhost(domain, backend, ssl, auth, websocket)

Update an existing virtual host.

**Parameters:** Same as add_vhost

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
  "reachable": true,
  "response_time": 45
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
  "message": "Certificate obtained successfully"
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
ls -l /etc/nginx/htpasswd/{domain}
```

Regenerate htpasswd file:
```bash
# Via UCI
uci set vhost_manager.myapp.auth_user='newuser'
uci set vhost_manager.myapp.auth_pass='newpass'
uci commit vhost_manager

# Trigger config regeneration
ubus call luci.vhost-manager update_vhost '{...}'
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

1.0.0
