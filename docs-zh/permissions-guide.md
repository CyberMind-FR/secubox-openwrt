# OpenWrt 软件包权限指南

🌐 **语言：** [English](../docs/permissions-guide.md) | [Français](../docs-fr/permissions-guide.md) | 中文

**版本：** 0.3.1
**最后更新：** 2025-12-28
**状态：** 活跃
**作者：** CyberMind

> **本文档是快速参考指南。**
> 完整的部署流程请参阅 [DEVELOPMENT-GUIDELINES.md §9](development-guidelines.md#deployment-procedures)
>
> **相关文档：**
> - 完整指南：[DEVELOPMENT-GUIDELINES.md](development-guidelines.md)
> - 快速参考：[QUICK-START.md](quick-start.md)
> - 验证工具：[VALIDATION-GUIDE.md](validation-guide.md)
> - 自动化简报：[CODEX.md](codex.md)

---

## 另请参阅

- **部署流程：** [DEVELOPMENT-GUIDELINES.md §9](development-guidelines.md#deployment-procedures)
- **快速规则与命令：** [QUICK-START.md](quick-start.md)
- **验证清单：** [VALIDATION-GUIDE.md](validation-guide.md)
- **自动化标准：** [CODEX.md](codex.md)

## 目标

确保所有 SecuBox 软件包文件在安装时就具有**正确的权限**，无需手动修正。

## 所需权限

### 可执行文件 (755)

这些文件**必须**具有执行权限：

```
-rwxr-xr-x (755)
```

**文件列表：**
- `/usr/libexec/rpcd/luci.*` - RPCD 后端脚本
- `/usr/libexec/secubox/*.sh` - 实用脚本
- `/etc/init.d/*` - 初始化脚本
- `/etc/uci-defaults/*` - 初始配置脚本

### 非可执行文件 (644)

这些文件**不应该**具有执行权限：

```
-rw-r--r-- (644)
```

**文件列表：**
- `/www/luci-static/resources/**/*.js` - JavaScript 文件
- `/www/luci-static/resources/**/*.css` - CSS 文件
- `/usr/share/rpcd/acl.d/*.json` - ACL 权限文件
- `/usr/share/luci/menu.d/*.json` - 菜单定义文件
- `/etc/config/*` - UCI 配置文件

## Makefile 配置

### 推荐方法：PKG_FILE_MODES

OpenWrt 支持 `PKG_FILE_MODES` 变量，用于在软件包安装时定义文件权限。

**语法：**
```makefile
PKG_FILE_MODES:=/path/to/file:permissions
```

**完整示例：**
```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-example
PKG_VERSION:=0.3.1
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - Example Module
LUCI_DESCRIPTION:=Example SecuBox module
LUCI_DEPENDS:=+luci-base +rpcd
LUCI_PKGARCH:=all

# 文件权限（RPCD 脚本必须可执行）
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
```

### 多个可执行文件

如果有多个可执行文件：

```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755 \
	/usr/libexec/example/helper.sh:755 \
	/etc/init.d/example:755
```

**注意：** 使用 `\` 继续到下一行。

## 带有 PKG_FILE_MODES 的 SecuBox 模块

### luci-app-secubox
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.secubox:755 \
	/usr/libexec/secubox/fix-permissions.sh:755
```

### luci-app-system-hub
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:755
```

### luci-app-network-modes
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.network-modes:755
```

## 验证

### 开发时

部署软件包之前，验证权限：

```bash
# 检查 RPCD 脚本
ls -l root/usr/libexec/rpcd/luci.*

# 检查辅助脚本
ls -l root/usr/libexec/*/

# 检查 Web 文件
find root/www -type f -name "*.js" -o -name "*.css" | xargs ls -l
```

### 软件包安装后

验证路由器上的权限是否正确：

```bash
# RPCD 脚本应为 755
ls -l /usr/libexec/rpcd/luci.*

# Web 文件应为 644
ls -l /www/luci-static/resources/secubox/*.js
ls -l /www/luci-static/resources/secubox/*.css
```

## 自动验证脚本

`luci-app-secubox` 中包含一个验证脚本：

```bash
# 检查并修复所有权限
/usr/libexec/secubox/fix-permissions.sh

# 通过 ubus
ubus call luci.secubox fix_permissions

# 通过 Web 界面
Dashboard → Quick Actions → "Fix Perms"
```

## 常见错误

### 1. RPCD 脚本不可执行

**症状：**
```bash
ubus call luci.example status
# Command failed: Permission denied
```

**原因：** RPCD 脚本没有 755 权限

**解决方案：**
```makefile
# 在 Makefile 中添加
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755
```

### 2. Web 文件可执行

**症状：** JavaScript/CSS 文件具有 755 权限

**原因：** 错误操作或脚本配置错误

**解决方案：** Web 文件默认为 644，无需在 PKG_FILE_MODES 中指定

### 3. 辅助脚本不可执行

**症状：**
```bash
/usr/libexec/example/helper.sh
# -bash: /usr/libexec/example/helper.sh: Permission denied
```

**解决方案：**
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755 \
	/usr/libexec/example/helper.sh:755
```

## 参考资料

- **LuCI 构建系统：** `$(TOPDIR)/feeds/luci/luci.mk`
- **OpenWrt 软件包构建：** https://openwrt.org/docs/guide-developer/packages
- **PKG_FILE_MODES：** https://openwrt.org/docs/guide-developer/build-system/use-buildsystem#build_system_variables

## 部署前检查清单

创建 `.ipk` 或 `.apk` 软件包之前：

- [ ] 所有 RPCD 脚本在 PKG_FILE_MODES 中设置为 755
- [ ] 所有辅助脚本在 PKG_FILE_MODES 中设置为 755
- [ ] Web 文件（JS/CSS）不在 PKG_FILE_MODES 中（默认为 644）
- [ ] ACL/菜单文件不在 PKG_FILE_MODES 中（默认为 644）
- [ ] Makefile 使用 `include $(TOPDIR)/feeds/luci/luci.mk`
- [ ] PKG_FILE_MODES 定义在 `include $(TOPDIR)/feeds/luci/luci.mk` 之前

## 迁移现有模块

为现有模块添加 PKG_FILE_MODES：

```bash
cd luci-app-mymodule

# 编辑 Makefile
vi Makefile

# 在 'include $(TOPDIR)/feeds/luci/luci.mk' 之前添加
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.mymodule:755

# 重新构建软件包
make package/luci-app-mymodule/clean
make package/luci-app-mymodule/compile
```

---

**维护者：** CyberMind <contact@cybermind.fr>
**许可证：** Apache-2.0
