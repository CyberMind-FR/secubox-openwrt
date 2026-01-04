# Repository Guidelines

## Project Structure & Module Organization
- LuCI apps (`luci-app-secubox`, `luci-app-*`) store views in `htdocs/luci-static/resources` and RPC logic in `root/usr/libexec/rpcd`; `package/secubox/` holds the SDK-ready copies of those modules.
- `luci-theme-secubox`, `templates/`, and `plugins/` provide shared CSS, gradients, and widgets that should be referenced via `require secubox/*` instead of duplicating assets.
- Automation lives in `secubox-tools/`, `scripts/`, and the `deploy-*.sh` wrappers, while documentation sits in `docs/` (MkDocs) and `DOCS/` (deep dives).

## Build, Test & Development Commands
- `./secubox-tools/local-build.sh build <module>` performs cached SDK builds; use `make package/<module>/compile V=s` when reproducing CI exactly.
- `./secubox-tools/validate-modules.sh` must pass before commits; it checks RPC naming, menu paths, permissions, JSON, and orphaned views.
- `./secubox-tools/quick-deploy.sh --profile luci-app --src luci-app-secubox` syncs both `root/` and `htdocs/` trees to a router; add `--list-apps` to discover valid IDs or `--app <name>` to target one.
- `./deploy-to-router.sh` rebuilds `secubox-core` + `luci-app-secubox-admin`, uploads the latest IPKs to `$ROUTER_IP`, installs them, and restarts `rpcd`.

## Coding Style & Naming Conventions
- LuCI views stick with ES5: `'use strict';`, grouped `'require ...'`, tab indentation, and `return view.extend({ ... })` + `E('div', ...)` rendering; move business logic into helpers like `secubox/api`.
- Menu JSON `"path": \"system-hub/overview\"` must resolve to `htdocs/.../view/system-hub/overview.js`, and RPC scripts inside `root/usr/libexec/rpcd/` must match their ubus object names while shipping with executable (755) permissions.
- Run `./secubox-tools/fix-permissions.sh --local` to keep CSS/JS files at 644, and keep design vocabulary consistent (`sh-*`, `sb-*`, Inter/JetBrains fonts, gradients stored in theme files).

## Testing Guidelines
- Run `./secubox-tools/validate-modules.sh` plus `jsonlint file.json` and `shellcheck root/usr/libexec/rpcd/*` for every touchpoint.
- Execute `scripts/smoke_test.sh` on hardware to confirm Zigbee2MQTT services, container health, and MQTT.
- Drop `test-direct.js` or `test-modules-simple.js` into LuCI to verify menu wiring, then remove the file and record any `ubus -S call luci.secubox ...` commands in the PR.

## Commit & Pull Request Guidelines
- Follow the observed history style: `type(scope): change` (e.g., `fix(luci-app-secubox-admin): add RPC fallback`).
- PRs must highlight the affected module, list the validation commands run, and attach screenshots for UI tweaks.
- Link issues or TODO entries, update `docs/` + `DOCS/` when behavior or APIs change, and call out router IP assumptions.

## Security & Deployment Tips
- Run the validator and `./secubox-tools/fix-permissions.sh --local` before pushing to avoid HTTP 403s, and restart `rpcd` plus purge LuCI caches (`rm -f /tmp/luci-*`) if you skip `deploy-to-router.sh`.
