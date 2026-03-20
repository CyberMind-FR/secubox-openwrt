# SecuBox Netifyd 深度包检测界面

[English](README.md) | [Francais](README.fr.md) | 中文

完整的 Netifyd DPI 引擎 LuCI 界面，具有实时流监控、应用检测和网络分析功能。

## 功能

### 实时监控
- **实时流跟踪**：通过 socket 接口实时监控活动网络流
- **Socket 集成**：通过 TCP 或 Unix 域 socket 连接到 Netifyd
- **自动刷新**：可配置的轮询间隔用于实时更新

### 应用和协议检测
- **深度包检测**：利用 Netifyd 的 DPI 引擎
- **应用识别**：检测和跟踪应用程序（HTTP、HTTPS、SSH、DNS 等）
- **协议分析**：识别网络协议并分析流量模式
- **SSL/TLS 检查**：提取 SSL 证书信息和加密详情

### 设备跟踪
- **网络发现**：自动检测网络上的设备
- **流量分析**：每个设备的上传/下载统计
- **MAC/IP 映射**：关联 MAC 地址和 IP 地址
- **最后活动跟踪**：监控设备活动时间戳

### 服务管理
- **启动/停止/重启**：完全控制 Netifyd 服务
- **启用/禁用**：配置开机自启
- **状态监控**：查看服务健康状态和运行时间
- **配置**：通过 UCI 管理 Netifyd 设置

### 分析和报告
- **热门应用**：最常用应用的可视化图表
- **热门协议**：协议使用统计
- **流量统计**：总字节数、数据包和流计数
- **导出功能**：将流导出为 JSON 或 CSV 格式

## 要求

- OpenWrt 21.02 或更高版本
- LuCI (luci-base)
- 已安装 netifyd 软件包
- jq（用于 JSON 处理）
- secubox-core

## 安装

### 通过 SecuBox 应用商店
```bash
# 从 LuCI 管理面板
导航到 SecuBox -> 应用商店 -> 搜索 "Netifyd"
点击"安装"
```

### 手动安装
```bash
opkg update
opkg install luci-app-secubox-netifyd
service rpcd restart
```

## 配置

### 基本设置

1. 安装 netifyd：
```bash
opkg install netifyd
```

2. 配置 netifyd socket（编辑 `/etc/netifyd.conf`）：
```ini
[socket]
listen_path[0] = /var/run/netifyd/netifyd.sock
listen_address[0] = 127.0.0.1:7150
```

3. 启动 netifyd：
```bash
service netifyd start
service netifyd enable
```

4. 访问 LuCI 界面：
```
导航到：SecuBox -> Network Intelligence
```

### 高级配置

通过 LuCI 设置页面或 UCI 配置：

```bash
uci set secubox-netifyd.settings.socket_address='127.0.0.1'
uci set secubox-netifyd.settings.socket_port='7150'
uci set secubox-netifyd.settings.auto_start='1'
uci set secubox-netifyd.monitoring.enable_app_detection='1'
uci set secubox-netifyd.analytics.enabled='1'
uci commit secubox-netifyd
```

## 使用

### 仪表板
- 查看实时服务状态
- 监控活动流、设备和应用程序
- 快速统计概览
- 服务控制按钮

### 实时流
- 带自动刷新的实时流表
- 源/目标 IP 和端口
- 协议和应用检测
- 流量统计（字节、数据包、持续时间）
- 将流导出为 JSON/CSV

### 应用程序
- 按流量排名的热门应用
- 每个应用的流计数
- 流量百分比可视化
- 可排序的应用列表

### 设备
- 带 MAC/IP 地址的活动设备列表
- 每个设备的上传/下载统计
- 最后活动时间戳
- 总流量跟踪

### 设置
- Socket 配置（TCP/Unix）
- 流保留和限制
- 监控开关
- 分析偏好
- 告警配置

## API 方法

### 服务控制
- `get_service_status` - 获取 Netifyd 服务状态
- `service_start` - 启动 Netifyd 服务
- `service_stop` - 停止 Netifyd 服务
- `service_restart` - 重启 Netifyd 服务
- `service_enable` - 启用自启动
- `service_disable` - 禁用自启动

### 数据检索
- `get_realtime_flows` - 获取实时流数据
- `get_flow_statistics` - 获取流统计
- `get_top_applications` - 获取热门应用
- `get_top_protocols` - 获取热门协议
- `get_detected_devices` - 获取检测到的设备
- `get_dashboard` - 获取仪表板摘要

### 配置
- `get_config` - 获取当前配置
- `update_config` - 更新配置
- `get_interfaces` - 获取监控的接口

### 工具
- `clear_cache` - 清除流缓存
- `export_flows` - 导出流（JSON/CSV）

## 故障排除

### Netifyd 无法启动
```bash
# 检查 netifyd 安装
which netifyd

# 检查配置
cat /etc/netifyd.conf

# 查看日志
logread | grep netifyd

# 手动重启
/etc/init.d/netifyd restart
```

### Socket 连接失败
```bash
# 测试 TCP socket
nc -z 127.0.0.1 7150

# 检查 netifyd 进程
ps | grep netifyd

# 验证 socket 配置
grep listen /etc/netifyd.conf
```

### 无流数据
```bash
# 检查 netifyd 是否在捕获
netifyd -s

# 验证接口
grep interface /etc/netifyd.conf

# 检查 dump 文件
cat /run/netifyd/sink-request.json
```

## 性能注意事项

- **流限制**：默认 10,000 个流（可配置）
- **保留时间**：默认 1 小时（可配置）
- **轮询间隔**：3-10 秒（可配置）
- **显示限制**：UI 中 100 个流（可完整导出）

## 安全说明

- Socket 默认监听 localhost
- 无显式配置则无外部访问
- 流数据包含敏感网络信息
- 如果对外暴露 socket 建议配置防火墙规则

## 收集器设置脚本

使用 `/usr/bin/netifyd-collector-setup` 启用流导出器并安装每分钟运行
`/usr/bin/netifyd-collector` 的 cron 任务。脚本接受：

```
/usr/bin/netifyd-collector-setup [unix|tcp] [路径或主机[:端口]]
```

示例：

```
/usr/bin/netifyd-collector-setup unix /tmp/netifyd-flows.json
/usr/bin/netifyd-collector-setup tcp 127.0.0.1:9501
```

每次调用更新 `/etc/config/secubox-netifyd`，写入 `/etc/netifyd.d/secubox-sink.conf`，
创建 cron 条目（`* * * * * /usr/bin/netifyd-collector`），并重启 `netifyd`。

## 许可证

MIT License - Copyright (C) 2025 CyberMind.fr

## 链接

- [Netifyd 官方网站](https://www.netify.ai/)
- [Netifyd 文档](https://www.netify.ai/documentation/)
- [OpenWrt 软件包](https://openwrt.org/packages/)
- [SecuBox 项目](https://github.com/CyberMind-FR/secubox-openwrt)

## 致谢

- **eGloo 的 Netify**：深度包检测引擎
- **SecuBox 团队**：LuCI 集成和界面设计
- **OpenWrt 社区**：平台和软件包生态系统
