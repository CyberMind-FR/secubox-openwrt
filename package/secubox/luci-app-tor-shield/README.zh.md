[English](README.md) | [Francais](README.fr.md) | 中文

# Tor Shield - 简化的匿名路由

通过 Tor 网络实现全网隐私保护，一键激活。

## 功能特性

### 保护模式

| 模式 | 描述 | 使用场景 |
|------|------|----------|
| **透明代理** | 所有网络流量自动通过 Tor 路由 | 完全网络匿名 |
| **SOCKS 代理** | 应用通过 SOCKS5 连接 (127.0.0.1:9050) | 选择性应用保护 |
| **网桥模式** | 使用 obfs4/meek 网桥绕过审查 | 受限网络 |

### 快速启动预设

| 预设 | 图标 | 配置 |
|------|------|------|
| **完全匿名** | 盾牌 | 透明 + DNS over Tor + Kill Switch |
| **选择性应用** | 目标 | 仅 SOCKS，无 kill switch |
| **绕过审查** | 解锁 | 启用网桥 + obfs4 |

### 安全功能

- **Kill Switch** - Tor 断开时阻止所有流量
- **DNS over Tor** - 防止 DNS 泄露
- **新身份** - 立即请求新电路
- **泄露测试** - 验证保护是否有效
- **隐藏服务** - 托管 .onion 站点

## 仪表板

仪表板提供实时监控：

```
+--------------------------------------------------+
|  Tor Shield                           已保护     |
+--------------------------------------------------+
|                                                  |
|  +------------+    您的保护状态                  |
|  |   洋葱     |    --------------------------    |
|  |   开关     |    真实 IP:    192.168.x.x       |
|  |            |    Tor 出口:   185.220.x.x DE    |
|  +------------+                                  |
|                                                  |
|  +---------------------------------------------+ |
|  | 完全       | 选择性       | 绕过            | |
|  | 匿名       | 应用         | 审查            | |
|  +---------------------------------------------+ |
|                                                  |
|  电路: 5    | 45 KB/s  | 2h 15m                  |
|  下载: 125 MB | 上传: 45 MB|                     |
|                                                  |
|  +---------+---------+---------+---------+       |
|  | 服务    | 启动    | DNS     | Kill    |       |
|  | 运行中  | 100%    | 已保护  | 活跃    |       |
|  +---------+---------+---------+---------+       |
+--------------------------------------------------+
```

## 隐藏服务

在 Tor 网络上使用 .onion 地址托管您的服务：

```bash
# 通过 LuCI
服务 -> Tor Shield -> 隐藏服务 -> 添加

# 通过 CLI
ubus call luci.tor-shield add_hidden_service '{"name":"mysite","local_port":80,"virtual_port":80}'

# 获取 onion 地址
cat /var/lib/tor/hidden_service_mysite/hostname
```

### 隐藏服务示例

| 服务 | 本地端口 | Onion 端口 | 使用场景 |
|------|----------|------------|----------|
| Web 服务器 | 80 | 80 | 匿名网站 |
| SSH | 22 | 22 | 安全远程访问 |
| API | 8080 | 80 | 匿名 API 端点 |

## 网桥

使用 Tor 网桥绕过网络审查：

### 网桥类型

| 类型 | 描述 | 何时使用 |
|------|------|----------|
| **obfs4** | 混淆协议 | 大多数被审查的网络 |
| **meek-azure** | 通过 Azure 的域前置 | 高度受限网络 |
| **snowflake** | 基于 WebRTC | 动态网桥发现 |

### 自动网桥检测

```bash
# 启用自动网桥选择
uci set tor-shield.main.auto_bridges=1
uci commit tor-shield
/etc/init.d/tor-shield restart
```

## 配置

### UCI 设置

