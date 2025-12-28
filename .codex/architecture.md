# Architecture

## High-Level View
The SecuBox suite is a collection of LuCI packages that all share the same pattern:

1. **LuCI Views** (`htdocs/luci-static/resources/view/<module>/*.js`) build the UI using `view.extend`, `ui`, and DOM helpers. Views import per-module API helpers and shared CSS (`system-hub/common.css`, plus module-specific `.css`).
2. **API Helpers** (`htdocs/luci-static/resources/<module>/api.js`) declare ubus calls with `rpc.declare` and export a `baseclass.extend` instance that exposes typed methods (`getStatus`, `listServices`, etc.).
3. **RPCD Backend** (`root/usr/libexec/rpcd/luci.<module>`) receives `list`/`call` requests from ubus, executes shell or UCI logic, and emits JSON via `json_*` helpers.
4. **Navigation & ACL** (`root/usr/share/luci/menu.d/*.json`, `root/usr/share/rpcd/acl.d/*.json`) describe where the module appears in LuCI and who may access each ubus method.
5. **Deployment Tooling** (`deploy-module-template.sh`, `secubox-tools/*.sh`) automates copying files to routers, backing up, fixing permissions, clearing caches, and restarting `rpcd`/`uhttpd`.

System Hub and SecuBox provide “umbrella” tabs (`admin/secubox/...`) but each module is otherwise isolated and should not reach into another module's files unless explicitly documented (e.g., System Hub reading SecuBox theme preferences via `luci.secubox get_theme`).

## Data Flow
1. User opens `admin/secubox/.../<tab>` in LuCI.
2. Menu JSON loads `luci-static/resources/view/<module>/<view>.js`.
3. The view's `load()` issues `Promise.all([...API calls...])` to `api.js` helpers.
4. `api.js` uses `rpc.declare({object: 'luci.<module>', method: ...})` to talk to ubus.
5. ubus dispatches to `/usr/libexec/rpcd/luci.<module>`, which handles `list`/`call` requests, touches UCI/system services, and replies JSON.
6. View `render()` updates DOM components, sets up `poll.add` for periodic refresh, and attaches event handlers that call more RPC actions.
7. Deploy scripts copy updated JS/CSS/RPC/menu/ACL to the router, fix permissions, and restart `rpcd`/`uhttpd` to expose the changes.

## Boundaries & Dependency Rules
- Modules must keep JS, CSS, RPC, menu, and ACL files self-contained under their own directory; shared assets go in `system-hub/common.css` or `templates/`.
- Do not import code from another module's `htdocs/.../view` folder. Shared logic should be duplicated intentionally or moved into a common helper under `system-hub/` or a new shared location documented in `DEVELOPMENT-GUIDELINES.md`.
- Any ubus interaction between modules must be explicitly documented (e.g., System Hub calling `luci.secubox get_theme`). Otherwise, treat every `luci.<module>` namespace as private.
- Keep RPCD scripts shell-only unless the repo adds other interpreters; they must rely on standard OpenWrt utilities (`ubus`, `uci`, `/lib/functions.sh`, `/usr/share/libubox/jshn.sh`).

## Adding a New Module – Checklist
1. **Scaffold**: Copy `templates/luci-app-template` or an existing module directory and rename files (`PKG_NAME`, `LUCI_TITLE`, etc.).
2. **Implement RPCD**: Create `/root/usr/libexec/rpcd/luci.<module>` with `list`/`call`, JSON helpers, and method coverage for every UI action.
3. **Add API Helper**: In `htdocs/luci-static/resources/<module>/api.js` extend `baseclass` and declare each ubus call.
4. **Build Views**: Under `htdocs/luci-static/resources/view/<module>/` add `overview.js` plus additional tabs as needed. Include CSS via `<link>` to `system-hub/common.css` and module-specific files. Follow design system rules.
5. **Wire Menu/ACL**: Create `root/usr/share/luci/menu.d/luci-app-<module>.json` with the correct `admin/secubox/...` path and `firstchild` entry; create `root/usr/share/rpcd/acl.d/luci-app-<module>.json` enumerating read/write ubus methods.
6. **Docs**: Write `luci-app-<module>/README.md` describing purpose, features, install commands, and troubleshooting steps.
7. **Permissions**: Update `Makefile` with `PKG_FILE_MODES:=/usr/libexec/rpcd/luci.<module>:755` (and any other executables). Confirm CSS/JS remain 644.
8. **Validation & Build**: Run `./secubox-tools/fix-permissions.sh --local`, `./secubox-tools/validate-module-generation.sh luci-app-<module>`, and `./secubox-tools/local-build.sh build luci-app-<module>` before submitting.
