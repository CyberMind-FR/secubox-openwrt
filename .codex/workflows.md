# Workflows

## Setup
1. **Normalize permissions**
   ```bash
   ./secubox-tools/fix-permissions.sh --local
   ```
2. **Install git hooks** (pre-push validator)
   ```bash
   ./secubox-tools/install-git-hooks.sh
   ```
3. **Run the baseline validation** (7 checks)
   ```bash
   ./secubox-tools/validate-modules.sh
   ```
4. **Cache the SDK and validate via local-build**
   ```bash
   ./secubox-tools/local-build.sh validate
   ```
5. **Inspect module status & docs** using `DOCUMENTATION-INDEX.md`, `MODULE_STATUS.md`, and each module’s README before editing.

## Build Packages
- **Single module via SDK**
  ```bash
  make package/luci-app-<module>/compile V=s
  ```
- **Local CI-equivalent build**
  ```bash
  ./secubox-tools/local-build.sh build luci-app-<module>
  # or build all architectures
  ./secubox-tools/local-build.sh build
  ```
- **Firmware images** (preload SecuBox packages)
  ```bash
  ./secubox-tools/local-build.sh build-firmware mochabin
  ```

## Run / Validate on a Device
1. Copy the package or run the standardized deploy script:
   ```bash
   ROUTER=root@192.168.8.191 ./deploy-module-template.sh system-hub
   # For other modules: replace system-hub, script backs up, copies JS/CSS/RPCD/menu/ACL, fixes perms, clears cache, restarts rpcd/uhttpd.
   ```
2. Fix remote permissions & restart services (safety net):
   ```bash
   ./secubox-tools/fix-permissions.sh --remote root@192.168.8.191
   ```
3. Functional smoke tests:
   ```bash
   ssh root@router "ubus list | grep luci.<module>"
   ssh root@router "ubus call luci.<module> status"
   ssh root@router "/etc/init.d/rpcd restart && /etc/init.d/uhttpd restart"
   ```
4. Clear LuCI cache if manual copy: `rm -f /tmp/luci-indexcache /tmp/luci-modulecache/*`.

## Linting & Formatting
- JSON: `jsonlint root/usr/share/luci/menu.d/*.json root/usr/share/rpcd/acl.d/*.json`
- Shell scripts: `shellcheck root/usr/libexec/rpcd/* secubox-tools/*.sh`
- Ubux objects: `./secubox-tools/validate-module-generation.sh luci-app-<module>`

## CI Overview
- **build-openwrt-packages.yml** – Multi-arch SDK builds (.ipk/.apk) triggered on push/PR/tags/workflow_dispatch.
- **test-validate.yml** – Runs validation scripts, shellcheck, JSON lint.
- **build-secubox-images.yml** – Builds firmware images per device profile.
Use `Actions > Run workflow` with inputs (package name, OpenWrt version, architectures) to trigger manual builds.

## Release & Deploy
1. **Tag release**
   ```bash
   git tag -a v1.x.y -m "Release notes"
   git push origin v1.x.y
   ```
2. **Use deploy modules script** for router installs; for combined releases, run `deploy-system-hub.sh`, `deploy-secubox-dashboard.sh`, or other `deploy-*.sh` wrappers which copy relevant files, call `fix-permissions`, clear caches, and restart services.
3. **Post-deploy validation**: `ubus list`, `logread | grep -i error`, open the LuCI tab in a private browser window to bypass cache.
4. **Rollback plan**: `deploy-module-template.sh` creates backups under `/root/luci-backups/<timestamp>`; restore manually via `scp` if needed.

## Debugging Cookbook (Top Issues)
1. **HTTP 404 for view** – Menu path mismatch; fix `root/usr/share/luci/menu.d/*.json` to match `htdocs/.../view/<module>/<view>.js`, redeploy, flush LuCI cache.
2. **RPC -32000 Object not found** – RPCD script name or permissions wrong; rename to `luci.<module>`, ensure 755, restart `rpcd`.
3. **403 on CSS/JS** – File deployed with 600/700 perms; run `./secubox-tools/fix-permissions.sh --remote` targeting the router.
4. **Design regression** – Missing CSS variables or dark mode selectors; re-import `system-hub/common.css`, replace hardcoded colors with `var(--sh-*)`, add `[data-theme="dark"]` overrides.
5. **Menu not showing** – ACL missing the module or dependencies unsatisfied; update ACL JSON and confirm `depends.acl` in menu entry includes your package.
6. **Build fails in CI** – Run `./secubox-tools/local-build.sh full` locally; check for missing Makefile fields or JSON syntax errors.
7. **ubus returns malformed JSON** – Ensure RPCD handlers call `json_init`, `json_add_*`, `json_dump` for every branch.
8. **LuCI JS error “factory yields invalid constructor”** – API modules must export `baseclass.extend`, not plain objects; instantiate via `.new()` in views when necessary.
9. **Device storage full** – Pre-deploy check `df -h | grep overlay`; remove `/tmp/*.ipk` or `/root/luci-backups/*` as suggested in `QUICK-START.md`.
10. **Permissions drift after manual SCP** – Always run `./secubox-tools/fix-permissions.sh --remote <router>` after copying files outside the deploy scripts.
