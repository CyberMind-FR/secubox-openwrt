# Document de Conception Activation/Desactivation des Modules

> **Languages:** [English](../../DOCS/archive/MODULE-ENABLE-DISABLE-DESIGN.md) | Francais | [中文](../../DOCS-zh/archive/MODULE-ENABLE-DISABLE-DESIGN.md)

**Version:** 0.3.1
**Date:** 2025-12-27
**Auteur:** Claude Code + CyberMind

## Objectif

Remplacer la logique **demarrage/arret** des modules SecuBox par une logique **activation/desactivation** (active/desactive), car les modules sont des **plugins installes** qu'on souhaite activer ou desactiver, plutot que des services qu'on demarre ou arrete ponctuellement.

## Changements Conceptuels

### Avant (v0.2.x)

```
Module installe → peut etre "En cours" ou "Arrete"
Actions: Demarrer / Arreter / Redemarrer
Etat affiche: "En cours" (vert) ou "Arrete" (gris)
```

### Apres (v0.3.1+)

```
Module installe → peut etre "Active" ou "Desactive"
Actions: Activer / Desactiver
Etat affiche: "Active" (vert) ou "Desactive" (gris)
Info complementaire: "Service en cours" (si active + en cours)
```

## Architecture Technique

### 1. Configuration UCI

Chaque module dans `/etc/config/secubox` aura un champ `enabled`:

```uci
config module 'crowdsec'
    option name 'CrowdSec Dashboard'
    option package 'luci-app-crowdsec-dashboard'
    option config 'crowdsec'
    option category 'security'
    option enabled '1'              # NOUVEAU: 1 = active, 0 = desactive
    option icon '🛡️'
    option color '#ef4444'
```

### 2. Methodes RPCD (`luci.secubox`)

#### Anciennes methodes (OBSOLETES)
- `start_module(module_id)` → demarre le service
- `stop_module(module_id)` → arrete le service
- `restart_module(module_id)` → redemarre le service

#### Nouvelles methodes (v0.3.1+)

```javascript
// Active un module (config UCI + demarrage service)
enable_module(module_id)
→ uci set secubox.${module}.enabled='1'
→ uci commit secubox
→ /etc/init.d/${service} enable
→ /etc/init.d/${service} start
→ return { success: true, message: "Module active" }

// Desactive un module (config UCI + arret service)
disable_module(module_id)
→ uci set secubox.${module}.enabled='0'
→ uci commit secubox
→ /etc/init.d/${service} disable
→ /etc/init.d/${service} stop
→ return { success: true, message: "Module desactive" }

// Verifie si un module est active
check_module_enabled(module_id)
→ return uci get secubox.${module}.enabled == '1'

// Verifie si le service tourne (info complementaire)
check_service_running(module_id)
→ return pgrep -f ${service} > /dev/null
```

### 3. Structure de donnees retournee

```json
{
  "modules": [
    {
      "id": "crowdsec",
      "name": "CrowdSec Dashboard",
      "category": "security",
      "installed": true,
      "enabled": true,          // Etat principal (config UCI)
      "running": true,          // Etat du service (info)
      "status": "active",       // enabled + running = "active"
      "icon": "🛡️",
      "color": "#ef4444"
    },
    {
      "id": "netdata",
      "name": "Netdata Monitoring",
      "category": "monitoring",
      "installed": true,
      "enabled": false,         // Module desactive
      "running": false,
      "status": "disabled",     // Statut affiche
      "icon": "📊",
      "color": "#22c55e"
    }
  ]
}
```

### 4. Etats Possibles

| enabled | running | status   | Badge UI      | Description |
|---------|---------|----------|---------------|-------------|
| `true`  | `true`  | `active` | Active        | Module active et service tourne |
| `true`  | `false` | `error`  | Erreur        | Module active mais service arrete (probleme) |
| `false` | `false` | `disabled` | Desactive   | Module desactive (etat normal) |
| `false` | `true`  | `unknown` | Inconnu      | Etat incoherent (rare) |

## Interface Utilisateur

### Tableau de Bord Principal (SecuBox Hub)

**Avant:**
```
[CrowdSec Dashboard]  ● En cours   [Arreter] [Redemarrer]
[Netdata Monitor]     ○ Arrete     [Demarrer]
```

**Apres:**
```
[CrowdSec Dashboard]  ✓ Active     [Desactiver]
[Netdata Monitor]     ○ Desactive  [Activer]
```

### Carte de Module Individuel

```html
<div class="module-card enabled">
  <div class="module-header">
    <span class="module-icon">🛡️</span>
    <span class="module-name">CrowdSec Dashboard</span>
    <span class="module-badge enabled">✓ Active</span>
  </div>
  <div class="module-status">
    <span class="status-dot running"></span>
    <span>Service en cours d'execution</span>
  </div>
  <div class="module-actions">
    <button class="btn-disable">Desactiver</button>
  </div>
</div>
```

### Classes CSS

