# MagicMirror² Manager for SecuBox

Complete ecosystem for running and managing MagicMirror² on OpenWrt-based SecuBox systems.

## Overview

This package provides a full-featured MagicMirror² implementation including:
- **Docker-based MagicMirror²** installation and management
- **LuCI Web Interface** for module management and configuration
- **Module Manager** - Install, update, and remove MM² modules from the web UI
- **Configuration Editor** - Edit config.js with syntax highlighting and examples
- **VHost Integration** - Publish your mirror via reverse proxy with SSL
- **CLI Tools** - Command-line control for advanced users

## Components

### 1. secubox-app-magicmirror
OpenWrt package providing Docker-based MagicMirror² installation.

**Location**: `package/secubox/secubox-app-magicmirror/`

**Files**:
- `Makefile` - Package definition
- `files/etc/config/magicmirror` - UCI configuration
- `files/etc/init.d/magicmirror` - Init script
- `files/usr/sbin/magicmirrorctl` - Control script with module management

**Features**:
- Automated Docker image management
- Volume mounts for config, modules, and CSS
- CLI module management (install/remove/update)
- Configuration management (show/edit/backup/restore)

### 2. luci-app-magicmirror
LuCI web application for managing MagicMirror² modules and configuration.

**Location**: `package/secubox/luci-app-magicmirror/`

**Views**:
- **Overview** (`overview.js`) - Status dashboard, service control, basic settings
- **Modules** (`modules.js`) - Module manager with install/update/remove
- **Configuration** (`config.js`) - Config editor with validation and templates

**RPCD Backend**: `/usr/libexec/rpcd/luci.magicmirror`
- `getStatus` - Service status and statistics
- `listModules` - List installed modules
- `getConfig` - Get configuration content
- `installModule` - Install module from Git URL
- `removeModule` - Remove installed module
- `updateModule` - Update module to latest version
- `getModuleConfig` - Get module README/config
- `saveConfig` - Save configuration changes
- `restartService` - Restart MagicMirror service

### 3. Appstore Integration

**Entry in**: `luci-app-secubox/appstore/apps.json`
```json
{
  "id": "secubox-app-magicmirror",
  "name": "MagicMirror²",
  "version": "2.28.0",
  "category": "iot",
  "description": "Smart mirror platform...",
  "luci_app": "luci-app-magicmirror"
}
```

### 4. VHost Template

**Location**: `luci-app-vhost-manager/htdocs/luci-static/resources/vhost-manager/templates.json`

```json
{
  "id": "magicmirror",
  "domain": "mirror.local",
  "backend": "http://127.0.0.1:8080",
  "port": 8080,
  "app_id": "secubox-app-magicmirror",
  "websocket_support": true
}
```

### 5. Plugin Manifest

**Location**: `secubox-app/files/usr/share/secubox/plugins/catalog/magicmirror.json`

Defines package metadata, requirements, capabilities, and wizard steps.

## Installation

### Quick Install
```bash
# Build all packages
make package/secubox-app-magicmirror/compile
make package/luci-app-magicmirror/compile

# Install on router
opkg install secubox-app-magicmirror_*.ipk
opkg install luci-app-magicmirror_*.ipk

# Install and start
magicmirrorctl install
/etc/init.d/magicmirror enable
/etc/init.d/magicmirror start
```

### Via SecuBox Appstore
1. Navigate to **SecuBox → Appstore**
2. Find **MagicMirror²** in IoT category
3. Click **Install**
4. Configure via **SecuBox → IoT → MagicMirror²**

## Usage

### Web Interface

Navigate to: **SecuBox → IoT → MagicMirror²**

#### Overview Tab
- View service status and statistics
- Start/stop/restart service
- Configure basic settings (port, timezone, language, units)
- Quick access to mirror web interface

#### Modules Tab
- View all installed modules
- Install new modules from Git URLs
- Update modules to latest versions
- Remove modules
- View module information and README

**Installing a Module**:
1. Click **Install New Module**
2. Enter Git URL (e.g., `https://github.com/MichMich/MMM-WeatherChart`)
3. Click **Install**
4. Wait for installation to complete (may take a few minutes)

#### Configuration Tab
- Edit config.js in web-based editor
- Syntax validation
- Module position reference diagram
- Example configurations
- Save and auto-restart option

### Command Line

```bash
# Service management
magicmirrorctl install      # Install and configure
magicmirrorctl status       # Show container status
magicmirrorctl logs         # View logs
magicmirrorctl update       # Update to latest image

# Module management
magicmirrorctl module list  # List installed modules
magicmirrorctl module install <git-url>
magicmirrorctl module update <module-name>
magicmirrorctl module remove <module-name>
magicmirrorctl module config <module-name>  # Show config

# Configuration management
magicmirrorctl config show    # Show current config
magicmirrorctl config edit    # Edit in vi
magicmirrorctl config backup  # Backup current config
magicmirrorctl config restore # Restore from backup
magicmirrorctl config reset   # Reset to defaults
```

### VHost Setup

1. Enable MagicMirror in VHost Manager:
   - Go to **VHost Manager → Internal Services**
   - Find **MagicMirror²**
   - Click **Create**
   - Configure domain (e.g., `mirror.local`)
   - Enable SSL if desired

