# SecuBox Meta Cataloger

Virtual library system that aggregates MetaBlogizer sites, Streamlit apps, and other services into a unified catalog organized by themed **Virtual Books**.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    META CATALOGER                                │
│              "Bibliothèque Virtuelle SecuBox"                   │
├─────────────────────────────────────────────────────────────────┤
│  📚 VIRTUAL BOOKS (auto-generated collections)                  │
│  ├── 🔮 Divination & I-Ching                                    │
│  │   ├── lldh360.maegia.tv (HERMÈS·360 Oracle)                 │
│  │   └── yijing.gk2.secubox.in                                 │
│  ├── 🎮 Interactive Visualizations                              │
│  │   └── wall.maegia.tv (MAGIC·CHESS·360)                      │
│  ├── 📊 Data & Analytics                                        │
│  │   └── control.gk2.secubox.in (SecuBox Control)              │
│  └── 📝 Publications & Blogs                                    │
│      └── gandalf.maegia.tv                                      │
└─────────────────────────────────────────────────────────────────┘
```

## CLI Commands

```bash
# Full catalog sync (scan + index + assign books + generate landing)
metacatalogctl sync

# Scan specific source
metacatalogctl scan                    # All sources
metacatalogctl scan metablogizer       # MetaBlogizer sites only
metacatalogctl scan streamlit          # Streamlit apps only

# Index management
metacatalogctl index list              # List all indexed entries
metacatalogctl index show <id>         # Show entry details
metacatalogctl index refresh           # Rebuild index

# Virtual books
metacatalogctl books list              # List all books with entry counts
metacatalogctl books show <book-id>    # Show book contents

# Search
metacatalogctl search <query>          # Full-text search across catalog

# Maintenance
metacatalogctl status                  # Show catalog statistics
metacatalogctl landing                 # Regenerate landing page only
```

## UCI Configuration

The configuration is in `/etc/config/metacatalog`:

```uci
config metacatalog 'main'
    option enabled '1'
    option data_dir '/srv/metacatalog'
    option auto_scan_interval '3600'
    option landing_path '/www/metacatalog/index.html'

# Content sources
config source 'metablogizer'
    option enabled '1'
    option type 'metablogizer'
    option path '/srv/metablogizer/sites'

config source 'streamlit'
    option enabled '1'
    option type 'streamlit'
    option config '/etc/config/streamlit-forge'

# Virtual book definitions
config book 'divination'
    option name 'Divination & I-Ching'
    option icon '🔮'
    option color '#cc00ff'
    option description 'Outils oraculaires et systèmes divinatoires'
    list keywords 'iching'
    list keywords 'oracle'
    list keywords 'divination'
    list domain_patterns 'lldh'
    list domain_patterns 'yijing'

config book 'visualization'
    option name 'Interactive Visualizations'
    option icon '🎮'
    option color '#00ff88'
    list keywords 'canvas'
    list keywords 'animation'
    list domain_patterns 'wall'
```

## File Structure

```
/etc/config/metacatalog          # UCI configuration
/usr/sbin/metacatalogctl         # CLI tool
/srv/metacatalog/
├── index.json                   # Main catalog index
├── books.json                   # Virtual books with entries
├── entries/                     # Individual entry JSON files
│   ├── lldh360-maegia-tv.json
│   └── ...
└── cache/                       # Scan cache
/www/metacatalog/
├── index.html                   # Landing page (Tao prism theme)
└── api/
    ├── index.json               # API: all entries
    └── books.json               # API: all books
```

## Default Virtual Books

| ID | Name | Icon | Keywords |
|----|------|------|----------|
| divination | Divination & I-Ching | 🔮 | iching, oracle, hexagram, yijing, bazi |
| visualization | Interactive Visualizations | 🎮 | canvas, animation, 3d, game |
| analytics | Data & Analytics | 📊 | dashboard, data, analytics, metrics |
| publications | Publications & Blogs | 📝 | blog, article, press, news |
| security | Security Tools | 🛡️ | security, waf, firewall, crowdsec |
| media | Media & Entertainment | 🎬 | video, audio, streaming, media |

## Auto-Assignment

Entries are automatically assigned to books based on:
- **Keywords**: Matched against entry title, description, and extracted keywords
- **Domain patterns**: Matched against the entry domain name

Configure rules in UCI:
```bash
uci add_list metacatalog.divination.keywords='tarot'
uci add_list metacatalog.divination.domain_patterns='tarot'
uci commit metacatalog
metacatalogctl sync
```

## Cron Integration

Hourly auto-sync is configured via `/etc/cron.d/metacatalog`:
```
0 * * * * root /usr/sbin/metacatalogctl sync --quiet >/dev/null 2>&1
```

## API Access

Landing page and JSON APIs are available at:
- Landing: `https://secubox.in/metacatalog/`
- Entries: `https://secubox.in/metacatalog/api/index.json`
- Books: `https://secubox.in/metacatalog/api/books.json`

## Dependencies

- `jsonfilter` - JSON parsing (libubox)
- `coreutils-stat` - File timestamps

## Integration

- **MetaBlogizer**: Auto-scans `/srv/metablogizer/sites/` for published sites
- **Streamlit Forge**: Reads `/etc/config/streamlit-forge` for app definitions
- **HAProxy**: Checks vhost SSL/WAF status for exposure info
