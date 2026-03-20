# SecuBox Wazuh Manager

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Stack SIEM/XDR Wazuh complète dans un conteneur LXC pour SecuBox.

## Composants

| Composant | Description | Port |
|-----------|-------------|------|
| **Wazuh Manager** | Gestion des agents, analyse des logs, détection des menaces | 1514, 1515, 55000 |
| **Wazuh Indexer** | Stockage et recherche des alertes basé sur OpenSearch | 9200 |
| **Wazuh Dashboard** | Interface web pour la visualisation et la gestion | 5601 |

## Prérequis

- **RAM** : 4 Go+ recommandé (minimum 2 Go)
- **Stockage** : 20 Go+ pour les index
- **LXC** : Support des conteneurs sur OpenWrt

## Démarrage rapide

```bash
# Installer Wazuh Manager (prend 10-15 minutes)
wazuh-managerctl install

# Démarrer le conteneur
wazuh-managerctl start

# Configurer HAProxy pour l'accès externe
wazuh-managerctl configure-haproxy

# Vérifier le statut
wazuh-managerctl status
```

## Référence CLI

### Installation
| Commande | Description |
|----------|-------------|
| `wazuh-managerctl install` | Créer et configurer le conteneur LXC Wazuh |
| `wazuh-managerctl uninstall` | Supprimer le conteneur et les données |
| `wazuh-managerctl upgrade` | Mettre à jour vers la dernière version |

### Contrôle du service
| Commande | Description |
|----------|-------------|
| `wazuh-managerctl start` | Démarrer le conteneur |
| `wazuh-managerctl stop` | Arrêter le conteneur |
| `wazuh-managerctl restart` | Redémarrer le conteneur |
| `wazuh-managerctl status` | Afficher le statut |

### Configuration
| Commande | Description |
|----------|-------------|
| `wazuh-managerctl configure-haproxy` | Configurer le vhost HAProxy |
| `wazuh-managerctl configure-firewall` | Ouvrir les ports du pare-feu |

### Gestion des agents
| Commande | Description |
|----------|-------------|
| `wazuh-managerctl list-agents` | Lister les agents enregistrés |
| `wazuh-managerctl agent-info <id>` | Afficher les détails d'un agent |
| `wazuh-managerctl remove-agent <id>` | Supprimer un agent |

### API et surveillance
| Commande | Description |
|----------|-------------|
| `wazuh-managerctl api-status` | Vérifier le statut de l'API |
| `wazuh-managerctl api-token` | Générer un token API |
| `wazuh-managerctl logs [service]` | Afficher les logs |
| `wazuh-managerctl alerts [n]` | Afficher les alertes récentes |
| `wazuh-managerctl stats` | Statistiques du cluster |

### Accès shell
| Commande | Description |
|----------|-------------|
| `wazuh-managerctl shell` | Ouvrir bash dans le conteneur |
| `wazuh-managerctl exec <cmd>` | Exécuter une commande |

## Configuration UCI

```
config wazuh_manager 'main'
    option enabled '1'
    option container_name 'wazuh'
    option lxc_path '/srv/lxc'
    option data_path '/srv/wazuh'

config network 'network'
    option ip_address '192.168.255.50'
    option gateway '192.168.255.1'
    option bridge 'br-lan'

config ports 'ports'
    option manager '1514'
    option api '55000'
    option dashboard '5601'
```

## Architecture

```
                    +-------------------------------------+
                    |       Conteneur LXC Wazuh          |
                    |                                     |
  Agents ---------->|  +-------------+  +-------------+  |
  (1514/TCP)        |  |   Manager   |  |   Indexer   |  |
                    |  |   Analyse   |--|  OpenSearch |  |
  API ------------->|  +-------------+  +-------------+  |
  (55000/HTTPS)     |         |                |         |
                    |         v                v         |
  Dashboard ------->|      +-----------------------+     |
  (5601/HTTP)       |      |      Dashboard        |     |
                    |      |    Interface web      |     |
                    |      +-----------------------+     |
                    +-------------------------------------+
```

## Connexion des agents

Sur SecuBox (avec secubox-app-wazuh installé) :

```bash
# Configurer l'agent pour se connecter au manager
wazuhctl configure 192.168.255.50

# Enregistrer l'agent
wazuhctl register

# Démarrer l'agent
wazuhctl start
```

## Identifiants par défaut

| Service | Utilisateur | Mot de passe |
|---------|-------------|--------------|
| Dashboard | admin | admin |
| API | wazuh | wazuh |

**Changez les mots de passe après l'installation !**

## Intégration HAProxy

Après avoir exécuté `wazuh-managerctl configure-haproxy` :

- Dashboard : `https://wazuh.gk2.secubox.in`
- Utilise le certificat SSL wildcard
- Bypass WAF activé pour le support WebSocket

## Persistance des données

Les données sont stockées en dehors du conteneur :

| Chemin | Contenu |
|--------|---------|
| `/srv/wazuh/manager` | Clés des agents, règles, décodeurs |
| `/srv/wazuh/indexer` | Index des alertes |

## Intégration avec SecuBox

- **CrowdSec** : Les agents surveillent les logs CrowdSec
- **Intégrité des fichiers** : Surveillance de `/etc/config`, `/etc/init.d`
- **Pare-feu** : Analyse des logs du pare-feu
- **HAProxy** : Suivi des patterns de trafic web

## Références

- [Documentation Wazuh](https://documentation.wazuh.com/)
- [Wazuh GitHub](https://github.com/wazuh/wazuh)
- [Wazuh Docker](https://github.com/wazuh/wazuh-docker)
