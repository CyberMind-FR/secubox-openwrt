[English](README.md) | [Francais](README.fr.md) | 中文

# luci-app-device-intel

SecuBox 设备智能的 LuCI Web 界面。

## 概述

统一设备仪表板，聚合来自所有 SecuBox 子系统的数据。五个视图：仪表板、设备、模拟器、网状网络、设置。

## 视图

### 仪表板 (`device-intel/dashboard`)
- 统计摘要卡片：总计、在线、网状对等节点、风险设备
- 数据源状态芯片：MAC Guardian、Client Guardian、DHCP、P2P
- 模拟器状态芯片：USB、MQTT、Zigbee
- 设备类型分布网格（带计数和颜色的卡片）
- 区域分布条
- 最近设备表（按 last_seen 排序的最近 5 个）

### 设备 (`device-intel/devices`)
- 过滤栏：文本搜索、类型下拉、在线/离线状态
- 完整设备表：状态点、名称、MAC、IP、厂商、类型、区域、来源、操作
- 编辑模态框：更改标签和设备类型覆盖
- 详情模态框：完整设备属性
- 实时过滤更新无需页面刷新

### 模拟器 (`device-intel/emulators`)
- USB 卡片：系统设备计数、发现的外设、迷你表格
- MQTT 卡片：代理主机/端口、运行状态、发现的客户端
- Zigbee 卡片：适配器类型、加密狗路径、加密狗存在、已配对设备
- 链接到设置进行配置

### 网状网络 (`device-intel/mesh`)
- 对等节点卡片：名称、IP、在线/离线状态
- 远程设备表：网状对等节点报告的设备
- 来源节点列表用于跨网状归属

### 设置 (`device-intel/settings`)
- 通用：启用、缓存 TTL、自动分类、分类间隔、网状超时
- 显示：默认视图、分组方式、显示离线、显示网状对等节点、自动刷新
- USB 模拟器：启用、扫描间隔、跟踪存储、跟踪串口
- MQTT 模拟器：启用、代理主机/端口、发现主题、扫描间隔
- Zigbee 模拟器：启用、协调器设备、适配器类型、API 端口、桥接主题

## RPCD 方法

| 方法 | 参数 | 描述 |
|------|------|------|
| `get_devices` | — | 完整设备清单（缓存）|
| `get_device` | mac | 单个设备详情 |
| `get_summary` | — | 统计 + 来源/模拟器状态 |
| `get_mesh_devices` | — | 网状对等节点和远程设备 |
| `get_emulators` | — | 模拟器模块状态 |
| `get_device_types` | — | 已注册设备类型定义 |
| `classify_device` | mac | 运行分类（单个或全部）|
| `set_device_meta` | mac, type, label | 更新设备覆盖 |
| `refresh` | — | 使缓存失效 |

## 文件

```
root/usr/libexec/rpcd/luci.device-intel                RPCD 处理器
root/usr/share/luci/menu.d/luci-app-device-intel.json  菜单（5 个标签）
root/usr/share/rpcd/acl.d/luci-app-device-intel.json   ACL
htdocs/.../resources/device-intel/api.js               共享 RPC API
htdocs/.../resources/device-intel/common.css            仪表板 CSS
htdocs/.../resources/view/device-intel/dashboard.js     仪表板视图
htdocs/.../resources/view/device-intel/devices.js       设备表格
htdocs/.../resources/view/device-intel/emulators.js     模拟器卡片
htdocs/.../resources/view/device-intel/mesh.js          网状对等节点
htdocs/.../resources/view/device-intel/settings.js      设置表单
```

## 依赖

- `luci-base`
- `secubox-app-device-intel`
