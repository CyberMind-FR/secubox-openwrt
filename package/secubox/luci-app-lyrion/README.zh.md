# LuCI Lyrion 音乐服务器

[English](README.md) | [Francais](README.fr.md) | 中文

Lyrion Music Server（前身为 Logitech Media Server / Squeezebox Server）的管理控制面板。

## 安装

```bash
opkg install luci-app-lyrion
```

## 访问

LuCI 菜单：**服务 -> Lyrion**

## 选项卡

- **概览** -- 服务状态、Web 界面链接、播放器数量
- **设置** -- 端口、数据/媒体路径、内存限制、时区、运行环境

## RPCD 方法

后端：`luci.lyrion`

| 方法 | 描述 |
|------|------|
| `status` | 服务和容器状态 |
| `get_config` | 获取当前配置 |
| `save_config` | 保存配置 |
| `install` | 安装 Lyrion 容器 |
| `start` | 启动 Lyrion |
| `stop` | 停止 Lyrion |
| `restart` | 重启 Lyrion |
| `update` | 更新到最新版本 |
| `logs` | 获取服务日志 |

## 依赖

- `luci-base`

## 许可证

Apache-2.0
