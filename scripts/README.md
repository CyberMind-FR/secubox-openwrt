# Documentation Publishing Scripts

English | [Francais](README.fr.md) | [中文](README.zh.md)

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Purpose:** Automated scripts for publishing SecuBox documentation

---

## 📜 Available Scripts

### 1. setup-wiki.sh
**Purpose:** Sync DOCS/ to GitHub Wiki

**Usage:**
```bash
./scripts/setup-wiki.sh
```

**What it does:**
- Clones wiki repository
- Creates Home page with navigation
- Creates sidebar
- Copies all documentation files
- Fixes internal links for wiki format
- Commits and pushes to wiki

**Requirements:**
- Git installed
- Wiki enabled in GitHub repository
- SSH access to GitHub

**Time:** ~2 minutes

---

### 2. setup-github-pages.sh
**Purpose:** Create GitHub Pages site with MkDocs Material theme

**Usage:**
```bash
./scripts/setup-github-pages.sh
```

**What it does:**
- Installs MkDocs if needed
- Creates mkdocs.yml configuration
- Generates docs/ directory structure
- Creates beautiful home page
- Copies all documentation files
- Fixes internal links for web
- Builds preview site

**Requirements:**
- Python 3.x installed
- pip3 installed
- ~100MB disk space

**Time:** ~10 minutes (first time)

---

## 🎯 Which Script to Use?

### Use `setup-wiki.sh` if:
- ✅ You want quick setup (2 minutes)
- ✅ Internal documentation only
- ✅ Simple navigation is sufficient
- ✅ No theming needed

### Use `setup-github-pages.sh` if:
- ✅ You want professional appearance
- ✅ Public documentation
- ✅ Custom domain support needed
- ✅ Dark mode support wanted
- ✅ Better mobile experience needed

**Our recommendation:** Use GitHub Pages for SecuBox's professional documentation.

See [WIKI-SETUP-GUIDE.md](../WIKI-SETUP-GUIDE.md) for complete setup instructions.

---

## 🚀 Quick Start

### Option 1: GitHub Wiki

```bash
# 1. Enable Wiki in GitHub settings
# 2. Run script
./scripts/setup-wiki.sh

# 3. View at:
# https://github.com/CyberMind-FR/secubox-openwrt/wiki
```

### Option 2: GitHub Pages (Recommended)

```bash
# 1. Install dependencies
sudo apt-get install python3 python3-pip
pip3 install mkdocs mkdocs-material pymdown-extensions

# 2. Run script
./scripts/setup-github-pages.sh

# 3. Test locally
mkdocs serve

# 4. Commit and push
git add mkdocs.yml docs/
git commit -m "Add GitHub Pages documentation"
git push

# 5. Enable in GitHub settings
# Settings → Pages → Source: master, Folder: /docs

# 6. View at:
# https://gkerma.github.io/secubox-openwrt/
```

---

## 📋 Script Features

### setup-wiki.sh

| Feature | Status |
|---------|--------|
| Auto-clone wiki repo | ✅ |
| Create Home page | ✅ |
| Create sidebar navigation | ✅ |
| Copy all docs | ✅ |
| Fix internal links | ✅ |
| Archive organization | ✅ |
| Auto-commit & push | ✅ |
| Error handling | ✅ |

### setup-github-pages.sh

| Feature | Status |
|---------|--------|
| Dependency check | ✅ |
| Auto-install MkDocs | ✅ |
| Material theme | ✅ |
| Dark/Light mode | ✅ |
| Search functionality | ✅ |
| Mermaid diagrams | ✅ |
| Mobile responsive | ✅ |
| Custom CSS | ✅ |
| Archive organization | ✅ |
| Build preview | ✅ |
| Link fixing | ✅ |
| Error handling | ✅ |

---

## 🔄 Updating Documentation

### For GitHub Wiki

Just run the script again:
```bash
./scripts/setup-wiki.sh
```

All changes in DOCS/ will be synced to wiki.

### For GitHub Pages

```bash
# Option 1: Full re-sync
./scripts/setup-github-pages.sh

# Option 2: Manual update
cp DOCS/CHANGED-FILE.md docs/changed-file.md
mkdocs build
git add docs/
git commit -m "Update docs"
git push
```

---

## 🐛 Troubleshooting

### setup-wiki.sh

**Error: "Wiki repository doesn't exist"**
- Enable Wiki in GitHub repository settings first
- URL: https://github.com/CyberMind-FR/secubox-openwrt/settings

**Error: "Permission denied"**
- Ensure SSH key is configured for GitHub
- Test: `ssh -T git@github.com`

### setup-github-pages.sh

**Error: "mkdocs: command not found"**
- Install MkDocs: `pip3 install mkdocs mkdocs-material`
- Or run script again (auto-installs)

**Error: "No module named 'material'"**
- Install theme: `pip3 install mkdocs-material`

**Error: "Build failed"**
- Check mkdocs.yml syntax
- Test: `mkdocs build --strict`
- Check Python version: `python3 --version` (need 3.6+)

---

## 📊 Comparison

| Aspect | Wiki Script | Pages Script |
|--------|-------------|--------------|
| **Setup Time** | 2 min | 10 min |
| **Dependencies** | Git only | Python, MkDocs |
| **Result** | Basic wiki | Professional site |
| **Theme** | Default | Material Design |
| **Features** | Basic | Advanced |
| **Mobile** | OK | Excellent |
| **SEO** | Basic | Good |
| **Custom Domain** | No | Yes |

---

## 🎨 Customization

### Wiki

Edit generated files in wiki repository:
```bash
git clone https://github.com/CyberMind-FR/secubox-openwrt.wiki.git
cd secubox-openwrt.wiki
# Edit _Sidebar.md, Home.md, etc.
git commit -am "Customize wiki"
git push
```

### GitHub Pages

Edit mkdocs.yml and docs/stylesheets/extra.css:
```bash
# Change theme colors
vim mkdocs.yml

# Change custom styles
vim docs/stylesheets/extra.css

# Rebuild
mkdocs build
```

---

## 📞 Support

**Script Issues:**
- Check error messages in script output
- Verify dependencies installed
- Ensure DOCS/ directory exists

**Need Help:**
- See: [WIKI-SETUP-GUIDE.md](../WIKI-SETUP-GUIDE.md)
- Create GitHub issue
- Email: support@cybermind.fr

---

## 📝 Script Maintenance

**Update scripts:**
```bash
# Edit scripts
vim scripts/setup-wiki.sh
vim scripts/setup-github-pages.sh

# Test changes
./scripts/setup-wiki.sh --dry-run  # (if implemented)

# Commit
git add scripts/
git commit -m "Update wiki setup scripts"
git push
```

---

**Last Updated:** 2025-12-28
**Maintainer:** CyberMind.fr
**License:** Apache-2.0
