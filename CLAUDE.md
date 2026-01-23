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
- Use the OpenWrt toolchain when a module requires it (native SDK packages, toolchain-bound dependencies)
- If unsure, start with `local-build.sh`; fall back to full toolchain builds when SDK cache cannot resolve dependencies
