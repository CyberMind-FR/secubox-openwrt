# SecuBox Module Validation Guide

This guide explains the validation checks performed on SecuBox modules during generation and before git push.

## Overview

SecuBox uses a multi-layered validation approach:

1. **Module Generation Validation** - Validates newly created/modified modules
2. **Pre-Push Validation** - Blocks git push if critical issues are found
3. **Runtime Validation** - Continuous checks on deployed modules

## Validation Tools

### 1. validate-module-generation.sh

Comprehensive validation for a single module during/after generation.

**Usage:**
```bash
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache
```

**Checks performed:**
- ✅ Makefile completeness and correctness
- ✅ RPCD script naming convention (must use `luci.` prefix)
- ✅ RPCD script executable permissions
- ✅ RPCD script structure (list/call handlers)
- ✅ ACL file JSON validity
- ✅ ACL permissions cover RPCD methods
- ✅ Menu file JSON validity
- ✅ Menu paths match view file locations
- ✅ JavaScript view files exist
- ✅ JavaScript strict mode usage
- ✅ RPC method calls match RPCD methods
- ✅ ubus object names match RPCD script names
- ✅ UCI config validity (if present)
- ✅ Security scan (hardcoded credentials, dangerous commands)
- ✅ Documentation presence

**Exit codes:**
- `0` - All checks passed
- `1` - Critical errors found (module should not be deployed)

### 2. pre-push-validation.sh

Validates all modules before allowing git push.

**Usage:**
```bash
# Automatic (via git hook):
git push  # validation runs automatically

# Manual:
./secubox-tools/pre-push-validation.sh
```

**Checks performed:**
- ✅ Git staged changes check
- ✅ RPCD naming conventions across all modules
- ✅ Menu path validation across all modules
- ✅ JSON syntax validation
- ✅ RPCD executable permissions
- ✅ ACL method coverage
- ✅ Makefile validation
- ✅ Security scans
- ✅ Full module validation on modified modules

**Exit codes:**
- `0` - Push allowed
- `1` - Push blocked (critical errors)

### 3. validate-modules.sh

Fast validation of all modules (existing tool).

**Usage:**
```bash
./secubox-tools/validate-modules.sh
```

See `secubox-tools/README.md` for details.

## Installing Git Hooks

To enable automatic validation before git push:

```bash
./secubox-tools/install-git-hooks.sh
```

This creates a symbolic link from `.git/hooks/pre-push` to `secubox-tools/pre-push-validation.sh`.

## Critical Naming Conventions

### 1. RPCD Script MUST Match ubus Object

**Rule:** The RPCD script filename MUST exactly match the ubus object name declared in JavaScript.

**Why:** LuCI's RPC system looks for RPCD scripts by their filename. If the name doesn't match, you get:
- `RPC call failed with error -32000: Object not found`
- `Command failed: Method not found`

**Example:**

```javascript
// JavaScript (htdocs/luci-static/resources/view/cdn-cache/overview.js)
var callStatus = rpc.declare({
    object: 'luci.cdn-cache',  // ← This must match RPCD filename
    method: 'status'
});
```

```bash
# RPCD script filename MUST be:
root/usr/libexec/rpcd/luci.cdn-cache  # ← Exactly 'luci.cdn-cache'
```

**Common mistakes:**
- ❌ `root/usr/libexec/rpcd/cdn-cache` (missing `luci.` prefix)
- ❌ `root/usr/libexec/rpcd/luci-cdn-cache` (using dash instead of dot)
- ❌ `root/usr/libexec/rpcd/cdn_cache` (using underscore)

**Validation:**
```bash
# Check naming:
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache

# Look for:
# ✓ RPCD script follows naming convention (luci.* prefix)
# ✓ CRITICAL: RPCD script name matches ACL ubus object
```

### 2. Menu Paths MUST Match View File Locations

**Rule:** Menu JSON `path` entries MUST correspond to actual view file paths.

**Why:** LuCI loads views based on the path in the menu. Wrong path = HTTP 404.

**Example:**

```json
// Menu (root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json)
{
    "action": {
        "type": "view",
        "path": "netifyd-dashboard/overview"  // ← Must match file location
    }
}
```

```bash
# View file MUST exist at:
htdocs/luci-static/resources/view/netifyd-dashboard/overview.js
#                                  ↑ Same path as menu ↑
```

