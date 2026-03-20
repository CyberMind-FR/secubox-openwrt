[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI ZKP Hamiltonian Dashboard

Interface web pour la cryptographie a preuve sans divulgation de connaissance basee sur le probleme du Cycle Hamiltonien (Blum 1986).

## Fonctionnalites

- **Generation de Cles** - Creer des paires graphe + cycle hamiltonien
- **Creation de Preuves** - Generer des preuves NIZK utilisant l'heuristique Fiat-Shamir
- **Verification** - Valider les preuves avec resultat ACCEPTE/REJETE
- **Gestion des Cles** - Lister, voir et supprimer les cles sauvegardees

## Capture d'Ecran

```
┌─────────────────────────────────────────────────────┐
│  ZKP Hamiltonian Cryptography          [v1.0.0]    │
├─────────────────────────────────────────────────────┤
│  Cles: 3    Noeuds Max: 50    Hash: SHA3-256       │
├─────────────────────────────────────────────────────┤
│  🔑 Generer Nouvelle Cle                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Nom      │ │ Noeuds   │ │ Densite  │ [Generer] │
│  │ ma_cle   │ │ 20       │ │ 0.8      │            │
│  └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│  🗂️ Cles Sauvegardees                               │
│  ┌─────────┬───────┬────────┬─────────┬──────────┐ │
│  │ Nom     │ Noeuds│ Graphe │ Cree    │ Actions  │ │
│  ├─────────┼───────┼────────┼─────────┼──────────┤ │
│  │ test_1  │ 20    │ 1.2 KB │ 10:15   │ P  V  X  │ │
│  │ demo    │ 30    │ 2.1 KB │ 09:30   │ P  V  X  │ │
│  └─────────┴───────┴────────┴─────────┴──────────┘ │
└─────────────────────────────────────────────────────┘
```

## Emplacement Menu

`Statut > Cryptographie ZKP`

## Dependances

- `zkp-hamiltonian` - Outils CLI (zkp_keygen, zkp_prover, zkp_verifier)
- OpenSSL (pour SHA3-256)

## Methodes RPCD

| Methode | Parametres | Description |
|---------|------------|-------------|
| `status` | - | Version de la librairie, nombre de cles, chemins |
| `keygen` | nodes, density, name | Generer graphe + cycle |
| `prove` | name | Creer une preuve NIZK |
| `verify` | name | Verifier la preuve → ACCEPTE/REJETE |
| `list_keys` | - | Lister toutes les cles sauvegardees |
| `delete_key` | name | Supprimer la cle et les fichiers |
| `get_graph` | name | Obtenir les metadonnees du graphe |

## Utilisation

### Generer une Cle

1. Entrer un nom pour la cle (ex. `mon_secret`)
2. Selectionner le nombre de noeuds (4-50, defaut 20)
3. Choisir la densite d'aretes (0.5-1.0, defaut 0.8)
4. Cliquer sur **Generer**

### Creer et Verifier une Preuve

1. Cliquer sur **Prouver** sur une cle sauvegardee
2. Attendre la generation de la preuve
3. Cliquer sur **Verifier** pour valider
4. Le resultat affiche **ACCEPTE** ou **REJETE**

## Stockage des Fichiers

```
/var/lib/zkp/
├── graphs/     # Fichiers graphe binaires (.graph)
├── keys/       # Fichiers de cycle hamiltonien (.key)
└── proofs/     # Preuves generees (.proof)
```

## Protocole

Le protocole ZKP prouve la connaissance d'un cycle hamiltonien dans un graphe sans reveler le cycle :

1. Le **Prouveur** a le graphe G et le cycle hamiltonien secret H
2. Le **Prouveur** cree une permutation aleatoire π, calcule G' = π(G)
3. Le **Prouveur** s'engage sur les aretes de G' utilisant SHA3-256
4. Le **Defi** est derive via Fiat-Shamir (hash de G, G', engagements)
5. La **Reponse** revele soit :
   - Defi=0 : La permutation π (prouve G ≅ G')
   - Defi=1 : Le cycle dans G' (prouve que H existe)
6. Le **Verificateur** verifie les engagements et la reponse

Securite : ~2^-128 erreur de solidite avec SHA3-256.

## Compilation

```bash
# Dans le buildroot OpenWrt
make package/luci-app-zkp/compile V=s

# Installer
opkg install luci-app-zkp_*.ipk
```

## Deploiement Rapide (Developpement)

```bash
# Deployer sur le routeur
scp htdocs/luci-static/resources/view/zkp/overview.js root@192.168.255.1:/www/luci-static/resources/view/zkp/
scp root/usr/libexec/rpcd/luci.zkp root@192.168.255.1:/usr/libexec/rpcd/
ssh root@192.168.255.1 'killall rpcd; /etc/init.d/rpcd start'
```

## Licence

GPL-2.0-or-later

## Auteur

SecuBox / CyberMind.FR
