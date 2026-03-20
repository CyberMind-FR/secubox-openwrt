[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Utilitaires de Base SecuBox

Scripts utilitaires partages utilises par les autres packages SecuBox. Ce n'est pas un package OpenWrt compilable -- il fournit des fonctions shell communes et des scripts d'aide qui sont sources ou appeles par d'autres composants SecuBox.

## Fichiers Cles

| Chemin | Description |
|--------|-------------|
| `/usr/sbin/secubox-network-health` | Script de surveillance de la sante reseau |

## Utilisation

Le moniteur de sante reseau peut etre execute directement :

```bash
/usr/sbin/secubox-network-health
```

## Note

Ce package pourrait etre absorbe dans `secubox-core` dans une version future. Les nouveaux utilitaires partages devraient etre ajoutes a `secubox-core` a la place.

## Licence

Apache-2.0
