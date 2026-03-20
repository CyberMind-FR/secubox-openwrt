# CLAUDE.md

> **Langues:** [English](../docs/claude.md) | Francais | [中文](../docs-zh/claude.md)

**Version:** 1.0.0
**Derniere mise a jour:** 2025-12-28
**Statut:** Actif

Ce fichier fournit des instructions a Claude Code (claude.ai/code) pour travailler avec le code de ce depot.

## Index de la documentation

**IMPORTANT:** Avant de travailler sur du code, consultez ces guides:

1. **[DEVELOPMENT-GUIDELINES.md](development-guidelines.md)** - **GUIDE COMPLET**
   - Design System & Directives UI (palettes, typographie, composants)
   - Architecture & Conventions de nommage (RPCD, chemins de menu, prefixes)
   - Bonnes pratiques RPCD & ubus (erreurs courantes, solutions)
   - ACL & Permissions (templates, validations)
   - Patterns JavaScript (modules API, vues, gestion des evenements)
   - Standards CSS/Style (variables, responsive, mode sombre)
   - Erreurs courantes & Solutions (diagnostics, corrections)
   - Checklist de validation (pre-commit, pre-deploy, post-deploy)
   - Procedures de deploiement (scripts, rollback, versioning)

2. **[QUICK-START.md](quick-start.md)** - **AIDE-MEMOIRE RAPIDE**
   - Regles critiques (nommage RPCD, chemins de menu, permissions)
   - Essentiels du design system (couleurs, polices, classes)
   - Commandes courantes (validation, build, deploy, debug)
   - Templates de code rapides (RPCD, View, Headers, Cards)
   - Corrections rapides d'erreurs

3. **CLAUDE.md** (ce fichier) - **ARCHITECTURE & BUILD**
   - Commandes de build (OpenWrt SDK, build local)
   - Structure des modules (fichiers, repertoires)
   - Workflows CI/CD
   - Problemes techniques courants

**REGLES CRITIQUES A TOUJOURS RESPECTER:**

1. **Nommage des scripts RPCD:** Nom du fichier = objet ubus (`luci.system-hub`)
2. **Correspondance des chemins de menu:** Chemin menu = fichier vue (`system-hub/overview.js`)
3. **Permissions:** RPCD = 755, CSS/JS = 644
   - **Correction auto:** `./secubox-tools/fix-permissions.sh --local` (avant commit)
   - **Correction auto distante:** `./secubox-tools/fix-permissions.sh --remote` (apres deploy)
4. **Validation:** Toujours executer `./secubox-tools/validate-modules.sh` avant commit
   - **7 verifications automatiques:** nommage RPCD, chemins de menu, fichiers vue, permissions RPCD, syntaxe JSON, nommage ubus, **permissions htdocs**
5. **Variables CSS:** Toujours utiliser `var(--sh-*)`, jamais coder les couleurs en dur
6. **Mode sombre:** Toujours supporter le mode sombre avec `[data-theme="dark"]`
7. **Typographie:** Inter (texte), JetBrains Mono (valeurs numeriques)
8. **Effets de degrade:** Utiliser `--sh-primary` vers `--sh-primary-end` pour les degrades

## Apercu du projet

SecuBox est une suite complete de gestion de securite et reseau pour OpenWrt. Le depot contient 13 paquets d'applications LuCI qui fournissent des tableaux de bord pour la surveillance de securite, l'intelligence reseau, le controle d'acces, la gestion de bande passante et l'administration systeme.

## Commandes de build

### Build avec le SDK OpenWrt

```bash
# Compiler un seul paquet
make package/luci-app-<nom-module>/compile V=s

# Build propre pour un paquet
make package/luci-app-<nom-module>/clean
make package/luci-app-<nom-module>/compile V=s

# Installer le paquet dans le repertoire staging
make package/luci-app-<nom-module>/install
```

### Test des paquets

```bash
# Transferer vers le routeur
scp bin/packages/*/base/luci-app-*.ipk root@192.168.1.1:/tmp/

# Installer sur le routeur
ssh root@192.168.1.1
opkg install /tmp/luci-app-*.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### Validation

```bash
# Corriger les permissions de fichiers EN PREMIER (CRITIQUE)
./secubox-tools/fix-permissions.sh --local

