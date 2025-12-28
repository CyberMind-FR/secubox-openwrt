# SecuBox Global Theme System

**Version:** 1.0.0
**Date:** 2025-12-28
**Status:** Planning & Specification

## 🎯 Vision

Create a unified, dynamic, responsive, and modern "CyberMood" design system for all SecuBox modules with multi-language support, inspired by the SecuBox marketing website aesthetic.

## 🎨 CyberMood Design Language

### Core Aesthetic Principles

**"CyberMood"** = Cyberpunk meets Modern Minimalism
- **Metallic & Glass**: Reflective surfaces, glassmorphism effects
- **Neon Accents**: Electric blues, purples, cyans with glow effects
- **Dark Base**: Deep backgrounds with subtle gradients
- **Dynamic Motion**: Smooth animations, particle effects, flowing gradients
- **Information Dense**: Modern dashboard layouts with data visualization
- **Responsive Flow**: Adapts seamlessly from mobile to desktop

### Visual Identity

```
Primary Palette:
  Base:      #0a0e27 (Deep Space Blue)
  Surface:   #151932 (Dark Slate)
  Accent:    #667eea (Electric Blue)
  Secondary: #764ba2 (Cyber Purple)
  Success:   #10b981 (Emerald)
  Warning:   #f59e0b (Amber)
  Danger:    #ef4444 (Red)
  Info:      #06b6d4 (Cyan)

Metallic Gradients:
  Steel:     linear-gradient(135deg, #434343 0%, #000000 100%)
  Chrome:    linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)
  Gold:      linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)
  Cyber:     linear-gradient(135deg, #667eea 0%, #764ba2 100%)

Glass Effects:
  Blur:      backdrop-filter: blur(10px)
  Opacity:   rgba(255, 255, 255, 0.05)
  Border:    1px solid rgba(255, 255, 255, 0.1)
  Shadow:    0 8px 32px rgba(0, 0, 0, 0.37)

Typography:
  Display:   'Orbitron' (cyberpunk headers)
  Body:      'Inter' (clean readability)
  Mono:      'JetBrains Mono' (code & metrics)

Animation:
  Speed:     0.3s ease-in-out (standard)
  Bounce:    cubic-bezier(0.68, -0.55, 0.265, 1.55)
  Smooth:    cubic-bezier(0.4, 0, 0.2, 1)
```

## 📁 Current State Analysis

### Existing Themes

```
luci-app-secubox/htdocs/luci-static/resources/secubox/
├── secubox.css         # Base SecuBox styles (7.0KB)
├── dashboard.css       # Dashboard-specific (9.5KB)
├── common.css          # Shared utilities (8.4KB)
├── modules.css         # Modules page (7.5KB)
├── alerts.css          # Alerts page (5.1KB)
├── monitoring.css      # Monitoring page (3.0KB)
├── help.css            # Help system (7.0KB)
└── theme.js            # Theme JavaScript (2.0KB)

luci-app-system-hub/htdocs/luci-static/resources/system-hub/
├── dashboard.css       # System Hub dashboard (18.2KB)
├── common.css          # System Hub common (8.4KB)
└── theme.js            # System Hub theme (similar to secubox)

luci-app-network-modes/htdocs/luci-static/resources/network-modes/
├── dashboard.css       # Network Modes dashboard (18.2KB)
└── common.css          # Network Modes common (8.4KB)
```

### Problems with Current Approach

1. **Fragmentation**: Each module has its own CSS files
2. **Duplication**: Common styles repeated across modules
3. **Inconsistency**: Slightly different color values, spacing, etc.
4. **Maintenance**: Changes require updating multiple files
5. **Bundle Size**: Duplicate CSS loaded per module (~50KB total)
6. **No Centralized Theme**: Can't switch themes globally

## 🏗️ Proposed Architecture

### Global Theme Structure

