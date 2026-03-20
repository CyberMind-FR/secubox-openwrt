[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Jellyfin 媒体服务器

用于流媒体电影、电视剧、音乐和照片的免费媒体服务器。在 SecuBox OpenWrt 系统上通过 Docker 运行 Jellyfin。

## 安装

```sh
opkg install secubox-app-jellyfin
jellyfinctl install
```

## 配置

UCI 配置文件：`/etc/config/jellyfin`

```
config jellyfin 'main'
    option enabled '0'
    option image 'jellyfin/jellyfin:latest'
    option data_path '/srv/jellyfin'
    option port '8096'
    option timezone 'Europe/Paris'

config jellyfin 'media'
    list media_path '/mnt/media/movies'
    list media_path '/mnt/media/music'

config jellyfin 'network'
    option domain 'jellyfin.secubox.local'
    option haproxy '0'
    option firewall_wan '0'

config jellyfin 'transcoding'
    option hw_accel '0'

config jellyfin 'mesh'
    option enabled '0'
```

## 使用方法

```sh
# 服务控制
/etc/init.d/jellyfin start
/etc/init.d/jellyfin stop

# 控制器 CLI
jellyfinctl install           # 拉取 Docker 镜像并创建容器
jellyfinctl status            # 显示容器和集成状态
jellyfinctl update            # 拉取最新镜像并重建容器
jellyfinctl logs              # 显示容器日志（-f 跟踪）
jellyfinctl shell             # 打开容器内的 shell
jellyfinctl backup            # 备份配置和数据
jellyfinctl restore <file>    # 从备份存档恢复
jellyfinctl uninstall         # 停止并删除容器和数据

# 集成
jellyfinctl configure-haproxy # 注册带 SSL 的 HAProxy vhost
jellyfinctl remove-haproxy    # 移除 HAProxy vhost
jellyfinctl configure-fw      # 打开 WAN 防火墙端口
jellyfinctl remove-fw         # 关闭 WAN 防火墙端口
jellyfinctl register-mesh     # 注册到 SecuBox P2P mesh
jellyfinctl unregister-mesh   # 从 mesh 注册表移除
```

Web 界面：`http://<device-ip>:8096`

## 功能特性

- 基于 Docker 的 Jellyfin，完整生命周期管理
- 多路径媒体库（电影、音乐、照片、剧集）
- 硬件 GPU 转码支持
- HAProxy 反向代理，集成 SSL/ACME
- 防火墙 WAN 端口暴露
- SecuBox P2P mesh 服务注册
- 完整的配置和数据备份/恢复
- 容器 shell 访问和日志流

## 文件

- `/etc/config/jellyfin` -- UCI 配置
- `/etc/init.d/jellyfin` -- procd 服务脚本
- `/usr/sbin/jellyfinctl` -- 控制器 CLI

## 依赖

- `dockerd`
- `docker`
- `containerd`

## 许可证

Apache-2.0
