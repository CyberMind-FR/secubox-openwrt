[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Tor Shield

OpenWrt 的 Tor 集成，提供透明代理、SOCKS 代理、Tor DNS、终止开关、隐藏服务和网桥支持。

## 安装

```bash
opkg install secubox-app-tor
```

## 配置

UCI 配置文件：`/etc/config/tor-shield`

```bash
uci set tor-shield.main.enabled='1'
uci set tor-shield.main.mode='transparent'
uci set tor-shield.main.dns_over_tor='1'
uci set tor-shield.main.kill_switch='0'
uci commit tor-shield
```

## 使用方法

```bash
torctl start           # 启动 Tor 服务
torctl stop            # 停止 Tor 服务
torctl status          # 显示 Tor 状态和线路
torctl newnym          # 请求新的 Tor 身份
torctl bridges         # 管理网桥中继
torctl hidden add      # 创建隐藏服务
torctl hidden list     # 列出隐藏服务
torctl killswitch on   # 启用终止开关（阻止非 Tor 流量）
torctl killswitch off  # 禁用终止开关
```

## 模式

- **透明代理** -- 所有 LAN 流量通过 iptables 路由到 Tor
- **SOCKS 代理** -- 用于单个应用使用 Tor 的 SOCKS5 端点
- **Tor DNS** -- DNS 查询通过 Tor 网络解析
- **终止开关** -- 当 Tor 断开时阻止所有非 Tor 流量

## 排除的域名（系统服务绕过）

当 Tor Shield 激活时，某些系统服务（opkg、NTP、ACME）需要直接访问互联网。这些域名绕过 Tor DNS 和路由：

- OpenWrt 软件包仓库（`downloads.openwrt.org`、镜像站）
- NTP 时间服务器（`pool.ntp.org`、`time.google.com`）
- Let's Encrypt ACME（`acme-v02.api.letsencrypt.org`）
- DNS 提供商 API（Gandi、OVH、Cloudflare）

在 UCI 中配置额外的排除项：

```bash
uci add_list tor-shield.trans.excluded_domains='my.example.com'
uci commit tor-shield
/etc/init.d/tor-shield restart
```

排除项在两个层级实现：
1. **dnsmasq 绕过** -- 排除域名的 DNS 查询直接发送到上游
2. **iptables RETURN** -- 到已解析 IP 的流量绕过 Tor 透明代理

## 依赖

- `iptables`
- `curl`
- `jsonfilter`
- `socat`

## 许可证

Apache-2.0
