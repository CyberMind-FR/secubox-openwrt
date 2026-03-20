# Scripts de Publication de Documentation

[English](README.md) | Francais | [中文](README.zh.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Objectif :** Scripts automatises pour la publication de la documentation SecuBox

---

## Scripts Disponibles

### 1. setup-wiki.sh
**Objectif :** Synchroniser DOCS/ vers le Wiki GitHub

**Utilisation :**
```bash
./scripts/setup-wiki.sh
```

**Actions effectuees :**
- Clone le depot wiki
- Cree la page d'accueil avec navigation
- Cree la barre laterale
- Copie tous les fichiers de documentation
- Corrige les liens internes pour le format wiki
- Commit et pousse vers le wiki

**Prerequis :**
- Git installe
- Wiki active dans les parametres du depot GitHub
- Acces SSH a GitHub

**Duree :** ~2 minutes

---

### 2. setup-github-pages.sh
**Objectif :** Creer un site GitHub Pages avec le theme MkDocs Material

**Utilisation :**
```bash
./scripts/setup-github-pages.sh
```

**Actions effectuees :**
- Installe MkDocs si necessaire
- Cree la configuration mkdocs.yml
- Genere la structure du repertoire docs/
- Cree une belle page d'accueil
- Copie tous les fichiers de documentation
- Corrige les liens internes pour le web
- Construit un site de previsualisation

**Prerequis :**
- Python 3.x installe
- pip3 installe
- ~100 Mo d'espace disque

**Duree :** ~10 minutes (premiere fois)

---

## Quel Script Utiliser ?

### Utilisez `setup-wiki.sh` si :
- Vous voulez une configuration rapide (2 minutes)
- Documentation interne uniquement
- Une navigation simple suffit
- Pas de thematisation necessaire

### Utilisez `setup-github-pages.sh` si :
- Vous voulez une apparence professionnelle
- Documentation publique
- Support de domaine personnalise necessaire
- Support du mode sombre souhaite
- Meilleure experience mobile necessaire

**Notre recommandation :** Utilisez GitHub Pages pour la documentation professionnelle de SecuBox.

Voir [WIKI-SETUP-GUIDE.md](../WIKI-SETUP-GUIDE.md) pour les instructions de configuration completes.

---

## Demarrage Rapide

### Option 1 : Wiki GitHub

```bash
# 1. Activer le Wiki dans les parametres GitHub
# 2. Executer le script
./scripts/setup-wiki.sh

# 3. Voir sur :
# https://github.com/CyberMind-FR/secubox-openwrt/wiki
```

### Option 2 : GitHub Pages (Recommande)

```bash
# 1. Installer les dependances
sudo apt-get install python3 python3-pip
pip3 install mkdocs mkdocs-material pymdown-extensions

# 2. Executer le script
./scripts/setup-github-pages.sh

# 3. Tester localement
mkdocs serve

# 4. Commit et push
git add mkdocs.yml docs/
git commit -m "Add GitHub Pages documentation"
git push

# 5. Activer dans les parametres GitHub
# Settings → Pages → Source: master, Folder: /docs

# 6. Voir sur :
# https://gkerma.github.io/secubox-openwrt/
```

---

## Fonctionnalites des Scripts

### setup-wiki.sh

| Fonctionnalite | Statut |
|---------|--------|
| Clone automatique du depot wiki | OK |
| Creation de la page d'accueil | OK |
| Creation de la navigation laterale | OK |
| Copie de tous les docs | OK |
| Correction des liens internes | OK |
| Organisation des archives | OK |
| Commit et push automatiques | OK |
| Gestion des erreurs | OK |

### setup-github-pages.sh

| Fonctionnalite | Statut |
|---------|--------|
| Verification des dependances | OK |
| Installation auto de MkDocs | OK |
| Theme Material | OK |
| Mode sombre/clair | OK |
| Fonction de recherche | OK |
| Diagrammes Mermaid | OK |
| Responsive mobile | OK |
| CSS personnalise | OK |
| Organisation des archives | OK |
| Previsualisation de la compilation | OK |
| Correction des liens | OK |
| Gestion des erreurs | OK |

---

## Mise a Jour de la Documentation

### Pour le Wiki GitHub

Executez simplement le script a nouveau :
```bash
./scripts/setup-wiki.sh
```

Toutes les modifications dans DOCS/ seront synchronisees vers le wiki.

### Pour GitHub Pages

```bash
# Option 1 : Re-synchronisation complete
./scripts/setup-github-pages.sh

# Option 2 : Mise a jour manuelle
cp DOCS/CHANGED-FILE.md docs/changed-file.md
mkdocs build
git add docs/
git commit -m "Update docs"
git push
```

---

## Depannage

### setup-wiki.sh

**Erreur : "Wiki repository doesn't exist"**
- Activez d'abord le Wiki dans les parametres du depot GitHub
- URL : https://github.com/CyberMind-FR/secubox-openwrt/settings

**Erreur : "Permission denied"**
- Assurez-vous que la cle SSH est configuree pour GitHub
- Test : `ssh -T git@github.com`

### setup-github-pages.sh

**Erreur : "mkdocs: command not found"**
- Installez MkDocs : `pip3 install mkdocs mkdocs-material`
- Ou executez le script a nouveau (installation auto)

**Erreur : "No module named 'material'"**
- Installez le theme : `pip3 install mkdocs-material`

**Erreur : "Build failed"**
- Verifiez la syntaxe de mkdocs.yml
- Test : `mkdocs build --strict`
- Verifiez la version de Python : `python3 --version` (necessite 3.6+)

---

## Comparaison

| Aspect | Script Wiki | Script Pages |
|--------|-------------|--------------|
| **Temps de configuration** | 2 min | 10 min |
| **Dependances** | Git uniquement | Python, MkDocs |
| **Resultat** | Wiki basique | Site professionnel |
| **Theme** | Par defaut | Material Design |
| **Fonctionnalites** | Basiques | Avancees |
| **Mobile** | OK | Excellent |
| **SEO** | Basique | Bon |
| **Domaine personnalise** | Non | Oui |

---

## Personnalisation

### Wiki

Editez les fichiers generes dans le depot wiki :
```bash
git clone https://github.com/CyberMind-FR/secubox-openwrt.wiki.git
cd secubox-openwrt.wiki
# Editer _Sidebar.md, Home.md, etc.
git commit -am "Customize wiki"
git push
```

### GitHub Pages

Editez mkdocs.yml et docs/stylesheets/extra.css :
```bash
# Changer les couleurs du theme
vim mkdocs.yml

# Changer les styles personnalises
vim docs/stylesheets/extra.css

# Reconstruire
mkdocs build
```

---

## Support

**Problemes de script :**
- Verifiez les messages d'erreur dans la sortie du script
- Verifiez que les dependances sont installees
- Assurez-vous que le repertoire DOCS/ existe

**Besoin d'aide :**
- Voir : [WIKI-SETUP-GUIDE.md](../WIKI-SETUP-GUIDE.md)
- Creer un issue GitHub
- Email : support@cybermind.fr

---

## Maintenance des Scripts

**Mettre a jour les scripts :**
```bash
# Editer les scripts
vim scripts/setup-wiki.sh
vim scripts/setup-github-pages.sh

# Tester les modifications
./scripts/setup-wiki.sh --dry-run  # (si implemente)

# Commit
git add scripts/
git commit -m "Update wiki setup scripts"
git push
```

---

**Derniere mise a jour :** 2025-12-28
**Mainteneur :** CyberMind.fr
**Licence :** Apache-2.0
