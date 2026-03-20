# SecuBox Authentication Failure Logger for CrowdSec

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

记录来自 LuCI/rpcd 和 Dropbear SSH 的认证失败，用于 CrowdSec 检测。

## 安装

```sh
opkg install secubox-app-auth-logger
```

## 使用

```sh
# 启用并启动服务
/etc/init.d/secubox-app-auth-logger enable
/etc/init.d/secubox-app-auth-logger start
```

认证监控器作为后台守护进程运行，监视登录失败。

## 提供的内容

- SSH 失败监控（OpenSSH/Dropbear）
- 通过 CGI hook 记录 LuCI Web 界面认证失败
- CrowdSec 解析器和暴力破解场景
- CrowdSec 采集配置

## 文件

- `/etc/init.d/secubox-app-auth-logger` -- init 脚本
- `/usr/lib/secubox/auth-monitor.sh` -- 认证失败监控守护进程

## 依赖

- `rpcd`
- `uhttpd`

## 许可证

Apache-2.0
