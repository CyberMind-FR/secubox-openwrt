# LuCI Mail Server Manager

Unified web dashboard for SecuBox mail server, webmail, and mesh backup.

## Features

- **Server Status**: Container state, domain, users, storage, SSL, mesh
- **Port Monitoring**: SMTP (25), Submission (587), SMTPS (465), IMAPS (993), POP3S (995)
- **User Management**: Add/delete mail accounts with mailbox stats
- **Alias Management**: Create email forwarding aliases
- **DNS Setup**: One-click MX, SPF, DMARC record creation
- **SSL Setup**: ACME DNS-01 certificate automation
- **Webmail Integration**: Configure Roundcube container
- **Mesh Backup**: P2P backup synchronization

## Installation

```bash
opkg install luci-app-mailserver
```

## Location

**Services → Mail Server**

## RPCD Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `status` | - | Get server status (state, domain, users, ports, SSL) |
| `user_list` | - | List mail users with mailbox stats |
| `alias_list` | - | List email aliases |
| `webmail_status` | - | Get webmail container status |
| `logs` | `lines` | Get mail server logs |
| `install` | - | Install mail server container |
| `start` | - | Start mail server |
| `stop` | - | Stop mail server |
| `restart` | - | Restart mail server |
| `user_add` | `email`, `password` | Add mail user |
| `user_del` | `email` | Delete mail user |
| `user_passwd` | `email`, `password` | Change user password |
| `alias_add` | `alias`, `target` | Add email alias |
| `dns_setup` | - | Create MX/SPF/DMARC records |
| `ssl_setup` | - | Obtain SSL certificate |
| `webmail_configure` | - | Configure Roundcube |
| `mesh_backup` | - | Create mesh backup |
| `mesh_sync` | `mode` | Sync with mesh (push/pull) |

## Dashboard Sections

### Server Status
- Container running state
- Domain FQDN
- User count
- Storage usage
- SSL certificate validity
- Webmail status
- Mesh backup status
- Port status indicators

### Quick Actions
- Start/Stop server
- Setup DNS records
- Setup SSL certificate
- Configure webmail
- Create mesh backup

### Mail Users
- Email address
- Mailbox size
- Message count
- Delete action

### Email Aliases
- Alias address
- Forward target

## Dependencies

- `secubox-app-mailserver` - Backend CLI
- `luci-base` - LuCI framework
