# Systeme de Theme Global SecuBox

> **Languages:** [English](../DOCS/GLOBAL_THEME_SYSTEM.md) | Francais | [中文](../DOCS-zh/GLOBAL_THEME_SYSTEM.md)

**Version:** 1.0.0
**Date:** 2025-12-28
**Statut:** Planification & Specification

## Vision

Creer un systeme de design "CyberMood" unifie, dynamique, responsive et moderne pour tous les modules SecuBox avec support multilingue, inspire de l'esthetique du site marketing SecuBox.

## Langage de Design CyberMood

### Principes Esthetiques Fondamentaux

**"CyberMood"** = Cyberpunk rencontre Minimalisme Moderne
- **Metallique & Verre**: Surfaces reflectives, effets glassmorphism
- **Accents Neon**: Bleus electriques, violets, cyans avec effets de lueur
- **Base Sombre**: Fonds profonds avec degrades subtils
- **Mouvement Dynamique**: Animations fluides, effets de particules, degrades fluides
- **Dense en Information**: Mises en page de tableau de bord modernes avec visualisation de donnees
- **Flux Responsive**: S'adapte parfaitement du mobile au desktop

### Identite Visuelle

```
Palette Principale:
  Base:      #0a0e27 (Bleu Espace Profond)
  Surface:   #151932 (Ardoise Sombre)
  Accent:    #667eea (Bleu Electrique)
  Secondaire: #764ba2 (Violet Cyber)
  Succes:    #10b981 (Emeraude)
  Avertissement: #f59e0b (Ambre)
  Danger:    #ef4444 (Rouge)
  Info:      #06b6d4 (Cyan)

Degrades Metalliques:
  Acier:     linear-gradient(135deg, #434343 0%, #000000 100%)
  Chrome:    linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)
  Or:        linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)
  Cyber:     linear-gradient(135deg, #667eea 0%, #764ba2 100%)

Effets Verre:
  Flou:      backdrop-filter: blur(10px)
  Opacite:   rgba(255, 255, 255, 0.05)
  Bordure:   1px solid rgba(255, 255, 255, 0.1)
  Ombre:     0 8px 32px rgba(0, 0, 0, 0.37)

Typographie:
  Display:   'Orbitron' (en-tetes cyberpunk)
  Corps:     'Inter' (lisibilite claire)
  Mono:      'JetBrains Mono' (code & metriques)

Animation:
  Vitesse:   0.3s ease-in-out (standard)
  Rebond:    cubic-bezier(0.68, -0.55, 0.265, 1.55)
  Fluide:    cubic-bezier(0.4, 0, 0.2, 1)
```

## Analyse de l'Etat Actuel

### Themes Existants

```
luci-app-secubox/htdocs/luci-static/resources/secubox/
├── secubox.css         # Styles de base SecuBox (7.0KB)
├── dashboard.css       # Specifique tableau de bord (9.5KB)
├── common.css          # Utilitaires partages (8.4KB)
├── modules.css         # Page modules (7.5KB)
├── alerts.css          # Page alertes (5.1KB)
├── monitoring.css      # Page surveillance (3.0KB)
├── help.css            # Systeme d'aide (7.0KB)
└── theme.js            # JavaScript Theme (2.0KB)

luci-app-system-hub/htdocs/luci-static/resources/system-hub/
├── dashboard.css       # Tableau de bord System Hub (18.2KB)
├── common.css          # Commun System Hub (8.4KB)
└── theme.js            # Theme System Hub (similaire a secubox)

luci-app-network-modes/htdocs/luci-static/resources/network-modes/
├── dashboard.css       # Tableau de bord Network Modes (18.2KB)
└── common.css          # Commun Network Modes (8.4KB)
```

### Problemes de l'Approche Actuelle

1. **Fragmentation**: Chaque module a ses propres fichiers CSS
2. **Duplication**: Styles communs repetes entre modules
3. **Incoherence**: Valeurs de couleurs, espacements, etc. legerement differents
4. **Maintenance**: Les changements necessitent la mise a jour de plusieurs fichiers
5. **Taille du Bundle**: CSS duplique charge par module (~50KB total)
6. **Pas de Theme Centralise**: Impossible de changer les themes globalement

## Architecture Proposee

### Structure du Theme Global

