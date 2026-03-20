# SecuBox 全局主题系统

> **Languages:** [English](../DOCS/GLOBAL_THEME_SYSTEM.md) | [Francais](../DOCS-fr/GLOBAL_THEME_SYSTEM.md) | 中文

**版本:** 1.0.0
**日期:** 2025-12-28
**状态:** 规划与规范

## 愿景

为所有 SecuBox 模块创建一个统一、动态、响应式和现代的"CyberMood"设计系统，支持多语言，灵感来自 SecuBox 营销网站的美学。

## CyberMood 设计语言

### 核心美学原则

**"CyberMood"** = 赛博朋克 + 现代极简主义
- **金属与玻璃**: 反射表面、玻璃拟态效果
- **霓虹强调**: 电蓝、紫色、青色带发光效果
- **深色基底**: 带有微妙渐变的深色背景
- **动态运动**: 流畅动画、粒子效果、流动渐变
- **信息密集**: 带有数据可视化的现代仪表板布局
- **响应式流**: 从移动端到桌面端无缝适配

### 视觉识别

```
主色板:
  基底:      #0a0e27 (深空蓝)
  表面:      #151932 (深板岩)
  强调:      #667eea (电蓝)
  次要:      #764ba2 (赛博紫)
  成功:      #10b981 (翡翠绿)
  警告:      #f59e0b (琥珀色)
  危险:      #ef4444 (红色)
  信息:      #06b6d4 (青色)

金属渐变:
  钢铁:      linear-gradient(135deg, #434343 0%, #000000 100%)
  铬:        linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)
  金:        linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)
  赛博:      linear-gradient(135deg, #667eea 0%, #764ba2 100%)

玻璃效果:
  模糊:      backdrop-filter: blur(10px)
  透明度:    rgba(255, 255, 255, 0.05)
  边框:      1px solid rgba(255, 255, 255, 0.1)
  阴影:      0 8px 32px rgba(0, 0, 0, 0.37)

字体:
  标题:      'Orbitron' (赛博朋克标题)
  正文:      'Inter' (清晰可读)
  等宽:      'JetBrains Mono' (代码与指标)

动画:
  速度:      0.3s ease-in-out (标准)
  弹跳:      cubic-bezier(0.68, -0.55, 0.265, 1.55)
  平滑:      cubic-bezier(0.4, 0, 0.2, 1)
```

## 当前状态分析

### 现有主题

```
luci-app-secubox/htdocs/luci-static/resources/secubox/
├── secubox.css         # SecuBox 基础样式 (7.0KB)
├── dashboard.css       # 仪表板专用 (9.5KB)
├── common.css          # 共享工具类 (8.4KB)
├── modules.css         # 模块页面 (7.5KB)
├── alerts.css          # 告警页面 (5.1KB)
├── monitoring.css      # 监控页面 (3.0KB)
├── help.css            # 帮助系统 (7.0KB)
└── theme.js            # 主题 JavaScript (2.0KB)

luci-app-system-hub/htdocs/luci-static/resources/system-hub/
├── dashboard.css       # System Hub 仪表板 (18.2KB)
├── common.css          # System Hub 通用 (8.4KB)
└── theme.js            # System Hub 主题 (类似 secubox)

luci-app-network-modes/htdocs/luci-static/resources/network-modes/
├── dashboard.css       # Network Modes 仪表板 (18.2KB)
└── common.css          # Network Modes 通用 (8.4KB)
```

### 当前方法的问题

1. **碎片化**: 每个模块都有自己的 CSS 文件
2. **重复**: 模块之间重复的通用样式
3. **不一致**: 略有不同的颜色值、间距等
4. **维护**: 更改需要更新多个文件
5. **包大小**: 每个模块加载重复的 CSS (~50KB 总计)
6. **无集中主题**: 无法全局切换主题

## 提议的架构

### 全局主题结构