```
luci-theme-cybermood/                    # NEW: Global theme package
├── Makefile
├── README.md
└── htdocs/luci-static/resources/
    └── cybermood/
        ├── core/
        │   ├── variables.css            # CSS custom properties
        │   ├── reset.css                # Normalize/reset
        │   ├── typography.css           # Font definitions
        │   ├── animations.css           # Keyframes & transitions
        │   └── utilities.css            # Helper classes
        ├── components/
        │   ├── buttons.css              # Button styles
        │   ├── cards.css                # Card components
        │   ├── forms.css                # Form elements
        │   ├── tables.css               # Data tables
        │   ├── modals.css               # Modal dialogs
        │   ├── tooltips.css             # Tooltips
        │   ├── badges.css               # Status badges
        │   ├── alerts.css               # Alert messages
        │   ├── charts.css               # Chart containers
        │   └── navigation.css           # Nav elements
        ├── layouts/
        │   ├── dashboard.css            # Dashboard layout
        │   ├── grid.css                 # Grid system
        │   └── responsive.css           # Breakpoints
        ├── themes/
        │   ├── dark.css                 # Dark theme (default)
        │   ├── light.css                # Light theme
        │   └── cyberpunk.css            # High-contrast cyber
        ├── i18n/
        │   ├── en.json                  # English strings
        │   ├── fr.json                  # French strings
        │   ├── de.json                  # German strings
        │   └── es.json                  # Spanish strings
        ├── cybermood.css                # Main bundle (imports all)
        ├── cybermood.min.css            # Minified version
        └── cybermood.js                 # Theme controller
```

### Module Integration

```javascript
// In each module's view file
'use strict';
'require view';
'require cybermood/theme as Theme';

return view.extend({
    render: function() {
        // Apply theme
        Theme.apply('dark');

        // Use theme components
        return E('div', { 'class': 'cyber-container' }, [
            Theme.createCard({
                title: _('Module Title'),
                icon: '🎯',
                content: this.renderContent()
            })
        ]);
    }
});
```

## 🎨 Ready-to-Use Templates

### 1. CSS Variables (variables.css)

