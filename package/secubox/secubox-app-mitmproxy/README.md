# SecuBox mitmproxy App

LXC container with mitmproxy for HTTPS traffic inspection and threat detection.

## Components

| Component | Description |
|-----------|-------------|
| **LXC Container** | Debian-based container with mitmproxy |
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

## Dependencies

- `lxc` - Container runtime
- `crowdsec` - Threat intelligence (optional)
- `geoip2` - Python GeoIP library (optional)
