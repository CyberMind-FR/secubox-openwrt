# Claude Instructions for SecuBox OpenWrt

## Session Startup — Follow the Roadmap

**Before starting any work, always read the project planning files to understand current priorities and context:**

1. `.claude/TODO.md` — Open tasks and backlog, ordered by priority
2. `.claude/WIP.md` — Active threads, next-up items, and blockers
3. `.claude/HISTORY.md` — Completed milestones with dates (gap analysis reference)
4. `.claude/context.md` — Module map, stack overview, and templates
5. `package/secubox/PUNK-EXPOSURE.md` — Architectural spec for exposure features
6. `.claude/FAQ-TROUBLESHOOTING.md` — **Consult before debugging** — resolved issues and known fixes for LXC cgroups, networking, HAProxy, mitmproxy, DNS

**When the user says "continue" or "next"**, consult WIP.md "Next Up" and TODO.md "Open" to pick the next task. When completing work, update these files to keep them current. New features and fixes must be appended to HISTORY.md with the date.

## Security Policies

### WAF Bypass Prohibition
- **NEVER set `waf_bypass='1'` on any HAProxy vhost** — All traffic MUST pass through the mitmproxy WAF for inspection
- When adding new services/domains to HAProxy, route through `mitmproxy_inspector` backend and add the upstream route to `/srv/mitmproxy/haproxy-routes.json`
- If a service needs special handling (WebSocket, long connections), configure mitmproxy to properly forward the traffic rather than bypassing WAF
- Use `mitmproxyctl sync-routes` to regenerate routes from HAProxy backends, then manually add any missing routes for backends that don't have standard server entries

### Mitmproxy Route Configuration
When adding a new service that routes through HAProxy → mitmproxy:
1. Add vhost: `haproxyctl vhost add <domain>`
2. Backend will default to `mitmproxy_inspector` (correct)
3. Add route to mitmproxy: Edit `/srv/mitmproxy/haproxy-routes.json` and `/srv/mitmproxy-in/haproxy-routes.json`:
   ```json
   "domain.example.com": ["127.0.0.1", PORT]
   ```
4. Restart mitmproxy: `/etc/init.d/mitmproxy restart`

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

### ACL Permissions for New RPC Methods
- **CRITICAL: When adding a new RPCD method, you MUST also add it to the ACL file**
- Without ACL entry, LuCI will return `-32002: Access denied` error
- ACL files are located at: `root/usr/share/rpcd/acl.d/<app>.json`
- Add read-only methods to the `"read"` section, write/action methods to the `"write"` section:
  ```json
  {
    "luci-app-example": {
      "read": {
        "ubus": {
          "luci.example": ["status", "list", "get_info"]
        }
      },
      "write": {
        "ubus": {
          "luci.example": ["create", "delete", "update", "action_method"]
        }
      }
    }
  }
  ```
- After deploying ACL changes, restart rpcd AND have user re-login to LuCI:
  ```bash
  scp root/usr/share/rpcd/acl.d/<app>.json root@192.168.255.1:/usr/share/rpcd/acl.d/
  ssh root@192.168.255.1 '/etc/init.d/rpcd restart'
  ```
- User must log out and log back into LuCI to get new permissions

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

## Punk Exposure Engine — Architectural Directive

The SecuBox service exposure architecture follows a three-verb model called **Peek / Poke / Emancipate**. All new service components, exposure features, and mesh integrations must align with this model.

### Core Concepts

- **Peek**: Discover and scan. Any feature that detects services, lists DNS records, shows mesh peers, or aggregates visibility across nodes.
- **Poke**: Target and configure. Any feature that selects a service and configures an exposure channel (Tor, DNS/SSL, mesh publish).
- **Emancipate**: Activate the linking flow. Any feature that atomically makes a service reachable through one or more channels.

### Three Exposure Channels

1. **Tor** — `.onion` hidden services via `secubox-app-tor` + `secubox-exposure tor add`
2. **DNS/SSL** — Classical HTTPS via HAProxy + ACME + DNS provider API (OVH, Gandi, Cloudflare) via `secubox-app-dns-provider` + `dnsctl`
3. **Mesh** — P2P service registry via `secubox-p2p publish` + gossip chain sync

### Key Architectural Rules

- **Match services by port, not name** — when cross-referencing scan results with Tor/SSL/vhost/mesh entries, always use the backend port number as the join key
- **DNS provider API integration** — use `dnsctl` (from `secubox-app-dns-provider`) for programmatic DNS record management; support DNS-01 ACME challenges as alternative to HTTP-01 webroot
- **Emancipate is multi-channel** — exposing a service should support activating Tor + DNS + Mesh in a single flow; each channel is independently togglable
- **Every station is generative** — each SecuBox node can discover local services, create new exposure endpoints, and propagate them to mesh peers
- **Guard against local-only exposure** — never auto-expose services bound to 127.0.0.1; only services on 0.0.0.0 or specific LAN IPs are eligible for external exposure

### Reference Document

Full architectural spec: `package/secubox/PUNK-EXPOSURE.md`

### Affected Packages

| Package | Role in Punk Exposure |
|---------|----------------------|
| `secubox-app-exposure` | Peek scanner + Tor/SSL orchestrator |
| `luci-app-exposure` | Dashboard: Peek table + Poke toggles |
| `secubox-app-tor` | Tor channel backend |
| `secubox-app-haproxy` | SSL/ACME channel backend |
| `secubox-app-dns-provider` | DNS provider API (to build) |
| `secubox-p2p` | Mesh channel + gossip sync |
| `secubox-master-link` | Node onboarding + trust hierarchy |
| `luci-app-service-registry` | Aggregated service catalog + health checks |

### Emancipate CLI Commands

**Multi-channel exposure in one command:**
```bash
# Full emancipation (Tor + DNS + Mesh)
secubox-exposure emancipate <service> <port> <domain> --all

# Selective channels
secubox-exposure emancipate myapp 8080 myapp.secubox.in --dns --mesh
secubox-exposure emancipate secret 8888 --tor  # Tor only, no domain needed

# MetaBlogizer KISS workflow
metablogizerctl create myblog blog.example.com
metablogizerctl emancipate myblog  # Auto: DNS + Vortex + HAProxy + SSL + Reload

# Revoke exposure
secubox-exposure revoke myapp --all
```

**Vortex DNS mesh publishing:**
```bash
# Publish service to mesh
vortexctl mesh publish <service> <domain>

# Check mesh status
vortexctl status
```

## Documentation Update Workflow

**When source code evolves, always update documentation:**

1. **HISTORY.md** — Append new entry with date and feature summary
2. **WIP.md** — Move completed items to "Recently Completed", update "Next Up"
3. **Package README.md** — Update if CLI commands or features change
4. **Catalog JSON** — Update if package version or description changes

**Commit message format for documentation:**
```bash
git commit -m "docs: Update tracking files for <feature>"
```

**README update triggers:**
- New CLI command added
- New RPCD method added
- Configuration options changed
- Dependencies changed
- Major feature added

**Quick documentation check:**
```bash
# See what's changed
git diff --stat

# Update tracking files if source files were modified
if git diff --name-only | grep -qE 'package/secubox/'; then
  echo "Update .claude/HISTORY.md with changes"
  echo "Update .claude/WIP.md if task completed"
fi
```