# Executer la validation complete des modules (RECOMMANDE - 7 verifications)
./secubox-tools/validate-modules.sh
# Verifications:
# 1. Noms des scripts RPCD vs objets ubus
# 2. Chemins de menu vs emplacements des fichiers vue
# 3. Les fichiers vue ont des entrees de menu
# 4. Permissions des scripts RPCD (755)
# 5. Validation de la syntaxe JSON
# 6. Convention de nommage des objets ubus
# 7. Permissions des fichiers htdocs (644 pour CSS/JS)

# Valider les scripts shell (backends RPCD)
shellcheck luci-app-*/root/usr/libexec/rpcd/*

# Valider les fichiers JSON
find . -name "*.json" -exec jsonlint {} \;

# Executer l'outil de reparation automatique
./secubox-tools/secubox-repair.sh

# Corriger les permissions sur le routeur deploye
./secubox-tools/fix-permissions.sh --remote

# Executer les diagnostics
./secubox-tools/secubox-debug.sh luci-app-<nom-module>
```

### Build local (replique GitHub Actions)

Le script `local-build.sh` permet de construire et tester les paquets localement, en repliquant les workflows GitHub Actions:

```bash
# Valider tous les paquets (syntaxe, JSON, scripts shell)
./secubox-tools/local-build.sh validate

# Construire tous les paquets pour x86_64
./secubox-tools/local-build.sh build

# Construire un seul paquet
./secubox-tools/local-build.sh build luci-app-system-hub

# Construire pour une architecture specifique
./secubox-tools/local-build.sh build --arch aarch64-cortex-a72

# Validation complete + build
./secubox-tools/local-build.sh full

# Nettoyer les artefacts de build
./secubox-tools/local-build.sh clean
```

Architectures supportees:
- `x86-64` - PC, VMs (par defaut)
- `aarch64-cortex-a53` - ARM Cortex-A53 (ESPRESSObin)
- `aarch64-cortex-a72` - ARM Cortex-A72 (MOCHAbin, RPi4)
- `aarch64-generic` - ARM64 generique
- `mips-24kc` - MIPS 24Kc (TP-Link)
- `mipsel-24kc` - MIPS LE (Xiaomi, GL.iNet)

Le script automatiquement:
- Telecharge et met en cache le SDK OpenWrt
- Configure les feeds (packages, luci) avec la bonne branche pour la version
- Copie vos paquets vers le SDK
- Construit les paquets (.apk pour 25.12+, .ipk pour versions anterieures)
- Collecte les artefacts dans `build/<arch>/`

**Support des formats de paquets:**
- OpenWrt 25.12+ et SNAPSHOT: format `.apk` (nouveau gestionnaire de paquets base sur Alpine)
- OpenWrt 24.10 et anterieur: format `.ipk` (gestionnaire de paquets opkg)

Variables d'environnement:
- `OPENWRT_VERSION` - Version OpenWrt (defaut: 24.10.5, supporte aussi: 25.12.0-rc1, 23.05.5, SNAPSHOT)
- `SDK_DIR` - Repertoire du SDK (defaut: ./sdk)
- `BUILD_DIR` - Repertoire de sortie du build (defaut: ./build)
- `CACHE_DIR` - Repertoire de cache des telechargements (defaut: ./cache)

## Architecture

### Structure d'un paquet LuCI

Tous les modules SecuBox suivent une structure standard d'application LuCI:

```
luci-app-<nom-module>/
├── Makefile                              # Definition du paquet OpenWrt
├── README.md                             # Documentation du module
├── htdocs/luci-static/resources/
│   ├── view/<nom-module>/                # Vues UI JavaScript
│   │   ├── overview.js                   # Vue principale du tableau de bord
│   │   └── *.js                          # Vues additionnelles
│   └── <nom-module>/
│       ├── api.js                        # Module client API RPC
│       └── dashboard.css                 # Styles specifiques au module
└── root/
    ├── etc/config/<nom-module>           # Configuration UCI (optionnel)
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.<nom-module>         # Script backend RPCD (DOIT utiliser le prefixe luci.!)
        └── share/
            ├── luci/menu.d/              # Definition JSON du menu
            │   └── luci-app-<nom-module>.json
            └── rpcd/acl.d/               # JSON des permissions ACL
                └── luci-app-<nom-module>.json
```

### Communication Frontend-Backend

1. **Frontend (JavaScript)**: Situe dans `htdocs/luci-static/resources/`
   - Les vues utilisent les classes `form` et `view` de LuCI
   - Appels API via le module `api.js` utilisant `L.resolveDefault()`
   - Composants UI depuis `ui.js` (Dropdown, Checkbox, Combobox, etc.)

2. **Backend (RPCD)**: Situe dans `root/usr/libexec/rpcd/`
   - Scripts shell qui implementent les methodes RPC
   - Doivent produire du JSON vers stdout
   - Les methodes sont appelees via ubus: `ubus call <module> <method>`

3. **Definition du menu**: `root/usr/share/luci/menu.d/luci-app-<module>.json`
   - Definit la structure du menu et la navigation
   - Specifie les chemins des vues et les dependances

4. **Definition des ACL**: `root/usr/share/rpcd/acl.d/luci-app-<module>.json`
   - Definit le controle d'acces pour les methodes ubus
   - Associe les permissions lecture/ecriture aux groupes utilisateurs

### Conventions de nommage critiques

**IMPORTANT**: Les regles de nommage suivantes sont OBLIGATOIRES pour que les modules fonctionnent correctement:

#### 1. Le script RPCD doit correspondre au nom de l'objet ubus

Le nom de fichier du script RPCD DOIT correspondre exactement au nom de l'objet ubus utilise en JavaScript:

```javascript
// En JavaScript (htdocs/luci-static/resources/view/*/):
var callStatus = rpc.declare({
    object: 'luci.cdn-cache',  // <- Ce nom d'objet
    method: 'status'
});
```

```bash
# Le nom du fichier script RPCD DOIT correspondre:
root/usr/libexec/rpcd/luci.cdn-cache  # <- Doit etre exactement 'luci.cdn-cache'
```

**Erreur courante**: Si les noms ne correspondent pas, vous obtiendrez:
- `RPC call to luci.cdn-cache/status failed with error -32000: Object not found`
- `Command failed: Method not found`

**Solution**: Tous les scripts RPCD DOIVENT utiliser le prefixe `luci.`:
- Correct: `luci.cdn-cache`, `luci.system-hub`, `luci.wireguard-dashboard`
- Incorrect: `cdn-cache`, `system-hub`, `wireguard-dashboard`

#### 2. Les chemins de menu doivent correspondre aux emplacements des fichiers vue

Les entrees de chemin dans le JSON du menu DOIVENT correspondre aux fichiers vue reels:

```json
// Dans menu.d/luci-app-netifyd-dashboard.json:
{
    "action": {
        "type": "view",
        "path": "netifyd-dashboard/overview"  // <- Doit correspondre a l'emplacement du fichier
    }
}
```

```bash
# Le fichier vue DOIT exister a:
htdocs/luci-static/resources/view/netifyd-dashboard/overview.js
#                                  ↑ Meme chemin que le menu ↑
```

**Erreur courante**: Si les chemins ne correspondent pas:
- `HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'`

