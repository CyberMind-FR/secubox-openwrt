# Claude Context: Global Theme Implementation

**FOR CLAUDE CODE AI ASSISTANT**

## 🎯 When Asked to Work on Theme/UI

If the user asks you to:
- "Create a global theme"
- "Unify the design"
- "Implement CyberMood theme"
- "Add multi-language support"
- "Make it look like the website"

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

Reference GLOBAL_THEME_SYSTEM.md for component usage examples.
```

### Prompt 3: Add Multi-Language Support

```
Add multi-language support to [MODULE-NAME]:

1. Extract all user-facing strings to translation keys
2. Create translation files for en, fr, de, es
3. Use Theme.t() for all strings
4. Add language selector to settings
5. Test language switching

Follow the translation structure in GLOBAL_THEME_SYSTEM.md.
Use meaningful translation keys (e.g., 'dashboard.active_modules').
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

Style should match: metallic gradients, neon accents, smooth animations.
Reference existing components in GLOBAL_THEME_SYSTEM.md.
```

### Prompt 5: Implement Responsive Dashboard

```
Create a responsive dashboard layout using CyberMood theme:

1. Use cyber-grid for layout (auto-responsive)
2. Create cards with Theme.createCard()
3. Add stats with animated counters
4. Include theme toggle button
5. Add language selector
6. Support mobile (320px) to desktop (1920px+)

Follow the dashboard example in GLOBAL_THEME_SYSTEM.md.
Use metallic gradients for stats, glass effects for cards.
```

## ⚠️ Critical Rules

1. **NEVER hardcode colors**: Always use CSS variables
   ```css
   /* ❌ BAD */
   background: #667eea;

   /* ✅ GOOD */
   background: var(--cyber-accent-primary);
   ```

2. **ALWAYS support dark/light themes**: Test both
   ```css
   /* Automatically handled by data-theme attribute */
   [data-theme="light"] { /* overrides */ }
   ```

3. **ALWAYS use translation keys**: No hardcoded strings
   ```javascript
   /* ❌ BAD */
   E('h1', {}, 'Dashboard');

   /* ✅ GOOD */
   E('h1', {}, Theme.t('dashboard.title'));
   ```

4. **ALWAYS load theme CSS**: First element in render
   ```javascript
   E('link', { 'rel': 'stylesheet', 'href': L.resource('cybermood/cybermood.css') })
   ```

5. **PREFER theme components**: Over manual E() creation
   ```javascript
   /* ❌ ACCEPTABLE but not preferred */
   E('div', { 'class': 'card' }, content);

   /* ✅ PREFERRED */
   Theme.createCard({ content: content });
   ```

## 🔍 Before You Start

1. Read `DOCS/GLOBAL_THEME_SYSTEM.md`
2. Check if `luci-theme-cybermood` package exists
3. Review existing themed modules for patterns
4. Test on both dark and light themes
5. Verify responsive on mobile/desktop

## 📚 Related Documentation

- **Main Guide**: `DOCS/GLOBAL_THEME_SYSTEM.md`
- **Development Guidelines**: `DOCS/DEVELOPMENT-GUIDELINES.md`
- **Quick Start**: `DOCS/QUICK-START.md`
- **Website Reference**: `http://192.168.8.191/luci-static/secubox/` (deployed demo)

## 🎨 Visual References

Look at these for design inspiration:
- SecuBox website: Modern, metallic, glass effects
- System Hub module: Dashboard layout, stats cards
- Network Modes: Header design, mode badges
- Existing help.css: Button styles, animations

## ✅ Quality Checklist

Before marking theme work complete:

- [ ] Uses CSS variables (no hardcoded colors)
- [ ] Supports dark/light/cyberpunk themes
- [ ] All strings use Theme.t() translations
- [ ] Components use cyber-* classes
- [ ] Responsive (mobile to 4K)
- [ ] Glass effects applied (backdrop-filter)
- [ ] Hover animations work smoothly
- [ ] Accessibility: keyboard navigation works
- [ ] Performance: < 50KB CSS bundle
- [ ] Browser tested: Chrome, Firefox, Safari

---

**Remember**: The goal is a unified, beautiful, responsive, multi-language CyberMood aesthetic across ALL SecuBox modules. Think: Cyberpunk meets modern minimalism. 🎯
