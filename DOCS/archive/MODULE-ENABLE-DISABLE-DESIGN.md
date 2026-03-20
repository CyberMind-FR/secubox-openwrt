# Module Enable/Disable Design Document

> **Languages:** English | [Francais](../../DOCS-fr/archive/MODULE-ENABLE-DISABLE-DESIGN.md) | [中文](../../DOCS-zh/archive/MODULE-ENABLE-DISABLE-DESIGN.md)

**Version:** 0.3.1
**Date:** 2025-12-27
**Author:** Claude Code + CyberMind

## 🎯 Objectif

Remplacer la logique **start/stop** des modules SecuBox par une logique **enable/disable** (activé/désactivé), car les modules sont des **plugins installés** qu'on souhaite activer ou désactiver, plutôt que des services qu'on démarre ou arrête ponctuellement.

## 📋 Changements Conceptuels

### Avant (v0.2.x)

```
Module installé → peut être "Running" ou "Stopped"
Actions: Start / Stop / Restart
État affiché: "Running" (vert) ou "Stopped" (gris)
```

### Après (v0.3.1+)

```
Module installé → peut être "Enabled" ou "Disabled"
Actions: Enable / Disable
État affiché: "Activé" (vert) ou "Désactivé" (gris)
Info complémentaire: "Service running" (si enabled + running)
```

## 🏗️ Architecture Technique

### 1. Configuration UCI

Chaque module dans `/etc/config/secubox` aura un champ `enabled`:

```uci
config module 'crowdsec'
    option name 'CrowdSec Dashboard'
    option package 'luci-app-crowdsec-dashboard'
    option config 'crowdsec'
    option category 'security'
    option enabled '1'              # NEW: 1 = activé, 0 = désactivé
    option icon '🛡️'
    option color '#ef4444'
```

### 2. Méthodes RPCD (`luci.secubox`)

#### Anciennes méthodes (DEPRECATED)
- ❌ `start_module(module_id)` → démarre le service
- ❌ `stop_module(module_id)` → arrête le service
- ❌ `restart_module(module_id)` → redémarre le service

#### Nouvelles méthodes (v0.3.1+)

```javascript
// Active un module (config UCI + démarrage service)
enable_module(module_id)
→ uci set secubox.${module}.enabled='1'
→ uci commit secubox
→ /etc/init.d/${service} enable
→ /etc/init.d/${service} start
→ return { success: true, message: "Module activé" }

// Désactive un module (config UCI + arrêt service)
disable_module(module_id)
→ uci set secubox.${module}.enabled='0'
→ uci commit secubox
→ /etc/init.d/${service} disable
→ /etc/init.d/${service} stop
→ return { success: true, message: "Module désactivé" }

// Vérifie si un module est activé
check_module_enabled(module_id)
→ return uci get secubox.${module}.enabled == '1'

// Vérifie si le service tourne (info complémentaire)
check_service_running(module_id)
→ return pgrep -f ${service} > /dev/null
```

### 3. Structure de données retournée

```json
{
  "modules": [
    {
      "id": "crowdsec",
      "name": "CrowdSec Dashboard",
      "category": "security",
      "installed": true,
      "enabled": true,          // État principal (config UCI)
      "running": true,          // État du service (info)
      "status": "active",       // enabled + running = "active"
      "icon": "🛡️",
      "color": "#ef4444"
    },
    {
      "id": "netdata",
      "name": "Netdata Monitoring",
      "category": "monitoring",
      "installed": true,
      "enabled": false,         // Module désactivé
      "running": false,
      "status": "disabled",     // Status affiché
      "icon": "📊",
      "color": "#22c55e"
    }
  ]
}
```

### 4. États Possibles

| enabled | running | status   | Badge UI      | Description |
|---------|---------|----------|---------------|-------------|
| `true`  | `true`  | `active` | ✓ Activé      | Module activé et service tourne |
| `true`  | `false` | `error`  | ⚠️ Erreur     | Module activé mais service arrêté (problème) |
| `false` | `false` | `disabled` | ○ Désactivé | Module désactivé (état normal) |
| `false` | `true`  | `unknown` | ? Inconnu   | État incohérent (rare) |

## 🎨 Interface Utilisateur

### Dashboard Principal (SecuBox Hub)

**Avant:**
```
[CrowdSec Dashboard]  ● Running    [Stop] [Restart]
[Netdata Monitor]     ○ Stopped    [Start]
```

**Après:**
```
[CrowdSec Dashboard]  ✓ Activé     [Désactiver]
[Netdata Monitor]     ○ Désactivé  [Activer]
```

### Module Individual Card

```html
<div class="module-card enabled">
  <div class="module-header">
    <span class="module-icon">🛡️</span>
    <span class="module-name">CrowdSec Dashboard</span>
    <span class="module-badge enabled">✓ Activé</span>
  </div>
  <div class="module-status">
    <span class="status-dot running"></span>
    <span>Service en cours d'exécution</span>
  </div>
  <div class="module-actions">
    <button class="btn-disable">Désactiver</button>
  </div>
</div>
```

### Classes CSS

```css
/* Module states */
.module-badge.enabled {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.module-badge.disabled {
  background: var(--sh-bg-secondary);
  color: var(--sh-text-muted);
}

.module-badge.error {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

/* Status indicators */
.status-dot.running {
  background: #22c55e;
  animation: pulse 2s infinite;
}

.status-dot.stopped {
  background: #94a3b8;
}
```

## 📝 API JavaScript

### Fichier: `secubox/api.js`

