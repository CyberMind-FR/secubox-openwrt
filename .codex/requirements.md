# Requirements

## Functional Requirements
- **luci-app-secubox**: Provide a central dashboard showing module status, monitoring cards, module launchers, alerts, and developer status (views `dashboard.js`, `modules*.js`, `dev-status.js`).
- **luci-app-system-hub**: Expose health scoring, service control, diagnostics, backup/restore, remote access, and the bonus development status tab with matching widgets (`overview.js`, `services.js`, `components.js`, `logs.js`, `backup.js`, `diagnostics.js`, `remote.js`, `dev-status.js`).
- **luci-app-crowdsec-dashboard**: Surface CrowdSec bans, alerts, bouncer state, metrics, and configuration actions (views `overview.js`, `alerts.js`, `decisions.js`, `bouncers.js`, `metrics.js`, `settings.js`).
- **luci-app-netdata-dashboard**: Embed Netdata telemetry (system, network, processes, realtime, settings) using SecuBox cards and gauges.
- **luci-app-netifyd-dashboard**: Show DPI data: applications, devices, flows, risks, “top talkers,” and configuration controls.
- **luci-app-network-modes**: Let users toggle router/AP/relay/sniffer modes via wizard flows while preserving backup/restore safeguards.
- **luci-app-wireguard-dashboard**: Monitor tunnels, peers, traffic, configs, QR codes, and enforce never exposing private keys.
- **luci-app-client-guardian**: Manage NAC zones, portals, captive flow, parental policies, alerts, logs, and quarantine defaults.
- **luci-app-auth-guardian**: Run authentication flows (sessions, vouchers, OAuth, splash, bypass) with secure portal assets.
- **luci-app-bandwidth-manager**: Configure QoS classes, scheduling, quotas, per-client stats, and media-aware prioritization.
- **luci-app-media-flow**: Detect streaming/VoIP services, alert on anomalies, show live bandwidth breakdown by service/client/history.
- **luci-app-cdn-cache**: Configure caching policies, show cache metrics, allow maintenance tasks (purge, preload).
- **luci-app-vhost-manager**: Create local virtual hosts, SSL bindings, redirects, certificate management, and view logs.
- **luci-app-traffic-shaper**: Provide CAKE/HTB based presets, classes, rules, and stats with one-click templates (gaming, streaming, etc.).
- **luci-app-ksm-manager**: Manage secure keys/secrets/HSM credentials, track audits, and guard SSH certificate flows.

## Non-Functional Requirements
- **Security & Permissions**: RPCD scripts must be installed with 755 through `PKG_FILE_MODES`; CSS/JS/Menu/ACL remain 644. ACL JSON must enumerate every ubus method. Do not widen ACLs without justification.
- **Design System**: Use `system-hub/common.css` variables (`--sh-*`), Inter + JetBrains Mono fonts, gradient classes, and provide `[data-theme="dark"]` overrides. No hardcoded colors.
- **Performance**: Views should batch RPC calls via `Promise.all`, re-use API helpers, and throttle `poll.add` intervals per module spec (commonly 5–30s).
- **Reliability**: Always run validation (`./secubox-tools/validate-modules.sh` / `validate-module-generation.sh`) and fix permissions before committing. Deployments must include remote permission fixes plus LuCI cache flush/resets.
- **Privacy**: Modules such as Client Guardian, Auth Guardian, and WireGuard must never display secrets (e.g., mask private keys, credentials, vouchers).

## Compatibility Matrix
| OpenWrt Version | Status | Package Format | Notes |
|-----------------|--------|----------------|-------|
| 25.12.0-rc1 | Testing | `.apk` | Uses new apk package manager |
| 24.10.x | Supported (recommended) | `.ipk` | Default CI target |
| 23.05.x | Supported | `.ipk` | Previous stable |
| 22.03.x | Supported | `.ipk` | LTS |
| 21.02.x | Partial | `.ipk` | End of support |
| SNAPSHOT | Supported | `.apk` | Bleeding edge |

Architectures covered by CI/local-build: `x86-64`, `x86-generic`, `aarch64-cortex-a53`, `aarch64-cortex-a72`, `aarch64-generic`, `mediatek-filogic`, `rockchip-armv8`, `bcm27xx-bcm2711`, `arm-cortex-a7-neon`, `arm-cortex-a9-neon`, `qualcomm-ipq40xx`, `qualcomm-ipq806x`, `mips-24kc`, `mipsel-24kc`, `mipsel-74kc`.

## Invariants (Must Never Break)
1. **RPCD naming**: `root/usr/libexec/rpcd/luci.<module>` must match every `rpc.declare({object:'luci.<module>'})` reference and ACL entry.
2. **Menu path alignment**: `root/usr/share/luci/menu.d/*.json` `path` fields must match the view filenames (`htdocs/luci-static/resources/view/<module>/<view>.js`).
3. **File permissions**: RPCD=755, helper scripts=755, CSS/JS/Menu/ACL/UCI=644. Always run `./secubox-tools/fix-permissions.sh --local` and `--remote`.
4. **Design system compliance**: Use shared CSS variables, fonts, and gradient/button classes; implement `[data-theme="dark"]` overrides.
5. **Validation gate**: Do not merge or deploy without passing `./secubox-tools/validate-modules.sh` (7 checks) and, when applicable, `validate-module-generation.sh` / `pre-push-validation.sh`.
6. **ACL integrity**: ACL JSON must explicitly cover every ubus method (read vs write) and only expose necessary resources.
7. **Deployment hygiene**: Use `deploy-module-template.sh` or module-specific deploy scripts so backups, LuCI cache clearing, and service restarts happen consistently.

## Acceptance Criteria Patterns
- ✅ UI work: All new views/styles follow the SecuBox design system, support dark mode, validate RPC responses, and update UI state/polling without console errors.
- ✅ RPC additions: Updated `api.js`, `root/usr/libexec/rpcd/luci.<module>`, menu/ACL JSON, and documentation; ubus methods tested via `ubus call luci.<module> <method>`.
- ✅ Packaging changes: `Makefile` builds locally via `make package/luci-app-<module>/compile V=s` or `./secubox-tools/local-build.sh build luci-app-<module>`; `PKG_FILE_MODES` covers executables; README updated if behavior changes.
- ✅ Deployment: `ROUTER=<host> ./deploy-module-template.sh <module>` completes, `./secubox-tools/fix-permissions.sh --remote <host>` run, `ubus list | grep luci.<module>` returns, and LuCI tab loads without 404/403/-32000 errors.
- ✅ Documentation: If UX or API contracts change, update the corresponding module README and reference sections (`DEVELOPMENT-GUIDELINES`, `MODULE_STATUS`, or other docs) or log a TODO when unsure.
