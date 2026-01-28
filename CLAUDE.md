# Claude Instructions for SecuBox OpenWrt

## OpenWrt Shell Scripting Guidelines

### Process Detection
- **Use `pgrep crowdsec` instead of `pgrep -x crowdsec`**
  - The `-x` flag requires an exact process name match which doesn't work reliably on OpenWrt/BusyBox
  - Same applies to other daemons: use `pgrep <name>` without `-x`

### Command Availability
- `timeout` command is NOT available on OpenWrt by default - use alternatives or check with `command -v timeout`
- `ss` command may not be available - use `netstat` or `/proc/net/tcp` as fallbacks
- `sqlite3` may not be installed - provide fallback methods (e.g., delete database file instead of running SQL)

### JSON Parsing
- **Use `jsonfilter` instead of `jq`** - jsonfilter is native to OpenWrt (part of libubox), jq is often not installed
- Syntax examples:
  ```bash
  # Get a field value
  jsonfilter -i /path/to/file.json -e '@.field_name'

  # Get nested field
  jsonfilter -i /path/to/file.json -e '@.parent.child'

  # Get array length (count elements)
  jsonfilter -i /path/to/file.json -e '@[*]' | wc -l

  # Get array element
  jsonfilter -i /path/to/file.json -e '@[0]'
  ```
- Always check for empty results: `[ -z "$result" ] && result=0`

### Port Detection
When checking if a port is listening, use this order of fallbacks:
1. `/proc/net/tcp` (always available) - ports are in hex (e.g., 8080 = 1F90)
2. `netstat -tln` (usually available)
3. `ss -tln` (may not be available)

### Logging
- OpenWrt uses `logread` instead of traditional log files
- Use `logread -l N` to get last N lines
- CrowdSec writes to `/var/log/crowdsec.log`

## Build & Sync Workflow

### CRITICAL: Sync Local Feed Before Building
- **ALWAYS sync the local-feed before building packages from edited source trees**
- The build system uses `secubox-tools/local-feed/` NOT `package/secubox/` directly
- If you edit files in `package/secubox/<pkg>/`, those changes won't be built unless synced

**Before building after edits:**
```bash
# Option 1: Sync specific package to local-feed
rsync -av --delete package/secubox/<package-name>/ secubox-tools/local-feed/<package-name>/

# Option 2: Sync all SecuBox packages
for pkg in package/secubox/*/; do
  name=$(basename "$pkg")
  rsync -av --delete "$pkg" "secubox-tools/local-feed/$name/"
done

# Then build
./secubox-tools/local-build.sh build <package-name>
```

**Quick deploy without rebuild (for RPCD/shell scripts):**
```bash
# Copy script directly to router for testing
scp package/secubox/<pkg>/root/usr/libexec/rpcd/<script> root@192.168.255.1:/usr/libexec/rpcd/
ssh root@192.168.255.1 '/etc/init.d/rpcd restart'
```

### Local Feeds Hygiene
- Clean and resync local feeds before build iterations when dependency drift is suspected
- Prefer the repo helpers; avoid ad-hoc `rm` unless explicitly needed

### Local Build Flow
- Use `./secubox-tools/local-build.sh build <module>` for cached SDK builds
- If CI parity is required, use `make package/<module>/compile V=s`

### Sync Build Artifacts
- After building, synchronize results into the build output folder used by local-build.sh
- Use the repo sync helper scripts where available to avoid missing `root/` vs `htdocs/` payloads

### Toolchain Usage
- **CRITICAL: Non-LuCI SecuBox apps MUST be built with the full OpenWrt toolchain, NOT the SDK**
  - Go packages (crowdsec, crowdsec-firewall-bouncer) require the full toolchain due to CGO and ARM64 compatibility
  - Native C/C++ binaries (netifyd, nodogsplash) require the full toolchain
  - The SDK produces binaries with LSE atomic instructions that crash on some ARM64 CPUs (like MochaBin's Cortex-A72)

- Packages requiring full toolchain build (in `secubox-tools/openwrt`):
  - `crowdsec` - Go binary with CGO
  - `crowdsec-firewall-bouncer` - Go binary with CGO
  - `netifyd` - C++ native binary
  - `nodogsplash` - C native binary

- To build with full toolchain:
  ```bash
  cd secubox-tools/openwrt
  make package/<package-name>/compile V=s
  ```

- LuCI apps and pure shell/Lua packages can use the SDK:
  ```bash
  cd secubox-tools/sdk
  make package/<package-name>/compile V=s
  # Or use local-build.sh for LuCI apps
  ```

- If unsure, check `OPENWRT_ONLY_PACKAGES` in `secubox-tools/local-build.sh`
