# SecuBox 模块验证指南

🌐 **语言：** [English](../docs/validation-guide.md) | [Français](../docs-fr/validation-guide.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

> **📚 完整参考：**
> 这是一份详细的验证指南。快速命令请参阅 [QUICK-START.md](quick-start.md)
>
> **相关文档：**
> - 完整指南：[DEVELOPMENT-GUIDELINES.md §8](development-guidelines.md#validation-checklist)
> - 提交前检查清单：[DEVELOPMENT-GUIDELINES.md §8.1](development-guidelines.md#pre-commit-checklist)
> - 部署后检查清单：[DEVELOPMENT-GUIDELINES.md §8.3](development-guidelines.md#post-deploy-checklist)
> - 权限指南：[PERMISSIONS-GUIDE.md](permissions-guide.md)
> - 自动化简报：[CODEX.md](codex.md)

---

## 另请参阅

- **快速命令：** [QUICK-START.md](quick-start.md)
- **权限参考：** [PERMISSIONS-GUIDE.md](permissions-guide.md)
- **自动化防护措施：** [CODEX.md](codex.md)
- **部署程序：** [DEVELOPMENT-GUIDELINES.md §9](development-guidelines.md#deployment-procedures)

本指南说明了在生成期间和 git push 之前对 SecuBox 模块执行的验证检查。

## 概述

SecuBox 使用多层验证方法：

1. **模块生成验证** - 验证新创建/修改的模块
2. **推送前验证** - 如果发现关键问题则阻止 git push
3. **运行时验证** - 对已部署模块的持续检查

## 验证工具

### 1. validate-module-generation.sh

在生成期间/之后对单个模块进行综合验证。

**用法：**
```bash
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache
```

**执行的检查：**
- ✅ Makefile 的完整性和正确性
- ✅ RPCD 脚本命名约定（必须使用 `luci.` 前缀）
- ✅ RPCD 脚本可执行权限
- ✅ RPCD 脚本结构（list/call 处理程序）
- ✅ ACL 文件 JSON 有效性
- ✅ ACL 权限覆盖 RPCD 方法
- ✅ 菜单文件 JSON 有效性
- ✅ 菜单路径匹配视图文件位置
- ✅ JavaScript 视图文件存在
- ✅ JavaScript 严格模式使用
- ✅ RPC 方法调用匹配 RPCD 方法
- ✅ ubus 对象名称匹配 RPCD 脚本名称
- ✅ UCI 配置有效性（如果存在）
- ✅ 安全扫描（硬编码凭据、危险命令）
- ✅ 文档存在

**退出代码：**
- `0` - 所有检查通过
- `1` - 发现严重错误（模块不应部署）

### 2. pre-push-validation.sh

在允许 git push 之前验证所有模块。

**用法：**
```bash
# 自动（通过 git hook）：
git push  # 验证自动运行

# 手动：
./secubox-tools/pre-push-validation.sh
```

**执行的检查：**
- ✅ Git 暂存更改检查
- ✅ 所有模块的 RPCD 命名约定
- ✅ 所有模块的菜单路径验证
- ✅ JSON 语法验证
- ✅ RPCD 可执行权限
- ✅ ACL 方法覆盖
- ✅ Makefile 验证
- ✅ 安全扫描
- ✅ 修改模块的完整模块验证

**退出代码：**
- `0` - 允许推送
- `1` - 阻止推送（严重错误）

### 3. validate-modules.sh

所有模块的快速验证（现有工具）。

**用法：**
```bash
./secubox-tools/validate-modules.sh
```

详情请参阅 `secubox-tools/README.md`。

## 安装 Git Hooks

启用 git push 前的自动验证：

```bash
./secubox-tools/install-git-hooks.sh
```

这将创建从 `.git/hooks/pre-push` 到 `secubox-tools/pre-push-validation.sh` 的符号链接。

## 关键命名约定

### 1. RPCD 脚本必须匹配 ubus 对象

**规则：** RPCD 脚本文件名必须与 JavaScript 中声明的 ubus 对象名称完全匹配。

**原因：** LuCI 的 RPC 系统根据文件名查找 RPCD 脚本。如果名称不匹配，您会得到：
- `RPC call failed with error -32000: Object not found`
- `Command failed: Method not found`

**示例：**

```javascript
// JavaScript (htdocs/luci-static/resources/view/cdn-cache/overview.js)
var callStatus = rpc.declare({
    object: 'luci.cdn-cache',  // ← 必须匹配 RPCD 文件名
    method: 'status'
});
```

```bash
# RPCD 脚本文件名必须是：
root/usr/libexec/rpcd/luci.cdn-cache  # ← 精确为 'luci.cdn-cache'
```

**常见错误：**
- ❌ `root/usr/libexec/rpcd/cdn-cache`（缺少 `luci.` 前缀）
- ❌ `root/usr/libexec/rpcd/luci-cdn-cache`（使用短横线而非点号）
- ❌ `root/usr/libexec/rpcd/cdn_cache`（使用下划线）

**验证：**
```bash
# 检查命名：
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache

# 查找：
# ✓ RPCD script follows naming convention (luci.* prefix)
# ✓ CRITICAL: RPCD script name matches ACL ubus object
```

### 2. 菜单路径必须匹配视图文件位置

**规则：** 菜单 JSON 的 `path` 条目必须对应实际的视图文件路径。

**原因：** LuCI 根据菜单中的路径加载视图。错误的路径 = HTTP 404。

**示例：**

```json
// 菜单 (root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json)
{
    "action": {
        "type": "view",
        "path": "netifyd-dashboard/overview"  // ← 必须匹配文件位置
    }
}
```

```bash
# 视图文件必须存在于：
htdocs/luci-static/resources/view/netifyd-dashboard/overview.js
#                                  ↑ 与菜单相同的路径 ↑
```

**常见错误：**
- ❌ 菜单：`"path": "netifyd/overview"` 但文件在 `view/netifyd-dashboard/overview.js`
- ❌ 菜单：`"path": "overview"` 但文件在 `view/netifyd-dashboard/overview.js`

**验证：**
```bash
# 检查路径：
./secubox-tools/validate-module-generation.sh luci-app-netifyd-dashboard

# 查找：
# ✓ Menu path 'netifyd-dashboard/overview' → view file EXISTS
```

### 3. 所有 ubus 对象必须使用 `luci.` 前缀

**规则：** 每个 ubus 对象声明必须以 `luci.` 开头

**原因：** LuCI 应用程序的一致命名约定。ACL 系统需要它。

**示例：**

```javascript
// ✅ 正确：
object: 'luci.cdn-cache'
object: 'luci.system-hub'
object: 'luci.wireguard-dashboard'

// ❌ 错误：
object: 'cdn-cache'  // 缺少 luci. 前缀
object: 'systemhub'  // 缺少 luci. 前缀
```

**验证：**
```bash
# 检查约定：
./secubox-tools/validate-modules.sh

# 查找：
# ✓ ubus object 'luci.cdn-cache' follows naming convention
```

## 模块生成检查清单

生成新模块时使用此检查清单：

### 阶段 1：初始生成

- [ ] 创建模块目录：`luci-app-<模块名>/`
- [ ] 生成包含所有必填字段的 Makefile
- [ ] 在 `root/usr/libexec/rpcd/luci.<模块名>` 创建 RPCD 脚本
- [ ] 使 RPCD 脚本可执行：`chmod +x`
- [ ] 向 RPCD 添加 shebang：`#!/bin/sh`
- [ ] 实现 RPCD 方法（list、call、status 等）
- [ ] 创建包含 read/write 权限的 ACL 文件
- [ ] 创建包含正确路径的菜单 JSON
- [ ] 创建视图 JavaScript 文件
- [ ] 向所有 JS 文件添加 `'use strict';`

### 阶段 2：验证

- [ ] 运行模块生成验证：
  ```bash
  ./secubox-tools/validate-module-generation.sh luci-app-<模块名>
  ```

- [ ] 修复所有错误（关键）
- [ ] 查看所有警告（推荐）

### 阶段 3：集成验证

- [ ] 验证 RPCD 脚本名称与 ubus 对象匹配：
  ```bash
  grep -r "object:" luci-app-<模块名>/htdocs --include="*.js"
  ls -la luci-app-<模块名>/root/usr/libexec/rpcd/
  # 名称必须完全匹配
  ```

- [ ] 验证菜单路径与视图文件匹配：
  ```bash
  grep '"path":' luci-app-<模块名>/root/usr/share/luci/menu.d/*.json
  ls -R luci-app-<模块名>/htdocs/luci-static/resources/view/
  # 路径必须对齐
  ```

- [ ] 验证 ACL 权限覆盖所有 RPCD 方法：
  ```bash
  grep 'case "$2"' luci-app-<模块名>/root/usr/libexec/rpcd/*
  grep -A 20 '"ubus":' luci-app-<模块名>/root/usr/share/rpcd/acl.d/*.json
  # 所有方法都应在 ACL 中
  ```

### 阶段 4：提交前

- [ ] 运行综合验证：
  ```bash
  ./secubox-tools/validate-modules.sh
  ```

- [ ] 查看安全扫描结果
- [ ] 检查 JSON 有效性：
  ```bash
  find luci-app-<模块名> -name "*.json" -exec python3 -m json.tool {} \; > /dev/null
  ```

- [ ] 可选：在 RPCD 上运行 shellcheck：
  ```bash
  shellcheck luci-app-<模块名>/root/usr/libexec/rpcd/*
  ```

### 阶段 5：Git 提交

- [ ] 暂存更改：
  ```bash
  git add luci-app-<模块名>
  ```

- [ ] 使用描述性消息提交：
  ```bash
  git commit -m "feat: implement <模块名> module

  - Add RPCD backend with methods: status, get_*, set_*
  - Create views for overview, settings, etc.
  - Configure ACL permissions
  - Add menu entries

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
  ```

- [ ] 推送（验证自动运行）：
  ```bash
  git push
  ```

## 常见验证错误及修复

### 错误：RPCD 脚本名称与 ubus 对象不匹配

```
✗ ERROR: luci-app-cdn-cache: RPCD script 'cdn-cache' does NOT match ubus object 'luci.cdn-cache'
```

**修复：**
```bash
cd luci-app-cdn-cache/root/usr/libexec/rpcd
mv cdn-cache luci.cdn-cache
```

### 错误：菜单路径 → 文件未找到

```
✗ ERROR: luci-app-netifyd: Menu path 'netifyd/overview' → file NOT FOUND
Expected: htdocs/luci-static/resources/view/netifyd/overview.js
```

**修复选项 1：** 更新菜单路径以匹配文件：
```bash
# 编辑 root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json
# 更改："path": "netifyd/overview"
# 为：  "path": "netifyd-dashboard/overview"
```

**修复选项 2：** 移动视图文件以匹配菜单：
```bash
mv htdocs/luci-static/resources/view/netifyd-dashboard \
   htdocs/luci-static/resources/view/netifyd
```

### 错误：RPCD 脚本不可执行

```
✗ ERROR: luci-app-cdn-cache: luci.cdn-cache is NOT executable
```

**修复：**
```bash
chmod +x luci-app-cdn-cache/root/usr/libexec/rpcd/luci.cdn-cache
```

### 错误：RPCD 中的方法 'get_stats' 未在 ACL 中找到

```
⚠ WARNING: luci-app-cdn-cache: Method 'get_stats' from RPCD not in ACL
```

**修复：**
```bash
# 编辑 root/usr/share/rpcd/acl.d/luci-app-cdn-cache.json
# 将 'get_stats' 添加到 read.ubus 数组：
{
    "luci-app-cdn-cache": {
        "read": {
            "ubus": {
                "luci.cdn-cache": ["status", "get_config", "get_stats"]
                                                           ↑ 在此添加
            }
        }
    }
}
```

### 错误：无效的 JSON 语法

```
✗ ERROR: luci-app-cdn-cache: acl.d JSON is INVALID - syntax error
```

**修复：**
```bash
# 验证 JSON：
python3 -m json.tool root/usr/share/rpcd/acl.d/luci-app-cdn-cache.json

# 常见问题：
# - 数组元素之间缺少逗号
# - 最后一个元素后有尾随逗号
# - 字符串中有未转义的引号
```

## 绕过验证（不推荐）

在极少数情况下，您可能需要绕过验证：

```bash
# 跳过推送前验证：
git push --no-verify

# 跳过模块生成验证：
# （无法绕过 - 仅供参考）
```

**⚠️ 警告：** 绕过验证可能导致生产环境中的模块损坏！

## 与 CI/CD 集成

### GitHub Actions

将验证添加到您的工作流：

```yaml
name: Validate Modules

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y python3 shellcheck

      - name: Run module validation
        run: |
          chmod +x secubox-tools/validate-modules.sh
          ./secubox-tools/validate-modules.sh

      - name: Run pre-push validation
        run: |
          chmod +x secubox-tools/pre-push-validation.sh
          ./secubox-tools/pre-push-validation.sh
```

## 最佳实践

1. **提交前始终验证**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<模块>
   ```

2. **安装 git hooks 以实现自动验证**
   ```bash
   ./secubox-tools/install-git-hooks.sh
   ```

3. **立即修复错误** - 不要累积验证债务

4. **查看警告** - 它们通常表示真正的问题

5. **在 OpenWrt 上测试** 后再标记为完成：
   ```bash
   scp bin/packages/*/base/luci-app-*.ipk root@192.168.1.1:/tmp/
   ssh root@192.168.1.1
   opkg install /tmp/luci-app-*.ipk
   /etc/init.d/rpcd restart
   /etc/init.d/uhttpd restart
   ```

6. **在模块 README 中记录模块特定要求**

## 故障排除

### 验证脚本无法运行

```bash
# 确保脚本可执行：
chmod +x secubox-tools/*.sh

# 检查依赖项：
which python3  # 用于 JSON 验证
which shellcheck  # 用于 shell 脚本验证
```

### Git hook 不运行

```bash
# 检查 hook 是否已安装：
ls -la .git/hooks/pre-push

# 重新安装 hooks：
./secubox-tools/install-git-hooks.sh
```

### 验证中的误报

如果验证错误地报告错误，请报告：
- 创建包含完整验证输出的 issue
- 包括模块名称和失败的特定检查
- 我们将更新验证逻辑

## 其他资源

- [CLAUDE.md](claude.md) - 主要项目文档
- [secubox-tools/README.md](https://github.com/CyberMind-FR/secubox-openwrt/blob/master/secubox-tools/README.md) - 工具文档
- [Feature Regeneration Prompts](feature-regeneration-prompts.md) - 模块生成提示

## 支持

如果您遇到验证问题：

1. 检查本指南中的常见错误
2. 使用详细输出运行验证
3. 查看 CLAUDE.md 了解命名约定
4. 在 GitHub 上创建包含验证输出的 issue
