# SecuBox IoT Guard

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

OpenWrt 的 IoT 设备隔离、分类和安全监控工具。

## 概述

IoT Guard 提供自动化 IoT 设备管理：

- **自动分类** - 通过厂商 OUI 和行为识别 IoT 设备
- **风险评分** - 计算每台设备的安全风险（0-100 分制）
- **自动隔离** - 自动隔离高风险设备
- **异常检测** - 监控流量模式以检测行为异常
- **云端映射** - 跟踪每台设备联系的云服务

IoT Guard **编排现有的 SecuBox 模块**而不是重新实现：

| 模块 | 集成 |
|------|------|
| Client Guardian | 区域分配（IoT 区域） |
| MAC Guardian | L2 阻止/信任 |
| Vortex Firewall | DNS 过滤（IoT 恶意软件源） |
| Bandwidth Manager | 速率限制 |

## 安装

```bash
opkg install secubox-iot-guard luci-app-iot-guard
```

## CLI 使用

```bash
# 概览状态
iot-guardctl status

# 扫描网络中的 IoT 设备
iot-guardctl scan

# 列出所有设备
iot-guardctl list
iot-guardctl list --json

# 设备详情
iot-guardctl show AA:BB:CC:DD:EE:FF

# 隔离到 IoT 区域
iot-guardctl isolate AA:BB:CC:DD:EE:FF

# 信任设备（添加到白名单）
iot-guardctl trust AA:BB:CC:DD:EE:FF

# 阻止设备
iot-guardctl block AA:BB:CC:DD:EE:FF

# 查看异常
iot-guardctl anomalies

# 云依赖映射
iot-guardctl cloud-map AA:BB:CC:DD:EE:FF
```

## 配置

编辑 `/etc/config/iot-guard`：

```
config iot-guard 'main'
    option enabled '1'
    option scan_interval '300'        # 网络扫描间隔（秒）
    option auto_isolate '1'           # 自动隔离高风险设备
    option auto_isolate_threshold '80' # 自动隔离的风险分数阈值
    option anomaly_detection '1'      # 启用异常检测
    option anomaly_sensitivity 'medium' # low/medium/high

config zone_policy 'isolation'
    option target_zone 'iot'          # 隔离设备的目标区域
    option block_lan '1'              # 阻止 LAN 访问
    option allow_internet '1'         # 允许互联网访问
    option bandwidth_limit '10'       # 速率限制（Mbps）

config vendor_rule 'ring'
    option vendor_pattern 'Ring|Amazon Ring'
    option oui_prefix '40:B4:CD'
    option device_class 'camera'
    option risk_level 'medium'
    option auto_isolate '1'

config allowlist 'trusted'
    list mac 'AA:BB:CC:DD:EE:FF'

config blocklist 'banned'
    list mac 'AA:BB:CC:DD:EE:FF'
```

## 设备类别

| 类别 | 描述 | 默认风险 |
|------|------|----------|
| camera | IP 摄像头、视频门铃 | medium |
| thermostat | 智能温控器、HVAC | low |
| lighting | 智能灯泡、LED 灯带 | low |
| plug | 智能插座 | medium |
| assistant | 语音助手 | medium |
| media | 电视、流媒体设备 | medium |
| lock | 智能门锁 | high |
| sensor | 运动传感器、门窗传感器 | low |
| diy | ESP32、Raspberry Pi | high |
| mixed | 多功能设备 | high |

## 风险评分

风险分数计算方式：

```
score = base_risk + anomaly_penalty + cloud_penalty
```

- **base_risk**：20（low）、50（medium）、80（high），基于厂商/类别
- **anomaly_penalty**：每个未解决的异常 +10
- **cloud_penalty**：如果云依赖 >10 则 +10，>20 则 +20

## 异常类型

| 类型 | 严重性 | 描述 |
|------|--------|------|
| bandwidth_spike | high | 流量是基线的 N 倍 |
| new_destination | low | 首次连接到某域名 |
| port_scan | high | 快速接触多个端口 |
| time_anomaly | medium | 在异常时间段活动 |
| protocol_anomaly | medium | 使用意外的协议 |

## OUI 数据库

IoT Guard 包含约 100 个常见 IoT 制造商的 OUI 数据库：

- Ring、Nest、Wyze、Eufy（摄像头）
- Philips Hue、Lifx、Wiz（照明）
- TP-Link Kasa/Tapo、Tuya（插座）
- Amazon Echo、Google Home（助手）
- Espressif、Raspberry Pi（DIY）
- Samsung、LG、Roku（媒体）

向 `/usr/lib/secubox/iot-guard/iot-oui.tsv` 添加自定义 OUI：

```
AA:BB:CC	MyVendor	camera	medium
```

## 文件

```
/etc/config/iot-guard                  # 配置
/usr/sbin/iot-guardctl                 # CLI 控制器
/usr/lib/secubox/iot-guard/            # 库脚本
/usr/share/iot-guard/baseline-profiles/ # 流量基线
/var/lib/iot-guard/iot-guard.db        # SQLite 数据库
```

## 依赖项

- secubox-core
- sqlite3-cli
- jsonfilter

## 许可证

GPL-3.0
