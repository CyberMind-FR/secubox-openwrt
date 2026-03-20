# SecuBox 文档索引

**语言 :** [English](../docs/documentation-index.md) | [Francais](../docs-fr/documentation-index.md) | 中文

**版本 :** 1.0.0
**最后更新 :** 2025-12-28
**状态 :** 活跃
**SecuBox OpenWrt 项目完整文档**

---

## 文档概览

本索引提供对所有 SecuBox 文档的快速访问。请选择符合您需求的文档：

---

## 版本和状态策略

SecuBox 中的每个 Markdown 文档都必须以元数据开头，以便贡献者立即了解文档的新鲜度：

- 包含 `版本`、`最后更新`（YYYY-MM-DD）和 `状态`（活跃 | 草稿 | 已归档）。
- 新建或重新生成的文档从 `版本 1.0.0` 开始；增量更新时递增次版本/修订号，结构性重写时递增主版本号。
- 编辑任何文档时，更新 `最后更新` 日期，并使状态与 `TODO-ANALYSE.md` 中概述的归档计划保持同步。

创建或修订文档时请遵循此模板：

```
# 标题

**版本 :** 1.0.0
**最后更新 :** 2025-12-28
**状态 :** 活跃
```

---

## 快速入门

### 新贡献者
1. 从 **[QUICK-START.md](quick-start.md)** 开始 - 基本规则和命令
2. 阅读 **[DEVELOPMENT-GUIDELINES.md](../docs/development-guidelines.md)** - 完整开发指南
3. 查看 **[CLAUDE.md](../docs/claude.md)** - 构建系统和架构

### AI 辅助开发
1. 使用 **[MODULE-IMPLEMENTATION-GUIDE.md](../docs/module-implementation-guide.md)** - 分步工作流程
2. 从 **[FEATURE-REGENERATION-PROMPTS.md](../docs/feature-regeneration-prompts.md)** 复制提示词
3. 参考 **[CODE-TEMPLATES.md](../docs/code-templates.md)** 获取实现模式

### 修改现有模块
1. 查看 **[QUICK-START.md](quick-start.md)** - 快速修复和常用命令
2. 运行验证：`./secubox-tools/validate-modules.sh`
3. 查阅 **[DEVELOPMENT-GUIDELINES.md](../docs/development-guidelines.md)** 获取特定主题

---

## 文档说明

### 1. 快速参考文档

#### **QUICK-START.md**
*常见任务快速参考 - 请先阅读此文档！*

**内容：**
- 关键命名规则（RPCD、菜单路径、权限）
- 设计系统要点（颜色、字体、CSS 类）
- 常用命令（验证、构建、部署、调试）
- 快速代码模板（RPCD、视图、标题、卡片）
- 错误快速修复

**使用场景：** 日常开发、快速查询、调试

---

#### **CODEX.md**
*Codex/自动化代理现场手册*

**内容：**
- 仓库上下文和文档地图
- 不可妥协的构建/设计标准
- LLM 工作流程的提示词模板
- 帮助和故障排除指引
- 文档 TODO 雷达和历史记录

**使用场景：** 启动 Codex/AI 辅助编辑之前、创建提示词时，或将工作与当前文档计划对齐时

---

#### **README.md**
*项目概览和兼容性矩阵*

**内容：**
- 项目描述和功能
- OpenWrt 版本兼容性（24.10.x、25.12.0-rc1 等）
- 包格式支持（.ipk vs .apk）
- 安装说明
- 模块分类和描述

**使用场景：** 项目概览、版本兼容性检查

---

### 2. 完整参考文档

#### **DEVELOPMENT-GUIDELINES.md**
*完整开发指南 - 权威参考*

**内容：**
- **设计系统**：调色板、排版、组件库
- **架构**：文件结构、命名约定、RPCD 模式
- **最佳实践**：RPCD、ubus、ACL、JavaScript、CSS 标准
- **常见错误**：典型问题的诊断和解决方案
- **验证**：提交前、部署前、部署后检查清单
- **部署**：分步部署程序

**使用场景：** 详细技术问题、设计决策、故障排除

**规模：** 全面（约 500+ 行）

---

#### **CLAUDE.md**
*构建系统、架构和 CI/CD 参考*

