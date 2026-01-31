# 📰 Hexo CMS - Blog Publishing Platform

Full-featured Hexo blog management with multi-instance support, Gitea integration, HAProxy publishing, and Tor hidden services.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Post Editor** | Create, edit, publish posts with markdown |
| 📁 **Categories/Tags** | Organize content hierarchically |
| 🖼️ **Media Library** | Manage images and assets |
| 🎨 **Theme Config** | Edit Hexo theme settings |
| 🚀 **One-Click Deploy** | Generate and deploy with single click |
| 🔗 **HAProxy Integration** | Auto-publish to clearnet with SSL |
| 🧅 **Tor Hidden Services** | Publish to .onion addresses |
| 📦 **Gitea Sync** | Push/pull from Git repositories |
| 🧙 **Publishing Profiles** | Wizard presets for common setups |
| 📊 **Health Monitoring** | Pipeline status and diagnostics |

## 🚀 Quick Start Wizard

### Publishing Profiles

Choose a preset to configure your blog:

| Profile | Icon | HAProxy | Tor | Use Case |
|---------|------|---------|-----|----------|
| 🌐 **Blog** | 📰 | ✅ SSL | ❌ | Public blog with custom domain |
| 🎨 **Portfolio** | 🖼️ | ✅ SSL | ❌ | Creative showcase |
| 🔒 **Privacy** | 🧅 | ❌ | ✅ | Anonymous .onion blog |
| 🌍 **Dual** | 🌐🧅 | ✅ | ✅ | Clearnet + Tor access |
| 📚 **Documentation** | 📖 | ✅ SSL | ❌ | Technical docs site |

### Apply a Profile

```bash
# Via LuCI: Services → Hexo CMS → Profiles → Apply

# Via CLI
ubus call luci.hexojs apply_profile '{
  "instance": "default",
  "profile": "blog",
  "domain": "blog.example.com"
}'
```

## 📊 Dashboard

```
┌──────────────────────────────────────────────────────┐
│  📰 Hexo CMS                          🟢 Running     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📊 Site Stats                                       │
│  ├─ 📝 Posts: 134                                   │
│  ├─ 📁 Categories: 12                               │
│  ├─ 🏷️ Tags: 45                                     │
│  └─ 🖼️ Media: 89 files                              │
│                                                      │
│  🔗 Endpoints                                        │
│  ├─ 🏠 Local: http://192.168.255.1:4000             │
│  ├─ 🌐 Clearnet: https://blog.example.com           │
│  └─ 🧅 Tor: http://abc123xyz.onion                  │
│                                                      │
│  📈 Pipeline Health: 95/100                          │
│  ├─ ✅ Hexo Server: Running                          │
│  ├─ ✅ HAProxy: Published                            │
│  ├─ ✅ Certificate: Valid (45 days)                  │
│  └─ ✅ Gitea: Synced                                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 📝 Content Management

### Create a Post

1. Go to **Services → Hexo CMS → Posts**
2. Click **+ New Post**
3. Fill in:
   - **Title**: My First Post
   - **Category**: tech/tutorials
   - **Tags**: hexo, blog
   - **Content**: Your markdown here
4. Click **Save Draft** or **Publish**

### Post Front Matter

```yaml
---
title: My First Post
date: 2025-01-28 10:30:00
categories:
  - tech
  - tutorials
tags:
  - hexo
  - blog
---

Your content here...
```

### List Posts via CLI

```bash
ubus call luci.hexojs list_posts '{"instance":"default","limit":10}'
```

## 🚀 Publishing Pipeline

### Full Publish Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Edit   │ → │ Generate│ → │ Deploy  │ → │  Live   │
│  Posts  │    │  HTML   │    │ HAProxy │    │ Online  │
└─────────┘    └─────────┘    │   Tor   │    └─────────┘
                              └─────────┘
```

### Commands

```bash
# Generate static files
ubus call luci.hexojs generate '{"instance":"default"}'

# Deploy to HAProxy (clearnet)
ubus call luci.hexojs publish_to_haproxy '{
  "instance": "default",
  "domain": "blog.example.com"
}'

# Deploy to Tor (.onion)
ubus call luci.hexojs publish_to_tor '{"instance":"default"}'

# Full pipeline (generate + deploy all)
ubus call luci.hexojs full_publish '{
  "instance": "default",
  "domain": "blog.example.com",
  "tor": true
}'
```

## 🔗 HAProxy Integration

### Publish to Clearnet

1. Go to **Hexo CMS → Publishing**
2. Enter domain: `blog.example.com`
3. Check **Enable SSL**
4. Click **Publish to HAProxy**

### What Happens

1. ✅ Creates HAProxy backend → `hexo_default`
2. ✅ Creates HAProxy server → `127.0.0.1:4000`
3. ✅ Creates vhost → `blog.example.com`
4. ✅ Requests ACME certificate
5. ✅ Reloads HAProxy

### Check HAProxy Status

```bash
ubus call luci.hexojs get_haproxy_status '{"instance":"default"}'

# Response:
{
  "published": true,
  "domain": "blog.example.com",
  "ssl": true,
  "cert_status": "valid",
  "cert_days": 45,
  "dns_status": "ok"
}
```

## 🧅 Tor Hidden Services

### Create .onion Site

