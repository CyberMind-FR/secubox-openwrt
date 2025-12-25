# 📚 Documentation Claude pour SecuBox

Ce répertoire contient la documentation et les guides pour travailler avec Claude Code sur le projet SecuBox.

---

## 📁 Fichiers Disponibles

### 1. `module-prompts.md`
**Prompts d'implémentation pour les 14 modules de base**

Contient les spécifications complètes pour chaque module SecuBox existant:
- SecuBox Hub, System Hub
- CrowdSec, Netdata, Netifyd Dashboards
- Network Modes, Client Guardian, Auth Guardian
- WireGuard, Bandwidth Manager, Media Flow
- VHost Manager, CDN Cache, Traffic Shaper

**Usage**: Copie-colle le prompt du module que tu veux implémenter ou modifier.

### 2. `module-implementation-guide.md` ⭐ NOUVEAU
**Template structuré pour créer de nouveaux modules**

Guide complet avec:
- Template réutilisable pour tout nouveau module
- Checklist de validation complète
- Exemple détaillé: KSM Manager (gestion de clés + Nitrokey)
- Workflow d'implémentation étape par étape
- Spécifications techniques détaillées

**Usage**:
1. Copie le template
2. Remplis les sections pour ton module
3. Soumets le prompt complet à Claude
4. Valide avec `validate-modules.sh`

### 3. `settings.local.json`
**Configuration locale de Claude Code**

Contient les paramètres de développement pour cette session.

---

## 🚀 Quick Start: Créer un Nouveau Module

### Étape 1: Préparation
```bash
# Assure-toi d'être dans le bon répertoire
cd /home/reepost/CyberMindStudio/_files/secubox

# Lis le guide d'implémentation
cat .claude/module-implementation-guide.md
```

### Étape 2: Rédiger les Spécifications

Ouvre `module-implementation-guide.md` et copie le template. Remplis:

**Obligatoire**:
- Nom du module
- Catégorie (Security/Network/System/Performance/Services)
- Description et cas d'utilisation
- 3-5 fonctionnalités principales
- Méthodes RPCD (minimum 5-8)
- Configuration UCI
- Views JavaScript (minimum 2-3)

**Recommandé**:
- Dépendances système
- Spécifications de parsing CLI
- Gestion d'erreurs
- Notes de sécurité

### Étape 3: Soumettre à Claude

```
[Colle ton prompt basé sur le template]
```

Claude générera:
- ✅ Makefile
- ✅ RPCD Backend
- ✅ API Client
- ✅ Views JavaScript
- ✅ Menu JSON
- ✅ ACL JSON
- ✅ README.md

### Étape 4: Validation

```bash
# Validation automatique
./secubox-tools/validate-modules.sh

# Vérification syntaxe JavaScript
node -c luci-app-{module}/htdocs/luci-static/resources/**/*.js

# Test RPCD sur router (si disponible)
ubus call luci.{module} status
```

---

## 📖 Exemples d'Utilisation

### Exemple 1: Module Simple (Monitoring)

```markdown
## Nouveau Module SecuBox: System Monitor

**Nom**: luci-app-system-monitor
**Catégorie**: System
**Description**: Monitoring temps réel CPU, RAM, Disk, Network

### Fonctionnalités:
1. Métriques système (CPU%, RAM%, Disk%, Temp)
2. Graphiques temps réel (5min, 1h, 24h)
3. Alertes configurables (seuils)
4. Export données (CSV, JSON)

### Méthodes RPCD:
- status
- get_metrics
- get_history
- set_alert
- list_alerts

[... reste du template ...]
```

### Exemple 2: Module Complexe (KSM Manager)

Voir l'exemple complet dans `module-implementation-guide.md` → Section "Exemple Concret: Module KSM"

22 méthodes RPCD, 8 views, support HSM hardware, gestion certificats, audit logs, etc.

### Exemple 3: Module Intégration (Home Assistant)

