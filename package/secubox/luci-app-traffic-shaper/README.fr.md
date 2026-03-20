# Traffic Shaper - Controle QoS avance

[English](README.md) | Francais | [中文](README.zh.md)

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Application LuCI pour la gestion avancee du traffic shaping et de la qualite de service (QoS) utilisant Linux Traffic Control (TC) et le qdisc CAKE.

## Fonctionnalites

- **Gestion des classes de trafic** : Creer et gerer les classes d'allocation de bande passante avec limites garanties (rate) et maximales (ceil)
- **Planification basee sur les priorites** : Systeme de priorite a 8 niveaux pour une priorisation fine du trafic
- **Regles de classification** : Systeme de regles flexible pour classifier le trafic par :
  - Numeros de port (source/destination)
  - Adresses IP (source/destination)
  - Marquages DSCP
  - Type de protocole
- **Statistiques en temps reel** : Surveiller les compteurs de paquets, octets et drops par classe
- **Presets rapides** : Application en un clic de configurations optimisees :
  - Gaming et faible latence
  - Streaming video
  - Teletravail
  - Equilibre (defaut)
- **Tableau de bord visuel** : Diagramme de flux de trafic avec codage couleur par priorite
- **Support multi-interfaces** : Configurer la QoS sur WAN, LAN ou toute interface reseau

## Installation

```bash
opkg update
opkg install luci-app-traffic-shaper
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependances

- `luci-base` : Framework d'interface web LuCI
- `rpcd` : Daemon RPC pour la communication backend
- `tc` : Utilitaire Linux traffic control
- `kmod-sched-core` : Modules noyau de planification du trafic
- `kmod-sched-cake` : Module noyau qdisc CAKE

## Utilisation

### Acceder a l'interface

Naviguer vers : **Reseau -> Traffic Shaper**

L'interface propose 5 vues principales :

1. **Vue d'ensemble** : Tableau de bord avec cartes de statut et visualisation du flux de trafic
2. **Classes de trafic** : Interface CRUD pour les classes de bande passante
3. **Regles de classification** : Interface CRUD pour les regles de correspondance de trafic
4. **Statistiques** : Statistiques en temps reel pour toutes les classes de trafic
5. **Presets** : Appliquer rapidement des configurations optimisees

### Creer des classes de trafic

1. Aller dans **Reseau -> Traffic Shaper -> Classes de trafic**
2. Cliquer sur **Ajouter** pour creer une nouvelle classe
3. Configurer :
   - **Nom** : Nom descriptif (ex. "Streaming video")
   - **Priorite** : 1 (la plus haute) a 8 (la plus basse)
   - **Debit garanti** : Bande passante minimum (ex. "5mbit")
   - **Debit maximum (Ceil)** : Bande passante maximale autorisee (ex. "50mbit")
   - **Interface** : Interface reseau (wan, lan, etc.)
   - **Activer** : Activer la classe
4. Cliquer sur **Sauvegarder et appliquer**

### Guide des priorites

- **Priorite 1-2** : Trafic critique (VoIP, gaming, applications temps reel)
- **Priorite 3-4** : Trafic important (streaming video, VPN)
- **Priorite 5-6** : Trafic normal (navigation web, email)
- **Priorite 7-8** : Trafic de masse (telechargements, sauvegardes)

### Creer des regles de classification

1. Aller dans **Reseau -> Traffic Shaper -> Regles de classification**
2. Cliquer sur **Ajouter** pour creer une nouvelle regle
3. Configurer :
   - **Classe de trafic** : Selectionner la classe de destination
   - **Type de correspondance** : Port, IP, DSCP ou Protocole
   - **Valeur de correspondance** : Valeur a faire correspondre
   - **Activer** : Activer la regle
4. Cliquer sur **Sauvegarder et appliquer**

### Exemples de regles

| Type de correspondance | Valeur | Description |
|------------------------|--------|-------------|
| Port destination | `80,443` | Trafic web HTTP/HTTPS |
| Port destination | `22` | Connexions SSH |
| Port destination | `53` | Requetes DNS |
| IP source | `192.168.1.0/24` | Tout le trafic du sous-reseau LAN |
| IP destination | `8.8.8.8` | Trafic vers Google DNS |
| DSCP | `EF` | Expedited Forwarding (VoIP) |
| Protocole | `udp` | Tout le trafic UDP |

### Utiliser les presets

1. Aller dans **Reseau -> Traffic Shaper -> Presets**
2. Examiner les presets disponibles et leurs configurations
3. Cliquer sur **Appliquer ce preset** sur le profil souhaite
4. Confirmer l'action (cela remplacera la configuration existante)

## Configuration

### Configuration UCI

La configuration est stockee dans `/etc/config/traffic-shaper` :

```
config class 'gaming'
	option name 'Gaming Traffic'
	option priority '1'
	option rate '10mbit'
	option ceil '50mbit'
	option interface 'wan'
	option enabled '1'

config rule 'gaming_ports'
	option class 'gaming'
	option match_type 'dport'
	option match_value '3074,27015,25565'
	option enabled '1'
