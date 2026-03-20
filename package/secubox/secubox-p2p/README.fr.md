[English](README.md) | Francais | [中文](README.zh.md)

# Reseau Mesh P2P SecuBox

Reseau mesh pair-a-pair distribue pour les appliances SecuBox avec sauvegarde, recuperation et federation integrees.

## Apercu

SecuBox P2P permet a plusieurs appliances SecuBox de former un reseau mesh distribue pour :

- **Decouverte de Services** : Decouverte et connexion automatiques aux noeuds SecuBox pairs
- **Synchronisation de Configuration** : Partage et synchronisation des configurations sur le mesh
- **Sauvegarde Distribuee** : Sauvegardes versionnees via integration Gitea
- **Auto-Recuperation** : Demarrage de nouvelles appliances a partir de sauvegardes existantes
- **Federation MaaS** : Mesh-as-a-Service pour infrastructure de securite distribuee

## Architecture

```
                    +-------------------+
                    |   Serveur Gitea   |
                    |  (Controle Vers.) |
                    +---------+---------+
                              |
        +---------------------+---------------------+
        |                     |                     |
   +----v----+           +----v----+           +----v----+
   | SecuBox |<--------->| SecuBox |<--------->| SecuBox |
   | Noeud A |           | Noeud B |           | Noeud C |
   | (Leader)|           | (Pair)  |           | (Pair)  |
   +---------+           +---------+           +---------+
        |                     |                     |
   WireGuard             WireGuard             WireGuard
    Tunnel                Tunnel                Tunnel
```

## Fonctionnalites

### Reseau Mesh

| Fonctionnalite | Description |
|----------------|-------------|
| **Decouverte de Pairs** | Decouverte automatique basee sur mDNS/DNS-SD |
| **VPN WireGuard** | Tunnels mesh chiffres entre noeuds |
| **LB HAProxy** | Equilibrage de charge sur les services mesh |
| **Integration DNS** | Resolution DNS compatible mesh |

### Sauvegarde et Recuperation

| Fonctionnalite | Description |
|----------------|-------------|
| **Integration Gitea** | Sauvegardes versionnees basees sur Git |
| **15 Types de Composants** | Sauvegarde complete de l'appliance |
| **Script Bootstrap** | Recuperation en une commande pour nouvelles boxes |
| **Suivi Historique** | Piste d'audit complete des changements |

### Modes de Topologie

- **Mesh Complet** : Chaque noeud se connecte a tous les autres
- **Etoile** : Hub central avec connexions en rayons
- **Anneau** : Topologie circulaire avec connexions voisines
- **Arbre** : Structure hierarchique parent-enfant

## Installation

```bash
opkg update
opkg install secubox-p2p luci-app-secubox-p2p
```

## Configuration

### Configuration UCI

```bash
# /etc/config/secubox-p2p

config p2p 'settings'
    option enabled '1'
    option node_name 'secubox-node'
    option discovery_enabled '1'
    option sync_interval '300'

config gitea 'gitea'
    option enabled '1'
    option server_url 'http://localhost:3000'
    option repo_owner 'admin'
    option repo_name 'secubox-backup'
    option access_token 'votre-token-ici'
    option auto_backup '1'
    option backup_interval '3600'
```

### Configuration Manuelle

```bash
# Activer le mesh P2P
uci set secubox-p2p.settings.enabled='1'
uci set secubox-p2p.settings.node_name='mon-secubox'
uci commit secubox-p2p

# Configurer la sauvegarde Gitea
uci set secubox-p2p.gitea.enabled='1'
uci set secubox-p2p.gitea.server_url='http://gitea.local:3000'
uci set secubox-p2p.gitea.repo_owner='admin'
uci set secubox-p2p.gitea.repo_name='secubox-backup'
uci set secubox-p2p.gitea.access_token='votre-token'
uci commit secubox-p2p

# Redemarrer le service
/etc/init.d/secubox-p2p restart
```

## Utilisation

### Ligne de Commande

