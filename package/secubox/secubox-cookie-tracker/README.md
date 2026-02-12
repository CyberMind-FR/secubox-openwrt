# SecuBox Cookie Tracker

HTTP cookie classification and tracking for SecuBox InterceptoR.

## Features

- **Cookie Extraction** - Capture cookies from HTTP traffic via mitmproxy
- **Auto-Classification** - Categorize cookies as essential, functional, analytics, advertising, or tracking
- **SQLite Database** - Persistent storage with search and filtering
- **Known Tracker Database** - 100+ pre-configured tracker domains
- **Vortex Integration** - Feed blocked domains to Vortex Firewall
- **CLI Management** - Full command-line interface for cookie management

## Installation

```bash
opkg install secubox-cookie-tracker
```

Requires `secubox-app-mitmproxy` for traffic interception.

## Quick Start

```bash
# Initialize database
cookie-trackerctl init

# View status
cookie-trackerctl status

# List cookies
cookie-trackerctl list

# Block a tracking domain
cookie-trackerctl block doubleclick.net
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `status [--json]` | Show statistics summary |
| `init [force]` | Initialize/reset database |
| `reload` | Reload tracker rules from UCI |
| `list [options]` | List cookies with filters |
| `show <domain>` | Show cookies for domain |
| `classify <domain> <name> <cat>` | Manually classify cookie |
| `block <domain>` | Block all cookies from domain |
| `unblock <domain>` | Unblock domain |
| `report [--json]` | Generate cookie report |
| `export [file]` | Export database to CSV |
| `import <file>` | Import tracker rules from TSV |
| `feed-vortex` | Feed blocked domains to Vortex |
| `stats` | Detailed statistics |

## Cookie Categories

| Category | Description | Default Action |
|----------|-------------|----------------|
| `essential` | Required for site functionality | Allow |
| `functional` | User preferences, settings | Allow |
| `analytics` | Usage tracking for site improvement | Alert |
| `advertising` | Ad targeting and retargeting | Block |
| `tracking` | Cross-site tracking, fingerprinting | Block |
| `unknown` | Not yet classified | Allow |

## mitmproxy Integration

Add the addon to your mitmproxy configuration:

```bash
# /etc/config/mitmproxy
config filtering 'filtering'
    option addon_script '/usr/lib/secubox/cookie-tracker/mitmproxy-addon.py'
```

Or load alongside the main analytics addon:

```bash
mitmdump -s /usr/lib/secubox/cookie-tracker/mitmproxy-addon.py \
         -s /srv/mitmproxy/addons/secubox_analytics.py
```

## UCI Configuration

```
# /etc/config/cookie-tracker
config cookie_tracker 'main'
    option enabled '1'
    option auto_classify '1'
    option block_tracking '0'
    option block_advertising '0'

config tracker_rule 'custom'
    option pattern '_my_tracker'
    option category 'tracking'
```

## Database Schema

```sql
CREATE TABLE cookies (
    id INTEGER PRIMARY KEY,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'unknown',
    first_seen INTEGER,
    last_seen INTEGER,
    count INTEGER DEFAULT 1,
    client_mac TEXT,
    blocked INTEGER DEFAULT 0,
    UNIQUE(domain, name)
);

CREATE TABLE tracker_domains (
    domain TEXT PRIMARY KEY,
    category TEXT,
    source TEXT
);
```

## Examples

```bash
# List all tracking cookies
cookie-trackerctl list --category tracking

# List cookies from a specific domain
cookie-trackerctl list --domain google.com

# Generate JSON report for dashboard
cookie-trackerctl report --json

# Export all data
cookie-trackerctl export /tmp/cookies.csv

# Block and sync to Vortex
cookie-trackerctl block ads.example.com
cookie-trackerctl feed-vortex
```

## Dependencies

- secubox-app-mitmproxy (for traffic interception)
- sqlite3-cli
- jsonfilter

## License

GPL-3.0
