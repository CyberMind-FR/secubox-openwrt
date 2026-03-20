# SecuBox 应用商店与清单

> **Languages:** [English](../../DOCS/embedded/app-store.md) | [Francais](../../DOCS-fr/embedded/app-store.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

本指南概述了"SecuBox Apps"注册表格式和 `secubox-app` CLI 助手。应用商店目前提供 Zigbee2MQTT、Lyrion Media Server 和 Domoticz 的清单，工作流程已准备好支持额外的 Docker/LXC/原生服务。

---

## 清单结构（`plugins/catalog/<app>.json`）

每个应用现在在 `plugins/catalog/<app-id>.json` 下提供标准化的 JSON 清单（旧的 `plugins/<app>/manifest.json` 条目保留以保持向后兼容）。示例（Zigbee2MQTT）：

```json
{
  "id": "zigbee2mqtt",
  "name": "Zigbee2MQTT",
  "category": "home-automation",
  "runtime": "docker",
  "maturity": "stable",
  "description": "Docker 化的 Zigbee 网关，将 Zigbee 协调器与 MQTT 代理连接。",
  "source": {
    "homepage": "https://www.zigbee2mqtt.io/",
    "github": "https://github.com/CyberMind-FR/secubox-openwrt/tree/main/secubox-app-zigbee2mqtt"
  },
  "packages": ["secubox-app-zigbee2mqtt", "luci-app-zigbee2mqtt"],
  "capabilities": ["zigbee-gateway", "mqtt", "docker-runner"],
  "requirements": {
    "arch": ["arm64"],
    "min_ram_mb": 256,
    "min_storage_mb": 512
  },
  "hardware": { "usb": true, "serial": true },
  "network": {
    "inbound_ports": [8080],
    "protocols": ["http", "mqtt"],
    "outbound_only": false
  },
  "privileges": {
    "needs_usb": true,
    "needs_serial": true,
    "needs_net_admin": false
  },
  "ports": [{ "name": "frontend", "protocol": "http", "port": 8080 }],
  "volumes": ["/srv/zigbee2mqtt"],
  "wizard": {
    "uci": { "config": "zigbee2mqtt", "section": "main" },
    "fields": [
      { "id": "serial_port", "label": "串口", "type": "text", "uci_option": "serial_port" },
      { "id": "mqtt_host", "label": "MQTT 主机", "type": "text", "uci_option": "mqtt_host" },
      { "id": "mqtt_username", "label": "MQTT 用户名", "type": "text", "uci_option": "mqtt_username" },
      { "id": "mqtt_password", "label": "MQTT 密码", "type": "password", "uci_option": "mqtt_password" },
      { "id": "base_topic", "label": "基础主题", "type": "text", "uci_option": "base_topic" },
      { "id": "frontend_port", "label": "前端端口", "type": "number", "uci_option": "frontend_port" }
    ]
  },
  "profiles": { "recommended": ["home", "lab", "iot"] },
  "actions": {
    "install": "zigbee2mqttctl install",
    "check": "zigbee2mqttctl check",
    "update": "zigbee2mqttctl update",
    "status": "/etc/init.d/zigbee2mqtt status"
  }
}
```

**必需键**

| 键 | 用途 |
|----|------|
| `id` | CLI 使用的唯一标识符（`secubox-app install <id>`）。 |
| `name` / `description` | 显示元数据。 |
| `category` | 以下之一：home-automation、networking、security、media、monitoring、storage、development、system、iot、radio、misc。 |
| `runtime` | `docker`、`lxc`、`native` 或 `hybrid`。 |
| `packages` | 要安装/删除的 OpenWrt 软件包列表。 |
| `requirements.arch` | 应用/运行时支持的架构。 |
| `requirements.min_ram_mb` / `requirements.min_storage_mb` | 用于界面过滤器的保守资源指导。 |
| `actions.install/update/check/status` | opkg 操作后执行的可选 shell 命令。 |

**可选键**

- `ports`：为应用商店界面记录暴露的服务。
- `volumes`：持久化目录（例如 `/srv/zigbee2mqtt`）。
- `network`：连接提示（协议、入站端口、仅出站标志）。
- `hardware` / `privileges`：向导的 USB/串口/net_admin 提示。
- `wizard`：UCI 目标加上 LuCI 向导使用的声明式字段列表。
- `profiles`：应用类似操作系统的配置文件时预加载的标签（例如 `profiles.recommended` 数组）。
- `capabilities`、`maturity`、`source`、`update.strategy`：用于过滤器芯片和 CLI 说明的额外元数据。

---

## CLI 使用（`secubox-app`）

`secubox-app` 作为独立的 OpenWrt 软件包分发（参见 `package/secubox/secubox-app`），CLI 安装在 `/usr/sbin/secubox-app`。命令：

```bash
# 列出清单
secubox-app list

# 检查原始清单
secubox-app show zigbee2mqtt

# 安装软件包 + 运行安装操作
secubox-app install zigbee2mqtt

# 运行状态命令（如果已定义）
secubox-app status zigbee2mqtt

# 更新或删除
secubox-app update zigbee2mqtt
secubox-app remove zigbee2mqtt

# 验证清单（模式 + 要求）
secubox-app validate
```

环境变量：
- `SECUBOX_PLUGINS_DIR`：覆盖清单目录（默认 `../plugins`）。

CLI 依赖 `opkg` 和 `jsonfilter`，因此在路由器上（或在 OpenWrt SDK 中）运行它。它是幂等的：重新安装已安装的应用只是确认软件包状态并重新运行可选的安装钩子。

---

## 打包的 SecuBox 应用

`secubox-app-*` 软件包提供每个清单背后的运行时组件（init 脚本、助手和默认配置）。它们由 `secubox-tools/local-build.sh` 自动复制到固件构建和 SDK feed 中，因此开发人员获得与 LuCI 向导和 CLI 相同的工件。

| 软件包 | 清单 ID | 用途 |
|--------|---------|------|
| `secubox-app-zigbee2mqtt` | `zigbee2mqtt` | 安装 Docker 运行器 + `zigbee2mqttctl`，暴露启动/日志助手，并分发默认 UCI 配置。 |
| `secubox-app-lyrion` | `lyrion` | 部署 Lyrion Media Server 容器、CLI（`lyrionctl`）和用于 HTTPS 发布的配置文件钩子。 |
| `secubox-app-domoticz` | `domoticz` | 提供 Domoticz Docker 自动化（`domoticzctl`）和向导使用的基本数据/服务布局。 |

所有三个软件包都声明了它们的依赖项（Docker、vhost 管理器等），因此 `secubox-app install <id>` 只需编排操作，无需猜测所需的 feed。

- **清单 QA**：在提交/发布前运行 `secubox-app validate` 以捕获缺失的 ID、运行时或软件包。
- **规格刷新**：`python scripts/refresh-manifest-specs.py` 重新应用共享的架构/最小规格启发式方法，使各个 JSON 文件保持同步。

---

## 未来集成

- LuCI 应用商店页面将使用相同的清单目录来渲染卡片、过滤器和安装按钮。
- 向导将读取 `wizard.steps` 元数据以呈现引导式表单。
- 配置文件可以将清单与特定网络模式捆绑在一起（例如 DMZ + Zigbee2MQTT + Lyrion）。

目前，Zigbee2MQTT 展示了该格式。其他清单应遵循相同的模式，以确保 CLI 和未来界面保持一致。
