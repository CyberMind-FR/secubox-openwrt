# MetaBlogizer - 静态站点发布器

[English](README.md) | [Francais](README.fr.md) | 中文

一键静态网站托管，自动 HAProxy 虚拟主机、SSL 证书和 Gitea 同步。

## 功能

| 功能 | 描述 |
|------|------|
| **自动 Vhost** | 自动创建 HAProxy vhost + 后端 |
| **ACME SSL** | 自动 Let's Encrypt 证书 |
| **Gitea 同步** | 从 Gitea 仓库拉取 |
| **文件上传** | 拖放文件上传 |
| **健康状态** | DNS、证书和发布监控 |
| **QR 码** | 使用 QR 码分享站点 |

## 快速开始

### 通过 LuCI 创建站点

1. 转到 **服务 -> MetaBlogizer**
2. 点击 **+ 新建站点**
3. 填写：
   - **站点名称**：`myblog`
   - **域名**：`blog.example.com`
   - **Gitea 仓库**：`user/repo`（可选）
4. 点击 **创建**

### 自动发生的操作

```
+-----------------------------------------------------+
|  创建站点 "myblog" @ blog.example.com               |
+-----------------------------------------------------+
|  1. 创建 /srv/metablogizer/sites/myblog/            |
|  2. 创建 HAProxy 后端（metablog_myblog）            |
|  3. 创建 HAProxy vhost（blog.example.com）          |
|  4. 请求 ACME 证书                                  |
|  5. 生成默认 index.html                             |
|  6. 站点上线 https://blog.example.com               |
+-----------------------------------------------------+
```

## 仪表板

### Web 托管状态面板

仪表板显示所有站点的实时健康状态：

| 站点 | 域名 | DNS | 解析 IP | 证书 | 状态 |
|------|------|-----|---------|------|------|
| myblog | blog.example.com | 正常 | 185.220.x.x | 45天 | 已发布 |
| docs | docs.example.com | 失败 | - | 缺失 | 待处理 |

### 状态指示器

| 图标 | DNS 状态 | 含义 |
|------|----------|------|
| 正常 | DNS 解析到您的公网 IP |
| 私有 | DNS 指向私有 IP（192.168.x.x） |
| 不匹配 | DNS 指向不同的公网 IP |
| 失败 | DNS 解析失败 |

| 图标 | 证书状态 | 含义 |
|------|----------|------|
| 正常 | 证书有效（30+ 天） |
| 警告 | 证书即将过期（7-30 天） |
| 严重 | 证书紧急（<7 天） |
| 过期 | 证书已过期 |
| 缺失 | 无证书 |

| 图标 | 发布状态 | 含义 |
|------|----------|------|
| 已发布 | 站点已启用且有内容 |
| 待处理 | 站点已启用，尚无内容 |
| 草稿 | 站点已禁用 |

## 文件管理

### 上传文件

1. 在站点卡片上点击 **上传**
2. 拖放文件或点击浏览
3. 勾选"将第一个 HTML 设为首页"以用作 index.html
4. 点击 **上传**

### 管理文件

1. 在站点卡片上点击 **文件**
2. 查看所有已上传的文件
3. 将任意 HTML 文件设为首页
4. 删除文件

## Gitea 同步

### 设置

1. 创建/编辑站点
2. 输入 Gitea 仓库：`username/repo`
3. 点击 **同步** 拉取最新内容

### 自动同步

站点从 Gitea 同步的时机：
- 手动点击同步按钮
- Webhook 推送（如果配置）

```bash
# 通过 CLI 手动同步
ubus call luci.metablogizer sync_site '{"id":"site_myblog"}'
```

## 分享和 QR

点击任意站点的 **分享** 可获得：
- 复制 URL 到剪贴板
- 移动访问 QR 码
- Twitter 分享
- LinkedIn 分享
- Facebook 分享
- Telegram 分享
- WhatsApp 分享
- 邮件分享

## 配置

### UCI 设置

```bash
# /etc/config/metablogizer

config metablogizer 'main'
    option enabled '1'
    option runtime 'auto'           # auto | uhttpd | nginx
    option sites_root '/srv/metablogizer/sites'
    option nginx_container 'nginx'
    option gitea_url 'http://192.168.255.1:3000'

config site 'site_myblog'
    option name 'myblog'
    option domain 'blog.example.com'
    option gitea_repo 'user/myblog'
    option ssl '1'
    option enabled '1'
    option description '我的个人博客'
    option port '8901'
    option runtime 'uhttpd'
```

### 运行时模式

| 模式 | 描述 | 用例 |
|------|------|------|
| **uhttpd** | OpenWrt 内置 Web 服务器 | 默认，轻量 |
| **nginx** | LXC 容器中的 Nginx | 高级功能 |
| **auto** | 自动检测可用运行时 | 推荐 |

## RPCD API

### 站点管理

```bash
# 列出所有站点
ubus call luci.metablogizer list_sites

# 创建站点
ubus call luci.metablogizer create_site '{
  "name": "myblog",
  "domain": "blog.example.com",
  "gitea_repo": "user/myblog",
  "ssl": "1",
  "description": "我的博客"
}'

# 从 Gitea 同步
ubus call luci.metablogizer sync_site '{"id":"site_myblog"}'

# 删除站点
ubus call luci.metablogizer delete_site '{"id":"site_myblog"}'
```

### 健康监控

```bash
# 获取所有站点的托管状态
ubus call luci.metablogizer get_hosting_status

# 响应：
{
  "success": true,
  "public_ip": "185.220.101.12",
  "haproxy_status": "running",
  "sites": [{
    "id": "site_myblog",
    "name": "myblog",
    "domain": "blog.example.com",
    "dns_status": "ok",
    "dns_ip": "185.220.101.12",
    "cert_status": "ok",
    "cert_days": 45,
    "publish_status": "published"
  }]
}

# 检查单个站点健康
ubus call luci.metablogizer check_site_health '{"id":"site_myblog"}'
```

### 文件操作

```bash
# 列出站点中的文件
ubus call luci.metablogizer list_files '{"id":"site_myblog"}'

# 上传文件（base64 内容）
ubus call luci.metablogizer upload_file '{
  "id": "site_myblog",
  "filename": "style.css",
  "content": "Ym9keSB7IGJhY2tncm91bmQ6ICNmZmY7IH0="
}'
```

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/metablogizer` | UCI 配置 |
| `/srv/metablogizer/sites/` | 站点内容目录 |
| `/srv/metablogizer/sites/<name>/index.html` | 站点首页 |
| `/usr/libexec/rpcd/luci.metablogizer` | RPCD 后端 |

## 故障排除

### 站点显示 503

1. 检查 HAProxy 是否运行：`lxc-info -n haproxy`
2. 检查后端端口是否监听
3. 验证 uhttpd 实例：`uci show uhttpd | grep metablog`

### DNS 不解析

1. 验证 A 记录指向您的公网 IP
2. 检查：`nslookup blog.example.com`
3. 等待 DNS 传播（最多 48 小时）

### 证书缺失

1. 首先确保 DNS 正确解析
2. 确保端口 80/443 可从互联网访问
3. 检查 ACME 日志：`logread | grep acme`

### Gitea 同步失败

1. 验证 Gitea URL：`uci get metablogizer.main.gitea_url`
2. 检查仓库是否存在且公开
3. 手动测试：`git clone http://192.168.255.1:3000/user/repo.git`

## 许可证

MIT License - Copyright (C) 2025 CyberMind.fr