```
luci-theme-cybermood/                    # 新建: 全局主题包
├── Makefile
├── README.md
└── htdocs/luci-static/resources/
    └── cybermood/
        ├── core/
        │   ├── variables.css            # CSS 自定义属性
        │   ├── reset.css                # 重置/规范化
        │   ├── typography.css           # 字体定义
        │   ├── animations.css           # 关键帧与过渡
        │   └── utilities.css            # 工具类
        ├── components/
        │   ├── buttons.css              # 按钮样式
        │   ├── cards.css                # 卡片组件
        │   ├── forms.css                # 表单元素
        │   ├── tables.css               # 数据表格
        │   ├── modals.css               # 模态对话框
        │   ├── tooltips.css             # 工具提示
        │   ├── badges.css               # 状态徽章
        │   ├── alerts.css               # 告警消息
        │   ├── charts.css               # 图表容器
        │   └── navigation.css           # 导航元素
        ├── layouts/
        │   ├── dashboard.css            # 仪表板布局
        │   ├── grid.css                 # 网格系统
        │   └── responsive.css           # 断点
        ├── themes/
        │   ├── dark.css                 # 深色主题 (默认)
        │   ├── light.css                # 浅色主题
        │   └── cyberpunk.css            # 高对比度赛博
        ├── i18n/
        │   ├── en.json                  # 英文字符串
        │   ├── fr.json                  # 法文字符串
        │   ├── de.json                  # 德文字符串
        │   └── es.json                  # 西班牙文字符串
        ├── cybermood.css                # 主包 (导入全部)
        ├── cybermood.min.css            # 压缩版本
        └── cybermood.js                 # 主题控制器
```

### 模块集成

```javascript
// 在每个模块的视图文件中
'use strict';
'require view';
'require cybermood/theme as Theme';

return view.extend({
    render: function() {
        // 应用主题
        Theme.apply('dark');

        // 使用主题组件
        return E('div', { 'class': 'cyber-container' }, [
            Theme.createCard({
                title: _('模块标题'),
                icon: '🎯',
                content: this.renderContent()
            })
        ]);
    }
});
```

## 即用模板

### 1. CSS 变量 (variables.css)

