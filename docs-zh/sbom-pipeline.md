# SecuBox SBOM 流水线文档

🌐 **语言：** [English](../docs/sbom-pipeline.md) | [Français](../docs-fr/sbom-pipeline.md) | 中文

## 概述

SecuBox SBOM（软件物料清单）流水线生成符合 CycloneDX 1.6 和 SPDX 2.3 标准的 SBOM，以满足欧盟网络弹性法案（CRA）附件一的合规要求。

## 架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SecuBox SBOM 流水线                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │   数据源 A  │    │   数据源 B  │    │   数据源 C  │    │   数据源 D  │  │
│   │  OpenWrt    │    │   SecuBox   │    │   Rootfs    │    │   固件      │  │
│   │  原生       │    │   Feed      │    │   扫描      │    │   镜像      │  │
│   │             │    │             │    │             │    │             │  │
│   │ 软件包      │    │ Makefiles   │    │ Syft 扫描   │    │ Syft 扫描   │  │
│   │ .manifest   │    │ PKG_* 变量  │    │ dir:rootfs  │    │ file:*.bin  │  │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│          │                  │                  │                  │         │
│          └──────────────────┴──────────────────┴──────────────────┘         │
│                                    │                                         │
│                                    ▼                                         │
│                          ┌─────────────────┐                                 │
│                          │   合并与去重    │                                 │
│                          │   (jq fusion)   │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌─────────────────┐                                 │
│                          │      验证       │                                 │
│                          │ cyclonedx-cli   │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│                    ┌──────────────┼──────────────┐                           │
│                    ▼              ▼              ▼                           │
│             ┌───────────┐  ┌───────────┐  ┌───────────┐                      │
│             │ CVE 扫描  │  │ CRA 报告  │  │  校验和   │                      │
│             │  (grype)  │  │   摘要    │  │ sha256sum │                      │
│             └───────────┘  └───────────┘  └───────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

输出文件：
├── secubox-VERSION.cdx.json          # CycloneDX 1.6（主要格式）
├── secubox-VERSION.spdx.json         # SPDX 2.3（备选格式）
├── secubox-VERSION-cve-report.json   # Grype CVE 扫描结果
├── secubox-VERSION-cve-table.txt     # 人类可读的 CVE 表格
├── secubox-VERSION-cra-summary.txt   # CRA 合规摘要
├── sbom-warnings.txt                 # 缺失元数据警告
└── checksums.sha256                  # 文件完整性校验和
```

## 前提条件

### 最低版本要求

| 工具 | 最低版本 | 用途 |
|------|----------|------|
| OpenWrt | 22.03 | 原生 SBOM 支持 |
| Perl | 5.26+ | package-metadata.pl |
| jq | 1.6+ | JSON 处理 |
| Syft | 0.100+ | 文件系统扫描 |
| Grype | 0.70+ | CVE 扫描 |
| cyclonedx-cli | 0.25+ | SBOM 验证 |

### 环境配置

```bash
# 检查前提条件
./scripts/check-sbom-prereqs.sh

# 安装 SBOM 工具（如果未安装）
# Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ~/.local/bin

# Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b ~/.local/bin

# cyclonedx-cli
curl -sSfL -o ~/.local/bin/cyclonedx-cli \
  https://github.com/CycloneDX/cyclonedx-cli/releases/latest/download/cyclonedx-linux-x64
chmod +x ~/.local/bin/cyclonedx-cli

# 添加到 PATH
export PATH="$HOME/.local/bin:$PATH"
```

### OpenWrt Kconfig 配置

在 `.config` 中启用原生 SBOM 生成：

```
CONFIG_JSON_CYCLONEDX_SBOM=y
CONFIG_COLLECT_KERNEL_DEBUG=n
```

## 使用方法

### 日常开发

```bash
# 完整 SBOM 生成（全部 4 个数据源）
./scripts/sbom-generate.sh

# 从现有构建产物快速生成 SBOM（无需重新构建）
./scripts/sbom-generate.sh --version 0.20

# 离线模式（无网络，使用缓存的数据库）
./scripts/sbom-generate.sh --offline

# 跳过 CVE 扫描（更快）
./scripts/sbom-generate.sh --no-cve
```

### 使用 Makefile 目标

```bash
# 完整构建 + SBOM
make sbom

# 仅生成 SBOM（无需重新构建）
make sbom-quick

# 验证现有 SBOM
make sbom-validate

# 仅进行 CVE 扫描
make sbom-scan

# 清理 SBOM 输出
make sbom-clean