**内容：**
- OpenWrt SDK 构建命令
- 包测试程序
- 验证工具和工作流程
- LuCI 包结构
- 前后端通信
- 关键命名约定
- CI/CD 集成（GitHub Actions）
- 常见问题和解决方案

**使用场景：** 构建问题、CI/CD 工作流程、架构问题

---

### 3. 实现和重新生成文档

#### **MODULE-IMPLEMENTATION-GUIDE.md**
*实现/重新生成模块的主指南*

**内容：**
- 重新生成模块的分步工作流程
- 如何使用 Claude.ai 生成代码
- 完整实现示例（从提示词到部署）
- 常见实现模式（多标签仪表板、过滤器、表单）
- 模块特定说明（System Hub、WireGuard、CrowdSec 等）
- 带解决方案的故障排除指南
- 最佳实践（代码组织、错误处理、性能、用户体验）
- 部署检查清单

**使用场景：** 实现新模块、重新生成现有模块、使用 AI 辅助

**规模：** 全面指南（约 800+ 行）

---

#### **FEATURE-REGENERATION-PROMPTS.md**
*所有 15 个 SecuBox 模块的即用提示词*

**内容：**
- 设计系统参考（CSS 变量、排版、组件）
- 所有 15 个模块的完整提示词：
  1. SecuBox Central Hub
  2. System Hub（9 个标签）
  3. CrowdSec 仪表板
  4. Netdata 仪表板
  5. Netifyd 仪表板
  6. 网络模式
  7. WireGuard 仪表板
  8. Client Guardian
  9. Auth Guardian
  10. 带宽管理器
  11. 流量整形器
  12. Media Flow
  13. CDN 缓存
  14. VHost 管理器
  15. KSM 管理器
- 所有模块通用的 UI 模式
- Claude.ai 使用说明

**使用场景：** 让 AI 生成模块代码、了解模块需求

**规模：** 广泛（约 2000+ 行）

---

#### **CODE-TEMPLATES.md**
*从生产模块提取的可用代码模板*

**内容：**
- 文件结构模板
- API 模块模板（api.js）
- JavaScript 视图模板（overview.js）
- RPCD 后端模板（shell 脚本）
- 菜单 JSON 模板
- ACL JSON 模板
- CSS 样式模板
- 完整的最小工作示例
- 常见陷阱和解决方案
- 验证检查清单

**使用场景：** 手动实现、理解模式、复制样板代码

**规模：** 详细模板（约 1200+ 行）

---

### 4. 嵌入式部署指南

#### **embedded/docker-zigbee2mqtt.md**
*在 SecuBox（ARM64）上通过 Docker 部署 Zigbee2MQTT。*

指引：请参阅 `docs/embedded/docker-zigbee2mqtt.md` 获取规范版本。

#### **embedded/vhost-manager.md**
*如何使用 vhost 管理器和 CLI 助手通过 nginx 发布服务。*

指引：请参阅 `docs/embedded/vhost-manager.md` 获取规范版本。

#### **embedded/app-store.md**
*清单模式、`secubox-app` CLI 用法和打包的 SecuBox 应用（Zigbee2MQTT、Lyrion、Domoticz）。*

指引：请参阅 `docs/embedded/app-store.md` 获取规范版本。

#### **embedded/wizard-profiles.md**
*首次运行向导和类操作系统配置文件。*

指引：请参阅 `docs/embedded/wizard-profiles.md` 获取规范版本。

#### **embedded/lyrion-docker.md**
*通过 Docker 部署 Lyrion Media Server。*

指引：请参阅 `docs/embedded/lyrion-docker.md` 获取规范版本。

#### **embedded/domoticz-docker.md**
*通过 Docker 部署 Domoticz 家庭自动化。*

指引：请参阅 `docs/embedded/domoticz-docker.md` 获取规范版本。

---

### 5. 工具和脚本文档

#### **secubox-tools/README.md**
*验证和构建工具文档*

**内容：**
- 工具描述（validate-modules.sh、local-build.sh 等）
- 每个工具的使用示例
- 支持的架构和设备
- 包构建工作流程
- 固件构建工作流程
- 验证检查（7 项自动化检查）
- 推荐的工作流程
- 常见修复

**使用场景：** 使用验证工具、本地构建、固件生成

---

