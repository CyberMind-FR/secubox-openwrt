# Codex Context: Global Theme Implementation

**FOR CODEX CODING AGENT**

## 🎯 When Asked to Work on Theme/UI

If the user asks you to:
- “Create a global theme”
- “Unify the design”
- “Implement CyberMood theme”
- “Add multi-language support”
- “Make it look like the website”

**IMPORTANT**: Read `DOCS/GLOBAL_THEME_SYSTEM.md` first!

## 🎨 Quick Design Reference

### Color Palette

```css
/* Use these variables in all new code */
Primary: var(--cyber-accent-primary)      /* #667eea */
Secondary: var(--cyber-accent-secondary)  /* #06b6d4 */
Background: var(--cyber-bg-primary)       /* #0a0e27 */
Surface: var(--cyber-surface)             /* #252b4a */
Text: var(--cyber-text-primary)           /* #e2e8f0 */
Success: var(--cyber-success)             /* #10b981 */
Danger: var(--cyber-danger)               /* #ef4444 */
```

### Typography

```css
Display/Headers: var(--cyber-font-display)  /* Orbitron */
Body Text: var(--cyber-font-body)           /* Inter */
Code/Metrics: var(--cyber-font-mono)        /* JetBrains Mono */
```

### Component Classes

```html
<!-- Cards -->
<div class="cyber-card">
  <div class="cyber-card-header">
    <h3 class="cyber-card-title">Title</h3>
  </div>
  <div class="cyber-card-body">Content</div>
</div>

<!-- Buttons -->
<button class="cyber-btn cyber-btn--primary">Primary</button>
<button class="cyber-btn cyber-btn--secondary">Secondary</button>

<!-- Badges -->
<span class="cyber-badge cyber-badge--success">Active</span>

<!-- Forms -->
<input type="text" class="cyber-input" />
<select class="cyber-select"></select>
```

## 🌍 Multi-Language Support

### Usage Pattern

```javascript
'require cybermood/theme as Theme';

// Initialize theme
Theme.init();

// Set language
Theme.setLanguage('fr');  // en, fr, de, es

// Translate strings
var title = Theme.t('dashboard.title');
var welcome = Theme.t('dashboard.welcome', { name: 'SecuBox' });
```

### Translation Keys Structure

```
common.*        - Common UI strings (loading, error, success, etc.)
dashboard.*     - Dashboard-specific strings
modules.*       - Module names
settings.*      - Settings page strings
[module_name].* - Module-specific strings
```

## 🏗️ Creating New Components

### Always Use Theme System

```javascript
// ❌ DON'T: Create components manually
E('div', { style: 'background: #667eea; padding: 16px;' }, 'Content');

// ✅ DO: Use theme components
Theme.createCard({
  title: Theme.t('card.title'),
  icon: '🎯',
  content: E('div', {}, 'Content'),
  variant: 'primary'
});
```

### Component Template

```javascript
// Create a new themed component
renderMyComponent: function() {
  return E('div', { 'class': 'cyber-container' }, [
    // Always load theme CSS first
    E('link', {
      'rel': 'stylesheet',
      'href': L.resource('cybermood/cybermood.css')
    }),

    // Use theme components
    Theme.createCard({
      title: Theme.t('component.title'),
      icon: '⚡',
      content: this.renderContent(),
      variant: 'success'
    })
  ]);
}
```

## 📋 Implementation Prompts

### Prompt 1: Create Global Theme Package

```
Create the luci-theme-cybermood package following the structure in
DOCS/GLOBAL_THEME_SYSTEM.md. Include:

1. Package structure with Makefile
2. CSS variable system (variables.css)
3. Core components (cards.css, buttons.css, forms.css)
4. Theme controller JavaScript (cybermood.js)
5. Default translations (en.json, fr.json)

Use the ready-to-use templates from the documentation.
Apply CyberMood design aesthetic (metallic, glass effects, neon accents).
Ensure dark theme as default with light and cyberpunk variants.
```

### Prompt 2: Migrate Module to Global Theme

```
Migrate luci-app-[MODULE-NAME] to use the global CyberMood theme:

1. Remove module-specific CSS files (keep only module-unique styles)
2. Import cybermood.css in all views
3. Update all components to use cyber-* classes
4. Replace E() calls with Theme.create*() methods where appropriate
5. Replace hardcoded strings with Theme.t() translations
6. Test dark/light theme switching
7. Verify responsive design
```

### Prompt 3: Add Multi-Language Support

```
Add multi-language support to [MODULE-NAME]:

1. Extract all user-facing strings to translation keys
2. Create translation files for en, fr, de, es
3. Use Theme.t() for all strings
4. Add language selector to settings
5. Test language switching
```

### Prompt 4: Create New Themed Component

```
Create a new [COMPONENT-TYPE] component following CyberMood design:

1. Use CSS variables for all colors (var(--cyber-*))
2. Apply glass effect with backdrop-filter
3. Add hover animations (transform, glow effects)
4. Support dark/light themes
5. Make it responsive
6. Add to cybermood/components/
```

### Prompt 5: Implement Responsive Dashboard

```
Create a responsive dashboard layout using CyberMood theme:

1. Use Theme.createCard for each section
2. Add quick stats, charts placeholders, alerts, and actions
3. Support breakpoints at 1440px, 1024px, 768px, 480px
4. Use CSS grid + flex combos from GLOBAL_THEME_SYSTEM.md
5. Ensure all copy uses Theme.t()
```

> **Always align new work with `cybermood/theme.js`, `cybermood.css`, and the prompts above.**
