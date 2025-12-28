# Codex Rules for SecuBox

## Prime Directive
Do not break module contracts: RPCD script names must equal their ubus objects, menu paths must match view files, ACLs must enumerate every exposed method, and every change must preserve the SecuBox design system (CSS variables, dark mode, typography) plus file permissions (RPCD 755, web assets 644). If a change risks violating these invariants, stop and request clarification.

## Change Scope Discipline
- Touch only the module(s) mentioned in the task. Shared assets (e.g., `system-hub/common.css`) require explicit justification.
- Keep diffs minimal: update JS + CSS + RPC + menu/ACL together only when they are logically tied.
- Document behavior changes in the relevant README or flag a TODO if the correct home is unclear.

## Mandatory Checks per Change Type
- **UI / CSS / View changes**:
  - Import `system-hub/common.css` + module CSS and follow `.sh-*` component patterns.
  - Provide `[data-theme="dark"]` selectors and avoid hardcoded colors.
  - Run `./secubox-tools/validate-modules.sh` to ensure menu/view alignment.
  - Manually test the LuCI tab or describe how to test (`ubus`, browser steps).
- **RPC / ubus changes**:
  - Update `htdocs/.../<module>/api.js`, `root/usr/libexec/rpcd/luci.<module>`, ACL JSON, and README/usage as needed.
  - Ensure RPCD `list` advertises all methods and `call` routes to handlers returning valid JSON.
  - Run `./secubox-tools/validate-module-generation.sh luci-app-<module>` and document sample `ubus call` output.
- **Configuration / UCI changes**:
  - Provide migration instructions (uci-defaults or README notes) and preserve backwards compatibility.
  - Update ACL if new config sections are accessed via RPC.
  - Mention manual steps (e.g., `/etc/init.d/<service> restart`).
- **Deploy/Tooling changes**:
  - Explain safety nets (backups, permission fixes).
  - Dry-run scripts or include commands for re-running (e.g., `ROUTER=... ./deploy-module-template.sh system-hub`).

## Security Rules
- Least privilege ACLs: never add ubus methods to `write` unless strictly necessary; justify any new ACL entry.
- Sanitize inputs and guard shell invocations in RPCD (no unchecked user data in `eval`/`sh -c`).
- Never surface private keys, credentials, or tokens in LuCI output.
- Enforce file permissions via `PKG_FILE_MODES` and `./secubox-tools/fix-permissions.sh`.

## OpenWrt-Specific Rules
- Use package dependencies consistent with module purpose (`+luci-base +rpcd` plus service-specific deps).
- Keep packages arch-independent unless compiling binaries (current repo uses `LUCI_PKGARCH:=all`).
- Validate JSON and shell scripts with `jsonlint` and `shellcheck` when touched.
- Respect CI workflows; replicate them locally via `./secubox-tools/local-build.sh build` before pushing.

## Stop Conditions & TODOs
- If documentation is missing or contradictory, log a `TODO` in the affected `.codex` file or module README describing what needs clarification before touching code.
- If you cannot confirm an invariant (e.g., unknown menu path or ubus method), halt and ask for the correct reference from `DEVELOPMENT-GUIDELINES.md` / `.claude`.
- For hardware-specific commands (e.g., device-specific firmware builds) where target details are unknown, respond with steps needed from the user rather than guessing.
