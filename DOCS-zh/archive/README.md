# 文档归档

> **Languages:** [English](../../DOCS/archive/README.md) | [Francais](../../DOCS-fr/archive/README.md) | 中文

**版本:** 1.0.0
**最后更新:** 2025-12-28
**状态:** 活跃


**版本:** 1.0.0
**最后更新:** 2025-12-28
**状态:** 已归档
**目的:** 历史和已完成的文档

---

## 内容

### 历史文档

#### COMPLETION_REPORT.md
- **类型:** 项目完成报告
- **日期:** 2025-12-26
- **状态:** 历史
- **描述:** 全面记录SecuBox文档计划完成情况的报告，包括所有15个模块、验证工具和实施指南。

#### MODULE-ENABLE-DISABLE-DESIGN.md
- **类型:** 设计文档
- **日期:** 2025-12-27
- **版本:** 0.3.1
- **状态:** 已归档（功能已实现）
- **描述:** SecuBox中央控制台模块启用/禁用功能的设计规范。此功能已实现并部署。

#### BUILD_ISSUES.md
- **类型:** 故障排除指南
- **日期:** 2025-12-28
- **版本:** 1.0.0
- **状态:** 已归档（问题已解决）
- **描述:** GitHub Actions SDK编译遇到的构建问题文档。问题已解决，解决方案已整合到主文档中。

---

## 为什么这些文档被归档

### 完成报告
历史完成报告在项目里程碑达成后归档。它们提供了宝贵的项目历史，但日常开发不需要。

### 设计文档
设计文档在功能完全实现和部署后归档。实现细节现在记录在主指南中。

### 问题追踪
构建问题文档在问题解决并将解决方案纳入[DEVELOPMENT-GUIDELINES.md](../DEVELOPMENT-GUIDELINES.md)和[CLAUDE.md](../CLAUDE.md)后归档。

---

## 活跃文档

有关当前活跃维护的文档，请参阅：

- **[DOCUMENTATION-INDEX.md](../DOCUMENTATION-INDEX.md)** - 完整文档索引
- **[QUICK-START.md](../QUICK-START.md)** - 快速参考指南
- **[DEVELOPMENT-GUIDELINES.md](../DEVELOPMENT-GUIDELINES.md)** - 完整开发指南
- **[CLAUDE.md](../CLAUDE.md)** - 构建系统和架构
- **[CODE-TEMPLATES.md](../CODE-TEMPLATES.md)** - 工作代码模板
- **[FEATURE-REGENERATION-PROMPTS.md](../FEATURE-REGENERATION-PROMPTS.md)** - 模块规范

---

## 归档政策

在以下情况下，文档将移至归档：
1. 功能/项目已完成
2. 信息已过时但具有历史价值
3. 内容已迁移到活跃文档
4. 文档仅作为历史参考

---

## 恢复归档文档

如果您需要参考或恢复归档文档：

```bash
# 查看归档文档
cat /path/to/secubox-openwrt/DOCS/archive/DOCUMENT_NAME.md

# 恢复到活跃文档（如需要）
cp archive/DOCUMENT_NAME.md ../DOCUMENT_NAME.md
```

---

**维护者:** CyberMind.fr
**许可证:** Apache-2.0
**最后更新:** 2025-12-28
