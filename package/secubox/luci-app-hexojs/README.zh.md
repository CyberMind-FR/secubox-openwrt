# Hexo CMS - 博客发布平台

[English](README.md) | [Francais](README.fr.md) | 中文

功能齐全的 Hexo 博客管理，支持多实例、Gitea 集成、HAProxy 发布和 Tor 隐藏服务。

## 功能

| 功能 | 描述 |
|------|------|
| **文章编辑器** | 使用 markdown 创建、编辑、发布文章 |
| **分类/标签** | 分层组织内容 |
| **媒体库** | 管理图片和资源 |
| **主题配置** | 编辑 Hexo 主题设置 |
| **一键部署** | 单击生成和部署 |
| **HAProxy 集成** | 自动发布到带 SSL 的 clearnet |
| **Tor 隐藏服务** | 发布到 .onion 地址 |
| **Gitea 同步** | 从 Git 仓库推送/拉取 |
| **发布配置文件** | 常用设置的向导预设 |
| **健康监控** | 流水线状态和诊断 |

## 快速入门向导

### 发布配置文件

选择一个预设来配置您的博客：

| 配置文件 | 图标 | HAProxy | Tor | 用例 |
|----------|------|---------|-----|------|
| **Blog** | - | SSL | 否 | 带自定义域名的公开博客 |
| **Portfolio** | - | SSL | 否 | 创意展示 |
| **Privacy** | - | 否 | 是 | 匿名 .onion 博客 |
| **Dual** | - | 是 | 是 | Clearnet + Tor 访问 |
| **Documentation** | - | SSL | 否 | 技术文档站点 |

### 应用配置文件

```bash
# 通过 LuCI：服务 -> Hexo CMS -> 配置文件 -> 应用

# 通过 CLI
ubus call luci.hexojs apply_profile '{
  "instance": "default",
  "profile": "blog",
  "domain": "blog.example.com"
}'
```

## 仪表板

```
+------------------------------------------------------+
|  Hexo CMS                                 运行中     |
+------------------------------------------------------+
|                                                      |
|  网站统计                                            |
|  +-- 文章：134                                       |
|  +-- 分类：12                                        |
|  +-- 标签：45                                        |
|  +-- 媒体：89 个文件                                 |
|                                                      |
|  访问端点                                            |
|  +-- 本地：http://192.168.255.1:4000                 |
|  +-- Clearnet：https://blog.example.com              |
|  +-- Tor：http://abc123xyz.onion                     |
|                                                      |
|  流水线健康度：95/100                                |
|  +-- Hexo 服务器：运行中                             |
|  +-- HAProxy：已发布                                 |
|  +-- 证书：有效（45 天）                             |
|  +-- Gitea：已同步                                   |
|                                                      |
+------------------------------------------------------+
```

## 内容管理

### 创建文章

1. 转到 **服务 -> Hexo CMS -> 文章**
2. 点击 **+ 新建文章**
3. 填写：
   - **标题**：我的第一篇文章
   - **分类**：tech/tutorials
   - **标签**：hexo, blog
   - **内容**：您的 markdown 内容
4. 点击 **保存草稿** 或 **发布**

### 文章 Front Matter

```yaml
---
title: 我的第一篇文章
date: 2025-01-28 10:30:00
categories:
  - tech
  - tutorials
tags:
  - hexo
  - blog
---

您的内容在这里...
```

### 通过 CLI 列出文章

```bash
ubus call luci.hexojs list_posts '{"instance":"default","limit":10}'
```

## 发布流水线

### 完整发布流程

```
+-----------+    +-----------+    +-----------+    +-----------+
|   编辑    | -> |   生成    | -> |   部署    | -> |   上线    |
|   文章    |    |   HTML    |    | HAProxy   |    |           |
+-----------+    +-----------+    |   Tor     |    +-----------+
                                  +-----------+
```

### 命令

```bash
# 生成静态文件
ubus call luci.hexojs generate '{"instance":"default"}'

# 部署到 HAProxy（clearnet）
ubus call luci.hexojs publish_to_haproxy '{
  "instance": "default",
  "domain": "blog.example.com"
}'

# 部署到 Tor（.onion）
ubus call luci.hexojs publish_to_tor '{"instance":"default"}'

# 完整流水线（生成 + 全部部署）
ubus call luci.hexojs full_publish '{
  "instance": "default",
  "domain": "blog.example.com",
  "tor": true
}'
```

## HAProxy 集成

### 发布到 Clearnet

1. 转到 **Hexo CMS -> 发布**
2. 输入域名：`blog.example.com`
3. 勾选 **启用 SSL**
4. 点击 **发布到 HAProxy**

### 发生的操作

1. 创建 HAProxy 后端 -> `hexo_default`
2. 创建 HAProxy 服务器 -> `127.0.0.1:4000`
3. 创建 vhost -> `blog.example.com`
4. 请求 ACME 证书
5. 重新加载 HAProxy

### 检查 HAProxy 状态

```bash
ubus call luci.hexojs get_haproxy_status '{"instance":"default"}'

# 响应：
{
  "published": true,
  "domain": "blog.example.com",
  "ssl": true,
  "cert_status": "valid",
  "cert_days": 45,
  "dns_status": "ok"
}
```

## Tor 隐藏服务

### 创建 .onion 站点

```bash
ubus call luci.hexojs publish_to_tor '{"instance":"default"}'
```

