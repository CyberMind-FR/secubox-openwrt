[English](README.md) | Francais | [中文](README.zh.md)

# Tableau de Bord LuCI Ollama

Interface web LuCI pour gerer Ollama -- runtime de modeles de langage locaux.

## Installation

```bash
opkg install luci-app-ollama
```

## Acces

LuCI > Services > Ollama

## Onglets

- **Tableau de Bord** -- Statut du service et utilisation des ressources
- **Modeles** -- Telecharger, lister et supprimer les modeles LLM
- **Chat** -- Interface de chat interactive pour les modeles charges
- **Parametres** -- Configuration du serveur Ollama

## Methodes RPCD

Service : `luci.ollama`

## Dependances

- `luci-base`
- `secubox-app-ollama`

## Licence

Apache-2.0
