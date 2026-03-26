# SecuBox UI Design Guide

## CRT P31 Phosphor Green Theme

The SecuBox OpenWrt interface uses a retro CRT terminal aesthetic inspired by the P31 phosphor used in classic green-screen monitors.

### Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--p31-peak` | `#33ff66` | Maximum brightness - headers, active elements |
| `--p31-hot` | `#66ffaa` | High brightness - hover states |
| `--p31-mid` | `#22cc44` | Medium brightness - body text |
| `--p31-dim` | `#0f8822` | Low brightness - secondary text, borders |
| `--p31-ghost` | `#052210` | Ghosting/afterglow - subtle backgrounds |
| `--p31-decay` | `#ffb347` | Phosphor decay amber - warnings |
| `--tube-black` | `#050803` | Deep CRT black - main background |
| `--tube-deep` | `#080d05` | Card backgrounds |
| `--tube-bezel` | `#0d1208` | Panel borders |

### Typography

```css
font-family: 'Courier Prime', 'IBM Plex Mono', 'Fira Code',
             'Courier New', 'Lucida Console', monospace;
font-size: 14px;
line-height: 1.5;
letter-spacing: 0.02em;
```

### Glow Effects

```css
/* Text glow */
--bloom-text: 0 0 2px var(--p31-peak),
              0 0 6px var(--p31-peak),
              0 0 14px rgba(51,255,102,0.5);

/* Box glow */
--bloom-box: 0 0 8px rgba(51,255,102,0.3),
             inset 0 0 4px rgba(51,255,102,0.1);
```

## Theme Files

```
luci-theme-secubox/
├── htdocs/luci-static/secubox/
│   ├── cascade.css         # Main theme CSS
│   ├── mobile.css          # Mobile responsive styles
│   ├── crt-engine.js       # Scanline & boot animation
│   └── crt-components.js   # Reusable UI components
├── htdocs/luci-static/resources/secubox-theme/
│   └── themes/
│       ├── crt-p31.css     # P31 variant
│       ├── dark.css        # Dark variant
│       ├── cyberpunk.css   # Cyberpunk variant
│       └── ...
└── ucode/luci/template/themes/secubox/
    ├── header.ut           # Header template
    └── footer.ut           # Footer template
```

## CRT Engine Features

### Scanlines Overlay

```javascript
// Automatically applied via crt-engine.js
// Creates CSS pseudo-element with horizontal lines
```

### Boot Sequence Animation

On first visit, displays a terminal-style boot sequence:

```
[SECUBOX] Initializing mesh daemon...
[SECUBOX] Loading P31 phosphor display...
[SECUBOX] System ready.
```

### Phosphor Glow

Text and interactive elements have subtle green glow effects that intensify on hover/focus.

## KISS Theme Integration

SecuBox modules use a shared KISS (Keep It Simple & Styled) theme helper:

```javascript
// In LuCI views
'require secubox-theme/kiss';

// Render header chip
E('div', { 'class': 'sh-page-header' }, [
    renderHeaderChip('🛡️', 'Security Status', 'Active', 'success')
]);

// Stats card
E('div', { 'class': 'sh-stat-card' }, [
    E('div', { 'class': 'sh-stat-value' }, '42'),
    E('div', { 'class': 'sh-stat-label' }, 'Active Threats')
]);
```

## Component Classes

### Cards

```html
<div class="sh-card">
    <div class="sh-card-header">Title</div>
    <div class="sh-card-body">Content</div>
</div>
```

### Status Badges

```html
<span class="sh-badge sh-badge-success">Running</span>
<span class="sh-badge sh-badge-warning">Warning</span>
<span class="sh-badge sh-badge-danger">Stopped</span>
```

### Progress Bars

```html
<div class="sh-progress">
    <div class="sh-progress-bar" style="width: 75%"></div>
</div>
```

### Tables

```html
<table class="sh-table">
    <thead>
        <tr><th>Column</th></tr>
    </thead>
    <tbody>
        <tr><td>Data</td></tr>
    </tbody>
</table>
```

## Responsive Design

The theme includes mobile-optimized styles via `mobile.css`:

- Collapsible navigation menu
- Stacked card layouts
- Touch-friendly button sizes
- Readable font sizes on small screens

## Theme Switching

Users can switch themes via UCI or the Settings page:

```bash
# Set theme via UCI
uci set luci.main.mediaurlbase='/luci-static/secubox'
uci commit luci

# Or use the themes section
uci set luci.themes.SecuBox='/luci-static/secubox'
```

## Dark Mode

The CRT P31 theme is inherently dark. The `data-darkmode` attribute is ignored as the phosphor green aesthetic requires a dark background for proper contrast.

## Accessibility

- High contrast phosphor green on black
- Keyboard navigation support
- Focus indicators with glow effects
- Screen reader compatible semantic HTML

---

*SecuBox UI Guide v1.0 | CRT P31 Phosphor Theme*
