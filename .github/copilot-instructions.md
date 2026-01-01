# Copilot / AI assistant instructions for SecuBox

Short, actionable notes to help an AI coding agent become productive immediately in this repository.

1. Big picture
- This repo is a collection of LuCI OpenWrt packages (each `luci-app-*` is a self-contained module). Key folders: `luci-app-secubox/`, `luci-app-system-hub/`, `secubox-tools/`, `templates/`, and `.github/workflows/` (CI builds multi-arch OpenWrt packages).

2. Critical conventions (must follow)
- RPCD ubus objects ALWAYS use the `luci.` prefix and the RPCD filename must match the object (e.g. backend `root/usr/libexec/rpcd/luci.system-hub` → JS uses `object: 'luci.system-hub'`).
- Menu JSON path must match view file paths: menu action `path: "netifyd-dashboard/overview"` → view at `htdocs/luci-static/resources/view/netifyd-dashboard/overview.js`.
- File permissions: RPCD scripts `755`, CSS/JS `644`. Use `./secubox-tools/fix-permissions.sh --local` before commits.

3. Build, validate, deploy (commands you should use)
- Quick validation: `./secubox-tools/validate-modules.sh` (7 checks: RPCD names, menu paths, JSON, permissions, ubus naming, view existence, htdocs perms).
- Local reproduce of CI: `./secubox-tools/local-build.sh build` or `./secubox-tools/local-build.sh build luci-app-system-hub`.
- OpenWrt SDK builds: `make package/luci-app-<module>/compile V=s` (when inside the OpenWrt SDK tree).
- Install on device: `scp bin/packages/*/base/luci-app-*.ipk root@router:/tmp/` then `opkg install /tmp/luci-app-*.ipk` and restart services (`/etc/init.d/rpcd restart`).

4. Important files to consult (examples)
- Global developer guides: `README.md`, `DOCS/CLAUDE.md`, `docs/development-guidelines.md` (contains naming, CSS, JS, and RPCD patterns).
- Validation & tooling: `secubox-tools/validate-modules.sh`, `secubox-tools/local-build.sh`, `secubox-tools/fix-permissions.sh`.
- CI: `.github/workflows/build-openwrt-packages.yml`, `.github/workflows/test-validate.yml`.

5. Frontend ↔ backend patterns to preserve
- Frontend API modules live under `htdocs/luci-static/resources/` (example: `htdocs/.../api.js`). They call ubus objects declared like `object: 'luci.<module>'` and expect JSON responses.
- Backends are simple shell RPCD scripts under `root/usr/libexec/rpcd/` that must emit JSON to stdout and be executable.

6. Style & UI rules (enforced by docs)
- Use CSS variables defined in the design system (`system-hub/common.css` and the docs). Never hardcode palette colors; prefer `var(--sh-*)` variables.
- Page header and card patterns are required (`.sh-page-header`, `.sh-card` with 3px top border). See `docs/development-guidelines.md` for exact components.

7. When you change package metadata
- Keep `PKG_VERSION` and `LUCI_TITLE` in the package `Makefile` in sync with UI version chips (UI reads package control info). Update `README.md` in the package folder too.

8. Integration & edge cases
- Builds target multiple architectures; running the `local-build.sh` with `--arch` mimics CI. Packaging format may be `.ipk` or `.apk` depending on `OPENWRT_VERSION` (see `DOCS/CLAUDE.md`).
- When investigating runtime failures on a device, check permissions, ubus object names, and menu path mismatches first — these are the most frequent causes.

9. Quick heuristics for edits
- Changing a view: update the JS under `htdocs/luci-static/resources/view/<module>/`, ensure menu JSON `root/usr/share/luci/menu.d/*.json` path matches, run validation script.
- Adding backend RPC: add `root/usr/libexec/rpcd/luci.<module>` executable, add ACL JSON in `root/usr/share/rpcd/acl.d/`, run `validate-modules.sh` and `shellcheck` on the script.

10. Ask the maintainer when uncertain
- If a change affects CI packaging, architectures, or the `OPENWRT_VERSION` used by `local-build.sh`, ask before modifying `.github/workflows/*` or `secubox-tools` defaults.

Please review these notes — tell me which areas need more detail (examples, diffs, or workflow snippets) and I will iterate.
