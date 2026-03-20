# Métadonnées de l'App Store SecuBox

🌐 **Langues :** [English](README.md) | Français | [中文](README.zh.md)

Ce répertoire contient les métadonnées de toutes les applications SecuBox disponibles dans le magasin d'applications.

## Structure

- `apps.json` - Catalogue principal de toutes les applications SecuBox disponibles
- Répertoires d'applications individuelles avec des métadonnées détaillées

## Catégories d'Applications

### 🔒 Sécurité
Applications axées sur la sécurité, la détection des menaces et la protection réseau.

### 🌐 Réseau
Services réseau, utilitaires et applications d'infrastructure.

### 🏠 IoT & Domotique
Appareils connectés, systèmes d'automatisation et intégration IoT.

### 🎬 Média
Streaming multimédia, divertissement et gestion de contenu.

## Statut des Applications

- **stable** - Prêt pour la production, testé et stable
- **beta** - Fonctionnel mais peut présenter des problèmes mineurs
- **alpha** - Développement précoce, expérimental
- **dev** - En cours de développement actif

## Ajouter de Nouvelles Applications

Pour ajouter une nouvelle application au magasin d'applications :

1. Créer le paquet dans `package/secubox/secubox-app-<nom>/`
2. Ajouter l'entrée de métadonnées dans `apps.json`
3. Assurer un étiquetage et une catégorisation appropriés
4. Ajouter les dépendances et conflits le cas échéant
5. Lier à l'application LuCI si disponible

## Champs de Métadonnées

Chaque entrée d'application inclut :

- **id** : Identifiant unique du paquet
- **name** : Nom d'affichage
- **version** : Version actuelle
- **category** : Catégorie principale
- **description** : Brève description
- **icon** : Emoji ou identifiant d'icône
- **author** : Mainteneur du paquet
- **license** : Licence logicielle
- **url** : URL du projet en amont
- **tags** : Étiquettes recherchables
- **requires** : Configuration système requise
- **status** : Statut de développement
- **luci_app** : Interface LuCI associée (le cas échéant)
- **dependencies** : Paquets requis
- **conflicts** : Paquets en conflit

## Intégration

Les métadonnées du magasin d'applications sont utilisées par :

- **luci-app-secubox** - Interface principale SecuBox
- **Système de build** - Gestion des paquets et résolution des dépendances
- **Documentation** - Génération automatique de documentation
- **CI/CD** - Tests et déploiement automatisés

## Versionnage

Version des métadonnées du magasin d'applications : 1.0
Dernière mise à jour : 2024-12-30
