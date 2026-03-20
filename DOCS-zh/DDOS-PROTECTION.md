# SecuBox DDoS 防护指南

> **Languages:** [English](../DOCS/DDOS-PROTECTION.md) | [Francais](../DOCS-fr/DDOS-PROTECTION.md) | 中文

SecuBox 提供**多层 DDoS 防护**，适用于家庭、SOHO 和中小企业部署。本文档描述了防护机制和配置选项。

## 防护层概览

| 层级 | 组件 | 缓解的攻击类型 |
|------|------|----------------|
| **L3** | OpenWrt 防火墙 | SYN 洪水、ICMP 洪水、IP 欺骗 |
| **L4** | nftables/iptables | 连接洪水、端口扫描 |
| **L4** | CrowdSec | 分布式攻击检测 |
| **L7** | HAProxy | HTTP 洪水、slowloris、请求轰炸 |
| **L7** | mitmproxy WAF | 应用层洪水、机器人攻击 |
| **DNS** | Vortex 防火墙 | 僵尸网络 C2、DNS 放大 |
| **情报** | CrowdSec CAPI | 共享威胁情报 (50k+ 节点) |

## 第3/4层防护

### SYN 洪水防护

OpenWrt 防火墙包含 SYN cookies 和 SYN 洪水防护：

```bash
# 检查当前状态
cat /proc/sys/net/ipv4/tcp_syncookies

# 通过 UCI 启用
uci set firewall.@defaults[0].synflood_protect='1'
uci commit firewall
/etc/init.d/firewall restart
```

### 连接跟踪限制

为高流量场景增加 conntrack 表大小：

```bash
# 检查当前限制
cat /proc/sys/net/netfilter/nf_conntrack_max
cat /proc/sys/net/netfilter/nf_conntrack_count

# 增加限制 (添加到 /etc/sysctl.conf)
echo "net.netfilter.nf_conntrack_max=131072" >> /etc/sysctl.conf
sysctl -p
```

### 反欺骗 (反向路径过滤)

```bash
# 启用 RP 过滤
echo 1 > /proc/sys/net/ipv4/conf/all/rp_filter

# 在 /etc/sysctl.conf 中持久化
echo "net.ipv4.conf.all.rp_filter=1" >> /etc/sysctl.conf
```

### ICMP 速率限制

```bash
# 限制 ICMP 响应 (防止 ping 洪水放大)
echo 1000 > /proc/sys/net/ipv4/icmp_ratelimit
echo 50 > /proc/sys/net/ipv4/icmp_msgs_per_sec
```

### 丢弃无效数据包

```bash
uci set firewall.@defaults[0].drop_invalid='1'
uci commit firewall
/etc/init.d/firewall restart
```

## CrowdSec 防护

CrowdSec 提供基于行为的检测和协作威胁情报。

### 安装 DDoS 集合

```bash
# HTTP 洪水检测
cscli collections install crowdsecurity/http-dos

# 基础 HTTP 攻击检测
cscli collections install crowdsecurity/base-http-scenarios

# Nginx/HAProxy 专用
cscli collections install crowdsecurity/nginx
cscli collections install crowdsecurity/haproxy

# 重启以应用
/etc/init.d/crowdsec restart
```

### DDoS CrowdSec 场景

| 场景 | 描述 | 封禁时长 |
|------|------|----------|
| `crowdsecurity/http-dos-swithcing-ua` | 快速切换 user-agent | 4h |
| `crowdsecurity/http-generic-bf` | 通用 HTTP 暴力破解 | 4h |
| `crowdsecurity/http-slow-bf` | Slowloris 风格攻击 | 4h |
| `crowdsecurity/http-crawl-non_statics` | 激进爬取 | 4h |

### 查看活动防护

```bash
# 列出已安装的场景
cscli scenarios list

# 查看活动决策 (封禁)
cscli decisions list

# 查看实时指标
cscli metrics
```

## HAProxy 速率限制

HAProxy 为发布的服务提供连接和请求速率限制。

### 全局连接限制

添加到 `/etc/haproxy/haproxy.cfg`：

```haproxy
global
    maxconn 4096

defaults
    maxconn 2000
    timeout connect 5s
    timeout client 30s
    timeout server 30s
```

### 每后端速率限制

```haproxy
frontend https_in
    bind *:443 ssl crt /etc/haproxy/certs/

    # 速率限制: 每 IP 10 秒内 100 个请求
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }

    # 减慢激进客户端
    http-request tarpit if { sc_http_req_rate(0) gt 50 }
```

### 连接队列 (吸收峰值)

```haproxy
backend myapp
    server app1 192.168.255.1:8080 maxconn 100 maxqueue 500
```

## mitmproxy L7 WAF

mitmproxy 检查 HTTP/HTTPS 流量并检测应用层攻击。

### 洪水检测

