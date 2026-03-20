# Interface SecuBox Netifyd Deep Packet Inspection

[English](README.md) | Francais | [中文](README.zh.md)

Interface LuCI complete pour le moteur DPI Netifyd avec surveillance des flux en temps reel, detection d'applications et analyse reseau.

## Fonctionnalites

### Surveillance en temps reel
- **Suivi des flux en direct** : Surveiller les flux reseau actifs en temps reel via l'interface socket
- **Integration socket** : Connexion a Netifyd via TCP ou socket domaine Unix
- **Rafraichissement automatique** : Intervalles de poll configurables pour les mises a jour en direct

### Detection d'applications et de protocoles
- **Deep Packet Inspection** : Exploiter le moteur DPI de Netifyd
- **Identification d'applications** : Detecter et suivre les applications (HTTP, HTTPS, SSH, DNS, etc.)
- **Analyse de protocoles** : Identifier les protocoles reseau et analyser les patterns de trafic
- **Inspection SSL/TLS** : Extraire les informations de certificat SSL et les details de chiffrement

### Suivi des appareils
- **Decouverte reseau** : Detecter automatiquement les appareils sur le reseau
- **Analyse du trafic** : Suivre les statistiques upload/download par appareil
- **Mapping MAC/IP** : Correler les adresses MAC avec les adresses IP
- **Suivi d'activite** : Surveiller les horodatages de derniere activite des appareils

### Gestion du service
- **Demarrer/Arreter/Redemarrer** : Controle complet du service Netifyd
- **Activer/Desactiver** : Configurer le demarrage automatique au boot
- **Surveillance du statut** : Voir la sante et le temps de fonctionnement du service
- **Configuration** : Gerer les parametres Netifyd via UCI

### Analyse et rapports
- **Top applications** : Graphiques visuels des applications les plus utilisees
- **Top protocoles** : Statistiques d'utilisation des protocoles
- **Statistiques de trafic** : Total des octets, paquets et nombre de flux
- **Fonctionnalite d'export** : Exporter les flux en JSON ou CSV

## Prerequis

- OpenWrt 21.02 ou ulterieur
- LuCI (luci-base)
- Package netifyd installe
- jq (pour le traitement JSON)
- secubox-core

## Installation

### Via le SecuBox App Store
```bash
# Depuis le panneau d'administration LuCI
Naviguer vers SecuBox -> App Store -> Rechercher "Netifyd"
Cliquer sur "Installer"
```

### Installation manuelle
```bash
opkg update
opkg install luci-app-secubox-netifyd
service rpcd restart
```

## Configuration

### Configuration de base

1. Installer netifyd :
```bash
opkg install netifyd
```

2. Configurer le socket netifyd (editer `/etc/netifyd.conf`) :
```ini
[socket]
listen_path[0] = /var/run/netifyd/netifyd.sock
listen_address[0] = 127.0.0.1:7150
```

3. Demarrer netifyd :
```bash
service netifyd start
service netifyd enable
```

4. Acceder a l'interface LuCI :
```
Naviguer vers : SecuBox -> Network Intelligence
```

### Configuration avancee

Configurer via la page Parametres LuCI ou UCI :

```bash
uci set secubox-netifyd.settings.socket_address='127.0.0.1'
uci set secubox-netifyd.settings.socket_port='7150'
uci set secubox-netifyd.settings.auto_start='1'
uci set secubox-netifyd.monitoring.enable_app_detection='1'
uci set secubox-netifyd.analytics.enabled='1'
uci commit secubox-netifyd
```

## Utilisation

### Tableau de bord
- Voir le statut du service en temps reel
- Surveiller les flux actifs, appareils et applications
- Apercu rapide des statistiques
- Boutons de controle du service

### Flux en direct
- Table de flux en temps reel avec rafraichissement automatique
- IP source/destination et ports
- Detection de protocole et d'application
- Statistiques de trafic (octets, paquets, duree)
- Export des flux en JSON/CSV

### Applications
- Top applications par volume de trafic
- Nombre de flux par application
- Visualisation du pourcentage de trafic
- Liste d'applications triable

