# SecuBox Architecture Notes

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

These notes capture the current repository structure, conventions, and supporting tooling after scanning the tree (`luci-app-*`, `secubox-tools/`, `secubox-app-*`, `scripts/`), the root `README.md`, and the docs set (`docs/`, `DOCS/`, `TODO-ANALYSE.md`, `secubox-tools/README.md`, `scripts/README.md`, `docs/module-status.md`, `docs/claude.md`, `docs/documentation-index.md`). Treat this file as the canonical orientation guide before extending the platform.

---

## 1. Repository Layout

- **LuCI applications (`luci-app-*`)**  
  Each module ships a LuCI frontend (`htdocs/luci-static/resources/...`), RPCD backend (POSIX shell in `root/usr/libexec/rpcd/luci.<module>`), menu + ACL JSON, optional CSS, and a module-specific README. Views follow the “menu path == file path” rule stressed in the documentation.

- **Device/service packages (`secubox-app-*`)**  
  Native packages that install supporting services or CLIs (e.g., `secubox-app-zigbee2mqtt` installs `/etc/config/zigbee2mqtt`, `/etc/init.d/zigbee2mqtt`, and `/usr/sbin/zigbee2mqttctl`). These expose helpers that LuCI apps consume.

- **Themes & shared assets**  
  `luci-theme-secubox` carries the design system (dark palette, `sh-*`/`sb-*` classes, Inter + JetBrains Mono). Every LuCI view imports `secubox-theme/secubox-theme.css` plus module-specific CSS as needed.

- **Tooling (`secubox-tools/`)**  
  Contains validation (`validate-modules.sh`), build automation (`local-build.sh`), permission repair, deployment helpers, and debug loggers. These scripts mirror GitHub Actions workflows and should be reused for new installer/test tooling. The `secubox-app` CLI now lives here as well, consuming manifests under `/usr/share/secubox/plugins/` to install and configure “apps”.

- **Automation/scripts (`scripts/`)**  
  Hosts documentation publishing helpers plus existing diagnostics/smoke scripts. New repo-wide diagnostics should live alongside them.

- **Docs**  
  Two mirrored trees (`docs/` and uppercase `DOCS/`) feed MkDocs and the GitHub wiki. All Markdown follows the metadata template defined in `docs/documentation-index.md`.

- **Profiles & App Manifests**  
  App manifests now live under `/usr/share/secubox/plugins/`, profiles under `/usr/share/secubox/profiles/`. `luci-app-secubox` exposes both through the wizard (UI) and `secubox-app` CLI (automation).

---

## 2. Target Platforms & Build System

- **Supported OpenWrt targets:** ARM64 (aarch64-cortex-a53/a72/generic), x86_64, and legacy MIPS variants (per `secubox-tools/local-build.sh` + README badges).  
- **Package formats:** `.ipk` for ≤24.10, `.apk` for 25.12/SNAPSHOT (handled automatically by `local-build.sh`).  
- **CI:** GitHub workflows (`.github/workflows/build-openwrt-packages.yml`, `test-validate.yml`) validate and build all modules. Local parity is achieved via `secubox-tools/local-build.sh full`.  
- **Validation:** `./secubox-tools/validate-modules.sh` runs seven structural checks (RPC naming, menu/view parity, permissions, JSON lint, etc.). `fix-permissions.sh` enforces 755 for RPCD scripts and 644 for CSS/JS.

---

## 3. Configuration & Runtime Patterns

- **UCI-first approach:** Every feature stores runtime state in `/etc/config/<module>`. CLIs/editors mutate entries via `uci set/commit`, and procd services read from UCI (see `secubox-app-zigbee2mqtt` or `luci-app-vhost-manager`).
- **Service supervision:** Daemons use `/etc/init.d/<name>` with `USE_PROCD=1`. Procd wrappers call helper CLIs (e.g., `/usr/sbin/zigbee2mqttctl service-run`).
- **RPCD backends:** Implemented in POSIX shell. Filename equals ubus object (`root/usr/libexec/rpcd/luci.zigbee2mqtt` => `object: 'luci.zigbee2mqtt'`). They orchestrate UCI, system utilities, Docker, etc.
- **LuCI frontends:** Built with `view.extend` and the SecuBox design components (stat cards, tab strips, forms). Each module includes `api.js` wrappers that call the matching ubus object. Auto-refresh uses `poll()` or manual timers.
- **Logging/diagnostics:** `secubox-log` helper aggregates module activity under `/var/log/seccubox.log`. Additional repo-wide diagnostics live under `scripts/diagnose.sh`.

---

## 4. Network & Security Conventions

- **Firewall & zones:** Modules such as `luci-app-client-guardian` and `luci-app-network-modes` manipulate UCI firewall sections. They always backup configs before applying and keep the LAN management path reachable.
- **Network modes:** `luci-app-network-modes` already models router/relay/AP/sniffer modes with wizards + rollback. Any future “profile” or “DMZ” work should reuse its UCI techniques and UI flow.
- **Reverse proxy:** `luci-app-vhost-manager` manages `/etc/config/vhosts`, renders nginx configs, handles basic auth, and integrates ACME. It is the baseline for any new vhost/TLS features.
- **Access control:** ACL JSON lives in `root/usr/share/rpcd/acl.d/`. `docs/permissions-guide.md` plus `DOCS/CODEX.md` enumerate the ubus permissions each module should request.

---

## 5. Existing App Ecosystem (Snapshot)

From `docs/module-status.md` and module READMEs:

- **Core dashboards:** `luci-app-secubox`, `luci-app-system-hub`.
- **Security/monitoring:** CrowdSec, Netdata, Netifyd, WireGuard, Client Guardian, Auth Guardian.
- **Network orchestration:** Network Modes, Traffic Shaper, Bandwidth Manager, Media Flow, CDN Cache.
- **Device apps:** Zigbee2MQTT already ships as `secubox-app-zigbee2mqtt` + `luci-app-zigbee2mqtt`.
- **Reverse proxy:** `luci-app-vhost-manager`.

These modules provide working references for RPC patterns, UI layouts, wizards, and integration with system services.

---

## 6. Documentation Standards & Roadmap

- Every Markdown file must include `Version/Last Updated/Status` headers (per `docs/documentation-index.md` and `TODO-ANALYSE.md`).  
- Cross-link related docs (Quick Start ↔ Development Guidelines ↔ Codex).  
- Archive stale docs under `docs/archive/`.  
- `TODO-ANALYSE.md` tracks ongoing documentation work (version standardization, cross-references, architecture diagrams). Keep this file updated when touching docs.

---

## 7. Key Takeaways for Future Work

1. **Extend, don’t fork:** Build new features (Docker apps, App Store, wizard, DMZ mode) on top of existing packages (Zigbee2MQTT installer, Network Modes, VHost Manager) instead of introducing parallel systems.
2. **Reuse tooling:** Diagnostics, smoke tests, and installers should hook into `secubox-tools/` or `scripts/` so they can be invoked locally and in CI.
3. **Stay POSIX + UCI driven:** Shell scripts, UCI config, and procd remain the glue for Docker/LXC orchestration on resource-constrained routers.
4. **Document everything twice:** Update both `docs/` (MkDocs) and `DOCS/` (wiki) trees when adding guides such as the requested embedded notes.

These notes should be revised whenever new components (App Store, wizard, profiles, DMZ, Docker/LXC frameworks) land so contributors always have an up-to-date architectural map.