### 6. 在线演示和示例

#### **在线演示网站**
*所有模块的生产演示*

**URL：** https://secubox.cybermood.eu

**可用演示：**
- 主仪表板：`/`
- System Hub：`/system-hub`
- CrowdSec：`/crowdsec`
- WireGuard：`/wireguard`
- 所有 15 个模块均可访问

**使用场景：** 视觉参考、了解 UI/UX、测试功能

---

## 按任务快速查找

### 我想要...

#### ...从零开始创建新模块
1. 阅读：**MODULE-IMPLEMENTATION-GUIDE.md**（分步工作流程）
2. 从以下复制提示词：**FEATURE-REGENERATION-PROMPTS.md**
3. 使用以下模板：**CODE-TEMPLATES.md**
4. 验证：`./secubox-tools/validate-modules.sh`

#### ...重新生成现有模块
1. 阅读：**MODULE-IMPLEMENTATION-GUIDE.md**（章节："分步：使用 Claude.ai 重新生成模块"）
2. 从以下复制模块规范：**FEATURE-REGENERATION-PROMPTS.md**
3. 使用 Claude.ai 或从以下复制模板：**CODE-TEMPLATES.md**
4. 按照 **MODULE-IMPLEMENTATION-GUIDE.md** 验证和部署

#### ...修复 RPCD "Object not found" 错误
1. 快速修复：**QUICK-START.md**（错误快速修复章节）
2. 详细故障排除：**DEVELOPMENT-GUIDELINES.md**（常见错误章节）
3. 或：**MODULE-IMPLEMENTATION-GUIDE.md**（故障排除指南）

#### ...了解设计系统
1. 快速参考：**QUICK-START.md**（设计系统要点）
2. 完整指南：**DEVELOPMENT-GUIDELINES.md**（设计系统和 UI 指南）
3. 查看在线示例：**https://secubox.cybermood.eu**

#### ...本地构建包
1. 快速命令：**QUICK-START.md**（构建和部署章节）
2. 完整指南：**secubox-tools/README.md**
3. 架构详情：**CLAUDE.md**（构建命令章节）

#### ...提交前验证更改
1. 运行：`./secubox-tools/fix-permissions.sh --local`
2. 运行：`./secubox-tools/validate-modules.sh`
3. 查看检查清单：**DEVELOPMENT-GUIDELINES.md**（验证检查清单）

#### ...了解菜单和 ACL 配置
1. 快速模板：**CODE-TEMPLATES.md**（菜单 JSON 模板、ACL JSON 模板）
2. 详细指南：**DEVELOPMENT-GUIDELINES.md**（架构和命名约定）
3. 工作示例：查看任何 `luci-app-*/root/usr/share/` 目录

#### ...部署到测试路由器
1. 快速命令：**QUICK-START.md**（常用命令）
2. 分步：**MODULE-IMPLEMENTATION-GUIDE.md**（部署到测试路由器章节）
3. 部署后修复权限：`./secubox-tools/fix-permissions.sh --remote`

#### ...了解 CSS 变量系统
1. 快速参考：**QUICK-START.md**（CSS 变量章节）
2. 完整指南：**DEVELOPMENT-GUIDELINES.md**（CSS/样式标准）
3. 模板：**CODE-TEMPLATES.md**（CSS 样式模板）
4. 在线 CSS：`luci-app-system-hub/htdocs/luci-static/resources/system-hub/common.css`

#### ...编写 RPCD 后端脚本
1. 模板：**CODE-TEMPLATES.md**（RPCD 后端模板）
2. 最佳实践：**DEVELOPMENT-GUIDELINES.md**（RPCD 和 ubus 最佳实践）
3. 工作示例：查看任何 `luci-app-*/root/usr/libexec/rpcd/` 目录

#### ...创建多标签仪表板
1. 模式：**MODULE-IMPLEMENTATION-GUIDE.md**（模式 1：多标签仪表板）
2. 示例：查看 `luci-app-system-hub`（9 个标签）
3. 在线演示：https://secubox.cybermood.eu/system-hub

---

## 文档比较矩阵