**Solution**: Assurez-vous que les chemins de menu correspondent a la structure des repertoires:
- Correct: Chemin menu `netifyd-dashboard/overview` -> fichier `view/netifyd-dashboard/overview.js`
- Incorrect: Chemin menu `netifyd/overview` -> fichier `view/netifyd-dashboard/overview.js`

#### 3. Convention de nommage des objets ubus

Tous les objets ubus DOIVENT commencer par le prefixe `luci.`:

```javascript
// Correct:
object: 'luci.cdn-cache'
object: 'luci.system-hub'
object: 'luci.wireguard-dashboard'

// Incorrect:
object: 'cdn-cache'
object: 'systemhub'
```

#### 4. Validation avant deploiement

**TOUJOURS** executer la validation avant de deployer:

```bash
./secubox-tools/validate-modules.sh
```

Ce script verifie:
- Les noms des scripts RPCD correspondent aux objets ubus
- Les chemins de menu correspondent aux emplacements des fichiers vue
- Les fichiers vue ont des entrees de menu correspondantes
- Les scripts RPCD sont executables
- Les fichiers JSON ont une syntaxe valide
- Les objets ubus suivent la convention de nommage

### Structure du Makefile

Chaque Makefile de paquet doit definir:
- `PKG_NAME`: Nom du paquet (doit correspondre au repertoire)
- `PKG_VERSION`: Numero de version
- `PKG_RELEASE`: Numero de release du paquet
- `LUCI_TITLE`: Titre affiche dans LuCI
- `LUCI_DEPENDS`: Dependances du paquet (ex: `+luci-base +rpcd`)
- `LUCI_DESCRIPTION`: Description breve
- `PKG_MAINTAINER`: Nom et email du mainteneur
- `PKG_LICENSE`: Licence (typiquement Apache-2.0)

