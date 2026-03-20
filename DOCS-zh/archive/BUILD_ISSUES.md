# 构建问题与解决方案

> **Languages:** [English](../../DOCS/archive/BUILD_ISSUES.md) | [Francais](../../DOCS-fr/archive/BUILD_ISSUES.md) | 中文

**版本:** 1.0.0
**最后更新:** 2025-12-28
**状态:** 活跃

## 当前问题：GitHub Actions上未生成IPK

### 根本原因

OpenWrt **SDK**无法编译LuCI核心依赖项（`lucihttp`、`cgi-io`），因为它缺少必要的`ubus`开发头文件。在构建SecuBox包时，SDK尝试从源代码编译所有依赖项，导致失败：

```
ERROR: package/feeds/luci/lucihttp failed to build.
ubus_include_dir-NOTFOUND
```

### 为什么在本地可以工作

在本地，您可能有以下配置之一：
1. **完整的OpenWrt构建树** - 拥有所有头文件，可以编译所有内容
2. **ImageBuilder** - 使用预编译包，不从源代码编译
3. **预安装的依赖项** - lucihttp/cgi-io已经存在

### 为什么在GitHub Actions上失败

GitHub Actions使用**OpenWrt SDK**，它：
- 可以编译带有编译代码的包
- 无法编译某些LuCI核心包（缺少头文件）
- 尝试从源代码重新构建所有依赖项

## 解决方案

### 选项1：使用OpenWrt ImageBuilder（推荐）

**最适合：** 创建预装SecuBox的固件镜像

ImageBuilder使用预编译包，不需要编译：

```yaml
# 使用ImageBuilder的新工作流
- name: Download ImageBuilder
  run: |
    wget https://downloads.openwrt.org/releases/${VERSION}/targets/${TARGET}/${SUBTARGET}/openwrt-imagebuilder-*.tar.xz
    tar xf openwrt-imagebuilder-*.tar.xz

- name: Add custom packages
  run: |
    mkdir -p imagebuilder/packages/custom
    cp *.ipk imagebuilder/packages/custom/

- name: Build image
  run: |
    cd imagebuilder
    make image PACKAGES="luci luci-app-secubox luci-app-*-dashboard"
```

**优点：**
- 没有编译问题
- 创建完整的固件镜像
- 快速构建（使用二进制文件）

**缺点：**
- 需要指定目标设备
- 不适合多架构包构建

### 选项2：使用完整的OpenWrt构建系统

**最适合：** 完全控制、自定义内核，或需要修改核心包时

克隆并构建完整的OpenWrt：

```yaml
- name: Clone OpenWrt
  run: |
    git clone https://github.com/openwrt/openwrt.git
    cd openwrt
    ./scripts/feeds update -a
    ./scripts/feeds install -a

- name: Add SecuBox packages
  run: |
    cp -r ../luci-app-* openwrt/package/

- name: Build
  run: |
    cd openwrt
    make defconfig
    make -j$(nproc)
```

**优点：**
- 可以编译所有内容
- 完全控制构建
- 可以修改核心包

**缺点：**
- 非常慢（每个架构1-2小时）
- 需要大量磁盘空间（30-50GB）
- 配置复杂

### 选项3：纯包仓库（替代方案）

**最适合：** 分发用户在现有OpenWrt系统上安装的包

创建自定义包源：

```bash
# 在您的服务器/GitHub Pages上
mkdir -p packages/${ARCH}/secubox
cp *.ipk packages/${ARCH}/secubox/
scripts/ipkg-make-index packages/${ARCH}/secubox > Packages
gzip -c Packages > Packages.gz
```

用户添加到`/etc/opkg/customfeeds.conf`：
```
src/gz secubox https://yourdomain.com/packages/${ARCH}/secubox
```

**优点：**
- 不需要构建（分发源代码）
- 用户本地编译或使用二进制文件
- 易于更新

**缺点：**
- 用户需要手动安装
- 不提供固件镜像

### 选项4：修复SDK构建（当前尝试）

当前工作流尝试变通方法：
1. 下载包索引
2. 配置SDK优先使用二进制文件（CONFIG_BUILDBOT=y）
3. 如果编译失败，回退到直接打包

**状态：** 实验性，可能不可靠

**优点：**
- 保持现有工作流结构
- 多架构构建

**缺点：**
- 脆弱，依赖SDK的特性
- 可能因OpenWrt更新而中断
- 非官方支持

## 推荐方法

### 包分发
使用**选项3**（包仓库）结合**选项1**（示例固件的ImageBuilder）：

1. **通过GitHub releases分发源码包**
2. **为常见架构提供预构建的.ipk**（x86-64、ARM）
3. **使用ImageBuilder为流行设备创建示例固件**
4. **记录安装说明**供想要在现有OpenWrt上安装的用户使用

### 实施步骤

1. **创建包源工作流**（替换当前SDK构建）
2. **添加ImageBuilder工作流**用于示例固件（ESPRESSObin、x86-64等）
3. **更新README**包含安装说明
4. **标记发布**包含源代码和二进制文件

## 后续步骤

实施推荐的解决方案：

```bash
# 1. 为ImageBuilder创建新工作流
cp .github/workflows/build-secubox-images.yml .github/workflows/build-imagebuilder.yml
# 编辑以使用ImageBuilder而不是完整构建

# 2. 更新包构建工作流以创建源而不是编译
# （保持源代码分发，跳过编译）

# 3. 更新文档
# 添加INSTALL.md包含不同场景的说明
```

## 临时变通方法

在实施正确的解决方案之前，用户可以：

1. **从GitHub下载源代码**
2. **使用local-build.sh本地构建**（需要SDK设置）
3. **或使用现有的固件构建**（如果可用）

## 参考资料

- OpenWrt SDK: https://openwrt.org/docs/guide-developer/toolchain/using_the_sdk
- OpenWrt ImageBuilder: https://openwrt.org/docs/guide-user/additional-software/imagebuilder
- 包源: https://openwrt.org/docs/guide-developer/feeds
