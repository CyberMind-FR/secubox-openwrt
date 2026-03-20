# 更新日志

**语言:** [English](CHANGELOG.md) | [Francais](CHANGELOG.fr.md) | 中文

SecuBox 项目的所有重要变更都将记录在此文件中。

本文件格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.17.0] - 2026-01-31 - 首次公开发布

### 亮点

此版本标志着 SecuBox 的**首次公开发布**。所有核心功能现已稳定并可投入生产使用。

### 新增

- **三环安全架构**文档 (`DOCS/THREE-LOOP-ARCHITECTURE.md`)
  - 第一环（运营层）：实时威胁检测与阻断
  - 第二环（战术层）：模式关联与自适应响应
  - 第三环（战略层）：威胁情报聚合与演进
- 架构映射图，展示 38 个模块如何整合到三环模型中
- README 中的路线图部分，包含通向 ANSSI 认证的 5 阶段计划
- README 头部的版本徽章
- 面向 v0.18+ 开发的 P2P Hub 愿景文档
- 用于去中心化节点信任的 did:plc 身份模型分析

### 变更

- README.md 重构，包含首次公开发布公告
- 状态从"积极开发中"更改为"生产就绪"
- 网站 URL 更新为 secubox.maegia.tv
- 在 README 概览中添加了三环架构图

### 安全

- 记录了完整的第一环实现：
  - nftables/fw4 数据包过滤（延迟 < 1ms）
  - netifyd DPI 分类（< 10ms）
  - CrowdSec Bouncer 执行（传播 < 1s）
- 记录了完整的第二环实现：
  - CrowdSec Agent 日志解析
  - LAPI 本地决策引擎
  - 自定义 OpenWrt 场景
  - Netdata 指标关联

### 路线图

| 阶段 | 版本 | 状态 |
|------|------|------|
| 核心网格 | v0.17 | 已发布 |
| 服务网格 | v0.18 | 下一个 |
| 情报网格 | v0.19 | 计划中 |
| AI 网格 | v0.20 | 计划中 |
| 认证 | v1.0 | 计划中 |

---

## [0.16.0] - 2026-01-27

### 新增
- SDK 与完整工具链构建需求的文档
- README.md 中的构建需求表，区分 SDK 和工具链构建
- MochaBin/Cortex-A72 的 ARM64 LSE 原子操作兼容性说明

### 变更
- README.md 更新，包含按功能分类的全部 38 个模块
- secubox-tools/README.md 更新至 v1.1.0，包含工具链指南
- CLAUDE.md 更新，包含关键的工具链构建规则

### 修复
- 记录了 ARM64 上 Go CGO 包的 SIGILL 崩溃修复（使用完整工具链）

## [0.15.4] - 2026-01-21

### 新增
- HexoJS 构建与发布 LuCI 界面，用于 Gitea 工作流集成
- Streamlit 平台的多实例管理

### 修复
- 多实例部署的 CrowdSec LAPI 端口配置

## [0.15.3] - 2026-01-14

### 新增
- HAProxy 增强的实例管理和 ACME 定时任务支持
- Streamlit 特定实例的配置选项

### 修复
- Streamlit 设置页面值加载问题

## [0.15.0] - 2025-12-29

### 新增
- 跨所有模块的 SecuNav 统一导航组件
- 支持深色/浅色/赛博朋克主题的主题同步
- 带配置文件和验证的快速部署工具

### 变更
- 所有视图现在都调用 Theme.init() 以保持主题一致性
- 监控菜单简化（无 /overview 垫片）
- 仪表板、模块、监控视图使用 SecuNav 样式

### 修复
- System Hub 诊断和远程 RPC 方法的 ACL 合规性
- 跨模块 LuCI 菜单的验证器改进
- CSS/JS 资源权限重置为 644

## [0.14.0] - 2025-12-28

### 新增
- 设置中带实时预览的主题选择器
- secubox/common.css 中的共享设计令牌

### 变更
- 警报页面采用仪表板样式，带动态头部标签
- 设置视图采用 SecuNav 标签页和共享设计语言

## [0.13.0] - 2025-12-24

### 变更
- 模块视图带过滤标签、响应式卡片和实时统计
- 监控视图带 SVG 迷你图和自动刷新

## [0.12.0] - 2025-12-20

### 新增
- 仪表板英雄统计数据和 SecuNav 顶部标签
- 统一的 sh-page-header 布局组件

---

## 模块清单（0.17.0 版本共 38 个模块）

### SecuBox 核心 (5)
- luci-app-secubox
- luci-app-secubox-portal
- luci-app-secubox-admin
- luci-app-secubox-bonus
- luci-app-system-hub

### 安全与威胁管理 (9)
- luci-app-crowdsec-dashboard
- luci-app-secubox-security-threats
- luci-app-client-guardian
- luci-app-auth-guardian
- luci-app-exposure
- luci-app-tor-shield
- luci-app-mitmproxy
- luci-app-cyberfeed
- luci-app-ksm-manager

### 深度包检测 (2)
- luci-app-ndpid
- luci-app-secubox-netifyd

### 网络与连接 (8)
- luci-app-vhost-manager
- luci-app-haproxy
- luci-app-wireguard-dashboard
- luci-app-network-modes
- luci-app-network-tweaks
- luci-app-mqtt-bridge
- luci-app-cdn-cache
- luci-app-media-flow

### 带宽与流量管理 (2)
- luci-app-bandwidth-manager
- luci-app-traffic-shaper

### 内容与 Web 平台 (5)
- luci-app-gitea
- luci-app-hexojs
- luci-app-metabolizer
- luci-app-magicmirror2
- luci-app-mmpm

### AI/LLM 与分析 (4)
- luci-app-localai
- luci-app-ollama
- luci-app-glances
- luci-app-netdata-dashboard

### 流媒体与数据处理 (2)
- luci-app-streamlit
- luci-app-picobrew

### 物联网与智能设备 (1)
- luci-app-zigbee2mqtt
