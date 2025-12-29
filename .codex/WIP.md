# WIP Tracker (Codex)

## Completed Today

- Unified Monitoring + Modules filters and Help view with SecuNav styling.  
- Added Bonus tab to navbar, refreshed alerts action buttons, removed legacy hero blocks.  
- Verified on router (scp + cache reset) and tagged release v0.5.0-A.

## In Progress

- Preparing follow-up refactor to deduplicate Theme initialization logic.  
- Evaluating automated deployment pipeline (rsync/scp wrappers) for `secubox-tools`.

## Reminders

- After editing LuCI JS, always deploy via `secubox-tools/deploy-secubox-dashboard.sh` or targeted SCP + `rm -rf /tmp/luci-*`.  
- Router currently lacks a root password; set one before exposing it to networks.
