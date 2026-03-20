# Metabolizer Blog Pipeline

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Un pipeline CMS complet integrant Gitea, Streamlit et HexoJS pour SecuBox OpenWrt.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PIPELINE METABOLIZER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   GITEA      │───►│  STREAMLIT   │───►│   HEXOJS     │───► PORTAL   │
│  │   Stockage   │    │   App CMS    │    │   Generateur │    (statique)│
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│        │                    │                    │                       │
│   Clone depuis          Editer posts        clean →                      │
│   URL GitHub            + medias          generate →                     │
│                                            publish                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Fonctionnalites

- **Integration Gitea** - Mirrorer des repos GitHub, stocker le contenu du blog localement
- **CMS Streamlit** - Editeur markdown web avec apercu en direct
- **Generateur HexoJS** - Generation de site statique avec theme cyberpunk
- **Automatisation par webhook** - Reconstruction automatique sur git push
- **Acces Portal** - Blog statique servi sur `/blog/`

## Installation

```bash
opkg install secubox-app-metabolizer
metabolizerctl install
```

## Dependances

- `secubox-app-gitea` - Serveur de depots Git
- `secubox-app-streamlit` - Serveur d'applications Streamlit
- `secubox-app-hexojs` - Generateur de site statique
- `rsync` - Synchronisation de fichiers
- `git` - Controle de version

## Demarrage rapide

### 1. Installer le pipeline

```bash
metabolizerctl install
```

Cela va :
- Creer le repo `blog-content` dans Gitea
- Deployer l'application CMS sur Streamlit
- Configurer les webhooks pour la reconstruction automatique

### 2. Mirrorer depuis GitHub (optionnel)

```bash
metabolizerctl mirror https://github.com/user/my-blog.git
```

### 3. Acceder au CMS

Ouvrez `http://<ip-routeur>:8501` dans votre navigateur.

### 4. Voir votre blog

Naviguez vers `http://<ip-routeur>/blog/`

## Commandes

| Commande | Description |
|----------|-------------|
| `metabolizerctl install` | Configurer les repos, webhooks, deployer le CMS |
| `metabolizerctl uninstall` | Supprimer la configuration metabolizer |
| `metabolizerctl status` | Afficher le statut du pipeline (JSON) |
| `metabolizerctl mirror <url>` | Cloner un repo GitHub vers Gitea |
| `metabolizerctl sync` | Tirer les dernieres modifications de tous les repos |
| `metabolizerctl build` | Executer Hexo clean → generate → publish |
| `metabolizerctl publish` | Copier le site statique vers le portal |
| `metabolizerctl cms deploy` | Deployer l'application CMS sur Streamlit |
| `metabolizerctl cms update` | Tirer et redemarrer le CMS |

## Pages CMS

### Editeur (`/pages/1_editor.py`)

Editeur markdown a deux colonnes avec :
- Apercu en direct
- Editeur YAML front matter (titre, date, categories, tags)
- Enregistrer comme brouillon ou publier directement
- Declencher le build Hexo depuis l'interface

### Articles (`/pages/2_posts.py`)

Gerer votre contenu :
- Voir les articles publies et les brouillons
- Editer, supprimer, publier/depublier
- Synchroniser depuis Git
- Reconstruire le blog

### Medias (`/pages/3_media.py`)

Bibliotheque de medias :
- Upload d'images par glisser-deposer
- Vue galerie avec miniatures
- Copier le code markdown pour l'integration
- Synchronisation automatique vers le blog

### Parametres (`/pages/4_settings.py`)

Controles du pipeline :
- Statut des services (Gitea, Streamlit, HexoJS)
- Operations Git (pull, status, mirror)
- Pipeline de build (clean, generate, publish)
- Configuration du portal

## Configuration

Configuration UCI dans `/etc/config/metabolizer` :

```
config metabolizer 'main'
    option enabled '1'
    option gitea_url 'http://127.0.0.1:3000'
    option webhook_port '8088'

config content 'content'
    option repo_name 'blog-content'
    option repo_path '/srv/metabolizer/content'

config hexo 'hexo'
    option source_path '/srv/hexojs/site/source/_posts'
    option public_path '/srv/hexojs/site/public'
    option portal_path '/www/blog'
    option auto_publish '1'

config portal 'portal'
    option enabled '1'
    option url_path '/blog'
```

## Flux de donnees

```
1. L'auteur ecrit un article dans le CMS Streamlit
         │
         ▼
2. Le CMS commit + push vers Gitea
         │
         ▼
3. Le webhook Gitea declenche metabolizer-webhook
         │
         ▼
4. Le webhook execute : sync → build → publish
         │
         ├─► git pull du repo de contenu
         ├─► rsync des posts vers la source Hexo
         ├─► hexoctl clean
         ├─► hexoctl generate
         └─► rsync public/ vers /www/blog/
                  │
                  ▼
5. Blog accessible sur http://routeur/blog/
```

## Structure des repertoires

```
/srv/metabolizer/
├── content/              # Repo git du contenu du blog
│   ├── _posts/          # Fichiers markdown publies
│   ├── _drafts/         # Brouillons
│   └── images/          # Fichiers medias

/srv/hexojs/site/
├── source/_posts/       # Source Hexo (synchronisee depuis content)
└── public/              # Site statique genere

/www/blog/               # Fichiers statiques du portal (publies)
```

## Integration webhook

L'ecouteur webhook fonctionne sur le port 8088 (configurable) et gere :

- **Push du repo de contenu** → Sync + Build + Publish
- **Push du repo CMS** → Mettre a jour l'application Streamlit

URL du webhook : `http://<ip-routeur>:8088/webhook`

## Depannage

### Verifier le statut des services

```bash
metabolizerctl status
```

### Voir les logs

```bash
logread | grep metabolizer
```

### Reconstruction manuelle

```bash
metabolizerctl sync
metabolizerctl build
```

### Reinitialiser le pipeline

```bash
metabolizerctl uninstall
metabolizerctl install
```

## Licence

MIT License - CyberMind Studio