```
luci-theme-cybermood/                    # NOUVEAU: Package theme global
├── Makefile
├── README.md
└── htdocs/luci-static/resources/
    └── cybermood/
        ├── core/
        │   ├── variables.css            # Proprietes personnalisees CSS
        │   ├── reset.css                # Normalisation/reset
        │   ├── typography.css           # Definitions de polices
        │   ├── animations.css           # Keyframes & transitions
        │   └── utilities.css            # Classes utilitaires
        ├── components/
        │   ├── buttons.css              # Styles de boutons
        │   ├── cards.css                # Composants carte
        │   ├── forms.css                # Elements de formulaire
        │   ├── tables.css               # Tableaux de donnees
        │   ├── modals.css               # Dialogues modaux
        │   ├── tooltips.css             # Infobulles
        │   ├── badges.css               # Badges de statut
        │   ├── alerts.css               # Messages d'alerte
        │   ├── charts.css               # Conteneurs de graphiques
        │   └── navigation.css           # Elements de navigation
        ├── layouts/
        │   ├── dashboard.css            # Mise en page tableau de bord
        │   ├── grid.css                 # Systeme de grille
        │   └── responsive.css           # Points de rupture
        ├── themes/
        │   ├── dark.css                 # Theme sombre (defaut)
        │   ├── light.css                # Theme clair
        │   └── cyberpunk.css            # Cyber haut contraste
        ├── i18n/
        │   ├── en.json                  # Chaines anglaises
        │   ├── fr.json                  # Chaines francaises
        │   ├── de.json                  # Chaines allemandes
        │   └── es.json                  # Chaines espagnoles
        ├── cybermood.css                # Bundle principal (importe tout)
        ├── cybermood.min.css            # Version minifiee
        └── cybermood.js                 # Controleur de theme
```

### Integration des Modules

```javascript
// Dans le fichier de vue de chaque module
'use strict';
'require view';
'require cybermood/theme as Theme';

return view.extend({
    render: function() {
        // Appliquer le theme
        Theme.apply('dark');

        // Utiliser les composants du theme
        return E('div', { 'class': 'cyber-container' }, [
            Theme.createCard({
                title: _('Titre du Module'),
                icon: '🎯',
                content: this.renderContent()
            })
        ]);
    }
});
```

## Modeles Prets a l'Emploi

### 1. Variables CSS (variables.css)

```css
/**
 * Systeme de Design CyberMood - Variables CSS
 * Version: 1.0.0
 */

:root {
    /* ========================================
       Couleurs - Palette de Base
       ======================================== */

    /* Theme Sombre (Defaut) */
    --cyber-bg-primary: #0a0e27;
    --cyber-bg-secondary: #151932;
    --cyber-bg-tertiary: #1e2139;
    --cyber-surface: #252b4a;
    --cyber-surface-light: #2d3454;

    /* Couleurs de Texte */
    --cyber-text-primary: #e2e8f0;
    --cyber-text-secondary: #94a3b8;
    --cyber-text-muted: #64748b;
    --cyber-text-inverse: #0a0e27;

    /* Couleurs d'Accent */
    --cyber-accent-primary: #667eea;
    --cyber-accent-primary-end: #764ba2;
    --cyber-accent-secondary: #06b6d4;
    --cyber-accent-tertiary: #8b5cf6;

    /* Couleurs Semantiques */
    --cyber-success: #10b981;
    --cyber-success-light: #34d399;
    --cyber-warning: #f59e0b;
    --cyber-warning-light: #fbbf24;
    --cyber-danger: #ef4444;
    --cyber-danger-light: #f87171;
    --cyber-info: #06b6d4;
    --cyber-info-light: #22d3ee;

    /* Degrades Metalliques */
    --cyber-gradient-steel: linear-gradient(135deg, #434343 0%, #000000 100%);
    --cyber-gradient-chrome: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%);
    --cyber-gradient-cyber: linear-gradient(135deg, var(--cyber-accent-primary) 0%, var(--cyber-accent-primary-end) 100%);
    --cyber-gradient-success: linear-gradient(135deg, var(--cyber-success) 0%, var(--cyber-success-light) 100%);
    --cyber-gradient-danger: linear-gradient(135deg, var(--cyber-danger) 0%, var(--cyber-danger-light) 100%);

    /* Effets Verre */
    --cyber-glass-bg: rgba(255, 255, 255, 0.05);
    --cyber-glass-border: rgba(255, 255, 255, 0.1);
    --cyber-glass-blur: 10px;
    --cyber-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);

    /* ========================================
       Typographie
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
       Espacement
       ======================================== */

    --cyber-space-xs: 0.25rem;   /* 4px */
    --cyber-space-sm: 0.5rem;    /* 8px */
    --cyber-space-md: 1rem;      /* 16px */
    --cyber-space-lg: 1.5rem;    /* 24px */
    --cyber-space-xl: 2rem;      /* 32px */
    --cyber-space-2xl: 3rem;     /* 48px */
    --cyber-space-3xl: 4rem;     /* 64px */

    /* ========================================
       Rayon de Bordure
       ======================================== */

    --cyber-radius-sm: 0.25rem;  /* 4px */
    --cyber-radius-md: 0.5rem;   /* 8px */
    --cyber-radius-lg: 0.75rem;  /* 12px */
    --cyber-radius-xl: 1rem;     /* 16px */
    --cyber-radius-full: 9999px;

    /* ========================================
       Ombres
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
       Couches Z-Index
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
   Surcharge Theme Clair
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
   Theme Cyberpunk (Haut Contraste)
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

### 2. Modele de Composant Carte (cards.css)

```css
/**
 * Composant Carte CyberMood
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

/* Variantes de Carte */
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

