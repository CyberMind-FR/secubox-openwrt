[English](README.md) | Francais | [中文](README.zh.md)

# Streamlit Forge

Plateforme de publication d'applications Streamlit pour SecuBox.

## Presentation

Streamlit Forge est une plateforme complete pour creer, gerer et publier des applications Streamlit. Creez des applications a partir de modeles, gerez les instances, exposez via HAProxy avec SSL et publiez sur le catalogue mesh SecuBox.

## Fonctionnalites

- **Modeles d'applications** - Modeles de base : Basic, Dashboard, Data-Viewer
- **Gestion des instances** - Demarrer, arreter, redemarrer les instances d'applications
- **Allocation de ports** - Attribution automatique des ports
- **Integration HAProxy** - Exposition vhost + SSL en une commande
- **Publication Mesh** - Partagez les applications sur le reseau mesh SecuBox
- **Configuration UCI** - Parametres d'applications persistants

## Installation

```bash
opkg install secubox-app-streamlit-forge
```

## Utilisation CLI

```bash
# Gestion des applications
slforge create <name> [options]
  --from-template <tpl>   # Utiliser un modele (basic, dashboard, data-viewer)
  --from-upload <zip>     # Creer depuis un fichier ZIP
  --from-git <url>        # Cloner depuis un depot Git

slforge list              # Lister toutes les applications
slforge info <app>        # Afficher les details de l'application
slforge delete <app>      # Supprimer l'application

# Controle des instances
slforge start <app>       # Demarrer l'instance
slforge stop <app>        # Arreter l'instance
slforge restart <app>     # Redemarrer l'application
slforge status [app]      # Afficher le statut
slforge logs <app> [-f]   # Voir les logs

# Configuration
slforge config <app> list         # Lister la config
slforge config <app> get <key>    # Obtenir une valeur
slforge config <app> set <k> <v>  # Definir une valeur

# Publication
slforge expose <app> [--domain <d>]  # Creer vhost + SSL
slforge hide <app>                   # Retirer l'acces public
slforge publish <app>                # Ajouter au catalogue mesh
slforge unpublish <app>              # Retirer du mesh

# Integration Launcher (demarrage a la demande)
slforge launcher status              # Afficher le statut du launcher
slforge launcher priority <app> <n>  # Definir la priorite (1-100)
slforge launcher always-on <app>     # Marquer comme toujours actif

# Modeles
slforge templates         # Lister les modeles disponibles
```

## Exemple de Workflow

```bash
# 1. Creer une application depuis le modele dashboard
slforge create mydashboard --from-template dashboard

# 2. Demarrer l'application
slforge start mydashboard
# URL: http://192.168.255.1:8501

# 3. Exposer avec SSL
slforge expose mydashboard --domain mydashboard.gk2.secubox.in

# 4. Publier sur le catalogue mesh
slforge publish mydashboard
```

## Modeles

### Basic
Application Streamlit minimale avec barre laterale et disposition en deux colonnes.

### Dashboard
Dashboard multi-pages avec :
- Cartes de metriques avec indicateurs delta
- Graphiques en lignes et en aires
- Tableau de donnees avec export CSV
- Page de parametres

### Data-Viewer
Explorateur de donnees CSV/Excel avec :
- Upload de fichiers (CSV, XLSX)
- Filtrage dynamique par colonnes
- Histogrammes et nuages de points
- Resume statistique
- Matrice de correlation

## Configuration

Config UCI : `/etc/config/streamlit-forge`

```
config forge 'main'
    option enabled '1'
    option gitea_url 'http://127.0.0.1:3000'
    option gitea_org 'streamlit-apps'
    option apps_dir '/srv/streamlit/apps'
    option previews_dir '/srv/streamlit/previews'
    option base_domain 'apps.secubox.in'
    option default_port_start '8501'
    option default_memory '512M'

config app 'myapp'
    option name 'myapp'
    option enabled '1'
    option port '8501'
    option entrypoint 'app.py'
    option memory '512M'
    option domain 'myapp.gk2.secubox.in'
```

## Structure du Repertoire d'Application

```
/srv/streamlit/apps/<app>/
|-- src/                  # Code source de l'application
|   |-- app.py           # Point d'entree Streamlit principal
|   |-- requirements.txt # Dependances Python
|   +-- ...
|-- data/                # Donnees persistantes
+-- config.json          # Configuration runtime
```

## Interface LuCI

Installez `luci-app-streamlit-forge` pour l'interface web dans **Services > Streamlit Forge**.

Fonctionnalites :
- Dashboard de statut (applications en cours/total, statut LXC)
- Dialogue de creation d'application avec selection de modele
- Tableau d'applications avec Demarrer/Arreter/Ouvrir/Exposer/Publier/Supprimer
- Actualisation automatique

## Runtime

Les applications s'executent dans le conteneur LXC `streamlit` :
- Applications montees dans `/srv/apps/` a l'interieur du conteneur
- Virtualenv Python avec Streamlit pre-installe
- Redirection de ports vers le reseau hote

## Dependances

- python3, python3-pip
- lxc, lxc-common
- jsonfilter

## Emplacements des Fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/streamlit-forge` | Configuration UCI |
| `/usr/sbin/slforge` | Outil CLI |
| `/srv/streamlit/apps/` | Repertoires sources des applications |
| `/srv/streamlit/previews/` | Previews generees |
| `/usr/share/streamlit-forge/templates/` | Modeles d'applications |
| `/var/run/streamlit-*.pid` | Fichiers PID |
| `/var/log/streamlit-*.log` | Logs des applications |

