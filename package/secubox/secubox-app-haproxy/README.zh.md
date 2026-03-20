[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox HAProxy App

HAProxy 反向代理，通过 ACME（Let's Encrypt）自动管理 SSL/TLS 证书。

## 功能特性

- **LXC 容器隔离** - HAProxy 在隔离容器中运行
- **自动 HTTPS** - ACME 证书颁发和续期
- **零停机证书** - Webroot 模式在颁发期间保持 HAProxy 运行
- **虚拟主机** - 多域名自动路由
- **负载均衡** - Round-robin、最少连接、源 IP
- **健康检查** - 自动后端健康监控
- **统计仪表板** - 端口 8404 上的实时统计

## 证书管理

### ACME Webroot 模式（零停机）

HAProxy 内部处理 ACME 挑战 - 无需重启：

```
互联网 -> 端口 80 -> HAProxy
                      |
                      +- /.well-known/acme-challenge/
                      |        |
                      |   acme_challenge 后端 (:8402)
                      |        |
                      |   busybox httpd 服务挑战文件
                      |
                      +- 其他路径 -> 正常后端
```

### 请求证书

```bash
# 生产证书（浏览器信任）
haproxyctl cert add example.com

# 测试证书（用于测试，不受信任）
uci set haproxy.acme.staging='1'
uci commit haproxy
haproxyctl cert add example.com
```

### ACME 前置要求

1. **DNS** - 域名必须指向您服务器的公网 IP
2. **端口 80** - 必须可从互联网访问（防火墙/NAT）
3. **邮箱** - 在 LuCI > 服务 > HAProxy > 设置 中配置

### 证书命令

```bash
haproxyctl cert list              # 列出已安装的证书
haproxyctl cert add <domain>      # 请求新证书
haproxyctl cert renew [domain]    # 续期证书
haproxyctl cert remove <domain>   # 移除证书
haproxyctl cert import <domain>   # 导入现有证书
```

## 配置

### UCI 选项

```bash
# 主要设置
uci set haproxy.main.enabled='1'
uci set haproxy.main.http_port='80'
uci set haproxy.main.https_port='443'
uci set haproxy.main.stats_port='8404'

# ACME 设置
uci set haproxy.acme.email='admin@example.com'
uci set haproxy.acme.staging='0'        # 0=生产，1=测试
uci set haproxy.acme.key_type='ec-256'  # ec-256, ec-384, rsa-2048, rsa-4096

uci commit haproxy
```

### 创建虚拟主机

```bash
# 通过 CLI
haproxyctl vhost add example.com mybackend --ssl --acme

# 通过 UCI
uci set haproxy.example=vhost
uci set haproxy.example.domain='example.com'
uci set haproxy.example.backend='mybackend'
uci set haproxy.example.ssl='1'
uci set haproxy.example.ssl_redirect='1'
uci set haproxy.example.acme='1'
uci set haproxy.example.enabled='1'
uci commit haproxy
haproxyctl generate && haproxyctl reload
```

### 创建后端

```bash
# 通过 CLI
haproxyctl backend add myapp --server 192.168.1.100:8080

# 通过 UCI
uci set haproxy.myapp=backend
uci set haproxy.myapp.name='myapp'
uci set haproxy.myapp.mode='http'
uci set haproxy.myapp.balance='roundrobin'
uci set haproxy.myapp.enabled='1'

uci set haproxy.myapp_srv1=server
uci set haproxy.myapp_srv1.backend='myapp'
uci set haproxy.myapp_srv1.address='192.168.1.100'
uci set haproxy.myapp_srv1.port='8080'
uci set haproxy.myapp_srv1.check='1'
uci commit haproxy
```

## CLI 参考

```bash
haproxyctl status          # 显示状态
haproxyctl start           # 启动 HAProxy
haproxyctl stop            # 停止 HAProxy
haproxyctl restart         # 重启 HAProxy
haproxyctl reload          # 重新加载配置
haproxyctl generate        # 重新生成配置文件
haproxyctl validate        # 验证配置

haproxyctl vhost list      # 列出虚拟主机
haproxyctl backend list    # 列出后端
haproxyctl cert list       # 列出证书
haproxyctl stats           # 显示运行时统计
```

## 故障排除

### 证书颁发失败

1. **检查 DNS 解析：**
   ```bash
   nslookup example.com
   ```

2. **验证端口 80 可访问：**
   ```bash
   # 从外部服务器
   curl -I http://example.com/.well-known/acme-challenge/test
   ```

3. **检查 HAProxy 是否运行：**
   ```bash
   haproxyctl status
   ```

4. **查看日志：**
   ```bash
   logread | grep -i acme
   logread | grep -i haproxy
   ```

### HAProxy 无法启动

1. **验证配置：**
   ```bash
   haproxyctl validate
   ```

2. **检查证书文件：**
   ```bash
   ls -la /srv/haproxy/certs/
   ```

3. **查看容器日志：**
   ```bash
   lxc-attach -n haproxy -- cat /var/log/haproxy.log
   ```

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/haproxy` | UCI 配置 |
| `/srv/haproxy/config/haproxy.cfg` | 生成的 HAProxy 配置 |
| `/srv/haproxy/certs/` | SSL 证书 |
| `/etc/acme/` | ACME 账户和证书数据 |
| `/var/www/acme-challenge/` | ACME 挑战 webroot |
| `/srv/lxc/haproxy/` | LXC 容器 rootfs |

## 许可证

MIT 许可证 - Copyright (C) 2025 CyberMind.fr
