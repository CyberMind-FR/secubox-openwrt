# VHost 管理器与反向代理说明

> **Languages:** [English](../../DOCS/embedded/vhost-manager.md) | [Francais](../../DOCS-fr/embedded/vhost-manager.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

SecuBox 包含 `luci-app-vhost-manager`（LuCI 仪表板 + RPC 后端）以及 `scripts/vhostctl.sh` 助手，使应用程序、向导和配置文件可以声明式地在 nginx 后面发布 HTTP 服务，并支持可选的 TLS 和 HTTP 认证。

---

## 前提条件

1. **软件包**：已安装 `luci-app-vhost-manager`（安装 RPCD 脚本 + LuCI 界面）和带 SSL 的 nginx（`nginx-ssl`）。
2. **证书**：通过 `acme.sh` 自动获取 ACME 证书，或使用手动 PEM 文件配合 `tls manual`。
3. **应用程序**：确保上游服务在 localhost 或 LAN 上监听（例如，Zigbee2MQTT 界面在 `http://127.0.0.1:8080`）。
4. **防火墙**：在 WAN 接口上允许入站端口 80/443。

---

## CLI（`scripts/vhostctl.sh`）

此助手操作 `/etc/config/vhosts`，可被未来的向导/App Store 安装程序调用。

```sh
# 列出现有映射
scripts/vhostctl.sh list

# 为 Zigbee2MQTT 界面添加 HTTPS 反向代理
scripts/vhostctl.sh add \
  --domain zigbee.home.lab \
  --upstream http://127.0.0.1:8080 \
  --tls acme \
  --websocket \
  --enable

# 稍后启用/禁用或删除
scripts/vhostctl.sh disable --domain zigbee.home.lab
scripts/vhostctl.sh remove --domain zigbee.home.lab

# 修改后重新加载 nginx
scripts/vhostctl.sh reload
```

选项：

| 选项 | 用途 |
|------|------|
| `--domain` | 公共主机名（必填）。 |
| `--upstream` | 本地服务 URL（`http://127.0.0.1:8080`）。 |
| `--tls off|acme|manual` | TLS 策略。使用 `manual` + `--cert/--key` 配置自定义证书。 |
| `--auth-user/--auth-pass` | 启用 HTTP 基本认证。 |
| `--websocket` | 为 WebSocket 应用添加 `Upgrade` 头。 |
| `--enable` / `--disable` | 启用/禁用而不删除。 |

脚本具有幂等性：使用现有域名运行 `add` 会更新该条目。

---

## LuCI 仪表板

导航至 **服务 -> SecuBox -> VHost 管理器** 可以：
- 查看活跃/禁用的虚拟主机、TLS 状态、证书过期时间。
- 编辑或删除条目、请求 ACME 证书、查看访问日志。
- 使用表单创建条目（域名、上游、TLS、认证、WebSocket）。

LuCI 后端写入相同的 `/etc/config/vhosts` 文件，因此通过 `vhostctl.sh` 所做的更改会立即显示。

---

## 示例：发布 Zigbee2MQTT

1. 安装 Zigbee2MQTT（Docker）并确认界面在端口 8080 上监听（参见 `docs/embedded/zigbee2mqtt-docker.md`）。
2. 将其映射到 HTTPS 后面：
   ```sh
   scripts/vhostctl.sh add \
     --domain zigbee.secubox.local \
     --upstream http://127.0.0.1:8080 \
     --tls acme \
     --websocket
   scripts/vhostctl.sh reload
   ```
3. （可选）使用 LuCI 请求证书并监控日志。

---

## DMZ 模式 + VHost 工作流

启用新的 **路由器 + DMZ** 网络模式（管理 -> SecuBox -> 网络 -> 模式 -> DMZ）时：

1. 将 `eth2`（或其他物理端口）分配为 DMZ 接口，并为其分配子网，如 `192.168.50.1/24`。
2. 应用该模式；后端会创建一个专用防火墙区域（`dmz`），仅转发到 WAN。
3. 将服务器（如 Lyrion、Zigbee2MQTT 界面）连接到 DMZ 端口，使其可以访问互联网但无法访问 LAN。
4. 使用 `scripts/vhostctl.sh add ... --upstream http://192.168.50.10:32400` 通过带 TLS 的 nginx 暴露 DMZ 服务。

回滚只需一键：在 2 分钟窗口内使用网络模式的"确认/回滚"对话框自动恢复先前的配置。

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| `scripts/vhostctl.sh add ...` 报错 "Unknown option" | 确保使用 busybox `sh`（`/bin/sh`）。 |
| ACME 证书缺失 | 确认已安装 `acme.sh`，域名解析到路由器，80/443 端口可访问。 |
| 502/504 错误 | 检查上游服务、防火墙，或将 `--upstream` 改为 LAN IP。 |
| TLS 手动模式失败 | 提供 PEM 文件的完整路径并验证权限。 |
| 更改不可见 | 运行 `scripts/vhostctl.sh reload` 或 `ubus call luci.vhost-manager reload_nginx`。 |

---

## 自动化说明

- 向导/App Store 可以调用 `scripts/vhostctl.sh` 在安装服务时注册它们。
- 配置文件可以保留声明式清单（域名 -> 上游）并在切换模式时调用 `vhostctl.sh add/remove`。
- `/etc/config/vhosts` 仍然是唯一的事实来源，由 LuCI 应用和 RPC 后端使用。
