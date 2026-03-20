[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Bandwidth Manager - QoS & Controle du Trafic

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Gestion avancee de la bande passante pour OpenWrt avec regles QoS, quotas clients et integration SQM/CAKE.

## Fonctionnalites

### Traffic Shaping QoS
- Controle du trafic base sur des regles par application, port, IP ou MAC
- Limites de telechargement/upload par regle
- Systeme de priorite a 8 niveaux (1=le plus haut, 8=le plus bas)
- Support de la planification horaire
- Activation/desactivation des regles en temps reel

### Quotas Clients
- Quotas de donnees mensuels par adresse MAC
- Suivi de l'utilisation avec compteurs iptables
- Actions configurables : limiter, bloquer ou notifier
- Reinitialisation mensuelle automatique (jour configurable)
- Surveillance des quotas en temps reel

### Integration SQM/CAKE
- Gestion intelligente des files avec qdisc CAKE
- Traffic shaping automatique de la bande passante
- Configuration NAT-aware
- Compensation de surcharge de liaison (Ethernet, PPPoE, VLAN)
- Support alternatif FQ_CoDel et HTB

### Surveillance en Temps Reel
- Utilisation de bande passante client en direct (rafraichissement auto toutes les 5s)
- Statistiques RX/TX par client
- Visualisation de la progression des quotas
- Historique d'utilisation

## Installation

```bash
opkg update
opkg install luci-app-bandwidth-manager
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependances

- **tc** : Utilitaire de controle du trafic
- **kmod-sched-core** : Planificateur de trafic kernel
- **kmod-sched-cake** : Module qdisc CAKE
- **kmod-ifb** : Peripherique Intermediate Functional Block
- **sqm-scripts** : Scripts SQM
- **iptables** : Pour le suivi du trafic
- **iptables-mod-conntrack-extra** : Extensions de suivi de connexion

## Configuration

### Configuration UCI

Editer `/etc/config/bandwidth` :

```bash
config global 'global'
	option enabled '1'
	option interface 'br-lan'
	option sqm_enabled '1'

config sqm 'sqm'
	option download_speed '100000'    # kbit/s
	option upload_speed '50000'       # kbit/s
	option qdisc 'cake'
	option nat '1'
	option overhead '22'              # Surcharge PPPoE

config rule 'rule_youtube'
	option name 'Limiter YouTube'
	option type 'application'
	option target 'youtube'
	option limit_down '5000'          # kbit/s
	option limit_up '1000'            # kbit/s
	option priority '6'
	option enabled '1'

config quota 'quota_phone'
	option mac 'AA:BB:CC:DD:EE:FF'
	option name 'iPhone Jean'
	option limit_mb '10240'           # 10 Go
	option action 'throttle'
	option reset_day '1'
	option enabled '1'
```

### Options de Configuration

#### Section Global
- `enabled` : Activer/desactiver le gestionnaire de bande passante
- `interface` : Interface reseau a gerer (defaut : br-lan)
- `sqm_enabled` : Activer SQM/CAKE

#### Section SQM
- `download_speed` : Vitesse de telechargement en kbit/s
- `upload_speed` : Vitesse d'upload en kbit/s
- `qdisc` : Discipline de file (cake, fq_codel, htb)
- `nat` : Mode NAT (1=active, 0=desactive)
- `overhead` : Surcharge de liaison en octets (0, 18, 22, 40)

#### Section Rule
- `name` : Nom de la regle
- `type` : Type de regle (application, port, ip, mac)
- `target` : Valeur cible (nom d'app, numero de port, IP ou MAC)
- `limit_down` : Limite de telechargement en kbit/s (0=illimite)
- `limit_up` : Limite d'upload en kbit/s (0=illimite)
- `priority` : Niveau de priorite (1-8)
- `schedule` : Horaire optionnel (ex. "Lun-Ven 08:00-18:00")
- `enabled` : Activer/desactiver la regle

#### Section Quota
- `mac` : Adresse MAC du client
- `name` : Nom convivial
- `limit_mb` : Limite mensuelle en Mo
- `action` : Action en cas de depassement (throttle, block, notify)
- `reset_day` : Jour du mois pour reinitialiser (1-28)
- `enabled` : Activer/desactiver le quota

## Utilisation

### Interface Web

Naviguer vers **Reseau → Bandwidth Manager** dans LuCI.

#### Onglet Vue d'ensemble
- Statut systeme (QoS actif, interface, SQM)
- Statistiques de trafic (octets et paquets RX/TX)
- Resume des regles actives
- Quotas clients avec barres de progression

#### Onglet Regles QoS
- Creer/editer/supprimer des regles de traffic shaping
- Configurer type, cible, limites et priorite
- Activer/desactiver les regles individuellement
- Definir des horaires

#### Onglet Quotas Clients
- Gerer les quotas de donnees mensuels par MAC
- Definir limites et actions
- Reinitialiser les compteurs de quota
- Voir l'utilisation actuelle

#### Onglet Utilisation Temps Reel
- Utilisation de bande passante en direct par client
- Rafraichissement auto toutes les 5 secondes
- Repartition telechargement/upload
- Progression des quotas pour les clients surveilles

#### Onglet Parametres
- Activation/desactivation globale
- Selection d'interface
- Configuration SQM/CAKE
- Parametres de suivi du trafic
- Configuration des alertes

### Ligne de Commande

#### Obtenir le Statut

```bash
ubus call luci.bandwidth-manager status
```

#### Lister les Regles QoS

```bash
ubus call luci.bandwidth-manager list_rules
```

#### Ajouter une Regle QoS

```bash
ubus call luci.bandwidth-manager add_rule '{
  "name": "Limiter Torrent",
  "type": "port",
  "target": "6881-6889",
  "limit_down": 3000,
  "limit_up": 500,
  "priority": 7
}'
```

#### Supprimer une Regle

```bash
ubus call luci.bandwidth-manager delete_rule '{
  "rule_id": "rule_1234567890"
}'
```

#### Lister les Quotas Clients

```bash
ubus call luci.bandwidth-manager list_quotas
```

#### Definir un Quota

```bash
ubus call luci.bandwidth-manager set_quota '{
  "mac": "AA:BB:CC:DD:EE:FF",
  "name": "iPhone John",
  "limit_mb": 10240,
  "action": "throttle",
  "reset_day": 1
}'
```

#### Obtenir les Details d'un Quota

```bash
ubus call luci.bandwidth-manager get_quota '{
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