```markdown
## Nouveau Module SecuBox: Home Assistant Bridge

**Nom**: luci-app-hass-bridge
**Catégorie**: Services
**Description**: Intégration bidirectionnelle avec Home Assistant

### Fonctionnalités:
1. Auto-discovery MQTT
2. Entities SecuBox → HASS (sensors, switches)
3. Services HASS → SecuBox (actions)
4. Webhooks bidirectionnels
5. Dashboard widgets

### Méthodes RPCD:
- status
- get_entities
- publish_entity
- trigger_service
- list_webhooks
- add_webhook

[... reste du template ...]
```

---

## 🎯 Bonnes Pratiques

### Naming Conventions

**Package**:
- Format: `luci-app-{nom-module}` (tout en minuscules, tirets)
- Exemples: `luci-app-cdn-cache`, `luci-app-ksm-manager`

**RPCD Script**:
- **OBLIGATOIRE**: `luci.{nom-module}` (préfixe `luci.` requis!)
- Emplacement: `/root/usr/libexec/rpcd/luci.{nom-module}`
- Permissions: Exécutable (`chmod +x`)

**UCI Config**:
- Fichier: `/etc/config/{nom-module}` (sans `luci-app-`)
- Exemple: `/etc/config/ksm` pour `luci-app-ksm-manager`

**Views**:
- Emplacement: `/htdocs/luci-static/resources/view/{module}/`
- Fichiers: `overview.js`, `{feature}.js`

**API Client**:
- Emplacement: `/htdocs/luci-static/resources/{module}/api.js`
- Export: `L.Class.extend({ ... })`

### Structure Minimale

**Petit module** (< 5 méthodes):
```
luci-app-{module}/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── {module}/
│   │   └── api.js
│   └── view/{module}/
│       └── overview.js
└── root/
    ├── usr/
    │   ├── libexec/rpcd/
    │   │   └── luci.{module}
    │   └── share/
    │       ├── luci/menu.d/
    │       │   └── luci-app-{module}.json
    │       └── rpcd/acl.d/
    │           └── luci-app-{module}.json
    └── etc/config/
        └── {module} (optionnel)
```

**Module complet** (> 8 méthodes):
```
[Structure minimale +]
├── htdocs/luci-static/resources/
│   └── view/{module}/
│       ├── overview.js
│       ├── management.js
│       ├── settings.js
│       └── logs.js
└── root/etc/init.d/
    └── {module} (si besoin d'un daemon)
```

### Checklist Pré-Commit

Avant de commiter un nouveau module:

- [ ] `./secubox-tools/validate-modules.sh` passe ✅
- [ ] Tous les fichiers JavaScript valident avec `node -c`
- [ ] Tous les JSON valident avec `jsonlint`
- [ ] RPCD script est exécutable
- [ ] Nom RPCD = `luci.{module}` (avec préfixe!)
- [ ] README.md complet avec installation/usage
- [ ] Makefile a toutes les dépendances
- [ ] ACL contient toutes les méthodes RPCD
- [ ] Menu paths matchent les fichiers view
- [ ] Git commit message descriptif

---

## 🔧 Outils de Développement

### Validation Automatique

```bash
# Validation complète de tous les modules
./secubox-tools/validate-modules.sh

# Validation d'un module spécifique
./secubox-tools/secubox-debug.sh luci-app-{module}

# Réparation automatique des problèmes courants
./secubox-tools/secubox-repair.sh
```

### Build Local

```bash
# Build tous les packages
./secubox-tools/local-build.sh build

# Build un package spécifique
./secubox-tools/local-build.sh build luci-app-{module}

# Build pour architecture spécifique
./secubox-tools/local-build.sh build --arch aarch64-cortex-a72

# Validation seule (rapide)
./secubox-tools/local-build.sh validate
```

### Test sur Router

```bash
# Transfer IPK
scp build/x86-64/luci-app-{module}_*.ipk root@192.168.1.1:/tmp/

# Install sur router
ssh root@192.168.1.1
opkg install /tmp/luci-app-{module}_*.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart

# Test RPC manuel
ubus list | grep {module}
ubus call luci.{module} status
```

---

## 📚 Ressources

### Documentation OpenWrt/LuCI

