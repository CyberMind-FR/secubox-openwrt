# LuCI IoT Guard

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

用于 IoT 设备隔离和安全监控的 LuCI 仪表板。

## 功能

- **概览仪表板** - 安全评分、设备数量、风险分布
- **设备列表** - 可筛选的设备详情表格
- **设备操作** - 隔离、信任或阻止设备
- **云服务映射** - 查看每个设备连接的云服务
- **异常警报** - 实时异常通知
- **策略管理** - 厂商分类规则
- **设置** - 配置自动隔离、阈值、区域

## 安装

```bash
opkg install luci-app-iot-guard
```

需要 `secubox-iot-guard` 后端软件包。

## 菜单位置

SecuBox > Services > IoT Guard

## 界面

### 概览 (`/iot-guard/overview`)

仪表板包含：
- 设备数量、已隔离、已阻止、高风险统计
- 安全评分（0-100%）
- 按风险级别分组的设备网格
- 最近异常事件

### 设备 (`/iot-guard/devices`)

设备管理表格：
- MAC、IP、主机名、厂商、类别、风险、评分、区域、状态
- 点击查看设备详情模态框，包含云依赖和异常
- 快捷操作：隔离、信任、阻止

### 策略 (`/iot-guard/policies`)

厂商分类规则：
- 查看/添加/删除厂商规则
- 配置 OUI 前缀、模式、类别、风险级别
- 设备类别参考表

### 设置 (`/iot-guard/settings`)

配置选项：
- 启用/禁用服务
- 扫描间隔
- 自动隔离阈值
- 异常检测灵敏度
- 区域策略（阻止 LAN、允许互联网、带宽限制）
- 白名单/黑名单管理

## RPCD 方法

| 方法 | 描述 |
|--------|-------------|
| `status` | 仪表板统计 |
| `get_devices` | 列出设备（可选筛选） |
| `get_device` | 设备详情及云服务映射 |
| `get_anomalies` | 最近异常事件 |
| `get_vendor_rules` | 列出分类规则 |
| `get_cloud_map` | 设备云依赖 |
| `scan` | 触发网络扫描 |
| `isolate_device` | 将设备移至 IoT 区域 |
| `trust_device` | 添加到白名单 |
| `block_device` | 阻止设备 |
| `add_vendor_rule` | 添加分类规则 |
| `delete_vendor_rule` | 删除分类规则 |

## 公共访问

概览和设备列表可通过 `unauthenticated` ACL 组公开访问。

## 依赖

- secubox-iot-guard
- luci-base

## 许可证

GPL-3.0
