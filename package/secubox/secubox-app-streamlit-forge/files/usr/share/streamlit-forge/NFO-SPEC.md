# SecuBox Module Manifest (NFO) Specification

## Overview

The NFO format is a flat-file UCI-style manifest for SecuBox modules (Streamlit apps, MetaBlogs, etc.). It provides:

- **Human-readable** metadata with ASCII art headers
- **Machine-parseable** key=value pairs
- **AI-friendly** dynamics section for generative content integration
- **Flat-file** storage requiring no database

## File Location

```
/srv/streamlit/apps/<app>/README.nfo    # Streamlit apps
/srv/metablogizer/sites/<site>/README.nfo  # MetaBlog sites
```

## Format Syntax

### Sections

Sections are defined with brackets:
```
[section_name]
key=value
another_key=another value
```

### Comments

Lines starting with `#` are comments:
```
# This is a comment
key=value  # Inline comments not supported
```

### Multi-line Values (Heredoc)

Use heredoc syntax for multi-line content:
```
long_description=<<EOF
This is a multi-line value.
It continues until the EOF marker.
EOF
```

### Data Types

All values are strings. Interpreters should handle:
- Booleans: `0`/`1`, `true`/`false`, `yes`/`no`
- Lists: comma-separated values
- Numbers: numeric strings

## Section Reference

### [identity]

Module identification (REQUIRED).

| Key | Type | Description |
|-----|------|-------------|
| id | string | Unique identifier (alphanumeric, dashes) |
| name | string | Display name |
| version | semver | Version (e.g., 1.0.0) |
| author | string | Author name |
| maintainer | email | Contact email |
| created | date | Creation date (YYYY-MM-DD) |
| updated | date | Last update date |
| license | string | License identifier (MIT, GPL, etc.) |

### [description]

Module description.

| Key | Type | Description |
|-----|------|-------------|
| short | string | One-line description |
| long | heredoc | Detailed multi-line description |

### [tags]

Classification and discoverability.

| Key | Type | Description |
|-----|------|-------------|
| category | string | Primary category |
| subcategory | string | Secondary category |
| keywords | csv | Comma-separated keywords |
| audience | string | Target audience |
| maturity | enum | stable, beta, alpha, experimental |
| language | string | Primary language code (fr, en, etc.) |

### [runtime]

Execution configuration (REQUIRED).

| Key | Type | Description |
|-----|------|-------------|
| type | enum | streamlit, metablog, hexo, static, python, node, docker |
| framework | string | Framework and version constraint |
| python | string | Python version constraint |
| entrypoint | path | Main entry file |
| port | number/auto | Port number or "auto" |
| memory | size | Memory limit (512M, 1G) |
| cpu_limit | float | CPU core limit |
| timeout | seconds | Request timeout |
| workers | number | Worker processes |

### [dependencies]

Package dependencies.

| Key | Type | Description |
|-----|------|-------------|
| python | csv | Python packages (pip) |
| system | csv | System commands required |
| opkg | csv | OpenWrt packages |
| pip_extra | string | Extra pip install flags |

### [exposure]

Network exposure settings.

| Key | Type | Description |
|-----|------|-------------|
| auto_expose | bool | Auto-create vhost on install |
| domain_prefix | string | Subdomain prefix |
| ssl | bool | Enable SSL |
| auth_required | bool | Require authentication |
| auth_method | enum | basic, oauth, jwt |
| waf_enabled | bool | Enable WAF protection |
| rate_limit | string | Rate limit (100/min) |

### [launcher]

On-demand launcher settings.

| Key | Type | Description |
|-----|------|-------------|
| on_demand | bool | Enable on-demand startup |
| priority | number | Priority (1-100, higher=keep longer) |
| always_on | bool | Never auto-stop |
| idle_timeout | minutes | Idle timeout before stop |
| startup_timeout | seconds | Max startup wait time |
| health_check | path | Health check endpoint |

### [references]

External links.

