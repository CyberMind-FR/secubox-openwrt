# SecuBox LXC 框架（预览）

> **Languages:** [English](../../DOCS/embedded/lxc-framework.md) | [Francais](../../DOCS-fr/embedded/lxc-framework.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

本文档记录了第 8 步中添加的基础 LXC 工具。这是未来打包为 LXC 容器的"SecuBox 应用"（例如 Lyrion）的基础，并说明了组合的 CLI/UCI 工作流程。

---

## 组件

1. **UCI 配置：** `/etc/config/lxcapps`（每个容器一个部分）。
2. **存储根目录：** `/srv/lxc/<name>/`（rootfs、config、logs）。
3. **模板：** `/usr/share/secubox/lxc/templates/`（脚本/tarball；默认为 `debian`）。
4. **CLI 助手：** `secubox-tools/lxc/secubox-lxc`（安装到 `/usr/sbin/secubox-lxc`）。

`secubox-lxc` 需要标准的 OpenWrt LXC 软件包，并使用与 BusyBox 兼容的语法。

---

## CLI 使用

```bash
secubox-lxc list        # 显示已定义的容器
secubox-lxc create lyrion --bridge br-dmz --ip 192.168.50.10
secubox-lxc start lyrion
secubox-lxc stop lyrion
secubox-lxc status lyrion
secubox-lxc delete lyrion
```

每次 `create` 调用都会在 `/srv/lxc/<name>` 下创建容器目录，并在 `/etc/config/lxcapps` 中写入相应的 `config container '<name>'` 部分。这使其可被未来的 LuCI 集成发现。

---

## UCI 模式

```uci
config container 'lyrion'
    option bridge 'br-dmz'
    option ip '192.168.50.10'
    option gateway '192.168.50.1'
    option dns '1.1.1.1'
    option memory '1024'
```

可以稍后添加额外选项（template、rootfs、自定义脚本）；CLI 已经支持 `--template`、`--memory`、`--bridge`、`--ip`、`--gateway` 和 `--dns` 参数。

---

## 存储和模板

- 默认 rootfs 路径：`/srv/lxc/<name>/rootfs`。
- 模板查找：CLI `--template` 参数 -> `/usr/share/secubox/lxc/templates/<name>` -> 系统 `lxc-create -t debian`。
- Bridge 默认为 `br-lan`；对于 DMZ 容器使用 `--bridge br-dmz`。

---

## 未来工作

- 通过 RPC + LuCI 暴露 `/etc/config/lxcapps`，以便清单/配置文件可以声明 LXC 应用。
- 在 App Store 中与 Docker 应用一起分发 Lyrion 和其他容器模板。
- 重用配置文件系统来自动安装 LXC 依赖项并配置容器。

目前，此工具允许高级用户在 OpenWrt ARM64 上验证 LXC，并为 App Store 提供一致的基础。