```css
/**
 * CyberMood Design System - CSS Variables
 * Version: 1.0.0
 */

:root {
    /* ========================================
       Colors - Base Palette
       ======================================== */

    /* Dark Theme (Default) */
    --cyber-bg-primary: #0a0e27;
    --cyber-bg-secondary: #151932;
    --cyber-bg-tertiary: #1e2139;
    --cyber-surface: #252b4a;
    --cyber-surface-light: #2d3454;

    /* Text Colors */
    --cyber-text-primary: #e2e8f0;
    --cyber-text-secondary: #94a3b8;
    --cyber-text-muted: #64748b;
    --cyber-text-inverse: #0a0e27;

    /* Accent Colors */
    --cyber-accent-primary: #667eea;
    --cyber-accent-primary-end: #764ba2;
    --cyber-accent-secondary: #06b6d4;
    --cyber-accent-tertiary: #8b5cf6;

    /* Semantic Colors */
    --cyber-success: #10b981;
    --cyber-success-light: #34d399;
    --cyber-warning: #f59e0b;
    --cyber-warning-light: #fbbf24;
    --cyber-danger: #ef4444;
    --cyber-danger-light: #f87171;
    --cyber-info: #06b6d4;
    --cyber-info-light: #22d3ee;

    /* Metallic Gradients */
    --cyber-gradient-steel: linear-gradient(135deg, #434343 0%, #000000 100%);
    --cyber-gradient-chrome: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%);
    --cyber-gradient-cyber: linear-gradient(135deg, var(--cyber-accent-primary) 0%, var(--cyber-accent-primary-end) 100%);
    --cyber-gradient-success: linear-gradient(135deg, var(--cyber-success) 0%, var(--cyber-success-light) 100%);
    --cyber-gradient-danger: linear-gradient(135deg, var(--cyber-danger) 0%, var(--cyber-danger-light) 100%);

    /* Glass Effects */
    --cyber-glass-bg: rgba(255, 255, 255, 0.05);
    --cyber-glass-border: rgba(255, 255, 255, 0.1);
    --cyber-glass-blur: 10px;
    --cyber-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);

    /* ========================================
       Typography
       ======================================== */

    --cyber-font-display: 'Orbitron', 'Inter', sans-serif;
    --cyber-font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --cyber-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

    --cyber-font-size-xs: 0.75rem;    /* 12px */
    --cyber-font-size-sm: 0.875rem;   /* 14px */
    --cyber-font-size-base: 1rem;     /* 16px */
    --cyber-font-size-lg: 1.125rem;   /* 18px */
    --cyber-font-size-xl: 1.25rem;    /* 20px */
    --cyber-font-size-2xl: 1.5rem;    /* 24px */
    --cyber-font-size-3xl: 1.875rem;  /* 30px */
    --cyber-font-size-4xl: 2.25rem;   /* 36px */

    --cyber-font-weight-light: 300;
    --cyber-font-weight-normal: 400;
    --cyber-font-weight-medium: 500;
    --cyber-font-weight-semibold: 600;
    --cyber-font-weight-bold: 700;

    /* ========================================
       Spacing
       ======================================== */

    --cyber-space-xs: 0.25rem;   /* 4px */
    --cyber-space-sm: 0.5rem;    /* 8px */
    --cyber-space-md: 1rem;      /* 16px */
    --cyber-space-lg: 1.5rem;    /* 24px */
    --cyber-space-xl: 2rem;      /* 32px */
    --cyber-space-2xl: 3rem;     /* 48px */
    --cyber-space-3xl: 4rem;     /* 64px */

    /* ========================================
       Border Radius
       ======================================== */

    --cyber-radius-sm: 0.25rem;  /* 4px */
    --cyber-radius-md: 0.5rem;   /* 8px */
    --cyber-radius-lg: 0.75rem;  /* 12px */
    --cyber-radius-xl: 1rem;     /* 16px */
    --cyber-radius-full: 9999px;

    /* ========================================
       Shadows
       ======================================== */

    --cyber-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --cyber-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --cyber-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    --cyber-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
    --cyber-shadow-glow: 0 0 20px rgba(102, 126, 234, 0.5);
    --cyber-shadow-glow-success: 0 0 20px rgba(16, 185, 129, 0.5);
    --cyber-shadow-glow-danger: 0 0 20px rgba(239, 68, 68, 0.5);

    /* ========================================
       Transitions
       ======================================== */

    --cyber-transition-fast: 0.15s ease-in-out;
    --cyber-transition-base: 0.3s ease-in-out;
    --cyber-transition-slow: 0.5s ease-in-out;
    --cyber-transition-bounce: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --cyber-transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* ========================================
       Z-Index Layers
       ======================================== */

    --cyber-z-base: 0;
    --cyber-z-dropdown: 1000;
    --cyber-z-sticky: 1100;
    --cyber-z-fixed: 1200;
    --cyber-z-modal-backdrop: 1300;
    --cyber-z-modal: 1400;
    --cyber-z-popover: 1500;
    --cyber-z-tooltip: 1600;
}

/* ========================================
   Light Theme Override
   ======================================== */

[data-theme="light"] {
    --cyber-bg-primary: #f8fafc;
    --cyber-bg-secondary: #f1f5f9;
    --cyber-bg-tertiary: #e2e8f0;
    --cyber-surface: #ffffff;
    --cyber-surface-light: #f8fafc;

    --cyber-text-primary: #0f172a;
    --cyber-text-secondary: #475569;
    --cyber-text-muted: #64748b;
    --cyber-text-inverse: #ffffff;

    --cyber-glass-bg: rgba(255, 255, 255, 0.8);
    --cyber-glass-border: rgba(0, 0, 0, 0.1);
    --cyber-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* ========================================
   Cyberpunk Theme (High Contrast)
   ======================================== */

[data-theme="cyberpunk"] {
    --cyber-bg-primary: #000000;
    --cyber-bg-secondary: #0a0a0a;
    --cyber-accent-primary: #00ffff;
    --cyber-accent-primary-end: #ff00ff;
    --cyber-success: #00ff00;
    --cyber-danger: #ff0000;
    --cyber-shadow-glow: 0 0 30px rgba(0, 255, 255, 0.8);
}
```

### 2. Card Component Template (cards.css)

