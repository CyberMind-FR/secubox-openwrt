# SecuBox Project Context for Claude AI

## 🎯 Project Identity

**Name**: SecuBox  
**Type**: Modular security suite for OpenWrt routers  
**Version**: 1.0.0  
**Author**: CyberMind.fr (Gandalf)  
**License**: Apache-2.0  

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LuCI Web Interface                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ View.js │ │ View.js │ │ View.js │ │ View.js │  ...      │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                  │
│       └───────────┴─────┬─────┴───────────┘                  │
│                         │ JSON-RPC                           │
├─────────────────────────┼───────────────────────────────────┤
│                    RPCD Daemon                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Script  │ │ Script  │ │ Script  │ │ Script  │  ...      │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                  │
├───────┼───────────┼───────────┼───────────┼─────────────────┤
│       │    UCI    │   Shell   │  System   │                  │
│       │  Config   │  Commands │  Services │                  │
└───────┴───────────┴───────────┴───────────┴─────────────────┘
```

## 📁 Module Structure Template

```
luci-app-{module-name}/
├── Makefile                                    # OpenWrt package definition
├── README.md                                   # Module documentation
├── htdocs/
│   └── luci-static/
│       └── resources/
│           └── view/
│               └── {module_name}/              # Underscore version
│                   ├── main.js                 # Main view
│                   └── {subview}.js            # Optional subviews
└── root/
    ├── etc/
    │   ├── config/
    │   │   └── {module_name}                   # UCI configuration
    │   ├── init.d/
    │   │   └── {module_name}                   # Service init script (optional)
    │   └── uci-defaults/
    │       └── 99-{module_name}                # First-run setup
    └── usr/
        ├── libexec/
        │   └── rpcd/
        │       └── {module-name}               # Hyphen version - RPCD backend
        └── share/
            ├── luci/
            │   └── menu.d/
            │       └── luci-app-{module-name}.json
            └── rpcd/
                └── acl.d/
                    └── luci-app-{module-name}.json
```

## 📋 Naming Conventions

| Context | Format | Example |
|---------|--------|---------|
| Package name | luci-app-{module-name} | luci-app-vhost-manager |
| RPCD script | {module-name} | vhost-manager |
| UCI config | {module_name} | vhost_manager |
| View path | {module_name}/ | vhost_manager/ |
| ubus object | luci.{module-name} | luci.vhost-manager |
| Menu path | admin/services/{module_name} | admin/services/vhost_manager |

## 🔧 Code Standards

### Makefile Template

```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-{module-name}
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - {Module Title}
LUCI_DESCRIPTION:={Description}
LUCI_DEPENDS:=+luci-base +rpcd {+other-deps}
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk
```

### RPCD Script Template

```sh
#!/bin/sh
# RPCD backend for {module-name}

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

json_init

case "$1" in
    list)
        # MUST list all available methods
        json_add_object "status"
        json_close_object
        json_add_object "get_config"
        json_close_object
        json_add_object "set_config"
            json_add_string "config" "object"
        json_close_object
        # Add more methods here
        json_dump
        ;;
    
    call)
        case "$2" in
            status)
                # MUST implement status method
                json_add_string "module" "{module-name}"
                json_add_string "version" "2.0.0"
                json_add_boolean "enabled" 1
                json_add_string "status" "running"
                json_dump
                ;;
            
            get_config)
                # Read from UCI
                json_add_object "config"
                # config_load "{module_name}"
                json_close_object
                json_dump
                ;;
            
            set_config)
                read -r input
                json_load "$input"
                # Apply to UCI
                json_init
                json_add_boolean "success" 1
                json_dump
                ;;
            
            *)
                json_add_int "error" -32601
                json_add_string "message" "Method not found"
                json_dump
                ;;
        esac
        ;;
esac
```

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