### 3. Controleur JavaScript du Theme (cybermood.js)

```javascript
/**
 * Controleur de Theme CyberMood
 * Version: 1.0.0
 */

'use strict';

var CyberMoodTheme = {
    version: '1.0.0',
    currentTheme: 'dark',
    currentLang: 'en',
    translations: {},

    /**
     * Initialiser le systeme de theme
     */
    init: function() {
        console.log('🎨 Systeme de Theme CyberMood v' + this.version);

        // Charger la preference de theme sauvegardee
        var savedTheme = this.getSavedTheme();
        if (savedTheme) {
            this.apply(savedTheme);
        }

        // Charger la langue sauvegardee
        var savedLang = this.getSavedLang();
        if (savedLang) {
            this.setLanguage(savedLang);
        }

        // Ajouter l'ecouteur de bascule de theme
        this.attachThemeToggle();

        // Initialiser les animations
        this.initAnimations();

        return this;
    },

    /**
     * Appliquer le theme
     * @param {string} theme - Nom du theme: 'dark', 'light', 'cyberpunk'
     */
    apply: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);

        // Declencher l'evenement de changement de theme
        var event = new CustomEvent('themechange', { detail: { theme: theme } });
        document.dispatchEvent(event);

        console.log('✅ Theme applique:', theme);
    },

    /**
     * Basculer entre les themes sombre et clair
     */
    toggle: function() {
        var newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.apply(newTheme);
    },

    /**
     * Creer un composant carte theme
     * @param {object} options - Options de la carte
     * @returns {Element} Element carte
     */
    createCard: function(options) {
        var opts = options || {};
        var variant = opts.variant || '';

        var card = E('div', {
            'class': 'cyber-card' + (variant ? ' cyber-card--' + variant : '')
        });

        // En-tete
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

        // Corps
        if (opts.content) {
            var body = E('div', { 'class': 'cyber-card-body' }, [opts.content]);
            card.appendChild(body);
        }

        // Pied de page
        if (opts.footer) {
            var footer = E('div', { 'class': 'cyber-card-footer' }, [opts.footer]);
            card.appendChild(footer);
        }

        return card;
    },

    /**
     * Creer un bouton avec theme
     * @param {object} options - Options du bouton
     * @returns {Element} Element bouton
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
     * Creer un composant badge
     * @param {string} text - Texte du badge
     * @param {string} variant - Variante du badge
     * @returns {Element} Element badge
     */
    createBadge: function(text, variant) {
        return E('span', {
            'class': 'cyber-badge cyber-badge--' + (variant || 'default')
        }, text);
    },

    /**
     * Definir la langue
     * @param {string} lang - Code de langue (en, fr, de, es)
     */
    setLanguage: function(lang) {
        var self = this;

        // Charger le fichier de traduction
        return fetch(L.resource('cybermood/i18n/' + lang + '.json'))
            .then(function(response) {
                return response.json();
            })
            .then(function(translations) {
                self.translations = translations;
                self.currentLang = lang;
                self.saveLang(lang);

                // Declencher l'evenement de changement de langue
                var event = new CustomEvent('langchange', { detail: { lang: lang } });
                document.dispatchEvent(event);

                console.log('✅ Langue definie:', lang);
            })
            .catch(function(error) {
                console.error('❌ Echec du chargement de la langue:', lang, error);
            });
    },

    /**
     * Traduire une chaine
     * @param {string} key - Cle de traduction
     * @param {object} params - Parametres pour l'interpolation
     * @returns {string} Chaine traduite
     */
    t: function(key, params) {
        var translation = this.translations[key] || key;

        // Interpolation simple des parametres
        if (params) {
            Object.keys(params).forEach(function(param) {
                translation = translation.replace('{' + param + '}', params[param]);
            });
        }

        return translation;
    },

    /**
     * Initialiser les animations
     */
    initAnimations: function() {
        // Ajouter des animations d'entree aux elements
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
     * Attacher le bouton de bascule de theme
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
     * Sauvegarder le theme dans localStorage
     */
    saveTheme: function(theme) {
        try {
            localStorage.setItem('cybermood-theme', theme);
        } catch (e) {}
    },

    /**
     * Recuperer le theme sauvegarde depuis localStorage
     */
    getSavedTheme: function() {
        try {
            return localStorage.getItem('cybermood-theme');
        } catch (e) {
            return null;
        }
    },

    /**
     * Sauvegarder la langue dans localStorage
     */
    saveLang: function(lang) {
        try {
            localStorage.setItem('cybermood-lang', lang);
        } catch (e) {}
    },

    /**
     * Recuperer la langue sauvegardee depuis localStorage
     */
    getSavedLang: function() {
        try {
            return localStorage.getItem('cybermood-lang') || 'en';
        } catch (e) {
            return 'en';
        }
    }
};

// Auto-initialisation au chargement
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

## Systeme Multilingue

### Structure des Fichiers de Traduction

```json
// en.json (Anglais)
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
// fr.json (Francais)
{
    "common": {
        "loading": "Chargement...",
        "error": "Erreur",
        "success": "Succes",
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
        "system_status": "Etat du systeme",
        "health_score": "Score de sante"
    },
    "modules": {
        "network_modes": "Modes reseau",
        "system_hub": "Hub systeme",
        "client_guardian": "Gardien client",
        "bandwidth_manager": "Gestionnaire de bande passante"
    }
}
```

## Plan d'Implementation

### Phase 1: Fondation (Semaine 1)

**Taches:**
1. Creer le package `luci-theme-cybermood`
2. Implementer le systeme de variables CSS
3. Creer les composants de base (cartes, boutons, formulaires)
4. Configurer le processus de build/minification

**Livrables:**
- `/luci-theme-cybermood/htdocs/luci-static/resources/cybermood/`
- `cybermood.css` (feuille de style principale)
- `cybermood.js` (controleur de theme)
- `variables.css` (tokens de design)

### Phase 2: Bibliotheque de Composants (Semaine 2)

**Taches:**
1. Construire tous les composants reutilisables
2. Creer la documentation des composants
3. Implementer les themes sombre/clair/cyberpunk
4. Ajouter les animations et transitions

**Composants:**
- Cartes, Boutons, Formulaires, Tableaux
- Modaux, Infobulles, Badges, Alertes
- Graphiques, Jauges, Barres de progression
- Elements de navigation

### Phase 3: Migration des Modules (Semaine 3)

**Taches:**
1. Mettre a jour `luci-app-secubox` pour utiliser le theme global
2. Mettre a jour `luci-app-system-hub`
3. Mettre a jour `luci-app-network-modes`
4. Mettre a jour les modules restants

**Motif de Migration:**
```javascript
// Avant:
'require secubox/theme as Theme';

