# SecuBox mitmproxy App

LXC container with mitmproxy for HTTPS traffic inspection and threat detection.

## Multi-Instance Support

SecuBox supports multiple mitmproxy instances for different traffic flows:

| Instance | Purpose | Proxy Port | Web Port | Mode |
|----------|---------|------------|----------|------|
| **out** | LAN → Internet (outbound proxy) | 8888 | 8089 | transparent |
| **in** | WAN → Services (WAF/reverse) | 8889 | 8090 | upstream |

### Instance Commands

```bash
# List all instances
mitmproxyctl list-instances

# Status of specific instance
mitmproxyctl status out
mitmproxyctl status in

# Shell into instance
mitmproxyctl shell in

# Start/stop instances (via init.d)
/etc/init.d/mitmproxy start
/etc/init.d/mitmproxy stop
```

### UCI Configuration

Instances are configured in `/etc/config/mitmproxy`:

```
config instance 'out'
    option enabled '1'
    option description 'LAN->Internet Proxy'
    option container_name 'mitmproxy-out'
    option proxy_port '8888'
    option web_port '8089'
    option mode 'transparent'

config instance 'in'
    option enabled '1'
    option description 'WAF/Reverse Proxy'
    option container_name 'mitmproxy-in'
    option proxy_port '8889'
    option web_port '8090'
    option mode 'upstream'
    option haproxy_backend '1'
```

## Components

| Component | Description |
|-----------|-------------|
| **LXC Containers** | Debian-based containers with mitmproxy (one per instance) |
| **secubox_analytics.py** | Threat detection addon for mitmproxy |
| **haproxy_router.py** | HAProxy backend routing addon |
| **CrowdSec Integration** | Threat logging for automatic IP banning |

## Threat Detection Patterns

### Attack Types Detected

| Category | Patterns |
|----------|----------|
| **SQL Injection** | UNION SELECT, OR 1=1, SLEEP(), BENCHMARK() |
| **XSS** | `<script>`, event handlers, javascript: URLs |
| **Command Injection** | ; cat, \| ls, backticks, $() |
| **Path Traversal** | ../, %2e%2e/, file:// |
| **SSRF** | Internal IPs, metadata endpoints |
| **XXE** | <!ENTITY, SYSTEM, file:// |
| **LDAP Injection** | )(|, )(&, objectclass=* |
| **Log4Shell** | ${jndi:, ${env:, ldap:// |
| **SSTI** | {{...}}, ${...}, <%...%> |
| **Prototype Pollution** | __proto__, constructor[ |
| **GraphQL Abuse** | Deep nesting, introspection |
| **JWT Attacks** | alg:none, exposed tokens |

### CVE Detection

| CVE | Description |
|-----|-------------|
| CVE-2021-44228 | Log4Shell (Log4j RCE) |
| CVE-2021-41773 | Apache path traversal |
| CVE-2022-22965 | Spring4Shell |
| CVE-2023-34362 | MOVEit SQL injection |
| CVE-2024-3400 | PAN-OS command injection |
| CVE-2024-21887 | Ivanti Connect Secure |
| CVE-2024-1709 | ScreenConnect auth bypass |
| CVE-2024-27198 | TeamCity auth bypass |

### Scanner Detection

Detects security scanners: sqlmap, nikto, nuclei, burpsuite, nmap, dirb, gobuster, ffuf, etc.

## CrowdSec Integration

Threats are logged to `/data/threats.log` (mounted as `/srv/mitmproxy/threats.log` on host).

CrowdSec scenarios:
- `secubox/mitmproxy-attack` - Bans after 3 high/critical attacks
- `secubox/mitmproxy-scanner` - Bans aggressive scanners
- `secubox/mitmproxy-ssrf` - Bans external SSRF attempts
- `secubox/mitmproxy-cve` - Immediate ban for CVE exploits

## GeoIP

Install GeoLite2-Country.mmdb to `/srv/mitmproxy/` for country detection:
```bash
curl -sL "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb" \
  -o /srv/mitmproxy/GeoLite2-Country.mmdb
```

## File Paths

| Path | Description |
|------|-------------|
| `/srv/mitmproxy/` | Host bind mount directory |
| `/srv/mitmproxy/threats.log` | CrowdSec threat log |
| `/srv/mitmproxy/addons/` | mitmproxy addon scripts |
| `/srv/mitmproxy/GeoLite2-Country.mmdb` | GeoIP database |

## HAProxy Integration & Routing

### Traffic Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      INTERNET                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  HAProxy (ports 80/443)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Frontend: Receives HTTPS requests                        │   │
│  │ ACL: Route by Host header to vhosts                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Backend: mitmproxy_inspector (127.0.0.1:8889)            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  mitmproxy LXC Container (port 8889)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ haproxy_router.py: Routes by Host header                 │   │
│  │ secubox_analytics.py: Threat detection                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│           Logs threats to /data/threats.log                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Services                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Gitea   │  │ Streamlit│  │ Glances  │  │  LuCI    │        │
│  │  :3000   │  │  :8501   │  │  :61208  │  │  :8081   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Sync Routes Command

Syncs HAProxy vhost configurations to mitmproxy routing table:

```bash
mitmproxyctl sync-routes
```

This generates `/srv/mitmproxy/haproxy-routes.json`:

```json
{
  "devel.cybermind.fr": ["192.168.255.1", 3000],
  "play.cybermind.fr": ["192.168.255.1", 8501],
  "glances.maegia.tv": ["192.168.255.1", 61208],
  "factory.maegia.tv": ["192.168.255.1", 7331]
}
```

### HAProxy Integration Commands

| Command | Description |
|---------|-------------|
| `mitmproxyctl haproxy-enable` | Enable threat inspection for all vhosts |
| `mitmproxyctl haproxy-disable` | Disable inspection, restore direct backends |
| `mitmproxyctl sync-routes` | Regenerate routes from current HAProxy config |

### Enabling HAProxy Inspection

```bash
# Enable inspection mode
mitmproxyctl haproxy-enable

# This will:
# 1. Create mitmproxy_inspector backend (127.0.0.1:8889)
# 2. Store original backends in UCI (haproxy.$vhost.original_backend)
# 3. Redirect all vhosts through mitmproxy
# 4. Sync route mappings
# 5. Restart services
```

### Ports

| Port | Instance | Service |
|------|----------|---------|
| 8888 | out | Proxy port (LAN outbound) |
| 8889 | in | Proxy port (HAProxy/WAF) |
| 8089 | out | mitmweb UI (outbound) |
| 8090 | in | mitmweb UI (WAF) |

### haproxy_router.py Addon

The router addon:
- Loads routes from `/data/haproxy-routes.json`
- Routes requests by Host header to real backends
- Stores original host in `flow.metadata['original_host']`
- Falls back to LuCI (127.0.0.1:8081) for unknown hosts

### Route File Format

```json
{
  "hostname": ["ip", port],
  "*.wildcard.domain": ["ip", port]
}
```

Supports wildcard matching with `*.domain.tld` patterns.

## Dependencies

- `lxc` - Container runtime
- `crowdsec` - Threat intelligence (optional)
- `geoip2` - Python GeoIP library (optional)
