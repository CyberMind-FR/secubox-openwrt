# SecuBox 网站帮助/信息按钮集成计划

> **Languages:** [English](../DOCS/HELP_INTEGRATION_PLAN.md) | [Francais](../DOCS-fr/HELP_INTEGRATION_PLAN.md) | 中文

**版本：** 1.0
**日期：** 2025-12-28
**状态：** 规划阶段

## 概述

本文档概述了将 SecuBox 营销/文档网站与 OpenWrt LuCI 模块集成的策略，通过每个模块中的帮助/信息按钮提供对帮助文档的无缝访问。

## 当前架构

### 网站位置
- **远程 URL：** `https://secubox.cybermood.eu/`
- **路由器本地路径：** `/www/luci-static/secubox/`
- **访问 URL：** `http://[路由器IP地址]/luci-static/secubox/`

### 模块结构
所有 SecuBox 模块遵循一致的模式：
```
luci-app-{模块名称}/
├── htdocs/luci-static/resources/
│   ├── view/{模块名称}/
│   │   ├── overview.js (主仪表板)
│   │   └── *.js (其他视图)
│   └── {模块名称}/
│       ├── api.js
│       ├── theme.js (可选)
│       └── *.css
```

### 主要模块
1. **luci-app-secubox** - 中央控制中心
2. **luci-app-system-hub** - 系统监控
3. **luci-app-network-modes** - 网络配置
4. **luci-app-client-guardian** - 客户端管理
5. **luci-app-bandwidth-manager** - 流量整形
6. **luci-app-cdn-cache** - CDN 缓存
7. **luci-app-traffic-shaper** - QoS 管理
8. **luci-app-wireguard-dashboard** - VPN 管理
9. **luci-app-crowdsec-dashboard** - 安全监控
10. **luci-app-netdata-dashboard** - 性能指标

## 集成策略

### 第一阶段：共享帮助工具（推荐）

创建一个所有模块都可以使用的集中式帮助按钮库。

#### 实施步骤

1. **创建共享帮助模块**
   ```javascript
   // 位置：luci-app-secubox/htdocs/luci-static/resources/secubox/help.js

   'use strict';
   'require baseclass';

   return baseclass.extend({
       /**
        * 创建帮助按钮元素
        * @param {string} moduleName - 模块标识符（例如：'network-modes'）
        * @param {string} position - 按钮位置：'header'、'footer'、'floating'
        * @param {object} options - 自定义选项
        */
       createHelpButton: function(moduleName, position, options) {
           var opts = options || {};
           var helpUrl = this.getHelpUrl(moduleName);
           var buttonClass = 'sb-help-btn sb-help-' + position;

           return E('a', {
               'class': buttonClass,
               'href': helpUrl,
               'target': opts.target || '_blank',
               'title': opts.title || _('查看帮助和文档')
           }, [
               E('span', { 'class': 'sb-help-icon' }, opts.icon || '❓'),
               opts.showLabel !== false ? E('span', { 'class': 'sb-help-label' }, opts.label || _('帮助')) : null
           ]);
       },

       /**
        * 获取模块的帮助 URL
        * @param {string} moduleName - 模块标识符
        */
       getHelpUrl: function(moduleName) {
           var baseUrl = '/luci-static/secubox/';
           var moduleMap = {
               'secubox': 'index.html#modules',
               'system-hub': 'demo-secubox-hub.html',
               'network-modes': 'demo-network-modes.html',
               'client-guardian': 'demo-client-guardian.html',
               'bandwidth-manager': 'demo-bandwidth.html',
               'cdn-cache': 'demo-cdn-cache.html',
               'traffic-shaper': 'demo-traffic-shaper.html',
               'wireguard-dashboard': 'demo-wireguard.html',
               'crowdsec-dashboard': 'demo-crowdsec.html',
               'netdata-dashboard': 'demo-netdata.html',
               'netifyd-dashboard': 'demo-netifyd.html',
               'auth-guardian': 'demo-auth.html',
               'vhost-manager': 'demo-vhost.html',
               'ksm-manager': 'demo-ksm-manager.html',
               'media-flow': 'demo-media.html'
           };

           return baseUrl + (moduleMap[moduleName] || 'index.html');
       },

       /**
        * 在模态框中打开帮助（用于内联帮助）
        * @param {string} moduleName - 模块标识符
        */
       openHelpModal: function(moduleName) {
           var helpUrl = this.getHelpUrl(moduleName);
           var iframe = E('iframe', {
               'src': helpUrl,
               'style': 'width: 100%; height: 70vh; border: none; border-radius: 8px;'
           });

           ui.showModal(_('帮助和文档'), [
               E('div', { 'style': 'min-height: 70vh;' }, [iframe]),
               E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
                   E('button', {
                       'class': 'btn',
                       'click': ui.hideModal
                   }, _('关闭'))
               ])
           ]);
       }
   });
   ```

