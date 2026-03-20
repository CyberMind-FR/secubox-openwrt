# Tableau de bord LuCI nDPId

[English](README.md) | Francais | [中文](README.zh.md)

Interface web LuCI pour nDPId Deep Packet Inspection -- analyse du trafic en temps reel et detection de protocoles.

## Installation

```bash
opkg install luci-app-ndpid
```

## Acces

LuCI > SecuBox > nDPId Intelligence

## Onglets

- **Tableau de bord** -- Statistiques de trafic en direct et repartition des protocoles
- **Flux** -- Flux reseau actifs avec protocoles d'application detectes
- **Parametres** -- Configuration du daemon nDPId

## Scripts auxiliaires

- `ndpid-compat` -- Couche de compatibilite pour l'integration nDPId
- `ndpid-flow-actions` -- Traitement et actions sur les evenements de flux
- `ndpid-collector` -- Collecte et agregation des donnees de trafic

## Methodes RPCD

Service : `luci.ndpid`

## Dependances

- `luci-base`
- `ndpid`
- `socat`
- `jq`

## Licence

Apache-2.0
