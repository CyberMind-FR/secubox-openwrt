# Architecture de Securite a Trois Boucles SecuBox

> **Languages:** [English](../DOCS/THREE-LOOP-ARCHITECTURE.md) | Francais | [中文](../DOCS-zh/THREE-LOOP-ARCHITECTURE.md)

**Version:** 0.17.0 - Premiere Version Publique
**Auteur:** Gerald Kerma (Gandalf) - CyberMind.FR
**Date:** Janvier 2026

---

## Resume Executif

SecuBox implemente un **Modele de Securite a Trois Boucles** qui separe les operations de securite en trois boucles de retroaction distinctes mais interconnectees. Chaque boucle opere a une echelle de temps differente et remplit des fonctions complementaires, fournissant une defense en profondeur allant du filtrage de paquets en millisecondes a l'evolution strategique du renseignement sur les menaces.

---

## Le Modele a Trois Boucles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE DE SECURITE A TROIS BOUCLES                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     BOUCLE 3: STRATEGIQUE                           │   │
│  │            (Heures → Jours → Semaines)                              │   │
│  │                                                                     │   │
│  │   ┌──────────────────────────────────────────────────────────┐     │   │
│  │   │                 BOUCLE 2: TACTIQUE                        │     │   │
│  │   │            (Minutes → Heures)                             │     │   │
│  │   │                                                          │     │   │
│  │   │   ┌─────────────────────────────────────────────────┐   │     │   │
│  │   │   │            BOUCLE 1: OPERATIONNELLE              │   │     │   │
│  │   │   │         (Millisecondes → Secondes)               │   │     │   │
│  │   │   │                                                 │   │     │   │
│  │   │   │    DETECTER → DECIDER → REPONDRE → APPRENDRE    │   │     │   │
│  │   │   │                                                 │   │     │   │
│  │   │   └─────────────────────────────────────────────────┘   │     │   │
│  │   │                                                          │     │   │
│  │   │   CORRELER → ANALYSER → ADAPTER → AFFINER               │     │   │
│  │   │                                                          │     │   │
│  │   └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │   AGREGER → TENDANCES → PREDIRE → EVOLUER                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Boucle 1: Operationnelle (Reponse en Temps Reel)

**Echelle de temps:** Millisecondes a secondes
**Fonction:** Detection immediate des menaces et reponse automatisee
**Objectif:** Stopper les attaques avant que les dommages ne surviennent

### Implementation SecuBox

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECUBOX BOUCLE 1 — OPERATIONNELLE               │
│                                                                     │
│  ENTREE                                                             │
│     │                                                               │
│     ▼                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   nftables   │───▶│   netifyd    │───▶│  CrowdSec    │          │
│  │   fw4 rules  │    │     DPI      │    │   Bouncer    │          │
│  │   BPF/XDP    │    │  (L7 proto)  │    │  (nft sets)  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                    MOTEUR DE DECISION                   │        │
│  │  • Suivi de connexion avec etat                         │        │
│  │  • Detection d'anomalies de protocole                   │        │
│  │  • Filtrage base sur la reputation                      │        │
│  │  • Limitation de debit & plafonds de connexion          │        │
│  └────────────────────────────────────────────────────────┘        │
│         │                                                           │
│         ▼                                                           │
│  AUTORISER / BLOQUER / LIMITER / REDIRIGER                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants

| Composant | Module | Fonction |
|-----------|--------|----------|
| **nftables/fw4** | Coeur OpenWrt | Filtrage de paquets a vitesse ligne |
| **netifyd** | `luci-app-secubox-netifyd` | Identification de protocole couche 7 |
| **nDPId** | `luci-app-ndpid` | Inspection approfondie des paquets (300+ protocoles) |
| **CrowdSec Bouncer** | `luci-app-crowdsec-dashboard` | Application du blocage en temps reel |

### Metriques de Performance

| Metrique | Objectif | Statut v0.17 |
|----------|----------|--------------|
| Latence de decision paquet | < 1ms | Atteint |
| Temps de classification DPI | < 10ms | Atteint |
| Propagation mise a jour Bouncer | < 1s | Atteint |
| Empreinte memoire | < 64MB | ~45MB typique |

---

## Boucle 2: Tactique (Correlation & Adaptation)

**Echelle de temps:** Minutes a heures
**Fonction:** Correlation de motifs, analyse comportementale, affinage des regles
**Objectif:** Ameliorer la precision de detection et reduire les faux positifs

