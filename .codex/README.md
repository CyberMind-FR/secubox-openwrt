# Codex Configuration for SecuBox OpenWrt

This `.codex/` directory captures the working agreements for Codex when editing the SecuBox OpenWrt feed. Every section is sourced from the local documentation (`README.md`, `DEVELOPMENT-GUIDELINES.md`, `CLAUDE.md`, `QUICK-START.md`, `DOCUMENTATION-INDEX.md`, `VALIDATION-GUIDE.md`, `PERMISSIONS-GUIDE.md`, `CODE-TEMPLATES.md`, `MODULE-IMPLEMENTATION-GUIDE.md`, etc.) plus the `.claude/` guidance. Follow these notes before touching any LuCI module, RPC backend, CSS, or deployment script.

Use these files as checkpoints:
- `context.md`: what the suite is and how the repository is organized
- `requirements.md`: functional and non-functional expectations
- `architecture.md`: how data flows between LuCI views, RPCD, and system services
- `conventions.md`: naming, packaging, ACL, CSS, and JavaScript standards
- `workflows.md`: validated procedures for setup, build, deploy, release, and debugging
- `rules.md`: enforceable guardrails Codex must respect before shipping any change
- `prompting.md`: templates for requesting contributions from Codex or other AIs
- `claudeia-notes.md`: how the existing Claude guidance maps onto Codex rules

Always cross-check instructions here with the source docs referenced above. When documentation conflicts, prioritize: repository source files → `.claude` rules → markdown guides.

## First 5 Commands to Run in this Repo
1. `./secubox-tools/fix-permissions.sh --local` — normalize RPCD (755) and web assets (644) before editing
2. `./secubox-tools/validate-modules.sh` — run the 7 critical checks (RPCD names, menu paths, JSON, permissions, etc.)
3. `./secubox-tools/install-git-hooks.sh` — installs the pre-push validator so mistakes are caught automatically
4. `./secubox-tools/local-build.sh validate` — replicates the CI validation locally using the OpenWrt SDK cache
5. `./secubox-tools/local-build.sh build luci-app-<module>` — builds the module you are changing (use the exact package name)

Refer back to this README whenever you onboard a new contributor or need to explain how `.codex/` should be used in the SecuBox OpenWrt repository.
