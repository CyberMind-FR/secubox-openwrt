# System Modules

SecuBox provides 14 system administration modules.

---

## Overview

| Category | Modules |
|----------|---------|
| **Dashboard** | System Hub, Portal, Admin |
| **Configuration** | SecuBox Settings, Config Vault, Config Advisor |
| **Communication** | SMTP Relay, Reporter |
| **Remote** | RTTY Remote |
| **Backup** | Backup, Cloner |
| **Management** | Users, RezApp, Cyberfeed |

---

## System Hub

**Package**: `luci-app-system-hub`

Central system dashboard.

![System Hub](../../screenshots/router/hub.png)

### Features

- System overview
- Quick actions
- Service status
- Resource graphs
- Recent alerts

---

## SecuBox Settings

**Package**: `luci-app-secubox`

Main SecuBox configuration.

![Settings](../../screenshots/router/settings.png)

### Features

- Theme selection
- Network mode
- Security settings
- Feature toggles
- Update management

---

## SecuBox Admin

**Package**: `luci-app-secubox-admin`

Admin control center.

![Admin](../../screenshots/router/admin.png)

### Features

- User management
- Access logs
- System logs
- Debug tools
- Advanced config

---

## SecuBox Portal

**Package**: `luci-app-secubox-portal`

User-facing portal.

![Portal](../../screenshots/router/portal.png)

### Features

- Welcome page
- Quick links
- Status display
- Guest access

---

## Config Vault

**Package**: `secubox-app-config-vault` + `luci-app-config-vault`

Git-based configuration backup.

![Config Vault](../../screenshots/router/config-vault.png)

### Features

- Auto-commit changes
- Git versioning
- Remote sync (Gitea)
- Restore points
- Module backups

### Modules

| Module | Contents |
|--------|----------|
| users | Users, passwords, SSH keys |
| network | Interfaces, firewall, DHCP |
| services | HAProxy, CrowdSec, apps |
| security | WAF, auth, certificates |
| system | Hostname, timezone, cron |

### CLI

```bash
configvaultctl status         # Status
configvaultctl backup         # Manual backup
configvaultctl restore <hash> # Restore commit
configvaultctl push           # Sync to remote
configvaultctl history        # View history
```

---

## Config Advisor

**Package**: `secubox-config-advisor` + `luci-app-config-advisor`

ANSSI compliance advisor.

![Config Advisor](../../screenshots/router/config-advisor.png)

### Features

- Security audit
- Compliance checking
- Recommendations
- ANSSI CSPN prep
- Report generation

### Checks

| Category | Items |
|----------|-------|
| Authentication | Password strength, 2FA |
| Encryption | TLS versions, ciphers |
| Network | Firewall rules, services |
| Access | User permissions, SSH |

---

## SMTP Relay

**Package**: `secubox-app-smtp-relay` + `luci-app-smtp-relay`

Centralized email configuration.

![SMTP](../../screenshots/router/smtp.png)

### Features

- Provider configuration
- Test email
- Multi-recipient
- TLS support
- Fallback modes

### Providers

| Provider | Type |
|----------|------|
| Gmail | OAuth/App password |
| SendGrid | API key |
| Mailgun | API key |
| Custom | SMTP credentials |
| Local | Local mailserver |

### CLI

```bash
smtp-relayctl status          # Status
smtp-relayctl test            # Send test email
smtp-relayctl configure       # Setup wizard
```

---

## Reporter

**Package**: `secubox-app-reporter` + `luci-app-reporter`

System report generator.

![Reporter](../../screenshots/router/reporter.png)

### Features

- Report generation
- Email delivery
- Scheduled reports
- Multiple formats
- KissTheme styling

### Report Types

| Type | Contents |
|------|----------|
| Development | WIP, history, roadmap |
| Services | Tor, DNS/SSL, mesh exposure |
| System | Hardware, performance |
| Security | Threats, bans, alerts |

### CLI

```bash
secubox-reportctl generate dev    # Generate report
secubox-reportctl send dev        # Email report
secubox-reportctl schedule weekly # Schedule
```

---

## RTTY Remote

**Package**: `secubox-app-rtty-remote` + `luci-app-rtty-remote`

Remote terminal access.

![RTTY](../../screenshots/router/rtty.png)

### Features

- Web terminal (ttyd)
- RPC proxy to mesh nodes
- Token-based sharing
- Session tracking
- Remote deployment

### CLI

```bash
rttyctl status                # Status
rttyctl nodes                 # List nodes
rttyctl rpc <node> <method>   # Remote RPC
rttyctl token generate        # Share token
```

---

## Backup

**Package**: `luci-app-backup`

System backup management.

![Backup](../../screenshots/router/backup.png)

### Features

- Full system backup
- Selective backup
- Restore
- Scheduled backups
- Remote storage

---

## Cloner

**Package**: `luci-app-cloner`

Device cloning.

![Cloner](../../screenshots/router/cloner.png)

### Features

- Config export
- Config import
- Mesh provisioning
- First-boot setup

---

## User Management

**Package**: `luci-app-secubox-users`

User account management.

![Users](../../screenshots/router/users.png)

### Features

- User accounts
- Group management
- Permissions
- SSH keys
- Password policies

---

## RezApp

**Package**: `secubox-app-rezapp` + `luci-app-rezapp`

Docker to LXC converter.

![RezApp](../../screenshots/router/rezapp.png)

### Features

- Docker image import
- LXC conversion
- UCI config generation
- HAProxy integration
- Offline mode

### CLI

```bash
rezappctl search <term>       # Search Docker Hub
rezappctl import <image>      # Import image
rezappctl convert <name>      # Convert to LXC
rezappctl run <name>          # Start container
```

---

## Cyberfeed

**Package**: `secubox-app-cyberfeed` + `luci-app-cyberfeed`

Threat feed manager.

![Cyberfeed](../../screenshots/router/cyberfeed.png)

### Features

- Feed subscriptions
- Auto-update
- CrowdSec integration
- Custom feeds
- Alert notifications

---

## Configuration

### Enable Config Vault

```bash
# Initialize
configvaultctl init

# Enable auto-backup
uci set config-vault.main.auto_backup='1'
uci set config-vault.main.interval='hourly'
uci commit config-vault

# Configure remote
uci set config-vault.git.remote='git@git.example.com:user/config.git'
uci commit config-vault
```

### Configure SMTP

```bash
# Setup Gmail
smtp-relayctl configure gmail

# Or manual
uci set smtp-relay.main.provider='custom'
uci set smtp-relay.main.host='smtp.example.com'
uci set smtp-relay.main.port='587'
uci set smtp-relay.main.user='user@example.com'
uci set smtp-relay.main.password='secret'
uci commit smtp-relay
```

---

See also:
- [Security Modules](Security.md)
- [AI Modules](AI.md)
- [Architecture](../Architecture.md)

---

*SecuBox v1.0.0*
