# SecuBox Documentation Index

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active  
**Complete Documentation for SecuBox OpenWrt Project**

---

## 📖 Documentation Overview

This index provides quick access to all SecuBox documentation. Choose the document that matches your needs:

---

## 📅 Version & Status Policy

Every Markdown document in SecuBox must begin with metadata so contributors instantly see freshness:

- Include `Version`, `Last Updated` (YYYY-MM-DD), and `Status` (Active | Draft | Archived).
- New or regenerated docs start at `Version 1.0.0`; bump minor/patch numbers for incremental updates, major for structural rewrites.
- When editing any doc, update the `Last Updated` date and keep statuses in sync with the archive plan outlined in `TODO-ANALYSE.md`.

Follow this template when creating or revising documentation:

```
# Title

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Status:** Active
```

---

## 🚀 Getting Started

### For New Contributors
1. Start with **[QUICK-START.md](./QUICK-START.md)** - Essential rules and commands
2. Read **[DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md)** - Complete development guide
3. Review **[CLAUDE.md](./CLAUDE.md)** - Build system and architecture

### For AI-Assisted Development
1. Use **[MODULE-IMPLEMENTATION-GUIDE.md](./MODULE-IMPLEMENTATION-GUIDE.md)** - Step-by-step workflow
2. Copy prompts from **[FEATURE-REGENERATION-PROMPTS.md](./FEATURE-REGENERATION-PROMPTS.md)**
3. Reference **[CODE-TEMPLATES.md](./CODE-TEMPLATES.md)** for implementation patterns

### For Existing Module Modification
1. Check **[QUICK-START.md](./QUICK-START.md)** - Quick fixes and common commands
2. Run validation: `./secubox-tools/validate-modules.sh`
3. Review **[DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md)** for specific topics

---

## 📚 Document Descriptions

### 1. Quick Reference Documents

#### **QUICK-START.md** ⚡
*Quick reference for common tasks - Read this first!*

**Contents:**
- Critical naming rules (RPCD, menu paths, permissions)
- Design system essentials (colors, fonts, CSS classes)
- Common commands (validation, build, deploy, debug)
- Quick code templates (RPCD, View, Headers, Cards)
- Error quick fixes

**When to use:** Daily development, quick lookups, debugging

---

#### **CODEX.md** 🤖
*Field manual for Codex/automation agents*

**Contents:**
- Repository context and document map
- Non-negotiable build/design standards
- Prompt template for LLM workflows
- Help & troubleshooting pointers
- Documentation TODO radar and history

**When to use:** Before launching Codex/AI-assisted edits, when crafting prompts, or when aligning work with current documentation initiatives

---

#### **README.md** 📋
*Project overview and compatibility matrix*

**Contents:**
- Project description and features
- OpenWrt version compatibility (24.10.x, 25.12.0-rc1, etc.)
- Package format support (.ipk vs .apk)
- Installation instructions
- Module categories and descriptions

**When to use:** Project overview, version compatibility checks

---

### 2. Complete Reference Documents

#### **DEVELOPMENT-GUIDELINES.md** ⭐
*Complete development guide - The definitive reference*

**Contents:**
- **Design System**: Color palettes, typography, component library
- **Architecture**: File structure, naming conventions, RPCD patterns
- **Best Practices**: RPCD, ubus, ACL, JavaScript, CSS standards
- **Common Errors**: Diagnostics and solutions for typical issues
- **Validation**: Pre-commit, pre-deploy, post-deploy checklists
- **Deployment**: Step-by-step deployment procedures

**When to use:** Detailed technical questions, design decisions, troubleshooting

**Size:** Comprehensive (~500+ lines)

---

#### **CLAUDE.md** 🏗️
*Build system, architecture, and CI/CD reference*

**Contents:**
- OpenWrt SDK build commands
- Package testing procedures
- Validation tools and workflows
- LuCI package structure
- Frontend-backend communication
- Critical naming conventions
- CI/CD integration (GitHub Actions)
- Common issues and solutions

**When to use:** Build issues, CI/CD workflows, architecture questions

---

### 3. Implementation & Regeneration Documents

#### **MODULE-IMPLEMENTATION-GUIDE.md** 🎯
*Master guide for implementing/regenerating modules*

**Contents:**
- Step-by-step workflow for regenerating modules
- How to use Claude.ai for code generation
- Complete implementation example (from prompt to deployment)
- Common implementation patterns (multi-tab dashboards, filters, forms)
- Module-specific notes (System Hub, WireGuard, CrowdSec, etc.)
- Troubleshooting guide with solutions
- Best practices (code organization, error handling, performance, UX)
- Deployment checklist

**When to use:** Implementing new modules, regenerating existing modules, using AI assistance

**Size:** Comprehensive guide (~800+ lines)

---

#### **FEATURE-REGENERATION-PROMPTS.md** 💬
*Ready-to-use prompts for all 15 SecuBox modules*

