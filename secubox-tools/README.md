# SecuBox Development Tools

This directory contains utilities for validating, debugging, and maintaining SecuBox modules.

## Tools Overview

### Validation Tools

#### validate-modules.sh

Fast validation of all modules in the repository.

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

#### validate-module-generation.sh

**NEW!** Comprehensive validation for a single module during/after generation.

**Usage:**
```bash
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache
```

**Checks performed:**
- Makefile completeness (all required fields)
- RPCD script naming convention (luci.* prefix)
- RPCD script structure and handlers
- ACL permissions coverage
- Menu path validation
- JavaScript view validation
- RPC method declarations vs RPCD implementations
- Security scans (hardcoded credentials, dangerous commands)
- Documentation presence

**When to use:**
- After generating a new module
- Before committing changes to a module
- When debugging module integration issues

#### pre-push-validation.sh

**NEW!** Git pre-push hook that validates all modules before allowing push.

**Usage:**
```bash
# Automatic (via git hook):
git push  # validation runs automatically

# Manual:
./secubox-tools/pre-push-validation.sh
```

**Checks performed:**
- All validation from validate-modules.sh
- Git staged changes analysis
- Modified module detection
- Comprehensive security scans
- Full module validation on modified modules

**Exit codes:**
- `0` - Push allowed
- `1` - Push blocked (critical errors found)

**Installation:**
```bash
./secubox-tools/install-git-hooks.sh
```

### Maintenance Tools

#### secubox-repair.sh

Auto-repair tool that fixes common issues in Makefiles and RPCD scripts.

**Usage:**
```bash
./secubox-tools/secubox-repair.sh
```

#### secubox-debug.sh

Validates individual package structure and dependencies on OpenWrt device.

**Usage:**
```bash
./secubox-tools/secubox-debug.sh luci-app-<module-name>
```

#### install-git-hooks.sh

**NEW!** Installs git hooks for automatic validation.

**Usage:**
```bash
./secubox-tools/install-git-hooks.sh
```

This creates a symbolic link from `.git/hooks/pre-push` to `pre-push-validation.sh`.

## Recommended Workflow

### When Generating a New Module

1. **Generate module files** (use Claude with module-prompts.md)

2. **Validate the module:**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

3. **Fix all ERRORS** (critical)

4. **Review and fix WARNINGS** (recommended)

5. **Commit changes:**
   ```bash
   git add luci-app-<module-name>
   git commit -m "feat: implement <module-name> module"
   git push  # Pre-push validation runs automatically
   ```

### When Modifying Existing Modules

1. **Make your changes**

2. **Run quick validation:**
   ```bash
   ./secubox-tools/validate-modules.sh
   ```

3. **For complex changes, run full validation:**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

4. **Commit and push** (validation runs automatically)

### Before Committing Changes

Always run at least one validation tool before committing:

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
