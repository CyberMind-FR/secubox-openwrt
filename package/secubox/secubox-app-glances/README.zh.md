[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Glances 系统监控

在 LXC 容器中运行的跨平台系统监控工具，提供 Web UI 和 RESTful API。

## 安装

```sh
opkg install secubox-app-glances
```

## 配置

UCI 配置文件：`/etc/config/glances`

```
config glances 'main'
    option enabled '0'
    option port '61208'
```

## 使用方法

```sh
# 启动/停止服务
/etc/init.d/glances start
/etc/init.d/glances stop

# 控制器 CLI
glancesctl status
glancesctl install
glancesctl remove
```

## 功能特性

- 实时 CPU、内存、磁盘和网络监控
- 带资源使用情况的进程列表
- Docker/Podman 容器监控
- 可从任何设备访问的 Web 界面
- 用于集成的 RESTful JSON API
- 阈值监控的警报系统

## 文件

- `/etc/config/glances` -- UCI 配置
- `/usr/sbin/glancesctl` -- 控制器 CLI

## 依赖

- `wget`
- `tar`

## 许可证

LGPL-3.0
