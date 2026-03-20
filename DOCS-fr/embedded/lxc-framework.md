# Framework LXC SecuBox (Apercu)

> **Languages:** [English](../../DOCS/embedded/lxc-framework.md) | Francais | [中文](../../DOCS-zh/embedded/lxc-framework.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Ce document presente l'outillage LXC de base ajoute a l'etape 8. C'est une fondation pour les futures "Applications SecuBox" empaquetees sous forme de conteneurs LXC (ex., Lyrion) et explique le workflow combine CLI/UCI.

---

## Composants

1. **Configuration UCI :** `/etc/config/lxcapps` (une section par conteneur).
2. **Racine de stockage :** `/srv/lxc/<name>/` (rootfs, config, logs).
3. **Templates :** `/usr/share/secubox/lxc/templates/` (scripts/tarballs ; `debian` par defaut).
4. **Assistant CLI :** `secubox-tools/lxc/secubox-lxc` (installer vers `/usr/sbin/secubox-lxc`).

`secubox-lxc` necessite les paquets LXC standard d'OpenWrt et utilise une syntaxe compatible BusyBox.

---

## Utilisation CLI

```bash
secubox-lxc list        # afficher les conteneurs definis
secubox-lxc create lyrion --bridge br-dmz --ip 192.168.50.10
secubox-lxc start lyrion
secubox-lxc stop lyrion
secubox-lxc status lyrion
secubox-lxc delete lyrion
```

Chaque appel `create` cree le repertoire du conteneur sous `/srv/lxc/<name>` et ecrit une section `config container '<name>'` correspondante dans `/etc/config/lxcapps`. Cela le rend decouvrable pour les futures integrations LuCI.

---

## Schema UCI

```uci
config container 'lyrion'
    option bridge 'br-dmz'
    option ip '192.168.50.10'
    option gateway '192.168.50.1'
    option dns '1.1.1.1'
    option memory '1024'
```

Des options supplementaires (template, rootfs, scripts personnalises) peuvent etre ajoutees ulterieurement ; le CLI supporte deja les drapeaux `--template`, `--memory`, `--bridge`, `--ip`, `--gateway` et `--dns`.

---

## Stockage et Templates

- Chemin rootfs par defaut : `/srv/lxc/<name>/rootfs`.
- Recherche de template : argument CLI `--template` -> `/usr/share/secubox/lxc/templates/<name>` -> systeme `lxc-create -t debian`.
- Le bridge est `br-lan` par defaut ; utilisez `--bridge br-dmz` pour les conteneurs DMZ.

---

## Travaux futurs

- Exposer `/etc/config/lxcapps` via RPC + LuCI pour que les manifestes/profils puissent declarer des applications LXC.
- Distribuer Lyrion et d'autres templates de conteneurs aux cotes des applications Docker dans l'App Store.
- Reutiliser le systeme de profils pour installer les dependances LXC et provisionner les conteneurs automatiquement.

Pour l'instant, cet outillage permet aux utilisateurs avances de valider LXC sur OpenWrt ARM64 et fournit a l'App Store une fondation coherente.
