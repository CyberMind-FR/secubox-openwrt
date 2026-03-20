# OpenWrt 24.10+ CrowdSec 集成 (SecuBox)

🌐 **Languages:** [English](../DOCS/CROWDSEC-OPENWRT-24.md) | [Français](../DOCS-fr/CROWDSEC-OPENWRT-24.md) | 中文

## 概述

本文档涵盖了支持 fw4/nftables 的 OpenWrt 24.10+ 完整 CrowdSec 安全解决方案集成。该集成由两个软件包组成：

1. **secubox-crowdsec-setup**: 自动安装脚本
2. **luci-app-secubox-crowdsec**: LuCI Web 界面仪表板

## 要求

### 硬件
- 最低 256MB 内存
- 最低 50MB 可用闪存
- ARM64、ARMv7、x86_64 或 MIPS 架构

### 软件
- OpenWrt 24.10 或更高版本
- fw4 with nftables (OpenWrt 24.10+ 默认)
- 初始设置需要网络连接

## 快速安装

### 方法 1: 使用安装脚本

```bash
# 安装依赖
opkg update
opkg install secubox-crowdsec-setup

# 运行自动化设置
secubox-crowdsec-setup --install
```

### 方法 2: 手动安装

```bash
# 更新软件包列表
opkg update

# 安装所需软件包
opkg install crowdsec crowdsec-firewall-bouncer syslog-ng

# 安装 LuCI 仪表板 (可选)
opkg install luci-app-secubox-crowdsec
```

## 架构

```
                    +-----------------------+
                    |    OpenWrt 系统       |
                    +-----------------------+
                             |
              +--------------+--------------+
              |                             |
      +-------v-------+           +---------v---------+
      |   syslog-ng   |           |   logread -f      |
      | (UDP 5140)    |           |   (备用)          |
      +-------+-------+           +---------+---------+
              |                             |
              +-------------+---------------+
                            |
                    +-------v-------+
                    |   CrowdSec    |
                    | (LAPI :8080)  |
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
      +-------v-------+          +--------v--------+
      |   本地 CAPI   |          |   CrowdSec      |
      | (黑名单)      |          |   Hub (解析器,  |
      +---------------+          |   场景)         |
                                 +-----------------+
                                          |
                            +-------------v-------------+
                            | crowdsec-firewall-bouncer |
                            |    (nftables 模式)        |
                            +-------------+-------------+
                                          |
                                 +--------v--------+
                                 |  nftables fw4   |
                                 |  (crowdsec/     |
                                 |   crowdsec6)    |
                                 +-----------------+
```

## 组件

### 1. syslog-ng 配置

位于 `/etc/syslog-ng/syslog-ng.conf`，此配置：
- 通过 Unix socket 捕获所有系统日志
- 通过 UDP 端口 5140 将日志转发到 CrowdSec
- 将本地副本写入 `/tmp/log/` 用于调试

监控的关键来源：
- 系统日志 (`/dev/log`)
- 内核消息 (`/proc/kmsg`)
- 认证日志 (SSH, 登录尝试)

### 2. CrowdSec 引擎

配置目录: `/etc/crowdsec/`

