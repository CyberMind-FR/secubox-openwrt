# GitHub Wiki & Pages Setup Guide

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Purpose:** Guide for publishing SecuBox documentation online

---

## 📚 Two Options for Publishing Documentation

You have two excellent options for publishing your DOCS/ directory online:

### Option 1: GitHub Wiki (Simple, Fast)
- ✅ **Easy Setup:** Built into GitHub, no configuration needed
- ✅ **Quick Deploy:** Simple git push
- ✅ **Fast:** Instant updates
- ✅ **Search:** Built-in search functionality
- ❌ **Limited Theming:** Basic styling only
- ❌ **No Custom Domain:** Must use github.com/user/repo/wiki
- ❌ **Basic Navigation:** Limited sidebar customization

**Best for:** Quick documentation, internal team docs, simple navigation

### Option 2: GitHub Pages with MkDocs (Professional, Feature-Rich)
- ✅ **Professional Theme:** Material Design theme
- ✅ **Custom Domain:** Can use custom domain (docs.yourdomain.com)
- ✅ **Rich Features:** Tabs, search, dark mode, mermaid diagrams
- ✅ **Better Navigation:** Multi-level navigation, tabs
- ✅ **Mobile Responsive:** Optimized for all devices
- ❌ **More Setup:** Requires Python/MkDocs installation
- ❌ **Build Step:** Need to build site before deploying

**Best for:** Public documentation, professional projects, rich content

---

## 🚀 Quick Start

### Option 1: GitHub Wiki

```bash
# 1. Enable Wiki in GitHub repository settings
#    https://github.com/CyberMind-FR/secubox-openwrt/settings

# 2. Run setup script
chmod +x scripts/setup-wiki.sh
./scripts/setup-wiki.sh

# 3. View your wiki
#    https://github.com/CyberMind-FR/secubox-openwrt/wiki
```

**Time to deploy:** ~2 minutes

### Option 2: GitHub Pages

```bash
# 1. Install dependencies
sudo apt-get install python3 python3-pip
pip3 install mkdocs mkdocs-material pymdown-extensions

# 2. Run setup script
chmod +x scripts/setup-github-pages.sh
./scripts/setup-github-pages.sh

# 3. Test locally
mkdocs serve
# Open: http://127.0.0.1:8000

# 4. Commit and push
git add mkdocs.yml docs/
git commit -m "Add GitHub Pages documentation site"
git push

# 5. Enable in GitHub settings
#    https://github.com/CyberMind-FR/secubox-openwrt/settings/pages
#    Source: Deploy from a branch
#    Branch: master, Folder: /docs

# 6. View your site
#    https://gkerma.github.io/secubox-openwrt/
```

**Time to deploy:** ~10 minutes (first time)

---

## 📊 Feature Comparison

| Feature | GitHub Wiki | GitHub Pages (MkDocs) |
|---------|-------------|----------------------|
| **Setup Time** | ⚡ 2 min | 🕐 10 min |
| **Theme** | Basic | ✨ Material Design |
| **Dark Mode** | ❌ No | ✅ Yes |
| **Search** | ✅ Yes | ✅ Yes (Better) |
| **Mermaid Diagrams** | ✅ Yes | ✅ Yes |
| **Code Highlighting** | ✅ Basic | ✅ Advanced |
| **Navigation** | 📋 Sidebar | 🎯 Tabs + Sidebar |
| **Mobile** | ✅ OK | ✅ Excellent |
| **Custom Domain** | ❌ No | ✅ Yes |
| **Version Control** | ✅ Separate repo | ✅ Same repo |
| **Offline Editing** | ✅ Yes | ✅ Yes |
| **Build Required** | ❌ No | ✅ Yes |
| **CI/CD Integration** | ⚠️ Manual | ✅ Easy |

---

## 🎯 Recommendation

**For SecuBox, we recommend GitHub Pages with MkDocs** because:

