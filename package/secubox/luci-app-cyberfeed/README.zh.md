# LuCI CyberFeed Dashboard

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

RSS 订阅聚合器，通过 RSS-Bridge 集成支持社交媒体。

## 安装

```bash
opkg install luci-app-cyberfeed
```

## 访问

LuCI 菜单：**Services -> CyberFeed**

## 标签页

- **Dashboard** -- 订阅状态、条目数量、上次同步时间
- **Feeds** -- 添加、删除和管理 RSS/Atom 订阅源
- **Preview** -- 浏览已获取的订阅条目
- **Settings** -- 刷新间隔、缓存有效期、RSS-Bridge 配置

## RPCD 方法

后端：`luci.cyberfeed`

| 方法 | 描述 |
|--------|-------------|
| `get_status` | 服务状态和订阅统计 |
| `get_feeds` | 列出已配置的订阅 |
| `get_items` | 获取已抓取的订阅条目 |
| `add_feed` | 添加新订阅源 |
| `delete_feed` | 删除订阅 |
| `sync_feeds` | 触发订阅同步 |
| `get_config` | 获取当前设置 |
| `save_config` | 保存设置 |
| `rssbridge_status` | RSS-Bridge 服务状态 |
| `rssbridge_install` | 安装 RSS-Bridge |
| `rssbridge_control` | 启动/停止 RSS-Bridge |

## 依赖

- `secubox-app-cyberfeed`

## 许可证

Apache-2.0
