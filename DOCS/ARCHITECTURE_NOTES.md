# SecuBox Architecture Notes

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

These notes summarize the repository structure, conventions, and supporting tooling gathered from `README.md`, `DOCS/QUICK-START.md`, `DOCS/DEVELOPMENT-GUIDELINES.md`, `DOCS/CODEX.md`, `DOCS/DOCUMENTATION-INDEX.md`, the various module READMEs, and the `secubox-tools/` scripts. Use this as a rapid orientation before extending the platform.

---

## Repository Layout (high level)

- **LuCI modules (`luci-app-*`)** – Each app bundles a LuCI frontend (JS under `htdocs/luci-static`), RPCD backend (shell scripts in `root/usr/libexec/rpcd/`), UCI defaults (`root/etc/config/...`), ACL/menu descriptors, and module-specific README (see e.g. `luci-app-netdata-dashboard/README.md`). Naming conventions follow the “menu path = view path” and “RPC object name = file name” rules emphasized in `DOCS/QUICK-START.md`.
- **Themes (`luci-theme-secubox`)** – Provides the shared SecuBox design tokens (`sh-*`, `sb-*` classes, palette, typography). All new UI should import `secubox-theme/secubox-theme.css` and leverage the CSS variables described in `DOCS/DEVELOPMENT-GUIDELINES.md`.
- **Core orchestration apps**
  - `luci-app-secubox`: global hub UI.
  - `luci-app-system-hub`: system health/remote assistance.
  - `luci-app-network-modes`: prebuilt router/sniffer modes (bridges, AP, relay, etc.).
  - `luci-app-vhost-manager`: reverse-proxy/vhost configuration (existing baseline for future work).
- **Tooling (`secubox-tools/`)** – Bash/POSIX scripts for validation, building, deployment, permission repair, etc. The README documents workflows such as `validate-modules.sh`, `local-build.sh`, `fix-permissions.sh`, and `deploy-*.sh`. The newer `secubox-app` helper consumes manifests under `/usr/share/secubox/plugins/` to install and configure “apps”.
- **Automation & Docs**
  - `DOCS/` + `docs/`: mirrored, versioned documentation tree (design system, prompts, module templates, validation, permissions, etc.).
  - `EXAMPLES/` and `templates/`: snippets and scaffolding.
  - CI workflows live in `.github/workflows/` (referenced from README badges).

---

## Coding & Packaging Standards

Summarized from `DOCS/QUICK-START.md`, `DOCS/DEVELOPMENT-GUIDELINES.md`, and `DOCS/CODEX.md`:

1. **RPCD/ubus**
   - RPC script filename **must** equal the ubus object (e.g., `root/usr/libexec/rpcd/luci.netdata-dashboard` ⇒ `object: 'luci.netdata-dashboard'`).
   - RPC scripts are executable (755) while JS/CSS assets are 644.
   - ACL and menu JSON entries shipped under `root/usr/share/rpcd/acl.d/` and `root/usr/share/luci/menu.d/`.
2. **LuCI Views**
   - Menu `path` mirrors `htdocs/luci-static/resources/view/...` location.
   - Use the SecuBox design system (`sh-*`/`sb-*` classes, Inter + JetBrains Mono, gradients). Avoid inline styles; rely on variables defined in `system-hub/common.css` or `secubox-theme`.
3. **UCI-first configuration**
   - Every feature stores runtime state in `/etc/config/<module>`.
   - CLI/scripts mutate config via `uci set/commit` and services watch UCI for changes.
4. **Service supervision**
   - Prefer `procd` init scripts (`/etc/init.d/<service>`) for daemons; ensure restart semantics and `ENABLE` flags.
5. **Validation workflow**
   - Run `./secubox-tools/validate-modules.sh` before PRs/releases. It checks permissions, RPC naming, LuCI assets, etc.
   - Use `./secubox-tools/local-build.sh build <module>` for SDK builds; `fix-permissions.sh` to normalize deployments.

---

## Networking & Firewall Conventions

Derived from `luci-app-network-modes`, `luci-app-client-guardian`, and docs:

- Network modes (router/sniffer/AP) are implemented via UCI (`/etc/config/network`, `/etc/config/wireless`) with helper scripts ensuring safe defaults and backups before applying.
- Firewall zones follow OpenWrt defaults (lan/wan) with additional zones per feature (IoT, Guest, Quarantine). Changes should add backup/rollback paths and never remove LAN management access.
- Reverse proxy/vhost management currently relies on `luci-app-vhost-manager`; new work should extend its UCI schema rather than inventing a parallel config.

---

## Storage & Runtime Expectations

- Target platform: OpenWrt 24.10.x (and preview 25.12 RC) on ARM64 per `README.md`. Flash is limited; prefer `/srv` or external storage for large artifacts (Docker/LXC images).
- Overlay space must be <90% before deploying; quick-start docs include SSH check commands.
- `/tmp` is tmpfs; don’t store persistent state there. Use `/srv/<app>` (Zigbee2MQTT), `/var/lib/<app>`, or configurable data roots.

---

## secubox-tools Highlights

- `validate-modules.sh` – structural lint, permissions, ubus paths.
- `local-build.sh` – OpenWrt SDK automation for building/testing packages (supports multiple arches).
- `fix-permissions.sh`, `deploy-*.sh` – remote deployment helpers with backup/restore.
- These scripts are POSIX shell friendly and should be leveraged (or extended) for new installers/diagnostics.

---

## Existing Modules & Patterns

- **Monitoring dashboards** (Netdata, Netifyd, CrowdSec, WireGuard, Traffic Shaper, Bandwidth Manager) provide consistent patterns for:
  - RPC APIs returning JSON for LuCI views.
  - JS views using `view.extend`, `poll` auto-refresh, and stat cards built with design system classes.
- **Security & NAC modules** (Client Guardian, Auth Guardian) showcase how to integrate with firewall/zones, handle ACL, and present complex forms in LuCI.
- **Network orchestration** (Network Modes, System Hub) demonstrates multi-step wizards, health checks, and service controls.
- **Theme & Navigation** (luci-theme-secubox, luci-app-secubox) define tab components, cascade helpers, and global CSS/JS assets.

Use these modules as references when building new “apps” to ensure consistent UX, RPC layout, and packaging.

---

## Documentation Requirements

- Every new or edited `.md` must follow the metadata header and versioning rules defined in `DOCS/DOCUMENTATION-INDEX.md`.
- Cross-link relevant guides (Quick Start, Dev Guidelines, Codex) when introducing new features.
- For platform-level additions (App Store, Vhost manager, DMZ mode, etc.), update both `DOCS/` and `docs/` to keep mkdocs + markdown parity.

---

## Future Work Context

`TODO-ANALYSE.md` highlights ongoing documentation and automation initiatives:
- Standardize version headers across documentation.
- Add “See Also” cross-links.
- Maintain an archive folder for legacy docs.
- Build new testing/performance/security guides.

Keep these in mind when touching docs or adding new features so we converge toward the roadmap.

---

This document will evolve alongside the App Store, Docker/LXC frameworks, and new wizard/profile systems. Update it whenever repository architecture or workflows change significantly.
