# nDPId - Deep Packet Inspection Daemon

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

基于 nDPI 的第 7 层深度包检测守护进程。使用微服务架构和内置的 libndpi 5.x 来识别应用协议并对网络流量进行分类。

## 安装

```bash
opkg install secubox-app-ndpid
```

## 配置

UCI 配置文件：`/etc/config/ndpid`
原生配置：`/etc/ndpid.conf`

```bash
uci set ndpid.main.enabled='1'
uci set ndpid.main.interface='br-lan'
uci commit ndpid
```

## 二进制文件

| 二进制文件 | 描述 |
|-----------|------|
| `/usr/sbin/ndpid` | DPI 捕获守护进程 |
| `/usr/sbin/ndpisrvd` | JSON 分发服务 |

## 架构

```
网络流量 --> ndpid (捕获 + 分类) --> ndpisrvd (JSON 分发器) --> 消费者
```

ndpid 捕获数据包，通过 libndpi 对协议进行分类，并将检测事件发送到 ndpisrvd。消费者连接到 ndpisrvd 以获取实时流数据。

## 服务管理

```bash
/etc/init.d/ndpid start
/etc/init.d/ndpid stop
/etc/init.d/ndpid status
```

## 依赖

- `libpcap`
- `libjson-c`
- `libpthread`
- `zlib`
- `libstdcpp`

## 许可证

GPL-3.0
