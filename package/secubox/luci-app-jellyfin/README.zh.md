# LuCI Jellyfin 控制面板

[English](README.md) | [Francais](README.fr.md) | 中文

用于管理 Jellyfin 媒体服务器的 Web 界面，具有实时状态、容器控制和集成管理功能。

## 安装

```bash
opkg install luci-app-jellyfin
```

## 访问

LuCI 菜单：**服务 -> Jellyfin**

## 功能模块

- **服务状态** -- 容器状态（运行中/已停止/未安装）、运行时间、Docker 健康状态、磁盘使用情况
- **集成状态** -- HAProxy（已禁用/待配置/已配置）、Mesh P2P、WAN 防火墙
- **操作** -- 安装、启动、停止、重启、更新、备份、卸载、打开 Web 界面
- **配置** -- 端口、镜像、数据路径、时区、域名、HAProxy SSL、媒体路径、GPU 转码、mesh 开关
- **日志** -- 实时容器日志查看器（最后 50 行）

## RPCD 方法

后端：`luci.jellyfin`

| 方法 | 描述 |
|------|------|
| `status` | 完整的服务状态、配置和集成信息 |
| `start` | 启动 Jellyfin 容器 |
| `stop` | 停止 Jellyfin 容器 |
| `restart` | 重启 Jellyfin 容器 |
| `install` | 拉取镜像并创建容器 |
| `uninstall` | 删除容器和数据 |
| `update` | 拉取最新镜像并重新创建 |
| `configure_haproxy` | 注册 HAProxy 虚拟主机 |
| `backup` | 创建配置/数据备份 |
| `restore` | 从备份存档恢复 |
| `logs` | 获取容器日志 |

## 依赖

- `luci-base`
- `secubox-app-jellyfin`

## 许可证

Apache-2.0
