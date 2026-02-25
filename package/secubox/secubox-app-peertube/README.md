# SecuBox PeerTube

Federated video streaming platform running in an LXC Debian container.

## Features

- **PeerTube Instance**: Self-hosted video platform with ActivityPub federation
- **Video Import**: Import videos from YouTube, Vimeo, and 1000+ sites via yt-dlp
- **Multi-Track Subtitles**: Automatic subtitle download and sync in multiple languages
- **Video Analysis**: Transcript extraction and Claude AI analysis (peertube-analyse)
- **Live Streaming**: RTMP ingest with HLS output

## Components

| Component | Description |
|-----------|-------------|
| `peertubectl` | Main control script for container management |
| `peertube-import` | Video import with subtitle sync |
| `peertube-analyse` | Transcript extraction and AI analysis |

## Video Import

Import videos from external platforms with automatic subtitle synchronization.

### CLI Usage

```bash
# Basic import
peertube-import https://youtube.com/watch?v=xxx

# Import with multiple subtitle languages
peertube-import --lang fr,en,de,es https://youtube.com/watch?v=xxx

# Import as unlisted video
peertube-import --privacy 2 https://youtube.com/watch?v=xxx

# Import to specific channel
peertube-import --channel 2 https://vimeo.com/xxx
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--lang <codes>` | Subtitle languages (comma-separated) | `fr,en` |
| `--channel <id>` | PeerTube channel ID | `1` |
| `--privacy <level>` | 1=public, 2=unlisted, 3=private | `1` |
| `--output <dir>` | Temp directory for downloads | `/tmp/peertube-import` |
| `--peertube <url>` | PeerTube instance URL | from UCI config |

### Portal Integration

Access via SecuBox Portal → Intelligence & Analyse → Video Import

The portal provides:
- URL input for video source
- Language selection checkboxes
- Privacy level selector
- Real-time progress tracking
- Direct link to imported video

### CGI Endpoints

```bash
# Start import job
curl -X POST http://192.168.255.1/cgi-bin/peertube-import \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=xxx","languages":"fr,en"}'

# Response: {"success": true, "job_id": "import_xxx"}

# Check status
curl "http://192.168.255.1/cgi-bin/peertube-import-status?job_id=import_xxx"

# Response (in progress):
# {"status": "downloading", "progress": 45, "job_id": "import_xxx"}

# Response (completed):
# {"success": true, "video_url": "https://tube.example.com/w/uuid"}
```

## Configuration

UCI config file: `/etc/config/peertube`

```
config peertube 'main'
    option enabled '1'
    option data_path '/srv/peertube'

config peertube 'server'
    option hostname 'tube.example.com'
    option port '9001'
    option https '1'

config peertube 'admin'
    option username 'root'
    option password 'changeme'

config peertube 'transcoding'
    option enabled '1'
    option threads '2'
    list resolutions '480p'
    list resolutions '720p'
```

## Dependencies

- `lxc`, `lxc-common` - Container runtime
- `wget-ssl` - HTTPS downloads
- `tar`, `jsonfilter` - Archive and JSON handling
- `yt-dlp` - Video download (pip install)
- `node` - JavaScript runtime for yt-dlp (opkg install)

## Supported Import Sources

yt-dlp supports 1000+ sites including:
- YouTube, YouTube Music
- Vimeo
- Dailymotion
- Twitch (VODs)
- Twitter/X
- TikTok
- And many more...

See: https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md

## Version

- Package: 1.2.0
- yt-dlp: 2026.2.4 (recommended)
- Node.js: 20.20.0 (for YouTube JS runtime)
