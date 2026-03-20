[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Master-Link

Integration securisee en maillage pour les appliances SecuBox. Un noeud maitre genere des jetons d'adhesion a usage unique, sert le bundle IPK secubox et approuve les nouveaux pairs via une confiance basee sur la blockchain. Supporte la hierarchie gigogne (imbriquee) ou les noeuds approuves peuvent devenir des sous-maitres.

## Apercu

```
  MAITRE (profondeur 0)
  ├── Pair A (profondeur 1)
  ├── Sous-Maitre B (profondeur 1)
  │   ├── Pair C (profondeur 2)
  │   └── Pair D (profondeur 2)
  └── Pair E (profondeur 1)
```

## Installation

```bash
opkg install secubox-master-link luci-app-master-link
```

## Configuration

```bash
# /etc/config/master-link

config master-link 'main'
    option enabled '1'
    option role 'master'          # master | peer | sub-master
    option upstream ''            # IP du maitre amont (pairs/sous-maitres)
    option depth '0'              # profondeur gigogne (0 = maitre racine)
    option max_depth '3'          # profondeur d'imbrication maximale
    option token_ttl '3600'       # validite du jeton en secondes
    option auto_approve '0'       # approuver automatiquement les demandes
    option ipk_path '/www/secubox-feed/secubox-master-link_*.ipk'
```

## Protocole d'Adhesion

1. **Le maitre genere un jeton** — jeton HMAC-SHA256 a usage unique avec TTL
2. **Le nouveau noeud ouvre la page d'accueil** — `http://<maitre>:7331/master-link/?token=...`
3. **Le nouveau noeud telecharge l'IPK** — telechargement valide par jeton via `/api/master-link/ipk`
4. **Le nouveau noeud envoie une demande d'adhesion** — empreinte + adresse soumises au maitre
5. **Le maitre approuve** — echange de cles TOFU, bloc blockchain enregistre, pair ajoute au maillage
6. **Optionnel : promouvoir en sous-maitre** — le pair approuve peut integrer ses propres pairs

## Points de Terminaison CGI

Tous servis sur le port 7331 sous `/api/master-link/`.

| Point | Methode | Auth | Description |
|-------|---------|------|-------------|
| `/token` | POST | Local uniquement | Generer un jeton d'adhesion |
| `/join` | POST | Jeton | Soumettre une demande d'adhesion |
| `/approve` | POST | Local uniquement | Approuver/rejeter un pair |
| `/status` | GET | Public/Local | Statut du maillage |
| `/ipk` | POST | Jeton | Telecharger l'IPK secubox |

## API RPCD

```bash
ubus call luci.master_link status '{}'
ubus call luci.master_link peers '{}'
ubus call luci.master_link tree '{}'
ubus call luci.master_link token_generate '{}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"approve"}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"reject","reason":"..."}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"promote"}'
ubus call luci.master_link token_cleanup '{}'
```

## Types de Blocs Blockchain

| Type | Description |
|------|-------------|
| `join_request` | Nouveau noeud demandant a rejoindre |
| `peer_approved` | Maitre a approuve le pair |
| `peer_rejected` | Maitre a rejete le pair |
| `peer_promoted` | Pair promu en sous-maitre |
| `token_generated` | Audit : jeton cree |

## Securite

- **Jetons** : HMAC-SHA256, usage unique, duree limitee (defaut 1h)
- **TOFU** : La premiere adhesion etablit la confiance via l'echange d'empreintes
- **Limitation de profondeur** : `max_depth` empeche l'imbrication illimitee
- **Integrite de la chaine** : Toutes les actions enregistrees comme blocs blockchain
- **Piste d'audit** : Cycle de vie des jetons et evenements des pairs interrogeables via la chaine

## Dependances

- `secubox-p2p` — reseau maille et blockchain
- `openssl-util` — generation de jetons HMAC
- `curl` — notification des pairs

## Licence

Apache-2.0