```css
/* Etats des modules */
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

/* Indicateurs de statut */
.status-dot.running {
  background: #22c55e;
  animation: pulse 2s infinite;
}

.status-dot.stopped {
  background: #94a3b8;
}
```

## API JavaScript

### Fichier: `secubox/api.js`

```javascript
// Anciennes methodes (OBSOLETES - a supprimer)
startModule: callStartModule,     // OBSOLETE
stopModule: callStopModule,       // OBSOLETE
restartModule: callRestartModule, // OBSOLETE

// Nouvelles methodes (v0.3.1+)
enableModule: callEnableModule,   // NOUVEAU
disableModule: callDisableModule, // NOUVEAU

// Declarations RPC
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

## Migration des Donnees

### Script de migration (a executer une fois)

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
    # Sinon, on le desactive par defaut
    uci set secubox.${module}.enabled='0'
  fi
}

# Migrer tous les modules
config_load secubox
config_foreach migrate_module module

uci commit secubox
echo "Migration completed"
```

## Documentation Utilisateur

### README.md (a ajouter)

```markdown
## Gestion des Modules

Les modules SecuBox sont des plugins installes qui peuvent etre **actives** ou **desactives**.

### Activer un module
- Cliquez sur le bouton **"Activer"** sur la carte du module
- Le module sera configure pour demarrer automatiquement au boot
- Le service associe demarrera immediatement

### Desactiver un module
- Cliquez sur le bouton **"Desactiver"** sur la carte du module
- Le module ne demarrera plus automatiquement au boot
- Le service associe s'arretera immediatement

### Etats des modules

| Badge | Signification |
|-------|---------------|
| ✓ Active | Module active et service en cours d'execution |
| Erreur | Module active mais service arrete (verifier les journaux) |
| ○ Desactive | Module desactive (normal) |

**Note:** Les modules restent installes meme lorsqu'ils sont desactives. Pour les supprimer completement, utilisez le gestionnaire de paquets APK.
```

## Tests a Effectuer

### Tests Unitaires RPCD

```bash
# Test enable_module
ubus call luci.secubox enable_module '{"module_id":"crowdsec"}'
# Attendu: {"success":true,"message":"Module active"}

# Verifier config UCI
uci get secubox.crowdsec.enabled
# Attendu: 1

# Verifier service
/etc/init.d/crowdsec enabled && echo "OK" || echo "FAIL"
pgrep crowdsec && echo "Running" || echo "Not running"

# Test disable_module
ubus call luci.secubox disable_module '{"module_id":"crowdsec"}'
# Attendu: {"success":true,"message":"Module desactive"}

# Verifier
uci get secubox.crowdsec.enabled
# Attendu: 0
```

### Tests Interface

1. Ouvrir le tableau de bord SecuBox
2. Verifier que les modules affichent "Active" ou "Desactive"
3. Cliquer sur "Desactiver" → badge passe a "○ Desactive"
4. Cliquer sur "Activer" → badge passe a "✓ Active"
5. Verifier que le service demarre/s'arrete reellement
6. Rafraichir la page → etat persiste (UCI)

## Modules Affectes

### SecuBox Hub (`luci-app-secubox`)

**Fichiers a modifier:**
- `root/usr/libexec/rpcd/luci.secubox` - Backend RPCD
- `htdocs/luci-static/resources/secubox/api.js` - API JS
- `htdocs/luci-static/resources/view/secubox/dashboard.js` - Tableau de bord
- `htdocs/luci-static/resources/view/secubox/modules.js` - Liste des modules
- `htdocs/luci-static/resources/secubox/dashboard.css` - Styles
- `root/usr/share/rpcd/acl.d/luci-app-secubox.json` - Permissions ACL
- `README.md` - Documentation

### System Hub (`luci-app-system-hub`)

**Fichiers a modifier:**
- `htdocs/luci-static/resources/view/system-hub/components.js` - Vue composants
- `htdocs/luci-static/resources/view/system-hub/services.js` - Vue services
- `README.md` - Documentation

## Benefices

1. **Clarte conceptuelle**: "Activer/Desactiver" est plus clair que "Demarrer/Arreter" pour des plugins
2. **Persistance**: L'etat persiste apres redemarrage (UCI + init.d enable/disable)
3. **Coherence**: Tous les modules suivent la meme logique
4. **Meilleure UX**: L'utilisateur comprend qu'il active/desactive des fonctionnalites
5. **Alignement OpenWrt**: Utilise les mecanismes natifs (`/etc/init.d/${service} enable/disable`)

## Prochaines Etapes

- [x] Creer ce document de conception
- [ ] Implementer les modifications RPCD
- [ ] Mettre a jour l'API JavaScript
- [ ] Mettre a jour les interfaces UI
- [ ] Mettre a jour les permissions ACL
- [ ] Creer script de migration UCI
- [ ] Mettre a jour la documentation
- [ ] Tester sur routeur de test
- [ ] Deployer en production

---

**Mainteneur:** CyberMind <contact@cybermind.fr>
**Licence:** Apache-2.0
