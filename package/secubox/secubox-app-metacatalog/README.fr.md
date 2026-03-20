[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Meta Cataloger

Systeme de bibliotheque virtuelle qui agregue les sites MetaBlogizer, les applications Streamlit et d'autres services dans un catalogue unifie organise par **Livres Virtuels** thematiques.

## Presentation

```
+---------------------------------------------------------------+
|                    META CATALOGER                              |
|              "Bibliotheque Virtuelle SecuBox"                  |
+---------------------------------------------------------------+
|  LIVRES VIRTUELS (collections auto-generees)                   |
|  |-- Divination & I-Ching                                      |
|  |   |-- lldh360.maegia.tv (Oracle HERMES-360)                |
|  |   +-- yijing.gk2.secubox.in                                |
|  |-- Visualisations Interactives                               |
|  |   +-- wall.maegia.tv (MAGIC-CHESS-360)                     |
|  |-- Donnees & Analytique                                      |
|  |   +-- control.gk2.secubox.in (SecuBox Control)             |
|  +-- Publications & Blogs                                      |
|      +-- gandalf.maegia.tv                                     |
+---------------------------------------------------------------+
```

## Commandes CLI

```bash
# Synchronisation complete du catalogue (scan + index + assignation livres + generation landing)
metacatalogctl sync

# Scanner une source specifique
metacatalogctl scan                    # Toutes les sources
metacatalogctl scan metablogizer       # Sites MetaBlogizer uniquement
metacatalogctl scan streamlit          # Applications Streamlit uniquement

# Gestion de l'index
metacatalogctl index list              # Lister toutes les entrees indexees
metacatalogctl index show <id>         # Afficher les details d'une entree
metacatalogctl index refresh           # Reconstruire l'index

# Livres virtuels
metacatalogctl books list              # Lister tous les livres avec le nombre d'entrees
metacatalogctl books show <book-id>    # Afficher le contenu d'un livre

# Recherche
metacatalogctl search <query>          # Recherche plein texte dans le catalogue

# Maintenance
metacatalogctl status                  # Afficher les statistiques du catalogue
metacatalogctl landing                 # Regenerer uniquement la page d'accueil
```

## Configuration UCI

La configuration se trouve dans `/etc/config/metacatalog` :

```uci
config metacatalog 'main'
    option enabled '1'
    option data_dir '/srv/metacatalog'
    option auto_scan_interval '3600'
    option landing_path '/www/metacatalog/index.html'

# Sources de contenu
config source 'metablogizer'
    option enabled '1'
    option type 'metablogizer'
    option path '/srv/metablogizer/sites'

config source 'streamlit'
    option enabled '1'
    option type 'streamlit'
    option config '/etc/config/streamlit-forge'

# Definitions des livres virtuels
config book 'divination'
    option name 'Divination & I-Ching'
    option icon '🔮'
    option color '#cc00ff'
    option description 'Outils oraculaires et systemes divinatoires'
    list keywords 'iching'
    list keywords 'oracle'
    list keywords 'divination'
    list domain_patterns 'lldh'
    list domain_patterns 'yijing'

config book 'visualization'
    option name 'Visualisations Interactives'
    option icon '🎮'
    option color '#00ff88'
    list keywords 'canvas'
    list keywords 'animation'
    list domain_patterns 'wall'
```

## Structure des Fichiers

```
/etc/config/metacatalog          # Configuration UCI
/usr/sbin/metacatalogctl         # Outil CLI
/srv/metacatalog/
|-- index.json                   # Index principal du catalogue
|-- books.json                   # Livres virtuels avec entrees
|-- entries/                     # Fichiers JSON individuels par entree
|   |-- lldh360-maegia-tv.json
|   +-- ...
+-- cache/                       # Cache de scan
/www/metacatalog/
|-- index.html                   # Page d'accueil (theme prisme Tao)
+-- api/
    |-- index.json               # API : toutes les entrees
    +-- books.json               # API : tous les livres
```

## Livres Virtuels par Defaut

| ID | Nom | Icone | Mots-cles |
|----|-----|-------|-----------|
| divination | Divination & I-Ching | 🔮 | iching, oracle, hexagram, yijing, bazi |
| visualization | Visualisations Interactives | 🎮 | canvas, animation, 3d, game |
| analytics | Donnees & Analytique | 📊 | dashboard, data, analytics, metrics |
| publications | Publications & Blogs | 📝 | blog, article, press, news |
| security | Outils de Securite | 🛡️ | security, waf, firewall, crowdsec |
| media | Medias & Divertissement | 🎬 | video, audio, streaming, media |

## Assignation Automatique

Les entrees sont automatiquement assignees aux livres selon :
- **Mots-cles** : Comparaison avec le titre, la description et les mots-cles extraits
- **Motifs de domaine** : Comparaison avec le nom de domaine de l'entree

Configurez les regles dans UCI :
```bash
uci add_list metacatalog.divination.keywords='tarot'
uci add_list metacatalog.divination.domain_patterns='tarot'
uci commit metacatalog
metacatalogctl sync
```

## Integration Cron

La synchronisation automatique horaire est configuree via `/etc/cron.d/metacatalog` :
```
0 * * * * root /usr/sbin/metacatalogctl sync --quiet >/dev/null 2>&1
```

## Acces API

La page d'accueil et les APIs JSON sont disponibles a :
- Landing : `https://secubox.in/metacatalog/`
- Entrees : `https://secubox.in/metacatalog/api/index.json`
- Livres : `https://secubox.in/metacatalog/api/books.json`

## Dependances

- `jsonfilter` - Parsing JSON (libubox)
- `coreutils-stat` - Horodatages des fichiers

## Integration

- **MetaBlogizer** : Scanne automatiquement `/srv/metablogizer/sites/` pour les sites publies
- **Streamlit Forge** : Lit `/etc/config/streamlit-forge` pour les definitions d'apps
- **HAProxy** : Verifie le statut SSL/WAF des vhosts pour les infos d'exposition
