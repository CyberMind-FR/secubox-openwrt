[English](README.md) | [Francais](README.fr.md) | 中文

# LuCI SecuBox 服务暴露管理器

统一界面，用于通过 Tor 隐藏服务和 HAProxy SSL 反向代理暴露本地服务，支持端口冲突检测。

## 安装

```bash
opkg install luci-app-exposure
```

## 访问

LuCI 菜单：**SecuBox -> 网络 -> 服务暴露**

## 标签页

- **概览** -- 扫描监听服务，检测端口冲突
- **服务** -- 管理暴露的服务端口
- **Tor Hidden** -- 创建和管理 .onion 隐藏服务
- **SSL 代理** -- 配置 HAProxy SSL 反向代理条目

## RPCD 方法

后端：`luci.exposure`

| 方法 | 描述 |
|------|------|
| `scan` | 扫描所有监听服务和端口 |
| `conflicts` | 检测服务间的端口冲突 |
| `status` | 获取暴露管理器状态 |
| `tor_list` | 列出 Tor 隐藏服务 |
| `ssl_list` | 列出 SSL 反向代理条目 |
| `get_config` | 获取暴露配置 |
| `fix_port` | 重新分配冲突的服务端口 |
| `tor_add` | 添加 Tor 隐藏服务 |
| `tor_remove` | 移除 Tor 隐藏服务 |
| `ssl_add` | 添加 SSL 反向代理条目 |
| `ssl_remove` | 移除 SSL 反向代理条目 |

## 依赖项

- `luci-base`
- `secubox-app-exposure`

## 许可证

Apache-2.0
