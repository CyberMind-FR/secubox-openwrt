# SecuBox PeerTube

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Plateforme de streaming video federee fonctionnant dans un conteneur LXC Debian.

## Fonctionnalites

- **Instance PeerTube** : Plateforme video auto-hebergee avec federation ActivityPub
- **Import de videos** : Importation de videos depuis YouTube, Vimeo et plus de 1000 sites via yt-dlp
- **Sous-titres multi-pistes** : Telechargement et synchronisation automatiques des sous-titres en plusieurs langues
- **Analyse video** : Extraction de transcriptions et analyse par IA Claude (peertube-analyse)
- **Streaming en direct** : Ingestion RTMP avec sortie HLS

## Composants

| Composant | Description |
|-----------|-------------|
| `peertubectl` | Script de controle principal pour la gestion du conteneur |
| `peertube-import` | Import de videos avec synchronisation des sous-titres |
| `peertube-analyse` | Extraction de transcriptions et analyse IA |

## Import de videos

Importez des videos depuis des plateformes externes avec synchronisation automatique des sous-titres.

### Utilisation CLI

```bash
# Import basique
peertube-import https://youtube.com/watch?v=xxx

# Import avec plusieurs langues de sous-titres
peertube-import --lang fr,en,de,es https://youtube.com/watch?v=xxx

# Import en tant que video non repertoriee
peertube-import --privacy 2 https://youtube.com/watch?v=xxx

# Import vers une chaine specifique
peertube-import --channel 2 https://vimeo.com/xxx
```

### Options

| Option | Description | Defaut |
|--------|-------------|--------|
| `--lang <codes>` | Langues des sous-titres (separees par des virgules) | `fr,en` |
| `--channel <id>` | ID de la chaine PeerTube | `1` |
| `--privacy <level>` | 1=public, 2=non repertorie, 3=prive | `1` |
| `--output <dir>` | Repertoire temporaire pour les telechargements | `/tmp/peertube-import` |
| `--peertube <url>` | URL de l'instance PeerTube | depuis la config UCI |

### Integration au portail

Acces via Portail SecuBox -> Intelligence & Analyse -> Import Video

Le portail fournit :
- Champ de saisie d'URL pour la source video
- Cases a cocher pour la selection des langues
- Selecteur de niveau de confidentialite
- Suivi de progression en temps reel
- Lien direct vers la video importee

### Points d'acces CGI

```bash
# Demarrer une tache d'import
curl -X POST http://192.168.255.1/cgi-bin/peertube-import \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=xxx","languages":"fr,en"}'

# Reponse : {"success": true, "job_id": "import_xxx"}

# Verifier le statut
curl "http://192.168.255.1/cgi-bin/peertube-import-status?job_id=import_xxx"

# Reponse (en cours) :
# {"status": "downloading", "progress": 45, "job_id": "import_xxx"}

# Reponse (termine) :
# {"success": true, "video_url": "https://tube.example.com/w/uuid"}
```

## Configuration

Fichier de configuration UCI : `/etc/config/peertube`

```
config peertube 'main'
    option enabled '1'
    option data_path '/srv/peertube'

config peertube 'server'
    option hostname 'tube.example.com'
    option port '9001'
    option https '1'

config peertube 'admin'
    option username 'root'
    option password 'changeme'

config peertube 'transcoding'
    option enabled '1'
    option threads '2'
    list resolutions '480p'
    list resolutions '720p'
```

## Dependances

- `lxc`, `lxc-common` - Runtime de conteneur
- `wget-ssl` - Telechargements HTTPS
- `tar`, `jsonfilter` - Gestion des archives et JSON
- `yt-dlp` - Telechargement de videos (pip install)
- `node` - Runtime JavaScript pour yt-dlp (opkg install)

## Sources d'import supportees

yt-dlp supporte plus de 1000 sites dont :
- YouTube, YouTube Music
- Vimeo
- Dailymotion
- Twitch (VODs)
- Twitter/X
- TikTok
- Et bien d'autres...

Voir : https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md

## Version

- Paquet : 1.2.0
- yt-dlp : 2026.2.4 (recommande)
- Node.js : 20.20.0 (pour le runtime JS YouTube)
