#!/bin/bash
# GitHub Pages Setup Script (Alternative to Wiki)
# Creates a docs/ site using GitHub Pages with MkDocs

set -e

DOCS_DIR="./DOCS"
SITE_DIR="./docs"

echo "🔧 SecuBox GitHub Pages Setup"
echo "==============================="
echo ""

# Check if docs directory exists
if [ ! -d "$DOCS_DIR" ]; then
    echo "❌ Error: DOCS directory not found"
    exit 1
fi

echo "📦 Checking dependencies..."

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "   Install: sudo apt-get install python3"
    exit 1
fi

# Install mkdocs if not present
if ! command -v mkdocs &> /dev/null; then
    echo "📥 Installing MkDocs..."

    # Check if we're on a Debian/Ubuntu system with apt
    if command -v apt-get &> /dev/null; then
        echo "   Using apt package manager (recommended for Debian/Ubuntu)"
        echo "   Running: sudo apt-get install -y mkdocs mkdocs-material python3-pymdownx"
        sudo apt-get update -qq
        sudo apt-get install -y mkdocs mkdocs-material python3-pymdownx
    else
        # Fallback to pip with virtual environment or user install
        echo "   Using pip3 (fallback method)"
        if python3 -m pip --version &> /dev/null; then
            # Try user install first (doesn't require sudo, doesn't break system)
            python3 -m pip install --user mkdocs mkdocs-material pymdown-extensions
        else
            echo "❌ Error: pip not available and apt not found."
            echo "   Please install mkdocs manually:"
            echo "   - Debian/Ubuntu: sudo apt-get install mkdocs mkdocs-material"
            echo "   - macOS: brew install mkdocs"
            echo "   - Other: pip3 install --user mkdocs mkdocs-material"
            exit 1
        fi
    fi

    # Verify installation
    if ! command -v mkdocs &> /dev/null; then
        echo "❌ Error: MkDocs installation failed."
        exit 1
    fi
else
    echo "✅ MkDocs already installed ($(mkdocs --version | head -1))"
fi

echo ""
echo "📋 Creating GitHub Pages structure..."

# Create mkdocs.yml configuration
cat > mkdocs.yml << 'EOF'
site_name: SecuBox Documentation
site_description: OpenWrt LuCI Security & Management Suite
site_author: CyberMind.fr
site_url: https://gkerma.github.io/secubox-openwrt/

repo_name: gkerma/secubox-openwrt
repo_url: https://github.com/gkerma/secubox-openwrt
edit_uri: edit/master/DOCS/

theme:
  name: material
  palette:
    # Light mode
    - media: "(prefers-color-scheme: light)"
      scheme: default
      primary: indigo
      accent: purple
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    # Dark mode
    - media: "(prefers-color-scheme: dark)"
      scheme: slate
      primary: indigo
      accent: purple
      toggle:
        icon: material/brightness-4
        name: Switch to light mode

  features:
    - navigation.instant
    - navigation.tracking
    - navigation.tabs
    - navigation.tabs.sticky
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.annotate

  icon:
    repo: fontawesome/brands/github
    edit: material/pencil
    view: material/eye

  font:
    text: Inter
    code: JetBrains Mono

extra_css:
  - stylesheets/extra.css

extra:
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/gkerma/secubox-openwrt
    - icon: fontawesome/solid/globe
      link: https://secubox.cybermood.eu

  version:
    provider: mike

markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.tasklist:
      custom_checkbox: true
  - admonition
  - pymdownx.details
  - attr_list
  - md_in_html
  - tables
  - toc:
      permalink: true

nav:
  - Home: index.md
  - Getting Started:
    - Quick Start: quick-start.md
    - Documentation Index: documentation-index.md

  - Development:
    - Development Guidelines: development-guidelines.md
    - Code Templates: code-templates.md
    - Module Implementation: module-implementation-guide.md

  - Reference:
    - RPCD & Architecture: claude.md
    - Validation Guide: validation-guide.md
    - Permissions Guide: permissions-guide.md
    - LuCI Development: luci-development-reference.md

  - Modules:
    - Module Status: module-status.md
    - Feature Prompts: feature-regeneration-prompts.md

  - Tools & Roadmap:
    - TODO Roadmap: todo-analyse.md

  - Archive:
    - Archive Index: archive/index.md
    - Build Issues: archive/build-issues.md
    - Completion Report: archive/completion-report.md
    - Module Enable/Disable: archive/module-enable-disable-design.md
