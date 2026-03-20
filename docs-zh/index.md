# SecuBox 文档

🌐 **语言：** [English](../docs/index.md) | [Français](../docs-fr/index.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**项目：** OpenWrt LuCI 安全与管理套件

欢迎使用 SecuBox 文档！本综合指南涵盖了 SecuBox 模块开发、部署和维护的所有方面。

---

## 🏗️ 什么是 SecuBox？

SecuBox 是一个面向 OpenWrt 的**综合安全和网络管理套件**，由 **15 个 LuCI 应用模块**组成，提供：

- **安全监控** - CrowdSec 入侵防护、Netdata 指标
- **网络智能** - 深度包检测、流量分类
- **访问控制** - 强制门户、认证、VPN 管理
- **性能优化** - QoS、带宽管理、缓存
- **系统管理** - 集中式仪表板、服务管理

---

## 🚀 快速导航

### 快速入门

SecuBox 新手？从这里开始！

[快速入门指南](quick-start.md)

### 开发指南

包含架构图的完整开发参考

[开发指南](development-guidelines.md)

### 代码模板

工作示例和实现模式

[代码模板](code-templates.md)

### 验证

模块验证和测试工作流程

[验证指南](validation-guide.md)

---

## 📦 15 模块套件

### 核心控制（2 个模块）
- **SecuBox 中央控制中心** - 主仪表板和模块管理
- **系统中心** - 系统管理（健康、服务、日志、备份等）

### 安全与监控（2 个模块）
- **CrowdSec 仪表板** - 入侵防护和威胁情报
- **Netdata 仪表板** - 实时系统监控

### 网络智能（2 个模块）
- **Netifyd 仪表板** - 深度包检测和分类
- **网络模式** - 网络配置文件管理

### VPN 与访问控制（3 个模块）
- **WireGuard 仪表板** - VPN 隧道管理
- **客户端守卫** - 网络访问控制和强制门户
- **认证守卫** - 认证系统

### 带宽与流量（2 个模块）
- **带宽管理器** - QoS 和带宽配额
- **流量整形器** - 高级流量整形

### 性能与服务（2 个模块）
- **CDN 缓存** - 内容分发网络代理缓存
- **VHost 管理器** - 虚拟主机配置

### 系统优化（2 个模块）
- **媒体流** - 媒体流量优化
- **KSM 管理器** - 内核同页合并

[查看模块状态 →](module-status.md)

---

## 🎨 设计系统

SecuBox 使用现代、一致的设计系统：

- **调色板：** 靛蓝/紫罗兰渐变，支持深色模式
- **字体：** Inter（文本）+ JetBrains Mono（代码/数值）
- **组件：** 卡片、徽章、按钮带渐变效果
- **布局：** 响应式网格系统

查看[设计系统部分](development-guidelines.md#design-system-ui-guidelines)获取完整规格。

---

## 🔧 开发工作流程

!!! warning "关键规则"
    1. **RPCD 命名：** 脚本名称必须与 ubus 对象匹配（`luci.module-name`）
    2. **菜单路径：** 必须与视图文件位置完全匹配
    3. **权限：** RPCD 脚本 755，CSS/JS 644
    4. **验证：** 提交前始终运行 `./secubox-tools/validate-modules.sh`

### 开发工具

```bash
# 验证所有模块（7 项自动检查）
./secubox-tools/validate-modules.sh

# 自动修复文件权限
./secubox-tools/fix-permissions.sh --local

# 本地构建包
./secubox-tools/local-build.sh build luci-app-module-name
```

[完整开发工作流程 →](development-guidelines.md#deployment-procedures)

---

## 🌐 在线演示

体验 SecuBox 的实际运行：

**生产演示：** [https://secubox.cybermood.eu](https://secubox.cybermood.eu)

- 主仪表板：`/`
- 系统中心：`/system-hub`
- CrowdSec：`/crowdsec`
- 所有 15 个模块均可访问

---

## 📚 文档章节

### 新贡献者
1. [快速入门指南](quick-start.md) - 基本规则和命令
2. [开发指南](development-guidelines.md) - 完整参考
3. [CLAUDE.md](claude.md) - 构建系统和架构
4. [仓库指南](repository-guidelines.md) - 结构、工作流程和 PR 要求

### AI 辅助开发
1. [模块实现指南](module-implementation-guide.md) - 分步工作流程
2. [功能再生提示](feature-regeneration-prompts.md) - 所有模块的 AI 提示
3. [代码模板](code-templates.md) - 实现模式

---

## 📞 支持与资源

- **GitHub 仓库：** [gkerma/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **文档问题：** [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)
- **技术支持：** support@cybermind.fr
- **公司：** CyberMind.fr

---

## 📝 许可证

Apache-2.0

---

<small>**最后更新：** 2025-12-28 | **维护者：** CyberMind.fr</small>
