# SecuBox Troubleshooting FAQ

_Last updated: 2026-02-06_

This document collects resolved issues and their solutions for future reference.

---

## LXC Container Issues

### Issue: LXC containers fail to start with "Failed to mount /sys/fs/cgroup"

**Symptoms:**
```
ERROR cgfsng - Failed to create cgroup at_mnt 38()
ERROR conf - Failed to mount "/sys/fs/cgroup"
ERROR conf - Failed to setup remaining automatic mounts
Received container state "ABORTING" instead of "RUNNING"
```

**Root Cause:**
OpenWrt uses cgroup v2 (unified hierarchy), but LXC configs may be using cgroup v1 syntax.

**Solution:**

1. **Fix global LXC defaults** - Create/edit `/usr/share/lxc/config/common.conf`:
```
# Comment out all lxc.cgroup.devices lines (cgroup v1 syntax)
# These cause "Failed to mount /sys/fs/cgroup" on cgroup v2 systems
#lxc.cgroup.devices.deny = a
#lxc.cgroup.devices.allow = c *:* m
# ... (all device lines commented out)
```

2. **Fix per-container config** - Replace cgroup v1 with v2 syntax:
```
# OLD (cgroup v1 - breaks on cgroup v2 systems):
lxc.cgroup.memory.limit_in_bytes = 256M

# NEW (cgroup v2):
lxc.cgroup2.memory.max = 268435456
```

3. **Add cgroup v2 compatibility flags**:
```
lxc.seccomp.profile =
lxc.tty.max = 0
lxc.pty.max = 256
lxc.cap.drop = sys_module mac_admin mac_override sys_time
```

