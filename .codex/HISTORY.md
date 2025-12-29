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

- **2025-12-29 – System Hub ACL compliance**  
  Added diagnostics and remote RPC methods to `luci-app-system-hub` ACL so those screens work with proper permissions.

- **2025-12-29 – Validator improvements**  
  `secubox-tools/validate-modules.sh` now accepts cross-module LuCI menus and all CSS/JS assets were reset to 644 so the suite passes validation.

- **2025-12-29 – Quick Deploy prompt fix**  
  Adjusted `prompt_select_app()` so menu output goes to stderr, preventing `--src-select` from capturing prompts along with the chosen app.

- **2025-12-29 – System Hub theme sync**  
  `system-hub/common.css` / `dashboard.css` now listen to `data-secubox-theme`, hide the stock LuCI tab bar, and every System Hub view imports `secubox-theme` so UI matches the global toggle.
