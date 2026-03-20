# 网络服务仪表板 (luci-app-network-tweaks)

**统一网络服务监控，具备动态组件发现、累积影响跟踪和自动DNS/hosts同步功能**

![版本](https://img.shields.io/badge/version-2.0.0-blue.svg)
![许可证](https://img.shields.io/badge/license-Apache--2.0-green.svg)
![平台](https://img.shields.io/badge/platform-OpenWrt-orange.svg)

## 概述

网络服务仪表板（前身为Network Tweaks）将自动VHost DNS同步与全面的网络服务监控相结合。它提供对所有影响网络的服务的实时可见性、它们对系统的累积影响，并与网络模式集成以进行基于配置文件的配置。

### 主要功能

#### 网络服务仪表板 (v2.0+)
- **动态组件发现** - 自动从SecuBox插件目录发现与网络相关的服务
- **累积影响跟踪** - 实时指标显示DNS条目、VHosts和暴露端口的总数
- **网络模式集成** - 由网络模式配置文件控制的同步设置
- **自动刷新** - 每10秒实时更新
- **多源数据聚合** - 组合清单元数据、安装状态、运行时状态和VHost关联
- **现代网格界面** - 响应式卡片布局，带详细组件视图

#### 核心同步 (v1.0+)
- **自动DNS生成** - 为所有启用的VHost域名创建DNSmasq配置条目
- **Hosts文件管理** - 使用VHost域名条目更新`/etc/hosts`
- **实时同步** - 监视VHost配置更改并自动更新
- **LuCI集成** - 用户友好的Web界面，带状态仪表板
- **灵活配置** - 选择启用哪些功能（DNS、hosts或两者）
- **网络感知** - 自动检测LAN IP或允许手动覆盖

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [网络服务仪表板](#网络服务仪表板)
- [核心同步](#核心同步)
- [配置](#配置)
- [网络模式集成](#网络模式集成)
- [技术文档](#技术文档)
- [故障排除](#故障排除)
- [开发](#开发)
- [更新日志](#更新日志)

## 安装

```bash
# 编译包
make package/luci-app-network-tweaks/compile

# 在路由器上安装
opkg install luci-app-network-tweaks_*.ipk

# 启用并启动
/etc/init.d/network-tweaks enable
/etc/init.d/network-tweaks start
```

## 快速开始

1. **访问仪表板**：
   - 在LuCI中导航至 **网络 -> 网络服务仪表板**

2. **查看网络影响**：
   - 一目了然地查看活跃组件、DNS条目、VHosts和暴露端口
   - 监控各个服务状态和贡献

3. **配置同步**：
   - 启用DNS和/或hosts同步
   - 选择自动同步或手动模式

4. **与VHost Manager集成**：
   - 在VHost Manager中启用VHosts
   - Network Tweaks自动使它们在LAN上可解析

## 网络服务仪表板

### 架构

```
插件目录清单 -> 发现引擎 -> 数据聚合 -> 仪表板显示
      |               |            |            |
  *.json文件     网络过滤器    统一数据     网格卡片
  (元数据)      (端口/协议)    模型(JSON)    + 指标
```

### 仪表板部分

#### 1. 影响摘要

四个指标卡显示整体网络影响：

| 指标 | 描述 |
|------|------|
| **活跃组件** | 当前正在运行的服务 |
| **DNS条目** | 管理的DNS记录总数 |
| **已发布VHosts** | 已配置的虚拟主机 |
| **暴露端口** | 已打开的网络端口 |

#### 2. 网络模式状态

显示：
- 当前网络模式（路由器、DMZ、旅行等）
- 模式特定的同步设置
- DNS同步是否启用

#### 3. 组件网格

响应式组件卡片网格，每个显示：

**状态徽章**：
- **运行中** - 服务活跃
- **已停止** - 服务已安装但未运行
- **N/A** - 无可用运行时

**安装状态**：
- **已安装** - 所有包都存在
- **部分** - 某些包缺失
- **可用** - 准备安装

**网络影响**：
- **DNS条目** - DNS记录数量
- **VHosts** - 已发布的虚拟主机
- **端口** - 暴露的网络端口

**贡献**：
- 显示此组件对整体配置的贡献量

**操作**：
- **详情** - 查看完整组件信息

### 组件详情对话框

点击任意卡片上的 **详情** 查看：

```
组件：AdGuard Home
类别：网络
安装状态：已安装
服务状态：运行中

网络影响：
- DNS条目：1
- VHosts：1
- 端口：2

能力：
[dns-filtering] [ad-blocking] [vhost-publish]
```

### 发现过程

1. **清单扫描**：扫描 `/usr/share/secubox/plugins/catalog/*.json`
2. **网络过滤**：识别具有网络影响的应用：
   - `network.inbound_ports[]` - 暴露网络端口的应用
   - `network.protocols[]` - 使用网络协议的应用
   - `capabilities[]` - 与网络相关的能力
3. **状态查询**：
   - **安装状态**：通过 `opkg status` 或 `apk info`
   - **运行时状态**：通过 `docker ps` 或 init.d 服务
   - **VHost关联**：与已发布VHosts的匹配
4. **影响计算**：计算DNS条目、hosts、端口、VHosts
5. **聚合**：组合成统一的JSON响应

### 网络相关性检测

如果应用的清单包含以下内容，则会出现在仪表板中：

**网络端口**：
```json
{
  "network": {
    "inbound_ports": [53, 3000]
  }
}
```

**网络协议**：
```json
{
  "network": {
    "protocols": ["http", "https", "dns"]
  }
}
```

**网络能力**：
```json
{
  "capabilities": [
    "vhost-publish",
    "dns-filtering",
    "proxy",
    "firewall",
    "vpn",
    "network-service"
  ]
}
```

## 核心同步

### 工作原理

1. **监控VHosts**：监视 `/etc/config/vhosts` 中启用的虚拟主机
2. **生成条目**：
   - **DNSmasq**：创建带有 `address=/domain/ip` 条目的 `/tmp/dnsmasq.d/50-vhosts.conf`
   - **Hosts**：在受管部分将条目附加到 `/etc/hosts`
3. **自动重载**：检测到更改时自动重载DNSmasq
4. **触发器**：
   - VHost配置更改（通过UCI触发器）
   - 网络接口up事件（LAN）
   - 通过LuCI或CLI手动同步

### 生成的文件

#### DNSmasq配置
**位置**：`/tmp/dnsmasq.d/50-vhosts.conf`

```
# VHost Manager域名的自动生成DNS条目
# 由network-tweaks管理
# IP: 192.168.1.1
# 生成时间: 2026-01-01 12:00:00

address=/cloud.local/192.168.1.1
address=/adguard.local/192.168.1.1
address=/domoticz.local/192.168.1.1
```

#### Hosts条目
**附加到**：`/etc/hosts`

```
# 由network-tweaks管理
# VHost Manager域名的自动生成hosts条目
# 生成时间: 2026-01-01 12:00:00
192.168.1.1 cloud.local
192.168.1.1 adguard.local
192.168.1.1 domoticz.local
```

### 命令行用法

```bash
# 同步所有条目
network-tweaks-sync sync

# 查看当前状态
network-tweaks-sync status

# 清理所有受管条目
network-tweaks-sync cleanup
```

### 服务管理

```bash
# 启用自动启动
/etc/init.d/network-tweaks enable

# 启动服务
/etc/init.d/network-tweaks start

# 重载配置（触发同步）
/etc/init.d/network-tweaks reload

# 检查状态
/etc/init.d/network-tweaks status
```

## 配置

### Web界面设置

在仪表板的 **配置** 部分找到：

| 选项 | 默认 | 描述 |
|------|------|------|
| **启用Network Tweaks** | 是 | DNS/hosts同步的主开关 |
| **自动同步** | 是 | VHost配置更改时自动同步 |
| **同步DNSmasq** | 是 | 为本地域名解析生成DNSmasq配置 |
| **同步/etc/hosts** | 是 | 用VHost域名更新/etc/hosts文件 |
| **LAN接口** | `lan` | 用于IP地址检测的网络接口 |
| **覆盖IP地址** | _空_ | 手动指定IP（留空为自动检测） |

### 配置文件

编辑 `/etc/config/network_tweaks`：

```
config global 'global'
	option enabled '1'            # 启用/禁用Network Tweaks
	option auto_sync '1'          # 配置更改时自动同步
	option sync_hosts '1'         # 更新/etc/hosts
	option sync_dnsmasq '1'       # 生成DNSmasq配置
	option lan_interface 'lan'    # 用于IP的接口
	option default_ip ''          # 手动IP覆盖（空=自动检测）
```

## 网络模式集成

每个网络模式配置文件包含network-tweaks设置：

### 路由器模式（默认）
```
config mode 'router'
	option network_tweaks_enabled '1'
	option network_tweaks_sync_hosts '1'
	option network_tweaks_sync_dnsmasq '1'
	option network_tweaks_auto_sync '1'
```

### 嗅探器模式（透明）
```
config mode 'sniffer'
	option network_tweaks_enabled '0'    # 为透明性禁用
	option network_tweaks_sync_hosts '0'
	option network_tweaks_sync_dnsmasq '0'
```

### 其他模式
所有其他模式（DMZ、接入点、中继、双NAT、旅行、多WAN、VPN中继）启用network-tweaks并完全同步。

## 技术文档

### 后端RPC API

#### `getNetworkComponents`

返回所有与网络相关的组件及聚合数据。

**请求**：无参数

**响应**：
```json
{
  "success": true,
  "components": [
    {
      "id": "adguardhome",
      "name": "AdGuard Home",
      "category": "network",
      "install_state": "installed",
      "service_state": "running",
      "network_impact": {
        "dns_entries": 1,
        "vhosts": 1,
        "ports": 2
      },
      "cumulative_contribution": {
        "dnsmasq_entries": 1,
        "hosts_entries": 1,
        "ports_opened": 2
      },
      "capabilities": ["dns-filtering", "vhost-publish"]
    }
  ],
  "cumulative_summary": {
    "total_components": 12,
    "active_components": 8,
    "total_dns_entries": 18,
    "total_vhosts": 6,
    "total_ports_exposed": 23
  },
  "network_mode": {
    "current_mode": "router",
    "mode_name": "Router",
    "sync_enabled": true
  }
}
```

#### `getCumulativeImpact`

返回聚合的网络影响摘要。

#### `setComponentEnabled`

启用/禁用组件网络功能。

**请求**：
```json
{
  "app_id": "adguardhome",
  "enabled": true
}
```

#### 旧版方法

- `getStatus` - 带VHost计数的状态
- `syncNow` - 触发立即同步
- `getConfig` - 获取当前配置
- `setConfig` - 更新配置

### CLI集成

**UBUS命令**：
```bash
# 获取所有组件
ubus call luci.network-tweaks getNetworkComponents

# 获取累积影响
ubus call luci.network-tweaks getCumulativeImpact

# 获取配置
ubus call luci.network-tweaks getConfig

# 触发同步
ubus call luci.network-tweaks syncNow
```

### 前端架构

**主视图**：`/luci-static/resources/view/network-tweaks/overview.js`

关键方法：
- `load()` - 初始化数据并加载CSS
- `renderDashboard()` - 构建完整仪表板
- `renderCumulativeImpact()` - 影响摘要卡片
- `renderNetworkModeStatus()` - 模式指示器
- `renderComponentsGrid()` - 组件卡片
- `showComponentDetails()` - 详情对话框
- `pollData()` - 自动刷新（10秒间隔）
- `updateDisplay()` - 实时DOM更新

**样式**：`/luci-static/resources/network-tweaks/dashboard.css`

响应式网格：
- 桌面：4列网格（最小200px）
- 移动：单列
- 悬停效果和动画
- 状态颜色编码

## 故障排除

### 组件未显示

**症状**：仪表板显示"未检测到影响网络的组件"

**解决方案**：
1. 检查插件目录是否存在：
   ```bash
   ls /usr/share/secubox/plugins/catalog/
   ```

2. 验证清单格式：
   ```bash
   cat /usr/share/secubox/plugins/catalog/adguardhome.json
   ```

3. 手动测试RPC：
   ```bash
   ubus call luci.network-tweaks getNetworkComponents
   ```

### 服务状态显示"N/A"

**原因**：
- Docker未安装/运行
- Init脚本不存在
- 清单中的`runtime`错误

**解决方案**：
1. 对于Docker应用：
   ```bash
   docker ps --filter "name=adguardhome"
   ```

2. 对于本地服务：
   ```bash
   /etc/init.d/service-name running
   ```

### DNS解析不工作

**解决方案**：
1. 检查dnsmasq配置：
   ```bash
   cat /tmp/dnsmasq.d/50-vhosts.conf
   ```

2. 验证dnsmasq运行：
   ```bash
   ps | grep dnsmasq
   ```

3. 检查hosts文件：
   ```bash
   cat /etc/hosts
   ```

4. 触发手动同步：
   - 在仪表板点击 **立即同步**
   - 或：`/usr/sbin/network-tweaks-sync sync`

5. 确保客户端使用路由器作为DNS：
   ```bash
   nslookup cloud.local
   ```

### 自动刷新不工作

**解决方案**：
1. 检查浏览器控制台是否有错误
2. 验证轮询（10秒间隔）
3. 强制刷新：Ctrl+Shift+R

## 开发

### 添加自定义组件

创建插件目录条目：

```bash
# /usr/share/secubox/plugins/catalog/myapp.json
{
  "id": "myapp",
  "name": "我的自定义应用",
  "category": "network",
  "runtime": "native",
  "packages": ["myapp"],
  "network": {
    "inbound_ports": [8080],
    "protocols": ["http"]
  },
  "capabilities": ["vhost-publish"]
}
```

### 添加新RPC方法

1. 在`list`部分声明：
   ```bash
   json_add_object "myMethod"
   json_close_object
   ```

2. 在`call`部分实现：
   ```bash
   myMethod)
       json_init
       json_add_boolean "success" 1
       # 实现
       json_dump
       ;;
   ```

### 前端开发

添加仪表板部分：

```javascript
renderDashboard: function() {
    return E('div', { 'class': 'network-tweaks-dashboard' }, [
        this.renderCumulativeImpact(),
        this.renderMyNewSection(),  // 在此添加
        this.renderComponentsGrid()
    ]);
}
```

## 示例工作流程

### 使用Network Tweaks设置Nextcloud

1. 安装Nextcloud：
   ```bash
   nextcloudctl install
   /etc/init.d/nextcloud start
   ```

2. 在VHost Manager中创建VHost：
   - 域名：`cloud.local`
   - 后端：`http://127.0.0.1:80`
   - SSL：启用
   - 启用VHost

3. Network Tweaks自动：
   - 创建DNS条目：`cloud.local` -> `192.168.1.1`
   - 更新hosts文件
   - 重载DNSmasq

4. 从任何设备访问：
   - 打开 `https://cloud.local`
   - 域名解析到路由器
   - Nginx转发到Nextcloud

## 性能考虑

### 响应时间
- 典型RPC响应：200-500ms
- 仪表板初始加载：1-2s
- 自动刷新影响：最小

### 轮询
- 间隔：10秒
- CPU影响：最小
- 网络：每次请求约5KB
- 内存：稳定（无累积）

### 未来优化
- 清单扫描的30秒TTL缓存
- 增量发现更新
- 后台worker处理重查询

## 依赖

- `luci-base` - LuCI Web界面
- `rpcd` - UBUS RPC守护进程
- `luci-app-vhost-manager` - VHost Manager（域名来源）
- `dnsmasq` - DNS服务器

## 更新日志

### v2.0.0 (2026-01-01) - 网络服务仪表板

**主要功能**：
- 从插件目录动态发现组件
- 累积影响跟踪仪表板
- 网络模式集成
- 带组件卡片的网格界面
- 10秒轮询自动刷新
- 组件详情对话框
- 响应式设计，支持深色模式

**后端**：
- 添加 `getNetworkComponents` RPC方法
- 添加 `getCumulativeImpact` RPC方法
- 添加 `setComponentEnabled` RPC方法
- 添加8个发现/聚合辅助函数
- 网络模式状态集成

**前端**：
- 完全重写 `overview.js`
- 新的带网格系统的 `dashboard.css`
- 影响摘要卡片
- 网络模式指示器
- 带状态徽章的组件网格

**配置**：
- 向所有8种网络模式添加network-tweaks选项
- 配置保持向后兼容

### v1.0.0 - 初始版本 (Network Tweaks)

- 基本VHost到DNS/hosts同步
- 手动同步触发
- 简单统计显示
- VHost更改时自动同步
- Hotplug集成

## 许可证

Apache-2.0

## 作者

CyberMind Studio <contact@cybermind.fr>

## 支持

- **Issues**：https://github.com/CyberMind-FR/secubox-openwrt/issues
- **文档**：本README
- **版本**：2.0.0
- **最后更新**：2026-01-01

## 贡献

欢迎贡献！请：
1. 彻底测试更改
2. 更新文档
3. 遵循现有代码风格
4. 提交带清晰描述的PR