| 文档 | 规模 | 范围 | 使用场景 | 受众 |
|------|------|------|----------|------|
| **QUICK-START.md** | 小 | 快速参考 | 日常开发 | 所有开发者 |
| **README.md** | 小 | 项目概览 | 首次介绍 | 新贡献者 |
| **DEVELOPMENT-GUIDELINES.md** | 大 | 完整参考 | 详细问题 | 所有开发者 |
| **CLAUDE.md** | 中 | 构建和架构 | 构建/CI/CD 问题 | 开发者、DevOps |
| **MODULE-IMPLEMENTATION-GUIDE.md** | 大 | 实现工作流程 | 模块创建 | AI 辅助开发 |
| **FEATURE-REGENERATION-PROMPTS.md** | 很大 | 模块规范 | AI 提示词 | AI 辅助开发 |
| **CODE-TEMPLATES.md** | 大 | 代码模板 | 手动编码 | 开发者 |
| **secubox-tools/README.md** | 中 | 工具文档 | 工具使用 | 开发者、DevOps |

---

## 文档更新工作流程

对代码库进行更改时：

1. **更新代码** 在模块文件中
2. **运行验证**：`./secubox-tools/validate-modules.sh`
3. **更新文档** 如果：
   - 引入新模式 -> 添加到 **CODE-TEMPLATES.md**
   - 新设计指南 -> 更新 **DEVELOPMENT-GUIDELINES.md**
   - 新常见错误 -> 添加到 **QUICK-START.md** 和 **DEVELOPMENT-GUIDELINES.md**
   - 新模块 -> 添加到 **FEATURE-REGENERATION-PROMPTS.md**
   - 新构建功能 -> 更新 **CLAUDE.md** 和 **secubox-tools/README.md**
4. **更新版本** 和修改文档中的日期
5. **提交** 文档与代码更改一起

---

## 支持和联系

- **文档问题：** 在 [GitHub Issues](https://github.com/anthropics/claude-code/issues) 创建问题
- **技术支持：** support@cybermind.fr
- **在线演示：** https://secubox.cybermood.eu
- **公司：** CyberMind.fr

---

## 学习路径

### 初级（SecuBox 新手）
1. 第 1 天：阅读 **README.md** + **QUICK-START.md**
2. 第 2 天：浏览 **DEVELOPMENT-GUIDELINES.md**（重点关注设计系统和架构）
3. 第 3 天：按照 **MODULE-IMPLEMENTATION-GUIDE.md** 实现一个简单模块
4. 第 4 天：学习现有模块（从 `luci-app-cdn-cache` 开始 - 最简单）
5. 第 5 天：进行首次贡献

### 中级（熟悉 OpenWrt/LuCI）
1. 阅读 **DEVELOPMENT-GUIDELINES.md**（完整文档）
2. 查看 **CODE-TEMPLATES.md** 了解模式
3. 使用 **FEATURE-REGENERATION-PROMPTS.md** 配合 Claude.ai 生成模块
4. 学习 **CLAUDE.md** 了解构建系统详情
5. 贡献新模块或增强现有模块

### 高级（准备好处理复杂模块）
1. 学习复杂模块：System Hub、Network Modes
2. 阅读所有文档以全面理解
3. 使用 **MODULE-IMPLEMENTATION-GUIDE.md** 模式实现高级功能
4. 为核心设计系统和工具做贡献
5. 帮助改进文档

---

## 版本历史

| 版本 | 日期 | 更改 |
|------|------|------|
| 1.0.0 | 2025-12-27 | 初始完整文档发布 |
|  |  | - 创建 FEATURE-REGENERATION-PROMPTS.md（15 个模块） |
|  |  | - 创建 CODE-TEMPLATES.md（完整模板） |
|  |  | - 创建 MODULE-IMPLEMENTATION-GUIDE.md（主指南） |
|  |  | - 创建 DOCUMENTATION-INDEX.md（本文件） |
|  |  | - 增强现有文档 |

---

## 文档质量目标

- **完整性：** 涵盖 SecuBox 开发的所有方面
- **准确性：** 代码示例经过测试且可运行
- **清晰度：** 带示例的清晰解释
- **可维护性：** 随着代码库演进易于更新
- **可访问性：** 针对不同使用场景的多个入口点
- **AI 友好：** 结构化以支持 AI 辅助开发

---

**最后更新：** 2025-12-27
**维护者：** CyberMind.fr
**许可证：** Apache-2.0