#### Reinitialiser le Compteur de Quota

```bash
ubus call luci.bandwidth-manager reset_quota '{
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

#### Obtenir l'Utilisation Temps Reel

```bash
ubus call luci.bandwidth-manager get_usage_realtime
```

#### Obtenir l'Historique d'Utilisation

```bash
ubus call luci.bandwidth-manager get_usage_history '{
  "timeframe": "24h",
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

Options de timeframe : `1h`, `6h`, `24h`, `7d`, `30d`

## Reference API ubus

### status()

Obtenir le statut systeme et les statistiques globales.

**Retourne :**
```json
{
  "enabled": true,
  "interface": "br-lan",
  "sqm_enabled": true,
  "qos_active": true,
  "stats": {
    "rx_bytes": 1234567890,
    "tx_bytes": 987654321,
    "rx_packets": 1234567,
    "tx_packets": 987654
  },
  "rule_count": 5,
  "quota_count": 3
}
```

### list_rules()

Lister toutes les regles QoS.

**Retourne :**
```json
{
  "rules": [
    {
      "id": "rule_youtube",
      "name": "Limiter YouTube",
      "type": "application",
      "target": "youtube",
      "limit_down": 5000,
      "limit_up": 1000,
      "priority": 6,
      "enabled": true,
      "schedule": ""
    }
  ]
}
```

### add_rule(name, type, target, limit_down, limit_up, priority)

Ajouter une nouvelle regle QoS.

**Retourne :**
```json
{
  "success": true,
  "rule_id": "rule_1234567890",
  "message": "Regle creee avec succes"
}
```

### delete_rule(rule_id)

Supprimer une regle QoS.

**Retourne :**
```json
{
  "success": true,
  "message": "Regle supprimee avec succes"
}
```

### list_quotas()

Lister tous les quotas clients avec l'utilisation actuelle.

**Retourne :**
```json
{
  "quotas": [
    {
      "id": "quota_phone",
      "mac": "AA:BB:CC:DD:EE:FF",
      "name": "iPhone Jean",
      "limit_mb": 10240,
      "used_mb": 7850,
      "percent": 76,
      "action": "throttle",
      "reset_day": 1,
      "enabled": true
    }
  ]
}
```

### get_quota(mac)

Obtenir les informations detaillees de quota pour une MAC specifique.

**Retourne :**
```json
{
  "success": true,
  "quota_id": "quota_phone",
  "mac": "AA:BB:CC:DD:EE:FF",
  "name": "iPhone Jean",
  "limit_mb": 10240,
  "used_mb": 7850,
  "remaining_mb": 2390,
  "percent": 76,
  "action": "throttle",
  "reset_day": 1
}
```

### set_quota(mac, name, limit_mb, action, reset_day)

Creer ou mettre a jour un quota client.

