[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox 网络诊断

OpenWrt 实时 DSA 交换机端口统计和网络错误监控仪表板。

## 功能特性

- **交换机端口状态面板**：DSA 交换机端口的可视化表示，带有链路状态、速度和双工指示器
- **错误监控部件**：带警报阈值的实时错误跟踪（正常/警告/严重）
- **接口详情**：完整的 ethtool 输出、驱动统计和内核消息日志
- **自动刷新**：可配置的轮询间隔（5s、10s、30s 或手动）
- **响应式设计**：适配移动端的界面，带 SecuBox 暗色主题

## 支持的硬件

- MOCHAbin（Marvell Armada 8040）带 mvpp2 驱动
- 任何带 DSA 交换机拓扑的 OpenWrt 设备
- 独立以太网接口（非 DSA）

## 安装

```bash
# 使用 SDK 编译
cd secubox-tools/sdk
make package/luci-app-secubox-netdiag/compile V=s

# 在设备上安装
opkg install luci-app-secubox-netdiag_*.ipk
```

## 依赖项

- luci-base
- ethtool

## 菜单位置

SecuBox > 网络诊断

## 监控的错误指标

| 指标 | 描述 |
|------|------|
| rx_crc_errors | CRC/FCS 校验和错误 |
| rx_frame_errors | 帧错误 |
| rx_fifo_errors | FIFO 溢出错误 |
| rx_missed_errors | 丢失的数据包（缓冲区满） |
| tx_aborted_errors | TX 中止 |
| tx_carrier_errors | 载波检测错误 |
| collisions | 以太网冲突 |
| rx_dropped | 接收丢弃 |
| tx_dropped | 发送丢弃 |

## 警报阈值

| 级别 | 条件 | 指示器 |
|------|------|--------|
| 正常 | 0 错误/分钟 | 绿色 |
| 警告 | 1-10 错误/分钟 | 黄色 |
| 严重 | >10 错误/分钟 | 红色（脉冲） |

## RPCD API

### 方法

```
luci.secubox-netdiag
  get_switch_status   - 所有接口及 DSA 拓扑
  get_interface_details { interface: string } - 完整 ethtool/dmesg 详情
  get_error_history { interface: string, minutes: int } - 错误时间线
  get_topology - DSA 交换机结构
  clear_counters { interface: string } - 清除错误历史
```

### ubus 调用示例

```bash
ubus call luci.secubox-netdiag get_switch_status
```

## 数据来源

- `/sys/class/net/*/statistics/*` - 内核统计
- `/sys/class/net/*/carrier` - 链路状态
- `/sys/class/net/*/master` - DSA 拓扑
- `ethtool <iface>` - 链路参数
- `ethtool -S <iface>` - 驱动统计
- `dmesg` - 内核消息

## UI 组件

### 端口卡片
```
+----------+
|  eth0    |
| [*] Up   |
| 1G FD    |
| OK       |
+----------+
```

### 错误监控器
```
eth2 - CRC 错误（最近 5 分钟）
[迷你图] 123/分钟（严重）
```

## 文件

```
luci-app-secubox-netdiag/
  Makefile
  htdocs/luci-static/resources/
    view/secubox-netdiag/
      overview.js          # 主 LuCI 视图
    secubox-netdiag/
      netdiag.css          # SecuBox 主题样式
  root/usr/
    libexec/rpcd/
      luci.secubox-netdiag # RPCD 后端脚本
    share/
      luci/menu.d/
        luci-app-secubox-netdiag.json
      rpcd/acl.d/
        luci-app-secubox-netdiag.json
```

## 截图

### 主仪表板
- DSA 交换机端口网格布局
- 独立接口在下方
- 错误监控器在底部

### 端口详情模态框
- 链路状态（速度、双工、自动协商）
- 流量统计（字节、数据包）
- 带增量的错误计数器
- 最近内核消息
- 清除历史/导出日志按钮

## 许可证

MIT
