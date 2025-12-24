# SecuBox Development Tools

This directory contains utilities for validating, debugging, and maintaining SecuBox modules.

## Tools

### validate-modules.sh

Comprehensive validation script that checks all critical naming conventions and module structure.

**Usage:**
```bash
./secubox-tools/validate-modules.sh
```

**Checks performed:**
1. **RPCD script names vs ubus objects** - Ensures RPCD script filenames match JavaScript ubus object declarations
2. **Menu paths vs view files** - Verifies menu.d JSON paths correspond to actual view files
3. **View files have menu entries** - Checks that all view files are referenced in menus
4. **RPCD script permissions** - Ensures scripts are executable
5. **JSON syntax validation** - Validates all menu.d and acl.d JSON files
6. **ubus naming convention** - Verifies all ubus objects use the `luci.` prefix

**Exit codes:**
- `0` - All checks passed (or only warnings)
- `1` - Critical errors found

**Example output:**
```
✓ luci-app-cdn-cache: RPCD script 'luci.cdn-cache' matches ubus object 'luci.cdn-cache'
✓ luci-app-cdn-cache: Menu path 'cdn-cache/overview' → file exists
❌ ERROR: luci-app-example: RPCD script 'example' does not match ubus object 'luci.example'
```

### secubox-repair.sh

Auto-repair tool that fixes common issues in Makefiles and RPCD scripts.

**Usage:**
```bash
./secubox-tools/secubox-repair.sh
```

### secubox-debug.sh

Validates individual package structure and dependencies.

**Usage:**
```bash
./secubox-tools/secubox-debug.sh luci-app-<module-name>
```

## Recommended Workflow

Before committing changes:

1. **Run validation** (CRITICAL):
   ```bash
   ./secubox-tools/validate-modules.sh
   ```

2. Fix any errors reported

3. Run shellcheck on RPCD scripts:
   ```bash
   shellcheck luci-app-*/root/usr/libexec/rpcd/*
   ```

4. Commit changes

## Common Fixes

### Fix RPCD naming mismatch

If validation reports RPCD script name doesn't match ubus object:

```bash
# Rename the script to include luci. prefix
cd luci-app-example/root/usr/libexec/rpcd
mv example luci.example
```

### Fix menu path mismatch

If validation reports menu path doesn't match view file:

```bash
# Option 1: Update menu.d JSON to match file location
# Edit: root/usr/share/luci/menu.d/luci-app-example.json
# Change: "path": "example/view" → "path": "example-dashboard/view"

# Option 2: Move view files to match menu path
mv htdocs/luci-static/resources/view/example-dashboard \
   htdocs/luci-static/resources/view/example
```

### Fix non-executable RPCD script

```bash
chmod +x luci-app-example/root/usr/libexec/rpcd/luci.example
```

## Integration with CI/CD

The validation script can be integrated into GitHub Actions workflows:

```yaml
- name: Validate modules
  run: |
    chmod +x secubox-tools/validate-modules.sh
    ./secubox-tools/validate-modules.sh
```

## Critical Naming Rules

**These rules are MANDATORY** - violations will cause runtime errors:

1. **RPCD scripts** must be named `luci.<module-name>`
   - ✅ `luci.cdn-cache`
   - ❌ `cdn-cache`

2. **Menu paths** must match view file locations
   - Menu: `"path": "cdn-cache/overview"`
   - File: `view/cdn-cache/overview.js`

3. **ubus objects** must use `luci.` prefix
   - ✅ `object: 'luci.cdn-cache'`
   - ❌ `object: 'cdn-cache'`

See `CLAUDE.md` for complete documentation.
