# SecuBox Backup Manager

Unified backup system for LXC containers, UCI configuration, service data, and profiles with mesh sync support.

## Installation

```bash
opkg install secubox-app-backup
```

## CLI Usage

### Create Backups

```bash
# Full backup (config + containers + services)
secubox-backup create --full

# Config only (UCI, certificates)
secubox-backup create --config

# Containers only (LXC)
secubox-backup create --containers

# Services only (HAProxy, mitmproxy data)
secubox-backup create --services
```

### List Backups

```bash
secubox-backup list              # All backups
secubox-backup list --local      # Local only
secubox-backup list --remote     # Gitea remote only
```

### Restore

```bash
secubox-backup restore config-20260205-120000.tar.gz
secubox-backup restore config-20260205-120000.tar.gz --dry-run
```

### Container Management

```bash
secubox-backup container list                    # List LXC containers
secubox-backup container backup mitmproxy        # Backup specific container
secubox-backup container restore mitmproxy /path/to/backup.tar.gz
secubox-backup container backups mitmproxy       # List backups for container
```

### Profile Management

```bash
secubox-backup profile list          # List profiles
secubox-backup profile create mysetup # Create from current config
secubox-backup profile apply mysetup  # Apply profile
```

### Remote Sync (Gitea)

```bash
secubox-backup sync --push    # Push to Gitea
secubox-backup sync --pull    # List remote backups
```

### Maintenance

```bash
secubox-backup status    # Show backup status
secubox-backup cleanup   # Remove old backups (keeps last 10)
```

## UCI Configuration

```
config backup 'main'
    option enabled '1'
    option storage_path '/srv/backups'
    option retention_days '30'
    option max_backups '10'
    option compress '1'

config schedule 'daily'
    option enabled '1'
    option type 'config'
    option cron '0 3 * * *'

config schedule 'weekly'
    option enabled '1'
    option type 'full'
    option cron '0 4 * * 0'

config remote 'gitea'
    option enabled '1'
    option url 'https://git.example.com'
    option repo 'user/backups'
    option token 'your-token'
    option branch 'master'
```

## Backup Structure

```
/srv/backups/
├── config/           # UCI and certificate backups
│   └── config-YYYYMMDD-HHMMSS.tar.gz
├── containers/       # LXC container backups
│   ├── mitmproxy-YYYYMMDD-HHMMSS.tar.gz
│   └── haproxy-YYYYMMDD-HHMMSS.tar.gz
├── services/         # Service data backups
│   └── haproxy-YYYYMMDD-HHMMSS.tar.gz
└── profiles/         # Configuration profiles
    └── mysetup.json
```

## What's Backed Up

| Type | Contents |
|------|----------|
| **Config** | `/etc/config/*`, `/etc/secubox/*`, `/etc/haproxy/*`, `/srv/haproxy/certs/*`, `/etc/acme/*` |
| **Containers** | Full LXC rootfs from `/srv/lxc/<name>/` |
| **Services** | `/srv/haproxy/`, `/srv/mitmproxy/`, `/srv/localai/`, `/srv/gitea/` |

## Dependencies

- `lxc` - For container backup/restore
- `tar` - Archive creation
- `wget` - Gitea API communication (optional)
