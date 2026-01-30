# SecuBox Console & Frontend

**Remote Management Point for SecuBox Devices**

Two applications for centralized management of multiple SecuBox devices:

1. **secubox-console** - CLI-focused management tool
2. **secubox-frontend** - Modern TUI dashboard with Textual

KISS modular self-enhancing architecture.

## Features

- **Device Discovery** - Automatic network scanning for SecuBox nodes
- **Multi-Device Management** - Manage multiple SecuBox devices from one console
- **Remote Commands** - Execute commands on any device via SSH
- **Mesh Integration** - P2P mesh sync and catalog management
- **Snapshot Orchestration** - Trigger and manage backups across devices
- **Live Dashboard** - Real-time TUI with device status
- **Plugin System** - Extend functionality with custom plugins
- **Self-Updating** - Auto-update from mesh network

## Installation

### On SecuBox (OpenWrt)
```bash
opkg install secubox-console
```

### On Any PC (Python)
```bash
# Clone or copy secubox_console.py
pip install paramiko rich httpx

# Run
python3 secubox_console.py
```

## Usage

### Interactive Dashboard
```bash
secubox-console
```

### Commands
```bash
# Device Management
secubox-console discover           # Scan network for devices
secubox-console add mybox 192.168.1.1
secubox-console remove mybox
secubox-console list

# Status & Monitoring
secubox-console status             # All devices
secubox-console status mybox       # Specific device

# Remote Execution
secubox-console connect mybox      # SSH shell
secubox-console exec mybox "uptime"
secubox-console mybox "df -h"      # Shortcut

# Backup & Recovery
secubox-console snapshot mybox
secubox-console sync               # Sync all mesh nodes

# System
secubox-console plugins            # List plugins
secubox-console update             # Self-update from mesh
secubox-console help
```

### Dashboard Keys
| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh status |
| `s` | Sync all devices |
| `d` | Run discovery |

## Configuration

Config files stored in `~/.secubox-console/`:

```
~/.secubox-console/
├── devices.json      # Saved devices
├── plugins/          # Custom plugins
├── cache/            # Cached data
└── console.log       # Log file
```

### devices.json
```json
{
  "devices": {
    "main-router": {
      "name": "main-router",
      "host": "192.168.255.1",
      "port": 22,
      "user": "root",
      "node_id": "1b61036323",
      "mesh_enabled": true
    }
  }
}
```

## Plugin Development

Create plugins in `~/.secubox-console/plugins/`:

```python
# my_plugin.py

PLUGIN_INFO = {
    "name": "my-plugin",
    "version": "1.0.0",
    "description": "My custom plugin",
    "author": "Your Name",
    "commands": ["mycommand"]
}

def register_commands(console):
    """Register plugin commands with console"""
    console.register_command("mycommand", cmd_mycommand, "My command description")

def cmd_mycommand(args):
    """Handler for mycommand"""
    print("Hello from my plugin!")
    # Access console.devices, console.ssh_exec(), etc.
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  SecuBox Console                     │
├─────────────────────────────────────────────────────┤
│  Core Commands    │  Plugin System   │  SSH Manager │
├───────────────────┼──────────────────┼──────────────┤
│  Device Store     │  Mesh Client     │  TUI (rich)  │
└─────────────────────────────────────────────────────┘
         │                   │
         ▼                   ▼
   ┌──────────┐       ┌──────────┐
   │ SecuBox  │  ...  │ SecuBox  │
   │  Node 1  │       │  Node N  │
   └──────────┘       └──────────┘
```

## Requirements

- Python 3.8+
- `paramiko` - SSH connections
- `rich` - TUI dashboard (optional)
- `httpx` - HTTP/mesh API calls (optional)

## License

MIT License - CyberMind 2026