2. Access via domain:
   - `http://mirror.local` (or your configured domain)
   - Network Tweaks automatically handles DNS resolution

## Configuration

### UCI Config: `/etc/config/magicmirror`

```
config magicmirror 'main'
	option enabled '1'
	option image 'karsten13/magicmirror:latest'
	option config_path '/srv/magicmirror/config'
	option modules_path '/srv/magicmirror/modules'
	option css_path '/srv/magicmirror/css'
	option port '8080'
	option timezone 'UTC'
	option language 'en'
	option units 'metric'
```

### config.js Structure

Located at: `/srv/magicmirror/config/config.js`

```javascript
let config = {
	address: "0.0.0.0",
	port: 8080,
	language: "en",
	timeFormat: 24,
	units: "metric",

	modules: [
		{
			module: "clock",
			position: "top_left"
		},
		{
			module: "weather",
			position: "top_right",
			config: {
				weatherProvider: "openweathermap",
				type: "current",
				location: "Paris",
				apiKey: "YOUR_API_KEY"
			}
		}
		// Add more modules here
	]
};
```

## Module Positions

```
╔══════════════════════════════════════════════════╗
║                   top_bar                        ║
╠══════════════╦══════════════╦═════════════════════╣
║  top_left    ║  top_center  ║    top_right        ║
╠══════════════╬══════════════╬═════════════════════╣
║ upper_third  ║middle_center ║   upper_third       ║
╠══════════════╬══════════════╬═════════════════════╣
║ lower_third  ║              ║   lower_third       ║
╠══════════════╬══════════════╬═════════════════════╣
║ bottom_left  ║bottom_center ║   bottom_right      ║
╠══════════════╩══════════════╩═════════════════════╣
║                  bottom_bar                       ║
╚══════════════════════════════════════════════════╝
```

## Popular Modules

- **MMM-WeatherChart** - Weather forecast charts
- **MMM-MyCalendar** - Enhanced calendar display
- **MMM-NOAA** - NOAA weather data
- **MMM-Facial-Recognition** - Face recognition
- **MMM-Cryptocurrency** - Crypto price tracker
- **MMM-Todoist** - Todoist task manager
- **MMM-Spotify** - Spotify now playing
- **MMM-GooglePhotos** - Google Photos slideshow

[Browse all modules](https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules)

## Architecture

```
┌─────────────────────────────────────────────────┐
│          LuCI Web Interface                     │
│    (luci-app-magicmirror)                       │
│                                                   │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │  Overview   │ │   Modules    │ │  Config   │ │
│  │  Dashboard  │ │   Manager    │ │  Editor   │ │
│  └─────────────┘ └──────────────┘ └───────────┘ │
└──────────────────────┬──────────────────────────┘
                       │ UBUS RPC
                       ↓
┌─────────────────────────────────────────────────┐
│         RPCD Backend                             │
│    (/usr/libexec/rpcd/luci.magicmirror)         │
│                                                   │
│  - getStatus, listModules, getConfig            │
│  - installModule, updateModule, removeModule    │
│  - saveConfig, restartService                   │
└──────────────────────┬──────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────┐
│      Control Script                              │
│    (/usr/sbin/magicmirrorctl)                   │
│                                                   │
│  - Docker image management                      │
│  - Module installation (git clone)              │
│  - Config file editing                          │
│  - Service lifecycle                            │
└──────────────────────┬──────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────┐
│        Docker Container                          │
│    (secbx-magicmirror)                          │
│                                                   │
│  Image: karsten13/magicmirror:latest            │
│  Volumes:                                        │
│    - /srv/magicmirror/config  → /opt/...config  │
│    - /srv/magicmirror/modules → /opt/...modules │
│    - /srv/magicmirror/css     → /opt/...css     │
│  Port: 8080:8080                                │
└─────────────────────────────────────────────────┘
```

## Troubleshooting

### Mirror not accessible
1. Check service status: `magicmirrorctl status`
2. View logs: `magicmirrorctl logs -f`
3. Verify port: `uci get magicmirror.main.port`
4. Check Docker: `/etc/init.d/dockerd status`

### Module installation fails
1. Ensure git is installed: `opkg install git git-http`
2. Check Git URL is correct
3. View installation log: `cat /tmp/mm-install.log`
4. Try manual install: `magicmirrorctl module install <url>`

### Configuration not applying
1. Check config syntax (must be valid JavaScript)
2. Restart service: `/etc/init.d/magicmirror restart`
3. View container logs: `magicmirrorctl logs`
4. Restore backup if needed: `magicmirrorctl config restore`

### Container won't start
1. Check cgroups: `ls -la /sys/fs/cgroup`
2. Verify Docker is running: `/etc/init.d/dockerd status`
3. Check disk space: `df -h`
4. Pull image manually: `docker pull karsten13/magicmirror:latest`

## Resources

- **Official Site**: https://magicmirror.builders/
- **Documentation**: https://docs.magicmirror.builders/
- **3rd Party Modules**: https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules
- **Community Forum**: https://forum.magicmirror.builders/
- **GitHub**: https://github.com/MichMich/MagicMirror

## License

Apache-2.0

## Author

CyberMind Studio <contact@cybermind.fr>
