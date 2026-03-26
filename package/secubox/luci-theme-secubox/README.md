# SecuBox CRT P31 Phosphor Theme

A retro-futuristic CRT terminal theme for OpenWrt LuCI, designed for the SecuBox mesh security appliance.

## Features

- **P31 Phosphor Green** color palette - authentic CRT terminal aesthetic
- **Scanlines overlay** - subtle CRT screen effect
- **Phosphor glow effects** - text and button bloom on hover/focus
- **Boot sequence animation** - terminal-style startup on first visit
- **Responsive design** - works on desktop and mobile
- **Full LuCI coverage** - all pages, forms, tables, and widgets styled

## Color Palette

| Variable | Color | Usage |
|----------|-------|-------|
| `--p31-peak` | `#33ff66` | Maximum brightness - headers, active elements |
| `--p31-hot` | `#66ffaa` | High brightness - hover states |
| `--p31-mid` | `#22cc44` | Medium brightness - body text |
| `--p31-dim` | `#0f8822` | Low brightness - secondary text, borders |
| `--p31-ghost` | `#052210` | Ghosting/afterglow - subtle backgrounds |
| `--p31-decay` | `#ffb347` | Phosphor decay amber - warnings |
| `--tube-black` | `#050803` | Deep CRT black - page background |
| `--tube-deep` | `#080d05` | Card/panel backgrounds |

## Installation

```bash
opkg update
opkg install luci-theme-secubox
```

The theme will automatically be set as the default. To manually switch:

```bash
uci set luci.main.mediaurlbase='/luci-static/secubox'
uci commit luci
```

## JavaScript Components

### CRT Engine (`crt-engine.js`)

Provides CRT visual effects:

```javascript
// Configure CRT effects
SecuBoxCRT.configure({
    enableScanlines: true,  // Scanlines overlay
    enableFlicker: false,   // Screen flicker (disabled by default)
    enableGlow: true,       // Phosphor glow on hover
    enableBootSequence: true // Terminal boot animation
});

// Trigger boot sequence manually
SecuBoxCRT.bootSequence();

// Typewriter effect on element
SecuBoxCRT.typewriterEffect(element, 50);
```

### CRT Components (`crt-components.js`)

Reusable UI components:

```javascript
// Create a status widget
var widget = CRTComponents.createWidget({
    title: 'CPU Load',
    value: '45',
    unit: '%',
    status: 'normal' // or 'warning', 'danger'
});

// Create a status badge
var badge = CRTComponents.createBadge('Online', 'success');

// Create a progress bar
var progress = CRTComponents.createProgressBar(75, 100, '75%');

// Show toast notification
CRTComponents.toast('Settings saved', 'success', 3000);
```

## File Structure

```
luci-theme-secubox/
├── Makefile                          # OpenWrt package makefile
├── htdocs/luci-static/secubox/
│   ├── cascade.css                   # Main theme stylesheet
│   ├── crt-engine.js                 # CRT visual effects engine
│   └── crt-components.js             # Reusable UI components
├── luasrc/luci/view/themes/secubox/
│   ├── header.htm                    # Page header template
│   ├── footer.htm                    # Page footer template
│   └── sysauth.htm                   # Login page template
└── root/etc/uci-defaults/
    └── 90-luci-theme-secubox         # Default theme configuration
```

## CSS Customization

Override CSS variables in your module's stylesheet:

```css
/* Custom module styling */
.my-module {
    background: var(--tube-deep);
    border: 1px solid var(--p31-ghost);
    color: var(--p31-mid);
}

.my-module .title {
    color: var(--p31-peak);
    text-shadow: var(--bloom-text);
}
```

## License

MIT License - CyberMind 2026