```css
/**
 * CyberMood Card Component
 */

.cyber-card {
    background: var(--cyber-glass-bg);
    backdrop-filter: blur(var(--cyber-glass-blur));
    border: 1px solid var(--cyber-glass-border);
    border-radius: var(--cyber-radius-xl);
    padding: var(--cyber-space-lg);
    box-shadow: var(--cyber-glass-shadow);
    transition: all var(--cyber-transition-base);
    position: relative;
    overflow: hidden;
}

.cyber-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--cyber-gradient-cyber);
    opacity: 0;
    transition: opacity var(--cyber-transition-base);
}

.cyber-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--cyber-shadow-xl), var(--cyber-shadow-glow);
    border-color: var(--cyber-accent-primary);
}

.cyber-card:hover::before {
    opacity: 1;
}

.cyber-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--cyber-space-md);
    padding-bottom: var(--cyber-space-md);
    border-bottom: 1px solid var(--cyber-glass-border);
}

.cyber-card-title {
    font-family: var(--cyber-font-display);
    font-size: var(--cyber-font-size-xl);
    font-weight: var(--cyber-font-weight-semibold);
    color: var(--cyber-text-primary);
    display: flex;
    align-items: center;
    gap: var(--cyber-space-sm);
    margin: 0;
}

.cyber-card-icon {
    font-size: var(--cyber-font-size-2xl);
    filter: drop-shadow(0 0 10px currentColor);
}

.cyber-card-body {
    color: var(--cyber-text-secondary);
    line-height: 1.6;
}

.cyber-card-footer {
    margin-top: var(--cyber-space-lg);
    padding-top: var(--cyber-space-md);
    border-top: 1px solid var(--cyber-glass-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* Card Variants */
.cyber-card--success {
    border-color: var(--cyber-success);
}

.cyber-card--success:hover {
    box-shadow: var(--cyber-shadow-xl), var(--cyber-shadow-glow-success);
}

.cyber-card--danger {
    border-color: var(--cyber-danger);
}

.cyber-card--danger:hover {
    box-shadow: var(--cyber-shadow-xl), var(--cyber-shadow-glow-danger);
}

.cyber-card--compact {
    padding: var(--cyber-space-md);
}

.cyber-card--flat {
    background: var(--cyber-surface);
    backdrop-filter: none;
}
```

### 3. JavaScript Theme Controller (cybermood.js)

