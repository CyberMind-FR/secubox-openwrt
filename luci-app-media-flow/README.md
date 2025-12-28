# LuCI Media Flow - Streaming Detection & Monitoring

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active


Real-time detection and monitoring of streaming services with quality estimation and configurable alerts.

## Features

### Streaming Service Detection

Automatically detects and monitors:

**Video Streaming:**
- Netflix, YouTube, Disney+, Prime Video, Twitch
- HBO, Hulu, Vimeo

**Audio Streaming:**
- Spotify, Apple Music, Deezer
- SoundCloud, Tidal, Pandora

**Video Conferencing:**
- Zoom, Microsoft Teams, Google Meet
- Discord, Skype, WebEx

### Quality Estimation

Estimates streaming quality based on bandwidth consumption:
- **SD** (Standard Definition): < 1 Mbps
- **HD** (High Definition): 1-3 Mbps
- **FHD** (Full HD 1080p): 3-8 Mbps
- **4K** (Ultra HD): > 8 Mbps

### Real-time Monitoring

- Active streams dashboard with live updates
- Bandwidth consumption per stream
- Client IP tracking
- Service categorization (video/audio/visio)

### Historical Data

- Session history with timestamps
- Usage statistics per service
- Usage statistics per client
- Configurable retention period

### Alerts

Configure alerts based on:
- Service-specific usage thresholds
- Daily/weekly limits
- Automatic actions (notify, limit, block)

## Dependencies

- **netifyd**: Deep Packet Inspection engine for application detection
- **luci-app-netifyd-dashboard**: Netifyd integration for OpenWrt
- **jq**: JSON processing (for historical data)

## Installation

```bash
opkg update
opkg install luci-app-media-flow
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Configuration

### UCI Configuration

File: `/etc/config/media_flow`

```
config global 'global'
    option enabled '1'
    option history_retention '7'    # Days to keep history
    option refresh_interval '5'     # Seconds between updates

config alert 'netflix_limit'
    option service 'Netflix'
    option threshold_hours '4'      # Hours per day
    option action 'notify'          # notify|limit|block
    option enabled '1'
```

### Adding Alerts

Via LuCI:
1. Navigate to Monitoring → Media Flow → Alerts
2. Click "Add"
3. Configure service name, threshold, and action
4. Save & Apply

Via CLI:
```bash
uci set media_flow.youtube_alert=alert
uci set media_flow.youtube_alert.service='YouTube'
uci set media_flow.youtube_alert.threshold_hours='3'
uci set media_flow.youtube_alert.action='notify'
uci set media_flow.youtube_alert.enabled='1'
uci commit media_flow
```

## ubus API

### Methods

```bash
# Get module status
ubus call luci.media-flow status

# Get active streaming sessions
ubus call luci.media-flow get_active_streams

# Get historical data (last 24 hours)
ubus call luci.media-flow get_stream_history '{"hours": 24}'

# Get statistics by service
ubus call luci.media-flow get_stats_by_service

# Get statistics by client
ubus call luci.media-flow get_stats_by_client

# Get details for specific service
ubus call luci.media-flow get_service_details '{"service": "Netflix"}'

# Set alert
ubus call luci.media-flow set_alert '{"service": "Netflix", "threshold_hours": 4, "action": "notify"}'

# List configured alerts
ubus call luci.media-flow list_alerts
```

## Data Storage

### History File
- Location: `/tmp/media-flow-history.json`
- Format: JSON array of session entries
- Retention: Last 1000 entries
- Rotates automatically

### Statistics Cache
- Location: `/tmp/media-flow-stats/`
- Aggregated statistics per service/client
- Updates every refresh interval

## How It Works

1. **Detection**: Integrates with netifyd DPI engine to detect application protocols
2. **Classification**: Matches detected applications against streaming service patterns
3. **Quality Estimation**: Analyzes bandwidth consumption to estimate stream quality
4. **Recording**: Saves session data to history for analysis
5. **Alerting**: Monitors usage against configured thresholds

## Dashboard Views

### Main Dashboard
- Current streaming status
- Active streams with quality indicators
- Top services by usage
- Auto-refresh every 5 seconds

### Services View
- Detailed statistics per service
- Total sessions, duration, bandwidth
- Service details modal

### Clients View
- Usage statistics per client IP
- Top service per client
- Total consumption

### History View
- Chronological session list
- Filter by time period
- Quality and duration indicators

### Alerts View
- Configure service-based alerts
- Set thresholds and actions
- Enable/disable alerts

## Troubleshooting

### No streams detected

1. Check netifyd is running:
   ```bash
   /etc/init.d/netifyd status
   ```

2. Verify netifyd configuration:
   ```bash
   uci show netifyd
   ```

3. Check netifyd flows:
   ```bash
   ubus call luci.netifyd-dashboard get_flows
   ```

### Quality estimation inaccurate

Quality estimation is based on instantaneous bandwidth and may not reflect actual stream quality. Factors:
- Adaptive bitrate streaming
- Network congestion
- Multiple concurrent streams

### History not saving

1. Check permissions:
   ```bash
   ls -la /tmp/media-flow-history.json
   ```

2. Check jq availability:
   ```bash
   which jq
   opkg install jq
   ```

## Performance

- **CPU Usage**: Minimal (parsing only, netifyd does DPI)
- **Memory**: ~2-5 MB for history storage
- **Disk**: None (tmpfs)
- **Network**: No additional overhead

## Privacy

- All data stored locally on device
- No external telemetry or reporting
- History can be disabled or purged anytime

## License

Apache-2.0

## Author

CyberMind.fr
