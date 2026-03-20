# MQTT 桥接模块

> **Languages:** [English](../DOCS/MQTT_BRIDGE.md) | [Francais](../DOCS-fr/MQTT_BRIDGE.md) | 中文

**版本:** 0.4.0
**状态:** 草案

SecuBox MQTT 桥接通过带主题的 LuCI 界面暴露 USB 适配器和 IoT 传感器。

## 组件

- **概览** - broker 健康状态、已连接适配器、最近的 payload。
- **设备** - 已配对的 USB 设备及状态 (在线/离线)。
- **设置** - broker 凭据、基础主题模板、保留。

## RPC API (`luci.mqtt-bridge`)

| 方法 | 描述 |
|------|------|
| `status` | Broker 指标、存储的 payload 和当前设置。 |
| `list_devices` | 枚举已配对的 USB/传感器节点。 |
| `trigger_pairing` | 打开配对窗口 (2分钟)。 |
| `apply_settings` | 持久化 broker/桥接配置。 |

`status` 现在还包含一个 `profiles` 数组，描述检测到的 USB/Zigbee 预设。每个条目公开：

| 字段 | 描述 |
|------|------|
| `id` | 内部预设标识符 (例如 `zigbee_usb2134`)。 |
| `label` | 从 USB 描述符获取的友好适配器名称。 |
| `vendor` / `product` | USB VID:PID 对。 |
| `bus` / `device` | 在 `dmesg`/`lsusb` 中看到的 Linux 总线/设备编号。 |
| `port` | 可用时解析的 `/dev/tty*` 路径。 |
| `detected` | 布尔标志 (当 dongle 当前已连接时为 `true`)。 |
| `notes` | 在设备视图中呈现的人类可读提示。 |

## 文件

```
luci-app-mqtt-bridge/
 ├── htdocs/luci-static/resources/view/mqtt-bridge/*.js
 ├── htdocs/luci-static/resources/mqtt-bridge/common.css
 ├── root/usr/libexec/rpcd/luci.mqtt-bridge
 ├── root/usr/share/luci/menu.d/luci-app-mqtt-bridge.json
 ├── root/usr/share/rpcd/acl.d/luci-app-mqtt-bridge.json
└── root/etc/config/mqtt-bridge
```

## Zigbee / SMSC USB2134B 配置文件

设备标签页现在显示"Bus 003 Device 002: ID 0424:2134 SMSC USB2134B"桥接器的预设，该桥接器通常刷有 Zigbee 协调器固件。LuCI 视图使用上面解释的 `profiles` 数组，并显示当前检测状态以及 tty 提示。

手动验证 dongle：

```bash
dmesg | tail -n 40 | grep -E '0424:2134|usb 3-1'
lsusb -d 0424:2134
ls /dev/ttyACM* /dev/ttyUSB* 2>/dev/null
```

典型内核日志：

```
[ 6456.735692] usb 3-1.1: USB disconnect, device number 3
[ 6459.021458] usb 3-1.1: new full-speed USB device number 4 using xhci-hcd
```

将报告的 Bus/Device 编号与 `/sys/bus/usb/devices/*/busnum` 和 `/sys/bus/usb/devices/*/devnum` 匹配；RPC 助手检查这些文件并发布解析的 `/dev/tty*` 路径（当在 `/sys/bus/usb/devices/*/tty` 下导出时）。如果适配器未插入，UI 仍会呈现预设，以便操作员知道要查找的确切 VID/PID 对。

一旦确认 tty 节点，更新 `/etc/config/mqtt-bridge` 并重启桥接服务，将 Zigbee 流量绑定到设置标签页中定义的 MQTT 主题。

## 适配器监控守护进程

该软件包现在安装了一个轻量级监视器 (`/usr/sbin/mqtt-bridge-monitor`)，用于通知 SecuBox 已连接的适配器：

- 通过 `/etc/config/mqtt-bridge` 中的 `config monitor 'monitor'`（间隔秒数）和 `config adapter '...'` 部分配置。
- 使用标准 init 脚本管理：`service mqtt-bridge start|stop|status`。
- 将状态转换写入系统日志（`logread -e mqtt-bridge-monitor`）。
- 更新每个适配器部分的 `detected`、`port`、`bus`、`device`、`health` 和 `last_seen`，LuCI 设备标签页现在会显示这些。
- MQTT 设置视图公开相同的适配器条目，以便您可以启用/禁用预设、重命名标签或覆盖 `/dev/tty*` 分配，而无需离开 UI。
- 设置视图中的按钮允许您触发重新扫描（`API.rescanAdapters`）或清除特定适配器的缓存数据（`API.resetAdapter`），这在重新刷写 dongle 或更换 USB 端口后很有帮助。

使用 `uci show mqtt-bridge.adapter` 检查持久化的元数据，或使用 `ubus call luci.mqtt-bridge status` 查看 UI 使用的 JSON payload。

## 模板和自动化规则

`/etc/config/mqtt-bridge` 现在包含 Zigbee 和 Modbus 设备的 `config template` 定义：

```uci
config template 'zigbee_default'
	option device_type 'zigbee'
	option topic 'secubox/zigbee/{id}/state'
	option qos '1'
	option retain '1'
```

这些通过 `status` RPC（`templates` 数组）导出，以便 LuCI 或外部客户端可以按设备类型建议主题模式。添加您自己的部分以涵盖其他总线或命名方案。

自动化规则（`config rule`）可以响应适配器状态转换：

```uci
config rule 'zigbee_disconnect'
	option type 'adapter_status'
	option adapter 'zigbee_usb2134'
	option when 'missing'
	option action 'alert'
	option message 'Zigbee USB 桥接器已断开'
	option topic 'alerts/mqtt/zigbee'
```

当守护进程注意到适配器变为 `missing` 或 `online` 时，匹配的规则会写入 syslog 和 `/tmp/mqtt-bridge-alerts.log`，便于将事件转发到 SecuBox Alerts 或任何其他管道。

## 下一步

- 添加与 Mosquitto 的真正守护进程集成。
- 支持 TLS 和每设备主题。
- 在传感器阈值上发出 SecuBox 告警。

查看 `.codex/apps/mqtt-bridge/TODO.md` 了解不断演进的待办事项。
