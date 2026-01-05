# SecuBox Theme System Guide

Complete guide to creating and customizing themes in SecuBox OpenWrt.

## Table of Contents
1. [Available Themes](#available-themes)
2. [Theme Structure](#theme-structure)
3. [Creating a Custom Theme](#creating-a-custom-theme)
4. [CSS Variables Reference](#css-variables-reference)
5. [Applying Themes](#applying-themes)

---

## Available Themes

SecuBox includes 8 pre-built themes:

| Theme | Description | Primary Colors |
|-------|-------------|----------------|
| **dark** | Default dark theme | Deep blue (#0a0e25) |
| **light** | Clean light theme | White/light gray (#fafafa) |
| **cyberpunk** | Futuristic neon theme | Purple/cyan (#667eea, #06b6d4) |
| **ocean** | Professional blue | Ocean blue (#0077be, #00bcd4) |
| **sunset** | Warm orange/coral | Sunset orange (#ff6b35, #ffa500) |
| **forest** | Natural green | Forest green (#2d7d2d, #90ee90) |
| **minimal** | Clean minimalist | Royal blue (#2563eb, #fafafa) |
| **contrast** | High accessibility | Black/white/yellow (WCAG AAA) |

---

## Theme Structure

Each theme is defined in a separate CSS file:

```
luci-theme-secubox/
└── htdocs/luci-static/resources/secubox-theme/
    └── themes/
        ├── dark.css
        ├── light.css
        ├── cyberpunk.css
        ├── ocean.css
        ├── sunset.css
        ├── forest.css
        ├── minimal.css
        └── contrast.css
```

Themes are activated via the `data-secubox-theme` attribute on `<body>` or `<html>`:

```html
<body data-secubox-theme="cyberpunk">
```

---

## Creating a Custom Theme

### Step 1: Create Theme File

Create a new file in `themes/` directory:

```bash
touch luci-theme-secubox/htdocs/luci-static/resources/secubox-theme/themes/mytheme.css
```

### Step 2: Define Theme Styles

Use the following template:

```css
/**
 * My Custom Theme
 * Description of your theme
 */

body[data-secubox-theme="mytheme"] {
	/* === BACKGROUND COLORS === */
	--cyber-bg-primary: #your-color;      /* Main background */
	--cyber-bg-secondary: #your-color;    /* Card backgrounds */
	--cyber-bg-tertiary: #your-color;     /* Hover states */

	/* === TEXT COLORS === */
	--cyber-text-primary: #your-color;    /* Headings, main text */
	--cyber-text-secondary: #your-color;  /* Subtitles, labels */
	--cyber-text-muted: #your-color;      /* Disabled, placeholders */
	--cyber-text-inverse: #your-color;    /* Text on dark backgrounds */

	/* === ACCENT COLORS === */
	--cyber-accent-primary: #your-color;  /* Primary actions, links */
	--cyber-accent-secondary: #your-color; /* Secondary highlights */

	/* === STATUS COLORS === */
	--cyber-success: #your-color;         /* Success messages */
	--cyber-warning: #your-color;         /* Warning messages */
	--cyber-danger: #your-color;          /* Error messages */
	--cyber-info: #your-color;            /* Info messages */

	/* === BORDER === */
	--cyber-border: 1px solid rgba(255, 255, 255, 0.1);

	/* === GRADIENTS (Optional) === */
	--cyber-gradient-primary: linear-gradient(135deg, #color1, #color2);
	--cyber-gradient-secondary: linear-gradient(135deg, #color3, #color4);

	/* === BACKGROUND GRADIENT === */
	background: radial-gradient(
		circle at top right,
		rgba(your-r, your-g, your-b, 0.05),
		transparent 50%
	);

	/* Base text color */
	color: var(--cyber-text-primary);
}

/* Optional: Custom body background */
body[data-secubox-theme="mytheme"]::before {
	content: '';
	position: fixed;
	inset: 0;
	background: /* your custom background pattern */;
	opacity: 0.05;
	pointer-events: none;
	z-index: -1;
}
```

### Step 3: Register Theme

Add your theme to the available themes list in `theme.js`:

```javascript
// File: secubox-theme/theme.js
availableThemes: [
	'dark',
	'light',
	'cyberpunk',
	'ocean',
	'sunset',
	'forest',
	'minimal',
	'contrast',
	'mytheme'  // <-- Add your theme here
],
```

### Step 4: Import Theme

Add the import to `secubox-theme.css`:

```css
/* File: secubox-theme/secubox-theme.css */
@import url('./themes/mytheme.css');
```

---

## CSS Variables Reference

### Complete Variable List

```css
/* Backgrounds */
--cyber-bg-primary         /* Main page background */
--cyber-bg-secondary       /* Cards, panels */
--cyber-bg-tertiary        /* Hover states, inputs */

/* Text */
--cyber-text-primary       /* Main headings, body text */
--cyber-text-secondary     /* Subtitles, labels */
--cyber-text-muted         /* Disabled text, placeholders */
--cyber-text-inverse       /* White text on dark backgrounds */

/* Accents */
--cyber-accent-primary     /* Primary buttons, links */
--cyber-accent-secondary   /* Secondary highlights */

/* Status */
--cyber-success            /* Success: #10b981 */
--cyber-warning            /* Warning: #f59e0b */
--cyber-danger             /* Error: #ef4444 */
--cyber-info               /* Info: #3b82f6 */

/* Borders */
--cyber-border             /* Standard border style */

/* Border Radius */
--cyber-radius-xs          /* 2px */
--cyber-radius-sm          /* 4px */
--cyber-radius-md          /* 8px */
--cyber-radius-lg          /* 12px */
--cyber-radius-xl          /* 16px */

/* Spacing */
--cyber-spacing-xs         /* 0.25rem (4px) */
--cyber-spacing-sm         /* 0.5rem (8px) */
--cyber-spacing-md         /* 1rem (16px) */
--cyber-spacing-lg         /* 1.5rem (24px) */
--cyber-spacing-xl         /* 2rem (32px) */

/* Transitions */
--cyber-transition         /* 0.2s ease-out */

/* Gradients */
--cyber-gradient-primary
--cyber-gradient-secondary
```

---

## Applying Themes

### Method 1: JavaScript API

```javascript
// Import theme controller
'require secubox-theme.theme as Theme';

// Apply theme
Theme.apply('cyberpunk');

// Save as user preference
Theme.setPreferredTheme('cyberpunk');

// Get current theme
var current = Theme.currentTheme;
```

### Method 2: Manual HTML Attribute

```html
<body data-secubox-theme="ocean">
```

### Method 3: LocalStorage

Themes are persisted in localStorage:

```javascript
localStorage.setItem('secubox.theme', 'sunset');
```

---

## Theme Examples

### Example 1: Midnight Blue Theme

```css
body[data-secubox-theme="midnight"] {
	--cyber-bg-primary: #0d1117;
	--cyber-bg-secondary: #161b22;
	--cyber-bg-tertiary: #1f2937;

	--cyber-text-primary: #e6edf3;
	--cyber-text-secondary: #8b949e;
	--cyber-text-muted: #6e7681;

	--cyber-accent-primary: #58a6ff;
	--cyber-accent-secondary: #1f6feb;

	--cyber-success: #3fb950;
	--cyber-warning: #d29922;
	--cyber-danger: #f85149;
	--cyber-info: #58a6ff;

	--cyber-border: 1px solid #30363d;

	background: radial-gradient(
		circle at top right,
		rgba(88, 166, 255, 0.05),
		transparent 50%
	);

	color: var(--cyber-text-primary);
}
```

### Example 2: Warm Desert Theme

```css
body[data-secubox-theme="desert"] {
	--cyber-bg-primary: #faf8f3;
	--cyber-bg-secondary: #f5f1e8;
	--cyber-bg-tertiary: #ebe6d9;

	--cyber-text-primary: #2d2419;
	--cyber-text-secondary: #5c4f3f;
	--cyber-text-muted: #8b7d6b;

	--cyber-accent-primary: #d97706;
	--cyber-accent-secondary: #ea580c;

	--cyber-success: #059669;
	--cyber-warning: #d97706;
	--cyber-danger: #dc2626;
	--cyber-info: #0284c7;

	--cyber-border: 1px solid #d4c5b0;

	background: linear-gradient(
		135deg,
		rgba(217, 119, 6, 0.03),
		rgba(234, 88, 12, 0.03)
	);

	color: var(--cyber-text-primary);
}
```

---

## Best Practices

### 1. Color Contrast

Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text):

```css
/* Good */
--cyber-text-primary: #e6edf3;  /* on #0d1117 background = 12.3:1 */

/* Bad */
--cyber-text-primary: #6e7681;  /* on #0d1117 background = 2.8:1 */
```

### 2. Consistent Spacing

Use CSS variables for spacing:

```css
padding: var(--cyber-spacing-md);
margin-bottom: var(--cyber-spacing-lg);
```

### 3. Smooth Transitions

Apply transitions to interactive elements:

```css
.custom-button {
	transition: var(--cyber-transition);
}
```

### 4. Test in All Contexts

Test your theme in:
- Dashboard
- Forms
- Tables
- Modals
- Charts
- Mobile views

---

## Troubleshooting

### Theme Not Applying

1. Check attribute: `document.body.getAttribute('data-secubox-theme')`
2. Verify CSS import in `secubox-theme.css`
3. Clear browser cache (Ctrl+F5)
4. Check browser console for CSS errors

### Colors Look Wrong

1. Verify CSS variable names match exactly
2. Check for conflicting CSS rules (use DevTools)
3. Ensure proper color format (hex, rgb, rgba)

### Theme Not Persisting

1. Check localStorage: `localStorage.getItem('secubox.theme')`
2. Verify theme name is in `availableThemes` array
3. Check browser privacy settings (localStorage enabled)

---

## Resources

- **Color Palette Tools**:
  - [Coolors.co](https://coolors.co)
  - [Adobe Color](https://color.adobe.com)

- **Accessibility**:
  - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
  - [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

- **Inspiration**:
  - [Dracula Theme](https://draculatheme.com)
  - [Nord Theme](https://www.nordtheme.com)
  - [Catppuccin](https://github.com/catppuccin/catppuccin)

---

**Author**: SecuBox Team
**Version**: 1.0.0
**Last Updated**: 2026-01-05