`secubox_analytics.py` 插件检测：
- 每 IP 的请求速率峰值
- 异常请求模式
- 机器人签名
- 自动扫描工具

### 启用 WAF

```bash
# 启动 mitmproxy 容器
/etc/init.d/mitmproxy start

# 检查状态
mitmproxyctl status
```

### 查看检测到的威胁

```bash
# 最近的威胁
tail -f /srv/mitmproxy/threats.log

# 威胁统计
mitmproxyctl stats
```

## Vortex DNS 防火墙

Vortex 在 DNS 层面阻止已知的僵尸网络 C2 域名和恶意软件分发站点。

### 启用防护

```bash
# 更新威胁情报源
vortex-firewall intel update

# 启动防护
vortex-firewall start

# 检查统计
vortex-firewall stats
```

### 阻止的类别

- 恶意软件分发域名
- 僵尸网络 C2 服务器 (Mirai, Gafgyt 等)
- 钓鱼域名
- 加密矿池

## InterceptoR 内网 WAF

InterceptoR 内网 WAF 检测来自被入侵 LAN 设备的 DDoS 参与：

- **C2 信标检测** - 识别与 C2 通信的感染设备
- **DNS 隧道** - 检测通过 DNS 的数据外泄
- **IoT 僵尸网络模式** - Mirai、Gafgyt、Mozi 签名
- **加密矿工活动** - 矿池连接

### 检查内部威胁

```bash
# 查看 InterceptoR 状态
ubus call luci.interceptor status

# 在日志中检查内部威胁
grep "insider" /srv/mitmproxy/threats.log
```

## Config Advisor DDoS 配置文件

运行 DDoS 特定的合规检查：

```bash
# 运行所有检查包括 DDoS
config-advisorctl check

# 仅运行 DDoS 检查
config-advisorctl check --category ddos

# 自动修复 DDoS 问题
config-advisorctl remediate --category ddos
```

### DDoS 检查规则

| 规则 ID | 检查项 | 严重性 |
|---------|--------|--------|
| DDOS-001 | SYN cookies 已启用 | 高 |
| DDOS-002 | 连接跟踪限制 | 中 |
| DDOS-003 | CrowdSec http-dos 已安装 | 高 |
| DDOS-004 | ICMP 速率限制 | 中 |
| DDOS-005 | 反向路径过滤 | 高 |
| DDOS-006 | HAProxy 连接限制 | 中 |
| DDOS-007 | mitmproxy WAF 活动 | 中 |
| DDOS-008 | Vortex DNS 防火墙 | 中 |

## 限制

SecuBox 设计用于家庭/中小企业规模。它**不能**：

- 吸收超过您 WAN 带宽的容量攻击
- 提供 Anycast/CDN 分发
- 充当清洗服务

### 严重 DDoS 防护

考虑添加上游防护：

1. **Cloudflare** - 免费层包含基本 DDoS 防护
2. **Cloudflare Spectrum** - 非 HTTP 服务的 TCP/UDP 代理
3. **AWS Shield** - 如果在 AWS 上托管
4. **OVH Anti-DDoS** - 如果使用 OVH 托管

### 混合设置

```
互联网 → Cloudflare (L3/L4/L7 清洗) → SecuBox (L7 WAF + 内部检测)
```

## 快速加固清单

```bash
# 1. 启用防火墙保护
uci set firewall.@defaults[0].synflood_protect='1'
uci set firewall.@defaults[0].drop_invalid='1'
uci commit firewall

# 2. 安装 CrowdSec DDoS 集合
cscli collections install crowdsecurity/http-dos

# 3. 启用内核保护
cat >> /etc/sysctl.conf << 'EOF'
net.ipv4.tcp_syncookies=1
net.ipv4.conf.all.rp_filter=1
net.ipv4.icmp_ratelimit=1000
net.netfilter.nf_conntrack_max=131072
EOF
sysctl -p

# 4. 启动 Vortex DNS 防火墙
vortex-firewall intel update
vortex-firewall start

# 5. 使用 Config Advisor 验证
config-advisorctl check --category ddos
```

## 攻击期间的监控

```bash
# 实时连接计数
watch -n 1 'cat /proc/sys/net/netfilter/nf_conntrack_count'

# CrowdSec 活动
watch -n 5 'cscli metrics'

# 活动封禁
cscli decisions list

# HAProxy 统计 (如果启用)
echo "show stat" | socat stdio /var/run/haproxy.sock

# mitmproxy 威胁
tail -f /srv/mitmproxy/threats.log
```

## 相关文档

- [InterceptoR 概览](../package/secubox/luci-app-interceptor/README.md)
- [CrowdSec 仪表板](../package/secubox/luci-app-crowdsec-dashboard/README.md)
- [Vortex DNS 防火墙](../package/secubox/VORTEX-DNS-FIREWALL.md)
- [Config Advisor](../package/secubox/secubox-config-advisor/README.md)
