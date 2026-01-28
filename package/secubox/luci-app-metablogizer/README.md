# 📝 MetaBlogizer - Static Site Publisher

One-click static website hosting with automatic HAProxy vhosts, SSL certificates, and Gitea sync.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 **Auto Vhost** | Creates HAProxy vhost + backend automatically |
| 🔒 **ACME SSL** | Automatic Let's Encrypt certificates |
| 📦 **Gitea Sync** | Pull from Gitea repositories |
| 📤 **File Upload** | Drag & drop file uploads |
| 📊 **Health Status** | DNS, certificate, and publish monitoring |
| 🔗 **QR Codes** | Share sites with QR codes |

## 🚀 Quick Start

### Create a Site via LuCI

1. Go to **Services → MetaBlogizer**
2. Click **+ New Site**
3. Fill in:
   - **Site Name**: `myblog`
   - **Domain**: `blog.example.com`
   - **Gitea Repo**: `user/repo` (optional)
4. Click **Create**

### What Happens Automatically

```
┌─────────────────────────────────────────────────────┐
│  📝 Create Site "myblog" @ blog.example.com         │
├─────────────────────────────────────────────────────┤
│  1. 📁 Create /srv/metablogizer/sites/myblog/       │
│  2. 🌐 Create HAProxy backend (metablog_myblog)     │
│  3. 🔗 Create HAProxy vhost (blog.example.com)      │
│  4. 🔒 Request ACME certificate                     │
│  5. 📄 Generate default index.html                  │
│  6. ✅ Site live at https://blog.example.com        │
└─────────────────────────────────────────────────────┘
```

## 📊 Dashboard

### Web Hosting Status Panel

The dashboard shows real-time health for all sites:

| Site | Domain | DNS | Resolved IP | Certificate | Status |
|------|--------|-----|-------------|-------------|--------|
| myblog | blog.example.com | 🌐 ok | 185.220.x.x | 🔒 45d | ✅ published |
| docs | docs.example.com | ❌ failed | - | ⚪ missing | 🕐 pending |

### Status Indicators

| Icon | DNS Status | Meaning |
|------|------------|---------|
| 🌐 | ok | DNS resolves to your public IP |
| ⚠️ | private | DNS points to private IP (192.168.x.x) |
| ❗ | mismatch | DNS points to different public IP |
| ❌ | failed | DNS resolution failed |

| Icon | Cert Status | Meaning |
|------|-------------|---------|
| 🔒 | ok | Certificate valid (30+ days) |
| ⚠️ | warning | Certificate expiring (7-30 days) |
| 🔴 | critical | Certificate critical (<7 days) |
| 💀 | expired | Certificate expired |
| ⚪ | missing | No certificate |

| Icon | Publish Status | Meaning |
|------|----------------|---------|
| ✅ | published | Site enabled with content |
| 🕐 | pending | Site enabled, no content yet |
| 📝 | draft | Site disabled |

## 📁 File Management

### Upload Files

1. Click **Upload** on a site card
2. Drag & drop files or click to browse
3. Check "Set first HTML as homepage" to use as index.html
4. Click **Upload**

### Manage Files

1. Click **Files** on a site card
2. View all uploaded files
3. 🏠 Set any HTML file as homepage
4. 🗑️ Delete files

## 🔄 Gitea Sync

### Setup

1. Create/edit a site
2. Enter Gitea repository: `username/repo`
3. Click **Sync** to pull latest

### Auto-Sync

The site syncs from Gitea on:
- Manual sync button click
- Webhook push (if configured)

```bash
# Manual sync via CLI
ubus call luci.metablogizer sync_site '{"id":"site_myblog"}'
```

## 📤 Share & QR

Click **Share** on any site to get:
- 📋 Copy URL to clipboard
- 📱 QR code for mobile access
- 🐦 Twitter share
- 💼 LinkedIn share
- 📘 Facebook share
- ✈️ Telegram share
- 📱 WhatsApp share
- ✉️ Email share

## 🔧 Configuration

### UCI Settings

```bash
# /etc/config/metablogizer

config metablogizer 'main'
    option enabled '1'
    option runtime 'auto'           # auto | uhttpd | nginx
    option sites_root '/srv/metablogizer/sites'
    option nginx_container 'nginx'
    option gitea_url 'http://192.168.255.1:3000'

config site 'site_myblog'
    option name 'myblog'
    option domain 'blog.example.com'
    option gitea_repo 'user/myblog'
    option ssl '1'
    option enabled '1'
    option description 'My personal blog'
    option port '8901'
    option runtime 'uhttpd'
```

### Runtime Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **uhttpd** | OpenWrt's built-in web server | Default, lightweight |
| **nginx** | Nginx in LXC container | Advanced features |
| **auto** | Auto-detect available runtime | Recommended |

## 📡 RPCD API

### Site Management

```bash
# List all sites
ubus call luci.metablogizer list_sites

# Create site
ubus call luci.metablogizer create_site '{
  "name": "myblog",
  "domain": "blog.example.com",
  "gitea_repo": "user/myblog",
  "ssl": "1",
  "description": "My blog"
}'

# Sync from Gitea
ubus call luci.metablogizer sync_site '{"id":"site_myblog"}'

# Delete site
ubus call luci.metablogizer delete_site '{"id":"site_myblog"}'
```

### Health Monitoring

```bash
# Get hosting status for all sites
ubus call luci.metablogizer get_hosting_status

# Response:
{
  "success": true,
  "public_ip": "185.220.101.12",
  "haproxy_status": "running",
  "sites": [{
    "id": "site_myblog",
    "name": "myblog",
    "domain": "blog.example.com",
    "dns_status": "ok",
    "dns_ip": "185.220.101.12",
    "cert_status": "ok",
    "cert_days": 45,
    "publish_status": "published"
  }]
}

# Check single site health
ubus call luci.metablogizer check_site_health '{"id":"site_myblog"}'
```

### File Operations

```bash
# List files in site
ubus call luci.metablogizer list_files '{"id":"site_myblog"}'

# Upload file (base64 content)
ubus call luci.metablogizer upload_file '{
  "id": "site_myblog",
  "filename": "style.css",
  "content": "Ym9keSB7IGJhY2tncm91bmQ6ICNmZmY7IH0="
}'
```

## 📁 File Locations

| Path | Description |
|------|-------------|
| `/etc/config/metablogizer` | UCI configuration |
| `/srv/metablogizer/sites/` | Site content directories |
| `/srv/metablogizer/sites/<name>/index.html` | Site homepage |
| `/usr/libexec/rpcd/luci.metablogizer` | RPCD backend |

## 🛠️ Troubleshooting

### Site Shows 503

1. Check HAProxy is running: `lxc-info -n haproxy`
2. Check backend port is listening
3. Verify uhttpd instance: `uci show uhttpd | grep metablog`

### DNS Not Resolving

1. Verify A record points to your public IP
2. Check with: `nslookup blog.example.com`
3. Wait for DNS propagation (up to 48h)

### Certificate Missing

1. Ensure DNS resolves correctly first
2. Ensure ports 80/443 accessible from internet
3. Check ACME logs: `logread | grep acme`

### Gitea Sync Fails

1. Verify Gitea URL: `uci get metablogizer.main.gitea_url`
2. Check repository exists and is public
3. Test manually: `git clone http://192.168.255.1:3000/user/repo.git`

## 📜 License

MIT License - Copyright (C) 2025 CyberMind.fr
