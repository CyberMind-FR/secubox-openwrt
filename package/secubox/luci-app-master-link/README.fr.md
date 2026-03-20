[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI App Master-Link

Interface web LuCI pour la gestion du maillage SecuBox Master-Link.

## Installation

```bash
opkg install luci-app-master-link
```

Necessite `secubox-master-link` (installe automatiquement comme dependance).

## Acces

**SecuBox > Gestion du Maillage** dans le menu LuCI.

## Onglets

### Vue d'ensemble

S'adapte au role du noeud :

- **Maitre** : Badge de role, statistiques du maillage (pairs, profondeur, hauteur de la chaine), bouton Generer un Jeton avec URL prete pour QR
- **Pair** : Badge de role, info du maitre amont, profondeur propre, statut de synchronisation
- **Sous-maitre** : Info amont + nombre de pairs en aval

### Demandes d'Adhesion (maitre/sous-maitre uniquement)

- Tableau : nom d'hote, IP, empreinte, horodatage, statut
- Actions : Approuver, Rejeter, Promouvoir en sous-maitre
- Rafraichissement automatique toutes les 10 secondes

### Arbre du Maillage

- Vue hierarchique : maitre → pairs → sous-maitres → leurs pairs
- Indicateurs de profondeur et badges de role
- Statut en ligne/hors ligne par noeud

## Methodes RPCD

Tous les appels passent par l'objet ubus `luci.master_link` :

| Methode | Description |
|---------|-------------|
| `status` | Statut du noeud et statistiques du maillage |
| `peers` | Lister tous les pairs avec details d'adhesion |
| `tree` | Arbre topologique du maillage |
| `token_generate` | Creer un jeton d'adhesion a usage unique |
| `approve` | Approuver, rejeter ou promouvoir un pair |
| `token_cleanup` | Supprimer les jetons expires |

## Fichiers

| Fichier | Objectif |
|---------|----------|
| `root/usr/share/luci/menu.d/luci-app-master-link.json` | Entree de menu |
| `root/usr/share/rpcd/acl.d/luci-app-master-link.json` | Permissions ACL |
| `root/usr/libexec/rpcd/luci.master_link` | Point de terminaison RPCD |
| `htdocs/luci-static/resources/view/secubox/master-link.js` | Vue LuCI |

## Licence

Apache-2.0