```bash
# /etc/config/tor-shield

config tor-shield 'main'
    option enabled '1'
    option mode 'transparent'      # transparent | socks
    option dns_over_tor '1'        # 通过 Tor 路由 DNS
    option kill_switch '1'         # Tor 失败时阻止流量
    option auto_bridges '0'        # 自动检测审查

config socks 'socks'
    option port '9050'
    option address '127.0.0.1'

config trans 'trans'
    option port '9040'
    option dns_port '9053'
    list excluded_ips '192.168.255.0/24'  # LAN 绕过

config bridges 'bridges'
    option enabled '0'
    option type 'obfs4'

config security 'security'
    option exit_nodes ''           # 国家代码: {us},{de}
    option exclude_exit_nodes ''   # 避免: {ru},{cn}
    option strict_nodes '0'

config hidden_service 'hs_mysite'
    option enabled '1'
    option name 'mysite'
    option local_port '80'
    option virtual_port '80'
```

## RPCD API

### 状态和控制

```bash
# 获取状态
ubus call luci.tor-shield status

# 使用预设启用
ubus call luci.tor-shield enable '{"preset":"anonymous"}'

# 禁用
ubus call luci.tor-shield disable

# 重启
ubus call luci.tor-shield restart

# 请求新身份
ubus call luci.tor-shield new_identity

# 检查泄露
ubus call luci.tor-shield check_leaks
```

### 电路管理

```bash
# 获取活跃电路
ubus call luci.tor-shield circuits

# 响应:
{
  "circuits": [{
    "id": "123",
    "status": "BUILT",
    "path": "$A~Guard,$B~Middle,$C~Exit",
    "purpose": "GENERAL",
    "nodes": [
      {"fingerprint": "ABC123", "name": "Guard"},
      {"fingerprint": "DEF456", "name": "Middle"},
      {"fingerprint": "GHI789", "name": "Exit"}
    ]
  }]
}
```

### 隐藏服务

```bash
# 列出隐藏服务
ubus call luci.tor-shield hidden_services

# 添加隐藏服务
ubus call luci.tor-shield add_hidden_service '{"name":"web","local_port":80,"virtual_port":80}'

# 移除隐藏服务
ubus call luci.tor-shield remove_hidden_service '{"name":"web"}'
```

### 带宽统计

```bash
# 获取带宽
ubus call luci.tor-shield bandwidth

# 响应:
{
  "read": 125000000,      # 总下载字节
  "written": 45000000,    # 总上传字节
  "read_rate": 45000,     # 当前下载速率 (字节/秒)
  "write_rate": 12000     # 当前上传速率 (字节/秒)
}
```

## 故障排除

### Tor 无法启动

```bash
# 检查日志
logread | grep -i tor

# 验证配置
tor --verify-config -f /var/run/tor/torrc

# 检查控制套接字
ls -la /var/run/tor/control
```

### 连接缓慢

1. **检查引导程序** - 等待 100% 完成
2. **尝试网桥** - 网络可能在限制 Tor
3. **更换电路** - 点击"新身份"
4. **检查出口节点** - 某些出口较慢

### DNS 泄露

```bash
# 验证 DNS 通过 Tor 路由
nslookup check.torproject.org

# 应该通过 Tor DNS 解析 (127.0.0.1:9053)
```

### Kill Switch 问题

```bash
# 检查防火墙规则
iptables -L -n | grep -i tor

# 验证 kill switch 配置
uci get tor-shield.main.kill_switch
```

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/tor-shield` | UCI 配置 |
| `/var/run/tor/torrc` | 生成的 Tor 配置 |
| `/var/run/tor/control` | 控制套接字 |
| `/var/lib/tor/` | Tor 数据目录 |
| `/var/lib/tor/hidden_service_*/` | 隐藏服务密钥 |
| `/tmp/tor_exit_ip` | 缓存的出口 IP |
| `/tmp/tor_real_ip` | 缓存的真实 IP |

## 安全须知

1. **Kill Switch** - 始终启用以获得最大保护
2. **DNS 泄露** - 启用 DNS over Tor 防止泄露
3. **隐藏服务** - `/var/lib/tor/` 中的密钥敏感 - 安全备份
4. **出口节点** - 考虑对敏感用途排除某些国家
5. **网桥** - 如果 ISP 阻止或限制 Tor 则使用

## 许可证

MIT 许可证 - Copyright (C) 2025 CyberMind.fr