1. ✨ **Professional appearance** matches your high-quality documentation
2. 📱 **Better mobile experience** for users browsing on phones
3. 🎨 **Material Design theme** aligns with your indigo/violet color scheme
4. 🔍 **Superior search** with instant results
5. 🌙 **Dark mode support** matches your design system
6. 📊 **Mermaid diagram support** for your 3 architecture diagrams
7. 🔗 **Custom domain option** if you want docs.cybermind.fr
8. 🚀 **Better SEO** for public documentation

**However, GitHub Wiki is perfect if:**
- You need documentation **now** (2-minute setup)
- Internal team use only
- Simple navigation is sufficient
- Don't want to maintain build pipeline

---

## 📖 Detailed Setup Instructions

### Option 1: GitHub Wiki Setup

#### Step 1: Enable Wiki

1. Go to repository settings:
   ```
   https://github.com/CyberMind-FR/secubox-openwrt/settings
   ```

2. Scroll to "Features" section

3. Check the "Wikis" checkbox

4. Save changes

#### Step 2: Run Setup Script

```bash
cd /path/to/secubox-openwrt

# Make script executable
chmod +x scripts/setup-wiki.sh

# Run setup
./scripts/setup-wiki.sh
```

**What the script does:**
1. Clones your wiki repository
2. Creates `Home.md` (landing page)
3. Creates `_Sidebar.md` (navigation)
4. Copies all documentation from DOCS/
5. Fixes internal links for wiki format
6. Commits and pushes to wiki repository

#### Step 3: Verify

Visit: `https://github.com/CyberMind-FR/secubox-openwrt/wiki`

#### Step 4: Update Wiki (Future Changes)

Whenever you update DOCS/, run:

```bash
./scripts/setup-wiki.sh
```

The script will sync all changes to the wiki.

---

### Option 2: GitHub Pages Setup

#### Step 1: Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
pip3 install mkdocs mkdocs-material pymdown-extensions
```

**macOS:**
```bash
brew install python3
pip3 install mkdocs mkdocs-material pymdown-extensions
```

**Windows:**
```bash
# Install Python from python.org first
pip install mkdocs mkdocs-material pymdown-extensions
```

#### Step 2: Run Setup Script

```bash
cd /path/to/secubox-openwrt

# Make script executable
chmod +x scripts/setup-github-pages.sh

# Run setup
./scripts/setup-github-pages.sh
```

**What the script does:**
1. Creates `mkdocs.yml` configuration with Material theme
2. Creates `docs/` directory structure
3. Creates beautiful home page with cards
4. Copies all documentation from DOCS/
5. Fixes internal links for web format
6. Creates custom CSS matching your design system
7. Builds preview site

#### Step 3: Test Locally

```bash
mkdocs serve
```

Open browser: `http://127.0.0.1:8000`

**Navigate and test:**
- Check all links work
- Verify diagrams render
- Test dark/light mode toggle
- Try search functionality
- Test responsive design (resize browser)

#### Step 4: Commit and Push

```bash
git add mkdocs.yml docs/
git commit -m "Add GitHub Pages documentation site

- MkDocs Material theme
- Complete documentation sync from DOCS/
- Custom styling matching SecuBox design
- Archive section organized
- Search and navigation configured

🤖 Generated with setup-github-pages.sh
"

git push origin master
```

#### Step 5: Enable GitHub Pages

1. Go to repository settings:
   ```
   https://github.com/CyberMind-FR/secubox-openwrt/settings/pages
   ```

2. Configure:
   - **Source:** Deploy from a branch
   - **Branch:** `master`
   - **Folder:** `/docs`

3. Click **Save**

4. Wait 2-3 minutes for deployment

#### Step 6: Verify

Visit: `https://gkerma.github.io/secubox-openwrt/`

#### Step 7: (Optional) Custom Domain

If you own `cybermind.fr` and want `docs.cybermind.fr`:

1. Add CNAME record in DNS:
   ```
   docs.cybermind.fr  →  gkerma.github.io
   ```

2. Create `docs/CNAME` file:
   ```bash
   echo "docs.cybermind.fr" > docs/CNAME
   ```

3. In GitHub Pages settings, set custom domain:
   ```
   docs.cybermind.fr
   ```

4. Enable "Enforce HTTPS"

