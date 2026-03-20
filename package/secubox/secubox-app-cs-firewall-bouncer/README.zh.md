# SecuBox CrowdSec Firewall Bouncer

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

CrowdSec 防火墙 bouncer，为 OpenWrt 提供原生 nftables 集成，支持 IPv4 和 IPv6。Go 二进制文件，版本 0.0.31。

## 安装

```sh
opkg install secubox-app-cs-firewall-bouncer
```

## 配置

UCI 配置文件：`/etc/config/crowdsec`

Bouncer 向本地 CrowdSec LAPI 注册，并管理 nftables 集合以阻止恶意 IP。

## 使用方法

```sh
# 启动 / 停止服务
/etc/init.d/crowdsec-firewall-bouncer start
/etc/init.d/crowdsec-firewall-bouncer stop

# 检查 bouncer 状态
cs-firewall-bouncer -version
```

## 文件

- `/etc/config/crowdsec` -- UCI 配置
- `/etc/init.d/crowdsec-firewall-bouncer` -- 初始化脚本
- `/usr/sbin/cs-firewall-bouncer` -- Go 二进制文件

## 编译说明

这是一个带有 CGO 的 Go 包。必须使用完整的 OpenWrt 工具链编译，而不是 SDK：

```sh
cd secubox-tools/openwrt
make package/secubox-app-cs-firewall-bouncer/compile V=s
```

## 依赖

- `nftables`

## 许可证

MIT