2. **创建通用 CSS 样式**
   ```css
   /* 位置：luci-app-secubox/htdocs/luci-static/resources/secubox/help.css */

   /* 基础帮助按钮样式 */
   .sb-help-btn {
       display: inline-flex;
       align-items: center;
       gap: 0.5rem;
       padding: 0.5rem 1rem;
       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
       color: white;
       border-radius: 8px;
       text-decoration: none;
       font-weight: 500;
       transition: all 0.3s ease;
       border: 2px solid transparent;
       cursor: pointer;
   }

   .sb-help-btn:hover {
       transform: translateY(-2px);
       box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
       border-color: rgba(255, 255, 255, 0.3);
   }

   .sb-help-icon {
       font-size: 1.2em;
   }

   /* 头部位置 */
   .sb-help-header {
       margin-left: auto;
       padding: 0.4rem 0.8rem;
       font-size: 0.9em;
   }

   /* 页脚位置 */
   .sb-help-footer {
       margin-top: 2rem;
   }

   /* 悬浮按钮（右下角） */
   .sb-help-floating {
       position: fixed;
       bottom: 2rem;
       right: 2rem;
       z-index: 1000;
       border-radius: 50%;
       width: 60px;
       height: 60px;
       padding: 0;
       justify-content: center;
       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
   }

   .sb-help-floating .sb-help-label {
       display: none;
   }

   .sb-help-floating .sb-help-icon {
       font-size: 1.8em;
   }

   /* 深色主题调整 */
   [data-theme="dark"] .sb-help-btn {
       background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
   }
   ```

3. **更新每个模块**

   **示例：luci-app-network-modes/htdocs/luci-static/resources/view/network-modes/overview.js**
   ```javascript
   'use strict';
   'require view';
   'require dom';
   'require ui';
   'require network-modes.api as api';
   'require secubox/help as Help';  // 添加此行

   return view.extend({
       title: _('网络模式'),

       load: function() {
           return api.getAllData();
       },

       render: function(data) {
           var self = this;
           // ... 现有代码 ...

           var view = E('div', { 'class': 'network-modes-dashboard' }, [
               // 加载帮助 CSS
               E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/help.css') }),

               // 带帮助按钮的头部
               E('div', { 'class': 'nm-header' }, [
                   E('div', { 'class': 'nm-logo' }, [
                       E('div', { 'class': 'nm-logo-icon' }, '🌐'),
                       E('div', { 'class': 'nm-logo-text' }, ['网络', E('span', {}, '配置')])
                   ]),
                   E('div', { 'class': 'nm-mode-badge ' + currentMode }, [
                       E('span', { 'class': 'nm-mode-dot' }),
                       currentModeInfo ? currentModeInfo.name : currentMode
                   ]),
                   // 添加帮助按钮
                   Help.createHelpButton('network-modes', 'header', {
                       icon: '📖',
                       label: _('帮助')
                   })
               ]),

               // ... 其余界面 ...
           ]);

           return view;
       }
   });
   ```

### 第二阶段：替代方案

#### 方案 A：悬浮帮助按钮
添加一个全局悬浮帮助按钮，显示在所有 SecuBox 模块页面上。

**优点：**
- 非侵入式
- 所有模块用户体验一致
- 易于全局实施

**缺点：**
- 可能与其他悬浮元素重叠
- 可发现性较低

#### 方案 B：头部集成
在每个模块仪表板的头部添加帮助按钮。

**优点：**
- 高度可见
- 自然放置
- 遵循常见的界面模式

**缺点：**
- 需要修改每个模块
- 在小屏幕上可能使头部杂乱

#### 方案 C：快捷操作集成
在具有操作面板的模块（如 SecuBox 仪表板）中将帮助添加为快捷操作。

**优点：**
- 符合现有界面模式
- 与其他工具分组
- 与当前设计一致

**缺点：**
- 仅适用于具有操作面板的模块
- 不太显眼

## 推荐实施计划

### 步骤 1：创建基础（第 1 周）
1. 创建 `secubox/help.js` 工具模块
2. 创建 `secubox/help.css` 样式表
3. 部署到测试路由器
4. 验证可访问性

### 步骤 2：集成核心模块（第 2 周）
首先更新这些关键模块：
1. `luci-app-secubox`（主仪表板）
2. `luci-app-system-hub`
3. `luci-app-network-modes`

在生产路由器上测试。

