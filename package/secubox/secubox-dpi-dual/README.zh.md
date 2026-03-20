# SecuBox DPI Dual-Stream

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

双流深度包检测（DPI）架构，结合主动 MITM 检测和被动 TAP 分析，提供全面的网络安全防护。

## 架构

```
                    +-------------------------------------+
                    |            WAN INTERFACE            |
                    +-----------------+-------------------+
                                      |
           +--------------------------+---------------------------+
           |                          |                           |
           v                          v                           |
 +---------------------+    +---------------------+               |
 |   STREAM 1: MITM    |    |  STREAM 2: TAP/DPI  |               |
 |     (主动路径)      |    |    (被动镜像)       |               |
 +---------+-----------+    +---------+-----------+               |
           |                          |                           |
           v                          v                           |
 +---------------------+    +---------------------+               |
 |  HAProxy + MITM     |    |   tc mirred/TAP     |               |
 |   (SSL 终结)        |    |    (端口镜像)       |               |
 +---------+-----------+    +---------+-----------+               |
           |                          |                           |
           v                          v                           |
 +---------------------+    +---------------------+               |
 |   Double Buffer     |    |     netifyd         |               |
 |    (异步分析)       |    |    (nDPI 引擎)      |               |
 +---------+-----------+    +---------+-----------+               |
           |                          |                           |
           +------------+-------------+                           |
                        |                                         |
                        v                                         |
           +-------------------------------------+                 |
           |          关联引擎                   |                 |
           |    (IP 信誉 + 上下文匹配)          |                 |
           +-------------------------------------+
```

## 功能特性

### Stream 1：MITM（主动检测）
- 完整内容检测，带 SSL/TLS 终结
- 通过 mitmproxy 执行 WAF 规则
- 双缓冲请求分析
- 威胁模式检测（XSS、SQLi、LFI、RCE、SSRF、路径遍历）
- 扫描器检测（sqlmap、nikto、nmap 等）
- 高分威胁的可选请求阻止

### Stream 2：TAP（被动分析）
- 对实时流量零延迟影响
- 通过 nDPI 进行协议识别（300+ 协议）
- 流量统计和带宽分析
- 适用于加密流量（元数据分析）
- 软件（tc mirred）或硬件端口镜像

### 关联引擎
- 带分数衰减的 IP 信誉跟踪
- 跨两个流的事件匹配
- CrowdSec 集成（决策监控、自动封禁）
- 完整上下文收集（MITM 请求、WAF 警报、DPI 流量）
- 高严重性威胁通知

### LAN 被动流量分析
- 在 br-lan 接口上进行 **实时监控**
- **无 MITM，无缓存** - 纯被动 nDPI 分析
- 按客户端的流量跟踪（字节、流量、协议）
- 外部目的地监控
- 协议/应用检测（300+ 通过 nDPI）
- 低资源开销

## 安装

```bash
opkg update
opkg install secubox-dpi-dual luci-app-dpi-dual
```

## CLI 使用

```bash
# 启动/停止/重启
dpi-dualctl start
dpi-dualctl stop
dpi-dualctl restart

# 检查状态
dpi-dualctl status

# 查看流量统计
dpi-dualctl flows

# 查看最近威胁
dpi-dualctl threats 20

# 镜像控制
dpi-dualctl mirror status
dpi-dualctl mirror start
dpi-dualctl mirror stop
```

### 关联器命令

```bash
# 手动关联
dpi-correlator correlate 192.168.1.100 waf_alert "suspicious_request" 75

# 获取 IP 信誉
dpi-correlator reputation 192.168.1.100

# 获取 IP 的完整上下文
dpi-correlator context 192.168.1.100

# 搜索关联
dpi-correlator search 192.168.1.100 50

# 显示统计
dpi-correlator stats
```

### LAN 流量命令

```bash
# 显示 LAN 流量摘要
dpi-dualctl lan

# 列出活动 LAN 客户端
dpi-dualctl clients

# 显示访问的外部目的地
dpi-dualctl destinations

# 显示检测到的协议
dpi-dualctl protocols
```

## 配置

编辑 `/etc/config/dpi-dual`：

