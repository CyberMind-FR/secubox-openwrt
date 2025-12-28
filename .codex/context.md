# SecuBox Context

## What SecuBox OpenWrt Suite Is
SecuBox is a suite of LuCI applications that ship advanced security, monitoring, and automation dashboards for OpenWrt routers. Each `luci-app-*` package combines LuCI JavaScript views, RPCD backends, UCI integration, ACL policies, and shared CSS built on the SecuBox design system (dark-first palette, Inter + JetBrains Mono). GitHub Actions builds the packages for every supported architecture (`x86`, `ARM`, `MIPS`) and the repo also carries tooling for validation, repair, deployment, and firmware image creation.

## Repository Layout
- `.claude/` – authoritative assistant guidance, prompts, and settings
- `.github/workflows/` – CI definitions (package build matrix, validation, firmware images)
- `luci-app-*/` – one directory per LuCI module (Makefile, README, `htdocs/`, `root/`)
- `secubox-tools/` – validation/build/deploy helpers (`local-build.sh`, `validate-modules.sh`, etc.)
- `templates/` – scaffolding for new LuCI packages
- Root docs: `README.md`, `QUICK-START.md`, `DEVELOPMENT-GUIDELINES.md`, `CLAUDE.md`, `DOCUMENTATION-INDEX.md`, `CODE-TEMPLATES.md`, `FEATURE-REGENERATION-PROMPTS.md`, `MODULE_STATUS.md`, `PERMISSIONS-GUIDE.md`, `VALIDATION-GUIDE.md`, etc.
- Deploy scripts: `deploy-module-template.sh`, `deploy-*.sh` (system hub, secubox, beta releases, etc.)
- Test fixtures: `test-direct.js`, `test-modules-simple.js`

## Module Map (Purpose & Entry Points)
Each module follows the same structure: `Makefile`, module-specific README, JavaScript views under `htdocs/luci-static/resources/view/<module>/`, API helpers under `htdocs/luci-static/resources/<module>/api.js`, CSS in the same folder, RPCD backend in `root/usr/libexec/rpcd/luci.<module>`, menu JSON under `root/usr/share/luci/menu.d/`, and ACL JSON under `root/usr/share/rpcd/acl.d/`.

| Module | Purpose | Primary Views (JS) |
|--------|---------|--------------------|
| `luci-app-secubox` | Central SecuBox hub (module launcher, dashboard, dev status) | `secubox/dashboard.js`, `modules.js`, `modules-minimal.js`, `dev-status.js`, `alerts.js`, `monitoring.js`, `settings.js`
| `luci-app-system-hub` | System control center (health, services, diagnostics, remote) | `system-hub/overview.js`, `health.js`, `services.js`, `components.js`, `logs.js`, `backup.js`, `diagnostics.js`, `remote.js`, `settings.js`, `dev-status.js`
| `luci-app-crowdsec-dashboard` | CrowdSec decision, alerts, bouncer management | `crowdsec-dashboard/overview.js`, `alerts.js`, `decisions.js`, `bouncers.js`, `metrics.js`, `settings.js`
| `luci-app-netdata-dashboard` | Netdata monitoring integration | `netdata-dashboard/dashboard.js`, `system.js`, `network.js`, `processes.js`, `realtime.js`, `settings.js`
| `luci-app-netifyd-dashboard` | DPI / application intelligence | `netifyd-dashboard/overview.js`, `applications.js`, `devices.js`, `flows.js`, `risks.js`, `talkers.js`, `settings.js`
| `luci-app-network-modes` | Switch router/AP/bridge/sniffer modes | `network-modes/overview.js`, `wizard.js`, `sniffer.js`, `accesspoint.js`, `relay.js`, `router.js`, `settings.js`
| `luci-app-wireguard-dashboard` | WireGuard VPN monitoring/config | `wireguard-dashboard/overview.js`, `peers.js`, `traffic.js`, `config.js`, `settings.js`, `qrcodes.js`
| `luci-app-client-guardian` | NAC + captive portal + parental controls | `client-guardian/overview.js`, `clients.js`, `zones.js`, `portal.js`, `captive.js`, `alerts.js`, `parental.js`, `settings.js`, `logs.js`
| `luci-app-auth-guardian` | Authentication/voucher/OAuth portal | `auth-guardian/overview.js`, `sessions.js`, `vouchers.js`, `oauth.js`, `splash.js`, `bypass.js`
| `luci-app-bandwidth-manager` | QoS, quotas, priority classes | `bandwidth-manager/overview.js`, `classes.js`, `rules.js`, `schedules.js`, `media.js`, `clients.js`, `usage.js`, `quotas.js`, `settings.js`
| `luci-app-media-flow` | Streaming/media traffic analytics | `media-flow/dashboard.js`, `services.js`, `clients.js`, `history.js`, `alerts.js`
| `luci-app-cdn-cache` | Local CDN cache policies & stats | `cdn-cache/overview.js`, `policies.js`, `cache.js`, `statistics.js`, `maintenance.js`, `settings.js`
| `luci-app-vhost-manager` | Virtual hosts & SSL orchestration | `vhost-manager/overview.js`, `vhosts.js`, `internal.js`, `redirects.js`, `ssl.js`, `certificates.js`, `logs.js`
| `luci-app-traffic-shaper` | Advanced traffic shaping presets | `traffic-shaper/overview.js`, `classes.js`, `rules.js`, `stats.js`, `presets.js`
| `luci-app-ksm-manager` | Secure key/certificate management | `ksm-manager/overview.js`, `keys.js`, `secrets.js`, `certificates.js`, `ssh.js`, `hsm.js`, `audit.js`, `settings.js`

