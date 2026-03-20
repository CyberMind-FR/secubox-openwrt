[English](README.md) | [Francais](README.fr.md) | 中文

# secubox-app-dns-provider

通过提供商 REST API 进行程序化 DNS 记录管理。SecuBox 生态系统的一部分。

## 概述

通过 OVH、Gandi 和 Cloudflare API 管理 DNS 区域。提供 CLI 工具（`dnsctl`）用于记录的增删改查、HAProxy vhost 同步、DNS 传播验证和 ACME DNS-01 证书签发。

## 架构

```
dnsctl (CLI)
  |-- load_provider() -> 加载 /usr/lib/secubox/dns/{provider}.sh
  |-- cmd_list/add/rm -> 委托给 dns_list/dns_add/dns_rm
  |-- cmd_sync -> 遍历 HAProxy UCI vhosts -> 每个域名执行 dns_add
  |-- cmd_verify -> 在 1.1.1.1, 8.8.8.8, 9.9.9.9 上 nslookup
  +-- cmd_acme_dns01 -> 导出提供商环境变量 -> acme.sh --dns
```

## 提供商适配器

`/usr/lib/secubox/dns/` 中的每个适配器实现：

| 函数 | 描述 |
|---|---|
| `dns_list(zone)` | 列出区域中的所有记录 |
| `dns_add(zone, type, subdomain, target, ttl)` | 创建记录 |
| `dns_rm(zone, type, subdomain)` | 删除记录 |
| `dns_verify(fqdn)` | 检查解析 |
| `dns_test_credentials()` | 验证 API 密钥 |

### 支持的提供商

- **OVH** -- HMAC-SHA1 签名的 API v1（app_key + app_secret + consumer_key）
- **Gandi** -- 使用 Bearer token 的 LiveDNS v5
- **Cloudflare** -- 使用 Bearer token + zone_id 的 API v4

## UCI 配置

```
/etc/config/dns-provider
  config dns_provider 'main'     -> enabled, provider, zone
  config ovh 'ovh'               -> endpoint, app_key, app_secret, consumer_key
  config gandi 'gandi'           -> api_key
  config cloudflare 'cloudflare' -> api_token, zone_id
```

## CLI 使用方法

### 基本操作

```bash
dnsctl status                          # 显示配置状态
dnsctl test                            # 验证 API 凭证
dnsctl list                            # 列出区域记录
dnsctl add A myservice 1.2.3.4        # 创建 A 记录
dnsctl add CNAME www mycdn.net        # 创建 CNAME
dnsctl update A myservice 5.6.7.8     # 更新现有记录
dnsctl get A www                       # 获取记录值
dnsctl rm A myservice                  # 删除记录
dnsctl domains                         # 列出账户中的所有域名
```

### HAProxy 同步

```bash
dnsctl sync                            # 将 HAProxy vhosts 同步到 DNS A 记录
dnsctl verify myservice.example.com    # 检查传播（1.1.1.1, 8.8.8.8, 9.9.9.9）
```

### 子域名生成器

```bash
dnsctl generate gitea                  # 使用公网 IP 自动创建 gitea.zone
dnsctl generate api prod               # 创建 prod-api.zone
dnsctl suggest web                     # 显示子域名建议
dnsctl suggest mail                    # 建议：mail, smtp, imap, webmail, mx
dnsctl suggest dev                     # 建议：git, dev, staging, test, ci
```

### 动态 DNS

```bash
dnsctl dyndns                          # 使用 WAN IP 更新根 A 记录
dnsctl dyndns api 300                  # 更新 api.zone，TTL 为 5 分钟
```

### 邮件 DNS 设置

```bash
dnsctl mail-setup                      # 创建 MX、SPF、DMARC 记录
dnsctl mail-setup mail 10              # 自定义主机名和优先级
dnsctl dkim-add mail '<public-key>'    # 添加 DKIM TXT 记录
```

### SSL 证书

```bash
dnsctl acme-dns01 example.com          # 通过 DNS-01 挑战签发证书
dnsctl acme-dns01 '*.example.com'      # 通过 DNS-01 签发通配符证书
```

## 依赖

- `curl` -- 用于 API 调用的 HTTP 客户端
- `openssl-util` -- HMAC-SHA1 签名（OVH）
- `jsonfilter` -- JSON 解析（OpenWrt 原生）
- `acme.sh` -- 证书签发（可选，用于 DNS-01）

## 文件

```
/etc/config/dns-provider               UCI 配置
/usr/sbin/dnsctl                       CLI 控制器
/usr/lib/secubox/dns/ovh.sh            OVH 适配器
/usr/lib/secubox/dns/gandi.sh          Gandi 适配器
/usr/lib/secubox/dns/cloudflare.sh     Cloudflare 适配器
```