### 获取 Onion 地址

```bash
ubus call luci.hexojs get_tor_status '{"instance":"default"}'

# 响应：
{
  "enabled": true,
  "onion_address": "abc123xyz...def.onion",
  "virtual_port": 80,
  "status": "active"
}
```

### 通过 Tor 浏览器访问

```
http://abc123xyz...def.onion
```

## Gitea 集成

### 设置 Gitea 同步

1. 转到 **Hexo CMS -> Git**
2. 输入仓库：`user/myblog`
3. 配置凭据（可选）
4. 点击 **克隆** 或 **拉取**

### Webhook 自动部署

启用推送到 Gitea 时的自动部署：

```bash
ubus call luci.hexojs setup_webhook '{
  "instance": "default",
  "auto_build": true
}'
```

### Git 操作

```bash
# 克隆仓库
ubus call luci.hexojs git_clone '{
  "instance": "default",
  "url": "http://192.168.255.1:3000/user/myblog.git"
}'

# 拉取最新
ubus call luci.hexojs git_pull '{"instance":"default"}'

# 推送更改
ubus call luci.hexojs git_push '{"instance":"default"}'

# 查看日志
ubus call luci.hexojs git_log '{"instance":"default","limit":10}'
```

## 健康监控

### 实例健康分数

```bash
ubus call luci.hexojs get_instance_health '{"instance":"default"}'

# 响应：
{
  "instance": "default",
  "score": 95,
  "status": "healthy",
  "checks": {
    "hexo_running": true,
    "content_exists": true,
    "haproxy_published": true,
    "ssl_valid": true,
    "dns_resolves": true,
    "git_clean": true
  },
  "issues": []
}
```

### 健康分数明细

| 检查项 | 分数 | 描述 |
|--------|------|------|
| Hexo 运行中 | 20 | 服务器进程活跃 |
| 内容存在 | 15 | 文章目录有内容 |
| HAProxy 已发布 | 20 | Vhost 已配置 |
| SSL 有效 | 15 | 证书未过期 |
| DNS 解析 | 15 | 域名指向服务器 |
| Git 干净 | 15 | 无未提交的更改 |

## 配置

### UCI 设置

```bash
# /etc/config/hexojs

config hexojs 'main'
    option enabled '1'
    option instances_root '/srv/hexojs/instances'
    option content_root '/srv/hexojs/content'

config instance 'default'
    option name 'default'
    option enabled '1'
    option port '4000'
    option theme 'landscape'
    # HAProxy
    option haproxy_enabled '1'
    option haproxy_domain 'blog.example.com'
    option haproxy_ssl '1'
    # Tor
    option tor_enabled '1'
    option tor_onion 'abc123...onion'
    # Gitea
    option gitea_repo 'user/myblog'
    option gitea_auto_build '1'
```

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/hexojs` | UCI 配置 |
| `/srv/hexojs/instances/` | 实例目录 |
| `/srv/hexojs/content/` | 共享内容（文章、媒体） |
| `/srv/hexojs/content/source/_posts/` | 博客文章 |
| `/srv/hexojs/content/source/images/` | 媒体文件 |
| `/usr/libexec/rpcd/luci.hexojs` | RPCD 后端 |

## RPCD 方法

### 内容管理

| 方法 | 描述 |
|------|------|
| `list_posts` | 列出所有文章 |
| `get_post` | 获取单篇文章内容 |
| `create_post` | 创建新文章 |
| `update_post` | 更新文章内容 |
| `delete_post` | 删除文章 |
| `publish_post` | 将草稿移至已发布 |
| `search_posts` | 按查询搜索文章 |

### 站点操作

| 方法 | 描述 |
|------|------|
| `generate` | 生成静态 HTML |
| `clean` | 清理生成的文件 |
| `deploy` | 部署到配置的目标 |
| `preview_start` | 启动预览服务器 |
| `preview_status` | 检查预览服务器 |

### 发布

| 方法 | 描述 |
|------|------|
| `publish_to_haproxy` | 发布到 clearnet |
| `unpublish_from_haproxy` | 从 HAProxy 移除 |
| `publish_to_tor` | 创建 Tor 隐藏服务 |
| `unpublish_from_tor` | 移除 Tor 服务 |
| `full_publish` | 完整流水线 |

### 监控

| 方法 | 描述 |
|------|------|
| `get_instance_health` | 健康分数和检查 |
| `get_pipeline_status` | 所有实例状态 |
| `get_instance_endpoints` | 实例的所有 URL |

## 故障排除

### Hexo 服务器无法启动

```bash
# 检查端口是否被占用
netstat -tln | grep 4000

# 检查日志
logread | grep hexo

# 手动重启
/etc/init.d/hexojs restart
```

### 文章不显示

1. 检查文章是否在 `/srv/hexojs/content/source/_posts/`
2. 验证 front matter 格式正确
3. 运行 `hexo clean && hexo generate`

### HAProxy 503 错误

1. 验证 Hexo 在预期端口上运行
2. 检查 HAProxy 后端配置
3. 测试本地访问：`curl http://127.0.0.1:4000`

### Git 推送失败

1. 检查凭据：`ubus call luci.hexojs git_get_credentials`
2. 验证远程 URL 正确
3. 检查 Gitea 是否可访问

## 许可证

MIT License - Copyright (C) 2025 CyberMind.fr
