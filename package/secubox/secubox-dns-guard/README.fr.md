# SecuBox DNS Guard

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Daemon de détection d'anomalies DNS assisté par IA pour les appliances de sécurité SecuBox OpenWrt.

## Fonctionnalités

### Algorithmes de détection d'anomalies

| Détecteur | Description |
|-----------|-------------|
| **Détection DGA** | Identifie les patterns d'algorithmes de génération de domaines (DGA) en utilisant l'analyse d'entropie de Shannon |
| **Tunneling DNS** | Détecte l'exfiltration de données via DNS en utilisant la longueur des sous-domaines et les patterns d'encodage |
| **Anomalie de débit** | Signale les clients avec des taux de requêtes inhabituels ou des comptages de domaines uniques |
| **Malveillants connus** | Compare les domaines avec des listes de blocage de renseignements sur les menaces |
| **Anomalie TLD** | Identifie les TLD suspects et les attaques par homographe punycode/IDN |

### Analyse assistée par IA

- Intégration LocalAI pour une évaluation intelligente des menaces
- Classification automatique de la sévérité (Critique/Haute/Moyenne/Basse)
- Classification des domaines (BLOCK/MONITOR/SAFE)
- Analyse des patterns et identification des familles de malwares
- Explications des menaces en langage naturel

### Workflow d'approbation

- Mode application automatique pour les détections de confiance (style mitmproxy)
- Mode file d'attente pour approbation humaine (style CrowdSec/WAF)
- Seuils de confiance par détecteur
- Piste d'audit détaillée des domaines bloqués

## Installation

```bash
opkg update
opkg install secubox-dns-guard
```

## Configuration

Éditez `/etc/config/dns-guard` :

```
config dns-guard 'main'
    option enabled '1'
    option interval '60'                    # Intervalle d'analyse (secondes)
    option localai_url 'http://127.0.0.1:8081'
    option localai_model 'tinyllama-1.1b-chat-v1.0.Q4_K_M'
    option auto_apply_blocks '0'            # 0=file d'attente, 1=application automatique
    option min_confidence '80'              # Confiance minimale pour bloquer
    option max_blocks_per_cycle '10'
```

### Configuration des détecteurs

Chaque détecteur peut être activé/désactivé individuellement avec des seuils personnalisés :

```
config detector 'dga'
    option enabled '1'
    option entropy_threshold '3.2'         # Seuil d'entropie de Shannon
    option min_length '12'                 # Longueur minimale du domaine

config detector 'tunneling'
    option enabled '1'
    option max_subdomain_length '63'
    option txt_rate_limit '10'             # Requêtes TXT/minute

config detector 'rate_anomaly'
    option enabled '1'
    option queries_per_minute '100'
    option unique_domains_per_minute '50'
```

## Utilisation CLI

```bash
# Gestion du service
/etc/init.d/dns-guard start
/etc/init.d/dns-guard stop
/etc/init.d/dns-guard status

# Commandes manuelles
dns-guard status              # Afficher le statut de l'agent
dns-guard run                 # Exécuter un cycle d'analyse unique
dns-guard analyze             # Analyser sans bloquer
dns-guard check <domain>      # Vérifier un domaine spécifique

# Statistiques
dns-guard stats               # Statistiques de requêtes
dns-guard top-domains         # Domaines les plus requêtés
dns-guard top-clients         # Clients DNS principaux

# Gestion des blocages
dns-guard list-pending        # Afficher les blocages en attente
dns-guard approve <id>        # Approuver un blocage en attente
dns-guard reject <id>         # Rejeter un blocage en attente
dns-guard approve-all         # Approuver tous les blocages en attente
dns-guard show-blocklist      # Afficher la liste de blocage active
```

## Exemple de sortie

### Vérification de domaine
```
$ dns-guard check k8s7g2x9m4p1n3v6.badsite.xyz

=== Vérification du domaine : k8s7g2x9m4p1n3v6.badsite.xyz ===

Détection DGA :
  Sous-domaine : k8s7g2x9m4p1n3v6 (longueur : 16)
  Entropie : 3.58
  Résultat : SUSPECT
  {"domain":"k8s7g2x9m4p1n3v6.badsite.xyz","type":"dga","confidence":85}

Détection d'anomalie TLD :
  TLD : .xyz
  Résultat : SUSPECT
  {"domain":"k8s7g2x9m4p1n3v6.badsite.xyz","type":"tld_anomaly","confidence":50}

=== Analyse IA ===
Évaluation du risque : ÉLEVÉ
Type de menace : Communication C2 probable de malware basé sur DGA
Indicateurs :
- Sous-domaine à haute entropie (3.58) suggérant une génération algorithmique
- TLD suspect (.xyz) communément abusé par les malwares
- Pattern cohérent avec les familles DGA connues
Recommandation : BLOQUER
```

### Statut
```
$ dns-guard status

=== Statut DNS Guard ===

Activé : Oui
Intervalle : 60s
LocalAI : http://127.0.0.1:8081
Modèle : tinyllama-1.1b-chat-v1.0.Q4_K_M

Statut LocalAI : EN LIGNE

Application automatique des blocages : Non (en file d'attente)
Confiance minimale : 80%
Max blocages/cycle : 10

=== Détecteurs ===
  dga             [ACTIVÉ] (Détection d'algorithmes de génération de domaines)
  tunneling       [ACTIVÉ] (Détection de tunneling DNS et exfiltration)
  rate_anomaly    [ACTIVÉ] (Détection de taux de requêtes inhabituel)
  known_bad       [ACTIVÉ] (Détection de domaines malveillants connus)
  tld_anomaly     [ACTIVÉ] (Détection de patterns TLD inhabituels)

Blocages en attente : 3
Blocages actifs : 47
Alertes (24h) : 156

Dernière exécution : 2026-02-05T14:32:00+00:00
```

## Intégration

### dnsmasq

DNS Guard active automatiquement la journalisation des requêtes dnsmasq au démarrage :

```
logqueries=1
logfacility=/var/log/dnsmasq.log
```

Les domaines bloqués sont ajoutés à `/etc/dnsmasq.d/dns-guard-blocklist.conf`.

### AdGuard Home

Intégration optionnelle pour les utilisateurs d'AdGuard Home :

```
config target 'adguardhome_blocklist'
    option enabled '1'
    option output_path '/etc/adguardhome/filters/dns-guard.txt'
```

### Tableau de bord LuCI

Installez `luci-app-dnsguard` pour l'interface web :

```bash
opkg install luci-app-dnsguard
```

## Fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/dns-guard` | Configuration UCI |
| `/usr/bin/dns-guard` | CLI principal |
| `/usr/lib/dns-guard/` | Modules de bibliothèque |
| `/var/lib/dns-guard/` | État d'exécution (alertes, blocages en attente) |
| `/etc/dnsmasq.d/dns-guard-blocklist.conf` | Liste de blocage générée |
| `/etc/dns-guard/blocklists/` | Fichiers de listes de blocage externes |

## Renseignements sur les menaces

Ajoutez des listes de blocage externes à `/etc/dns-guard/blocklists/` :

```bash
# Télécharger les domaines URLhaus d'abuse.ch
wget -O /etc/dns-guard/blocklists/urlhaus.txt \
  https://urlhaus.abuse.ch/downloads/hostfile/

# Télécharger la liste des domaines malveillants
wget -O /etc/dns-guard/blocklists/malwaredomains.txt \
  https://mirror1.malwaredomains.com/files/justdomains
```

## Licence

Apache-2.0

## Auteur

CyberMind <contact@cybermind.fr>
