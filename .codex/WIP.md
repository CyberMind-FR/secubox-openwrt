# WIP Tracker (Codex)

## Completed Today

- Unified Monitoring + Modules filters and Help view with SecuNav styling.  
- Added Bonus tab to navbar, refreshed alerts action buttons, removed legacy hero blocks.  
- Verified on router (scp + cache reset) and tagged release v0.5.0-A.
- Settings now surface dark/light/system/cyberpunk themes with live preview + RPC persistence.
- Built `secubox-tools/quick-deploy.sh` with interactive `--src-select`, LuCI profiles, verification, and cache-bust helpers.
- System Hub ACL now lists diagnostics + remote RPC methods so those tabs load under proper permissions.  
- Validator now resolves cross-module menu paths and JS/CSS permissions normalized to 644 so checks pass repo-wide.  
- Quick deploy prompt now writes menus to stderr so capturing the choice works again for `--src-select`.  
- System Hub views now import SecuBox theme CSS, hide default LuCI tabs, and respect `data-secubox-theme` for consistent styling.  

## In Progress

- Preparing follow-up refactor to deduplicate Theme initialization logic.  
- Evaluating automated deployment pipeline (rsync/scp wrappers) for `secubox-tools`.
- Enhancing SecuBox theme guidelines (see `.codex/THEME_CONTEXT.md`) to capture layout, state, and localization best practices before next UI sprint.  
- Next TODO in focus: extract shared nav/header components into `secubox/components/` and document typings per `.codex/TODO.md` item #1.  

## Reminders

- After editing LuCI JS, always deploy via `secubox-tools/deploy-secubox-dashboard.sh` or targeted SCP + `rm -rf /tmp/luci-*`.  
- Router currently lacks a root password; set one before exposing it to networks.
