[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Lyrion 音乐服务器

用于 SecuBox OpenWrt 系统的 Lyrion Music Server（前身为 Logitech Media Server / Squeezebox Server）。

## 概述

在 Debian Bookworm LXC 容器中运行 Lyrion，具有：
- 官方 Lyrion Debian 软件包（v9.x）
- 完整音频编解码器支持（FLAC、MP3、AAC 等）
- Squeezebox 播放器发现（UDP 3483）
- 可配置端口的 Web 界面（默认：9000）

## 安装

```sh
opkg install secubox-app-lyrion
lyrionctl install   # 创建 Debian LXC 容器
/etc/init.d/lyrion enable
/etc/init.d/lyrion start
```

## 配置

UCI 配置文件：`/etc/config/lyrion`

```
config lyrion 'main'
    option enabled '0'
    option port '9000'
    option data_path '/srv/lyrion'
    option media_path '/srv/media'
    option memory_limit '1G'
    option extra_media_paths '/mnt/usb:/mnt/usb'
```

### 额外媒体路径

挂载额外的媒体目录（空格分隔）：
```
option extra_media_paths '/mnt/MUSIC /mnt/USB:/music/usb'
```

## 使用方法

```sh
# 服务管理
/etc/init.d/lyrion start
/etc/init.d/lyrion stop
/etc/init.d/lyrion restart

# 控制器 CLI
lyrionctl status      # 显示容器状态
lyrionctl install     # 创建 Debian LXC 容器
lyrionctl destroy     # 删除容器（保留配置）
lyrionctl update      # 使用最新 Lyrion 重建容器
lyrionctl logs        # 查看服务器日志
lyrionctl logs -f     # 跟踪日志
lyrionctl shell       # 在容器中打开 shell
lyrionctl runtime     # 显示检测到的运行时
```

## 容器架构

容器使用 Debian Bookworm，具有：
- 官方 Lyrion 仓库软件包
- 配置（`/srv/lyrion`）和媒体的绑定挂载
- 与主机共享网络以进行播放器发现
- 通过 cgroup2 进行内存限制

## 端口

| 端口 | 协议 | 描述 |
|------|------|------|
| 9000 | TCP | Web 界面 |
| 9090 | TCP | CLI/RPC 接口 |
| 3483 | TCP | Slim Protocol（播放器） |
| 3483 | UDP | 播放器发现 |

## 文件

- `/etc/config/lyrion` -- UCI 配置
- `/usr/sbin/lyrionctl` -- 控制器 CLI
- `/srv/lyrion/` -- 持久化配置和缓存
- `/srv/lxc/lyrion/` -- LXC 容器 rootfs

## 依赖

- `lxc`（或 `docker`）
- `debootstrap`（LXC 自动安装）
- `wget`、`tar`

## 许可证

Apache-2.0