### 步骤 3：推广到所有模块（第 3 周）
更新其余模块：
1. `luci-app-client-guardian`
2. `luci-app-bandwidth-manager`
3. `luci-app-cdn-cache`
4. `luci-app-traffic-shaper`
5. `luci-app-wireguard-dashboard`
6. `luci-app-crowdsec-dashboard`
7. `luci-app-netdata-dashboard`
8. 其他模块

### 步骤 4：用户测试和完善（第 4 周）
1. 收集用户反馈
2. 调整定位/样式
3. 根据需要添加本地化
4. 为最终用户编写文档

## 模块到帮助页面映射

| 模块 | 帮助页面 | 状态 |
|------|----------|------|
| secubox | index.html#modules | 可用 |
| system-hub | demo-secubox-hub.html | 可用 |
| network-modes | demo-network-modes.html | 可用 |
| client-guardian | demo-client-guardian.html | 可用 |
| bandwidth-manager | demo-bandwidth.html | 可用 |
| cdn-cache | demo-cdn-cache.html | 可用 |
| traffic-shaper | demo-traffic-shaper.html | 可用 |
| wireguard-dashboard | demo-wireguard.html | 可用 |
| crowdsec-dashboard | demo-crowdsec.html | 可用 |
| netdata-dashboard | demo-netdata.html | 可用 |
| netifyd-dashboard | demo-netifyd.html | 可用 |
| auth-guardian | demo-auth.html | 可用 |
| vhost-manager | demo-vhost.html | 可用 |
| ksm-manager | demo-ksm-manager.html | 可用 |
| media-flow | demo-media.html | 可用 |

## 部署工作流程

### 网站更新
```bash
# 从 secubox-openwrt 目录
./secubox-tools/deploy-website.sh root@192.168.8.191 ../secubox-website
```

### 带帮助集成的模块更新
```bash
# 构建并部署单个模块
./secubox-tools/deploy-network-modes.sh root@192.168.8.191

# 或构建所有模块
./secubox-tools/local-build.sh build-all
```

## 测试检查清单

- [ ] 帮助按钮显示在模块头部
- [ ] 帮助按钮链接到正确的文档页面
- [ ] 帮助页面在新标签页中打开（或配置为模态框）
- [ ] 所有模块的样式一致
- [ ] 按钮在移动设备上响应式
- [ ] 深色/浅色主题支持
- [ ] 本地化支持（如适用）
- [ ] 控制台无 JavaScript 错误
- [ ] 在本地路由器和远程部署上均可工作

## 未来增强功能

### 高级功能
1. **上下文相关帮助**
   - 根据当前页面/部分提供不同的帮助 URL
   - 深度链接到特定文档部分

2. **内联帮助提示**
   - 特定界面元素的悬停提示
   - 无需离开页面的快速提示

3. **帮助搜索**
   - 帮助模态框中的搜索框
   - 跨文档的全文搜索

4. **交互式教程**
   - 分步指南
   - 新用户引导游览

5. **更新日志集成**
   - 版本更新时显示"新功能"
   - 链接到发布说明

## 技术考虑

### 性能
- 帮助资源是静态文件（无 API 调用）
- JavaScript 开销最小（约 2KB）
- CSS 仅在需要时加载
- 不影响模块核心功能

### 兼容性
- 适用于 LuCI 18.06+
- 兼容所有现代浏览器
- 对旧浏览器优雅降级

### 安全性
- 所有帮助内容从同源提供
- 无外部依赖
- 无 XSS 风险（静态 HTML/CSS/JS）

### 维护
- 集中式帮助工具（单一更新点）
- 模块更改最小化（每个模块 1-3 行）
- 网站更新独立于模块更新

## 参考资料

- **部署脚本：** `secubox-tools/deploy-website.sh`
- **模块模板：** `secubox-tools/deploy-module-template.sh`
- **网站仓库：** `/home/reepost/CyberMindStudio/_files/secubox-website/`
- **当前部署：** `http://192.168.8.191/luci-static/secubox/`

## 需要解答的问题和决策

1. **按钮位置：** 头部、悬浮还是两者兼有？
2. **模态框 vs 新标签页：** 帮助应该在模态框还是新标签页中打开？
3. **移动端用户体验：** 帮助按钮在小屏幕上应如何表现？
4. **本地化：** 是否支持多语言帮助内容？
5. **分析：** 跟踪帮助使用情况（尊重隐私）？

## 审批状态

- [ ] 技术方案已批准
- [ ] UI/UX 设计已批准
- [ ] 实施时间表已批准
- [ ] 测试计划已批准
- [ ] 部署策略已批准
