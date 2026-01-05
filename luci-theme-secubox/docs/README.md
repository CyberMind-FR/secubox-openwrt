# SecuBox Documentation

Complete documentation for the SecuBox OpenWrt theme system.

## Quick Links

- 📚 **[Theme Guide](THEME_GUIDE.md)** - Creating and customizing themes
- 📱 **[Responsive Guide](RESPONSIVE_GUIDE.md)** - Building responsive interfaces
- 📊 **[Widget Guide](WIDGET_GUIDE.md)** - Widgets with charts and real-time updates
- ✨ **[Animation Guide](ANIMATION_GUIDE.md)** - Animations and micro-interactions

---

## Overview

SecuBox is a comprehensive theming and component system for OpenWrt LuCI with:

- **8 Pre-built Themes** (dark, light, cyberpunk, ocean, sunset, forest, minimal, contrast)
- **500+ Utility Classes** for responsive design
- **60+ Animations** and micro-interactions
- **Chart.js Integration** with 5 chart types
- **Real-time Updates** via WebSocket + polling fallback
- **9 Widget Templates** for dashboard displays
- **Fully Responsive** (mobile-first, 375px → 1920px+)

---

## Getting Started

### 1. Theme Selection

Choose a theme via JavaScript:

```javascript
'require secubox-theme.theme as Theme';

Theme.setPreferredTheme('cyberpunk');
```

Or HTML attribute:

```html
<body data-secubox-theme="ocean">
```

**Available themes**: `dark`, `light`, `cyberpunk`, `ocean`, `sunset`, `forest`, `minimal`, `contrast`

👉 **[Full Theme Guide](THEME_GUIDE.md)**

---

### 2. Responsive Layout

Build mobile-first layouts with utility classes:

```html
<!-- Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns -->
<div class="cyber-grid cyber-grid-cols-1 cyber-md:grid-cols-2 cyber-lg:grid-cols-4 cyber-gap-md">
	<div class="cyber-card">Card 1</div>
	<div class="cyber-card">Card 2</div>
	<div class="cyber-card">Card 3</div>
	<div class="cyber-card">Card 4</div>
</div>
```

**Breakpoints**:
- Mobile: 0px
- Small: 480px (`cyber-sm:`)
- Medium: 768px (`cyber-md:`)
- Large: 1024px (`cyber-lg:`)
- XL: 1200px (`cyber-xl:`)

👉 **[Full Responsive Guide](RESPONSIVE_GUIDE.md)**

---

### 3. Widgets & Charts

Create dashboard widgets with live data:

```javascript
'use strict';
'require secubox-admin.widget-renderer as WidgetRenderer';
'require secubox-admin.chart-utils as ChartUtils';

// Create widget renderer
var renderer = WidgetRenderer.create({
	containerId: 'widget-container',
	apps: appsArray
});

// Render all widgets
renderer.render();

// Create chart
ChartUtils.createLineChart(canvas, {
	labels: ['Jan', 'Feb', 'Mar'],
	datasets: [{ label: 'Sales', data: [12, 19, 3] }]
});
```

**Built-in templates**: `default`, `security`, `network`, `monitoring`, `hosting`, `compact`, `chart-timeseries`, `chart-gauge`, `sparkline`

👉 **[Full Widget Guide](WIDGET_GUIDE.md)**

---

### 4. Animations

Add entrance animations:

```html
<div class="cyber-animate-fade-in">Fades in</div>
<div class="cyber-animate-zoom-in">Zooms in</div>
<div class="cyber-animate-bounce-in">Bounces in</div>
```

Or via JavaScript:

```javascript
'require secubox-theme.theme as Theme';

Theme.animateEntrance(element, 'bounce-in');
Theme.applyMicroInteraction(element, 'shake');
```

**60+ animations** including: fade, zoom, slide, bounce, rotate, flip, shake, wobble, tada, heartbeat, and more.

👉 **[Full Animation Guide](ANIMATION_GUIDE.md)**

---

## Documentation Index

### Core Guides

| Guide | Description | File |
|-------|-------------|------|
| **Theme System** | Creating custom themes, CSS variables, color palettes | [THEME_GUIDE.md](THEME_GUIDE.md) |
| **Responsive Design** | Utility classes, breakpoints, responsive patterns | [RESPONSIVE_GUIDE.md](RESPONSIVE_GUIDE.md) |
| **Widgets & Charts** | Widget templates, Chart.js integration, real-time updates | [WIDGET_GUIDE.md](WIDGET_GUIDE.md) |
| **Animations** | Keyframes, utility classes, JavaScript API, performance tips | [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) |

---

## Component Reference

### CSS Components

Located in: `luci-theme-secubox/htdocs/luci-static/resources/secubox-theme/components/`

| Component | Description |
|-----------|-------------|
| `buttons.css` | Button styles (.cyber-btn) |
| `cards.css` | Card containers (.cyber-card) |
| `forms.css` | Form inputs (.cyber-input, .cyber-select, .cyber-textarea) |
| `tables.css` | Responsive tables (.cyber-table) |
| `modals.css` | Modal dialogs (.cyber-modal) |
| `tooltips.css` | Tooltips (.cyber-tooltip) |
| `badges.css` | Badge labels (.cyber-badge) |
| `alerts.css` | Alert messages (.cyber-alert) |
| `navigation.css` | Navigation bars (.cyber-nav) |
| `charts.css` | Chart containers (.cyber-chart-container) |
| `featured-apps.css` | Featured app displays (.cyber-featured-section) |

### JavaScript Modules

Located in: `package/secubox/luci-app-secubox-admin/htdocs/luci-static/resources/secubox-admin/`

