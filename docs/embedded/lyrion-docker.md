# Lyrion Media Server on SecuBox

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This guide explains how to run [Lyrion Media Server](https://lyrion.org/) (formerly Jellyfin fork) inside Docker via the new `secubox-app-lyrion` package and SecuBox App Store manifest.

---

## Installation Steps

```sh
opkg update
opkg install secubox-app-lyrion luci-app-vhost-manager
lyrionctl install     # checks Docker, prepares /srv/lyrion, pulls container
/etc/init.d/lyrion start
```

Then open **SecuBox → Wizard → App Wizards → Lyrion** to configure data/media paths and HTTP port. The manifest is stored in `/usr/share/secubox/plugins/lyrion/manifest.json` so `secubox-app list` will show it.

---

## UCI Configuration (`/etc/config/lyrion`)

```uci
config lyrion 'main'
    option enabled '1'
    option image 'ghcr.io/lyrion/lyrion:latest'
    option data_path '/srv/lyrion'
    option media_path '/srv/media'
    option port '8096'
    option timezone 'UTC'
```

Apply changes via LuCI wizard or CLI:
```sh
uci set lyrion.main.media_path='/srv/media'
uci commit lyrion
/etc/init.d/lyrion restart
```

---

## CLI Helper (`/usr/sbin/lyrionctl`)

- `lyrionctl install` – ensures Docker packages, prepares data dir, pulls image, enables service.  
- `lyrionctl check` – rerun prerequisite checks.  
- `lyrionctl update` – pull latest image and restart if enabled.  
- `lyrionctl status` / `lyrionctl logs [-f]`.  
- `lyrionctl service-run` – invoked by procd; do not call manually.

The Docker container exposes `http://<router>:<port>` (default 8096). Bind it via `luci-app-vhost-manager` to a public hostname if needed.

---

## VHost Exposure

After Lyrion is running, publish it through the VHost manager (or `scripts/vhostctl.sh`):
```sh
scripts/vhostctl.sh add \
  --domain media.secubox.local \
  --upstream http://127.0.0.1:8096 \
  --tls acme --websocket
scripts/vhostctl.sh reload
```

Combine with the **Gateway + DMZ** profile to place Lyrion inside a DMZ VLAN while still proxying the UI via HTTPS.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `lyrionctl install` warns about `/srv/media` | Create/mount your media directory and rerun `lyrionctl install`. |
| Docker fails to start | Ensure `dockerd` is enabled; run `/etc/init.d/dockerd restart`. |
| Cannot reach UI | Check that port 8096 is free or adjust `option port`. |
| Media directory permissions | Bind-mount path with read permissions (`chmod -R 755`). |

The manifest + wizard approach makes it easy to rebuild the container (via `secubox-app install lyrion`) while keeping UCI-driven defaults consistent across profiles.
