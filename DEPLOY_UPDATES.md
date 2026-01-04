# Deploy SecuBox AppStore Updates

## Quick Deploy (All Packages)

```bash
# 1. Rebuild all affected packages
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt
./secubox-tools/local-build.sh secubox-core luci-app-secubox-admin

# 2. Copy packages to router
scp bin/packages/x86_64/secubox/secubox-core_*.ipk \
    bin/packages/x86_64/secubox/luci-app-secubox-admin_*.ipk \
    root@192.168.8.191:/tmp/

# 3. Install on router
ssh root@192.168.8.191 << 'ENDSSH'
# Install packages (force-reinstall to update)
opkg install --force-reinstall /tmp/secubox-core_*.ipk
opkg install --force-reinstall /tmp/luci-app-secubox-admin_*.ipk

# Restart RPCD to reload ACLs
/etc/init.d/rpcd restart

# Verify ACL file is in place
ls -l /usr/share/rpcd/acl.d/luci-app-secubox-admin.json

echo "Installation complete!"
ENDSSH

# 4. Clear browser cache and reload
# - Press Ctrl+Shift+R in browser
# - Or clear cache manually in browser settings
```

## Verify Installation

On the router:

```bash
# Check installed versions
opkg list-installed | grep secubox

# Verify ACL file contents
cat /usr/share/rpcd/acl.d/luci-app-secubox-admin.json

# Test RPC methods directly
ubus -S call luci.secubox get_catalog_sources
ubus -S call luci.secubox check_updates
```

## What Was Fixed

### ACL Permissions Added

**Read permissions** (5 new methods):
- `get_catalog_sources`
- `check_updates`
- `get_app_versions`
- `get_changelog`
- `get_widget_data`

**Write permissions** (2 new methods):
- `set_catalog_source`
- `sync_catalog`

**UCI access**:
- `secubox-appstore` config

### Package Versions

- `secubox-core`: 0.8.0-6
- `luci-app-secubox-admin`: 1.0.0-8

### Recent Fixes

**v1.0.0-8** (Latest):
- Removed dependency on luci-app-secubox to avoid file conflicts
- Package now only depends on: luci-base, rpcd, secubox-core
- Fixes installation error: "file already provided by secubox-core"

**v1.0.0-7**:
- Added graceful RPC fallback to ALL views
- Wrapped all RPC calls in L.resolveDefault() with appropriate fallback values
- Fixed "No related RPC reply" errors in health.js, logs.js, settings.js, apps.js, dashboard.js
- All pages now load gracefully even when backend not deployed

**v1.0.0-6**:
- Fixed WidgetRenderer constructor error
- Changed from `new WidgetRenderer({...})` to `WidgetRenderer({...})`
- Added comprehensive error handling with try-catch and fallback error display
- baseclass-extended classes should not be called with `new` keyword

**v1.0.0-5**:
- Added graceful RPC fallback with L.resolveDefault()
- Pages now load with empty data instead of crashing when backend not deployed
- Fixes "No related RPC reply" errors

**v1.0.0-4**:
- Fixed WidgetRenderer undefined options TypeError
- Added defensive check: `options = options || {};`

**v1.0.0-3**:
- Added ACL permissions for new RPC methods
- Added UCI access to `secubox-appstore` config

## Troubleshooting

### Getting "No related RPC reply" errors?

This means the backend (secubox-core) hasn't been deployed yet with the new RPCD methods.

**Solution**: Deploy BOTH packages:
```bash
./deploy-to-router.sh
```

With v1.0.0-5, pages will load gracefully with empty data until backend is deployed.

**What you'll see**:
- Catalog Sources page: "No sources configured"
- Updates page: "All applications are up to date"
- Apps page: Works normally (uses existing RPC methods)

After deploying secubox-core, these pages will populate with real data.

### Still Getting "Access Denied"?

1. **Verify ACL file was installed**:
   ```bash
   ssh root@192.168.8.191 "cat /usr/share/rpcd/acl.d/luci-app-secubox-admin.json | grep get_catalog_sources"
   ```
   Should show the method name in the file.

2. **Check RPCD is running**:
   ```bash
   ssh root@192.168.8.191 "ps | grep rpcd"
   ```

3. **Restart RPCD**:
   ```bash
   ssh root@192.168.8.191 "/etc/init.d/rpcd restart"
   ```

4. **Check for ACL conflicts**:
   ```bash
   ssh root@192.168.8.191 "grep -r 'luci.secubox' /usr/share/rpcd/acl.d/"
   ```

5. **Clear browser cache completely**:
   - Close all browser windows
   - Clear cache and cookies for router IP
   - Reopen browser

### Test Individual Methods

```bash
# On router, test each method:
ubus -S call luci.secubox get_catalog_sources
ubus -S call luci.secubox check_updates
ubus -S call luci.secubox get_app_versions '{"app_id":"luci-app-auth-guardian"}'
ubus -S call luci.secubox get_changelog '{"app_id":"luci-app-auth-guardian"}'
ubus -S call luci.secubox get_widget_data '{"app_id":"luci-app-auth-guardian"}'
```

If these work via `ubus` but not in browser, it's a browser cache issue.

## Files Changed in This Update

1. `/usr/share/rpcd/acl.d/luci-app-secubox-admin.json` - ACL permissions
2. `/usr/libexec/rpcd/luci.secubox` - RPCD methods (already has the methods from Phase 2)
3. `/usr/sbin/secubox-catalog-sync` - New sync script
4. `/usr/sbin/secubox-appstore` - Enhanced CLI
5. `/etc/config/secubox-appstore` - New UCI config
6. All new LuCI views and widget system files