```javascript
/**
 * CyberMood Theme Controller
 * Version: 1.0.0
 */

'use strict';

var CyberMoodTheme = {
    version: '1.0.0',
    currentTheme: 'dark',
    currentLang: 'en',
    translations: {},

    /**
     * Initialize theme system
     */
    init: function() {
        console.log('🎨 CyberMood Theme System v' + this.version);

        // Load saved theme preference
        var savedTheme = this.getSavedTheme();
        if (savedTheme) {
            this.apply(savedTheme);
        }

        // Load saved language
        var savedLang = this.getSavedLang();
        if (savedLang) {
            this.setLanguage(savedLang);
        }

        // Add theme toggle listener
        this.attachThemeToggle();

        // Initialize animations
        this.initAnimations();

        return this;
    },

    /**
     * Apply theme
     * @param {string} theme - Theme name: 'dark', 'light', 'cyberpunk'
     */
    apply: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);

        // Trigger theme change event
        var event = new CustomEvent('themechange', { detail: { theme: theme } });
        document.dispatchEvent(event);

        console.log('✅ Theme applied:', theme);
    },

    /**
     * Toggle between dark and light themes
     */
    toggle: function() {
        var newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.apply(newTheme);
    },

    /**
     * Create themed card component
     * @param {object} options - Card options
     * @returns {Element} Card element
     */
    createCard: function(options) {
        var opts = options || {};
        var variant = opts.variant || '';

        var card = E('div', {
            'class': 'cyber-card' + (variant ? ' cyber-card--' + variant : '')
        });

        // Header
        if (opts.title || opts.icon) {
            var header = E('div', { 'class': 'cyber-card-header' });

            var title = E('h3', { 'class': 'cyber-card-title' }, [
                opts.icon ? E('span', { 'class': 'cyber-card-icon' }, opts.icon) : null,
                opts.title || ''
            ]);

            header.appendChild(title);

            if (opts.actions) {
                header.appendChild(opts.actions);
            }

            card.appendChild(header);
        }

        // Body
        if (opts.content) {
            var body = E('div', { 'class': 'cyber-card-body' }, [opts.content]);
            card.appendChild(body);
        }

        // Footer
        if (opts.footer) {
            var footer = E('div', { 'class': 'cyber-card-footer' }, [opts.footer]);
            card.appendChild(footer);
        }

        return card;
    },

    /**
     * Create button with theme
     * @param {object} options - Button options
     * @returns {Element} Button element
     */
    createButton: function(options) {
        var opts = options || {};
        var classes = ['cyber-btn'];

        if (opts.variant) classes.push('cyber-btn--' + opts.variant);
        if (opts.size) classes.push('cyber-btn--' + opts.size);
        if (opts.block) classes.push('cyber-btn--block');

        return E('button', {
            'class': classes.join(' '),
            'click': opts.onClick || null,
            'disabled': opts.disabled || false
        }, [
            opts.icon ? E('span', { 'class': 'cyber-btn-icon' }, opts.icon) : null,
            opts.label || ''
        ]);
    },

    /**
     * Create badge component
     * @param {string} text - Badge text
     * @param {string} variant - Badge variant
     * @returns {Element} Badge element
     */
    createBadge: function(text, variant) {
        return E('span', {
            'class': 'cyber-badge cyber-badge--' + (variant || 'default')
        }, text);
    },

    /**
     * Set language
     * @param {string} lang - Language code (en, fr, de, es)
     */
    setLanguage: function(lang) {
        var self = this;

        // Load translation file
        return fetch(L.resource('cybermood/i18n/' + lang + '.json'))
            .then(function(response) {
                return response.json();
            })
            .then(function(translations) {
                self.translations = translations;
                self.currentLang = lang;
                self.saveLang(lang);

                // Trigger language change event
                var event = new CustomEvent('langchange', { detail: { lang: lang } });
                document.dispatchEvent(event);

                console.log('✅ Language set:', lang);
            })
            .catch(function(error) {
                console.error('❌ Failed to load language:', lang, error);
            });
    },

    /**
     * Translate string
     * @param {string} key - Translation key
     * @param {object} params - Parameters for interpolation
     * @returns {string} Translated string
     */
    t: function(key, params) {
        var translation = this.translations[key] || key;

        // Simple parameter interpolation
        if (params) {
            Object.keys(params).forEach(function(param) {
                translation = translation.replace('{' + param + '}', params[param]);
            });
        }

        return translation;
    },

    /**
     * Initialize animations
     */
    initAnimations: function() {
        // Add entrance animations to elements
        var elements = document.querySelectorAll('.cyber-animate');
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('cyber-animate--visible');
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(function(el) {
            observer.observe(el);
        });
    },

    /**
     * Attach theme toggle button
     */
    attachThemeToggle: function() {
        var self = this;
        var toggle = document.querySelector('[data-theme-toggle]');

        if (toggle) {
            toggle.addEventListener('click', function() {
                self.toggle();
            });
        }
    },

    /**
     * Save theme to localStorage
     */
    saveTheme: function(theme) {
        try {
            localStorage.setItem('cybermood-theme', theme);
        } catch (e) {}
    },

    /**
     * Get saved theme from localStorage
     */
    getSavedTheme: function() {
        try {
            return localStorage.getItem('cybermood-theme');
        } catch (e) {
            return null;
        }
    },

    /**
     * Save language to localStorage
     */
    saveLang: function(lang) {
        try {
            localStorage.setItem('cybermood-lang', lang);
        } catch (e) {}
    },

    /**
     * Get saved language from localStorage
     */
    getSavedLang: function() {
        try {
            return localStorage.getItem('cybermood-lang') || 'en';
        } catch (e) {
            return 'en';
        }
    }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            CyberMoodTheme.init();
        });
    } else {
        CyberMoodTheme.init();
    }
}

return CyberMoodTheme;
```

## 🌍 Multi-Language System

### Translation File Structure

