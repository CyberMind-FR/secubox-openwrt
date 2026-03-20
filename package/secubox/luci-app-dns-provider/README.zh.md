# luci-app-dns-provider

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

SecuBox DNS 提供商管理器的 LuCI Web 界面。

## 概述

提供 Web 界面，通过提供商 API（OVH、Gandi、Cloudflare）管理 DNS 记录。包含两个视图：记录管理和设置配置。

## 视图

### 记录 (`dns-provider/records`)
- 状态栏：提供商、区域、启用状态
- 操作按钮：添加记录、同步 HAProxy Vhosts、ACME DNS-01、刷新
- 区域记录显示（原始提供商 API 输出）
- 添加记录模态框：类型、子域名、目标、TTL
- DNS 传播检查器（1.1.1.1、8.8.8.8、9.9.9.9）

### 设置 (`dns-provider/settings`)
- 常规：启用、提供商选择、区域
- OVH：endpoint、app_key、app_secret、consumer_key
- Gandi：API 密钥 / PAT
- Cloudflare：API 令牌、zone_id
- 测试凭据按钮

## RPCD 方法

| 方法 | 参数 | 描述 |
|---|---|---|
| `get_config` | — | 获取配置（密钥已脱敏） |
| `list_records` | — | 从提供商获取区域记录 |
| `add_record` | type, subdomain, target, ttl | 创建 DNS 记录 |
| `remove_record` | type, subdomain | 删除 DNS 记录 |
| `sync_records` | — | 将 HAProxy vhosts 同步到 DNS |
| `verify_record` | fqdn | 检查传播状态 |
| `test_credentials` | — | 验证 API 凭据 |
| `acme_dns01` | domain | 通过 DNS-01 签发证书 |

## 文件

```
root/usr/libexec/rpcd/luci.dns-provider              RPCD 处理程序
root/usr/share/luci/menu.d/luci-app-dns-provider.json 菜单入口
root/usr/share/rpcd/acl.d/luci-app-dns-provider.json  ACL 权限
htdocs/.../view/dns-provider/records.js               记录视图
htdocs/.../view/dns-provider/settings.js              设置视图
```

## 依赖

- `luci-base`
- `secubox-app-dns-provider`
