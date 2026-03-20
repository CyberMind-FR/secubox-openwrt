[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Domoticz

在 LXC Debian 容器中运行的家庭自动化平台，具有 MQTT 桥接、Zigbee2MQTT 集成和 P2P mesh 支持。

## 安装

```sh
opkg install secubox-app-domoticz
domoticzctl install
/etc/init.d/domoticz start
```

## 配置

UCI 配置文件：`/etc/config/domoticz`

```
config domoticz 'main'
    option enabled '0'
    option data_path '/srv/domoticz'
    option devices_path '/srv/devices'
    option port '8080'
    option timezone 'UTC'

config domoticz 'mqtt'
    option enabled '0'
    option broker '127.0.0.1'
    option broker_port '1883'
    option topic_prefix 'domoticz'
    option z2m_topic 'zigbee2mqtt'

config domoticz 'network'
    option domain 'domoticz.secubox.local'
    option haproxy '0'
    option firewall_wan '0'

config domoticz 'mesh'
    option enabled '0'
```

## 使用方法

```sh
domoticzctl install           # 创建 LXC 容器，下载 Domoticz
domoticzctl uninstall         # 删除容器（保留数据）
domoticzctl update            # 下载最新 Domoticz，重启
domoticzctl status            # 显示容器状态
domoticzctl logs [-f]         # 容器日志
domoticzctl configure-mqtt    # 自动配置 Mosquitto + MQTT 桥接
domoticzctl configure-haproxy # 注册 HAProxy vhost
domoticzctl backup [path]     # 备份数据
domoticzctl restore <path>    # 从备份恢复
domoticzctl mesh-register     # 注册到 P2P mesh
```

## MQTT 桥接

`configure-mqtt` 命令自动配置：
1. 如果不存在则安装 `mosquitto-nossl`
2. 在 1883 端口配置 Mosquitto 监听器
3. 检测 Zigbee2MQTT 代理设置以确保兼容性
4. 将 MQTT 配置存储在 UCI 中以保持持久性

配置后，在 Domoticz 界面中添加 MQTT 硬件：设置 > 硬件 > MQTT Client Gateway。

## Zigbee 集成

当安装了 `secubox-app-zigbee2mqtt` 时：
- 两个服务共享同一个 Mosquitto 代理
- Zigbee 设备在 `zigbee2mqtt/#` 主题上发布
- Domoticz 通过 MQTT Client Gateway 硬件订阅

## 文件

- `/etc/config/domoticz` -- UCI 配置
- `/etc/init.d/domoticz` -- init 脚本（procd）
- `/usr/sbin/domoticzctl` -- 控制器 CLI

## 依赖

- `lxc`、`lxc-common`
- 可选：`mosquitto-nossl`、`secubox-app-zigbee2mqtt`

## 许可证

Apache-2.0
