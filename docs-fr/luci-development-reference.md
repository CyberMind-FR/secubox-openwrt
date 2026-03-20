# Guide de Reference pour le Developpement LuCI

> **Langues:** [English](../docs/luci-development-reference.md) | Francais | [中文](../docs-zh/luci-development-reference.md)

**Version:** 1.0.0
**Derniere mise a jour:** 2025-12-28
**Statut:** Actif
**Base sur:** implementations luci-app-secubox et luci-app-system-hub
**Public cible:** Claude.ai et developpeurs travaillant sur des applications LuCI OpenWrt

---

## Voir aussi

- **Design et Standards:** [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)
- **Commandes Rapides:** [QUICK-START.md](quick-start.md)
- **Briefing Automatisation:** [CODEX.md](codex.md)
- **Modeles de Code:** [CODE-TEMPLATES.md](code-templates.md)

Ce document capture les patterns critiques, bonnes pratiques et pieges courants decouverts lors du developpement des applications LuCI SecuBox. Utilisez-le comme reference de validation pour tout developpement futur d'applications LuCI.

---

## Table des matieres

1. [Fondamentaux ubus et RPC](#fondamentaux-ubus-et-rpc)
2. [Patterns Backend RPCD](#patterns-backend-rpcd)
3. [Patterns Module API LuCI](#patterns-module-api-luci)
4. [Patterns d'Import de Vues LuCI](#patterns-dimport-de-vues-luci)
5. [Structure des Permissions ACL](#structure-des-permissions-acl)
6. [Conventions de Structure de Donnees](#conventions-de-structure-de-donnees)
7. [Erreurs Courantes et Solutions](#erreurs-courantes-et-solutions)
8. [Checklist de Validation](#checklist-de-validation)
9. [Tests et Deploiement](#tests-et-deploiement)

---

## Fondamentaux ubus et RPC

### Qu'est-ce que ubus ?

**ubus** (architecture micro bus OpenWrt) est le systeme de communication inter-processus (IPC) d'OpenWrt. Il permet :
- RPC (Remote Procedure Call) entre processus
- Communication entre l'interface web (LuCI) et les services backend
- Interaction en ligne de commande via `ubus call`

### Convention de Nommage des Objets ubus

**REGLE CRITIQUE** : Tous les objets ubus des applications LuCI DOIVENT utiliser le prefixe `luci.`.

```javascript
// ✅ CORRECT
object: 'luci.system-hub'
object: 'luci.cdn-cache'
object: 'luci.wireguard-dashboard'

// ❌ INCORRECT
object: 'system-hub'
object: 'systemhub'
object: 'cdn-cache'
```

**Pourquoi ?** LuCI attend les objets sous l'espace de noms `luci.*` pour les applications web. Sans ce prefixe :
- Les permissions ACL ne correspondent pas
- RPCD ne route pas correctement les appels
- La console du navigateur affiche : `RPC call to system-hub/status failed with error -32000: Object not found`

### Le Nom du Script RPCD DOIT Correspondre a l'Objet ubus

Le nom du fichier script RPCD DOIT correspondre exactement au nom de l'objet ubus :

```bash
# Si JavaScript declare :
# object: 'luci.system-hub'

# Alors le script RPCD DOIT etre nomme :
/usr/libexec/rpcd/luci.system-hub

# PAS :
/usr/libexec/rpcd/system-hub
/usr/libexec/rpcd/luci-system-hub
```

**Commande de Validation** :
```bash
# Verifier les fichiers JavaScript pour les noms d'objets ubus
grep -r "object:" luci-app-*/htdocs --include="*.js"

# Verifier que le script RPCD existe avec le nom correspondant
ls luci-app-*/root/usr/libexec/rpcd/
```

### Types d'Appels ubus

**Operations de Lecture** (type GET) :
- `status` - Obtenir l'etat actuel
- `get_*` - Recuperer des donnees (ex: `get_health`, `get_settings`)
- `list_*` - Enumerer des elements (ex: `list_services`)

**Operations d'Ecriture** (type POST) :
- `save_*` - Persister la configuration (ex: `save_settings`)
- `*_action` - Effectuer des actions (ex: `service_action`)
- `backup`, `restore`, `reboot` - Modifications systeme

**Mapping ACL** :
- Operations de lecture → section `"read"` dans ACL
- Operations d'ecriture → section `"write"` dans ACL

---

## Patterns Backend RPCD

### Structure des Scripts Shell

Les backends RPCD sont des scripts shell executables qui :
1. Analysent `$1` pour l'action (`list` ou `call`)
2. Analysent `$2` pour le nom de la methode (si `call`)
3. Lisent l'entree JSON depuis stdin (pour les methodes avec parametres)
4. Produisent du JSON sur stdout
5. Se terminent avec le statut 0 en cas de succes, non-zero en cas d'erreur

### Modele Standard

```bash
#!/bin/sh
# Backend RPCD : luci.system-hub
# Version : 0.1.0

# Charger l'assistant JSON shell
. /usr/share/libubox/jshn.sh

case "$1" in
    list)
        # Lister toutes les methodes disponibles et leurs parametres
        echo '{
            "status": {},
            "get_health": {},
            "service_action": { "service": "string", "action": "string" },
            "save_settings": {
                "auto_refresh": 0,
                "health_check": 0,
                "refresh_interval": 0
            }
        }'
        ;;
    call)
        case "$2" in
            status)
                status
                ;;
            get_health)
                get_health
                ;;
            service_action)
                # Lire l'entree JSON depuis stdin
                read -r input
                json_load "$input"
                json_get_var service service
                json_get_var action action
                service_action "$service" "$action"
                ;;
            save_settings)
                read -r input
                json_load "$input"
                json_get_var auto_refresh auto_refresh
                json_get_var health_check health_check
                json_get_var refresh_interval refresh_interval
                save_settings "$auto_refresh" "$health_check" "$refresh_interval"
                ;;
            *)
                echo '{"error": "Method not found"}'
                exit 1
                ;;
        esac
        ;;
esac
```

### Sortie JSON avec jshn.sh

**jshn.sh** fournit des fonctions shell pour la manipulation JSON :

```bash
# Initialiser l'objet JSON
json_init

# Ajouter des valeurs simples
json_add_string "hostname" "openwrt"
json_add_int "uptime" 86400
json_add_boolean "running" 1

# Ajouter un objet imbrique
json_add_object "cpu"
json_add_int "usage" 25
json_add_string "status" "ok"
json_close_object

# Ajouter un tableau
json_add_array "services"
json_add_string "" "network"
json_add_string "" "firewall"
json_close_array

# Produire le JSON sur stdout
json_dump
```

**Fonctions Courantes** :
- `json_init` - Demarrer un nouvel objet JSON
- `json_add_string "key" "value"` - Ajouter une chaine
- `json_add_int "key" 123` - Ajouter un entier
- `json_add_boolean "key" 1` - Ajouter un booleen (0 ou 1)
- `json_add_object "key"` - Demarrer un objet imbrique
- `json_close_object` - Terminer l'objet imbrique
- `json_add_array "key"` - Demarrer un tableau
- `json_close_array` - Terminer le tableau
- `json_dump` - Produire le JSON sur stdout

### Gestion des Erreurs

Toujours valider les entrees et retourner des erreurs significatives :

```bash
service_action() {
    local service="$1"
    local action="$2"

    # Valider le nom du service
    if [ -z "$service" ]; then
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Service name is required"
        json_dump
        return 1
    fi

    # Valider l'action
    case "$action" in
        start|stop|restart|enable|disable)
            ;;
        *)
            json_init
            json_add_boolean "success" 0
            json_add_string "error" "Invalid action: $action"
            json_dump
            return 1
            ;;
    esac

    # Executer l'action
    /etc/init.d/"$service" "$action" >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        json_init
        json_add_boolean "success" 1
        json_add_string "message" "Service $service $action successful"
        json_dump
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Service $service $action failed"
        json_dump
        return 1
    fi
}
```

### Integration UCI

Pour la configuration persistante, utiliser UCI (Unified Configuration Interface) :

```bash
save_settings() {
    local auto_refresh="$1"
    local health_check="$2"
    local refresh_interval="$3"

    # Creer/mettre a jour la config UCI
    uci set system-hub.general=general
    uci set system-hub.general.auto_refresh="$auto_refresh"
    uci set system-hub.general.health_check="$health_check"
    uci set system-hub.general.refresh_interval="$refresh_interval"
    uci commit system-hub

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "Settings saved successfully"
    json_dump
}

get_settings() {
    # Charger la config UCI
    if [ -f "/etc/config/system-hub" ]; then
        . /lib/functions.sh
        config_load system-hub
    fi

    json_init
    json_add_object "general"

    # Obtenir la valeur ou utiliser la valeur par defaut
    config_get auto_refresh general auto_refresh "1"
    json_add_boolean "auto_refresh" "${auto_refresh:-1}"

    config_get refresh_interval general refresh_interval "30"
    json_add_int "refresh_interval" "${refresh_interval:-30}"

    json_close_object
    json_dump
}
```

### Conseils de Performance

1. **Mettre en cache les operations couteuses** : Ne pas relire les fichiers `/proc` plusieurs fois
2. **Utiliser efficacement la substitution de commande** :
   ```bash
   # Bien
   uptime=$(cat /proc/uptime | cut -d' ' -f1)

   # Mieux
   read uptime _ < /proc/uptime
   uptime=${uptime%.*}
   ```
3. **Eviter les commandes externes quand possible** :
   ```bash
   # Lent
   count=$(ls /etc/init.d | wc -l)

   # Rapide
   count=0
   for file in /etc/init.d/*; do
       [ -f "$file" ] && count=$((count + 1))
   done
   ```

---

## Patterns Module API LuCI

### CRITIQUE : Utiliser baseclass.extend()

**REGLE** : Les modules API LuCI DOIVENT utiliser le pattern `baseclass.extend()`.

```javascript
'use strict';
'require baseclass';
'require rpc';

// Declarer les methodes RPC
var callStatus = rpc.declare({
    object: 'luci.system-hub',
    method: 'status',
    expect: {}
});

var callGetHealth = rpc.declare({
    object: 'luci.system-hub',
    method: 'get_health',
    expect: {}
});

var callSaveSettings = rpc.declare({
    object: 'luci.system-hub',
    method: 'save_settings',
    params: ['auto_refresh', 'health_check', 'refresh_interval'],
    expect: {}
});

// ✅ CORRECT : Utiliser baseclass.extend()
return baseclass.extend({
    getStatus: callStatus,
    getHealth: callGetHealth,
    saveSettings: callSaveSettings
});

// ❌ INCORRECT : Ne PAS utiliser ces patterns
return baseclass.singleton({...});  // Casse tout !
return {...};  // L'objet simple ne fonctionne pas
```

**Pourquoi baseclass.extend() ?**
- Le systeme de modules LuCI attend des modules bases sur des classes
- Les vues importent avec `'require module/api as API'` qui auto-instancie
- `baseclass.extend()` cree un constructeur de classe approprié
- `baseclass.singleton()` casse le mecanisme d'instanciation
- Les objets simples ne supportent pas le cycle de vie des modules LuCI

### Parametres rpc.declare()

```javascript
var callMethodName = rpc.declare({
    object: 'luci.module-name',     // nom objet ubus (DOIT commencer par luci.)
    method: 'method_name',          // nom methode RPCD
    params: ['param1', 'param2'],   // Optionnel : noms des parametres (l'ordre compte !)
    expect: {}                      // Structure de retour attendue (ou { key: [] } pour les tableaux)
});
```

**L'Ordre des Parametres est Important** :
```javascript
// RPCD attend les parametres dans cet ordre exact
var callSaveSettings = rpc.declare({
    object: 'luci.system-hub',
    method: 'save_settings',
    params: ['auto_refresh', 'health_check', 'debug_mode', 'refresh_interval'],
    expect: {}
});

// L'appel JavaScript DOIT passer les parametres dans le meme ordre
API.saveSettings(1, 1, 0, 30);  // auto_refresh=1, health_check=1, debug_mode=0, refresh_interval=30
```

### Patterns du Parametre expect

```javascript
// La methode retourne un objet unique
expect: {}

// La methode retourne un tableau au niveau superieur
expect: { services: [] }

// La methode retourne une structure specifique
expect: {
    services: [],
    count: 0
}
```

### Gestion des Erreurs dans le Module API

Les methodes API retournent des Promises. Gerer les erreurs dans les vues :

```javascript
return API.getHealth().then(function(data) {
    if (!data || typeof data !== 'object') {
        console.error('Invalid health data:', data);
        return null;
    }
    return data;
}).catch(function(err) {
    console.error('Failed to load health data:', err);
    ui.addNotification(null, E('p', {}, 'Failed to load health data'), 'error');
    return null;
});
```

---

## Patterns d'Import de Vues LuCI

### CRITIQUE : Utiliser 'require ... as VAR' pour les APIs

**REGLE** : Lors de l'import de modules API, utiliser le pattern `'require ... as VAR'` en haut du fichier.

```javascript
// ✅ CORRECT : Auto-instancie la classe
'require system-hub/api as API';

return L.view.extend({
    load: function() {
        return API.getHealth();  // API est deja instancie
    }
});

// ❌ INCORRECT : Retourne le constructeur de classe, pas l'instance
var api = L.require('system-hub.api');
api.getHealth();  // ERREUR : api.getHealth is not a function
```

**Pourquoi ?**
- `'require module/path as VAR'` (avec des slashes) auto-instancie les classes
- `L.require('module.path')` (avec des points) retourne le constructeur de classe brut
- Les modules API etendent `baseclass`, qui necessite une instanciation
- Le chargeur de modules LuCI gere l'instanciation avec le pattern `as VAR`

### Structure de Vue Standard

```javascript
'use strict';
'require view';
'require form';
'require ui';
'require system-hub/api as API';

return L.view.extend({
    load: function() {
        // Charger les donnees necessaires au rendu
        return Promise.all([
            API.getHealth(),
            API.getStatus()
        ]);
    },

    render: function(data) {
        var health = data[0];
        var status = data[1];

        // Creer les elements UI
        var container = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'Dashboard'),
            // ... plus d'elements
        ]);

        return container;
    },

    handleSave: null,  // Desactiver le bouton sauvegarder
    handleSaveApply: null,  // Desactiver le bouton sauvegarder et appliquer
    handleReset: null  // Desactiver le bouton reinitialiser
});
```

### Resume des Patterns d'Import

```javascript
// Modules core LuCI (toujours avec des guillemets)
'require view';
'require form';
'require ui';
'require rpc';
'require baseclass';

// Modules API personnalises (utiliser 'as VAR' pour l'auto-instanciation)
'require system-hub/api as API';
'require cdn-cache/api as CdnAPI';

// Acceder a l'objet global L (pas de require)
L.resolveDefault(...)
L.Poll.add(...)
L.ui.addNotification(...)
```

---

## Structure des Permissions ACL

### Emplacement du Fichier

Les fichiers ACL sont situes dans :
```
/usr/share/rpcd/acl.d/luci-app-<nom-module>.json
```

Dans l'arborescence source :
```
luci-app-<nom-module>/root/usr/share/rpcd/acl.d/luci-app-<nom-module>.json
```

### Modele ACL Standard

```json
{
    "luci-app-module-name": {
        "description": "Module Name - Description",
        "read": {
            "ubus": {
                "luci.module-name": [
                    "status",
                    "get_system_info",
                    "get_health",
                    "list_services",
                    "get_logs",
                    "get_storage",
                    "get_settings"
                ]
            }
        },
        "write": {
            "ubus": {
                "luci.module-name": [
                    "service_action",
                    "backup_config",
                    "restore_config",
                    "reboot",
                    "save_settings"
                ]
            }
        }
    }
}
```

### Classification Lecture vs Ecriture

**Operations de Lecture** (pas de modification systeme) :
- `status` - Obtenir l'etat actuel
- `get_*` - Recuperer des donnees (info systeme, sante, parametres, logs, stockage)
- `list_*` - Enumerer des elements (services, interfaces, etc.)

**Operations d'Ecriture** (modifier l'etat systeme) :
- `*_action` - Effectuer des actions (demarrer/arreter services, etc.)
- `save_*` - Persister les changements de configuration
- `backup`, `restore` - Sauvegarde/restauration systeme
- `reboot`, `shutdown` - Controle systeme

### Erreurs ACL Courantes

**Erreur** : `Access denied` ou erreur RPC `-32002`

**Cause** : Methode non listee dans l'ACL, ou listee dans la mauvaise section (lecture vs ecriture)

**Solution** :
1. Identifier si la methode est une operation de lecture ou d'ecriture
2. Ajouter le nom de la methode a la section appropriee dans l'ACL
3. Redemarrer RPCD : `/etc/init.d/rpcd restart`

**Validation** :
```bash
# Verifier que le fichier ACL est du JSON valide
jsonlint /usr/share/rpcd/acl.d/luci-app-system-hub.json

# Lister tous les objets et methodes ubus
ubus list luci.system-hub

# Tester une methode avec ubus call
ubus call luci.system-hub get_health
```

---

## Conventions de Structure de Donnees

### Structure des Metriques de Sante (system-hub v0.1.0)

Basee sur des iterations extensives, cette structure fournit clarte et coherence :

```json
{
    "cpu": {
        "usage": 25,
        "status": "ok",
        "load_1m": "0.25",
        "load_5m": "0.30",
        "load_15m": "0.28",
        "cores": 4
    },
    "memory": {
        "total_kb": 4096000,
        "free_kb": 2048000,
        "available_kb": 3072000,
        "used_kb": 1024000,
        "buffers_kb": 512000,
        "cached_kb": 1536000,
        "usage": 25,
        "status": "ok"
    },
    "disk": {
        "total_kb": 30408704,
        "used_kb": 5447680,
        "free_kb": 24961024,
        "usage": 19,
        "status": "ok"
    },
    "temperature": {
        "value": 45,
        "status": "ok"
    },
    "network": {
        "wan_up": true,
        "status": "ok"
    },
    "services": {
        "running": 35,
        "failed": 2
    },
    "score": 92,
    "timestamp": "2025-12-26 10:30:00",
    "recommendations": [
        "2 service(s) enabled but not running. Check service status."
    ]
}
```

**Principes Cles** :
1. **Objets imbriques** pour les metriques liees (cpu, memory, disk, etc.)
2. **Structure coherente** : Chaque metrique a `usage` (pourcentage) et `status` (ok/warning/critical)
3. **Valeurs brutes + calculees** : Fournir les deux (ex: `used_kb` ET `usage` en pourcentage)
4. **Seuils de statut** : ok (< warning), warning (warning-critical), critical (>= critical)
5. **Score global** : Score de sante unique 0-100 pour le tableau de bord
6. **Recommandations dynamiques** : Tableau d'alertes actionnables basees sur les seuils

### Valeurs de Statut

Utiliser des chaines de statut coherentes pour toutes les metriques :
- `"ok"` - Fonctionnement normal (vert)
- `"warning"` - Approche du seuil (orange)
- `"critical"` - Seuil depasse (rouge)
- `"error"` - Impossible de recuperer la metrique
- `"unknown"` - Metrique non disponible

### Format d'Horodatage

Utiliser ISO 8601 ou un format local coherent :
```bash
timestamp="$(date '+%Y-%m-%d %H:%M:%S')"  # 2025-12-26 10:30:00
```

### Valeurs Booleennes en JSON

Dans les scripts shell utilisant jshn.sh :
```bash
json_add_boolean "wan_up" 1  # true
json_add_boolean "wan_up" 0  # false
```

En JavaScript :
```javascript
if (health.network.wan_up) {
    // WAN est actif
}
```

### Tableau vs Valeur Unique

**Utiliser des tableaux pour** :
- Elements multiples du meme type (services, interfaces, points de montage)
- Donnees de longueur variable

**Utiliser des valeurs uniques pour** :
- Metriques systeme globales (CPU, memoire, disque)
- Valeurs primaires/agregees (temperature globale, uptime total)

**Exemple - Stockage** :
```json
// Points de montage multiples - utiliser un tableau
"storage": [
    {
        "mount": "/",
        "total_kb": 30408704,
        "used_kb": 5447680,
        "usage": 19
    },
    {
        "mount": "/mnt/usb",
        "total_kb": 128000000,
        "used_kb": 64000000,
        "usage": 50
    }
]

// Systeme de fichiers racine seulement - utiliser un objet
"disk": {
    "total_kb": 30408704,
    "used_kb": 5447680,
    "usage": 19,
    "status": "ok"
}
```

---

## Erreurs Courantes et Solutions

### 1. Erreur RPC : "Object not found" (-32000)

**Message d'Erreur** :
```
RPC call to system-hub/status failed with error -32000: Object not found
```

**Cause** : Le nom du script RPCD ne correspond pas au nom de l'objet ubus en JavaScript

**Solution** :
1. Verifier le nom de l'objet dans JavaScript :
   ```bash
   grep -r "object:" luci-app-system-hub/htdocs --include="*.js"
   ```
   Sortie : `object: 'luci.system-hub'`

2. Renommer le script RPCD pour correspondre exactement :
   ```bash
   mv root/usr/libexec/rpcd/system-hub root/usr/libexec/rpcd/luci.system-hub
   ```

3. S'assurer que le script est executable :
   ```bash
   chmod +x root/usr/libexec/rpcd/luci.system-hub
   ```

4. Redemarrer RPCD :
   ```bash
   /etc/init.d/rpcd restart
   ```

### 2. Erreur JavaScript : "api.methodName is not a function"

**Message d'Erreur** :
```
Uncaught TypeError: api.getHealth is not a function
    at view.load (health.js:12)
```

**Cause** : Mauvais pattern d'import - import du constructeur de classe au lieu de l'instance

**Solution** :
Changer de :
```javascript
var api = L.require('system-hub.api');  // ❌ Incorrect
```

A :
```javascript
'require system-hub/api as API';  // ✅ Correct
```

**Pourquoi** : `L.require('module.path')` retourne la classe brute, `'require module/path as VAR'` auto-instancie.

### 3. Erreur RPC : "Access denied" (-32002)

**Message d'Erreur** :
```
RPC call to luci.system-hub/get_settings failed with error -32002: Access denied
```

**Cause** : Methode non listee dans le fichier ACL, ou dans la mauvaise section (lecture vs ecriture)

**Solution** :
1. Ouvrir le fichier ACL : `root/usr/share/rpcd/acl.d/luci-app-system-hub.json`

2. Ajouter la methode a la section appropriee :
   ```json
   "read": {
       "ubus": {
           "luci.system-hub": [
               "get_settings"
           ]
       }
   }
   ```

3. Deployer et redemarrer RPCD :
   ```bash
   scp luci-app-system-hub/root/usr/share/rpcd/acl.d/*.json router:/usr/share/rpcd/acl.d/
   ssh router "/etc/init.d/rpcd restart"
   ```

### 4. Erreur d'Affichage : "NaN%" ou Valeurs Indefinies

**Erreur** : Le tableau de bord affiche "NaN%", "undefined", ou des valeurs vides

**Cause** : Le frontend utilise des cles de structure de donnees incorrectes (obsoletes apres des changements backend)

**Solution** :
1. Verifier la sortie backend :
   ```bash
   ubus call luci.system-hub get_health
   ```

2. Mettre a jour le frontend pour correspondre a la structure :
   ```javascript
   // ❌ Ancienne structure
   var cpuPercent = health.load / health.cores * 100;
   var memPercent = health.memory.percent;

   // ✅ Nouvelle structure
   var cpuPercent = health.cpu ? health.cpu.usage : 0;
   var memPercent = health.memory ? health.memory.usage : 0;
   ```

3. Ajouter des verifications null/undefined :
   ```javascript
   var temp = health.temperature?.value || 0;
   var loadAvg = health.cpu?.load_1m || '0.00';
   ```

### 5. HTTP 404 : Fichier Vue Non Trouve

**Message d'Erreur** :
```
HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'
```

**Cause** : Le chemin du menu ne correspond pas a l'emplacement reel du fichier vue

**Solution** :
1. Verifier le JSON du menu :
   ```bash
   cat root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json
   ```
   Chercher : `"path": "netifyd/overview"`

2. Verifier l'emplacement reel du fichier :
   ```bash
   ls htdocs/luci-static/resources/view/
   ```
   Le fichier est a : `view/netifyd-dashboard/overview.js`

3. Corriger soit le chemin du menu SOIT l'emplacement du fichier :
   ```json
   // Option 1 : Mettre a jour le chemin du menu pour correspondre au fichier
   "path": "netifyd-dashboard/overview"

   // Option 2 : Deplacer le fichier pour correspondre au menu
   mv view/netifyd-dashboard/ view/netifyd/
   ```

### 6. Erreur de Build : "factory yields invalid constructor"

**Message d'Erreur** :
```
/luci-static/resources/system-hub/api.js: factory yields invalid constructor
```

**Cause** : Mauvais pattern utilise dans le module API (singleton, objet simple, etc.)

**Solution** :
Toujours utiliser `baseclass.extend()` :
```javascript
return baseclass.extend({
    getStatus: callStatus,
    getHealth: callGetHealth,
    // ... plus de methodes
});
```

Ne PAS utiliser :
- `baseclass.singleton({...})`
- Objet simple : `return {...}`
- `baseclass.prototype`

### 7. RPCD Ne Repond Plus Apres des Changements

**Symptome** : Les changements au script RPCD ne prennent pas effet

**Solution** :
1. Verifier que le script est deploye :
   ```bash
   ssh router "ls -la /usr/libexec/rpcd/"
   ```

2. Verifier que le script est executable :
   ```bash
   ssh router "chmod +x /usr/libexec/rpcd/luci.system-hub"
   ```

3. Redemarrer RPCD :
   ```bash
   ssh router "/etc/init.d/rpcd restart"
   ```

4. Vider le cache du navigateur (Ctrl+Shift+R)

5. Verifier les logs RPCD :
   ```bash
   ssh router "logread | grep rpcd"
   ```

---

## Checklist de Validation

Utiliser cette checklist avant le deploiement :

### Structure des Fichiers
- [ ] Le script RPCD existe : `/usr/libexec/rpcd/luci.<nom-module>`
- [ ] Le script RPCD est executable : `chmod +x`
- [ ] Le JSON du menu existe : `/usr/share/luci/menu.d/luci-app-<module>.json`
- [ ] Le JSON ACL existe : `/usr/share/rpcd/acl.d/luci-app-<module>.json`
- [ ] Le module API existe : `htdocs/luci-static/resources/<module>/api.js`
- [ ] Les vues existent : `htdocs/luci-static/resources/view/<module>/*.js`

### Conventions de Nommage
- [ ] Le nom du script RPCD correspond a l'objet ubus en JavaScript (incluant le prefixe `luci.`)
- [ ] Les chemins du menu correspondent a la structure de repertoire des fichiers vue
- [ ] Tous les objets ubus commencent par `luci.`
- [ ] La cle ACL correspond au nom du package : `"luci-app-<module>"`

### Validation du Code
- [ ] Le module API utilise le pattern `baseclass.extend()`
- [ ] Les vues importent l'API avec le pattern `'require <module>/api as API'`
- [ ] Tous les appels rpc.declare() incluent `object`, `method`, `params`, `expect` corrects
- [ ] Le script RPCD produit du JSON valide (tester avec `ubus call`)
- [ ] Le JSON du menu est valide (tester avec `jsonlint`)
- [ ] Le JSON ACL est valide (tester avec `jsonlint`)

### Permissions
- [ ] Toutes les methodes de lecture dans la section ACL `"read"`
- [ ] Toutes les methodes d'ecriture dans la section ACL `"write"`
- [ ] Les methodes dans l'ACL correspondent exactement aux noms des methodes du script RPCD

### Tests
- [ ] Executer le script de validation : `./secubox-tools/validate-modules.sh`
- [ ] Tester chaque methode via ubus : `ubus call luci.<module> <method>`
- [ ] Tester le frontend dans le navigateur (verifier la console pour les erreurs)
- [ ] Vider le cache du navigateur apres le deploiement
- [ ] Verifier le redemarrage RPCD : `/etc/init.d/rpcd restart`

### Commande de Validation Automatisee

```bash
# Executer la validation complete
./secubox-tools/validate-modules.sh

# Valider un module specifique
./secubox-tools/validate-module-generation.sh luci-app-system-hub

# Verifier la syntaxe JSON
find luci-app-system-hub -name "*.json" -exec jsonlint {} \;

# Verifier les scripts shell
shellcheck luci-app-system-hub/root/usr/libexec/rpcd/*
```

---

## Tests et Deploiement

### Tests Locaux avec ubus

Avant de deployer sur le routeur, tester le script RPCD localement :

```bash
# Copier le script RPCD vers /tmp local
cp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub /tmp/

# Rendre executable
chmod +x /tmp/luci.system-hub

# Tester l'action 'list'
/tmp/luci.system-hub list

# Tester l'action 'call' avec une methode
/tmp/luci.system-hub call status

# Tester une methode avec parametres
echo '{"service":"network","action":"restart"}' | /tmp/luci.system-hub call service_action
```

### Script de Deploiement

Utiliser un script de deploiement pour une iteration rapide :

```bash
#!/bin/bash
# deploy-system-hub.sh

ROUTER="root@192.168.8.191"

echo "Deploiement de system-hub vers $ROUTER"

# Deployer le module API
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deployer les vues
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/*.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

# Deployer le backend RPCD
scp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub \
    "$ROUTER:/usr/libexec/rpcd/"

# Deployer l'ACL
scp luci-app-system-hub/root/usr/share/rpcd/acl.d/luci-app-system-hub.json \
    "$ROUTER:/usr/share/rpcd/acl.d/"

# Definir les permissions et redemarrer
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.system-hub && /etc/init.d/rpcd restart"

echo "Deploiement termine ! Videz le cache du navigateur (Ctrl+Shift+R)"
```

### Tests Navigateur

1. Ouvrir la console du navigateur (F12)
2. Naviguer vers la page du module
3. Verifier les erreurs :
   - Erreurs RPC (object not found, method not found, access denied)
   - Erreurs JavaScript (api.method is not a function)
   - Erreurs 404 (fichiers vue non trouves)
4. Tester les fonctionnalites :
   - Le chargement des donnees s'affiche correctement
   - Les actions fonctionnent (demarrer/arreter services, sauvegarder parametres)
   - Pas de "NaN", "undefined", ou valeurs vides

### Tests ubus a Distance

Tester les methodes RPCD sur le routeur :

```bash
# Lister toutes les methodes
ssh router "ubus list luci.system-hub"

# Appeler une methode sans parametres
ssh router "ubus call luci.system-hub status"

# Appeler une methode avec parametres
ssh router "ubus call luci.system-hub service_action '{\"service\":\"network\",\"action\":\"restart\"}'"

# Formater la sortie JSON
ssh router "ubus call luci.system-hub get_health | jsonlint"
```

### Conseils de Debogage

**Activer la journalisation de debogage RPCD** :
```bash
# Editer /etc/init.d/rpcd
# Ajouter le flag -v a la commande procd_set_param
procd_set_param command "$PROG" -v

# Redemarrer RPCD
/etc/init.d/rpcd restart

# Surveiller les logs
logread -f | grep rpcd
```

**Activer la journalisation console JavaScript** :
```javascript
// Ajouter a api.js
console.log('API v0.1.0 chargee a', new Date().toISOString());

// Ajouter aux vues
console.log('Chargement des donnees de sante...');
API.getHealth().then(function(data) {
    console.log('Donnees de sante:', data);
});
```

**Tester la sortie JSON** :
```bash
# Sur le routeur
/usr/libexec/rpcd/luci.system-hub call get_health | jsonlint

# Verifier les erreurs courantes
# - Virgules manquantes
# - Virgules en fin de liste
# - Cles non quotees
# - Sequences d'echappement invalides
```

---

## Resume des Bonnes Pratiques

### A FAIRE :
- Utiliser le prefixe `luci.` pour tous les objets ubus
- Nommer les scripts RPCD pour correspondre exactement a l'objet ubus
- Utiliser `baseclass.extend()` pour les modules API
- Importer les APIs avec le pattern `'require module/api as API'`
- Ajouter des verifications null/undefined dans le frontend : `health.cpu?.usage || 0`
- Valider le JSON avec `jsonlint` avant de deployer
- Tester avec `ubus call` avant les tests navigateur
- Redemarrer RPCD apres les changements backend
- Vider le cache du navigateur apres les changements frontend
- Executer `./secubox-tools/validate-modules.sh` avant de commiter

### A NE PAS FAIRE :
- Utiliser des noms d'objets ubus sans le prefixe `luci.`
- Utiliser `baseclass.singleton()` ou des objets simples pour les modules API
- Importer les APIs avec `L.require('module.path')` (retourne la classe, pas l'instance)
- Oublier d'ajouter les methodes au fichier ACL
- Melanger les methodes lecture/ecriture dans les sections ACL
- Produire du non-JSON depuis les scripts RPCD
- Utiliser des structures de donnees incoherentes entre backend et frontend
- Deployer sans tester localement d'abord
- Supposer que les donnees existent - toujours verifier null/undefined
- Oublier de rendre les scripts RPCD executables (`chmod +x`)

---

## Historique des Versions

**v1.0** (2025-12-26)
- Guide de reference initial
- Base sur luci-app-secubox v1.0.0 et luci-app-system-hub v0.1.0
- Documentation de tous les patterns critiques et erreurs courantes
- Valide contre les defis d'implementation reels

---

## References

- **Documentation OpenWrt** : https://openwrt.org/docs/guide-developer/start
- **Documentation LuCI** : https://github.com/openwrt/luci/wiki
- **Documentation ubus** : https://openwrt.org/docs/techref/ubus
- **Documentation UCI** : https://openwrt.org/docs/guide-user/base-system/uci
- **Bibliotheque jshn.sh** : `/usr/share/libubox/jshn.sh` sur OpenWrt

---

## Contact

Pour des questions ou contributions a ce guide de reference :
- **Auteur** : CyberMind <contact@cybermind.fr>
- **Projet** : SecuBox OpenWrt
- **Depot** : https://github.com/cybermind-fr/secubox-openwrt

---

**FIN DU GUIDE DE REFERENCE**
