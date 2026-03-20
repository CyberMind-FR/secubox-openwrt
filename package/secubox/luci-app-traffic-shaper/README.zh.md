# Traffic Shaper - 高级 QoS 控制

[English](README.md) | [Francais](README.fr.md) | 中文

**版本：** 0.4.0
**最后更新：** 2025-12-28
**状态：** 活跃

用于高级流量整形和服务质量（QoS）管理的 LuCI 应用程序，使用 Linux Traffic Control (TC) 和 CAKE qdisc。

## 功能

- **流量类别管理**：创建和管理带宽分配类别，具有保证（rate）和最大（ceil）限制
- **基于优先级的调度**：8 级优先级系统，用于精细的流量优先级
- **分类规则**：灵活的规则系统，按以下方式分类流量：
  - 端口号（源/目标）
  - IP 地址（源/目标）
  - DSCP 标记
  - 协议类型
- **实时统计**：监控每个类别的数据包计数、字节计数和丢弃统计
- **快速预设**：一键应用优化配置：
  - 游戏和低延迟
  - 视频流
  - 居家办公
  - 均衡（默认）
- **可视化仪表板**：带优先级颜色编码的流量流程图
- **多接口支持**：在 WAN、LAN 或任何网络接口上配置 QoS

## 安装

```bash
opkg update
opkg install luci-app-traffic-shaper
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 依赖

- `luci-base`：LuCI Web 界面框架
- `rpcd`：后端通信的 RPC 守护进程
- `tc`：Linux 流量控制工具
- `kmod-sched-core`：内核流量调度模块
- `kmod-sched-cake`：CAKE qdisc 内核模块

## 使用

### 访问界面

导航到：**网络 -> Traffic Shaper**

界面提供 5 个主要视图：

1. **概览**：带状态卡片和流量流程可视化的仪表板
2. **流量类别**：带宽类别的 CRUD 界面
3. **分类规则**：流量匹配规则的 CRUD 界面
4. **统计**：所有流量类别的实时统计
5. **预设**：快速应用优化配置

### 创建流量类别

1. 转到 **网络 -> Traffic Shaper -> 流量类别**
2. 点击 **添加** 创建新类别
3. 配置：
   - **名称**：描述性名称（例如"视频流"）
   - **优先级**：1（最高）到 8（最低）
   - **保证速率**：最小带宽（例如"5mbit"）
   - **最大速率（Ceil）**：允许的最大带宽（例如"50mbit"）
   - **接口**：网络接口（wan、lan 等）
   - **启用**：激活类别
4. 点击 **保存并应用**

### 优先级指南

- **优先级 1-2**：关键流量（VoIP、游戏、实时应用）
- **优先级 3-4**：重要流量（视频流、VPN）
- **优先级 5-6**：正常流量（网页浏览、电子邮件）
- **优先级 7-8**：批量流量（下载、备份）

### 创建分类规则

1. 转到 **网络 -> Traffic Shaper -> 分类规则**
2. 点击 **添加** 创建新规则
3. 配置：
   - **流量类别**：选择目标类别
   - **匹配类型**：端口、IP、DSCP 或协议
   - **匹配值**：要匹配的值
   - **启用**：激活规则
4. 点击 **保存并应用**

### 规则示例

| 匹配类型 | 匹配值 | 描述 |
|----------|--------|------|
| 目标端口 | `80,443` | HTTP/HTTPS 网络流量 |
| 目标端口 | `22` | SSH 连接 |
| 目标端口 | `53` | DNS 查询 |
| 源 IP | `192.168.1.0/24` | 来自 LAN 子网的所有流量 |
| 目标 IP | `8.8.8.8` | 到 Google DNS 的流量 |
| DSCP | `EF` | 加速转发（VoIP） |
| 协议 | `udp` | 所有 UDP 流量 |

### 使用预设

1. 转到 **网络 -> Traffic Shaper -> 预设**
2. 查看可用的预设及其配置
3. 点击所需配置文件上的 **应用此预设**
4. 确认操作（这将替换现有配置）

## 配置

### UCI 配置

配置存储在 `/etc/config/traffic-shaper`：

```
config class 'gaming'
	option name 'Gaming Traffic'
	option priority '1'
	option rate '10mbit'
	option ceil '50mbit'
	option interface 'wan'
	option enabled '1'

config rule 'gaming_ports'
	option class 'gaming'
	option match_type 'dport'
	option match_value '3074,27015,25565'
	option enabled '1'
