[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox 中央控制台

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

OpenWrt 上 SecuBox 安全和网络管理套件的集中管理仪表板。

## 功能特性

### 仪表板概览
- 实时系统健康监控（CPU、内存、磁盘、网络）
- 带有颜色编码状态指示器的可视化仪表
- 带有快速访问链接的模块状态网格
- 所有模块的聚合警报
- 常见任务的快速操作按钮

### 系统健康监控
- **CPU**：负载平均值和百分比，支持多核
- **内存**：RAM 使用情况，包含总量/已用/可用指标
- **磁盘**：根文件系统使用情况和可用空间
- **网络**：实时 RX/TX 带宽统计

### 快速操作
- 重启 RPCD 服务
- 重启 uHTTPd Web 服务器
- 清除系统缓存
- 创建配置备份
- 重启网络服务
- 重启防火墙

### 模块管理
自动检测和状态监控所有 SecuBox 模块：

**安全与监控**
- **CrowdSec** - 协作式威胁情报
- **Netdata** - 实时系统监控
- **Netifyd** - 深度包检测
- **Client Guardian** - 网络访问控制和强制门户
- **Auth Guardian** - 高级认证系统

**网络管理**
- **WireGuard** - 带二维码的现代 VPN
- **网络模式** - 网络拓扑配置
- **带宽管理器** - QoS 和带宽配额
- **Media Flow** - 媒体流量检测和优化
- **Traffic Shaper** - 高级流量整形

**系统与性能**
- **System Hub** - 统一控制中心
- **CDN Cache** - 本地缓存代理
- **虚拟主机管理器** - 虚拟主机配置

### 向导与应用商店集成
- 首次运行助手，验证密码、时区、存储和首选网络模式
- 清单驱动的应用向导（如 Zigbee2MQTT）直接显示在 SecuBox 中
- `secubox-app` CLI（安装在 `/usr/sbin/`）用于通过清单进行脚本化安装/更新
- 插件存储在 `/usr/share/secubox/plugins/<app>/manifest.json` 以便扩展

## LuCI 菜单结构

SecuBox 中心在 LuCI 中将所有模块组织成层次化菜单结构：

```
SecuBox
├── 仪表板                        （主概览和系统健康）
├── 模块                          （模块管理视图）
├── 安全与监控
│   ├── CrowdSec                 （协作式威胁情报）
│   ├── Netdata                  （实时系统监控）
│   ├── Netifyd                  （深度包检测）
│   ├── Client Guardian          （网络访问控制和强制门户）
│   └── Auth Guardian            （高级认证系统）
├── 网络管理
│   ├── WireGuard                （带二维码的现代 VPN）
│   ├── 网络模式                  （网络拓扑配置）
│   ├── 带宽管理器                （QoS 和带宽配额）
│   ├── Media Flow               （媒体流量检测和优化）
│   └── Traffic Shaper           （高级流量整形）
└── 系统与性能
    ├── System Hub               （统一控制中心）
    ├── CDN Cache                （本地缓存代理）
    └── 虚拟主机管理器             （虚拟主机配置）
```

### 菜单注册

中心定义了三个类别父菜单，其他 SecuBox 模块在其下注册：

- **`admin/secubox/security`** - 安全与监控模块
- **`admin/secubox/network`** - 网络管理模块
- **`admin/secubox/system`** - 系统与性能模块

每个模块在安装时自动出现在适当的类别中。

### 菜单问题排查

如果模块在安装后未出现在菜单中：

1. **重启服务：**
   ```bash
   /etc/init.d/rpcd restart
   /etc/init.d/uhttpd restart
   ```

2. **清除浏览器缓存：** 按 `Ctrl+Shift+R` 强制刷新

3. **验证菜单文件是否存在：**
   ```bash
   ls -la /usr/share/luci/menu.d/luci-app-*.json
   ```

4. **检查 ACL 权限：**
   ```bash
   ls -la /usr/share/rpcd/acl.d/luci-app-*.json
   ```

## RPCD API 方法

中心通过 ubus 提供完整的 RPC API：

- `status` - 获取中心状态和基本系统信息
- `modules` - 列出所有带状态的 SecuBox 模块
- `modules_by_category` - 按类别筛选模块
- `module_info` - 获取特定模块的详细信息
- `get_system_health` - 详细的系统健康指标
- `get_alerts` - 所有模块的聚合警报
- `get_dashboard_data` - 一次调用获取所有仪表板数据
- `quick_action` - 执行快速操作
- `start_module` / `stop_module` / `restart_module` - 模块控制
- `health` - 系统健康检查
- `diagnostics` - 生成诊断包

## 安装

```bash
opkg update
opkg install luci-app-secubox
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 编译

```bash
# 克隆到 OpenWrt SDK
git clone https://github.com/youruser/luci-app-secubox.git package/luci-app-secubox
make package/luci-app-secubox/compile V=s
```

## 配置

编辑 `/etc/config/secubox` 来自定义模块定义和设置。

## 文件结构

```
luci-app-secubox/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/secubox/
│   │   ├── dashboard.js      # 主仪表板视图
│   │   ├── modules.js         # 模块管理视图
│   │   └── settings.js        # 设置视图
│   └── secubox/
│       ├── api.js             # RPC API 客户端
│       └── secubox.css        # 仪表板样式
└── root/
    ├── etc/config/secubox     # UCI 配置
    └── usr/
        └── share/
            ├── luci/menu.d/luci-app-secubox.json
            └── rpcd/acl.d/luci-app-secubox.json

    # 注意：RPCD 后端（luci.secubox）由 secubox-core 包提供
```

## 许可证

Apache-2.0 - 版权所有 (C) 2025 CyberMind.fr
