[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Gitea 平台

在 SecuBox OpenWrt 系统的 LXC 容器中运行的自托管轻量级 Git 服务。

## 安装

```sh
opkg install secubox-app-gitea
```

## 配置

UCI 配置文件：`/etc/config/gitea`

```
config gitea 'main'
    option enabled '0'
    option http_port '3000'
    option ssh_port '2222'
```

## 使用方法

```sh
# 启动/停止服务
/etc/init.d/gitea start
/etc/init.d/gitea stop

# 控制器 CLI
giteactl status
giteactl install
giteactl remove
giteactl backup
giteactl restore
```

## 功能特性

- Git HTTP 和 SSH 访问
- 通过 Web 界面管理仓库和用户
- SQLite 数据库（内嵌）
- 备份和恢复支持
- 在 Alpine Linux LXC 容器中运行

## 文件

- `/etc/config/gitea` -- UCI 配置
- `/usr/sbin/giteactl` -- 控制器 CLI

## 依赖

- `jsonfilter`
- `wget-ssl`
- `tar`
- `lxc`
- `lxc-common`
- `git`

## 许可证

MIT
