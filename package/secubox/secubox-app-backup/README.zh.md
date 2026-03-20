[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox 备份管理器

统一的备份系统，用于 LXC 容器、UCI 配置、服务数据和配置文件，支持 mesh 同步。

## 安装

```bash
opkg install secubox-app-backup
```

## CLI 使用

### 创建备份

```bash
# 完整备份（配置 + 容器 + 服务）
secubox-backup create --full

# 仅配置（UCI、证书）
secubox-backup create --config

# 仅容器（LXC）
secubox-backup create --containers

# 仅服务（HAProxy、mitmproxy 数据）
secubox-backup create --services
```

### 列出备份

```bash
secubox-backup list              # 所有备份
secubox-backup list --local      # 仅本地
secubox-backup list --remote     # 仅 Gitea 远程
```

### 恢复

```bash
secubox-backup restore config-20260205-120000.tar.gz
secubox-backup restore config-20260205-120000.tar.gz --dry-run
```

### 容器管理

```bash
secubox-backup container list                    # 列出 LXC 容器
secubox-backup container backup mitmproxy        # 备份特定容器
secubox-backup container restore mitmproxy /path/to/backup.tar.gz
secubox-backup container backups mitmproxy       # 列出容器的备份
```

### 配置文件管理

```bash
secubox-backup profile list          # 列出配置文件
secubox-backup profile create mysetup # 从当前配置创建
secubox-backup profile apply mysetup  # 应用配置文件
```

### 远程同步（Gitea）

```bash
secubox-backup sync --push    # 推送到 Gitea
secubox-backup sync --pull    # 列出远程备份
```

### 维护

```bash
secubox-backup status    # 显示备份状态
secubox-backup cleanup   # 删除旧备份（保留最近 10 个）
```

## UCI 配置

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
    option token '您的令牌'
    option branch 'master'
```

## 备份结构

```
/srv/backups/
+-- config/           # UCI 和证书备份
|   +-- config-YYYYMMDD-HHMMSS.tar.gz
+-- containers/       # LXC 容器备份
|   +-- mitmproxy-YYYYMMDD-HHMMSS.tar.gz
|   +-- haproxy-YYYYMMDD-HHMMSS.tar.gz
+-- services/         # 服务数据备份
|   +-- haproxy-YYYYMMDD-HHMMSS.tar.gz
+-- profiles/         # 配置文件
    +-- mysetup.json
```

## 备份内容

| 类型 | 内容 |
|------|------|
| **配置** | `/etc/config/*`、`/etc/secubox/*`、`/etc/haproxy/*`、`/srv/haproxy/certs/*`、`/etc/acme/*` |
| **容器** | 来自 `/srv/lxc/<名称>/` 的完整 LXC rootfs |
| **服务** | `/srv/haproxy/`、`/srv/mitmproxy/`、`/srv/localai/`、`/srv/gitea/` |

## 依赖项

- `lxc` - 用于容器备份/恢复
- `tar` - 存档创建
- `wget` - Gitea API 通信（可选）
