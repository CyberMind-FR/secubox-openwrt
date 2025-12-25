# 🔧 Guide d'Implémentation de Nouveaux Modules SecuBox

Ce guide fournit un framework structuré pour implémenter de nouveaux modules SecuBox avec suivi complet du développement.

---

## 📋 Template de Prompt d'Implémentation

Utilise ce template pour demander l'implémentation d'un nouveau module:

```markdown
## Nouveau Module SecuBox: {NOM_MODULE}

### 🎯 Contexte et Objectif

**Nom du module**: luci-app-{nom-module}
**Catégorie**: [Security / Network / System / Performance / Services]
**Description courte**: {Description en 1-2 phrases}
**Cas d'utilisation**: {Qui utilisera ce module et pourquoi}

### 📊 Fonctionnalités Requises

Liste numérotée des fonctionnalités principales:

1. **{Fonctionnalité 1}**: {Description détaillée}
   - Sous-fonctionnalité A
   - Sous-fonctionnalité B

2. **{Fonctionnalité 2}**: {Description détaillée}
   - Sous-fonctionnalité A
   - Sous-fonctionnalité B

3. **{Fonctionnalité 3}**: {Description détaillée}

### 🔌 Intégration Système

**Service système**: {nom du daemon/service}
**Commandes CLI**:
- `{commande1}` - {description}
- `{commande2}` - {description}

**Fichiers de configuration**:
- `/etc/{config-file}` - {description}
- `/var/run/{runtime-file}` - {description}

**Dépendances packages**:
- `{package1}` - {description}
- `{package2}` - {description}

### 🎨 Méthodes RPCD

Script: `/usr/libexec/rpcd/luci.{nom-module}`

#### Méthodes de Base
1. **status**: État du service
   - Retour: `{ "running": bool, "enabled": bool, "version": string, ... }`

2. **get_info**: Informations système
   - Retour: `{ ... }`

#### Méthodes de Gestion
3. **list_{ressource}**: Liste des ressources
   - Retour: `{ "{ressources}": [...] }`

4. **get_{ressource}**: Détails d'une ressource
   - Params: `id`
   - Retour: `{ ... }`

5. **add_{ressource}**: Créer une ressource
   - Params: `{ param1, param2, ... }`
   - Retour: `{ "success": bool, "id": string }`

6. **update_{ressource}**: Modifier une ressource
   - Params: `{ id, param1, param2, ... }`
   - Retour: `{ "success": bool }`

7. **delete_{ressource}**: Supprimer une ressource
   - Params: `id`
   - Retour: `{ "success": bool }`

#### Méthodes Spécifiques
8. **{methode_specifique_1}**: {Description}
9. **{methode_specifique_2}**: {Description}

### 🗄️ Configuration UCI

Fichier: `/etc/config/{nom-module}`

```uci
config global 'main'
    option enabled '1'
    option {param1} '{valeur}'
    option {param2} '{valeur}'

config {type_section} '{id_section}'
    option {param1} '{valeur}'
    option {param2} '{valeur}'
    list {param_list} '{valeur1}'
    list {param_list} '{valeur2}'
```

### 🎨 Interface Utilisateur (Views)

#### Vue 1: Overview/Dashboard
**Fichier**: `htdocs/luci-static/resources/view/{module}/overview.js`

**Éléments**:
- Status cards (service running, stats)
- Graphiques/visualisations
- Actions rapides
- Liens vers autres vues

**Auto-refresh**: Oui (5s pour status, 10s pour stats)

#### Vue 2: {Nom Vue 2}
**Fichier**: `htdocs/luci-static/resources/view/{module}/{vue2}.js`

**Éléments**:
- Tableau CRUD avec form.GridSection
- Modals pour création/édition
- Validation des inputs
- Confirmations de suppression

#### Vue 3: {Nom Vue 3}
**Fichier**: `htdocs/luci-static/resources/view/{module}/{vue3}.js`

**Éléments**:
- ...

### 🎯 Spécifications Techniques

#### Parsing de Sortie CLI
```bash
# Exemple de commande et parsing attendu
{commande} | {parsing}

