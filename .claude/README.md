# 📚 Configuration Claude Code pour SecuBox

**Version:** 2.0.0
**Date:** 2025-12-26
**Projet:** SecuBox OpenWrt
**Design System:** v0.3.0 (Demo-inspired)

Ce répertoire contient la configuration et les guides pour travailler avec Claude Code sur le projet SecuBox.

---

## 🚨 IMPORTANT: Nouvelle Documentation (v2.0)

**La documentation a été entièrement restructurée et améliorée!**

### 📖 Guides Principaux (À la racine du projet)

| Guide | Description | Quand l'utiliser |
|-------|-------------|------------------|
| **[DEVELOPMENT-GUIDELINES.md](../DEVELOPMENT-GUIDELINES.md)** | ⭐ **GUIDE COMPLET** (33KB, 900+ lignes)<br/>Design System, RPCD/ubus, ACL, JS, CSS, Debug, Validation, Deployment | AVANT toute modification de code |
| **[QUICK-START.md](../QUICK-START.md)** | ⚡ **AIDE-MÉMOIRE** (6.4KB)<br/>Règles critiques, commandes rapides, templates de code | Référence quotidienne |
| **[CLAUDE.md](../CLAUDE.md)** | 🏗️ **ARCHITECTURE** (17KB)<br/>Build OpenWrt, structure fichiers, CI/CD | Build et architecture |
| **[README.md](../README.md)** | 📘 **VUE D'ENSEMBLE** (18KB)<br/>Présentation projet, modules, quick start | Introduction au projet |

### 🔧 Scripts & Tools

| Script | Description | Usage |
|--------|-------------|-------|
| **[deploy-module-template.sh](../deploy-module-template.sh)** | Script de déploiement standardisé avec backup | `./deploy-module-template.sh <module-name>` |
| **validate-modules.sh** | Validation complète des modules | `./secubox-tools/validate-modules.sh` |
| **local-build.sh** | Build local avec SDK OpenWrt | `./secubox-tools/local-build.sh build` |

---

## ⚠️ Règles Critiques (À TOUJOURS Respecter)

### 1. RPCD Script Naming
```
RÈGLE: Nom fichier RPCD = objet ubus (EXACT!)

✅ CORRECT:
JavaScript: object: 'luci.system-hub'
Fichier:   root/usr/libexec/rpcd/luci.system-hub

❌ INCORRECT (cause -32000 error):
Fichier:   root/usr/libexec/rpcd/system-hub
```

### 2. Menu Path Matching
```
RÈGLE: Path menu = fichier vue (EXACT!)

✅ CORRECT:
Menu JSON: "path": "system-hub/overview"
Fichier:   view/system-hub/overview.js

❌ INCORRECT (cause 404 error):
Menu: "system-hub/overview"
File: view/systemhub/overview.js
```

### 3. Permissions
```bash
# RPCD scripts = exécutable
chmod 755 root/usr/libexec/rpcd/luci.*

# CSS/JS = lecture seule
chmod 644 htdocs/**/*.{css,js}
```

### 4. Validation OBLIGATOIRE
```bash
# TOUJOURS exécuter avant commit
./secubox-tools/validate-modules.sh
```

### 5. CSS Variables (PAS de hardcode!)
```css
/* ✅ CORRECT */
color: var(--sh-text-primary);

/* ❌ INCORRECT */
color: #fafafa;
```

### 6. Dark Mode (Support OBLIGATOIRE)
```css
/* TOUJOURS fournir styles dark mode */
[data-theme="dark"] .my-component {
    background: var(--sh-bg-card);
}
```

### 7. Typographie
```css
/* Texte général */
font-family: 'Inter', sans-serif;

/* Valeurs numériques, IDs, code */
font-family: 'JetBrains Mono', monospace;
```

### 8. Gradients
```css
/* Utiliser les variables pour dégradés */
background: linear-gradient(135deg, var(--sh-primary), var(--sh-primary-end));
```

---

## 🎨 Design System v0.3.0

Inspiré de: https://cybermind.fr/apps/system-hub/demo.html

### Palette Dark Mode (Recommandé)
```css
--sh-bg-primary: #0a0a0f;      /* Fond principal (noir profond) */
--sh-bg-secondary: #12121a;     /* Fond cartes/sections */
--sh-bg-tertiary: #1a1a24;      /* Fond hover/actif */
--sh-border: #2a2a35;           /* Bordures */
--sh-primary: #6366f1;          /* Indigo */
--sh-primary-end: #8b5cf6;      /* Violet (dégradés) */
--sh-success: #22c55e;          /* Vert */
--sh-danger: #ef4444;           /* Rouge */
--sh-warning: #f59e0b;          /* Orange */
```

