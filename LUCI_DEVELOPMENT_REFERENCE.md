# LuCI Development Reference Guide

**Version**: 1.0
**Date**: 2025-12-26
**Based on**: luci-app-secubox and luci-app-system-hub implementations
**Target Audience**: Claude.ai and developers working on OpenWrt LuCI applications

This document captures critical patterns, best practices, and common pitfalls discovered during the development of SecuBox LuCI applications. Use this as a validation reference for all future LuCI application development.

---

## Table of Contents

1. [ubus and RPC Fundamentals](#ubus-and-rpc-fundamentals)
2. [RPCD Backend Patterns](#rpcd-backend-patterns)
3. [LuCI API Module Patterns](#luci-api-module-patterns)
4. [LuCI View Import Patterns](#luci-view-import-patterns)
5. [ACL Permission Structure](#acl-permission-structure)
6. [Data Structure Conventions](#data-structure-conventions)
7. [Common Errors and Solutions](#common-errors-and-solutions)
8. [Validation Checklist](#validation-checklist)
9. [Testing and Deployment](#testing-and-deployment)

---

## ubus and RPC Fundamentals

### What is ubus?

**ubus** (OpenWrt micro bus architecture) is OpenWrt's inter-process communication (IPC) system. It enables:
- RPC (Remote Procedure Call) between processes
- Web interface (LuCI) to backend service communication
- Command-line interaction via `ubus call`

### ubus Object Naming Convention

**CRITICAL RULE**: All LuCI application ubus objects MUST use the `luci.` prefix.

```javascript
// ✅ CORRECT
object: 'luci.system-hub'
object: 'luci.cdn-cache'
object: 'luci.wireguard-dashboard'

// ❌ WRONG
object: 'system-hub'
object: 'systemhub'
object: 'cdn-cache'
```

**Why?** LuCI expects objects under the `luci.*` namespace for web applications. Without this prefix:
- ACL permissions won't match
- RPCD won't route calls correctly
- Browser console shows: `RPC call to system-hub/status failed with error -32000: Object not found`

### RPCD Script Naming MUST Match ubus Object

The RPCD script filename MUST exactly match the ubus object name:

```bash
# If JavaScript declares:
# object: 'luci.system-hub'

# Then RPCD script MUST be named:
/usr/libexec/rpcd/luci.system-hub

# NOT:
/usr/libexec/rpcd/system-hub
/usr/libexec/rpcd/luci-system-hub
```

**Validation Command**:
```bash
# Check JavaScript files for ubus object names
grep -r "object:" luci-app-*/htdocs --include="*.js"

# Verify RPCD script exists with matching name
ls luci-app-*/root/usr/libexec/rpcd/
```

### ubus Call Types

**Read Operations** (GET-like):
- `status` - Get current state
- `get_*` - Retrieve data (e.g., `get_health`, `get_settings`)
- `list_*` - Enumerate items (e.g., `list_services`)

**Write Operations** (POST-like):
- `save_*` - Persist configuration (e.g., `save_settings`)
- `*_action` - Perform actions (e.g., `service_action`)
- `backup`, `restore`, `reboot` - System modifications

**ACL Mapping**:
- Read operations → `"read"` section in ACL
- Write operations → `"write"` section in ACL

---

## RPCD Backend Patterns

### Shell Script Structure

RPCD backends are executable shell scripts that:
1. Parse `$1` for the action (`list` or `call`)
2. Parse `$2` for the method name (if `call`)
3. Read JSON input from stdin (for methods with parameters)
4. Output JSON to stdout
5. Exit with status 0 on success, non-zero on error

### Standard Template

```bash
#!/bin/sh
# RPCD Backend: luci.system-hub
# Version: 0.1.0

# Source JSON shell helper
. /usr/share/libubox/jshn.sh

case "$1" in
    list)
        # List all available methods and their parameters
        echo '{
            "status": {},
            "get_health": {},
            "service_action": { "service": "string", "action": "string" },
            "save_settings": {
                "auto_refresh": 0,
                "health_check": 0,
                "refresh_interval": 0
            }
        }'
        ;;
    call)
        case "$2" in
            status)
                status
                ;;
            get_health)
                get_health
                ;;
            service_action)
                # Read JSON input from stdin
                read -r input
                json_load "$input"
                json_get_var service service
                json_get_var action action
                service_action "$service" "$action"
                ;;
            save_settings)
                read -r input
                json_load "$input"
                json_get_var auto_refresh auto_refresh
                json_get_var health_check health_check
                json_get_var refresh_interval refresh_interval
                save_settings "$auto_refresh" "$health_check" "$refresh_interval"
                ;;
            *)
                echo '{"error": "Method not found"}'
                exit 1
                ;;
        esac
        ;;
esac
```

### JSON Output with jshn.sh

**jshn.sh** provides shell functions for JSON manipulation:

```bash
# Initialize JSON object
json_init

# Add simple values
json_add_string "hostname" "openwrt"
json_add_int "uptime" 86400
json_add_boolean "running" 1

# Add nested object
json_add_object "cpu"
json_add_int "usage" 25
json_add_string "status" "ok"
json_close_object

# Add array
json_add_array "services"
json_add_string "" "network"
json_add_string "" "firewall"
json_close_array

# Output JSON to stdout
json_dump
```

**Common Functions**:
- `json_init` - Start new JSON object
- `json_add_string "key" "value"` - Add string
- `json_add_int "key" 123` - Add integer
- `json_add_boolean "key" 1` - Add boolean (0 or 1)
- `json_add_object "key"` - Start nested object
- `json_close_object` - End nested object
- `json_add_array "key"` - Start array
- `json_close_array` - End array
- `json_dump` - Output JSON to stdout

### Error Handling

Always validate inputs and return meaningful errors:

```bash
service_action() {
    local service="$1"
    local action="$2"

    # Validate service name
    if [ -z "$service" ]; then
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Service name is required"
        json_dump
        return 1
    fi

    # Validate action
    case "$action" in
        start|stop|restart|enable|disable)
            ;;
        *)
            json_init
            json_add_boolean "success" 0
            json_add_string "error" "Invalid action: $action"
            json_dump
            return 1
            ;;
    esac

    # Perform action
    /etc/init.d/"$service" "$action" >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        json_init
        json_add_boolean "success" 1
        json_add_string "message" "Service $service $action successful"
        json_dump
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Service $service $action failed"
        json_dump
        return 1
    fi
}
```

### UCI Integration

For persistent configuration, use UCI (Unified Configuration Interface):

```bash
save_settings() {
    local auto_refresh="$1"
    local health_check="$2"
    local refresh_interval="$3"

    # Create/update UCI config
    uci set system-hub.general=general
    uci set system-hub.general.auto_refresh="$auto_refresh"
    uci set system-hub.general.health_check="$health_check"
    uci set system-hub.general.refresh_interval="$refresh_interval"
    uci commit system-hub

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "Settings saved successfully"
    json_dump
}

get_settings() {
    # Load UCI config
    if [ -f "/etc/config/system-hub" ]; then
        . /lib/functions.sh
        config_load system-hub
    fi

    json_init
    json_add_object "general"

    # Get value or use default
    config_get auto_refresh general auto_refresh "1"
    json_add_boolean "auto_refresh" "${auto_refresh:-1}"

    config_get refresh_interval general refresh_interval "30"
    json_add_int "refresh_interval" "${refresh_interval:-30}"

    json_close_object
    json_dump
}
```

### Performance Tips

1. **Cache expensive operations**: Don't re-read `/proc` files multiple times
2. **Use command substitution efficiently**:
   ```bash
   # Good
   uptime=$(cat /proc/uptime | cut -d' ' -f1)

   # Better
   read uptime _ < /proc/uptime
   uptime=${uptime%.*}
   ```
3. **Avoid external commands when possible**:
   ```bash
   # Slow
   count=$(ls /etc/init.d | wc -l)

   # Fast
   count=0
   for file in /etc/init.d/*; do
       [ -f "$file" ] && count=$((count + 1))
   done
   ```

---

## LuCI API Module Patterns

### CRITICAL: Use baseclass.extend()

**RULE**: LuCI API modules MUST use `baseclass.extend()` pattern.

```javascript
'use strict';
'require baseclass';
'require rpc';

// Declare RPC methods
var callStatus = rpc.declare({
    object: 'luci.system-hub',
    method: 'status',
    expect: {}
});

var callGetHealth = rpc.declare({
    object: 'luci.system-hub',
    method: 'get_health',
    expect: {}
});

var callSaveSettings = rpc.declare({
    object: 'luci.system-hub',
    method: 'save_settings',
    params: ['auto_refresh', 'health_check', 'refresh_interval'],
    expect: {}
});

// ✅ CORRECT: Use baseclass.extend()
return baseclass.extend({
    getStatus: callStatus,
    getHealth: callGetHealth,
    saveSettings: callSaveSettings
});

// ❌ WRONG: Do NOT use these patterns
return baseclass.singleton({...});  // Breaks everything!
return {...};  // Plain object doesn't work
```

**Why baseclass.extend()?**
- LuCI's module system expects class-based modules
- Views import with `'require module/api as API'` which auto-instantiates
- `baseclass.extend()` creates a proper class constructor
- `baseclass.singleton()` breaks the instantiation mechanism
- Plain objects don't support LuCI's module lifecycle

### rpc.declare() Parameters

```javascript
var callMethodName = rpc.declare({
    object: 'luci.module-name',     // ubus object name (MUST start with luci.)
    method: 'method_name',          // RPCD method name
    params: ['param1', 'param2'],   // Optional: parameter names (order matters!)
    expect: {}                      // Expected return structure (or { key: [] } for arrays)
});
```

**Parameter Order Matters**:
```javascript
// RPCD expects parameters in this exact order
var callSaveSettings = rpc.declare({
    object: 'luci.system-hub',
    method: 'save_settings',
    params: ['auto_refresh', 'health_check', 'debug_mode', 'refresh_interval'],
    expect: {}
});

// JavaScript call MUST pass parameters in same order
API.saveSettings(1, 1, 0, 30);  // auto_refresh=1, health_check=1, debug_mode=0, refresh_interval=30
```

### expect Parameter Patterns

```javascript
// Method returns single object
expect: {}

// Method returns array at top level
expect: { services: [] }

// Method returns specific structure
expect: {
    services: [],
    count: 0
}
```

### Error Handling in API Module

API methods return Promises. Handle errors in views:

```javascript
return API.getHealth().then(function(data) {
    if (!data || typeof data !== 'object') {
        console.error('Invalid health data:', data);
        return null;
    }
    return data;
}).catch(function(err) {
    console.error('Failed to load health data:', err);
    ui.addNotification(null, E('p', {}, 'Failed to load health data'), 'error');
    return null;
});
```

---

## LuCI View Import Patterns

### CRITICAL: Use 'require ... as VAR' for APIs

**RULE**: When importing API modules, use the `'require ... as VAR'` pattern at the top of the file.

```javascript
// ✅ CORRECT: Auto-instantiates the class
'require system-hub/api as API';

return L.view.extend({
    load: function() {
        return API.getHealth();  // API is already instantiated
    }
});

// ❌ WRONG: Returns class constructor, not instance
var api = L.require('system-hub.api');
api.getHealth();  // ERROR: api.getHealth is not a function
```

**Why?**
- `'require module/path as VAR'` (with forward slashes) auto-instantiates classes
- `L.require('module.path')` (with dots) returns raw class constructor
- API modules extend `baseclass`, which needs instantiation
- LuCI's module loader handles instantiation when using the `as VAR` pattern

### Standard View Structure

```javascript
'use strict';
'require view';
'require form';
'require ui';
'require system-hub/api as API';

return L.view.extend({
    load: function() {
        // Load data needed for rendering
        return Promise.all([
            API.getHealth(),
            API.getStatus()
        ]);
    },

    render: function(data) {
        var health = data[0];
        var status = data[1];

        // Create UI elements
        var container = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'Dashboard'),
            // ... more elements
        ]);

        return container;
    },

    handleSave: null,  // Disable save button
    handleSaveApply: null,  // Disable save & apply button
    handleReset: null  // Disable reset button
});
```

### Import Patterns Summary

```javascript
// Core LuCI modules (always with quotes)
'require view';
'require form';
'require ui';
'require rpc';
'require baseclass';

// Custom API modules (use 'as VAR' for auto-instantiation)
'require system-hub/api as API';
'require cdn-cache/api as CdnAPI';

// Access global L object (no require)
L.resolveDefault(...)
L.Poll.add(...)
L.ui.addNotification(...)
```

---

## ACL Permission Structure

### File Location

ACL files are located in:
```
/usr/share/rpcd/acl.d/luci-app-<module-name>.json
```

In source tree:
```
luci-app-<module-name>/root/usr/share/rpcd/acl.d/luci-app-<module-name>.json
```

### Standard ACL Template

```json
{
    "luci-app-module-name": {
        "description": "Module Name - Description",
        "read": {
            "ubus": {
                "luci.module-name": [
                    "status",
                    "get_system_info",
                    "get_health",
                    "list_services",
                    "get_logs",
                    "get_storage",
                    "get_settings"
                ]
            }
        },
        "write": {
            "ubus": {
                "luci.module-name": [
                    "service_action",
                    "backup_config",
                    "restore_config",
                    "reboot",
                    "save_settings"
                ]
            }
        }
    }
}
```

### Read vs Write Classification

**Read Operations** (no system modification):
- `status` - Get current state
- `get_*` - Retrieve data (system info, health, settings, logs, storage)
- `list_*` - Enumerate items (services, interfaces, etc.)

**Write Operations** (modify system state):
- `*_action` - Perform actions (start/stop services, etc.)
- `save_*` - Persist configuration changes
- `backup`, `restore` - System backup/restore
- `reboot`, `shutdown` - System control

### Common ACL Errors

**Error**: `Access denied` or RPC error `-32002`

**Cause**: Method not listed in ACL, or listed in wrong section (read vs write)

**Solution**:
1. Identify if method is read or write operation
2. Add method name to correct section in ACL
3. Restart RPCD: `/etc/init.d/rpcd restart`

**Validation**:
```bash
# Check if ACL file is valid JSON
jsonlint /usr/share/rpcd/acl.d/luci-app-system-hub.json

# List all ubus objects and methods
ubus list luci.system-hub

# Test method with ubus call
ubus call luci.system-hub get_health
```

---

## Data Structure Conventions

### Health Metrics Structure (system-hub v0.1.0)

Based on extensive iteration, this structure provides clarity and consistency:

```json
{
    "cpu": {
        "usage": 25,
        "status": "ok",
        "load_1m": "0.25",
        "load_5m": "0.30",
        "load_15m": "0.28",
        "cores": 4
    },
    "memory": {
        "total_kb": 4096000,
        "free_kb": 2048000,
        "available_kb": 3072000,
        "used_kb": 1024000,
        "buffers_kb": 512000,
        "cached_kb": 1536000,
        "usage": 25,
        "status": "ok"
    },
    "disk": {
        "total_kb": 30408704,
        "used_kb": 5447680,
        "free_kb": 24961024,
        "usage": 19,
        "status": "ok"
    },
    "temperature": {
        "value": 45,
        "status": "ok"
    },
    "network": {
        "wan_up": true,
        "status": "ok"
    },
    "services": {
        "running": 35,
        "failed": 2
    },
    "score": 92,
    "timestamp": "2025-12-26 10:30:00",
    "recommendations": [
        "2 service(s) enabled but not running. Check service status."
    ]
}
```

**Key Principles**:
1. **Nested objects** for related metrics (cpu, memory, disk, etc.)
2. **Consistent structure**: Each metric has `usage` (percentage) and `status` (ok/warning/critical)
3. **Raw values + computed values**: Provide both (e.g., `used_kb` AND `usage` percentage)
4. **Status thresholds**: ok (< warning), warning (warning-critical), critical (≥ critical)
5. **Overall score**: Single 0-100 health score for dashboard
6. **Dynamic recommendations**: Array of actionable alerts based on thresholds

### Status Values

Use consistent status strings across all metrics:
- `"ok"` - Normal operation (green)
- `"warning"` - Approaching threshold (orange)
- `"critical"` - Exceeded threshold (red)
- `"error"` - Unable to retrieve metric
- `"unknown"` - Metric not available

### Timestamp Format

Use ISO 8601 or consistent local format:
```bash
timestamp="$(date '+%Y-%m-%d %H:%M:%S')"  # 2025-12-26 10:30:00
```

### Boolean Values in JSON

In shell scripts using jshn.sh:
```bash
json_add_boolean "wan_up" 1  # true
json_add_boolean "wan_up" 0  # false
```

In JavaScript:
```javascript
if (health.network.wan_up) {
    // WAN is up
}
```

### Array vs Single Value

**Use arrays for**:
- Multiple items of same type (services, interfaces, mount points)
- Variable-length data

**Use single values for**:
- System-wide metrics (CPU, memory, disk)
- Primary/aggregate values (overall temperature, total uptime)

**Example - Storage**:
```json
// Multiple mount points - use array
"storage": [
    {
        "mount": "/",
        "total_kb": 30408704,
        "used_kb": 5447680,
        "usage": 19
    },
    {
        "mount": "/mnt/usb",
        "total_kb": 128000000,
        "used_kb": 64000000,
        "usage": 50
    }
]

// Root filesystem only - use object
"disk": {
    "total_kb": 30408704,
    "used_kb": 5447680,
    "usage": 19,
    "status": "ok"
}
```

---

## Common Errors and Solutions

### 1. RPC Error: "Object not found" (-32000)

**Error Message**:
```
RPC call to system-hub/status failed with error -32000: Object not found
```

**Cause**: RPCD script name doesn't match ubus object name in JavaScript

**Solution**:
1. Check JavaScript for object name:
   ```bash
   grep -r "object:" luci-app-system-hub/htdocs --include="*.js"
   ```
   Output: `object: 'luci.system-hub'`

2. Rename RPCD script to match exactly:
   ```bash
   mv root/usr/libexec/rpcd/system-hub root/usr/libexec/rpcd/luci.system-hub
   ```

3. Ensure script is executable:
   ```bash
   chmod +x root/usr/libexec/rpcd/luci.system-hub
   ```

4. Restart RPCD:
   ```bash
   /etc/init.d/rpcd restart
   ```

### 2. JavaScript Error: "api.methodName is not a function"

**Error Message**:
```
Uncaught TypeError: api.getHealth is not a function
    at view.load (health.js:12)
```

**Cause**: Wrong import pattern - imported class constructor instead of instance

**Solution**:
Change from:
```javascript
var api = L.require('system-hub.api');  // ❌ Wrong
```

To:
```javascript
'require system-hub/api as API';  // ✅ Correct
```

**Why**: `L.require('module.path')` returns raw class, `'require module/path as VAR'` auto-instantiates.

### 3. RPC Error: "Access denied" (-32002)

**Error Message**:
```
RPC call to luci.system-hub/get_settings failed with error -32002: Access denied
```

**Cause**: Method not listed in ACL file, or in wrong section (read vs write)

**Solution**:
1. Open ACL file: `root/usr/share/rpcd/acl.d/luci-app-system-hub.json`

2. Add method to appropriate section:
   ```json
   "read": {
       "ubus": {
           "luci.system-hub": [
               "get_settings"
           ]
       }
   }
   ```

3. Deploy and restart RPCD:
   ```bash
   scp luci-app-system-hub/root/usr/share/rpcd/acl.d/*.json router:/usr/share/rpcd/acl.d/
   ssh router "/etc/init.d/rpcd restart"
   ```

### 4. Display Error: "NaN%" or Undefined Values

**Error**: Dashboard shows "NaN%", "undefined", or empty values

**Cause**: Frontend using wrong data structure keys (outdated after backend changes)

**Solution**:
1. Check backend output:
   ```bash
   ubus call luci.system-hub get_health
   ```

2. Update frontend to match structure:
   ```javascript
   // ❌ Old structure
   var cpuPercent = health.load / health.cores * 100;
   var memPercent = health.memory.percent;

   // ✅ New structure
   var cpuPercent = health.cpu ? health.cpu.usage : 0;
   var memPercent = health.memory ? health.memory.usage : 0;
   ```

3. Add null/undefined checks:
   ```javascript
   var temp = health.temperature?.value || 0;
   var loadAvg = health.cpu?.load_1m || '0.00';
   ```

### 5. HTTP 404: View File Not Found

**Error Message**:
```
HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'
```

**Cause**: Menu path doesn't match actual view file location

**Solution**:
1. Check menu JSON:
   ```bash
   cat root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json
   ```
   Look for: `"path": "netifyd/overview"`

2. Check actual file location:
   ```bash
   ls htdocs/luci-static/resources/view/
   ```
   File is at: `view/netifyd-dashboard/overview.js`

3. Fix either menu path OR file location:
   ```json
   // Option 1: Update menu path to match file
   "path": "netifyd-dashboard/overview"

   // Option 2: Move file to match menu
   mv view/netifyd-dashboard/ view/netifyd/
   ```

### 6. Build Error: "factory yields invalid constructor"

**Error Message**:
```
/luci-static/resources/system-hub/api.js: factory yields invalid constructor
```

**Cause**: Used wrong pattern in API module (singleton, plain object, etc.)

**Solution**:
Always use `baseclass.extend()`:
```javascript
return baseclass.extend({
    getStatus: callStatus,
    getHealth: callGetHealth,
    // ... more methods
});
```

Do NOT use:
- `baseclass.singleton({...})`
- Plain object: `return {...}`
- `baseclass.prototype`

### 7. RPCD Not Responding After Changes

**Symptom**: Changes to RPCD script don't take effect

**Solution**:
1. Verify script is deployed:
   ```bash
   ssh router "ls -la /usr/libexec/rpcd/"
   ```

2. Check script is executable:
   ```bash
   ssh router "chmod +x /usr/libexec/rpcd/luci.system-hub"
   ```

3. Restart RPCD:
   ```bash
   ssh router "/etc/init.d/rpcd restart"
   ```

4. Clear browser cache (Ctrl+Shift+R)

5. Check RPCD logs:
   ```bash
   ssh router "logread | grep rpcd"
   ```

---

## Validation Checklist

Use this checklist before deployment:

### File Structure
- [ ] RPCD script exists: `/usr/libexec/rpcd/luci.<module-name>`
- [ ] RPCD script is executable: `chmod +x`
- [ ] Menu JSON exists: `/usr/share/luci/menu.d/luci-app-<module>.json`
- [ ] ACL JSON exists: `/usr/share/rpcd/acl.d/luci-app-<module>.json`
- [ ] API module exists: `htdocs/luci-static/resources/<module>/api.js`
- [ ] Views exist: `htdocs/luci-static/resources/view/<module>/*.js`

### Naming Conventions
- [ ] RPCD script name matches ubus object in JavaScript (including `luci.` prefix)
- [ ] Menu paths match view file directory structure
- [ ] All ubus objects start with `luci.`
- [ ] ACL key matches package name: `"luci-app-<module>"`

### Code Validation
- [ ] API module uses `baseclass.extend()` pattern
- [ ] Views import API with `'require <module>/api as API'` pattern
- [ ] All rpc.declare() calls include correct `object`, `method`, `params`, `expect`
- [ ] RPCD script outputs valid JSON (test with `ubus call`)
- [ ] Menu JSON is valid (test with `jsonlint`)
- [ ] ACL JSON is valid (test with `jsonlint`)

### Permissions
- [ ] All read methods in ACL `"read"` section
- [ ] All write methods in ACL `"write"` section
- [ ] Methods in ACL match RPCD script method names exactly

### Testing
- [ ] Run validation script: `./secubox-tools/validate-modules.sh`
- [ ] Test each method via ubus: `ubus call luci.<module> <method>`
- [ ] Test frontend in browser (check console for errors)
- [ ] Clear browser cache after deployment
- [ ] Verify RPCD restart: `/etc/init.d/rpcd restart`

### Automated Validation Command

```bash
# Run comprehensive validation
./secubox-tools/validate-modules.sh

# Validate specific module
./secubox-tools/validate-module-generation.sh luci-app-system-hub

# Check JSON syntax
find luci-app-system-hub -name "*.json" -exec jsonlint {} \;

# Check shell scripts
shellcheck luci-app-system-hub/root/usr/libexec/rpcd/*
```

---

## Testing and Deployment

### Local Testing with ubus

Before deploying to router, test RPCD script locally:

```bash
# Copy RPCD script to local /tmp
cp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub /tmp/

# Make executable
chmod +x /tmp/luci.system-hub

# Test 'list' action
/tmp/luci.system-hub list

# Test 'call' action with method
/tmp/luci.system-hub call status

# Test method with parameters
echo '{"service":"network","action":"restart"}' | /tmp/luci.system-hub call service_action
```

### Deployment Script

Use a deployment script for fast iteration:

```bash
#!/bin/bash
# deploy-system-hub.sh

ROUTER="root@192.168.8.191"

echo "🚀 Deploying system-hub to $ROUTER"

# Deploy API module
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# Deploy views
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/*.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

# Deploy RPCD backend
scp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub \
    "$ROUTER:/usr/libexec/rpcd/"

# Deploy ACL
scp luci-app-system-hub/root/usr/share/rpcd/acl.d/luci-app-system-hub.json \
    "$ROUTER:/usr/share/rpcd/acl.d/"

# Set permissions and restart
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.system-hub && /etc/init.d/rpcd restart"

echo "✅ Deployment complete! Clear browser cache (Ctrl+Shift+R)"
```

### Browser Testing

1. Open browser console (F12)
2. Navigate to module page
3. Check for errors:
   - RPC errors (object not found, method not found, access denied)
   - JavaScript errors (api.method is not a function)
   - 404 errors (view files not found)
4. Test functionality:
   - Load data displays correctly
   - Actions work (start/stop services, save settings)
   - No "NaN", "undefined", or empty values

### Remote ubus Testing

Test RPCD methods on router:

```bash
# List all methods
ssh router "ubus list luci.system-hub"

# Call method without parameters
ssh router "ubus call luci.system-hub status"

# Call method with parameters
ssh router "ubus call luci.system-hub service_action '{\"service\":\"network\",\"action\":\"restart\"}'"

# Pretty-print JSON output
ssh router "ubus call luci.system-hub get_health | jsonlint"
```

### Debugging Tips

**Enable RPCD debug logging**:
```bash
# Edit /etc/init.d/rpcd
# Add -v flag to procd_set_param command
procd_set_param command "$PROG" -v

# Restart RPCD
/etc/init.d/rpcd restart

# Watch logs
logread -f | grep rpcd
```

**Enable JavaScript console logging**:
```javascript
// Add to api.js
console.log('🔧 API v0.1.0 loaded at', new Date().toISOString());

// Add to views
console.log('Loading health data...');
API.getHealth().then(function(data) {
    console.log('Health data:', data);
});
```

**Test JSON output**:
```bash
# On router
/usr/libexec/rpcd/luci.system-hub call get_health | jsonlint

# Check for common errors
# - Missing commas
# - Trailing commas
# - Unquoted keys
# - Invalid escape sequences
```

---

## Best Practices Summary

### DO:
✅ Use `luci.` prefix for all ubus objects
✅ Name RPCD scripts to match ubus object exactly
✅ Use `baseclass.extend()` for API modules
✅ Import APIs with `'require module/api as API'` pattern
✅ Add null/undefined checks in frontend: `health.cpu?.usage || 0`
✅ Validate JSON with `jsonlint` before deploying
✅ Test with `ubus call` before browser testing
✅ Restart RPCD after backend changes
✅ Clear browser cache after frontend changes
✅ Run `./secubox-tools/validate-modules.sh` before committing

### DON'T:
❌ Use ubus object names without `luci.` prefix
❌ Use `baseclass.singleton()` or plain objects for API modules
❌ Import APIs with `L.require('module.path')` (returns class, not instance)
❌ Forget to add methods to ACL file
❌ Mix up read/write methods in ACL sections
❌ Output non-JSON from RPCD scripts
❌ Use inconsistent data structures between backend and frontend
❌ Deploy without testing locally first
❌ Assume data exists - always check for null/undefined
❌ Forget to make RPCD scripts executable (`chmod +x`)

---

## Version History

**v1.0** (2025-12-26)
- Initial reference guide
- Based on luci-app-secubox v1.0.0 and luci-app-system-hub v0.1.0
- Documented all critical patterns and common errors
- Validated against real-world implementation challenges

---

## References

- **OpenWrt Documentation**: https://openwrt.org/docs/guide-developer/start
- **LuCI Documentation**: https://github.com/openwrt/luci/wiki
- **ubus Documentation**: https://openwrt.org/docs/techref/ubus
- **UCI Documentation**: https://openwrt.org/docs/guide-user/base-system/uci
- **jshn.sh Library**: `/usr/share/libubox/jshn.sh` on OpenWrt

---

## Contact

For questions or contributions to this reference guide:
- **Author**: CyberMind <contact@cybermind.fr>
- **Project**: SecuBox OpenWrt
- **Repository**: https://github.com/cybermind-fr/secubox-openwrt

---

**END OF REFERENCE GUIDE**
