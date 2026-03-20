# Prototypeur WebUI SecuBox

[English](README.md) | Francais | [中文](README.zh.md)

Maquette FastAPI + Jinja2 qui emule une gestion similaire a LuCI des plugins/modules SecuBox sur une station de travail locale. Il virtualise les modules, presets et pipelines de commandes pour que les developpeurs puissent experimenter sans routeur.

## Fonctionnalites
- **Catalogue de Modules** : Parcourez plus de 29 modules SecuBox auto-ingeres avec metadonnees en direct depuis les packages
- **AppStore** : Interface marketplace avec categories, recherche, notes et avis
- **Registre de Composants** : Composants UI reutilisables depuis les modules installes
- **Profils de Configuration** : Regroupez modules et presets pour differents cas d'usage
- **Generateur de Templates** : Templates de configuration UCI/network/firewall
- **Parametres** : Changement de theme, langue, connexion backend (virtualise/SSH/HTTP)
- **Support Multi-themes** : SecuBox Light + LuCI Dark avec changement transparent
- **Executeur de Presets** : Simule des pipelines multi-commandes avec resultats/logs agreges
- **Console de Contexte Personnalise** : Injectez des overrides JSON dans les executions de presets
- **Integration HTMX** : Mises a jour partielles pour une UI dynamique sans rechargement de page
- **Etat Alpine.js** : Reactivite cote client et notifications toast

## Demarrage
```bash
cd secubox-tools/webui
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]  # ou utilisez UV/Poetry selon preference
uvicorn app.main:app --reload --port 8100
```

Puis visitez `http://127.0.0.1:8100/` et changez de theme via les controles de l'en-tete.

## Structure du Projet
```
webui/
  app/                # Package application FastAPI
  data/               # Catalogues fixtures pour modules, presets, commandes
  templates/          # Templates Jinja2 + hierarchie multi-themes
  static/             # CSS Tailwind-ready (actuellement fait main)
  scripts/            # Futurs helpers d'ingestion/automatisation
```

## Regenerer le Catalogue de Modules
L'interface ingere maintenant les metadonnees en direct depuis les repertoires `package/secubox/*` et `luci-*` a la racine. Executez le helper pour rafraichir `data/modules.json` apres modification des packages :

```bash
# via script helper
cd secubox-tools/webui
./scripts/ingest_packages.py --pretty

# ou en utilisant le point d'entree CLI installe
secubox-webui-ingest --pretty
```

Ce parser lit chaque Makefile (LUCI_TITLE, VERSION, DESCRIPTION, etc.), derive des noms/tags conviviaux, et assigne des contextes/actions securises par defaut pour les maquettes de virtualisation.

## Statut

### Complete
- Navigation complete avec 6 sections principales (Modules, AppStore, Composants, Profils, Templates, Parametres)
- Ingestion de metadonnees de packages en direct depuis le depot
- Systeme multi-themes (SecuBox Light / LuCI Dark)
- Moteur de virtualisation de presets avec simulation de commandes
- Integration HTMX + Alpine.js pour UI dynamique
- AppStore avec categories, recherche, notes et avis
- Tous les templates HTML implementes
- Layouts responsifs bases sur des cartes
- Points d'acces API pour acces programmatique

### Prochaines Etapes
1. **Connecter les fonctionnalites interactives** : Activer installation/desinstallation, activation de profils, generation de templates
2. **Integration Backend** : Connexion a un appareil OpenWrt reel via SSH ou API HTTP
3. **Etendre le flux d'ingestion** : Deriver presets/commandes depuis les metadonnees de packages (ACLs, checklists README)
4. **Authentification** : Ajouter la gestion de session pour les deploiements multi-utilisateurs
5. **Dry-runs containerises** : Etendre le moteur de virtualisation pour fonctionner dans des conteneurs isoles
6. **Mises a jour en temps reel** : Support WebSocket pour la surveillance systeme en direct