Le Makefile inclut `luci.mk` du systeme de build LuCI qui gere l'installation.

## Patterns de developpement courants

### Creer un nouveau module

1. Copier le template: `cp -r templates/luci-app-template luci-app-nouveaumodule`
2. Mettre a jour le Makefile avec le nouveau PKG_NAME, LUCI_TITLE, etc.
3. Creer la structure des repertoires sous `htdocs/` et `root/`
4. Implementer le backend RPCD en shell
5. Creer les vues JavaScript
6. Definir les fichiers JSON de menu et ACL

### Pattern du backend RPCD

Les backends RPCD sont des scripts shell qui:
- Analysent `$1` pour le nom de la methode
- Produisent du JSON valide avec `printf` ou `echo`
- Utilisent des instructions `case` pour le routage des methodes
- Sourcent la config UCI si necessaire: `. /lib/functions.sh`

Exemple:
```bash
#!/bin/sh
case "$1" in
    list)
        echo '{ "status": {}, "stats": {} }'
        ;;
    call)
        case "$2" in
            status)
                # Produire du JSON
                printf '{"running": true, "version": "1.0.0"}\n'
                ;;
        esac
        ;;
esac
```

### Pattern des vues JavaScript

Les vues etendent `L.view` et implementent `load()` et `render()`:

```javascript
'use strict';
'require view';
'require form';
'require <module>/api as API';

return L.view.extend({
    load: function() {
        return Promise.all([
            API.getStatus(),
            API.getStats()
        ]);
    },

    render: function(data) {
        var m, s, o;
        m = new form.Map('config', _('Titre'));
        s = m.section(form.TypedSection, 'section');
        // Ajouter les champs du formulaire...
        return m.render();
    }
});
```

## Categories de modules

1. **Controle central** (2 modules)
   - luci-app-secubox: Hub central
   - luci-app-system-hub: Centre de controle systeme

2. **Securite & Surveillance** (2 modules)
   - luci-app-crowdsec-dashboard: Securite CrowdSec
   - luci-app-netdata-dashboard: Surveillance systeme

3. **Intelligence reseau** (2 modules)
   - luci-app-netifyd-dashboard: Inspection approfondie des paquets
   - luci-app-network-modes: Configuration des modes reseau

4. **VPN & Controle d'acces** (3 modules)
   - luci-app-wireguard-dashboard: VPN WireGuard
   - luci-app-client-guardian: NAC & portail captif
   - luci-app-auth-guardian: Systeme d'authentification

5. **Bande passante & Trafic** (2 modules)
   - luci-app-bandwidth-manager: QoS & quotas
   - luci-app-media-flow: Detection du trafic media

6. **Performance & Services** (2 modules)
   - luci-app-cdn-cache: Cache proxy CDN
   - luci-app-vhost-manager: Gestionnaire d'hotes virtuels

## Integration CI/CD

### Workflows GitHub Actions

1. **build-openwrt-packages.yml**: Compile les paquets pour toutes les architectures
   - Declenche sur push, PR et tags
   - Build en matrice pour 13 architectures
   - Upload des artefacts par architecture

2. **build-secubox-images.yml**: Construit des images OpenWrt personnalisees
   - Cree des images firmware completes avec SecuBox pre-installe

3. **test-validate.yml**: Validation et tests
   - Valide la structure des Makefile
   - Verifie la syntaxe JSON
   - Execute shellcheck sur les scripts
   - Verifie les permissions des fichiers

### Architectures supportees

ARM64: aarch64-cortex-a53, aarch64-cortex-a72, aarch64-generic, mediatek-filogic, rockchip-armv8, bcm27xx-bcm2711

ARM32: arm-cortex-a7-neon, arm-cortex-a9-neon, qualcomm-ipq40xx, qualcomm-ipq806x

MIPS: mips-24kc, mipsel-24kc, mipsel-74kc

x86: x86-64, x86-generic

## Fichiers et repertoires cles

- `makefiles/`: Makefiles de reference pour les modules (backup/templates)
- `secubox-tools/`: Utilitaires de reparation et debogage
  - `secubox-repair.sh`: Corrige automatiquement les problemes de Makefile et RPCD
  - `secubox-debug.sh`: Valide la structure des paquets
- `templates/`: Templates de paquets pour creer de nouveaux modules
- `.github/workflows/`: Scripts d'automatisation CI/CD

## Problemes courants et solutions

### Erreurs RPC: "Object not found" ou "Method not found"

**Erreur**: `RPC call to luci.cdn-cache/status failed with error -32000: Object not found`

