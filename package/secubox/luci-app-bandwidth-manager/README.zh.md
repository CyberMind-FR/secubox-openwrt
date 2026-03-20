[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Bandwidth Manager - QoS 和流量控制

**版本：** 0.4.0
**最后更新：** 2025-12-28
**状态：** 活跃

OpenWrt 高级带宽管理，具有 QoS 规则、客户端配额和 SQM/CAKE 集成。

## 功能特性

### QoS 流量整形
- 基于应用、端口、IP 或 MAC 的规则流量控制
- 每条规则的下载/上传限制
- 8 级优先级系统（1=最高，8=最低）
- 时间计划支持
- 实时启用/禁用规则

### 客户端配额
- 每个 MAC 地址的月度数据配额
- 使用 iptables 计数器跟踪使用情况
- 可配置操作：限速、阻止或通知
- 自动月度重置（可配置日期）
- 实时配额使用监控

### SQM/CAKE 集成
- 使用 CAKE qdisc 的智能队列管理
- 自动带宽整形
- NAT 感知配置
- 链路开销补偿（以太网、PPPoE、VLAN）
- 替代 FQ_CoDel 和 HTB 支持

### 实时监控
- 实时客户端带宽使用（每 5 秒自动刷新）
- 每客户端 RX/TX 统计
- 配额进度可视化
- 历史使用跟踪

## 安装

```bash
opkg update
opkg install luci-app-bandwidth-manager
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 依赖项

- **tc**：流量控制工具
- **kmod-sched-core**：内核流量调度器
- **kmod-sched-cake**：CAKE qdisc 模块
- **kmod-ifb**：中间功能块设备
- **sqm-scripts**：SQM 脚本
- **iptables**：用于流量跟踪
- **iptables-mod-conntrack-extra**：连接跟踪扩展

## 配置

### UCI 配置

编辑 `/etc/config/bandwidth`：

```bash
config global 'global'
	option enabled '1'
	option interface 'br-lan'
	option sqm_enabled '1'

config sqm 'sqm'
	option download_speed '100000'    # kbit/s
	option upload_speed '50000'       # kbit/s
	option qdisc 'cake'
	option nat '1'
	option overhead '22'              # PPPoE 开销

config rule 'rule_youtube'
	option name '限制 YouTube'
	option type 'application'
	option target 'youtube'
	option limit_down '5000'          # kbit/s
	option limit_up '1000'            # kbit/s
	option priority '6'
	option enabled '1'

config quota 'quota_phone'
	option mac 'AA:BB:CC:DD:EE:FF'
	option name 'iPhone 张三'
	option limit_mb '10240'           # 10 GB
	option action 'throttle'
	option reset_day '1'
	option enabled '1'
```

### 配置选项

#### Global 部分
- `enabled`：启用/禁用带宽管理器
- `interface`：要管理的网络接口（默认：br-lan）
- `sqm_enabled`：启用 SQM/CAKE

#### SQM 部分
- `download_speed`：下载速度（kbit/s）
- `upload_speed`：上传速度（kbit/s）
- `qdisc`：队列规则（cake、fq_codel、htb）
- `nat`：NAT 模式（1=启用，0=禁用）
- `overhead`：链路开销（字节）（0、18、22、40）

#### Rule 部分
- `name`：规则名称
- `type`：规则类型（application、port、ip、mac）
- `target`：目标值（应用名称、端口号、IP 或 MAC）
- `limit_down`：下载限制（kbit/s）（0=无限）
- `limit_up`：上传限制（kbit/s）（0=无限）
- `priority`：优先级（1-8）
- `schedule`：可选时间计划（如"周一-周五 08:00-18:00"）
- `enabled`：启用/禁用规则

#### Quota 部分
- `mac`：客户端 MAC 地址
- `name`：友好名称
- `limit_mb`：月度限制（MB）
- `action`：超限操作（throttle、block、notify）
- `reset_day`：重置日期（1-28）
- `enabled`：启用/禁用配额

## 使用方法

### Web 界面

在 LuCI 中导航至 **网络 → Bandwidth Manager**。

#### 概览选项卡
- 系统状态（QoS 活跃、接口、SQM）
- 流量统计（RX/TX 字节和数据包）
- 活跃规则摘要
- 带进度条的客户端配额

#### QoS 规则选项卡
- 创建/编辑/删除流量整形规则
- 配置类型、目标、限制和优先级
- 单独启用/禁用规则
- 设置时间计划

#### 客户端配额选项卡
- 管理每个 MAC 的月度数据配额
- 设置限制和操作
- 重置配额计数器
- 查看当前使用情况

#### 实时使用选项卡
- 每客户端实时带宽使用
- 每 5 秒自动刷新
- 下载/上传分解
- 受监控客户端的配额进度

#### 设置选项卡
- 全局启用/禁用
- 接口选择
- SQM/CAKE 配置
- 流量跟踪设置
- 警报配置

### 命令行

#### 获取状态

```bash
ubus call luci.bandwidth-manager status
```

#### 列出 QoS 规则

```bash
ubus call luci.bandwidth-manager list_rules
```

#### 添加 QoS 规则

```bash
ubus call luci.bandwidth-manager add_rule '{
  "name": "限制种子",
  "type": "port",
  "target": "6881-6889",
  "limit_down": 3000,
  "limit_up": 500,
  "priority": 7
}'
```

#### 删除规则

```bash
ubus call luci.bandwidth-manager delete_rule '{
  "rule_id": "rule_1234567890"
}'
```

#### 列出客户端配额

```bash
ubus call luci.bandwidth-manager list_quotas
```

#### 设置配额

```bash
ubus call luci.bandwidth-manager set_quota '{
  "mac": "AA:BB:CC:DD:EE:FF",
  "name": "iPhone 张三",
  "limit_mb": 10240,
  "action": "throttle",
  "reset_day": 1
}'
```

#### 获取配额详情

```bash
ubus call luci.bandwidth-manager get_quota '{
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

