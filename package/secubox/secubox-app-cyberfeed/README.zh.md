# CyberFeed - RSS 订阅聚合器

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

适用于 OpenWrt/SecuBox 的 RSS 订阅聚合器，支持 RSS-Bridge 以获取社交媒体订阅。

## 安装

```sh
opkg install secubox-app-cyberfeed
```

## 配置

UCI 配置文件：`/etc/config/cyberfeed`

订阅列表：`/etc/cyberfeed/feeds.conf`

```
config cyberfeed 'main'
    option enabled '1'
    option refresh_interval '3600'
```

## 使用方法

```sh
# 获取并更新订阅
cyberfeed update

# 列出缓存的订阅
cyberfeed list

# 为社交媒体订阅设置 RSS-Bridge
rss-bridge-setup
```

启用后，订阅刷新通过 cron 自动运行。

## 文件

- `/etc/config/cyberfeed` -- UCI 配置
- `/etc/cyberfeed/feeds.conf` -- 订阅 URL 列表
- `/usr/bin/cyberfeed` -- 主 CLI
- `/usr/bin/rss-bridge-setup` -- RSS-Bridge 安装程序

## 依赖

- `wget-ssl`
- `jsonfilter`
- `coreutils-stat`

## 许可证

MIT