```css
/**
 * CyberMood 设计系统 - CSS 变量
 * 版本: 1.0.0
 */

:root {
    /* ========================================
       颜色 - 基础色板
       ======================================== */

    /* 深色主题 (默认) */
    --cyber-bg-primary: #0a0e27;
    --cyber-bg-secondary: #151932;
    --cyber-bg-tertiary: #1e2139;
    --cyber-surface: #252b4a;
    --cyber-surface-light: #2d3454;

    /* 文本颜色 */
    --cyber-text-primary: #e2e8f0;
    --cyber-text-secondary: #94a3b8;
    --cyber-text-muted: #64748b;
    --cyber-text-inverse: #0a0e27;

    /* 强调色 */
    --cyber-accent-primary: #667eea;
    --cyber-accent-primary-end: #764ba2;
    --cyber-accent-secondary: #06b6d4;
    --cyber-accent-tertiary: #8b5cf6;

    /* 语义色 */
    --cyber-success: #10b981;
    --cyber-success-light: #34d399;
    --cyber-warning: #f59e0b;
    --cyber-warning-light: #fbbf24;
    --cyber-danger: #ef4444;
    --cyber-danger-light: #f87171;
    --cyber-info: #06b6d4;
    --cyber-info-light: #22d3ee;

    /* 金属渐变 */
    --cyber-gradient-steel: linear-gradient(135deg, #434343 0%, #000000 100%);
    --cyber-gradient-chrome: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%);
    --cyber-gradient-cyber: linear-gradient(135deg, var(--cyber-accent-primary) 0%, var(--cyber-accent-primary-end) 100%);
    --cyber-gradient-success: linear-gradient(135deg, var(--cyber-success) 0%, var(--cyber-success-light) 100%);
    --cyber-gradient-danger: linear-gradient(135deg, var(--cyber-danger) 0%, var(--cyber-danger-light) 100%);

    /* 玻璃效果 */
    --cyber-glass-bg: rgba(255, 255, 255, 0.05);
    --cyber-glass-border: rgba(255, 255, 255, 0.1);
    --cyber-glass-blur: 10px;
    --cyber-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);

    /* ========================================
       字体
       ======================================== */

    --cyber-font-display: 'Orbitron', 'Inter', sans-serif;
    --cyber-font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --cyber-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

    --cyber-font-size-xs: 0.75rem;    /* 12px */
    --cyber-font-size-sm: 0.875rem;   /* 14px */
    --cyber-font-size-base: 1rem;     /* 16px */
    --cyber-font-size-lg: 1.125rem;   /* 18px */
    --cyber-font-size-xl: 1.25rem;    /* 20px */
    --cyber-font-size-2xl: 1.5rem;    /* 24px */
    --cyber-font-size-3xl: 1.875rem;  /* 30px */
    --cyber-font-size-4xl: 2.25rem;   /* 36px */

    --cyber-font-weight-light: 300;
    --cyber-font-weight-normal: 400;
    --cyber-font-weight-medium: 500;
    --cyber-font-weight-semibold: 600;
    --cyber-font-weight-bold: 700;

    /* ========================================
       间距
       ======================================== */

    --cyber-space-xs: 0.25rem;   /* 4px */
    --cyber-space-sm: 0.5rem;    /* 8px */
    --cyber-space-md: 1rem;      /* 16px */
    --cyber-space-lg: 1.5rem;    /* 24px */
    --cyber-space-xl: 2rem;      /* 32px */
    --cyber-space-2xl: 3rem;     /* 48px */
    --cyber-space-3xl: 4rem;     /* 64px */

    /* ========================================
       圆角
       ======================================== */

    --cyber-radius-sm: 0.25rem;  /* 4px */
    --cyber-radius-md: 0.5rem;   /* 8px */
    --cyber-radius-lg: 0.75rem;  /* 12px */
    --cyber-radius-xl: 1rem;     /* 16px */
    --cyber-radius-full: 9999px;

    /* ========================================
       阴影
       ======================================== */

    --cyber-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --cyber-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --cyber-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    --cyber-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
    --cyber-shadow-glow: 0 0 20px rgba(102, 126, 234, 0.5);
    --cyber-shadow-glow-success: 0 0 20px rgba(16, 185, 129, 0.5);
    --cyber-shadow-glow-danger: 0 0 20px rgba(239, 68, 68, 0.5);

    /* ========================================
       过渡
       ======================================== */

    --cyber-transition-fast: 0.15s ease-in-out;
    --cyber-transition-base: 0.3s ease-in-out;
    --cyber-transition-slow: 0.5s ease-in-out;
    --cyber-transition-bounce: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --cyber-transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* ========================================
       Z-Index 层级
       ======================================== */

    --cyber-z-base: 0;
    --cyber-z-dropdown: 1000;
    --cyber-z-sticky: 1100;
    --cyber-z-fixed: 1200;
    --cyber-z-modal-backdrop: 1300;
    --cyber-z-modal: 1400;
    --cyber-z-popover: 1500;
    --cyber-z-tooltip: 1600;
}

/* ========================================
   浅色主题覆盖
   ======================================== */

[data-theme="light"] {
    --cyber-bg-primary: #f8fafc;
    --cyber-bg-secondary: #f1f5f9;
    --cyber-bg-tertiary: #e2e8f0;
    --cyber-surface: #ffffff;
    --cyber-surface-light: #f8fafc;

    --cyber-text-primary: #0f172a;
    --cyber-text-secondary: #475569;
    --cyber-text-muted: #64748b;
    --cyber-text-inverse: #ffffff;

    --cyber-glass-bg: rgba(255, 255, 255, 0.8);
    --cyber-glass-border: rgba(0, 0, 0, 0.1);
    --cyber-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* ========================================
   赛博朋克主题 (高对比度)
   ======================================== */

[data-theme="cyberpunk"] {
    --cyber-bg-primary: #000000;
    --cyber-bg-secondary: #0a0a0a;
    --cyber-accent-primary: #00ffff;
    --cyber-accent-primary-end: #ff00ff;
    --cyber-success: #00ff00;
    --cyber-danger: #ff0000;
    --cyber-shadow-glow: 0 0 30px rgba(0, 255, 255, 0.8);
}
```

