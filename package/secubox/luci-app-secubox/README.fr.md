[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Hub Central SecuBox

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Tableau de bord de gestion centralisee pour la suite de securite et de gestion reseau SecuBox pour OpenWrt.

## Fonctionnalites

### Apercu du Tableau de Bord
- Surveillance de la sante du systeme en temps reel (CPU, Memoire, Disque, Reseau)
- Jauges visuelles avec indicateurs de statut codes par couleur
- Grille de statut des modules avec liens d'acces rapide
- Alertes agregees de tous les modules
- Boutons d'action rapide pour les taches courantes

### Surveillance de la Sante du Systeme
- **CPU** : Charge moyenne et pourcentage avec support multi-coeur
- **Memoire** : Utilisation RAM avec metriques total/utilise/disponible
- **Disque** : Utilisation du systeme de fichiers racine et espace disponible
- **Reseau** : Statistiques de bande passante RX/TX en temps reel

### Actions Rapides
- Redemarrer le service RPCD
- Redemarrer le serveur web uHTTPd
- Effacer le cache systeme
- Creer une sauvegarde de configuration
- Redemarrer les services reseau
- Redemarrer le pare-feu

### Gestion des Modules
Detection automatique et surveillance du statut pour tous les modules SecuBox :

**Securite et Surveillance**
- **CrowdSec** - Intelligence collaborative sur les menaces
- **Netdata** - Surveillance systeme en temps reel
- **Netifyd** - Inspection approfondie des paquets
- **Client Guardian** - Controle d'acces reseau et portail captif
- **Auth Guardian** - Systeme d'authentification avance

**Gestion Reseau**
- **WireGuard** - VPN moderne avec codes QR
- **Modes Reseau** - Configuration de la topologie reseau
- **Gestionnaire de Bande Passante** - QoS et quotas de bande passante
- **Media Flow** - Detection et optimisation du trafic media
- **Traffic Shaper** - Gestion avancee du trafic

**Systeme et Performance**
- **System Hub** - Centre de controle unifie
- **CDN Cache** - Proxy de cache local
- **Gestionnaire d'Hotes Virtuels** - Configuration des hotes virtuels

### Integration Assistant et App Store
- Assistant de premiere execution pour verifier le mot de passe, le fuseau horaire, le stockage et le mode reseau prefere
- Assistants d'applications pilotes par manifestes (ex: Zigbee2MQTT) affiches directement dans SecuBox
- CLI `secubox-app` (installe sous `/usr/sbin/`) pour les installations/mises a jour scriptees via manifestes
- Plugins stockes sous `/usr/share/secubox/plugins/<app>/manifest.json` pour une extension facile

## Structure du Menu LuCI

Le hub SecuBox organise tous les modules dans une structure de menu hierarchique dans LuCI :

```
SecuBox
├── Tableau de Bord                (Apercu principal et sante du systeme)
├── Modules                         (Vue de gestion des modules)
├── Securite et Surveillance
│   ├── CrowdSec                   (Intelligence collaborative sur les menaces)
│   ├── Netdata                    (Surveillance systeme en temps reel)
│   ├── Netifyd                    (Inspection approfondie des paquets)
│   ├── Client Guardian            (Controle d'acces reseau et portail captif)
│   └── Auth Guardian              (Systeme d'authentification avance)
├── Gestion Reseau
│   ├── WireGuard                  (VPN moderne avec codes QR)
│   ├── Modes Reseau               (Configuration de la topologie reseau)
│   ├── Gestionnaire Bande Passante (QoS et quotas de bande passante)
│   ├── Media Flow                 (Detection et optimisation du trafic media)
│   └── Traffic Shaper             (Gestion avancee du trafic)
└── Systeme et Performance
    ├── System Hub                 (Centre de controle unifie)
    ├── CDN Cache                  (Proxy de cache local)
    └── Gestionnaire Hotes Virtuels (Configuration des hotes virtuels)
```

### Enregistrement des Menus

Le hub definit trois menus parents de categorie sous lesquels les autres modules SecuBox s'enregistrent :

- **`admin/secubox/security`** - Modules Securite et Surveillance
- **`admin/secubox/network`** - Modules Gestion Reseau
- **`admin/secubox/system`** - Modules Systeme et Performance

Chaque module apparait automatiquement dans la categorie appropriee lors de l'installation.

### Depannage des Problemes de Menu

Si les modules n'apparaissent pas dans le menu apres l'installation :

1. **Redemarrer les services :**
   ```bash
   /etc/init.d/rpcd restart
   /etc/init.d/uhttpd restart
   ```

2. **Vider le cache du navigateur :** Appuyez sur `Ctrl+Shift+R` pour forcer le rechargement

3. **Verifier que les fichiers de menu existent :**
   ```bash
   ls -la /usr/share/luci/menu.d/luci-app-*.json
   ```

4. **Verifier les permissions ACL :**
   ```bash
   ls -la /usr/share/rpcd/acl.d/luci-app-*.json
   ```

## Methodes API RPCD

Le hub fournit une API RPC complete via ubus :

- `status` - Obtenir le statut du hub et les infos systeme de base
- `modules` - Lister tous les modules SecuBox avec leur statut
- `modules_by_category` - Filtrer les modules par categorie
- `module_info` - Obtenir des infos detaillees pour un module specifique
- `get_system_health` - Metriques detaillees de sante du systeme
- `get_alerts` - Alertes agregees de tous les modules
- `get_dashboard_data` - Toutes les donnees du tableau de bord en un appel
- `quick_action` - Executer des actions rapides
- `start_module` / `stop_module` / `restart_module` - Controle des modules
- `health` - Verifications de sante du systeme
- `diagnostics` - Generer un bundle de diagnostics

## Installation

```bash
opkg update
opkg install luci-app-secubox
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Compilation

```bash
# Cloner dans le SDK OpenWrt
git clone https://github.com/youruser/luci-app-secubox.git package/luci-app-secubox
make package/luci-app-secubox/compile V=s
```

## Configuration

Editez `/etc/config/secubox` pour personnaliser les definitions de modules et les parametres.

## Structure des Fichiers

```
luci-app-secubox/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/secubox/
│   │   ├── dashboard.js      # Vue principale du tableau de bord
│   │   ├── modules.js         # Vue de gestion des modules
│   │   └── settings.js        # Vue des parametres
│   └── secubox/
│       ├── api.js             # Client API RPC
│       └── secubox.css        # Styles du tableau de bord
└── root/
    ├── etc/config/secubox     # Configuration UCI
    └── usr/
        └── share/
            ├── luci/menu.d/luci-app-secubox.json
            └── rpcd/acl.d/luci-app-secubox.json

    # Note : Le backend RPCD (luci.secubox) est fourni par le package secubox-core
```

## Licence

Apache-2.0 - Copyright (C) 2025 CyberMind.fr
