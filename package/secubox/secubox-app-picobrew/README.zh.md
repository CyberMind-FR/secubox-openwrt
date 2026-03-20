# SecuBox PicoBrew Server

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

在 LXC 容器中运行的自托管 PicoBrew 酿造控制器。提供配方管理、实时酿造会话监控以及 PicoBrew 硬件设备连接。

## 安装

```bash
opkg install secubox-app-picobrew
```

## 配置

UCI 配置文件：`/etc/config/picobrew`

```bash
uci set picobrew.main.enabled='1'
uci set picobrew.main.port='8080'
uci commit picobrew
```

## 使用方法

```bash
picobrewctl start      # 启动 PicoBrew 服务器
picobrewctl stop       # 停止 PicoBrew 服务器
picobrewctl status     # 显示服务状态
picobrewctl logs       # 查看服务器日志
picobrewctl update     # 从 git 更新服务器
```

## 功能特性

- 配方管理和创建
- 实时酿造会话监控
- PicoBrew 设备配对和控制
- 酿造历史和日志记录
- 在 LXC 容器中隔离运行

## 依赖

- `jsonfilter`
- `wget-ssl`
- `tar`
- `lxc`
- `lxc-common`
- `git`

## 许可证

Apache-2.0
