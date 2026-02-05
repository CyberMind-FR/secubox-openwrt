# SecuBox DNS Guard

AI-powered DNS anomaly detection daemon for SecuBox OpenWrt security appliances.

## Features

### Anomaly Detection Algorithms

| Detector | Description |
|----------|-------------|
| **DGA Detection** | Identifies Domain Generation Algorithm patterns using Shannon entropy analysis |
| **DNS Tunneling** | Detects data exfiltration via DNS using subdomain length and encoding patterns |
| **Rate Anomaly** | Flags clients with unusual query rates or unique domain counts |
| **Known Bad** | Matches domains against curated threat intelligence blocklists |
| **TLD Anomaly** | Identifies suspicious TLDs and punycode/IDN homograph attacks |

### AI-Powered Analysis

- LocalAI integration for intelligent threat assessment
- Automated severity classification (Critical/High/Medium/Low)
- Domain classification (BLOCK/MONITOR/SAFE)
- Pattern analysis and malware family identification
- Natural language explanations of threats

### Approval Workflow

- Auto-apply mode for trusted detections (mitmproxy-style)
- Queue mode for human approval (CrowdSec/WAF-style)
- Per-detector confidence thresholds
- Detailed audit trail of blocked domains

## Installation

```bash
opkg update
opkg install secubox-dns-guard
```

## Configuration

Edit `/etc/config/dns-guard`:

```
config dns-guard 'main'
    option enabled '1'
    option interval '60'                    # Analysis interval (seconds)
    option localai_url 'http://127.0.0.1:8081'
    option localai_model 'tinyllama-1.1b-chat-v1.0.Q4_K_M'
    option auto_apply_blocks '0'            # 0=queue, 1=auto-apply
    option min_confidence '80'              # Minimum confidence to block
    option max_blocks_per_cycle '10'
```

### Detector Configuration

Each detector can be individually enabled/disabled with custom thresholds:

```
config detector 'dga'
    option enabled '1'
    option entropy_threshold '3.2'         # Shannon entropy threshold
    option min_length '12'                 # Minimum domain length

config detector 'tunneling'
    option enabled '1'
    option max_subdomain_length '63'
    option txt_rate_limit '10'             # TXT queries/minute

config detector 'rate_anomaly'
    option enabled '1'
    option queries_per_minute '100'
    option unique_domains_per_minute '50'
```

## CLI Usage

```bash
# Service management
/etc/init.d/dns-guard start
/etc/init.d/dns-guard stop
/etc/init.d/dns-guard status

# Manual commands
dns-guard status              # Show agent status
dns-guard run                 # Run single analysis cycle
dns-guard analyze             # Analyze without blocking
dns-guard check <domain>      # Check specific domain

# Statistics
dns-guard stats               # Query statistics
dns-guard top-domains         # Top queried domains
dns-guard top-clients         # Top DNS clients

# Block management
dns-guard list-pending        # Show pending blocks
dns-guard approve <id>        # Approve pending block
dns-guard reject <id>         # Reject pending block
dns-guard approve-all         # Approve all pending
dns-guard show-blocklist      # Show active blocklist
```

## Example Output

### Domain Check
```
$ dns-guard check k8s7g2x9m4p1n3v6.badsite.xyz

=== Domain Check: k8s7g2x9m4p1n3v6.badsite.xyz ===

DGA Detection:
  Subdomain: k8s7g2x9m4p1n3v6 (length: 16)
  Entropy: 3.58
  Result: SUSPICIOUS
  {"domain":"k8s7g2x9m4p1n3v6.badsite.xyz","type":"dga","confidence":85}

TLD Anomaly Detection:
  TLD: .xyz
  Result: SUSPICIOUS
  {"domain":"k8s7g2x9m4p1n3v6.badsite.xyz","type":"tld_anomaly","confidence":50}

=== AI Analysis ===
Risk Assessment: HIGH
Threat Type: Likely DGA-based malware C2 communication
Indicators:
- High entropy subdomain (3.58) suggesting algorithmic generation
- Suspicious TLD (.xyz) commonly abused by malware
- Pattern consistent with known DGA families
Recommendation: BLOCK
```

### Status
```
$ dns-guard status

=== DNS Guard Status ===

Enabled: Yes
Interval: 60s
LocalAI: http://127.0.0.1:8081
Model: tinyllama-1.1b-chat-v1.0.Q4_K_M

LocalAI Status: ONLINE

Auto-apply blocks: No (queued)
Min confidence: 80%
Max blocks/cycle: 10

=== Detectors ===
  dga             [ENABLED] (Domain Generation Algorithm detection)
  tunneling       [ENABLED] (DNS tunneling and exfiltration detection)
  rate_anomaly    [ENABLED] (Unusual query rate detection)
  known_bad       [ENABLED] (Known malicious domain detection)
  tld_anomaly     [ENABLED] (Unusual TLD pattern detection)

Pending blocks: 3
Active blocks: 47
Alerts (24h): 156

Last run: 2026-02-05T14:32:00+00:00
```

## Integration

### dnsmasq

DNS Guard automatically enables dnsmasq query logging on startup:

```
logqueries=1
logfacility=/var/log/dnsmasq.log
```

Blocked domains are added to `/etc/dnsmasq.d/dns-guard-blocklist.conf`.

### AdGuard Home

Optional integration for AdGuard Home users:

```
config target 'adguardhome_blocklist'
    option enabled '1'
    option output_path '/etc/adguardhome/filters/dns-guard.txt'
```

### LuCI Dashboard

Install `luci-app-dnsguard` for the web interface:

```bash
opkg install luci-app-dnsguard
```

## Files

| Path | Description |
|------|-------------|
| `/etc/config/dns-guard` | UCI configuration |
| `/usr/bin/dns-guard` | Main CLI |
| `/usr/lib/dns-guard/` | Library modules |
| `/var/lib/dns-guard/` | Runtime state (alerts, pending blocks) |
| `/etc/dnsmasq.d/dns-guard-blocklist.conf` | Generated blocklist |
| `/etc/dns-guard/blocklists/` | External blocklist files |

## Threat Intelligence

Add external blocklists to `/etc/dns-guard/blocklists/`:

```bash
# Download abuse.ch URLhaus domains
wget -O /etc/dns-guard/blocklists/urlhaus.txt \
  https://urlhaus.abuse.ch/downloads/hostfile/

# Download malware domains list
wget -O /etc/dns-guard/blocklists/malwaredomains.txt \
  https://mirror1.malwaredomains.com/files/justdomains
```

## License

Apache-2.0

## Author

CyberMind <contact@cybermind.fr>
