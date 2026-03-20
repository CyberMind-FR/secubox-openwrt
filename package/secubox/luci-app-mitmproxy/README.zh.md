[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# mitmproxy - HTTPS 拦截代理

交互式 HTTPS 代理，用于调试、测试和安全分析，支持透明模式和基于 Web 的流量检查。

## 功能特性

| 功能 | 描述 |
|------|------|
| **流量检查** | 实时查看和分析 HTTP/HTTPS 请求 |
| **Web UI** | 内置 mitmweb 界面，带自动认证令牌 |
| **透明模式** | 通过 nftables 自动拦截流量 |
| **威胁检测** | 检测 SQL 注入、XSS、命令注入、Log4Shell |
| **HAProxy 集成** | 检查所有 vhost 后端并进行威胁检测 |
| **CA 证书** | 生成和管理 SSL 拦截证书 |
| **CrowdSec 日志** | 将威胁记录到 CrowdSec 以自动阻止 |
| **过滤** | 过滤和跟踪 CDN、媒体、广告和跟踪器 |
| **白名单** | 对特定 IP/域名绕过拦截 |

## 快速开始

### 代理模式

| 模式 | 描述 | 使用场景 |
|------|------|----------|
| **Regular** | 手动配置客户端 | 测试特定应用 |
| **Transparent** | 通过防火墙自动拦截 | 全网络检查 |
| **Upstream** | 转发到另一个代理 | 代理链接 |
| **Reverse** | 反向代理模式 | 后端分析 |

### 启用透明模式

1. 转到 **安全 -> mitmproxy -> 设置**
2. 将 **代理模式** 设置为 `Transparent`
3. 启用 **透明防火墙**
4. 点击 **保存并应用**

### 安装 CA 证书

对于 HTTPS 拦截，需要在客户端设备上安装 mitmproxy CA：

1. 配置设备使用代理（或使用透明模式）
2. 从设备导航到 `http://mitm.it`
3. 下载并安装适合您操作系统的证书
4. 在系统设置中信任该证书

## 仪表板

```
+--------------------------------------------------------------+
|  mitmproxy                                      运行中        |
+--------------------------------------------------------------+
|                                                              |
|  +------------+  +------------+  +------------+  +--------+  |
|  | 12.5K      |  | 245        |  | 45 MB      |  | 8080   |  |
|  | 请求       |  | 主机       |  | 流数据     |  | 端口   |  |
|  +------------+  +------------+  +------------+  +--------+  |
|                                                              |
|  热门主机                         CA 证书                     |
|  +------------------------------+ +-------------------------+|
|  | api.example.com       1,234  | | mitmproxy CA            ||
|  | cdn.cloudflare.com      890  | | 证书已安装              ||
|  | www.google.com          567  | | 过期: 2026-01-28        ||
|  | analytics.google.com    432  | | [下载]                  ||
|  +------------------------------+ +-------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

## 请求捕获

### 实时请求查看器

请求选项卡实时显示捕获的 HTTP 流量：

```
+--------------------------------------------------------------+
|  捕获的请求                                      暂停         |
+--------------------------------------------------------------+
|                                                              |
|  [GET]  api.example.com/users         200  application/json  |
|  [POST] auth.example.com/login        201  application/json  |
|  [GET]  cdn.cloudflare.com/script.js  200  text/javascript   |
|  [GET]  www.google.com/search         200  text/html         |
|  [PUT]  api.example.com/user/123      204  -                 |
|                                                              |
+--------------------------------------------------------------+
```

### 查看请求详情

点击任意请求可查看：
- 完整的请求头
- 响应头
- Cookie
- 请求/响应正文（如果已捕获）

## 透明模式

### 架构

```
  客户端设备                      SecuBox 路由器
+----------------+               +------------------------+
|                |               |                        |
|  浏览器        |<-- HTTP/S -->|  nftables REDIRECT     |
|                |               |         |              |
+----------------+               |         v              |
                                 |  +------------------+  |
                                 |  |    mitmproxy     |  |
                                 |  |   (端口 8080)    |  |
                                 |  +--------+---------+  |
                                 |           |            |
                                 |           v            |
                                 |     互联网             |
                                 +------------------------+
```

### 防火墙设置

启用透明模式时，mitmproxy 会自动创建 nftables 规则：

```bash
# HTTP 重定向（端口 80 -> 8080）
nft add rule inet fw4 prerouting tcp dport 80 redirect to :8080

# HTTPS 重定向（端口 443 -> 8080）
nft add rule inet fw4 prerouting tcp dport 443 redirect to :8080
```

## HAProxy 后端检查

将所有 HAProxy vhost 流量路由通过 mitmproxy 进行威胁检测。

### 架构

```
互联网 -> HAProxy（SSL 终止）-> mitmproxy :8890 -> 实际后端
                                     |
                               威胁检测
                                     |
                               CrowdSec 日志
```

### 启用 HAProxy 检查

```bash
# 通过 CLI
mitmproxyctl haproxy-enable

# 它的作用：
# 1. 将 HAProxy 后端同步到 mitmproxy 路由
# 2. 更新所有 vhost 以通过 mitmproxy 路由
# 3. 重启两个服务
```

### 禁用 HAProxy 检查

```bash
# 恢复原始后端
mitmproxyctl haproxy-disable
```

### 手动路由同步

```bash
# 从 HAProxy UCI 同步路由而不启用检查
mitmproxyctl sync-routes
```

### HAProxy 检查器命令

| 命令 | 描述 |
|------|------|
| `mitmproxyctl haproxy-enable` | 启用后端检查 |
| `mitmproxyctl haproxy-disable` | 恢复原始后端 |
| `mitmproxyctl sync-routes` | 从 HAProxy UCI 同步路由 |

## 威胁检测

分析插件检测 90 多种攻击模式，包括：

| 类别 | 示例 |
|------|------|
| **SQL 注入** | UNION SELECT、OR 1=1、基于时间的盲注 |
| **XSS** | script 标签、事件处理器、javascript: |
| **命令注入** | shell 命令、管道注入 |
| **路径遍历** | ../../../etc/passwd |
| **SSRF** | 内部 IP 访问、元数据端点 |
| **Log4Shell** | ${jndi:ldap://...} |
| **管理扫描器** | /wp-admin、/phpmyadmin、/.env |

### 查看威胁

威胁在 LuCI 仪表板中显示，包含：
- 严重级别（严重/高/中/低）
- 攻击模式类型
- 来源 IP 和国家
- 请求路径和方法

### CrowdSec 集成

检测到的威胁记录到 `/var/log/crowdsec/mitmproxy-threats.log`，用于：
- 通过 CrowdSec bouncer 自动阻止 IP
- 威胁情报共享
- 安全分析

## 配置

### UCI 设置

```bash
# /etc/config/mitmproxy

config mitmproxy 'main'
    option enabled '1'
    option mode 'transparent'        # regular | transparent | upstream | reverse
    option proxy_port '8080'
    option web_host '0.0.0.0'
    option web_port '8081'
    option data_path '/srv/mitmproxy'
    option memory_limit '256M'
    option ssl_insecure '0'          # 接受无效的上游证书
    option anticache '0'             # 去除缓存头
    option anticomp '0'              # 禁用压缩
    option flow_detail '1'           # 日志详细级别（0-4）

config transparent 'transparent'
    option enabled '1'
    option interface 'br-lan'
    option redirect_http '1'
    option redirect_https '1'
    option http_port '80'
    option https_port '443'

config whitelist 'whitelist'
    option enabled '1'
    list bypass_ip '192.168.255.0/24'
    list bypass_domain 'banking.com'

config filtering 'filtering'
    option enabled '1'
    option log_requests '1'
    option filter_cdn '0'
    option filter_media '0'
    option block_ads '0'
    option addon_script '/data/addons/secubox_analytics.py'

config haproxy_router 'haproxy_router'
    option enabled '0'
    option listen_port '8889'
    option threat_detection '1'
    option routes_file '/srv/mitmproxy/haproxy-routes.json'

config capture 'capture'
    option save_flows '0'
    option capture_request_headers '1'
    option capture_response_headers '1'
    option capture_request_body '0'
    option capture_response_body '0'
```

## RPCD API

### 服务控制

| 方法 | 描述 |
|------|------|
| `status` | 获取服务状态（包含认证令牌）|
| `start` | 启动 mitmproxy |
| `stop` | 停止 mitmproxy |
| `restart` | 重启服务 |
| `install` | 安装 mitmproxy 容器 |

### 配置

| 方法 | 描述 |
|------|------|
| `settings` | 获取所有设置 |
| `save_settings` | 保存配置 |
| `set_mode` | 设置代理模式 |

### 威胁检测

| 方法 | 描述 |
|------|------|
| `alerts` | 获取检测到的威胁 |
| `threat_stats` | 获取威胁统计 |
| `clear_alerts` | 清除所有警报 |

### HAProxy 集成

| 方法 | 描述 |
|------|------|
| `haproxy_enable` | 启用后端检查 |
| `haproxy_disable` | 恢复原始后端 |
| `sync_routes` | 从 HAProxy 同步路由 |

### 防火墙

| 方法 | 描述 |
|------|------|
| `setup_firewall` | 设置透明模式规则 |
| `clear_firewall` | 移除防火墙规则 |

### 使用示例

```bash
# 获取状态（包含 Web UI 的认证令牌）
ubus call luci.mitmproxy status

# 响应：
{
  "enabled": true,
  "running": true,
  "installed": true,
  "web_port": 8081,
  "proxy_port": 8888,
  "mode": "regular",
  "token": "abc123xyz...",
  "haproxy_router_enabled": false,
  "haproxy_listen_port": 8889
}

# 获取检测到的威胁
ubus call luci.mitmproxy alerts

# 响应：
{
  "success": true,
  "alerts": [
    {
      "time": "2026-01-31T12:00:00",
      "severity": "high",
      "pattern": "sql_injection",
      "method": "GET",
      "path": "/api?id=1' OR 1=1--",
      "ip": "192.168.1.100"
    }
  ]
}

# 启用 HAProxy 后端检查
ubus call luci.mitmproxy haproxy_enable

# 响应：
{
  "success": true,
  "message": "HAProxy 后端检查已启用"
}
```

## Web UI 访问

mitmweb UI 需要通过令牌进行身份验证。

### 通过 LuCI 自动认证

LuCI 仪表板显示包含令牌的 Web UI 链接：
```
http://192.168.255.1:8081/?token=abc123xyz
```

### 手动获取令牌

```bash
# 令牌存储在数据目录中
cat /srv/mitmproxy/.mitmproxy_token

# 或通过 RPCD
ubus call luci.mitmproxy status | jsonfilter -e '@.token'
```

## CA 证书

### 生成新证书

```bash
# 证书在首次启动时自动生成
# 位于：/srv/mitmproxy/mitmproxy-ca-cert.pem
```

### 下载证书

1. 访问 mitmweb UI（使用 LuCI 仪表板中的令牌）
2. 或从已代理的设备导航到 `http://mitm.it`
3. 下载适合您平台的证书

### 证书位置

| 路径 | 描述 |
|------|------|
| `/srv/mitmproxy/certs/mitmproxy-ca.pem` | CA 私钥 + 证书 |
| `/srv/mitmproxy/certs/mitmproxy-ca-cert.pem` | 仅 CA 证书 |
| `/srv/mitmproxy/certs/mitmproxy-ca-cert.cer` | 证书（DER 格式）|

## 过滤和分析

### CDN 跟踪

跟踪到主要 CDN 提供商的流量：
- Cloudflare
- Akamai
- Fastly
- AWS CloudFront
- Google Cloud CDN

### 媒体流跟踪

跟踪流媒体服务：
- YouTube
- Netflix
- Spotify
- Twitch
- Amazon Prime Video

### 广告屏蔽

使用内置过滤插件阻止已知的广告和跟踪域名。

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/mitmproxy` | UCI 配置 |
| `/srv/mitmproxy/` | 数据目录 |
| `/srv/mitmproxy/certs/` | CA 证书 |
| `/srv/mitmproxy/flows/` | 捕获的流文件 |
| `/var/lib/lxc/mitmproxy/` | LXC 容器根目录 |
| `/usr/libexec/rpcd/luci.mitmproxy` | RPCD 后端 |

## 故障排除

### 服务无法启动

```bash
# 检查容器状态
lxc-info -n mitmproxy

# 检查日志
logread | grep mitmproxy

# 验证 Docker 是否可用
docker ps
```

### 没有流量被捕获

1. **Regular 模式**：验证客户端代理设置指向 `192.168.255.1:8080`
2. **Transparent 模式**：使用 `nft list ruleset | grep redirect` 检查防火墙规则
3. 验证 mitmproxy 正在监听：`netstat -tln | grep 8080`

### HTTPS 拦截不工作

1. 在客户端设备上安装 CA 证书
2. 在系统设置中信任该证书
3. 某些应用使用证书固定，无法被拦截

### Web UI 无法访问

```bash
# 检查 web 端口是否在监听
netstat -tln | grep 8081

# 从路由器验证
curl -I http://127.0.0.1:8081

# 检查防火墙是否允许访问
uci show firewall | grep mitmproxy
```

### 内存问题

```bash
# 增加内存限制
uci set mitmproxy.main.memory_limit='512M'
uci commit mitmproxy
/etc/init.d/mitmproxy restart
```

## 安全注意事项

1. **敏感工具** - mitmproxy 可以拦截所有网络流量，包括密码。请负责任地使用。
2. **CA 证书** - 保护好 CA 私钥。任何拥有访问权限的人都可以拦截流量。
3. **白名单银行** - 将银行和金融网站添加到绕过列表中。
4. **不使用时禁用** - 不主动调试时关闭透明模式。
5. **审计跟踪** - 所有捕获的请求可能包含敏感数据。

## 许可证

MIT License - Copyright (C) 2025-2026 CyberMind.fr