**Reference:** [OpenWrt Forum LXC Guide](https://forum.openwrt.org/t/openwrt-arm64-quick-lxc-howto-guide-lms-in-debian-system-in-lxc-container/99835)

---

### Issue: LXC container fails with "cgroup:mixed" mount auto

**Symptoms:**
```
ERROR cgfsng - Failed to create cgroup at_mnt 38()
Failed to mount "/sys/fs/cgroup"
```

**Root Cause:**
The `lxc.mount.auto = cgroup:mixed` directive tries to mount cgroup v1 inside the container, which fails on hosts running cgroup v2 (unified hierarchy).

**Solution:**
Remove `cgroup:mixed` from the mount.auto line. For containers using host networking (like HAProxy), use minimal mounts:

```bash
# BAD - causes cgroup mount failures:
lxc.mount.auto = proc:mixed sys:ro cgroup:mixed

# GOOD - works on cgroup v2 systems:
lxc.mount.entry = /some/path opt/somedir none bind,create=dir 0 0
lxc.seccomp.profile =
lxc.autodev = 1
```

**Key Recommendation:**
When creating LXC configs for SecuBox packages, avoid `lxc.mount.auto` entirely. Use explicit `lxc.mount.entry` bind mounts instead and let the container manage its own proc/sys if needed.

---

### Issue: Alpine-based LXC rootfs incompatible with host cgroups

**Symptoms:**
Container starts but immediately exits, or mounts fail inside container.

**Solution:**
Use Debian-based rootfs instead of Alpine. Copy from a working container:
```bash
# Create new container from working Debian rootfs
cp -a /srv/lxc/domoticz/rootfs /srv/lxc/newcontainer/rootfs
```

---

## Networking Issues

### Issue: Port 80 requests redirected to port 8888

**Symptoms:**
HTTP requests on port 80 go to mitmproxy (8888) instead of HAProxy.

**Root Cause:**
mitmproxy WAN protection mode uses nftables to redirect incoming WAN traffic.

**Solution:**
```bash
# Check if mitmproxy WAN protection is enabled
uci get mitmproxy.wan_protection.enabled

# Disable it
uci set mitmproxy.wan_protection.enabled='0'
uci commit mitmproxy

# Remove nftables rules
nft delete table inet mitmproxy_wan
```

---

### Issue: DNS rebind attack blocking internal IPs

**Symptoms:**
BIND (or other DNS server) returns private IP (192.168.x.x), but clients get SERVFAIL.

**Root Cause:**
dnsmasq has DNS rebind protection that blocks private IPs in DNS responses (security feature against DNS rebinding attacks).

**Solution:**
Whitelist the domain in dnsmasq config:
```
# /etc/dnsmasq.d/yourdomain.conf
rebind-domain-ok=/yourdomain.com/
```

Then restart dnsmasq:
```bash
/etc/init.d/dnsmasq restart
```

---

### Issue: WAN traffic not reaching Docker/LXC containers

**Symptoms:**
External requests on ports 80/443 timeout, but LAN access works.

**Root Cause:**
Firewall forward chain missing rules for WAN to Docker bridge.

**Solution:**
```bash
# Check firewall rules
nft list chain inet fw4 forward_wan

# Add forward rules for HTTP/HTTPS
# Via LuCI: Network > Firewall > Traffic Rules
# Or via UCI:
uci add firewall rule
uci set firewall.@rule[-1].name='Forward-HAProxy-HTTP'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].dest='docker'
uci set firewall.@rule[-1].proto='tcp'
uci set firewall.@rule[-1].dest_port='80'
uci set firewall.@rule[-1].target='ACCEPT'
uci commit firewall
/etc/init.d/firewall restart
```

---

## HAProxy Issues

### Issue: Multi-domain SSL certificates not matching correctly (SNI issues)

**Symptoms:**
- Wrong certificate served for some domains
- SSL handshake failures for specific domains
- Browser shows certificate name mismatch warnings

**Root Cause:**
HAProxy directory mode (`crt /path/to/certs/`) uses certificate filenames for SNI matching, which can be unreliable with multiple certificates. The certificate CN/SAN extraction is automatic but may not match the expected domain.

**Solution:**
Use `crt-list` instead of directory mode for explicit domain-to-certificate mapping.

1. Generate `certs.list` file that maps each certificate to its domains:
```bash
haproxyctl generate
# or manually regenerate:
haproxy-sync-certs
```

2. The certs.list format is:
```
/opt/haproxy/certs/example.com.pem example.com
/opt/haproxy/certs/example.com.pem www.example.com
/opt/haproxy/certs/api.example.com.pem api.example.com
```

3. HAProxy config uses:
```
bind *:443 ssl crt-list /opt/haproxy/certs/certs.list alpn h2,http/1.1
```

This was fixed in haproxyctl (2026-02-07) to automatically generate certs.list from certificate SANs.

---

### Issue: HAProxy fails with "unable to find required use_backend"

**Symptoms:**
```
[ALERT] config : Proxy 'https-in': unable to find required use_backend: '127.0.0.1:8091'
```

**Root Cause:**
`haproxyctl generate` created invalid backend references using IP:port format instead of backend names.

**Solution:**
1. Check for invalid backends:
```bash
grep -n 'use_backend.*127.0.0.1' /srv/haproxy/config/haproxy.cfg
```

2. Fix by either:
   - Manually edit the config to use proper backend names
   - Delete the vhost config files and regenerate
   - Create missing backend definitions

```
# Example fix - add missing backend definition:
backend localai
    mode http
    server localai 127.0.0.1:8091 check inter 10s
```

---

## Mitmproxy WAF Issues

### Issue: Mitmproxy container stops after haproxy-enable

**Symptoms:**
`mitmproxyctl haproxy-enable` completes but container is STOPPED.

**Root Cause:**
The enable command restarts services which regenerates the LXC config with cgroup v1 syntax.

**Solution:**
Patch `/usr/sbin/mitmproxyctl` to use cgroup v2 syntax:
```bash
sed -i "s/lxc.cgroup.memory.limit_in_bytes/lxc.cgroup2.memory.max/" /usr/sbin/mitmproxyctl
```

Also add seccomp disable after the cgroup line:
```bash
sed -i "/lxc.cgroup2.memory.max/a lxc.seccomp.profile =" /usr/sbin/mitmproxyctl
```

Then manually fix the container config and restart:
```bash
# Edit /srv/lxc/mitmproxy/config with cgroup v2 syntax
lxc-start -n mitmproxy
```

---

### Issue: Mitmproxy not detecting threats

**Symptoms:**
`/srv/mitmproxy/threats.log` is empty or not being updated.

**Checklist:**
1. Container running: `lxc-info -n mitmproxy`
2. Port 8889 listening: `netstat -tlnp | grep 8889`
3. HAProxy routing through mitmproxy: `grep mitmproxy_inspector /srv/haproxy/config/haproxy.cfg`
4. Routes synced: `cat /srv/mitmproxy/haproxy-routes.json`

**Solution:**
```bash
mitmproxyctl sync-routes
mitmproxyctl haproxy-enable
```

---

## DNS Provider Issues

### Issue: Let's Encrypt DNS-01 fails with CAA timeout

**Symptoms:**
ACME challenge fails because CAA record lookup times out.

**Root Cause:**
Router is authoritative for the domain but dnsmasq cannot serve CAA records.

**Solutions:**

1. **Remove local authority** - Let external DNS (Gandi/Cloudflare) handle everything:
```
# /etc/dnsmasq.d/yourdomain.conf
# Remove: local=/yourdomain.com/
# Keep only: server=/yourdomain.com/127.0.0.1#5353 (for BIND)
# Or forward to external: server=/yourdomain.com/8.8.8.8
```

2. **Use BIND instead of dnsmasq** for authoritative DNS (supports CAA records).

---

## Quick Diagnostic Commands

```bash
# Check all LXC containers
for d in /srv/lxc/*/; do n=$(basename "$d"); lxc-info -n "$n" 2>/dev/null | head -3; done

# Check listening ports
netstat -tlnp | grep -E "80|443|8889|8089"

# Check firewall forward rules
nft list chain inet fw4 forward_wan

# Check DNS resolution
nslookup yourdomain.com 127.0.0.1

# Check mitmproxy status
mitmproxyctl status

# Recent threats
tail -20 /srv/mitmproxy/threats.log

# HAProxy config test
haproxy -c -f /srv/haproxy/config/haproxy.cfg
```

---

### Issue: haproxyctl generate creates invalid backend references

**Symptoms:**
HAProxy config contains `use_backend 127.0.0.1:8091` instead of a named backend.

**Root Cause:**
UCI vhost entries were created with `backend='127.0.0.1:8091'` (IP:port) instead of a named backend like `backend='localai'`.

This happens when:
1. `haproxyctl vhost add` is used with a non-existent backend name
2. Manual UCI edits use IP:port instead of backend name
3. Scripts create vhosts without first creating the backend

**Solution:**
1. Create the backend first:
```bash
haproxyctl backend add localai
haproxyctl server add localai 127.0.0.1:8091
```

2. Then fix the vhost to use the backend name:
```bash
uci set haproxy.<vhost_section>.backend='localai'
uci set haproxy.<vhost_section>.original_backend='localai'
uci commit haproxy
haproxyctl generate
```

3. Add missing backends to haproxy.cfg:
```
backend localai
    mode http
    server localai 127.0.0.1:8091 check inter 10s
```

**Prevention:**
Always create named backends before adding vhosts that reference them.

---

## Package-Specific Fixes Applied

| Package | Issue | Fix |
|---------|-------|-----|
| `mitmproxyctl` | cgroup v1 syntax | Changed to `lxc.cgroup2.memory.max` |
| `dnsmasq` | DNS rebind blocking | Added `rebind-domain-ok` |
| `haproxy` | Invalid backend names | Manual config repair |
| LXC common.conf | cgroup v1 device rules | Commented out device lines |

---

## References

- [OpenWrt LXC ARM64 Guide](https://forum.openwrt.org/t/openwrt-arm64-quick-lxc-howto-guide-lms-in-debian-system-in-lxc-container/99835)
- [LXC cgroup v2 migration](https://linuxcontainers.org/lxc/manpages/man5/lxc.container.conf.5.html)
- [dnsmasq man page - rebind-domain-ok](https://thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html)
