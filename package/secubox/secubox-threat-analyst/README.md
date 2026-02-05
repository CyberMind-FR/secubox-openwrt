# SecuBox Threat Analyst

AI-powered autonomous threat analysis and filter generation agent for SecuBox.

**Version**: 1.0.0
**Author**: CyberMind <devel@CyberMind.fr>

## Overview

Threat Analyst monitors security events from CrowdSec, mitmproxy, and netifyd DPI, uses LocalAI for intelligent analysis, and automatically generates filter rules for:

- **mitmproxy**: Python filter patterns for HTTP/HTTPS inspection
- **CrowdSec**: Custom scenarios and parsers
- **WAF**: JSON rule sets for web application firewall

## Features

- Real-time threat correlation across multiple sources
- AI-powered attack pattern recognition (via LocalAI)
- Automatic rule generation for mitmproxy/CrowdSec/WAF
- Approval workflow for generated rules (queue or auto-apply)
- LuCI dashboard with AI chat interface
- Periodic analysis daemon

## Installation

```sh
opkg install secubox-threat-analyst
opkg install luci-app-threat-analyst

# Enable and start daemon
uci set threat-analyst.main.enabled=1
uci commit threat-analyst
/etc/init.d/threat-analyst enable
/etc/init.d/threat-analyst start
```

## CLI Commands

```sh
threat-analyst status          # Show agent status
threat-analyst run             # Run single analysis cycle
threat-analyst daemon          # Run as background daemon
threat-analyst analyze         # Analyze threats (no rule generation)
threat-analyst generate        # Generate all rules
threat-analyst gen-mitmproxy   # Generate mitmproxy filters only
threat-analyst gen-crowdsec    # Generate CrowdSec scenario only
threat-analyst gen-waf         # Generate WAF rules only
threat-analyst list-pending    # List pending rules
threat-analyst approve <id>    # Approve pending rule
threat-analyst reject <id>     # Reject pending rule
```

## Configuration

UCI config: `/etc/config/threat-analyst`

```uci
config threat-analyst 'main'
    option enabled '1'
    option interval '300'           # Analysis interval (seconds)
    option localai_url 'http://127.0.0.1:8081'
    option localai_model 'tinyllama-1.1b-chat-v1.0.Q4_K_M'

    # Auto-apply settings
    option auto_apply_mitmproxy '1' # Auto-apply mitmproxy filters
    option auto_apply_crowdsec '0'  # Queue CrowdSec for approval
    option auto_apply_waf '0'       # Queue WAF for approval

    option min_confidence '70'      # Min AI confidence for rules
    option max_rules_per_cycle '5'  # Max rules per cycle
```

## LuCI Dashboard

Navigate to: **SecuBox → Security → Threat Analyst**

Features:
- **Status panel**: Daemon status, LocalAI status, threat counts
- **AI Chat**: Interactive chat with threat analyst AI
- **Pending rules**: Approve/reject generated rules
- **Threats table**: Recent security events

## Data Sources

| Source | Type | Path |
|--------|------|------|
| CrowdSec | Alerts | `cscli alerts list` |
| mitmproxy | Threats | `/srv/mitmproxy/threats.log` |
| netifyd | DPI | `/var/run/netifyd/status.json` |

## Generated Rules

### mitmproxy Filters
Output: `/etc/mitmproxy/ai_filters.py`

Python class with IP blocklist, URL patterns, User-Agent detection.

### CrowdSec Scenarios
Output: `/etc/crowdsec/scenarios/ai-generated.yaml`

YAML scenarios for AI-detected attack patterns.

### WAF Rules
Output: `/etc/mitmproxy/waf_ai_rules.json`

JSON rule sets for SQL injection, XSS, path traversal, scanner detection.

## Dependencies

- `secubox-mcp-server` — MCP protocol for AI integration
- `jsonfilter` — JSON parsing
- `secubox-app-localai` — LocalAI inference (recommended)
- `crowdsec` — CrowdSec integration (optional)
- `mitmproxy` — WAF integration (optional)

## Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  CrowdSec   │  │  mitmproxy  │  │   netifyd   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                ┌───────▼───────┐
                │   Collector   │
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │    LocalAI    │
                │   Analysis    │
                └───────┬───────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  mitmproxy  │  │  CrowdSec   │  │    WAF      │
│   filters   │  │  scenarios  │  │   rules     │
└─────────────┘  └─────────────┘  └─────────────┘
```

## License

MIT

## Part Of

SecuBox AI Gateway (Couche 2) — v0.18