### 2. 卡片组件模板 (cards.css)

```css
/**
 * CyberMood 卡片组件
 */

.cyber-card {
    background: var(--cyber-glass-bg);
    backdrop-filter: blur(var(--cyber-glass-blur));
    border: 1px solid var(--cyber-glass-border);
    border-radius: var(--cyber-radius-xl);
    padding: var(--cyber-space-lg);
    box-shadow: var(--cyber-glass-shadow);
    transition: all var(--cyber-transition-base);
    position: relative;
    overflow: hidden;
}

.cyber-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--cyber-gradient-cyber);
    opacity: 0;
    transition: opacity var(--cyber-transition-base);
}

.cyber-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--cyber-shadow-xl), var(--cyber-shadow-glow);
    border-color: var(--cyber-accent-primary);
}

.cyber-card:hover::before {
    opacity: 1;
}

.cyber-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--cyber-space-md);
    padding-bottom: var(--cyber-space-md);
    border-bottom: 1px solid var(--cyber-glass-border);
}

.cyber-card-title {
    font-family: var(--cyber-font-display);
    font-size: var(--cyber-font-size-xl);
    font-weight: var(--cyber-font-weight-semibold);
    color: var(--cyber-text-primary);
    display: flex;
    align-items: center;
    gap: var(--cyber-space-sm);
    margin: 0;
}

.cyber-card-icon {
    font-size: var(--cyber-font-size-2xl);
    filter: drop-shadow(0 0 10px currentColor);
}

.cyber-card-body {
    color: var(--cyber-text-secondary);
    line-height: 1.6;
}

.cyber-card-footer {
    margin-top: var(--cyber-space-lg);
    padding-top: var(--cyber-space-md);
    border-top: 1px solid var(--cyber-glass-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* 卡片变体 */
.cyber-card--success {
    border-color: var(--cyber-success);
}

.cyber-card--success:hover {
    box-shadow: var(--cyber-shadow-xl), var(--cyber-shadow-glow-success);
}

.cyber-card--danger {
    border-color: var(--cyber-danger);
}

.cyber-card--danger:hover {
    box-shadow: var(--cyber-shadow-xl), var(--cyber-shadow-glow-danger);
}

.cyber-card--compact {
    padding: var(--cyber-space-md);
}

.cyber-card--flat {
    background: var(--cyber-surface);
    backdrop-filter: none;
}
```

## 多语言系统

### 翻译文件结构

```json
// en.json (英文)
{
    "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "cancel": "Cancel",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "close": "Close",
        "confirm": "Confirm"
    },
    "dashboard": {
        "title": "Dashboard",
        "welcome": "Welcome to {name}",
        "modules": "Modules",
        "active_modules": "Active Modules",
        "system_status": "System Status",
        "health_score": "Health Score"
    }
}
```

```json
// zh.json (中文)
{
    "common": {
        "loading": "加载中...",
        "error": "错误",
        "success": "成功",
        "cancel": "取消",
        "save": "保存",
        "delete": "删除",
        "edit": "编辑",
        "close": "关闭",
        "confirm": "确认"
    },
    "dashboard": {
        "title": "仪表板",
        "welcome": "欢迎使用 {name}",
        "modules": "模块",
        "active_modules": "活跃模块",
        "system_status": "系统状态",
        "health_score": "健康分数"
    }
}
```

