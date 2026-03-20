[English](README.md) | Francais | [中文](README.zh.md)

# Auth Guardian pour OpenWrt

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Systeme complet de gestion de l'authentification et des sessions.

## Fonctionnalites

### Portail captif
- Pages d'accueil personnalisables
- Support logo et branding
- Acceptation des conditions d'utilisation

### Integration OAuth
- Connexion Google
- Authentification GitHub
- Connexion Facebook
- Connexion Twitter/X

### Systeme de bons
- Generation de codes d'acces
- Validite limitee dans le temps
- Restrictions de bande passante

### Gestion des sessions
- Cookies securises (HttpOnly, SameSite)
- Controle du timeout de session
- Limites de sessions concurrentes

### Regles de contournement
- Liste blanche MAC
- Liste blanche IP
- Exceptions de domaines

## Installation

```bash
opkg update
opkg install luci-app-auth-guardian
```

## Licence

Licence MIT - CyberMind Security