# Output format attendu
{...}
```

#### Gestion d'Erreurs
- Erreur si service non installé: `{ "error": "Service not installed" }`
- Erreur si permission refusée: `{ "error": "Permission denied" }`
- Erreur si ressource inexistante: `{ "error": "Not found" }`

#### Sécurité
- Validation des inputs: {regex/validation}
- Sanitization des chaînes: Oui/Non
- Permissions requises: {root/user/...}

### 📦 Livrables Attendus

**IMPORTANT**: Génère TOUS les fichiers complets suivants:

1. **Makefile** avec dépendances correctes
2. **RPCD Backend** (`/root/usr/libexec/rpcd/luci.{module}`)
   - Toutes les méthodes implémentées
   - Gestion d'erreurs complète
   - JSON valide pour chaque retour
3. **API Client** (`/htdocs/luci-static/resources/{module}/api.js`)
   - Déclarations RPC pour toutes les méthodes
   - Fonctions utilitaires (formatage, etc.)
4. **Views JavaScript** (tous les fichiers .js nécessaires)
   - Code complet, pas de placeholders
   - Gestion d'erreurs UI
   - Auto-refresh où approprié
5. **Menu JSON** (`/root/usr/share/luci/menu.d/luci-app-{module}.json`)
6. **ACL JSON** (`/root/usr/share/rpcd/acl.d/luci-app-{module}.json`)
7. **UCI Config Template** (optionnel si besoin)
8. **README.md** avec:
   - Installation
   - Configuration
   - Usage
   - Dépendances
   - Troubleshooting

### ✅ Checklist de Validation

Avant de marquer comme terminé, vérifier:

- [ ] Tous les fichiers générés
- [ ] RPCD script exécutable (chmod +x)
- [ ] Nom RPCD = `luci.{module}` (convention obligatoire)
- [ ] Tous les appels RPC matchent les méthodes RPCD
- [ ] Paths menu matchent les fichiers view
- [ ] JavaScript syntaxe valide (node -c)
- [ ] JSON files valides (jsonlint)
- [ ] ACL inclut toutes les méthodes RPCD
- [ ] Dépendances Makefile complètes
- [ ] Gestion d'erreurs implémentée partout
- [ ] Documentation README complète

### 🔄 Workflow d'Implémentation

1. **Phase 1: Backend**
   - Implémenter RPCD avec toutes les méthodes
   - Tester chaque méthode individuellement avec `ubus call`

2. **Phase 2: API Client**
   - Créer api.js avec déclarations RPC
   - Ajouter fonctions utilitaires

3. **Phase 3: Views**
   - Implémenter vue overview (dashboard)
   - Implémenter vues CRUD
   - Implémenter vues spécifiques

4. **Phase 4: Configuration**
   - Menu JSON
   - ACL JSON
   - UCI template si nécessaire

5. **Phase 5: Validation**
   - Run `./secubox-tools/validate-modules.sh`
   - Vérifier syntaxe JavaScript
   - Tester sur router si possible

### 📝 Notes d'Implémentation

{Notes spécifiques, contraintes, choix d'architecture, etc.}

---

## Instructions Finales

Implémente ce module en suivant EXACTEMENT les patterns des 14 modules existants:
- Structure des fichiers identique
- Conventions de nommage cohérentes
- Style de code similaire
- Validation complète avant livraison

Génère tous les fichiers complets. Ne laisse AUCUN placeholder ou TODO.
```

---

## 🔐 Exemple Concret: Module KSM (Key Storage Manager)

Voici un exemple d'utilisation du template pour un module de gestion de clés avec support Nitrokey:

