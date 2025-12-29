# Quick Start Guide - SecuBox Development

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

**⚡ Aide-mémoire rapide pour développement**

Pour le guide complet, voir [DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md)

---

## See Also

- **Complete Guide:** [DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md)
- **Architecture & Build:** [CLAUDE.md](./CLAUDE.md)
- **Code Templates:** [CODE-TEMPLATES.md](./CODE-TEMPLATES.md)
- **Module Prompts:** [FEATURE-REGENERATION-PROMPTS.md](./FEATURE-REGENERATION-PROMPTS.md)
- **Automation Briefing:** [CODEX.md](./CODEX.md)

---

## ⚠️ RÈGLES CRITIQUES (À NE JAMAIS OUBLIER)

### 1. RPCD Script Naming
```bash
# Le nom DOIT correspondre EXACTEMENT à l'objet ubus
JavaScript: object: 'luci.system-hub'
Fichier:   root/usr/libexec/rpcd/luci.system-hub  ✅

# Sinon: Error -32000 "Object not found"
```

### 2. Menu Path Matching
```json
Menu JSON: "path": "system-hub/overview"
Fichier:   view/system-hub/overview.js  ✅

# Sinon: HTTP 404 Not Found
```

### 3. Permissions Files
```bash
# RPCD scripts = exécutable
chmod 755 root/usr/libexec/rpcd/luci.*

# CSS/JS = lecture seule
chmod 644 htdocs/**/*.{css,js}

# Sinon: 403 Forbidden ou script non exécuté
```

### 4. Pre-Deployment Checks
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

### 5. Common Errors Quick Fix
```bash
# HTTP 403 Forbidden (BEST: use automated script)
./secubox-tools/fix-permissions.sh --remote  # Auto-fix all permissions

# OR manual fix:
chmod 644 /www/luci-static/resources/**/*.{js,css}

# No space left on device
rm -rf /tmp/*.ipk /tmp/luci-*
find /root -name '*.backup-*' -mtime +7 -delete

# Object not found -32000
chmod 755 /usr/libexec/rpcd/luci.*
ubus list | grep luci.module-name  # Vérifier disponibilité
```

---

## 🎨 Design System Essentials

### Color Palette (Dark Mode)
```css
--sh-bg-primary: #0a0a0f;      /* Fond principal */
--sh-bg-card: #12121a;         /* Cartes */
--sh-border: #2a2a35;          /* Bordures */
--sh-primary: #6366f1;         /* Indigo */
--sh-primary-end: #8b5cf6;     /* Violet */
```

### Fonts
```css
/* Général */
font-family: 'Inter', sans-serif;

/* Valeurs numériques */
font-family: 'JetBrains Mono', monospace;
```

### Component Classes
```css
.sh-page-header         /* Page header */
.sh-page-title          /* Title (gradient text) */
.sh-stat-badge          /* Stat badge (130px min) */
.sh-card                /* Card (gradient border on hover) */
.sh-btn-primary         /* Button (gradient) */
.sh-filter-tab          /* Filter tab */
```

### Grid Sizes
```css
/* Stats */
grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));

/* Metrics */
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));

/* Info cards */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```

---

## 🔧 Common Commands

### Validation
```bash
# Valider TOUT avant commit (7 checks incluant permissions)
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

# Build OpenWrt SDK
make package/luci-app-module-name/compile V=s
```

### Deploy
```bash
# Copier fichiers
scp file.js root@192.168.8.191:/www/luci-static/resources/

# Fix permissions
ssh root@192.168.8.191 "chmod 644 /www/luci-static/resources/**/*.css"

# Clear cache + restart
ssh root@192.168.8.191 "rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* && /etc/init.d/rpcd restart && /etc/init.d/uhttpd restart"
```

