# SecuBox MagicMirror2

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

开源模块化智能显示平台，在 SecuBox 驱动的 OpenWrt 系统上的 LXC 容器中运行。

## 安装

```sh
opkg install secubox-app-magicmirror2
```

## 配置

UCI 配置文件：`/etc/config/magicmirror2`

```
config magicmirror2 'main'
    option enabled '0'
    option port '8080'
```

## 使用方法

```sh
# 启动 / 停止服务
/etc/init.d/magicmirror2 start
/etc/init.d/magicmirror2 stop

# 控制器 CLI
mm2ctl status
mm2ctl install
mm2ctl remove
```

## 功能特性

- 模块化架构，提供数百个可用模块
- 内置模块管理器，便于安装
- 天气、日历、新闻和自定义小部件
- 基于 Web 的配置界面
- 专用显示器的 Kiosk 模式

## 文件

- `/etc/config/magicmirror2` -- UCI 配置
- `/usr/sbin/mm2ctl` -- 控制器 CLI

## 依赖

- `wget`
- `tar`
- `jq`
- `zstd`

## 许可证

Apache-2.0
