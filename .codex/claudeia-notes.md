# Claude Guidance Alignment

## Key Directives from `.claude/` and `CLAUDE.md`
1. **Read the docs first** – Always consult `DEVELOPMENT-GUIDELINES.md`, `QUICK-START.md`, and `CLAUDE.md` before coding. `.claude/README.md` reiterates this and links every critical guide.
2. **Naming & paths** – RPCD filename ≡ ubus object string (with `luci.` prefix) and menu `path` ≡ view path. Violations lead to `-32000` RPC errors or HTTP 404s.
3. **Permissions** – RPCD scripts/scripts under `/usr/libexec` need 755, web assets 644. Use `PKG_FILE_MODES` in Makefiles plus `./secubox-tools/fix-permissions.sh --local/--remote`.
4. **Validation** – Mandatory: `./secubox-tools/validate-modules.sh` (7 checks). For new modules use `validate-module-generation.sh`, and install pre-push hooks.
5. **Design system** – Use `system-hub/common.css` variables (`--sh-*`), gradients, `.sh-*` classes, Inter/JetBrains fonts, and dark-mode selectors. No hardcoded colors or fonts.
6. **Workflow** – Deploy via `deploy-module-template.sh` (with ROUTER env), fix perms, clear LuCI caches, restart `rpcd/uhttpd`. Build via `local-build.sh` or `make package/...`.
7. **Prompting** – `.claude/module-implementation-guide.md` provides a template for AI prompts, expecting all files (Makefile, README, RPCD, API, views, menu, ACL) plus validation outputs.

## Mapping to Codex Rules
- The Codex prime directive (protect RPC naming, menu paths, permissions, design system, validation) mirrors `.claude` rules; no conflicts.
- Our `workflows.md` codifies the same commands Claude expects (fix perms, validate, local-build, deploy scripts).
- The `prompting.md` templates derive from `.claude/module-implementation-guide.md` so Codex and Claude share the same deliverable expectations.
- Design constraints (dark mode, gradients, fonts) from `.claude/README.md` and `DEVELOPMENT-GUIDELINES.md` appear in `conventions.md` and `requirements.md`.

## Conflict Resolution
If `.claude` guidance ever diverges from repo truth, follow this priority chain (per instructions):
1. Source code & current repo configuration (Makefiles, scripts, actual files)
2. `.claude/` rules and `CLAUDE.md`
3. Markdown guides (`DEVELOPMENT-GUIDELINES.md`, `CODE-TEMPLATES.md`, etc.)
Flag any contradictions as TODOs in the relevant `.codex` file when discovered.