```bash
ubus call luci.hexojs publish_to_tor '{"instance":"default"}'
```

### Get Onion Address

```bash
ubus call luci.hexojs get_tor_status '{"instance":"default"}'

# Response:
{
  "enabled": true,
  "onion_address": "abc123xyz...def.onion",
  "virtual_port": 80,
  "status": "active"
}
```

### Access via Tor Browser

```
http://abc123xyz...def.onion
```

## 📦 Gitea Integration

### Setup Gitea Sync

1. Go to **Hexo CMS → Git**
2. Enter repository: `user/myblog`
3. Configure credentials (optional)
4. Click **Clone** or **Pull**

### Webhook Auto-Deploy

Enable automatic deployment when you push to Gitea:

```bash
ubus call luci.hexojs setup_webhook '{
  "instance": "default",
  "auto_build": true
}'
```

### Git Operations

```bash
# Clone repository
ubus call luci.hexojs git_clone '{
  "instance": "default",
  "url": "http://192.168.255.1:3000/user/myblog.git"
}'

# Pull latest
ubus call luci.hexojs git_pull '{"instance":"default"}'

# Push changes
ubus call luci.hexojs git_push '{"instance":"default"}'

# View log
ubus call luci.hexojs git_log '{"instance":"default","limit":10}'
```

## 📊 Health Monitoring

### Instance Health Score

```bash
ubus call luci.hexojs get_instance_health '{"instance":"default"}'

# Response:
{
  "instance": "default",
  "score": 95,
  "status": "healthy",
  "checks": {
    "hexo_running": true,
    "content_exists": true,
    "haproxy_published": true,
    "ssl_valid": true,
    "dns_resolves": true,
    "git_clean": true
  },
  "issues": []
}
```

### Health Score Breakdown

| Check | Points | Description |
|-------|--------|-------------|
| Hexo Running | 20 | Server process active |
| Content Exists | 15 | Posts directory has content |
| HAProxy Published | 20 | Vhost configured |
| SSL Valid | 15 | Certificate not expiring |
| DNS Resolves | 15 | Domain points to server |
| Git Clean | 15 | No uncommitted changes |

### Pipeline Status

```bash
ubus call luci.hexojs get_pipeline_status

# Returns status of all instances
```

## 🔧 Configuration

### UCI Settings

```bash
# /etc/config/hexojs

config hexojs 'main'
    option enabled '1'
    option instances_root '/srv/hexojs/instances'
    option content_root '/srv/hexojs/content'

config instance 'default'
    option name 'default'
    option enabled '1'
    option port '4000'
    option theme 'landscape'
    # HAProxy
    option haproxy_enabled '1'
    option haproxy_domain 'blog.example.com'
    option haproxy_ssl '1'
    # Tor
    option tor_enabled '1'
    option tor_onion 'abc123...onion'
    # Gitea
    option gitea_repo 'user/myblog'
    option gitea_auto_build '1'
```

## 📁 File Locations

| Path | Description |
|------|-------------|
| `/etc/config/hexojs` | UCI configuration |
| `/srv/hexojs/instances/` | Instance directories |
| `/srv/hexojs/content/` | Shared content (posts, media) |
| `/srv/hexojs/content/source/_posts/` | Blog posts |
| `/srv/hexojs/content/source/images/` | Media files |
| `/usr/libexec/rpcd/luci.hexojs` | RPCD backend |

## 📡 RPCD Methods

### Content Management

| Method | Description |
|--------|-------------|
| `list_posts` | List all posts |
| `get_post` | Get single post content |
| `create_post` | Create new post |
| `update_post` | Update post content |
| `delete_post` | Delete a post |
| `publish_post` | Move draft to published |
| `search_posts` | Search posts by query |

### Site Operations

| Method | Description |
|--------|-------------|
| `generate` | Generate static HTML |
| `clean` | Clean generated files |
| `deploy` | Deploy to configured targets |
| `preview_start` | Start preview server |
| `preview_status` | Check preview server |

### Publishing

| Method | Description |
|--------|-------------|
| `publish_to_haproxy` | Publish to clearnet |
| `unpublish_from_haproxy` | Remove from HAProxy |
| `publish_to_tor` | Create Tor hidden service |
| `unpublish_from_tor` | Remove Tor service |
| `full_publish` | Complete pipeline |

### Monitoring

| Method | Description |
|--------|-------------|
| `get_instance_health` | Health score & checks |
| `get_pipeline_status` | All instances status |
| `get_instance_endpoints` | All URLs for instance |

## 🛠️ Troubleshooting

### Hexo Server Won't Start

```bash
# Check if port is in use
netstat -tln | grep 4000

# Check logs
logread | grep hexo

# Restart manually
/etc/init.d/hexojs restart
```

### Posts Not Showing

1. Check posts are in `/srv/hexojs/content/source/_posts/`
2. Verify front matter format is correct
3. Run `hexo clean && hexo generate`

### HAProxy 503 Error

1. Verify Hexo is running on expected port
2. Check HAProxy backend configuration
3. Test local access: `curl http://127.0.0.1:4000`

### Git Push Fails

1. Check credentials: `ubus call luci.hexojs git_get_credentials`
2. Verify remote URL is correct
3. Check Gitea is accessible

## 📜 License

MIT License - Copyright (C) 2025 CyberMind.fr
