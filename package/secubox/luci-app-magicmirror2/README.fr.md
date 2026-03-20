# MagicMirror2 Manager pour SecuBox

[English](README.md) | Francais | [中文](README.zh.md)

Ecosysteme complet pour executer et gerer MagicMirror2 sur les systemes SecuBox bases sur OpenWrt.

## Vue d'ensemble

Ce package fournit une implementation complete de MagicMirror2 incluant :
- **MagicMirror2 base sur Docker** : installation et gestion
- **Interface Web LuCI** pour la gestion des modules et la configuration
- **Gestionnaire de modules** - Installer, mettre a jour et supprimer des modules MM2 depuis l'interface web
- **Editeur de configuration** - Editer config.js avec coloration syntaxique et exemples
- **Integration VHost** - Publier votre miroir via reverse proxy avec SSL
- **Outils CLI** - Controle en ligne de commande pour les utilisateurs avances

## Composants

### 1. secubox-app-magicmirror
Package OpenWrt fournissant l'installation MagicMirror2 basee sur Docker.

**Emplacement** : `package/secubox/secubox-app-magicmirror/`

**Fichiers** :
- `Makefile` - Definition du package
- `files/etc/config/magicmirror` - Configuration UCI
- `files/etc/init.d/magicmirror` - Script d'initialisation
- `files/usr/sbin/magicmirrorctl` - Script de controle avec gestion des modules

**Fonctionnalites** :
- Gestion automatisee des images Docker
- Montages de volumes pour config, modules et CSS
- Gestion des modules en CLI (installer/supprimer/mettre a jour)
- Gestion de la configuration (afficher/editer/sauvegarder/restaurer)

### 2. luci-app-magicmirror
Application web LuCI pour gerer les modules et la configuration MagicMirror2.

**Emplacement** : `package/secubox/luci-app-magicmirror/`

**Vues** :
- **Vue d'ensemble** (`overview.js`) - Tableau de bord, controle du service, parametres de base
- **Modules** (`modules.js`) - Gestionnaire de modules avec installer/mettre a jour/supprimer
- **Configuration** (`config.js`) - Editeur de configuration avec validation et modeles

**Backend RPCD** : `/usr/libexec/rpcd/luci.magicmirror`
- `getStatus` - Statut du service et statistiques
- `listModules` - Lister les modules installes
- `getConfig` - Obtenir le contenu de la configuration
- `installModule` - Installer un module depuis une URL Git
- `removeModule` - Supprimer un module installe
- `updateModule` - Mettre a jour un module vers la derniere version
- `getModuleConfig` - Obtenir le README/config du module
- `saveConfig` - Sauvegarder les modifications de configuration
- `restartService` - Redemarrer le service MagicMirror

### 3. Integration Appstore

**Entree dans** : `luci-app-secubox/appstore/apps.json`
```json
{
  "id": "secubox-app-magicmirror",
  "name": "MagicMirror2",
  "version": "2.28.0",
  "category": "iot",
  "description": "Plateforme miroir intelligent...",
  "luci_app": "luci-app-magicmirror"
}
```

### 4. Modele VHost

**Emplacement** : `luci-app-vhost-manager/htdocs/luci-static/resources/vhost-manager/templates.json`

```json
{
  "id": "magicmirror",
  "domain": "mirror.local",
  "backend": "http://127.0.0.1:8080",
  "port": 8080,
  "app_id": "secubox-app-magicmirror",
  "websocket_support": true
}
```

### 5. Manifeste du plugin

**Emplacement** : `secubox-app/files/usr/share/secubox/plugins/catalog/magicmirror.json`

Definit les metadonnees du package, les prerequis, les capacites et les etapes de l'assistant.

## Installation

### Installation rapide
```bash
# Compiler tous les packages
make package/secubox-app-magicmirror/compile
make package/luci-app-magicmirror/compile

# Installer sur le routeur
opkg install secubox-app-magicmirror_*.ipk
opkg install luci-app-magicmirror_*.ipk

# Installer et demarrer
magicmirrorctl install
/etc/init.d/magicmirror enable
/etc/init.d/magicmirror start
```

### Via l'Appstore SecuBox
1. Naviguer vers **SecuBox -> Appstore**
2. Trouver **MagicMirror2** dans la categorie IoT
3. Cliquer sur **Installer**
4. Configurer via **SecuBox -> IoT -> MagicMirror2**

## Utilisation

### Interface Web

Naviguer vers : **SecuBox -> IoT -> MagicMirror2**

#### Onglet Vue d'ensemble
- Voir le statut et les statistiques du service
- Demarrer/arreter/redemarrer le service
- Configurer les parametres de base (port, fuseau horaire, langue, unites)
- Acces rapide a l'interface web du miroir

#### Onglet Modules
- Voir tous les modules installes
- Installer de nouveaux modules depuis des URLs Git
- Mettre a jour les modules vers les dernieres versions
- Supprimer des modules
- Voir les informations et le README des modules

**Installer un module** :
1. Cliquer sur **Installer un nouveau module**
2. Entrer l'URL Git (ex. `https://github.com/MichMich/MMM-WeatherChart`)
3. Cliquer sur **Installer**
4. Attendre la fin de l'installation (peut prendre quelques minutes)

