# LuCI nDPId 仪表板

[English](README.md) | [Francais](README.fr.md) | 中文

用于 nDPId 深度包检测的 LuCI Web 界面 -- 实时流量分析和协议检测。

## 安装

```bash
opkg install luci-app-ndpid
```

## 访问

LuCI > SecuBox > nDPId 智能分析

## 选项卡

- **仪表板** -- 实时流量统计和协议分布
- **流** -- 带检测到的应用协议的活动网络流
- **设置** -- nDPId 守护进程配置

## 辅助脚本

- `ndpid-compat` -- nDPId 集成的兼容层
- `ndpid-flow-actions` -- 流事件处理和操作
- `ndpid-collector` -- 流量数据收集和聚合

## RPCD 方法

服务：`luci.ndpid`

## 依赖

- `luci-base`
- `ndpid`
- `socat`
- `jq`

## 许可证

Apache-2.0
