# Gestionnaire VHost et Notes sur le Reverse Proxy

> **Languages:** [English](../../DOCS/embedded/vhost-manager.md) | Francais | [中文](../../DOCS-zh/embedded/vhost-manager.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

SecuBox inclut `luci-app-vhost-manager` (tableau de bord LuCI + backend RPC) ainsi que l'assistant `scripts/vhostctl.sh` permettant aux applications, assistants et profils de publier de maniere declarative des services HTTP derriere nginx avec TLS et authentification HTTP optionnels.

---

## Prerequis

1. **Paquets** : `luci-app-vhost-manager` installe (installe le script RPCD + interface LuCI) et nginx avec SSL (`nginx-ssl`).
2. **Certificats** : ACME via `acme.sh` (automatique) ou fichiers PEM manuels pour `tls manual`.
3. **Applications** : Assurez-vous que le service en amont ecoute sur localhost ou LAN (ex., interface Zigbee2MQTT sur `http://127.0.0.1:8080`).
4. **Pare-feu** : Autoriser les ports entrants 80/443 sur l'interface WAN.

---

## CLI (`scripts/vhostctl.sh`)

Cet assistant manipule `/etc/config/vhosts` et peut etre invoque par les futurs assistants/installateurs de l'App Store.

```sh
# Lister les mappages existants
scripts/vhostctl.sh list

# Ajouter un reverse proxy HTTPS pour l'interface Zigbee2MQTT
scripts/vhostctl.sh add \
  --domain zigbee.home.lab \
  --upstream http://127.0.0.1:8080 \
  --tls acme \
  --websocket \
  --enable

# Activer/desactiver ou supprimer ulterieurement
scripts/vhostctl.sh disable --domain zigbee.home.lab
scripts/vhostctl.sh remove --domain zigbee.home.lab

# Recharger nginx apres modifications
scripts/vhostctl.sh reload
```

Options :

| Option | Description |
|--------|-------------|
| `--domain` | Nom d'hote public (obligatoire). |
| `--upstream` | URL du service local (`http://127.0.0.1:8080`). |
| `--tls off|acme|manual` | Strategie TLS. Utiliser `manual` + `--cert/--key` pour certificats personnalises. |
| `--auth-user/--auth-pass` | Activer l'authentification HTTP basique. |
| `--websocket` | Ajouter les en-tetes `Upgrade` pour les applications WebSocket. |
| `--enable` / `--disable` | Activer/desactiver sans supprimer. |

Le script est idempotent : executer `add` avec un domaine existant met a jour l'entree.

---

## Tableau de bord LuCI

Naviguez vers **Services -> SecuBox -> Gestionnaire VHost** pour :
- Voir les vhosts actifs/desactives, le statut TLS, les expirations de certificats.
- Modifier ou supprimer des entrees, demander des certificats ACME, consulter les logs d'acces.
- Utiliser le formulaire pour creer des entrees (domaine, upstream, TLS, authentification, WebSocket).

Le backend LuCI ecrit dans le meme fichier `/etc/config/vhosts`, donc les modifications depuis `vhostctl.sh` apparaissent immediatement.

---

## Exemple : Publier Zigbee2MQTT

1. Installez Zigbee2MQTT (Docker) et confirmez que l'interface ecoute sur le port 8080 (voir `docs/embedded/zigbee2mqtt-docker.md`).
2. Mappez-le derriere HTTPS :
   ```sh
   scripts/vhostctl.sh add \
     --domain zigbee.secubox.local \
     --upstream http://127.0.0.1:8080 \
     --tls acme \
     --websocket
   scripts/vhostctl.sh reload
   ```
3. (Optionnel) Utilisez LuCI pour demander des certificats et surveiller les logs.

---

## Mode DMZ + Workflow VHost

Lors de l'activation du nouveau mode reseau **Routeur + DMZ** (admin -> SecuBox -> Reseau -> Modes -> DMZ) :

1. Assignez `eth2` (ou un autre port physique) comme interface DMZ et attribuez-lui un sous-reseau tel que `192.168.50.1/24`.
2. Appliquez le mode ; le backend cree une zone pare-feu dediee (`dmz`) qui ne redirige que vers WAN.
3. Connectez les serveurs (ex., Lyrion, interface Zigbee2MQTT) au port DMZ afin qu'ils puissent atteindre Internet mais pas le LAN.
4. Utilisez `scripts/vhostctl.sh add ... --upstream http://192.168.50.10:32400` pour exposer le service DMZ via nginx avec TLS.

Le retour arriere est en un clic : utilisez la boite de dialogue "Confirmer / Annuler" des Modes Reseau dans la fenetre de 2 minutes pour restaurer automatiquement les configurations precedentes.

---

## Depannage

| Probleme | Solution |
|----------|----------|
| `scripts/vhostctl.sh add ...` retourne "Unknown option" | Assurez-vous que busybox `sh` est utilise (`/bin/sh`). |
| Certificat ACME manquant | Confirmez que `acme.sh` est installe, que le domaine pointe vers le routeur, que 80/443 sont accessibles. |
| Erreurs 502/504 | Verifiez le service amont, le pare-feu, ou changez `--upstream` pour l'IP LAN. |
| Le mode TLS manuel echoue | Fournissez les chemins complets vers les fichiers PEM et verifiez les permissions. |
| Modifications non visibles | Executez `scripts/vhostctl.sh reload` ou `ubus call luci.vhost-manager reload_nginx`. |

---

## Notes d'automatisation

- Les assistants/App Store peuvent appeler `scripts/vhostctl.sh` pour enregistrer les services lors de leur installation.
- Les profils peuvent conserver des manifestes declaratifs (domaine -> upstream) et appeler `vhostctl.sh add/remove` lors du changement de modes.
- `/etc/config/vhosts` reste la source unique de verite, consommee par l'application LuCI et le backend RPC.