#### Onglet Configuration
- Editer config.js dans l'editeur web
- Validation de la syntaxe
- Diagramme de reference des positions des modules
- Exemples de configurations
- Option de sauvegarde et redemarrage automatique

### Ligne de commande

```bash
# Gestion du service
magicmirrorctl install      # Installer et configurer
magicmirrorctl status       # Afficher le statut du conteneur
magicmirrorctl logs         # Voir les logs
magicmirrorctl update       # Mettre a jour vers la derniere image

# Gestion des modules
magicmirrorctl module list  # Lister les modules installes
magicmirrorctl module install <git-url>
magicmirrorctl module update <nom-module>
magicmirrorctl module remove <nom-module>
magicmirrorctl module config <nom-module>  # Afficher la config

# Gestion de la configuration
magicmirrorctl config show    # Afficher la config actuelle
magicmirrorctl config edit    # Editer dans vi
magicmirrorctl config backup  # Sauvegarder la config actuelle
magicmirrorctl config restore # Restaurer depuis la sauvegarde
magicmirrorctl config reset   # Reinitialiser aux valeurs par defaut
```

### Configuration VHost

1. Activer MagicMirror dans le gestionnaire VHost :
   - Aller dans **Gestionnaire VHost -> Services internes**
   - Trouver **MagicMirror2**
   - Cliquer sur **Creer**
   - Configurer le domaine (ex. `mirror.local`)
   - Activer SSL si desire

2. Acceder via le domaine :
   - `http://mirror.local` (ou votre domaine configure)
   - Network Tweaks gere automatiquement la resolution DNS

## Configuration

### Config UCI : `/etc/config/magicmirror`

```
config magicmirror 'main'
	option enabled '1'
	option image 'karsten13/magicmirror:latest'
	option config_path '/srv/magicmirror/config'
	option modules_path '/srv/magicmirror/modules'
	option css_path '/srv/magicmirror/css'
	option port '8080'
	option timezone 'UTC'
	option language 'en'
	option units 'metric'
```

### Structure config.js

Situe dans : `/srv/magicmirror/config/config.js`

```javascript
let config = {
	address: "0.0.0.0",
	port: 8080,
	language: "en",
	timeFormat: 24,
	units: "metric",

	modules: [
		{
			module: "clock",
			position: "top_left"
		},
		{
			module: "weather",
			position: "top_right",
			config: {
				weatherProvider: "openweathermap",
				type: "current",
				location: "Paris",
				apiKey: "VOTRE_CLE_API"
			}
		}
		// Ajouter plus de modules ici
	]
};
```

## Positions des modules

```
+==================================================+
|                   top_bar                        |
+==============+==============+====================+
|  top_left    |  top_center  |    top_right       |
+==============+==============+====================+
| upper_third  |middle_center |   upper_third      |
+==============+==============+====================+
| lower_third  |              |   lower_third      |
+==============+==============+====================+
| bottom_left  |bottom_center |   bottom_right     |
+==============+==============+====================+
|                  bottom_bar                      |
+==================================================+
```

## Modules populaires

- **MMM-WeatherChart** - Graphiques de previsions meteo
- **MMM-MyCalendar** - Affichage de calendrier ameliore
- **MMM-NOAA** - Donnees meteo NOAA
- **MMM-Facial-Recognition** - Reconnaissance faciale
- **MMM-Cryptocurrency** - Suivi des prix crypto
- **MMM-Todoist** - Gestionnaire de taches Todoist
- **MMM-Spotify** - En cours de lecture Spotify
- **MMM-GooglePhotos** - Diaporama Google Photos

[Parcourir tous les modules](https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules)

## Depannage

### Miroir non accessible
1. Verifier le statut du service : `magicmirrorctl status`
2. Voir les logs : `magicmirrorctl logs -f`
3. Verifier le port : `uci get magicmirror.main.port`
4. Verifier Docker : `/etc/init.d/dockerd status`

### Echec d'installation de module
1. S'assurer que git est installe : `opkg install git git-http`
2. Verifier que l'URL Git est correcte
3. Voir le log d'installation : `cat /tmp/mm-install.log`
4. Essayer l'installation manuelle : `magicmirrorctl module install <url>`

### Configuration non appliquee
1. Verifier la syntaxe de la config (doit etre du JavaScript valide)
2. Redemarrer le service : `/etc/init.d/magicmirror restart`
3. Voir les logs du conteneur : `magicmirrorctl logs`
4. Restaurer la sauvegarde si necessaire : `magicmirrorctl config restore`

### Le conteneur ne demarre pas
1. Verifier les cgroups : `ls -la /sys/fs/cgroup`
2. Verifier que Docker fonctionne : `/etc/init.d/dockerd status`
3. Verifier l'espace disque : `df -h`
4. Telecharger l'image manuellement : `docker pull karsten13/magicmirror:latest`

## Ressources

- **Site officiel** : https://magicmirror.builders/
- **Documentation** : https://docs.magicmirror.builders/
- **Modules tiers** : https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules
- **Forum communautaire** : https://forum.magicmirror.builders/
- **GitHub** : https://github.com/MichMich/MagicMirror

## Licence

Apache-2.0

## Auteur

CyberMind Studio <contact@cybermind.fr>
