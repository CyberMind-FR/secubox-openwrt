# SecuBox DNS Guard

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

注重隐私的 DNS 管理器，提供精选的 DNS 提供商列表，支持 DoH/DoT。

## 安装

```bash
opkg install luci-app-dnsguard
```

## 访问

LuCI 菜单：**SecuBox -> Security -> DNS Guard**

## 功能

- 精选的注重隐私的 DNS 提供商列表（FDN、Quad9、Mullvad、Cloudflare、AdGuard 等）
- 一键切换提供商，自动配置 dnsmasq
- 支持 DNS-over-HTTPS (DoH) 和 DNS-over-TLS (DoT)
- 基于类别的智能配置建议（隐私、安全、广告拦截、家庭）
- 内置 DNS 解析测试器

## RPCD 方法

后端：`luci.dnsguard`

| 方法 | 描述 |
|--------|-------------|
| `status` | 当前 DNS 模式、活动提供商和主/备服务器 |
| `get_providers` | 列出所有可用的 DNS 提供商 |
| `get_config` | 获取 dnsmasq 和 AdGuard Home 配置 |
| `set_provider` | 切换到指定的 DNS 提供商 |
| `smart_config` | 获取智能配置建议 |
| `test_dns` | 对服务器进行 DNS 解析测试 |
| `apply` | 应用待处理的 DNS 更改 |

## 依赖

- `luci-base`

## 许可证

Apache-2.0