```markdown
## Nouveau Module SecuBox: Key Storage Manager

### 🎯 Contexte et Objectif

**Nom du module**: luci-app-ksm-manager
**Catégorie**: Security
**Description courte**: Gestionnaire centralisé de clés cryptographiques avec support hardware (Nitrokey, YubiKey) et stockage sécurisé.
**Cas d'utilisation**: Administrateurs système gérant des certificats SSL, clés SSH, secrets d'application, et tokens avec support HSM/USB.

### 📊 Fonctionnalités Requises

1. **Gestion des Clés Cryptographiques**
   - Génération de clés (RSA, ECDSA, Ed25519)
   - Import/export de clés (PEM, DER, P12)
   - Listing avec métadonnées (type, taille, usage, expiration)
   - Suppression sécurisée (shred)

2. **Support Hardware Security Modules**
   - Détection automatique Nitrokey/YubiKey (USB)
   - Initialisation/PIN management
   - Génération de clés on-chip
   - Opérations cryptographiques (sign, encrypt)
   - Backup/restore de tokens

3. **Stockage Sécurisé de Secrets**
   - Keystore chiffré (AES-256-GCM)
   - Secrets applicatifs (API keys, passwords)
   - Rotation automatique de secrets
   - Historique d'accès (audit log)

4. **Intégration Certificats**
   - Génération CSR (Certificate Signing Request)
   - Import certificats (Let's Encrypt, CA interne)
   - Vérification chaîne de confiance
   - Alertes expiration (< 30 jours)

5. **SSH Key Management**
   - Génération de paires SSH
   - Déploiement vers authorized_keys
   - Agent SSH avec forward (ssh-agent)
   - Support certificats SSH

### 🔌 Intégration Système

**Services système**:
- `nitropy` - CLI Nitrokey
- `ykman` - CLI YubiKey
- `gnupg2` - GPG/OpenPGP
- `opensc` - Smart card framework

**Commandes CLI**:
- `nitropy nk3 list` - Liste Nitrokey connectées
- `ykman list` - Liste YubiKey connectées
- `gpg --card-status` - Status carte OpenPGP
- `pkcs11-tool --list-tokens` - Liste tokens PKCS#11
- `openssl` - Génération clés/CSR

**Fichiers de configuration**:
- `/etc/ksm/keystore.db` - Base SQLite chiffrée
- `/etc/ksm/config.json` - Configuration module
- `/var/log/ksm-audit.log` - Logs d'accès

**Dépendances packages**:
- `nitropy` - Nitrokey tools
- `yubikey-manager` - YubiKey management
- `gnupg2` - GPG support
- `opensc` - Smart card support
- `openssl` - Crypto operations
- `libccid` - USB CCID driver
- `pcscd` - PC/SC daemon

### 🎨 Méthodes RPCD

Script: `/usr/libexec/rpcd/luci.ksm-manager`

#### Méthodes de Base
1. **status**: État du service
   - Retour: `{ "running": bool, "keystore_unlocked": bool, "keys_count": int, "hsm_connected": bool }`

2. **get_info**: Informations système
   - Retour: `{ "openssl_version": string, "gpg_version": string, "hsm_support": bool }`

#### Méthodes HSM/Hardware
3. **list_hsm_devices**: Liste devices USB
   - Retour: `{ "devices": [{ "type": "nitrokey", "serial": "...", "version": "..." }] }`

4. **get_hsm_status**: Status d'un device
   - Params: `serial`
   - Retour: `{ "initialized": bool, "pin_retries": int, "keys_count": int }`

5. **init_hsm**: Initialiser un HSM
   - Params: `serial, admin_pin, user_pin`
   - Retour: `{ "success": bool }`

6. **generate_hsm_key**: Générer clé on-chip
   - Params: `serial, key_type, key_size, label`
   - Retour: `{ "success": bool, "key_id": string }`

#### Méthodes Gestion de Clés
7. **list_keys**: Liste toutes les clés
   - Retour: `{ "keys": [{ "id": string, "label": string, "type": string, "size": int, "created": timestamp }] }`

8. **generate_key**: Générer une clé logicielle
   - Params: `type, size, label, passphrase`
   - Retour: `{ "success": bool, "id": string, "public_key": string }`

9. **import_key**: Importer une clé
   - Params: `label, key_data, format, passphrase`
   - Retour: `{ "success": bool, "id": string }`

10. **export_key**: Exporter une clé
    - Params: `id, format, include_private, passphrase`
    - Retour: `{ "success": bool, "key_data": string }`

11. **delete_key**: Supprimer une clé
    - Params: `id, secure_erase`
    - Retour: `{ "success": bool }`

#### Méthodes Certificats
12. **generate_csr**: Générer CSR
    - Params: `key_id, subject_dn, san_list`
    - Retour: `{ "success": bool, "csr": string }`

13. **import_certificate**: Importer certificat
    - Params: `key_id, cert_data, chain`
    - Retour: `{ "success": bool, "cert_id": string }`

14. **list_certificates**: Liste certificats
    - Retour: `{ "certificates": [{ "id": string, "subject": string, "issuer": string, "valid_until": timestamp }] }`

15. **verify_certificate**: Vérifier certificat
    - Params: `cert_id`
    - Retour: `{ "valid": bool, "chain_valid": bool, "expires_in_days": int }`

#### Méthodes Secrets
16. **store_secret**: Stocker un secret
    - Params: `label, secret_data, category, auto_rotate`
    - Retour: `{ "success": bool, "secret_id": string }`

17. **retrieve_secret**: Récupérer un secret
    - Params: `secret_id`
    - Retour: `{ "success": bool, "secret_data": string, "accessed_at": timestamp }`

18. **list_secrets**: Liste secrets
    - Retour: `{ "secrets": [{ "id": string, "label": string, "category": string, "created": timestamp }] }`

19. **rotate_secret**: Rotation de secret
    - Params: `secret_id, new_secret_data`
    - Retour: `{ "success": bool, "version": int }`

#### Méthodes SSH
20. **generate_ssh_key**: Générer paire SSH
    - Params: `label, key_type, comment`
    - Retour: `{ "success": bool, "key_id": string, "public_key": string }`

21. **deploy_ssh_key**: Déployer vers authorized_keys
    - Params: `key_id, target_host, target_user`
    - Retour: `{ "success": bool }`

#### Méthodes Audit
22. **get_audit_logs**: Logs d'accès
    - Params: `limit, offset, filter_type`
    - Retour: `{ "logs": [{ "timestamp": timestamp, "action": string, "user": string, "key_id": string }] }`

### 🗄️ Configuration UCI

Fichier: `/etc/config/ksm`

```uci
config global 'main'
    option enabled '1'
    option keystore_path '/etc/ksm/keystore.db'
    option audit_enabled '1'
    option audit_retention '90'
    option auto_backup '1'