// Apres:
'require cybermood/theme as Theme';
```

### Phase 4: Multilingue (Semaine 4)

**Taches:**
1. Creer les fichiers de traduction (en, fr, de, es)
2. Implementer l'interface de selection de langue
3. Mettre a jour tous les modules avec les cles de traduction
4. Ajouter le support RTL pour l'arabe

**Implementation:**
```javascript
// Utilisation dans les modules:
Theme.t('dashboard.welcome', { name: 'SecuBox' });
// Sortie: "Welcome to SecuBox" (en) ou "Bienvenue dans SecuBox" (fr)
```

### Phase 5: Tests & Affinage (Semaine 5)

**Taches:**
1. Tests multi-navigateurs
2. Tests de responsivite mobile
3. Optimisation des performances
4. Audit d'accessibilite (WCAG 2.1)
5. Tests d'acceptation utilisateur

## Exemples d'Utilisation

### Exemple 1: Tableau de Bord avec Theme Global

```javascript
'use strict';
'require view';
'require cybermood/theme as Theme';

return view.extend({
    render: function() {
        return E('div', { 'class': 'cyber-container' }, [
            // Appliquer le CSS du theme
            E('link', {
                'rel': 'stylesheet',
                'href': L.resource('cybermood/cybermood.css')
            }),

            // Bouton de bascule de theme
            E('button', {
                'data-theme-toggle': '',
                'class': 'cyber-btn cyber-btn--icon',
                'title': Theme.t('common.toggle_theme')
            }, '🌓'),

            // Selecteur de langue
            E('select', {
                'class': 'cyber-select',
                'change': function(ev) {
                    Theme.setLanguage(ev.target.value);
                }
            }, [
                E('option', { 'value': 'en' }, 'English'),
                E('option', { 'value': 'fr' }, 'Francais'),
                E('option', { 'value': 'de' }, 'Deutsch'),
                E('option', { 'value': 'es' }, 'Espanol')
            ]),

            // En-tete
            E('h1', { 'class': 'cyber-title' },
                Theme.t('dashboard.title')),

            // Cartes de statistiques
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
                        Theme.createBadge('Actif', 'info')
                    ])
                })
            ])
        ]);
    }
});
```

### Exemple 2: Formulaire avec Theme

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

## Criteres de Succes

1. **Apparence Unifiee**: Tous les modules utilisent un design coherent
2. **Performance**: < 50KB bundle CSS total (minifie)
3. **Responsive**: Fonctionne du mobile (320px) au 4K (3840px)
4. **Accessible**: Conforme WCAG 2.1 AA
5. **Multilingue**: 4+ langues supportees
6. **Changement de Theme**: < 100ms pour le changement de theme
7. **Support Navigateurs**: Chrome 90+, Firefox 88+, Safari 14+

## Liste de Controle de Migration

### Par Module:

- [ ] Supprimer les fichiers CSS specifiques au module
- [ ] Importer le `cybermood.css` global
- [ ] Mettre a jour les composants pour utiliser les classes cyber-*
- [ ] Remplacer les chaines codees en dur par des appels `Theme.t()`
- [ ] Tester les themes sombre/clair/cyberpunk
- [ ] Tester toutes les langues supportees
- [ ] Verifier les points de rupture responsive
- [ ] Executer l'audit d'accessibilite
- [ ] Mettre a jour la documentation

### Global:

- [ ] Creer le package luci-theme-cybermood
- [ ] Implementer tous les composants de base
- [ ] Creer les fichiers de traduction
- [ ] Configurer le processus de build
- [ ] Creer le guide de migration
- [ ] Mettre a jour les 15 modules
- [ ] Tests de performance
- [ ] Tests d'acceptation utilisateur
- [ ] Deploiement en production

## References

- **Inspiration Design**: Site Web SecuBox (https://secubox.cybermood.eu)
- **Systeme de Theme LuCI**: `/feeds/luci/themes/`
- **Spec Variables CSS**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **Bonnes Pratiques i18n**: https://www.w3.org/International/

## Prochaines Etapes

1. **Revue & Approbation**: Obtenir l'approbation des parties prenantes sur la direction du design
2. **Prototype**: Creer des maquettes visuelles dans Figma/similaire
3. **Construction**: Implementer la Phase 1 (Fondation)
4. **Test**: QA interne sur routeur de test
5. **Deploiement**: Deployer en production

---

**Statut**: Planification
**Priorite**: Haute
**Effort**: 4-5 semaines
**Impact**: Tous les modules unifies