| Key | Type | Description |
|-----|------|-------------|
| homepage | url | Project homepage |
| documentation | url | Documentation URL |
| source | url | Source code repository |
| issues | url | Issue tracker |
| changelog | url | Changelog URL |

### [settings]

Custom app settings.

| Key | Type | Description |
|-----|------|-------------|
| theme | string | Default theme |
| locale | string | Default locale |
| debug | bool | Debug mode |
| * | any | App-specific settings |

### [dynamics]

**AI Integration Section** - For generative content systems.

| Key | Type | Description |
|-----|------|-------------|
| prompt_context | heredoc | Context for AI assistants |
| capabilities | csv | What the app can do |
| input_types | csv | Accepted input formats |
| output_types | csv | Generated output formats |
| hooks_pre | csv | Pre-processing hooks |
| hooks_post | csv | Post-processing hooks |
| hooks_transform | csv | Transform hooks |
| data_sources | csv | Available data sources |
| api_endpoints | csv | Exposed API endpoints |

#### Example Dynamics Section

```nfo
[dynamics]
prompt_context=<<EOF
This app is a data visualization dashboard for system metrics.
It can display CPU, memory, and network usage.
Users can ask for charts, comparisons, or export data.
EOF

capabilities=data-visualization,export-csv,real-time-updates
input_types=json,api,prometheus
output_types=charts,tables,csv,pdf
data_sources=local,influxdb,prometheus
api_endpoints=/api/metrics,/api/export
```

### [mesh]

Mesh network publishing.

| Key | Type | Description |
|-----|------|-------------|
| publish | bool | Publish to mesh catalog |
| visibility | enum | public, private, unlisted |
| share_data | bool | Share data across mesh |
| federation | enum | local, mesh, global |

### [media]

Visual assets.

| Key | Type | Description |
|-----|------|-------------|
| icon | path/url | App icon |
| thumbnail | path/url | Preview thumbnail |
| screenshots | csv | Screenshot paths/URLs |
| demo_video | url | Demo video URL |
| banner | path/url | Banner image |

## CLI Usage

### Streamlit Forge

```bash
# Generate NFO for existing app
slforge nfo init myapp

# View NFO summary
slforge nfo info myapp

# Edit NFO
slforge nfo edit myapp

# Validate NFO
slforge nfo validate myapp

# Export as JSON
slforge nfo json myapp

# Install app from directory with NFO
slforge nfo install /path/to/app
```

### Bundled Installer

Apps can include `install.sh` which reads the NFO:

```bash
cd /path/to/myapp
./install.sh          # Install
./install.sh uninstall # Uninstall
./install.sh info      # Show info
```

## Parser Library

Source the parser in shell scripts:

```sh
. /usr/share/streamlit-forge/lib/nfo-parser.sh

# Parse NFO file
nfo_parse "/path/to/README.nfo"

# Get values
name=$(nfo_get identity name)
port=$(nfo_get runtime port "8501")

# Export to UCI
nfo_to_uci "runtime" "streamlit-forge" "myapp"

# Export to JSON
nfo_to_json identity description tags runtime
```

## Integration Examples

### Hub Generator

```sh
# In hub-generator: read NFO for dynamic content
for app in /srv/streamlit/apps/*/; do
    nfo_file="$app/README.nfo"
    [ -f "$nfo_file" ] || continue

    nfo_parse "$nfo_file"
    name=$(nfo_get identity name)
    desc=$(nfo_get description short)
    category=$(nfo_get tags category)
    icon=$(nfo_get media icon)

    # Generate card with rich metadata...
done
```

### Generative AI Context

```sh
# Provide context to AI assistant
nfo_parse "$app/README.nfo"
context=$(nfo_get dynamics prompt_context)
capabilities=$(nfo_get dynamics capabilities)

# Build AI prompt
echo "App capabilities: $capabilities"
echo "Context: $context"
```

## Version History

- **1.0.0** (2025-03-14): Initial specification