```bash
# Gestion des pairs
secubox-p2p peers              # Lister les pairs connectes
secubox-p2p discover           # Decouvrir de nouveaux pairs
secubox-p2p add-peer <addr>    # Ajouter un pair manuellement

# Gestion des services
secubox-p2p services           # Lister les services locaux
secubox-p2p shared-services    # Lister les services partages sur le mesh

# Operations de synchronisation
secubox-p2p sync               # Synchroniser avec tous les pairs
```

### API RPCD

Toutes les fonctions sont disponibles via ubus :

```bash
# Operations sur les pairs
ubus call luci.secubox-p2p get_peers
ubus call luci.secubox-p2p discover '{"timeout":5}'
ubus call luci.secubox-p2p add_peer '{"address":"10.0.0.2","name":"peer1"}'

# Sauvegarde Gitea
ubus call luci.secubox-p2p push_gitea_backup '{"message":"Sauvegarde quotidienne"}'
ubus call luci.secubox-p2p pull_gitea_backup '{"commit_sha":"abc123"}'
ubus call luci.secubox-p2p list_gitea_repos
ubus call luci.secubox-p2p get_gitea_commits '{"limit":10}'

# Sauvegarde locale
ubus call luci.secubox-p2p create_local_backup '{"name":"pre-upgrade"}'
ubus call luci.secubox-p2p list_local_backups
ubus call luci.secubox-p2p restore_local_backup '{"backup_id":"20260130-120000"}'
```

## Composants de Sauvegarde

Le systeme de sauvegarde capture 15 categories de composants :

| Composant | Chemin | Description |
|-----------|--------|-------------|
| `configs` | `/etc/config/` | Fichiers de configuration UCI |
| `profiles` | `/usr/share/secubox/profiles/` | Profils de deploiement |
| `presets` | `/etc/secubox/presets/` | Presets de parametres |
| `manifests` | `/etc/secubox/manifests/` | Manifestes d'applications |
| `scripts` | `/usr/share/secubox/scripts/` | Scripts personnalises |
| `macros` | `/etc/secubox/macros/` | Macros d'automatisation |
| `workflows` | `/etc/secubox/workflows/` | Workflows CI/CD |
| `packages` | - | Liste des paquets installes |
| `services` | - | Etats des services |
| `cron` | `/etc/crontabs/` | Taches planifiees |
| `ssh` | `/etc/dropbear/` | Cles SSH et configuration |
| `certificates` | `/etc/acme/`, `/etc/ssl/` | Certificats TLS |
| `haproxy` | `/etc/haproxy/` | Configuration du load balancer |
| `dns` | `/etc/dnsmasq.d/` | Configuration DNS |
| `device` | - | Info materiel/systeme |

## Auto-Recuperation

### Bootstrap Rapide

Deployer SecuBox sur une nouvelle box OpenWrt avec une commande :

```bash
# Depuis le depot Gitea
wget -qO- http://gitea.local:3000/user/repo/raw/branch/main/bootstrap.sh | sh

# Ou avec curl
curl -sL http://gitea.local:3000/user/repo/raw/branch/main/bootstrap.sh | sh
```

### Recuperation Manuelle

```bash
# Mode interactif
secubox-restore -i

# Restauration directe
secubox-restore http://gitea.local:3000 admin secubox-backup [token]

# Restaurer depuis une branche specifique
secubox-restore -b develop http://gitea.local:3000 admin secubox-backup
```

### Options de Recuperation

```
secubox-restore [options] <server-url> <repo-owner> <repo-name> [token]

Options:
  -i, --interactive      Mode interactif avec invites
  -b, --branch <nom>     Branche Git depuis laquelle restaurer (defaut: main)
  --include-network      Restaurer aussi les configs network/wireless/firewall
  -h, --help             Afficher le message d'aide
```

## Interface Web LuCI

Accedez au Hub P2P : **SecuBox > Mesh P2P > Hub**

### Fonctionnalites du Tableau de Bord