**Common mistakes:**
- ❌ Menu: `"path": "netifyd/overview"` but file at `view/netifyd-dashboard/overview.js`
- ❌ Menu: `"path": "overview"` but file at `view/netifyd-dashboard/overview.js`

**Validation:**
```bash
# Check paths:
./secubox-tools/validate-module-generation.sh luci-app-netifyd-dashboard

# Look for:
# ✓ Menu path 'netifyd-dashboard/overview' → view file EXISTS
```

### 3. All ubus Objects MUST Use `luci.` Prefix

**Rule:** Every ubus object declaration must start with `luci.`

**Why:** Consistent naming convention for LuCI applications. ACL system expects it.

**Example:**

```javascript
// ✅ Correct:
object: 'luci.cdn-cache'
object: 'luci.system-hub'
object: 'luci.wireguard-dashboard'

// ❌ Wrong:
object: 'cdn-cache'  // Missing luci. prefix
object: 'systemhub'  // Missing luci. prefix
```

**Validation:**
```bash
# Check convention:
./secubox-tools/validate-modules.sh

# Look for:
# ✓ ubus object 'luci.cdn-cache' follows naming convention
```

## Module Generation Checklist

Use this checklist when generating a new module:

### Phase 1: Initial Generation

- [ ] Create module directory: `luci-app-<module-name>/`
- [ ] Generate Makefile with all required fields
- [ ] Create RPCD script at `root/usr/libexec/rpcd/luci.<module-name>`
- [ ] Make RPCD script executable: `chmod +x`
- [ ] Add shebang to RPCD: `#!/bin/sh`
- [ ] Implement RPCD methods (list, call, status, etc.)
- [ ] Create ACL file with read/write permissions
- [ ] Create menu JSON with correct paths
- [ ] Create view JavaScript files
- [ ] Add `'use strict';` to all JS files

### Phase 2: Validation

- [ ] Run module generation validation:
  ```bash
  ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
  ```

- [ ] Fix all ERRORS (critical)
- [ ] Review all WARNINGS (recommended)

### Phase 3: Integration Validation

- [ ] Verify RPCD script name matches ubus object:
  ```bash
  grep -r "object:" luci-app-<module-name>/htdocs --include="*.js"
  ls -la luci-app-<module-name>/root/usr/libexec/rpcd/
  # Names must match exactly
  ```

- [ ] Verify menu paths match view files:
  ```bash
  grep '"path":' luci-app-<module-name>/root/usr/share/luci/menu.d/*.json
  ls -R luci-app-<module-name>/htdocs/luci-static/resources/view/
  # Paths must align
  ```

- [ ] Verify ACL permissions cover all RPCD methods:
  ```bash
  grep 'case "$2"' luci-app-<module-name>/root/usr/libexec/rpcd/*
  grep -A 20 '"ubus":' luci-app-<module-name>/root/usr/share/rpcd/acl.d/*.json
  # All methods should be in ACL
  ```

### Phase 4: Pre-Commit

- [ ] Run comprehensive validation:
  ```bash
  ./secubox-tools/validate-modules.sh
  ```

- [ ] Review security scan results
- [ ] Check JSON validity:
  ```bash
  find luci-app-<module-name> -name "*.json" -exec python3 -m json.tool {} \; > /dev/null
  ```

- [ ] Optional: Run shellcheck on RPCD:
  ```bash
  shellcheck luci-app-<module-name>/root/usr/libexec/rpcd/*
  ```

### Phase 5: Git Commit

- [ ] Stage changes:
  ```bash
  git add luci-app-<module-name>
  ```

- [ ] Commit with descriptive message:
  ```bash
  git commit -m "feat: implement <module-name> module

  - Add RPCD backend with methods: status, get_*, set_*
  - Create views for overview, settings, etc.
  - Configure ACL permissions
  - Add menu entries

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
  ```

- [ ] Push (validation runs automatically):
  ```bash
  git push
  ```

## Common Validation Errors and Fixes

### Error: RPCD script name doesn't match ubus object

```
✗ ERROR: luci-app-cdn-cache: RPCD script 'cdn-cache' does NOT match ubus object 'luci.cdn-cache'
```

**Fix:**
```bash
cd luci-app-cdn-cache/root/usr/libexec/rpcd
mv cdn-cache luci.cdn-cache
```

