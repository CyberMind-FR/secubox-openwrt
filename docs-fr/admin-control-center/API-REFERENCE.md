# SecuBox Admin Control Center - Reference API

> **Langues:** [English](../../docs/admin-control-center/API-REFERENCE.md) | Francais | [中文](../../docs-zh/admin-control-center/API-REFERENCE.md)

Reference complete de l'API pour la gestion des etats, le registre des composants et les fonctionnalites du centre de controle.

---

## Table des Matieres

1. [API Backend RPC](#api-backend-rpc)
   - [Methodes de Gestion d'Etat](#methodes-de-gestion-detat)
   - [Methodes du Registre des Composants](#methodes-du-registre-des-composants)
2. [Outils CLI](#outils-cli)
   - [secubox-state](#secubox-state)
   - [secubox-component](#secubox-component)
   - [secubox-sync-registry](#secubox-sync-registry)
3. [API Frontend JavaScript](#api-frontend-javascript)
   - [Gestion d'Etat](#gestion-detat)
   - [Gestion des Composants](#gestion-des-composants)
   - [Fonctions Utilitaires](#fonctions-utilitaires)
4. [Utilitaires d'Etat](#utilitaires-detat)
5. [Composants UI](#composants-ui)
6. [Structures de Donnees](#structures-de-donnees)

---

## API Backend RPC

Toutes les methodes RPC sont exposees via l'objet `luci.secubox`.

### Methodes de Gestion d'Etat

#### `get_component_state`

Obtient l'etat actuel et les metadonnees d'un composant.

**Parametres:**
- `component_id` (string): Identifiant unique du composant

**Retourne:**
```json
{
  "component_id": "luci-app-auth-guardian",
  "current_state": "running",
  "previous_state": "starting",
  "state_changed_at": "2026-01-05T10:30:00Z",
  "error_details": {
    "type": "runtime_error",
    "message": "Service failed to start",
    "code": "E_SERVICE_START"
  },
  "history": [
    {
      "state": "starting",
      "timestamp": "2026-01-05T10:29:45Z",
      "reason": "user_action"
    }
  ],
  "metadata": {
    "installed_version": "1.0.0",
    "catalog_version": "1.0.1"
  }
}
```

**Exemple:**
```javascript
L.resolveDefault(callGetComponentState('luci-app-auth-guardian'))
  .then(function(state) {
    console.log('Current state:', state.current_state);
  });
```

#### `set_component_state`

Definit un nouvel etat pour un composant avec validation de transition atomique.

**Parametres:**
- `component_id` (string): Identifiant unique du composant
- `new_state` (string): Etat cible (voir [Definitions d'Etat](#definitions-detat))
- `reason` (string): Raison du changement d'etat

**Retourne:**
```json
{
  "success": true,
  "message": "State transition successful",
  "previous_state": "stopped",
  "new_state": "starting"
}
```

**Erreurs:**
- Transition invalide (retourne `success: false`)
- Composant non trouve
- Etat verrouille

**Exemple:**
```javascript
L.resolveDefault(callSetComponentState('luci-app-auth-guardian', 'starting', 'user_request'))
  .then(function(result) {
    if (result.success) {
      console.log('State changed successfully');
    }
  });
```

#### `get_state_history`

Obtient l'historique des transitions d'etat pour un composant.

**Parametres:**
- `component_id` (string): Identifiant unique du composant
- `limit` (number, optionnel): Nombre maximum d'entrees d'historique (par defaut: 50)

**Retourne:**
```json
{
  "history": [
    {
      "state": "running",
      "timestamp": "2026-01-05T10:30:00Z",
      "reason": "start_success",
      "metadata": {}
    },
    {
      "state": "starting",
      "timestamp": "2026-01-05T10:29:45Z",
      "reason": "user_action"
    }
  ]
}
```

**Exemple:**
```javascript
L.resolveDefault(callGetStateHistory('luci-app-auth-guardian', 10))
  .then(function(result) {
    result.history.forEach(function(entry) {
      console.log(entry.state, entry.timestamp);
    });
  });
```

#### `list_components`

Liste tous les composants avec des filtres optionnels.

**Parametres:**
- `state_filter` (string, optionnel): Filtrer par etat (ex: "running", "error")
- `type_filter` (string, optionnel): Filtrer par type (ex: "app", "module")

**Retourne:**
```json
{
  "components": [
    {
      "id": "luci-app-auth-guardian",
      "type": "app",
      "name": "Auth Guardian",
      "current_state": "running",
      "state_changed_at": "2026-01-05T10:30:00Z"
    }
  ]
}
```

**Exemple:**
```javascript
// Obtenir toutes les applications en cours d'execution
L.resolveDefault(callListComponents('running', 'app'))
  .then(function(result) {
    console.log('Running apps:', result.components.length);
  });
```

#### `freeze_component`

Marque un composant comme gele (etat verrouille, aucune transition autorisee).

**Parametres:**
- `component_id` (string): Identifiant unique du composant
- `reason` (string): Raison du gel

**Retourne:**
```json
{
  "success": true,
  "message": "Component frozen successfully"
}
```

**Exemple:**
```javascript
L.resolveDefault(callFreezeComponent('luci-app-firewall', 'system_critical'))
  .then(function(result) {
    console.log('Component frozen');
  });
```

#### `clear_error_state`

Efface l'etat d'erreur et reinitialise le composant au dernier etat connu valide.

**Parametres:**
- `component_id` (string): Identifiant unique du composant

**Retourne:**
```json
{
  "success": true,
  "message": "Error state cleared",
  "new_state": "stopped"
}
```

**Exemple:**
```javascript
L.resolveDefault(callClearErrorState('luci-app-vpn-client'))
  .then(function(result) {
    console.log('Error cleared, new state:', result.new_state);
  });
```

### Methodes du Registre des Composants

#### `get_component`

Obtient les metadonnees completes d'un composant depuis le registre.

**Parametres:**
- `component_id` (string): Identifiant unique du composant

**Retourne:**
```json
{
  "id": "luci-app-auth-guardian",
  "type": "app",
  "name": "Auth Guardian",
  "packages": ["luci-app-auth-guardian", "nodogsplash"],
  "capabilities": ["authentication", "captive-portal"],
  "dependencies": {
    "required": ["luci-base"],
    "optional": ["uhttpd-mod-lua"]
  },
  "settings": {
    "enabled": true,
    "auto_start": true
  },
  "profiles": ["home-security", "enterprise"],
  "managed_services": ["nodogsplash"],
  "state_ref": "luci-app-auth-guardian"
}
```

#### `get_component_tree`

Obtient l'arbre de dependances du composant (recursif).

**Parametres:**
- `component_id` (string): Identifiant unique du composant

**Retourne:**
```json
{
  "component": {
    "id": "luci-app-auth-guardian",
    "name": "Auth Guardian",
    "type": "app"
  },
  "dependencies": {
    "required": [
      {
        "id": "luci-base",
        "name": "LuCI Base",
        "type": "module",
        "dependencies": {...}
      }
    ],
    "optional": []
  },
  "reverse_dependencies": [
    {
      "id": "profile-home-security",
      "type": "composite"
    }
  ]
}
```

#### `update_component_settings`

Met a jour les parametres d'un composant.

**Parametres:**
- `component_id` (string): Identifiant unique du composant
- `settings` (object): Paires cle-valeur des parametres

**Retourne:**
```json
{
  "success": true,
  "updated_settings": {
    "enabled": true,
    "auto_start": false
  }
}
```

#### `validate_component_state`

Valide la coherence de l'etat du composant avec le systeme.

**Parametres:**
- `component_id` (string): Identifiant unique du composant

**Retourne:**
```json
{
  "valid": true,
  "inconsistencies": [],
  "recommendations": []
}
```

---

## Outils CLI

### secubox-state

Interface en ligne de commande pour la gestion des etats.

#### Commandes

##### `get <component-id>`

Obtient l'etat actuel avec les metadonnees.

```bash
secubox-state get luci-app-auth-guardian
```

**Sortie:**
```json
{
  "component_id": "luci-app-auth-guardian",
  "current_state": "running",
  "previous_state": "starting",
  "state_changed_at": "2026-01-05T10:30:00Z"
}
```

##### `set <component-id> <state> [reason]`

Definit un nouvel etat avec transition atomique.

```bash
secubox-state set luci-app-auth-guardian starting user_request
```

**Sortie:**
```
Success: State transition: stopped -> starting
```

##### `history <component-id> [limit]`

Affiche l'historique des etats.

```bash
secubox-state history luci-app-auth-guardian 10
```

##### `list [--state=STATE] [--type=TYPE]`

Liste les composants par etat/type.

```bash
secubox-state list --state=running --type=app
```

##### `validate <component-id>`

Valide la coherence de l'etat.

```bash
secubox-state validate luci-app-auth-guardian
```

##### `sync`

Synchronise la base de donnees d'etat avec l'etat reel du systeme.

```bash
secubox-state sync
```

##### `freeze <component-id> <reason>`

Gele un composant (verrouille l'etat).

```bash
secubox-state freeze luci-app-firewall system_critical
```

##### `clear-error <component-id>`

Efface l'etat d'erreur.

```bash
secubox-state clear-error luci-app-vpn-client
```

### secubox-component

CLI de gestion du registre des composants.

#### Commandes

##### `list [--type=TYPE] [--state=STATE] [--profile=PROFILE]`

Liste les composants avec filtres.

```bash
secubox-component list --type=app --state=running
```

##### `get <component-id>`

Obtient les details d'un composant.

```bash
secubox-component get luci-app-auth-guardian
```

##### `register <component-id> <type> [metadata-json]`

Enregistre un nouveau composant.

```bash
secubox-component register my-app app '{"name":"My App","packages":["my-app"]}'
```

**Types de Composants:**
- `app` - Application LuCI
- `module` - Paquet opkg
- `widget` - Widget de tableau de bord
- `service` - Service systeme
- `composite` - Groupe de composants

##### `unregister <component-id>`

Supprime un composant du registre.

```bash
secubox-component unregister my-app
```

##### `tree <component-id>`

Affiche l'arbre de dependances.

```bash
secubox-component tree luci-app-auth-guardian
```

##### `affected <component-id>`

Affiche les dependances inverses.

```bash
secubox-component affected luci-base
```

##### `set-setting <component-id> <key> <value>`

Met a jour un parametre du composant.

```bash
secubox-component set-setting my-app enabled true
```

### secubox-sync-registry

Remplit automatiquement le registre des composants depuis le catalogue.

#### Commandes

##### `sync`

Synchronisation complete du registre (par defaut).

```bash
secubox-sync-registry sync
```

##### `apps`

Synchronise uniquement les applications depuis le catalogue.

```bash
secubox-sync-registry apps
```

##### `plugins`

Synchronise uniquement les plugins depuis le repertoire du catalogue.

```bash
secubox-sync-registry plugins
```

##### `packages`

Synchronise uniquement les paquets installes.

```bash
secubox-sync-registry packages
```

---

## API Frontend JavaScript

### Gestion d'Etat

#### `api.getComponentState(component_id)`

Obtient l'etat du composant.

```javascript
api.getComponentState('luci-app-auth-guardian')
  .then(function(state) {
    console.log('Current state:', state.current_state);
  });
```

#### `api.setComponentState(component_id, new_state, reason)`

Definit l'etat du composant.

```javascript
api.setComponentState('luci-app-auth-guardian', 'starting', 'user_action')
  .then(function(result) {
    if (result.success) {
      console.log('State changed');
    }
  });
```

#### `api.getStateHistory(component_id, limit)`

Obtient l'historique des etats.

```javascript
api.getStateHistory('luci-app-auth-guardian', 10)
  .then(function(history) {
    history.forEach(function(entry) {
      console.log(entry.state, entry.timestamp);
    });
  });
```

#### `api.listComponents(state_filter, type_filter)`

Liste les composants.

```javascript
api.listComponents('running', 'app')
  .then(function(components) {
    console.log('Running apps:', components);
  });
```

#### `api.freezeComponent(component_id, reason)`

Gele un composant.

```javascript
api.freezeComponent('luci-app-firewall', 'system_critical')
  .then(function(result) {
    console.log('Component frozen');
  });
```

#### `api.clearErrorState(component_id)`

Efface l'etat d'erreur.

```javascript
api.clearErrorState('luci-app-vpn-client')
  .then(function(result) {
    console.log('Error cleared');
  });
```

### Gestion des Composants

#### `api.getComponent(component_id)`

Obtient les metadonnees du composant.

```javascript
api.getComponent('luci-app-auth-guardian')
  .then(function(component) {
    console.log('Component:', component.name);
  });
```

#### `api.getComponentTree(component_id)`

Obtient l'arbre de dependances.

```javascript
api.getComponentTree('luci-app-auth-guardian')
  .then(function(tree) {
    console.log('Dependencies:', tree.dependencies);
  });
```

#### `api.updateComponentSettings(component_id, settings)`

Met a jour les parametres.

```javascript
api.updateComponentSettings('luci-app-auth-guardian', {
  enabled: true,
  auto_start: false
}).then(function(result) {
  console.log('Settings updated');
});
```

### Methodes Avancees

#### `api.getComponentWithState(component_id)`

Obtient le composant avec son etat en un seul appel.

```javascript
api.getComponentWithState('luci-app-auth-guardian')
  .then(function(component) {
    console.log('Component:', component.name);
    console.log('State:', component.state_info.current_state);
  });
```

#### `api.getAllComponentsWithStates(filters)`

Obtient tous les composants avec leurs etats.

```javascript
api.getAllComponentsWithStates({ state: 'running', type: 'app' })
  .then(function(components) {
    components.forEach(function(comp) {
      console.log(comp.name, comp.state_info.current_state);
    });
  });
```

#### `api.bulkSetComponentState(component_ids, new_state, reason)`

Changement d'etat en masse.

```javascript
api.bulkSetComponentState(
  ['app1', 'app2', 'app3'],
  'stopped',
  'bulk_shutdown'
).then(function(results) {
  console.log('Bulk operation results:', results);
});
```

#### `api.getStateStatistics()`

Obtient les statistiques de distribution des etats.

```javascript
api.getStateStatistics()
  .then(function(stats) {
    console.log('Total components:', stats.total);
    console.log('By state:', stats.by_state);
    console.log('By type:', stats.by_type);
  });
```

---

## Utilitaires d'Etat

Utilitaires JavaScript dans `state-utils.js`.

### Methodes

#### `getStateConfig(state)`

Obtient la configuration complete de l'etat.

```javascript
var config = stateUtils.getStateConfig('running');
// Retourne: { color: '#10b981', icon: '▶', label: 'Running', category: 'runtime', description: '...' }
```

#### `getStateColor(state)`

Obtient la couleur CSS pour l'etat.

```javascript
var color = stateUtils.getStateColor('error');
// Retourne: '#ef4444'
```

#### `canTransition(fromState, toState)`

Valide une transition d'etat.

```javascript
var valid = stateUtils.canTransition('stopped', 'starting');
// Retourne: true
```

#### `getNextStates(currentState)`

Obtient les etats suivants autorises.

```javascript
var nextStates = stateUtils.getNextStates('stopped');
// Retourne: ['starting', 'disabled', 'uninstalling']
```

#### `formatHistoryEntry(historyEntry)`

Formate l'historique pour l'affichage.

```javascript
var formatted = stateUtils.formatHistoryEntry({
  state: 'running',
  timestamp: '2026-01-05T10:30:00Z',
  reason: 'user_action'
});
// Retourne: "2026-01-05 10:30:00 - Running (User Action)"
```

#### `getTimeAgo(timestamp)`

Obtient une chaine de temps relative.

```javascript
var timeAgo = stateUtils.getTimeAgo('2026-01-05T10:30:00Z');
// Retourne: "5 minutes ago"
```

#### `getStateStatistics(components)`

Calcule la distribution des etats.

```javascript
var stats = stateUtils.getStateStatistics(components);
// Retourne: { total: 25, by_state: {...}, by_category: {...} }
```

---

## Composants UI

### StateIndicator

Affiche des badges et indicateurs d'etat.

#### `render(state, options)`

Badge d'etat standard.

```javascript
var badge = StateIndicator.render('running', {
  showIcon: true,
  showLabel: true,
  showTooltip: true
});
```

#### `renderCompact(state, options)`

Indicateur compact (icone uniquement).

```javascript
var indicator = StateIndicator.renderCompact('error', {
  customTooltip: 'Critical error occurred'
});
```

#### `renderPill(state, metadata, options)`

Pilule avec details complets.

```javascript
var pill = StateIndicator.renderPill('running', {
  timestamp: '2026-01-05T10:30:00Z'
}, {
  showDescription: true
});
```

#### `renderDot(state, options)`

Indicateur point minimal.

```javascript
var dot = StateIndicator.renderDot('running', {
  size: '0.75rem'
});
```

#### `renderStatistics(statistics, options)`

Cartes de distribution des etats.

```javascript
var stats = StateIndicator.renderStatistics({
  by_state: { running: 10, stopped: 5, error: 2 }
});
```

### StateTimeline

Visualise l'historique des etats.

#### `render(history, options)`

Chronologie verticale.

```javascript
var timeline = StateTimeline.render(historyEntries, {
  limit: 20,
  showRelativeTime: true,
  showCategory: true
});
```

#### `renderCompact(history, options)`

Chronologie compacte en ligne.

```javascript
var compact = StateTimeline.renderCompact(historyEntries, {
  limit: 5
});
```

#### `renderHorizontal(history, options)`

Chronologie horizontale.

```javascript
var horizontal = StateTimeline.renderHorizontal(historyEntries, {
  limit: 10
});
```

#### `renderTransitionDiagram(currentState, options)`

Diagramme de transition interactif.

```javascript
var diagram = StateTimeline.renderTransitionDiagram('stopped', {
  onTransitionClick: function(from, to) {
    console.log('Transition:', from, '->', to);
  }
});
```

---

## Structures de Donnees

### Definitions d'Etat

| Etat | Categorie | Description | Couleur |
|------|-----------|-------------|---------|
| available | persistent | Disponible pour installation | #6b7280 |
| installing | transient | Installation en cours | #3b82f6 |
| installed | persistent | Installe mais pas actif | #8b5cf6 |
| configuring | transient | Configuration en cours | #3b82f6 |
| configured | transient | Configuration terminee | #8b5cf6 |
| activating | transient | Activation en cours | #3b82f6 |
| active | persistent | Actif mais pas en cours d'execution | #06b6d4 |
| starting | transient | Demarrage du service | #3b82f6 |
| running | runtime | Service en cours d'execution | #10b981 |
| stopping | transient | Arret du service | #f59e0b |
| stopped | runtime | Service arrete | #6b7280 |
| error | error | Le composant a rencontre une erreur | #ef4444 |
| frozen | persistent | Composant gele (verrouille) | #06b6d4 |
| disabled | persistent | Composant desactive | #9ca3af |
| uninstalling | transient | Desinstallation en cours | #f59e0b |

### Matrice de Transition d'Etat

```
available → [installing]
installing → [installed, error]
installed → [configuring, uninstalling]
configuring → [configured, error]
configured → [activating, disabled]
activating → [active, error]
active → [starting, disabled, frozen]
starting → [running, error]
running → [stopping, error, frozen]
stopping → [stopped, error]
stopped → [starting, disabled, uninstalling]
error → [available, installed, stopped]
frozen → [active]
disabled → [active, uninstalling]
uninstalling → [available, error]
```

### Structure des Metadonnees de Composant

```json
{
  "id": "string",
  "type": "app|module|widget|service|composite",
  "name": "string",
  "packages": ["string"],
  "capabilities": ["string"],
  "dependencies": {
    "required": ["string"],
    "optional": ["string"]
  },
  "settings": {
    "key": "value"
  },
  "profiles": ["string"],
  "managed_services": ["string"],
  "state_ref": "string",
  "metadata": {
    "installed_version": "string",
    "catalog_version": "string",
    "auto_detected": boolean
  }
}
```

### Structure de la Base de Donnees d'Etat

```json
{
  "components": {
    "component-id": {
      "current_state": "string",
      "previous_state": "string",
      "state_changed_at": "ISO8601",
      "error_details": {
        "type": "string",
        "message": "string",
        "code": "string"
      },
      "history": [
        {
          "state": "string",
          "timestamp": "ISO8601",
          "reason": "string",
          "metadata": {}
        }
      ],
      "metadata": {}
    }
  },
  "version": "1.0",
  "last_updated": "ISO8601"
}
```

---

## Codes d'Erreur

### Erreurs de Gestion d'Etat

- `E_INVALID_TRANSITION` - Transition d'etat invalide
- `E_COMPONENT_NOT_FOUND` - Composant non trouve
- `E_STATE_LOCKED` - Etat du composant verrouille
- `E_VALIDATION_FAILED` - Echec de validation de l'etat

### Erreurs du Registre des Composants

- `E_COMPONENT_EXISTS` - Composant deja enregistre
- `E_INVALID_TYPE` - Type de composant invalide
- `E_DEPENDENCY_MISSING` - Dependance requise non trouvee
- `E_CIRCULAR_DEPENDENCY` - Dependance circulaire detectee

---

## Considerations de Performance

- Les transitions d'etat utilisent le verrouillage de fichier (`flock`) pour l'atomicite
- Les methodes RPC ont une logique de retry avec backoff exponentiel
- L'historique des etats est limite a 100 entrees par composant (configurable)
- Les requetes de liste de composants sont mises en cache pendant 30 secondes
- Les operations en masse utilisent Promise.all pour l'execution parallele

---

## Considerations de Securite

- Les transitions d'etat necessitent une authentification appropriee
- Les composants geles ne peuvent pas etre modifies sans privileges administrateur
- Les composants critiques du systeme ont des protections supplementaires
- Tous les changements d'etat sont journalises avec raison et horodatage

---

## Migration et Compatibilite

- Les methodes RPC existantes (`get_appstore_apps`, etc.) restent fonctionnelles
- Les methodes tenant compte de l'etat sont additives, pas des changements cassants
- Les composants sans entrees d'etat ont par defaut l'etat 'available'
- Le script de migration initialise automatiquement les etats pour les composants existants

---

## Voir Aussi

- [Documentation d'Architecture](ARCHITECTURE.md)
- [Guide de Gestion d'Etat](STATE-MANAGEMENT.md)
- [Guide du Systeme de Composants](COMPONENT-SYSTEM.md)
- [Guide Utilisateur](../user-guide/control-center.md)

---

**Version:** 1.0
**Derniere Mise a Jour:** 2026-01-05
**Mainteneur:** Equipe de Developpement SecuBox