### Implementation SecuBox

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECUBOX BOUCLE 2 — TACTIQUE                     │
│                                                                     │
│  DEPUIS BOUCLE 1                                                    │
│     │                                                               │
│     ▼                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   CrowdSec   │───▶│    LAPI      │───▶│  Scenarios   │          │
│  │    Agent     │    │  (local)     │    │  & Parseurs  │          │
│  │   (logs)     │    │              │    │              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         │                   ▼                   │                   │
│         │           ┌──────────────┐            │                   │
│         │           │   Netdata    │            │                   │
│         │           │   Metriques  │            │                   │
│         │           │   & Alertes  │            │                   │
│         │           └──────────────┘            │                   │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                 MOTEUR DE CORRELATION                   │        │
│  │  • Correlation d'evenements multi-sources               │        │
│  │  • Deviation de la ligne de base comportementale        │        │
│  │  • Identification des chaines d'attaque                 │        │
│  │  • Reduction des faux positifs                          │        │
│  └────────────────────────────────────────────────────────┘        │
│         │                                                           │
│         ▼                                                           │
│  DECISIONS → Boucle 1 | ALERTES → Operateur | INTEL → Boucle 3     │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants

| Composant | Module | Fonction |
|-----------|--------|----------|
| **CrowdSec Agent** | `luci-app-crowdsec-dashboard` | Analyse des logs et generation d'evenements |
| **CrowdSec LAPI** | `luci-app-crowdsec-dashboard` | Moteur de decision local |
| **Scenarios** | Personnalises + communaute | Definitions de motifs d'attaque |
| **Netdata** | `luci-app-netdata-dashboard` | Metriques et detection d'anomalies |

### Exemples de Scenarios

| Scenario | Declencheur | Action |
|----------|-------------|--------|
| Force brute SSH | 5 echecs en 30s | Bannissement 4h |
| Scan de ports | 20 ports en 10s | Bannissement 24h |
| Scanner HTTP | Motifs connus | Bannissement 1h |
| Anomalie DPI | Incoherence de protocole | Alerte + investigation |

### Retroaction vers Boucle 1

| Sortie Tactique | Action Boucle 1 |
|-----------------|-----------------|
| Nouvelle decision de ban IP | Bouncer met a jour le set nft |
| Motif d'anomalie de protocole | Amelioration des regles DPI |
| Faux positif identifie | Regle de liste blanche/exception |
| Signature d'attaque | Mise a jour parseur/scenario |

---

## Boucle 3: Strategique (Intelligence & Evolution)

**Echelle de temps:** Heures a semaines
**Fonction:** Renseignement sur les menaces, analyse des tendances, evolution de l'architecture
**Objectif:** Anticiper les menaces et ameliorer continuellement la posture de securite

### Implementation SecuBox

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECUBOX BOUCLE 3 — STRATEGIQUE                   │
│                                                                     │
│  DEPUIS BOUCLE 2                                                    │
│     │                                                               │
│     ▼                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   CrowdSec   │───▶│   Central    │───▶│  Listes de   │          │
│  │    CAPI      │    │     API      │    │  Blocage     │          │
│  │   (upload)   │    │              │    │ Communautaire│          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         │                   ▼                   │                   │
│         │           ┌──────────────┐            │                   │
│         │           │   Hub P2P    │◀───────────┘                   │
│         │           │  (v0.18+)    │                                │
│         │           └──────────────┘                                │
│         │                   │                                       │
│         ▼                   ▼                                       │
│  ┌────────────────────────────────────────────────────────┐        │
│  │               MOTEUR DE RENSEIGNEMENT                   │        │
│  │  • Agregation du paysage mondial des menaces            │        │
│  │  • Alerte precoce sur les menaces emergentes            │        │
│  │  • Evolution du scoring de reputation                   │        │
│  │  • Recommandations d'architecture & politiques          │        │
│  └────────────────────────────────────────────────────────┘        │
│         │                                                           │
│         ▼                                                           │
│  BLOCKLISTS → Boucle 2 | POLITIQUES → Boucle 1 | EVOLUTION → Prochaine Version │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants

| Composant | Module | Fonction |
|-----------|--------|----------|
| **CrowdSec CAPI** | `luci-app-crowdsec-dashboard` | Echange de renseignements communautaires |
| **Listes de blocage** | Gerees via CAPI | Reputation IP/domaine |
| **Hub P2P** | Planifie v0.18+ | Partage decentralise de renseignements |

---

## Hub P2P: Evolution de la Boucle 3 (v0.18+)

### Vision