### Appareils
- Liste des appareils actifs avec adresses MAC/IP
- Statistiques upload/download par appareil
- Horodatages de derniere activite
- Suivi du trafic total

### Parametres
- Configuration du socket (TCP/Unix)
- Retention et limites des flux
- Bascules de surveillance
- Preferences d'analyse
- Configuration des alertes

## Methodes API

### Controle du service
- `get_service_status` - Obtenir le statut du service Netifyd
- `service_start` - Demarrer le service Netifyd
- `service_stop` - Arreter le service Netifyd
- `service_restart` - Redemarrer le service Netifyd
- `service_enable` - Activer le demarrage automatique
- `service_disable` - Desactiver le demarrage automatique

### Recuperation des donnees
- `get_realtime_flows` - Obtenir les donnees de flux en direct
- `get_flow_statistics` - Obtenir les statistiques de flux
- `get_top_applications` - Obtenir les principales applications
- `get_top_protocols` - Obtenir les principaux protocoles
- `get_detected_devices` - Obtenir les appareils detectes
- `get_dashboard` - Obtenir le resume du tableau de bord

### Configuration
- `get_config` - Obtenir la configuration actuelle
- `update_config` - Mettre a jour la configuration
- `get_interfaces` - Obtenir les interfaces surveillees

### Utilitaires
- `clear_cache` - Vider le cache des flux
- `export_flows` - Exporter les flux (JSON/CSV)

## Depannage

### Netifyd ne demarre pas
```bash
# Verifier l'installation de netifyd
which netifyd

# Verifier la configuration
cat /etc/netifyd.conf

# Voir les logs
logread | grep netifyd

# Redemarrer manuellement
/etc/init.d/netifyd restart
```

### Echec de connexion socket
```bash
# Tester le socket TCP
nc -z 127.0.0.1 7150

# Verifier le processus netifyd
ps | grep netifyd

# Verifier la configuration du socket
grep listen /etc/netifyd.conf
```

### Pas de donnees de flux
```bash
# Verifier si netifyd capture
netifyd -s

# Verifier les interfaces
grep interface /etc/netifyd.conf

# Verifier le fichier de dump
cat /run/netifyd/sink-request.json
```

## Considerations de performance

- **Limite de flux** : 10 000 flux par defaut (configurable)
- **Retention** : 1 heure par defaut (configurable)
- **Intervalle de poll** : 3-10 secondes (configurable)
- **Limite d'affichage** : 100 flux dans l'UI (export complet disponible)

## Notes de securite

- Le socket ecoute sur localhost par defaut
- Pas d'acces externe sans configuration explicite
- Les donnees de flux contiennent des informations reseau sensibles
- Regles de pare-feu recommandees si exposition du socket en externe

## Script de configuration du collecteur

Utilisez `/usr/bin/netifyd-collector-setup` pour activer l'exportateur de flux et installer la tache cron
qui execute `/usr/bin/netifyd-collector` chaque minute. Le script accepte :

```
/usr/bin/netifyd-collector-setup [unix|tcp] [chemin_ou_hote[:port]]
```

Exemples :

```
/usr/bin/netifyd-collector-setup unix /tmp/netifyd-flows.json
/usr/bin/netifyd-collector-setup tcp 127.0.0.1:9501
```

Chaque invocation met a jour `/etc/config/secubox-netifyd`, ecrit `/etc/netifyd.d/secubox-sink.conf`,
cree l'entree cron (`* * * * * /usr/bin/netifyd-collector`), et redemarre `netifyd`.

## Licence

MIT License - Copyright (C) 2025 CyberMind.fr

## Liens

- [Site officiel Netifyd](https://www.netify.ai/)
- [Documentation Netifyd](https://www.netify.ai/documentation/)
- [Packages OpenWrt](https://openwrt.org/packages/)
- [Projet SecuBox](https://github.com/CyberMind-FR/secubox-openwrt)

## Credits

- **Netify par eGloo** : Moteur de deep packet inspection
- **Equipe SecuBox** : Integration LuCI et design de l'interface
- **Communaute OpenWrt** : Plateforme et ecosysteme de packages