#### Step 8: Update Docs (Future Changes)

Whenever you update DOCS/:

```bash
# Update docs
# (edit files in DOCS/)

# Re-run sync script
./scripts/setup-github-pages.sh

# Or manually copy changed files:
cp DOCS/CHANGED-FILE.md docs/changed-file.md

# Build and test
mkdocs serve

# Commit and push
git add docs/
git commit -m "Update documentation"
git push
```

GitHub Pages will auto-rebuild and deploy in ~2 minutes.

---

## 🔄 Automated Sync (CI/CD)

### For GitHub Pages

Create `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches:
      - master
    paths:
      - 'DOCS/**'
      - 'mkdocs.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: 3.x

      - name: Install dependencies
        run: |
          pip install mkdocs mkdocs-material pymdown-extensions

      - name: Sync DOCS to docs/
        run: |
          ./scripts/setup-github-pages.sh

      - name: Deploy to GitHub Pages
        run: mkdocs gh-deploy --force
```

Now documentation auto-updates on every push to DOCS/!

---

## 🎨 Customization

### GitHub Wiki

**Edit sidebar:**
```bash
# Clone wiki
git clone https://github.com/CyberMind-FR/secubox-openwrt.wiki.git

# Edit sidebar
vim _Sidebar.md

# Commit and push
git add _Sidebar.md
git commit -m "Update sidebar"
git push
```

### GitHub Pages

**Edit theme colors:**
```yaml
# mkdocs.yml
theme:
  palette:
    primary: indigo  # Change to: blue, red, green, etc.
    accent: purple   # Change to: pink, cyan, etc.
```

**Add custom CSS:**
```css
/* docs/stylesheets/extra.css */
:root {
    --md-primary-fg-color: #6366f1;  /* Your custom color */
}
```

**Add custom logo:**
```yaml
# mkdocs.yml
theme:
  logo: assets/logo.png
  favicon: assets/favicon.png
```

---

## 📊 Analytics

### GitHub Pages

Add Google Analytics to `mkdocs.yml`:

```yaml
extra:
  analytics:
    provider: google
    property: G-XXXXXXXXXX
```

---

## 🐛 Troubleshooting

### GitHub Wiki

**Problem:** Wiki not showing

**Solution:**
1. Ensure Wiki is enabled in repository settings
2. Check that at least `Home.md` exists
3. Verify push was successful: `git log` in wiki repo

**Problem:** Links broken

**Solution:**
Wiki uses different link format:
- ✅ Correct: `[Text](Page-Name)`
- ❌ Wrong: `[Text](./file.md)`

Run `./scripts/setup-wiki.sh` to fix all links.

### GitHub Pages

**Problem:** Site not building

**Solution:**
1. Check GitHub Actions tab for build errors
2. Test locally: `mkdocs build --strict`
3. Verify `mkdocs.yml` syntax

**Problem:** Diagrams not rendering

**Solution:**
Add to `mkdocs.yml`:
```yaml
markdown_extensions:
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format
```

**Problem:** Links broken

**Solution:**
Use relative links without `./`:
- ✅ Correct: `[Text](page-name.md)`
- ❌ Wrong: `[Text](./PAGE-NAME.md)`

Run `./scripts/setup-github-pages.sh` to fix all links.

---

## 🎯 Our Recommendation

**For SecuBox: Use GitHub Pages with MkDocs Material**

The professional appearance, superior navigation, and rich features perfectly complement your high-quality documentation and modern design system.

**Quick start:**
```bash
chmod +x scripts/setup-github-pages.sh
./scripts/setup-github-pages.sh
mkdocs serve  # Test locally
# Then follow steps 4-6 above to deploy
```

**Result:** Professional documentation site at `https://gkerma.github.io/secubox-openwrt/`

---

## 📞 Support

**Issues with scripts:**
- Check script output for errors
- Ensure all dependencies installed
- Verify DOCS/ directory exists

**Need help?**
- Create GitHub issue
- Email: support@cybermind.fr

---

**Last Updated:** 2025-12-28
**Scripts Location:** `scripts/`
**Maintainer:** CyberMind.fr
