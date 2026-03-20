# 快速入门指南 - SecuBox 开发

🌐 **语言：** [English](../docs/quick-start.md) | [Français](../docs-fr/quick-start.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**状态：** 活跃

**⚡ 开发快速备忘单**

完整指南请参阅 [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)

---

## 另请参阅

- **完整指南：** [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)
- **架构与构建：** [CLAUDE.md](claude.md)
- **代码模板：** [CODE-TEMPLATES.md](code-templates.md)
- **模块提示：** [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
- **自动化简报：** [CODEX.md](codex.md)

---

## ⚠️ 关键规则（切勿忘记）

### 1. RPCD 脚本命名
```bash
# 名称必须与 ubus 对象完全匹配
JavaScript: object: 'luci.system-hub'
文件:      root/usr/libexec/rpcd/luci.system-hub  ✅

# 否则: Error -32000 "Object not found"
```

### 2. 菜单路径匹配
```json
菜单 JSON: "path": "system-hub/overview"
文件:     view/system-hub/overview.js  ✅

# 否则: HTTP 404 Not Found
```

### 3. 权限文件
```bash
# RPCD 脚本 = 可执行
chmod 755 root/usr/libexec/rpcd/luci.*

# CSS/JS = 只读
chmod 644 htdocs/**/*.{css,js}

# 否则: 403 Forbidden 或脚本不执行
```

### 4. 部署前检查
```bash
# 部署前务必检查:

# 1. 磁盘空间（应小于 90%）
ssh root@192.168.8.191 "df -h | grep overlay"

# 2. 部署后权限
ssh root@192.168.8.191 "find /www/luci-static -name '*.js' -perm 600"
# ⚠️ 如有结果: 文件权限是 600 而非 644 → 403 错误！

# 3. 需要时快速修复
ssh root@192.168.8.191 "find /www/luci-static -name '*.css' -exec chmod 644 {} \;"
ssh root@192.168.8.191 "find /www/luci-static -name '*.js' -exec chmod 644 {} \;"
```

### 5. 常见错误快速修复
```bash
# HTTP 403 Forbidden（最佳方案：使用自动化脚本）
./secubox-tools/fix-permissions.sh --remote  # 自动修复所有权限

# 或手动修复:
chmod 644 /www/luci-static/resources/**/*.{js,css}

# No space left on device
rm -rf /tmp/*.ipk /tmp/luci-*
find /root -name '*.backup-*' -mtime +7 -delete

# Object not found -32000
chmod 755 /usr/libexec/rpcd/luci.*
ubus list | grep luci.module-name  # 检查可用性
```

---

## 🎨 设计系统要点

### 调色板（深色模式）
```css
--sh-bg-primary: #0a0a0f;      /* 主背景 */
--sh-bg-card: #12121a;         /* 卡片 */
--sh-border: #2a2a35;          /* 边框 */
--sh-primary: #6366f1;         /* 靛蓝 */
--sh-primary-end: #8b5cf6;     /* 紫罗兰 */
```

### 字体
```css
/* 通用 */
font-family: 'Inter', sans-serif;

/* 数值 */
font-family: 'JetBrains Mono', monospace;
```

### 组件类
```css
.sh-page-header         /* 页面标题 */
.sh-page-title          /* 标题（渐变文字）*/
.sh-stat-badge          /* 统计徽章（最小 130px）*/
.sh-card                /* 卡片（悬停时渐变边框）*/
.sh-btn-primary         /* 按钮（渐变）*/
.sh-filter-tab          /* 过滤标签 */
```

### 网格尺寸
```css
/* 统计 */
grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));

/* 指标 */
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));

/* 信息卡片 */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```

---

## 🔧 常用命令

### 验证
```bash
# 提交前验证所有内容（7 项检查，包括权限）
./secubox-tools/validate-modules.sh

# 自动修复权限
./secubox-tools/fix-permissions.sh --local

# JSON
jsonlint file.json

# Shell
shellcheck root/usr/libexec/rpcd/*
```

### 构建
```bash
# 本地构建
./secubox-tools/local-build.sh build luci-app-module-name

# OpenWrt SDK 构建
make package/luci-app-module-name/compile V=s
```

### 部署
```bash
# 复制文件
scp file.js root@192.168.8.191:/www/luci-static/resources/

# 修复权限
ssh root@192.168.8.191 "chmod 644 /www/luci-static/resources/**/*.css"

# 清除缓存 + 重启
ssh root@192.168.8.191 "rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* && /etc/init.d/rpcd restart && /etc/init.d/uhttpd restart"
```

### 调试
```bash
# 测试 RPCD
ssh root@router "ubus list | grep luci.module"
ssh root@router "ubus call luci.module-name getStatus"

# 检查文件
ssh root@router "ls -la /www/luci-static/resources/view/module-name/"

# 日志
ssh root@router "logread | grep -i error"
```

---

## 🚨 常见错误与快速修复

| 错误 | 快速修复 |
|------|----------|
| **-32000 Object not found** | 重命名 RPCD 文件以匹配 ubus 对象 |
| **404 View not found** | 修复菜单路径以匹配文件位置 |
| **403 Forbidden CSS** | `chmod 644 *.css` |
| **[object HTMLButtonElement]** | 移除数组包装器：`E('div', {}, renderButtons())` |
| **样式未更新** | 清除浏览器缓存（Ctrl+Shift+R）+ 隐私模式 |

---

## 📋 提交前检查清单

- [ ] `./secubox-tools/fix-permissions.sh --local` ✅（自动修复）
- [ ] `./secubox-tools/validate-modules.sh` ✅（7 项检查）
- [ ] RPCD 名称 = ubus 对象名称
- [ ] 菜单路径 = 视图文件路径
- [ ] 权限：755（RPCD），644（CSS/JS）- 自动验证
- [ ] JSON 有效（jsonlint）
- [ ] CSS：使用变量（不硬编码）
- [ ] CSS：支持深色模式
- [ ] JS：API 调用有错误处理
- [ ] 版本已递增（PKG_VERSION）

---

## 📁 文件结构模板

```
luci-app-<module>/
├── Makefile
├── htdocs/luci-static/resources/
│   ├── view/<module>/
│   │   └── overview.js
│   └── <module>/
│       ├── api.js
│       ├── common.css
│       └── overview.css
└── root/
    ├── usr/libexec/rpcd/
    │   └── luci.<module>        ⚠️ 必须匹配 ubus 对象！
    └── usr/share/
        ├── luci/menu.d/
        │   └── luci-app-<module>.json
        └── rpcd/acl.d/
            └── luci-app-<module>.json
```

---

## 🎯 快速代码模板

### RPCD 脚本
```bash
#!/bin/sh
case "$1" in
    list)
        echo '{"getStatus": {}, "getHealth": {}}'
        ;;
    call)
        case "$2" in
            getStatus)
                printf '{"enabled": true}\n'
                ;;
        esac
        ;;
esac
```

### 视图（JavaScript）
```javascript
'use strict';
'require view';
'require <module>/api as API';

return view.extend({
    load: function() {
        return API.getStatus();
    },
    render: function(data) {
        return E('div', { 'class': 'sh-page-header' }, [
            E('h2', { 'class': 'sh-page-title' }, '标题')
        ]);
    },
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
```

### 页面标题
```javascript
E('div', { 'class': 'sh-page-header' }, [
    E('div', {}, [
        E('h2', { 'class': 'sh-page-title' }, [
            E('span', { 'class': 'sh-page-title-icon' }, '🎯'),
            '页面标题'
        ]),
        E('p', { 'class': 'sh-page-subtitle' }, '描述')
    ]),
    E('div', { 'class': 'sh-stats-grid' }, [
        E('div', { 'class': 'sh-stat-badge' }, [
            E('div', { 'class': 'sh-stat-value' }, '92'),
            E('div', { 'class': 'sh-stat-label' }, '分数')
        ])
    ])
])
```

### 渐变边框卡片
```javascript
E('div', { 'class': 'sh-card sh-card-success' }, [
    E('div', { 'class': 'sh-card-header' }, [
        E('h3', { 'class': 'sh-card-title' }, [
            E('span', { 'class': 'sh-card-title-icon' }, '⚙️'),
            '卡片标题'
        ])
    ]),
    E('div', { 'class': 'sh-card-body' }, [
        // 内容
    ])
])
```

---

## 🌐 测试 URL

```
SecuBox 仪表板:
https://192.168.8.191/cgi-bin/luci/admin/secubox

系统中心:
https://192.168.8.191/cgi-bin/luci/admin/secubox/system/system-hub
```

**部署后务必在隐私模式下测试**（Ctrl+Shift+N）！

---

## 📚 文档

- **完整指南：** [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)
- **架构：** [CLAUDE.md](claude.md)
- **验证：** `./secubox-tools/validate-modules.sh`
- **设计演示：** https://cybermind.fr/apps/system-hub/demo.html

---

**版本：** 1.0.0 | **日期：** 2025-12-26
