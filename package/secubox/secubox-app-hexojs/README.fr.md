# SecuBox HexoJS

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Generateur de blog statique auto-heberge pour OpenWrt avec integration Gitea.

## Fonctionnalites

- Generateur de site statique Hexo 8.x avec Node.js 22 LTS
- Theme CyberMind avec mode sombre et design moderne
- Integration Gitea pour la gestion de contenu
- Gestion des articles et pages avec Markdown
- Bibliotheque de medias pour images et fichiers
- Support du deploiement GitHub Pages
- Serveur de previsualisation pour les tests locaux

S'execute dans un conteneur LXC avec Alpine Linux.

## Installation

```bash
# Installer le paquet
opkg install secubox-app-hexojs

# Configurer le conteneur et creer le site
hexoctl install
hexoctl site create default

# Activer et demarrer le service
uci set hexojs.main.enabled=1
uci commit hexojs
/etc/init.d/hexojs enable
/etc/init.d/hexojs start
```

Previsualisation sur `http://<ip-routeur>:4000`

## Commandes

### Gestion du conteneur

```bash
hexoctl install           # Telecharger et configurer le conteneur LXC
hexoctl uninstall         # Supprimer le conteneur (conserve les donnees)
hexoctl update            # Mettre a jour Hexo et les dependances
hexoctl status            # Afficher le statut du service
hexoctl shell             # Ouvrir un shell dans le conteneur
hexoctl logs              # Voir les logs du conteneur
hexoctl exec <cmd>        # Executer une commande dans le conteneur
```

### Gestion du site

```bash
hexoctl site create <nom>   # Creer un nouveau site Hexo
hexoctl site list            # Lister tous les sites
hexoctl site delete <nom>   # Supprimer un site
```

### Commandes de contenu

```bash
hexoctl new post "Titre"     # Creer un nouvel article de blog
hexoctl new page "Titre"     # Creer une nouvelle page
hexoctl new draft "Titre"    # Creer un nouveau brouillon
hexoctl publish <slug>       # Publier un brouillon
hexoctl list posts           # Lister tous les articles (JSON)
hexoctl list drafts          # Lister tous les brouillons (JSON)
```

### Commandes de build

```bash
hexoctl serve               # Demarrer le serveur de previsualisation (port 4000)
hexoctl build               # Generer les fichiers statiques
hexoctl clean               # Nettoyer les fichiers generes
hexoctl deploy              # Deployer vers la cible configuree
```

## Integration Gitea

Synchroniser le contenu du blog depuis un depot Gitea.

### Configuration

```bash
# Activer l'integration Gitea
uci set hexojs.gitea.enabled=1
uci set hexojs.gitea.url='http://192.168.255.1:3000'
uci set hexojs.gitea.user='admin'
uci set hexojs.gitea.token='votre-jeton-d-acces-gitea'
uci set hexojs.gitea.content_repo='blog-content'
uci set hexojs.gitea.content_branch='main'
uci commit hexojs
```

### Commandes

```bash
hexoctl gitea setup         # Configurer les credentials git dans le conteneur
hexoctl gitea clone         # Cloner le depot de contenu depuis Gitea
hexoctl gitea sync          # Recuperer le dernier contenu et synchroniser avec Hexo
hexoctl gitea status        # Afficher le statut de synchronisation Gitea (JSON)
```

### Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Gitea     │───►│   HexoJS    │───►│   Portal    │
│   Contenu   │    │   Build     │    │   Statique  │
└─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │
  blog-content/      hexo generate      /www/blog/
   _posts/*.md         public/          index.html
```

1. Creer/modifier les articles dans le depot Gitea
2. Executer `hexoctl gitea sync` pour recuperer les changements
3. Executer `hexoctl build` pour generer le site statique
4. Les fichiers statiques sont disponibles dans `/srv/hexojs/site/public/`

### Structure du depot de contenu

```
blog-content/
├── _posts/           # Articles publies
│   └── 2025-01-24-hello-world.md
├── _drafts/          # Brouillons
├── images/           # Fichiers medias
├── about/            # Page A propos
├── portfolio/        # Page Portfolio
└── services/         # Page Services
```

## Configuration

Editer `/etc/config/hexojs` :

```
config hexojs 'main'
    option enabled '1'
    option http_port '4000'
    option data_path '/srv/hexojs'
    option active_site 'default'
    option memory_limit '512M'

config site 'default'
    option title 'Mon Blog'
    option subtitle 'Auto-heberge sur OpenWrt'
    option author 'Admin'
    option language 'fr'
    option theme 'cybermind'
    option url 'http://localhost:4000'
    option root '/'
    option per_page '10'

config deploy 'deploy'
    option type 'git'
    option repo ''
    option branch 'gh-pages'

config gitea 'gitea'
    option enabled '0'
    option url 'http://192.168.255.1:3000'
    option user 'admin'
    option token ''
    option content_repo 'blog-content'
    option content_branch 'main'
    option auto_sync '0'

config theme_config 'theme'
    option default_mode 'dark'
    option allow_toggle '1'
    option accent_color '#f97316'
```

## Structure des repertoires

```
/srv/hexojs/
├── site/                    # Site Hexo
│   ├── source/
│   │   ├── _posts/          # Articles de blog
│   │   ├── _drafts/         # Brouillons
│   │   └── images/          # Medias
│   ├── themes/
│   │   └── cybermind/       # Theme CyberMind
│   ├── public/              # Fichiers statiques generes
│   └── _config.yml          # Configuration Hexo
├── content/                 # Depot de contenu Gitea clone
├── themes/                  # Themes partages
└── media/                   # Medias partages
```

## Theme CyberMind

Theme sombre inclus avec :

- Design responsive
- Bascule mode sombre/clair
- Couleur d'accent orange (#f97316)
- Logo style terminal
- Support des categories et tags
- Section portfolio d'applications

## Depannage

### Le conteneur ne demarre pas

```bash
# Verifier le statut du conteneur
lxc-info -n hexojs

# Voir les logs
hexoctl logs

# Reinstaller le conteneur
hexoctl uninstall
hexoctl install
```

### Echec du clone Gitea

```bash
# Verifier les credentials
hexoctl gitea status

# Reconfigurer les credentials git
hexoctl gitea setup

# Verifier que le token a acces au depot
curl -H "Authorization: token VOTRE_TOKEN" \
  http://192.168.255.1:3000/api/v1/user/repos
```

### Erreurs de build

```bash
# Nettoyer et reconstruire
hexoctl clean
hexoctl build

# Verifier a l'interieur du conteneur
hexoctl shell
cd /opt/hexojs/site
npm install
hexo generate --debug
```

## Integration avec Metabolizer

HexoJS fonctionne avec le pipeline CMS Metabolizer :

```
Streamlit CMS → Gitea → HexoJS → Portal
   (editer)     (stocker) (build)  (servir)
```

Voir `secubox-app-metabolizer` pour l'experience CMS complete.

## Licence

MIT License - CyberMind Studio 2025