```json
// en.json (English)
{
    "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "cancel": "Cancel",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "close": "Close",
        "confirm": "Confirm"
    },
    "dashboard": {
        "title": "Dashboard",
        "welcome": "Welcome to {name}",
        "modules": "Modules",
        "active_modules": "Active Modules",
        "system_status": "System Status",
        "health_score": "Health Score"
    },
    "modules": {
        "network_modes": "Network Modes",
        "system_hub": "System Hub",
        "client_guardian": "Client Guardian",
        "bandwidth_manager": "Bandwidth Manager"
    }
}
```

```json
// fr.json (French)
{
    "common": {
        "loading": "Chargement...",
        "error": "Erreur",
        "success": "Succès",
        "cancel": "Annuler",
        "save": "Enregistrer",
        "delete": "Supprimer",
        "edit": "Modifier",
        "close": "Fermer",
        "confirm": "Confirmer"
    },
    "dashboard": {
        "title": "Tableau de bord",
        "welcome": "Bienvenue dans {name}",
        "modules": "Modules",
        "active_modules": "Modules actifs",
        "system_status": "État du système",
        "health_score": "Score de santé"
    },
    "modules": {
        "network_modes": "Modes réseau",
        "system_hub": "Hub système",
        "client_guardian": "Gardien client",
        "bandwidth_manager": "Gestionnaire de bande passante"
    }
}
```

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1)

**Tasks:**
1. Create `luci-theme-cybermood` package
2. Implement CSS variable system
3. Create core components (cards, buttons, forms)
4. Set up build/minification process

**Deliverables:**
- `/luci-theme-cybermood/htdocs/luci-static/resources/cybermood/`
- `cybermood.css` (main stylesheet)
- `cybermood.js` (theme controller)
- `variables.css` (design tokens)

### Phase 2: Component Library (Week 2)

**Tasks:**
1. Build all reusable components
2. Create component documentation
3. Implement dark/light/cyberpunk themes
4. Add animations and transitions

**Components:**
- Cards, Buttons, Forms, Tables
- Modals, Tooltips, Badges, Alerts
- Charts, Gauges, Progress bars
- Navigation elements

### Phase 3: Module Migration (Week 3)

**Tasks:**
1. Update `luci-app-secubox` to use global theme
2. Update `luci-app-system-hub`
3. Update `luci-app-network-modes`
4. Update remaining modules

**Migration Pattern:**
```javascript
// Before:
'require secubox/theme as Theme';

// After:
'require cybermood/theme as Theme';
```

### Phase 4: Multi-Language (Week 4)

**Tasks:**
1. Create translation files (en, fr, de, es)
2. Implement language switcher UI
3. Update all modules with translation keys
4. Add RTL support for Arabic

**Implementation:**
```javascript
// Usage in modules:
Theme.t('dashboard.welcome', { name: 'SecuBox' });
// Output: "Welcome to SecuBox" (en) or "Bienvenue dans SecuBox" (fr)
```

### Phase 5: Testing & Refinement (Week 5)

**Tasks:**
1. Cross-browser testing
2. Mobile responsiveness testing
3. Performance optimization
4. Accessibility audit (WCAG 2.1)
5. User acceptance testing

## 📝 Usage Examples

### Example 1: Dashboard with Global Theme