```

### Options des classes de trafic

- `name` : Nom d'affichage de la classe
- `priority` : Niveau de priorite (1-8)
- `rate` : Bande passante minimum garantie (format : `<nombre>[kmg]bit`)
- `ceil` : Bande passante maximale autorisee (format : `<nombre>[kmg]bit`)
- `interface` : Nom de l'interface reseau
- `enabled` : Activer/desactiver la classe (0/1)

### Options des regles de classification

- `class` : ID de la classe de trafic (nom de section UCI)
- `match_type` : Type de correspondance (`dport`, `sport`, `dst`, `src`, `dscp`, `protocol`)
- `match_value` : Valeur a faire correspondre
- `enabled` : Activer/desactiver la regle (0/1)

## API Backend

Le backend RPCD (`luci.traffic-shaper`) fournit ces methodes :

### Methodes de statut

- `status()` : Obtenir le statut actuel du systeme QoS
- `list_classes()` : Lister toutes les classes de trafic
- `list_rules()` : Lister toutes les regles de classification
- `get_stats()` : Obtenir les statistiques par classe depuis TC

### Methodes de gestion

- `add_class(name, priority, rate, ceil, interface)` : Creer une nouvelle classe
- `update_class(id, name, priority, rate, ceil, interface, enabled)` : Mettre a jour une classe
- `delete_class(id)` : Supprimer une classe
- `add_rule(class, match_type, match_value)` : Creer une regle de classification
- `delete_rule(id)` : Supprimer une regle

### Methodes de presets

- `list_presets()` : Obtenir les presets disponibles
- `apply_preset(preset_id)` : Appliquer une configuration preset

## Details techniques

### Implementation du controle de trafic

Le module utilise Linux Traffic Control (TC) avec la hierarchie suivante :

1. **Qdisc racine** : CAKE (Common Applications Kept Enhanced)
2. **Hierarchie de classes** : HTB (Hierarchical Token Bucket) pour l'allocation de bande passante
3. **Filtres** : Filtres U32 pour la classification du trafic basee sur les regles

### Fonctionnalites CAKE

- **Smart queuing** : Gestion automatique des tailles de file d'attente
- **Isolation de flux** : Empeche les flux uniques de monopoliser la bande passante
- **Reduction de latence** : Minimise le bufferbloat
- **Equite par hote** : Assure une distribution equitable de la bande passante

### Collecte des statistiques

Les statistiques sont collectees en utilisant `tc -s class show` et parsees pour fournir :
- Compteurs de paquets par classe
- Compteurs d'octets par classe
- Compteurs de drops (paquets supprimes a cause de la limitation de debit)

Les donnees sont rafraichies toutes les 5 secondes dans la vue Statistiques.

## Exemples

### Exemple 1 : Configuration bureau a domicile

**Classes :**
- Appels video : Priorite 1, 8mbit garanti, 50mbit max
- Trafic VPN : Priorite 2, 10mbit garanti, 60mbit max
- Navigation web : Priorite 4, 5mbit garanti, 40mbit max

**Regles :**
- Ports Zoom (8801-8810) -> Appels video
- Port 443 avec plage IP VPN -> Trafic VPN
- Ports 80,443 -> Navigation web

### Exemple 2 : Gaming + Streaming

**Classes :**
- Gaming : Priorite 1, 5mbit garanti, 40mbit max
- Streaming : Priorite 3, 15mbit garanti, 70mbit max
- Telechargements : Priorite 7, 2mbit garanti, 30mbit max

**Regles :**
- Ports gaming (3074, 27015, etc.) -> Gaming
- Port 443 vers IPs Netflix/YouTube -> Streaming
- Port 80 -> Telechargements

### Exemple 3 : Foyer multi-utilisateurs

Utiliser le preset **Equilibre** ou creer des classes personnalisees :
- Haute priorite : 10mbit -> 60mbit (Priorite 2)
- Normal : 15mbit -> 80mbit (Priorite 5)
- Masse : 5mbit -> 50mbit (Priorite 7)

## Depannage

### Le traffic shaping ne fonctionne pas

1. Verifier que le module CAKE est charge :
   ```bash
   lsmod | grep sch_cake
   ```

2. Verifier la configuration TC :
   ```bash
   tc qdisc show
   tc class show dev wan
   tc filter show dev wan
   ```

3. Verifier le nom de l'interface :
   ```bash
   ip link show
   ```

### Les classes n'apparaissent pas

1. Redemarrer RPCD :
   ```bash
   /etc/init.d/rpcd restart
   ```

2. Verifier la configuration UCI :
   ```bash
   uci show traffic-shaper
   ```

3. Verifier que la classe est activee :
   ```bash
   uci get traffic-shaper.<class_id>.enabled
   ```

### Les statistiques ne se mettent pas a jour

1. Verifier les statistiques TC :
   ```bash
   tc -s class show dev wan
   ```

2. Verifier que le polling est actif (verifier la console du navigateur)

3. S'assurer que les classes sont activees et que l'interface est correcte

## Considerations de performance

- **Utilisation CPU** : Le traitement TC utilise un CPU minimal sur les routeurs modernes
- **Memoire** : Chaque classe utilise ~1-2KB de memoire noyau
- **Latence** : CAKE reduit significativement la latence pour le trafic interactif
- **Debit** : Impact minimal sur le debit total (<1% d'overhead)

## Licence

Apache License 2.0

## Mainteneur

SecuBox Project <secubox@example.com>

## Voir aussi

- [Documentation Linux TC](https://man7.org/linux/man-pages/man8/tc.8.html)
- [qdisc CAKE](https://www.bufferbloat.net/projects/codel/wiki/Cake/)
- [OpenWrt Traffic Shaping](https://openwrt.org/docs/guide-user/network/traffic-shaping/start)
- [Guide de developpement LuCI](https://github.com/openwrt/luci/wiki)
