[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox App - CrowdSec

## 版本
- **软件包**：secubox-app-crowdsec
- **CrowdSec 核心**：v1.7.4
- **发布版本**：3
- **最后更新**：2025 年 1 月

## 描述
CrowdSec 是一个开源、轻量级的安全引擎，用于检测和响应恶意行为。此 SecuBox 软件包为 OpenWrt 路由器提供 CrowdSec，并支持自动日志采集配置。

## 主要功能 (v1.7.4)
- 具有 DropRequest 助手的 WAF 功能，用于请求阻止
- 使用 RestartableStreamer 重构的 syslog 采集
- 可选的纯 Go SQLite 驱动，提供更好的兼容性
- 增强的日志配置，支持 syslog 媒体
- 可配置的使用指标导出 (api.server.disable_usage_metrics_export)
- 修复了 Prometheus 的 LAPI 指标基数问题
- 防止 Docker 采集中的数据竞争
- 决策流的数据库查询优化
- **自动 OpenWrt 日志采集配置**
- **基于 UCI 的采集管理**

## 软件包内容
- **Makefile**：CrowdSec v1.7.4 的 OpenWrt 软件包定义
- **files/**：配置和初始化脚本
  - `crowdsec.initd`：服务管理的初始化脚本
  - `crowdsec.config`：UCI 配置（包含采集设置）
  - `crowdsec.defaults`：带自动检测的默认配置
  - `acquis.d/`：采集配置模板
    - `openwrt-syslog.yaml`：系统 syslog 日志
    - `openwrt-dropbear.yaml`：SSH/Dropbear 日志
    - `openwrt-firewall.yaml`：iptables/nftables 防火墙日志
    - `openwrt-uhttpd.yaml`：uHTTPd Web 服务器日志

## 安装
```bash
# 从 SecuBox 构建环境
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt
make package/secubox/secubox-app-crowdsec/compile V=s

# 在路由器上安装
opkg install crowdsec_1.7.4-3_*.ipk
```

## 配置

### UCI 配置
CrowdSec 使用 UCI 进行配置，位于 `/etc/config/crowdsec`：

```bash
# 查看当前配置
uci show crowdsec

# 主要设置
uci set crowdsec.crowdsec.data_dir='/srv/crowdsec/data'
uci set crowdsec.crowdsec.db_path='/srv/crowdsec/data/crowdsec.db'

# 采集设置
uci set crowdsec.acquisition.syslog_enabled='1'
uci set crowdsec.acquisition.firewall_enabled='1'
uci set crowdsec.acquisition.ssh_enabled='1'
uci set crowdsec.acquisition.http_enabled='0'
uci set crowdsec.acquisition.syslog_path='/var/log/messages'

# Hub 设置
uci set crowdsec.hub.auto_install='1'
uci set crowdsec.hub.collections='crowdsecurity/linux crowdsecurity/iptables'
uci set crowdsec.hub.update_interval='7'

uci commit crowdsec
```

### 文件位置
- 主配置：`/etc/crowdsec/config.yaml`
- 采集目录：`/etc/crowdsec/acquis.d/`
- 旧版采集：`/etc/crowdsec/acquis.yaml`
- 配置文件：`/etc/crowdsec/profiles.yaml`
- 本地 API：`/etc/crowdsec/local_api_credentials.yaml`
- 数据目录：`/srv/crowdsec/data/`

## 日志采集配置

### 自动检测
首次启动时，defaults 脚本会自动：
1. 检测 OpenWrt 日志文件配置
2. 识别已安装的服务（Dropbear、防火墙）
3. 生成适当的采集配置
4. 安装推荐的 Hub 集合

### 支持的日志源
| 日志源 | 默认 | 所需集合 |
|--------|------|----------|
| 系统 Syslog | 启用 | crowdsecurity/linux |
| SSH/Dropbear | 启用 | crowdsecurity/linux |
| 防火墙 (iptables/nftables) | 启用 | crowdsecurity/iptables |
| HTTP (uHTTPd/nginx) | 禁用 | crowdsecurity/http-cve |

### 自定义采集
在 `/etc/crowdsec/acquis.d/` 中添加自定义采集配置：

```yaml
# /etc/crowdsec/acquis.d/custom.yaml
filenames:
  - /var/log/custom-app/*.log
labels:
  type: syslog
```

### Syslog 服务模式
将 CrowdSec 作为 syslog 服务器运行（接收其他设备的日志）：

```bash
uci set crowdsec.acquisition.syslog_listen_addr='0.0.0.0'
uci set crowdsec.acquisition.syslog_listen_port='514'
uci commit crowdsec
/etc/init.d/crowdsec restart
```

## 服务管理
```bash
# 启动 CrowdSec
/etc/init.d/crowdsec start

# 停止 CrowdSec
/etc/init.d/crowdsec stop

# 重启 CrowdSec
/etc/init.d/crowdsec restart

# 检查状态
/etc/init.d/crowdsec status
```

## CLI 使用
CrowdSec CLI 通过 `cscli` 可用：
```bash
# 检查版本
cscli version

# 检查采集状态
cscli metrics show acquisition

# 列出决策
cscli decisions list

# 查看警报
cscli alerts list

# 管理集合
cscli collections list
cscli collections install crowdsecurity/nginx

# 管理 Hub
cscli hub update
cscli hub upgrade

# 管理 bouncers
cscli bouncers list
cscli bouncers add firewall-bouncer
```

## OpenWrt 的 Hub 集合

### 推荐集合
```bash
# 核心 Linux 检测（SSH 暴力破解等）
cscli collections install crowdsecurity/linux

# 防火墙日志分析（端口扫描检测）
cscli collections install crowdsecurity/iptables

# Syslog 解析
cscli parsers install crowdsecurity/syslog-logs

# 白名单以减少误报
cscli parsers install crowdsecurity/whitelists
```

### 可选集合
```bash
# HTTP 攻击检测
cscli collections install crowdsecurity/http-cve

# nginx 日志
cscli collections install crowdsecurity/nginx

# Smb/Samba
cscli collections install crowdsecurity/smb
```

## 与 SecuBox 集成
此软件包集成：
- **luci-app-crowdsec-dashboard** v0.5.0+
- **secubox-app-crowdsec-bouncer** - 防火墙 bouncer
- **SecuBox 主题系统**
- **SecuBox 日志**（`secubox-log`）

## 依赖项
- Go 编译器（构建时）
- SQLite3
- OpenWrt 基础系统

## 参考
- 上游：https://github.com/crowdsecurity/crowdsec
- 文档：https://docs.crowdsec.net/
- Hub：https://hub.crowdsec.net/
- 采集文档：https://docs.crowdsec.net/docs/next/log_processor/data_sources/intro/
- SecuBox 项目：https://cybermind.fr

## 更新日志

### v1.7.4-3 (2025-01)
- 添加自动日志采集配置
- 添加基于 UCI 的采集管理
- 添加带有 OpenWrt 特定模板的 acquis.d 目录
- 改进 Hub 集合自动安装
- 添加 syslog、SSH/Dropbear、防火墙、HTTP 采集
- 增强的 defaults 脚本带检测逻辑

### v1.7.4-2 (2024-12)
- 从 v1.6.2 更新到 v1.7.4
- 添加 WAF/AppSec 支持
- 改进 syslog 采集
- 增强指标导出配置
- 修复 Prometheus 基数问题

### v1.6.2-1（之前）
- 初始 SecuBox 集成
- 基本 OpenWrt 兼容性补丁

## 许可证
MIT 许可证

## 维护者
CyberMind.fr - Gandalf <gandalf@gk2.net>