config hsm_device 'device_123'
    option serial 'NK3-ABC123'
    option type 'nitrokey'
    option label 'Production HSM'
    option enabled '1'

config key 'key_456'
    option label 'SSL Certificate Key'
    option type 'rsa'
    option size '4096'
    option usage 'ssl'
    option storage 'hsm'
    option hsm_serial 'NK3-ABC123'
    option created '2025-01-15T10:00:00Z'

config secret 'secret_789'
    option label 'API Key GitHub'
    option category 'api_key'
    option auto_rotate '1'
    option rotation_days '90'
    option created '2025-01-15T10:00:00Z'

config certificate 'cert_101'
    option key_id 'key_456'
    option subject 'CN=example.com'
    option issuer 'CN=Let's Encrypt'
    option valid_from '2025-01-01T00:00:00Z'
    option valid_until '2025-04-01T00:00:00Z'
    option alert_days '30'
```

### 🎨 Interface Utilisateur (Views)

#### Vue 1: Overview/Dashboard
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/overview.js`

**Éléments**:
- **Status cards**: Keystore locked/unlocked, HSM connected, Keys count, Expiring certs
- **HSM Devices**: Cards avec serial, type, status (connected/disconnected), PIN retries
- **Quick Stats**: Pie chart types de clés (RSA/ECDSA/Ed25519)
- **Expiring Certificates**: Timeline avec alertes < 30 jours
- **Recent Activity**: 10 dernières actions d'audit
- **Actions rapides**: Unlock keystore, Generate key, Import certificate

**Auto-refresh**: 10s pour HSM status, 30s pour stats

#### Vue 2: Keys Management
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/keys.js`

**Éléments**:
- **Tableau GridSection** avec:
  - Colonnes: Label, Type, Size, Storage (software/hsm), Created, Actions
  - Filtres: Type, Storage location
  - Tri par date/label
- **Modal Generate Key**:
  - Type (RSA/ECDSA/Ed25519)
  - Size (dropdown: 2048/3072/4096 pour RSA, 256/384/521 pour ECDSA)
  - Storage (software/hsm selector)
  - Label, Passphrase
  - Button "Generate" → progress → success
- **Modal Import Key**:
  - Format (PEM/DER/P12)
  - File upload ou paste textarea
  - Passphrase si encrypted
  - Label
- **Actions inline**:
  - View public key (modal avec copy button)
  - Export (format selector)
  - Delete (confirmation avec secure erase option)

#### Vue 3: HSM Devices
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/hsm.js`

**Éléments**:
- **Auto-detect**: Button scan USB devices
- **Device Cards** pour chaque HSM:
  - Header: Type icon (Nitrokey/YubiKey) + Serial + Label
  - Status: Initialized, PIN retries (progress bar), Keys count
  - Actions: Initialize, Change PIN, Generate key on-chip, Backup, Factory reset
- **Modal Initialize HSM**:
  - Admin PIN (strength meter)
  - User PIN (strength meter)
  - Label
  - Warning: Factory reset si déjà initialisé
- **Modal Generate HSM Key**:
  - Key type, size, label
  - Requires user PIN
  - Progress indicator
- **Key list per HSM**: Expandable section showing keys stored on chip

