# SecuBox Jitsi Meet

Self-hosted video conferencing with end-to-end encryption for SecuBox.

## Features

- **Secure Video Calls**: End-to-end encrypted video conferences
- **No Account Required**: Guests can join without registration
- **Screen Sharing**: Share your screen with participants
- **Chat & Reactions**: In-meeting chat and emoji reactions
- **Breakout Rooms**: Split meetings into smaller groups
- **Recording**: Optional recording to Dropbox (requires setup)
- **Mobile Support**: iOS and Android apps available
- **HAProxy Integration**: Automatic SSL and reverse proxy setup
- **Mesh Federation**: Announce service on SecuBox mesh network

## Requirements

- Docker and docker-compose
- 2GB+ RAM (4GB recommended)
- Public domain with DNS pointing to your SecuBox
- SSL certificate (via Let's Encrypt or HAProxy)

## Quick Start

```bash
# Install
opkg install secubox-app-jitsi luci-app-jitsi

# Configure domain
uci set jitsi.main.domain='meet.example.com'
uci set jitsi.main.enabled='1'
uci commit jitsi

# Install Docker containers
jitsctl install

# Start service
/etc/init.d/jitsi start
```

## Configuration

### Via LuCI
Navigate to **Services > Jitsi Meet** in the LuCI web interface.

### Via CLI
```bash
# Show status
jitsctl status

# View logs
jitsctl logs

# Add authenticated user
jitsctl add-user admin secretpassword

# Regenerate configuration
jitsctl generate-config

# Restart containers
jitsctl restart
```

### UCI Options

```
config jitsi 'main'
    option enabled '1'
    option domain 'meet.example.com'
    option timezone 'Europe/Paris'

config jitsi 'web'
    option port '8443'
    option enable_guests '1'
    option enable_auth '0'
    option default_language 'en'

config jitsi 'jvb'
    option port '10000'
    option enable_tcp_fallback '0'
    option stun_servers 'meet-jit-si-turnrelay.jitsi.net:443'

config jitsi 'security'
    option lobby_enabled '1'
    option password_required '0'
    option jwt_enabled '0'
```

## HAProxy Integration

If secubox-app-haproxy is installed, Jitsi will automatically configure a vhost:

```bash
jitsctl configure-haproxy
```

This creates:
- HTTPS frontend on port 443
- WebSocket support for real-time communication
- SSL termination (using your certificate)

## Firewall

The following ports are required:

| Port | Protocol | Description |
|------|----------|-------------|
| 443 | TCP | HTTPS (via HAProxy) |
| 8443 | TCP | Direct web access |
| 10000 | UDP | Video/audio streams |
| 4443 | TCP | TCP fallback (optional) |

Firewall rules are automatically added during installation.

## Mesh Integration

Enable mesh federation to:
- Announce Jitsi on the SecuBox mesh network
- Auto-register DNS entry (e.g., meet.c3box.mesh.local)
- Enable multi-node video bridge deployment

```bash
uci set jitsi.mesh.enabled='1'
uci commit jitsi
/etc/init.d/jitsi restart
```

## Troubleshooting

### Containers not starting
```bash
# Check Docker status
docker ps -a

# View container logs
jitsctl logs web
jitsctl logs prosody
jitsctl logs jicofo
jitsctl logs jvb
```

### Video/audio not working
1. Check UDP port 10000 is open on firewall
2. Verify STUN servers are reachable
3. Enable TCP fallback if behind strict NAT

### Authentication issues
```bash
# List users
jitsctl list-users

# Reset user password
jitsctl remove-user admin
jitsctl add-user admin newpassword
```

## Backup & Restore

```bash
# Create backup
jitsctl backup /tmp/jitsi-backup.tar.gz

# Restore
jitsctl restore /tmp/jitsi-backup.tar.gz
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    HAProxy (443)                        │
│                    SSL Termination                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                Docker Network: meet.jitsi                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐    │
│  │   Web   │ │ Prosody │ │ Jicofo  │ │     JVB     │    │
│  │  :8443  │ │  :5222  │ │  :8888  │ │ :10000/UDP  │    │
│  │ React   │ │  XMPP   │ │  Focus  │ │   Media     │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## License

Apache 2.0 - See LICENSE file for details.
