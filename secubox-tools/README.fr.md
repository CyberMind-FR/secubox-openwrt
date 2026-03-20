# Outils de Developpement SecuBox

[English](README.md) | Francais | [中文](README.zh.md)

**Version :** 1.2.0
**Derniere mise a jour :** 2026-02-28
**Statut :** Actif

Ce repertoire contient des utilitaires pour la validation, le debogage et la maintenance des modules SecuBox.

---

## Voir Aussi

- **Commandes Rapides et Regles :** [DOCS/QUICK-START.md](../DOCS/QUICK-START.md)
- **Garde-fous d'Automatisation :** [DOCS/CODEX.md](../DOCS/CODEX.md)
- **Guide de Validation :** [DOCS/VALIDATION-GUIDE.md](../DOCS/VALIDATION-GUIDE.md)
- **Procedures de Deploiement :** [DOCS/DEVELOPMENT-GUIDELINES.md §9](../DOCS/DEVELOPMENT-GUIDELINES.md#deployment-procedures)

## Apercu des Outils

### Outils de Compilation et Test

#### local-build.sh

**NOUVEAU !** Systeme de compilation local qui replique les workflows GitHub Actions.

Compilez et testez les packages localement sans pousser vers GitHub. Telecharge et configure automatiquement le SDK OpenWrt, compile les packages et collecte les artefacts.

**Utilisation :**
```bash
# Valider tous les packages
./secubox-tools/local-build.sh validate

# Compiler tous les packages (x86_64)
./secubox-tools/local-build.sh build

# Compiler un seul package
./secubox-tools/local-build.sh build luci-app-system-hub

# Compiler le package SecuBox Core
./secubox-tools/local-build.sh build secubox-core

# Compiler pour une architecture specifique
./secubox-tools/local-build.sh build --arch aarch64-cortex-a72

# Compiler une image firmware pour MOCHAbin
./secubox-tools/local-build.sh build-firmware mochabin

# Compiler une image firmware pour ESPRESSObin V7
./secubox-tools/local-build.sh build-firmware espressobin-v7

# Validation complete + compilation
./secubox-tools/local-build.sh full

# Nettoyer les artefacts de compilation
./secubox-tools/local-build.sh clean

# Tout nettoyer y compris le source OpenWrt
./secubox-tools/local-build.sh clean-all
```

**Architectures supportees (pour la compilation de packages) :**
- `x86-64` - PC, VMs (par defaut)
- `aarch64-cortex-a53` - ARM Cortex-A53 (ESPRESSObin)
- `aarch64-cortex-a72` - ARM Cortex-A72 (MOCHAbin, RPi4)
- `aarch64-generic` - ARM64 generique
- `mips-24kc` - MIPS 24Kc (TP-Link)
- `mipsel-24kc` - MIPS LE (Xiaomi, GL.iNet)

**Appareils supportes (pour la compilation firmware) :**
- `espressobin-v7` - ESPRESSObin V7 (1-2GB DDR4)
- `espressobin-ultra` - ESPRESSObin Ultra (PoE, WiFi)
- `sheeva64` - Sheeva64 (Plug computer)
- `mochabin` - MOCHAbin (Quad-core A72, 10G)
- `x86-64` - x86_64 PC generique

**Variables d'environnement :**
- `OPENWRT_VERSION` - Version OpenWrt (par defaut : 24.10.5, supporte aussi : 25.12.0-rc1, 23.05.5, SNAPSHOT)
- `SDK_DIR` - Repertoire SDK (par defaut : ./sdk)
- `BUILD_DIR` - Repertoire de sortie de compilation (par defaut : ./build)
- `CACHE_DIR` - Repertoire de cache de telechargement (par defaut : ./cache)
- `OPENWRT_DIR` - Repertoire source OpenWrt pour les compilations firmware (par defaut : ./openwrt)

**Sortie :**
- Les packages compiles sont places dans `build/<arch>/` avec des checksums SHA256
- Les images firmware sont placees dans `build/firmware/<device>/` avec checksums et infos de compilation

**Dependances :**
```bash
# Requises pour la compilation
sudo apt-get install -y build-essential clang flex bison g++ gawk \
    gcc-multilib g++-multilib gettext git libncurses5-dev \
    libssl-dev python3-setuptools python3-dev rsync \
    swig unzip zlib1g-dev file wget curl jq ninja-build

# Optionnelles pour la validation
sudo apt-get install -y shellcheck nodejs
```

**Fonctionnalites :**
- **Compilation de packages** : Telecharge et met en cache le SDK OpenWrt pour des compilations plus rapides
- **Compilation firmware** : Telecharge le source OpenWrt complet et compile des images firmware personnalisees
- Configure automatiquement les feeds (packages, luci)
- Valide les packages avant compilation
- Compile des packages .ipk avec sortie verbose
- Compile des images firmware completes (.img.gz, *sysupgrade.bin, etc.)
- Collecte les artefacts avec checksums
- Supporte un seul package ou tous les packages
- Support de multiples architectures et appareils
- Verification du profil appareil avant compilation

**IMPORTANT : Compilations SDK vs Toolchain Complet**

Certains packages **DOIVENT** etre compiles avec la toolchain OpenWrt complete (`openwrt/`) au lieu du SDK :

| Package | Raison |
|---------|--------|
| `crowdsec` | Binaire Go avec CGO - Le SDK produit des atomiques ARM64 LSE qui plantent sur certains CPUs |
| `crowdsec-firewall-bouncer` | Binaire Go avec CGO |
| `netifyd` | Binaire natif C++ |
| `nodogsplash` | Binaire natif C |

**Pour compiler ces packages :**
```bash
cd secubox-tools/openwrt
make package/<package-name>/compile V=s
```

Les applications LuCI et les packages shell/Lua peuvent utiliser le SDK via `local-build.sh`.

**Exemple de Workflow - Compilation Toolchain (pour packages Go/natifs) :**
```bash
# 1. Naviguer vers le repertoire de compilation OpenWrt complet
cd secubox-tools/openwrt

# 2. Mettre a jour les feeds si necessaire
./scripts/feeds update -a
./scripts/feeds install -a

# 3. Compiler CrowdSec avec la toolchain complete
make package/crowdsec/compile V=s

# 4. Compiler le firewall bouncer
make package/crowdsec-firewall-bouncer/compile V=s

# 5. Les packages sont dans : bin/packages/aarch64_cortex-a72/packages/
```

**Exemple de Workflow - Compilation de Packages (SDK) :**
```bash
# 1. Faire des modifications a un module
vim luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js

# 2. Valider et compiler localement
./secubox-tools/local-build.sh full

# 3. Tester sur le routeur
scp build/x86-64/*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1
opkg install /tmp/luci-app-system-hub*.ipk
/etc/init.d/rpcd restart
```

### Outils d'Image et Deploiement

#### secubox-image.sh

Compile des images firmware SecuBox via l'API OpenWrt ASU (Attended SysUpgrade).

**Utilisation :**
```bash
# Compiler une image firmware pour un appareil
./secubox-tools/secubox-image.sh build mochabin

# Generer une config firmware-selector
./secubox-tools/secubox-image.sh firmware-selector mochabin

# Verifier le statut de compilation
./secubox-tools/secubox-image.sh status <build-hash>

# Telecharger la compilation terminee
./secubox-tools/secubox-image.sh download <build-hash>
```

**Fonctionnalites :**
- Utilise le backend firmware-selector.openwrt.org (API ASU)
- Supporte MOCHAbin, ESPRESSObin V7/Ultra, x86-64
- Partition rootfs maximale (1024 MB)
- Le script de premier demarrage installe automatiquement les packages SecuBox
- Redimensionnement d'image pour utilisation complete de l'eMMC

**Sortie :** Images firmware dans `build/images/` avec checksums SHA256

#### secubox-sysupgrade.sh

Met a niveau un appareil SecuBox en fonctionnement tout en preservant les packages.

**Utilisation :**
```bash
# Verifier la version actuelle et les mises a niveau disponibles
secubox-sysupgrade check

# Compiler l'image sysupgrade (sans flasher)
secubox-sysupgrade build

# Compiler + telecharger + flasher (mise a niveau complete)
secubox-sysupgrade upgrade

# Afficher les infos de l'appareil
secubox-sysupgrade status
```

**Fonctionnalites :**
- Detection automatique de l'appareil, version et packages installes
- Demande une image personnalisee avec tous les packages preserves
- Preserve /etc/config, /etc/secubox, /srv/ lors des mises a niveau
- Utilise /etc/board.json pour la detection de l'appareil

#### quick-deploy.sh

Deploiement de developpement rapide vers le routeur.

**Utilisation :**
```bash
# Deployer un package IPK
./secubox-tools/quick-deploy.sh --ipk /tmp/package.ipk

# Deployer depuis un repertoire source
./secubox-tools/quick-deploy.sh --src package/secubox/luci-app-example

# Raccourci pour les applications LuCI
./secubox-tools/quick-deploy.sh --app system-hub

# Deployer depuis un depot git
./secubox-tools/quick-deploy.sh --git https://github.com/user/repo --branch develop

# Lister les applications disponibles
./secubox-tools/quick-deploy.sh --list-apps
```

**Fonctionnalites :**
- Modes source multiples : IPK, APK, tar, git
- Detection automatique des applications LuCI
- Verification post-deploiement et vidage du cache
- Capacite de sauvegarde et restauration
- Multiplexage SSH pour des transferts plus rapides

#### c3box-vm-builder.sh

Compile des images VM C3Box portables pour VMware/VirtualBox.

**Utilisation :**
```bash
# Compiler le firmware x86-64
./secubox-tools/c3box-vm-builder.sh build

# Convertir aux formats VM
./secubox-tools/c3box-vm-builder.sh convert

# Compilation complete + conversion
./secubox-tools/c3box-vm-builder.sh full

# Creer une archive distribuable
./secubox-tools/c3box-vm-builder.sh package
```

**Formats de sortie :** VMDK (VMware), OVA, VDI (VirtualBox), QCOW2 (KVM)

#### secubox-clone-station.sh

Orchestre le clonage d'appareils SecuBox via double serie USB.

**Utilisation :**
```bash
# Detecter les peripheriques serie
./secubox-tools/secubox-clone-station.sh detect

# Extraire la config du maitre
./secubox-tools/secubox-clone-station.sh pull --master /dev/ttyUSB0

# Flasher l'appareil cible
./secubox-tools/secubox-clone-station.sh flash --target /dev/ttyUSB1

# Workflow de clonage complet
./secubox-tools/secubox-clone-station.sh clone
```

**Fonctionnalites :**
- Extraction de la config depuis l'appareil maitre
- Compilation de l'image clone avec l'API ASU
- Generation du token de jonction pour le mesh
- Automatisation U-Boot via MOKATOOL
- Flashage base sur TFTP

---

### Utilitaires de Journalisation et Debogage

#### secubox-log.sh

Journaliseur/aggregateur centralise pour les modules SecuBox. Ajoute des evenements etiquetes a `/var/log/seccubox.log`, capture des snapshots qui fusionnent `dmesg` + `logread`, et peut suivre le fichier agrege pour le depannage.

```
# Ajouter un message
secubox-log.sh --tag netdata --message "Netdata restarted"

# Ajouter un snapshot avec queue dmesg/logread
secubox-log.sh --snapshot

# Suivre le log agrege
secubox-log.sh --tail 100
```

Le script est aussi installe sur le routeur sous `/usr/sbin/secubox-log` (via `luci-app-secubox`) pour que les modules LuCI puissent journaliser les evenements de cycle de vie et collecter des bundles de debogage.

**Exemple de Workflow - Compilation Firmware :**
```bash
# 1. Compiler le firmware pour MOCHAbin avec SecuBox pre-installe
./secubox-tools/local-build.sh build-firmware mochabin

# 2. Flasher sur l'appareil
# Les images firmware sont dans : build/firmware/mochabin/
# - openwrt-*-sysupgrade.bin (pour mise a niveau d'OpenWrt existant)
# - openwrt-*-factory.bin (pour installation initiale)
# - SHA256SUMS (checksums pour verification)
# - BUILD_INFO.txt (details de compilation)
# - packages/ (fichiers .ipk SecuBox)

# 3. Nettoyer apres compilation (optionnel)
./secubox-tools/local-build.sh clean-all  # Supprime le source OpenWrt (economise ~20GB)
```

### Outils de Validation

#### validate-modules.sh

Validation rapide de tous les modules dans le depot.

**Utilisation :**
```bash
./secubox-tools/validate-modules.sh
```

**Verifications effectuees :**
1. **Noms de scripts RPCD vs objets ubus** - Verifie que les noms de fichiers de scripts RPCD correspondent aux declarations d'objets ubus JavaScript
2. **Chemins de menu vs fichiers de vue** - Verifie que les chemins JSON menu.d correspondent aux fichiers de vue reels
3. **Les fichiers de vue ont des entrees de menu** - Verifie que tous les fichiers de vue sont references dans les menus
4. **Permissions des scripts RPCD** - Verifie que les scripts sont executables
5. **Validation de syntaxe JSON** - Valide tous les fichiers JSON menu.d et acl.d
6. **Convention de nommage ubus** - Verifie que tous les objets ubus utilisent le prefixe `luci.`

**Codes de sortie :**
- `0` - Toutes les verifications passees (ou seulement des avertissements)
- `1` - Erreurs critiques trouvees

**Exemple de sortie :**
```
✓ luci-app-cdn-cache: RPCD script 'luci.cdn-cache' matches ubus object 'luci.cdn-cache'
✓ luci-app-cdn-cache: Menu path 'cdn-cache/overview' → file exists
❌ ERROR: luci-app-example: RPCD script 'example' does not match ubus object 'luci.example'
```

#### validate-module-generation.sh

**NOUVEAU !** Validation complete pour un seul module pendant/apres la generation.

**Utilisation :**
```bash
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache
```

**Verifications effectuees :**
- Completude du Makefile (tous les champs requis)
- Convention de nommage des scripts RPCD (prefixe luci.*)
- Structure et handlers des scripts RPCD
- Couverture des permissions ACL
- Validation des chemins de menu
- Validation des vues JavaScript
- Declarations de methodes RPC vs implementations RPCD
- Scans de securite (identifiants codes en dur, commandes dangereuses)
- Presence de documentation

**Quand utiliser :**
- Apres la generation d'un nouveau module
- Avant de commiter des modifications a un module
- Lors du debogage de problemes d'integration de module

#### pre-deploy-lint.sh

**NOUVEAU !** Validation de syntaxe complete avant deploiement. Detecte les erreurs JavaScript, JSON, shell et CSS avant qu'elles ne cassent la production.

**Utilisation :**
```bash
# Valider un seul package
./secubox-tools/pre-deploy-lint.sh luci-app-system-hub

# Valider par nom court
./secubox-tools/pre-deploy-lint.sh system-hub

# Valider tous les packages
./secubox-tools/pre-deploy-lint.sh --all

# Automatiquement via quick-deploy.sh (defaut pour applications LuCI)
./secubox-tools/quick-deploy.sh --app system-hub
```

**Verifications effectuees :**
1. **Validation JavaScript :**
   - Verification de syntaxe complete via Node.js `--check` (si disponible)
   - Verifications de secours basees sur les patterns pour erreurs communes
   - Detecte : instructions debugger, console.log, 'use strict' manquant
   - Specifique LuCI : valide le format des instructions require
2. **Validation JSON :**
   - Verification de syntaxe menu.d et acl.d
   - Python json.tool pour un parsing correct
3. **Validation de Scripts Shell :**
   - Verification de syntaxe Bash/sh via flag `-n`
   - Integration shellcheck (si disponible)
   - Verifications specifiques RPCD : sortie JSON, dispatcher de methode
4. **Validation CSS :**
   - Detection d'accolades non fermees
   - Detection de fautes de frappe communes

**Integration avec quick-deploy.sh :**
```bash
# Lint s'execute automatiquement avant deploiement (defaut)
./secubox-tools/quick-deploy.sh --app cdn-cache

# Sauter le lint (non recommande)
./secubox-tools/quick-deploy.sh --app cdn-cache --no-lint

# Forcer le lint meme pour les deploiements non-LuCI
./secubox-tools/quick-deploy.sh --src ./path --lint
```

**Codes de sortie :**
- `0` - Toutes les verifications passees (ou seulement des avertissements)
- `1` - Erreurs critiques trouvees (deploiement bloque)

**Exemple de sortie :**
```
✓ luci-app-cdn-cache: All files validated

❌ JS syntax error: htdocs/view/cdn-cache/overview.js
    SyntaxError: Unexpected token '}'
⚠️  console.log found in: htdocs/view/cdn-cache/debug.js
```

#### pre-push-validation.sh

**NOUVEAU !** Hook git pre-push qui valide tous les modules avant d'autoriser le push.

**Utilisation :**
```bash
# Automatique (via hook git) :
git push  # la validation s'execute automatiquement

# Manuel :
./secubox-tools/pre-push-validation.sh
```

**Verifications effectuees :**
- Toute la validation de validate-modules.sh
- Analyse des changements git indexes
- Detection des modules modifies
- Scans de securite complets
- Validation complete des modules modifies

**Codes de sortie :**
- `0` - Push autorise
- `1` - Push bloque (erreurs critiques trouvees)

**Installation :**
```bash
./secubox-tools/install-git-hooks.sh
```

### Registre d'Applications et Plugins

#### secubox-app

Aide CLI pour le naissant App Store SecuBox. Il lit `plugins/*/manifest.json`, installe/supprime les packages listes, et execute les actions shell optionnelles (`install`, `check`, `update`, `status`) definies dans le manifest.

```bash
# Lister les manifests et l'etat d'installation
secubox-app list

# Installer Zigbee2MQTT (packages + zigbee2mqttctl install)
secubox-app install zigbee2mqtt

# Afficher le manifest ou executer status/update
secubox-app show zigbee2mqtt
secubox-app status zigbee2mqtt
secubox-app update zigbee2mqtt
```

Environnement : definir `SECUBOX_PLUGINS_DIR` pour overrider le repertoire des manifests (defaut `../plugins`). Requiert `opkg` et `jsonfilter`, donc executez-le sur un systeme OpenWrt (ou dans le chroot SDK).

### Outils de Maintenance

#### secubox-repair.sh

Outil de reparation automatique qui corrige les problemes courants dans les Makefiles et scripts RPCD.

**Utilisation :**
```bash
./secubox-tools/secubox-repair.sh
```

#### secubox-debug.sh

Valide la structure et les dependances d'un package individuel sur un appareil OpenWrt.

**Utilisation :**
```bash
./secubox-tools/secubox-debug.sh luci-app-<module-name>
```

#### install-git-hooks.sh

**NOUVEAU !** Installe les hooks git pour la validation automatique.

**Utilisation :**
```bash
./secubox-tools/install-git-hooks.sh
```

Ceci cree un lien symbolique de `.git/hooks/pre-push` vers `pre-push-validation.sh`.

## Workflow Recommande

### Lors de la Generation d'un Nouveau Module

1. **Generer les fichiers du module** (utiliser Claude avec module-prompts.md)

2. **Valider le module :**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

3. **Corriger toutes les ERREURS** (critique)

4. **Revoir et corriger les AVERTISSEMENTS** (recommande)

5. **Compiler et tester localement** (recommande) :
   ```bash
   ./secubox-tools/local-build.sh build luci-app-<module-name>
   # Tester sur le routeur si necessaire
   ```

6. **Commiter les changements :**
   ```bash
   git add luci-app-<module-name>
   git commit -m "feat: implement <module-name> module"
   git push  # La validation pre-push s'execute automatiquement
   ```

### Lors de la Modification de Modules Existants

1. **Faire vos modifications**

2. **Executer une validation rapide :**
   ```bash
   ./secubox-tools/validate-modules.sh
   ```

3. **Pour des changements complexes, executer la validation complete :**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

4. **Compiler et tester localement** (recommande) :
   ```bash
   ./secubox-tools/local-build.sh build luci-app-<module-name>
   ```

5. **Commiter et pousser** (la validation s'execute automatiquement)

### Avant de Commiter des Changements

Executez toujours au moins un outil de validation avant de commiter :

1. **Executer la validation** (CRITIQUE) :
   ```bash
   ./secubox-tools/validate-modules.sh
   # Ou utiliser local-build.sh pour validation + compilation :
   ./secubox-tools/local-build.sh full
   ```

2. Corriger toute erreur reportee

3. Executer shellcheck sur les scripts RPCD :
   ```bash
   shellcheck luci-app-*/root/usr/libexec/rpcd/*
   ```

4. **Tester la compilation localement** (recommande) :
   ```bash
   ./secubox-tools/local-build.sh build
   ```

5. Commiter les changements

## Corrections Courantes

### Corriger le non-appariement de nommage RPCD

Si la validation reporte que le nom du script RPCD ne correspond pas a l'objet ubus :

```bash
# Renommer le script pour inclure le prefixe luci.
cd luci-app-example/root/usr/libexec/rpcd
mv example luci.example
```

### Corriger le non-appariement de chemin de menu

Si la validation reporte que le chemin de menu ne correspond pas au fichier de vue :

```bash
# Option 1 : Mettre a jour le JSON menu.d pour correspondre a l'emplacement du fichier
# Editer : root/usr/share/luci/menu.d/luci-app-example.json
# Changer : "path": "example/view" → "path": "example-dashboard/view"

# Option 2 : Deplacer les fichiers de vue pour correspondre au chemin de menu
mv htdocs/luci-static/resources/view/example-dashboard \
   htdocs/luci-static/resources/view/example
```

### Corriger un script RPCD non-executable

```bash
chmod +x luci-app-example/root/usr/libexec/rpcd/luci.example
```

## Feed de Packages SecuBox

Le feed SecuBox fournit des packages OpenWrt personnalises installables via `opkg`. Apres la compilation des packages, ils sont synchronises vers `/www/secubox-feed` sur le routeur.

### Structure du Feed

```
/www/secubox-feed/
├── Packages              # Index des packages (texte)
├── Packages.gz           # Index des packages compresse
├── Packages.sig          # Signature optionnelle
└── *.ipk                 # Fichiers de packages
```

### Configurer opkg pour Utiliser le Feed

**Option 1 : Acces fichier local (meme appareil)**
```bash
echo 'src/gz secubox file:///www/secubox-feed' >> /etc/opkg/customfeeds.conf
opkg update
```

**Option 2 : Acces HTTP (appareils reseau)**
```bash
# Depuis d'autres appareils sur le reseau (remplacer l'IP par l'adresse de votre routeur)
echo 'src/gz secubox http://192.168.255.1/secubox-feed' >> /etc/opkg/customfeeds.conf
opkg update
```

**Option 3 : Feed publie via HAProxy (avec SSL)**
```bash
# Si publie via HAProxy avec domaine
echo 'src/gz secubox https://feed.example.com' >> /etc/opkg/customfeeds.conf
opkg update
```

### Installer des Packages depuis le Feed

```bash
# Mettre a jour les listes de packages
opkg update

# Lister les packages SecuBox disponibles
opkg list | grep -E '^(luci-app-|secubox-)'

# Installer un package
opkg install luci-app-service-registry

# Installer avec dependances
opkg install --force-depends luci-app-haproxy
```

### Regenerer l'Index des Packages

Apres l'ajout de nouveaux fichiers .ipk au feed :

```bash
# Sur le routeur
cd /www/secubox-feed
/usr/libexec/opkg-make-index . > Packages
gzip -k Packages
```

Ou utiliser la commande de deploiement :
```bash
# Depuis la machine de developpement
./secubox-tools/local-build.sh deploy root@192.168.255.1 "luci-app-*"
```

### Integration App Store

L'App Store LuCI lit depuis `apps-local.json` pour lister les packages disponibles :

```bash
# Generer le manifest des apps depuis le feed
cat /www/secubox-feed/Packages | awk '
/^Package:/ { pkg=$2 }
/^Version:/ { ver=$2 }
/^Description:/ { desc=substr($0, 14); print pkg, ver, desc }
'
```

Le tableau de bord Service Registry agrege les applications installees et leur statut.

### Exposer le Feed via HAProxy

Pour publier le feed avec HTTPS :

```bash
# Creer le backend HAProxy pour le feed
ubus call luci.haproxy create_backend '{"name":"secubox-feed","mode":"http"}'
ubus call luci.haproxy create_server '{"backend":"secubox-feed","address":"127.0.0.1","port":80}'
ubus call luci.haproxy create_vhost '{"domain":"feed.example.com","backend":"secubox-feed","ssl":1,"acme":1}'

# Demander le certificat
ubus call luci.haproxy request_certificate '{"domain":"feed.example.com"}'
```

### Depannage

**Le feed ne se met pas a jour :**
```bash
# Verifier que l'URL du feed est accessible
curl -I http://192.168.255.1/secubox-feed/Packages

# Verifier la config opkg
cat /etc/opkg/customfeeds.conf

# Forcer le rafraichissement
rm /var/opkg-lists/secubox
opkg update
```

**Erreurs de signature de package :**
```bash
# Sauter la verification de signature (developpement uniquement)
opkg update --no-check-certificate
opkg install --force-checksum <package>
```

---

## Integration avec CI/CD

Le script de validation peut etre integre dans les workflows GitHub Actions :

```yaml
- name: Validate modules
  run: |
    chmod +x secubox-tools/validate-modules.sh
    ./secubox-tools/validate-modules.sh
```

## Regles de Nommage Critiques

**Ces regles sont OBLIGATOIRES** - les violations causeront des erreurs a l'execution :

1. **Les scripts RPCD** doivent etre nommes `luci.<module-name>`
   - ✅ `luci.cdn-cache`
   - ❌ `cdn-cache`

2. **Les chemins de menu** doivent correspondre aux emplacements des fichiers de vue
   - Menu : `"path": "cdn-cache/overview"`
   - Fichier : `view/cdn-cache/overview.js`

3. **Les objets ubus** doivent utiliser le prefixe `luci.`
   - ✅ `object: 'luci.cdn-cache'`
   - ❌ `object: 'cdn-cache'`

Voir `CLAUDE.md` pour la documentation complete.