```

### 流量类别选项

- `name`：类别的显示名称
- `priority`：优先级（1-8）
- `rate`：保证的最小带宽（格式：`<数字>[kmg]bit`）
- `ceil`：允许的最大带宽（格式：`<数字>[kmg]bit`）
- `interface`：网络接口名称
- `enabled`：启用/禁用类别（0/1）

### 分类规则选项

- `class`：流量类别 ID（UCI section 名称）
- `match_type`：匹配类型（`dport`、`sport`、`dst`、`src`、`dscp`、`protocol`）
- `match_value`：要匹配的值
- `enabled`：启用/禁用规则（0/1）

## 后端 API

RPCD 后端（`luci.traffic-shaper`）提供以下方法：

### 状态方法

- `status()`：获取当前 QoS 系统状态
- `list_classes()`：列出所有流量类别
- `list_rules()`：列出所有分类规则
- `get_stats()`：从 TC 获取每个类别的统计

### 管理方法

- `add_class(name, priority, rate, ceil, interface)`：创建新类别
- `update_class(id, name, priority, rate, ceil, interface, enabled)`：更新类别
- `delete_class(id)`：删除类别
- `add_rule(class, match_type, match_value)`：创建分类规则
- `delete_rule(id)`：删除规则

### 预设方法

- `list_presets()`：获取可用预设
- `apply_preset(preset_id)`：应用预设配置

## 技术细节

### 流量控制实现

该模块使用 Linux Traffic Control (TC)，具有以下层次结构：

1. **根 qdisc**：CAKE（Common Applications Kept Enhanced）
2. **类别层次结构**：HTB（Hierarchical Token Bucket）用于带宽分配
3. **过滤器**：基于规则的 U32 过滤器用于流量分类

### CAKE 特性

- **智能队列**：自动管理队列大小
- **流隔离**：防止单个流垄断带宽
- **延迟降低**：最小化缓冲膨胀
- **每主机公平**：确保公平的带宽分配

### 统计收集

使用 `tc -s class show` 收集统计并解析以提供：
- 每个类别的数据包计数
- 每个类别的字节计数
- 丢弃计数（由于速率限制而丢弃的数据包）

数据在统计视图中每 5 秒刷新一次。

## 示例

### 示例 1：居家办公设置

**类别：**
- 视频通话：优先级 1，8mbit 保证，50mbit 最大
- VPN 流量：优先级 2，10mbit 保证，60mbit 最大
- 网页浏览：优先级 4，5mbit 保证，40mbit 最大

**规则：**
- Zoom 端口（8801-8810）-> 视频通话
- 带 VPN IP 范围的端口 443 -> VPN 流量
- 端口 80,443 -> 网页浏览

### 示例 2：游戏 + 流媒体

**类别：**
- 游戏：优先级 1，5mbit 保证，40mbit 最大
- 流媒体：优先级 3，15mbit 保证，70mbit 最大
- 下载：优先级 7，2mbit 保证，30mbit 最大

**规则：**
- 游戏端口（3074、27015 等）-> 游戏
- 到 Netflix/YouTube IP 的端口 443 -> 流媒体
- 端口 80 -> 下载

### 示例 3：多用户家庭

使用 **均衡** 预设或创建自定义类别：
- 高优先级：10mbit -> 60mbit（优先级 2）
- 正常：15mbit -> 80mbit（优先级 5）
- 批量：5mbit -> 50mbit（优先级 7）

## 故障排除

### 流量整形不工作

1. 验证 CAKE 模块已加载：
   ```bash
   lsmod | grep sch_cake
   ```

2. 检查 TC 配置：
   ```bash
   tc qdisc show
   tc class show dev wan
   tc filter show dev wan
   ```

3. 验证接口名称：
   ```bash
   ip link show
   ```

### 类别不显示

1. 重启 RPCD：
   ```bash
   /etc/init.d/rpcd restart
   ```

2. 检查 UCI 配置：
   ```bash
   uci show traffic-shaper
   ```

3. 验证类别已启用：
   ```bash
   uci get traffic-shaper.<class_id>.enabled
   ```

### 统计不更新

1. 检查 TC 统计：
   ```bash
   tc -s class show dev wan
   ```

2. 验证轮询是否活跃（检查浏览器控制台）

3. 确保类别已启用且接口正确

## 性能注意事项

- **CPU 使用**：TC 处理在现代路由器上使用最小 CPU
- **内存**：每个类别使用约 1-2KB 内核内存
- **延迟**：CAKE 显著降低交互式流量的延迟
- **吞吐量**：对总吞吐量影响最小（<1% 开销）

## 许可证

Apache License 2.0

## 维护者

SecuBox Project <secubox@example.com>

## 另请参阅

- [Linux TC 文档](https://man7.org/linux/man-pages/man8/tc.8.html)
- [CAKE qdisc](https://www.bufferbloat.net/projects/codel/wiki/Cake/)
- [OpenWrt 流量整形](https://openwrt.org/docs/guide-user/network/traffic-shaping/start)
- [LuCI 开发指南](https://github.com/openwrt/luci/wiki)
