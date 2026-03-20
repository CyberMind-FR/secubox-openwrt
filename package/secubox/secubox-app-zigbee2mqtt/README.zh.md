[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Zigbee2MQTT - Zigbee 到 MQTT 桥接器

用于 OpenWrt 的基于 Docker 的 Zigbee2MQTT 桥接器。通过 USB Zigbee 适配器将 Zigbee 设备连接到您的 MQTT 代理，实现无需厂商云依赖的智能家居集成。

## 安装

```bash
opkg install secubox-app-zigbee2mqtt
```

## 配置

UCI 配置文件：`/etc/config/zigbee2mqtt`

```bash
uci set zigbee2mqtt.main.enabled='1'
uci set zigbee2mqtt.main.port='8099'
uci set zigbee2mqtt.main.serial_port='/dev/ttyACM0'
uci set zigbee2mqtt.main.mqtt_server='mqtt://localhost:1883'
uci commit zigbee2mqtt
```

## 使用方法

```bash
zigbee2mqttctl start       # 启动 Zigbee2MQTT 容器
zigbee2mqttctl stop        # 停止 Zigbee2MQTT 容器
zigbee2mqttctl status      # 显示服务状态
zigbee2mqttctl logs        # 查看容器日志
zigbee2mqttctl permit      # 开放网络以配对设备
```

## 功能特性

- 用于设备管理和配对的 Web 前端
- USB Zigbee 适配器支持（CC2531、CC2652、SONOFF 等）
- 基于 MQTT 主题的设备控制
- Zigbee 设备 OTA 固件更新
- Docker 容器隔离

## 依赖

- `kmod-usb-acm`
- `dockerd`
- `docker`
- `containerd`

## 许可证

Apache-2.0
