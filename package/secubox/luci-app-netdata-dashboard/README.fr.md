# Tableau de bord LuCI Netdata

[English](README.md) | Francais | [中文](README.zh.md)

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Tableau de bord de surveillance systeme en temps reel pour OpenWrt avec une interface moderne et responsive inspiree de Netdata.

## Fonctionnalites

### Surveillance en temps reel
- **Utilisation CPU** : Visualisation en jauge avec historique sparkline
- **Memoire** : Barre empilee montrant utilise/buffers/cache/libre
- **Disque** : Utilisation par systeme de fichiers avec barres visuelles
- **Reseau** : Statistiques d'interfaces avec totaux RX/TX
- **Temperature** : Lectures des capteurs depuis les zones thermiques
- **Charge moyenne** : Affichage des charges 1/5/15 minutes

### Informations systeme
- Nom d'hote, modele, version du noyau
- Version OpenWrt et cible
- Temps de fonctionnement en jours/heures/minutes
- Coeurs CPU et frequence

### Details reseau
- Liste des interfaces avec adresses IP
- Detection de l'etat et de la vitesse du lien
- Statistiques de suivi des connexions
- Repartition du trafic par interface

### Moniteur de processus
- Comptage des processus en cours/en veille
- Liste des processus avec PID, utilisateur, commande
- Utilisation memoire par processus
- Visualisation de l'etat

### Design moderne
- Theme sombre optimise pour la surveillance
- Mise en page en grille responsive
- Jauges et sparklines animees
- Palette de couleurs inspiree de GitHub

### Alertes et journaux SecuBox
- La barre de controle s'integre avec le nouvel assistant `/usr/sbin/secubox-log`.
- Les evenements demarrer/redemarrer/arreter sont ajoutes a `/var/log/seccubox.log`.
- La carte du tableau de bord montre la fin du journal agrege et permet de capturer un instantane dmesg/logread depuis LuCI.

## Installation

### Prerequis

- OpenWrt 21.02 ou ulterieur
- Interface web LuCI

### Depuis les sources (recommande)

```bash
# Cloner dans l'environnement de build OpenWrt
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/YOUR_USERNAME/luci-app-netdata-dashboard.git

# Mettre a jour les feeds et installer
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a

# Activer dans menuconfig
make menuconfig
# Naviguer vers : LuCI > Applications > luci-app-netdata-dashboard

# Compiler le package
make package/luci-app-netdata-dashboard/compile V=s
```

### Installation manuelle

```bash
# Transferer le package vers le routeur
scp luci-app-netdata-dashboard_1.0.0-1_all.ipk root@192.168.1.1:/tmp/

# Installer sur le routeur
ssh root@192.168.1.1
opkg install /tmp/luci-app-netdata-dashboard_1.0.0-1_all.ipk

# Redemarrer les services
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Utilisation

Apres l'installation, acceder au tableau de bord a :

**Status -> Netdata Dashboard**

Le tableau de bord a quatre onglets :
1. **Temps reel** : Vue d'ensemble avec jauges et sparklines
2. **Systeme** : Informations systeme detaillees
3. **Reseau** : Statistiques des interfaces
4. **Processus** : Moniteur de processus

Les donnees se rafraichissent automatiquement toutes les 2 secondes.

## Architecture

```
+-----------------------------------------------------------+
|                    JavaScript LuCI                         |
|              (realtime.js, system.js, etc.)                |
+---------------------------+-------------------------------+
                            | ubus RPC
                            v
+-----------------------------------------------------------+
|                    Backend RPCD                            |
|               /usr/libexec/rpcd/netdata                    |
+---------------------------+-------------------------------+
                            | lit
                            v
+-----------------------------------------------------------+
|                   Linux Proc/Sys                           |
|     /proc/stat, /proc/meminfo, /sys/class/thermal          |
+-----------------------------------------------------------+
```

## Points d'API

| Methode | Description |
|---------|-------------|
| `stats` | Apercu rapide (CPU%, memoire%, charge, etc.) |
| `cpu` | Statistiques CPU detaillees et donnees par coeur |
| `memory` | Repartition memoire (total, libre, buffers, cache) |
| `disk` | Utilisation des systemes de fichiers et statistiques I/O |
| `network` | Stats d'interfaces et suivi des connexions |
| `processes` | Liste et comptage des processus |
| `sensors` | Lectures des capteurs de temperature |
| `system` | Informations systeme (hostname, noyau, uptime) |

## Personnalisation

### Modifier le taux de rafraichissement

Editer l'intervalle de poll dans les fichiers de vue :

```javascript
// Dans realtime.js
poll.add(L.bind(this.refresh, this), 2); // 2 secondes
```

### Ajouter des metriques personnalisees

Etendre le script backend RPCD a `/usr/libexec/rpcd/netdata` pour ajouter de nouvelles sources de donnees.

## Prerequis

- OpenWrt 21.02+
- LuCI (luci-base)
- rpcd avec module luci

## Dependances

- `luci-base`
- `luci-lib-jsonc`
- `rpcd`
- `rpcd-mod-luci`

## Contribuer

Les contributions sont les bienvenues ! N'hesitez pas a soumettre des issues et des pull requests.

1. Fork le repository
2. Creer votre branche de fonctionnalite (`git checkout -b feature/amazing-feature`)
3. Commiter vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence Apache License 2.0 - voir le fichier [LICENSE](LICENSE) pour les details.

## Credits

- Inspire par [Netdata](https://netdata.cloud/)
- Construit pour [OpenWrt](https://openwrt.org/)
- Developpe par [Gandalf @ CyberMind.fr](https://cybermind.fr)

## Projets lies

- [luci-app-statistics](https://github.com/openwrt/luci/tree/master/applications/luci-app-statistics) - Statistiques basees sur collectd
- [Netdata](https://github.com/netdata/netdata) - Agent Netdata complet (x86 uniquement)

---

Fait avec amour pour la communaute OpenWrt
