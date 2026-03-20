[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# System Hub - 中央控制仪表板

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

OpenWrt 的中央系统控制和监控仪表板，具有全面的系统管理功能。

## 功能特性

### 系统监控
- 实时系统信息（主机名、型号、运行时间、内核版本）
- 带可视化仪表的系统健康指标（CPU、RAM、磁盘）
- CPU 负载平均值（1分钟、5分钟、15分钟）
- 内存使用详细分析
- 所有挂载点的存储监控
- 温度监控（热区域）

### 服务管理
- 列出所有系统服务及其状态
- 启动/停止/重启服务
- 启用/禁用服务自启动
- 实时服务状态（运行中/已停止）
- 批量服务管理

### 系统日志
- 可配置行数的日志查看器（50-1000 行）
- 实时日志过滤
- 关键字搜索
- 终端风格显示

### 备份与恢复
- 创建系统配置备份（tar.gz）
- 下载备份存档
- 从备份恢复配置
- 系统重启功能

## 安装

```bash
opkg update
opkg install luci-app-system-hub
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 依赖项

- **luci-base**：LuCI 框架
- **rpcd**：RPC 守护进程
- **coreutils**：核心工具
- **coreutils-base64**：Base64 编码/解码

## 使用方法

### Web 界面

在 LuCI 中导航到 **系统 -> System Hub**。

#### 概览选项卡
- 系统信息卡片
- 带可视化仪表的健康指标：
  - CPU 负载（基于核心数的百分比）
  - 内存使用（百分比及 MB 详情）
  - 磁盘使用（百分比及大小信息）
- CPU 详情（型号、核心数、负载平均值）
- 温度监控（颜色编码：绿色 < 60C、橙色 < 80C、红色 >= 80C）
- 所有挂载点的存储详情

#### 服务选项卡
- 所有系统服务列表
- 状态指示器（运行中/已停止）
- 自启动状态（已启用/已禁用）
- 操作按钮：
  - 启动（针对已停止的服务）
  - 停止（针对运行中的服务）
  - 重启（针对所有服务）
  - 启用/禁用自启动

#### 系统日志选项卡
- 带过滤控件的日志查看器
- 可配置行数（50、100、200、500、1000）
- 关键字过滤
- 按需刷新日志
- 终端风格显示（黑色背景、绿色文字）

#### 备份与恢复选项卡
- 创建和下载配置备份
- 上传和恢复备份文件
- 带确认的系统重启

### 命令行

#### 获取系统状态

```bash
ubus call luci.system-hub status
```

#### 获取系统信息

```bash
ubus call luci.system-hub get_system_info
```

#### 获取系统健康

```bash
ubus call luci.system-hub get_health
```

#### 列出服务

```bash
ubus call luci.system-hub list_services
```

#### 管理服务

```bash
# 启动服务
ubus call luci.system-hub service_action '{"service":"network","action":"start"}'

# 停止服务
ubus call luci.system-hub service_action '{"service":"network","action":"stop"}'

# 重启服务
ubus call luci.system-hub service_action '{"service":"network","action":"restart"}'
```

#### 获取日志

```bash
# 获取最后 100 行
ubus call luci.system-hub get_logs '{"lines":100,"filter":""}'

# 获取最后 500 行并过滤
ubus call luci.system-hub get_logs '{"lines":500,"filter":"error"}'
```

#### 创建备份

```bash
ubus call luci.system-hub backup_config
```

#### 重启系统

```bash
ubus call luci.system-hub reboot
```

## 仪表可视化

概览页面显示三个圆形仪表：

### CPU 负载仪表
- 百分比根据 1 分钟负载平均值除以核心数计算
- 绿色：< 75%
- 橙色：75-90%
- 红色：> 90%

### 内存仪表
- 已用内存百分比
- 显示"已用 MB / 总 MB"
- 颜色编码与 CPU 相同

### 磁盘仪表
- 根文件系统使用百分比
- 显示"已用 / 总大小"
- 颜色编码与 CPU 相同

## 安全注意事项

- 服务操作需要 ACL 中的写入权限
- 备份数据包含敏感配置
- 重启操作不可逆
- 日志过滤不会清理日志中的敏感数据

## 故障排除

### 服务不显示

检查服务是否存在：
```bash
ls /etc/init.d/
```

### 健康指标不准确

验证系统文件是否可访问：
```bash
cat /proc/meminfo
cat /proc/loadavg
df -h
```

### 备份创建失败

确保 sysupgrade 可用：
```bash
which sysupgrade
```

### 温度不显示

检查热区域：
```bash
ls /sys/class/thermal/thermal_zone*/temp
```

## 许可证

Apache-2.0

## 维护者

CyberMind <contact@cybermind.fr>
