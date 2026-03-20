[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI InterceptoR 仪表板

SecuBox InterceptoR 的统一仪表板 - "甘道夫代理"透明流量拦截系统。

## 功能特性

- **健康评分** - 整体拦截覆盖率 (0-100%)
- **5 个支柱状态卡**：
  - WPAD 重定向器 - 自动代理发现状态
  - MITM 代理 - 威胁检测和连接统计
  - CDN 缓存 - 命中率和带宽节省
  - Cookie 追踪器 - 追踪 Cookie 检测
  - API 故障转移 - 过期内容服务状态
- **快速链接** - 直接访问各模块仪表板

## 安装

```bash
opkg install luci-app-interceptor
```

## 菜单位置

- SecuBox > InterceptoR > 概览 - 健康评分和支柱状态
- SecuBox > InterceptoR > 服务 - 动态服务仪表板

## 架构

InterceptoR 聚合 5 个拦截支柱的状态：

```
                    +-------------------+
                    |   InterceptoR     |
                    |    Dashboard      |
                    +-------------------+
                           |
    +------+------+--------+--------+------+
    |      |      |        |        |      |
  WPAD   MITM   CDN     Cookie   API
  Proxy  Proxy  Cache   Tracker  Failover
```

### 支柱模块

| 支柱 | 软件包 | 功能 |
|------|--------|------|
| WPAD | luci-app-network-tweaks | 通过 DHCP/DNS 自动代理 |
| MITM | secubox-app-mitmproxy | HTTPS 检查、威胁检测 |
| CDN Cache | luci-app-cdn-cache | 内容缓存、带宽节省 |
| Cookie Tracker | secubox-cookie-tracker | Cookie 分类、追踪 |
| API Failover | luci-app-cdn-cache | Stale-if-error、离线模式 |

## 服务仪表板

服务选项卡提供所有 SecuBox 服务的动态视图，包括：

- **已发布** - HAProxy vhosts 和 Tor onion 服务及实时 URL
- **代理** - mitmproxy 实例及状态和 Web UI 链接
- **服务** - 正在运行的守护进程及启用/运行状态
- **仪表板** - LuCI 应用链接用于快速导航
- **指标** - 系统健康、内存、CrowdSec 统计

每个服务都显示其类别表情符号以便快速视觉识别。

## RPCD 方法

### luci.interceptor

| 方法 | 描述 |
|------|------|
| `status` | 所有支柱的聚合状态 |
| `getPillarStatus` | 特定支柱的状态 |

### luci.services-registry

| 方法 | 描述 |
|------|------|
| `getServices` | 所有 init.d 服务及状态 |
| `getPublished` | HAProxy vhosts + Tor onion URL |
| `getMetrics` | 系统指标和 CrowdSec 统计 |
| `getAll` | 组合：服务、已发布、代理、仪表板、指标 |

## 健康评分计算

- 20 分：WPAD 已启用或强制执行活跃
- 20 分：mitmproxy 正在运行
- 20 分：CDN Cache (Squid) 正在运行
- 20 分：Cookie Tracker 已启用
- 20 分：API Failover 已启用

## 公共访问

`status` 方法可供未认证用户用于监控仪表板。

## 依赖项

- luci-base
- rpcd

可选（完整功能）：
- luci-app-network-tweaks
- secubox-app-mitmproxy
- luci-app-cdn-cache
- secubox-cookie-tracker

## 许可证

GPL-3.0
