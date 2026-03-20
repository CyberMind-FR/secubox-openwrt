[English](README.md) | [Francais](README.fr.md) | 中文

# LuCI Glances 仪表板

由 Glances 提供支持的系统监控仪表板，带有嵌入式 Web UI。

## 安装

```bash
opkg install luci-app-glances
```

## 访问

LuCI 菜单：**SecuBox -> 监控 -> Glances**

## 标签页

- **仪表板** -- CPU、内存、磁盘和网络指标一览
- **Web UI** -- 带有 SecuBox 主题的嵌入式 Glances Web 界面
- **设置** -- 监控间隔、警报阈值、服务控制

## RPCD 方法

后端：`luci.glances`

| 方法 | 描述 |
|------|------|
| `get_status` | 服务状态和基本指标 |
| `get_config` | 获取 Glances 配置 |
| `get_monitoring_config` | 获取监控参数 |
| `get_alerts_config` | 获取警报阈值设置 |
| `get_web_url` | 获取 Glances Web UI URL |
| `service_start` | 启动 Glances |
| `service_stop` | 停止 Glances |
| `service_restart` | 重启 Glances |
| `set_config` | 更新配置键 |

## 依赖

- `luci-base`
- `secubox-app-glances`

## 许可证

Apache-2.0
