#!/bin/bash
# GitHub Wiki Setup Script
# Syncs DOCS/ directory to GitHub Wiki

set -e

WIKI_REPO="git@github.com:gkerma/secubox-openwrt.wiki.git"
DOCS_DIR="./DOCS"
WIKI_DIR="./wiki-temp"

echo "🔧 SecuBox GitHub Wiki Setup"
echo "=============================="
echo ""

# Check if docs directory exists
if [ ! -d "$DOCS_DIR" ]; then
    echo "❌ Error: DOCS directory not found"
    exit 1
fi

# Clone wiki repository
echo "📥 Cloning wiki repository..."
if [ -d "$WIKI_DIR" ]; then
    rm -rf "$WIKI_DIR"
fi

git clone "$WIKI_REPO" "$WIKI_DIR" 2>/dev/null || {
    echo "⚠️  Wiki repository doesn't exist yet."
    echo "   Please enable Wiki in GitHub repository settings first:"
    echo "   https://github.com/CyberMind-FR/secubox-openwrt/settings"
    echo ""
    echo "   Then run this script again."
    exit 1
}

cd "$WIKI_DIR"

echo "🗑️  Cleaning old wiki content..."
# Keep .git directory, remove everything else
find . -maxdepth 1 -not -name '.git' -not -name '.' -not -name '..' -exec rm -rf {} +

echo "📋 Creating wiki structure..."

# Create Home page (wiki landing page)
cat > Home.md << 'EOF'
# SecuBox Documentation

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Project:** OpenWrt LuCI Security & Management Suite

Welcome to the SecuBox documentation wiki! This comprehensive guide covers all aspects of developing, deploying, and maintaining SecuBox modules.

---

## 📚 Quick Navigation

### Getting Started
- **[Quick Start Guide](Quick-Start)** - Essential rules and commands for daily development
- **[Documentation Index](Documentation-Index)** - Complete guide to all documentation

### Core Guides
- **[Development Guidelines](Development-Guidelines)** - Complete development reference with architecture diagrams
- **[Code Templates](Code-Templates)** - Working code examples and patterns
- **[Module Implementation](Module-Implementation-Guide)** - Step-by-step implementation workflow

### Reference
- **[RPCD & Architecture](CLAUDE)** - Build system, CI/CD, and critical naming conventions
- **[Validation Guide](Validation-Guide)** - Module validation and testing
- **[Permissions Guide](Permissions-Guide)** - File permissions reference

### Module Specifications
- **[Feature Regeneration Prompts](Feature-Regeneration-Prompts)** - AI prompts for all 15 modules
- **[Module Status](Module-Status)** - Current status of all modules
- **[LuCI Development Reference](LuCI-Development-Reference)** - LuCI framework guide

### Tools & Automation
- **[TODO Roadmap](TODO-Analyse)** - Documentation improvement roadmap
- **[Archived Documents](archive/)** - Historical and completed documentation

---

## 🏗️ Architecture Overview

SecuBox is a comprehensive security and network management suite for OpenWrt consisting of 15 LuCI application modules:

### Core Control (2 modules)
- **SecuBox Central Hub** - Main dashboard and module management
- **System Hub** - System administration (9 tabs: health, services, logs, backup, etc.)

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

---

## 🚀 Quick Start

### For New Contributors
1. Start with **[Quick Start Guide](Quick-Start)** - Essential rules and commands
2. Read **[Development Guidelines](Development-Guidelines)** - Complete development guide
3. Review **[CLAUDE](CLAUDE)** - Build system and architecture

### For AI-Assisted Development
1. Use **[Module Implementation Guide](Module-Implementation-Guide)** - Step-by-step workflow
2. Copy prompts from **[Feature Regeneration Prompts](Feature-Regeneration-Prompts)**
3. Reference **[Code Templates](Code-Templates)** for implementation patterns

---

## 📊 Design System

SecuBox uses a modern, consistent design system:

