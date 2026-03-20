# SecuBox Dashboard Web Application

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

SecuBox 设备的原生 Web 仪表板应用程序。提供实时监控、服务管理以及使用 rpcd/ubus 认证的 CrowdSec 安全集成。

## 安装

```bash
opkg install secubox-app-webapp
```

## 配置

UCI 配置文件：`/etc/config/secubox-webapp`

```bash
uci set secubox-webapp.main.enabled='1'
uci set secubox-webapp.main.port='80'
uci commit secubox-webapp
```

## 初始设置

安装后运行初始设置：

```bash
/usr/sbin/secubox-webapp-setup
```

## Web 界面

访问仪表板：`http://<router-ip>/secubox/index.html`。认证通过原生 rpcd/ubus 会话系统处理（与 LuCI 使用相同的凭据）。

## 功能特性

- 实时系统监控（CPU、内存、网络）
- 服务状态和管理
- CrowdSec 威胁仪表板集成
- 原生 rpcd/ubus 认证（无需独立用户数据库）

## 依赖项

- `uhttpd`
- `uhttpd-mod-ubus`
- `rpcd`
- `rpcd-mod-file`

## 许可证

Apache-2.0
