# OpenWrt Package Permissions Guide

**Version:** 0.3.1
**Date:** 2025-12-28
**Author:** CyberMind

## 🎯 Objectif

Assurer que tous les fichiers des packages SecuBox ont les **bonnes permissions** dès l'installation, sans nécessiter de correction manuelle.

## 📋 Permissions Requises

### Fichiers Exécutables (755)

Ces fichiers **DOIVENT** avoir les permissions d'exécution:

```
-rwxr-xr-x (755)
```

**Liste des fichiers:**
- `/usr/libexec/rpcd/luci.*` - Scripts RPCD backend
- `/usr/libexec/secubox/*.sh` - Scripts utilitaires
- `/etc/init.d/*` - Scripts d'initialisation
- `/etc/uci-defaults/*` - Scripts de configuration initiale

### Fichiers Non-Exécutables (644)

Ces fichiers **NE DOIVENT PAS** être exécutables:

```
-rw-r--r-- (644)
```

**Liste des fichiers:**
- `/www/luci-static/resources/**/*.js` - Fichiers JavaScript
- `/www/luci-static/resources/**/*.css` - Fichiers CSS
- `/usr/share/rpcd/acl.d/*.json` - Permissions ACL
- `/usr/share/luci/menu.d/*.json` - Définitions de menu
- `/etc/config/*` - Fichiers de configuration UCI

## 🔧 Configuration dans le Makefile

### Méthode Recommandée: PKG_FILE_MODES

OpenWrt supporte la variable `PKG_FILE_MODES` pour définir les permissions des fichiers lors de l'installation du package.

**Syntaxe:**
```makefile
PKG_FILE_MODES:=/path/to/file:permissions
```

**Exemple complet:**
```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-example
PKG_VERSION:=0.3.1
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - Example Module
LUCI_DESCRIPTION:=Example SecuBox module
LUCI_DEPENDS:=+luci-base +rpcd
LUCI_PKGARCH:=all

# File permissions (RPCD scripts must be executable)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
```

### Plusieurs Fichiers Exécutables

Si vous avez plusieurs fichiers exécutables:

```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755 \
	/usr/libexec/example/helper.sh:755 \
	/etc/init.d/example:755
```

**Note:** Utilisez `\` pour continuer sur la ligne suivante.

## 📦 Modules SecuBox avec PKG_FILE_MODES

### luci-app-secubox
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.secubox:755 \
	/usr/libexec/secubox/fix-permissions.sh:755
```

### luci-app-system-hub
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:755
```

### luci-app-network-modes
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.network-modes:755
```

## 🧪 Vérification

### Lors du Développement

Avant de déployer un package, vérifiez les permissions:

```bash
# Vérifier les scripts RPCD
ls -l root/usr/libexec/rpcd/luci.*

# Vérifier les scripts helper
ls -l root/usr/libexec/*/

# Vérifier les fichiers web
find root/www -type f -name "*.js" -o -name "*.css" | xargs ls -l
```

### Après Installation du Package

Vérifiez que les permissions sont correctes sur le routeur:

```bash
# RPCD scripts doivent être 755
ls -l /usr/libexec/rpcd/luci.*

# Fichiers web doivent être 644
ls -l /www/luci-static/resources/secubox/*.js
ls -l /www/luci-static/resources/secubox/*.css
```

## 🛠️ Script de Vérification Automatique

Un script de vérification est inclus dans `luci-app-secubox`:

```bash
# Vérifier et corriger toutes les permissions
/usr/libexec/secubox/fix-permissions.sh

# Via ubus
ubus call luci.secubox fix_permissions

# Via l'interface web
Dashboard → Quick Actions → "🔧 Fix Perms"
```

## ⚠️ Erreurs Communes

### 1. RPCD Script Non-Exécutable

**Symptôme:**
```bash
ubus call luci.example status
# Command failed: Permission denied
```

**Cause:** Le script RPCD n'a pas les permissions 755

**Solution:**
```makefile
# Ajouter dans le Makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755
```

### 2. Fichiers Web Exécutables

**Symptôme:** Fichiers JavaScript/CSS avec permissions 755

**Cause:** Mauvaise manipulation ou script mal configuré

**Solution:** Les fichiers web sont 644 par défaut avec LuCI, pas besoin de les spécifier dans PKG_FILE_MODES

### 3. Script Helper Non-Exécutable

**Symptôme:**
```bash
/usr/libexec/example/helper.sh
# -bash: /usr/libexec/example/helper.sh: Permission denied
```

**Solution:**
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.example:755 \
	/usr/libexec/example/helper.sh:755
```

## 📚 Références

- **LuCI Build System:** `$(TOPDIR)/feeds/luci/luci.mk`
- **OpenWrt Package Build:** https://openwrt.org/docs/guide-developer/packages
- **PKG_FILE_MODES:** https://openwrt.org/docs/guide-developer/build-system/use-buildsystem#build_system_variables

## ✅ Checklist Pré-Déploiement

Avant de créer un package `.ipk` ou `.apk`:

- [ ] Tous les scripts RPCD ont 755 dans PKG_FILE_MODES
- [ ] Tous les scripts helper ont 755 dans PKG_FILE_MODES
- [ ] Les fichiers web (JS/CSS) ne sont PAS dans PKG_FILE_MODES (ils sont 644 par défaut)
- [ ] Les fichiers ACL/Menu ne sont PAS dans PKG_FILE_MODES (ils sont 644 par défaut)
- [ ] Le Makefile utilise `include $(TOPDIR)/feeds/luci/luci.mk`
- [ ] PKG_FILE_MODES est défini AVANT le `include $(TOPDIR)/feeds/luci/luci.mk`

## 🔄 Migration des Modules Existants

Pour ajouter PKG_FILE_MODES à un module existant:

```bash
cd luci-app-mymodule

# Éditer le Makefile
vi Makefile

# Ajouter avant 'include $(TOPDIR)/feeds/luci/luci.mk'
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.mymodule:755

# Reconstruire le package
make package/luci-app-mymodule/clean
make package/luci-app-mymodule/compile
```

---

**Maintainer:** CyberMind <contact@cybermind.fr>
**License:** Apache-2.0
