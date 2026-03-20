# CLAUDE.md

> **语言:** [English](../docs/claude.md) | [Francais](../docs-fr/claude.md) | 中文

**版本:** 1.0.0
**最后更新:** 2025-12-28
**状态:** 活跃

本文件为 Claude Code (claude.ai/code) 提供处理本仓库代码的指导说明。

## 文档索引

**重要:** 在处理任何代码之前，请查阅以下指南:

1. **[DEVELOPMENT-GUIDELINES.md](development-guidelines.md)** - **完整指南**
   - 设计系统与UI指南（调色板、排版、组件）
   - 架构与命名规范（RPCD、菜单路径、前缀）
   - RPCD与ubus最佳实践（常见错误、解决方案）
   - ACL与权限（模板、验证）
   - JavaScript模式（API模块、视图、事件处理）
   - CSS/样式标准（变量、响应式、深色模式）
   - 常见错误与解决方案（诊断、修复）
   - 验证清单（提交前、部署前、部署后）
   - 部署流程（脚本、回滚、版本控制）

2. **[QUICK-START.md](quick-start.md)** - **快速参考**
   - 关键规则（RPCD命名、菜单路径、权限）
   - 设计系统要点（颜色、字体、类）
   - 常用命令（验证、构建、部署、调试）
   - 快速代码模板（RPCD、View、Headers、Cards）
   - 快速错误修复

3. **CLAUDE.md**（本文件） - **架构与构建**
   - 构建命令（OpenWrt SDK、本地构建）
   - 模块结构（文件、目录）
   - CI/CD工作流
   - 常见技术问题

**必须始终遵守的关键规则:**

1. **RPCD脚本命名:** 文件名 = ubus对象名（`luci.system-hub`）
2. **菜单路径匹配:** 菜单路径 = 视图文件路径（`system-hub/overview.js`）
3. **权限:** RPCD = 755, CSS/JS = 644
   - **自动修复:** `./secubox-tools/fix-permissions.sh --local`（提交前）
   - **远程自动修复:** `./secubox-tools/fix-permissions.sh --remote`（部署后）
4. **验证:** 提交前始终执行 `./secubox-tools/validate-modules.sh`
   - **7项自动检查:** RPCD命名、菜单路径、视图文件、RPCD权限、JSON语法、ubus命名、**htdocs权限**
5. **CSS变量:** 始终使用 `var(--sh-*)`，切勿硬编码颜色
6. **深色模式:** 始终使用 `[data-theme="dark"]` 支持深色模式
7. **排版:** Inter（文本）、JetBrains Mono（数值）
8. **渐变效果:** 使用 `--sh-primary` 到 `--sh-primary-end` 实现渐变

## 项目概述

SecuBox是一套面向OpenWrt的综合安全与网络管理套件。本仓库包含13个LuCI应用包，提供安全监控、网络智能、访问控制、带宽管理和系统管理的仪表板。

## 构建命令

### OpenWrt SDK构建

```bash
# 构建单个软件包
make package/luci-app-<模块名>/compile V=s

# 清理后重新构建软件包
make package/luci-app-<模块名>/clean
make package/luci-app-<模块名>/compile V=s

# 将软件包安装到暂存目录
make package/luci-app-<模块名>/install
```

### 测试软件包

```bash
# 传输到路由器
scp bin/packages/*/base/luci-app-*.ipk root@192.168.1.1:/tmp/

# 在路由器上安装
ssh root@192.168.1.1
opkg install /tmp/luci-app-*.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### 验证

```bash
# 首先修复文件权限（关键）
./secubox-tools/fix-permissions.sh --local

# 运行全面的模块验证（推荐 - 7项检查）
./secubox-tools/validate-modules.sh
# 检查项:
# 1. RPCD脚本名与ubus对象名
# 2. 菜单路径与视图文件位置
# 3. 视图文件有菜单入口
# 4. RPCD脚本权限（755）
# 5. JSON语法验证
# 6. ubus对象命名规范
# 7. htdocs文件权限（CSS/JS为644）

