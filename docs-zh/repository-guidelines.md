# 仓库指南

🌐 **语言：** [English](../docs/repository-guidelines.md) | [Français](../docs-fr/repository-guidelines.md) | 中文

## 项目结构与模块组织
- LuCI 应用（`luci-app-secubox`、`luci-app-*`）将视图存储在 `htdocs/luci-static/resources` 中，RPC 逻辑存储在 `root/usr/libexec/rpcd` 中；`package/secubox/` 包含这些模块的 SDK 就绪副本。
- `luci-theme-secubox`、`templates/` 和 `plugins/` 提供共享的 CSS、渐变和小部件，应通过 `require secubox/*` 引用而不是复制资源。
- 自动化脚本位于 `secubox-tools/`、`scripts/` 和 `deploy-*.sh` 包装器中，文档位于 `docs/`（MkDocs）和 `DOCS/`（深入探讨）。

## 构建、测试和开发命令
- `./secubox-tools/local-build.sh build <module>` 执行带缓存的 SDK 构建；使用 `make package/<module>/compile V=s` 精确复现 CI。
- `./secubox-tools/validate-modules.sh` 必须在提交前通过；它检查 RPC 命名、菜单路径、权限、JSON 和孤立视图。
- `./secubox-tools/quick-deploy.sh --profile luci-app --src luci-app-secubox` 将 `root/` 和 `htdocs/` 树同步到路由器；添加 `--list-apps` 发现有效 ID 或 `--app <name>` 定位特定应用。
- `./deploy-to-router.sh` 重建 `secubox-core` + `luci-app-secubox-admin`，将最新 IPK 上传到 `$ROUTER_IP`，安装并重启 `rpcd`。

## 代码风格与命名约定
- LuCI 视图使用 ES5：`'use strict';`、分组的 `'require ...'`、制表符缩进以及 `return view.extend({ ... })` + `E('div', ...)` 渲染；将业务逻辑移至 `secubox/api` 等辅助模块。
- 菜单 JSON `"path": "system-hub/overview"` 必须解析到 `htdocs/.../view/system-hub/overview.js`，`root/usr/libexec/rpcd/` 中的 RPC 脚本必须与其 ubus 对象名称匹配，并具有可执行权限（755）。
- 运行 `./secubox-tools/fix-permissions.sh --local` 保持 CSS/JS 文件为 644，保持设计词汇一致（`sh-*`、`sb-*`、Inter/JetBrains 字体、存储在主题文件中的渐变）。

## 测试指南
- 对每个接触点运行 `./secubox-tools/validate-modules.sh` 加上 `jsonlint file.json` 和 `shellcheck root/usr/libexec/rpcd/*`。
- 在硬件上执行 `scripts/smoke_test.sh` 确认 Zigbee2MQTT 服务、容器健康状态和 MQTT。
- 将 `test-direct.js` 或 `test-modules-simple.js` 放入 LuCI 验证菜单连接，然后删除文件并在 PR 中记录所有 `ubus -S call luci.secubox ...` 命令。

## 提交与 Pull Request 指南
- 遵循观察到的历史风格：`type(scope): change`（例如 `fix(luci-app-secubox-admin): add RPC fallback`）。
- PR 必须突出显示受影响的模块，列出运行的验证命令，并为 UI 调整附加截图。
- 链接问题或 TODO 条目，当行为或 API 更改时更新 `docs/` + `DOCS/`，并指出路由器 IP 假设。

## 安全与部署提示
- 推送前运行验证器和 `./secubox-tools/fix-permissions.sh --local` 以避免 HTTP 403，如果不使用 `deploy-to-router.sh`，需重启 `rpcd` 并清除 LuCI 缓存（`rm -f /tmp/luci-*`）。