- [LuCI API Reference](https://openwrt.github.io/luci/)
- [UCI Configuration](https://openwrt.org/docs/guide-user/base-system/uci)
- [RPCD Guide](https://openwrt.org/docs/techref/rpcd)
- [OpenWrt Packages](https://openwrt.org/packages/start)

### Exemples de Code

Tous les 14 modules SecuBox existants servent de référence:

**Simples** (bon pour débuter):
- `luci-app-netdata-dashboard` - Iframe simple + contrôles
- `luci-app-network-modes` - Preset application

**Moyens**:
- `luci-app-bandwidth-manager` - QoS avec graphiques
- `luci-app-media-flow` - Détection + stats

**Avancés** (patterns complexes):
- `luci-app-wireguard-dashboard` - Génération clés + QR codes
- `luci-app-auth-guardian` - OAuth + vouchers + sessions
- `luci-app-traffic-shaper` - TC/CAKE intégration

### Architecture SecuBox

```
SecuBox Hub (luci-app-secubox)
    ├── Security Layer
    │   ├── CrowdSec Dashboard
    │   └── Auth Guardian
    ├── Network Layer
    │   ├── Network Modes
    │   ├── Client Guardian
    │   ├── WireGuard Dashboard
    │   └── VHost Manager
    ├── Traffic Layer
    │   ├── Bandwidth Manager
    │   ├── Media Flow
    │   ├── CDN Cache
    │   └── Traffic Shaper
    ├── Monitoring Layer
    │   ├── Netdata Dashboard
    │   ├── Netifyd Dashboard
    │   └── System Hub
    └── [Nouveau Module]
```

---

## 🤝 Contribution

### Workflow Git

```bash
# Créer branche pour nouveau module
git checkout -b feature/luci-app-{module}

# Développer avec validation continue
# ... développement ...
./secubox-tools/validate-modules.sh

# Commit
git add luci-app-{module}/
git commit -m "feat: implement {Module Name} - {brief description}"

# Push
git push origin feature/luci-app-{module}

# Tag pour release
git tag v0.0.X
git push origin v0.0.X
```

### Format de Commit Messages

```
feat: implement KSM Manager - hardware key storage with Nitrokey
fix: correct RPCD method naming in CDN Cache
docs: add installation guide for Traffic Shaper
chore: update dependencies for Bandwidth Manager
refactor: improve error handling in Auth Guardian
```

---

## 💡 Support

### Debug Module Issues

**Problème**: Module n'apparaît pas dans le menu
- Vérifier menu JSON path
- Vérifier ACL permissions
- Redémarrer uhttpd: `/etc/init.d/uhttpd restart`

**Problème**: RPC errors "Object not found"
- Vérifier nom RPCD = `luci.{module}`
- Vérifier RPCD exécutable: `chmod +x`
- Redémarrer rpcd: `/etc/init.d/rpcd restart`
- Tester ubus: `ubus list | grep {module}`

**Problème**: JavaScript errors
- Valider syntaxe: `node -c {file}.js`
- Vérifier imports: `'require {module}/api'`
- Check console browser (F12)

**Problème**: Build failures
- Vérifier Makefile dependencies
- Vérifier include path: `../../luci.mk`
- Clean build: `make clean`

### Demander de l'Aide

Ouvre une issue GitHub avec:
1. Nom du module
2. Description du problème
3. Logs d'erreur
4. Output de `./secubox-tools/validate-modules.sh`
5. Configuration (anonymisée si nécessaire)

---

## 🎉 Success Stories

Modules déjà implémentés avec succès:

1. **WireGuard Dashboard** - Génération peers + QR codes
2. **Auth Guardian** - OAuth + vouchers complète
3. **Bandwidth Manager** - QoS avec graphiques temps réel
4. **Media Flow** - Détection streaming avec donut chart
5. **CDN Cache** - Hit ratio gauge + cache management
6. **Traffic Shaper** - TC/CAKE avec presets

Tous validés ✅ et production-ready 🚀

---

**Bon développement avec SecuBox!** 🔧🔐🌐
