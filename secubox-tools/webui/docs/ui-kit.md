# SecuBox WebUI UI Kit

Concept for a responsive, emoji-forward card interface covering AppStore, Modules, Components, Profiles, Templates, and Settings views. This spec guides the implementation phase.

## 1. Layout & Breakpoints

| Breakpoint | Width            | Grid Columns | Notes                                    |
|------------|------------------|--------------|------------------------------------------|
| XL         | ≥ 1200 px        | 4 columns    | Default desktop, persistent nav sidebar  |
| LG         | 992 – 1199 px    | 3 columns    | Collapsed sidebar, dense cards           |
| MD         | 768 – 991 px     | 2 columns    | Bottom nav strip, drawers slide over     |
| SM         | ≤ 767 px         | 1 column     | Stacked cards, actions move to menus     |

CSS Grid template example:
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}
```

## 2. Card Anatomy

Structure shared across sections (AppStore, Modules, etc.):

1. **Header Row:** emoji badge + title + version/status pill.
2. **Body:** summary paragraph, tags, dependency indicators.
3. **Footer:** primary action button, secondary action, metadata chips.

States: default, hover (elevation + shadow), active (pressed), disabled (reduced opacity), warning/error (border + icon).

## 3. Emoji/Icon Mapping

| Category      | Emoji | Color Token     | Example |
|---------------|-------|-----------------|---------|
| Security      | 🛡️    | `--accent-green`| `secubox-core`, `auth-guardian` |
| Networking    | 🛰️    | `--accent-blue` | `network-modes` |
| Monitoring    | 📡    | `--accent-purple` | `netdata-dashboard` |
| Automation    | 🤖    | `--accent-orange` | `system-hub` |
| Storage       | 💾    | `--accent-cyan` | `nextcloud` |
| Templates     | 🧬    | `--accent-pink` | profile/template cards |

Store mapping in `app/ui/emoji_map.py` (future) or JSON for reuse.

## 4. Palette & Typography

- Base fonts: `Inter`, `SF Pro`, fallback `system-ui`.
- Font scale: `1.25rem` headings, `1rem` body, `0.85rem` tags.
- Light theme tokens:
  - `--bg`: `#f5f6fb`
  - `--panel`: `#ffffff`
  - `--text`: `#1f2333`
  - `--border`: `rgba(31,35,51,0.12)`
  - `--accent`: `#4b6bfb`
- Dark theme tokens mirror existing `theme-luci` palette.

## 5. Components

### Filter Chips
- Rounded pill, emoji optional (`#RPC` / `#Beta`).
- Click toggles active state (accent background + bold text).
- Emits filter event via HTMX `hx-get="/?tags=..."`.

### Action Buttons
- Primary: solid accent, ripple effect.
- Secondary: ghost style with border.
- Include icon/emoji prefix when contextually relevant.

### Status Pills
- Variants: `Stable`, `Beta`, `Warning`, `Critical`.
- Colors: green, amber, orange, red respectively.
- Show optional emoji (✅, 🧪, ⚠️, 🟥).

### Drawers / Modals
- Side drawer for module detail (`max-width: 420px`).
- Full-screen modal on mobile.
- Contains tabbed content (Overview, Logs, Dependencies, Actions).

## 6. Interactions

- **Hover:** slight translation (`transform: translateY(-2px)`), drop shadow.
- **Drag-and-drop:** used in Profiles view to assign module cards to profiles; utilize accessible drag handles.
- **Filtering:** clicking tags/filters triggers animated fade/filter via CSS or JS.
- **Quick Actions:** card footers show inline icons (▶️ Run, 🔍 Inspect, 🔄 Update).
- **Feedback:** success toast with emoji (`✅ Module simulated`), warnings with orange banner.

## 7. Section-specific Notes

- **AppStore:** hero carousel with featured cards, grid for categories, install buttons with progress badges.
- **Modules:** include uptime bar, log badges, context menu (⋮) for advanced actions.
- **Components:** embed mini network diagram card showing dependencies; highlight on hover.
- **Profiles:** stacked module badges, timeline indicator for provisioning.
- **Templates:** preview thumbnails (image or code snippet), CTA `🧪 Preview`.
- **Settings:** grouped cards per domain, switches and sliders embedded.

## 8. Accessibility

- Ensure color contrast ≥ 4.5:1.
- Provide aria-labels for emoji-only buttons.
- Keyboard navigation: tab order respects card grid; Enter activates primary action, Space toggles filter chips.

## 9. Implementation Checklist

1. Build SCSS/Tailwind layer reflecting tokens and breakpoints.
2. Implement base card component (`<Card>`), variants for each view.
3. Develop reusable chip, pill, badge components.
4. Wire HTMX or React events for filters, drawers, drag-drop.
5. QA across breakpoints + theme toggles.

This document is the reference for implementing the reactive card UI across SecuBox WebUI sections.
