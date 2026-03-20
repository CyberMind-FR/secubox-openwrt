[English](README.md) | [Francais](README.fr.md) | 中文

# RezApp Forge

Docker 到 SecuBox LXC 应用转换器。

## 概述

RezApp Forge 将 Docker 镜像转换为 LXC 容器并生成 SecuBox 插件包。浏览 Docker Hub、GHCR 和 LinuxServer.io 目录，将镜像转换为 LXC，并发布到 SecuBox 应用商店。

## 功能特性

- **目录管理** - 支持 Docker Hub、LinuxServer.io、GHCR
- **Docker 搜索** - 在所有启用的目录中搜索镜像
- **镜像信息** - 查看可用标签和架构
- **Docker 到 LXC** - 将 Docker 镜像转换为 LXC 容器
- **包生成** - 自动生成 SecuBox 插件包
- **目录发布** - 将转换的应用添加到 SecuBox 目录

## 安装

```bash
opkg install secubox-app-rezapp
```

## CLI 使用方法

```bash
# 目录管理
rezappctl catalog list              # 列出启用的目录
rezappctl catalog add <name> <url>  # 添加自定义目录
rezappctl catalog remove <name>     # 移除目录

# 搜索 Docker 镜像
rezappctl search <query>            # 搜索所有目录
rezappctl search heimdall           # 示例：搜索 heimdall
rezappctl info <image>              # 显示镜像详情

# 将 Docker 转换为 LXC
rezappctl convert <image> [options]
  --name <app-name>     # 自定义应用名称
  --tag <version>       # 镜像标签（默认：latest）
  --memory <limit>      # 内存限制（默认：512M）

# 生成 SecuBox 包
rezappctl package <app-name>        # 从转换的应用创建包

# 发布到目录
rezappctl publish <app-name>        # 将清单添加到 SecuBox 目录

# 列出转换的应用
rezappctl list                      # 显示所有转换的应用
```

## 示例工作流

```bash
# 1. 搜索应用
rezappctl search heimdall

# 2. 检查可用标签
rezappctl info linuxserver/heimdall

# 3. 转换为 LXC
rezappctl convert linuxserver/heimdall --name heimdall --memory 512M

# 4. 生成 SecuBox 包
rezappctl package heimdall

# 5. 发布到目录
rezappctl publish heimdall
```

## 配置

UCI 配置：`/etc/config/rezapp`

```
config main 'main'
    option cache_dir '/srv/rezapp/cache'
    option output_dir '/srv/rezapp/generated'
    option apps_dir '/srv/rezapp/apps'
    option lxc_dir '/srv/lxc'
    option default_memory '512M'

config catalog 'dockerhub'
    option name 'Docker Hub'
    option type 'dockerhub'
    option enabled '1'

config catalog 'linuxserver'
    option name 'LinuxServer.io'
    option type 'dockerhub'
    option namespace 'linuxserver'
    option enabled '1'
```

## 转换过程

1. **Pull** - 下载 Docker 镜像
2. **Export** - 创建容器并导出文件系统
3. **Extract** - 解压到 LXC rootfs
4. **Configure** - 从 Docker 元数据生成 LXC 配置
5. **Wrap** - 创建 LXC 执行启动脚本

## 生成的包结构

```
/srv/rezapp/generated/secubox-app-<name>/
|-- Makefile              # OpenWrt 包 makefile
|-- files/
|   |-- etc/config/<name> # UCI 配置
|   |-- etc/init.d/<name> # Procd init 脚本
|   +-- usr/sbin/<name>ctl # 管理 CLI
+-- README.md
```

## LuCI 界面

安装 `luci-app-rezapp` 获取 **服务 > RezApp Forge** 的 Web 界面。

## 依赖

- docker
- lxc, lxc-common
- curl, wget-ssl
- jsonfilter

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/rezapp` | UCI 配置 |
| `/usr/sbin/rezappctl` | CLI 工具 |
| `/srv/rezapp/cache/` | 下载的镜像 |
| `/srv/rezapp/apps/` | 转换的应用元数据 |
| `/srv/rezapp/generated/` | 生成的包 |
| `/srv/lxc/<app>/` | LXC 容器 rootfs |
| `/usr/share/rezapp/templates/` | 包模板 |

## 模板

`/usr/share/rezapp/templates/` 中的模板：

- `Makefile.tpl` - 包 Makefile
- `init.d.tpl` - Procd init 脚本
- `ctl.tpl` - 管理 CLI
- `config.tpl` - UCI 默认值
- `start-lxc.tpl` - LXC 启动包装器
- `lxc-config.tpl` - LXC 配置
- `manifest.tpl` - 应用目录清单
