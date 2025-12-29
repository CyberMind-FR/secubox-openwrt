# SecuBox Dev History (Codex Notes)

- **2025-12-18 – Theme Foundations**  
  Added `secubox/common.css` (design tokens) + SecuNav component.

- **2025-12-20 – Dashboard Revamp**  
  Dashboard got hero chips, module grid, and API auto-refresh.

- **2025-12-24 – Modules + Monitoring Upgrade**  
  Modules view has filter tabs, responsive cards, and live stats.  
  Monitoring view now renders SVG spark lines with poll-based updates.

- **2025-12-26 – Alerts + Settings Refresh**  
  Alerts converted to chip header + stats cards.  
  Settings adopted shared layout and is now theme-aware.

- **2025-12-28 – Theme & Menu Fixes**  
  Every view initializes `Theme.init`.  
  Navigation tabs respond to dark/light/cyberpunk palettes.  
  Monitoring menu simplified (no `/overview` tab).  
  CSS updated so chip headers stay on a single row (with responsive wrap).

- **2025-12-29 – v0.5.0-A UI polish**  
  Monitoring hero + modules filter migrated to SecuNav styling, alerts buttons use `sh-btn`, Help page adopts shared header and navbar Bonus tab, and overall theme consistency is verified on router.

- **2025-12-29 – Theme selector live preview**  
  Settings now expose dark/light/system/cyberpunk options, preview changes instantly, and save preferences via the new `set_theme` RPC.

- **2025-12-29 – Quick Deploy tooling**  
  Added `secubox-tools/quick-deploy.sh` with profiles (theme, full LuCI app), interactive `--src-select`, selective uploads, verification, and cache management.
