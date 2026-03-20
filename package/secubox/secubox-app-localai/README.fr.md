[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox LocalAI

Serveur LLM natif avec API REST compatible OpenAI. Supporte les modeles GGUF sur ARM64 et x86_64.

**Version** : 3.9.0

## Fonctionnalites

- API REST compatible OpenAI (`/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`)
- Support des modeles GGUF (LLaMA, Mistral, Phi, TinyLlama, etc.)
- Architectures ARM64 et x86_64
- **Panneau Agent Jobs** (v3.9) -- Planifiez et gerez les taches agentiques en arriere-plan
- **Reclamateur Memoire** (v3.9) -- Eviction LRU pour les modeles charges
- Support des embeddings (preset GTE-Small)

## Installation

```sh
opkg install secubox-app-localai

# Telecharger le binaire (premiere execution)
localaictl install

# Installer un modele
localaictl model-install tinyllama

# Activer et demarrer le service
uci set localai.main.enabled=1
uci commit localai
/etc/init.d/localai enable
/etc/init.d/localai start
```

## Configuration

Fichier de configuration UCI : `/etc/config/localai`

```
config localai 'main'
    option enabled '0'
    option api_port '8081'
    option api_host '0.0.0.0'
    option models_path '/srv/localai/models'
    option threads '4'
    option context_size '2048'
```

## Presets de Modeles

| Preset | Taille | Description |
|--------|--------|-------------|
| tinyllama | 669Mo | TinyLlama 1.1B (chat) |
| phi2 | 1.6Go | Microsoft Phi-2 (chat) |
| mistral | 4.1Go | Mistral 7B Instruct (chat) |
| gte-small | 67Mo | GTE Small (embeddings) |

```sh
localaictl model-install tinyllama
localaictl model-install gte-small   # Pour les embeddings
```

## Commandes CLI

```sh
# Installation/Desinstallation
localaictl install          # Telecharger le binaire depuis GitHub
localaictl uninstall        # Supprimer le binaire

# Service
localaictl start            # Demarrer le service
localaictl stop             # Arreter le service
localaictl restart          # Redemarrer le service
localaictl status           # Afficher le statut
localaictl logs [-f]        # Afficher les logs

# Modeles
localaictl models           # Lister les modeles installes
localaictl model-install <name>  # Installer un modele
localaictl model-remove <name>   # Supprimer un modele

# Backends
localaictl backends         # Lister les backends disponibles
```

## Points d'Acces API

Port par defaut : 8081

| Point d'acces | Description |
|---------------|-------------|
| `/v1/models` | Lister les modeles charges |
| `/v1/chat/completions` | Completion de chat |
| `/v1/completions` | Completion de texte |
| `/v1/embeddings` | Generer des embeddings |
| `/readyz` | Verification de sante |

## Fichiers

- `/etc/config/localai` -- Configuration UCI
- `/usr/sbin/localaictl` -- CLI du controleur
- `/usr/bin/local-ai` -- Binaire (telecharge)
- `/srv/localai/models/` -- Stockage des modeles

## Dependances

- `libstdcpp`
- `libpthread`
- `wget-ssl`
- `ca-certificates`

## Integration SecuBox

LocalAI sert de backend d'inference pour SecuBox AI Gateway (Couche 2) :
- Inference LLM locale en priorite
- Integration MCP Server pour les outils agents
- Support des agents Threat Analyst, CVE Triage et autres agents autonomes

## Licence

MIT

## Sources

- [LocalAI GitHub](https://github.com/mudler/LocalAI)
- [LocalAI v3.9.0 Release](https://github.com/mudler/LocalAI/releases)
