# SecuBox 开发工具

[English](README.md) | [Francais](README.fr.md) | 中文

**版本：** 1.2.0
**最后更新：** 2026-02-28
**状态：** 活跃

本目录包含用于验证、调试和维护 SecuBox 模块的工具。

---

## 另请参阅

- **快速命令和规则：** [DOCS/QUICK-START.md](../DOCS/QUICK-START.md)
- **自动化防护：** [DOCS/CODEX.md](../DOCS/CODEX.md)
- **验证指南：** [DOCS/VALIDATION-GUIDE.md](../DOCS/VALIDATION-GUIDE.md)
- **部署流程：** [DOCS/DEVELOPMENT-GUIDELINES.md §9](../DOCS/DEVELOPMENT-GUIDELINES.md#deployment-procedures)

## 工具概览

### 构建和测试工具

#### local-build.sh

**新功能！** 复制 GitHub Actions 工作流程的本地构建系统。

无需推送到 GitHub 即可本地构建和测试软件包。自动下载和配置 OpenWrt SDK，构建软件包并收集产物。

**使用方法：**
```bash
# 验证所有软件包
./secubox-tools/local-build.sh validate

# 构建所有软件包 (x86_64)
./secubox-tools/local-build.sh build

# 构建单个软件包
./secubox-tools/local-build.sh build luci-app-system-hub

# 构建 SecuBox Core 软件包
./secubox-tools/local-build.sh build secubox-core

# 为特定架构构建
./secubox-tools/local-build.sh build --arch aarch64-cortex-a72

# 为 MOCHAbin 构建固件镜像
./secubox-tools/local-build.sh build-firmware mochabin

# 为 ESPRESSObin V7 构建固件镜像
./secubox-tools/local-build.sh build-firmware espressobin-v7

# 完整验证 + 构建
./secubox-tools/local-build.sh full

# 清理构建产物
./secubox-tools/local-build.sh clean

# 清理所有内容包括 OpenWrt 源码
./secubox-tools/local-build.sh clean-all
```

**支持的架构（用于软件包构建）：**
- `x86-64` - PC、虚拟机（默认）
- `aarch64-cortex-a53` - ARM Cortex-A53 (ESPRESSObin)
- `aarch64-cortex-a72` - ARM Cortex-A72 (MOCHAbin, RPi4)
- `aarch64-generic` - 通用 ARM64
- `mips-24kc` - MIPS 24Kc (TP-Link)
- `mipsel-24kc` - MIPS LE (小米, GL.iNet)

**支持的设备（用于固件构建）：**
- `espressobin-v7` - ESPRESSObin V7 (1-2GB DDR4)
- `espressobin-ultra` - ESPRESSObin Ultra (PoE, WiFi)
- `sheeva64` - Sheeva64 (Plug computer)
- `mochabin` - MOCHAbin (四核 A72, 10G)
- `x86-64` - x86_64 通用 PC

**环境变量：**
- `OPENWRT_VERSION` - OpenWrt 版本（默认：24.10.5，也支持：25.12.0-rc1, 23.05.5, SNAPSHOT）
- `SDK_DIR` - SDK 目录（默认：./sdk）
- `BUILD_DIR` - 构建输出目录（默认：./build）
- `CACHE_DIR` - 下载缓存目录（默认：./cache）
- `OPENWRT_DIR` - 固件构建的 OpenWrt 源码目录（默认：./openwrt）

**输出：**
- 构建的软件包放置在 `build/<arch>/` 并附带 SHA256 校验和
- 固件镜像放置在 `build/firmware/<device>/` 并附带校验和和构建信息

**依赖：**
```bash
# 构建所需
sudo apt-get install -y build-essential clang flex bison g++ gawk \
    gcc-multilib g++-multilib gettext git libncurses5-dev \
    libssl-dev python3-setuptools python3-dev rsync \
    swig unzip zlib1g-dev file wget curl jq ninja-build

# 验证可选
sudo apt-get install -y shellcheck nodejs
```

**功能：**
- **软件包构建**：下载并缓存 OpenWrt SDK 以加快构建速度
- **固件构建**：下载完整 OpenWrt 源码并构建自定义固件镜像
- 自动配置 feeds（packages, luci）
- 构建前验证软件包
- 使用详细输出构建 .ipk 软件包
- 构建完整固件镜像（.img.gz, *sysupgrade.bin 等）
- 收集带校验和的产物
- 支持单个或所有软件包
- 多架构和设备支持
- 构建前设备配置文件验证

**重要：SDK 与完整工具链构建**

某些软件包**必须**使用完整的 OpenWrt 工具链（`openwrt/`）而不是 SDK 构建：

| 软件包 | 原因 |
|---------|--------|
| `crowdsec` | 带 CGO 的 Go 二进制文件 - SDK 产生的 ARM64 LSE 原子操作在某些 CPU 上会崩溃 |
| `crowdsec-firewall-bouncer` | 带 CGO 的 Go 二进制文件 |
| `netifyd` | C++ 原生二进制文件 |
| `nodogsplash` | C 原生二进制文件 |

**构建这些软件包：**
```bash
cd secubox-tools/openwrt
make package/<package-name>/compile V=s
```

LuCI 应用和 shell/Lua 软件包可以通过 `local-build.sh` 使用 SDK。

**示例工作流程 - 工具链构建（用于 Go/原生软件包）：**
```bash
# 1. 导航到完整 OpenWrt 构建目录
cd secubox-tools/openwrt

# 2. 如需要则更新 feeds
./scripts/feeds update -a
./scripts/feeds install -a

# 3. 使用完整工具链构建 CrowdSec
make package/crowdsec/compile V=s

# 4. 构建 firewall bouncer
make package/crowdsec-firewall-bouncer/compile V=s

# 5. 软件包位于：bin/packages/aarch64_cortex-a72/packages/
```

**示例工作流程 - 软件包构建（SDK）：**
```bash
# 1. 修改模块
vim luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js

# 2. 本地验证和构建
./secubox-tools/local-build.sh full

# 3. 在路由器上测试
scp build/x86-64/*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1
opkg install /tmp/luci-app-system-hub*.ipk
/etc/init.d/rpcd restart
```

### 镜像和部署工具

#### secubox-image.sh

通过 OpenWrt ASU（Attended SysUpgrade）API 构建 SecuBox 固件镜像。

**使用方法：**
```bash
# 为设备构建固件镜像
./secubox-tools/secubox-image.sh build mochabin

# 生成 firmware-selector 配置
./secubox-tools/secubox-image.sh firmware-selector mochabin

# 检查构建状态
./secubox-tools/secubox-image.sh status <build-hash>

# 下载已完成的构建
./secubox-tools/secubox-image.sh download <build-hash>
```

**功能：**
- 使用 firmware-selector.openwrt.org 后端（ASU API）
- 支持 MOCHAbin、ESPRESSObin V7/Ultra、x86-64
- 最大 rootfs 分区（1024 MB）
- 首次启动脚本自动安装 SecuBox 软件包
- 镜像调整大小以充分利用 eMMC

**输出：** 固件镜像在 `build/images/` 并附带 SHA256 校验和

#### secubox-sysupgrade.sh

就地升级运行中的 SecuBox 设备同时保留软件包。

**使用方法：**
```bash
# 检查当前版本和可用升级
secubox-sysupgrade check

# 构建 sysupgrade 镜像（不刷写）
secubox-sysupgrade build

# 构建 + 下载 + 刷写（完整升级）
secubox-sysupgrade upgrade

# 显示设备信息
secubox-sysupgrade status
```

**功能：**
- 自动检测设备、版本和已安装的软件包
- 请求保留所有软件包的自定义镜像
- 升级时保留 /etc/config、/etc/secubox、/srv/
- 使用 /etc/board.json 进行设备检测

#### quick-deploy.sh

快速开发部署到路由器。

**使用方法：**
```bash
# 部署 IPK 软件包
./secubox-tools/quick-deploy.sh --ipk /tmp/package.ipk

# 从源目录部署
./secubox-tools/quick-deploy.sh --src package/secubox/luci-app-example

# LuCI 应用快捷方式
./secubox-tools/quick-deploy.sh --app system-hub

# 从 git 仓库部署
./secubox-tools/quick-deploy.sh --git https://github.com/user/repo --branch develop

# 列出可用应用
./secubox-tools/quick-deploy.sh --list-apps
```

**功能：**
- 多种源模式：IPK、APK、tar、git
- 自动 LuCI 应用检测
- 部署后验证和缓存清除
- 备份和恢复功能
- SSH 多路复用加快传输速度

#### c3box-vm-builder.sh

为 VMware/VirtualBox 构建便携式 C3Box VM 镜像。

**使用方法：**
```bash
# 构建 x86-64 固件
./secubox-tools/c3box-vm-builder.sh build

# 转换为 VM 格式
./secubox-tools/c3box-vm-builder.sh convert

# 完整构建 + 转换
./secubox-tools/c3box-vm-builder.sh full

# 创建可分发存档
./secubox-tools/c3box-vm-builder.sh package
```

**输出格式：** VMDK (VMware)、OVA、VDI (VirtualBox)、QCOW2 (KVM)

#### secubox-clone-station.sh

通过双 USB 串口协调 SecuBox 设备克隆。

**使用方法：**
```bash
# 检测串口设备
./secubox-tools/secubox-clone-station.sh detect

# 提取主设备配置
./secubox-tools/secubox-clone-station.sh pull --master /dev/ttyUSB0

# 刷写目标设备
./secubox-tools/secubox-clone-station.sh flash --target /dev/ttyUSB1

# 完整克隆工作流程
./secubox-tools/secubox-clone-station.sh clone
```

**功能：**
- 从主设备提取配置
- 使用 ASU API 构建克隆镜像
- 为 mesh 生成加入令牌
- 通过 MOKATOOL 实现 U-Boot 自动化
- 基于 TFTP 的刷写

---

### 日志和调试工具

#### secubox-log.sh

SecuBox 模块的集中式日志记录器/聚合器。将带标签的事件追加到 `/var/log/seccubox.log`，捕获合并 `dmesg` + `logread` 的快照，并可跟踪聚合文件进行故障排除。

```
# 追加消息
secubox-log.sh --tag netdata --message "Netdata restarted"

# 添加带 dmesg/logread 尾部的快照
secubox-log.sh --snapshot

# 跟踪聚合日志
secubox-log.sh --tail 100
```

该脚本也安装在路由器上作为 `/usr/sbin/secubox-log`（通过 `luci-app-secubox`），以便 LuCI 模块可以记录生命周期事件并收集调试包。

**示例工作流程 - 固件构建：**
```bash
# 1. 为 MOCHAbin 构建预装 SecuBox 的固件
./secubox-tools/local-build.sh build-firmware mochabin

# 2. 刷写到设备
# 固件镜像位于：build/firmware/mochabin/
# - openwrt-*-sysupgrade.bin（用于升级现有 OpenWrt）
# - openwrt-*-factory.bin（用于初始安装）
# - SHA256SUMS（用于验证的校验和）
# - BUILD_INFO.txt（构建详情）
# - packages/（SecuBox .ipk 文件）

# 3. 构建后清理（可选）
./secubox-tools/local-build.sh clean-all  # 删除 OpenWrt 源码（节省约 20GB）
```

### 验证工具

#### validate-modules.sh

快速验证仓库中的所有模块。

**使用方法：**
```bash
./secubox-tools/validate-modules.sh
```

**执行的检查：**
1. **RPCD 脚本名称与 ubus 对象对比** - 确保 RPCD 脚本文件名与 JavaScript ubus 对象声明匹配
2. **菜单路径与视图文件对比** - 验证 menu.d JSON 路径对应实际视图文件
3. **视图文件有菜单入口** - 检查所有视图文件都在菜单中引用
4. **RPCD 脚本权限** - 确保脚本可执行
5. **JSON 语法验证** - 验证所有 menu.d 和 acl.d JSON 文件
6. **ubus 命名规范** - 验证所有 ubus 对象使用 `luci.` 前缀

**退出代码：**
- `0` - 所有检查通过（或仅有警告）
- `1` - 发现严重错误

**示例输出：**
```
✓ luci-app-cdn-cache: RPCD script 'luci.cdn-cache' matches ubus object 'luci.cdn-cache'
✓ luci-app-cdn-cache: Menu path 'cdn-cache/overview' → file exists
❌ ERROR: luci-app-example: RPCD script 'example' does not match ubus object 'luci.example'
```

#### validate-module-generation.sh

**新功能！** 生成期间/之后单个模块的全面验证。

**使用方法：**
```bash
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache
```

**执行的检查：**
- Makefile 完整性（所有必需字段）
- RPCD 脚本命名规范（luci.* 前缀）
- RPCD 脚本结构和处理程序
- ACL 权限覆盖
- 菜单路径验证
- JavaScript 视图验证
- RPC 方法声明与 RPCD 实现对比
- 安全扫描（硬编码凭据、危险命令）
- 文档存在性

**使用时机：**
- 生成新模块后
- 提交模块更改前
- 调试模块集成问题时

#### pre-deploy-lint.sh

**新功能！** 部署前的全面语法验证。在破坏生产环境之前捕获 JavaScript、JSON、shell 和 CSS 错误。

**使用方法：**
```bash
# 验证单个软件包
./secubox-tools/pre-deploy-lint.sh luci-app-system-hub

# 按短名称验证
./secubox-tools/pre-deploy-lint.sh system-hub

# 验证所有软件包
./secubox-tools/pre-deploy-lint.sh --all

# 通过 quick-deploy.sh 自动执行（LuCI 应用默认）
./secubox-tools/quick-deploy.sh --app system-hub
```

**执行的检查：**
1. **JavaScript 验证：**
   - 通过 Node.js `--check` 进行完整语法检查（如果可用）
   - 常见错误的回退模式检查
   - 检测：debugger 语句、console.log、缺少 'use strict'
   - LuCI 特定：验证 require 语句格式
2. **JSON 验证：**
   - Menu.d 和 acl.d 语法验证
   - Python json.tool 用于正确解析
3. **Shell 脚本验证：**
   - 通过 `-n` 标志进行 Bash/sh 语法检查
   - shellcheck 集成（如果可用）
   - RPCD 特定检查：JSON 输出、方法分发器
4. **CSS 验证：**
   - 未闭合大括号检测
   - 常见拼写错误检测

**与 quick-deploy.sh 集成：**
```bash
# 部署前自动运行 lint（默认）
./secubox-tools/quick-deploy.sh --app cdn-cache

# 跳过 lint（不推荐）
./secubox-tools/quick-deploy.sh --app cdn-cache --no-lint

# 即使是非 LuCI 部署也强制 lint
./secubox-tools/quick-deploy.sh --src ./path --lint
```

**退出代码：**
- `0` - 所有检查通过（或仅有警告）
- `1` - 发现严重错误（部署被阻止）

**示例输出：**
```
✓ luci-app-cdn-cache: All files validated

❌ JS syntax error: htdocs/view/cdn-cache/overview.js
    SyntaxError: Unexpected token '}'
⚠️  console.log found in: htdocs/view/cdn-cache/debug.js
```

#### pre-push-validation.sh

**新功能！** Git pre-push 钩子，在允许推送之前验证所有模块。

**使用方法：**
```bash
# 自动（通过 git 钩子）：
git push  # 验证自动运行

# 手动：
./secubox-tools/pre-push-validation.sh
```

**执行的检查：**
- validate-modules.sh 的所有验证
- Git 暂存更改分析
- 修改模块检测
- 全面安全扫描
- 修改模块的完整模块验证

**退出代码：**
- `0` - 允许推送
- `1` - 推送被阻止（发现严重错误）

**安装：**
```bash
./secubox-tools/install-git-hooks.sh
```

### 应用和插件注册表

#### secubox-app

新兴 SecuBox App Store 的 CLI 助手。它读取 `plugins/*/manifest.json`，安装/删除其中列出的软件包，并运行 manifest 中定义的可选 shell 操作（`install`、`check`、`update`、`status`）。

```bash
# 列出 manifest 和安装状态
secubox-app list

# 安装 Zigbee2MQTT（软件包 + zigbee2mqttctl install）
secubox-app install zigbee2mqtt

# 显示 manifest 或运行 status/update
secubox-app show zigbee2mqtt
secubox-app status zigbee2mqtt
secubox-app update zigbee2mqtt
```

环境：设置 `SECUBOX_PLUGINS_DIR` 以覆盖 manifest 目录（默认 `../plugins`）。需要 `opkg` 和 `jsonfilter`，因此在 OpenWrt 系统上运行（或在 SDK chroot 中）。

### 维护工具

#### secubox-repair.sh

自动修复工具，修复 Makefile 和 RPCD 脚本中的常见问题。

**使用方法：**
```bash
./secubox-tools/secubox-repair.sh
```

#### secubox-debug.sh

在 OpenWrt 设备上验证单个软件包结构和依赖关系。

**使用方法：**
```bash
./secubox-tools/secubox-debug.sh luci-app-<module-name>
```

#### install-git-hooks.sh

**新功能！** 安装用于自动验证的 git 钩子。

**使用方法：**
```bash
./secubox-tools/install-git-hooks.sh
```

这将创建从 `.git/hooks/pre-push` 到 `pre-push-validation.sh` 的符号链接。

## 推荐工作流程

### 生成新模块时

1. **生成模块文件**（使用 Claude 配合 module-prompts.md）

2. **验证模块：**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

3. **修复所有错误**（严重）

4. **审查并修复警告**（推荐）

5. **本地构建和测试**（推荐）：
   ```bash
   ./secubox-tools/local-build.sh build luci-app-<module-name>
   # 如需要在路由器上测试
   ```

6. **提交更改：**
   ```bash
   git add luci-app-<module-name>
   git commit -m "feat: implement <module-name> module"
   git push  # Pre-push 验证自动运行
   ```

### 修改现有模块时

1. **进行更改**

2. **运行快速验证：**
   ```bash
   ./secubox-tools/validate-modules.sh
   ```

3. **对于复杂更改，运行完整验证：**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

4. **本地构建和测试**（推荐）：
   ```bash
   ./secubox-tools/local-build.sh build luci-app-<module-name>
   ```

5. **提交并推送**（验证自动运行）

### 提交更改前

提交前始终运行至少一个验证工具：

1. **运行验证**（严重）：
   ```bash
   ./secubox-tools/validate-modules.sh
   # 或使用 local-build.sh 进行验证 + 构建：
   ./secubox-tools/local-build.sh full
   ```

2. 修复报告的任何错误

3. 在 RPCD 脚本上运行 shellcheck：
   ```bash
   shellcheck luci-app-*/root/usr/libexec/rpcd/*
   ```

4. **本地测试构建**（推荐）：
   ```bash
   ./secubox-tools/local-build.sh build
   ```

5. 提交更改

## 常见修复

### 修复 RPCD 命名不匹配

如果验证报告 RPCD 脚本名称与 ubus 对象不匹配：

```bash
# 重命名脚本以包含 luci. 前缀
cd luci-app-example/root/usr/libexec/rpcd
mv example luci.example
```

### 修复菜单路径不匹配

如果验证报告菜单路径与视图文件不匹配：

```bash
# 选项 1：更新 menu.d JSON 以匹配文件位置
# 编辑：root/usr/share/luci/menu.d/luci-app-example.json
# 更改："path": "example/view" → "path": "example-dashboard/view"

# 选项 2：移动视图文件以匹配菜单路径
mv htdocs/luci-static/resources/view/example-dashboard \
   htdocs/luci-static/resources/view/example
```

### 修复不可执行的 RPCD 脚本

```bash
chmod +x luci-app-example/root/usr/libexec/rpcd/luci.example
```

## SecuBox 软件包 Feed

SecuBox feed 提供可通过 `opkg` 安装的自定义 OpenWrt 软件包。构建软件包后，它们会同步到路由器上的 `/www/secubox-feed`。

### Feed 结构

```
/www/secubox-feed/
├── Packages              # 软件包索引（文本）
├── Packages.gz           # 压缩的软件包索引
├── Packages.sig          # 可选签名
└── *.ipk                 # 软件包文件
```

### 配置 opkg 使用 Feed

**选项 1：本地文件访问（同一设备）**
```bash
echo 'src/gz secubox file:///www/secubox-feed' >> /etc/opkg/customfeeds.conf
opkg update
```

**选项 2：HTTP 访问（网络设备）**
```bash
# 从网络上的其他设备（将 IP 替换为您的路由器地址）
echo 'src/gz secubox http://192.168.255.1/secubox-feed' >> /etc/opkg/customfeeds.conf
opkg update
```

**选项 3：通过 HAProxy 发布的 Feed（带 SSL）**
```bash
# 如果通过带域名的 HAProxy 发布
echo 'src/gz secubox https://feed.example.com' >> /etc/opkg/customfeeds.conf
opkg update
```

### 从 Feed 安装软件包

```bash
# 更新软件包列表
opkg update

# 列出可用的 SecuBox 软件包
opkg list | grep -E '^(luci-app-|secubox-)'

# 安装软件包
opkg install luci-app-service-registry

# 带依赖安装
opkg install --force-depends luci-app-haproxy
```

### 重新生成软件包索引

向 feed 添加新的 .ipk 文件后：

```bash
# 在路由器上
cd /www/secubox-feed
/usr/libexec/opkg-make-index . > Packages
gzip -k Packages
```

或使用部署命令：
```bash
# 从开发机器
./secubox-tools/local-build.sh deploy root@192.168.255.1 "luci-app-*"
```

### App Store 集成

LuCI App Store 从 `apps-local.json` 读取以列出可用软件包：

```bash
# 从 feed 生成应用清单
cat /www/secubox-feed/Packages | awk '
/^Package:/ { pkg=$2 }
/^Version:/ { ver=$2 }
/^Description:/ { desc=substr($0, 14); print pkg, ver, desc }
'
```

Service Registry 仪表板聚合已安装的应用及其状态。

### 通过 HAProxy 暴露 Feed

使用 HTTPS 发布 feed：

```bash
# 为 feed 创建 HAProxy 后端
ubus call luci.haproxy create_backend '{"name":"secubox-feed","mode":"http"}'
ubus call luci.haproxy create_server '{"backend":"secubox-feed","address":"127.0.0.1","port":80}'
ubus call luci.haproxy create_vhost '{"domain":"feed.example.com","backend":"secubox-feed","ssl":1,"acme":1}'

# 请求证书
ubus call luci.haproxy request_certificate '{"domain":"feed.example.com"}'
```

### 故障排除

**Feed 不更新：**
```bash
# 检查 feed URL 是否可访问
curl -I http://192.168.255.1/secubox-feed/Packages

# 检查 opkg 配置
cat /etc/opkg/customfeeds.conf

# 强制刷新
rm /var/opkg-lists/secubox
opkg update
```

**软件包签名错误：**
```bash
# 跳过签名验证（仅限开发）
opkg update --no-check-certificate
opkg install --force-checksum <package>
```

---

## 与 CI/CD 集成

验证脚本可以集成到 GitHub Actions 工作流程中：

```yaml
- name: Validate modules
  run: |
    chmod +x secubox-tools/validate-modules.sh
    ./secubox-tools/validate-modules.sh
```

## 关键命名规则

**这些规则是强制性的** - 违反将导致运行时错误：

1. **RPCD 脚本**必须命名为 `luci.<module-name>`
   - ✅ `luci.cdn-cache`
   - ❌ `cdn-cache`

2. **菜单路径**必须匹配视图文件位置
   - 菜单：`"path": "cdn-cache/overview"`
   - 文件：`view/cdn-cache/overview.js`

3. **ubus 对象**必须使用 `luci.` 前缀
   - ✅ `object: 'luci.cdn-cache'`
   - ❌ `object: 'cdn-cache'`

完整文档请参见 `CLAUDE.md`。
