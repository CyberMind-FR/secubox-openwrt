# Index de la Documentation SecuBox

**Langue :** [English](../docs/documentation-index.md) | Francais | [Chinese](../docs-zh/documentation-index.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif
**Documentation complete du projet SecuBox OpenWrt**

---

## Apercu de la Documentation

Cet index fournit un acces rapide a toute la documentation SecuBox. Choisissez le document correspondant a vos besoins :

---

## Politique de Version et de Statut

Chaque document Markdown dans SecuBox doit commencer par des metadonnees pour que les contributeurs voient immediatement la fraicheur :

- Inclure `Version`, `Derniere mise a jour` (AAAA-MM-JJ), et `Statut` (Actif | Brouillon | Archive).
- Les nouveaux documents ou documents regeneres commencent a `Version 1.0.0` ; incrementer les numeros mineurs/patch pour les mises a jour incrementales, majeurs pour les reecritures structurelles.
- Lors de la modification d'un document, mettre a jour la date `Derniere mise a jour` et garder les statuts synchronises avec le plan d'archivage decrit dans `TODO-ANALYSE.md`.

Suivez ce modele lors de la creation ou revision de la documentation :

```
# Titre

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif
```

---

## Pour Commencer

### Pour les Nouveaux Contributeurs
1. Commencez par **[QUICK-START.md](quick-start.md)** - Regles et commandes essentielles
2. Lisez **[DEVELOPMENT-GUIDELINES.md](../docs/development-guidelines.md)** - Guide de developpement complet
3. Consultez **[CLAUDE.md](../docs/claude.md)** - Systeme de build et architecture

### Pour le Developpement Assiste par IA
1. Utilisez **[MODULE-IMPLEMENTATION-GUIDE.md](../docs/module-implementation-guide.md)** - Flux de travail etape par etape
2. Copiez les prompts de **[FEATURE-REGENERATION-PROMPTS.md](../docs/feature-regeneration-prompts.md)**
3. Referencez **[CODE-TEMPLATES.md](../docs/code-templates.md)** pour les patterns d'implementation

### Pour la Modification de Modules Existants
1. Verifiez **[QUICK-START.md](quick-start.md)** - Corrections rapides et commandes courantes
2. Executez la validation : `./secubox-tools/validate-modules.sh`
3. Consultez **[DEVELOPMENT-GUIDELINES.md](../docs/development-guidelines.md)** pour des sujets specifiques

---

## Descriptions des Documents

### 1. Documents de Reference Rapide

#### **QUICK-START.md**
*Reference rapide pour les taches courantes - Lisez ceci en premier !*

**Contenu :**
- Regles critiques de nommage (RPCD, chemins de menu, permissions)
- Essentiels du systeme de design (couleurs, polices, classes CSS)
- Commandes courantes (validation, build, deploiement, debogage)
- Templates de code rapides (RPCD, Vue, En-tetes, Cartes)
- Corrections rapides d'erreurs

**Quand l'utiliser :** Developpement quotidien, recherches rapides, debogage

---

#### **CODEX.md**
*Manuel de terrain pour les agents Codex/automatisation*

**Contenu :**
- Contexte du depot et carte des documents
- Standards non-negociables de build/design
- Template de prompt pour les workflows LLM
- Pointeurs d'aide et depannage
- Radar TODO de documentation et historique

**Quand l'utiliser :** Avant de lancer des modifications assistees par Codex/IA, lors de la creation de prompts, ou pour aligner le travail avec les initiatives de documentation en cours

---

#### **README.md**
*Apercu du projet et matrice de compatibilite*

**Contenu :**
- Description du projet et fonctionnalites
- Compatibilite des versions OpenWrt (24.10.x, 25.12.0-rc1, etc.)
- Support des formats de paquets (.ipk vs .apk)
- Instructions d'installation
- Categories et descriptions des modules

**Quand l'utiliser :** Apercu du projet, verifications de compatibilite de version

---

### 2. Documents de Reference Complets

#### **DEVELOPMENT-GUIDELINES.md**
*Guide de developpement complet - La reference definitive*

**Contenu :**
- **Systeme de Design** : Palettes de couleurs, typographie, bibliotheque de composants
- **Architecture** : Structure des fichiers, conventions de nommage, patterns RPCD
- **Bonnes Pratiques** : Standards RPCD, ubus, ACL, JavaScript, CSS
- **Erreurs Courantes** : Diagnostics et solutions pour les problemes typiques
- **Validation** : Checklists pre-commit, pre-deploiement, post-deploiement
- **Deploiement** : Procedures de deploiement etape par etape

**Quand l'utiliser :** Questions techniques detaillees, decisions de design, depannage

**Taille :** Complet (~500+ lignes)

---

#### **CLAUDE.md**
*Reference du systeme de build, architecture et CI/CD*

**Contenu :**
- Commandes de build du SDK OpenWrt
- Procedures de test des paquets
- Outils et workflows de validation
- Structure des paquets LuCI
- Communication frontend-backend
- Conventions de nommage critiques
- Integration CI/CD (GitHub Actions)
- Problemes courants et solutions

**Quand l'utiliser :** Problemes de build, workflows CI/CD, questions d'architecture

---

### 3. Documents d'Implementation et de Regeneration

#### **MODULE-IMPLEMENTATION-GUIDE.md**
*Guide maitre pour l'implementation/regeneration de modules*

**Contenu :**
- Workflow etape par etape pour regenerer les modules
- Comment utiliser Claude.ai pour la generation de code
- Exemple d'implementation complet (du prompt au deploiement)
- Patterns d'implementation courants (tableaux de bord multi-onglets, filtres, formulaires)
- Notes specifiques aux modules (System Hub, WireGuard, CrowdSec, etc.)
- Guide de depannage avec solutions
- Bonnes pratiques (organisation du code, gestion des erreurs, performance, UX)
- Checklist de deploiement

**Quand l'utiliser :** Implementation de nouveaux modules, regeneration de modules existants, utilisation d'assistance IA

**Taille :** Guide complet (~800+ lignes)

---

#### **FEATURE-REGENERATION-PROMPTS.md**
*Prompts prets a l'emploi pour les 15 modules SecuBox*

**Contenu :**
- Reference du systeme de design (variables CSS, typographie, composants)
- Prompts complets pour les 15 modules :
  1. SecuBox Central Hub
  2. System Hub (9 onglets)
  3. Tableau de bord CrowdSec
  4. Tableau de bord Netdata
  5. Tableau de bord Netifyd
  6. Modes Reseau
  7. Tableau de bord WireGuard
  8. Client Guardian
  9. Auth Guardian
  10. Gestionnaire de Bande Passante
  11. Traffic Shaper
  12. Media Flow
  13. CDN Cache
  14. Gestionnaire VHost
  15. Gestionnaire KSM
- Patterns UI communs a tous les modules
- Instructions d'utilisation pour Claude.ai

**Quand l'utiliser :** Faire generer du code de module par l'IA, comprendre les exigences des modules

**Taille :** Extensif (~2000+ lignes)

---

#### **CODE-TEMPLATES.md**
*Templates de code fonctionnels extraits des modules de production*

**Contenu :**
- Template de structure de fichiers
- Template de module API (api.js)
- Template de vue JavaScript (overview.js)
- Template backend RPCD (script shell)
- Template JSON de menu
- Template JSON ACL
- Template de style CSS
- Exemple minimal complet fonctionnel
- Pieges courants et solutions
- Checklist de validation

**Quand l'utiliser :** Implementation manuelle, comprehension des patterns, copie de code boilerplate

**Taille :** Templates detailles (~1200+ lignes)

---

### 4. Guides de Deploiement Embarque

#### **embedded/docker-zigbee2mqtt.md**
*Deployer Zigbee2MQTT via Docker sur SecuBox (ARM64).*

Pointeur : voir `docs/embedded/docker-zigbee2mqtt.md` pour la version canonique.

#### **embedded/vhost-manager.md**
*Comment publier des services via nginx en utilisant le gestionnaire vhost et l'assistant CLI.*

Pointeur : voir `docs/embedded/vhost-manager.md` pour la version canonique.

#### **embedded/app-store.md**
*Schema de manifeste, utilisation CLI `secubox-app`, et applications SecuBox packagees (Zigbee2MQTT, Lyrion, Domoticz).*

Pointeur : voir `docs/embedded/app-store.md` pour la version canonique.

#### **embedded/wizard-profiles.md**
*Assistant de premiere execution et profils de type OS.*

Pointeur : voir `docs/embedded/wizard-profiles.md` pour la version canonique.

#### **embedded/lyrion-docker.md**
*Deployer Lyrion Media Server via Docker.*

Pointeur : voir `docs/embedded/lyrion-docker.md` pour la version canonique.

#### **embedded/domoticz-docker.md**
*Deployer la domotique Domoticz via Docker.*

Pointeur : voir `docs/embedded/domoticz-docker.md` pour la version canonique.

---

### 5. Documentation des Outils et Scripts

#### **secubox-tools/README.md**
*Documentation des outils de validation et de build*

**Contenu :**
- Descriptions des outils (validate-modules.sh, local-build.sh, etc.)
- Exemples d'utilisation pour chaque outil
- Architectures et appareils supportes
- Workflows de build de paquets
- Workflows de build de firmware
- Verifications de validation (7 verifications automatisees)
- Workflows recommandes
- Corrections courantes

**Quand l'utiliser :** Utilisation des outils de validation, builds locaux, generation de firmware

---

### 6. Demo Live et Exemples

#### **Site Web de Demo Live**
*Demo de production de tous les modules*

**URL :** https://secubox.cybermood.eu

**Demos Disponibles :**
- Tableau de bord principal : `/`
- System Hub : `/system-hub`
- CrowdSec : `/crowdsec`
- WireGuard : `/wireguard`
- Tous les 15 modules accessibles

**Quand l'utiliser :** Reference visuelle, comprehension UI/UX, test des fonctionnalites

---

## Recherche Rapide par Tache

### Je veux...

#### ...creer un nouveau module de zero
1. Lire : **MODULE-IMPLEMENTATION-GUIDE.md** (Workflow etape par etape)
2. Copier le prompt de : **FEATURE-REGENERATION-PROMPTS.md**
3. Utiliser les templates de : **CODE-TEMPLATES.md**
4. Valider avec : `./secubox-tools/validate-modules.sh`

#### ...regenerer un module existant
1. Lire : **MODULE-IMPLEMENTATION-GUIDE.md** (Section : "Etape par Etape : Regenerer un Module avec Claude.ai")
2. Copier la specification du module de : **FEATURE-REGENERATION-PROMPTS.md**
3. Utiliser Claude.ai ou copier les templates de : **CODE-TEMPLATES.md**
4. Valider et deployer selon : **MODULE-IMPLEMENTATION-GUIDE.md**

#### ...corriger l'erreur RPCD "Object not found"
1. Correction rapide : **QUICK-START.md** (Section Corrections Rapides d'Erreurs)
2. Depannage detaille : **DEVELOPMENT-GUIDELINES.md** (Section Erreurs Courantes)
3. Ou : **MODULE-IMPLEMENTATION-GUIDE.md** (Guide de Depannage)

#### ...comprendre le systeme de design
1. Reference rapide : **QUICK-START.md** (Essentiels du Systeme de Design)
2. Guide complet : **DEVELOPMENT-GUIDELINES.md** (Systeme de Design et Directives UI)
3. Voir des exemples live : **https://secubox.cybermood.eu**

#### ...build des paquets localement
1. Commandes rapides : **QUICK-START.md** (Section Build & Deploiement)
2. Guide complet : **secubox-tools/README.md**
3. Details d'architecture : **CLAUDE.md** (Section Commandes de Build)

#### ...valider mes changements avant commit
1. Executer : `./secubox-tools/fix-permissions.sh --local`
2. Executer : `./secubox-tools/validate-modules.sh`
3. Consulter la checklist : **DEVELOPMENT-GUIDELINES.md** (Checklist de Validation)

#### ...comprendre la configuration des menus et ACL
1. Templates rapides : **CODE-TEMPLATES.md** (Template JSON Menu, Template JSON ACL)
2. Guide detaille : **DEVELOPMENT-GUIDELINES.md** (Architecture et Conventions de Nommage)
3. Exemples fonctionnels : Regarder dans n'importe quel repertoire `luci-app-*/root/usr/share/`

#### ...deployer sur le routeur de test
1. Commandes rapides : **QUICK-START.md** (Commandes Courantes)
2. Etape par etape : **MODULE-IMPLEMENTATION-GUIDE.md** (Section Deployer sur le Routeur de Test)
3. Corriger les permissions apres deploiement : `./secubox-tools/fix-permissions.sh --remote`

#### ...comprendre le systeme de variables CSS
1. Reference rapide : **QUICK-START.md** (Section Variables CSS)
2. Guide complet : **DEVELOPMENT-GUIDELINES.md** (Standards CSS/Style)
3. Template : **CODE-TEMPLATES.md** (Template de Style CSS)
4. CSS live : `luci-app-system-hub/htdocs/luci-static/resources/system-hub/common.css`

#### ...ecrire un script backend RPCD
1. Template : **CODE-TEMPLATES.md** (Template Backend RPCD)
2. Bonnes pratiques : **DEVELOPMENT-GUIDELINES.md** (Bonnes Pratiques RPCD & ubus)
3. Exemples fonctionnels : Regarder dans n'importe quel repertoire `luci-app-*/root/usr/libexec/rpcd/`

#### ...creer un tableau de bord multi-onglets
1. Pattern : **MODULE-IMPLEMENTATION-GUIDE.md** (Pattern 1 : Tableau de Bord Multi-Onglets)
2. Exemple : Voir `luci-app-system-hub` (9 onglets)
3. Demo live : https://secubox.cybermood.eu/system-hub

---

## Matrice de Comparaison de la Documentation

| Document | Taille | Portee | Cas d'Usage | Public |
|----------|--------|--------|-------------|--------|
| **QUICK-START.md** | Petit | Reference rapide | Developpement quotidien | Tous les developpeurs |
| **README.md** | Petit | Apercu du projet | Premiere introduction | Nouveaux contributeurs |
| **DEVELOPMENT-GUIDELINES.md** | Grand | Reference complete | Questions detaillees | Tous les developpeurs |
| **CLAUDE.md** | Moyen | Build & architecture | Problemes Build/CI/CD | Developpeurs, DevOps |
| **MODULE-IMPLEMENTATION-GUIDE.md** | Grand | Workflow d'implementation | Creation de modules | Dev assiste par IA |
| **FEATURE-REGENERATION-PROMPTS.md** | Tres Grand | Specifications de modules | Prompts IA | Dev assiste par IA |
| **CODE-TEMPLATES.md** | Grand | Templates de code | Codage manuel | Developpeurs |
| **secubox-tools/README.md** | Moyen | Documentation des outils | Utilisation des outils | Developpeurs, DevOps |

---

## Workflow de Mise a Jour de la Documentation

Lors de modifications de la base de code :

1. **Mettre a jour le code** dans les fichiers du module
2. **Executer la validation** : `./secubox-tools/validate-modules.sh`
3. **Mettre a jour la documentation** si :
   - Nouveau pattern introduit -> Ajouter a **CODE-TEMPLATES.md**
   - Nouvelle directive de design -> Mettre a jour **DEVELOPMENT-GUIDELINES.md**
   - Nouvelle erreur courante -> Ajouter a **QUICK-START.md** et **DEVELOPMENT-GUIDELINES.md**
   - Nouveau module -> Ajouter a **FEATURE-REGENERATION-PROMPTS.md**
   - Nouvelle fonctionnalite de build -> Mettre a jour **CLAUDE.md** et **secubox-tools/README.md**
4. **Mettre a jour la version** et la date dans les documents modifies
5. **Commiter** la documentation avec les changements de code

---

## Support et Contact

- **Problemes de Documentation :** Creer une issue sur [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- **Support Technique :** support@cybermind.fr
- **Demo Live :** https://secubox.cybermood.eu
- **Societe :** CyberMind.fr

---

## Parcours d'Apprentissage

### Debutant (Nouveau sur SecuBox)
1. Jour 1 : Lire **README.md** + **QUICK-START.md**
2. Jour 2 : Parcourir **DEVELOPMENT-GUIDELINES.md** (focus sur le Systeme de Design et l'Architecture)
3. Jour 3 : Suivre **MODULE-IMPLEMENTATION-GUIDE.md** pour implementer un module simple
4. Jour 4 : Etudier les modules existants (commencer par `luci-app-cdn-cache` - le plus simple)
5. Jour 5 : Faire sa premiere contribution

### Intermediaire (Familier avec OpenWrt/LuCI)
1. Lire **DEVELOPMENT-GUIDELINES.md** (document complet)
2. Consulter **CODE-TEMPLATES.md** pour les patterns
3. Utiliser **FEATURE-REGENERATION-PROMPTS.md** avec Claude.ai pour generer un module
4. Etudier **CLAUDE.md** pour les details du systeme de build
5. Contribuer de nouveaux modules ou ameliorer les existants

### Avance (Pret pour les Modules Complexes)
1. Etudier les modules complexes : System Hub, Network Modes
2. Lire toute la documentation pour une comprehension complete
3. Utiliser les patterns de **MODULE-IMPLEMENTATION-GUIDE.md** pour les fonctionnalites avancees
4. Contribuer au systeme de design central et aux outils
5. Aider aux ameliorations de la documentation

---

## Historique des Versions

| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | 2025-12-27 | Publication initiale de la documentation complete |
|  |  | - Creation de FEATURE-REGENERATION-PROMPTS.md (15 modules) |
|  |  | - Creation de CODE-TEMPLATES.md (templates complets) |
|  |  | - Creation de MODULE-IMPLEMENTATION-GUIDE.md (guide maitre) |
|  |  | - Creation de DOCUMENTATION-INDEX.md (ce fichier) |
|  |  | - Amelioration de la documentation existante |

---

## Objectifs de Qualite de la Documentation

- **Exhaustivite :** Tous les aspects du developpement SecuBox couverts
- **Exactitude :** Exemples de code testes et fonctionnels
- **Clarte :** Explications claires avec exemples
- **Maintenabilite :** Facile a mettre a jour au fur et a mesure de l'evolution de la base de code
- **Accessibilite :** Multiples points d'entree pour differents cas d'usage
- **Adapte a l'IA :** Structure pour le developpement assiste par IA

---

**Derniere mise a jour :** 2025-12-27
**Mainteneur :** CyberMind.fr
**Licence :** Apache-2.0
