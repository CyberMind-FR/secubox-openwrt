# luci-theme-secubox Usage Guide

## Quick Start

### 1. Installation

Install the theme package alongside your SecuBox modules:

```bash
opkg update
opkg install luci-theme-secubox
```

### 2. Basic Usage in a LuCI Module

```javascript
'use strict';
'require view';
'require secubox-theme/theme as Theme';

return view.extend({
    load: function() {
        // Initialize theme system
        return Theme.init({
            theme: 'dark',      // 'dark', 'light', or 'cyberpunk'
            language: 'en'      // 'en', 'fr', 'de', or 'es'
        });
    },

    render: function(data) {
        return E('div', { 'class': 'cyber-container' }, [
            // Always include the theme CSS
            E('link', {
                'rel': 'stylesheet',
                'href': L.resource('secubox-theme/secubox-theme.css')
            }),

            // Create a card using the theme
            Theme.createCard({
                title: Theme.t('dashboard.title'),
                icon: '🚀',
                content: E('p', {}, Theme.t('dashboard.welcome', { name: 'SecuBox' }))
            })
        ]);
    }
});
```

## Theme Controller API

### Initialization

```javascript
// Initialize with defaults (dark theme, English)
Theme.init();

// Initialize with custom options
Theme.init({
    theme: 'cyberpunk',
    language: 'fr'
});
```

### Theme Switching

```javascript
// Apply a theme
Theme.apply('dark');      // Dark mode (default)
Theme.apply('light');     // Light mode
Theme.apply('cyberpunk'); // Cyberpunk mode
```

### Translations

```javascript
// Simple translation
var title = Theme.t('dashboard.title');

// Translation with parameters
var welcome = Theme.t('dashboard.welcome', { name: 'John' });
// Output: "Welcome back, John"

// Change language
Theme.setLanguage('fr').then(function() {
    console.log(Theme.t('dashboard.title'));
    // Output: "Centre de contrôle SecuBox"
});
```

### UI Components

#### Create Card

```javascript
Theme.createCard({
    title: 'System Status',
    icon: '⚡',
    content: E('div', {}, 'Card content here'),
    badge: Theme.createBadge('Active', 'success'),
    hideHeader: false  // Optional: hide header
});
```

#### Create Button

```javascript
Theme.createButton({
    label: 'Save Changes',
    icon: '💾',
    variant: 'primary',  // 'primary', 'secondary', 'danger', 'ghost'
    attrs: {
        'click': function() { /* handler */ }
    }
});
```

#### Create Badge

```javascript
Theme.createBadge('Online', 'success');   // Green badge
Theme.createBadge('Warning', 'warning');  // Yellow badge
Theme.createBadge('Error', 'danger');     // Red badge
```

## CSS Classes

### Cards

```html
<div class="cyber-card">
    <div class="cyber-card-header">
        <div class="cyber-card-title">Title</div>
    </div>
    <div class="cyber-card-body">Content</div>
</div>

<!-- Card variants -->
<div class="cyber-card cyber-card--glass">Glass effect card</div>
<div class="cyber-card cyber-card--success">Success card</div>
<div class="cyber-card cyber-card--warning">Warning card</div>
<div class="cyber-card cyber-card--danger">Danger card</div>
<div class="cyber-card cyber-card--primary">Primary accent card</div>
```

### Buttons

```html
<button class="cyber-btn">Primary Button</button>
<button class="cyber-btn cyber-btn--secondary">Secondary</button>
<button class="cyber-btn cyber-btn--danger">Danger</button>
<button class="cyber-btn cyber-btn--ghost">Ghost</button>
```

### Badges

```html
<span class="cyber-badge">Default</span>
<span class="cyber-badge cyber-badge--success">Success</span>
<span class="cyber-badge cyber-badge--warning">Warning</span>
<span class="cyber-badge cyber-badge--danger">Danger</span>
```

## CSS Variables

All colors, spacing, and effects are available as CSS variables:

