[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI App - Key Storage Manager (KSM)

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif


Systeme centralise de gestion des cles cryptographiques pour OpenWrt avec support des modules de securite materielle (HSM) pour les peripheriques Nitrokey et YubiKey.

## Apercu

Le Key Storage Manager fournit une solution complete pour gerer les cles cryptographiques, certificats, secrets et cles SSH sur OpenWrt. Il supporte a la fois le stockage logiciel des cles et les operations cryptographiques materielles utilisant des tokens de securite USB.

### Fonctionnalites

- **Gestion des Cles Cryptographiques**
  - Generation de cles RSA, ECDSA et Ed25519
  - Import/export de cles aux formats PEM, DER et PKCS#12
  - Suppression securisee avec support shred
  - Suivi et organisation des metadonnees des cles

- **Support Module de Securite Materielle (HSM)**
  - Detection automatique des peripheriques Nitrokey et YubiKey
  - Generation de cles sur puce
  - Gestion des PIN et securite
  - Operations cryptographiques materielles

- **Gestion des Certificats**
  - Generation de demandes de signature de certificat (CSR)
  - Import de certificats SSL/TLS
  - Verification de chaine de certificats
  - Alertes d'expiration (< 30 jours)

- **Stockage des Secrets**
  - Stockage chiffre pour cles API, mots de passe et tokens
  - Organisation categorisee des secrets
  - Rotation automatique des secrets (optionnel)
  - Journalisation des acces pour audit

- **Gestion des Cles SSH**
  - Generation de paires de cles SSH (RSA, ECDSA, Ed25519)
  - Deploiement des cles vers des hotes distants
  - Support des certificats SSH
  - Export et partage de cles publiques

- **Journalisation d'Audit**
  - Suivi complet des activites
  - Export des logs au format CSV
  - Timeline d'audit filtrable
  - Responsabilite des actions utilisateur

## Installation

### Dependances

Le module necessite les packages suivants :

- `luci-base`
- `rpcd`
- `openssl-util`
- `gnupg2`
- `nitropy` (pour support Nitrokey)
- `yubikey-manager` (pour support YubiKey)
- `opensc` (framework smart card)
- `libccid` (pilote USB CCID)
- `pcscd` (daemon PC/SC)

### Installation depuis un Package

```bash
# Transferer le package vers le routeur
scp luci-app-ksm-manager_*.ipk root@192.168.1.1:/tmp/

# Installer sur le routeur
ssh root@192.168.1.1
opkg update
opkg install /tmp/luci-app-ksm-manager_*.ipk

# Redemarrer les services
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### Compilation depuis les Sources

```bash
# Dans le SDK OpenWrt
make package/luci-app-ksm-manager/compile V=s
make package/luci-app-ksm-manager/install

# Le package sera dans bin/packages/*/base/
```

## Configuration Initiale

### 1. Installer les Pilotes HSM (si utilisation de tokens materiels)

Pour les peripheriques Nitrokey :

```bash
opkg install nitropy python3-pip
```

Pour les peripheriques YubiKey :

```bash
opkg install yubikey-manager
```

### 2. Configurer les Permissions USB

Assurez-vous que votre utilisateur a acces aux peripheriques USB :

```bash
# Ajouter les regles udev pour Nitrokey
cat > /etc/udev/rules.d/60-nitrokey.rules <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="20a0", ATTR{idProduct}=="42b1", MODE="0660", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="20a0", ATTR{idProduct}=="42b2", MODE="0660", GROUP="plugdev"
EOF

# Ajouter les regles udev pour YubiKey
cat > /etc/udev/rules.d/70-yubikey.rules <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", MODE="0660", GROUP="plugdev"
EOF

# Recharger les regles udev
udevadm control --reload-rules
```

### 3. Initialiser le Keystore

Acceder a l'interface web LuCI :

1. Naviguer vers **Securite -> Key Storage Manager -> Vue d'ensemble**
2. Le keystore sera automatiquement initialise au premier acces
3. Configurer les parametres dans **Securite -> Key Storage Manager -> Parametres**

## Guide d'Utilisation

### Gestion des Cles

#### Generer une Nouvelle Cle

1. Aller dans l'onglet **Cles**
2. Selectionner le type de cle (RSA, ECDSA ou Ed25519)
3. Choisir la taille de cle (4096 bits recommande pour RSA)
4. Entrer un libelle pour identification
5. Optionnellement definir une phrase de passe pour le chiffrement
6. Cliquer **Generer**

#### Importer une Cle Existante

1. Aller dans l'onglet **Cles**
2. Faire defiler jusqu'a la section **Importer une Cle Existante**
3. Entrer un libelle
4. Selectionner le format (PEM, DER ou PKCS#12)
5. Coller les donnees de la cle ou uploader un fichier
6. Entrer la phrase de passe si chiffree
7. Cliquer **Importer**

#### Exporter une Cle

1. Trouver la cle dans le tableau
2. Cliquer **Exporter**
3. Selectionner le format et si inclure la cle privee
4. Cliquer **Exporter** pour telecharger

### Utilisation des Modules de Securite Materielle

#### Initialiser un Peripherique HSM

1. Connecter le Nitrokey ou YubiKey via USB
2. Aller dans l'onglet **Peripheriques HSM**
3. Cliquer **Scanner les Peripheriques**
4. Selectionner le peripherique detecte
5. Cliquer **Initialiser**
6. Definir le PIN Admin (6-32 caracteres)
7. Definir le PIN Utilisateur (6-32 caracteres)

**Important :** Stocker les PIN en securite. Une reinitialisation usine est requise si oublies.

#### Generer une Cle sur HSM

1. Aller dans l'onglet **Peripheriques HSM**
2. Selectionner le peripherique initialise
3. Cliquer **Generer une Cle**
4. Choisir le type et la taille de cle
5. Entrer un libelle
6. Fournir le PIN Utilisateur quand demande

Les cles generees sur puce ne quittent jamais le peripherique materiel.

### Gestion des Certificats

#### Generer une Demande de Signature de Certificat (CSR)

1. Aller dans l'onglet **Certificats**
2. Selectionner une cle existante ou en generer une nouvelle
3. Entrer le Common Name (CN), ex. `example.com`
4. Optionnellement ajouter Organisation, Pays
5. Cliquer **Generer**
6. Copier le CSR et soumettre a l'Autorite de Certification

#### Importer un Certificat

1. Apres reception du certificat signe de la CA
2. Aller dans l'onglet **Certificats**
3. Selectionner la cle associee
4. Coller les donnees du certificat (format PEM)
5. Optionnellement inclure la chaine de certificats
6. Cliquer **Importer**

#### Verifier un Certificat

1. Trouver le certificat dans le tableau
2. Cliquer **Verifier**
3. Verifier le statut de validite, validation de chaine et expiration

### Gestion des Secrets

#### Stocker un Secret

1. Aller dans l'onglet **Secrets**
2. Entrer un libelle descriptif (ex. "Cle API GitHub")
3. Selectionner la categorie (Cle API, Mot de passe, Token, etc.)
4. Entrer la valeur du secret
5. Activer la rotation automatique si desire
6. Cliquer **Ajouter**

#### Recuperer un Secret

1. Trouver le secret dans le tableau
2. Cliquer **Voir**
3. **Attention :** L'acces est journalise
4. Copier le secret dans le presse-papiers
5. Le secret se masque automatiquement apres 30 secondes

#### Faire Tourner un Secret

1. Trouver le secret dans le tableau
2. Cliquer **Rotation**
3. Entrer la nouvelle valeur du secret
4. Confirmer la rotation

### Gestion des Cles SSH

#### Generer une Paire de Cles SSH

1. Aller dans l'onglet **Cles SSH**
2. Entrer un libelle
3. Selectionner le type de cle (Ed25519 recommande)
4. Ajouter un commentaire optionnel
5. Cliquer **Generer**
6. Copier la cle publique pour deploiement

#### Deployer vers un Hote Distant

1. Selectionner la cle SSH dans la liste
2. Cliquer sur la section deploiement
3. Entrer le nom d'hote/IP cible
4. Entrer le nom d'utilisateur cible
5. Cliquer **Deployer**

Alternativement, copier manuellement la cle publique dans `~/.ssh/authorized_keys` sur l'hote distant.

### Logs d'Audit

#### Voir l'Activite

1. Aller dans l'onglet **Logs d'Audit**
2. Revoir la timeline d'activite chronologique
3. Filtrer par date, utilisateur, action ou ressource
4. Les logs se rafraichissent automatiquement toutes les 15 secondes

#### Exporter les Logs

1. Cliquer **Exporter Logs (CSV)**
2. Le fichier CSV se telecharge avec toutes les entrees d'audit
3. Ouvrir dans un tableur pour analyse

### Parametres

#### Configurer le Keystore

1. Aller dans l'onglet **Parametres**
2. Definir le chemin du keystore (par defaut : `/etc/ksm/keystore.db`)
3. Configurer le timeout de verrouillage automatique
4. Activer/desactiver la sauvegarde automatique
5. Definir la planification de sauvegarde (format cron)

#### Parametres d'Audit

- Activer/desactiver la journalisation d'audit
- Definir la periode de retention (par defaut : 90 jours)
- Choisir le niveau de log (Info, Warning, Error)

#### Parametres d'Alerte

- Seuil d'expiration de certificat (par defaut : 30 jours)
- Rappels de rotation de secrets
- Alertes de deconnexion HSM

#### Sauvegarde et Restauration

**Creer une Sauvegarde :**
1. Cliquer **Creer une Sauvegarde Chiffree**
2. Entrer une phrase de passe forte
3. Confirmer la phrase de passe
4. Telecharger l'archive chiffree

**Restaurer une Sauvegarde :**
1. Cliquer **Restaurer depuis une Sauvegarde**
2. Selectionner le fichier de sauvegarde
3. Entrer la phrase de passe de sauvegarde
4. Confirmer la restauration (ecrase les donnees existantes)

## Bonnes Pratiques de Securite

### Gestion des Cles

1. **Utiliser des Phrases de Passe Fortes :** Minimum 16 caracteres avec majuscules, chiffres et symboles
2. **Taille de Cle :** Utiliser RSA 4096 bits ou Ed25519 pour une securite maximale
3. **Suppression Securisee :** Toujours activer "effacement securise" lors de la suppression de cles sensibles
4. **Rotation Reguliere :** Faire tourner les cles SSH et secrets tous les 90 jours
5. **Stockage Materiel :** Utiliser un HSM pour les cles de production quand possible

### Utilisation HSM

1. **Complexite des PIN :** Utiliser des PIN Admin et Utilisateur differents (minimum 8 caracteres)
2. **Stockage des PIN :** Stocker les PIN dans un gestionnaire de mots de passe, pas sur le peripherique
3. **Tokens de Sauvegarde :** Garder un peripherique HSM de sauvegarde pour la reprise apres sinistre
4. **Securite Physique :** Securiser les peripheriques HSM quand non utilises
5. **Limites de Tentatives :** Le HSM se verrouille apres des tentatives de PIN echouees - planifier en consequence

### Gestion des Certificats

1. **Surveiller l'Expiration :** Activer les alertes pour les certificats expirant dans < 30 jours
2. **Verifier les Chaines :** Toujours verifier la chaine de certificats avant deploiement
3. **Renouveler Tot :** Renouveler les certificats 2 semaines avant expiration
4. **Revocation :** Garder les procedures de revocation documentees
5. **CA Intermediaires :** Stocker les certificats intermediaires avec les certificats d'entite finale

### Stockage des Secrets

1. **Journalisation des Acces :** Revoir regulierement les logs d'audit pour les acces non autorises
2. **Moindre Privilege :** N'accorder l'acces aux secrets qu'aux utilisateurs necessaires
3. **Rotation Automatique :** Activer pour les cles API et tokens
4. **Chiffrement :** Les secrets sont chiffres avec AES-256-GCM
5. **Chiffrement des Sauvegardes :** Toujours chiffrer les sauvegardes avec une phrase de passe forte

## Depannage

### HSM Non Detecte

**Probleme :** Nitrokey ou YubiKey n'apparait pas dans la liste des peripheriques

**Solutions :**
1. Verifier la connexion USB - essayer un autre port
2. Verifier les pilotes installes : `lsusb` devrait montrer le peripherique
3. Verifier les permissions : `ls -la /dev/hidraw*`
4. Redemarrer pcscd : `/etc/init.d/pcscd restart`
5. Verifier les regles udev dans `/etc/udev/rules.d/`

### Erreurs de Permission Refusee

**Probleme :** Impossible d'acceder a /dev/hidraw* ou aux fichiers keystore

**Solutions :**
1. Ajouter l'utilisateur au groupe `plugdev` : `usermod -a -G plugdev www-data`
2. Verifier les permissions de fichiers : `ls -la /etc/ksm/`
3. Verifier que RPCD s'execute avec le bon utilisateur
4. Verifier la configuration ACL dans `/usr/share/rpcd/acl.d/`

### Keystore Verrouille

**Probleme :** Erreur "Keystore verrouille" lors de l'acces aux cles

**Solutions :**
1. Deverrouiller via Parametres -> Keystore -> Deverrouiller
2. Verifier le parametre de timeout de verrouillage automatique
3. Verifier que le fichier keystore existe : `/etc/ksm/keystore.db`
4. Verifier l'espace disque : `df -h /etc/ksm`

### Echec de Verification de Certificat

**Probleme :** Erreurs de validation de chaine de certificats

**Solutions :**
1. S'assurer que les certificats intermediaires sont importes
2. Verifier l'ordre des certificats (entite finale -> intermediaire -> racine)
3. Verifier que le certificat n'a pas expire
4. Verifier que l'horloge systeme est correcte : `date`
5. Mettre a jour le bundle CA : `opkg update && opkg upgrade ca-bundle`

### Echec de Restauration de Sauvegarde

**Probleme :** Impossible de restaurer depuis une sauvegarde

**Solutions :**
1. Verifier l'integrite du fichier de sauvegarde (verifier la taille du fichier)
2. S'assurer de la bonne phrase de passe
3. Verifier l'espace disque disponible
4. Essayer la sauvegarde sur un autre systeme pour test
5. Contacter le support si la sauvegarde est corrompue

## Reference API

### Methodes RPC

Le backend RPCD (`luci.ksm-manager`) fournit 22 methodes :

**Statut & Info :**
- `status()` - Obtenir le statut du service
- `get_info()` - Obtenir les informations systeme

**Gestion HSM :**
- `list_hsm_devices()` - Lister les peripheriques HSM connectes
- `get_hsm_status(serial)` - Obtenir le statut du peripherique HSM
- `init_hsm(serial, admin_pin, user_pin)` - Initialiser le HSM
- `generate_hsm_key(serial, key_type, key_size, label)` - Generer une cle sur HSM

**Gestion des Cles :**
- `list_keys()` - Lister toutes les cles
- `generate_key(type, size, label, passphrase)` - Generer une nouvelle cle
- `import_key(label, key_data, format, passphrase)` - Importer une cle
- `export_key(id, format, include_private, passphrase)` - Exporter une cle
- `delete_key(id, secure_erase)` - Supprimer une cle

**Gestion des Certificats :**
- `generate_csr(key_id, subject_dn, san_list)` - Generer un CSR
- `import_certificate(key_id, cert_data, chain)` - Importer un certificat
- `list_certificates()` - Lister les certificats
- `verify_certificate(cert_id)` - Verifier un certificat

**Gestion des Secrets :**
- `store_secret(label, secret_data, category, auto_rotate)` - Stocker un secret
- `retrieve_secret(secret_id)` - Recuperer un secret
- `list_secrets()` - Lister les secrets
- `rotate_secret(secret_id, new_secret_data)` - Faire tourner un secret

**Gestion SSH :**
- `generate_ssh_key(label, key_type, comment)` - Generer une cle SSH
- `deploy_ssh_key(key_id, target_host, target_user)` - Deployer une cle SSH

**Audit :**
- `get_audit_logs(limit, offset, filter_type)` - Obtenir les logs d'audit

## Emplacements des Fichiers

- **Base de donnees Keystore :** `/etc/ksm/keystore.db`
- **Configuration :** `/etc/ksm/config.json`
- **Cles :** `/etc/ksm/keys/`
- **Certificats :** `/etc/ksm/certs/`
- **Secrets :** `/etc/ksm/secrets/`
- **Log d'Audit :** `/var/log/ksm-audit.log`
- **Backend RPCD :** `/usr/libexec/rpcd/luci.ksm-manager`

## Developpement

### Structure du Projet

```
luci-app-ksm-manager/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/ksm-manager/
│   │   ├── overview.js
│   │   ├── keys.js
│   │   ├── hsm.js
│   │   ├── certificates.js
│   │   ├── secrets.js
│   │   ├── ssh.js
│   │   ├── audit.js
│   │   └── settings.js
│   └── ksm-manager/
│       └── api.js
└── root/
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.ksm-manager
        └── share/
            ├── luci/menu.d/
            │   └── luci-app-ksm-manager.json
            └── rpcd/acl.d/
                └── luci-app-ksm-manager.json
```

### Execution des Tests

```bash
# Valider les scripts shell
shellcheck root/usr/libexec/rpcd/luci.ksm-manager

# Valider les fichiers JSON
jsonlint root/usr/share/luci/menu.d/luci-app-ksm-manager.json
jsonlint root/usr/share/rpcd/acl.d/luci-app-ksm-manager.json

# Tester les methodes RPCD
ubus call luci.ksm-manager status
ubus call luci.ksm-manager list_keys
```

## Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Suivre les standards de codage OpenWrt
2. Tester sur du materiel reel avant soumission
3. Mettre a jour la documentation pour les nouvelles fonctionnalites
4. Inclure des tests de validation

## Licence

Copyright (C) 2025 SecuBox Project

Sous licence Apache License, Version 2.0

## Support

- **Issues :** [GitHub Issues](https://github.com/secubox/luci-app-ksm-manager/issues)
- **Documentation :** [SecuBox Wiki](https://wiki.secubox.org)
- **Forum :** [OpenWrt Forum - SecuBox](https://forum.openwrt.org/tag/secubox)

## Changelog

### Version 1.0.0 (2025-01-XX)

- Version initiale
- Support HSM complet (Nitrokey, YubiKey)
- Gestion des cles cryptographiques
- Gestion des certificats avec generation CSR
- Stockage chiffre des secrets
- Gestion et deploiement des cles SSH
- Journalisation d'audit complete
- Fonctionnalite de sauvegarde et restauration