(Modules not listed explicitly above share the same structure; inspect each `luci-app-*/htdocs/luci-static/resources/view/<module>/` directory for the definitive entrypoints.)

## Stack & Integration Points
- **Frontend**: LuCI JavaScript views (`view.extend`) + SecuBox design system CSS. Every view imports the per-module `api.js` module for ubus calls and includes shared styles like `system-hub/common.css`.
- **Backend**: RPCD shell scripts under `root/usr/libexec/rpcd/luci.<module>` expose ubus methods (`status`, `get_*`, `set_*`, etc.). Modules often also ship helper scripts under `/usr/libexec/secubox/` and UCI defaults under `root/etc/uci-defaults/`.
- **UBus / RPC**: JavaScript uses `rpc.declare` with `object: 'luci.<module>'`. RPCD `list` and `call` cases must mirror these names.
- **Menu/ACL**: JSON files in `root/usr/share/luci/menu.d/` and `root/usr/share/rpcd/acl.d/` keep navigation and permissions consistent with the views and RPCD backend.
- **Packaging**: OpenWrt LuCI package Makefiles include `luci.mk`, define `PKG_FILE_MODES` for executable scripts (typically RPCD 755), and mark packages as `LUCI_PKGARCH:=all` because they are script-only.

## Glossary
- **LuCI** – OpenWrt web interface framework (Lua backend + JS frontend)
- **RPCD** – Daemon providing ubus RPC endpoints; modules drop scripts in `/usr/libexec/rpcd/`
- **ubus** – OpenWrt message bus used for remote procedure calls
- **UCI** – Unified Configuration Interface (files in `/etc/config/`)
- **ACL** – RPCD permission JSON files in `/usr/share/rpcd/acl.d/`
- **PKG_FILE_MODES** – Makefile variable forcing specific permissions for installed files
- **SecuBox Design System** – Shared CSS variables (`--sh-*`) and components defined in `system-hub/common.css`
- **Validation suite** – `./secubox-tools/validate-modules.sh`, `validate-module-generation.sh`, `pre-push-validation.sh`
- **Deploy script** – `deploy-module-template.sh` (backup, copy JS/CSS/RPCD/menu/ACL, fix perms, restart services)
- **Fix permissions** – Always run `./secubox-tools/fix-permissions.sh --local` before committing and `--remote <router>` after deploying to enforce `644` web assets / `755` executables
