# Tableau de bord LuCI Streamlit

[English](README.md) | Francais | [中文](README.zh.md)

Interface web LuCI pour la gestion des instances d'applications Streamlit avec integration Gitea.

## Installation

```bash
opkg install luci-app-streamlit
```

## Acces

LuCI > Services > Streamlit

## Onglets

- **Tableau de bord** -- Instances en cours d'execution, statut et utilisation des ressources
- **Parametres** -- Configuration des instances et integration des depots Gitea

## Fonctionnalites

- Gestion multi-instances Streamlit
- Deployer des applications depuis des depots Gitea
- Controles demarrer/arreter par instance

## Methodes RPCD

Service : `luci.streamlit`

## Dependances

- `luci-base`
- `secubox-app-streamlit`

## Licence

Apache-2.0
