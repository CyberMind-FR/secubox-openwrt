# luci-app-domoticz

[English](README.md) | [Francais](README.fr.md) | 中文

用于在 SecuBox 上管理 Domoticz 家庭自动化平台的 LuCI Web 界面。

## 安装

```bash
opkg install luci-app-domoticz
```

需要 `secubox-app-domoticz`（作为依赖项安装）。

## 功能

- **服务状态**：容器状态、LXC 可用性、内存/磁盘使用情况、USB 设备
- **IoT 集成**：Mosquitto broker 状态、Zigbee2MQTT 状态、MQTT 桥接配置
- **MQTT 自动设置**：一键安装 Mosquitto 和配置 broker
- **网络**：HAProxy 反向代理集成、WAN 访问控制、域名配置
- **Mesh P2P**：在 SecuBox P2P mesh 中注册 Domoticz 以实现多节点发现
- **操作**：安装、启动、停止、重启、更新、备份、卸载
- **日志**：实时容器日志查看器

## RPCD 方法

| 方法 | 参数 | 描述 |
|------|------|------|
| `status` | - | 容器、MQTT、Z2M、HAProxy、mesh 状态 |
| `start` | - | 启动 Domoticz 服务 |
| `stop` | - | 停止 Domoticz 服务 |
| `restart` | - | 重启 Domoticz 服务 |
| `install` | - | 创建 LXC 容器并下载 Domoticz |
| `uninstall` | - | 删除容器（保留数据） |
| `update` | - | 下载最新版 Domoticz 并重启 |
| `configure_mqtt` | - | 自动配置 Mosquitto 和 MQTT 桥接 |
| `configure_haproxy` | - | 注册 HAProxy 虚拟主机 |
| `backup` | - | 创建数据备份 |
| `restore` | path | 从备份文件恢复 |
| `logs` | lines | 获取容器日志 |

## 菜单位置

服务 > Domoticz

## 文件

- `/usr/libexec/rpcd/luci.domoticz` - RPCD 处理程序
- `/usr/share/rpcd/acl.d/luci-app-domoticz.json` - ACL 权限
- `/usr/share/luci/menu.d/luci-app-domoticz.json` - 菜单入口
- `/www/luci-static/resources/view/domoticz/overview.js` - LuCI 视图

## 依赖

- `secubox-app-domoticz`

## 许可证

Apache-2.0
