# SecuBox LuCI WebUI Debug Guide

**Date**: 2026-01-04
**Status**: Debug logging added to all views

## Overview

Debug logging has been added to all SecuBox Admin LuCI views to troubleshoot why the CLI works but the WebUI doesn't. All debug messages use the browser console and are prefixed with `[*-DEBUG]` tags.

## Debug Levels Added

### 1. API Module (`secubox-admin/api.js`)

**Prefix**: `[API-DEBUG]`

All RPC calls are wrapped with debug logging:

```javascript
[API-DEBUG] Calling: getCatalogSources with args: []
[API-DEBUG] Success: getCatalogSources result: {sources: [...]}
// OR
[API-DEBUG] Error: getCatalogSources error: Error object
[API-DEBUG] Error stack: full stack trace
```

**Methods Tracked**:
- getApps, installApp, removeApp
- getModules, enableModule, disableModule
- getHealth, getAlerts, getLogs
- getCatalogSources, setCatalogSource, syncCatalog
- checkUpdates, getAppVersions, getChangelog
- getWidgetData

### 2. Updates View (`view/secubox-admin/updates.js`)

**Prefix**: `[UPDATES-DEBUG]`

**Load Phase**:
```
[UPDATES-DEBUG] ========== LOAD START ==========
[UPDATES-DEBUG] Starting Promise.all with 3 API calls...
[UPDATES-DEBUG] checkUpdates() raw result: {...}
[UPDATES-DEBUG] checkUpdates() result type: object
[UPDATES-DEBUG] checkUpdates() keys: [...]
[UPDATES-DEBUG] getApps() raw result: {...}
[UPDATES-DEBUG] getModules() raw result: {...}
[UPDATES-DEBUG] ========== ALL PROMISES RESOLVED ==========
[UPDATES-DEBUG] Result[0] (updates): {...}
[UPDATES-DEBUG] Result[1] (apps): {...}
[UPDATES-DEBUG] Result[2] (modules): {...}
[UPDATES-DEBUG] ========== LOAD COMPLETE ==========
```

**Render Phase**:
```
[UPDATES-DEBUG] ========== RENDER START ==========
[UPDATES-DEBUG] Render data (raw): [...]
[UPDATES-DEBUG] Render data type: object
[UPDATES-DEBUG] updateData: {...}
[UPDATES-DEBUG] updatesAvailable: [...]
[UPDATES-DEBUG] totalUpdates: 5
[UPDATES-DEBUG] ========== RENDER PROCESSING ==========
```

**Error Tracking**:
```
[UPDATES-DEBUG] checkUpdates() ERROR: Error object
[UPDATES-DEBUG] checkUpdates() error message: "method not found"
[UPDATES-DEBUG] checkUpdates() error stack: full stack
```

### 3. Catalog Sources View (`view/secubox-admin/catalog-sources.js`)

**Prefix**: `[CATALOG-SOURCES-DEBUG]`

Similar structure to Updates view:

**Load Phase**:
```
[CATALOG-SOURCES-DEBUG] ========== LOAD START ==========
[CATALOG-SOURCES-DEBUG] getCatalogSources() raw result: {...}
[CATALOG-SOURCES-DEBUG] getCatalogSources() sources: [...]
[CATALOG-SOURCES-DEBUG] ========== ALL PROMISES RESOLVED ==========
```

**Render Phase**:
```
[CATALOG-SOURCES-DEBUG] ========== RENDER START ==========
[CATALOG-SOURCES-DEBUG] sources array: [...]
[CATALOG-SOURCES-DEBUG] sources count: 4
```

### 4. Apps Manager View (`view/secubox-admin/apps.js`)

**Prefix**: `[APPS-DEBUG]`

Similar structure to other views:

**Load Phase**:
```
[APPS-DEBUG] ========== LOAD START ==========
[APPS-DEBUG] getApps() raw result: {...}
[APPS-DEBUG] getApps() apps: [...]
[APPS-DEBUG] ========== ALL PROMISES RESOLVED ==========
```

**Render Phase**:
```
[APPS-DEBUG] ========== RENDER START ==========
[APPS-DEBUG] apps array: [...]
[APPS-DEBUG] apps count: 37
```

## How to Use Debug Logging

### Step 1: Open Browser Console

**Chrome/Edge**:
- Press `F12` or `Ctrl+Shift+I`
- Click "Console" tab

**Firefox**:
- Press `F12` or `Ctrl+Shift+K`
- Click "Console" tab

### Step 2: Filter Debug Messages

In console filter box, type:
- `DEBUG` - Show all debug messages
- `API-DEBUG` - Show only API calls
- `UPDATES-DEBUG` - Show only Updates view
- `CATALOG-SOURCES-DEBUG` - Show only Catalog Sources view
- `APPS-DEBUG` - Show only Apps Manager view

### Step 3: Navigate to Views

1. **Updates View**: `/cgi-bin/luci/admin/secubox/admin/updates`
   - Watch console for `[UPDATES-DEBUG]` messages
   - Check if `checkUpdates()` succeeds or fails
   - Verify result structure

2. **Catalog Sources**: `/cgi-bin/luci/admin/secubox/admin/catalog-sources`
   - Watch for `[CATALOG-SOURCES-DEBUG]` messages
   - Check if `getCatalogSources()` succeeds
   - Verify sources array

3. **Apps Manager**: `/cgi-bin/luci/admin/secubox/admin/apps`
   - Watch for `[APPS-DEBUG]` messages
   - Check if `getApps()` succeeds
   - Verify apps array

### Step 4: Identify Issues

Common error patterns:

#### RPC Method Not Found
```
[API-DEBUG] Error: getCatalogSources error: Error: method not found
```
**Cause**: RPCD backend not deployed or not running
**Fix**: Redeploy secubox-core package, restart rpcd

