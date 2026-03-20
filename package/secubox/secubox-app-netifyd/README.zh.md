[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Netifyd 5.2.1 for OpenWrt / SecuBox

完整的 OpenWrt 软件包，提供 Netify Agent (netifyd) 5.2.1 版本 - 深度包检测引擎。

## 概述

本软件包提供最新的官方 Netify Agent，为 OpenWrt/SecuBox 编译，具有完整的集成支持。

### 功能特性

- **深度包检测 (DPI)** - 检测 300+ 协议和应用
- **流分类** - 实时网络流分析
- **协议检测** - 识别 HTTP、HTTPS、SSH、DNS、BitTorrent 等
- **应用检测** - 识别特定应用（YouTube、Netflix、WhatsApp 等）
- **设备跟踪** - 监控网络上的所有设备
- **云集成** - 可选上传到 Netify.ai 云进行分析
- **本地导出** - 可本地导出数据进行自定义处理
- **低资源使用** - 为嵌入式系统优化的"精简"构建

### 版本信息

- **Netifyd 版本：** 5.2.1（最新官方版本）
- **源码：** https://download.netify.ai/source/netifyd-5.2.1.tar.gz
- **许可证：** GPL-3.0-or-later
- **维护者：** CyberMind <contact@cybermind.fr>

## 安装

### 先决条件

所需依赖项会自动安装：
- libcurl
- libmnl
- libnetfilter-conntrack
- libpcap
- zlib
- libpthread
- libstdcpp
- libjson-c
- ca-bundle

### 从源码构建

```bash
# 从 OpenWrt buildroot
cd /path/to/secubox-openwrt

# 选择软件包
make menuconfig
# 导航至：Network > netifyd
# 选择：<M> 或 <*>

# 编译软件包
make package/secubox/secubox-app-netifyd/compile V=s

# 软件包将位于：bin/packages/*/secubox/netifyd_5.2.1-1_*.ipk
```

### 在设备上安装

```bash
# 将软件包复制到设备
scp netifyd_5.2.1-1_*.ipk root@192.168.1.1:/tmp/

# 在设备上
opkg install /tmp/netifyd_5.2.1-1_*.ipk
```

## 配置

### 快速开始

```bash
# 编辑配置
vi /etc/config/netifyd

# 启用自动配置（推荐）
uci set netifyd.default.enabled='1'
uci set netifyd.default.autoconfig='1'
uci commit netifyd

# 启动服务
/etc/init.d/netifyd start
/etc/init.d/netifyd enable

# 检查状态
netifyd -s
```

### 手动接口配置

如果自动检测不工作，手动配置接口：

```bash
# 配置内部（LAN）接口
uci add_list netifyd.default.internal_if='br-lan'

# 配置外部（WAN）接口
uci add_list netifyd.default.external_if='br-wan'

# 提交并重启
uci commit netifyd
/etc/init.d/netifyd restart
```

### 高级配置

编辑 `/etc/netifyd.conf` 进行高级设置：

```ini
[netifyd]
# 启用/禁用功能
enable-conntrack = yes
enable-netlink = yes

# Socket 配置
socket-host = 127.0.0.1
socket-port = 7150

# 流设置
flow-expiry = 180
flow-max = 65536

# Sink 配置（云上传）
sink-url = https://sink.netify.ai/
```

## 使用方法

### 命令行

```bash
# 显示版本和功能
netifyd -V

# 显示运行状态
netifyd -s

# 显示代理 UUID
netifyd -p

# 测试配置
netifyd -t

# 启用云 sink
netifyd --enable-sink

# 禁用云 sink
netifyd --disable-sink
```

### 服务控制

```bash
# 启动服务
/etc/init.d/netifyd start

# 停止服务
/etc/init.d/netifyd stop

# 重启服务
/etc/init.d/netifyd restart

# 检查状态
/etc/init.d/netifyd status

# 启用自动启动
/etc/init.d/netifyd enable

# 禁用自动启动
/etc/init.d/netifyd disable
```

### 监控

```bash
# 查看状态 JSON
cat /var/run/netifyd/status.json | jq .

# 检查运行进程
ps | grep netifyd

# 查看日志
logread | grep netifyd

# 检查 socket
ls -la /var/run/netifyd/
```

## 与 SecuBox 集成

本软件包与 `luci-app-secubox-netifyd` 无缝集成：

```bash
# 安装两个软件包
opkg install netifyd luci-app-secubox-netifyd

# 访问 Web 界面
# 导航至：服务 > Netifyd 仪表板
```

## 文件位置

- **二进制文件：** `/usr/sbin/netifyd`
- **配置：** `/etc/netifyd.conf`
- **UCI 配置：** `/etc/config/netifyd`
- **Init 脚本：** `/etc/init.d/netifyd`
- **运行时数据：** `/var/run/netifyd/`
- **持久数据：** `/etc/netify.d/`
- **状态文件：** `/var/run/netifyd/status.json`
- **Socket：** `/var/run/netifyd/netifyd.sock`

## 许可证

本软件包采用 GPL-3.0-or-later 许可，与上游 netifyd 相同。

## 致谢

- **上游：** eGloo Incorporated (Netify.ai)
- **OpenWrt 软件包：** CyberMind.fr（SecuBox 集成）
- **原始 OpenWrt 软件包：** OpenWrt Packages 团队
