# luci-theme-secubox

SecuBox's CyberMood design system packaged as a LuCI theme. Ships shared CSS variables, reusable components, responsive layouts, translations, and the browser-side theme controller used by every SecuBox module (`'require secubox-theme/theme as Theme'`). Install alongside SecuBox modules to ensure consistent styling, language switching, and light/dark/cyberpunk variants.

```
./feeds/luci/luci-theme-secubox/
├── Makefile
└── htdocs/luci-static/resources/secubox-theme/
    ├── core/           # Variables, reset, typography, animations, utilities
    ├── components/     # Buttons, cards, forms, tables, badges, alerts, etc.
    ├── layouts/        # Dashboard/grid/responsive helpers
    ├── themes/         # Dark (default), light, cyberpunk variants
    ├── i18n/           # en/fr/de/es JSON dictionaries
    ├── secubox-theme.css
    ├── secubox-theme.min.css
    └── theme.js        # Theme controller (init/apply/t/Theme.create*)
```

## Usage

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

See `DOCS/GLOBAL_THEME_SYSTEM.md` for the full design reference. This package only contains the shared assets; each module is still responsible for importing `secubox-theme.css` (or `.min.css`) and using the exported helper methods.