**Cause**: Le nom du script RPCD ne correspond pas au nom de l'objet ubus dans JavaScript

**Solution**:
1. Verifier le nom de l'objet ubus dans les fichiers JavaScript:
   ```bash
   grep -r "object:" luci-app-*/htdocs --include="*.js"
   ```
2. Renommer le script RPCD pour correspondre exactement (incluant le prefixe `luci.`):
   ```bash
   mv root/usr/libexec/rpcd/cdn-cache root/usr/libexec/rpcd/luci.cdn-cache
   ```
3. Redemarrer RPCD sur le routeur:
   ```bash
   /etc/init.d/rpcd restart
   ```

### Erreurs HTTP 404: Fichiers vue non trouves

**Erreur**: `HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'`

**Cause**: Le chemin du menu ne correspond pas a l'emplacement reel du fichier vue

**Solution**:
1. Verifier le chemin dans le JSON du menu:
   ```bash
   grep '"path":' root/usr/share/luci/menu.d/*.json
   ```
2. Verifier que le fichier vue existe a l'emplacement correspondant:
   ```bash
   ls htdocs/luci-static/resources/view/
   ```
3. Mettre a jour le chemin du menu pour correspondre a l'emplacement du fichier OU deplacer le fichier pour correspondre au chemin du menu

### RPCD ne repond pas

Apres l'installation/mise a jour d'un paquet:
```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### Menu n'apparait pas

Verifier que:
1. Le JSON du menu est valide: `jsonlint root/usr/share/luci/menu.d/*.json`
2. Les ACL accordent l'acces: Verifier `root/usr/share/rpcd/acl.d/*.json`
3. Les dependances sont installees: Verifier `LUCI_DEPENDS` dans le Makefile
4. Le chemin du menu correspond a l'emplacement du fichier vue (voir ci-dessus)

### Echecs de build

Causes courantes:
1. Champs manquants dans le Makefile (PKG_NAME, LUCI_TITLE, etc.)
2. Syntaxe JSON invalide dans menu.d ou acl.d
3. Script RPCD non executable (chmod +x necessaire)
4. Mauvais chemin d'inclusion (devrait etre `include ../../luci.mk`)
5. Le nom du script RPCD ne correspond pas a l'objet ubus (doit utiliser le prefixe `luci.`)

Utiliser l'outil de reparation: `./secubox-tools/secubox-repair.sh`

### Diagnostic rapide

Executer le script de validation pour verifier toutes les conventions de nommage:
```bash
./secubox-tools/validate-modules.sh
```

## Workflow de developpement

1. Faire des modifications aux fichiers du module
2. **Executer les verifications de validation** (CRITIQUE):
   ```bash
   ./secubox-tools/validate-modules.sh
   # Ou utiliser l'outil de build local:
   ./secubox-tools/local-build.sh validate
   ```
3. Tester la syntaxe JSON: `jsonlint <fichier>.json`
4. Tester les scripts shell: `shellcheck <script>`
5. Construire et tester le paquet localement (recommande):
   ```bash
   # Construire un seul paquet
   ./secubox-tools/local-build.sh build luci-app-<nom>

   # Ou construire avec le SDK manuel:
   make package/luci-app-<nom>/compile V=s
   ```
6. Installer sur le routeur de test et verifier le fonctionnement
7. Executer l'outil de reparation si necessaire: `./secubox-tools/secubox-repair.sh`
8. Committer les changements et pousser (declenche la validation CI)
9. Creer un tag pour la release: `git tag -a v1.0.0 -m "Release 1.0.0"`

## Notes importantes

- **CRITIQUE**: Les noms des scripts RPCD DOIVENT correspondre aux noms des objets ubus (utiliser le prefixe `luci.`)
- **CRITIQUE**: Les chemins de menu DOIVENT correspondre a la structure des repertoires des fichiers vue
- **CRITIQUE**: Toujours executer `./secubox-tools/validate-modules.sh` avant de committer
- Tous les modules utilisent la licence Apache-2.0
- Les backends RPCD doivent etre executables (chmod +x)
- Les fichiers JavaScript utilisent le mode strict: `'use strict';`
- Les entrees de menu necessitent une chaine de dependances appropriee
- Les ACL doivent accorder l'acces ubus call et luci-cgi
- Les fichiers de config UCI sont optionnels (beaucoup de modules n'en ont pas besoin)
- Tous les paquets sont construits en architecture `all` (pas de code compile)
