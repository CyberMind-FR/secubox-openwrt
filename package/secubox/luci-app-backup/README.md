# LuCI Backup Manager

Web dashboard for SecuBox backup management.

## Features

- Backup status overview (storage path, usage, last backup times)
- Quick action buttons for full/config/container backups
- LXC container list with state, size, and backup count
- Backup history table with file, type, size, and date
- One-click container backup

## Installation

```bash
opkg install luci-app-backup
```

## Location

**System → Backup Manager**

## RPCD Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `status` | - | Get backup status and stats |
| `list` | `type` | List backups (all/config/containers/services) |
| `container_list` | - | List LXC containers with backup info |
| `create` | `type` | Create backup (full/config/containers/services) |
| `restore` | `file`, `dry_run` | Restore from backup file |
| `cleanup` | - | Remove old backups |
| `container_backup` | `name` | Backup specific container |
| `container_restore` | `name`, `file` | Restore specific container |

## Dependencies

- `secubox-app-backup` - Backend CLI
- `luci-base` - LuCI framework