# 显示帮助
make sbom-help
```

### 审计 Feed 软件包

```bash
# 检查所有 SecuBox feed 软件包是否缺失元数据
./scripts/sbom-audit-feed.sh

# 输出：feeds/secubox/MANIFEST.md
```

## 添加新软件包

向 SecuBox feed 添加新软件包时，请确保 SBOM 兼容性：

### 检查清单

- [ ] 已定义 **PKG_NAME**
- [ ] 已定义 **PKG_VERSION**
- [ ] 已定义 **PKG_LICENSE**（SPDX 标识符）
- [ ] 已定义 **PKG_HASH**（sha256）
- [ ] 已定义 **PKG_SOURCE_URL**（可选但推荐）

### Makefile 示例

```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=my-package
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_SOURCE_URL:=https://github.com/example/my-package/archive
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_HASH:=a1b2c3d4e5f6...  # 源码压缩包的 sha256sum

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

PKG_MAINTAINER:=您的姓名 <email@example.com>
```

### 计算 PKG_HASH

```bash
# 下载并计算源码哈希
wget https://example.com/package-1.0.0.tar.gz
sha256sum package-1.0.0.tar.gz

# 或使用 OpenWrt 下载助手
make package/my-package/download V=s
sha256sum dl/my-package-1.0.0.tar.gz
```

## CRA 附件一映射

| CRA 要求 | SBOM 实现 |
|----------|-----------|
| 第13(5)条 - 组件识别 | `components[].purl`（软件包 URL） |
| 第13(5)条 - 供应商识别 | `metadata.component.supplier` |
| 第13(5)条 - 版本信息 | `components[].version` |
| 第13(5)条 - 依赖关系 | `dependencies[]` 数组 |
| 第13(5)条 - 许可证信息 | `components[].licenses[]` |
| 第13(6)条 - 机器可读格式 | CycloneDX 1.6 JSON + SPDX 2.3 |
| 第13(6)条 - 漏洞披露 | SECURITY.md + VEX 文档 |
| 第13(7)条 - 唯一标识 | PURL + `serialNumber` UUID |
| 附件一(2) - 完整性验证 | `hashes[]`（含 SHA-256） |

## ANSSI CSPN 提交

申请 CSPN 认证时，请在申请材料中包含以下内容：

### 必需文档

1. **SBOM 文件**
   - `secubox-VERSION.cdx.json`（主要格式）
   - `secubox-VERSION.spdx.json`（备选格式）

2. **来源证明**
   - `checksums.sha256`（完整性验证）
   - 元数据中的 Git 提交哈希

3. **漏洞分析**
   - `secubox-VERSION-cve-report.json`
   - `secubox-VERSION-cra-summary.txt`

4. **流程文档**
   - 本文档（`docs/sbom-pipeline.md`）
   - `SECURITY.md`（漏洞披露政策）

### 提交检查清单

- [ ] 所有组件都有 PKG_HASH 和 PKG_LICENSE
- [ ] SBOM 通过 cyclonedx-cli 验证
- [ ] 无未处理的严重级别 CVE
- [ ] VEX 文档说明了已接受的风险
- [ ] 已验证 SOURCE_DATE_EPOCH 可重现性

## 故障排除

### 常见错误

#### "OpenWrt version < 22.03"

原生 CycloneDX SBOM 支持需要 OpenWrt 22.03 或更高版本。

**解决方案：** 升级您的 OpenWrt 分支，或使用不依赖原生支持的 `sbom-generate.sh`（将回退到 Makefile 解析）。

#### "package-metadata.pl not found"

您的 OpenWrt 检出中缺少 SBOM 生成脚本。

**解决方案：**
```bash
git checkout origin/master -- scripts/package-metadata.pl
```

#### "syft: command not found"

Syft 未安装或不在 PATH 中。

**解决方案：**
```bash
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
```

#### "SBOM validation failed"

生成的 SBOM 存在架构错误。

**解决方案：**
1. 检查 `sbom-warnings.txt` 了解缺失的元数据
2. 修复缺少 PKG_HASH 或 PKG_LICENSE 的 Makefile
3. 重新生成 SBOM

#### "Grype database update failed"

网络连接问题或速率限制。

**解决方案：**
- 使用 `--offline` 模式配合缓存的数据库
- 或手动更新：`grype db update`

### 调试模式

```bash
# 详细输出
DEBUG=1 ./scripts/sbom-generate.sh

# 保留中间文件
KEEP_TEMP=1 ./scripts/sbom-generate.sh
```

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-03-04 | 初始流水线实现 |

---

_由 CyberMind Produits SASU 维护_
_联系方式：secubox@cybermind.fr_
