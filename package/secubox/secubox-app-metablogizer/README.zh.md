[English](README.md) | [Francais](README.fr.md) | 中文

# MetaBlogizer - 静态网站发布器

支持自动虚拟主机创建的静态网站发布器。支持 uhttpd（原生）和 nginx（LXC）后端。

## 安装

```bash
opkg install secubox-app-metablogizer
```

## 配置

UCI 配置文件：`/etc/config/metablogizer`

```bash
uci set metablogizer.main.enabled='1'
uci set metablogizer.main.backend='uhttpd'
uci set metablogizer.main.web_root='/srv/www'
uci commit metablogizer
```

## 使用方法

```bash
metablogizerctl create <site>        # 创建新站点
metablogizerctl deploy <site>        # 部署/发布站点
metablogizerctl list                 # 列出管理的站点
metablogizerctl remove <site>        # 删除站点
metablogizerctl vhost add <domain>   # 添加虚拟主机
metablogizerctl status               # 显示状态
```

## 功能特性

- 新站点自动创建虚拟主机
- uhttpd（OpenWrt 原生）和 nginx（LXC）后端
- 基于 Git 的内容部署

## 依赖

- `git`
- `uhttpd`

## 许可证

Apache-2.0
