# Manuel de Terrain SecuBox Codex

🌐 **Langues :** [English](../docs/codex.md) | Français | [中文](../docs-zh/codex.md)

**Version :** 1.0.0
**Dernière mise à jour :** 2025-12-28
**Statut :** Actif

---

## Contexte et Portée

SecuBox regroupe plus de quinze tableaux de bord de sécurité et de réseau pour OpenWrt avec une chaîne d'outils unifiée de build/validation et une CI qui livre automatiquement des artefacts `.ipk`/`.apk` (voir `README.md` pour le catalogue des modules et les badges CI, `README.md:7-34`). L'ensemble documentaire est intentionnellement structuré en couches — `DOCS/DOCUMENTATION-INDEX.md` oriente les nouveaux venus, les assistants IA et les mainteneurs vers le niveau de détail approprié, donc commencez toujours vos demandes là avant de plonger dans les guides volumineux (`DOCS/DOCUMENTATION-INDEX.md:15-31`).

Utilisez ce fichier lorsque vous devez briefer rapidement Codex (ou tout agent d'automatisation) sur les attentes de SecuBox : quelles normes sont immuables, comment formuler les prompts, où obtenir de l'aide, quelles décisions ont façonné l'arborescence actuelle, et quels TODOs doivent rester visibles pendant les exécutions d'automatisation.

### Carte des Modules et de la Documentation
- `README.md` : vue d'ensemble sur une page, matrice de compatibilité et points saillants "nouveautés" (`README.md:7-34`).
- `DOCS/QUICK-START.md` : règles critiques, tokens de design, commandes et playbooks d'erreurs (`DOCS/QUICK-START.md:9-195`).
- `DOCS/DEVELOPMENT-GUIDELINES.md` : plongée approfondie dans l'architecture, RPCD, ubus, conventions CSS/JS et déploiement (voir résumé dans `DOCS/DOCUMENTATION-INDEX.md:68-82`).
- `DOCS/MODULE-IMPLEMENTATION-GUIDE.md` + `DOCS/FEATURE-REGENERATION-PROMPTS.md` : workflow de régénération plus prompts prêts à l'emploi pour tous les modules (`DOCS/DOCUMENTATION-INDEX.md:102-149`).
- `DOCS/CODE-TEMPLATES.md` : scaffolding sûr à copier/coller pour LuCI JS, scripts RPCD et APIs (`DOCS/DOCUMENTATION-INDEX.md:153-159`).

---

## Synthèse des Bonnes Pratiques

### Non-Négociables (à intégrer dans chaque prompt ou PR)
- Le nom de fichier RPCD **doit** être égal à l'objet ubus (évite `-32000 Object not found`, `DOCS/QUICK-START.md:11-18`).
- Le `path` du JSON de menu **doit** correspondre au chemin de la vue (évite les 404, `DOCS/QUICK-START.md:20-26`).
- Permissions : RPCD 755, assets LuCI 644, sinon RPCD ne s'exécute pas ou LuCI retourne 403 (`DOCS/QUICK-START.md:28-37`).
- Toujours exécuter `./secubox-tools/validate-modules.sh` avant d'ouvrir des PRs ou de tagger des builds (renforcé dans `README.md:18-23` et `DOCS/QUICK-START.md:122-134`).
- Gardez les tokens de design cohérents : palette sombre (base `#0a0a0f`, dégradés `#6366f1→#8b5cf6`), polices Inter + JetBrains Mono, composants `.sh-*`/`.sb-*`, et largeurs de grille responsive définies dans le quick start (`DOCS/QUICK-START.md:74-114`).

### Flux de Validation et Chaîne d'Outils
1. **Réparation des Permissions (local/distant) :** `./secubox-tools/fix-permissions.sh --local|--remote` pour une vérification chmod automatisée (`DOCS/QUICK-START.md:55-66, 125-127`).
2. **Validation Complète :** `./secubox-tools/validate-modules.sh` (exécute sept vérifications structurelles incluant le scan des permissions) (`DOCS/QUICK-START.md:122-134,185-189`).
3. **Builds de Modules :** `./secubox-tools/local-build.sh build <module>` pour des smoke tests rapides ou `make package/<module>/compile V=s` dans le SDK (`DOCS/QUICK-START.md:135-143`).
4. **Déployer/Corriger :** Copier vers le routeur via `scp`, normaliser les permissions, vider les caches `luci`, redémarrer `rpcd`/`uhttpd` (`DOCS/QUICK-START.md:144-167`).
5. **Debug :** Valider les objets ubus, inspecter les ressources LuCI, et tail `logread` immédiatement après le déploiement (`DOCS/QUICK-START.md:156-167`).

### Rappels Design et UX
- Tuiles de stats minimum 130 px de largeur, métriques 240 px, cartes de détail 300 px : encodez ces règles de grille CSS pour garder les dashboards fluides sur les viewports 720p+ (`DOCS/QUICK-START.md:105-114`).
- Les boutons, onglets et cartes exposent des classes utilitaires `.sh-` ; préférez les bordures dégradées et les états néon aux styles inline pour la maintenabilité (même section).
- Alignez le texte avec la taxonomie du README (Core Control, Security & Monitoring, Network Intelligence, etc.) pour que documentation et UI restent synchronisées (extrait `README.md:37-152`).

---

## Playbook de Prompts

Lors de la rédaction de prompts Codex/LLM, fournissez suffisamment de structure pour que l'assistant puisse réutiliser les patterns existants au lieu de les inventer. Réutilisez ce schéma :

```text
Contexte :
- Module cible + fichier(s) + changement souhaité.
- Tout extrait pertinent de CODE-TEMPLATES ou de fichiers JS/RPCD existants.

Exigences :
- Reformulez les non-négociables (nommage RPCD, chemin de menu, permissions, tokens de design).
- Mentionnez les commandes de validation que Codex devrait exécuter ou supposer.
- Indiquez les endpoints API, objets ubus ou métriques à exposer.

Livrables :
- Fichiers à toucher (chemin + justification).
- Tests/validations attendus (ex. : exécuter ./secubox-tools/validate-modules.sh).
- Indices UX (couleurs, tailles de grille, classes de composants) référençant QUICK-START.

Garde-fous :
- Notez les éléments TODO ou les standards de documentation (en-têtes de version, liens croisés, etc.).
- Rappelez à Codex où enregistrer les changements (README, changelog du module, etc.).
```

Associez ce template avec les prompts spécifiques aux modules de `DOCS/FEATURE-REGENERATION-PROMPTS.md` et le workflow de `DOCS/MODULE-IMPLEMENTATION-GUIDE.md` (`DOCS/DOCUMENTATION-INDEX.md:102-149`). Cette combinaison permet à Codex d'hériter des structures de layout existantes, des shells RPCD et des modules API sans conjectures fragiles.

---

## Aide et Dépannage

- **Vérification Pré-déploiement :** Exécutez les vérifications SSH d'overlay disque/permissions avant de copier les fichiers ; elles sont scriptées dans le quick start pour que vous puissiez les coller directement dans les sessions terminal (`DOCS/QUICK-START.md:40-53`).
- **Corrections d'Erreurs Courantes :** Gardez les corrections rapides à portée de main : HTTP 403 (chmod assets), "No space left" (purger `/tmp/*.ipk` et les backups), ubus `-32000` (chmod 755 + ubus list). Automatisez via `secubox-tools` chaque fois que possible (`DOCS/QUICK-START.md:55-70,171-180`).
- **Dérive de Design :** Si le CSS semble incohérent, vérifiez par rapport à la palette/polices/composants trouvés dans ce manuel et dans la section design du quick start (`DOCS/QUICK-START.md:74-114`).
- **Besoin d'Exemples ?:** Tirez des snippets JS/RPCD réels de `DOCS/CODE-TEMPLATES.md` ou des modules actifs sous `luci-app-*` pour garder le code généré idiomatique (`DOCS/DOCUMENTATION-INDEX.md:153-159`).
- **Toujours Bloqué ?:** `DOCS/DEVELOPMENT-GUIDELINES.md` contient le raisonnement détaillé pour chaque standard ; citez les sections pertinentes lors de l'escalade des problèmes pour que les mainteneurs voient rapidement la source de vérité (`DOCS/DOCUMENTATION-INDEX.md:68-82`).

---

## Historique

- **2025-12-26 – Guides de Dev Complets Publiés :** Le README annonce l'arrivée de l'ensemble complet des guides de développement (section badges README, `README.md:7-16`).
- **2025-12-27 – Index de Documentation v1.0.0 :** L'index central a formalisé la carte des documents et les branches de workflow IA (`DOCS/DOCUMENTATION-INDEX.md:1-31`).
- **2025-12-28 – Plan d'Amélioration de la Documentation :** `TODO-ANALYSE.md` généré pour coordonner le versioning, les liens croisés et les tâches d'archivage (`TODO-ANALYSE.md:1-34,71-150`).
- **2025-12-28 – Manuel Codex Rédigé :** Ce manuel de terrain CODEX formalise comment les agents d'automatisation doivent opérer à l'avenir.

---

## Radar TODO (garder Codex aligné)

1. **Standardiser les en-têtes de version et les dates** – s'assurer que chaque `.md` affiche `Version/Dernière mise à jour/Statut` avec un formatage `YYYY-MM-DD` cohérent ; DOCUMENTATION-INDEX doit décrire la politique une fois les mises à jour effectuées (`TODO-ANALYSE.md:24-68`).
2. **Ajouter des liens croisés "Voir Aussi"** – lier QUICK-START, PERMISSIONS-GUIDE, VALIDATION-GUIDE et autres références rapides à leurs guides parents et vice-versa pour que l'IA/les utilisateurs ne se retrouvent pas avec des instructions orphelines (`TODO-ANALYSE.md:71-116`).
3. **Archiver les docs historiques** – créer `docs/archive/`, déplacer les références obsolètes (COMPLETION_REPORT, MODULE-ENABLE-DISABLE-DESIGN, BUILD_ISSUES, etc.), et déposer un README d'archive décrivant le contenu (`TODO-ANALYSE.md:120-153`).
4. **Travaux futurs (Mensuel/Trimestriel)** – nouveaux diagrammes, guides TESTING/SECURITY/PERFORMANCE, automatisation pour la fraîcheur des docs, et décisions i18n sont en file d'attente plus tard dans `TODO-ANALYSE.md` ; mentionnez-les quand les prompts peuvent impacter la portée ou le format en aval.

Codex devrait traiter les TODOs ci-dessus comme des garde-fous : si une tâche touche la documentation, préférez les solutions qui nous rapprochent de ces objectifs (par ex., ajouter des en-têtes de version en éditant un doc, ou lier en croisant quand on touche aux références rapides).

---

## Checklist de Référence Rapide pour les Exécutions Codex

- [ ] Confirmer que la demande référence le bon guide/template pour minimiser les hallucinations (chemins `DOCS/DOCUMENTATION-INDEX.md`).
- [ ] Copier/coller les non-négociables + le flux de validation dans le prompt.
- [ ] Indiquer quels éléments du radar TODO le changement fait avancer (ou du moins ne fait pas régresser).
- [ ] Citer les commandes/scripts à exécuter après le changement.
- [ ] Capturer les conclusions dans les descriptions de PR/commit en référençant ce manuel CODEX quand pertinent.

Utilisez ce manuel vivant à la fois comme briefing pré-vol et comme journal de débriefing pour le travail d'automatisation. Mettez-le à jour chaque fois que les standards ci-dessus évoluent pour que chaque future session Codex démarre avec le bon modèle mental.