**Retourne :**
```json
{
  "success": true,
  "quota_id": "quota_1234567890",
  "message": "Quota cree avec succes"
}
```

### reset_quota(mac)

Reinitialiser le compteur de quota pour un client.

**Retourne :**
```json
{
  "success": true,
  "message": "Compteur de quota reinitialise pour AA:BB:CC:DD:EE:FF"
}
```

### get_usage_realtime()

Obtenir l'utilisation de bande passante en temps reel pour tous les clients actifs.

**Retourne :**
```json
{
  "clients": [
    {
      "mac": "AA:BB:CC:DD:EE:FF",
      "ip": "192.168.1.100",
      "hostname": "iPhone",
      "rx_bytes": 1234567,
      "tx_bytes": 987654,
      "has_quota": true,
      "limit_mb": 10240,
      "used_mb": 7850
    }
  ]
}
```

### get_usage_history(timeframe, mac)

Obtenir les donnees d'historique d'utilisation.

**Parametres :**
- `timeframe` : "1h", "6h", "24h", "7d", "30d"
- `mac` : Adresse MAC (optionnel, vide pour tous les clients)

**Retourne :**
```json
{
  "history": [
    {
      "mac": "AA:BB:CC:DD:EE:FF",
      "timestamp": 1640000000,
      "rx_bytes": 1234567,
      "tx_bytes": 987654
    }
  ]
}
```

## Suivi du Trafic

Bandwidth Manager utilise iptables pour la comptabilite du trafic par client :

```bash
# Creer la chaine de suivi
iptables -N BW_TRACKING

# Ajouter des regles pour chaque MAC
iptables -A BW_TRACKING -m mac --mac-source AA:BB:CC:DD:EE:FF
iptables -A BW_TRACKING -m mac --mac-source BB:CC:DD:EE:FF:00

# Inserer dans la chaine FORWARD
iptables -I FORWARD -j BW_TRACKING

# Voir les compteurs
iptables -L BW_TRACKING -n -v -x
```

Les donnees d'utilisation sont stockees dans `/tmp/bandwidth_usage.db` au format pipe-delimited :
```
MAC|Timestamp|RX_Bytes|TX_Bytes
```

## Implementation QoS

### CAKE (Recommande)

```bash
tc qdisc add dev br-lan root cake bandwidth 100000kbit
```

Avantages :
- Gestion active des files (AQM)
- Fair queuing base sur les flux
- NAT-aware
- Faible latence

### HTB (Controle Manuel)

```bash
tc qdisc add dev br-lan root handle 1: htb default 10
tc class add dev br-lan parent 1: classid 1:1 htb rate 100mbit
tc class add dev br-lan parent 1:1 classid 1:10 htb rate 50mbit ceil 100mbit prio 5
```

## Depannage

### QoS Non Fonctionnel

Verifier si QoS est actif :
```bash
tc qdisc show dev br-lan
```

Verifier les regles iptables :
```bash
iptables -L BW_TRACKING -n -v
```

### Suivi de Quota Inexact

Reinitialiser les compteurs iptables :
```bash
iptables -Z BW_TRACKING
```

Verifier la base de donnees d'utilisation :
```bash
cat /tmp/bandwidth_usage.db
```

### Utilisation CPU Elevee

Reduire la frequence de suivi ou utiliser le flow offloading hardware si disponible :
```bash
echo 1 > /sys/class/net/br-lan/offload/tx_offload
```

## Bonnes Pratiques

1. **Definir des Limites Realistes** : Configurer les vitesses telechargement/upload a 85-95% de votre vitesse de connexion reelle
2. **Utiliser CAKE** : Preferer le qdisc CAKE pour les meilleures performances et la plus faible latence
3. **Surveiller d'Abord** : Utiliser la vue temps reel pour comprendre les patterns de trafic avant de definir des quotas
4. **Reinitialisation Reguliere** : Configurer les reinitialisations mensuelles le jour 1 pour s'aligner avec la facturation FAI
5. **Priorite Judicieuse** : Reserver la priorite 1-2 pour VoIP/gaming, utiliser 5 (normal) pour la plupart du trafic

## Considerations de Securite

- Les adresses MAC peuvent etre usurpees - utiliser avec d'autres mesures de securite
- Le suivi des quotas necessite l'acces iptables - securiser votre routeur
- Les emails d'alerte peuvent contenir des informations sensibles - utiliser des connexions chiffrees
- Les regles de traffic shaping sont visibles uniquement par l'administrateur reseau

## Licence

Apache-2.0

## Mainteneur

Projet SecuBox <support@secubox.com>

## Version

1.0.0
