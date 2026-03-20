# secubox-app-device-intel

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

统一设备清单，聚合所有 SecuBox 子系统的数据。SecuBox 生态系统的一部分。

## 概述

纯聚合层，将 mac-guardian、client-guardian、DHCP、P2P mesh、暴露扫描器和模拟器模块的数据合并为单一设备清单，具有启发式分类、用户覆盖和跨 mesh 可见性。

## 架构

```
device-intelctl (CLI)
  └── functions.sh (聚合库)
        ├── di_collect_mac_guardian()    → /var/run/mac-guardian/clients.db
        ├── di_collect_client_guardian() → UCI client-guardian
        ├── di_collect_dhcp()           → /tmp/dhcp.leases
        ├── di_collect_p2p_peers()      → ubus luci.secubox-p2p
        ├── di_collect_exposure()       → /proc/net/tcp
        └── di_collect_emulators()      → emulators/*.sh
              ├── usb.sh    → /sys/bus/usb/devices/
              ├── mqtt.sh   → mosquitto broker
              └── zigbee.sh → zigbee2mqtt / deCONZ API
```

## 数据流

1. **收集** — 并行查询每个数据源
2. **合并** — 以 MAC 地址为键，合并所有来源的字段
3. **分类** — 应用启发式链（用户 > 模拟器 > mesh > 端口 > 厂商 > 主机名）
4. **缓存** — 存储到 `/tmp/device-intel/cache-devices.json`（可配置 TTL）
5. **服务** — CLI 或 RPCD 返回统一的 JSON

## 分类优先级

| 优先级 | 来源 | 示例 |
|---|---|---|
| 1 | 用户覆盖 | UCI `device-intel.<mac>.type` |
| 2 | 模拟器来源 | MQTT 客户端 → mqtt_device |
| 3 | Mesh peer 匹配 | P2P peer IP → mesh_peer |
| 4 | 基于端口 | 端口 445 → storage |
| 5 | 基于厂商 | Synology → storage |
| 6 | 基于主机名 | `.*sensor.*` → iot_sensor |
| 7 | 回退 | unknown |

## 模拟器模块

KISS 风格的可插拔设备发现：

- **usb.sh** — 遍历 `/sys/bus/usb/devices/`，按 bDeviceClass 分类（storage、serial、HID、camera、audio、printer、wireless）
- **mqtt.sh** — 通过 `$SYS` 主题或日志查询 mosquitto broker
- **zigbee.sh** — 查询 zigbee2mqtt HTTP API 或 deCONZ REST API

每个模块导出 `emulate_<type>()` 返回管道分隔的设备条目。

## CLI 使用

```bash
device-intelctl status                                    # 概览
device-intelctl list table                                # 表格视图
device-intelctl list json                                 # JSON 输出
device-intelctl show aa:bb:cc:dd:ee:ff                    # 设备详情
device-intelctl classify                                  # 批量分类
device-intelctl set-type aa:bb:cc:dd:ee:ff iot_sensor     # 覆盖类型
device-intelctl set-label aa:bb:cc:dd:ee:ff "Temp Sensor" # 自定义标签
device-intelctl emulators                                 # 模块状态
device-intelctl mesh-list                                 # Mesh peer 设备
device-intelctl export json > inventory.json              # 完整导出
```

## UCI 配置

```
/etc/config/device-intel
  config device-intel 'main'     → enabled, cache_ttl, classify_interval
  config display 'display'       → view mode, grouping, refresh
  config emulator 'mqtt'         → broker_host, port, discovery_topic
  config emulator 'zigbee'       → coordinator, adapter, api_port
  config emulator 'usb'          → scan_interval, track_storage, track_serial
  config device_type '<id>'      → name, icon, color, vendor/hostname/port 匹配规则
  config device '<mac_clean>'    → 用户覆盖（type, label, capabilities, notes）
```

## 文件

```
/etc/config/device-intel                          UCI 配置
/etc/init.d/device-intel                          procd 初始化脚本
/usr/sbin/device-intelctl                         CLI 控制器
/usr/lib/secubox/device-intel/functions.sh        核心聚合库
/usr/lib/secubox/device-intel/classify.sh         启发式分类引擎
/usr/lib/secubox/device-intel/emulators/usb.sh    USB 外设模拟器
/usr/lib/secubox/device-intel/emulators/mqtt.sh   MQTT broker 模拟器
/usr/lib/secubox/device-intel/emulators/zigbee.sh Zigbee 协调器模拟器
```

## 依赖

- `jsonfilter`（OpenWrt 原生）
- `curl`（用于模拟器 API 调用）
- 可选：`secubox-app-mac-guardian`、`secubox-app-client-guardian`、`secubox-p2p`
