# Prompts de Regeneration des Fonctionnalites SecuBox

> **Languages:** [English](../docs/feature-regeneration-prompts.md) | Francais | [中文](../docs-zh/feature-regeneration-prompts.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif
**Objectif :** Prompts complets pour Claude.ai afin de regenerer toutes les fonctionnalites des modules SecuBox correspondant a la demo en ligne sur secubox.cybermood.eu

---

## Voir Aussi

- **Workflow d'Implementation :** [MODULE-IMPLEMENTATION-GUIDE.md](module-implementation-guide.md)
- **Modeles de Code :** [CODE-TEMPLATES.md](code-templates.md)
- **Commandes Rapides :** [QUICK-START.md](quick-start.md)
- **Garde-fous d'Automatisation :** [CODEX.md](codex.md)

---

## Table des Matieres

1. [Reference du Systeme de Design](#reference-du-systeme-de-design)
2. [Prompts des Modules Principaux](#prompts-des-modules-principaux)
3. [Modules de Securite et Surveillance](#modules-de-securite-et-surveillance)
4. [Modules d'Intelligence Reseau](#modules-dintelligence-reseau)
5. [Modules VPN et Controle d'Acces](#modules-vpn-et-controle-dacces)
6. [Modules de Bande Passante et Trafic](#modules-de-bande-passante-et-trafic)
7. [Modules de Performance et Services](#modules-de-performance-et-services)

---

## Reference du Systeme de Design

### Palette de Couleurs et Variables
Tous les modules DOIVENT utiliser les variables CSS de `system-hub/common.css` :

**Mode Sombre (Principal) :**
```css
--sh-bg-primary: #0a0a0f;      /* Fond noir profond */
--sh-bg-secondary: #12121a;     /* Fonds de cartes */
--sh-bg-tertiary: #1a1a24;      /* Etats survol/actif */
--sh-primary: #6366f1;          /* Indigo principal */
--sh-primary-end: #8b5cf6;      /* Violet (degrades) */
--sh-success: #22c55e;          /* Vert */
--sh-danger: #ef4444;           /* Rouge */
--sh-warning: #f59e0b;          /* Orange */
--sh-text-primary: #fafafa;     /* Texte principal */
--sh-text-secondary: #a0a0b0;   /* Texte secondaire */
```

### Standards Typographiques
```css
/* Polices */
Inter: Corps de texte, labels, elements d'interface
JetBrains Mono: Nombres, identifiants, code, metriques

/* Tailles */
--sh-title-xl: 28px;    /* Titres de page */
--sh-title-lg: 20px;    /* Titres de carte */
--sh-value-xl: 40px;    /* Grandes metriques */
--sh-value-lg: 32px;    /* Apercu des statistiques */
```

### Patterns de Composants
1. **En-tete de Page** : Icone + Titre + Sous-titre + Grille de Stats
2. **Badges de Stats** : Valeurs en police monospace, largeur minimale de 130px
3. **Cartes** : Bordure superieure de 3px (degrade ou couleur unie)
4. **Boutons** : Fonds en degrade, effets d'ombre, transitions fluides
5. **Onglets de Filtre** : Degrade pour l'actif, pattern icone + label

---

## Prompts des Modules Principaux

### 1. Hub Central SecuBox (luci-app-secubox)

**Objectif du Module :** Tableau de bord principal et panneau de controle central

**Prompt pour Claude.ai :**

```
Creez un module de tableau de bord LuCI pour le Hub Central SecuBox avec ces fonctionnalites :

EXIGENCES DE DESIGN :
- Theme sombre avec fonds en degrade (#0a0a0f vers #12121a)
- En-tete de page avec icone fusee et titre "Centre de Controle SecuBox"
- Grille de statistiques affichant : Total des Modules (badge), Services Actifs, Sante du Systeme, Nombre d'Alertes
- Utiliser les variables CSS --sh-* (ne jamais coder les couleurs en dur)

FONCTIONNALITES PRINCIPALES :
1. Grille d'Apercu des Modules
   - Afficher les 15 modules SecuBox installes sous forme de cartes
   - Chaque carte : Icone du module, nom, badge de statut (actif/inactif), version
   - Bordures par couleur : vert (en cours), orange (avertissement), rouge (arrete)
   - Boutons "Configurer" et "Voir les Details" par carte
   - Onglets de filtre : Tous | Securite | Reseau | Services

2. Tableau de Bord de Sante du Systeme
   - Metriques en temps reel : CPU, RAM, Disque, Reseau
   - Barres de progression animees avec remplissage en degrade
   - Indicateurs de seuil (avertissement >80%, danger >90%)
   - Police JetBrains Mono pour toutes les valeurs numeriques

3. Panneau d'Actions Rapides
   - Bouton Redemarrer Tous les Services (degrade orange)
   - Bouton Mettre a Jour les Paquets (degrade bleu)
   - Bouton Voir les Logs Systeme (degrade indigo)
   - Bouton Exporter la Configuration (degrade vert)

4. Chronologie des Alertes
   - 10 derniers evenements systeme avec horodatages
   - Indicateurs d'icone pour les niveaux de severite
   - Details extensibles par alerte
   - Rafraichissement automatique toutes les 30 secondes

SPECIFICATIONS TECHNIQUES :
- Fichier : luci-app-secubox/htdocs/luci-static/resources/view/secubox/dashboard.js
- Backend RPCD : luci.secubox (methodes : getModules, getHealth, getAlerts)
- CSS : luci-app-secubox/htdocs/luci-static/resources/secubox/dashboard.css
- Utiliser L.resolveDefault() pour tous les appels ubus
- Implementer une gestion d'erreurs appropriee avec des messages conviviaux
- Ajouter des etats de chargement avec des ecrans squelettes

COMPOSANTS UI A UTILISER :
- sh-page-header pour l'en-tete principal
- sh-card avec variantes sh-card-success/warning/danger
- sh-stat-badge pour les metriques (minimum 130px)
- sh-btn sh-btn-primary pour les boutons d'action
- sh-filter-tabs pour le filtrage par categorie

REFERENCE A LA DEMO EN LIGNE :
Correspondre a l'aspect de la demo secubox.cybermood.eu
- Animations fluides au survol des cartes
- Effets de texte en degrade sur les titres
- Effets de lueur sur les elements actifs
- Grille responsive (cartes de 280px minimum)
```

### 2. Hub Systeme (luci-app-system-hub)

**Objectif du Module :** Centre de controle systeme unifie

**Prompt pour Claude.ai :**

```
Creez un module Hub Systeme complet pour OpenWrt avec ces fonctionnalites :

EXIGENCES DE DESIGN :
- Utiliser le systeme de design System Hub (variables common.css)
- Titre de page : "Centre de Controle Systeme" avec icone
- Interface multi-onglets : Apercu | Services | Logs | Sauvegarde | Composants | Diagnostics | Sante | Distant | Parametres

ONGLET APERCU :
1. Grille d'Informations Systeme (4 colonnes, responsive)
   - Carte Nom d'hote avec bouton d'edition
   - Carte Temps de fonctionnement avec duree formatee
   - Carte Charge Moyenne (1m, 5m, 15m) en monospace
   - Carte Version du Noyau avec icone de copie

2. Moniteurs de Ressources (cercles de progression animes)
   - Utilisation CPU avec code couleur (<70% vert, 70-90% orange, >90% rouge)
   - Utilisation memoire avec affichage utilise/total
   - Utilisation stockage avec repartition par systeme de fichiers
   - Debit reseau (taux RX/TX en temps reel)

3. Indicateurs de Statut Rapide
   - Connectivite Internet (test ping toutes les 60s)
   - Statut de resolution DNS
   - Statut de synchronisation NTP
   - Statut du pare-feu avec nombre de regles

ONGLET SERVICES :
1. Grille de Cartes de Services
   - Chaque service : nom, badge de statut, description, temps de fonctionnement
   - Bordures codees par couleur selon le statut
   - Boutons d'action : Demarrer/Arreter/Redemarrer/Activer/Desactiver
   - Filtrer par : Tous | En cours | Arretes | Actives | Desactives
   - Barre de recherche pour filtrer les services

2. Modal de Details du Service
   - Infos completes du service (PID, utilisation memoire, temps CPU)
   - Logs recents (50 dernieres lignes avec coloration syntaxique)
   - Chemin du fichier de configuration avec lien d'edition
   - Vue arborescente des dependances

ONGLET LOGS :
1. Visionneuse de Logs Systeme
   - Streaming de logs en temps reel (WebSocket ou polling)
   - Niveaux de severite codes par couleur (erreur=rouge, avertissement=orange, info=bleu)
   - Filtrer par : severite, service, plage de dates
   - Fonctionnalite de recherche avec support regex
   - Basculement du defilement automatique
   - Bouton d'export des logs (telecharger en .txt)
   - Numeros de ligne en monospace
   - Mode en-tete compact (economise l'espace vertical)

2. Statistiques des Logs
   - Nombre d'erreurs dans la derniere heure/jour
   - Services les plus actifs
   - Graphique de frequence des alertes (sparkline)

ONGLET SAUVEGARDE :
1. Gestion des Sauvegardes
   - Bouton creer une sauvegarde (inclut config + liste des paquets installes)
   - Lister les sauvegardes existantes avec date, taille, description
   - Restaurer depuis une sauvegarde avec modal de confirmation
   - Telecharger la sauvegarde sur la machine locale
   - Televerser une sauvegarde depuis un fichier
   - Configuration de la planification de sauvegarde automatique

2. Apercu de la Sauvegarde
   - Afficher les fichiers inclus avant creation
   - Calcul de la taille estimee
   - Options de compression (gz, xz)

ONGLET COMPOSANTS :
1. Affichage des Paquets Installes
   - Grille de tous les paquets luci-app-*
   - Chaque carte : nom du paquet, version, taille, statut
   - Filtrage par categorie (meme que les modules SecuBox)
   - Informations de dependance
   - Bouton de desinstallation avec avertissement

ONGLET DIAGNOSTICS :
1. Diagnostics Reseau
   - Outil Ping avec saisie de cible
   - Traceroute avec visualisation des sauts
   - Recherche DNS avec plusieurs serveurs de noms
   - Scanner de ports (ports communs ou plage personnalisee)
   - Test de bande passante (integration speedtest-cli)

2. Diagnostics Systeme
   - Statut de verification du systeme de fichiers
   - Detection de fuites memoire
   - Liste des processus avec utilisation des ressources
   - Compteur de descripteurs de fichiers ouverts
   - Tableau des connexions reseau

ONGLET SANTE :
1. Rapport de Sante Systeme
   - Score de sante global (0-100) avec cercle en degrade
   - Liste des problemes critiques avec suggestions de correction
   - Capteurs de temperature (si disponibles)
   - Vitesses des ventilateurs (si disponibles)
   - Statut SMART du disque
   - Statut de la batterie (pour les systemes avec onduleur)

2. Historique de Sante
   - Graphique du score de sante sur 24h (graphique en ligne)
   - Tendances d'utilisation des ressources
   - Frequence des alertes dans le temps

ONGLET DISTANT :
1. Gestion de l'Acces Distant
   - Statut SSH avec port et IPs autorisees
   - Infos d'acces a l'interface Web (HTTP/HTTPS, port, acces externe)
   - Integration bureau distant RustDesk
   - Statut VPN WireGuard (si installe)
   - Configuration DNS Dynamique

ONGLET PARAMETRES :
1. Preferences du Hub Systeme
   - Intervalle de rafraichissement automatique (10s/30s/60s/desactive)
   - Basculement mode Sombre/Clair
   - Basculement mode Compact
   - Selection de la langue
   - Configuration du fuseau horaire
   - Personnalisation de la disposition du tableau de bord

IMPLEMENTATION TECHNIQUE :
- Fichiers : system-hub/overview.js, services.js, logs.js, backup.js, components.js, diagnostics.js, health.js, remote.js, settings.js
- RPCD : luci.system-hub avec methodes pour chaque fonctionnalite
- Fichier API : system-hub/api.js avec wrappers de methodes propres
- CSS : system-hub/dashboard.css + common.css
- Utiliser theme.js pour le basculement mode sombre/clair
- Support WebSocket pour le streaming de logs en temps reel
- LocalStorage pour les preferences utilisateur
- Etats de chargement et gestion d'erreurs appropriees

REFERENCE DEMO :
Correspondre a la demo secubox.cybermood.eu/system-hub
- Transitions d'onglets fluides
- Mises a jour des donnees en temps reel
- Dispositions de grille responsives
- Code couleur professionnel
```

---

## Modules de Securite et Surveillance

### 3. Tableau de Bord CrowdSec (luci-app-crowdsec-dashboard)

**Prompt pour Claude.ai :**

```
Creez un tableau de bord de surveillance de securite CrowdSec pour OpenWrt :

DESIGN :
- Titre : "Securite CrowdSec" avec icone bouclier
- Theme sombre avec accent sur les indicateurs de menace
- Badges de stats : Decisions Actives | IPs Bloquees | Alertes | Bouncers

ONGLET APERCU :
1. Resume de l'Intelligence des Menaces
   - Compteur total de decisions (reference 15M+ IPs bloquees globalement)
   - Decisions locales actives avec compte a rebours d'expiration
   - Repartition des types de decisions (ban, captcha, throttle) en camembert
   - Distribution geographique des menaces (top 10 avec drapeaux)

2. Chronologie des Alertes Recentes
   - Cartes d'alerte avec : horodatage, scenario, IP, drapeau du pays, severite
   - Code couleur par niveau de risque
   - Details extensibles affichant les donnees completes de l'evenement
   - Filtrer par : plage de temps, type de scenario, severite

3. Flux d'Activite en Temps Reel
   - 100 derniers evenements (defilable, mise a jour automatique)
   - Adresse IP en monospace avec bouton de copie
   - Nom du scenario avec icone
   - Action entreprise (ban/log/captcha)

ONGLET DECISIONS :
1. Tableau des Decisions Actives
   - Colonnes : IP, Raison, Duree, Expire Dans, Type, Origine, Actions
   - Triable par toutes les colonnes
   - Capacites de recherche et filtrage
   - Boutons d'ajout/suppression manuelle de decision
   - Actions en masse (supprimer la selection)
   - Bouton d'export en CSV

2. Statistiques des Decisions
   - Decisions dans le temps (graphique 24h)
   - IPs les plus bloquees
   - Scenarios les plus declenches
   - Duree moyenne des decisions

ONGLET ALERTES :
1. Gestion des Alertes
   - Cartes d'alerte groupees par scenario
   - Vue chronologique avec en-tetes de date
   - Indicateurs de severite (critique/haute/moyenne/basse)
   - Liaison avec les decisions associees
   - Fonctionnalite marquer comme resolu

ONGLET BOUNCERS :
1. Statut des Bouncers
   - Liste des bouncers connectes
   - Chaque bouncer : nom, type, version, dernier pull, statut
   - Ajouter un nouveau bouncer avec generation de cle API
   - Supprimer un bouncer avec confirmation
   - Metriques des bouncers (decisions appliquees, requetes effectuees)

ONGLET METRIQUES :
1. Metriques de Performance
   - Sante du service CrowdSec
   - Frequence de pull des decisions
   - Temps de reponse API
   - Utilisation memoire et CPU
   - Indicateurs de statut LAPI/CAPI

ONGLET PARAMETRES :
1. Configuration CrowdSec
   - Activer/desactiver le service
   - Configuration d'acquisition (chemins des logs)
   - Gestion des scenarios (activer/desactiver des scenarios specifiques)
   - Gestion des collections (installer/supprimer)
   - Statut d'inscription a la console

TECHNIQUE :
- RPCD : luci.crowdsec-dashboard
- Methodes : getStats, getDecisions, getAlerts, getBouncers, getMetrics
- Commandes : cscli decisions list/add/delete, cscli alerts list, cscli bouncers list
- Parser la sortie JSON des commandes cscli
- Gerer la communication API avec le daemon CrowdSec

AMELIORATIONS VISUELLES :
- Bordures en degrade pour les cartes de niveau de menace (vert vers orange vers rouge)
- Pulsation animee sur les nouvelles alertes
- Drapeaux de pays pour la geolocalisation IP
- Graphiques sparkline pour les metriques
- Squelettes de chargement pendant la recuperation des donnees
```

### 4. Tableau de Bord Netdata (luci-app-netdata-dashboard)

**Prompt pour Claude.ai :**

```
Creez un tableau de bord de surveillance systeme Netdata avec plus de 1000 metriques :

DESIGN :
- Titre : "Surveillance Systeme" avec icone graphique
- Accent sur les graphiques et metriques en temps reel
- Badges de stats : Alertes | Services | Graphiques | Collecteurs

ONGLET TABLEAU DE BORD :
1. Grille de Metriques d'Apercu
   - Charge systeme (1m, 5m, 15m) en graphiques jauge
   - Utilisation CPU par coeur (visualisation multi-coeur)
   - Utilisation RAM avec repartition (utilise/cache/tampons/libre)
   - Taux d'E/S disque (lecture/ecriture Mo/s)
   - Debit reseau (toutes les interfaces combinees)

2. Graphiques Rapides
   - Graphique de temperature CPU (si disponible)
   - Graphique d'utilisation swap
   - Graphique du nombre de processus (en cours/en veille/zombie)
   - Graphique des changements de contexte et interruptions

3. Netdata Integre
   - Interface web Netdata complete integree en iframe
   - Dimensionnement responsive
   - Correspondance du theme (mode sombre)

ONGLET SYSTEME :
1. Approfondissement des Metriques Systeme
   - Frequence et gouverneur CPU
   - Pourcentage de temps d'inactivite CPU
   - Barres d'utilisation par coeur
   - Interruptions systeme par seconde
   - Taux de changements de contexte
   - Metriques internes du noyau

2. Details Memoire
   - Graphique d'allocation memoire
   - Taux de defauts de page
   - Ratio de memoire engagee
   - Utilisation des pages enormes
   - Repartition de la memoire slab

ONGLET PROCESSUS :
1. Surveillance des Processus
   - Top processus par CPU (tableau mis a jour en direct)
   - Top processus par RAM
   - Nombre de processus par etat
   - Nombre total de threads
   - Taux de creation de processus

2. Details des Processus
   - Temps CPU par processus
   - Cartes memoire par processus
   - Fichiers ouverts par processus
   - Visualisation arborescente des processus

ONGLET TEMPS REEL :
1. Surveillance en Direct
   - Graphique CPU en temps reel (granularite 1s)
   - E/S reseau en temps reel
   - E/S disque en temps reel
   - Changements memoire en temps reel
   - Rafraichissement automatique chaque seconde

ONGLET RESEAU :
1. Metriques Reseau
   - Statistiques d'interface (toutes les interfaces)
   - Taux de paquets (paquets/s entree/sortie)
   - Compteurs d'erreurs et de rejets
   - Etats des connexions TCP/UDP
   - Statistiques Netfilter
   - Statistiques de requetes DNS (si disponible)

ONGLET PARAMETRES :
1. Configuration Netdata
   - Activer/desactiver le service Netdata
   - Configurer la periode de retention
   - Activer/desactiver des collecteurs specifiques
   - Configuration des alertes
   - Configuration du streaming (Netdata central)

TECHNIQUE :
- RPCD : luci.netdata-dashboard
- Integration API Netdata (http://localhost:19999/api/v1/)
- Methodes : /info, /charts, /data, /alarms
- Recuperation de donnees en temps reel avec polling
- Chart.js ou graphiques Netdata natifs
- Support WebSocket pour mises a jour en direct

GRAPHIQUES A INCLURE :
- Graphiques en ligne pour les donnees temporelles
- Graphiques en barres pour les comparaisons
- Graphiques jauge pour les valeurs actuelles
- Graphiques en aires pour les metriques empilees
- Sparklines pour les apercus compacts
```

---

## Modules d'Intelligence Reseau

### 5. Tableau de Bord Netifyd (luci-app-netifyd-dashboard)

**Prompt pour Claude.ai :**

```
Creez un tableau de bord d'Inspection Approfondie des Paquets utilisant Netifyd (detection de plus de 300 applications) :

DESIGN :
- Titre : "Intelligence Reseau" avec icone loupe
- Focus sur la visibilite des applications et protocoles
- Badges de stats : Flux Actifs | Applications | Appareils | Protocoles

ONGLET APERCU :
1. Resume de l'Activite Reseau
   - Compteur total de flux (actuel + historique)
   - Applications uniques detectees aujourd'hui
   - Nombre d'appareils actifs
   - Distribution des protocoles (camembert TCP/UDP/ICMP)

2. Graphique des Top Applications
   - Graphique en barres des 10 applications principales par bande passante
   - Icones pour les applications reconnues (Netflix, YouTube, Spotify, etc.)
   - Pourcentage du trafic total
   - Cliquer pour filtrer les flux par application

3. Top Appareils
   - Cartes d'appareil avec : nom d'hote, MAC, IP, application actuelle
   - Utilisation de bande passante par appareil (RX/TX)
   - Icone de type d'appareil (telephone, laptop, TV, IoT)

ONGLET APPLICATIONS :
1. Decouverte d'Applications
   - Grille des applications detectees
   - Chaque carte : icone app, nom, categorie, protocole, flux actifs
   - Categories codees par couleur :
     * Streaming (rouge) : Netflix, YouTube, Twitch
     * Social (bleu) : Facebook, Instagram, TikTok
     * Messagerie (vert) : WhatsApp, Telegram, Signal
     * VoIP (violet) : Zoom, Teams, Discord
     * Gaming (orange) : Steam, PlayStation, Xbox
   - Bande passante en temps reel par app (sparklines)

2. Details de l'Application
   - Cliquer sur l'app pour voir : connexions actives, bande passante totale, protocoles utilises
   - Chronologie des flux pour l'application selectionnee
   - Repartition par appareil (quels appareils utilisent cette app)

ONGLET APPAREILS :
1. Inventaire des Appareils
   - Tableau : IP, MAC, Nom d'hote, Fabricant, Apps Actives, Bande Passante
   - Triable et recherchable
   - Regroupement des appareils par sous-reseau
   - Nommage/etiquetage manuel des appareils

2. Profil d'Appareil
   - Vue par appareil : tous les flux, historique d'utilisation des apps
   - Tendances de bande passante (graphique 24h)
   - Evaluation des risques (protocoles inconnus, apps suspectes)
   - Gestion des regles bloquer/autoriser

ONGLET FLUX :
1. Moniteur de Flux Actifs
   - Tableau en temps reel des flux reseau
   - Colonnes : Source, Destination, App, Protocole, Bande Passante, Duree
   - Defilement automatique avec bouton pause
   - Code couleur par niveau de risque
   - Details du flux au clic (5-tuple complet + donnees DPI)

2. Statistiques des Flux
   - Flux par protocole (camembert)
   - Top emetteurs (IPs sources)
   - Top destinations (IPs externes)
   - Distribution des ports

ONGLET TOP EMETTEURS :
1. Leaders en Bande Passante
   - Liste classee des adresses IP par trafic total
   - Indicateurs de direction (upload/download)
   - Selecteur de plage de temps (1h/24h/7j/30j)
   - Export en CSV

ONGLET RISQUES :
1. Evaluation des Risques
   - Detection de flux suspects
   - Liste des protocoles inconnus
   - Connexions vers des IPs sur liste noire
   - Utilisation inhabituelle de ports
   - Trafic potentiel de malware C2
   - Score de risque par appareil (0-100)

ONGLET BANDE PASSANTE PAR CATEGORIE :
1. Trafic par Categorie
   - Graphique en aires empilees montrant les categories dans le temps
   - Categories : Streaming, Social, Gaming, Business, Autre
   - Repartition en pourcentages
   - Heures de pic d'utilisation

ONGLET REQUETES DNS :
1. Analytiques DNS
   - Tableau des requetes DNS recentes
   - Domaines les plus requetes
   - Nombre de requetes echouees
   - Detection de fuite DNS
   - Requetes bloquees (si utilisation de filtrage DNS)

ONGLET PARAMETRES :
1. Configuration Netifyd
   - Activer/desactiver le DPI
   - Selectionner les interfaces a surveiller
   - Sensibilite de detection des applications
   - Configuration de l'export des flux
   - Parametres de confidentialite (retention des donnees)

TECHNIQUE :
- RPCD : luci.netifyd-dashboard
- API Netifyd : Socket Unix /var/run/netifyd/netifyd.sock
- Parsing de l'export JSON des flux
- Base de donnees d'applications des signatures Netify
- Mises a jour de flux en temps reel (WebSocket ou SSE)

FONCTIONNALITES VISUELLES :
- Icones d'application de FontAwesome ou set SVG personnalise
- Compteurs de flux animes (effet de comptage)
- Barres de bande passante codees par couleur
- Graphiques interactifs (cliquer pour filtrer)
- Infobulles avec informations detaillees
```

### 6. Modes Reseau (luci-app-network-modes)

**Prompt pour Claude.ai :**

```
Creez un assistant de Configuration de Mode Reseau avec 5 options de topologie :

DESIGN :
- Titre : "Configuration Reseau" avec icone globe
- Interface style assistant avec progression par etapes
- Grandes cartes de mode avec illustrations

ONGLET APERCU :
1. Affichage du Mode Actuel
   - Grande carte montrant le mode actif avec icone
   - Description du mode
   - Resume de la configuration reseau actuelle (IPs WAN/LAN, statut DHCP)
   - Bouton "Changer de Mode" (en degrade)

2. Tableau Comparatif des Modes
   - Les 5 modes en colonnes
   - Lignes : Cas d'usage, Ports WAN, Ports LAN, Role WiFi, Serveur DHCP, NAT
   - Mode actuel en surbrillance

ONGLET ASSISTANT :
1. Ecran de Selection du Mode
   - 5 cartes de mode en grille :
     * Mode Routeur - Configuration maison/bureau par defaut
     * Mode Bridge - Transfert transparent couche 2
     * Mode Point d'Acces - WiFi uniquement, liaison filaire
     * Mode Repeteur/Extendeur - Repetition WiFi vers WiFi
     * Mode Routeur de Voyage - WiFi portable depuis ethernet hotel
   - Chaque carte : titre, description, avantages/inconvenients, diagramme
   - Bouton "Selectionner" par carte

2. Ecran de Configuration (par mode)
   - Parametres specifiques au mode :
     * Routeur : Type WAN (DHCP/PPPoE/Statique), sous-reseau LAN, plage DHCP
     * Bridge : Membres du bridge, activer STP, config VLAN
     * AP : Interface de liaison, SSID, securite, canal
     * Repeteur : Scan SSID source, identifiants, SSID de rediffusion
     * Routeur de Voyage : Scan WiFi client, option clone MAC WAN

3. Ecran de Previsualisation
   - Afficher les changements de configuration avant application
   - Diagramme reseau avec nouvelle topologie
   - Liste des services qui seront reconfigures
   - Avertissement de temps d'arret estime
   - Boutons "Appliquer" et "Retour"

4. Ecran d'Application
   - Indicateur de progression pendant l'application
   - Statut etape par etape :
     * Arret des services...
     * Mise a jour de la configuration reseau...
     * Redemarrage des interfaces...
     * Demarrage des services...
   - Temporisateur de retour arriere (60 secondes pour confirmer)
   - Ecran de confirmation apres succes

ONGLET MODE ROUTEUR :
1. Parametres Routeur
   - Config interface WAN (client DHCP, statique, PPPoE, 3G/4G)
   - Config interface LAN (IP, masque, serveur DHCP)
   - Mappage de ports (quels ports physiques sont WAN vs LAN)
   - Regles NAT et pare-feu
   - Configuration du redirecteur DNS

ONGLET POINT D'ACCES :
1. Parametres AP
   - Selection de l'interface de liaison (ethernet ou WiFi)
   - Desactiver NAT et serveur DHCP
   - Pont LAN et Liaison
   - Configuration WiFi (SSID, securite, canal, puissance)
   - Parametres de roaming rapide (802.11r)

ONGLET RELAIS :
1. Parametres Relais/Repeteur
   - Sondage du site (scanner les reseaux WiFi)
   - Connexion au WiFi amont (identifiants)
   - SSID de rediffusion (meme ou different)
   - Config bridge WiFi vers WiFi
   - Indicateurs de force du signal

ONGLET MODE SNIFFER :
1. Configuration de Capture de Paquets
   - Mode moniteur sur WiFi
   - Mode promiscueux sur ethernet
   - Filtres de capture (syntaxe BPF)
   - Format de sortie (pcap, pcapng)
   - Rotation et stockage des captures
   - Integration avec tcpdump/wireshark

ONGLET PARAMETRES :
1. Parametres Reseau Avances
   - Configuration VLAN
   - Agregation de liens (bonding)
   - Parametres QoS
   - Configuration IPv6
   - Regles de routage personnalisees

TECHNIQUE :
- RPCD : luci.network-modes
- Methodes : get_current_mode, get_available_modes, set_mode, validate_config
- Manipulation de config UCI (/etc/config/network, wireless, firewall, dhcp)
- Surveillance d'etat des interfaces (evenements network.interface)
- Mecanisme de retour arriere (uci revert + temporisateur)

VALIDATION :
- Validation du format d'adresse IP
- Detection de chevauchement de sous-reseaux
- Verification de la plage DHCP dans le sous-reseau
- Verification de la disponibilite du canal WiFi
- Conflits d'assignation de ports physiques
```

---

## Modules VPN et Controle d'Acces

### 7. Tableau de Bord WireGuard (luci-app-wireguard-dashboard)

**Prompt pour Claude.ai :**

```
Creez un tableau de bord de gestion VPN WireGuard avec generation de QR code :

DESIGN :
- Titre : "VPN WireGuard" avec icone cadenas
- Esthetique moderne de tableau de bord VPN
- Badges de stats : Pairs Actifs | Donnees Transferees | Temps de fonctionnement | Endpoints

ONGLET APERCU :
1. Statut VPN
   - Statut de l'interface (haut/bas) avec bascule
   - Affichage de la cle publique (monospace, bouton copie)
   - Port d'ecoute
   - Adresse IP (sous-reseau VPN)
   - Endpoint (si mode client)

2. Statistiques des Pairs
   - Nombre de pairs actifs
   - Total des donnees RX/TX (tous pairs combines)
   - Horodatage du dernier handshake
   - Indicateurs de qualite de connexion

3. Actions Rapides
   - Bouton Demarrer/Arreter VPN
   - Bouton Generer Nouvelle Paire de Cles
   - Bouton Telecharger Config
   - Bouton Ajouter Pair (modal rapide)

ONGLET PAIRS :
1. Gestion des Pairs
   - Grille de cartes de pairs :
     * Chaque carte : nom, cle publique (tronquee), IPs autorisees, endpoint, statut
     * Bordure codee par couleur (vert=actif, orange=obsolete, rouge=deconnecte)
     * Heure du dernier handshake (ex: "il y a 2 minutes")
     * Compteurs de transfert de donnees (RX/TX)
     * Boutons Editer et Supprimer

2. Dialogue Ajouter Pair
   - Generer une paire de cles automatiquement OU coller une cle publique existante
   - Assigner une adresse IP VPN (auto-suggerer la prochaine disponible)
   - Definir les IPs autorisees (0.0.0.0/0 pour tunnel complet, sous-reseaux specifiques pour split)
   - Optionnel : intervalle de keepalive persistant
   - Optionnel : cle pre-partagee (PSK) pour securite post-quantique
   - Generer le fichier de config et QR code instantanement

ONGLET QR CODES :
1. Configuration Client Mobile
   - Selectionner le pair depuis le menu deroulant
   - Generer la config client WireGuard
   - Afficher en QR code (pour scan avec l'app mobile WireGuard)
   - Afficher aussi le texte de config (copiable)
   - Bouton telecharger fichier .conf
   - Inclure les serveurs DNS dans la config

2. Options QR Code
   - Serveurs DNS personnalises
   - Inclure toutes les routes vs split tunnel
   - Configuration MTU
   - Parametre de keepalive persistant

ONGLET TRAFIC :
1. Analytiques de Trafic
   - Graphique de bande passante en temps reel (par pair)
   - Graphique de trafic historique (24h, 7j, 30j)
   - Top utilisateurs de bande passante
   - Trafic par protocole (si DPI disponible)

ONGLET CONFIG :
1. Configuration de l'Interface
   - Cle privee (masquee par defaut, bouton afficher)
   - Cle publique (derivee, lecture seule)
   - Port d'ecoute (51820 par defaut)
   - Adresses IP (separees par virgules pour multi-sous-reseau)
   - Taille MTU
   - Table (numero de table de routage)

2. Parametres Avances
   - Scripts Pre-up/Post-up
   - Scripts Pre-down/Post-down
   - Assignation de zone pare-feu
   - Bascule masquerading NAT

ONGLET PARAMETRES :
1. Parametres VPN Globaux
   - Bascule demarrage automatique au boot
   - Intervalle de keep-alive (defaut global)
   - Protection contre les fuites DNS
   - Bascule support IPv6
   - Niveau de journalisation

2. Configuration Endpoint (pour mode client)
   - Nom d'hote/IP de l'endpoint serveur
   - Cle publique du serveur
   - IPs autorisees (ce qui passe par le VPN)
   - Keepalive persistant pour traversee NAT

TECHNIQUE :
- RPCD : luci.wireguard-dashboard
- Methodes : status, get_interfaces, get_peers, add_peer, remove_peer, generate_keys, generate_config, generate_qr
- Commandes : wg show, wg set, wg genkey, wg pubkey, wg genpsk
- Generation QR code : commande qrencode ou bibliotheque JavaScript (qrcodejs)
- Generation de modele de fichier de config
- Mises a jour de statut des pairs en temps reel

AMELIORATIONS UI :
- Indicateurs de statut de connexion animes
- Bordure en degrade pour les pairs actifs
- Copier dans le presse-papiers pour les cles et configs
- Dialogues modaux pour ajouter/editer pair
- Dialogues de confirmation pour les actions destructives
- Notifications toast pour succes/erreur
```

### 8. Client Guardian (luci-app-client-guardian)

**Prompt pour Claude.ai :**

```
Creez un systeme de Controle d'Acces Reseau (NAC) et Portail Captif :

DESIGN :
- Titre : "Controle d'Acces" avec icone utilisateurs
- Focus sur la gestion des appareils et les politiques d'acces
- Badges de stats : Total Appareils | Autorises | Bloques | Invites

ONGLET APERCU :
1. Resume Reseau
   - Total des appareils vus (depuis toujours)
   - Appareils actuellement connectes
   - Nombre d'appareils autorises
   - Nombre d'appareils bloques
   - Appareils invites (portail captif)

2. Activite Recente
   - 20 derniers evenements de connexion
   - Chaque evenement : horodatage, MAC, IP, nom d'hote, action (autoriser/bloquer/captif)
   - Code couleur par type d'action

3. Actions Rapides
   - Bouton Bloquer Tous les Inconnus (mode verrouillage)
   - Bouton Autoriser Tout (mode ouvert)
   - Bouton Effacer les Sessions Invites

ONGLET CLIENTS :
1. Tableau des Appareils
   - Colonnes : MAC, IP, Nom d'hote, Fabricant, Zone, Statut, Actions
   - Triable par toutes les colonnes
   - Barre de recherche/filtre
   - Selection en masse pour actions

2. Modal Details de l'Appareil
   - Infos completes de l'appareil : MAC, IP, Nom d'hote, Fabricant (depuis prefixe MAC)
   - Historique de connexion (premiere vue, derniere vue, total connexions)
   - Assignation de zone actuelle (LAN, Invite, Bloque)
   - Politiques assignees
   - Bouton d'edition (changer nom d'hote, zone, politiques)

ONGLET ZONES :
1. Gestion des Zones
   - Zones predefinies :
     * Confiance (acces complet)
     * LAN (acces standard)
     * Invite (acces restreint, portail captif)
     * IoT (isole, acces limite)
     * Quarantaine (bloque)

2. Configuration de Zone
   - Parametres par zone :
     * Services autorises (HTTP, HTTPS, DNS, etc.)
     * Limites de bande passante
     * Restrictions horaires
     * Regles de communication inter-zones
     * Regles pare-feu

ONGLET PORTAIL CAPTIF :
1. Configuration du Portail Captif
   - Activer/desactiver le portail
   - Personnalisation de la page d'accueil :
     * Upload de logo personnalise
     * Message de bienvenue (editeur HTML)
     * Texte des conditions d'utilisation
     * URL de redirection apres acceptation

2. Themes du Portail
   - Themes predefinis (Business, Hotel, Cafe, Ecole)
   - Personnalisation du schema de couleurs
   - Bouton de previsualisation

3. Parametres du Portail
   - Duree de session (1h, 4h, 24h, illimitee)
   - Exiger email avant acces
   - Exiger verification SMS
   - Exiger connexion sociale (Facebook, Google)
   - Autoriser automatiquement les appareils connus

ONGLET DESIGN DU PORTAIL :
1. Editeur de Page d'Accueil
   - Editeur HTML WYSIWYG
   - Variables de modele (ex: {{client_mac}}, {{client_ip}})
   - Upload d'image de fond
   - Panneau de style CSS
   - Previsualisation en direct

ONGLET LOGS :
1. Logs d'Acces
   - Log des tentatives de connexion
   - Decisions autoriser/bloquer
   - Authentifications portail captif
   - Filtrer par : plage de temps, MAC, IP, zone, action

ONGLET ALERTES :
1. Alertes de Securite
   - Detection de spoofing MAC
   - Tentatives de connexion excessives
   - Appareils inconnus se connectant
   - Appareils changeant de zones
   - Configuration des regles d'alerte

ONGLET CONTROLE PARENTAL :
1. Filtrage de Contenu
   - Blocage par categorie de site (adulte, social, gaming, etc.)
   - Controles d'acces bases sur l'heure (heures d'ecole, heure du coucher)
   - Politiques par appareil ou par utilisateur
   - Application de SafeSearch
   - Mode restreint YouTube

2. Groupes d'Appareils
   - Grouper les appareils (ex: "Appareils des Enfants")
   - Appliquer des politiques aux groupes
   - Regles basees sur le planning (semaine vs weekend)

ONGLET PARAMETRES :
1. Parametres Client Guardian
   - Zone par defaut pour les nouveaux appareils
   - Application de liaison MAC-IP
   - Timeout du cache ARP
   - Integration DHCP (assigner zone selon plage IP)
   - Niveau de journalisation et retention

TECHNIQUE :
- RPCD : luci.client-guardian
- Methodes : list_clients, update_client, get_zones, configure_portal, get_logs
- Integration avec :
   * nftables/iptables pour le controle d'acces
   * dnsmasq pour DNS et DHCP
   * nginx/uhttpd pour le portail captif
   * ipset pour le regroupement efficace d'appareils
- Base de donnees pour le suivi des appareils (SQLite ou UCI)

IMPLEMENTATION DU PORTAIL CAPTIF :
- Intercepter le trafic HTTP pour les clients non authentifies
- Rediriger vers la page d'accueil
- Apres acceptation, ajouter a l'ipset autorise
- Gestion de session avec cookies ou tokens
```

### 9. Auth Guardian (luci-app-auth-guardian)

**Prompt pour Claude.ai :**

```
Creez un systeme d'authentification et de gestion de sessions avec OAuth2 et bons :

DESIGN :
- Titre : "Authentification" avec icone cle
- Tableau de bord d'authentification professionnel
- Badges de stats : Sessions Actives | Fournisseurs OAuth | Bons | Regles de Contournement

ONGLET APERCU :
1. Statut d'Authentification
   - Total des utilisateurs enregistres
   - Nombre de sessions actives
   - Fournisseurs OAuth configures
   - Utilisations de bons aujourd'hui

2. Authentifications Recentes
   - 20 derniers evenements d'auth
   - Chaque : horodatage, nom d'utilisateur/email, methode (OAuth/bon/contournement), IP, statut
   - Code couleur par statut (succes=vert, echec=rouge)

ONGLET SESSIONS :
1. Tableau des Sessions Actives
   - Colonnes : Utilisateur, ID Session, Debut, Derniere Activite, IP, Appareil, Actions
   - Details de session au clic
   - Bouton revoquer session (avec confirmation)
   - Bouton forcer deconnexion de toutes les sessions

2. Gestion des Sessions
   - Configuration du timeout de session
   - Limite de sessions simultanees par utilisateur
   - Timeout d'inactivite
   - Duree du "se souvenir de moi"

ONGLET BONS :
1. Gestion des Bons
   - Bouton creer nouveau bon
   - Tableau des bons : Code, Duree, Utilisations Restantes, Cree, Expire, Statut
   - Types de bons :
     * Usage unique (une seule fois)
     * Usage multiple (X utilisations)
     * Limite dans le temps (expire apres duree)
     * Limite en bande passante (quota X Go)

2. Dialogue Creer un Bon
   - Generer code aleatoire OU code personnalise
   - Duree du bon (1h, 4h, 24h, 7j, 30j, illimitee)
   - Limite d'utilisation (1, 10, 100, illimitee)
   - Quota de bande passante (optionnel)
   - Champ notes/description
   - Bouton imprimer bon (page imprimable avec code)

3. Generation de Bons en Masse
   - Generer X bons d'un coup
   - Exporter en CSV
   - Imprimer feuille (plusieurs bons par page)

ONGLET OAUTH :
1. Configuration des Fournisseurs OAuth
   - Fournisseurs supportes :
     * Google OAuth
     * GitHub OAuth
     * Facebook Login
     * Microsoft Azure AD
     * Fournisseur OAuth2 personnalise

2. Configuration du Fournisseur
   - Saisie Client ID
   - Saisie Client Secret (masque)
   - URI de redirection (auto-genere)
   - Configuration des scopes
   - Activer/desactiver par fournisseur
   - Bouton de test (initie le flux OAuth)

3. Mappage Utilisateur
   - Mapper les attributs OAuth aux champs utilisateur locaux
   - Creation auto de l'utilisateur a la premiere connexion OAuth
   - Assignation de groupe basee sur les claims OAuth

ONGLET PAGE D'ACCUEIL :
1. Personnalisation de la Page de Connexion
   - Upload de logo personnalise
   - Editeur de texte de bienvenue
   - Methodes d'auth activees (boutons OAuth, saisie bon, lien contournement)
   - Image de fond ou degrade
   - Schema de couleurs
   - Bouton de previsualisation

ONGLET REGLES DE CONTOURNEMENT :
1. Configuration de Contournement
   - Liste blanche d'adresses MAC (pas d'auth requise)
   - Liste blanche de plages IP
   - Liste blanche de noms d'hote (patterns regex)
   - Contournement base sur l'heure (ex: heures de bureau, tous les appareils autorises)

2. Liste de Contournement
   - Tableau : MAC/IP, Description, Ajoute, Expire
   - Ajouter/supprimer des regles de contournement
   - Contournement temporaire (expire apres X heures)

ONGLET LOGS :
1. Logs d'Authentification
   - Toutes les tentatives d'auth (succes et echec)
   - Filtrer par : plage de dates, nom d'utilisateur, methode, IP
   - Exporter en CSV
   - Visualisations :
     * Tentatives d'auth dans le temps (graphique en ligne)
     * Repartition des methodes d'auth (camembert)
     * Tentatives echouees par IP (graphique en barres)

ONGLET PARAMETRES :
1. Parametres Auth Guardian
   - Exiger authentification (bascule globale)
   - Duree de session par defaut
   - Politique de mot de passe (si utilisateurs locaux)
   - Authentification a deux facteurs (TOTP)
   - Limites de tentatives de connexion (protection brute force)
   - Stockage de session (memoire vs base de donnees)

TECHNIQUE :
- RPCD : luci.auth-guardian
- Methodes : status, list_providers, list_vouchers, create_voucher, delete_voucher, validate_voucher, list_sessions, revoke_session
- Implementation OAuth :
   * Flux de code d'autorisation
   * Validation de token JWT
   * Appels API specifiques au fournisseur
- Systeme de bons :
   * Generation de code aleatoire (alphanumerique, 8-16 caracteres)
   * Suivi d'expiration (tache cron ou daemon)
   * Journalisation des utilisations
- Gestion de session :
   * Basee sur cookie ou token
   * Stockage Redis ou en memoire pour les sessions
   * Tache de nettoyage de session

INTEGRATION :
- Fonctionne avec Client Guardian pour le portail captif
- Integration pare-feu pour acces post-auth
- Support RADIUS (optionnel, pour entreprise)
```

---

## Modules de Bande Passante et Trafic

### 10. Gestionnaire de Bande Passante (luci-app-bandwidth-manager)

**Prompt pour Claude.ai :**

```
Creez un systeme complet de QoS et de gestion de bande passante :

DESIGN :
- Titre : "Gestionnaire de Bande Passante" avec icone signal
- Focus sur la mise en forme du trafic et les quotas
- Badges de stats : Regles Actives | Bande Passante Totale | Clients Suivis | Quotas

ONGLET APERCU :
1. Resume de la Bande Passante
   - Bande passante totale disponible (liaison montante/descendante WAN)
   - Utilisation actuelle (jauge temps reel)
   - Utilisation maximale (maximum du jour)
   - Utilisation moyenne (24h)

2. Top Utilisateurs de Bande Passante
   - Tableau : IP/Nom d'hote, Download, Upload, Total, Pourcentage
   - Mises a jour temps reel
   - Cliquer pour appliquer une regle rapide

3. Classification du Trafic
   - Par protocole : HTTP, HTTPS, DNS, P2P, Streaming, Gaming
   - Par priorite : Haute, Moyenne, Basse, Masse
   - Visualisation en camembert

ONGLET REGLES :
1. Tableau des Regles QoS
   - Colonnes : Nom, Source, Destination, Service, Priorite, Limite de Debit, Statut
   - Triable et filtrable
   - Bascule activer/desactiver par regle
   - Actions Editer/Supprimer

2. Dialogue Ajouter une Regle
   - Type de regle : Limite de Bande Passante, Priorite, Garantie
   - Criteres de correspondance :
     * IP/MAC/Sous-reseau source
     * IP/Sous-reseau destination
     * Port/Service (HTTP, HTTPS, SSH, etc.)
     * Protocole (TCP, UDP, ICMP)
     * Application (basee sur DPI, si disponible)
   - Action :
     * Definir limite de download (kbps/mbps)
     * Definir limite d'upload
     * Definir priorite (1-7, ou noms de classe)
     * Garantir bande passante minimale
   - Planning (toujours, base sur l'heure, jour de la semaine)

ONGLET QUOTAS :
1. Quotas de Bande Passante
   - Quotas par appareil
   - Quotas par utilisateur
   - Quotas famille (groupe d'appareils)
   - Quotas bases sur le temps (quotidien, hebdomadaire, mensuel)

2. Configuration de Quota
   - Definir montant du quota (Go)
   - Definir periode du quota (jour/semaine/mois)
   - Action en cas de depassement de quota :
     * Bloquer tout le trafic
     * Limiter a X kbps
     * Envoyer notification uniquement
   - Planning de reinitialisation du quota
   - Reporter le quota non utilise (optionnel)

3. Tableau de Bord d'Utilisation des Quotas
   - Cartes par appareil/utilisateur montrant :
     * Limite du quota
     * Montant utilise
     * Restant
     * Barre de progression avec code couleur
     * Date de reinitialisation
   - Seuil d'avertissement (notifier a 80%, 90%)

ONGLET UTILISATION :
1. Historique d'Utilisation
   - Graphiques :
     * Utilisation quotidienne (30 derniers jours) en barres
     * Utilisation horaire (24 dernieres heures) en ligne
     * Utilisation hebdomadaire (12 dernieres semaines) en aire
   - Filtrer par appareil, service, direction (montant/descendant)
   - Exporter en CSV

2. Statistiques d'Utilisation
   - Total transfere ce mois
   - Utilisation quotidienne moyenne
   - Heure de pointe (quand l'utilisation est maximale)
   - Applications en tendance

ONGLET MEDIA :
1. Detection du Trafic Media
   - Services de streaming : Netflix, YouTube, Disney+, Twitch, etc.
   - VoIP : Zoom, Teams, Discord, appels WhatsApp
   - Gaming : Steam, PlayStation, Xbox Live
   - Reseaux Sociaux : Facebook, Instagram, TikTok

2. Regles Specifiques aux Medias
   - Modeles rapides :
     * Prioriser VoIP sur le streaming
     * Limiter le streaming pendant les heures de travail
     * Limiter la bande passante gaming
   - Allocation de bande passante par service
   - Limitation basee sur la qualite (detection 4K vs 720p)

ONGLET CLASSES :
1. Classes de Trafic (HTB/CAKE)
   - Classes predefinies :
     * Temps Reel (VoIP, gaming) : priorite maximale
     * Interactif (navigation web, SSH) : haute priorite
     * Masse (telechargements, mises a jour) : basse priorite
     * Defaut : priorite moyenne

2. Configuration de Classe
   - Allocation de bande passante par classe (pourcentage ou absolu)
   - Emprunt (permettre a la classe d'utiliser la bande passante inutilisee des autres)
   - Plafond (bande passante maximale qu'une classe peut utiliser)
   - Quantum (taille de paquet pour mise en file d'attente equitable)

ONGLET CLIENTS :
1. Gestion Par Client
   - Liste des clients avec utilisation actuelle de bande passante
   - Actions rapides :
     * Definir limite de bande passante pour le client
     * Appliquer quota au client
     * Bloquer le client temporairement
     * Assigner a une classe de trafic

ONGLET PLANNINGS :
1. Gestion des Plannings
   - Creer des regles basees sur l'heure
   - Exemples :
     * Heures de bureau (9h-17h Lun-Ven) : prioriser les apps business
     * Soiree (18h-23h) : permettre le streaming
     * Nuit tardive (23h-6h) : tout limiter
   - Vue calendrier des plannings
   - Detection des conflits

ONGLET PARAMETRES :
1. Parametres Globaux
   - Limites de bande passante WAN (montant/descendant en Mbps)
   - Algorithme QoS : CAKE, HTB, SFQ, FQ_CODEL
   - Activer/desactiver QoS globalement
   - Classe de trafic par defaut
   - Test de bande passante (mesurer la vitesse WAN reelle)

2. Parametres Avances
   - Marquage DSCP
   - ECN (Notification Explicite de Congestion)
   - Calcul d'overhead (pour PPPoE, etc.)
   - Octets d'overhead par paquet
   - Adaptation de la couche liaison

TECHNIQUE :
- RPCD : luci.bandwidth-manager
- Methodes : getStats, getRules, addRule, deleteRule, getQuotas, setQuota, getUsage
- Implementation QoS :
   * Commandes tc (traffic control) pour HTB
   * qdisc cake pour QoS moderne
   * iptables conntrack pour comptabilite d'utilisation
   * metres nftables pour limitation de debit
- Base de donnees :
   * SQLite ou UCI pour regles et quotas
   * RRD pour donnees historiques de bande passante
   * Compteurs iptables pour stats temps reel

AMELIORATIONS VISUELLES :
- Graphiques jauge de bande passante (animes)
- Sparklines pour les tendances
- Barres de quota codees par couleur
- Cartes de regles responsives
```

### 11. Mise en Forme du Trafic (luci-app-traffic-shaper)

**Prompt pour Claude.ai :**

```
Creez un module avance de mise en forme du trafic avec anti-bufferbloat (CAKE) :

DESIGN :
- Titre : "Mise en Forme du Trafic" avec icone fusee
- Focus technique/avance
- Badges de stats : Files Actives | Latence Moy. | Perte de Paquets | Debit

ONGLET APERCU :
1. Statut du Shaper
   - Bascule statut QoS active
   - Algorithme actif (CAKE, HTB, FQ_CODEL)
   - Interfaces mises en forme (WAN, LAN)
   - Latence actuelle (ping vers 1.1.1.1)

2. Metriques de Performance
   - Temps aller-retour (RTT) sous charge
   - Taille du buffer (actuel vs optimal)
   - Taux de perte de paquets
   - Debit (reel vs configure)

3. Test de Bufferbloat
   - Bouton executer test de vitesse DSLReports
   - Afficher resultats : download, upload, latence, note
   - Graphique historique des resultats de test

ONGLET CLASSES :
1. Classes de Trafic (hierarchie HTB)
   - Classe racine (bande passante totale)
   - Classes enfants avec priorite :
     * Expedited Forwarding (EF) : VoIP, gaming
     * Assured Forwarding (AF) : apps business
     * Best Effort (BE) : web, email
     * Background (telechargements en masse)

2. Configuration de Classe
   - Debit (bande passante garantie)
   - Plafond (bande passante maximale)
   - Priorite (1-7)
   - Quantum (taille de paquet)
   - Burst (permettre depassement temporaire)

ONGLET REGLES :
1. Regles de Classification
   - Criteres de correspondance :
     * Champ DSCP/TOS
     * Numeros de port
     * Adresses IP
     * Protocole
     * Signature DPI
   - Action : assigner a une classe de trafic
   - Priorite de regle (1-999)

2. Modeles de Regles
   - Regles predefinies :
     * Optimisation VoIP (ports SIP, RTP)
     * Optimisation gaming (serveurs de jeu connus)
     * Depriorisation streaming
     * Limitation P2P
   - Application en un clic

ONGLET STATS :
1. Statistiques des Files
   - Metriques par classe :
     * Paquets envoyes
     * Octets envoyes
     * Rejets (indicateur de surcharge)
     * Depassements (atteintes du plafond)
     * Remises en file
   - Graphiques temps reel et historiques

2. Statistiques d'Interface
   - Compteurs par interface
   - Graphiques de profondeur de file
   - Mesures de latence (ping ICMP ou horodatage)

ONGLET PRESELECTIONS :
1. Preselections QoS
   - Preselection Gaming (latence minimale, prioriser ports gaming)
   - Preselection Streaming (equilibre, permettre bande passante streaming)
   - Preselection Business (prioriser VoIP, bureau distant)
   - Preselection Equilibree (usage domestique general)
   - Preselection Manuelle (configuration personnalisee)

2. Configuration de Preselection
   - Selectionner la preselection depuis le menu deroulant
   - Auto-configurer tous les parametres
   - Afficher ce qui va changer (apercu diff)
   - Bouton Appliquer

ONGLET CONFIGURATION CAKE :
1. Parametres CAKE
   - Bande passante (montant/descendant en Mbps)
   - Overhead :
     * Aucun
     * ADSL (avec entrelacement)
     * VDSL2
     * Ethernet
     * PPPoE
   - Adaptation couche liaison :
     * Ethernet
     * ATM
     * PTM
   - Flux :
     * Triple-isolate (IP source, IP dest, port)
     * Dual-srchost
     * Dual-dsthost
     * Per-host
   - Diffserv :
     * Diffserv4 (4 tins)
     * Diffserv3 (3 tins)
     * Besteffort (file unique)
   - ECN : activer/desactiver
   - Filtre ACK : activer/desactiver (pour liens montants lents)

TECHNIQUE :
- RPCD : luci.traffic-shaper
- Commandes :
   * tc qdisc add/del/replace
   * tc class add/del/change
   * tc filter add/del
   * configuration qdisc cake
- Surveillance temps reel :
   * tc -s qdisc show
   * tc -s class show
   * Parser la sortie pour les statistiques
- Test de latence :
   * Commande ping avec horodatages
   * Integration avec fping ou hping3

AMELIORATIONS VISUELLES :
- Graphique de latence temps reel (mise a jour en direct)
- Sparklines de taux de perte de paquets
- Vue arborescente de la hierarchie des classes
- Classes codees par couleur selon la priorite
```

### 12. Media Flow (luci-app-media-flow)

**Prompt pour Claude.ai :**

```
Creez un tableau de bord de detection du streaming media et trafic VoIP :

DESIGN :
- Titre : "Moniteur Media" avec icone cinema
- Focus sur les services de streaming et appels video
- Badges de stats : Streams Actifs | Appels VoIP | Bande Passante Utilisee | Services

ONGLET TABLEAU DE BORD :
1. Streams Media Actifs
   - Cartes pour chaque stream actif :
     * Logo du service (Netflix, YouTube, etc.)
     * Appareil client (IP, nom d'hote)
     * Estimation de qualite du stream (4K, 1080p, 720p, SD)
     * Debit actuel (Mbps)
     * Duree
   - Code couleur par type de service (streaming=rouge, VoIP=vert)

2. Repartition par Service
   - Camembert : bande passante par service
   - Services :
     * Netflix, Amazon Prime, Disney+, Hulu, HBO Max
     * YouTube, Twitch, Vimeo
     * Spotify, Apple Music, Pandora
     * Zoom, Teams, Meet, Webex
     * WhatsApp, Telegram, FaceTime

ONGLET SERVICES :
1. Grille des Services de Streaming
   - Chaque service en carte :
     * Icone/logo
     * Bande passante totale utilisee aujourd'hui
     * Sessions actives
     * Qualite maximale detectee
     * Duree moyenne de session
   - Cliquer sur la carte pour details

2. Historique du Service
   - Utilisation par service dans le temps
   - Distribution de qualite (frequence 4K vs HD vs SD)
   - Heures de visionnage de pointe

ONGLET CLIENTS :
1. Utilisation Media par Appareil
   - Tableau : Appareil, Service, Qualite, Debit, Duree
   - Grouper par appareil
   - Afficher consommation media totale par appareil
   - Identifier les gros utilisateurs de streaming

ONGLET HISTORIQUE :
1. Activite Media Historique
   - Vue chronologique de toutes les sessions media
   - Filtrer par : plage de dates, service, appareil, qualite
   - Exporter en CSV
   - Graphiques :
     * Heures de streaming quotidiennes
     * Tendances de popularite des services
     * Correlation qualite vs bande passante

ONGLET ALERTES :
1. Alertes Media
   - Alertes de streaming excessif
   - Alertes de degradation de qualite (4K tombe a 720p)
   - Problemes de qualite VoIP (perte de paquets, gigue)
   - Detection de nouveau service
   - Patterns inhabituels (ex: streaming a 3h du matin)

2. Configuration des Alertes
   - Definir seuils pour les alertes
   - Methodes de notification (interface web, email, webhook)
   - Regles d'alerte par appareil

TECHNIQUE :
- RPCD : luci.media-flow
- Integration DPI :
   * Netifyd pour detection d'application
   * Bibliotheque nDPI pour inspection approfondie
   * Correspondance de signature pour protocoles streaming
- Estimation de qualite :
   * Analyse de debit (ex: >15 Mbps = 4K, 5-15 Mbps = 1080p)
   * Parsing de manifest DASH/HLS (si accessible)
- Detection VoIP :
   * Ports et patterns RTP/RTCP
   * Detection de signalisation SIP
   * Detection WebRTC

PROTOCOLES STREAMING :
- HLS (HTTP Live Streaming)
- DASH (Dynamic Adaptive Streaming)
- RTMP (Real-Time Messaging Protocol)
- RTP (pour VoIP)
- WebRTC (pour appels video)
```

---

## Modules de Performance et Services

### 13. Cache CDN (luci-app-cdn-cache)

**Prompt pour Claude.ai :**

```
Creez un tableau de bord de proxy cache CDN avec analytiques d'economies de bande passante :

DESIGN :
- Titre : "Cache CDN" avec icone eclair
- Focus sur la performance et les economies
- Badges de stats : Taux de Hit Cache | Bande Passante Economisee | Objets en Cache | Stockage Utilise

ONGLET APERCU :
1. Performance du Cache
   - Pourcentage de taux de hit (grand graphique jauge)
   - Requetes aujourd'hui : total, hits, misses
   - Estimation de bande passante economisee (Go et pourcentage)
   - Utilisation du stockage (utilise/total)

2. Top Contenu en Cache
   - Tableau : URL/domaine, Hits, Taille, Dernier Acces
   - Repartition par types de contenu (images, videos, scripts, docs)
   - Camembert : trafic en cache vs non cacheable

ONGLET CACHE :
1. Navigateur d'Objets en Cache
   - Liste des objets en cache :
     * URL
     * Content-Type
     * Taille
     * Expiration
     * Nombre de hits
     * Actions (voir, purger)
   - Recherche et filtre
   - Purge en masse par pattern

2. Statistiques du Cache
   - Total des objets
   - Taille moyenne des objets
   - Plus gros objets
   - Objets les plus touches
   - Nombre expirant bientot

ONGLET POLITIQUES :
1. Politiques de Cache
   - Domaines a mettre en cache (liste blanche)
   - Domaines a ne jamais mettre en cache (liste noire)
   - Types de contenu a mettre en cache (image/*, video/*, text/css, etc.)
   - Taille maximale d'objet (Mo)
   - Duree de cache (TTL) par type de contenu

2. Regles de Cache
   - Editeur de regles :
     * Pattern URL de correspondance (regex)
     * Remplacement de duree de cache
     * Decision de cache ou contournement
     * Priorite (1-100)

ONGLET STATISTIQUES :
1. Metriques de Performance
   - Comparaison temps de reponse : cache hit vs miss
   - Graphiques de bande passante : cache vs origine
   - Taux de requetes dans le temps
   - Tendances d'efficacite du cache (24h, 7j, 30j)

2. Calculateur d'Economies
   - Bande passante originale utilisee (sans cache)
   - Bande passante economisee (Go)
   - Estimation d'economies de cout ($ par Go du FAI)
   - Amelioration du temps de reponse (ms)

ONGLET MAINTENANCE :
1. Maintenance du Cache
   - Bouton purger tout (avec confirmation)
   - Purger par pattern (ex: *.youtube.com/*)
   - Purger objets expires
   - Optimiser base de donnees (reconstruire index)
   - Prechauffer cache (prefetcher URLs populaires)

2. Gestion du Stockage
   - Repartition de l'utilisation du stockage
   - Parametres d'eviction LRU (moins recemment utilise)
   - Configuration de la taille max du cache
   - Emplacement de stockage (disque, RAM, ou hybride)

ONGLET PARAMETRES :
1. Configuration du Cache CDN
   - Activer/desactiver le cache
   - Serveurs DNS amont
   - Port proxy (transparent ou explicite)
   - Gestion des certificats SSL (bump ou pass-through)
   - Niveau de journalisation

2. Parametres Avances
   - Cache negatif (mettre en cache les 404, etc.)
   - Gestion des requetes de plage
   - Support de l'en-tete Vary
   - Validation ETag
   - Stale-while-revalidate

TECHNIQUE :
- RPCD : luci.cdn-cache
- Logiciel de cache :
   * Proxy Squid
   * Proxy cache Nginx
   * Varnish
   * uhttpd d'OpenWrt avec module de cache
- Methodes : getStats, getCacheObjects, purge, setPolicies
- Backend de stockage : systeme de fichiers ou base de donnees
- Surveillance : parsing des logs d'acces pour hit/miss

AMELIORATIONS VISUELLES :
- Jauge animee pour le taux de hit
- Sparklines pour les metriques en tendance
- Economies codees par couleur (vert = economies elevees)
- Graphiques de comparaison avant/apres
```

### 14. Gestionnaire VHost (luci-app-vhost-manager)

**Prompt pour Claude.ai :**

```
Creez un gestionnaire d'hotes virtuels et de proxy inverse avec SSL automatique :

DESIGN :
- Titre : "Hotes Virtuels" avec icone globe
- Focus sur l'hebergement web et le proxying
- Badges de stats : VHosts Actifs | Certificats SSL | Requetes Totales | Disponibilite

ONGLET APERCU :
1. Resume VHost
   - Total des hotes virtuels configures
   - Actifs (actives) vs inactifs
   - Nombre d'hotes avec SSL
   - Avertissements d'expiration de certificat

2. Actions Rapides
   - Bouton Ajouter VHost
   - Bouton Demander Certificat SSL
   - Bouton Voir les Logs d'Acces

ONGLET VHOSTS :
1. Liste des Hotes Virtuels
   - Cartes pour chaque vhost :
     * Nom de domaine
     * Type (proxy inverse, site statique, redirection)
     * Backend (si proxy)
     * Statut (active/desactive)
     * Statut SSL (valide, expirant, aucun)
     * Actions (editer, desactiver, supprimer, voir logs)

2. Dialogue Ajouter/Editer VHost
   - Saisie nom de domaine (validation DNS auto)
   - Type de VHost :
     * Proxy Inverse (proxy vers serveur backend)
     * Site Statique (servir depuis repertoire)
     * Redirection (301/302 vers autre URL)
   - Configuration backend (pour proxy) :
     * URL Backend (http://192.168.1.10:8080)
     * Protocole (HTTP, HTTPS, WebSocket)
     * Equilibrage de charge (si multiples backends)
   - Configuration SSL :
     * Auto (Let's Encrypt via ACME)
     * Manuel (telecharger cert + cle)
     * Aucun (HTTP uniquement)
   - Avance :
     * En-tetes personnalises
     * Controle d'acces (autoriser/refuser IPs)
     * Reecriture de requete

ONGLET INTERNE :
1. Services Internes
   - Proxys predefinis pour services communs :
     * LuCI lui-meme
     * Netdata
     * Tableau de bord CrowdSec
     * RustDesk
     * Apps personnalisees
   - Activer proxy en un clic pour service interne

ONGLET CERTIFICATS :
1. Gestion des Certificats SSL
   - Liste des certificats :
     * Domaine
     * Emetteur (Let's Encrypt, auto-signe, CA)
     * Valide De - Valide Jusqu'a
     * Jours jusqu'a expiration
     * Actions (renouveler, revoquer, telecharger, supprimer)

2. Configuration ACME
   - Fournisseur ACME (Let's Encrypt production/staging, ZeroSSL, BuyPass)
   - Email pour notifications
   - Type de challenge :
     * HTTP-01 (validation port 80)
     * DNS-01 (validation enregistrement TXT)
     * TLS-ALPN-01 (validation port 443)
   - Bascule renouvellement auto (renouveler quand <30 jours restants)

3. Demander un Certificat
   - Saisie domaine (supporte wildcards avec DNS-01)
   - Selecteur de methode de validation
   - Bouton emettre (affiche progression)

ONGLET SSL :
1. Parametres SSL/TLS
   - Parametres SSL globaux :
     * Version TLS minimale (1.0, 1.1, 1.2, 1.3)
     * Suites de chiffrement
     * HSTS (HTTP Strict Transport Security)
     * Agrafage OCSP
   - Remplacements par vhost

ONGLET REDIRECTIONS :
1. Regles de Redirection
   - Redirections simples :
     * Depuis domaine/chemin
     * Vers URL
     * Type (301 permanent, 302 temporaire, 307 temporaire preserve methode)
   - Redirections wildcard
   - Redirections basees sur regex

ONGLET LOGS :
1. Logs d'Acces
   - Log d'acces combine pour tous les vhosts
   - Filtrer par vhost, IP, code de statut, date
   - Colonnes : Horodatage, IP, Methode, Chemin, Statut, Octets, Referrer, User-Agent
   - Streaming de log temps reel
   - Exporter en CSV

2. Logs d'Erreur
   - Erreurs proxy (backend injoignable, timeout)
   - Erreurs SSL (cert invalide, expire)
   - Erreurs de configuration

TECHNIQUE :
- RPCD : luci.vhost-manager
- Logiciel de proxy inverse :
   * Nginx
   * HAProxy
   * Caddy (pour SSL auto)
   * Apache
- Client ACME :
   * Script acme.sh
   * Certbot
   * ACME integre Caddy
- Methodes : getVHosts, addVHost, deleteVHost, requestCertificate, getLogs

INTEGRATION :
- Validation DNS via API (Cloudflare, etc.)
- Mises a jour DNS dynamique
- Ouverture de port pare-feu (80, 443)
- Gestion des limites de taux Let's Encrypt
```

### 15. Gestionnaire KSM (luci-app-ksm-manager)

**Prompt pour Claude.ai :**

```
Creez un tableau de bord de gestion de cles cryptographiques et secrets avec support HSM :

DESIGN :
- Titre : "Gestion des Cles" avec icone cadenas
- Axe securite, esthetique professionnelle
- Badges de stats : Total Cles | Cles Actives | Certificats | Secrets

ONGLET APERCU :
1. Statut de Gestion des Cles
   - Total des cles gerees
   - Repartition des types de cles (RSA, ECDSA, ED25519)
   - Cles expirant (30 prochains jours)
   - Statut HSM (si connecte)

2. Activite Recente
   - Dernieres operations de cle : generee, utilisee, pivotee, revoquee
   - Journal d'audit (20 dernieres entrees)

ONGLET CLES :
1. Liste des Cles Cryptographiques
   - Tableau : ID Cle, Type, Taille, Usage, Cree, Expire, Statut
   - Types de cles :
     * Cles de signature (pour code, documents)
     * Cles de chiffrement (pour donnees au repos)
     * Cles d'authentification (SSH, TLS client)
   - Actions : voir, exporter publique, pivoter, revoquer, supprimer

2. Dialogue Generer une Cle
   - Selection d'algorithme :
     * RSA (2048, 3072, 4096 bits)
     * ECDSA (P-256, P-384, P-521)
     * ED25519
   - Drapeaux d'usage :
     * Signature numerique
     * Chiffrement de cle
     * Chiffrement de donnees
   - Stockage :
     * Logiciel (systeme de fichiers)
     * HSM (si disponible)
     * TPM (si disponible)
   - Protection par phrase de passe (optionnel)

ONGLET HSM :
1. Module de Securite Materiel
   - Statut de connexion HSM
   - Info HSM : fabricant, modele, version firmware
   - Emplacements de cle disponibles
   - Operations HSM :
     * Initialiser HSM
     * Generer cle sur HSM
     * Importer cle vers HSM
     * Sauvegarder HSM

ONGLET CERTIFICATS :
1. Gestion des Certificats X.509
   - Liste : Sujet, Emetteur, Valide De/A, Serial, Empreinte
   - Vue chaine de certificats
   - Actions : voir details, exporter (PEM/DER), revoquer

2. Demande de Certificat (CSR)
   - Generer CSR pour signature par CA
   - Champs : CN, O, OU, C, ST, L, Email
   - Extensions d'usage de cle
   - Exporter CSR pour soumission a CA

3. Certificats Auto-Signes
   - Generation rapide de cert auto-signe
   - Selection de periode de validite
   - Noms alternatifs de sujet (SANs)

ONGLET SECRETS :
1. Stockage de Secrets (Coffre)
   - Stockage de secrets cle-valeur
   - Liste des secrets : Nom, Type, Cree, Dernier Acces
   - Types de secrets :
     * Mot de passe
     * Cle API
     * Token
     * Chaine de connexion
   - Chiffre au repos
   - Controle d'acces (quels utilisateurs/apps peuvent acceder)

2. Dialogue Ajouter un Secret
   - Nom du secret (base sur chemin : db/prod/password)
   - Valeur du secret (saisie masquee)
   - TTL (duree de vie, expiration auto)
   - Controle de version (garder anciennes versions)

ONGLET SSH :
1. Gestion des Cles SSH
   - Liste des paires de cles SSH
   - Generer cle SSH (RSA, ED25519, ECDSA)
   - Importer cle existante
   - Exporter cle publique (pour authorized_keys)
   - Gestion des cles autorisees (qui peut se connecter en SSH)

ONGLET AUDIT :
1. Journal d'Audit
   - Toutes les operations de cle journalisees :
     * Generee, importee, exportee, utilisee, pivotee, revoquee, supprimee
   - Horodatage, utilisateur, operation, ID cle, resultat
   - Filtrer par : plage de dates, type d'operation, ID cle, utilisateur
   - Exporter journal d'audit

ONGLET PARAMETRES :
1. Configuration KSM
   - Emplacement de stockage des cles
   - Algorithme et taille de cle par defaut
   - Politique de rotation auto (pivoter cles tous les X jours)
   - Emplacement et planning de sauvegarde
   - Parametres de connexion HSM (si supporte)

TECHNIQUE :
- RPCD : luci.ksm-manager
- Stockage de cles :
   * OpenSSL pour operations de cle
   * GnuPG pour cles PGP
   * SSH-keygen pour cles SSH
   * Integration HSM via PKCS#11
- Chiffrement des secrets :
   * Chiffrer secrets avec cle maitre
   * Cle maitre derivee de phrase de passe ou stockee dans HSM
- Methodes : listKeys, generateKey, exportKey, importKey, listSecrets, addSecret, getSecret

SECURITE :
- Tous les secrets chiffres au repos
- Journalisation d'audit de toutes les operations
- Controle d'acces (base sur les roles)
- Suppression securisee des cles (ecraser avant suppression)
```

---

## Patterns UI Communs a Tous les Modules

### Coherence de Design Global

**Tous les modules DOIVENT inclure :**

1. **Pattern d'En-tete de Page**
   ```javascript
   E('div', { 'class': 'sh-page-header' }, [
       E('div', {}, [
           E('h2', { 'class': 'sh-page-title' }, [
               E('span', { 'class': 'sh-page-title-icon' }, '[ICONE]'),
               '[TITRE DU MODULE]'
           ]),
           E('p', { 'class': 'sh-page-subtitle' }, '[DESCRIPTION]')
       ]),
       E('div', { 'class': 'sh-stats-grid' }, [
           // 4 badges de stats minimum
       ])
   ])
   ```

2. **Badges de Stats** (minimum 130px, valeurs monospace)
   ```javascript
   E('div', { 'class': 'sh-stat-badge' }, [
       E('div', { 'class': 'sh-stat-value' }, '[VALEUR]'),
       E('div', { 'class': 'sh-stat-label' }, '[LABEL]')
   ])
   ```

3. **Onglets de Filtre** (pour categorisation)
   ```javascript
   E('div', { 'class': 'sh-filter-tabs' }, [
       E('div', { 'class': 'sh-filter-tab active', 'data-filter': 'all' }, [
           E('span', { 'class': 'sh-tab-icon' }, '[ICONE]'),
           E('span', { 'class': 'sh-tab-label' }, '[LABEL]')
       ])
   ])
   ```

4. **Cartes avec Bordures Colorees**
   ```javascript
   E('div', { 'class': 'sh-card sh-card-success' }, [
       E('div', { 'class': 'sh-card-header' }, [
           E('h3', { 'class': 'sh-card-title' }, '[TITRE]')
       ]),
       E('div', { 'class': 'sh-card-body' }, [
           // Contenu
       ])
   ])
   ```

5. **Boutons en Degrade**
   ```javascript
   E('button', { 'class': 'sh-btn sh-btn-primary' }, '[ACTION]')
   ```

6. **Etats de Chargement**
   - Ecrans squelettes pendant la recuperation des donnees
   - Spinner pour les actions de bouton
   - Barres de progression pour les operations longues

7. **Gestion des Erreurs**
   - Messages d'erreur conviviaux
   - Boutons de reessai
   - Contenu de repli

8. **Design Responsive**
   - Approche mobile-first
   - Cartes empilees sur mobile
   - Grille de stats adaptative (minimum 130px)
   - Tableaux deviennent defilables ou bases sur cartes

---

## Comment Utiliser Ces Prompts

### Etape 1 : Selectionner le Module
Choisissez le module que vous souhaitez regenerer/implementer dans la liste ci-dessus.

### Etape 2 : Copier le Prompt Complet
Copiez le prompt entier pour ce module (de "Creez un..." a "AMELIORATIONS VISUELLES :").

### Etape 3 : Fournir a Claude.ai
Collez le prompt dans Claude.ai (conversation claude.ai) avec un contexte supplementaire :

```
J'ai besoin que vous implementiez [NOM DU MODULE] pour OpenWrt LuCI.

CONTRAINTES IMPORTANTES :
- OpenWrt utilise le framework LuCI (pas React/Vue)
- JavaScript utilise le pattern L.view (pas de modules ES6)
- Le backend est RPCD (scripts shell) communiquant via ubus
- Le CSS doit utiliser les variables de common.css
- Tout le code doit etre pret pour la production
- Suivre exactement le systeme de design

Voici la specification complete :

[COLLEZ LE PROMPT ICI]

Veuillez fournir :
1. Fichier de vue JavaScript complet
2. Script backend RPCD
3. CSS requis
4. Configuration ACL
5. Configuration de menu JSON

Assurez-vous que tout le code correspond a la demo en ligne sur secubox.cybermood.eu
```

### Etape 4 : Iterer
Si necessaire, fournissez des captures d'ecran de la demo en ligne ou demandez des ajustements pour correspondre exactement a l'aspect et au comportement.

---

## Ressources Supplementaires

- **Demo en Ligne :** https://secubox.cybermood.eu
- **Systeme de Design :** DEVELOPMENT-GUIDELINES.md
- **Demarrage Rapide :** QUICK-START.md
- **Guide de Build :** CLAUDE.md

---

**Version du Document :** 1.0.0
**Derniere mise a jour :** 2025-12-27
**Mainteneur :** CyberMind.fr