EOF

# Create docs directory structure
echo "📁 Creating docs/ directory..."
rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"
mkdir -p "$SITE_DIR/archive"
mkdir -p "$SITE_DIR/stylesheets"

# Create index page (home)
cat > "$SITE_DIR/index.md" << 'EOF'
# SecuBox Documentation

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Project:** OpenWrt LuCI Security & Management Suite

Welcome to the SecuBox documentation! This comprehensive guide covers all aspects of developing, deploying, and maintaining SecuBox modules.

---

## 🏗️ What is SecuBox?

SecuBox is a comprehensive **security and network management suite for OpenWrt** consisting of **15 LuCI application modules** that provide:

- **Security Monitoring** - CrowdSec intrusion prevention, Netdata metrics
- **Network Intelligence** - Deep packet inspection, traffic classification
- **Access Control** - Captive portal, authentication, VPN management
- **Performance Optimization** - QoS, bandwidth management, caching
- **System Administration** - Centralized dashboard, service management

---

## 🚀 Quick Navigation

<div class="grid cards" markdown>

-   :fontawesome-solid-rocket:{ .lg .middle } **Getting Started**

    ---

    New to SecuBox? Start here!

    [:octicons-arrow-right-24: Quick Start Guide](quick-start.md)

-   :fontawesome-solid-book:{ .lg .middle } **Development Guide**

    ---

    Complete development reference with architecture diagrams

    [:octicons-arrow-right-24: Development Guidelines](development-guidelines.md)

-   :fontawesome-solid-code:{ .lg .middle } **Code Templates**

    ---

    Working examples and implementation patterns

    [:octicons-arrow-right-24: Code Templates](code-templates.md)

-   :fontawesome-solid-list-check:{ .lg .middle } **Validation**

    ---

    Module validation and testing workflows

    [:octicons-arrow-right-24: Validation Guide](validation-guide.md)

</div>

---

## 📦 15 Module Suite

### Core Control (2 modules)
- **SecuBox Central Hub** - Main dashboard and module management
- **System Hub** - System administration (health, services, logs, backup, etc.)

### Security & Monitoring (2 modules)
- **CrowdSec Dashboard** - Intrusion prevention and threat intelligence
- **Netdata Dashboard** - Real-time system monitoring

### Network Intelligence (2 modules)
- **Netifyd Dashboard** - Deep packet inspection and classification
- **Network Modes** - Network profile management

### VPN & Access Control (3 modules)
- **WireGuard Dashboard** - VPN tunnel management
- **Client Guardian** - Network access control and captive portal
- **Auth Guardian** - Authentication system

### Bandwidth & Traffic (2 modules)
- **Bandwidth Manager** - QoS and bandwidth quotas
- **Traffic Shaper** - Advanced traffic shaping

### Performance & Services (2 modules)
- **CDN Cache** - Content delivery network proxy cache
- **VHost Manager** - Virtual host configuration

### System Optimization (2 modules)
- **Media Flow** - Media traffic optimization
- **KSM Manager** - Kernel same-page merging

[View Module Status →](module-status.md){ .md-button .md-button--primary }

---

## 🎨 Design System

SecuBox uses a modern, consistent design system:

- **Color Palette:** Indigo/Violet gradients with dark mode support
- **Typography:** Inter (text) + JetBrains Mono (code/values)
- **Components:** Cards, badges, buttons with gradient effects
- **Layout:** Responsive grid system

