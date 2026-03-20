# SecuBox Wazuh Agent

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Agent de surveillance de securite Wazuh pour SecuBox. Fournit la detection et reponse aux points de terminaison (EDR), la surveillance de l'integrite des fichiers (FIM), l'analyse des logs et l'integration SIEM.

## Fonctionnalites

- **Detection des points de terminaison** : Detection des menaces en temps reel sur OpenWrt
- **Surveillance de l'integrite des fichiers** : Suivre les modifications des fichiers systeme critiques
- **Analyse des logs** : Surveiller syslog, CrowdSec, logs du pare-feu
- **Evaluation de la configuration de securite** : Verification de conformite
- **Integration CrowdSec** : Synchroniser le renseignement sur les menaces
- **Rootcheck** : Detecter les rootkits et malwares

## Demarrage rapide

```bash
# Installer l'agent Wazuh
wazuhctl install

# Configurer la connexion au manager
wazuhctl configure 192.168.1.100

# S'enregistrer aupres du manager
wazuhctl register

# Demarrer l'agent
wazuhctl start

# Verifier l'etat
wazuhctl status
```

## Reference CLI

### Installation
| Commande | Description |
|----------|-------------|
| `wazuhctl install` | Telecharger et installer l'agent Wazuh |
| `wazuhctl uninstall` | Supprimer l'agent Wazuh |
| `wazuhctl upgrade` | Mettre a jour vers la derniere version |

### Configuration
| Commande | Description |
|----------|-------------|
| `wazuhctl configure <ip>` | Configurer la connexion au manager |
| `wazuhctl register` | Enregistrer l'agent aupres du manager |
| `wazuhctl set-name <name>` | Definir le nom d'hote de l'agent |

### Controle du service
| Commande | Description |
|----------|-------------|
| `wazuhctl start` | Demarrer l'agent Wazuh |
| `wazuhctl stop` | Arreter l'agent Wazuh |
| `wazuhctl restart` | Redemarrer l'agent |
| `wazuhctl status` | Afficher l'etat de l'agent |

### Surveillance
| Commande | Description |
|----------|-------------|
| `wazuhctl info` | Afficher les informations de l'agent |
| `wazuhctl logs [n]` | Afficher les n dernieres lignes de log |
| `wazuhctl alerts [n]` | Afficher les alertes recentes |

### Integration
| Commande | Description |
|----------|-------------|
| `wazuhctl crowdsec-sync` | Synchroniser les alertes CrowdSec |
| `wazuhctl configure-fim` | Configurer les repertoires FIM |
| `wazuhctl configure-sca` | Activer les verifications SCA |

## Configuration UCI

```
config wazuh 'main'
    option enabled '1'
    option manager_ip '192.168.1.100'
    option manager_port '1514'
    option agent_name 'secubox'
    option protocol 'tcp'

config monitoring 'monitoring'
    option syslog '1'
    option crowdsec_alerts '1'
    option file_integrity '1'
    option rootcheck '1'

config fim 'fim'
    list directories '/etc'
    list directories '/usr/sbin'
    list directories '/etc/config'
    option realtime '1'
```

## Chemins surveilles

Surveillance de l'integrite des fichiers par defaut :
- `/etc` - Configuration systeme
- `/etc/config` - Configuration UCI
- `/etc/init.d` - Scripts d'initialisation
- `/usr/sbin` - Binaires systeme

## Integration CrowdSec

Wazuh surveille les logs CrowdSec pour :
- Les decisions de bannissement
- Les evenements d'alerte
- Les patterns de menaces

Synchronisation manuelle : `wazuhctl crowdsec-sync`

## Prerequis

- Wazuh Manager (serveur externe ou LXC SecuBox)
- Connectivite reseau vers le manager sur le port 1514 (TCP/UDP)
- ~35Mo de RAM pour l'agent

## Architecture

```
SecuBox (Agent)          Wazuh Manager
+---------------+        +------------------+
| wazuhctl      |        | Wazuh Server     |
| ossec.conf    |------->| OpenSearch       |
| FIM/Rootcheck |        | Dashboard        |
+---------------+        +------------------+
```

## References

- [Documentation Wazuh](https://documentation.wazuh.com/)
- [GitHub Wazuh](https://github.com/wazuh/wazuh)
- [Installation de l'agent](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/)
