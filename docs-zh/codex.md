# SecuBox Codex 现场手册

🌐 **语言：** [English](../docs/codex.md) | [Français](../docs-fr/codex.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

---

## 背景与范围

SecuBox 为 OpenWrt 打包了十五个以上的安全和网络仪表板，配备统一的构建/验证工具链和自动交付 `.ipk`/`.apk` 构件的 CI（参见 `README.md` 了解模块目录和 CI 徽章，`README.md:7-34`）。文档集有意分层设计——`DOCS/DOCUMENTATION-INDEX.md` 引导新手、AI 助手和维护者找到合适的深度，因此在深入大型指南之前，始终从那里开始请求（`DOCS/DOCUMENTATION-INDEX.md:15-31`）。

当您需要快速向 Codex（或任何自动化代理）简报 SecuBox 的期望时，请使用此文件：哪些标准是不可变的、如何构建提示词、从哪里获取帮助、哪些决策塑造了当前的代码树，以及在自动化运行期间应保持可见的 TODO 事项。

### 模块与文档地图
- `README.md`：单页概览、兼容性矩阵和"新功能"要点（`README.md:7-34`）。
- `DOCS/QUICK-START.md`：关键规则、设计令牌、命令和错误处理手册（`DOCS/QUICK-START.md:9-195`）。
- `DOCS/DEVELOPMENT-GUIDELINES.md`：深入了解架构、RPCD、ubus、CSS/JS 约定和部署（参见 `DOCS/DOCUMENTATION-INDEX.md:68-82` 中的摘要）。
- `DOCS/MODULE-IMPLEMENTATION-GUIDE.md` + `DOCS/FEATURE-REGENERATION-PROMPTS.md`：重新生成工作流加上所有模块的即用型提示词（`DOCS/DOCUMENTATION-INDEX.md:102-149`）。
- `DOCS/CODE-TEMPLATES.md`：可安全复制/粘贴的 LuCI JS、RPCD 脚本和 API 脚手架（`DOCS/DOCUMENTATION-INDEX.md:153-159`）。

---

## 最佳实践概要

### 不可妥协事项（融入每个提示词或 PR）
- RPCD 文件名**必须**与 ubus 对象相同（防止 `-32000 Object not found`，`DOCS/QUICK-START.md:11-18`）。
- 菜单 JSON 的 `path` **必须**与视图路径匹配（避免 404，`DOCS/QUICK-START.md:20-26`）。
- 权限：RPCD 755，LuCI 资源 644，否则 RPCD 无法执行或 LuCI 返回 403（`DOCS/QUICK-START.md:28-37`）。
- 在开启 PR 或标记构建之前，始终运行 `./secubox-tools/validate-modules.sh`（在 `README.md:18-23` 和 `DOCS/QUICK-START.md:122-134` 中强调）。
- 保持设计令牌一致：深色调色板（基色 `#0a0a0f`，渐变 `#6366f1→#8b5cf6`）、Inter + JetBrains Mono 字体、`.sh-*`/`.sb-*` 组件，以及快速入门中定义的响应式网格宽度（`DOCS/QUICK-START.md:74-114`）。

### 验证与工具链流程
1. **权限修复（本地/远程）：** `./secubox-tools/fix-permissions.sh --local|--remote` 用于自动化 chmod 健全性检查（`DOCS/QUICK-START.md:55-66, 125-127`）。
2. **完整验证：** `./secubox-tools/validate-modules.sh`（运行七项结构检查，包括权限扫描）（`DOCS/QUICK-START.md:122-134,185-189`）。
3. **模块构建：** `./secubox-tools/local-build.sh build <module>` 用于快速冒烟测试，或在 SDK 内使用 `make package/<module>/compile V=s`（`DOCS/QUICK-START.md:135-143`）。
4. **部署/修复：** 通过 `scp` 复制到路由器，标准化权限，清除 `luci` 缓存，重启 `rpcd`/`uhttpd`（`DOCS/QUICK-START.md:144-167`）。
5. **调试：** 验证 ubus 对象，检查 LuCI 资源，部署后立即 tail `logread`（`DOCS/QUICK-START.md:156-167`）。

### 设计与用户体验提醒
- 统计卡片最小宽度 130 px，指标卡 240 px，详情卡 300 px：编码这些 CSS 网格规则以保持仪表板在 720p+ 视口上流畅（`DOCS/QUICK-START.md:105-114`）。
- 按钮、标签和卡片暴露 `.sh-` 实用类；为了可维护性，优先使用渐变边框和霓虹状态，而非内联样式（同一部分）。
- 使文案与 README 分类对齐（Core Control、Security & Monitoring、Network Intelligence 等），以保持文档和 UI 同步（`README.md:37-152` 摘录）。

---

## 提示词手册

在起草 Codex/LLM 提示词时，提供足够的结构，以便助手可以重用现有模式而不是发明新的。重用此大纲：

```text
背景：
- 目标模块 + 文件 + 期望的更改。
- CODE-TEMPLATES 或现有 JS/RPCD 文件的任何相关摘录。

要求：
- 重申不可妥协事项（RPCD 命名、菜单路径、权限、设计令牌）。
- 提及 Codex 应运行或假设的验证命令。
- 指出要公开的 API 端点、ubus 对象或指标。

交付物：
- 要修改的文件（路径 + 理由）。
- 预期的测试/验证（例如，运行 ./secubox-tools/validate-modules.sh）。
- 参考 QUICK-START 的 UX 提示（颜色、网格大小、组件类）。

护栏：
- 注明 TODO 项目或文档标准（版本头、交叉链接等）。
- 提醒 Codex 在哪里记录更改（README、模块变更日志等）。
```

将此模板与 `DOCS/FEATURE-REGENERATION-PROMPTS.md` 中的模块特定提示词和 `DOCS/MODULE-IMPLEMENTATION-GUIDE.md` 中的工作流配对（`DOCS/DOCUMENTATION-INDEX.md:102-149`）。这种组合让 Codex 可以继承现有的布局结构、RPCD shell 和 API 模块，而无需脆弱的猜测。

---

## 帮助与故障排除

- **部署前健全性检查：** 在复制文件之前运行 overlay 磁盘/权限 SSH 检查；它们已在快速入门中脚本化，因此您可以直接粘贴到终端会话中（`DOCS/QUICK-START.md:40-53`）。
- **常见错误修复：** 保持快速修复随手可得：HTTP 403（chmod 资源）、"No space left"（清除 `/tmp/*.ipk` 和备份）、ubus `-32000`（chmod 755 + ubus list）。尽可能通过 `secubox-tools` 自动化（`DOCS/QUICK-START.md:55-70,171-180`）。
- **设计偏移：** 如果 CSS 感觉不一致，请对照本手册和快速入门设计部分中的调色板/字体/组件进行检查（`DOCS/QUICK-START.md:74-114`）。
- **需要示例？** 从 `DOCS/CODE-TEMPLATES.md` 或 `luci-app-*` 下的活动模块中提取实际的 JS/RPCD 代码片段，以保持生成的代码符合惯例（`DOCS/DOCUMENTATION-INDEX.md:153-159`）。
- **仍然受阻？** `DOCS/DEVELOPMENT-GUIDELINES.md` 包含每个标准的详细理由；在升级问题时引用相关部分，以便维护者快速看到权威来源（`DOCS/DOCUMENTATION-INDEX.md:68-82`）。

---

## 历史记录

- **2025-12-26 – 完整开发指南发布：** README 宣布全套开发指南的到来（README 徽章部分，`README.md:7-16`）。
- **2025-12-27 – 文档索引 v1.0.0：** 中央索引正式化了文档地图和 AI 工作流分支（`DOCS/DOCUMENTATION-INDEX.md:1-31`）。
- **2025-12-28 – 文档改进计划：** 生成 `TODO-ANALYSE.md` 以协调版本控制、交叉链接和归档任务（`TODO-ANALYSE.md:1-34,71-150`）。
- **2025-12-28 – Codex 手册起草：** 本 CODEX 现场手册正式规定了自动化代理今后应如何运作。

---

## TODO 雷达（保持 Codex 对齐）

1. **标准化版本头和日期** – 确保每个 `.md` 显示 `版本/最后更新/状态`，使用一致的 `YYYY-MM-DD` 格式；DOCUMENTATION-INDEX 必须在更新落地后描述该策略（`TODO-ANALYSE.md:24-68`）。
2. **添加"另请参阅"交叉链接** – 将 QUICK-START、PERMISSIONS-GUIDE、VALIDATION-GUIDE 和其他快速参考与其父指南相互链接，以免 AI/用户得到孤立的指令（`TODO-ANALYSE.md:71-116`）。
3. **归档历史文档** – 创建 `docs/archive/`，移动过时的参考资料（COMPLETION_REPORT、MODULE-ENABLE-DISABLE-DESIGN、BUILD_ISSUES 等），并放置一个描述内容的归档 README（`TODO-ANALYSE.md:120-153`）。
4. **未来工作（每月/每季度）** – 新图表、TESTING/SECURITY/PERFORMANCE 指南、文档新鲜度自动化和 i18n 决策在 `TODO-ANALYSE.md` 中稍后排队；当提示词可能影响下游范围或格式时，请提及它们。

Codex 应将上述 TODO 视为护栏：如果任务涉及文档，优先选择使我们朝这些目标推进的解决方案（例如，在编辑文档时添加版本头，或在涉及快速参考时添加交叉链接）。

---

## Codex 运行快速参考清单

- [ ] 确认请求引用了正确的指南/模板以最小化幻觉（`DOCS/DOCUMENTATION-INDEX.md` 路径）。
- [ ] 将不可妥协事项 + 验证流程复制/粘贴到提示词中。
- [ ] 说明该更改推进了哪些 TODO 雷达项目（或至少不会倒退）。
- [ ] 引用更改后要运行的命令/脚本。
- [ ] 在 PR/提交描述中捕获发现，在相关时引用本 CODEX 手册。

将此活文档既用作飞行前简报，又用作自动化工作的汇报日志。每当上述标准发展时更新它，以便每个未来的 Codex 会话都以正确的心智模型开始。