- **Color Palette:** Indigo/Violet gradients with dark mode support
- **Typography:** Inter (text) + JetBrains Mono (code/values)
- **Components:** Cards, badges, buttons with gradient effects
- **Layout:** Responsive grid system (130px, 240px, 300px minimums)

See **[Development Guidelines - Design System](Development-Guidelines#design-system--ui-guidelines)** for complete specifications.

---

## 🔧 Development Workflow

### Critical Rules
1. **RPCD Naming:** Script name must match ubus object (`luci.module-name`)
2. **Menu Paths:** Must match view file locations exactly
3. **Permissions:** 755 for RPCD scripts, 644 for CSS/JS
4. **Validation:** Always run `./secubox-tools/validate-modules.sh` before commit

### Tools
- `validate-modules.sh` - 7 automated validation checks
- `fix-permissions.sh` - Auto-fix file permissions
- `local-build.sh` - Local package building

---

## 🌐 Live Demo

**Production Demo:** https://secubox.cybermood.eu

- Main dashboard: `/`
- System Hub: `/system-hub`
- CrowdSec: `/crowdsec`
- All 15 modules accessible

---

## 📞 Support

- **Documentation Issues:** [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)
- **Technical Support:** support@cybermind.fr
- **Company:** CyberMind.fr

---

## 📝 License

Apache-2.0

---

**Maintainer:** CyberMind.fr
**Last Updated:** 2025-12-28
EOF

# Create sidebar navigation
cat > _Sidebar.md << 'EOF'
## 📚 Navigation

### Getting Started
* [Home](Home)
* [Quick Start](Quick-Start)
* [Documentation Index](Documentation-Index)

### Core Guides
* [Development Guidelines](Development-Guidelines)
* [Code Templates](Code-Templates)
* [Module Implementation](Module-Implementation-Guide)

### Reference
* [RPCD & Architecture](CLAUDE)
* [Validation Guide](Validation-Guide)
* [Permissions Guide](Permissions-Guide)

### Specifications
* [Feature Prompts](Feature-Regeneration-Prompts)
* [Module Status](Module-Status)
* [LuCI Reference](LuCI-Development-Reference)

### Tools
* [TODO Roadmap](TODO-Analyse)
* [Archive](archive)

---

### Quick Links
* [GitHub Repo](https://github.com/CyberMind-FR/secubox-openwrt)
* [Live Demo](https://secubox.cybermood.eu)
* [Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)
EOF

echo "📄 Copying documentation files..."

# Function to convert filename to wiki format
convert_filename() {
    local filename="$1"
    # Remove .md extension, replace hyphens with spaces for wiki URLs
    # GitHub wiki uses kebab-case in filenames but displays with spaces
    echo "${filename%.md}" | sed 's/-/ /g'
}

# Copy main documentation files
# GitHub Wiki uses filenames without extensions in links
cp "../$DOCS_DIR/QUICK-START.md" "Quick-Start.md"
cp "../$DOCS_DIR/DEVELOPMENT-GUIDELINES.md" "Development-Guidelines.md"
cp "../$DOCS_DIR/DOCUMENTATION-INDEX.md" "Documentation-Index.md"
cp "../$DOCS_DIR/CODE-TEMPLATES.md" "Code-Templates.md"
cp "../$DOCS_DIR/CLAUDE.md" "CLAUDE.md"
cp "../$DOCS_DIR/VALIDATION-GUIDE.md" "Validation-Guide.md"
cp "../$DOCS_DIR/PERMISSIONS-GUIDE.md" "Permissions-Guide.md"
cp "../$DOCS_DIR/FEATURE-REGENERATION-PROMPTS.md" "Feature-Regeneration-Prompts.md"
cp "../$DOCS_DIR/MODULE-IMPLEMENTATION-GUIDE.md" "Module-Implementation-Guide.md"
cp "../$DOCS_DIR/MODULE_STATUS.md" "Module-Status.md"
cp "../$DOCS_DIR/LUCI_DEVELOPMENT_REFERENCE.md" "LuCI-Development-Reference.md"
cp "../TODO-ANALYSE.md" "TODO-Analyse.md"

# Create archive index page
cat > archive.md << 'EOF'
# Documentation Archive

Historical and completed documentation.

## Archived Documents

* [Build Issues](archive/Build-Issues) - Historical build troubleshooting
* [Completion Report](archive/Completion-Report) - Project completion milestone
* [Module Enable/Disable Design](archive/Module-Enable-Disable-Design) - Feature design document

See [Archive README](archive/README) for archive policy and details.

---

[← Back to Home](Home)
EOF

# Create archive directory and copy files
mkdir -p archive
cp "../$DOCS_DIR/archive/README.md" "archive/README.md"
cp "../$DOCS_DIR/archive/BUILD_ISSUES.md" "archive/Build-Issues.md"
cp "../$DOCS_DIR/archive/COMPLETION_REPORT.md" "archive/Completion-Report.md"
cp "../$DOCS_DIR/archive/MODULE-ENABLE-DISABLE-DESIGN.md" "archive/Module-Enable-Disable-Design.md"

echo "🔧 Fixing internal links for wiki format..."
# GitHub Wiki uses different link format: [Text](Page-Name) instead of [Text](./file.md)
find . -name "*.md" -type f -exec sed -i \
    -e 's|\](\.\/QUICK-START\.md)|](Quick-Start)|g' \
    -e 's|\](\.\/DEVELOPMENT-GUIDELINES\.md)|](Development-Guidelines)|g' \
    -e 's|\](\.\/DOCUMENTATION-INDEX\.md)|](Documentation-Index)|g' \
    -e 's|\](\.\/CODE-TEMPLATES\.md)|](Code-Templates)|g' \
    -e 's|\](\.\/CLAUDE\.md)|](CLAUDE)|g' \
    -e 's|\](\.\/VALIDATION-GUIDE\.md)|](Validation-Guide)|g' \
    -e 's|\](\.\/PERMISSIONS-GUIDE\.md)|](Permissions-Guide)|g' \
    -e 's|\](\.\/FEATURE-REGENERATION-PROMPTS\.md)|](Feature-Regeneration-Prompts)|g' \
    -e 's|\](\.\/MODULE-IMPLEMENTATION-GUIDE\.md)|](Module-Implementation-Guide)|g' \
    -e 's|\](\.\/MODULE_STATUS\.md)|](Module-Status)|g' \
    -e 's|\](\.\/LUCI_DEVELOPMENT_REFERENCE\.md)|](LuCI-Development-Reference)|g' \
    -e 's|\](\.\.\/TODO-ANALYSE\.md)|](TODO-Analyse)|g' \
    -e 's|\](\.\/CODEX\.md)|](CODEX)|g' \
    {} +

echo "📊 Generating wiki statistics..."
file_count=$(find . -name "*.md" -type f | wc -l)
echo "   Total pages: $file_count"

echo ""
echo "💾 Committing changes to wiki..."
git add .
git commit -m "Sync documentation from DOCS/ directory

- Updated all documentation files
- Added Home page with navigation
- Created sidebar for easy navigation
- Organized archive section
- Fixed internal links for wiki format

Total pages: $file_count

🤖 Generated with SecuBox wiki sync script
Date: $(date +%Y-%m-%d)
"

echo ""
echo "📤 Pushing to GitHub Wiki..."
git push origin master

echo ""
echo "✅ Wiki successfully updated!"
echo ""
echo "🌐 View your wiki at:"
echo "   https://github.com/CyberMind-FR/secubox-openwrt/wiki"
echo ""
echo "📋 Pages created: $file_count"
echo ""

# Cleanup
cd ..
rm -rf "$WIKI_DIR"

echo "🎉 Done! Wiki is live on GitHub."