#### Vue 4: Certificates
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/certificates.js`

**Éléments**:
- **Tableau certificates**:
  - Colonnes: Subject CN, Issuer, Valid from/until, Days remaining, Status
  - Color coding: Green (>30d), Orange (7-30d), Red (<7d), Gray (expired)
  - Actions: View details, Export PEM, Revoke, Delete
- **Modal Generate CSR**:
  - Select key (dropdown)
  - Subject DN fields (CN, O, OU, C, ST, L)
  - SAN list (domains, IPs)
  - Generate button → CSR textarea avec copy
  - Download .csr button
- **Modal Import Certificate**:
  - Select key to associate
  - Certificate PEM (textarea or file upload)
  - Certificate chain (optional)
  - Validate button → shows cert info before import
- **Certificate Details Modal**:
  - Full subject/issuer DN
  - Serial number
  - Validity dates
  - Public key info
  - Extensions (Key Usage, Extended Key Usage, SAN)
  - Certificate chain visualization
  - Verify chain button

#### Vue 5: Secrets
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/secrets.js`

**Éléments**:
- **Tableau secrets**:
  - Colonnes: Label, Category, Created, Last accessed, Auto-rotate, Actions
  - Categories: API Key, Password, Token, Database, Other
  - Masked secrets (show button reveals for 10s)
- **Modal Add Secret**:
  - Label
  - Category (dropdown)
  - Secret value (textarea, masked)
  - Auto-rotate toggle + rotation days
  - Expiration date (optional)
- **Modal View Secret**:
  - Shows secret with copy button
  - Warning: "This access will be logged"
  - Auto-hide after 30 seconds
  - Access history table
- **Actions**:
  - View/copy (logs access)
  - Rotate (enter new value)
  - Delete (confirmation)

#### Vue 6: SSH Keys
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/ssh.js`

**Éléments**:
- **Tableau SSH keys**:
  - Colonnes: Label, Type, Fingerprint, Created, Deployed to, Actions
- **Modal Generate SSH Key**:
  - Type (RSA/ECDSA/Ed25519)
  - Size (for RSA)
  - Comment
  - Passphrase (optional)
- **Modal Deploy Key**:
  - Select key
  - Target host
  - Target user
  - Port
  - Test connection button
  - Deploy button
- **Public key display**: Copy to clipboard button

#### Vue 7: Audit Logs
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/audit.js`

**Éléments**:
- **Timeline logs**:
  - Timestamp, User, Action, Resource (key/secret/cert), Status
  - Color coding par action type
  - Filtres: Date range, Action type, User, Resource
- **Export logs**: CSV/JSON download
- **Auto-refresh**: 15s

#### Vue 8: Settings
**Fichier**: `htdocs/luci-static/resources/view/ksm-manager/settings.js`

**Éléments**:
- **Keystore Settings**:
  - Change master password
  - Keystore path
  - Auto-lock timeout
  - Backup schedule
- **Audit Settings**:
  - Enable/disable audit
  - Retention period (days)
  - Log level
- **Alerts Settings**:
  - Certificate expiration threshold (days)
  - Secret rotation reminder
  - HSM disconnect alerts
- **Backup/Restore**:
  - Create backup (encrypted archive)
  - Restore from backup
  - Auto-backup toggle + schedule

### 🎯 Spécifications Techniques

#### Parsing de Sortie CLI

**Nitrokey List**:
```bash
nitropy nk3 list --json | jq -c '.[]'
# Output: {"path": "/dev/hidraw0", "serial_number": "NK3-ABC123", "firmware_version": "1.2.0"}
```

**YubiKey List**:
```bash
ykman list --serials
# Output: NK3-ABC123
```

**OpenSSL Key Generation**:
```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out /tmp/key.pem
openssl rsa -in /tmp/key.pem -pubout -out /tmp/key.pub
```

**Certificate Info**:
```bash
openssl x509 -in cert.pem -noout -subject -issuer -dates -serial
```

#### Gestion d'Erreurs
- HSM non détecté: `{ "error": "HSM not found", "code": "HSM_NOT_FOUND" }`
- PIN incorrect: `{ "error": "Invalid PIN", "retries_left": 2, "code": "INVALID_PIN" }`
- Keystore locked: `{ "error": "Keystore locked", "code": "KEYSTORE_LOCKED" }`
- Clé inexistante: `{ "error": "Key not found", "code": "KEY_NOT_FOUND" }`
- Certificate expiré: `{ "error": "Certificate expired", "code": "CERT_EXPIRED" }`

#### Sécurité
- **Validation inputs**:
  - Serial: `^[A-Z0-9-]+$`
  - Label: `^[a-zA-Z0-9 _-]{1,64}$`
  - PIN: 6-32 caractères
