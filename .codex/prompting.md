# Prompting Templates
Use these templates when asking Codex (or any assistant) to perform work in this repository. Fill in the placeholders and include the validation commands listed so the change respects SecuBox standards.

## 1. Add a New LuCI Module
```
Goal: Create luci-app-<module> for <purpose/category>.
Features:
1. ...
2. ...
Backend service(s): ... (CLI commands/paths)
UI requirements: tabs/views + metrics/cards needed.
Dependencies: (packages, daemons, config files)
Deliverables:
- Makefile (PKG_NAME, deps, PKG_FILE_MODES)
- README.md (install, usage, troubleshooting)
- htdocs: view/<module>/*.js, <module>/api.js + CSS
- root/usr/libexec/rpcd/luci.<module>
- root/usr/share/luci/menu.d/luci-app-<module>.json
- root/usr/share/rpcd/acl.d/luci-app-<module>.json
Tests:
- ./secubox-tools/fix-permissions.sh --local
- ./secubox-tools/validate-module-generation.sh luci-app-<module>
- ./secubox-tools/local-build.sh build luci-app-<module>
```

## 2. Add a Dashboard Widget to an Existing Module
```
Module/view to update: luci-app-<module> (view/<module>/<view>.js)
Widget purpose: (metrics, chart, status)
Data source: RPC method(s) or static content
Design requirements: (sh-card, sh-stats-grid, icons, auto-refresh interval)
Also update: CSS file? API helper? README section?
Validation:
- ./secubox-tools/validate-modules.sh
- Manual test steps (open admin/secubox/.../<view>, confirm widget renders)
```

## 3. Add a New ubus Method + LuCI Client
```
Module: luci-app-<module>
Method name: <method>
Parameters: {...}
Backend behavior: (what RPCD does, commands run, JSON shape)
UI hook: (button/form/action invoking the method)
Files to touch:
- htdocs/.../<module>/api.js (rpc.declare)
- htdocs/.../<module>/<view>.js (UI wiring)
- root/usr/libexec/rpcd/luci.<module> (implement method)
- root/usr/share/rpcd/acl.d/luci-app-<module>.json (permissions)
Validation/tests:
- ubus call luci.<module> <method> '{"..."}'
- ./secubox-tools/validate-module-generation.sh luci-app-<module>
```

## 4. Change ACL / Permissions Safely
```
Module: luci-app-<module>
Reason for ACL change: (new method, tightened access)
New methods to expose: [list]
Read vs write access requirements:
Files to update:
- root/usr/share/rpcd/acl.d/luci-app-<module>.json
- Any README or docs referencing permissions
Tests:
- jsonlint root/usr/share/rpcd/acl.d/luci-app-<module>.json
- ./secubox-tools/validate-modules.sh (ensures ACL covers RPC methods)
```

## 5. Fix Packaging / Makefile Issues
```
Module: luci-app-<module>
Problem: (missing PKG_FILE_MODES, wrong deps, version bump)
Required updates:
- Makefile fields (PKG_VERSION, PKG_RELEASE, LUCI_DEPENDS, PKG_FILE_MODES)
- Add/remove files from install sections?
Validation:
- ./secubox-tools/secubox-repair.sh (optional)
- ./secubox-tools/local-build.sh build luci-app-<module>
- ./secubox-tools/validate-modules.sh
```

## 6. Improve Deploy Scripts
```
Script to change: deploy-module-template.sh / deploy-<target>.sh / secubox-tools/<script>
Goal: (copy new file types, add sanity checks, change backup strategy)
Environment assumptions: ROUTER env, SSH availability, backup paths, permission fixes.
Acceptance:
- Script runs non-destructively when ROUTER is set.
- Backups created under /root/luci-backups/<timestamp>.
- Permissions reset via chmod + remote fix-permissions script.
Validation:
- shellcheck <script>
- Dry-run on staging router or describe how to test.
```