```javascript
// Anciennes méthodes (DEPRECATED - à supprimer)
startModule: callStartModule,     // DEPRECATED
stopModule: callStopModule,       // DEPRECATED
restartModule: callRestartModule, // DEPRECATED

// Nouvelles méthodes (v0.3.1+)
enableModule: callEnableModule,   // NEW
disableModule: callDisableModule, // NEW

// Déclarations RPC
var callEnableModule = rpc.declare({
  object: 'luci.secubox',
  method: 'enable_module',
  params: ['module_id'],
  expect: { success: false, message: '' }
});

var callDisableModule = rpc.declare({
  object: 'luci.secubox',
  method: 'disable_module',
  params: ['module_id'],
  expect: { success: false, message: '' }
});
```

## 🔄 Migration des Données

### Script de migration (à exécuter une fois)

```bash
#!/bin/sh
# migrate-to-enable-disable.sh

. /lib/functions.sh

migrate_module() {
  local module="$1"
  local running=$(pgrep -f "$module" > /dev/null && echo "1" || echo "0")

  # Si le service tourne actuellement, on l'active
  if [ "$running" = "1" ]; then
    uci set secubox.${module}.enabled='1'
  else
    # Sinon, on le désactive par défaut
    uci set secubox.${module}.enabled='0'
  fi
}

# Migrer tous les modules
config_load secubox
config_foreach migrate_module module

uci commit secubox
echo "Migration completed"
```

## 📚 Documentation Utilisateur

### README.md (à ajouter)

```markdown
## Gestion des Modules

Les modules SecuBox sont des plugins installés qui peuvent être **activés** ou **désactivés**.

### Activer un module
- Cliquez sur le bouton **"Activer"** sur la carte du module
- Le module sera configuré pour démarrer automatiquement au boot
- Le service associé démarrera immédiatement

### Désactiver un module
- Cliquez sur le bouton **"Désactiver"** sur la carte du module
- Le module ne démarrera plus automatiquement au boot
- Le service associé s'arrêtera immédiatement

### États des modules

| Badge | Signification |
|-------|---------------|
| ✓ Activé | Module activé et service en cours d'exécution |
| ⚠️ Erreur | Module activé mais service arrêté (vérifier les logs) |
| ○ Désactivé | Module désactivé (normal) |

**Note:** Les modules restent installés même lorsqu'ils sont désactivés. Pour les supprimer complètement, utilisez le gestionnaire de paquets APK.
```

## 🧪 Tests à Effectuer

### Tests Unitaires RPCD

```bash
# Test enable_module
ubus call luci.secubox enable_module '{"module_id":"crowdsec"}'
# Expected: {"success":true,"message":"Module activé"}

# Vérifier config UCI
uci get secubox.crowdsec.enabled
# Expected: 1

# Vérifier service
/etc/init.d/crowdsec enabled && echo "OK" || echo "FAIL"
pgrep crowdsec && echo "Running" || echo "Not running"

# Test disable_module
ubus call luci.secubox disable_module '{"module_id":"crowdsec"}'
# Expected: {"success":true,"message":"Module désactivé"}

# Vérifier
uci get secubox.crowdsec.enabled
# Expected: 0
```

### Tests Interface

1. ✅ Ouvrir le dashboard SecuBox
2. ✅ Vérifier que les modules affichent "Activé" ou "Désactivé"
3. ✅ Cliquer sur "Désactiver" → badge passe à "○ Désactivé"
4. ✅ Cliquer sur "Activer" → badge passe à "✓ Activé"
5. ✅ Vérifier que le service démarre/s'arrête réellement
6. ✅ Rafraîchir la page → état persiste (UCI)

## 📦 Modules Affectés

### SecuBox Hub (`luci-app-secubox`)

**Fichiers à modifier:**
- ✅ `root/usr/libexec/rpcd/luci.secubox` - Backend RPCD
- ✅ `htdocs/luci-static/resources/secubox/api.js` - API JS
- ✅ `htdocs/luci-static/resources/view/secubox/dashboard.js` - Dashboard
- ✅ `htdocs/luci-static/resources/view/secubox/modules.js` - Module list
- ✅ `htdocs/luci-static/resources/secubox/dashboard.css` - Styles
- ✅ `root/usr/share/rpcd/acl.d/luci-app-secubox.json` - ACL permissions
- ✅ `README.md` - Documentation

### System Hub (`luci-app-system-hub`)

**Fichiers à modifier:**
- ✅ `htdocs/luci-static/resources/view/system-hub/components.js` - Vue composants
- ✅ `htdocs/luci-static/resources/view/system-hub/services.js` - Vue services
- ✅ `README.md` - Documentation

## 🎯 Bénéfices

1. **Clarté conceptuelle**: "Activer/Désactiver" est plus clair que "Démarrer/Arrêter" pour des plugins
2. **Persistance**: L'état persiste après redémarrage (UCI + init.d enable/disable)
3. **Cohérence**: Tous les modules suivent la même logique
4. **Meilleure UX**: L'utilisateur comprend qu'il active/désactive des fonctionnalités
5. **Alignement OpenWrt**: Utilise les mécanismes natifs (`/etc/init.d/${service} enable/disable`)

## 🔜 Prochaines Étapes

- [x] Créer ce document de design
- [ ] Implémenter les modifications RPCD
- [ ] Mettre à jour l'API JavaScript
- [ ] Mettre à jour les interfaces UI
- [ ] Mettre à jour les ACL permissions
- [ ] Créer script de migration UCI
- [ ] Mettre à jour la documentation
- [ ] Tester sur router de test
- [ ] Déployer en production

---

**Maintainer:** CyberMind <contact@cybermind.fr>
**License:** Apache-2.0
