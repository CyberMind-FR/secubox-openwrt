[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox 服务注册中心

统一服务聚合仪表板，支持自动发布到 HAProxy（明网）和 Tor（隐藏服务），包括健康监控和二维码生成。

## 功能特性

- **服务发现** - 自动检测运行中的服务，来源包括：
  - HAProxy 虚拟主机
  - Tor 隐藏服务
  - 直接监听端口（netstat）
  - LXC 容器
- **一键发布** - 将服务发布到明网和/或 Tor
- **健康监控** - 实时 DNS、证书和防火墙状态
- **URL 就绪检查器** - 上线前验证域名配置
- **二维码** - 生成二维码便于移动端访问
- **落地页** - 自动生成包含所有已发布服务的静态 HTML

## 仪表板

### 网络连接面板

实时网络状态显示：
- **公网 IPv4** - 您的外部 IP 地址及反向 DNS 主机名
- **公网 IPv6** - IPv6 地址（如可用）
- **外部端口 80/443** - 端口是否可从互联网访问（测试上游路由器/ISP 转发）
- **本地防火墙** - OpenWrt 防火墙规则状态
- **HAProxy** - 反向代理容器状态

### 健康摘要栏

一览系统总体状态：
- 防火墙端口 80/443 状态
- HAProxy 容器状态
- Tor 守护进程状态
- DNS 解析计数
- 证书健康计数

### URL 就绪检查器

在发布服务之前，验证域名配置是否正确：

1. 在检查器中输入域名（例如 `example.com`）
2. 点击"检查"以验证：
   - **您的公网 IP** - 显示您的 IPv4/IPv6 地址和反向 DNS
   - **DNS 解析** - 验证域名是否解析到您的公网 IP（检测私有 IP 配置错误）
   - **互联网可访问性** - 测试端口 80/443 是否可从互联网访问（上游路由器检查）
   - **本地防火墙** - OpenWrt 防火墙规则状态
   - **SSL 证书** - 有效证书及到期状态
   - **HAProxy** - 反向代理容器运行中

检查器提供具体可操作的建议：
- 如果 DNS 指向私有 IP（例如 192.168.x.x），显示要使用的正确公网 IP
- 如果端口被外部阻止，建议检查上游路由器端口转发
- 显示要创建的确切 DNS A 记录：`domain.com → your.public.ip`

### 服务健康指示器

每个已发布服务显示内联健康徽章：

| 徽章 | 含义 |
|------|------|
| 地球 | DNS 正确解析 |
| X | DNS 解析失败 |
| 锁 | 证书有效（30+ 天）|
| 警告 | 证书即将到期（7-30 天）|
| 红色 | 证书紧急（<7 天）|
| 骷髅 | 证书已过期 |
| 白色 | 未配置证书 |
| 洋葱 | Tor 隐藏服务已启用 |

## 发布服务

### 快速发布（LuCI）

1. 转到 **服务 > 服务注册中心**
2. 在"已发现服务"中找到您的服务
3. 点击发布进行快速发布
4. 可选添加：
   - 域名（创建 HAProxy 虚拟主机 + 请求 ACME 证书）
   - Tor 隐藏服务

### CLI 发布

```bash
# 列出已发现的服务
secubox-registry list

# 使用域名发布（明网）
secubox-registry publish myapp 8080 --domain app.example.com

# 使用 Tor 隐藏服务发布
secubox-registry publish myapp 8080 --tor

# 同时使用两者
secubox-registry publish myapp 8080 --domain app.example.com --tor

# 取消发布
secubox-registry unpublish myapp
```

### 发布时发生的事情

当您使用域名发布服务时：

1. **创建后端** - HAProxy 后端指向本地端口
2. **创建虚拟主机** - 域名的 HAProxy 虚拟主机
3. **打开防火墙** - 从 WAN 打开端口 80/443（自动）
4. **请求证书** - 通过 Let's Encrypt 获取 ACME 证书
5. **更新落地页** - 重新生成静态 HTML

## 健康检查 API

### 获取网络信息

```bash
ubus call luci.service-registry get_network_info
```

响应：
```json
{
  "success": true,
  "lan_ip": "192.168.255.1",
  "ipv4": {
    "address": "185.220.101.12",
    "status": "ok",
    "hostname": "server.example.com"
  },
  "ipv6": {
    "address": "2001:db8::1",
    "status": "ok"
  },
  "external_ports": {
    "http": { "accessible": true, "status": "open" },
    "https": { "accessible": true, "status": "open" }
  },
  "firewall": {
    "status": "ok",
    "http_open": true,
    "https_open": true
  },
  "haproxy": { "status": "running" }
}
```

### 检查单个域名

```bash
ubus call luci.service-registry check_service_health '{"domain":"example.com"}'
```

响应：
```json
{
  "success": true,
  "domain": "example.com",
  "public_ip": {
    "ipv4": "185.220.101.12",
    "ipv6": "2001:db8::1",
    "hostname": "server.example.com"
  },
  "dns": {
    "status": "ok",
    "resolved_ip": "185.220.101.12"
  },
  "external_access": {
    "status": "ok",
    "http_accessible": true,
    "https_accessible": true
  },
  "firewall": {
    "status": "ok",
    "http_open": true,
    "https_open": true
  },
  "certificate": {
    "status": "ok",
    "days_left": 45
  },
  "haproxy": {
    "status": "running"
  }
}
```

DNS 状态值：
- `ok` - 域名解析到您的公网 IP
- `private` - 域名解析到私有 IP（192.168.x.x、10.x.x.x 等）
- `mismatch` - 域名解析到不同的公网 IP
- `failed` - DNS 解析失败

### 检查所有服务

```bash
ubus call luci.service-registry check_all_health
```

响应包含所有已发布域名的聚合健康状态。

## 故障排除

### DNS 不解析

1. 验证 DNS A 记录指向您的公网 IP
2. 检查：`nslookup example.com`
3. DNS 传播可能需要长达 48 小时

### 防火墙端口关闭

1. 检查防火墙规则：`uci show firewall | grep HAProxy`
2. 端口应在发布时自动打开
3. 手动修复：
   ```bash
   uci add firewall rule
   uci set firewall.@rule[-1].name='HAProxy-HTTP'
   uci set firewall.@rule[-1].src='wan'
   uci set firewall.@rule[-1].dest_port='80'
   uci set firewall.@rule[-1].proto='tcp'
   uci set firewall.@rule[-1].target='ACCEPT'
   uci commit firewall
   /etc/init.d/firewall reload
   ```

### 证书缺失

1. 确保域名 DNS 配置正确
2. 确保端口 80 可从互联网访问
3. 通过 HAProxy 请求证书：
   ```bash
   haproxyctl cert add example.com
   ```

### 503 服务不可用

常见原因：
1. **后端未运行** - 检查服务是否实际在监听
2. **错误的后端端口** - 验证 HAProxy 后端配置
3. **HAProxy 未运行** - 检查容器状态

```bash
# 检查服务是否在监听
netstat -tln | grep :8080

# 检查 HAProxy 状态
haproxyctl status

# 检查 HAProxy 配置
haproxyctl validate
```

## 配置

### UCI 设置

```bash
# 主要设置
uci set service-registry.main.enabled='1'
uci set service-registry.main.auto_tor='0'        # 发布时自动创建 Tor
uci set service-registry.main.auto_haproxy='0'    # 发布时自动创建 HAProxy
uci set service-registry.main.landing_auto_regen='1'

# 提供商开关
uci set service-registry.haproxy.enabled='1'
uci set service-registry.tor.enabled='1'
uci set service-registry.direct.enabled='1'
uci set service-registry.lxc.enabled='1'

uci commit service-registry
```

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/service-registry` | UCI 配置 |
| `/www/secubox-services.html` | 生成的落地页 |
| `/usr/sbin/secubox-registry` | CLI 工具 |
| `/usr/sbin/secubox-landing-gen` | 落地页生成器 |
| `/usr/libexec/rpcd/luci.service-registry` | RPCD 后端 |

## RPCD 方法

| 方法 | 描述 |
|------|------|
| `list_services` | 列出所有提供商的所有服务 |
| `publish_service` | 将服务发布到 HAProxy/Tor |
| `unpublish_service` | 从 HAProxy/Tor 移除服务 |
| `check_service_health` | 检查域名的 DNS/证书/防火墙/外部访问 |
| `check_all_health` | 批量健康检查所有服务 |
| `get_network_info` | 获取公网 IP、外部端口可访问性、防火墙状态 |
| `generate_landing_page` | 重新生成静态落地页 |

## 许可证

MIT 许可证 - 版权所有 (C) 2025 CyberMind.fr
