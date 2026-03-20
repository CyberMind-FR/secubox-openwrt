# SecuBox - OpenWrt 安全套件

**版本：** 1.0.0-beta
**最后更新：** 2026-03-15
**状态：** Beta — 已准备好进行渗透测试和漏洞赏金计划
**模块：** 86 个 LuCI 应用

[![Build OpenWrt Packages](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/CyberMind-FR/secubox-openwrt?include_prereleases&label=release)](https://github.com/CyberMind-FR/secubox-openwrt/releases)

🌐 **语言：** [English](README.md) | [Français](README.fr.md) | 中文

---

## 概述

SecuBox 是一个面向 OpenWrt 的综合安全和网络管理套件，提供由 86 个专业仪表板和工具组成的统一生态系统。该平台实现了**四层架构**以实现纵深防御，具备 AI 驱动的威胁分析、P2P 网状网络和多通道服务暴露功能。

**网站：** [secubox.maegia.tv](https://secubox.maegia.tv)
**发布者：** [CyberMind.fr](https://cybermind.fr)

---

## 四层架构

```
+============================================================+
|              第四层：网状网络                                |
|              MirrorNet / P2P 中心 / 服务镜像                 |
|  +--------------------------------------------------------+ |
|  |           第三层：AI 网关                               | |
|  |           MCP 服务器 / 威胁分析师 / DNS 守卫            | |
|  |  +----------------------------------------------------+ | |
|  |  |         第二层：战术层                              | | |
|  |  |         CrowdSec / WAF / 场景                      | | |
|  |  |  +------------------------------------------------+ | | |
|  |  |  |       第一层：操作层                            | | | |
|  |  |  |       fw4 / DPI / Bouncer / HAProxy            | | | |
|  |  |  +------------------------------------------------+ | | |
|  |  +----------------------------------------------------+ | |
|  +--------------------------------------------------------+ |
+============================================================+
```

| 层级 | 功能 | 时间尺度 | SecuBox 组件 |
|------|------|----------|--------------|
| **第一层** | 实时阻断 | 毫秒 → 秒 | nftables/fw4, netifyd DPI, CrowdSec Bouncer |
| **第二层** | 模式关联 | 分钟 → 小时 | CrowdSec Agent/LAPI, mitmproxy WAF, 场景 |
| **第三层** | AI 分析 | 分钟 → 小时 | MCP 服务器, 威胁分析师, DNS 守卫 |
| **第四层** | 网状网络 | 持续 | P2P 中心, MirrorBox, 服务注册表 |

---

## 核心功能

### 安全

- **CrowdSec 集成** — 实时威胁情报、CAPI 注册、自动封禁
- **mitmproxy WAF** — HTTPS 检查与 CVE 检测、基于敏感度的自动封禁
- **深度包检测** — netifyd/nDPId 协议分析
- **MAC 守卫** — WiFi MAC 欺骗检测与 CrowdSec 集成
- **DNS 守卫** — AI 驱动的 DGA、隧道和异常检测

### AI 网关

- **MCP 服务器** — 用于 Claude Desktop 集成的模型上下文协议
- **威胁分析师** — 用于威胁分析和规则生成的自主 AI 代理
- **LocalAI** — 带模型管理的自托管 LLM

### 网状网络

- **P2P 中心** — 带地球可视化的去中心化对等发现
- **MirrorBox** — 带自动同步的分布式服务目录
- **应用商店** — 跨网状节点的 P2P 包分发
- **主链接** — 带动态 IPK 生成的安全网状加入

### 服务暴露

- **朋克暴露** — 多通道服务解放（Tor + DNS/SSL + 网状）
- **HAProxy** — 带 webroot ACME 的负载均衡器，自动 SSL
- **Tor 盾牌** — 带分离路由的 .onion 隐藏服务

### 媒体与内容

- **Jellyfin** — 带设置向导的 LXC 媒体服务器
- **Lyrion** — 带 CIFS 集成的音乐服务器
- **Zigbee2MQTT** — 用于 IoT 的 LXC Alpine 容器
- **Domoticz** — 带 MQTT 桥接的家庭自动化

---

## SecuBox 模块（共 86 个）

### 核心（6 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-secubox | 中央仪表板/中心 |
| luci-app-secubox-portal | 带标签页的统一入口 |
| luci-app-secubox-admin | 管理控制中心 |
| secubox-app-bonus | 应用商店和文档 |
| luci-app-system-hub | 带备份的系统控制 |
| luci-theme-secubox | KISS UI 主题 |

### 安全（15 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-crowdsec-dashboard | CrowdSec 监控 |
| luci-app-security-threats | 统一的 netifyd + CrowdSec |
| luci-app-client-guardian | 强制门户、家长控制 |
| luci-app-auth-guardian | OAuth2/OIDC、凭证 |
| luci-app-exposure | 服务暴露管理器 |
| luci-app-tor-shield | Tor 匿名化 |
| luci-app-mitmproxy | HTTPS 检查 WAF |
| luci-app-mac-guardian | WiFi MAC 安全 |
| luci-app-dns-guard | AI 驱动的 DNS 异常检测 |
| luci-app-waf | Web 应用防火墙 |
| luci-app-threat-analyst | AI 威胁分析 |
| luci-app-ksm-manager | 密钥/HSM 管理 |
| luci-app-master-link | 网状加入 |
| luci-app-routes-status | VHosts 路由检查器 |
| secubox-mcp-server | MCP 协议服务器 |

### 网络（12 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-haproxy | 带 SSL 的负载均衡器 |
| luci-app-wireguard-dashboard | WireGuard VPN |
| luci-app-vhost-manager | Nginx 反向代理 |
| luci-app-network-modes | 嗅探器/AP/中继/路由器 |
| luci-app-network-tweaks | DNS 和代理控制 |
| luci-app-dns-provider | DNS 提供商 API |
| luci-app-cdn-cache | CDN 优化 |
| luci-app-bandwidth-manager | QoS 和配额 |
| luci-app-traffic-shaper | TC/CAKE 流量整形 |
| luci-app-mqtt-bridge | USB 到 MQTT IoT |
| luci-app-media-flow | 流媒体检测 |
| luci-app-netdiag | 网络诊断 |

### DPI（2 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-ndpid | nDPId 深度包检测 |
| luci-app-netifyd | netifyd 流量监控 |

### P2P 网状（4 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-p2p | 带 MirrorBox 的 P2P 中心 |
| luci-app-service-registry | 服务目录 |
| luci-app-device-intel | 设备情报 |
| secubox-content-pkg | 内容分发 |

### AI/LLM（4 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-localai | LocalAI v3.9.0 |
| luci-app-ollama | Ollama LLM |
| luci-app-glances | 系统监控 |
| luci-app-netdata-dashboard | Netdata 实时监控 |

### 媒体（7 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-jellyfin | 媒体服务器（LXC）|
| luci-app-lyrion | 音乐服务器 |
| luci-app-zigbee2mqtt | Zigbee 网关（LXC）|
| luci-app-domoticz | 家庭自动化（LXC）|
| luci-app-ksmbd | SMB/CIFS 共享 |
| luci-app-smbfs | 远程挂载管理器 |
| luci-app-magicmirror2 | 智能显示屏 |

### 内容平台（6 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-gitea | Git 平台 |
| luci-app-hexojs | 静态网站生成器 |
| luci-app-metablogizer | Metabolizer CMS |
| luci-app-streamlit | Streamlit 应用 |
| luci-app-picobrew | PicoBrew 服务器 |
| luci-app-jitsi | 视频会议 |

### 远程访问（3 个模块）

| 模块 | 描述 |
|------|------|
| luci-app-rustdesk | RustDesk 中继 |
| luci-app-guacamole | 无客户端桌面 |
| luci-app-simplex | SimpleX Chat |

### *另有 27 个支持包...*

---

## 支持的架构

| 架构 | 目标 | 示例设备 |
|------|------|----------|
| **ARM64** | aarch64-cortex-a53/a72, mediatek-filogic, rockchip-armv8 | MOCHAbin, NanoPi R4S/R5S, GL.iNet MT3000, Raspberry Pi 4 |
| **ARM32** | arm-cortex-a7/a9-neon, qualcomm-ipq40xx | Turris Omnia, Google WiFi |
| **MIPS** | mips-24kc, mipsel-24kc | TP-Link Archer, Xiaomi |
| **x86** | x86-64 | PC, 虚拟机, Docker, Proxmox |

---

## 安装

### 从预编译包安装

```bash
opkg update
opkg install luci-app-secubox-portal_*.ipk
opkg install luci-app-crowdsec-dashboard_*.ipk
```

### 从源码编译

```bash
# 克隆到 OpenWrt SDK
cd ~/openwrt-sdk/package/
git clone https://github.com/CyberMind-FR/secubox-openwrt.git secubox

# 编译
make package/secubox/luci-app-secubox-portal/compile V=s
```

### 添加为 Feed

```
src-git secubox https://github.com/CyberMind-FR/secubox-openwrt.git
```

---

## MCP 集成（Claude Desktop）

SecuBox 包含用于 AI 集成的 MCP 服务器：

```json
{
  "mcpServers": {
    "secubox": {
      "command": "ssh",
      "args": ["root@192.168.255.1", "/usr/bin/secubox-mcp"]
    }
  }
}
```

**可用工具：** `crowdsec.alerts`, `crowdsec.decisions`, `waf.logs`, `dns.queries`, `network.flows`, `system.metrics`, `wireguard.status`, `ai.analyze_threats`, `ai.cve_lookup`, `ai.suggest_waf_rules`

---

## 路线图

| 版本 | 状态 | 重点 |
|------|------|------|
| **v0.17** | 已发布 | 核心网状，38 个模块 |
| **v0.18** | 已发布 | P2P 中心，AI 网关，86 个模块 |
| **v0.19** | 已发布 | 完整 P2P 情报 |
| **v1.0** | **Beta** | 渗透测试，漏洞赏金，ANSSI 准备 |
| **v1.1** | 计划中 | ANSSI 认证，GA 发布 |

### Beta 版本

请参阅 [BETA-RELEASE.md](BETA-RELEASE.md) 了解安全测试指南和漏洞赏金范围。

### 默认凭证（VM 设备）

- **用户名：** root
- **密码：** c3box（首次登录后请修改！）

---

## 链接

- **网站**：[secubox.maegia.tv](https://secubox.maegia.tv)
- **GitHub**：[github.com/CyberMind-FR/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **发布者**：[CyberMind.fr](https://cybermind.fr)
- **问题反馈**：[GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)

---

## 许可证

Apache-2.0 © 2024-2026 CyberMind.fr

---

## 作者

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

**Ex Tenebris, Lux Securitas**

法国制造
