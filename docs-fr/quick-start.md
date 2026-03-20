# Guide de Démarrage Rapide - Développement SecuBox

🌐 **Langues :** [English](../docs/quick-start.md) | Français | [中文](../docs-zh/quick-start.md)

**Version :** 1.0.0
**Dernière mise à jour :** 2025-12-28
**Statut :** Actif

**⚡ Aide-mémoire rapide pour développement**

Pour le guide complet, voir [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)

---

## Voir Aussi

- **Guide Complet :** [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)
- **Architecture & Build :** [CLAUDE.md](claude.md)
- **Modèles de Code :** [CODE-TEMPLATES.md](code-templates.md)
- **Prompts de Module :** [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
- **Briefing Automatisation :** [CODEX.md](codex.md)

---

## ⚠️ RÈGLES CRITIQUES (À NE JAMAIS OUBLIER)

### 1. Nommage des Scripts RPCD
```bash
# Le nom DOIT correspondre EXACTEMENT à l'objet ubus
JavaScript: object: 'luci.system-hub'
Fichier:   root/usr/libexec/rpcd/luci.system-hub  ✅

# Sinon: Error -32000 "Object not found"
```

### 2. Correspondance des Chemins de Menu
```json
Menu JSON: "path": "system-hub/overview"
Fichier:   view/system-hub/overview.js  ✅

# Sinon: HTTP 404 Not Found
```

### 3. Fichiers de Permissions
```bash
# Scripts RPCD = exécutable
chmod 755 root/usr/libexec/rpcd/luci.*

# CSS/JS = lecture seule
chmod 644 htdocs/**/*.{css,js}

# Sinon: 403 Forbidden ou script non exécuté
```

### 4. Vérifications Pré-Déploiement
```bash
# TOUJOURS vérifier avant déploiement:

# 1. Espace disque (doit être < 90%)
ssh root@192.168.8.191 "df -h | grep overlay"

# 2. Permissions après déploiement
ssh root@192.168.8.191 "find /www/luci-static -name '*.js' -perm 600"
# ⚠️ Si résultats: fichiers ont 600 au lieu de 644 → Erreur 403!

# 3. Correction rapide si nécessaire
ssh root@192.168.8.191 "find /www/luci-static -name '*.css' -exec chmod 644 {} \;"
ssh root@192.168.8.191 "find /www/luci-static -name '*.js' -exec chmod 644 {} \;"
```

### 5. Correction Rapide des Erreurs Courantes
```bash
# HTTP 403 Forbidden (MEILLEUR: utiliser le script automatisé)
./secubox-tools/fix-permissions.sh --remote  # Corrige automatiquement toutes les permissions

# OU correction manuelle:
chmod 644 /www/luci-static/resources/**/*.{js,css}

# No space left on device
rm -rf /tmp/*.ipk /tmp/luci-*
find /root -name '*.backup-*' -mtime +7 -delete

# Object not found -32000
chmod 755 /usr/libexec/rpcd/luci.*
ubus list | grep luci.module-name  # Vérifier disponibilité
```

---

## 🎨 Essentiels du Système de Design

### Palette de Couleurs (Mode Sombre)
```css
--sh-bg-primary: #0a0a0f;      /* Fond principal */
--sh-bg-card: #12121a;         /* Cartes */
--sh-border: #2a2a35;          /* Bordures */
--sh-primary: #6366f1;         /* Indigo */
--sh-primary-end: #8b5cf6;     /* Violet */
```

### Polices
```css
/* Général */
font-family: 'Inter', sans-serif;

/* Valeurs numériques */
font-family: 'JetBrains Mono', monospace;
```

### Classes de Composants
```css
.sh-page-header         /* En-tête de page */
.sh-page-title          /* Titre (texte dégradé) */
.sh-stat-badge          /* Badge de statistique (130px min) */
.sh-card                /* Carte (bordure dégradée au survol) */
.sh-btn-primary         /* Bouton (dégradé) */
.sh-filter-tab          /* Onglet de filtre */
```

### Tailles de Grille
```css
/* Statistiques */
grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));

/* Métriques */
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));

/* Cartes d'information */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```

---

## 🔧 Commandes Courantes

### Validation
```bash
# Valider TOUT avant commit (7 vérifications incluant permissions)
./secubox-tools/validate-modules.sh

# Corriger automatiquement les permissions
./secubox-tools/fix-permissions.sh --local

# JSON
jsonlint file.json

# Shell
shellcheck root/usr/libexec/rpcd/*
```

### Build
```bash
# Build local
./secubox-tools/local-build.sh build luci-app-module-name

# Build SDK OpenWrt
make package/luci-app-module-name/compile V=s
```

### Déploiement
```bash
# Copier fichiers
scp file.js root@192.168.8.191:/www/luci-static/resources/

# Corriger permissions
ssh root@192.168.8.191 "chmod 644 /www/luci-static/resources/**/*.css"

# Vider cache + redémarrer
ssh root@192.168.8.191 "rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* && /etc/init.d/rpcd restart && /etc/init.d/uhttpd restart"
```

### Debug
```bash
# Tester RPCD
ssh root@router "ubus list | grep luci.module"
ssh root@router "ubus call luci.module-name getStatus"

# Vérifier fichiers
ssh root@router "ls -la /www/luci-static/resources/view/module-name/"

# Logs
ssh root@router "logread | grep -i error"
```

---

## 🚨 Erreurs Courantes & Corrections Rapides

| Erreur | Correction Rapide |
|--------|-------------------|
| **-32000 Object not found** | Renommer le fichier RPCD pour correspondre à l'objet ubus |
| **404 View not found** | Corriger le chemin du menu pour correspondre à l'emplacement du fichier |
| **403 Forbidden CSS** | `chmod 644 *.css` |
| **[object HTMLButtonElement]** | Retirer le wrapper tableau : `E('div', {}, renderButtons())` |
| **Styles non mis à jour** | Vider le cache navigateur (Ctrl+Shift+R) + mode privé |

---

## 📋 Checklist Pré-Commit

- [ ] `./secubox-tools/fix-permissions.sh --local` ✅ (correction auto)
- [ ] `./secubox-tools/validate-modules.sh` ✅ (7 vérifications)
- [ ] Nom RPCD = nom objet ubus
- [ ] Chemin menu = chemin fichier vue
- [ ] Permissions : 755 (RPCD), 644 (CSS/JS) - vérification auto
- [ ] JSON valide (jsonlint)
- [ ] CSS : variables utilisées (pas hardcode)
- [ ] CSS : mode sombre supporté
- [ ] JS : gestion d'erreur sur appels API
- [ ] Version incrémentée (PKG_VERSION)

---

## 📁 Template de Structure de Fichiers

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
    │   └── luci.<module>        ⚠️ DOIT correspondre à l'objet ubus !
    └── usr/share/
        ├── luci/menu.d/
        │   └── luci-app-<module>.json
        └── rpcd/acl.d/
            └── luci-app-<module>.json
```

---

## 🎯 Templates de Code Rapides

### Script RPCD
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

### Vue (JavaScript)
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
            E('h2', { 'class': 'sh-page-title' }, 'Titre')
        ]);
    },
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
```

### En-tête de Page
```javascript
E('div', { 'class': 'sh-page-header' }, [
    E('div', {}, [
        E('h2', { 'class': 'sh-page-title' }, [
            E('span', { 'class': 'sh-page-title-icon' }, '🎯'),
            'Titre de Page'
        ]),
        E('p', { 'class': 'sh-page-subtitle' }, 'Description')
    ]),
    E('div', { 'class': 'sh-stats-grid' }, [
        E('div', { 'class': 'sh-stat-badge' }, [
            E('div', { 'class': 'sh-stat-value' }, '92'),
            E('div', { 'class': 'sh-stat-label' }, 'Score')
        ])
    ])
])
```

### Carte avec Bordure Dégradée
```javascript
E('div', { 'class': 'sh-card sh-card-success' }, [
    E('div', { 'class': 'sh-card-header' }, [
        E('h3', { 'class': 'sh-card-title' }, [
            E('span', { 'class': 'sh-card-title-icon' }, '⚙️'),
            'Titre de Carte'
        ])
    ]),
    E('div', { 'class': 'sh-card-body' }, [
        // Contenu
    ])
])
```

---

## 🌐 URLs de Test

```
Tableau de bord SecuBox:
https://192.168.8.191/cgi-bin/luci/admin/secubox

Hub Système:
https://192.168.8.191/cgi-bin/luci/admin/secubox/system/system-hub
```

**TOUJOURS tester en mode privé** (Ctrl+Shift+N) après déploiement !

---

## 📚 Documentation

- **Guide complet :** [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)
- **Architecture :** [CLAUDE.md](claude.md)
- **Validation :** `./secubox-tools/validate-modules.sh`
- **Démo design :** https://cybermind.fr/apps/system-hub/demo.html

---

**Version :** 1.0.0 | **Date :** 2025-12-26
