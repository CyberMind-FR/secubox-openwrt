# SecuBox Wazuh Agent

Wazuh security monitoring agent for SecuBox. Provides endpoint detection and response (EDR), file integrity monitoring (FIM), log analysis, and SIEM integration.

## Features

- **Endpoint Detection**: Real-time threat detection on OpenWrt
- **File Integrity Monitoring**: Track changes to critical system files
- **Log Analysis**: Monitor syslog, CrowdSec, firewall logs
- **Security Configuration Assessment**: Compliance checking
- **CrowdSec Integration**: Sync threat intelligence
- **Rootcheck**: Detect rootkits and malware

## Quick Start

```bash
# Install Wazuh agent
wazuhctl install

# Configure manager connection
wazuhctl configure 192.168.1.100

# Register with manager
wazuhctl register

# Start agent
wazuhctl start

# Check status
wazuhctl status
```

## CLI Reference

### Installation
| Command | Description |
|---------|-------------|
| `wazuhctl install` | Download and install Wazuh agent |
| `wazuhctl uninstall` | Remove Wazuh agent |
| `wazuhctl upgrade` | Upgrade to latest version |

### Configuration
| Command | Description |
|---------|-------------|
| `wazuhctl configure <ip>` | Configure manager connection |
| `wazuhctl register` | Register agent with manager |
| `wazuhctl set-name <name>` | Set agent hostname |

### Service Control
| Command | Description |
|---------|-------------|
| `wazuhctl start` | Start Wazuh agent |
| `wazuhctl stop` | Stop Wazuh agent |
| `wazuhctl restart` | Restart agent |
| `wazuhctl status` | Show agent status |

### Monitoring
| Command | Description |
|---------|-------------|
| `wazuhctl info` | Show agent information |
| `wazuhctl logs [n]` | Show last n log lines |
| `wazuhctl alerts [n]` | Show recent alerts |

### Integration
| Command | Description |
|---------|-------------|
| `wazuhctl crowdsec-sync` | Sync CrowdSec alerts |
| `wazuhctl configure-fim` | Configure FIM directories |
| `wazuhctl configure-sca` | Enable SCA checks |

## UCI Configuration

```
config wazuh 'main'
    option enabled '1'
    option manager_ip '192.168.1.100'
    option manager_port '1514'
    option agent_name 'secubox'
    option protocol 'tcp'

config monitoring 'monitoring'
    option syslog '1'
    option crowdsec_alerts '1'
    option file_integrity '1'
    option rootcheck '1'

config fim 'fim'
    list directories '/etc'
    list directories '/usr/sbin'
    list directories '/etc/config'
    option realtime '1'
```

## Monitored Paths

Default File Integrity Monitoring:
- `/etc` - System configuration
- `/etc/config` - UCI configuration
- `/etc/init.d` - Init scripts
- `/usr/sbin` - System binaries

## CrowdSec Integration

Wazuh monitors CrowdSec logs for:
- Ban decisions
- Alert events
- Threat patterns

Sync manually: `wazuhctl crowdsec-sync`

## Requirements

- Wazuh Manager (external server or SecuBox LXC)
- Network connectivity to manager on port 1514 (TCP/UDP)
- ~35MB RAM for agent

## Architecture

```
SecuBox (Agent)          Wazuh Manager
+---------------+        +------------------+
| wazuhctl      |        | Wazuh Server     |
| ossec.conf    |------->| OpenSearch       |
| FIM/Rootcheck |        | Dashboard        |
+---------------+        +------------------+
```

## References

- [Wazuh Documentation](https://documentation.wazuh.com/)
- [Wazuh GitHub](https://github.com/wazuh/wazuh)
- [Agent Installation](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/)
