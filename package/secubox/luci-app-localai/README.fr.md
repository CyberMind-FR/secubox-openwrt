[English](README.md) | Francais | [中文](README.zh.md)

# Tableau de Bord LuCI LocalAI

Gestion du serveur d'inference LLM local avec API compatible OpenAI.

## Installation

```bash
opkg install luci-app-localai
```

## Acces

Menu LuCI : **Services -> LocalAI**

## Onglets

- **Tableau de Bord** -- Sante du service, modeles charges, statut du point de terminaison API
- **Modeles** -- Installer, supprimer et gerer les modeles LLM
- **Chat** -- Interface de chat interactive pour tester les modeles
- **Parametres** -- Port API, limites de memoire, configuration du runtime

## Methodes RPCD

Backend : `luci.localai`

| Methode | Description |
|---------|-------------|
| `status` | Statut du service et infos du runtime |
| `models` | Lister les modeles installes |
| `config` | Obtenir la configuration |
| `health` | Verification de sante de l'API |
| `metrics` | Metriques et statistiques d'inference |
| `start` | Demarrer LocalAI |
| `stop` | Arreter LocalAI |
| `restart` | Redemarrer LocalAI |
| `model_install` | Installer un modele par nom |
| `model_remove` | Supprimer un modele installe |
| `chat` | Envoyer une requete de completion de chat |
| `complete` | Envoyer une requete de completion de texte |

## Dependances

- `luci-base`
- `secubox-app-localai`

## Licence

Apache-2.0