## Manifeste du Catalogue Mesh

Les applications publiees creent un manifeste dans `/usr/share/secubox/plugins/catalog/` :

```json
{
  "id": "streamlit-myapp",
  "name": "myapp",
  "type": "streamlit-app",
  "version": "1.0.0",
  "category": "apps",
  "runtime": "streamlit",
  "actions": {
    "start": "slforge start myapp",
    "stop": "slforge stop myapp"
  }
}
```

## Launcher a la Demande

Installez `secubox-app-streamlit-launcher` pour l'optimisation des ressources :

- **Chargement Paresseux** - Les applications demarrent uniquement lors du premier acces
- **Arret sur Inactivite** - Arret des applications apres un delai configurable (defaut : 30 min)
- **Gestion Memoire** - Arret force des applications a basse priorite en cas de pression memoire
- **Systeme de Priorite** - Garde les applications critiques en fonctionnement plus longtemps

### Commandes Launcher

```bash
# Verifier le statut du launcher
slforge launcher status

# Definir la priorite (plus haut = reste actif plus longtemps, max 100)
slforge launcher priority myapp 75

# Marquer comme toujours actif (jamais arrete automatiquement)
slforge launcher always-on dashboard
```

### Niveaux de Priorite

| Priorite | Comportement |
|----------|--------------|
| 100 + always_on | Jamais arrete automatiquement |
| 80-99 | Arrete en dernier lors de pression memoire |
| 50 (defaut) | Priorite normale |
| 1-49 | Arrete en premier lors de pression memoire |

### Fonctionnement

1. L'utilisateur accede a `https://app.example.com`
2. Si l'application est arretee, le launcher la demarre a la demande
3. Le temps d'acces est enregistre
4. Apres le delai d'inactivite, l'application est automatiquement arretee
5. La pression memoire declenche l'arret des applications a basse priorite

Voir le README de `secubox-app-streamlit-launcher` pour la configuration complete.

## Manifeste de Module (NFO)

Les applications peuvent inclure un manifeste `README.nfo` avec des metadonnees pour :
- **Identite** - Nom, version, auteur, licence
- **Classification** - Categorie, mots-cles, tags
- **Runtime** - Port, memoire, dependances
- **Dynamiques** - Contexte IA pour l'integration de contenu generatif

### Commandes NFO

```bash
# Generer README.nfo pour une application existante
slforge nfo init myapp

# Voir le resume NFO
slforge nfo info myapp

# Editer le manifeste
slforge nfo edit myapp

# Valider le manifeste
slforge nfo validate myapp

# Exporter en JSON (pour APIs)
slforge nfo json myapp

# Installer une application depuis un repertoire avec NFO
slforge nfo install /path/to/myapp
```

### Structure du Fichier NFO

```nfo
[identity]
id=myapp
name=My Application
version=1.0.0
author=CyberMind

[description]
short=Un dashboard pour les metriques systeme
long=<<EOF
Description detaillee multi-lignes...
EOF

[tags]
category=administration
keywords=dashboard,monitoring,metrics

[runtime]
type=streamlit
port=8501
memory=512M

[dynamics]
prompt_context=<<EOF
Cette application affiche les metriques systeme.
Les utilisateurs peuvent demander des graphiques ou exports de donnees.
EOF
capabilities=data-visualization,export
input_types=api,json
output_types=charts,tables,csv
```

### Installateur Integre

Les applications peuvent inclure un `install.sh` qui lit le NFO :

```bash
# Installer depuis un repertoire
cd /path/to/myapp
./install.sh

# Ou utiliser slforge
slforge nfo install /path/to/myapp
```

Voir `/usr/share/streamlit-forge/NFO-SPEC.md` pour la specification complete.

### Integration IA Generative

La section `[dynamics]` fournit un contexte pour les assistants IA :

```nfo
[dynamics]
prompt_context=<<EOF
Cette application est un dashboard de visualisation de donnees.
Elle peut afficher des graphiques, tableaux et exporter des donnees.
Donnees disponibles : CPU, memoire, metriques reseau.
EOF

capabilities=data-visualization,real-time-updates,export
input_types=json,api,prometheus
output_types=charts,tables,csv,pdf
```

Les systemes IA peuvent lire ce contexte pour comprendre ce que fait l'application et comment assister les utilisateurs.

## Emplacements des Fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/streamlit-forge` | Configuration UCI |
| `/usr/sbin/slforge` | Outil CLI |
| `/srv/streamlit/apps/` | Repertoires sources des applications |
| `/srv/streamlit/apps/<app>/README.nfo` | Manifeste de l'application |
| `/srv/streamlit/previews/` | Previews generees |
| `/usr/share/streamlit-forge/templates/` | Modeles d'applications |
| `/usr/share/streamlit-forge/lib/nfo-parser.sh` | Bibliotheque parseur NFO |
| `/usr/share/streamlit-forge/nfo-template.nfo` | Modele NFO |
| `/usr/share/streamlit-forge/install.sh` | Installateur integre |
| `/var/run/streamlit-*.pid` | Fichiers PID |
| `/var/log/streamlit-*.log` | Logs des applications |
