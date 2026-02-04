# SecuBox ksmbd Mesh Media Server

In-kernel SMB3 file server for mesh media distribution.

## Quick Start

```bash
# Enable the media server
ksmbdctl enable

# Check status
ksmbdctl status

# Add a custom share
ksmbdctl add-share "Movies" /srv/movies --guest --readonly

# Add authenticated user
ksmbdctl add-user admin

# Register with mesh for discovery
ksmbdctl mesh-register
```

## Default Shares

| Share | Path | Access |
|-------|------|--------|
| Media | /srv/media | Guest RW |
| Jellyfin | /srv/jellyfin/media | Guest RO |
| Lyrion | /srv/lyrion/music | Guest RO |
| Backup | /srv/backup | Auth RW |

## Network Access

- **macOS/Linux**: `smb://192.168.255.1/`
- **Windows**: `\\192.168.255.1\`

## Integration

- **mDNS**: Auto-announced via Avahi (ksmbd-avahi-service)
- **P2P Mesh**: `ksmbdctl mesh-register` for mesh discovery
- **smbfs**: Mount remote shares with `smbfsctl`
