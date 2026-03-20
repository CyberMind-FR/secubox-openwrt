# OpenWrt ARM64 上的 Docker Zigbee2MQTT

> **Languages:** [English](../../DOCS/embedded/zigbee2mqtt-docker.md) | [Francais](../../DOCS-fr/embedded/zigbee2mqtt-docker.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

本指南说明如何在 OpenWrt ARM64 目标上部署 SecuBox Zigbee2MQTT "应用"（基于 Docker）。它使用 `secubox-app-zigbee2mqtt` 软件包（安装程序、CLI、procd 服务）以及 LuCI 前端（`luci-app-zigbee2mqtt`）。

---

## 前提条件

1. **OpenWrt 24.10.x ARM64**（ESPRESSObin、MOCHAbin、RPi4 等），具有 >= 256 MB 可用存储空间（Docker 镜像 + 数据目录）。
2. **内核功能**：cgroups（`/sys/fs/cgroup`）、USB CDC ACM（`kmod-usb-acm`）。
3. **硬件**：Zigbee 协调器呈现为 `/dev/ttyACM0`（例如 SONOFF ZBDongle-E/MG21）。
4. **网络**：可访问的 MQTT 代理（本地 Mosquitto 或远程 `mqtt://host:1883`）。
5. **软件包源**：`docker`、`dockerd`、`containerd` 可用（`opkg update`）。

---

## 安装步骤

```sh
opkg update
opkg install secubox-app-zigbee2mqtt luci-app-zigbee2mqtt
```

1. **运行前提条件安装程序**（检查存储、cgroups、USB，安装 Docker，拉取镜像，启用服务）：
   ```sh
   zigbee2mqttctl install
   ```
2. **启动服务**：
   ```sh
   /etc/init.d/zigbee2mqtt start   # 通过安装程序自动启用
   ```
3. **LuCI 配置**（可选的界面流程）：服务 -> SecuBox -> Zigbee2MQTT。调整串口、MQTT 主机/凭据、基础主题等，然后点击"应用"。

安装程序将持久化数据写入 `/srv/zigbee2mqtt/data`（配置 + 数据库），并默认在端口 `8080` 上暴露 Zigbee2MQTT Web 界面。

---

## 命令行参考（`/usr/sbin/zigbee2mqttctl`）

| 命令 | 描述 |
|------|------|
| `install` | 完整的前提条件设置（Docker 软件包、数据目录、镜像拉取、启用服务）。 |
| `check` | 重新运行前提条件检查（存储、cgroups、USB 模块、串口设备）。 |
| `update` | 拉取最新的 Zigbee2MQTT 镜像并重启已启用的服务。 |
| `status` | 显示 Docker 容器状态（`docker ps` 过滤）。 |
| `logs [-f]` | 流式输出容器的 Docker 日志。 |
| `service-run` / `service-stop` | procd init 脚本使用的内部命令；不用于手动调用。 |

所有命令必须以 root 身份运行。

---

## UCI 配置（`/etc/config/zigbee2mqtt`）

```uci
config zigbee2mqtt 'main'
	option enabled '1'
	option serial_port '/dev/ttyACM0'
	option mqtt_host 'mqtt://127.0.0.1:1883'
	option mqtt_username ''
	option mqtt_password ''
	option base_topic 'zigbee2mqtt'
	option frontend_port '8080'
	option channel '11'
	option image 'ghcr.io/koenkk/zigbee2mqtt:latest'
	option data_path '/srv/zigbee2mqtt'
	option timezone 'UTC'
```

通过 `uci` 或 LuCI 表单编辑；提交更改后自动重启：
```sh
uci set zigbee2mqtt.main.mqtt_host='mqtt://192.168.1.10:1883'
uci commit zigbee2mqtt
/etc/init.d/zigbee2mqtt restart
```

---

## 验证和冒烟测试

- 快速前提条件检查：
  ```sh
  zigbee2mqttctl check
  ```
- 仓库冒烟测试（运行服务启动/停止 + 可选的 MQTT 发布/订阅）：
  ```sh
  ./scripts/smoke_test.sh
  ```
- 诊断包（通用 SecuBox）：
  ```sh
  ./scripts/diagnose.sh
  ```

---

## 故障排除

| 症状 | 解决方案 |
|------|----------|
| `zigbee2mqttctl install` 报告 "/sys/fs/cgroup missing" | 在内核配置中启用 cgroups 或升级到支持 cgroup 的构建版本。 |
| USB 协调器未检测到 | 确保已安装 `kmod-usb-acm`，`cdc_acm` 模块已加载（`lsmod | grep cdc_acm`），设备出现在 `/dev/ttyACM*` 下。重新插入 dongle。 |
| Docker 无法启动 | 检查 `/etc/init.d/dockerd status`。如果 `docker info` 失败，检查 `/var/log/messages` 中的存储驱动错误。 |
| MQTT 认证失败 | 通过 UCI 或 LuCI 设置 `mqtt_username`/`mqtt_password` 并重启服务。 |
| 端口 8080 已被使用 | 在 UCI 中更改 `frontend_port`，提交，重启服务。相应更新 vhost 映射。 |

---

## 卸载/清理

```sh
/etc/init.d/zigbee2mqtt stop
/etc/init.d/zigbee2mqtt disable
docker rm -f secbx-zigbee2mqtt 2>/dev/null
opkg remove luci-app-zigbee2mqtt secubox-app-zigbee2mqtt
rm -rf /srv/zigbee2mqtt
```

---

## 后续步骤

- 使用 `luci-app-vhost-manager` 在 HTTPS 下发布 Zigbee2MQTT 界面（参见 `luci-app-vhost-manager/README.md`）。
- 通过添加引用此安装程序的清单条目与即将推出的 SecuBox App Store 集成。
- 根据项目路线图，在引入这些组件后与配置文件/向导结合使用。
