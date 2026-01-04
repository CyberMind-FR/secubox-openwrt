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

See the [Design System section](development-guidelines.md#design-system-ui-guidelines) for complete specifications.

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
4. [Repository Guidelines](repository-guidelines.md) - Structure, workflows, and PR expectations

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