- **Sanitization**: Toutes les entrées utilisateur passées à openssl/gpg
- **Permissions**: Root requis pour accès /dev/hidraw*
- **Audit**: Tous les accès aux secrets loggés
- **Encryption**: Keystore chiffré AES-256-GCM avec KDF (PBKDF2)

### 📦 Livrables Attendus

Génère TOUS les fichiers complets:

1. ✅ **Makefile** avec dépendances (nitropy, yubikey-manager, gnupg2, opensc, openssl, libccid, pcscd)
2. ✅ **RPCD Backend** avec 22 méthodes complètes
3. ✅ **API Client** avec toutes les déclarations RPC + utilitaires
4. ✅ **8 Views JavaScript** (overview, keys, hsm, certificates, secrets, ssh, audit, settings)
5. ✅ **Menu JSON** avec 8 entrées
6. ✅ **ACL JSON** avec toutes les permissions
7. ✅ **README.md** complet avec:
   - Guide installation Nitrokey/YubiKey drivers
   - Configuration initiale du keystore
   - Exemples d'utilisation
   - Troubleshooting USB permissions
   - Best practices sécurité

### ✅ Checklist de Validation

- [ ] RPCD backend complet avec 22 méthodes
- [ ] Gestion HSM (Nitrokey + YubiKey)
- [ ] Génération/import/export de clés
- [ ] Gestion certificats avec CSR
- [ ] Stockage secrets chiffrés
- [ ] SSH key management
- [ ] Audit logs complets
- [ ] 8 views fonctionnelles
- [ ] Auto-refresh approprié
- [ ] Validation inputs partout
- [ ] Gestion erreurs complète
- [ ] Nom RPCD = `luci.ksm-manager`
- [ ] Syntaxe JavaScript valide
- [ ] Documentation README

### 🔄 Workflow d'Implémentation

**Phase 1: Backend Core**
1. Implémenter détection HSM (nitropy/ykman)
2. Créer keystore SQLite chiffré
3. Implémenter méthodes de base (status, info, list)

**Phase 2: Key Management**
4. Génération clés software (openssl)
5. Import/export clés
6. Génération clés HSM (PKCS#11)

**Phase 3: Certificates**
7. Génération CSR
8. Import/validation certificats
9. Alertes expiration

**Phase 4: Secrets & SSH**
10. Stockage secrets chiffrés
11. Rotation automatique
12. SSH key management

**Phase 5: Audit & UI**
13. Système d'audit logs
14. Toutes les views
15. Auto-refresh et polling

**Phase 6: Testing**
16. Validation complète
17. Tests avec vrai HSM
18. Documentation

### 📝 Notes d'Implémentation

**Architecture**:
- Backend SQLite pour metadata + fichiers PEM pour clés
- Keystore master password → KDF → AES key pour chiffrement
- HSM operations via PKCS#11 (libccid + opensc)
- Audit logs append-only avec rotation

**Performance**:
- Cache status HSM (TTL 5s) pour éviter USB polling constant
- Index SQLite sur labels, created, expires
- Lazy loading de clés privées

**Sécurité**:
- Keystore auto-lock après timeout
- PIN retries limités (3 max avant lock)
- Secure memory (mlock) pour clés en RAM
- Shred files avant delete
- Audit tous les accès

---

## Instructions Finales

Implémente le module **KSM Manager** en suivant exactement le template ci-dessus.

- Structure identique aux 14 modules SecuBox existants
- Code complet, zéro placeholders
- Validation complète avant livraison
- Documentation exhaustive

Génère TOUS les fichiers listés. Commence par le backend RPCD, puis API, puis views.
```

---

## 🎯 Utilisation du Template

### Pour implémenter un nouveau module:

1. **Copie le template** de ce fichier
2. **Remplis chaque section** avec les specs de ton module
3. **Soumets le prompt complet** à Claude
4. **Valide** avec `./secubox-tools/validate-modules.sh`
5. **Teste** sur router ou émulateur

### Exemples d'autres modules possibles:

- **luci-app-iot-hub**: Gestion centralisée dispositifs IoT (MQTT, Zigbee, Z-Wave)
- **luci-app-backup-manager**: Backups automatiques (rsync, rclone, cloud)
- **luci-app-dns-manager**: DNS local avancé (Pi-hole style, DoH, DoT)
- **luci-app-container-manager**: Docker/Podman management
- **luci-app-monitoring-alerts**: Alerting system (Prometheus, Grafana, webhooks)

Adapte le template selon tes besoins spécifiques!
