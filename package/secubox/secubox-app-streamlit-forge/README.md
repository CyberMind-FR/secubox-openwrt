# Streamlit Forge

Streamlit App Publishing Platform for SecuBox.

## Overview

Streamlit Forge is a comprehensive platform for creating, managing, and publishing Streamlit applications. Create apps from templates, manage instances, expose via HAProxy with SSL, and publish to the SecuBox mesh catalog.

## Features

- **App Templates** - Basic, Dashboard, Data-Viewer starter templates
- **Instance Management** - Start, stop, restart app instances
- **Port Allocation** - Automatic port assignment
- **HAProxy Integration** - One-command vhost + SSL exposure
- **Mesh Publishing** - Share apps across SecuBox mesh network
- **UCI Configuration** - Persistent app settings

## Installation

```bash
opkg install secubox-app-streamlit-forge
```

## CLI Usage

```bash
# App Management
slforge create <name> [options]
  --from-template <tpl>   # Use template (basic, dashboard, data-viewer)
  --from-upload <zip>     # Create from ZIP file
  --from-git <url>        # Clone from Git repository

slforge list              # List all apps
slforge info <app>        # Show app details
slforge delete <app>      # Remove app

# Instance Control
slforge start <app>       # Start app instance
slforge stop <app>        # Stop app instance
slforge restart <app>     # Restart app
slforge status [app]      # Show status
slforge logs <app> [-f]   # View logs

# Configuration
slforge config <app> list         # List config
slforge config <app> get <key>    # Get value
slforge config <app> set <k> <v>  # Set value

# Publishing
slforge expose <app> [--domain <d>]  # Create vhost + SSL
slforge hide <app>                   # Remove public access
slforge publish <app>                # Add to mesh catalog
slforge unpublish <app>              # Remove from mesh

# Templates
slforge templates         # List available templates
```

## Example Workflow

```bash
# 1. Create app from dashboard template
slforge create mydashboard --from-template dashboard

# 2. Start the app
slforge start mydashboard
# URL: http://192.168.255.1:8501

# 3. Expose with SSL
slforge expose mydashboard --domain mydashboard.gk2.secubox.in

# 4. Publish to mesh catalog
slforge publish mydashboard
```

## Templates

### Basic
Minimal Streamlit app with sidebar and two-column layout.

### Dashboard
Multi-page dashboard with:
- Metric cards with delta indicators
- Line and area charts
- Data table with CSV export
- Settings page

### Data-Viewer
CSV/Excel data explorer with:
- File upload (CSV, XLSX)
- Dynamic column filtering
- Histograms and scatter plots
- Statistical summary
- Correlation matrix

## Configuration

UCI config: `/etc/config/streamlit-forge`

```
config forge 'main'
    option enabled '1'
    option gitea_url 'http://127.0.0.1:3000'
    option gitea_org 'streamlit-apps'
    option apps_dir '/srv/streamlit/apps'
    option previews_dir '/srv/streamlit/previews'
    option base_domain 'apps.secubox.in'
    option default_port_start '8501'
    option default_memory '512M'

config app 'myapp'
    option name 'myapp'
    option enabled '1'
    option port '8501'
    option entrypoint 'app.py'
    option memory '512M'
    option domain 'myapp.gk2.secubox.in'
```

## App Directory Structure

```
/srv/streamlit/apps/<app>/
├── src/                  # App source code
│   ├── app.py           # Main Streamlit entry
│   ├── requirements.txt # Python dependencies
│   └── ...
├── data/                # Persistent data
└── config.json          # Runtime config
```

## LuCI Interface

Install `luci-app-streamlit-forge` for web interface at **Services > Streamlit Forge**.

Features:
- Status dashboard (running/total apps, LXC status)
- Create app dialog with template selection
- App table with Start/Stop/Open/Expose/Publish/Delete
- Auto-refresh polling

## Runtime

Apps run inside the `streamlit` LXC container:
- Apps mounted at `/srv/apps/` inside container
- Python virtualenv with Streamlit pre-installed
- Port forwarding to host network

## Dependencies

- python3, python3-pip
- lxc, lxc-common
- jsonfilter

## File Locations

| Path | Description |
|------|-------------|
| `/etc/config/streamlit-forge` | UCI configuration |
| `/usr/sbin/slforge` | CLI tool |
| `/srv/streamlit/apps/` | App source directories |
| `/srv/streamlit/previews/` | Generated previews |
| `/usr/share/streamlit-forge/templates/` | App templates |
| `/var/run/streamlit-*.pid` | PID files |
| `/var/log/streamlit-*.log` | App logs |

## Mesh Catalog Manifest

Published apps create a manifest at `/usr/share/secubox/plugins/catalog/`:

```json
{
  "id": "streamlit-myapp",
  "name": "myapp",
  "type": "streamlit-app",
  "version": "1.0.0",
  "category": "apps",
  "runtime": "streamlit",
  "actions": {
    "start": "slforge start myapp",
    "stop": "slforge stop myapp"
  }
}
```
