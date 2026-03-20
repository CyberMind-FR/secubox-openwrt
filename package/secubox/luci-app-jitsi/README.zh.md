# LuCI Jitsi Meet 配置

[English](README.md) | [Francais](README.fr.md) | 中文

自托管 Jitsi Meet 的视频会议服务管理。

## 安装

```bash
opkg install luci-app-jitsi
```

## 访问

LuCI 菜单：**服务 -> Jitsi Meet**

## 功能

- Docker 容器编排（web、prosody、jicofo、jvb）
- 通过 JVB API 获取会议和参与者统计
- 认证会议的用户管理
- 服务日志查看器

## RPCD 方法

后端：`luci.jitsi`

| 方法 | 描述 |
|------|------|
| `status` | 容器状态、会议/参与者统计 |
| `start` | 启动 Jitsi 容器 |
| `stop` | 停止 Jitsi 容器 |
| `restart` | 重启所有容器 |
| `install` | 安装 Jitsi 套件 |
| `generate_config` | 生成 Jitsi 配置文件 |
| `add_user` | 添加认证用户 |
| `remove_user` | 删除用户 |
| `list_users` | 列出注册用户 |
| `logs` | 获取服务日志 |

## 依赖

- `secubox-app-jitsi`

## 许可证

Apache-2.0