Le Hub P2P permettra le **partage decentralise de renseignements sur les menaces** entre les noeuds SecuBox sans dependance aux services centraux.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE HUB P2P (v0.18+)                    │
│                                                                     │
│                         ┌───────────────┐                           │
│                         │   SecuBox A   │                           │
│                         │   (did:plc)   │                           │
│                         └───────┬───────┘                           │
│                                 │                                   │
│                    ┌────────────┼────────────┐                      │
│                    │            │            │                      │
│            ┌───────▼───────┐    │    ┌───────▼───────┐              │
│            │   SecuBox B   │    │    │   SecuBox C   │              │
│            │   (did:plc)   │    │    │   (did:plc)   │              │
│            └───────┬───────┘    │    └───────┬───────┘              │
│                    │            │            │                      │
│                    └────────────┼────────────┘                      │
│                                 │                                   │
│                         ┌───────▼───────┐                           │
│                         │   SecuBox D   │                           │
│                         │   (did:plc)   │                           │
│                         └───────────────┘                           │
│                                                                     │
│  TRANSPORT: Mesh WireGuard (chiffre, authentifie)                   │
│  IDENTITE: did:plc (rotation de cles, auto-souverain)               │
│  PROTOCOLE: Partage de renseignements signes via gossip P2P        │
└─────────────────────────────────────────────────────────────────────┘
```

### Modele d'Identite did:plc

Inspire d'ATProto/Bluesky, chaque noeud SecuBox aura un identifiant decentralise:

| Couche | Fonction | Controle |
|--------|----------|----------|
| **DID** | Identifiant cryptographique permanent | Mathematique (irrevocable) |
| **Cles de rotation** | Recuperation apres compromission | Operateur humain |
| **Cles de signature** | Operations quotidiennes | Noeud SecuBox |

**Avantages:**
- L'identite du noeud survit a la compromission des cles (rotation sans perte de reputation)
- Les relations de confiance persistent a travers les mises a jour de cles
- Pas d'autorite centrale pour la gestion des identites
- Interoperable avec l'ecosysteme ATProto

### Modele de Confiance

| Niveau de Confiance | Source | Integration Boucle |
|---------------------|--------|-------------------|
| **Eleve** | Pairs directs, historique long | Boucle 1 (blocage immediat) |
| **Moyen** | Confiance transitive, signatures verifiees | Boucle 2 (entree de correlation) |
| **Faible** | Nouveaux noeuds, non verifies | Boucle 3 uniquement (revue) |

---

## Matrice d'Integration

### Etat Actuel (v0.17)

| Boucle | Composant | Module | Statut |
|--------|-----------|--------|--------|
| 1 | nftables/fw4 | Coeur OpenWrt | Complete |
| 1 | netifyd DPI | `luci-app-secubox-netifyd` | Complete |
| 1 | nDPId DPI | `luci-app-ndpid` | Complete |
| 1 | CrowdSec Bouncer | `luci-app-crowdsec-dashboard` | Complete |
| 2 | CrowdSec Agent | `luci-app-crowdsec-dashboard` | Complete |
| 2 | CrowdSec LAPI | `luci-app-crowdsec-dashboard` | Complete |
| 2 | Netdata | `luci-app-netdata-dashboard` | Complete |
| 2 | Scenarios Personnalises | `luci-app-secubox-security-threats` | Partiel |
| 3 | CrowdSec CAPI | `luci-app-crowdsec-dashboard` | Complete |
| 3 | Listes de blocage | Gerees via CAPI | Complete |
| 3 | Hub P2P | Planifie | v0.18+ |

### Feuille de Route

| Phase | Version | Focus Boucle | Statut |
|-------|---------|--------------|--------|
| Core Mesh | v0.17 | Boucles 1+2 completes | Publie |
| Service Mesh | v0.18 | Fondation P2P Boucle 3 | Prochain |
| Intelligence Mesh | v0.19 | Intelligence P2P complete | Planifie |
| AI Mesh | v0.20 | Boucle 2 amelioree par ML | Planifie |
| Certification | v1.0 | Certification ANSSI | Planifie |

---

## Resume

| Boucle | Fonction | Echelle de temps | Statut v0.17 |
|--------|----------|------------------|--------------|
| **Boucle 1** | Operationnelle (bloquer les menaces) | ms → s | Complete |
| **Boucle 2** | Tactique (correler & adapter) | min → h | Complete |
| **Boucle 3** | Strategique (intelligence & evoluer) | h → jours | CAPI uniquement |

**Boucle 1** = Reflexe → Bloquer vite, bloquer bien
**Boucle 2** = Intelligence locale → Comprendre les motifs, s'adapter
**Boucle 3** = Intelligence collective → Partager, anticiper, evoluer

---

**Ex Tenebris, Lux Securitas**

*SecuBox v0.17.0 - Premiere Version Publique*
*CyberMind.FR - Janvier 2026*
