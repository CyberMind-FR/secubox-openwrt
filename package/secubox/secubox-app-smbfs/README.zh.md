# SecuBox SMB/CIFS Remote Mount Manager

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

管理用于媒体服务器（Jellyfin、Lyrion）、备份和通用远程存储的 SMB/CIFS 网络共享。

## 安装

```sh
opkg install secubox-app-smbfs
```

## 配置

UCI 配置文件：`/etc/config/smbfs`

```
config smbfs 'global'
    option enabled '1'
    option mount_base '/mnt/smb'
    option cifs_version '3.0'
    option timeout '10'

config mount 'movies'
    option enabled '1'
    option server '//192.168.1.100/movies'
    option mountpoint '/mnt/smb/movies'
    option username 'media'
    option _password 'secret'
    option read_only '1'
    option auto_mount '1'
    option description 'NAS 电影库'
```

## 使用方法

```sh
# 添加共享
smbfsctl add movies //nas/movies /mnt/smb/movies

# 设置凭证
smbfsctl credentials movies user password

# 设置选项
smbfsctl set movies read_only 1
smbfsctl set movies description '电影库'

# 测试连接
smbfsctl test movies

# 挂载 / 卸载
smbfsctl mount movies
smbfsctl umount movies

# 启用开机自动挂载
smbfsctl enable movies

# 列出所有共享
smbfsctl list

# 显示详细的挂载状态
smbfsctl status

# 挂载所有已启用的共享
smbfsctl mount-all
```

## 与媒体应用集成

```sh
# Jellyfin：将挂载的共享添加为媒体库
uci add_list jellyfin.media.media_path='/mnt/smb/movies'
uci commit jellyfin

# Lyrion：将音乐库指向挂载的共享
uci set lyrion.main.media_path='/mnt/smb/music'
uci commit lyrion
```

## 功能特性

- 基于 UCI 的共享配置，支持凭证存储
- 启用的共享开机自动挂载
- 只读或读写挂载模式
- CIFS 协议版本选择（2.0、2.1、3.0）
- 挂载前连接测试
- 带磁盘使用报告的挂载状态
- 与 Jellyfin 和 Lyrion 媒体路径集成

## 文件

- `/etc/config/smbfs` -- UCI 配置
- `/etc/init.d/smbfs` -- procd init 脚本（自动挂载）
- `/usr/sbin/smbfsctl` -- 控制器 CLI

## 依赖

- `kmod-fs-cifs` -- CIFS 内核模块
- `cifsmount` -- mount.cifs 工具

## 许可证

Apache-2.0
