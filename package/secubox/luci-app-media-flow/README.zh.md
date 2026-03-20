# LuCI Media Flow - 流媒体检测与监控

[English](README.md) | [Francais](README.fr.md) | 中文

**版本：** 0.4.0
**最后更新：** 2025-12-28
**状态：** 活跃

实时检测和监控流媒体服务，具有质量估算和可配置告警功能。

## 功能

### 流媒体服务检测

自动检测和监控：

**视频流：**
- Netflix、YouTube、Disney+、Prime Video、Twitch
- HBO、Hulu、Vimeo

**音频流：**
- Spotify、Apple Music、Deezer
- SoundCloud、Tidal、Pandora

**视频会议：**
- Zoom、Microsoft Teams、Google Meet
- Discord、Skype、WebEx

### 质量估算

根据带宽消耗估算流媒体质量：
- **SD**（标清）：< 1 Mbps
- **HD**（高清）：1-3 Mbps
- **FHD**（全高清 1080p）：3-8 Mbps
- **4K**（超高清）：> 8 Mbps

### 实时监控

- 带实时更新的活动流仪表板
- 每个流的带宽消耗
- 客户端 IP 跟踪
- 服务分类（视频/音频/视频会议）

### 历史数据

- 带时间戳的会话历史
- 每个服务的使用统计
- 每个客户端的使用统计
- 可配置的保留期

### 告警

根据以下内容配置告警：
- 特定服务的使用阈值
- 每日/每周限制
- 自动操作（通知、限制、阻止）

## 依赖

- **netifyd**：用于应用检测的深度包检测引擎
- **luci-app-netifyd-dashboard**：OpenWrt 的 Netifyd 集成
- **jq**：JSON 处理（用于历史数据）

## 安装

```bash
opkg update
opkg install luci-app-media-flow
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 配置

### UCI 配置

文件：`/etc/config/media_flow`

```
config global 'global'
    option enabled '1'
    option history_retention '7'    # 保留历史的天数
    option refresh_interval '5'     # 更新间隔秒数

config alert 'netflix_limit'
    option service 'Netflix'
    option threshold_hours '4'      # 每天小时数
    option action 'notify'          # notify|limit|block
    option enabled '1'
```

### 添加告警

通过 LuCI：
1. 导航到监控 -> Media Flow -> 告警
2. 点击"添加"
3. 配置服务名称、阈值和操作
4. 保存并应用

通过 CLI：
```bash
uci set media_flow.youtube_alert=alert
uci set media_flow.youtube_alert.service='YouTube'
uci set media_flow.youtube_alert.threshold_hours='3'
uci set media_flow.youtube_alert.action='notify'
uci set media_flow.youtube_alert.enabled='1'
uci commit media_flow
```

## ubus API

### 方法

```bash
# 获取模块状态
ubus call luci.media-flow status

# 获取活动流媒体会话
ubus call luci.media-flow get_active_streams

# 获取历史数据（最近 24 小时）
ubus call luci.media-flow get_stream_history '{"hours": 24}'

# 获取按服务的统计
ubus call luci.media-flow get_stats_by_service

# 获取按客户端的统计
ubus call luci.media-flow get_stats_by_client

# 获取特定服务的详情
ubus call luci.media-flow get_service_details '{"service": "Netflix"}'

# 设置告警
ubus call luci.media-flow set_alert '{"service": "Netflix", "threshold_hours": 4, "action": "notify"}'

# 列出配置的告警
ubus call luci.media-flow list_alerts
```

## 数据存储

### 历史文件
- 位置：`/tmp/media-flow-history.json`
- 格式：会话条目的 JSON 数组
- 保留：最后 1000 条记录
- 自动轮换

### 统计缓存
- 位置：`/tmp/media-flow-stats/`
- 每个服务/客户端的聚合统计
- 每个刷新间隔更新

## 工作原理

1. **检测**：与 netifyd DPI 引擎集成以检测应用协议
2. **分类**：将检测到的应用与流媒体服务模式匹配
3. **质量估算**：分析带宽消耗以估算流质量
4. **记录**：将会话数据保存到历史记录以供分析
5. **告警**：根据配置的阈值监控使用情况

## 仪表板视图

### 主仪表板
- 当前流媒体状态
- 带质量指示器的活动流
- 按使用量排名的热门服务
- 每 5 秒自动刷新

### 服务视图
- 每个服务的详细统计
- 总会话数、持续时间、带宽
- 服务详情模态框

### 客户端视图
- 每个客户端 IP 的使用统计
- 每个客户端的热门服务
- 总消耗量

### 历史视图
- 按时间顺序的会话列表
- 按时间段筛选
- 质量和持续时间指示器

### 告警视图
- 配置基于服务的告警
- 设置阈值和操作
- 启用/禁用告警

## 故障排除

### 未检测到流

1. 检查 netifyd 是否运行：
   ```bash
   /etc/init.d/netifyd status
   ```

2. 验证 netifyd 配置：
   ```bash
   uci show netifyd
   ```

3. 检查 netifyd 流：
   ```bash
   ubus call luci.netifyd-dashboard get_flows
   ```

### 质量估算不准确

质量估算基于即时带宽，可能不反映实际流质量。因素：
- 自适应比特率流
- 网络拥塞
- 多个并发流

### 历史未保存

1. 检查权限：
   ```bash
   ls -la /tmp/media-flow-history.json
   ```

2. 检查 jq 可用性：
   ```bash
   which jq
   opkg install jq
   ```

## 性能

- **CPU 使用**：最小（仅解析，netifyd 处理 DPI）
- **内存**：~2-5 MB 用于历史存储
- **磁盘**：无（tmpfs）
- **网络**：无额外开销

## 隐私

- 所有数据本地存储在设备上
- 无外部遥测或报告
- 历史记录可随时禁用或清除

## 许可证

Apache-2.0

## 作者

CyberMind.fr
