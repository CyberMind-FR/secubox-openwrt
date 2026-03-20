[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox P2P 网状网络

具有集成备份、恢复和联邦功能的 SecuBox 设备分布式点对点网状网络。

## 概述

SecuBox P2P 允许多个 SecuBox 设备形成分布式网状网络，用于：

- **服务发现**：自动发现并连接到对等 SecuBox 节点
- **配置同步**：在网状网络中共享和同步配置
- **分布式备份**：通过 Gitea 集成进行版本控制备份
- **自恢复**：从现有备份启动新设备
- **MaaS 联邦**：分布式安全基础设施的 Mesh-as-a-Service

## 架构

```
                    +-------------------+
                    |   Gitea 服务器    |
                    |  （版本控制）     |
                    +---------+---------+
                              |
        +---------------------+---------------------+
        |                     |                     |
   +----v----+           +----v----+           +----v----+
   | SecuBox |<--------->| SecuBox |<--------->| SecuBox |
   | 节点 A  |           | 节点 B  |           | 节点 C  |
   | (主节点)|           | (对等)  |           | (对等)  |
   +---------+           +---------+           +---------+
        |                     |                     |
   WireGuard             WireGuard             WireGuard
    隧道                   隧道                   隧道
```

## 功能特性

### 网状网络

| 功能 | 描述 |
|------|------|
| **对等发现** | 基于 mDNS/DNS-SD 的自动对等发现 |
| **WireGuard VPN** | 节点间加密网状隧道 |
| **HAProxy 负载均衡** | 网状服务负载均衡 |
| **DNS 集成** | 网状感知 DNS 解析 |

### 备份与恢复

| 功能 | 描述 |
|------|------|
| **Gitea 集成** | 基于 Git 的版本化备份 |
| **15 种组件类型** | 全面的设备备份 |
| **引导脚本** | 新设备一键恢复 |
| **历史追踪** | 完整的变更审计跟踪 |

### 拓扑模式

- **全网状**：每个节点连接到其他所有节点
- **星型**：中央枢纽与辐条连接
- **环形**：与邻居连接的环形拓扑
- **树形**：父子层次结构

## 安装

```bash
opkg update
opkg install secubox-p2p luci-app-secubox-p2p
```

## 配置

### UCI 配置

```bash
# /etc/config/secubox-p2p

config p2p 'settings'
    option enabled '1'
    option node_name 'secubox-node'
    option discovery_enabled '1'
    option sync_interval '300'

config gitea 'gitea'
    option enabled '1'
    option server_url 'http://localhost:3000'
    option repo_owner 'admin'
    option repo_name 'secubox-backup'
    option access_token 'your-token-here'
    option auto_backup '1'
    option backup_interval '3600'
```

### 手动配置

```bash
# 启用 P2P 网状网络
uci set secubox-p2p.settings.enabled='1'
uci set secubox-p2p.settings.node_name='my-secubox'
uci commit secubox-p2p

# 配置 Gitea 备份
uci set secubox-p2p.gitea.enabled='1'
uci set secubox-p2p.gitea.server_url='http://gitea.local:3000'
uci set secubox-p2p.gitea.repo_owner='admin'
uci set secubox-p2p.gitea.repo_name='secubox-backup'
uci set secubox-p2p.gitea.access_token='your-token'
uci commit secubox-p2p

# 重启服务
/etc/init.d/secubox-p2p restart
```

## 使用方法

### 命令行

```bash
# 对等管理
secubox-p2p peers              # 列出连接的对等节点
secubox-p2p discover           # 发现新对等节点
secubox-p2p add-peer <addr>    # 手动添加对等节点

# 服务管理
secubox-p2p services           # 列出本地服务
secubox-p2p shared-services    # 列出网状共享服务

# 同步操作
secubox-p2p sync               # 与所有对等节点同步
```

### RPCD API

所有功能通过 ubus 可用：

```bash
# 对等操作
ubus call luci.secubox-p2p get_peers
ubus call luci.secubox-p2p discover '{"timeout":5}'
ubus call luci.secubox-p2p add_peer '{"address":"10.0.0.2","name":"peer1"}'

# Gitea 备份
ubus call luci.secubox-p2p push_gitea_backup '{"message":"每日备份"}'
ubus call luci.secubox-p2p pull_gitea_backup '{"commit_sha":"abc123"}'
ubus call luci.secubox-p2p list_gitea_repos
ubus call luci.secubox-p2p get_gitea_commits '{"limit":10}'

# 本地备份
ubus call luci.secubox-p2p create_local_backup '{"name":"pre-upgrade"}'
ubus call luci.secubox-p2p list_local_backups
ubus call luci.secubox-p2p restore_local_backup '{"backup_id":"20260130-120000"}'
```

## 备份组件

备份系统捕获 15 个组件类别：

| 组件 | 路径 | 描述 |
|------|------|------|
| `configs` | `/etc/config/` | UCI 配置文件 |
| `profiles` | `/usr/share/secubox/profiles/` | 部署配置文件 |
| `presets` | `/etc/secubox/presets/` | 设置预设 |
| `manifests` | `/etc/secubox/manifests/` | 应用清单 |
| `scripts` | `/usr/share/secubox/scripts/` | 自定义脚本 |
| `macros` | `/etc/secubox/macros/` | 自动化宏 |
| `workflows` | `/etc/secubox/workflows/` | CI/CD 工作流 |
| `packages` | - | 已安装软件包列表 |
| `services` | - | 服务状态 |
| `cron` | `/etc/crontabs/` | 计划任务 |
| `ssh` | `/etc/dropbear/` | SSH 密钥和配置 |
| `certificates` | `/etc/acme/`, `/etc/ssl/` | TLS 证书 |
| `haproxy` | `/etc/haproxy/` | 负载均衡器配置 |
| `dns` | `/etc/dnsmasq.d/` | DNS 配置 |
| `device` | - | 硬件/系统信息 |

## 自恢复

### 快速引导

一键将 SecuBox 部署到新的 OpenWrt 设备：

```bash
# 从 Gitea 仓库
wget -qO- http://gitea.local:3000/user/repo/raw/branch/main/bootstrap.sh | sh

# 或使用 curl
curl -sL http://gitea.local:3000/user/repo/raw/branch/main/bootstrap.sh | sh
```

### 手动恢复

```bash
# 交互模式
secubox-restore -i

# 直接恢复
secubox-restore http://gitea.local:3000 admin secubox-backup [token]

# 从特定分支恢复
secubox-restore -b develop http://gitea.local:3000 admin secubox-backup
```

### 恢复选项

```
secubox-restore [options] <server-url> <repo-owner> <repo-name> [token]

选项：
  -i, --interactive      带提示的交互模式
  -b, --branch <name>    要恢复的 Git 分支（默认：main）
  --include-network      同时恢复 network/wireless/firewall 配置
  -h, --help             显示帮助信息
```

## LuCI Web 界面

访问 P2P Hub：**SecuBox > P2P 网状网络 > Hub**

### 仪表板功能

- **Globe 可视化**：交互式网状拓扑视图
- **状态指示器**：系统、DNS、WireGuard、负载均衡器状态
- **对等计数器**：连接的对等节点、在线节点、共享服务
- **快速操作**：发现、全部同步、添加对等节点、自身对等

### Gitea 集成选项卡

- **仓库设置**：配置 Gitea 服务器和凭据
- **自动备份**：启用计划备份
- **提交历史**：查看带恢复选项的备份历史
- **令牌生成**：创建具有正确作用域的访问令牌

## 安全性

### 认证

- Gitea 令牌需要特定作用域：
  - `write:repository` - 推送备份
  - `read:user` - 验证身份
  - `write:user` - 创建令牌（用于自动设置）

### 加密

- 所有网状流量通过 WireGuard 加密
- Gitea 通信使用 HTTPS（推荐）
- SSH 密钥安全备份

### 访问控制

- RPCD ACL 控制 API 访问
- 每用户 Gitea 权限
- 网络级防火墙规则

## 故障排除

### 常见问题

**对等发现不工作：**
```bash
# 检查 mDNS/avahi
/etc/init.d/avahi-daemon status

# 验证防火墙允许 mDNS（端口 5353/udp）
uci show firewall | grep mdns
```

**Gitea 备份失败：**
```bash
# 测试 API 连接
curl -s http://gitea:3000/api/v1/user \
  -H "Authorization: token YOUR_TOKEN"

# 检查令牌作用域
ubus call luci.secubox-p2p get_gitea_config
```

**WireGuard 隧道无法建立：**
```bash
# 检查 WireGuard 状态
wg show

# 验证对等密钥
uci show wireguard
```

### 日志

```bash
# P2P 服务日志
logread | grep secubox-p2p

# RPCD 日志
logread | grep rpcd
```

## API 参考

### 对等管理

| 方法 | 参数 | 描述 |
|------|------|------|
| `get_peers` | - | 列出所有对等节点 |
| `add_peer` | `address`, `name` | 添加新对等节点 |
| `remove_peer` | `peer_id` | 移除对等节点 |
| `discover` | `timeout` | 发现对等节点 |

### Gitea 操作

| 方法 | 参数 | 描述 |
|------|------|------|
| `get_gitea_config` | - | 获取 Gitea 设置 |
| `set_gitea_config` | `config` | 更新设置 |
| `create_gitea_repo` | `name`, `description`, `private` | 创建仓库 |
| `list_gitea_repos` | - | 列出仓库 |
| `get_gitea_commits` | `limit` | 获取提交历史 |
| `push_gitea_backup` | `message`, `components` | 推送备份 |
| `pull_gitea_backup` | `commit_sha` | 从提交恢复 |

### 本地备份

| 方法 | 参数 | 描述 |
|------|------|------|
| `create_local_backup` | `name`, `components` | 创建备份 |
| `list_local_backups` | - | 列出备份 |
| `restore_local_backup` | `backup_id` | 恢复备份 |

## 贡献

1. Fork 仓库
2. 创建功能分支
3. 进行更改
4. 在 OpenWrt 设备上测试
5. 提交 pull request

## 许可证

GPL-2.0 - 详见 LICENSE 文件。

## 相关项目

- [SecuBox Core](../secubox-core/) - SecuBox 核心功能
- [LuCI App SecuBox](../luci-app-secubox/) - 主仪表板
- [LuCI App SecuBox P2P](../luci-app-secubox-p2p/) - P2P Web 界面
- [SecuBox Gitea](../luci-app-gitea/) - Gitea 容器管理