**Contents:**
- Design system reference (CSS variables, typography, components)
- Complete prompts for all 15 modules:
  1. SecuBox Central Hub
  2. System Hub (9 tabs)
  3. CrowdSec Dashboard
  4. Netdata Dashboard
  5. Netifyd Dashboard
  6. Network Modes
  7. WireGuard Dashboard
  8. Client Guardian
  9. Auth Guardian
  10. Bandwidth Manager
  11. Traffic Shaper
  12. Media Flow
  13. CDN Cache
  14. VHost Manager
  15. KSM Manager
- Common UI patterns across all modules
- Usage instructions for Claude.ai

**When to use:** Getting AI to generate module code, understanding module requirements

**Size:** Extensive (~2000+ lines)

---

#### **CODE-TEMPLATES.md** 💻
*Working code templates extracted from production modules*

**Contents:**
- File structure template
- API module template (api.js)
- JavaScript view template (overview.js)
- RPCD backend template (shell script)
- Menu JSON template
- ACL JSON template
- CSS styling template
- Complete minimal working example
- Common pitfalls and solutions
- Validation checklist

**When to use:** Manual implementation, understanding patterns, copying boilerplate code

**Size:** Detailed templates (~1200+ lines)

---

### 4. Embedded Deployment Guides

#### **embedded/docker-zigbee2mqtt.md** 🔌
*Deploy Zigbee2MQTT via Docker on SecuBox (ARM64).*

Pointer: see `docs/embedded/docker-zigbee2mqtt.md` for the canonical version.

#### **embedded/vhost-manager.md** 🌐
*How to publish services through nginx using the vhost manager and CLI helper.*

Pointer: see `docs/embedded/vhost-manager.md` for the canonical version.

---

### 5. Tools & Scripts Documentation

#### **secubox-tools/README.md** 🔧
*Documentation for validation and build tools*

**Contents:**
- Tool descriptions (validate-modules.sh, local-build.sh, etc.)
- Usage examples for each tool
- Supported architectures and devices
- Package building workflows
- Firmware building workflows
- Validation checks (7 automated checks)
- Recommended workflows
- Common fixes

**When to use:** Using validation tools, local builds, firmware generation

---

### 6. Live Demo & Examples

#### **Live Demo Website** 🌐
*Production demo of all modules*

**URL:** https://secubox.cybermood.eu

**Available Demos:**
- Main dashboard: `/`
- System Hub: `/system-hub`
- CrowdSec: `/crowdsec`
- WireGuard: `/wireguard`
- All 15 modules accessible

**When to use:** Visual reference, understanding UI/UX, testing features

---

## 🎯 Quick Lookup by Task

### I want to...

#### ...create a new module from scratch
1. Read: **MODULE-IMPLEMENTATION-GUIDE.md** (Step-by-step workflow)
2. Copy prompt from: **FEATURE-REGENERATION-PROMPTS.md**
3. Use templates from: **CODE-TEMPLATES.md**
4. Validate with: `./secubox-tools/validate-modules.sh`

#### ...regenerate an existing module
1. Read: **MODULE-IMPLEMENTATION-GUIDE.md** (Section: "Step-by-Step: Regenerate a Module with Claude.ai")
2. Copy module specification from: **FEATURE-REGENERATION-PROMPTS.md**
3. Use Claude.ai or copy templates from: **CODE-TEMPLATES.md**
4. Validate and deploy following: **MODULE-IMPLEMENTATION-GUIDE.md**

#### ...fix RPCD "Object not found" error
1. Quick fix: **QUICK-START.md** (Error Quick Fixes section)
2. Detailed troubleshooting: **DEVELOPMENT-GUIDELINES.md** (Common Errors section)
3. Or: **MODULE-IMPLEMENTATION-GUIDE.md** (Troubleshooting Guide)

#### ...understand the design system
1. Quick reference: **QUICK-START.md** (Design System Essentials)
2. Complete guide: **DEVELOPMENT-GUIDELINES.md** (Design System & UI Guidelines)
3. See live examples: **https://secubox.cybermood.eu**

#### ...build packages locally
1. Quick commands: **QUICK-START.md** (Build & Deploy section)
2. Complete guide: **secubox-tools/README.md**
3. Architecture details: **CLAUDE.md** (Build Commands section)

#### ...validate my changes before commit
1. Run: `./secubox-tools/fix-permissions.sh --local`
2. Run: `./secubox-tools/validate-modules.sh`
3. Review checklist: **DEVELOPMENT-GUIDELINES.md** (Validation Checklist)

#### ...understand menu and ACL configuration
1. Quick templates: **CODE-TEMPLATES.md** (Menu JSON Template, ACL JSON Template)
2. Detailed guide: **DEVELOPMENT-GUIDELINES.md** (Architecture & Naming Conventions)
3. Working examples: Look in any `luci-app-*/root/usr/share/` directory

#### ...deploy to test router
1. Quick commands: **QUICK-START.md** (Common Commands)
2. Step-by-step: **MODULE-IMPLEMENTATION-GUIDE.md** (Deploy to Test Router section)
3. Fix permissions after deploy: `./secubox-tools/fix-permissions.sh --remote`