主要组件：
- **config.yaml**: 主配置文件
- **acquis.d/**: 采集配置文件
- **parsers/**: 日志解析规则
- **scenarios/**: 攻击检测场景
- **hub/**: 下载的 hub 内容

数据存储: `/srv/crowdsec/data/`

### 3. 防火墙 Bouncer

配置: `/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml`

创建 nftables 表：
- `ip crowdsec`: IPv4 阻断
- `ip6 crowdsec6`: IPv6 阻断

### 4. LuCI 仪表板

访问路径: **服务 > CrowdSec**

功能：
- 带服务状态的仪表板
- 活动决策（封禁）管理
- 安全告警查看器
- 集合管理
- 设置配置

## UCI 配置

UCI 配置文件 `/etc/config/crowdsec` 包含：

```uci
config crowdsec 'crowdsec'
    option enabled '1'
    option data_dir '/srv/crowdsec/data'
    option db_path '/srv/crowdsec/data/crowdsec.db'

config acquisition 'acquisition'
    option syslog_enabled '1'
    option firewall_enabled '1'
    option ssh_enabled '1'
    option http_enabled '0'

config hub 'hub'
    option auto_install '1'
    option collections 'crowdsecurity/linux crowdsecurity/sshd crowdsecurity/iptables'
    option update_interval '7'

config bouncer 'bouncer'
    option enabled '1'
    option ipv4 '1'
    option ipv6 '1'
    option deny_action 'drop'
    option deny_log '1'
    option update_frequency '10s'
```

## 默认集合

默认安装以下集合：

| 集合 | 描述 |
|------|------|
| `crowdsecurity/linux` | Linux 系统安全 |
| `crowdsecurity/sshd` | SSH 暴力破解防护 |
| `crowdsecurity/iptables` | 防火墙日志解析 |
| `crowdsecurity/http-cve` | HTTP CVE 漏洞利用 |

## 命令参考

### 服务管理

```bash
# CrowdSec 服务
/etc/init.d/crowdsec start|stop|restart|enable|disable

# 防火墙 bouncer
/etc/init.d/crowdsec-firewall-bouncer start|stop|restart|enable|disable

# Syslog-ng
/etc/init.d/syslog-ng start|stop|restart|enable|disable
```

### cscli 命令

```bash
# 查看状态
cscli lapi status
cscli capi status

# 决策管理
cscli decisions list
cscli decisions add --ip <IP> --duration 24h --reason "手动封禁"
cscli decisions delete --ip <IP>

# 告警管理
cscli alerts list
cscli alerts list --since 24h

# 集合管理
cscli collections list
cscli collections install crowdsecurity/nginx
cscli collections remove crowdsecurity/nginx

# Hub 管理
cscli hub update
cscli hub upgrade

# Bouncer 管理
cscli bouncers list

# 指标
cscli metrics
```

### nftables 命令

```bash
# 列出 CrowdSec 表
nft list tables | grep crowdsec

# 显示被阻断的 IP (IPv4)
nft list set ip crowdsec crowdsec-blacklists

# 显示被阻断的 IP (IPv6)
nft list set ip6 crowdsec6 crowdsec6-blacklists
```

## 故障排除

### CrowdSec 无法启动

```bash
# 检查日志
logread | grep crowdsec
cat /var/log/crowdsec.log

# 验证配置
cscli config show
```

### LAPI 不可用

```bash
# 检查 CrowdSec 是否在运行
pgrep crowdsec

# 修复机器注册
cscli machines add localhost --auto --force
/etc/init.d/crowdsec restart
```

### Bouncer 未阻断

```bash
# 检查 bouncer 状态
pgrep -f crowdsec-firewall-bouncer

# 验证 nftables 表
nft list tables

# 检查 bouncer API 密钥
cat /etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml | grep api_key
```

### syslog-ng 问题

```bash
# 检查是否在运行
pgrep syslog-ng

# 测试配置
syslog-ng -s

# 检查 UDP 监听器
netstat -uln | grep 5140
```

### 没有生成告警

```bash
# 检查采集
cscli metrics show acquisition

# 测试日志解析
echo "Failed password for root from 192.168.1.100 port 22222 ssh2" | \
  cscli parsers inspect crowdsecurity/sshd-logs
```

## 卸载

```bash
# 使用安装脚本
secubox-crowdsec-setup --uninstall

# 手动移除
/etc/init.d/crowdsec-firewall-bouncer stop
/etc/init.d/crowdsec stop
/etc/init.d/syslog-ng stop

opkg remove luci-app-secubox-crowdsec
opkg remove crowdsec-firewall-bouncer
opkg remove crowdsec
opkg remove syslog-ng

# 清理 nftables
nft delete table ip crowdsec
nft delete table ip6 crowdsec6

# 重新启用 logd
/etc/init.d/log enable
/etc/init.d/log start
```

## 安全注意事项

### 本地网络白名单

默认配置包含 RFC1918 私有网络的白名单：
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16
- 127.0.0.0/8

这可以防止意外阻断本地管理访问。

### Bouncer API 密钥

Bouncer API 密钥在安装过程中自动生成并存储在：
- `/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml`
- UCI 配置: `crowdsec.bouncer.api_key`

### 日志保留

`/tmp/log/` 中的日志存储在 tmpfs 中，重启后会清除。如需持久化日志，请配置 syslog-ng 写入 overlay 存储。

## 性能优化

对于资源受限的设备：

1. **降低更新频率**：
   ```bash
   uci set crowdsec.bouncer.update_frequency='30s'
   uci commit crowdsec
   ```

2. **如果未使用则禁用 IPv6**：
   ```bash
   uci set crowdsec.bouncer.ipv6='0'
   uci commit crowdsec
   ```

3. **限制集合**：
   只安装与您的设置相关的集合。

## 与 SecuBox 集成

此 CrowdSec 集成是 OpenWrt SecuBox 安全套件的一部分。它与其他 SecuBox 组件协同工作：

- SecuBox 防火墙
- SecuBox VPN
- SecuBox DNS 过滤
- SecuBox 监控

## 许可证

MIT 许可证 - Copyright (C) 2025 CyberMind.fr

## 支持

- GitHub Issues: https://github.com/secubox/secubox-openwrt
- 文档: https://secubox.cybermood.eu/docs
- CrowdSec 文档: https://docs.crowdsec.net