### Quick Deploy Helper
```bash
# IPK install via opkg (auto SCP + install)
./secubox-tools/quick-deploy.sh --ipk bin/packages/luci-app-secubox.ipk

# APK install on newer images
./secubox-tools/quick-deploy.sh --apk dist/secubox-theme.apk

# Push local source directory to /www/luci-static
./secubox-tools/quick-deploy.sh --src luci-app-secubox/htdocs --target-path /www/luci-static

# Clone Git repo and deploy (branch optional)
./secubox-tools/quick-deploy.sh --git https://github.com/CyberMindStudio/secubox-theme.git --branch main

# Selective push (only CSS + Settings view)
./secubox-tools/quick-deploy.sh --src luci-app-secubox/htdocs \
    --include luci-static/resources/secubox/secubox.css \
    --include luci-static/resources/view/secubox/settings.js

# Root tree updates (rpcd, ACLs, etc.)
./secubox-tools/quick-deploy.sh --src luci-app-secubox/root --force-root

# Legacy theme profile (mirrors deploy-theme-system.sh)
./secubox-tools/quick-deploy.sh --profile theme

# Deploy complete LuCI app (root + htdocs)
./secubox-tools/quick-deploy.sh --profile luci-app --src luci-app-secubox

# Browse LuCI apps and auto-pick one
./secubox-tools/quick-deploy.sh --list-apps
./secubox-tools/quick-deploy.sh --app secubox
./secubox-tools/quick-deploy.sh --src-select   # interactive picker (TTY only)
```
*Flags:* `--include` limits uploads, `--force-root` writes relative to `/`, `--profile` triggers opinionated bundles (`theme`, `luci-app`), `--app <name>` auto-resolves `luci-app-<name>`, `--list-apps` prints detected apps, `--src-select` shows the same picker interactively, `--no-auto-profile` disables automatic LuCI detection when using `--src`, `--no-cache-bust` skips clearing `/tmp/luci-*`, `--no-verify` disables post-copy checksum checks, `--router root@192.168.8.191` overrides the target, and `--post "rm -rf /tmp/luci-*"` runs extra remote commands. Environment variables `ROUTER`, `TARGET_PATH`, `CACHE_BUST`, `VERIFY`, `SSH_OPTS`, and `SCP_OPTS` can be exported ahead of time.

### Debug
```bash
# Test RPCD
ssh root@router "ubus list | grep luci.module"
ssh root@router "ubus call luci.module-name getStatus"

# Check files
ssh root@router "ls -la /www/luci-static/resources/view/module-name/"

# Logs
ssh root@router "logread | grep -i error"
```

---

## 🚨 Common Errors & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| **-32000 Object not found** | Rename RPCD file to match ubus object |
| **404 View not found** | Fix menu path to match file location |
| **403 Forbidden CSS** | `chmod 644 *.css` |
| **[object HTMLButtonElement]** | Remove array wrapper: `E('div', {}, renderButtons())` |
| **Styles not updating** | Clear browser cache (Ctrl+Shift+R) + mode privé |

---

## 📋 Pre-Commit Checklist

- [ ] `./secubox-tools/fix-permissions.sh --local` ✅ (auto-fix)
- [ ] `./secubox-tools/validate-modules.sh` ✅ (7 checks)
- [ ] RPCD name = ubus object name
- [ ] Menu path = view file path
- [ ] Permissions: 755 (RPCD), 644 (CSS/JS) - auto-verified
- [ ] JSON valide (jsonlint)
- [ ] CSS: variables utilisées (pas hardcode)
- [ ] CSS: dark mode supporté
- [ ] JS: gestion d'erreur sur API calls
- [ ] Version incrémentée (PKG_VERSION)

---

## 📁 File Structure Template

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
    │   └── luci.<module>        ⚠️ MUST match ubus object!
    └── usr/share/
        ├── luci/menu.d/
        │   └── luci-app-<module>.json
        └── rpcd/acl.d/
            └── luci-app-<module>.json
```

---

## 🎯 Quick Code Templates

### RPCD Script
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

### View (JavaScript)
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
            E('h2', { 'class': 'sh-page-title' }, 'Title')
        ]);
    },
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
```

### Page Header
```javascript
E('div', { 'class': 'sh-page-header' }, [
    E('div', {}, [
        E('h2', { 'class': 'sh-page-title' }, [
            E('span', { 'class': 'sh-page-title-icon' }, '🎯'),
            'Page Title'
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

### Card with Gradient Border
```javascript
E('div', { 'class': 'sh-card sh-card-success' }, [
    E('div', { 'class': 'sh-card-header' }, [
        E('h3', { 'class': 'sh-card-title' }, [
            E('span', { 'class': 'sh-card-title-icon' }, '⚙️'),
            'Card Title'
        ])
    ]),
    E('div', { 'class': 'sh-card-body' }, [
        // Content
    ])
])
```

---

## 🌐 Test URLs

```
SecuBox Dashboard:
https://192.168.8.191/cgi-bin/luci/admin/secubox

System Hub:
https://192.168.8.191/cgi-bin/luci/admin/secubox/system/system-hub
```

**TOUJOURS tester en mode privé** (Ctrl+Shift+N) après deploy!

---

## 📚 Documentation

- **Guide complet:** [DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md)
- **Architecture:** [CLAUDE.md](./CLAUDE.md)
- **Validation:** `./secubox-tools/validate-modules.sh`
- **Démo design:** https://cybermind.fr/apps/system-hub/demo.html

---

**Version:** 1.0.0 | **Date:** 2025-12-26
