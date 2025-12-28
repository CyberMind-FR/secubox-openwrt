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
- **Fix permissions** – Toujours lancer `./secubox-tools/fix-permissions.sh --local` avant commit et `--remote <routeur>` après déploiement pour garantir `644` sur CSS/JS et `755` sur scripts exécutables

### ACL File Template

```json
{
    "luci-app-{module-name}": {
        "description": "Grant access to {Module Name}",
        "read": {
            "ubus": {
                "luci.{module-name}": ["status", "get_config", "get_stats"]
            },
            "uci": ["{module_name}"]
        },
        "write": {
            "ubus": {
                "luci.{module-name}": ["set_config", "apply"]
            },
            "uci": ["{module_name}"]
        }
    }
}
```

### Menu File Template

```json
{
    "admin/services/{module_name}": {
        "title": "{Module Title}",
        "order": 50,
        "action": {
            "type": "view",
            "path": "{module_name}/main"
        },
        "depends": {
            "acl": ["luci-app-{module-name}"],
            "uci": {
                "{module_name}": true
            }
        }
    }
}
```

### View JavaScript Template

```javascript
'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require poll';

var callStatus = rpc.declare({
    object: 'luci.{module-name}',
    method: 'status',
    expect: {}
});

var callGetConfig = rpc.declare({
    object: 'luci.{module-name}',
    method: 'get_config',
    expect: {}
});

var callSetConfig = rpc.declare({
    object: 'luci.{module-name}',
    method: 'set_config',
    params: ['config']
});

return view.extend({
    load: function() {
        return Promise.all([
            callStatus(),
            callGetConfig()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var config = data[1] || {};
        
        var m, s, o;

        m = new form.Map('{module_name}', _('Module Title'),
            _('Module description'));

        // Status section
        s = m.section(form.NamedSection, 'global', 'global', _('Status'));
        s.anonymous = true;

        o = s.option(form.DummyValue, '_status', _('Status'));
        o.rawhtml = true;
        o.cfgvalue = function() {
            return '<span style="color:' + 
                (status.status === 'running' ? 'green' : 'red') + 
                '">● ' + (status.status || 'Unknown') + '</span>';
        };

        // Configuration section
        s = m.section(form.NamedSection, 'global', 'global', _('Configuration'));
        
        o = s.option(form.Flag, 'enabled', _('Enabled'));
        o.rmempty = false;

        return m.render();
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
```

## 📦 Current Modules Specification

### 1. secubox (Hub)
**Purpose**: Central dashboard aggregating all modules  
**Key Methods**: get_modules_status, get_system_health, get_quick_actions  
**Dependencies**: +luci-base +rpcd +curl +jq

### 2. crowdsec-dashboard
**Purpose**: CrowdSec threat intelligence visualization  
**Key Methods**: get_decisions, get_alerts, get_bouncers, add_decision, delete_decision  
**Dependencies**: +luci-base +rpcd +crowdsec +crowdsec-firewall-bouncer

### 3. netdata-dashboard
**Purpose**: Embedded Netdata monitoring  
**Key Methods**: get_status, get_metrics, restart_service  
**Dependencies**: +luci-base +rpcd +netdata

### 4. netifyd-dashboard
**Purpose**: Deep packet inspection stats  
**Key Methods**: get_flows, get_applications, get_protocols, get_hosts  
**Dependencies**: +luci-base +rpcd +netifyd

### 5. wireguard-dashboard
**Purpose**: WireGuard VPN management with QR codes  
**Key Methods**: list_interfaces, list_peers, add_peer, delete_peer, generate_qr  
**Dependencies**: +luci-base +rpcd +wireguard-tools +qrencode

### 6. network-modes
**Purpose**: Network topology switcher (Router/AP/Bridge/Repeater)  
**Key Methods**: get_current_mode, set_mode, get_available_modes, apply_mode  
**Dependencies**: +luci-base +rpcd

### 7. client-guardian
**Purpose**: Network access control, captive portal  
**Key Methods**: list_clients, authorize_client, block_client, get_sessions, set_policy  
**Dependencies**: +luci-base +rpcd +nodogsplash

### 8. system-hub
**Purpose**: System health and control center  
**Key Methods**: get_system_info, get_services, restart_service, get_logs, backup_config  
**Dependencies**: +luci-base +rpcd

### 9. bandwidth-manager
**Purpose**: QoS, quotas, traffic scheduling  
**Key Methods**: list_rules, add_rule, delete_rule, get_usage, list_quotas, set_quota  
**Dependencies**: +luci-base +rpcd +tc-full +kmod-sched-cake +sqm-scripts

### 10. auth-guardian
**Purpose**: OAuth2 authentication, voucher system  
**Key Methods**: get_providers, set_provider, validate_token, list_vouchers, create_voucher  
**Dependencies**: +luci-base +rpcd +curl +nodogsplash

### 11. media-flow
**Purpose**: Streaming service detection and monitoring  
**Key Methods**: get_active_streams, get_history, get_stats_by_service, get_stats_by_client  
**Dependencies**: +luci-base +rpcd +netifyd

### 12. vhost-manager
**Purpose**: Reverse proxy and SSL certificate management  
**Key Methods**: list_vhosts, add_vhost, delete_vhost, request_cert, list_certs, reload_nginx  
**Dependencies**: +luci-base +rpcd +nginx-ssl +acme

### 13. cdn-cache
**Purpose**: Local content caching  
**Key Methods**: get_status, get_stats, clear_cache, set_rules, get_cached_objects  
**Dependencies**: +luci-base +rpcd +nginx

### 14. traffic-shaper
**Purpose**: Advanced traffic control  
**Key Methods**: list_classes, add_class, set_priority, get_stats, apply_rules  
**Dependencies**: +luci-base +rpcd +tc-full +kmod-sched-cake

## 🧪 Testing Commands

```bash
# Test RPCD script locally
echo '{"method":"list"}' | /usr/libexec/rpcd/{module}
echo '{"method":"call","params":["status"]}' | /usr/libexec/rpcd/{module}

# Test via ubus
ubus list | grep luci
ubus call luci.{module} status
ubus -v list luci.{module}

# Validate JSON
jq . /usr/share/rpcd/acl.d/luci-app-{module}.json
jq . /usr/share/luci/menu.d/luci-app-{module}.json

# Validate JavaScript
node --check htdocs/luci-static/resources/view/{module}/main.js

# Check permissions
ls -la /usr/libexec/rpcd/{module}  # Should be -rwxr-xr-x

# Restart RPCD after changes
/etc/init.d/rpcd restart
rm -rf /tmp/luci-*
```

## 📝 Important Notes

1. **RPCD scripts MUST**:
   - Start with `#!/bin/sh`
   - Source jshn.sh for JSON handling
   - Implement `list` and `call` commands
   - Always call `json_dump` at the end
   - Be executable (chmod +x)

2. **Views MUST**:
   - Start with `'use strict';`
   - Use `require('view')` pattern
   - Declare RPC calls with `rpc.declare`
   - Return `view.extend({...})`

3. **ACL files MUST**:
   - List ALL RPCD methods
   - Separate read and write permissions
   - Use correct ubus object name (luci.{module-name})

4. **Menu files MUST**:
   - Use correct view path ({module_name}/main)
   - Reference correct ACL name
   - Set appropriate order for menu position

## 🌐 Links

- Website: https://secubox.cybermood.eu
- Documentation: https://cybermind.fr/docs/secubox
- GitHub: https://github.com/cybermood-eu/secubox
- Campaign: https://cybermood.eu (redirects to cybermind.fr/secubox)
