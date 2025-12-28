# Conventions

## OpenWrt Packaging
- Every `luci-app-*` Makefile includes `$(TOPDIR)/rules.mk` and `$(TOPDIR)/feeds/luci/luci.mk`, sets `PKG_NAME`, `PKG_VERSION`, `PKG_RELEASE`, `PKG_LICENSE`, `PKG_MAINTAINER`, `LUCI_TITLE`, `LUCI_DESCRIPTION`, `LUCI_DEPENDS`, and `LUCI_PKGARCH:=all`.
- Use `PKG_FILE_MODES` to mark executables, e.g. `PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:755`. CSS/JS/Menu/ACL files inherit 644 automatically—never mark them executable.
- Structure: `htdocs/luci-static/resources/view/<module>/*.js`, `htdocs/luci-static/resources/<module>/api.js` + CSS, `root/usr/libexec/rpcd/luci.<module>`, `root/usr/share/luci/menu.d/luci-app-<module>.json`, `root/usr/share/rpcd/acl.d/luci-app-<module>.json`, optional `/etc/config/<module>` and UCI defaults.
- Run `./secubox-tools/local-build.sh build luci-app-<module>` or `make package/luci-app-<module>/compile V=s` before pushing.

## LuCI JavaScript & CSS
- Always start JS files with `'use strict';` and use `return view.extend({ ... })`. API modules must `return baseclass.extend({ ... })`.
- Import dependencies with `'require ...'` statements (`view`, `form`, `ui`, `rpc`, `system-hub/api as API`, etc.).
- Use `Promise.all` inside `load()` and update DOM in `render()`. Register periodic refresh with `poll.add` for live data.
- Styling: link to `system-hub/common.css` + module CSS. Use `.sh-*` classes, gradient headers, `.sh-stats-grid`, `.sh-card`, `.sh-btn-*`, `.sh-filter-tab`, etc. Always support `[data-theme="dark"]` selectors.
- Component patterns: page header with `.sh-page-title` gradient, stats badges (min 130px, JetBrains Mono values), cards with 3px top border, sticky nav/filter tabs.
- No hardcoded colors/gradients: reference `var(--sh-*)`. Typography: Inter for text, JetBrains Mono for numeric values.

## RPC/ubus Backends
- Script filename **must** match ubus object (`/usr/libexec/rpcd/luci.<module>`). The ubus object string in JS, ACL, and CLI (`ubus call`) must use the same dotted name.
- RPCD scripts shell template: `#!/bin/sh`, `. /lib/functions.sh`, `. /usr/share/libubox/jshn.sh`, `case "$1" in list|call ) ... esac`. `list` advertises each method; `call` routes to handler functions, returning JSON via `json_init/json_add_*`.
- Methods should validate input parameters, sanitize user data, interact with UCI/CLI commands safely, and return success/error payloads with clear keys.

## ACLs & Menu Files
- Menu JSON lives in `root/usr/share/luci/menu.d/` and must align with view files: `"path": "<module>/<view>"` referencing `htdocs/luci-static/resources/view/<module>/<view>.js`.
- Provide a `"firstchild"` entry for the module root under `admin/secubox/...`, then `"view"` entries per tab with `order` values.
- ACL JSON in `root/usr/share/rpcd/acl.d/` should grant read (typically `status`, `get_*`, `list_*`) and write (`set_*`, `apply`, `service_action`) methods separately. Include any UCI sections if config files exist.
- Least privilege: never expose shell commands via ubus without validation, and never add ubus methods to ACLs unless needed by the UI.

## Logging & Debugging
- Use `ui.addNotification` in JS to display success/error states. For RPC backends, write diagnostics to syslog with `logger` as needed.
- Common field debugging: `ubus list | grep luci.<module>`, `ubus call luci.<module> status`, `logread | grep -i <module>`.
- To inspect remote files: `ssh root@router 'ls -la /www/luci-static/resources/view/<module>/'` and `wget -qO- http://router/luci-static/resources/<module>/api.js`.
- Automated scripts: `./secubox-tools/secubox-debug.sh luci-app-<module>`, `./secubox-tools/secubox-repair.sh`, `./secubox-tools/fix-permissions.sh --remote root@<ip>`.

## Testing & Validation
- Always run `./secubox-tools/fix-permissions.sh --local` followed by `./secubox-tools/validate-modules.sh` (7 checks) before committing.
- For new modules or major changes, run `./secubox-tools/validate-module-generation.sh luci-app-<module>` and `./secubox-tools/local-build.sh full`.
- Install git hooks via `./secubox-tools/install-git-hooks.sh` so `pre-push-validation.sh` runs automatically.
- On devices: after deploying, run `ubus list`, `ubus call luci.<module> status`, `logread | grep -i error`, ensure LuCI tab loads, and rerun `./secubox-tools/fix-permissions.sh --remote`.

## Anti-Patterns (Do Not Do)
- ❌ Creating RPCD scripts without the `luci.` prefix or mismatching JS/ACL names (causes `-32000` errors).
- ❌ Hardcoding colors/fonts, or ignoring `[data-theme="dark"]` (breaks design system).
- ❌ Adding files without updating `menu.d`/`acl.d`, or leaving stale menu paths (causes HTTP 404 / unauthorized tabs).
- ❌ Shipping CSS/JS with executable permissions (403 errors) or RPCD scripts without 755 (permission denied).
- ❌ Bypassing validation/deploy scripts (risk of missing dependencies, wrong permissions, or no backups).
- ❌ Calling other modules’ ubus endpoints without documentation; share data through defined APIs only.
