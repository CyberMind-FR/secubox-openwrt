# SecuBox 模块 - 实施状态

🌐 **语言:** [English](../docs/module-status.md) | [Francais](../docs-fr/module-status.md) | 中文

**版本:** 2.0.1
**最后更新:** 2025-12-30
**状态:** 密集开发阶段
**模块总数:** 16
**完成度:** 100%

---

## 快速统计

| 指标 | 数值 |
|------|------|
| **模块总数** | 16 |
| **视图总数** | 112 |
| **JavaScript 代码行数** | 27,138 |
| **RPCD 方法数** | 288 |
| **最新版本** | v2.0.1 |
| **完成率** | 100% |

---

## 另请参阅

- **功能重生成提示:** [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
- **模块实施指南:** [MODULE-IMPLEMENTATION-GUIDE.md](module-implementation-guide.md)
- **构建系统:** [CLAUDE.md](claude.md)

---

## 模块分类

### 1. 核心控制 (2个模块)

#### luci-app-secubox
- **版本**: 0.6.0-1
- **状态**: 密集开发阶段
- **描述**: SecuBox 主控制面板
- **视图**: 11 (dashboard, modules, modules-minimal, modules-debug, monitoring, alerts, settings, dev-status, wizard, appstore, help)
- **JavaScript 代码行数**: 2,906
- **RPCD 方法数**: 33 (第二大后端)
- **主要功能**:
  - 模块自动发现和管理
  - 统一系统仪表板
  - 模块启用/禁用功能
  - 服务健康监控
  - 包管理器集成 (opkg 和 apk)
  - 统一警报聚合
  - 设置同步
  - 开发状态报告
  - 首次运行设置向导
  - 基于清单的应用商店集成
- **集成**: 管理其他15个模块, opkg/apk 包检测
- **最近更新**:
  - v0.6.0: 与 secubox-theme 完整主题集成
  - 迁移所有视图以使用 CSS 变量 (--sh-* 前缀)
  - 在所有 CSS 文件中添加 cyberpunk 主题支持
  - 在所有视图中实现 Theme.init() 模式
  - 统一主题系统，支持 dark/light/cyberpunk 变体
  - v0.3.1: 增强权限管理系统
  - 添加 .apk 包格式支持 (OpenWrt 25.12+)
  - 改进模块检测逻辑

#### luci-app-system-hub
- **版本**: 0.3.2-1
- **状态**: 密集开发阶段
- **描述**: 中央系统控制和监控
- **视图**: 10 (overview, health, services, components, diagnostics, backup, remote, logs, settings, dev-status)
- **JavaScript 代码行数**: 4,454 (最大实现)
- **RPCD 方法数**: 18
- **主要功能**:
  - 全面的系统信息仪表板
  - 实时健康监控 (CPU, 内存, 磁盘, 网络)
  - 服务管理 (启动/停止/重启/启用/禁用)
  - 系统诊断和故障排除
  - 配置备份/恢复
  - 远程管理功能
  - 系统日志聚合与自动刷新
  - 组件清单跟踪
  - OpenWrt 版本检测
  - 架构检测 (x86, ARM, MIPS)
- **最近更新**:
  - v0.3.2: 现代化快速状态小部件，带直方图和渐变
  - 向实时指标添加网络和服务小部件
  - 增强动态概览统计
  - 实现工作系统日志查看器
  - 修复 HTMLCollection 显示错误
- **集成**: systemd/procd 服务, ubus, logread, opkg/apk
- **提交**: fadf606 - "feat(system-hub): enhance dynamic overview stats for v0.3.2"

---

### 2. 安全与监控 (2个模块)

#### luci-app-crowdsec-dashboard
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: CrowdSec 威胁情报和 IPS 仪表板
- **视图**: 6 (overview, alerts, decisions, bouncers, metrics, settings)
- **JavaScript 代码行数**: 2,089
- **RPCD 方法数**: 12
- **主要功能**:
  - 实时威胁检测和阻止
  - 协作安全情报共享
  - IP 封禁/解封管理
  - 多弹跳器支持 (防火墙, nginx 等)
  - 威胁评分和风险分析
  - 攻击指标和趋势
  - 自定义场景检测
  - 地理威胁分析
- **集成**: CrowdSec 引擎, cscli 命令行, iptables/nftables
- **依赖**: crowdsec 包

#### luci-app-netdata-dashboard
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 具有全面指标的实时系统监控
- **视图**: 6 (dashboard, system, network, processes, realtime, settings)
- **JavaScript 代码行数**: 1,554
- **RPCD 方法数**: 16
- **主要功能**:
  - 实时系统指标收集
  - 每核心 CPU 分析
  - 内存和交换空间跟踪
  - 磁盘 I/O 监控
  - 网络接口统计
  - 进程跟踪和管理
  - 系统负载平均值
  - 历史图表和趋势
- **集成**: /proc/stat, /proc/meminfo, /proc/net, 系统工具
- **数据源**: procfs, sysfs, netlink

---

### 3. 网络智能 (2个模块)

#### luci-app-netifyd-dashboard
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 深度包检测和应用分类
- **视图**: 7 (overview, flows, applications, devices, talkers, risks, settings)
- **JavaScript 代码行数**: 1,376
- **RPCD 方法数**: 12
- **主要功能**:
  - 深度包检测 (DPI)
  - 应用协议检测 (HTTP, HTTPS, DNS, SSH 等)
  - 网络流跟踪和分析
  - 设备指纹识别和分类
  - 风险检测和评分
  - 顶级通信者分析
  - 流量模式识别
  - 端口/协议分类
- **集成**: netifyd DPI 引擎
- **依赖**: netifyd 包
- **用例**: 流量分析, 带宽优化, 安全监控

#### luci-app-network-modes
- **版本**: 0.3.5-1
- **状态**: 生产就绪
- **描述**: 动态网络模式切换和配置
- **视图**: 7 (overview, wizard, router, relay, accesspoint, sniffer, settings)
- **JavaScript 代码行数**: 2,104
- **RPCD 方法数**: 34 (最大后端)
- **主要功能**:
  - 五种网络模式:
    - **路由器**: 带 NAT 和防火墙的 WAN/LAN
    - **中继**: 无 NAT 的 IP 转发
    - **接入点**: 无线扩展的桥接模式
    - **嗅探器**: 网络监控模式
    - **自定义**: 用户定义的配置
  - 自动接口检测
  - 每模式配置备份/恢复
  - 无需重启的实时切换
  - 每模式服务管理
  - 动态防火墙规则切换
  - DHCP 服务器/客户端模式切换
  - 接口桥接自动化
- **最近更新**:
  - v0.3.5: 自动部署代理 (Squid/TinyProxy/Privoxy), DoH, nginx 虚拟主机, 和 Let's Encrypt 证书
  - 每模式自动应用高级 WiFi (802.11r/k/v, 频段引导) 和 tcpdump 数据包捕获
- **集成**: 网络, 防火墙, DHCP, hostapd/wpa_supplicant

---

### 4. VPN 和访问控制 (3个模块)

#### luci-app-wireguard-dashboard
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: WireGuard VPN 管理和监控
- **视图**: 6 (overview, peers, config, qrcodes, traffic, settings)
- **JavaScript 代码行数**: 1,571
- **RPCD 方法数**: 15
- **主要功能**:
  - WireGuard 接口管理
  - 对等配置和密钥管理
  - 移动客户端二维码生成
  - 每对等实时流量监控
  - 配置导入/导出
  - 自动密钥对生成
  - 服务器和客户端模式
  - 配置验证
  - 对等允许 IP 管理
- **集成**: wg-tools, wg 命令行接口
- **依赖**: wireguard-tools, qrencode
- **支持的客户端**: iOS, Android, Windows, macOS, Linux

#### luci-app-client-guardian
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 网络访问控制 (NAC) 和强制门户
- **视图**: 9 (overview, clients, zones, alerts, parental, portal, logs, captive, settings)
- **JavaScript 代码行数**: 2,293 (访问控制类别中最大)
- **RPCD 方法数**: 29
- **主要功能**:
  - 带审批工作流的网络访问控制
  - 安全区域 (LAN, 访客, 隔离, DMZ)
  - 客户端设备管理 (批准/封禁/隔离)
  - 带 URL 过滤的家长控制
  - 强制门户集成
  - 实时警报 (电子邮件/短信通知)
  - 每区域带宽限制
  - 基于时间的访问限制
  - 设备指纹识别和分类
  - 会话管理
  - DHCP 租约跟踪
- **集成**: nodogsplash (强制门户), iptables/arptables, DHCP, OpenWrt 防火墙
- **依赖**: nodogsplash, iptables, arptables

#### luci-app-auth-guardian
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 高级身份验证和凭证系统
- **视图**: 6 (overview, sessions, vouchers, splash, oauth, bypass)
- **JavaScript 代码行数**: 312 (最小 UI, 表单为主)
- **RPCD 方法数**: 13
- **主要功能**:
  - OAuth2 集成 (Google, GitHub, Facebook 等)
  - 基于凭证的访问控制系统
  - 会话管理和跟踪
  - 强制门户欢迎页面自定义
  - 多因素身份验证支持
  - 访问绕过规则
  - 身份验证事件审计日志
  - 限时凭证
  - 访客访问管理
- **集成**: nodogsplash, OAuth 提供商, UCI 配置
- **存储**: UCI 配置, sessions JSON, vouchers JSON, logs JSON

---

### 5. 带宽与流量 (3个模块)

#### luci-app-bandwidth-manager
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 带 QoS 和配额的带宽管理
- **视图**: 9 (overview, rules, quotas, usage, clients, media, classes, schedules, settings)
- **JavaScript 代码行数**: 936
- **RPCD 方法数**: 14
- **主要功能**:
  - QoS 流量整形 (HTB, CAKE, FQ_CODEL)
  - 每客户端数据配额和限制
  - 七优先级流量分类:
    - 实时 (VoIP, 游戏)
    - 高优先级 (视频会议)
    - 正常 (网页浏览)
    - 低优先级 (下载)
    - 批量 (种子, 备份)
  - 实时带宽使用监控
  - 历史使用跟踪
  - 媒体流检测和优化
  - 每应用带宽预留
  - 基于计划的带宽策略
  - 配额重置自动化
- **集成**: tc (流量控制), iptables, conntrack
- **提交**: fa9bb2a - "feat: complete Bandwidth Manager implementation"

#### luci-app-traffic-shaper
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 高级流量整形和 QoS 控制
- **视图**: 5 (overview, classes, rules, presets, stats)
- **JavaScript 代码行数**: 985
- **RPCD 方法数**: 16
- **主要功能**:
  - CAKE (Common Applications Kept Enhanced) qdisc 支持
  - HTB (Hierarchical Token Bucket) 支持
  - 具有可配置优先级的流量类
  - 基于端口和协议的分类规则
  - 快速预设配置:
    - **游戏**: 低延迟, 优先 UDP 游戏端口
    - **流媒体**: 优化视频流, 缓冲管理
    - **在家工作**: 优先 VoIP 和视频会议
    - **均衡**: 默认公平队列
  - 实时队列统计
  - 每类带宽分配
  - 突发和上限速率配置
  - 延迟优化
- **集成**: tc 命令, HTB/CAKE qdiscs, iptables 标记
- **验证**: 所有检查通过

#### luci-app-media-flow
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 媒体流量检测和流媒体优化
- **视图**: 5 (dashboard, services, clients, history, alerts)
- **JavaScript 代码行数**: 690 (轻量级检测模块)
- **RPCD 方法数**: 10
- **主要功能**:
  - 流媒体服务检测:
    - Netflix, YouTube, Spotify, Twitch 等
  - 质量估计 (SD/HD/FHD/4K 检测)
  - 每客户端媒体使用跟踪
  - 历史媒体消费分析
  - 服务分类 (视频, 音频, 游戏)
  - 带宽优化提示
  - 过度流媒体警报规则
  - 与 bandwidth-manager 集成进行 QoS
- **集成**: netifyd DPI 引擎用于协议检测
- **依赖**: netifyd-dashboard

---

### 6. 性能与服务 (3个模块)

#### luci-app-cdn-cache
- **版本**: 0.4.1-1
- **状态**: 密集开发阶段
- **描述**: 用于带宽优化的 CDN 代理缓存
- **视图**: 6 (overview, cache, policies, settings, maintenance, statistics)
- **JavaScript 代码行数**: 1,255
- **RPCD 方法数**: 27 (最多方法数)
- **主要功能**:
  - HTTP/HTTPS 缓存代理
  - 每域可配置缓存策略
  - 带宽节省报告
  - 缓存命中率分析
  - 基于域的排除
  - 热门内容缓存预加载
  - TTL (生存时间) 配置
  - 缓存大小管理
  - 过期内容清除
  - 每域缓存统计
  - 带宽节省图表
  - 按带宽排名的顶级域报告
- **基础设施**: Nginx proxy_cache 模块, 缓存目录, stats JSON
- **依赖**: nginx-full

#### luci-app-vhost-manager
- **版本**: 0.4.1-1
- **状态**: 密集开发阶段
- **描述**: 虚拟主机和反向代理管理
- **视图**: 7 (overview, vhosts, certificates, ssl, redirects, internal, logs)
- **JavaScript 代码行数**: 695
- **RPCD 方法数**: 13
- **主要功能**:
  - Nginx 虚拟主机配置
  - SSL/TLS 证书管理
  - ACME 协议支持 (Let's Encrypt)
  - 反向代理设置和配置
  - URL 重定向 (301/302)
  - HTTP 基本身份验证
  - WebSocket 代理支持
  - 自定义 nginx 指令
  - 访问和错误日志聚合
  - 多域托管
  - SNI (服务器名称指示) 支持
- **集成**: nginx, certbot/acme.sh 用于证书
- **依赖**: nginx-ssl, acme (可选)

#### luci-app-ksm-manager
- **版本**: 0.4.0-1
- **状态**: 密集开发阶段
- **描述**: 加密密钥和秘密管理
- **视图**: 8 (overview, keys, certificates, secrets, hsm, ssh, audit, settings)
- **JavaScript 代码行数**: 2,423
- **RPCD 方法数**: 28
- **主要功能**:
  - RSA 和 ECDSA 密钥生成 (2048/4096 位)
  - X.509 证书管理
  - 硬件安全模块 (HSM) 集成:
    - Nitropy NK3 支持
    - YubiKey 5 支持
  - SSH 密钥管理和部署
  - 带加密的秘密存储
  - 全面的审计跟踪
  - 密钥轮换策略和自动化
  - 合规性报告 (FIPS, PCI-DSS)
  - 证书签名请求 (CSR)
  - 密钥导出/导入 (PEM, DER 格式)
- **硬件支持**:
  - Nitropy NK3 (USB-C 加密密钥)
  - YubiKey 5 系列
- **集成**: openssl, gpg, ssh-keygen, HSM 库
- **安全性**: 所有密钥在静态时加密

---

### 7. 物联网与集成 (1个模块)

#### luci-app-mqtt-bridge
- **版本**: 0.5.0-1
- **状态**: 密集开发阶段
- **描述**: 带 USB 设备支持的 MQTT 物联网桥
- **视图**: 2 (overview, adapters)
- **JavaScript 代码行数**: 500 (估计)
- **RPCD 方法数**: 7 (以 USB 为主)
- **主要功能**:
  - 物联网设备的 MQTT 代理集成
  - USB 物联网适配器检测和管理
  - 支持 4 种适配器类型:
    - **Zigbee**: Texas Instruments CC2531, ConBee II, Sonoff Zigbee 3.0
    - **Z-Wave**: Aeotec Z-Stick Gen5/7, Z-Wave.Me UZB
    - **ModBus RTU**: FTDI FT232, Prolific PL2303, CH340
    - **USB 串口**: 通用 USB 转串口适配器
  - VID:PID 设备数据库 (17 个已知设备)
  - 自动适配器类型检测
  - USB 设备扫描和导入向导
  - 串口测试和配置
  - 实时健康监控 (在线/错误/缺失/未知)
  - 适配器持久化的 UCI 配置
- **集成**: MQTT 代理, USB sysfs, /dev/ttyUSB*, /dev/ttyACM*
- **最近更新**:
  - v0.5.0: 完整的 USB 物联网适配器支持
  - 添加带 VID:PID 匹配的 USB 检测库
  - 创建用于 USB 管理的 adapters.js 视图
  - 增强带适配器统计的 overview.js
  - 实现 7 个新的 USB 操作 RPCD 方法
- **依赖**: mosquitto (MQTT 代理), USB 适配器硬件

---

## 实施统计

### 总体指标

| 模块 | 版本 | 视图 | JS 行数 | 方法数 | 状态 |
|------|------|------|---------|--------|------|
| auth-guardian | 0.4.0-1 | 6 | 312 | 13 | 完成 |
| bandwidth-manager | 0.4.0-1 | 9 | 936 | 14 | 完成 |
| cdn-cache | 0.4.1-1 | 6 | 1,255 | 27 | 完成 |
| client-guardian | 0.4.0-1 | 9 | 2,293 | 29 | 完成 |
| crowdsec-dashboard | 0.4.0-1 | 6 | 2,089 | 12 | 完成 |
| ksm-manager | 0.4.0-1 | 8 | 2,423 | 28 | 完成 |
| media-flow | 0.4.0-1 | 5 | 690 | 10 | 完成 |
| mqtt-bridge | 0.5.0-1 | 2 | 500 | 7 | 完成 |
| netdata-dashboard | 0.4.0-1 | 6 | 1,554 | 16 | 完成 |
| netifyd-dashboard | 0.4.0-1 | 7 | 1,376 | 12 | 完成 |
| network-modes | 0.3.1-1 | 7 | 2,104 | 34 | 完成 |
| secubox | 0.6.0-1 | 11 | 2,906 | 33 | 完成 |
| system-hub | 0.3.2-1 | 10 | 4,454 | 18 | 完成 |
| traffic-shaper | 0.4.0-1 | 5 | 985 | 16 | 完成 |
| vhost-manager | 0.4.1-1 | 7 | 695 | 13 | 完成 |
| wireguard-dashboard | 0.4.0-1 | 6 | 1,571 | 15 | 完成 |
| **总计** | | **112** | **27,138** | **288** | **100%** |

### 代码分布

**按模块大小 (JavaScript 行数):**
1. system-hub: 4,454 行 (16.7%)
2. secubox: 2,906 行 (10.9%)
3. ksm-manager: 2,423 行 (9.1%)
4. client-guardian: 2,293 行 (8.6%)
5. network-modes: 2,104 行 (7.9%)

**按视图数量:**
- 平均: 每模块 7.3 个视图
- 最多视图: system-hub (10 个视图)
- 最少视图: media-flow, traffic-shaper (各 5 个视图)

**按 RPCD 方法数:**
- 平均: 每模块 18.7 个方法
- 最多方法: network-modes (34 个方法)
- 最少方法: media-flow (10 个方法)

---

## 验证状态

### 自动化检查 (secubox-tools/validate-modules.sh)

| 检查项 | 状态 | 详情 |
|--------|------|------|
| RPCD 命名 | 通过 | 所有脚本使用 `luci.*` 前缀 |
| 菜单路径 | 通过 | 所有路径匹配视图位置 |
| 视图文件 | 通过 | 所有 110 个视图存在 |
| RPCD 权限 | 通过 | 所有脚本可执行 (755) |
| htdocs 权限 | 通过 | 所有 CSS/JS 可读 (644) |
| JSON 语法 | 通过 | 所有 menu.d 和 acl.d 文件有效 |
| ubus 命名 | 通过 | 所有对象使用正确约定 |

### 模块特定验证

| 模块 | RPCD | 菜单 | 视图 | JSON | 总体 |
|------|------|------|------|------|------|
| auth-guardian | OK | OK | OK | OK | OK |
| bandwidth-manager | OK | OK | OK | OK | OK |
| cdn-cache | OK | OK | OK | OK | OK |
| client-guardian | OK | OK | OK | OK | OK |
| crowdsec-dashboard | OK | OK | OK | OK | OK |
| ksm-manager | OK | OK | OK | OK | OK |
| media-flow | OK | OK | OK | OK | OK |
| mqtt-bridge | OK | OK | OK | OK | OK |
| netdata-dashboard | OK | OK | OK | OK | OK |
| netifyd-dashboard | OK | OK | OK | OK | OK |
| network-modes | OK | OK | OK | OK | OK |
| secubox | OK | OK | OK | OK | OK |
| system-hub | OK | OK | OK | OK | OK |
| traffic-shaper | OK | OK | OK | OK | OK |
| vhost-manager | OK | OK | OK | OK | OK |
| wireguard-dashboard | OK | OK | OK | OK | OK |

**结果:** 16/16 模块通过所有验证检查 (100%)

---

## 构建系统状态

### GitHub Actions 工作流

#### 1. build-openwrt-packages.yml
- **状态**: 运行正常
- **目的**: 为所有架构构建 IPK/APK 包
- **支持的架构**: 共 13 个
  - **ARM64** (6): aarch64-cortex-a53, aarch64-cortex-a72, aarch64-generic, mediatek-filogic, rockchip-armv8, bcm27xx-bcm2711
  - **ARM32** (4): arm-cortex-a7-neon, arm-cortex-a9-neon, qualcomm-ipq40xx, qualcomm-ipq806x
  - **MIPS** (2): mips-24kc, mipsel-24kc
  - **x86** (1): x86-64
- **触发条件**: 推送到 master, pull requests, git 标签
- **输出**: 架构特定的 .ipk (24.10) 或 .apk (25.12+) 包
- **最近更新**:
  - 添加 .apk 包格式支持 (OpenWrt 25.12+)
  - 更新到 OpenWrt 24.10.5 和 25.12.0-rc1
  - 添加 ninja-build 依赖

#### 2. build-secubox-images.yml
- **状态**: 运行正常
- **目的**: 构建预装 SecuBox 的完整固件镜像
- **目标设备**:
  - Globalscale ESPRESSObin V7/Ultra (aarch64-cortex-a53)
  - Globalscale MOCHAbin (aarch64-cortex-a72)
  - Marvell Sheeva64 (aarch64-cortex-a53)
- **包含的包**: 所有 15 个 SecuBox 模块
- **输出**: 固件镜像 (.img.gz, *-sysupgrade.bin)
- **最近修复**:
  - 修复 opkg 锁文件问题
  - 在工具链中禁用 GDB
  - 添加镜像生成标志
  - 添加 ninja-build 依赖

#### 3. test-validate.yml
- **状态**: 运行正常
- **目的**: 自动化验证和测试
- **检查项**:
  - Makefile 结构验证
  - JSON 语法 (menu.d, acl.d)
  - Shell 脚本验证 (shellcheck)
  - 文件权限验证
  - RPCD 命名约定
  - 菜单路径验证

### 本地构建系统

#### secubox-tools/local-build.sh
- **版本**: 2.0 (增强版)
- **功能**:
  - 包构建 (基于 SDK)
  - 固件构建 (完整 OpenWrt 源码)
  - 验证套件 (7 项自动化检查)
  - 多架构支持 (6 种架构)
- **命令**:
  - `validate` - 运行所有验证检查
  - `build [module]` - 构建包
  - `firmware` - 构建完整固件
  - `debug-firmware` - 调试配置
  - `full` - 验证 + 构建
  - `clean` - 删除构建产物
- **包格式**:
  - OpenWrt 24.10 及更早版本: .ipk (opkg)
  - OpenWrt 25.12+ 和 SNAPSHOT: .apk (Alpine apk)
- **环境变量**:
  - `OPENWRT_VERSION`: 24.10.5 (默认), 25.12.0-rc1, 23.05.5, SNAPSHOT
  - `SDK_DIR`: SDK 缓存目录 (默认: ./sdk)
  - `BUILD_DIR`: 构建输出 (默认: ./build)
  - `CACHE_DIR`: 下载缓存 (默认: ./cache)

---

## 版本历史

### v2.0.0 (2025-12-28) - 当前版本
- **文档**: 完整的 GitHub Pages 和 Wiki 设置
- **CI/CD**: 完整的 .apk 包格式支持
- **模块**: 所有 15 个模块生产就绪
- **验证**: 实现 7 项自动化检查
- **架构**: 支持 13 个平台

### v0.3.3 (2025-12-28)
- 文档改进
- 添加架构图 (3 个 Mermaid 图)
- 文档间交叉引用
- 历史文档归档

### v0.3.2 (2025-12)
- System Hub v0.3.2 带增强小部件
- 现代化快速状态带直方图
- 添加网络和服务实时小部件
- 改进系统日志查看器

### v0.3.1 (2025-12)
- SecuBox v0.3.1 带权限管理
- Network Modes v0.3.1 增强
- 支持 apk 和 opkg 包管理器
- 向仪表板端点添加版本信息

### v0.2.2 (2025-11)
- 12 个模块版本标准化
- Traffic Shaper 模块完成
- 构建系统改进
- 权限修复

### v0.1.x 系列 (2025-Q4)
- 初始模块实现
- RPCD 命名约定标准化
- ACL 系统实现
- GitHub Actions 工作流

---

## 架构支持

### 第一级 - 完整测试和支持
- **x86-64**: PC, 虚拟机, 基于 x86 的路由器
- **aarch64-cortex-a72**: MOCHAbin, Raspberry Pi 4
- **aarch64-cortex-a53**: ESPRESSObin, Sheeva64

### 第二级 - 仅包构建
- **ARM64**: mediatek-filogic, rockchip-armv8, bcm27xx-bcm2711
- **ARM32**: cortex-a7-neon, cortex-a9-neon, ipq40xx, ipq806x
- **MIPS**: 24kc, mipsel 变体

### 支持的 OpenWrt 版本
- **25.12.0-rc1** (最新, 主要目标)
- **24.10.5** (LTS, 稳定)
- **23.05.5** (遗留支持)
- **SNAPSHOT** (开发)

---

## 开发活动

### 最近提交 (2025)

**文档** (2025年12月28日):
- 75042a8: 添加带 MkDocs Material 的 GitHub Pages 文档站点
- dcdbd7b: 添加 GitHub Wiki 和 Pages 设置自动化
- 4032834: 重组文档结构并添加架构图

**System Hub** (2025年12月):
- 00f2f20: 现代化快速状态小部件，带直方图和渐变
- 14a5aca: 向实时指标添加网络和服务小部件
- 4255a23: 添加小部件首选项样式和新的小部件渐变
- f711001: 删除重复小部件并添加现代直方图
- fadf606: 为 v0.3.2 增强动态概览统计
- e90cf85: 实现工作系统日志查看器

**SecuBox Core** (2025年12月):
- f552cf7: 添加 LuCI 开发状态视图
- a995b81: 向 CI 依赖添加 ninja-build
- 72a2b29: 修复模块仪表板按钮 URL
- c7ab10b: 在工作流中支持 .apk 包格式
- acdc7bc: 向仪表板数据端点添加版本信息
- c5152f5: 支持 apk 和 opkg 包管理器

**基础设施** (2025年11-12月):
- c1669b0: 添加 .apk 包格式支持 (OpenWrt 25.12+)
- c1dd6a9: 向构建工作流添加 OpenWrt 25.12.0-rc1 和 24.10.5
- 1122f84: 修复 ACL 文件以使用正确的 luci.* ubus 对象命名
- 0759c74: 添加缺失的 API 函数以解决模块错误

### 贡献活动
- **提交 (2025年1-12月)**: 30+ 次提交
- **更改行数**: 15,000+ 插入
- **修改文件**: 200+ 文件
- **活跃开发**: 进行中

---

## 已知问题和待办事项

### 已解决的问题
- ~~client-guardian captive.js 缺失~~ - 在 v0.2.2 中修复
- ~~RPCD 命名不一致~~ - 在 v0.1.3 中修复
- ~~菜单路径不匹配~~ - 在 v0.1.2 中修复
- ~~权限错误~~ - 创建了自动修复脚本
- ~~OpenWrt 25.12 构建失败~~ - 添加了 apk 支持

### 未来增强

**优先级 1 - 生产部署**:
1. 在所有支持平台上进行硬件测试
2. 性能基准测试套件
3. 模块间集成测试
4. 多用户场景负载测试

**优先级 2 - 功能**:
1. 多语言支持 (i18n)
2. 移动应用集成 (REST API)
3. 电子邮件/短信通知系统
4. 自动备份到云存储
5. 模块市场/仓库

**优先级 3 - 文档**:
1. 每个模块的视频教程
2. 交互式演示
3. API 文档 (OpenAPI/Swagger)
4. 故障排除流程图

---

## 部署指南

### 安装前准备

**系统要求**:
- OpenWrt 23.05+ 或 24.10+ (推荐)
- 架构: x86-64, ARM64, ARM32, 或 MIPS
- 存储: 所有模块最少需要 50MB
- 内存: 最少 128MB (推荐 256MB)

**依赖检查**:
```bash
# 安装核心依赖
opkg update
opkg install luci luci-base rpcd rpcd-mod-ubus uhttpd

# 可选依赖 (按模块)
opkg install crowdsec netdata netifyd wireguard-tools nodogsplash nginx
```

### 安装方法

#### 方法 1: 包管理器 (推荐)
```bash
# OpenWrt 24.10 及更早版本 (opkg)
opkg update
opkg install luci-app-secubox luci-app-system-hub

# OpenWrt 25.12+ (apk)
apk update
apk add luci-app-secubox luci-app-system-hub
```

#### 方法 2: 手动安装
```bash
# 从 GitHub Releases 下载
wget https://github.com/CyberMind-FR/secubox-openwrt/releases/download/v2.0.0/luci-app-secubox_*.ipk

# 安装
opkg install luci-app-secubox_*.ipk

# 重启服务
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

#### 方法 3: 固件镜像
- 从 GitHub Releases 下载预构建固件
- 刷入支持的硬件 (ESPRESSObin, MOCHAbin 等)
- 所有 SecuBox 模块已预装

### 安装后

```bash
# 验证安装
opkg list-installed | grep luci-app-

# 访问 SecuBox 仪表板
# 导航到: http://192.168.1.1/cgi-bin/luci/admin/secubox

# 启用模块
# 使用 SecuBox 仪表板 -> 模块 -> 启用所需模块
```

### 验证

```bash
# 测试 RPCD 后端
ubus list | grep luci.

# 测试服务
/etc/init.d/rpcd status
/etc/init.d/uhttpd status

# 检查权限
./secubox-tools/validate-modules.sh
```

---

## 维护

### 常规任务

**每日**:
- 通过 system-hub 监控系统健康
- 在 crowdsec-dashboard 中查看安全警报
- 在 bandwidth-manager 中检查带宽使用

**每周**:
- 更新包列表: `opkg update`
- 在 system-hub 中查看日志
- 通过 system-hub 备份配置

**每月**:
- 更新包: `opkg upgrade`
- 查看和轮换日志
- 测试备份/恢复功能
- 通过 crowdsec 指标进行安全审计

### 故障排除

**常见问题**:

1. **模块不出现在菜单中**
   - 检查 ACL 权限: `/usr/share/rpcd/acl.d/luci-app-*.json`
   - 重启 rpcd: `/etc/init.d/rpcd restart`
   - 清除浏览器缓存

2. **RPC 错误 (Object not found)**
   - 验证 RPCD 脚本: `/usr/libexec/rpcd/luci.*`
   - 检查权限: `chmod 755 /usr/libexec/rpcd/luci.*`
   - 测试 ubus: `ubus call luci.module method`

3. **服务无法启动**
   - 检查依赖: `opkg list-installed`
   - 查看日志: `logread`
   - 验证配置: `uci show module`

**调试工具**:
- `./secubox-tools/validate-modules.sh` - 完整验证
- `./secubox-tools/secubox-debug.sh <module>` - 模块诊断
- `./secubox-tools/secubox-repair.sh` - 自动修复常见问题
- `ubus call luci.module status` - 测试 RPC 后端

---

## 发布流程

### 版本编号
- **主版本.次版本.补丁** (语义版本控制)
- 示例: v2.0.0
  - 主版本: 破坏性更改, 架构更新
  - 次版本: 新功能, 模块添加
  - 补丁: 错误修复, 文档

### 发布检查清单

1. **发布前**:
   - [ ] 运行完整验证: `./secubox-tools/validate-modules.sh`
   - [ ] 更新所有 Makefile 中的版本
   - [ ] 更新 DOCS/MODULE_STATUS.md
   - [ ] 在目标硬件上测试
   - [ ] 本地构建包: `./secubox-tools/local-build.sh build`
   - [ ] 审查 CHANGELOG

2. **发布**:
   - [ ] 创建 git 标签: `git tag -a v2.0.0 -m "Release 2.0.0"`
   - [ ] 推送标签: `git push origin v2.0.0`
   - [ ] 等待 GitHub Actions 完成
   - [ ] 验证构建产物已上传

3. **发布后**:
   - [ ] 下载并测试包
   - [ ] 更新文档站点
   - [ ] 在项目渠道发布公告
   - [ ] 创建带说明的 GitHub Release

---

## 资源

### 文档
- **DEVELOPMENT-GUIDELINES.md** - 完整开发参考
- **QUICK-START.md** - 快速参考指南
- **CLAUDE.md** - 构建系统和架构
- **VALIDATION-GUIDE.md** - 模块验证程序
- **PERMISSIONS-GUIDE.md** - ACL 和权限
- 每个 `luci-app-*/` 目录中的模块 README.md 文件

### 工具
- `secubox-tools/validate-modules.sh` - 完整验证 (7 项检查)
- `secubox-tools/fix-permissions.sh` - 自动修复文件权限
- `secubox-tools/secubox-repair.sh` - 自动修复常见问题
- `secubox-tools/secubox-debug.sh` - 模块诊断
- `secubox-tools/local-build.sh` - 本地构建系统

### 在线资源
- **GitHub 仓库**: https://github.com/CyberMind-FR/secubox-openwrt
- **GitHub Pages**: https://gkerma.github.io/secubox-openwrt/
- **GitHub Wiki**: https://github.com/CyberMind-FR/secubox-openwrt/wiki
- **在线演示**: https://secubox.cybermood.eu

---

## 许可证

**所有模块**: Apache License 2.0

---

## 维护者

**SecuBox 项目**
CyberMind.fr
GitHub: @gkerma

---

## 摘要

**SecuBox v2.0.0** 是一套完整的、生产就绪的 15 个 OpenWrt LuCI 应用程序套件，提供全面的安全、监控和网络管理功能。

**主要成就**:
- 100% 实施完成率 (110 个视图, 26,638 行 JS, 281 个 RPC 方法)
- 完整的验证覆盖 (7 项自动化检查)
- 多架构支持 (13 个平台)
- 双包格式支持 (opkg .ipk 和 apk .apk)
- 全面的文档 (GitHub Pages + Wiki)
- 经过生产测试和部署

**下一个里程碑**: v2.1.0 带有增强的集成测试和移动应用支持。

---

*最后更新: 2025-12-28 由仓库自动分析*
