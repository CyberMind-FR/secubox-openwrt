# LuCI Metabolizer CMS

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

内容管理系统仪表板，集成 Gitea 和静态站点发布功能。

## 安装

```bash
opkg install luci-app-metabolizer
```

## 访问

LuCI 菜单：**Services -> Metabolizer CMS**

## 标签页

- **Overview** -- 服务状态、文章数量、Gitea 同步状态
- **Settings** -- CMS 配置

## RPCD 方法

后端：`luci.metabolizer`

| 方法 | 描述 |
|--------|-------------|
| `status` | 服务状态和内容统计 |
| `list_posts` | 列出已发布的文章 |
| `gitea_status` | Gitea 仓库同步状态 |
| `sync` | 从源同步内容 |
| `build` | 构建静态站点 |
| `publish` | 发布已构建的站点 |
| `gitea_sync` | 与 Gitea 仓库同步 |

## 依赖

- `luci-base`
- `secubox-app-metabolizer`

## 许可证

Apache-2.0
