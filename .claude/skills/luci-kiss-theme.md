# LuCI KissTheme Dashboard Styling — SecuBox Skill

## Overview

All SecuBox LuCI dashboards must use the **KissTheme** framework for consistent dark-themed styling. The CrowdSec dashboard (`luci-app-crowdsec-dashboard`) serves as the reference implementation.

## Reference Files

- **KissTheme core**: `luci-theme-secubox/htdocs/luci-static/resources/secubox/kiss-theme.js`
- **Reference dashboard**: `luci-app-crowdsec-dashboard/htdocs/luci-static/resources/view/crowdsec-dashboard/overview.js`

## Required Import

```javascript
'use strict';
'require view';
'require rpc';
'require ui';
'require secubox/kiss-theme';
```

## Color Palette

Use `KissTheme.colors` for consistent coloring:

| Variable | Hex | Usage |
|----------|-----|-------|
| `c.bg` | `#0a0e17` | Main background |
| `c.bg2` | `#111827` | Secondary background |
| `c.card` | `#161e2e` | Card background |
| `c.line` | `#1e293b` | Borders |
| `c.text` | `#e2e8f0` | Main text |
| `c.muted` | `#94a3b8` | Muted/secondary text |
| `c.green` | `#00C853` | Success, running, active |
| `c.red` | `#FF1744` | Danger, stopped, error |
| `c.blue` | `#2979FF` | Info, links |
| `c.cyan` | `#22d3ee` | IPs, highlights |
| `c.purple` | `#a78bfa` | Accent |
| `c.orange` | `#fb923c` | Warning, threats |
| `c.yellow` | `#fbbf24` | Caution, pending |

## CSS Variables

Use CSS variables in inline styles for theme consistency:

```javascript
'color: var(--kiss-green);'
'background: var(--kiss-card);'
'border: 1px solid var(--kiss-line);'
```

## Component Helpers

### Stat Cards

```javascript
var c = KissTheme.colors;
var stats = [
    { label: 'Active', value: 42, color: c.green },
    { label: 'Threats', value: 100, color: c.orange }
];
return stats.map(function(st) {
    return KissTheme.stat(st.value, st.label, st.color);
});
```

### Cards

```javascript
KissTheme.card('Card Title', E('div', {}, [
    // Card content
]));
```

### Badges

```javascript
KissTheme.badge('RUNNING', 'green');  // green, red, blue, yellow
```

### Tables

```javascript
E('table', { 'class': 'kiss-table' }, [
    E('thead', {}, E('tr', {}, [
        E('th', {}, 'Column 1'),
        E('th', {}, 'Column 2')
    ])),
    E('tbody', {}, items.map(function(item) {
        return E('tr', {}, [
            E('td', {}, item.col1),
            E('td', {}, item.col2)
        ]);
    }))
]);
```

### Buttons

```javascript
E('button', { 'class': 'kiss-btn kiss-btn-green' }, 'Start');
E('button', { 'class': 'kiss-btn kiss-btn-red' }, 'Stop');
E('button', { 'class': 'kiss-btn' }, 'Default');
```

### Grid Layouts

```javascript
E('div', { 'class': 'kiss-grid kiss-grid-4' }, statsArray);  // 4 columns
E('div', { 'class': 'kiss-grid kiss-grid-2' }, [card1, card2]);  // 2 columns
```

## Page Structure

```javascript
render: function(data) {
    var content = [
        // Header with title and status badge
        E('div', { 'style': 'margin-bottom: 24px;' }, [
            E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
                E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Dashboard Title'),
                KissTheme.badge(isRunning ? 'RUNNING' : 'STOPPED', isRunning ? 'green' : 'red')
            ]),
            E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Description text')
        ]),

        // Navigation tabs (if multi-view)
        this.renderNav('active-tab'),

        // Stats row
        E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(data)),

        // Two-column layout for cards
        E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
            KissTheme.card('Left Card', leftContent),
            KissTheme.card('Right Card', rightContent)
        ]),

        // Full-width card
        KissTheme.card('Full Width', fullContent)
    ];

    // Wrap with KissTheme chrome (topbar, sidebar)
    return KissTheme.wrap(content, 'admin/path/to/view');
}
```

## Navigation Tabs

For multi-view modules, implement consistent tab navigation:

```javascript
renderNav: function(active) {
    var tabs = [
        { id: 'overview', label: 'Overview', path: 'admin/service/overview' },
        { id: 'settings', label: 'Settings', path: 'admin/service/settings' }
    ];
    return E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--kiss-line); padding-bottom: 12px;' },
        tabs.map(function(t) {
            var isActive = active === t.id;
            return E('a', {
                'href': L.url(t.path),
                'style': 'padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; ' +
                    (isActive ? 'background: rgba(0,200,83,0.1); color: var(--kiss-green); border: 1px solid rgba(0,200,83,0.3);' :
                        'color: var(--kiss-muted); border: 1px solid transparent;')
            }, t.label);
        })
    );
}
```

## Health Check Lists

```javascript
renderHealth: function(s) {
    var checks = [
        { label: 'Service', ok: s.running === true },
        { label: 'Feature', ok: s.feature_enabled, value: s.feature_value }
    ];
    return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(c) {
        var valueText = c.value ? c.value : (c.ok ? 'OK' : 'Disabled');
        return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);' }, [
            E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
                (c.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
                c.ok ? '\u2713' : '\u2717'),
            E('div', { 'style': 'flex: 1;' }, [
                E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, c.label),
                E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, valueText)
            ])
        ]);
    }));
}
```

## Styling Conventions

### Monospace for Technical Data

```javascript
E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, ipAddress);
E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, timestamp);
```

### Conditional Coloring

```javascript
var color = value > 100 ? c.red : value > 10 ? c.orange : c.muted;
```

### Empty States

```javascript
E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No data available');
```

### Loading States

```javascript
E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, [
    E('span', { 'class': 'spinning' }),
    ' Loading...'
]);
```

### Error States

```javascript
E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-red);' }, 'Failed to load data');
```

## Responsive Behavior

KissTheme includes responsive breakpoints:
- `kiss-grid-4` → 2 columns on tablet, 1 on mobile
- `kiss-grid-2` → 1 column on mobile

## Do's and Don'ts

### DO:
- Use `KissTheme.wrap()` to include sidebar/topbar chrome
- Use CSS variables (`var(--kiss-*)`) for colors
- Use `KissTheme.colors` for JavaScript color references
- Follow the CrowdSec dashboard patterns
- Use monospace font for IPs, timestamps, technical data

### DON'T:
- Hardcode colors - always use the palette
- Skip the `KissTheme.wrap()` call
- Use light theme colors
- Create custom styles that conflict with KissTheme