#### ...understand CSS variable system
1. Quick reference: **QUICK-START.md** (CSS Variables section)
2. Complete guide: **DEVELOPMENT-GUIDELINES.md** (CSS/Styling Standards)
3. Template: **CODE-TEMPLATES.md** (CSS Styling Template)
4. Live CSS: `luci-app-system-hub/htdocs/luci-static/resources/system-hub/common.css`

#### ...write RPCD backend script
1. Template: **CODE-TEMPLATES.md** (RPCD Backend Template)
2. Best practices: **DEVELOPMENT-GUIDELINES.md** (RPCD & ubus Best Practices)
3. Working examples: Look in any `luci-app-*/root/usr/libexec/rpcd/` directory

#### ...create multi-tab dashboard
1. Pattern: **MODULE-IMPLEMENTATION-GUIDE.md** (Pattern 1: Multi-Tab Dashboard)
2. Example: See `luci-app-system-hub` (9 tabs)
3. Live demo: https://secubox.cybermood.eu/system-hub

---

## 📊 Documentation Comparison Matrix

| Document | Size | Scope | Use Case | Audience |
|----------|------|-------|----------|----------|
| **QUICK-START.md** | Small | Quick reference | Daily development | All developers |
| **README.md** | Small | Project overview | First introduction | New contributors |
| **DEVELOPMENT-GUIDELINES.md** | Large | Complete reference | Detailed questions | All developers |
| **CLAUDE.md** | Medium | Build & architecture | Build/CI/CD issues | Developers, DevOps |
| **MODULE-IMPLEMENTATION-GUIDE.md** | Large | Implementation workflow | Module creation | AI-assisted dev |
| **FEATURE-REGENERATION-PROMPTS.md** | Very Large | Module specifications | AI prompts | AI-assisted dev |
| **CODE-TEMPLATES.md** | Large | Code templates | Manual coding | Developers |
| **secubox-tools/README.md** | Medium | Tools documentation | Tool usage | Developers, DevOps |

---

## 🔄 Documentation Update Workflow

When making changes to the codebase:

1. **Update code** in module files
2. **Run validation**: `./secubox-tools/validate-modules.sh`
3. **Update documentation** if:
   - New pattern introduced → Add to **CODE-TEMPLATES.md**
   - New design guideline → Update **DEVELOPMENT-GUIDELINES.md**
   - New common error → Add to **QUICK-START.md** and **DEVELOPMENT-GUIDELINES.md**
   - New module → Add to **FEATURE-REGENERATION-PROMPTS.md**
   - New build feature → Update **CLAUDE.md** and **secubox-tools/README.md**
4. **Update version** and date in modified documents
5. **Commit** documentation along with code changes

---

## 📞 Support & Contact

- **Documentation Issues:** Create issue at [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- **Technical Support:** support@cybermind.fr
- **Live Demo:** https://secubox.cybermood.eu
- **Company:** CyberMind.fr

---

## 🎓 Learning Path

### Beginner (New to SecuBox)
1. Day 1: Read **README.md** + **QUICK-START.md**
2. Day 2: Skim **DEVELOPMENT-GUIDELINES.md** (focus on Design System and Architecture)
3. Day 3: Follow **MODULE-IMPLEMENTATION-GUIDE.md** to implement a simple module
4. Day 4: Study existing modules (start with `luci-app-cdn-cache` - simplest)
5. Day 5: Make your first contribution

### Intermediate (Familiar with OpenWrt/LuCI)
1. Read **DEVELOPMENT-GUIDELINES.md** (full document)
2. Review **CODE-TEMPLATES.md** for patterns
3. Use **FEATURE-REGENERATION-PROMPTS.md** with Claude.ai to generate a module
4. Study **CLAUDE.md** for build system details
5. Contribute new modules or enhance existing ones

### Advanced (Ready for Complex Modules)
1. Study complex modules: System Hub, Network Modes
2. Read all documentation for comprehensive understanding
3. Use **MODULE-IMPLEMENTATION-GUIDE.md** patterns for advanced features
4. Contribute to core design system and tools
5. Help with documentation improvements

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-27 | Initial comprehensive documentation release |
|  |  | - Created FEATURE-REGENERATION-PROMPTS.md (15 modules) |
|  |  | - Created CODE-TEMPLATES.md (complete templates) |
|  |  | - Created MODULE-IMPLEMENTATION-GUIDE.md (master guide) |
|  |  | - Created DOCUMENTATION-INDEX.md (this file) |
|  |  | - Enhanced existing documentation |

---

## 🏆 Documentation Quality Goals

- **Completeness:** All aspects of SecuBox development covered
- **Accuracy:** Code examples tested and working
- **Clarity:** Clear explanations with examples
- **Maintainability:** Easy to update as codebase evolves
- **Accessibility:** Multiple entry points for different use cases
- **AI-Friendly:** Structured for AI-assisted development

---

**Last Updated:** 2025-12-27
**Maintainer:** CyberMind.fr
**License:** Apache-2.0
