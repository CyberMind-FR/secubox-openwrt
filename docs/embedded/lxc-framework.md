# SecuBox LXC Framework (Preview)

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This document captures the baseline LXC tooling added in Step 8. It is a foundation for future “SecuBox Apps” packaged as LXC containers (e.g., Lyrion) and explains the combined CLI/UCI workflow.

---

## Components

1. **UCI config:** `/etc/config/lxcapps` (one section per container).  
2. **Storage root:** `/srv/lxc/<name>/` (rootfs, config, logs).  
3. **Templates:** `/usr/share/secubox/lxc/templates/` (scripts/tarballs; default `debian`).  
4. **CLI helper:** `secubox-tools/lxc/secubox-lxc` (install to `/usr/sbin/secubox-lxc`).

`secubox-lxc` requires standard OpenWrt LXC packages (`lxc`, `lxc-templates`, `lxc-start`, etc.) and uses BusyBox-friendly syntax.

---

## CLI Usage

```bash
# List defined containers
secubox-lxc list

# Create container using the debian template and attach to br-dmz
secubox-lxc create lyrion --bridge br-dmz --ip 192.168.50.10

# Start / stop lifecycle
secubox-lxc start lyrion
secubox-lxc stop lyrion

# Show detailed config or status
secubox-lxc show lyrion
secubox-lxc status lyrion

# Remove
secubox-lxc delete lyrion
```

`secubox-lxc create <name>` automatically creates a `config` section under `lxcapps.<name>` capturing bridge/IP/memory metadata, so LuCI (future apps) can introspect containers in a consistent way.

---

## UCI Schema (`/etc/config/lxcapps`)

```uci
config container 'lyrion'
    option bridge 'br-dmz'
    option ip '192.168.50.10'
    option gateway '192.168.50.1'
    option dns '1.1.1.1'
    option memory '1024'
```

This initial version does not yet tie into LuCI, but the schema is ready for future RPC endpoints and wizards (e.g., mapping profile entries to LXC containers).

---

## Storage & Templates

- Default rootfs path: `/srv/lxc/<name>/rootfs`.  
- Template lookup order: CLI `--template` → `/usr/share/secubox/lxc/templates/<name>` → fallback to system `lxc-create -t debian`.  
- Bridge defaults to `br-lan`; pass `--bridge br-dmz` to isolate DMZ containers.

---

## Next Steps

This foundation enables the remaining roadmap items:

- Expose `/etc/config/lxcapps` via `luci-app-secubox` RPC for integration with the App Store/wizard.  
- Add profiles or manifests referencing specific LXC definitions (e.g., `type": "lxc"`).  
- Ship ready-made templates (Lyrion, etc.) and document cgroup requirements alongside Docker apps.

For now, use the CLI + UCI schema to experiment with LXC containers on OpenWrt ARM64 and validate storage/network assumptions.
