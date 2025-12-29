# WIP Tracker (Codex)

## Completed Today

- Synced navigation styling with theme preferences (dark/light/cyberpunk).  
- Ensured Monitoring view hides legacy LuCI tab bar and uses direct menu route.  
- Added Theme.init call to Settings view.

## In Progress

- Preparing follow-up refactor to deduplicate Theme initialization logic.  
- Evaluating automated deployment pipeline (rsync/scp wrappers) for `secubox-tools`.

## Reminders

- After editing LuCI JS, always deploy via `secubox-tools/deploy-secubox-dashboard.sh` or targeted SCP + `rm -rf /tmp/luci-*`.  
- Router currently lacks a root password; set one before exposing it to networks.