### Components CSS (Classes principales)
```css
.sh-page-header         /* En-tête page avec gradient title */
.sh-page-title          /* Titre avec effet gradient text */
.sh-stat-badge          /* Badge stat (130px min) */
.sh-card                /* Carte avec bordure gradient hover */
.sh-btn-primary         /* Bouton gradient indigo-violet */
.sh-filter-tab          /* Onglet de filtre */
.sh-nav-tab             /* Onglet navigation sticky */
```

### Grid Sizes
```css
/* Stats compacts */
grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));

/* Metrics moyens */
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));

/* Info cards larges */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```

---

## 🚀 Workflow de Développement

### 1. Avant de Commencer
```bash
# Lire les guides
cat ../QUICK-START.md           # Règles critiques
cat ../DEVELOPMENT-GUIDELINES.md # Guide complet (section pertinente)
```

### 2. Développement
```bash
# Modifier le code
vim luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js

# Valider IMMÉDIATEMENT
./secubox-tools/validate-modules.sh
```

### 3. Test Local (Optionnel)
```bash
# Build local
./secubox-tools/local-build.sh build luci-app-system-hub

# Vérifier .ipk
ls -la build/x86-64/luci-app-system-hub*.ipk
```

### 4. Déploiement
```bash
# Déployer sur routeur de test
./deploy-module-template.sh system-hub

# Le script fait automatiquement:
# - Backup avec timestamp
# - Deploy JS, CSS, RPCD, menu, ACL
# - Fix permissions
# - Clear cache
# - Restart services
# - Vérification
```

### 5. Test Navigateur
```
1. Ouvrir en MODE PRIVÉ (Ctrl+Shift+N)
2. URL: https://192.168.8.191/cgi-bin/luci/admin/secubox/system/system-hub
3. F12 Console: vérifier pas d'erreurs
4. F12 Network: tous fichiers 200 OK
5. Tester dark/light mode
6. Tester responsive (mobile view)
```

### 6. Commit
```bash
git add .
git commit -m "feat: improve system-hub overview with demo styling"
git push
```

---

## 🔍 Checklist Pre-Commit

**OBLIGATOIRE avant chaque commit:**

- [ ] `./secubox-tools/validate-modules.sh` ✅ PASSED
- [ ] RPCD name = ubus object name
- [ ] Menu path = view file path
- [ ] Permissions: 755 (RPCD), 644 (CSS/JS)
- [ ] JSON files valides (jsonlint)
- [ ] CSS: variables utilisées (pas hardcode)
- [ ] CSS: dark mode supporté `[data-theme="dark"]`
- [ ] JS: gestion d'erreur sur API calls
- [ ] Version incrémentée dans Makefile (PKG_VERSION)

---

## 🐛 Erreurs Communes & Solutions Rapides

| Erreur | Cause | Solution Rapide |
|--------|-------|-----------------|
| **-32000 Object not found** | RPCD name ≠ ubus object | Renommer: `mv rpcd/wrong-name rpcd/luci.correct-name` |
| **404 View not found** | Menu path ≠ file location | Corriger path dans `menu.d/*.json` |
| **403 Forbidden CSS** | Permissions incorrectes | `chmod 644 *.css` |
| **[object HTMLButtonElement]** | Array imbriqué dans E() | Enlever wrapper: `E('div', {}, renderButtons())` |
| **Styles pas à jour** | Cache navigateur | Mode privé + Ctrl+Shift+R |

