# SecuBox Threat Analyst

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Agent d'analyse de menaces et de génération de filtres autonome assisté par IA pour SecuBox.

**Version** : 1.0.0
**Auteur** : CyberMind <devel@CyberMind.fr>

## Aperçu

Threat Analyst surveille les événements de sécurité provenant de CrowdSec, mitmproxy et netifyd DPI, utilise LocalAI pour l'analyse intelligente et génère automatiquement des règles de filtrage pour :

- **mitmproxy** : Patterns de filtrage Python pour l'inspection HTTP/HTTPS
- **CrowdSec** : Scénarios et parsers personnalisés
- **WAF** : Ensembles de règles JSON pour le pare-feu applicatif web

## Fonctionnalités

- Corrélation des menaces en temps réel à travers plusieurs sources
- Reconnaissance des patterns d'attaque assistée par IA (via LocalAI)
- Génération automatique de règles pour mitmproxy/CrowdSec/WAF
- Workflow d'approbation pour les règles générées (file d'attente ou application automatique)
- Tableau de bord LuCI avec interface de chat IA
- Daemon d'analyse périodique

## Installation

```sh
opkg install secubox-threat-analyst
opkg install luci-app-threat-analyst

# Activer et démarrer le daemon
uci set threat-analyst.main.enabled=1
uci commit threat-analyst
/etc/init.d/threat-analyst enable
/etc/init.d/threat-analyst start
```

## Commandes CLI

```sh
threat-analyst status          # Afficher le statut de l'agent
threat-analyst run             # Exécuter un cycle d'analyse unique
threat-analyst daemon          # Exécuter en tant que daemon en arrière-plan
threat-analyst analyze         # Analyser les menaces (sans génération de règles)
threat-analyst generate        # Générer toutes les règles
threat-analyst gen-mitmproxy   # Générer uniquement les filtres mitmproxy
threat-analyst gen-crowdsec    # Générer uniquement le scénario CrowdSec
threat-analyst gen-waf         # Générer uniquement les règles WAF
threat-analyst list-pending    # Lister les règles en attente
threat-analyst approve <id>    # Approuver une règle en attente
threat-analyst reject <id>     # Rejeter une règle en attente
```

## Configuration

Configuration UCI : `/etc/config/threat-analyst`

```uci
config threat-analyst 'main'
    option enabled '1'
    option interval '300'           # Intervalle d'analyse (secondes)

    # AI Gateway (préféré) - gère la classification des données et la souveraineté
    option ai_gateway_url 'http://127.0.0.1:4050'
    # LocalAI (repli) - connexion directe si la passerelle est indisponible
    option localai_url 'http://127.0.0.1:8081'
    option localai_model 'tinyllama-1.1b-chat-v1.0.Q4_K_M'

    # Paramètres d'application automatique
    option auto_apply_mitmproxy '1' # Appliquer automatiquement les filtres mitmproxy
    option auto_apply_crowdsec '0'  # Mettre CrowdSec en file d'attente pour approbation
    option auto_apply_waf '0'       # Mettre WAF en file d'attente pour approbation

    option min_confidence '70'      # Confiance IA minimale pour les règles
    option max_rules_per_cycle '5'  # Max règles par cycle
```

## Intégration AI Gateway

Threat Analyst route les requêtes IA via l'AI Gateway pour la conformité à la souveraineté des données :

1. **Gateway (préféré)** : Gère la classification des données et la suppression des informations personnelles avant le routage vers les fournisseurs
2. **LocalAI (repli)** : Inférence directe sur l'appareil si la passerelle est indisponible

L'AI Gateway garantit que les données de menaces (IPs, MACs, logs) restent LOCAL_ONLY et ne quittent jamais l'appareil.

## Tableau de bord LuCI

Naviguez vers : **SecuBox > Sécurité > Threat Analyst**

Fonctionnalités :
- **Panneau de statut** : Statut du daemon, statut LocalAI, comptage des menaces
- **Chat IA** : Chat interactif avec l'IA d'analyse des menaces
- **Règles en attente** : Approuver/rejeter les règles générées
- **Tableau des menaces** : Événements de sécurité récents

## Sources de données

| Source | Type | Chemin |
|--------|------|--------|
| CrowdSec | Alertes | `cscli alerts list` |
| mitmproxy | Menaces | `/srv/mitmproxy/threats.log` |
| netifyd | DPI | `/var/run/netifyd/status.json` |

## Règles générées

### Filtres mitmproxy
Sortie : `/etc/mitmproxy/ai_filters.py`

Classe Python avec liste de blocage IP, patterns d'URL, détection de User-Agent.

### Scénarios CrowdSec
Sortie : `/etc/crowdsec/scenarios/ai-generated.yaml`

Scénarios YAML pour les patterns d'attaque détectés par l'IA.

### Règles WAF
Sortie : `/etc/mitmproxy/waf_ai_rules.json`

Ensembles de règles JSON pour injection SQL, XSS, traversée de chemin, détection de scanners.

## Dépendances

- `secubox-mcp-server` — Protocole MCP pour l'intégration IA
- `jsonfilter` — Analyse JSON
- `secubox-app-localai` — Inférence LocalAI (recommandé)
- `crowdsec` — Intégration CrowdSec (optionnel)
- `mitmproxy` — Intégration WAF (optionnel)

## Architecture

```
+-------------+  +-------------+  +-------------+
|  CrowdSec   |  |  mitmproxy  |  |   netifyd   |
+------+------+  +------+------+  +------+------+
       |                |                |
       +----------------+----------------+
                        |
                +-------v-------+
                |   Collecteur  |
                +-------+-------+
                        |
                +-------v-------+
                |    LocalAI    |
                |    Analyse    |
                +-------+-------+
                        |
       +----------------+----------------+
       |                |                |
+------v------+  +------v------+  +------v------+
|  mitmproxy  |  |  CrowdSec   |  |    WAF      |
|   filtres   |  |  scénarios  |  |   règles    |
+-------------+  +-------------+  +-------------+
```

## Licence

MIT

## Fait partie de

SecuBox AI Gateway (Couche 2) — v0.18
