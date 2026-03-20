[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# luci-theme-secubox

SecuBox 的 CyberMood 设计系统，打包为 LuCI 主题。提供共享 CSS 变量、可重用组件、响应式布局、翻译和每个 SecuBox 模块使用的浏览器端主题控制器（`'require secubox-theme/theme as Theme'`）。与 SecuBox 模块一起安装，确保一致的样式、语言切换以及明/暗/赛博朋克变体。

```
./feeds/luci/luci-theme-secubox/
├── Makefile
└── htdocs/luci-static/resources/secubox-theme/
    ├── core/           # 变量、重置、排版、动画、工具类
    ├── components/     # 按钮、卡片、表单、表格、徽章、警告等
    ├── layouts/        # 仪表板/网格/响应式助手
    ├── themes/         # 暗色（默认）、亮色、赛博朋克变体
    ├── i18n/           # en/fr/de/es JSON 字典
    ├── secubox-theme.css
    ├── secubox-theme.min.css
    └── theme.js        # 主题控制器（init/apply/t/Theme.create*）
```

## 使用方法

```javascript
'use strict';
'require secubox-theme/theme as Theme';

return view.extend({
    load: function() {
        return Theme.init();
    },
    render: function() {
        Theme.apply('dark');          // dark, light, cyberpunk
        Theme.setLanguage('en');      // en, fr, de, es

        return Theme.createPage({
            title: Theme.t('dashboard.title'),
            cards: [
                Theme.createCard({
                    title: Theme.t('dashboard.overview'),
                    icon: '🚀',
                    content: this.renderOverview()
                })
            ]
        });
    }
});
```

有关完整设计参考，请参阅 `DOCS/GLOBAL_THEME_SYSTEM.md`。此包仅包含共享资源；每个模块仍负责导入 `secubox-theme.css`（或 `.min.css`）并使用导出的辅助方法。
