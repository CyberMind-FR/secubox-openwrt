[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox SimpleX 聊天服务器

在 Alpine LXC 容器中运行的隐私优先消息中继服务器。提供 SMP（SimpleX 消息协议）和 XFTP（文件传输）服务，支持端到端加密和后量子密码学。

## 安装

```bash
opkg install secubox-app-simplex
```

## 配置

UCI 配置文件：`/etc/config/simplex`

```bash
uci set simplex.main.enabled='1'
uci set simplex.main.smp_port='5223'
uci set simplex.main.xftp_port='443'
uci set simplex.main.domain='chat.example.com'
uci commit simplex
```

## 使用方法

```bash
simplexctl start       # 启动 SimpleX 服务器（LXC）
simplexctl stop        # 停止 SimpleX 服务器
simplexctl status      # 显示服务状态
simplexctl logs        # 查看服务器日志
simplexctl address     # 显示客户端服务器地址
simplexctl update      # 更新 SimpleX 二进制文件
```

## HAProxy 集成

在 `/usr/lib/secubox/haproxy.d/simplex.cfg` 提供了即插即用的 HAProxy 配置，用于 TLS 终止和通过 SecuBox HAProxy 实例进行路由。

## 功能特性

- SimpleX Chat 消息的 SMP 中继
- 加密文件传输的 XFTP 中继
- 使用后量子算法的端到端加密
- 无用户标识符或元数据收集
- Alpine LXC 容器隔离

## 依赖

- `lxc`
- `lxc-common`
- `wget`
- `openssl-util`
- `tar`

## 许可证

Apache-2.0
