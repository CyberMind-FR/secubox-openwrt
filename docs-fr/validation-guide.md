# Guide de Validation des Modules SecuBox

🌐 **Langues :** [English](../docs/validation-guide.md) | Français | [中文](../docs-zh/validation-guide.md)

**Version :** 1.0.0
**Dernière mise à jour :** 2025-12-28
**Statut :** Actif

> **📚 Référence Complète :**
> Ceci est un guide de validation détaillé. Pour les commandes rapides, voir [QUICK-START.md](quick-start.md)
>
> **Documentation Connexe :**
> - Guide complet : [DEVELOPMENT-GUIDELINES.md §8](development-guidelines.md#validation-checklist)
> - Checklist pré-commit : [DEVELOPMENT-GUIDELINES.md §8.1](development-guidelines.md#pre-commit-checklist)
> - Checklist post-déploiement : [DEVELOPMENT-GUIDELINES.md §8.3](development-guidelines.md#post-deploy-checklist)
> - Guide des permissions : [PERMISSIONS-GUIDE.md](permissions-guide.md)
> - Briefing automatisation : [CODEX.md](codex.md)

---

## Voir Aussi

- **Commandes Rapides :** [QUICK-START.md](quick-start.md)
- **Référence des Permissions :** [PERMISSIONS-GUIDE.md](permissions-guide.md)
- **Garde-fous d'Automatisation :** [CODEX.md](codex.md)
- **Procédures de Déploiement :** [DEVELOPMENT-GUIDELINES.md §9](development-guidelines.md#deployment-procedures)

Ce guide explique les vérifications de validation effectuées sur les modules SecuBox lors de la génération et avant le push git.

## Aperçu

SecuBox utilise une approche de validation multi-niveaux :

1. **Validation à la Génération de Module** - Valide les modules nouvellement créés/modifiés
2. **Validation Pré-Push** - Bloque le push git si des problèmes critiques sont trouvés
3. **Validation à l'Exécution** - Vérifications continues sur les modules déployés

## Outils de Validation

### 1. validate-module-generation.sh

Validation complète pour un seul module pendant/après la génération.

**Utilisation :**
```bash
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache
```

**Vérifications effectuées :**
- ✅ Complétude et exactitude du Makefile
- ✅ Convention de nommage des scripts RPCD (doit utiliser le préfixe `luci.`)
- ✅ Permissions d'exécution des scripts RPCD
- ✅ Structure des scripts RPCD (gestionnaires list/call)
- ✅ Validité JSON du fichier ACL
- ✅ Les permissions ACL couvrent les méthodes RPCD
- ✅ Validité JSON du fichier menu
- ✅ Les chemins de menu correspondent aux emplacements des fichiers de vue
- ✅ Les fichiers de vue JavaScript existent
- ✅ Utilisation du mode strict JavaScript
- ✅ Les appels de méthodes RPC correspondent aux méthodes RPCD
- ✅ Les noms d'objets ubus correspondent aux noms des scripts RPCD
- ✅ Validité de la configuration UCI (si présente)
- ✅ Scan de sécurité (identifiants codés en dur, commandes dangereuses)
- ✅ Présence de documentation

**Codes de sortie :**
- `0` - Toutes les vérifications réussies
- `1` - Erreurs critiques trouvées (le module ne doit pas être déployé)

### 2. pre-push-validation.sh

Valide tous les modules avant d'autoriser le push git.

**Utilisation :**
```bash
# Automatique (via hook git) :
git push  # la validation s'exécute automatiquement

# Manuel :
./secubox-tools/pre-push-validation.sh
```

**Vérifications effectuées :**
- ✅ Vérification des modifications git indexées
- ✅ Conventions de nommage RPCD sur tous les modules
- ✅ Validation des chemins de menu sur tous les modules
- ✅ Validation de la syntaxe JSON
- ✅ Permissions d'exécution RPCD
- ✅ Couverture des méthodes ACL
- ✅ Validation du Makefile
- ✅ Scans de sécurité
- ✅ Validation complète des modules modifiés

**Codes de sortie :**
- `0` - Push autorisé
- `1` - Push bloqué (erreurs critiques)

### 3. validate-modules.sh

Validation rapide de tous les modules (outil existant).

**Utilisation :**
```bash
./secubox-tools/validate-modules.sh
```

Voir `secubox-tools/README.md` pour plus de détails.

## Installation des Hooks Git

Pour activer la validation automatique avant le push git :

```bash
./secubox-tools/install-git-hooks.sh
```

Cela crée un lien symbolique de `.git/hooks/pre-push` vers `secubox-tools/pre-push-validation.sh`.

## Conventions de Nommage Critiques

### 1. Le Script RPCD DOIT Correspondre à l'Objet ubus

**Règle :** Le nom de fichier du script RPCD DOIT correspondre exactement au nom de l'objet ubus déclaré en JavaScript.

**Pourquoi :** Le système RPC de LuCI recherche les scripts RPCD par leur nom de fichier. Si le nom ne correspond pas, vous obtenez :
- `RPC call failed with error -32000: Object not found`
- `Command failed: Method not found`

**Exemple :**

```javascript
// JavaScript (htdocs/luci-static/resources/view/cdn-cache/overview.js)
var callStatus = rpc.declare({
    object: 'luci.cdn-cache',  // ← Doit correspondre au nom du fichier RPCD
    method: 'status'
});
```

```bash
# Le nom du fichier script RPCD DOIT être :
root/usr/libexec/rpcd/luci.cdn-cache  # ← Exactement 'luci.cdn-cache'
```

**Erreurs courantes :**
- ❌ `root/usr/libexec/rpcd/cdn-cache` (préfixe `luci.` manquant)
- ❌ `root/usr/libexec/rpcd/luci-cdn-cache` (utilise un tiret au lieu d'un point)
- ❌ `root/usr/libexec/rpcd/cdn_cache` (utilise un underscore)

**Validation :**
```bash
# Vérifier le nommage :
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache

# Rechercher :
# ✓ RPCD script follows naming convention (luci.* prefix)
# ✓ CRITICAL: RPCD script name matches ACL ubus object
```

### 2. Les Chemins de Menu DOIVENT Correspondre aux Emplacements des Fichiers de Vue

**Règle :** Les entrées `path` du JSON de menu DOIVENT correspondre aux chemins réels des fichiers de vue.

**Pourquoi :** LuCI charge les vues en fonction du chemin dans le menu. Mauvais chemin = HTTP 404.

**Exemple :**

```json
// Menu (root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json)
{
    "action": {
        "type": "view",
        "path": "netifyd-dashboard/overview"  // ← Doit correspondre à l'emplacement du fichier
    }
}
```

```bash
# Le fichier de vue DOIT exister à :
htdocs/luci-static/resources/view/netifyd-dashboard/overview.js
#                                  ↑ Même chemin que le menu ↑
```

**Erreurs courantes :**
- ❌ Menu : `"path": "netifyd/overview"` mais fichier à `view/netifyd-dashboard/overview.js`
- ❌ Menu : `"path": "overview"` mais fichier à `view/netifyd-dashboard/overview.js`

**Validation :**
```bash
# Vérifier les chemins :
./secubox-tools/validate-module-generation.sh luci-app-netifyd-dashboard

# Rechercher :
# ✓ Menu path 'netifyd-dashboard/overview' → view file EXISTS
```

### 3. Tous les Objets ubus DOIVENT Utiliser le Préfixe `luci.`

**Règle :** Chaque déclaration d'objet ubus doit commencer par `luci.`

**Pourquoi :** Convention de nommage cohérente pour les applications LuCI. Le système ACL l'attend.

**Exemple :**

```javascript
// ✅ Correct :
object: 'luci.cdn-cache'
object: 'luci.system-hub'
object: 'luci.wireguard-dashboard'

// ❌ Incorrect :
object: 'cdn-cache'  // Préfixe luci. manquant
object: 'systemhub'  // Préfixe luci. manquant
```

**Validation :**
```bash
# Vérifier la convention :
./secubox-tools/validate-modules.sh

# Rechercher :
# ✓ ubus object 'luci.cdn-cache' follows naming convention
```

## Checklist de Génération de Module

Utilisez cette checklist lors de la génération d'un nouveau module :

### Phase 1 : Génération Initiale

- [ ] Créer le répertoire du module : `luci-app-<nom-module>/`
- [ ] Générer le Makefile avec tous les champs requis
- [ ] Créer le script RPCD à `root/usr/libexec/rpcd/luci.<nom-module>`
- [ ] Rendre le script RPCD exécutable : `chmod +x`
- [ ] Ajouter le shebang au RPCD : `#!/bin/sh`
- [ ] Implémenter les méthodes RPCD (list, call, status, etc.)
- [ ] Créer le fichier ACL avec les permissions read/write
- [ ] Créer le JSON de menu avec les chemins corrects
- [ ] Créer les fichiers JavaScript de vue
- [ ] Ajouter `'use strict';` à tous les fichiers JS

### Phase 2 : Validation

- [ ] Exécuter la validation de génération de module :
  ```bash
  ./secubox-tools/validate-module-generation.sh luci-app-<nom-module>
  ```

- [ ] Corriger toutes les ERREURS (critiques)
- [ ] Examiner tous les AVERTISSEMENTS (recommandé)

### Phase 3 : Validation d'Intégration

- [ ] Vérifier que le nom du script RPCD correspond à l'objet ubus :
  ```bash
  grep -r "object:" luci-app-<nom-module>/htdocs --include="*.js"
  ls -la luci-app-<nom-module>/root/usr/libexec/rpcd/
  # Les noms doivent correspondre exactement
  ```

- [ ] Vérifier que les chemins de menu correspondent aux fichiers de vue :
  ```bash
  grep '"path":' luci-app-<nom-module>/root/usr/share/luci/menu.d/*.json
  ls -R luci-app-<nom-module>/htdocs/luci-static/resources/view/
  # Les chemins doivent s'aligner
  ```

- [ ] Vérifier que les permissions ACL couvrent toutes les méthodes RPCD :
  ```bash
  grep 'case "$2"' luci-app-<nom-module>/root/usr/libexec/rpcd/*
  grep -A 20 '"ubus":' luci-app-<nom-module>/root/usr/share/rpcd/acl.d/*.json
  # Toutes les méthodes doivent être dans ACL
  ```

### Phase 4 : Pré-Commit

- [ ] Exécuter la validation complète :
  ```bash
  ./secubox-tools/validate-modules.sh
  ```

- [ ] Examiner les résultats du scan de sécurité
- [ ] Vérifier la validité JSON :
  ```bash
  find luci-app-<nom-module> -name "*.json" -exec python3 -m json.tool {} \; > /dev/null
  ```

- [ ] Optionnel : Exécuter shellcheck sur RPCD :
  ```bash
  shellcheck luci-app-<nom-module>/root/usr/libexec/rpcd/*
  ```

### Phase 5 : Commit Git

- [ ] Indexer les modifications :
  ```bash
  git add luci-app-<nom-module>
  ```

- [ ] Commiter avec un message descriptif :
  ```bash
  git commit -m "feat: implement <nom-module> module

  - Add RPCD backend with methods: status, get_*, set_*
  - Create views for overview, settings, etc.
  - Configure ACL permissions
  - Add menu entries

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
  ```

- [ ] Pousser (la validation s'exécute automatiquement) :
  ```bash
  git push
  ```

## Erreurs de Validation Courantes et Corrections

### Erreur : Le nom du script RPCD ne correspond pas à l'objet ubus

```
✗ ERROR: luci-app-cdn-cache: RPCD script 'cdn-cache' does NOT match ubus object 'luci.cdn-cache'
```

**Correction :**
```bash
cd luci-app-cdn-cache/root/usr/libexec/rpcd
mv cdn-cache luci.cdn-cache
```

### Erreur : Chemin menu → fichier NON TROUVÉ

```
✗ ERROR: luci-app-netifyd: Menu path 'netifyd/overview' → file NOT FOUND
Expected: htdocs/luci-static/resources/view/netifyd/overview.js
```

**Option de correction 1 :** Mettre à jour le chemin du menu pour correspondre au fichier :
```bash
# Éditer root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json
# Changer : "path": "netifyd/overview"
# En :      "path": "netifyd-dashboard/overview"
```

**Option de correction 2 :** Déplacer le fichier de vue pour correspondre au menu :
```bash
mv htdocs/luci-static/resources/view/netifyd-dashboard \
   htdocs/luci-static/resources/view/netifyd
```

### Erreur : Le script RPCD N'EST PAS exécutable

```
✗ ERROR: luci-app-cdn-cache: luci.cdn-cache is NOT executable
```

**Correction :**
```bash
chmod +x luci-app-cdn-cache/root/usr/libexec/rpcd/luci.cdn-cache
```

### Erreur : Méthode 'get_stats' du RPCD non trouvée dans ACL

```
⚠ WARNING: luci-app-cdn-cache: Method 'get_stats' from RPCD not in ACL
```

**Correction :**
```bash
# Éditer root/usr/share/rpcd/acl.d/luci-app-cdn-cache.json
# Ajouter 'get_stats' au tableau read.ubus :
{
    "luci-app-cdn-cache": {
        "read": {
            "ubus": {
                "luci.cdn-cache": ["status", "get_config", "get_stats"]
                                                           ↑ Ajouter ici
            }
        }
    }
}
```

### Erreur : Syntaxe JSON invalide

```
✗ ERROR: luci-app-cdn-cache: acl.d JSON is INVALID - syntax error
```

**Correction :**
```bash
# Valider le JSON :
python3 -m json.tool root/usr/share/rpcd/acl.d/luci-app-cdn-cache.json

# Problèmes courants :
# - Virgule manquante entre les éléments du tableau
# - Virgule en fin de dernier élément
# - Guillemets non échappés dans les chaînes
```

## Contourner la Validation (NON RECOMMANDÉ)

Dans de rares cas, vous pourriez avoir besoin de contourner la validation :

```bash
# Ignorer la validation pré-push :
git push --no-verify

# Ignorer la validation de génération de module :
# (impossible à contourner - c'est uniquement informatif)
```

**⚠️ AVERTISSEMENT :** Contourner la validation peut conduire à des modules cassés en production !

## Intégration avec CI/CD

### GitHub Actions

Ajouter la validation à votre workflow :

```yaml
name: Validate Modules

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y python3 shellcheck

      - name: Run module validation
        run: |
          chmod +x secubox-tools/validate-modules.sh
          ./secubox-tools/validate-modules.sh

      - name: Run pre-push validation
        run: |
          chmod +x secubox-tools/pre-push-validation.sh
          ./secubox-tools/pre-push-validation.sh
```

## Bonnes Pratiques

1. **Toujours valider avant de commiter**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module>
   ```

2. **Installer les hooks git pour une validation automatique**
   ```bash
   ./secubox-tools/install-git-hooks.sh
   ```

3. **Corriger les erreurs immédiatement** - N'accumulez pas de dette de validation

4. **Examiner les avertissements** - Ils indiquent souvent de vrais problèmes

5. **Tester sur OpenWrt** avant de marquer comme terminé :
   ```bash
   scp bin/packages/*/base/luci-app-*.ipk root@192.168.1.1:/tmp/
   ssh root@192.168.1.1
   opkg install /tmp/luci-app-*.ipk
   /etc/init.d/rpcd restart
   /etc/init.d/uhttpd restart
   ```

6. **Documenter les exigences spécifiques au module** dans le README du module

## Dépannage

### Le script de validation ne s'exécute pas

```bash
# S'assurer que les scripts sont exécutables :
chmod +x secubox-tools/*.sh

# Vérifier les dépendances :
which python3  # Pour la validation JSON
which shellcheck  # Pour la validation des scripts shell
```

### Le hook git ne s'exécute pas

```bash
# Vérifier que le hook est installé :
ls -la .git/hooks/pre-push

# Réinstaller les hooks :
./secubox-tools/install-git-hooks.sh
```

### Faux positifs dans la validation

Si la validation signale incorrectement une erreur, veuillez le signaler :
- Créer un ticket avec la sortie complète de la validation
- Inclure le nom du module et la vérification spécifique qui a échoué
- Nous mettrons à jour la logique de validation

## Ressources Supplémentaires

- [CLAUDE.md](claude.md) - Documentation principale du projet
- [secubox-tools/README.md](https://github.com/CyberMind-FR/secubox-openwrt/blob/master/secubox-tools/README.md) - Documentation des outils
- [Feature Regeneration Prompts](feature-regeneration-prompts.md) - Prompts de génération de modules

## Support

Si vous rencontrez des problèmes de validation :

1. Consultez ce guide pour les erreurs courantes
2. Exécutez la validation avec une sortie verbeuse
3. Examinez CLAUDE.md pour les conventions de nommage
4. Créez un ticket sur GitHub avec la sortie de la validation
