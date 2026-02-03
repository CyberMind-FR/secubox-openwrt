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

## RPCD Backend Scripting (Shell-based RPC handlers)

### jshn Argument Size Limits
- **`json_add_string` cannot handle large values** (e.g., base64-encoded images/SVGs)
- jshn passes values as shell arguments, which hit BusyBox's argument size limit ("Argument list too long")
- **Workaround**: Build JSON output manually via file I/O instead of jshn:
  ```sh
  local tmpfile="/tmp/wg_output_$$.json"
  printf '{"field":"' > "$tmpfile"
  # Stream large data via pipe/redirect (never as argument)
  some_command | base64 -w 0 >> "$tmpfile"
  printf '"}\n' >> "$tmpfile"
  cat "$tmpfile"
  rm -f "$tmpfile"
  ```
- This applies to any RPCD method that returns large blobs (QR codes, certificates, etc.)

### UCI Private Data Storage
- Use underscore-prefixed option names for internal/hidden data: `uci set network.section._private_field="value"`
- These are not shown in standard LuCI forms but are accessible via `uci -q get`
- Useful for storing client private keys, internal state, etc.

## LuCI JavaScript Frontend

### RPC `expect` Field Behavior
- **`rpc.declare({ expect: { field: '' } })` unwraps the response** — it returns ONLY the value of `field`, not the full object
- If the backend returns `{"config": "...", "error": "..."}` and expect is `{ config: '' }`, the result is just the config string — `result.error` is undefined
- **Use `expect: { }` (empty object) when you need the full response** including error fields
- Use `expect: { field: default }` only when you always want just that one field and don't need error handling

### Module Caching
- **LuCI's JS module loader caches parsed modules in memory** — `Ctrl+Shift+R` does NOT clear this
- Clearing browser cache, `rm /tmp/luci-indexcache*`, and `rm /tmp/luci-modulecache/*` may not be enough
- **Reliable fix**: Force full page navigation with cache-busting query param:
  ```js
  window.location.href = window.location.pathname + '?' + Date.now();
  ```
- For development, set `uci set uhttpd.main.no_cache=1 && uci commit uhttpd && /etc/init.d/uhttpd restart`

### Quick Deploy for LuCI JS/RPCD Changes
- LuCI JS views and shared resources can be deployed directly to the router without rebuilding:
  ```bash
  # Deploy JS views
  scp htdocs/luci-static/resources/view/<app>/*.js root@192.168.255.1:/www/luci-static/resources/view/<app>/

  # Deploy shared JS libraries
  scp htdocs/luci-static/resources/<app>/*.js root@192.168.255.1:/www/luci-static/resources/<app>/

  # Deploy RPCD handler and restart
  scp root/usr/libexec/rpcd/<handler> root@192.168.255.1:/usr/libexec/rpcd/
  ssh root@192.168.255.1 '/etc/init.d/rpcd restart'

  # Clear LuCI caches on router
  ssh root@192.168.255.1 'rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/*'
  ```

### Common Pitfalls
- **RPC params order matters**: The `params` array in `rpc.declare()` must match the positional arguments in `addPeer(arg1, arg2, ...)` calls — adding a new param means updating ALL callers
- **sessionStorage is volatile**: Data stored in `sessionStorage` is lost on tab close/refresh — don't rely on it for persistent data; use UCI backend storage instead
- **Interface name conflicts**: When creating WireGuard interfaces, always check for existing names (wg0, wg1, etc.) and auto-increment to the next available name
