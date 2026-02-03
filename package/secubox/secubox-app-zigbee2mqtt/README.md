# SecuBox Zigbee2MQTT - Zigbee to MQTT Bridge

Docker-based Zigbee2MQTT bridge for OpenWrt. Connects Zigbee devices to your MQTT broker via a USB Zigbee adapter, enabling smart home integration without vendor cloud dependencies.

## Installation

```bash
opkg install secubox-app-zigbee2mqtt
```

## Configuration

UCI config file: `/etc/config/zigbee2mqtt`

```bash
uci set zigbee2mqtt.main.enabled='1'
uci set zigbee2mqtt.main.port='8099'
uci set zigbee2mqtt.main.serial_port='/dev/ttyACM0'
uci set zigbee2mqtt.main.mqtt_server='mqtt://localhost:1883'
uci commit zigbee2mqtt
```

## Usage

```bash
zigbee2mqttctl start       # Start Zigbee2MQTT container
zigbee2mqttctl stop        # Stop Zigbee2MQTT container
zigbee2mqttctl status      # Show service status
zigbee2mqttctl logs        # View container logs
zigbee2mqttctl permit      # Open network for device pairing
```

## Features

- Web frontend for device management and pairing
- USB Zigbee adapter support (CC2531, CC2652, SONOFF, etc.)
- MQTT topic-based device control
- OTA firmware updates for Zigbee devices
- Docker container isolation

## Dependencies

- `kmod-usb-acm`
- `dockerd`
- `docker`
- `containerd`

## License

Apache-2.0
