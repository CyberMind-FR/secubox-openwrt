# LuCI Gitea Dashboard

Git hosting service management dashboard for Gitea.

## Installation

```bash
opkg install luci-app-gitea
```

## Access

LuCI menu: **Services -> Gitea**

## Tabs

- **Overview** -- Service status, container health, storage usage
- **Repositories** -- Browse and create Git repositories
- **Users** -- Manage users and admin accounts
- **Settings** -- HTTP/SSH ports, domain, data path, memory limit, registration policy

## RPCD Methods

Backend: `luci.gitea`

| Method | Description |
|--------|-------------|
| `get_status` | Service and container status |
| `get_stats` | Repository and user statistics |
| `get_config` | Get Gitea configuration |
| `save_config` | Save configuration |
| `start` | Start Gitea |
| `stop` | Stop Gitea |
| `restart` | Restart Gitea |
| `install` | Install Gitea container |
| `uninstall` | Remove Gitea container |
| `update` | Update Gitea to latest version |
| `get_logs` | Fetch service logs |
| `list_repos` | List all repositories |
| `get_repo` | Get repository details |
| `list_users` | List all users |
| `create_admin` | Create an admin account |
| `create_user` | Create a user account |
| `generate_token` | Generate API access token |
| `create_repo` | Create a new repository |
| `create_backup` | Create a data backup |
| `list_backups` | List available backups |
| `restore_backup` | Restore from backup |
| `get_install_progress` | Check installation progress |

## Dependencies

- `luci-base`
- `secubox-app-gitea`

## License

Apache-2.0