#### 重置配额计数器

```bash
ubus call luci.bandwidth-manager reset_quota '{
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

#### 获取实时使用情况

```bash
ubus call luci.bandwidth-manager get_usage_realtime
```

#### 获取使用历史

```bash
ubus call luci.bandwidth-manager get_usage_history '{
  "timeframe": "24h",
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

时间范围选项：`1h`、`6h`、`24h`、`7d`、`30d`

## ubus API 参考

### status()

获取系统状态和全局统计。

**返回：**
```json
{
  "enabled": true,
  "interface": "br-lan",
  "sqm_enabled": true,
  "qos_active": true,
  "stats": {
    "rx_bytes": 1234567890,
    "tx_bytes": 987654321,
    "rx_packets": 1234567,
    "tx_packets": 987654
  },
  "rule_count": 5,
  "quota_count": 3
}
```

### list_rules()

列出所有 QoS 规则。

**返回：**
```json
{
  "rules": [
    {
      "id": "rule_youtube",
      "name": "限制 YouTube",
      "type": "application",
      "target": "youtube",
      "limit_down": 5000,
      "limit_up": 1000,
      "priority": 6,
      "enabled": true,
      "schedule": ""
    }
  ]
}
```

### add_rule(name, type, target, limit_down, limit_up, priority)

添加新的 QoS 规则。

**返回：**
```json
{
  "success": true,
  "rule_id": "rule_1234567890",
  "message": "规则创建成功"
}
```

### delete_rule(rule_id)

删除 QoS 规则。

**返回：**
```json
{
  "success": true,
  "message": "规则删除成功"
}
```

### list_quotas()

列出所有客户端配额及当前使用情况。

**返回：**
```json
{
  "quotas": [
    {
      "id": "quota_phone",
      "mac": "AA:BB:CC:DD:EE:FF",
      "name": "iPhone 张三",
      "limit_mb": 10240,
      "used_mb": 7850,
      "percent": 76,
      "action": "throttle",
      "reset_day": 1,
      "enabled": true
    }
  ]
}
```

### get_quota(mac)

获取特定 MAC 的详细配额信息。

**返回：**
```json
{
  "success": true,
  "quota_id": "quota_phone",
  "mac": "AA:BB:CC:DD:EE:FF",
  "name": "iPhone 张三",
  "limit_mb": 10240,
  "used_mb": 7850,
  "remaining_mb": 2390,
  "percent": 76,
  "action": "throttle",
  "reset_day": 1
}
```

