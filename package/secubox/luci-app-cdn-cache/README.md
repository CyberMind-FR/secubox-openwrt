# SecuBox CDN Cache

**Version:** 0.5.0
**Status:** Active

[![OpenWrt](https://img.shields.io/badge/OpenWrt-23.05+-blue.svg)](https://openwrt.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![SecuBox](https://img.shields.io/badge/SecuBox-Module-cyan.svg)](https://cybermind.fr/secubox)

A caching proxy for SecuBox that reduces bandwidth usage by caching frequently accessed content locally. Built on nginx with intelligent caching policies for different content types.

## Features

- **Transparent Caching Proxy** - Cache HTTP content automatically
- **Policy-Based Caching** - Different rules for Windows updates, Linux repos, Android apps, Steam games
- **Bandwidth Savings** - Reduce repeated downloads across all LAN clients
- **Cache Management** - Purge by domain, expire old content, preload URLs
- **Real-time Statistics** - Hit ratio, bandwidth saved, top cached domains
- **LuCI Dashboard** - Full web interface for configuration and monitoring

## Architecture

```
LAN Clients
     |
     v
[CDN Cache Proxy :3128]  <-- nginx caching proxy
     |
     v
  Internet
```

## Quick Start

```bash
# Enable and start
uci set cdn-cache.main.enabled=1
uci commit cdn-cache
/etc/init.d/cdn-cache start

# Configure clients to use proxy: 192.168.255.1:3128
```

## Configuration

### UCI Configuration

```
/etc/config/cdn-cache

config cdn_cache 'main'
    option enabled '1'
    option cache_dir '/var/cache/cdn'
    option cache_size '1024'          # Max cache size in MB
    option max_object_size '512'      # Max single object size in MB
    option cache_valid '1440'         # Default cache validity in minutes
    option listen_port '3128'         # Proxy listen port
    option transparent '0'            # Transparent proxy mode
    option log_level 'warn'

# Cache policies for specific content types
config cache_policy 'windows_update'
    option name 'Windows Update'
    option domains 'windowsupdate.com download.microsoft.com'
    option extensions 'exe msu cab msi'
    option cache_time '10080'         # 7 days
    option max_size '2048'
    option priority '10'

config cache_policy 'linux_repos'
    option name 'Linux Repositories'
    option domains 'archive.ubuntu.com deb.debian.org mirrors.kernel.org'
    option extensions 'deb rpm pkg.tar.zst'
    option cache_time '4320'          # 3 days
    option max_size '1024'
    option priority '10'

# Exclusions (never cache)
config exclusion 'banking'
    option name 'Banking Sites'
    option domains 'bank.com paypal.com'
    option reason 'Security sensitive'
```

### Client Configuration

#### Manual Proxy
Set HTTP proxy on client devices:
- **Proxy Address:** 192.168.255.1
- **Proxy Port:** 3128

#### Transparent Mode
Enable transparent mode to automatically redirect HTTP traffic:
```bash
uci set cdn-cache.main.transparent=1
uci commit cdn-cache
/etc/init.d/cdn-cache restart
```

## RPCD API

### Status & Statistics

| Method | Parameters | Description |
|--------|------------|-------------|
| `status` | - | Service status, cache info, uptime |
| `stats` | - | Hit/miss counts, bandwidth saved |
| `cache_list` | - | List cached items (top 100) |
| `top_domains` | - | Domains ranked by cache usage |
| `cache_size` | - | Used/max/free cache space |
| `bandwidth_savings` | period | Savings over time (24h/7d/30d) |
| `hit_ratio` | period | Hit ratio over time |
| `logs` | count | Recent log entries |

### Cache Management

| Method | Parameters | Description |
|--------|------------|-------------|
| `purge_cache` | - | Clear entire cache |
| `purge_domain` | domain | Clear cache for specific domain |
| `purge_expired` | - | Remove expired entries |
| `preload_url` | url | Fetch and cache a URL |
| `clear_stats` | - | Reset statistics |

### Configuration

| Method | Parameters | Description |
|--------|------------|-------------|
| `set_enabled` | enabled | Enable/disable service |
| `policies` | - | List cache policies |
| `add_policy` | name, domains, extensions, cache_time, max_size | Create policy |
| `remove_policy` | id | Delete policy |
| `exclusions` | - | List exclusions |
| `add_exclusion` | name, domains, reason | Create exclusion |
| `remove_exclusion` | id | Delete exclusion |
| `set_limits` | max_size_mb, cache_valid | Set cache limits |
| `restart` | - | Restart service |

### Examples

```bash
# Check status
ubus call luci.cdn-cache status

# Get statistics
ubus call luci.cdn-cache stats

# Purge cache for a domain
ubus call luci.cdn-cache purge_domain '{"domain":"example.com"}'

# Add a custom policy
ubus call luci.cdn-cache add_policy '{
  "name": "Game Updates",
  "domains": "cdn.steampowered.com epicgames.com",
  "extensions": "pak bundle",
  "cache_time": 10080,
  "max_size": 4096
}'

# Set cache limits (2GB, 48h validity)
ubus call luci.cdn-cache set_limits '{"max_size_mb": 2048, "cache_valid": 2880}'
```

## Nginx Cache Configuration

The service generates nginx configuration at `/var/etc/cdn-cache-nginx.conf`:

- **Cache Zone:** 64MB keys zone, configurable max size
- **Cache Levels:** 2-level directory structure for performance
- **Stale Content:** Serves stale on upstream errors (500, 502, 503, 504)
- **Cache Lock:** Prevents thundering herd on cache miss
- **Health Check:** `/cdn-cache-health` endpoint

### Response Headers

Cached responses include:
- `X-Cache-Status`: HIT, MISS, EXPIRED, STALE, UPDATING
- `X-Cache-Date`: Original response date

## Default Cache Policies

| Policy | Domains | Extensions | Duration |
|--------|---------|------------|----------|
| Windows Update | windowsupdate.com, download.microsoft.com | exe, msu, cab, msi | 7 days |
| Linux Repos | archive.ubuntu.com, deb.debian.org | deb, rpm, pkg.tar.zst | 3 days |
| Android Apps | play.googleapis.com | apk, obb | 7 days |
| Steam Games | steamcontent.com | - | 7 days |
| Static Content | * | js, css, png, jpg, woff | 1 day |

## Files

| File | Description |
|------|-------------|
| `/etc/config/cdn-cache` | UCI configuration |
| `/etc/init.d/cdn-cache` | Init script |
| `/var/etc/cdn-cache-nginx.conf` | Generated nginx config |
| `/var/cache/cdn/` | Cache storage directory |
| `/var/run/cdn-cache.pid` | PID file |
| `/var/run/cdn-cache-stats.json` | Statistics file |
| `/var/log/cdn-cache/access.log` | Access log |
| `/var/log/cdn-cache/error.log` | Error log |
| `/usr/libexec/rpcd/luci.cdn-cache` | RPCD backend |

## Troubleshooting

### Service won't start
```bash
# Check nginx syntax
nginx -t -c /var/etc/cdn-cache-nginx.conf

# Check error log
cat /var/log/cdn-cache/error.log
```

### Cache not working
```bash
# Verify proxy is listening
netstat -tlnp | grep 3128

# Test with curl
curl -x http://192.168.255.1:3128 http://example.com -I

# Check cache status header
curl -x http://192.168.255.1:3128 http://example.com -I | grep X-Cache
```

### Check cache contents
```bash
# List cached files
ls -la /var/cache/cdn/

# Cache size
du -sh /var/cache/cdn/
```

### Clear all cache
```bash
ubus call luci.cdn-cache purge_cache
# or manually
rm -rf /var/cache/cdn/*
/etc/init.d/cdn-cache restart
```

## Performance

With optimal configuration:
- **Hit Ratio:** 60-80% typical for repeated content
- **Bandwidth Savings:** 40-60% reduction
- **Latency:** < 1ms for cache hits

## Dependencies

- `nginx-full` - Nginx with proxy and cache modules
- `luci-base` - LuCI framework
- `rpcd` - RPC daemon

## Package Structure

```
luci-app-cdn-cache/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/cdn-cache/
│   │   ├── overview.js        # Main dashboard
│   │   ├── cache.js           # Cache management
│   │   ├── policies.js        # Policy configuration
│   │   ├── statistics.js      # Statistics graphs
│   │   ├── maintenance.js     # Maintenance tools
│   │   └── settings.js        # Settings
│   └── cdn-cache/
│       ├── api.js             # RPC API client
│       └── dashboard.css      # Styles
└── root/
    ├── etc/
    │   ├── config/cdn-cache   # UCI defaults
    │   └── init.d/cdn-cache   # Init script
    └── usr/
        ├── libexec/rpcd/luci.cdn-cache  # RPCD backend
        └── share/
            ├── luci/menu.d/   # LuCI menu
            └── rpcd/acl.d/    # ACL permissions
```

## License

Apache-2.0 - CyberMind.fr