# 验证shell脚本（RPCD后端）
shellcheck luci-app-*/root/usr/libexec/rpcd/*

# 验证JSON文件
find . -name "*.json" -exec jsonlint {} \;

# 运行自动修复工具
./secubox-tools/secubox-repair.sh

# 修复已部署路由器上的权限
./secubox-tools/fix-permissions.sh --remote

# 运行诊断
./secubox-tools/secubox-debug.sh luci-app-<模块名>
```

### 本地构建（复制GitHub Actions）

`local-build.sh`脚本允许您在本地构建和测试软件包，复制GitHub Actions工作流:

```bash
# 验证所有软件包（语法、JSON、shell脚本）
./secubox-tools/local-build.sh validate

# 为x86_64构建所有软件包
./secubox-tools/local-build.sh build

# 构建单个软件包
./secubox-tools/local-build.sh build luci-app-system-hub

# 为特定架构构建
./secubox-tools/local-build.sh build --arch aarch64-cortex-a72

# 完整验证 + 构建
./secubox-tools/local-build.sh full

# 清理构建产物
./secubox-tools/local-build.sh clean
```

支持的架构:
- `x86-64` - PC、虚拟机（默认）
- `aarch64-cortex-a53` - ARM Cortex-A53 (ESPRESSObin)
- `aarch64-cortex-a72` - ARM Cortex-A72 (MOCHAbin, RPi4)
- `aarch64-generic` - 通用ARM64
- `mips-24kc` - MIPS 24Kc (TP-Link)
- `mipsel-24kc` - MIPS LE (Xiaomi, GL.iNet)

脚本自动:
- 下载并缓存OpenWrt SDK
- 配置feeds（packages、luci），使用正确的版本分支
- 将您的软件包复制到SDK
- 构建软件包（25.12+为.apk，旧版本为.ipk）
- 将产物收集到`build/<架构>/`

**软件包格式支持:**
- OpenWrt 25.12+和SNAPSHOT: `.apk`格式（基于Alpine的新包管理器）
- OpenWrt 24.10及更早版本: `.ipk`格式（opkg包管理器）

环境变量:
- `OPENWRT_VERSION` - OpenWrt版本（默认: 24.10.5，也支持: 25.12.0-rc1、23.05.5、SNAPSHOT）
- `SDK_DIR` - SDK目录（默认: ./sdk）
- `BUILD_DIR` - 构建输出目录（默认: ./build）
- `CACHE_DIR` - 下载缓存目录（默认: ./cache）

## 架构

### LuCI软件包结构

所有SecuBox模块遵循标准的LuCI应用结构:

```
luci-app-<模块名>/
├── Makefile                              # OpenWrt软件包定义
├── README.md                             # 模块文档
├── htdocs/luci-static/resources/
│   ├── view/<模块名>/                    # JavaScript UI视图
│   │   ├── overview.js                   # 主仪表板视图
│   │   └── *.js                          # 其他视图
│   └── <模块名>/
│       ├── api.js                        # RPC API客户端模块
│       └── dashboard.css                 # 模块特定样式
└── root/
    ├── etc/config/<模块名>               # UCI配置（可选）
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.<模块名>             # RPCD后端脚本（必须使用luci.前缀！）
        └── share/
            ├── luci/menu.d/              # 菜单JSON定义
            │   └── luci-app-<模块名>.json
            └── rpcd/acl.d/               # ACL权限JSON
                └── luci-app-<模块名>.json
```

### 前后端通信

1. **前端（JavaScript）**: 位于`htdocs/luci-static/resources/`
   - 视图使用LuCI的`form`和`view`类
   - 通过`api.js`模块使用`L.resolveDefault()`进行API调用
   - 来自`ui.js`的UI组件（Dropdown、Checkbox、Combobox等）

2. **后端（RPCD）**: 位于`root/usr/libexec/rpcd/`
   - 实现RPC方法的shell脚本
   - 必须向stdout输出JSON
   - 方法通过ubus调用: `ubus call <模块> <方法>`

3. **菜单定义**: `root/usr/share/luci/menu.d/luci-app-<模块>.json`
   - 定义菜单结构和导航
   - 指定视图路径和依赖

4. **ACL定义**: `root/usr/share/rpcd/acl.d/luci-app-<模块>.json`
   - 定义ubus方法的访问控制
   - 将读/写权限映射到用户组

### 关键命名规范

**重要**: 以下命名规则是模块正常工作的**强制要求**:

#### 1. RPCD脚本必须匹配ubus对象名

RPCD脚本文件名必须与JavaScript中使用的ubus对象名完全匹配:

```javascript
// 在JavaScript中（htdocs/luci-static/resources/view/*/）:
var callStatus = rpc.declare({
    object: 'luci.cdn-cache',  // <- 这个对象名
    method: 'status'
});
```

```bash
# RPCD脚本文件名必须匹配:
root/usr/libexec/rpcd/luci.cdn-cache  # <- 必须正好是'luci.cdn-cache'
```

**常见错误**: 如果名称不匹配，您会收到:
- `RPC call to luci.cdn-cache/status failed with error -32000: Object not found`
- `Command failed: Method not found`

**解决方案**: 所有RPCD脚本必须使用`luci.`前缀:
- 正确: `luci.cdn-cache`、`luci.system-hub`、`luci.wireguard-dashboard`
- 错误: `cdn-cache`、`system-hub`、`wireguard-dashboard`

#### 2. 菜单路径必须匹配视图文件位置

菜单JSON中的路径条目必须与实际的视图文件对应:

```json
// 在menu.d/luci-app-netifyd-dashboard.json中:
{
    "action": {
        "type": "view",
        "path": "netifyd-dashboard/overview"  // <- 必须匹配文件位置
    }
}
```

```bash
# 视图文件必须存在于:
htdocs/luci-static/resources/view/netifyd-dashboard/overview.js
#                                  ↑ 与菜单相同的路径 ↑
```

**常见错误**: 如果路径不匹配:
- `HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'`

