# SecuBox Nextcloud

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

在 OpenWrt 上的 Debian LXC 容器中运行的自托管文件同步和协作平台。包含 MariaDB 数据库、Redis 缓存和 Nginx Web 服务器。

## 安装

```bash
opkg install secubox-app-nextcloud luci-app-nextcloud
```

## 快速开始

```bash
# 安装 Nextcloud（创建 LXC 容器）
nextcloudctl install

# 启动服务
/etc/init.d/nextcloud start

# 访问 Web 界面
# http://router-ip:8080
```

## 配置

UCI 配置文件：`/etc/config/nextcloud`

```bash
uci set nextcloud.main.enabled='1'
uci set nextcloud.main.domain='cloud.example.com'
uci set nextcloud.main.http_port='8080'
uci set nextcloud.main.admin_user='admin'
uci set nextcloud.main.memory_limit='1G'
uci set nextcloud.main.upload_max='512M'
uci commit nextcloud
```

## CLI 命令

```bash
nextcloudctl install          # 创建 Debian LXC，安装 Nextcloud 堆栈
nextcloudctl uninstall        # 删除容器（保留数据）
nextcloudctl update           # 更新 Nextcloud 到最新版本
nextcloudctl start            # 启动 Nextcloud 服务
nextcloudctl stop             # 停止 Nextcloud 服务
nextcloudctl restart          # 重启 Nextcloud 服务
nextcloudctl status           # 显示服务状态（JSON）
nextcloudctl logs [-f]        # 显示容器日志
nextcloudctl shell            # 在容器中打开 shell

nextcloudctl occ <cmd>        # 运行 Nextcloud OCC 命令
nextcloudctl backup [name]    # 创建数据和数据库备份
nextcloudctl restore <name>   # 从备份恢复
nextcloudctl list-backups     # 列出可用备份

nextcloudctl ssl-enable <domain>  # 使用 HAProxy 注册 SSL
nextcloudctl ssl-disable          # 移除 HAProxy 注册
```

## 架构

```
+---------------------------------------------------------+
|                     OpenWrt 主机                          |
|  +---------------------------------------------------+  |
|  |              LXC: nextcloud (Debian 12)           |  |
|  |  +---------+  +---------+  +---------+  +-------+ |  |
|  |  | Nginx   |  |Nextcloud|  | MariaDB |  | Redis | |  |
|  |  | :8080   |->| PHP-FPM |->| :3306   |  | :6379 | |  |
|  |  +---------+  +---------+  +---------+  +-------+ |  |
|  |                    |                              |  |
|  |         /srv/nextcloud (bind 挂载)                 |  |
|  +---------------------------------------------------+  |
|                          |                               |
|  +---------------------------------------------------+  |
|  |           HAProxy（可选 SSL 终止）                   |  |
|  |      cloud.example.com:443 -> nextcloud:8080      |  |
|  +---------------------------------------------------+  |
+---------------------------------------------------------+
```

## 功能特性

- 通过 Web、桌面和移动客户端进行文件同步和共享
- 日历和联系人（CalDAV/CardDAV）
- 协作文档编辑
- 端到端加密支持
- 带有 PHP 8.2 的 Debian LXC 容器
- 带有优化设置的 MariaDB 数据库
- Redis 缓存以提高性能
- 针对 Nextcloud 优化的 Nginx 配置
- HAProxy 集成实现 SSL/HTTPS
- 自动备份和恢复
- 通过 cgroups 进行内存限制
- 开机自动启动

## 数据位置

```
/srv/nextcloud/
├── data/           # Nextcloud 用户数据
├── config/         # Nextcloud config.php
└── backups/        # 自动备份
```

## 使用 HAProxy 的 SSL

```bash
# 通过 HAProxy 和 Let's Encrypt 启用 HTTPS
nextcloudctl ssl-enable cloud.example.com

# 通过 HTTPS 访问
https://cloud.example.com
```

## 依赖

- `lxc` - 容器运行时
- `lxc-common` - LXC 工具
- `tar`, `wget-ssl`, `unzip`, `xz` - 归档工具
- `jsonfilter` - JSON 解析
- `openssl-util` - SSL 工具

## 许可证

Apache-2.0
