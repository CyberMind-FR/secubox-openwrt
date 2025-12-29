# Work In Progress (Claude)

## Active Threads

- **SecuBox Nav Theme Support**  
  Status: ✅ COMPLETE (2025-12-28)  
  Notes: All view tabs now respect theme colors; monitoring menu cleaned up.

- **SecuBox v0.5.0-A polish**  
  Status: ✅ COMPLETE (2025-12-29)  
  Notes: Monitoring/Modules/Alerts/Help views now share the same navbar + chip headers; Help tab added globally.

- **Backup/Restore UX Alignment**  
  Status: ✅ COMPLETE  
  Notes: System Hub header and restore flow updated; API now accepts `file_name`.

## Next Up

- Port the new chip header layout to remaining SecuBox derivative apps (client-guardian, auth-guardian).
- Re-run deployment scripts on target routers after each batch to ensure consistency.

## Blockers / Risks

- Theme manager still only exposes dark/light/system options in Settings UI. Cyberpunk mode exists but is hidden.
- No automated regression tests for LuCI views; manual verification required after each SCP deploy.