### Error: Menu path → file NOT FOUND

```
✗ ERROR: luci-app-netifyd: Menu path 'netifyd/overview' → file NOT FOUND
Expected: htdocs/luci-static/resources/view/netifyd/overview.js
```

**Fix Option 1:** Update menu path to match file:
```bash
# Edit root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json
# Change: "path": "netifyd/overview"
# To:     "path": "netifyd-dashboard/overview"
```

**Fix Option 2:** Move view file to match menu:
```bash
mv htdocs/luci-static/resources/view/netifyd-dashboard \
   htdocs/luci-static/resources/view/netifyd
```

### Error: RPCD script is NOT executable

```
✗ ERROR: luci-app-cdn-cache: luci.cdn-cache is NOT executable
```

**Fix:**
```bash
chmod +x luci-app-cdn-cache/root/usr/libexec/rpcd/luci.cdn-cache
```

### Error: Method 'get_stats' from RPCD not found in ACL

```
⚠ WARNING: luci-app-cdn-cache: Method 'get_stats' from RPCD not in ACL
```

**Fix:**
```bash
# Edit root/usr/share/rpcd/acl.d/luci-app-cdn-cache.json
# Add 'get_stats' to the read.ubus array:
{
    "luci-app-cdn-cache": {
        "read": {
            "ubus": {
                "luci.cdn-cache": ["status", "get_config", "get_stats"]
                                                           ↑ Add here
            }
        }
    }
}
```

### Error: Invalid JSON syntax

```
✗ ERROR: luci-app-cdn-cache: acl.d JSON is INVALID - syntax error
```

**Fix:**
```bash
# Validate JSON:
python3 -m json.tool root/usr/share/rpcd/acl.d/luci-app-cdn-cache.json

# Common issues:
# - Missing comma between array elements
# - Trailing comma after last element
# - Unescaped quotes in strings
```

## Bypassing Validation (NOT RECOMMENDED)

In rare cases, you may need to bypass validation:

```bash
# Skip pre-push validation:
git push --no-verify

# Skip module generation validation:
# (can't bypass - it's informational only)
```

**⚠️ WARNING:** Bypassing validation can lead to broken modules in production!

## Integration with CI/CD

### GitHub Actions

Add validation to your workflow:

```yaml
name: Validate Modules

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y python3 shellcheck

      - name: Run module validation
        run: |
          chmod +x secubox-tools/validate-modules.sh
          ./secubox-tools/validate-modules.sh

      - name: Run pre-push validation
        run: |
          chmod +x secubox-tools/pre-push-validation.sh
          ./secubox-tools/pre-push-validation.sh
```

## Best Practices

1. **Always validate before committing**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module>
   ```

2. **Install git hooks for automatic validation**
   ```bash
   ./secubox-tools/install-git-hooks.sh
   ```

3. **Fix errors immediately** - Don't accumulate validation debt

4. **Review warnings** - They often indicate real issues

5. **Test on OpenWrt** before marking complete:
   ```bash
   scp bin/packages/*/base/luci-app-*.ipk root@192.168.1.1:/tmp/
   ssh root@192.168.1.1
   opkg install /tmp/luci-app-*.ipk
   /etc/init.d/rpcd restart
   /etc/init.d/uhttpd restart
   ```

6. **Document module-specific requirements** in module README

## Troubleshooting

### Validation script fails to run

```bash
# Make sure scripts are executable:
chmod +x secubox-tools/*.sh

# Check dependencies:
which python3  # For JSON validation
which shellcheck  # For shell script validation
```

### Git hook not running

```bash
# Check hook is installed:
ls -la .git/hooks/pre-push

# Reinstall hooks:
./secubox-tools/install-git-hooks.sh
```

### False positives in validation

If validation incorrectly reports an error, please report it:
- Create issue with full validation output
- Include module name and specific check that failed
- We'll update validation logic

## Additional Resources

- [CLAUDE.md](CLAUDE.md) - Main project documentation
- [secubox-tools/README.md](secubox-tools/README.md) - Tools documentation
- [.claude/module-prompts.md](.claude/module-prompts.md) - Module generation prompts

## Support

If you encounter validation issues:

1. Check this guide for common errors
2. Run validation with verbose output
3. Review CLAUDE.md for naming conventions
4. Create issue on GitHub with validation output
