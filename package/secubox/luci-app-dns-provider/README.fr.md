# luci-app-dns-provider

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Interface web LuCI pour le gestionnaire de fournisseur DNS SecuBox.

## Apercu

Fournit une interface web pour gerer les enregistrements DNS via les API des fournisseurs (OVH, Gandi, Cloudflare). Deux vues : gestion des enregistrements et configuration des parametres.

## Vues

### Enregistrements (`dns-provider/records`)
- Barre d'etat : fournisseur, zone, etat d'activation
- Boutons d'action : Ajouter un enregistrement, Synchroniser les Vhosts HAProxy, ACME DNS-01, Actualiser
- Affichage des enregistrements de zone (sortie brute de l'API du fournisseur)
- Modal d'ajout d'enregistrement : type, sous-domaine, cible, TTL
- Verificateur de propagation DNS (1.1.1.1, 8.8.8.8, 9.9.9.9)

### Parametres (`dns-provider/settings`)
- General : activer, selection du fournisseur, zone
- OVH : endpoint, app_key, app_secret, consumer_key
- Gandi : cle API / PAT
- Cloudflare : token API, zone_id
- Bouton de test des identifiants

## Methodes RPCD

| Methode | Parametres | Description |
|---|---|---|
| `get_config` | — | Configuration avec secrets masques |
| `list_records` | — | Recuperer les enregistrements de zone depuis le fournisseur |
| `add_record` | type, subdomain, target, ttl | Creer un enregistrement DNS |
| `remove_record` | type, subdomain | Supprimer un enregistrement DNS |
| `sync_records` | — | Synchroniser les vhosts HAProxy vers DNS |
| `verify_record` | fqdn | Verifier la propagation |
| `test_credentials` | — | Valider les identifiants API |
| `acme_dns01` | domain | Emettre un certificat via DNS-01 |

## Fichiers

```
root/usr/libexec/rpcd/luci.dns-provider              Gestionnaire RPCD
root/usr/share/luci/menu.d/luci-app-dns-provider.json Entree de menu
root/usr/share/rpcd/acl.d/luci-app-dns-provider.json  Permissions ACL
htdocs/.../view/dns-provider/records.js               Vue des enregistrements
htdocs/.../view/dns-provider/settings.js              Vue des parametres
```

## Dependances

- `luci-base`
- `secubox-app-dns-provider`
