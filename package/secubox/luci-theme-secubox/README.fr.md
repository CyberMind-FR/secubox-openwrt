[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# luci-theme-secubox

Systeme de design CyberMood de SecuBox package comme theme LuCI. Fournit des variables CSS partagees, des composants reutilisables, des mises en page responsives, des traductions et le controleur de theme cote navigateur utilise par chaque module SecuBox (`'require secubox-theme/theme as Theme'`). Installez-le avec les modules SecuBox pour assurer un style coherent, le changement de langue et les variantes clair/sombre/cyberpunk.

```
./feeds/luci/luci-theme-secubox/
├── Makefile
└── htdocs/luci-static/resources/secubox-theme/
    ├── core/           # Variables, reset, typographie, animations, utilitaires
    ├── components/     # Boutons, cartes, formulaires, tableaux, badges, alertes, etc.
    ├── layouts/        # Helpers de tableau de bord/grille/responsive
    ├── themes/         # Variantes Sombre (par defaut), clair, cyberpunk
    ├── i18n/           # Dictionnaires JSON en/fr/de/es
    ├── secubox-theme.css
    ├── secubox-theme.min.css
    └── theme.js        # Controleur de theme (init/apply/t/Theme.create*)
```

## Utilisation

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

Consultez `DOCS/GLOBAL_THEME_SYSTEM.md` pour la reference complete du design. Ce package contient uniquement les ressources partagees ; chaque module est toujours responsable d'importer `secubox-theme.css` (ou `.min.css`) et d'utiliser les methodes d'aide exportees.
