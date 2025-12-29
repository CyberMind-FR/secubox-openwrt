# SecuBox UI TODOs (Claude Edition)

1. **Theme Manager Enhancements**
   - Expose cyberpunk option inside SecuBox Settings (currently dark/light/system only).
   - Persist theme choice back to `/etc/config/secubox` and reflect instantly without refresh.

2. **Navigation Component**
   - Convert `SecuNav.renderTabs()` into a reusable LuCI widget (avoid duplicating `Theme.init` in each view).
   - Provide a compact variant for nested modules (e.g., CDN Cache, Network Modes).

3. **Monitoring UX**
   - Add empty-state copy while charts warm up.  
   - Display bandwidth units dynamically (Kbps/Mbps/Gbps) based on rate.

4. **Docs & Tooling**
   - Document deployment scripts in `README.md` (what each script copies).  
   - Add lint/upload pre-check (LuCI `lua -l luci.dispatcher`) to prevent syntax errors before SCP.

5. **Testing**
   - Capture screenshot baselines for dark/light themes (use `secubox-tools/`?).  
   - Automate browser cache busting (append `?v=<git sha>` to view URLs).