```
config global 'settings'
    option enabled '1'
    option mode 'dual'           # dual|mitm-only|tap-only
    option correlation '1'

config mitm 'mitm'
    option enabled '1'
    option buffer_size '1000'    # 双缓冲中的请求数
    option async_analysis '1'

config tap 'tap'
    option enabled '1'
    option interface 'tap0'
    option mirror_source 'eth0'
    option mirror_mode 'software' # software|hardware

config correlation 'correlation'
    option enabled '1'
    option watch_crowdsec '1'
    option auto_ban '0'
    option auto_ban_threshold '80'
    option notifications '1'

# LAN 被动流量分析（无 MITM，无缓存）
config lan 'lan'
    option enabled '1'
    option interface 'br-lan'
    option realtime '1'
    option track_clients '1'
    option track_destinations '1'
    option track_protocols '1'
    option aggregate_interval '5'
    option client_retention '3600'
```

## LuCI 仪表板

导航到 **SecuBox > DPI Dual-Stream**：

- **概览**：流状态、指标、威胁表
- **关联时间线**：带 IP 上下文的事件卡片
- **LAN 流量**：实时 LAN 客户端监控（客户端、协议、目的地）
- **设置**：完整配置界面

## 文件

| 文件 | 用途 |
|------|------|
| `/usr/sbin/dpi-dualctl` | 主 CLI 工具 |
| `/usr/sbin/dpi-flow-collector` | 流量聚合服务 |
| `/usr/sbin/dpi-correlator` | 关联引擎 |
| `/usr/sbin/dpi-lan-collector` | LAN 被动流量收集器 |
| `/usr/lib/dpi-dual/mirror-setup.sh` | tc mirred 端口镜像 |
| `/usr/lib/dpi-dual/correlation-lib.sh` | 共享关联函数 |
| `/srv/mitmproxy/addons/dpi_buffer.py` | mitmproxy 双缓冲 addon |
| `/etc/config/dpi-dual` | UCI 配置 |
| `/etc/init.d/dpi-dual` | procd 服务 |

## 输出文件

| 文件 | 内容 |
|------|------|
| `/tmp/secubox/dpi-flows.json` | TAP 流的流量统计 |
| `/tmp/secubox/dpi-buffer.json` | MITM 缓冲统计 |
| `/tmp/secubox/waf-alerts.json` | WAF 威胁警报 |
| `/tmp/secubox/correlated-threats.json` | 关联威胁日志（JSONL） |
| `/tmp/secubox/ip-reputation.json` | IP 信誉数据库 |
| `/tmp/secubox/notifications.json` | 高严重性威胁通知 |
| `/tmp/secubox/lan-flows.json` | LAN 流量摘要统计 |
| `/tmp/secubox/lan-clients.json` | 活动 LAN 客户端数据 |
| `/tmp/secubox/lan-destinations.json` | 访问的外部目的地 |
| `/tmp/secubox/lan-protocols.json` | 检测到的协议/应用 |

## 依赖项

- `netifyd` - 基于 nDPI 的流量分析器
- `iproute2-tc` - 端口镜像的流量控制
- `jsonfilter` - JSON 解析（libubox）
- `coreutils-stat` - 文件统计

## 性能

| 方面 | MITM 流 | TAP 流 | LAN 被动 |
|------|---------|--------|----------|
| 延迟 | +5-20ms | 0ms | 0ms |
| CPU | 高（SSL、WAF） | 低（nDPI） | 低（nDPI） |
| 内存 | 取决于缓冲区 | 最小 | 最小 |
| 可见性 | 完整内容 | 仅元数据 | 仅元数据 |
| 用例 | WAF/威胁检测 | WAN 分析 | LAN 监控 |

## 安全说明

1. **TAP 流是只读的** — 只能观察，不能阻止
2. **MITM 流需要 CA 信任** — 用户必须接受证书
3. **缓冲数据是敏感的** — 有限保留，自动清理
4. **关联日志包含个人信息** — 遵循数据保护法规

## 许可证

GPL-3.0

## 作者

SecuBox Team <secubox@gk2.net>
