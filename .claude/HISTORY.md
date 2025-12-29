# SecuBox UI & Theme History

_Last updated: 2025-12-28_

1. **Unified Dashboard Refresh (2025-12-20)**  
   - Dashboard received the "sh-page-header" layout, hero stats, and SecuNav top tabs.  
   - Introduced shared `secubox/common.css` design tokens.

2. **Modules & Monitoring Modernization (2025-12-24)**  
   - Modules view adopted the same header/tabs plus live chip counters.  
   - Monitoring cards switched to SVG sparkline charts with auto-refresh.

3. **Alerts + Settings Overhaul (2025-12-27)**  
   - Alerts page now mirrors the dashboard style, dynamic header chips, and filtering controls.  
   - Settings view gained the SecuNav tabs, chips, and shared design language.

4. **Theme Synchronisation & Deployment (2025-12-28)**  
   - All SecuBox views call `Theme.init()` to respect dark/light/system preferences.  
   - Navigation bar now darkens automatically for dark/cyberpunk themes.  
   - Monitoring menu entry simplified (no `/overview` shim) to prevent LuCI tab duplication.

5. **Router Deployment Notes**  
   - Use `secubox-tools/deploy-secubox-dashboard.sh` for view-only pushes.  
   - Use `secubox-tools/deploy-secubox-v0.1.2.sh` for RPCD/config updates.  
   - Always clear `/tmp/luci-*` after copying UI assets.
