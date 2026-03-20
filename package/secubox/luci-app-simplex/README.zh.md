# LuCI SimpleX Chat 服务器

[English](README.md) | [Francais](README.fr.md) | 中文

用于管理自托管 SimpleX Chat 中继的 LuCI Web 界面 -- 隐私优先的消息传递，配备 SMP 和 XFTP 服务器。

## 安装

```bash
opkg install luci-app-simplex
```

## 访问

LuCI > 服务 > SimpleX Chat

## 功能

- SMP（SimpleX Messaging Protocol）服务器管理
- XFTP 文件传输服务器管理
- 服务器地址和指纹显示
- 服务启动/停止/重启控制
- 连接状态监控

## RPCD 方法

服务：`luci.simplex`

## 依赖

- `secubox-app-simplex`

## 许可证

Apache-2.0
