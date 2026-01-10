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

### Port Detection
When checking if a port is listening, use this order of fallbacks:
1. `/proc/net/tcp` (always available) - ports are in hex (e.g., 8080 = 1F90)
2. `netstat -tln` (usually available)
3. `ss -tln` (may not be available)

### Logging
- OpenWrt uses `logread` instead of traditional log files
- Use `logread -l N` to get last N lines
- CrowdSec writes to `/var/log/crowdsec.log`