```javascript
'use strict';
'require view';
'require cybermood/theme as Theme';

return view.extend({
    render: function() {
        return E('div', { 'class': 'cyber-container' }, [
            // Apply theme CSS
            E('link', {
                'rel': 'stylesheet',
                'href': L.resource('cybermood/cybermood.css')
            }),

            // Theme toggle button
            E('button', {
                'data-theme-toggle': '',
                'class': 'cyber-btn cyber-btn--icon',
                'title': Theme.t('common.toggle_theme')
            }, '🌓'),

            // Language selector
            E('select', {
                'class': 'cyber-select',
                'change': function(ev) {
                    Theme.setLanguage(ev.target.value);
                }
            }, [
                E('option', { 'value': 'en' }, 'English'),
                E('option', { 'value': 'fr' }, 'Français'),
                E('option', { 'value': 'de' }, 'Deutsch'),
                E('option', { 'value': 'es' }, 'Español')
            ]),

            // Header
            E('h1', { 'class': 'cyber-title' },
                Theme.t('dashboard.title')),

            // Stats cards
            E('div', { 'class': 'cyber-grid cyber-grid--3' }, [
                Theme.createCard({
                    title: Theme.t('dashboard.active_modules'),
                    icon: '📦',
                    content: E('div', { 'class': 'cyber-stat' }, [
                        E('div', { 'class': 'cyber-stat-value' }, '12'),
                        E('div', { 'class': 'cyber-stat-label' },
                            Theme.t('modules.total'))
                    ]),
                    variant: 'success'
                }),

                Theme.createCard({
                    title: Theme.t('dashboard.health_score'),
                    icon: '❤️',
                    content: E('div', { 'class': 'cyber-stat' }, [
                        E('div', { 'class': 'cyber-stat-value' }, '98%'),
                        Theme.createBadge('Excellent', 'success')
                    ])
                }),

                Theme.createCard({
                    title: Theme.t('dashboard.system_status'),
                    icon: '⚡',
                    content: E('div', { 'class': 'cyber-stat' }, [
                        E('div', { 'class': 'cyber-stat-value' },
                            Theme.t('common.online')),
                        Theme.createBadge('Active', 'info')
                    ])
                })
            ])
        ]);
    }
});
```

### Example 2: Form with Theme

```javascript
renderForm: function() {
    return Theme.createCard({
        title: Theme.t('settings.configuration'),
        icon: '⚙️',
        content: E('form', { 'class': 'cyber-form' }, [
            E('div', { 'class': 'cyber-form-group' }, [
                E('label', { 'class': 'cyber-label' },
                    Theme.t('settings.hostname')),
                E('input', {
                    'type': 'text',
                    'class': 'cyber-input',
                    'placeholder': Theme.t('settings.enter_hostname')
                })
            ]),

            E('div', { 'class': 'cyber-form-group' }, [
                E('label', { 'class': 'cyber-label' },
                    Theme.t('settings.enable_feature')),
                E('label', { 'class': 'cyber-switch' }, [
                    E('input', { 'type': 'checkbox' }),
                    E('span', { 'class': 'cyber-switch-slider' })
                ])
            ])
        ]),
        footer: E('div', { 'class': 'cyber-form-actions' }, [
            Theme.createButton({
                label: Theme.t('common.cancel'),
                variant: 'secondary'
            }),
            Theme.createButton({
                label: Theme.t('common.save'),
                variant: 'primary'
            })
        ])
    });
}
```

## 🎯 Success Criteria

1. **Unified Look**: All modules use consistent design
2. **Performance**: < 50KB total CSS bundle (minified)
3. **Responsive**: Works on mobile (320px) to 4K (3840px)
4. **Accessible**: WCAG 2.1 AA compliant
5. **Multi-language**: 4+ languages supported
6. **Theme Switching**: < 100ms theme change
7. **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+

## 📊 Migration Checklist

### Per Module:

- [ ] Remove module-specific CSS files
- [ ] Import global `cybermood.css`
- [ ] Update components to use cyber-* classes
- [ ] Replace hardcoded strings with `Theme.t()` calls
- [ ] Test dark/light/cyberpunk themes
- [ ] Test all supported languages
- [ ] Verify responsive breakpoints
- [ ] Run accessibility audit
- [ ] Update documentation

### Global:

- [ ] Create luci-theme-cybermood package
- [ ] Implement all core components
- [ ] Create translation files
- [ ] Set up build process
- [ ] Create migration guide
- [ ] Update all 15 modules
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Production deployment

## 🔗 References

- **Design Inspiration**: SecuBox Website (https://secubox.cybermood.eu)
- **LuCI Theme System**: `/feeds/luci/themes/`
- **CSS Variables Spec**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **i18n Best Practices**: https://www.w3.org/International/

## 📞 Next Steps

1. **Review & Approve**: Get stakeholder approval on design direction
2. **Prototype**: Create visual mockups in Figma/similar
3. **Build**: Implement Phase 1 (Foundation)
4. **Test**: Internal QA on test router
5. **Deploy**: Roll out to production

---

**Status**: 📋 Planning
**Priority**: 🔥 High
**Effort**: 4-5 weeks
**Impact**: 🎯 All modules unified
