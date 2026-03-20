[English](README.md) | [Francais](README.fr.md) | 中文

# LuCI WireGuard 仪表板

现代化的 OpenWrt WireGuard VPN 管理界面，包含配置向导、对等节点管理和实时监控。

## 功能特性

- **配置向导**：通过常用场景预设，几分钟内创建隧道和对等节点
- **仪表板概览**：所有隧道和对等节点的实时状态
- **对等节点管理**：添加、删除和配置对等节点，支持二维码生成
- **流量监控**：按接口和对等节点的实时带宽统计
- **客户端配置导出**：生成配置文件和移动应用二维码

## 安装

```bash
opkg update
opkg install luci-app-wireguard-dashboard
```

### 依赖项

- `wireguard-tools` - WireGuard 用户空间工具
- `luci-base` - LuCI Web 界面
- `qrencode`（可选）- 用于服务端二维码生成

## 配置向导

向导提供常见 VPN 场景的预设配置：

### 隧道预设

| 预设 | 描述 | 默认端口 | 网络 |
|------|------|----------|------|
| Road Warrior | 移动用户远程访问 | 51820 | 10.10.0.0/24 |
| 站点到站点 | 连接两个网络 | 51821 | 10.20.0.0/24 |
| IoT 隧道 | 智能设备隔离隧道 | 51822 | 10.30.0.0/24 |

### 对等节点区域预设

| 区域 | 描述 | 隧道模式 |
|------|------|----------|
| 家庭用户 | 完整网络访问 | 完整 |
| 远程工作者 | 仅办公资源 | 分割 |
| 移动设备 | 移动访问 | 完整 |
| IoT 设备 | 仅限 VPN 访问 | 分割 |
| 访客 | 临时访客访问 | 完整 |
| 服务器/站点 | 站点到站点连接 | 分割 |

### 向导流程

1. **选择隧道类型** - 选择预设（Road Warrior、站点到站点、IoT）
2. **配置隧道** - 设置接口名称、端口、VPN 网络、公共端点
3. **选择对等节点区域** - 选择要创建的对等节点类型
4. **创建** - 向导生成密钥、创建接口、添加对等节点、显示二维码

## RPCD API

仪表板通过 `luci.wireguard-dashboard` RPCD 对象进行通信。

### 方法

| 方法 | 参数 | 描述 |
|------|------|------|
| `status` | - | 获取 WireGuard 整体状态 |
| `interfaces` | - | 列出所有 WireGuard 接口 |
| `peers` | - | 列出所有对等节点及其状态 |
| `traffic` | - | 获取流量统计 |
| `generate_keys` | - | 生成新密钥对 + PSK |
| `create_interface` | name, private_key, listen_port, addresses, mtu | 创建新的 WireGuard 接口及防火墙规则 |
| `add_peer` | interface, name, allowed_ips, public_key, preshared_key, endpoint, persistent_keepalive | 向接口添加对等节点 |
| `remove_peer` | interface, public_key | 从接口移除对等节点 |
| `interface_control` | interface, action (up/down/restart) | 控制接口状态 |
| `generate_config` | interface, peer, private_key, endpoint | 生成客户端配置文件 |
| `generate_qr` | interface, peer, private_key, endpoint | 生成二维码（需要 qrencode） |

### 示例：通过 CLI 创建接口

```bash
# 生成密钥
keys=$(ubus call luci.wireguard-dashboard generate_keys '{}')
privkey=$(echo "$keys" | jsonfilter -e '@.private_key')

# 创建接口
ubus call luci.wireguard-dashboard create_interface "{
  \"name\": \"wg0\",
  \"private_key\": \"$privkey\",
  \"listen_port\": \"51820\",
  \"addresses\": \"10.10.0.1/24\",
  \"mtu\": \"1420\"
}"
```

### 示例：通过 CLI 添加对等节点

```bash
# 生成对等节点密钥
peer_keys=$(ubus call luci.wireguard-dashboard generate_keys '{}')
peer_pubkey=$(echo "$peer_keys" | jsonfilter -e '@.public_key')
peer_psk=$(echo "$peer_keys" | jsonfilter -e '@.preshared_key')

# 添加对等节点
ubus call luci.wireguard-dashboard add_peer "{
  \"interface\": \"wg0\",
  \"name\": \"手机\",
  \"allowed_ips\": \"10.10.0.2/32\",
  \"public_key\": \"$peer_pubkey\",
  \"preshared_key\": \"$peer_psk\",
  \"persistent_keepalive\": \"25\"
}"
```

## 防火墙集成

通过向导或 `create_interface` API 创建接口时，会自动创建以下防火墙规则：

1. **区域**（`wg_<interface>`）：INPUT/OUTPUT/FORWARD = ACCEPT
2. **转发**：与 `lan` 区域的双向转发
3. **WAN 规则**：允许来自 WAN 的监听端口 UDP 流量

## 文件位置

| 文件 | 用途 |
|------|------|
| `/usr/libexec/rpcd/luci.wireguard-dashboard` | RPCD 后端 |
| `/www/luci-static/resources/wireguard-dashboard/api.js` | JavaScript API 封装 |
| `/www/luci-static/resources/view/wireguard-dashboard/*.js` | LuCI 视图 |
| `/usr/share/luci/menu.d/luci-app-wireguard-dashboard.json` | 菜单配置 |
| `/usr/share/rpcd/acl.d/luci-app-wireguard-dashboard.json` | ACL 权限 |

## 故障排除

### 接口无法启动

```bash
# 检查接口状态
wg show wg0

# 检查 UCI 配置
uci show network.wg0

# 手动启动
ifup wg0

# 检查日志
logread | grep -i wireguard
```

### 对等节点无法连接

1. 验证防火墙端口已打开：`iptables -L -n | grep 51820`
2. 检查端点是否可从客户端访问
3. 验证两端的 allowed_ips 是否匹配
4. 检查 NAT 问题 - 启用 PersistentKeepalive

### 二维码无法生成

安装 qrencode 用于服务端二维码生成：
```bash
opkg install qrencode
```

仪表板还支持通过 JavaScript 进行客户端二维码生成（无服务器依赖）。

## 许可证

Apache-2.0

## 作者

CyberMind.fr - SecuBox 项目