```css
/* Use in your custom CSS */
.my-component {
    background: var(--cyber-bg-primary);
    color: var(--cyber-text-primary);
    border: var(--cyber-border);
    border-radius: var(--cyber-radius-md);
    padding: var(--cyber-space-lg);
    font-family: var(--cyber-font-body);
    transition: all var(--cyber-transition);
}

.my-component:hover {
    box-shadow: var(--cyber-shadow);
    background: var(--cyber-glass-bg);
    backdrop-filter: blur(var(--cyber-glass-blur));
}
```

### Available Variables

**Colors:**
- `--cyber-bg-primary`, `--cyber-bg-secondary`, `--cyber-bg-tertiary`
- `--cyber-text-primary`, `--cyber-text-secondary`, `--cyber-text-muted`
- `--cyber-accent-primary`, `--cyber-accent-secondary`
- `--cyber-success`, `--cyber-warning`, `--cyber-danger`, `--cyber-info`

**Typography:**
- `--cyber-font-display` (Orbitron)
- `--cyber-font-body` (Inter)
- `--cyber-font-mono` (JetBrains Mono)
- `--cyber-text-xs` through `--cyber-text-4xl`

**Spacing:**
- `--cyber-space-xs` through `--cyber-space-2xl`

**Effects:**
- `--cyber-shadow`, `--cyber-shadow-soft`
- `--cyber-glass-bg`, `--cyber-glass-blur`, `--cyber-glass-shadow`
- `--cyber-radius-xs` through `--cyber-radius-lg`
- `--cyber-transition`, `--cyber-transition-fast`, `--cyber-transition-bounce`

**Gradients:**
- `--cyber-gradient-primary`, `--cyber-gradient-cyber`
- `--cyber-gradient-steel`, `--cyber-gradient-chrome`

## Complete Example

```javascript
'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require rpc';

var callStatus = rpc.declare({
    object: 'luci.mymodule',
    method: 'status',
    expect: {}
});

return view.extend({
    load: function() {
        return Promise.all([
            Theme.init({ theme: 'dark', language: 'en' }),
            callStatus()
        ]);
    },

    render: function(data) {
        var status = data[1] || {};

        return E('div', { 'class': 'cyber-container' }, [
            E('link', {
                'rel': 'stylesheet',
                'href': L.resource('secubox-theme/secubox-theme.css')
            }),

            E('div', { 'class': 'cyber-grid cyber-grid--3' }, [
                Theme.createCard({
                    title: Theme.t('dashboard.system_health'),
                    icon: '💚',
                    content: E('div', {}, [
                        E('p', {}, Theme.t('common.status') + ': '),
                        Theme.createBadge(
                            status.running ? Theme.t('common.active') : Theme.t('common.inactive'),
                            status.running ? 'success' : 'danger'
                        )
                    ])
                }),

                Theme.createCard({
                    title: Theme.t('dashboard.quick_actions'),
                    icon: '⚡',
                    content: E('div', { 'style': 'display: flex; gap: 0.5rem;' }, [
                        Theme.createButton({
                            label: Theme.t('common.apply'),
                            variant: 'primary',
                            attrs: { 'click': this.handleApply.bind(this) }
                        }),
                        Theme.createButton({
                            label: Theme.t('common.reset'),
                            variant: 'secondary',
                            attrs: { 'click': this.handleReset.bind(this) }
                        })
                    ])
                })
            ])
        ]);
    },

    handleApply: function() {
        console.log('Apply clicked');
    },

    handleReset: function() {
        console.log('Reset clicked');
    }
});
```

## Translation Keys

All available translation keys (en, fr, de, es):

- `common.*` - Common UI strings (loading, error, success, save, cancel, etc.)
- `dashboard.*` - Dashboard-specific strings
- `modules.*` - Module management strings
- `settings.*` - Settings page strings
- `errors.*` - Error messages

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Main CSS bundle: ~15KB uncompressed
- Minified version: ~8KB
- All translations: ~2KB total
- Theme JS controller: ~3KB

## See Also

- [DOCS/GLOBAL_THEME_SYSTEM.md](../../DOCS/GLOBAL_THEME_SYSTEM.md) - Complete design system documentation
- [.claude/THEME_CONTEXT.md](../../.claude/THEME_CONTEXT.md) - Quick reference for developers