| Module | Description |
|--------|-------------|
| `api.js` | SecuBox API client |
| `components.js` | UI component builders |
| `data-utils.js` | Data normalization utilities |
| `widget-renderer.js` | Widget rendering engine |
| `chart-utils.js` | Chart.js wrapper utilities |
| `realtime-client.js` | WebSocket + polling client |

### Theme Module

Located in: `luci-theme-secubox/htdocs/luci-static/resources/secubox-theme/`

| Module | Description |
|--------|-------------|
| `theme.js` | Theme controller, animation API |

---

## Architecture

```
SecuBox Theme System
│
├── Core CSS
│   ├── variables.css      (CSS custom properties)
│   ├── reset.css          (Normalize styles)
│   ├── typography.css     (Font styles)
│   ├── animations.css     (60+ keyframes)
│   └── utilities.css      (500+ utility classes)
│
├── Components (11 modules)
│   ├── buttons.css
│   ├── cards.css
│   ├── forms.css
│   ├── tables.css
│   ├── modals.css
│   ├── tooltips.css
│   ├── badges.css
│   ├── alerts.css
│   ├── navigation.css
│   ├── charts.css
│   └── featured-apps.css
│
├── Layouts
│   ├── dashboard.css      (Dashboard grid)
│   ├── grid.css           (Grid utilities)
│   ├── responsive.css     (Breakpoints)
│   └── cascade.css        (LuCI cascade layout)
│
├── Themes (8 variants)
│   ├── dark.css
│   ├── light.css
│   ├── cyberpunk.css
│   ├── ocean.css
│   ├── sunset.css
│   ├── forest.css
│   ├── minimal.css
│   └── contrast.css
│
└── JavaScript
    ├── theme.js           (Theme controller)
    ├── api.js             (API client)
    ├── widget-renderer.js (Widget engine)
    ├── chart-utils.js     (Chart.js wrapper)
    └── realtime-client.js (WebSocket client)
```

---

## Quick Examples

### Example 1: Responsive Dashboard

```html
<div class="cyber-container cyber-p-md">
	<!-- Header -->
	<div class="cyber-flex cyber-flex-col cyber-md:flex-row cyber-justify-between cyber-mb-lg">
		<h1 class="cyber-text-2xl cyber-md:text-3xl">Dashboard</h1>
		<button class="cyber-btn cyber-w-full cyber-md:w-auto">Add Widget</button>
	</div>

	<!-- Stats Grid -->
	<div class="cyber-grid cyber-grid-cols-1 cyber-sm:grid-cols-2 cyber-lg:grid-cols-4 cyber-gap-md">
		<div class="cyber-card cyber-animate-fade-in">Stat 1</div>
		<div class="cyber-card cyber-animate-fade-in">Stat 2</div>
		<div class="cyber-card cyber-animate-fade-in">Stat 3</div>
		<div class="cyber-card cyber-animate-fade-in">Stat 4</div>
	</div>
</div>
```

### Example 2: Chart Widget

```javascript
'use strict';
'require secubox-admin.chart-utils as ChartUtils';

var canvas = document.getElementById('my-chart');

ChartUtils.createLineChart(canvas, {
	labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
	datasets: [{
		label: 'Traffic',
		data: [120, 150, 180, 200, 170]
	}]
}, {
	responsive: true,
	maintainAspectRatio: false
});
```

### Example 3: Real-Time Widget

```javascript
'use strict';
'require secubox-admin.realtime-client as RealtimeClient';

var realtime = Object.create(RealtimeClient);
realtime.init({ enableWebSocket: true });

realtime.subscribe('widget.my-app', function(data) {
	console.log('Received update:', data);
	updateWidgetDisplay(data);
});
```

### Example 4: Custom Theme

```css
/* File: themes/mytheme.css */
body[data-secubox-theme="mytheme"] {
	--cyber-bg-primary: #1a1a2e;
	--cyber-bg-secondary: #16213e;
	--cyber-text-primary: #eaeaea;
	--cyber-accent-primary: #0f3460;
	--cyber-accent-secondary: #e94560;

	background: radial-gradient(
		circle at top right,
		rgba(233, 69, 96, 0.05),
		transparent 50%
	);
}
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

**Mobile Support**: iOS Safari 14+, Chrome Mobile 90+

---

## Performance

### Benchmarks

- **CSS Bundle**: ~150KB minified
- **JS Bundle**: ~50KB (core modules)
- **Chart.js**: 201KB (lazy loaded)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <2.5s

### Optimization Tips

1. Use CSS minification in production
2. Lazy load Chart.js when needed
3. Limit simultaneous animations
4. Use `will-change` sparingly
5. Enable gzip compression

---

## Contributing

To contribute improvements:

1. Follow existing code style
2. Test on multiple browsers
3. Ensure mobile responsiveness
4. Add documentation for new features
5. Update CHANGELOG.md

---

## Changelog

### Version 1.0.0 (2026-01-05)

**Added**:
- 8 pre-built themes (dark, light, cyberpunk, ocean, sunset, forest, minimal, contrast)
- 500+ responsive utility classes
- 60+ animation keyframes
- Chart.js integration with 5 chart types
- Real-time data updates via WebSocket + polling
- 9 widget templates
- Complete mobile responsiveness (375px-1920px+)
- 4 comprehensive documentation guides

**Enhanced**:
- Animation system (25 → 889 lines)
- Utility classes (41 → 500+ lines)
- Theme system with 8 variants
- Widget system with charts and real-time

---

## License

SecuBox Theme System
Copyright (C) 2026 SecuBox Team

Licensed under the Apache License, Version 2.0

---

## Support

For issues, questions, or contributions:

- **GitHub**: [SecuBox Repository](#)
- **Documentation**: This folder
- **Examples**: See individual guide files

---

**Version**: 1.0.0
**Last Updated**: 2026-01-05
**Authors**: SecuBox Team
