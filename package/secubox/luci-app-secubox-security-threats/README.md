# SecuBox Security Threats Dashboard

## Overview

A unified LuCI dashboard that integrates **netifyd DPI security risks** with **CrowdSec threat intelligence** for comprehensive network threat monitoring and automated blocking.

## Features

- **Real-time Threat Detection**: Monitors netifyd's 52 security risk types
- **CrowdSec Integration**: Correlates with CrowdSec alerts and decisions
- **Risk Scoring**: Calculates 0-100 risk scores based on multiple factors
- **Auto-blocking**: Configurable rules for automatic threat blocking
- **Per-host Analysis**: Track threats by IP address
- **Visual Dashboard**: Stats, charts, and real-time threat table

## Architecture

```
netifyd DPI Engine → RPCD Backend → ubus API → LuCI Dashboard
                          ↓
                    CrowdSec LAPI
                          ↓
                  nftables (blocking)
```

## Dependencies

- `luci-base`: LuCI framework
- `rpcd`: Remote Procedure Call daemon
- `netifyd`: Deep Packet Inspection engine
- `crowdsec`: Threat intelligence and blocking
- `jq`: JSON processing
- `jsonfilter`: UCI-compatible JSON filtering

## Installation

1. Build the package:
```bash
cd /path/to/openwrt
make package/secubox/luci-app-secubox-security-threats/compile
```

2. Install on router:
```bash
opkg install luci-app-secubox-security-threats_*.ipk
```

3. Restart services:
```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Usage

### Access Dashboard

Navigate to: **Admin → SecuBox → Security → Threat Monitor → Dashboard**

### Configure Auto-block Rules

Edit `/etc/config/secubox_security_threats`:

```uci
config block_rule 'my_rule'
    option name 'Block Malware'
    option enabled '1'
    option threat_types 'malware'
    option duration '24h'
    option threshold '60'
```

Apply changes:
```bash
uci commit secubox_security_threats
```

### Manual Blocking

Via dashboard:
1. Click "Block" button next to threat
2. Confirm action
3. IP will be blocked via CrowdSec

Via CLI:
```bash
ubus call luci.secubox-security-threats block_threat '{"ip":"192.168.1.100","duration":"4h","reason":"Test"}'
```

### Whitelist Host

```bash
ubus call luci.secubox-security-threats whitelist_host '{"ip":"192.168.1.100","reason":"Admin workstation"}'
```

## Risk Scoring Algorithm

**Base Score (0-50):** risk_count × 10 (capped)

**Severity Weights:**
- Malware indicators (MALICIOUS_JA3, DGA): +20
- Web attacks (SQL injection, XSS): +15
- Network anomalies (RISKY_ASN, DNS tunneling): +10
- Protocol threats (BitTorrent, Mining): +5

**CrowdSec Correlation:**
- Active decision: +30

**Severity Levels:**
- Critical: ≥80
- High: 60-79
- Medium: 40-59
- Low: <40

## Threat Categories

- **malware**: Malicious JA3, DGA domains, suspicious entropy
- **web_attack**: SQL injection, XSS, RCE attempts
- **anomaly**: DNS tunneling, risky ASNs, unidirectional traffic
- **protocol**: BitTorrent, mining, Tor, unauthorized protocols
- **tls_issue**: Certificate problems, weak ciphers

## Testing

### Backend (ubus CLI)
```bash
# Test status
ubus call luci.secubox-security-threats status

# Get active threats
ubus call luci.secubox-security-threats get_active_threats

# Test blocking
ubus call luci.secubox-security-threats block_threat '{"ip":"192.168.1.100","duration":"4h","reason":"Test"}'

# Verify in CrowdSec
cscli decisions list
```

### Frontend
1. Navigate to dashboard in LuCI
2. Verify stats cards display
3. Verify threats table populates
4. Test "Block" button
5. Check real-time polling (10s refresh)

## Troubleshooting

### No threats detected
- Check if netifyd is running: `ps | grep netifyd`
- Verify netifyd data: `cat /var/run/netifyd/status.json`
- Enable netifyd risk detection in config

### Auto-blocking not working
- Check if auto-blocking is enabled: `uci get secubox_security_threats.global.auto_block_enabled`
- Verify block rules are enabled: `uci show secubox_security_threats`
- Check logs: `logread | grep security-threats`

### CrowdSec integration issues
- Check if CrowdSec is running: `ps | grep crowdsec`
- Test cscli: `cscli version`
- Verify permissions: `ls -l /usr/bin/cscli`

## Files

**Backend:**
- `/usr/libexec/rpcd/luci.secubox-security-threats` - RPCD backend (mode 755)
- `/etc/config/secubox_security_threats` - UCI configuration

**Frontend:**
- `/www/luci-static/resources/secubox-security-threats/api.js` - API wrapper
- `/www/luci-static/resources/view/secubox-security-threats/dashboard.js` - Dashboard view

**Configuration:**
- `/usr/share/luci/menu.d/luci-app-secubox-security-threats.json` - Menu
- `/usr/share/rpcd/acl.d/luci-app-secubox-security-threats.json` - Permissions

**Runtime:**
- `/tmp/secubox-threats-history.json` - Threat history (volatile)

## License

Apache-2.0

## Authors

CyberMind.fr - Gandalf

## Version

1.0.0 (2026-01-07)