**解决方案**: 确保菜单路径与目录结构匹配:
- 正确: 菜单路径`netifyd-dashboard/overview` -> 文件`view/netifyd-dashboard/overview.js`
- 错误: 菜单路径`netifyd/overview` -> 文件`view/netifyd-dashboard/overview.js`

#### 3. ubus对象命名规范

所有ubus对象必须以`luci.`前缀开头:

```javascript
// 正确:
object: 'luci.cdn-cache'
object: 'luci.system-hub'
object: 'luci.wireguard-dashboard'

// 错误:
object: 'cdn-cache'
object: 'systemhub'
```

#### 4. 部署前验证

部署前**始终**运行验证:

```bash
./secubox-tools/validate-modules.sh
```

此脚本检查:
- RPCD脚本名与ubus对象匹配
- 菜单路径与视图文件位置匹配
- 视图文件有对应的菜单入口
- RPCD脚本可执行
- JSON文件语法有效
- ubus对象遵循命名规范

### Makefile结构

每个软件包的Makefile必须定义:
- `PKG_NAME`: 软件包名（必须与目录匹配）
- `PKG_VERSION`: 版本号
- `PKG_RELEASE`: 软件包发布号
- `LUCI_TITLE`: LuCI中显示的标题
- `LUCI_DEPENDS`: 软件包依赖（例如`+luci-base +rpcd`）
- `LUCI_DESCRIPTION`: 简短描述
- `PKG_MAINTAINER`: 维护者姓名和邮箱
- `PKG_LICENSE`: 许可证（通常为Apache-2.0）

Makefile包含LuCI构建系统的`luci.mk`，用于处理安装。

## 常见开发模式

### 创建新模块

1. 复制模板: `cp -r templates/luci-app-template luci-app-新模块`
2. 更新Makefile中的PKG_NAME、LUCI_TITLE等
3. 在`htdocs/`和`root/`下创建目录结构
4. 用shell实现RPCD后端
5. 创建JavaScript视图
6. 定义菜单和ACL的JSON文件

### RPCD后端模式

RPCD后端是shell脚本，它们:
- 解析`$1`获取方法名
- 使用`printf`或`echo`输出有效的JSON
- 使用`case`语句进行方法路由
- 如需要则加载UCI配置: `. /lib/functions.sh`

示例:
```bash
#!/bin/sh
case "$1" in
    list)
        echo '{ "status": {}, "stats": {} }'
        ;;
    call)
        case "$2" in
            status)
                # 输出JSON
                printf '{"running": true, "version": "1.0.0"}\n'
                ;;
        esac
        ;;
esac
```

### JavaScript视图模式

视图扩展`L.view`并实现`load()`和`render()`:

```javascript
'use strict';
'require view';
'require form';
'require <模块>/api as API';

return L.view.extend({
    load: function() {
        return Promise.all([
            API.getStatus(),
            API.getStats()
        ]);
    },

    render: function(data) {
        var m, s, o;
        m = new form.Map('config', _('标题'));
        s = m.section(form.TypedSection, 'section');
        // 添加表单字段...
        return m.render();
    }
});
```

## 模块分类

1. **核心控制**（2个模块）
   - luci-app-secubox: 中央控制台
   - luci-app-system-hub: 系统控制中心

2. **安全与监控**（2个模块）
   - luci-app-crowdsec-dashboard: CrowdSec安全
   - luci-app-netdata-dashboard: 系统监控

3. **网络智能**（2个模块）
   - luci-app-netifyd-dashboard: 深度包检测
   - luci-app-network-modes: 网络模式配置

4. **VPN与访问控制**（3个模块）
   - luci-app-wireguard-dashboard: WireGuard VPN
   - luci-app-client-guardian: NAC与强制门户
   - luci-app-auth-guardian: 认证系统

5. **带宽与流量**（2个模块）
   - luci-app-bandwidth-manager: QoS与配额
   - luci-app-media-flow: 媒体流量检测

6. **性能与服务**（2个模块）
   - luci-app-cdn-cache: CDN代理缓存
   - luci-app-vhost-manager: 虚拟主机管理器

## CI/CD集成

### GitHub Actions工作流

1. **build-openwrt-packages.yml**: 为所有架构编译软件包
   - 在push、PR和tag时触发
   - 13种架构的矩阵构建
   - 按架构上传产物

2. **build-secubox-images.yml**: 构建自定义OpenWrt镜像
   - 创建预装SecuBox的完整固件镜像

