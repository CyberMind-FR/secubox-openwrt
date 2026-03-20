[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# System Hub - Tableau de Bord de Controle Central

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Tableau de bord central de controle et de surveillance systeme pour OpenWrt avec des capacites completes de gestion systeme.

## Fonctionnalites

### Surveillance Systeme
- Informations systeme en temps reel (hostname, modele, uptime, version du kernel)
- Metriques de sante systeme avec jauges visuelles (CPU, RAM, Disque)
- Charge CPU moyenne (1min, 5min, 15min)
- Repartition detaillee de l'utilisation memoire
- Surveillance du stockage pour tous les points de montage
- Surveillance de la temperature (zones thermiques)

### Gestion des Services
- Liste de tous les services systeme avec statut
- Demarrer/Arreter/Redemarrer les services
- Activer/Desactiver le demarrage automatique des services
- Statut en temps reel (en cours/arrete)
- Gestion par lots des services

### Journaux Systeme
- Affichage des logs systeme avec nombre de lignes configurable (50-1000 lignes)
- Filtrage des logs en temps reel
- Recherche par mot-cle
- Affichage style terminal

### Sauvegarde et Restauration
- Creation de sauvegarde de configuration systeme (tar.gz)
- Telechargement de l'archive de sauvegarde
- Restauration de configuration depuis une sauvegarde
- Fonctionnalite de redemarrage systeme

## Installation

```bash
opkg update
opkg install luci-app-system-hub
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependances

- **luci-base** : Framework LuCI
- **rpcd** : Daemon RPC
- **coreutils** : Utilitaires de base
- **coreutils-base64** : Encodage/decodage Base64

## Utilisation

### Interface Web

Naviguez vers **Systeme -> System Hub** dans LuCI.

#### Onglet Vue d'ensemble
- Cartes d'informations systeme
- Metriques de sante avec jauges visuelles :
  - Charge CPU (pourcentage base sur les coeurs)
  - Utilisation memoire (pourcentage avec details en MB)
  - Utilisation disque (pourcentage avec infos de taille)
- Details CPU (modele, coeurs, charge moyenne)
- Surveillance de la temperature (code couleur : vert < 60C, orange < 80C, rouge >= 80C)
- Details du stockage pour tous les points de montage

#### Onglet Services
- Liste de tous les services systeme
- Indicateurs de statut (en cours/arrete)
- Statut de demarrage automatique (active/desactive)
- Boutons d'action :
  - Demarrer (pour les services arretes)
  - Arreter (pour les services en cours)
  - Redemarrer (pour tous les services)
  - Activer/Desactiver le demarrage automatique

#### Onglet Journaux Systeme
- Visualiseur de logs avec controles de filtre
- Nombre de lignes configurable (50, 100, 200, 500, 1000)
- Filtrage par mot-cle
- Rafraichissement des logs a la demande
- Affichage style terminal (fond noir, texte vert)

#### Onglet Sauvegarde et Restauration
- Creer et telecharger une sauvegarde de configuration
- Uploader et restaurer un fichier de sauvegarde
- Redemarrage systeme avec confirmation

### Ligne de Commande

#### Obtenir le Statut Systeme

```bash
ubus call luci.system-hub status
```

#### Obtenir les Informations Systeme

```bash
ubus call luci.system-hub get_system_info
```

#### Obtenir la Sante Systeme

```bash
ubus call luci.system-hub get_health
```

#### Lister les Services

```bash
ubus call luci.system-hub list_services
```

#### Gerer un Service

```bash
# Demarrer un service
ubus call luci.system-hub service_action '{"service":"network","action":"start"}'

# Arreter un service
ubus call luci.system-hub service_action '{"service":"network","action":"stop"}'

# Redemarrer un service
ubus call luci.system-hub service_action '{"service":"network","action":"restart"}'
```

#### Obtenir les Logs

```bash
# Obtenir les 100 dernieres lignes
ubus call luci.system-hub get_logs '{"lines":100,"filter":""}'

# Obtenir les 500 dernieres lignes avec filtre
ubus call luci.system-hub get_logs '{"lines":500,"filter":"error"}'
```

#### Creer une Sauvegarde

```bash
ubus call luci.system-hub backup_config
```

#### Redemarrer le Systeme

```bash
ubus call luci.system-hub reboot
```

## Visualisation des Jauges

La page d'apercu affiche trois jauges circulaires :

### Jauge de Charge CPU
- Pourcentage calcule a partir de la charge moyenne sur 1 minute divisee par le nombre de coeurs
- Vert : < 75%
- Orange : 75-90%
- Rouge : > 90%

### Jauge Memoire
- Pourcentage de memoire utilisee
- Affiche "MB utilises / MB totaux"
- Code couleur comme le CPU

### Jauge Disque
- Pourcentage du systeme de fichiers racine utilise
- Affiche "Utilise / Taille totale"
- Code couleur comme le CPU

## Considerations de Securite

- Les actions sur les services necessitent des permissions d'ecriture dans l'ACL
- Les donnees de sauvegarde contiennent des configurations sensibles
- L'action de redemarrage est irreversible
- Le filtrage des logs ne nettoie pas les donnees sensibles dans les logs

## Depannage

### Les Services ne S'affichent Pas

Verifiez si les services existent :
```bash
ls /etc/init.d/
```

### Metriques de Sante Inexactes

Verifiez que les fichiers systeme sont accessibles :
```bash
cat /proc/meminfo
cat /proc/loadavg
df -h
```

### Echec de Creation de Sauvegarde

Assurez-vous que sysupgrade est disponible :
```bash
which sysupgrade
```

### Temperature Non Affichee

Verifiez les zones thermiques :
```bash
ls /sys/class/thermal/thermal_zone*/temp
```

## Licence

Apache-2.0

## Mainteneur

CyberMind <contact@cybermind.fr>
