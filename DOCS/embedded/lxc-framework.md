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

`secubox-lxc` requires standard OpenWrt LXC packages and uses BusyBox-friendly syntax.

---

## CLI Usage

```bash
secubox-lxc list        # show defined containers
secubox-lxc create lyrion --bridge br-dmz --ip 192.168.50.10
secubox-lxc start lyrion
secubox-lxc stop lyrion
secubox-lxc status lyrion
secubox-lxc delete lyrion
```

Each `create` call ensures the container directory under `/srv/lxc/<name>` and writes a matching `config container '<name>'` section in `/etc/config/lxcapps`. That makes it discoverable for future LuCI integrations.

---

## UCI Schema

```uci
config container 'lyrion'
    option bridge 'br-dmz'
    option ip '192.168.50.10'
    option gateway '192.168.50.1'
    option dns '1.1.1.1'
    option memory '1024'
```

Additional options (template, rootfs, custom scripts) can be added later; the CLI already supports `--template`, `--memory`, `--bridge`, `--ip`, `--gateway`, and `--dns` flags.

---

## Storage & Templates

- Default rootfs path: `/srv/lxc/<name>/rootfs`.  
- Template lookup: CLI `--template` arg → `/usr/share/secubox/lxc/templates/<name>` → system `lxc-create -t debian`.  
- Bridge defaults to `br-lan`; pass `--bridge br-dmz` for DMZ containers.

---

## Future Work

- Expose `/etc/config/lxcapps` via RPC + LuCI so manifests/profiles can declare LXC apps.
- Ship Lyrion and other container templates alongside Docker apps in the App Store.
- Reuse the profile system to install LXC dependencies and provision containers automatically.

For now, this tooling lets power users validate LXC on OpenWrt ARM64 and gives the App Store a consistent foundation.
