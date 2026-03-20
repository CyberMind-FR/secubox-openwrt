# SecuBox 代码示例

[English](README.md) | [Francais](README.fr.md) | 中文

本目录包含 SecuBox 模块开发和集成的实用代码示例。

## 可用示例

### help-button-integration.js
将帮助/文档按钮集成到 SecuBox 模块的完整示例。

**包含内容：**
- 共享帮助工具模块
- 模块集成示例
- 多种 UI 模式（页眉、浮动、快速操作）
- 上下文相关帮助
- CSS 样式示例

**使用场景：**
- 向模块仪表板添加帮助按钮
- 链接到网站文档
- 在各模块间创建一致的帮助用户体验

## 相关文档

- **集成计划：** `../DOCS/HELP_INTEGRATION_PLAN.md`
- **部署指南：** `../DOCS/WEBSITE_DEPLOYMENT_GUIDE.md`
- **LuCI 开发参考：** `../DOCS/LUCI_DEVELOPMENT_REFERENCE.md`

## 如何使用示例

1. **查看示例代码**以理解模式
2. **复制相关部分**到您的模块
3. **自定义**模块名称、URL 和样式
4. **测试**在开发路由器上
5. **部署**使用部署脚本

## 集成工作流程

```bash
# 1. 部署网站到路由器
./secubox-tools/deploy-website.sh root@192.168.8.191

# 2. 将帮助按钮代码添加到您的模块
# （参见 help-button-integration.js）

# 3. 构建并部署模块
./secubox-tools/local-build.sh build luci-app-your-module
./secubox-tools/deploy-network-modes.sh root@192.168.8.191

# 4. 在浏览器中测试
open http://192.168.8.191/cgi-bin/luci/admin/secubox/your-module
```

## 常用模式

### 模式 1：页眉帮助按钮
```javascript
'require secubox/help as Help';

E('div', { 'class': 'header' }, [
    E('h2', {}, 'Module Title'),
    Help.createHelpButton('module-name', 'header')
])
```

### 模式 2：浮动帮助按钮
```javascript
E('a', {
    'class': 'sb-help-floating',
    'href': '/luci-static/secubox/demo-module.html',
    'target': '_blank'
}, [E('span', {}, '❓')])
```

### 模式 3：快速操作
```javascript
buttons.push(
    E('button', {
        'class': 'action-btn',
        'click': function() {
            window.open('/luci-static/secubox/demo-module.html', '_blank');
        }
    }, ['📖 Help'])
)
```

## 模块特定示例

每个模块可以有不同的帮助按钮位置：

| 模块 | 推荐位置 | 示例文件 |
|--------|---------------------|--------------|
| SecuBox Dashboard | 快速操作 | help-button-integration.js (示例 3) |
| System Hub | 页眉徽章 | help-button-integration.js (示例 4) |
| Network Modes | 页眉按钮 | help-button-integration.js (示例 2) |
| 其他模块 | 浮动按钮 | help-button-integration.js (示例 5) |

## 测试清单

- [ ] 帮助按钮可见
- [ ] 点击打开正确的文档页面
- [ ] 样式匹配模块主题
- [ ] 深色/浅色模式下正常工作
- [ ] 移动端响应式
- [ ] 无控制台错误
- [ ] 可通过键盘访问

## 贡献示例

添加新示例：

1. 创建描述性的 JavaScript 文件
2. 包含清晰的注释
3. 展示完整、可运行的代码
4. 更新此 README
5. 在实际路由器上测试

## 支持

关于示例的问题：
- 查看 `DOCS/` 中的相关文档
- 检查 `luci-app-*/` 中的模块源代码
- 首先在开发路由器上测试

## 快速参考

**网站基础 URL：** `/luci-static/secubox/`

**模块帮助页面：**
- secubox → `index.html#modules`
- system-hub → `demo-secubox-hub.html`
- network-modes → `demo-network-modes.html`
- client-guardian → `demo-client-guardian.html`
- bandwidth-manager → `demo-bandwidth.html`
- traffic-shaper → `demo-traffic-shaper.html`
- （完整列表请参见 help-button-integration.js）

**帮助工具方法：**
- `Help.createHelpButton(module, position, options)`
- `Help.getHelpUrl(module)`
- `Help.openHelpModal(module)`
