# SecuBox TODOs (Claude Edition)

_Last updated: 2026-02-04_

## Resolved

- ~~Expose cyberpunk option inside SecuBox Settings~~ — Done: `THEME_CHOICES` now includes `cyberpunk` in `settings.js`.

## Open

1. **Chip Header Layout Migration**
   - Port `sh-page-header` + `renderHeaderChip()` pattern to client-guardian and auth-guardian.
   - Both still use legacy header layouts (`cg-header`, `ag-hdr`).

2. **Navigation Component**
   - Convert `SecuNav.renderTabs()` into a reusable LuCI widget (avoid duplicating `Theme.init` in each view).
   - Provide a compact variant for nested modules (e.g., CDN Cache, Network Modes).

3. **Monitoring UX**
   - Add empty-state copy while charts warm up.
   - Display bandwidth units dynamically (Kbps/Mbps/Gbps) based on rate.

4. **MAC Guardian Feed Integration**
   - Build and include mac-guardian IPK in bonus feed (new package from 2026-02-03, not yet in feed).

5. **Mesh Onboarding Testing**
   - master-link dynamic join IPK generation needs end-to-end testing on multi-node mesh.
   - P2P decentralized threat intelligence sharing needs validation with real CrowdSec alerts.

6. **WAF Auto-Ban Tuning**
   - Sensitivity thresholds may need adjustment based on real traffic patterns.
   - CVE detection patterns (including CVE-2025-15467) need false-positive analysis.

7. **Image Builder Validation**
   - `secubox-tools/` image builder and sysupgrade scripts (added 2026-02-03) need testing on physical hardware.

8. **Docs & Tooling**
   - Document deployment scripts in `README.md` (what each script copies).
   - Add lint/upload pre-check (LuCI `lua -l luci.dispatcher`) to prevent syntax errors before SCP.

9. **Testing**
   - Capture screenshot baselines for dark/light/cyberpunk themes.
   - Automate browser cache busting (append `?v=<git sha>` to view URLs).
