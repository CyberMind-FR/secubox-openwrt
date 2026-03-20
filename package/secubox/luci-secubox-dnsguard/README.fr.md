[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox DNS Guard

Package LuCI alternatif pour la gestion DNS axee sur la confidentialite -- meme fonctionnalite que `luci-app-dnsguard`, integre sous le menu securite SecuBox.

## Installation

```bash
opkg install luci-secubox-dnsguard
```

## Acces

LuCI > SecuBox > Securite > DNS Guard

## Fonctionnalites

- Configuration du filtrage DNS et du blocage de publicites
- Selection du fournisseur DNS amont
- Tableau de bord de journalisation des requetes et statistiques
- Gestion des listes de blocage

## Methodes RPCD

Service : `luci.dnsguard`

## Dependances

- `luci-base`

## Licence

Apache-2.0