- **Visualisation Globe** : Vue interactive de la topologie mesh
- **Indicateurs de Statut** : Statut Systeme, DNS, WireGuard, Load Balancer
- **Compteurs de Pairs** : Pairs connectes, noeuds en ligne, services partages
- **Actions Rapides** : Decouvrir, Sync Tous, Ajouter Pair, Auto Pair

### Onglet Integration Gitea

- **Configuration du Depot** : Configurer le serveur Gitea et les identifiants
- **Auto-Sauvegarde** : Activer les sauvegardes planifiees
- **Historique des Commits** : Voir l'historique des sauvegardes avec options de restauration
- **Generation de Token** : Creer des tokens d'acces avec les bonnes portees

## Securite

### Authentification

- Les tokens Gitea necessitent des portees specifiques :
  - `write:repository` - Pousser les sauvegardes
  - `read:user` - Verifier l'identite
  - `write:user` - Creer des tokens (pour la configuration auto)

### Chiffrement

- Tout le trafic mesh chiffre via WireGuard
- Communication Gitea sur HTTPS (recommande)
- Cles SSH sauvegardees de maniere securisee

### Controle d'Acces

- L'ACL RPCD controle l'acces API
- Permissions Gitea par utilisateur
- Regles de pare-feu au niveau reseau

## Depannage

### Problemes Courants

**La decouverte de pairs ne fonctionne pas :**
```bash
# Verifier mDNS/avahi
/etc/init.d/avahi-daemon status

# Verifier que le pare-feu autorise mDNS (port 5353/udp)
uci show firewall | grep mdns
```

**La sauvegarde Gitea echoue :**
```bash
# Tester la connectivite API
curl -s http://gitea:3000/api/v1/user \
  -H "Authorization: token VOTRE_TOKEN"

# Verifier les portees du token
ubus call luci.secubox-p2p get_gitea_config
```

**Le tunnel WireGuard ne s'etablit pas :**
```bash
# Verifier le statut WireGuard
wg show

# Verifier les cles des pairs
uci show wireguard
```

### Journaux

```bash
# Journaux du service P2P
logread | grep secubox-p2p

# Journaux RPCD
logread | grep rpcd
```

## Reference API

### Gestion des Pairs

| Methode | Parametres | Description |
|---------|------------|-------------|
| `get_peers` | - | Lister tous les pairs |
| `add_peer` | `address`, `name` | Ajouter un nouveau pair |
| `remove_peer` | `peer_id` | Supprimer un pair |
| `discover` | `timeout` | Decouvrir des pairs |

### Operations Gitea

| Methode | Parametres | Description |
|---------|------------|-------------|
| `get_gitea_config` | - | Obtenir les parametres Gitea |
| `set_gitea_config` | `config` | Mettre a jour les parametres |
| `create_gitea_repo` | `name`, `description`, `private` | Creer un depot |
| `list_gitea_repos` | - | Lister les depots |
| `get_gitea_commits` | `limit` | Obtenir l'historique des commits |
| `push_gitea_backup` | `message`, `components` | Pousser une sauvegarde |
| `pull_gitea_backup` | `commit_sha` | Restaurer depuis un commit |

### Sauvegarde Locale

| Methode | Parametres | Description |
|---------|------------|-------------|
| `create_local_backup` | `name`, `components` | Creer une sauvegarde |
| `list_local_backups` | - | Lister les sauvegardes |
| `restore_local_backup` | `backup_id` | Restaurer une sauvegarde |

## Contribution

1. Forker le depot
2. Creer une branche de fonctionnalite
3. Effectuer vos modifications
4. Tester sur un appareil OpenWrt
5. Soumettre une pull request

## Licence

GPL-2.0 - Voir le fichier LICENSE pour les details.

## Projets Associes

- [SecuBox Core](../secubox-core/) - Fonctionnalite principale SecuBox
- [LuCI App SecuBox](../luci-app-secubox/) - Tableau de bord principal
- [LuCI App SecuBox P2P](../luci-app-secubox-p2p/) - Interface web P2P
- [SecuBox Gitea](../luci-app-gitea/) - Gestion du conteneur Gitea
