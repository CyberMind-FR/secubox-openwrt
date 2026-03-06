# SecuBox PhotoPrism

Self-hosted Google Photos alternative with AI-powered features, running in an LXC container.

## Features

- **AI Face Recognition** - Automatically detect and group faces
- **Object Detection** - Find photos by objects, scenes, colors
- **Places / Maps** - View photos on a world map
- **Full-Text Search** - Search across all metadata
- **Albums & Sharing** - Organize and share collections
- **RAW Support** - Process RAW files from cameras
- **Video Playback** - Stream videos with transcoding

## Quick Start

```bash
# Install PhotoPrism (creates LXC container)
photoprismctl install

# Start the service
/etc/init.d/photoprism start

# Access the gallery
http://192.168.255.1:2342
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `install` | Create LXC container with PhotoPrism |
| `uninstall` | Remove container (preserves photos) |
| `start/stop/restart` | Service lifecycle |
| `status` | JSON status for RPCD |
| `logs [N]` | Show last N log lines |
| `shell` | Open container shell |
| `index` | Trigger photo indexing |
| `import` | Import from inbox folder |
| `passwd [pass]` | Reset admin password |
| `backup` | Create database backup |
| `configure-haproxy <domain>` | Setup HAProxy + SSL |
| `emancipate <domain>` | Full public exposure |

## Photo Management

### Adding Photos

1. **Direct Copy**: Copy files to `/srv/photoprism/originals/`
2. **Import Inbox**: Copy to `/srv/photoprism/import/`, run `photoprismctl import`
3. **WebDAV**: Enable WebDAV in PhotoPrism settings

### Triggering Index

After adding photos, run indexing:

```bash
photoprismctl index
```

## Public Exposure

Expose gallery to the internet with HAProxy + SSL:

```bash
photoprismctl emancipate photos.example.com
```

This configures:
- HAProxy vhost with Let's Encrypt SSL
- mitmproxy WAF routing
- DNS record (if dnsctl available)

## Configuration

UCI config at `/etc/config/photoprism`:

```
config photoprism 'main'
    option enabled '1'
    option http_port '2342'
    option memory_limit '2G'

config photoprism 'features'
    option face_recognition '1'
    option object_detection '1'
    option places '1'
```

## Resource Requirements

- **RAM**: 2GB recommended (1GB minimum)
- **Storage**: ~500MB for container + your photos
- **CPU**: AI indexing is CPU-intensive

## LuCI Dashboard

Access via: Services → PhotoPrism

Features:
- Status cards (photos, videos, storage)
- Start/Stop/Index/Import buttons
- AI feature toggles
- Emancipate form for public exposure

## Data Paths

| Path | Content |
|------|---------|
| `/srv/photoprism/originals` | Your photos and videos |
| `/srv/photoprism/storage` | Cache, thumbnails, database |
| `/srv/photoprism/import` | Upload inbox |

## Security

- Traffic routes through mitmproxy WAF (no bypass)
- Admin password stored in UCI
- Container runs with limited capabilities
