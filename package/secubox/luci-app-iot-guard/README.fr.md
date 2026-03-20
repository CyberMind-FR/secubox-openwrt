# LuCI IoT Guard

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Tableau de bord LuCI pour l'isolation des appareils IoT et la surveillance de securite.

## Fonctionnalites

- **Tableau de bord general** - Score de securite, nombre d'appareils, distribution des risques
- **Liste des appareils** - Tableau filtrable avec details des appareils
- **Actions sur les appareils** - Isoler, approuver ou bloquer les appareils
- **Cartographie cloud** - Visualiser les services cloud contactes par chaque appareil
- **Alertes d'anomalies** - Notifications d'anomalies en temps reel
- **Gestion des politiques** - Regles de classification par fabricant
- **Parametres** - Configurer l'isolation automatique, les seuils, les zones

## Installation

```bash
opkg install luci-app-iot-guard
```

Necessite le package backend `secubox-iot-guard`.

## Emplacement dans le menu

SecuBox > Services > IoT Guard

## Ecrans

### Apercu (`/iot-guard/overview`)

Tableau de bord avec :
- Nombre d'appareils, isoles, bloques, statistiques a haut risque
- Score de securite (0-100%)
- Grille d'appareils groupes par niveau de risque
- Evenements d'anomalies recents

### Appareils (`/iot-guard/devices`)

Tableau de gestion des appareils :
- MAC, IP, nom d'hote, fabricant, classe, risque, score, zone, statut
- Cliquer pour voir le modal de details avec dependances cloud et anomalies
- Actions rapides : Isoler, Approuver, Bloquer

### Politiques (`/iot-guard/policies`)

Regles de classification par fabricant :
- Voir/ajouter/supprimer les regles de fabricant
- Configurer le prefixe OUI, le motif, la classe, le niveau de risque
- Table de reference des classes d'appareils

### Parametres (`/iot-guard/settings`)

Options de configuration :
- Activer/desactiver le service
- Intervalle de scan
- Seuil d'isolation automatique
- Sensibilite de detection d'anomalies
- Politique de zone (bloquer LAN, autoriser internet, limite de bande passante)
- Gestion des listes blanches/noires

## Methodes RPCD

| Methode | Description |
|--------|-------------|
| `status` | Statistiques du tableau de bord |
| `get_devices` | Lister les appareils (filtre optionnel) |
| `get_device` | Details de l'appareil avec carte cloud |
| `get_anomalies` | Evenements d'anomalies recents |
| `get_vendor_rules` | Lister les regles de classification |
| `get_cloud_map` | Dependances cloud de l'appareil |
| `scan` | Declencher un scan reseau |
| `isolate_device` | Deplacer l'appareil vers la zone IoT |
| `trust_device` | Ajouter a la liste blanche |
| `block_device` | Bloquer l'appareil |
| `add_vendor_rule` | Ajouter une regle de classification |
| `delete_vendor_rule` | Supprimer une regle de classification |

## Acces public

L'apercu et la liste des appareils sont accessibles publiquement via le groupe ACL `unauthenticated`.

## Dependances

- secubox-iot-guard
- luci-base

## Licence

GPL-3.0
