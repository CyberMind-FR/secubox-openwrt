[English](README.md) | [Francais](README.fr.md) | 中文

# HAProxy Manager - 反向代理仪表板

企业级反向代理管理，支持自动 SSL 证书、虚拟主机配置和后端健康监控。

## 功能特性

| 功能 | 描述 |
|------|------|
| **虚拟主机管理** | 创建和管理虚拟主机 |
| **ACME SSL** | 自动 Let's Encrypt 证书 |
| **负载均衡** | Round-robin、least-conn、source |
| **健康检查** | 后端服务器监控 |
| **统计信息** | 实时流量仪表板 |
| **配置生成器** | 自动生成 HAProxy 配置 |
| **LXC 容器** | 在隔离容器中运行 |

## 快速开始

### 创建虚拟主机

1. 转到 **服务 -> HAProxy -> 虚拟主机**
2. 点击 **+ 添加虚拟主机**
3. 填写：
   - **域名**：`app.example.com`
   - **后端**：选择或创建
   - **SSL**：启用
   - **ACME**：自动证书
4. 点击 **保存并应用**

### 架构

```
                    +-------------------------------------+
   互联网           |         HAProxy 容器               |
       |            |  +-----------------------------+   |
       v            |  |      前端                   |   |
  +---------+       |  |  :80 -> 重定向到 :443      |   |
  | 端口 80 |------>|  |  :443 -> SSL 终止         |   |
  |端口 443 |       |  +-------------+---------------+   |
  +---------+       |                |                   |
                    |                v                   |
                    |  +-----------------------------+   |
                    |  |      后端                   |   |
                    |  |  app.example.com ->:8080    |   |
                    |  |  api.example.com ->:3000    |   |
                    |  |  blog.example.com->:4000    |   |
                    |  +-----------------------------+   |
                    +-------------------------------------+
```

## 仪表板

```
+------------------------------------------------------+
|  HAProxy                              运行中         |
+------------------------------------------------------+
|                                                      |
|  统计信息                                            |
|  +- 虚拟主机：5 个活跃                              |
|  +- 后端：8 个已配置                                |
|  +- 证书：5 个有效                                  |
|  +- 请求：12.5K/分钟                                |
|                                                      |
|  后端健康状态                                        |
|  +------------+--------+--------+---------+          |
|  | 后端       | 状态   | 服务器 | 延迟    |          |
|  +------------+--------+--------+---------+          |
|  | webapp     | 正常   | 2/2    | 12ms    |          |
|  | api        | 正常   | 1/1    | 8ms     |          |
|  | blog       | 降级   | 1/2    | 45ms    |          |
|  +------------+--------+--------+---------+          |
|                                                      |
+------------------------------------------------------+
```

## 虚拟主机配置

### 创建虚拟主机

```bash
ubus call luci.haproxy create_vhost '{
  "domain": "app.example.com",
  "backend": "webapp",
  "ssl": 1,
  "ssl_redirect": 1,
  "acme": 1,
  "enabled": 1
}'
```

### 虚拟主机选项

| 选项 | 默认值 | 描述 |
|------|--------|------|
| `domain` | - | 域名（必填） |
| `backend` | - | 要路由到的后端名称 |
| `ssl` | 1 | 启用 SSL/TLS |
| `ssl_redirect` | 1 | 将 HTTP 重定向到 HTTPS |
| `acme` | 1 | 自动请求 Let's Encrypt 证书 |
| `enabled` | 1 | 虚拟主机活跃 |

### 列出虚拟主机

```bash
ubus call luci.haproxy list_vhosts

# 响应：
{
  "vhosts": [{
    "id": "app_example_com",
    "domain": "app.example.com",
    "backend": "webapp",
    "ssl": true,
    "ssl_redirect": true,
    "acme": true,
    "enabled": true,
    "cert_status": "valid",
    "cert_expiry": "2025-03-15"
  }]
}
```

## 后端配置

### 创建后端

```bash
ubus call luci.haproxy create_backend '{
  "name": "webapp",
  "mode": "http",
  "balance": "roundrobin"
}'
```

### 向后端添加服务器

```bash
ubus call luci.haproxy create_server '{
  "backend": "webapp",
  "name": "srv1",
  "address": "192.168.255.10",
  "port": 8080,
  "weight": 100,
  "check": 1
}'
```

### 后端模式

| 模式 | 描述 |
|------|------|
| `http` | 第 7 层 HTTP 代理 |
| `tcp` | 第 4 层 TCP 代理 |

### 负载均衡

| 算法 | 描述 |
|------|------|
| `roundrobin` | 轮询服务器 |
| `leastconn` | 最少活跃连接 |
| `source` | 按客户端 IP 粘性 |
| `uri` | 按 URI 哈希粘性 |

## SSL 证书

### ACME 自动证书

当设置 `acme: 1` 时：
1. HAProxy 在端口 80 上服务 ACME 挑战
2. Let's Encrypt 验证域名所有权
3. 证书存储在 `/srv/haproxy/certs/`
4. 到期前自动续期

### 手动证书

```bash
# 上传证书
ubus call luci.haproxy upload_certificate '{
  "domain": "app.example.com",
  "cert": "<PEM 证书>",
  "key": "<PEM 私钥>"
}'
```

### 证书状态

