# Documentation SecuBox

🌐 **Langues :** [English](../docs/index.md) | Français | [中文](../docs-zh/index.md)

**Version :** 1.0.0
**Dernière mise à jour :** 2025-12-28
**Projet :** Suite de Sécurité et Gestion LuCI pour OpenWrt

Bienvenue dans la documentation SecuBox ! Ce guide complet couvre tous les aspects du développement, déploiement et maintenance des modules SecuBox.

---

## 🏗️ Qu'est-ce que SecuBox ?

SecuBox est une **suite complète de sécurité et de gestion réseau pour OpenWrt** composée de **15 modules d'application LuCI** qui fournissent :

- **Surveillance de Sécurité** - Prévention d'intrusion CrowdSec, métriques Netdata
- **Intelligence Réseau** - Inspection profonde des paquets, classification du trafic
- **Contrôle d'Accès** - Portail captif, authentification, gestion VPN
- **Optimisation des Performances** - QoS, gestion de bande passante, cache
- **Administration Système** - Tableau de bord centralisé, gestion des services

---

## 🚀 Navigation Rapide

### Démarrage Rapide

Nouveau sur SecuBox ? Commencez ici !

[Guide de Démarrage Rapide](quick-start.md)

### Guide de Développement

Référence complète de développement avec diagrammes d'architecture

[Directives de Développement](development-guidelines.md)

### Modèles de Code

Exemples fonctionnels et patterns d'implémentation

[Modèles de Code](code-templates.md)

### Validation

Workflows de validation et test des modules

[Guide de Validation](validation-guide.md)

---

## 📦 Suite de 15 Modules

### Contrôle Central (2 modules)
- **Hub Central SecuBox** - Tableau de bord principal et gestion des modules
- **Hub Système** - Administration système (santé, services, logs, sauvegarde, etc.)

### Sécurité & Surveillance (2 modules)
- **Tableau de Bord CrowdSec** - Prévention d'intrusion et renseignement sur les menaces
- **Tableau de Bord Netdata** - Surveillance système en temps réel

### Intelligence Réseau (2 modules)
- **Tableau de Bord Netifyd** - Inspection et classification profonde des paquets
- **Modes Réseau** - Gestion des profils réseau

### VPN & Contrôle d'Accès (3 modules)
- **Tableau de Bord WireGuard** - Gestion des tunnels VPN
- **Gardien Client** - Contrôle d'accès réseau et portail captif
- **Gardien Auth** - Système d'authentification

### Bande Passante & Trafic (2 modules)
- **Gestionnaire de Bande Passante** - QoS et quotas de bande passante
- **Mise en Forme du Trafic** - Mise en forme avancée du trafic

### Performance & Services (2 modules)
- **Cache CDN** - Cache proxy de réseau de diffusion de contenu
- **Gestionnaire VHost** - Configuration des hôtes virtuels

### Optimisation Système (2 modules)
- **Flux Média** - Optimisation du trafic média
- **Gestionnaire KSM** - Fusion de pages mémoire identiques du noyau

[Voir le Statut des Modules →](module-status.md)

---

## 🎨 Système de Design

SecuBox utilise un système de design moderne et cohérent :

- **Palette de Couleurs :** Dégradés Indigo/Violet avec support mode sombre
- **Typographie :** Inter (texte) + JetBrains Mono (code/valeurs)
- **Composants :** Cartes, badges, boutons avec effets de dégradé
- **Mise en Page :** Système de grille responsive

Voir la [section Système de Design](development-guidelines.md#design-system-ui-guidelines) pour les spécifications complètes.

---

## 🔧 Workflow de Développement

!!! warning "Règles Critiques"
    1. **Nommage RPCD :** Le nom du script doit correspondre à l'objet ubus (`luci.module-name`)
    2. **Chemins Menu :** Doivent correspondre exactement aux emplacements des fichiers de vue
    3. **Permissions :** 755 pour les scripts RPCD, 644 pour CSS/JS
    4. **Validation :** Toujours exécuter `./secubox-tools/validate-modules.sh` avant commit

### Outils de Développement

```bash
# Valider tous les modules (7 vérifications automatisées)
./secubox-tools/validate-modules.sh

# Corriger automatiquement les permissions de fichiers
./secubox-tools/fix-permissions.sh --local

# Compiler les paquets localement
./secubox-tools/local-build.sh build luci-app-module-name
```

[Workflow de Développement Complet →](development-guidelines.md#deployment-procedures)

---

## 🌐 Démo en Direct

Découvrez SecuBox en action :

**Démo Production :** [https://secubox.cybermood.eu](https://secubox.cybermood.eu)

- Tableau de bord principal : `/`
- Hub Système : `/system-hub`
- CrowdSec : `/crowdsec`
- Les 15 modules accessibles

---

## 📚 Sections de Documentation

### Pour les Nouveaux Contributeurs
1. [Guide de Démarrage Rapide](quick-start.md) - Règles et commandes essentielles
2. [Directives de Développement](development-guidelines.md) - Référence complète
3. [CLAUDE.md](claude.md) - Système de build et architecture
4. [Directives du Dépôt](repository-guidelines.md) - Structure, workflows et attentes PR

### Pour le Développement Assisté par IA
1. [Guide d'Implémentation de Module](module-implementation-guide.md) - Workflow étape par étape
2. [Prompts de Régénération de Fonctionnalités](feature-regeneration-prompts.md) - Prompts IA pour tous les modules
3. [Modèles de Code](code-templates.md) - Patterns d'implémentation

---

## 📞 Support & Ressources

- **Dépôt GitHub :** [gkerma/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **Problèmes Documentation :** [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)
- **Support Technique :** support@cybermind.fr
- **Entreprise :** CyberMind.fr

---

## 📝 Licence

Apache-2.0

---

<small>**Dernière mise à jour :** 2025-12-28 | **Mainteneur :** CyberMind.fr</small>