## 实施计划

### 第一阶段: 基础 (第1周)

**任务:**
1. 创建 `luci-theme-cybermood` 包
2. 实现 CSS 变量系统
3. 创建核心组件 (卡片、按钮、表单)
4. 设置构建/压缩流程

**交付物:**
- `/luci-theme-cybermood/htdocs/luci-static/resources/cybermood/`
- `cybermood.css` (主样式表)
- `cybermood.js` (主题控制器)
- `variables.css` (设计标记)

### 第二阶段: 组件库 (第2周)

**任务:**
1. 构建所有可复用组件
2. 创建组件文档
3. 实现深色/浅色/赛博朋克主题
4. 添加动画和过渡

**组件:**
- 卡片、按钮、表单、表格
- 模态框、工具提示、徽章、告警
- 图表、仪表盘、进度条
- 导航元素

### 第三阶段: 模块迁移 (第3周)

**任务:**
1. 更新 `luci-app-secubox` 使用全局主题
2. 更新 `luci-app-system-hub`
3. 更新 `luci-app-network-modes`
4. 更新剩余模块

**迁移模式:**
```javascript
// 之前:
'require secubox/theme as Theme';

// 之后:
'require cybermood/theme as Theme';
```

### 第四阶段: 多语言 (第4周)

**任务:**
1. 创建翻译文件 (en, fr, de, es, zh)
2. 实现语言切换 UI
3. 用翻译键更新所有模块
4. 添加阿拉伯语 RTL 支持

**实现:**
```javascript
// 在模块中使用:
Theme.t('dashboard.welcome', { name: 'SecuBox' });
// 输出: "Welcome to SecuBox" (en) 或 "欢迎使用 SecuBox" (zh)
```

### 第五阶段: 测试与优化 (第5周)

**任务:**
1. 跨浏览器测试
2. 移动端响应性测试
3. 性能优化
4. 可访问性审核 (WCAG 2.1)
5. 用户验收测试

## 成功标准

1. **统一外观**: 所有模块使用一致的设计
2. **性能**: < 50KB 总 CSS 包 (压缩后)
3. **响应式**: 适用于移动端 (320px) 到 4K (3840px)
4. **可访问**: 符合 WCAG 2.1 AA
5. **多语言**: 支持 4+ 语言
6. **主题切换**: < 100ms 主题更换
7. **浏览器支持**: Chrome 90+, Firefox 88+, Safari 14+

## 迁移清单

### 每个模块:

- [ ] 移除模块特定的 CSS 文件
- [ ] 导入全局 `cybermood.css`
- [ ] 更新组件使用 cyber-* 类
- [ ] 用 `Theme.t()` 调用替换硬编码字符串
- [ ] 测试深色/浅色/赛博朋克主题
- [ ] 测试所有支持的语言
- [ ] 验证响应式断点
- [ ] 运行可访问性审核
- [ ] 更新文档

### 全局:

- [ ] 创建 luci-theme-cybermood 包
- [ ] 实现所有核心组件
- [ ] 创建翻译文件
- [ ] 设置构建流程
- [ ] 创建迁移指南
- [ ] 更新全部 15 个模块
- [ ] 性能测试
- [ ] 用户验收测试
- [ ] 生产部署

## 参考

- **设计灵感**: SecuBox 网站 (https://secubox.cybermood.eu)
- **LuCI 主题系统**: `/feeds/luci/themes/`
- **CSS 变量规范**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **i18n 最佳实践**: https://www.w3.org/International/

## 下一步

1. **审查与批准**: 获得利益相关者对设计方向的批准
2. **原型**: 在 Figma/类似工具中创建视觉模型
3. **构建**: 实施第一阶段 (基础)
4. **测试**: 在测试路由器上进行内部 QA
5. **部署**: 推向生产

---

**状态**: 规划中
**优先级**: 高
**工作量**: 4-5 周
**影响**: 所有模块统一