3. **test-validate.yml**: 验证和测试
   - 验证Makefile结构
   - 检查JSON语法
   - 对脚本运行shellcheck
   - 验证文件权限

### 支持的架构

ARM64: aarch64-cortex-a53、aarch64-cortex-a72、aarch64-generic、mediatek-filogic、rockchip-armv8、bcm27xx-bcm2711

ARM32: arm-cortex-a7-neon、arm-cortex-a9-neon、qualcomm-ipq40xx、qualcomm-ipq806x

MIPS: mips-24kc、mipsel-24kc、mipsel-74kc

x86: x86-64、x86-generic

## 关键文件和目录

- `makefiles/`: 模块的参考Makefile（备份/模板）
- `secubox-tools/`: 修复和调试工具
  - `secubox-repair.sh`: 自动修复Makefile和RPCD问题
  - `secubox-debug.sh`: 验证软件包结构
- `templates/`: 用于创建新模块的软件包模板
- `.github/workflows/`: CI/CD自动化脚本

## 常见问题与解决方案

### RPC错误: "Object not found"或"Method not found"

**错误**: `RPC call to luci.cdn-cache/status failed with error -32000: Object not found`

**原因**: RPCD脚本名与JavaScript中的ubus对象名不匹配

**解决方案**:
1. 检查JavaScript文件中的ubus对象名:
   ```bash
   grep -r "object:" luci-app-*/htdocs --include="*.js"
   ```
2. 重命名RPCD脚本使其完全匹配（包括`luci.`前缀）:
   ```bash
   mv root/usr/libexec/rpcd/cdn-cache root/usr/libexec/rpcd/luci.cdn-cache
   ```
3. 在路由器上重启RPCD:
   ```bash
   /etc/init.d/rpcd restart
   ```

### HTTP 404错误: 视图文件未找到

**错误**: `HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'`

**原因**: 菜单路径与实际的视图文件位置不匹配

**解决方案**:
1. 检查菜单JSON中的路径:
   ```bash
   grep '"path":' root/usr/share/luci/menu.d/*.json
   ```
2. 验证视图文件存在于匹配的位置:
   ```bash
   ls htdocs/luci-static/resources/view/
   ```
3. 更新菜单路径以匹配文件位置，或移动文件以匹配菜单路径

### RPCD无响应

安装/更新软件包后:
```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### 菜单不显示

检查:
1. 菜单JSON有效: `jsonlint root/usr/share/luci/menu.d/*.json`
2. ACL授予访问权限: 检查`root/usr/share/rpcd/acl.d/*.json`
3. 依赖已安装: 检查Makefile中的`LUCI_DEPENDS`
4. 菜单路径与视图文件位置匹配（见上文）

### 构建失败

常见原因:
1. Makefile中缺少字段（PKG_NAME、LUCI_TITLE等）
2. menu.d或acl.d中的JSON语法无效
3. RPCD脚本不可执行（需要chmod +x）
4. 包含路径错误（应为`include ../../luci.mk`）
5. RPCD脚本名与ubus对象不匹配（必须使用`luci.`前缀）

使用修复工具: `./secubox-tools/secubox-repair.sh`

### 快速诊断

运行验证脚本检查所有命名规范:
```bash
./secubox-tools/validate-modules.sh
```

## 开发工作流

1. 修改模块文件
2. **运行验证检查**（关键）:
   ```bash
   ./secubox-tools/validate-modules.sh
   # 或使用本地构建工具:
   ./secubox-tools/local-build.sh validate
   ```
3. 测试JSON语法: `jsonlint <文件>.json`
4. 测试shell脚本: `shellcheck <脚本>`
5. 本地构建和测试软件包（推荐）:
   ```bash
   # 构建单个软件包
   ./secubox-tools/local-build.sh build luci-app-<名称>

   # 或使用手动SDK构建:
   make package/luci-app-<名称>/compile V=s
   ```
6. 在测试路由器上安装并验证功能
7. 如需要运行修复工具: `./secubox-tools/secubox-repair.sh`
8. 提交更改并推送（触发CI验证）
9. 为发布创建标签: `git tag -a v1.0.0 -m "Release 1.0.0"`

## 重要说明

- **关键**: RPCD脚本名必须与ubus对象名匹配（使用`luci.`前缀）
- **关键**: 菜单路径必须与视图文件目录结构匹配
- **关键**: 提交前始终运行`./secubox-tools/validate-modules.sh`
- 所有模块使用Apache-2.0许可证
- RPCD后端必须可执行（chmod +x）
- JavaScript文件使用严格模式: `'use strict';`
- 菜单入口需要正确的依赖链
- ACL必须授予ubus call和luci-cgi访问权限
- UCI配置文件是可选的（许多模块不需要）
- 所有软件包构建为架构`all`（无编译代码）
