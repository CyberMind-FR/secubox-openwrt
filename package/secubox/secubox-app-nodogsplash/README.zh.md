# NodogSplash - Captive Portal

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

适用于 OpenWrt 的轻量级强制门户解决方案。提供可自定义的欢迎页面，支持点击通过或基于凭证的认证，用于访客网络访问控制。

## 安装

```bash
opkg install secubox-app-nodogsplash
```

## 配置

主配置文件：`/etc/nodogsplash/nodogsplash.conf`

关键选项：
```
GatewayInterface br-lan
GatewayAddress 192.168.1.1
MaxClients 250
SessionTimeout 1440
```

## 二进制文件

| 二进制文件 | 描述 |
|-----------|------|
| `/usr/bin/nodogsplash` | 强制门户守护进程 |
| `/usr/bin/ndsctl` | 运行时控制工具 |

## 使用方法

```bash
# 服务管理
/etc/init.d/nodogsplash start
/etc/init.d/nodogsplash stop

# 运行时控制
ndsctl status          # 显示门户状态
ndsctl clients         # 列出已连接的客户端
ndsctl auth <mac>      # 授权客户端
ndsctl deauth <mac>    # 取消客户端授权
```

## 自定义

欢迎页面模板位于 `/etc/nodogsplash/htdocs/`。编辑 `splash.html` 以自定义门户外观。

## 依赖

- `libmicrohttpd`
- `libjson-c`
- `iptables-nft`

## 许可证

GPL-2.0
