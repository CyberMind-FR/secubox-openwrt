# SecuBox Wazuh Manager

Complete Wazuh SIEM/XDR stack in LXC container for SecuBox.

## Components

| Component | Description | Port |
|-----------|-------------|------|
| **Wazuh Manager** | Agent management, log analysis, threat detection | 1514, 1515, 55000 |
| **Wazuh Indexer** | OpenSearch-based alert storage and search | 9200 |
| **Wazuh Dashboard** | Web UI for visualization and management | 5601 |

## Requirements

- **RAM**: 4GB+ recommended (minimum 2GB)
- **Storage**: 20GB+ for indexes
- **LXC**: Container support on OpenWrt

## Quick Start

```bash
# Install Wazuh Manager (takes 10-15 minutes)
wazuh-managerctl install

# Start the container
wazuh-managerctl start

# Configure HAProxy for external access
wazuh-managerctl configure-haproxy

# Check status
wazuh-managerctl status
```

## CLI Reference

### Installation
| Command | Description |
|---------|-------------|
| `wazuh-managerctl install` | Create and setup Wazuh LXC container |
| `wazuh-managerctl uninstall` | Remove container and data |
| `wazuh-managerctl upgrade` | Upgrade to latest version |

### Service Control
| Command | Description |
|---------|-------------|
| `wazuh-managerctl start` | Start container |
| `wazuh-managerctl stop` | Stop container |
| `wazuh-managerctl restart` | Restart container |
| `wazuh-managerctl status` | Show status |

### Configuration
| Command | Description |
|---------|-------------|
| `wazuh-managerctl configure-haproxy` | Setup HAProxy vhost |
| `wazuh-managerctl configure-firewall` | Open firewall ports |

### Agent Management
| Command | Description |
|---------|-------------|
| `wazuh-managerctl list-agents` | List registered agents |
| `wazuh-managerctl agent-info <id>` | Show agent details |
| `wazuh-managerctl remove-agent <id>` | Remove agent |

### API & Monitoring
| Command | Description |
|---------|-------------|
| `wazuh-managerctl api-status` | Check API status |
| `wazuh-managerctl api-token` | Generate API token |
| `wazuh-managerctl logs [service]` | Show logs |
| `wazuh-managerctl alerts [n]` | Show recent alerts |
| `wazuh-managerctl stats` | Cluster statistics |

### Shell Access
| Command | Description |
|---------|-------------|
| `wazuh-managerctl shell` | Open bash in container |
| `wazuh-managerctl exec <cmd>` | Execute command |

## UCI Configuration

```
config wazuh_manager 'main'
    option enabled '1'
    option container_name 'wazuh'
    option lxc_path '/srv/lxc'
    option data_path '/srv/wazuh'

config network 'network'
    option ip_address '192.168.255.50'
    option gateway '192.168.255.1'
    option bridge 'br-lan'

config ports 'ports'
    option manager '1514'
    option api '55000'
    option dashboard '5601'
```

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │       Wazuh LXC Container           │
                    │                                     │
  Agents ──────────►│  ┌─────────────┐  ┌─────────────┐  │
  (1514/TCP)        │  │   Manager   │  │   Indexer   │  │
                    │  │  Analysis   │──│  OpenSearch │  │
  API ─────────────►│  └─────────────┘  └─────────────┘  │
  (55000/HTTPS)     │         │                │         │
                    │         ▼                ▼         │
  Dashboard ───────►│      ┌───────────────────────┐     │
  (5601/HTTP)       │      │      Dashboard        │     │
                    │      │   Visualization UI    │     │
                    │      └───────────────────────┘     │
                    └─────────────────────────────────────┘
```

## Connecting Agents

On SecuBox (with secubox-app-wazuh installed):

```bash
# Configure agent to connect to manager
wazuhctl configure 192.168.255.50

# Register agent
wazuhctl register

# Start agent
wazuhctl start
```

## Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| Dashboard | admin | admin |
| API | wazuh | wazuh |

**Change passwords after installation!**

## HAProxy Integration

After running `wazuh-managerctl configure-haproxy`:

- Dashboard: `https://wazuh.gk2.secubox.in`
- Uses wildcard SSL certificate
- WAF bypass enabled for WebSocket support

## Data Persistence

Data is stored outside the container:

| Path | Contents |
|------|----------|
| `/srv/wazuh/manager` | Agent keys, rules, decoders |
| `/srv/wazuh/indexer` | Alert indexes |

## Integration with SecuBox

- **CrowdSec**: Agents monitor CrowdSec logs
- **File Integrity**: Monitor `/etc/config`, `/etc/init.d`
- **Firewall**: Analyze firewall logs
- **HAProxy**: Track web traffic patterns

## References

- [Wazuh Documentation](https://documentation.wazuh.com/)
- [Wazuh GitHub](https://github.com/wazuh/wazuh)
- [Wazuh Docker](https://github.com/wazuh/wazuh-docker)