See the [Design System section](development-guidelines.md#design-system--ui-guidelines) for complete specifications.

---

## 🔧 Development Workflow

!!! warning "Critical Rules"
    1. **RPCD Naming:** Script name must match ubus object (`luci.module-name`)
    2. **Menu Paths:** Must match view file locations exactly
    3. **Permissions:** 755 for RPCD scripts, 644 for CSS/JS
    4. **Validation:** Always run `./secubox-tools/validate-modules.sh` before commit

### Development Tools

```bash
# Validate all modules (7 automated checks)
./secubox-tools/validate-modules.sh

# Fix file permissions automatically
./secubox-tools/fix-permissions.sh --local

# Build packages locally
./secubox-tools/local-build.sh build luci-app-module-name
```

[Complete Development Workflow →](development-guidelines.md#deployment-procedures){ .md-button }

---

## 🌐 Live Demo

Experience SecuBox in action:

**Production Demo:** [https://secubox.cybermood.eu](https://secubox.cybermood.eu)

- Main dashboard: `/`
- System Hub: `/system-hub`
- CrowdSec: `/crowdsec`
- All 15 modules accessible

---

## 📚 Documentation Sections

### For New Contributors
1. [Quick Start Guide](quick-start.md) - Essential rules and commands
2. [Development Guidelines](development-guidelines.md) - Complete reference
3. [CLAUDE.md](claude.md) - Build system and architecture

### For AI-Assisted Development
1. [Module Implementation Guide](module-implementation-guide.md) - Step-by-step workflow
2. [Feature Regeneration Prompts](feature-regeneration-prompts.md) - AI prompts for all modules
3. [Code Templates](code-templates.md) - Implementation patterns

---

## 📞 Support & Resources

- **GitHub Repository:** [gkerma/secubox-openwrt](https://github.com/gkerma/secubox-openwrt)
- **Documentation Issues:** [GitHub Issues](https://github.com/gkerma/secubox-openwrt/issues)
- **Technical Support:** support@cybermind.fr
- **Company:** CyberMind.fr

---

## 📝 License

Apache-2.0

---

<small>**Last Updated:** 2025-12-28 | **Maintainer:** CyberMind.fr</small>
EOF

# Copy documentation files with lowercase names (convention for web)
echo "📄 Copying documentation files..."
cp "$DOCS_DIR/QUICK-START.md" "$SITE_DIR/quick-start.md"
cp "$DOCS_DIR/DEVELOPMENT-GUIDELINES.md" "$SITE_DIR/development-guidelines.md"
cp "$DOCS_DIR/DOCUMENTATION-INDEX.md" "$SITE_DIR/documentation-index.md"
cp "$DOCS_DIR/CODE-TEMPLATES.md" "$SITE_DIR/code-templates.md"
cp "$DOCS_DIR/CLAUDE.md" "$SITE_DIR/claude.md"
cp "$DOCS_DIR/VALIDATION-GUIDE.md" "$SITE_DIR/validation-guide.md"
cp "$DOCS_DIR/PERMISSIONS-GUIDE.md" "$SITE_DIR/permissions-guide.md"
cp "$DOCS_DIR/FEATURE-REGENERATION-PROMPTS.md" "$SITE_DIR/feature-regeneration-prompts.md"
cp "$DOCS_DIR/MODULE-IMPLEMENTATION-GUIDE.md" "$SITE_DIR/module-implementation-guide.md"
cp "$DOCS_DIR/MODULE_STATUS.md" "$SITE_DIR/module-status.md"
cp "$DOCS_DIR/LUCI_DEVELOPMENT_REFERENCE.md" "$SITE_DIR/luci-development-reference.md"
cp "TODO-ANALYSE.md" "$SITE_DIR/todo-analyse.md"

# Create archive index
cat > "$SITE_DIR/archive/index.md" << 'EOF'
# Documentation Archive

Historical and completed documentation.

## Purpose

This archive contains documents that:
- Represent completed project milestones
- Describe implemented features
- Document resolved issues

## Archived Documents

- [Build Issues](build-issues.md) - Historical build troubleshooting (resolved)
- [Completion Report](completion-report.md) - Project completion milestone
- [Module Enable/Disable Design](module-enable-disable-design.md) - Feature design (implemented)

## Archive Policy

Documents are archived when:
1. ✅ Feature/project is completed
2. ✅ Information is outdated but historically valuable
3. ✅ Content has been migrated to active documentation
4. ✅ Document serves as historical reference only

---

[← Back to Home](../index.md){ .md-button }
EOF

cp "$DOCS_DIR/archive/BUILD_ISSUES.md" "$SITE_DIR/archive/build-issues.md"
cp "$DOCS_DIR/archive/COMPLETION_REPORT.md" "$SITE_DIR/archive/completion-report.md"
cp "$DOCS_DIR/archive/MODULE-ENABLE-DISABLE-DESIGN.md" "$SITE_DIR/archive/module-enable-disable-design.md"

# Create custom CSS
cat > "$SITE_DIR/stylesheets/extra.css" << 'EOF'
/* SecuBox custom styling */

:root {
    --md-primary-fg-color: #6366f1;
    --md-accent-fg-color: #8b5cf6;
}

/* Code blocks */
.highlight {
    border-radius: 0.375rem;
}

/* Cards grid */
.grid.cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
}

.grid.cards > * {
    border: 1px solid var(--md-default-fg-color--lightest);
    border-radius: 0.375rem;
    padding: 1rem;
    transition: transform 0.2s, box-shadow 0.2s;
}

.grid.cards > *:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Gradient headings */
h1 {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Admonitions */
.md-typeset .admonition {
    border-radius: 0.375rem;
}
EOF

echo ""
echo "🔧 Fixing internal links for GitHub Pages..."
# Convert relative links to work with GitHub Pages
find "$SITE_DIR" -name "*.md" -type f -exec sed -i \
    -e 's|\](\.\/QUICK-START\.md)|](quick-start.md)|g' \
    -e 's|\](\.\/DEVELOPMENT-GUIDELINES\.md)|](development-guidelines.md)|g' \
    -e 's|\](\.\/DOCUMENTATION-INDEX\.md)|](documentation-index.md)|g' \
    -e 's|\](\.\/CODE-TEMPLATES\.md)|](code-templates.md)|g' \
    -e 's|\](\.\/CLAUDE\.md)|](claude.md)|g' \
    -e 's|\](\.\/VALIDATION-GUIDE\.md)|](validation-guide.md)|g' \
    -e 's|\](\.\/PERMISSIONS-GUIDE\.md)|](permissions-guide.md)|g' \
    -e 's|\](\.\/FEATURE-REGENERATION-PROMPTS\.md)|](feature-regeneration-prompts.md)|g' \
    -e 's|\](\.\/MODULE-IMPLEMENTATION-GUIDE\.md)|](module-implementation-guide.md)|g' \
    -e 's|\](\.\/MODULE_STATUS\.md)|](module-status.md)|g' \
    -e 's|\](\.\/LUCI_DEVELOPMENT_REFERENCE\.md)|](luci-development-reference.md)|g' \
    -e 's|\](\.\.\/TODO-ANALYSE\.md)|](todo-analyse.md)|g' \
    -e 's|\](\.\/CODEX\.md)|](codex.md)|g' \
    {} +

echo ""
echo "🏗️  Building site preview..."
mkdocs build

echo ""
echo "✅ GitHub Pages setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Test locally:"
echo "   mkdocs serve"
echo "   Open: http://127.0.0.1:8000"
echo ""
echo "2️⃣  Commit and push:"
echo "   git add mkdocs.yml docs/"
echo "   git commit -m 'Add GitHub Pages documentation site'"
echo "   git push"
echo ""
echo "3️⃣  Enable GitHub Pages in repository settings:"
echo "   - Go to: https://github.com/gkerma/secubox-openwrt/settings/pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: master"
echo "   - Folder: /docs"
echo "   - Save"
echo ""
echo "4️⃣  Your site will be live at:"
echo "   https://gkerma.github.io/secubox-openwrt/"
echo ""
echo "🎉 Done! MkDocs Material theme provides a modern documentation site."
