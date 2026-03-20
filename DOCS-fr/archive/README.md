# Archives de Documentation

> **Languages:** [English](../../DOCS/archive/README.md) | Francais | [中文](../../DOCS-zh/archive/README.md)

**Version:** 1.0.0
**Derniere mise a jour:** 2025-12-28
**Statut:** Actif


**Version:** 1.0.0
**Derniere mise a jour:** 2025-12-28
**Statut:** Archive
**Objectif:** Documentation historique et completee

---

## Contenu

### Documents Historiques

#### COMPLETION_REPORT.md
- **Type:** Rapport de completion de projet
- **Date:** 2025-12-26
- **Statut:** Historique
- **Description:** Rapport complet documentant l'achevement de l'initiative de documentation SecuBox, incluant les 15 modules, les outils de validation et les guides d'implementation.

#### MODULE-ENABLE-DISABLE-DESIGN.md
- **Type:** Document de conception
- **Date:** 2025-12-27
- **Version:** 0.3.1
- **Statut:** Archive (fonctionnalite implementee)
- **Description:** Specification de conception pour la fonctionnalite d'activation/desactivation des modules dans SecuBox Central Hub. Cette fonctionnalite a ete implementee et deployee.

#### BUILD_ISSUES.md
- **Type:** Guide de depannage
- **Date:** 2025-12-28
- **Version:** 1.0.0
- **Statut:** Archive (problemes resolus)
- **Description:** Documentation des problemes de compilation rencontres avec la compilation SDK de GitHub Actions. Les problemes ont ete resolus et les solutions integrees dans la documentation principale.

---

## Pourquoi Ces Documents Ont Ete Archives

### Rapports de Completion
Les rapports de completion historiques sont archives apres l'atteinte des jalons du projet. Ils fournissent un historique precieux du projet mais ne sont pas necessaires pour le developpement quotidien.

### Documents de Conception
Les documents de conception sont archives une fois que les fonctionnalites sont entierement implementees et deployees. Les details d'implementation sont maintenant documentes dans les guides principaux.

### Suivi des Problemes
La documentation des problemes de compilation est archivee une fois que les problemes sont resolus et que les solutions sont incorporees dans [DEVELOPMENT-GUIDELINES.md](../DEVELOPMENT-GUIDELINES.md) et [CLAUDE.md](../CLAUDE.md).

---

## Documentation Active

Pour la documentation actuelle et activement maintenue, consultez:

- **[DOCUMENTATION-INDEX.md](../DOCUMENTATION-INDEX.md)** - Index complet de la documentation
- **[QUICK-START.md](../QUICK-START.md)** - Guide de reference rapide
- **[DEVELOPMENT-GUIDELINES.md](../DEVELOPMENT-GUIDELINES.md)** - Guide de developpement complet
- **[CLAUDE.md](../CLAUDE.md)** - Systeme de compilation et architecture
- **[CODE-TEMPLATES.md](../CODE-TEMPLATES.md)** - Templates de code fonctionnels
- **[FEATURE-REGENERATION-PROMPTS.md](../FEATURE-REGENERATION-PROMPTS.md)** - Specifications des modules

---

## Politique d'Archivage

Les documents sont deplaces vers les archives lorsque:
1. La fonctionnalite/projet est complete
2. L'information est obsolete mais historiquement precieuse
3. Le contenu a ete migre vers la documentation active
4. Le document sert uniquement de reference historique

---

## Restauration des Documents Archives

Si vous devez consulter ou restaurer un document archive:

```bash
# Voir le document archive
cat /path/to/secubox-openwrt/DOCS/archive/DOCUMENT_NAME.md

# Restaurer vers la documentation active (si necessaire)
cp archive/DOCUMENT_NAME.md ../DOCUMENT_NAME.md
```

---

**Mainteneur:** CyberMind.fr
**Licence:** Apache-2.0
**Derniere mise a jour:** 2025-12-28