**Pour diagnostics détaillés:** Voir [DEVELOPMENT-GUIDELINES.md - Common Errors](../DEVELOPMENT-GUIDELINES.md#common-errors--solutions)

---

## 🧪 Debug Commands

```bash
# Vérifier ubus objects
ssh root@192.168.8.191 "ubus list | grep luci.system-hub"

# Tester RPCD directement
ssh root@192.168.8.191 "/usr/libexec/rpcd/luci.system-hub call getHealth"

# Vérifier fichiers déployés
ssh root@192.168.8.191 "ls -la /www/luci-static/resources/view/system-hub/"

# Vérifier permissions
ssh root@192.168.8.191 "ls -la /usr/libexec/rpcd/luci.system-hub"

# Logs système
ssh root@192.168.8.191 "logread | grep -i error | tail -20"

# Clear cache + restart
ssh root@192.168.8.191 "rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* && /etc/init.d/rpcd restart && /etc/init.d/uhttpd restart"
```

---

## 📁 Fichiers de ce Répertoire (.claude/)

### Fichiers Actifs (v2.0)

| Fichier | Description | Status |
|---------|-------------|--------|
| **README.md** | Ce fichier - Guide configuration Claude | ✅ ACTIF v2.0 |
| **settings.local.json** | Configuration locale Claude Code | ✅ ACTIF v2.0 |

### Fichiers Legacy (Deprecated)

| Fichier | Description | Migration |
|---------|-------------|-----------|
| `module-prompts.md` | Anciens prompts modules (18KB) | → DEVELOPMENT-GUIDELINES.md |
| `module-implementation-guide.md` | Ancien template modules (23KB) | → DEVELOPMENT-GUIDELINES.md |
| `context.md` | Ancien contexte (13KB) | → README.md + CLAUDE.md |

**⚠️ Les fichiers legacy sont conservés pour référence historique mais ne doivent plus être utilisés.**

**Utilisez maintenant:**
- DEVELOPMENT-GUIDELINES.md (guide complet)
- QUICK-START.md (aide-mémoire)
- CLAUDE.md (architecture)

---

## 🎯 Templates de Code Rapides

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
        // Content here
    ])
])
```

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
                printf '{"enabled": true, "version": "1.0.0"}\n'
                ;;
            getHealth)
                cpu=$(top -bn1 | grep "CPU:" | awk '{print $2}' | sed 's/%//')
                printf '{"cpu": {"usage": %s}}\n' "$cpu"
                ;;
        esac
        ;;
esac
```

**Pour plus de templates:** Voir [QUICK-START.md - Quick Code Templates](../QUICK-START.md#quick-code-templates)

---

## 📊 Structure d'un Module Type

```
luci-app-<module-name>/
├── Makefile                              # Package OpenWrt
├── README.md                             # Documentation module
├── htdocs/luci-static/resources/
│   ├── view/<module-name>/
│   │   ├── overview.js                   # Vue principale
│   │   ├── settings.js                   # Configuration (optionnel)
│   │   └── *.js                          # Autres vues
│   └── <module-name>/
│       ├── api.js                        # Client RPC
│       ├── common.css                    # Styles partagés
│       └── overview.css                  # Styles page
└── root/
    ├── usr/libexec/rpcd/
    │   └── luci.<module-name>            ⚠️ MUST match ubus object!
    └── usr/share/
        ├── luci/menu.d/
        │   └── luci-app-<module-name>.json
        └── rpcd/acl.d/
            └── luci-app-<module-name>.json
```

---

## 🌐 URLs de Test

**System Hub (Design v0.3.0):**
```
https://192.168.8.191/cgi-bin/luci/admin/secubox/system/system-hub
```

**SecuBox Dashboard:**
```
https://192.168.8.191/cgi-bin/luci/admin/secubox
```

**⚠️ TOUJOURS tester en mode privé/incognito** après déploiement!

---

## 📚 Liens Utiles

- **Démo design:** https://cybermind.fr/apps/system-hub/demo.html
- **OpenWrt LuCI:** https://github.com/openwrt/luci
- **OpenWrt Docs:** https://openwrt.org/docs/
- **Issues Claude Code:** https://github.com/anthropics/claude-code/issues

---

## 📝 Changelog Configuration

### Version 2.0.0 (2025-12-26)

**Ajouts majeurs:**
- ✅ DEVELOPMENT-GUIDELINES.md (33KB, guide complet)
- ✅ QUICK-START.md (6.4KB, aide-mémoire)
- ✅ deploy-module-template.sh (script standardisé)
- ✅ Design System v0.3.0 (demo-inspired)
- ✅ 8 règles critiques documentées
- ✅ Checklists validation complètes
- ✅ Templates de code prêts à l'emploi

**Dépréciations:**
- ⚠️ module-prompts.md → migré vers DEVELOPMENT-GUIDELINES.md
- ⚠️ module-implementation-guide.md → migré vers DEVELOPMENT-GUIDELINES.md
- ⚠️ context.md → migré vers README.md + CLAUDE.md

**Améliorations:**
- ✅ Documentation structurée en 4 guides principaux
- ✅ Workflow de développement clarifié
- ✅ Erreurs communes documentées avec solutions
- ✅ Script de déploiement avec backup automatique

### Version 1.0.0 (2023-12-23)

- Version initiale avec module-prompts.md et module-implementation-guide.md

---

**Dernière mise à jour:** 2025-12-26
**Maintenu par:** CyberMind Studio
**Version:** 2.0.0
