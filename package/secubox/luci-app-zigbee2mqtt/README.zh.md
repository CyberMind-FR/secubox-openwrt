# LuCI 应用 - Zigbee2MQTT

[English](README.md) | [Francais](README.fr.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

用于管理 `secubox-app-zigbee2mqtt` 提供的基于 Docker 的 Zigbee2MQTT 服务的 LuCI 界面。

## 功能

- 显示服务/容器状态、启用状态和快速操作（启动/停止/重启/更新）。
- 通过 LuCI 按钮运行先决条件检查和完整的 Docker 安装（dockerd/containerd/镜像拉取）。
- 提供表单编辑 `/etc/config/zigbee2mqtt`（串口、MQTT 主机、凭据、基础主题、前端端口、通道、数据路径、docker 镜像、时区）。
- 直接在 LuCI 中流式传输 Docker 日志。
- 使用 SecuBox 设计系统和 RPCD 后端（`luci.zigbee2mqtt`）。

## 要求

- 已安装 `secubox-app-zigbee2mqtt` 包（提供 CLI + procd 服务）。
- 路由器上可用的 Docker 运行时（`dockerd`、`docker`、`containerd`）。
- 已连接的 Zigbee 协调器（如 `/dev/ttyACM0`）。

## 安装

```sh
opkg update
opkg install secubox-app-zigbee2mqtt luci-app-zigbee2mqtt
```

通过 LuCI 访问：**服务 -> SecuBox -> Zigbee2MQTT**。

## 文件

| 路径 | 用途 |
|------|------|
| `htdocs/luci-static/resources/view/zigbee2mqtt/overview.js` | 主 LuCI 视图。 |
| `htdocs/luci-static/resources/zigbee2mqtt/api.js` | RPC 绑定。 |
| `root/usr/libexec/rpcd/luci.zigbee2mqtt` | 与 UCI 和 `zigbee2mqttctl` 交互的 RPC 后端。 |
| `root/usr/share/luci/menu.d/luci-app-zigbee2mqtt.json` | 菜单入口。 |
| `root/usr/share/rpcd/acl.d/luci-app-zigbee2mqtt.json` | 默认 ACL。 |

## RPC 方法

- `status` - 返回 UCI 配置、服务启用/运行状态、Docker 容器列表。
- `apply` - 更新 UCI 字段、提交并重启服务。
- `logs` - 显示容器日志。
- `control` - 通过 init 脚本启动/停止/重启服务。
- `update` - 拉取最新镜像并重启。

## 开发说明

- 遵循 SecuBox 设计规范（参见 `DOCS/DEVELOPMENT-GUIDELINES.md`）。
- 保持 RPC 文件名与 ubus 对象名一致（`luci.zigbee2mqtt`）。
- 使用 `./secubox-tools/validate-modules.sh` 进行验证。

## 文档

- 部署指南：[`docs/embedded/zigbee2mqtt-docker.md`](../docs/embedded/zigbee2mqtt-docker.md)
- CLI 助手（`zigbee2mqttctl`）由 `secubox-app-zigbee2mqtt` 提供。
