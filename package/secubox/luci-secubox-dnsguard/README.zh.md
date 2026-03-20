[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox DNS Guard

用于注重隐私的 DNS 管理的备用 LuCI 软件包 -- 与 `luci-app-dnsguard` 功能相同，集成在 SecuBox 安全菜单下。

## 安装

```bash
opkg install luci-secubox-dnsguard
```

## 访问

LuCI > SecuBox > 安全 > DNS Guard

## 功能特性

- DNS 过滤和广告拦截配置
- 上游 DNS 提供商选择
- 查询日志和统计仪表板
- 黑名单管理

## RPCD 方法

服务：`luci.dnsguard`

## 依赖项

- `luci-base`

## 许可证

Apache-2.0