```bash
ubus call luci.haproxy list_certificates

# 响应：
{
  "certificates": [{
    "domain": "app.example.com",
    "status": "valid",
    "issuer": "Let's Encrypt",
    "expiry": "2025-03-15",
    "days_left": 45
  }]
}
```

### 手动请求证书

```bash
ubus call luci.haproxy request_certificate '{"domain":"app.example.com"}'
```

## 统计信息

### 获取统计

```bash
ubus call luci.haproxy get_stats

# 响应：
{
  "frontend": {
    "requests": 125000,
    "bytes_in": 1234567890,
    "bytes_out": 9876543210,
    "rate": 150
  },
  "backends": [{
    "name": "webapp",
    "status": "UP",
    "servers_up": 2,
    "servers_total": 2,
    "requests": 45000,
    "response_time_avg": 12
  }]
}
```

### 统计页面

访问 HAProxy 统计：
```
http://192.168.255.1:8404/stats
```

## 配置

### UCI 结构

```bash
# /etc/config/haproxy

config haproxy 'main'
    option enabled '1'
    option stats_port '8404'

config backend 'webapp'
    option name 'webapp'
    option mode 'http'
    option balance 'roundrobin'
    option enabled '1'

config server 'webapp_srv1'
    option backend 'webapp'
    option name 'srv1'
    option address '192.168.255.10'
    option port '8080'
    option weight '100'
    option check '1'
    option enabled '1'

config vhost 'app_example_com'
    option domain 'app.example.com'
    option backend 'webapp'
    option ssl '1'
    option ssl_redirect '1'
    option acme '1'
    option enabled '1'
```

### 生成配置

```bash
# 从 UCI 重新生成 haproxy.cfg
ubus call luci.haproxy generate

# 重新加载 HAProxy
ubus call luci.haproxy reload
```

### 验证配置

```bash
ubus call luci.haproxy validate

# 响应：
{
  "valid": true,
  "message": "配置有效"
}
```

## RPCD API

### 服务控制

| 方法 | 描述 |
|------|------|
| `status` | 获取 HAProxy 状态 |
| `start` | 启动 HAProxy 服务 |
| `stop` | 停止 HAProxy 服务 |
| `restart` | 重启 HAProxy |
| `reload` | 重新加载配置 |
| `generate` | 生成配置文件 |
| `validate` | 验证配置 |

### 虚拟主机管理

| 方法 | 描述 |
|------|------|
| `list_vhosts` | 列出所有虚拟主机 |
| `create_vhost` | 创建新虚拟主机 |
| `update_vhost` | 更新虚拟主机 |
| `delete_vhost` | 删除虚拟主机 |

### 后端管理

| 方法 | 描述 |
|------|------|
| `list_backends` | 列出所有后端 |
| `create_backend` | 创建后端 |
| `delete_backend` | 删除后端 |
| `create_server` | 向后端添加服务器 |
| `delete_server` | 移除服务器 |

### 证书

| 方法 | 描述 |
|------|------|
| `list_certificates` | 列出所有证书 |
| `request_certificate` | 请求 ACME 证书 |
| `upload_certificate` | 上传手动证书 |
| `delete_certificate` | 删除证书 |

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/haproxy` | UCI 配置 |
| `/var/lib/lxc/haproxy/` | LXC 容器根目录 |
| `/srv/haproxy/haproxy.cfg` | 生成的配置 |
| `/srv/haproxy/certs/` | SSL 证书 |
| `/srv/haproxy/acme/` | ACME 挑战 |
| `/usr/libexec/rpcd/luci.haproxy` | RPCD 后端 |
| `/usr/sbin/haproxyctl` | CLI 工具 |

## CLI 工具

### haproxyctl 命令

```bash
# 状态
haproxyctl status

# 列出虚拟主机
haproxyctl vhosts

# 添加虚拟主机
haproxyctl vhost add app.example.com --backend webapp --ssl --acme

# 删除虚拟主机
haproxyctl vhost del app.example.com

# 列出证书
haproxyctl cert list

# 请求证书
haproxyctl cert add app.example.com

# 生成配置
haproxyctl generate

# 重新加载
haproxyctl reload

# 验证
haproxyctl validate
```

## 故障排除

### HAProxy 无法启动

```bash
# 检查容器
lxc-info -n haproxy

# 启动容器
lxc-start -n haproxy

# 检查日志
lxc-attach -n haproxy -- cat /var/log/haproxy.log
```

### 503 服务不可用

1. 检查后端是否已配置：
   ```bash
   ubus call luci.haproxy list_backends
   ```
2. 验证服务器是否可达：
   ```bash
   curl http://192.168.255.10:8080
   ```
3. 检查 HAProxy 日志

### 证书不工作

1. 确保 DNS 指向您的公网 IP
2. 确保端口 80/443 可从互联网访问
3. 检查 ACME 挑战：
   ```bash
   curl http://app.example.com/.well-known/acme-challenge/test
   ```

### 配置验证失败

```bash
# 显示验证错误
lxc-attach -n haproxy -- haproxy -c -f /etc/haproxy/haproxy.cfg
```

## 安全性

### 防火墙规则

HAProxy 需要从 WAN 打开端口 80/443：

```bash
# 当虚拟主机使用 SSL 时自动创建
uci show firewall | grep HAProxy
```

### 速率限制

添加到后端配置：
```
stick-table type ip size 100k expire 30s store http_req_rate(10s)
http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }
```

## 许可证

MIT 许可证 - Copyright (C) 2025 CyberMind.fr
