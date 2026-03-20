# LuCI Netdata 仪表板

[English](README.md) | [Francais](README.fr.md) | 中文

**版本：** 0.4.0
**最后更新：** 2025-12-28
**状态：** 活跃

适用于 OpenWrt 的实时系统监控仪表板，具有受 Netdata 启发的现代响应式界面。

## 功能

### 实时监控
- **CPU 使用率**：带 sparkline 历史的仪表可视化
- **内存**：堆叠条形图显示已用/缓冲/缓存/空闲
- **磁盘**：每个文件系统的使用情况可视化条
- **网络**：接口统计信息和 RX/TX 总计
- **温度**：从热区域读取传感器数据
- **负载平均**：1/5/15 分钟负载显示

### 系统信息
- 主机名、型号、内核版本
- OpenWrt 版本和目标
- 运行时间显示（天/小时/分钟）
- CPU 核心和频率

### 网络详情
- 带 IP 地址的接口列表
- 链路状态和速度检测
- 连接跟踪统计
- 每个接口的流量明细

### 进程监控
- 运行中/休眠进程计数
- 带 PID、用户、命令的进程列表
- 每个进程的内存使用
- 状态可视化

### 现代设计
- 为监控优化的深色主题
- 响应式网格布局
- 动画仪表和 sparkline
- GitHub 风格的调色板

### SecuBox 告警和日志
- 控制栏与新的 `/usr/sbin/secubox-log` 助手集成。
- 启动/重启/停止事件被追加到 `/var/log/seccubox.log`。
- 仪表板卡片显示聚合日志的末尾，并允许从 LuCI 捕获 dmesg/logread 快照。

## 安装

### 先决条件

- OpenWrt 21.02 或更高版本
- LuCI Web 界面

### 从源码安装（推荐）

```bash
# 克隆到 OpenWrt 构建环境
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/YOUR_USERNAME/luci-app-netdata-dashboard.git

# 更新 feeds 并安装
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a

# 在 menuconfig 中启用
make menuconfig
# 导航到：LuCI > Applications > luci-app-netdata-dashboard

# 编译软件包
make package/luci-app-netdata-dashboard/compile V=s
```

### 手动安装

```bash
# 将软件包传输到路由器
scp luci-app-netdata-dashboard_1.0.0-1_all.ipk root@192.168.1.1:/tmp/

# 在路由器上安装
ssh root@192.168.1.1
opkg install /tmp/luci-app-netdata-dashboard_1.0.0-1_all.ipk

# 重启服务
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 使用

安装后，访问仪表板：

**状态 -> Netdata Dashboard**

仪表板有四个选项卡：
1. **实时**：带仪表和 sparkline 的概览
2. **系统**：详细的系统信息
3. **网络**：接口统计
4. **进程**：进程监控

数据每 2 秒自动刷新。

## 架构

```
+-----------------------------------------------------------+
|                    LuCI JavaScript                         |
|              (realtime.js, system.js, 等)                  |
+---------------------------+-------------------------------+
                            | ubus RPC
                            v
+-----------------------------------------------------------+
|                    RPCD 后端                               |
|               /usr/libexec/rpcd/netdata                    |
+---------------------------+-------------------------------+
                            | 读取
                            v
+-----------------------------------------------------------+
|                   Linux Proc/Sys                           |
|     /proc/stat, /proc/meminfo, /sys/class/thermal          |
+-----------------------------------------------------------+
```

## API 端点

| 方法 | 描述 |
|------|------|
| `stats` | 快速概览（CPU%、内存%、负载等） |
| `cpu` | 详细 CPU 统计和每核心数据 |
| `memory` | 内存明细（总计、空闲、缓冲、缓存） |
| `disk` | 文件系统使用和 I/O 统计 |
| `network` | 接口统计和连接跟踪 |
| `processes` | 进程列表和计数 |
| `sensors` | 温度传感器读数 |
| `system` | 系统信息（主机名、内核、运行时间） |

## 自定义

### 修改刷新率

在视图文件中编辑轮询间隔：

```javascript
// 在 realtime.js 中
poll.add(L.bind(this.refresh, this), 2); // 2 秒
```

### 添加自定义指标

扩展 `/usr/libexec/rpcd/netdata` 的 RPCD 后端脚本以添加新数据源。

## 要求

- OpenWrt 21.02+
- LuCI (luci-base)
- 带 luci 模块的 rpcd

## 依赖

- `luci-base`
- `luci-lib-jsonc`
- `rpcd`
- `rpcd-mod-luci`

## 贡献

欢迎贡献！请随时提交问题和拉取请求。

1. Fork 仓库
2. 创建您的功能分支（`git checkout -b feature/amazing-feature`）
3. 提交您的更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开 Pull Request

## 许可证

本项目根据 Apache License 2.0 许可 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 致谢

- 灵感来自 [Netdata](https://netdata.cloud/)
- 为 [OpenWrt](https://openwrt.org/) 构建
- 由 [Gandalf @ CyberMind.fr](https://cybermind.fr) 开发

## 相关项目

- [luci-app-statistics](https://github.com/openwrt/luci/tree/master/applications/luci-app-statistics) - 基于 collectd 的统计
- [Netdata](https://github.com/netdata/netdata) - 完整 Netdata 代理（仅 x86）

---

为 OpenWrt 社区用心打造