#### Permission Denied
```
[API-DEBUG] Error: getCatalogSources error: Error: access denied
```
**Cause**: ACL permissions not set
**Fix**: Check `/usr/share/rpcd/acl.d/` files

#### Empty Result
```
[CATALOG-SOURCES-DEBUG] getCatalogSources() sources: []
```
**Cause**: UCI config not loaded or empty
**Fix**: Check `/etc/config/secubox-appstore`

#### Null/Undefined Result
```
[APPS-DEBUG] getApps() raw result: null
[APPS-DEBUG] getApps() result type: object
[APPS-DEBUG] getApps() keys: []
```
**Cause**: Backend returned invalid JSON or error
**Fix**: Check backend script logs: `logread | grep secubox`

## Testing Checklist

### Test 1: Verify RPC Backend Available

```bash
# On router:
ubus list | grep luci.secubox
# Should show: luci.secubox

ubus -v list luci.secubox
# Should show all methods including:
# - get_catalog_sources
# - check_updates
# - get_appstore_apps
```

### Test 2: Test RPC Methods Directly

```bash
# Test getCatalogSources
ubus call luci.secubox get_catalog_sources
# Expected: {"sources":[...]}

# Test checkUpdates
ubus call luci.secubox check_updates
# Expected: {"updates":[...],"total_updates":N}

# Test getApps
ubus call luci.secubox get_appstore_apps
# Expected: {"apps":[...],"categories":{...}}
```

### Test 3: Check RPCD Logs

```bash
# Watch RPCD logs while accessing WebUI
logread -f | grep -E "(rpcd|luci.secubox)"

# Or check recent logs
logread | grep luci.secubox | tail -20
```

### Test 4: Verify File Permissions

```bash
# Check RPCD script is executable
ls -la /usr/libexec/rpcd/luci.secubox
# Should be: -rwxr-xr-x

# Check catalog exists and readable
ls -la /usr/share/secubox/catalog.json
# Should be: -rw-r--r--

# Check UCI config exists
ls -la /etc/config/secubox-appstore
# Should exist
```

## Common Issues & Solutions

### Issue 1: "method not found" in console

**Debug Output**:
```
[API-DEBUG] Error: get_catalog_sources error: Error: method not found
```

**Solution**:
```bash
# Redeploy secubox-core
opkg remove secubox-core
opkg install /tmp/secubox-core_0.8.0-8_all.ipk

# Restart RPCD
/etc/init.d/rpcd restart

# Verify method available
ubus list | grep luci.secubox
```

### Issue 2: Empty sources array

**Debug Output**:
```
[CATALOG-SOURCES-DEBUG] getCatalogSources() sources: []
```

**Solution**:
```bash
# Check UCI config exists
cat /etc/config/secubox-appstore

# If missing, reinstall secubox-core or create manually
# See /etc/config/secubox-appstore template
```

### Issue 3: RPC call hangs/times out

**Debug Output**:
```
[API-DEBUG] Calling: checkUpdates with args: []
(... no response ...)
```

**Solution**:
```bash
# Check if backend script has execution errors
/usr/sbin/secubox-appstore check-updates --json
# If fails, check script syntax/permissions

# Check opkg lock
ls -la /var/lock/opkg.lock
# If exists and process not running, remove it
```

### Issue 4: Apps array is empty

**Debug Output**:
```
[APPS-DEBUG] getApps() apps: []
```

**Solution**:
```bash
# Check catalog file
ls -la /usr/share/secubox/catalog.json
cat /usr/share/secubox/catalog.json | jq '.plugins | length'
# Should show: 37

# Test direct RPCD call
ubus call luci.secubox get_appstore_apps
# Check if returns apps
```

## Debug Information to Collect

When reporting issues, provide:

1. **Console Logs**:
   - Filter by `DEBUG`
   - Copy all debug output from page load
   - Include both successful and error messages

2. **RPCD Test Results**:
   ```bash
   ubus list | grep luci.secubox
   ubus call luci.secubox get_catalog_sources
   ubus call luci.secubox check_updates
   ubus call luci.secubox get_appstore_apps
   ```

3. **System Logs**:
   ```bash
   logread | grep -E "(secubox|rpcd)" | tail -50
   ```

4. **Package Versions**:
   ```bash
   opkg list-installed | grep secubox
   ```

5. **File Permissions**:
   ```bash
   ls -la /usr/libexec/rpcd/luci.secubox
   ls -la /usr/share/secubox/catalog.json
   ls -la /etc/config/secubox-appstore
   ```

## Package Updates

Debug logging added in:
- **luci-app-secubox-admin**: v1.0.0-14
- **secubox-core**: v0.8.0-8 (catalog enrichment)

To get debug logging:
```bash
# Rebuild packages
cd secubox-tools
./local-build.sh luci-app-secubox-admin
./local-build.sh secubox-core

# Deploy to router
scp build/x86-64/luci-app-secubox-admin_1.0.0-14_all.ipk root@router:/tmp/
scp build/x86-64/secubox-core_0.8.0-8_all.ipk root@router:/tmp/

ssh root@router
opkg remove luci-app-secubox-admin secubox-core
opkg install /tmp/secubox-core_0.8.0-8_all.ipk
opkg install /tmp/luci-app-secubox-admin_1.0.0-14_all.ipk
/etc/init.d/rpcd restart
```

## Next Steps

With debug logging in place:

1. Access WebUI views in browser
2. Open console (F12)
3. Filter for `DEBUG` messages
4. Navigate to problematic view
5. Capture console output
6. Compare with expected CLI behavior
7. Identify where WebUI differs from CLI

This will pinpoint exactly where the issue occurs (RPC call, data parsing, rendering, etc.).