### set_quota(mac, name, limit_mb, action, reset_day)

创建或更新客户端配额。

**返回：**
```json
{
  "success": true,
  "quota_id": "quota_1234567890",
  "message": "配额创建成功"
}
```

### reset_quota(mac)

重置客户端的配额计数器。

**返回：**
```json
{
  "success": true,
  "message": "AA:BB:CC:DD:EE:FF 的配额计数器已重置"
}
```

### get_usage_realtime()

获取所有活跃客户端的实时带宽使用情况。

**返回：**
```json
{
  "clients": [
    {
      "mac": "AA:BB:CC:DD:EE:FF",
      "ip": "192.168.1.100",
      "hostname": "iPhone",
      "rx_bytes": 1234567,
      "tx_bytes": 987654,
      "has_quota": true,
      "limit_mb": 10240,
      "used_mb": 7850
    }
  ]
}
```

### get_usage_history(timeframe, mac)

获取历史使用数据。

**参数：**
- `timeframe`："1h"、"6h"、"24h"、"7d"、"30d"
- `mac`：MAC 地址（可选，为空则获取所有客户端）

**返回：**
```json
{
  "history": [
    {
      "mac": "AA:BB:CC:DD:EE:FF",
      "timestamp": 1640000000,
      "rx_bytes": 1234567,
      "tx_bytes": 987654
    }
  ]
}
```

## 流量跟踪

Bandwidth Manager 使用 iptables 进行每客户端流量计数：

```bash
# 创建跟踪链
iptables -N BW_TRACKING

# 为每个 MAC 添加规则
iptables -A BW_TRACKING -m mac --mac-source AA:BB:CC:DD:EE:FF
iptables -A BW_TRACKING -m mac --mac-source BB:CC:DD:EE:FF:00

# 插入到 FORWARD 链
iptables -I FORWARD -j BW_TRACKING

# 查看计数器
iptables -L BW_TRACKING -n -v -x
```

使用数据存储在 `/tmp/bandwidth_usage.db`，使用管道分隔格式：
```
MAC|Timestamp|RX_Bytes|TX_Bytes
```

## QoS 实现

### CAKE（推荐）

```bash
tc qdisc add dev br-lan root cake bandwidth 100000kbit
```

优点：
- 主动队列管理（AQM）
- 基于流的公平队列
- NAT 感知
- 低延迟

### HTB（手动控制）

```bash
tc qdisc add dev br-lan root handle 1: htb default 10
tc class add dev br-lan parent 1: classid 1:1 htb rate 100mbit
tc class add dev br-lan parent 1:1 classid 1:10 htb rate 50mbit ceil 100mbit prio 5
```

## 故障排除

### QoS 不工作

检查 QoS 是否活跃：
```bash
tc qdisc show dev br-lan
```

检查 iptables 规则：
```bash
iptables -L BW_TRACKING -n -v
```

### 配额跟踪不准确

重置 iptables 计数器：
```bash
iptables -Z BW_TRACKING
```

检查使用数据库：
```bash
cat /tmp/bandwidth_usage.db
```

### CPU 使用率高

降低跟踪频率或使用硬件流卸载（如果可用）：
```bash
echo 1 > /sys/class/net/br-lan/offload/tx_offload
```

## 最佳实践

1. **设置实际限制**：将下载/上传速度配置为实际连接速度的 85-95%
2. **使用 CAKE**：优先使用 CAKE qdisc 以获得最佳性能和最低延迟
3. **先监控**：使用实时使用视图了解流量模式，然后再设置配额
4. **定期重置**：将月度重置配置在第 1 天，与 ISP 账单周期对齐
5. **明智地设置优先级**：将优先级 1-2 保留给 VoIP/游戏，大多数流量使用优先级 5（普通）

## 安全考虑

- MAC 地址可被伪造 - 需配合其他安全措施使用
- 配额跟踪需要 iptables 访问 - 请保护好您的路由器
- 警报邮件可能包含敏感信息 - 使用加密连接
- 流量整形规则仅对网络管理员可见

## 许可证

Apache-2.0

## 维护者

SecuBox 项目 <support@secubox.com>

## 版本

1.0.0
