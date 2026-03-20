[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox AI Gateway

**Classificateur de Donnees (Moteur de Souverainete) pour la Conformite ANSSI CSPN**

L'AI Gateway implemente un routage intelligent des requetes IA base sur la classification de sensibilite des donnees, assurant la souverainete des donnees et la conformite RGPD.

## Fonctionnalites

- **Classification des donnees a trois niveaux** : LOCAL_ONLY, SANITIZED, CLOUD_DIRECT
- **Support multi-fournisseurs** : LocalAI > Mistral (UE) > Claude > GPT > Gemini > xAI
- **API compatible OpenAI** sur le port 4050
- **Anonymisation PII** pour le niveau fournisseur UE
- **Journalisation d'audit ANSSI CSPN**
- **Mode hors ligne** pour fonctionnement isole

## Niveaux de Classification

| Niveau | Contenu | Destination |
|--------|---------|-------------|
| `LOCAL_ONLY` | IPs, MACs, identifiants, cles, logs | LocalAI (sur l'appareil) |
| `SANITIZED` | PII pouvant etre anonymisees | Mistral UE (opt-in) |
| `CLOUD_DIRECT` | Requetes generiques | Tout fournisseur (opt-in) |

## Hierarchie des Fournisseurs

1. **LocalAI** (Priorite 0) - Toujours sur l'appareil, pas de cle API requise
2. **Mistral** (Priorite 1) - Souverain UE, conforme RGPD
3. **Claude** (Priorite 2) - Anthropic
4. **OpenAI** (Priorite 3) - Modeles GPT
5. **Gemini** (Priorite 4) - Google
6. **xAI** (Priorite 5) - Modeles Grok

Tous les fournisseurs cloud sont en **opt-in** et necessitent une configuration explicite.

## Reference CLI

```sh
# Statut
aigatewayctl status

# Test de classification
aigatewayctl classify "L'IP du serveur est 192.168.1.100"
aigatewayctl sanitize "Mot de passe utilisateur=secret sur 192.168.1.1"

# Gestion des fournisseurs
aigatewayctl provider list
aigatewayctl provider enable mistral
aigatewayctl provider test localai

# Audit
aigatewayctl audit stats
aigatewayctl audit tail
aigatewayctl audit export

# Mode hors ligne (force LOCAL_ONLY)
aigatewayctl offline-mode on
aigatewayctl offline-mode off
```

## Utilisation de l'API

La passerelle fournit une API compatible OpenAI :

```sh
# Completion de chat
curl -X POST http://127.0.0.1:4050/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Combien font 2+2?"}]}'

# Lister les modeles
curl http://127.0.0.1:4050/v1/models

# Verification de sante
curl http://127.0.0.1:4050/health
```

## Configuration

### Options UCI

```sh
# Configuration principale
uci set ai-gateway.main.enabled='1'
uci set ai-gateway.main.proxy_port='4050'
uci set ai-gateway.main.offline_mode='0'

# Activer Mistral (fournisseur UE)
uci set ai-gateway.mistral.enabled='1'
uci set ai-gateway.mistral.api_key='votre-cle-api'
uci commit ai-gateway
```

### Modeles de Classification

Editez `/etc/config/ai-gateway` pour personnaliser les modeles de detection :

```uci
config patterns 'local_only_patterns'
    list pattern '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'
    list pattern 'password|secret|token'
    list pattern 'BEGIN.*PRIVATE KEY'
```

## Journalisation d'Audit

Les journaux d'audit sont stockes au format JSONL pour la conformite ANSSI CSPN :

```
/var/log/ai-gateway/audit.jsonl
```

Chaque entree inclut :
- Horodatage (ISO 8601)
- ID de requete
- Decision de classification
- Modele detecte
- Fournisseur utilise
- Statut d'anonymisation

Export pour revue de conformite :
```sh
aigatewayctl audit export
# Cree : /tmp/ai-gateway-audit-YYYYMMDD-HHMMSS.jsonl.gz
```

## Points de Conformite ANSSI CSPN

1. **Souverainete des donnees** : Le niveau LOCAL_ONLY n'envoie jamais de donnees a l'exterieur
2. **Preference UE** : Mistral (France) priorise sur les fournisseurs US
3. **Piste d'audit** : Toutes les classifications journalisees avec horodatages
4. **Capacite hors ligne** : Peut fonctionner entierement isole
5. **Consentement explicite** : Tous les fournisseurs cloud necessitent un opt-in

## Emplacements des Fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/ai-gateway` | Configuration UCI |
| `/usr/sbin/aigatewayctl` | Controleur CLI |
| `/usr/lib/ai-gateway/` | Scripts de bibliotheque |
| `/var/log/ai-gateway/audit.jsonl` | Journal d'audit |
| `/tmp/ai-gateway/` | Etat d'execution |

## Dependances

- `jsonfilter` (natif OpenWrt)
- `wget-ssl` (support HTTPS)
- `secubox-app-localai` (optionnel, pour l'inference locale)

## Licence

Licence MIT - Copyright (C) 2026 CyberMind.fr
