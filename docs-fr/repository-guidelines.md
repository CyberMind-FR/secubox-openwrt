# Directives du Dépôt

🌐 **Langues :** [English](../docs/repository-guidelines.md) | Français | [中文](../docs-zh/repository-guidelines.md)

## Structure du Projet & Organisation des Modules
- Les applications LuCI (`luci-app-secubox`, `luci-app-*`) stockent les vues dans `htdocs/luci-static/resources` et la logique RPC dans `root/usr/libexec/rpcd` ; `package/secubox/` contient les copies prêtes pour le SDK de ces modules.
- `luci-theme-secubox`, `templates/` et `plugins/` fournissent les CSS partagés, dégradés et widgets qui doivent être référencés via `require secubox/*` au lieu de dupliquer les assets.
- L'automatisation se trouve dans `secubox-tools/`, `scripts/` et les wrappers `deploy-*.sh`, tandis que la documentation est dans `docs/` (MkDocs) et `DOCS/` (approfondissements).

## Commandes de Build, Test & Développement
- `./secubox-tools/local-build.sh build <module>` effectue des builds SDK avec cache ; utilisez `make package/<module>/compile V=s` pour reproduire exactement la CI.
- `./secubox-tools/validate-modules.sh` doit passer avant les commits ; il vérifie le nommage RPC, les chemins de menu, les permissions, le JSON et les vues orphelines.
- `./secubox-tools/quick-deploy.sh --profile luci-app --src luci-app-secubox` synchronise les arborescences `root/` et `htdocs/` vers un routeur ; ajoutez `--list-apps` pour découvrir les IDs valides ou `--app <name>` pour en cibler un.
- `./deploy-to-router.sh` reconstruit `secubox-core` + `luci-app-secubox-admin`, télécharge les derniers IPKs vers `$ROUTER_IP`, les installe et redémarre `rpcd`.

## Style de Code & Conventions de Nommage
- Les vues LuCI utilisent ES5 : `'use strict';`, `'require ...'` groupés, indentation par tabulation et rendu `return view.extend({ ... })` + `E('div', ...)` ; déplacez la logique métier dans des helpers comme `secubox/api`.
- Le JSON de menu `"path": "system-hub/overview"` doit résoudre vers `htdocs/.../view/system-hub/overview.js`, et les scripts RPC dans `root/usr/libexec/rpcd/` doivent correspondre à leurs noms d'objets ubus tout en ayant les permissions exécutables (755).
- Exécutez `./secubox-tools/fix-permissions.sh --local` pour maintenir les fichiers CSS/JS à 644, et gardez le vocabulaire de design cohérent (`sh-*`, `sb-*`, polices Inter/JetBrains, dégradés stockés dans les fichiers de thème).

## Directives de Test
- Exécutez `./secubox-tools/validate-modules.sh` plus `jsonlint file.json` et `shellcheck root/usr/libexec/rpcd/*` pour chaque point de contact.
- Exécutez `scripts/smoke_test.sh` sur le matériel pour confirmer les services Zigbee2MQTT, la santé des conteneurs et MQTT.
- Déposez `test-direct.js` ou `test-modules-simple.js` dans LuCI pour vérifier le câblage des menus, puis supprimez le fichier et enregistrez les commandes `ubus -S call luci.secubox ...` dans la PR.

## Directives de Commit & Pull Request
- Suivez le style d'historique observé : `type(scope): changement` (ex : `fix(luci-app-secubox-admin): add RPC fallback`).
- Les PRs doivent mettre en évidence le module affecté, lister les commandes de validation exécutées et joindre des captures d'écran pour les modifications UI.
- Liez les issues ou entrées TODO, mettez à jour `docs/` + `DOCS/` quand le comportement ou les APIs changent, et signalez les hypothèses d'IP de routeur.

## Conseils de Sécurité & Déploiement
- Exécutez le validateur et `./secubox-tools/fix-permissions.sh --local` avant de pousser pour éviter les HTTP 403, et redémarrez `rpcd` plus purgez les caches LuCI (`rm -f /tmp/luci-*`) si vous n'utilisez pas `deploy-to-router.sh`.
