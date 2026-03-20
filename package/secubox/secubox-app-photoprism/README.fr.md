[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox PhotoPrism

Alternative auto-hebergee a Google Photos avec des fonctionnalites alimentees par l'IA, fonctionnant dans un conteneur LXC.

## Fonctionnalites

- **Reconnaissance Faciale IA** - Detection et regroupement automatique des visages
- **Detection d'Objets** - Recherche de photos par objets, scenes, couleurs
- **Lieux / Cartes** - Visualisez les photos sur une carte du monde
- **Recherche Plein Texte** - Recherche dans toutes les metadonnees
- **Albums et Partage** - Organisez et partagez des collections
- **Support RAW** - Traitement des fichiers RAW d'appareils photo
- **Lecture Video** - Streaming video avec transcodage

## Demarrage Rapide

```bash
# Installer PhotoPrism (cree un conteneur LXC)
photoprismctl install

# Demarrer le service
/etc/init.d/photoprism start

# Acceder a la galerie
http://192.168.255.1:2342
```

## Commandes CLI

| Commande | Description |
|----------|-------------|
| `install` | Creer un conteneur LXC avec PhotoPrism |
| `uninstall` | Supprimer le conteneur (conserve les photos) |
| `start/stop/restart` | Cycle de vie du service |
| `status` | Statut JSON pour RPCD |
| `logs [N]` | Afficher les N dernieres lignes de log |
| `shell` | Ouvrir un shell dans le conteneur |
| `index` | Declencher l'indexation des photos |
| `import` | Importer depuis le dossier inbox |
| `passwd [pass]` | Reinitialiser le mot de passe admin |
| `backup` | Creer une sauvegarde de la base de donnees |
| `configure-haproxy <domain>` | Configurer HAProxy + SSL |
| `emancipate <domain>` | Exposition publique complete |

## Gestion des Photos

### Ajouter des Photos

1. **Copie Directe** : Copiez les fichiers dans `/srv/photoprism/originals/`
2. **Import Inbox** : Copiez dans `/srv/photoprism/import/`, executez `photoprismctl import`
3. **WebDAV** : Activez WebDAV dans les parametres PhotoPrism

### Declencher l'Indexation

Apres avoir ajoute des photos, lancez l'indexation :

```bash
photoprismctl index
```

## Exposition Publique

Exposez la galerie sur internet avec HAProxy + SSL :

```bash
photoprismctl emancipate photos.example.com
```

Ceci configure :
- Vhost HAProxy avec SSL Let's Encrypt
- Routage WAF mitmproxy
- Enregistrement DNS (si dnsctl disponible)

## Configuration

Config UCI dans `/etc/config/photoprism` :

```
config photoprism 'main'
    option enabled '1'
    option http_port '2342'
    option memory_limit '2G'

config photoprism 'features'
    option face_recognition '1'
    option object_detection '1'
    option places '1'
```

## Exigences de Ressources

- **RAM** : 2Go recommande (1Go minimum)
- **Stockage** : ~500Mo pour le conteneur + vos photos
- **CPU** : L'indexation IA est intensive en CPU

## Dashboard LuCI

Acces via : Services > PhotoPrism

Fonctionnalites :
- Cartes de statut (photos, videos, stockage)
- Boutons Demarrer/Arreter/Indexer/Importer
- Bascules des fonctionnalites IA
- Formulaire Emancipate pour l'exposition publique

## Chemins des Donnees

| Chemin | Contenu |
|--------|---------|
| `/srv/photoprism/originals` | Vos photos et videos |
| `/srv/photoprism/storage` | Cache, miniatures, base de donnees |
| `/srv/photoprism/import` | Inbox d'upload |

## Securite

- Le trafic passe par le WAF mitmproxy (pas de contournement)
- Mot de passe admin stocke dans UCI
- Le conteneur fonctionne avec des capacites limitees
