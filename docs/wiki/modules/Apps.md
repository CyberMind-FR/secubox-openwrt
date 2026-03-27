# Application Modules

SecuBox provides 20+ self-hosted application modules.

---

## Overview

| Category | Applications |
|----------|--------------|
| **Media** | Jellyfin, Lyrion, PhotoPrism, PeerTube, Webradio |
| **Collaboration** | Nextcloud, Gitea, Jitsi |
| **Communication** | Matrix, Jabber, SimpleX, VoIP |
| **Social** | GoToSocial, PeerTube |
| **IoT** | Domoticz, Zigbee2MQTT, MagicMirror |
| **Utilities** | Torrent, Newsbin, PicoBrew |

---

## Media Server

### Jellyfin

**Package**: `secubox-app-jellyfin` + `luci-app-jellyfin`

Media streaming server.

![Jellyfin](../../screenshots/router/jellyfin.png)

#### Features

- Video streaming (transcoding)
- Music library
- Photo gallery
- Live TV/DVR
- Mobile apps

#### CLI

```bash
jellyfinctl status            # Status
jellyfinctl start             # Start server
jellyfinctl library scan      # Scan library
```

---

### Lyrion

**Package**: `secubox-app-lyrion` + `luci-app-lyrion`

Music server (Lyrion Music Server 9.x).

![Lyrion](../../screenshots/router/lyrion.png)

#### Features

- Multi-room audio
- Squeezebox compatible
- Plugin ecosystem
- Radio streaming
- Material skin

#### CLI

```bash
lyrionctl status              # Status
lyrionctl scan                # Rescan library
lyrionctl players             # List players
```

---

### PhotoPrism

**Package**: `secubox-app-photoprism` + `luci-app-photoprism`

AI-powered photo gallery.

![PhotoPrism](../../screenshots/router/photoprism.png)

#### Features

- AI face recognition
- Object detection
- Places/maps
- Timeline view
- Sharing

---

### PeerTube

**Package**: `secubox-app-peertube` + `luci-app-peertube`

Federated video platform.

![PeerTube](../../screenshots/router/peertube.png)

#### Features

- P2P video delivery
- Federation support
- Live streaming
- Transcoding
- Comments/likes

---

## Collaboration

### Nextcloud

**Package**: `secubox-app-nextcloud` + `luci-app-nextcloud`

Cloud storage and collaboration.

![Nextcloud](../../screenshots/router/nextcloud.png)

#### Features

- File sync
- Calendar/Contacts
- Office documents
- Talk (video calls)
- App ecosystem

---

### Gitea

**Package**: `secubox-app-gitea` + `luci-app-gitea`

Git server with web interface.

![Gitea](../../screenshots/router/gitea.png)

#### Features

- Git hosting
- Issue tracker
- Pull requests
- CI/CD (Actions)
- Wiki

---

### Jitsi

**Package**: `secubox-app-jitsi` + `luci-app-jitsi`

Video conferencing.

![Jitsi](../../screenshots/router/jitsi.png)

#### Features

- Video meetings
- Screen sharing
- Recording
- SRTP encryption
- No account required

---

## Communication

### Matrix

**Package**: `secubox-app-matrix` + `luci-app-matrix`

Matrix chat server (Conduit).

![Matrix](../../screenshots/router/matrix.png)

#### Features

- E2E encryption
- Federation
- Bridges (IRC, Telegram)
- Mobile apps
- Low resource (~15MB RAM)

---

### Jabber

**Package**: `secubox-app-jabber` + `luci-app-jabber`

XMPP server (Prosody).

![Jabber](../../screenshots/router/jabber.png)

#### Features

- XMPP/Jabber protocol
- OMEMO encryption
- File transfer
- Group chat
- S2S federation

---

### SimpleX

**Package**: `secubox-app-simplex` + `luci-app-simplex`

Private messaging.

![SimpleX](../../screenshots/router/simplex.png)

#### Features

- No user identifiers
- E2E encryption
- Decentralized
- Mobile apps

---

### VoIP

**Package**: `secubox-app-voip` + `luci-app-voip`

Asterisk PBX.

![VoIP](../../screenshots/router/voip.png)

#### Features

- SIP/IAX2 trunks
- IVR menus
- Voicemail
- Call recording
- Conference bridges

---

## Social

### GoToSocial

**Package**: `secubox-app-gotosocial` + `luci-app-gotosocial`

ActivityPub social server.

![GoToSocial](../../screenshots/router/gotosocial.png)

#### Features

- Mastodon compatible
- Federation
- Media uploads
- Lightweight

---

## IoT

### Domoticz

**Package**: `secubox-app-domoticz` + `luci-app-domoticz`

Home automation.

![Domoticz](../../screenshots/router/domoticz.png)

#### Features

- Device management
- Automation rules
- MQTT integration
- Energy monitoring
- Camera support

---

### Zigbee2MQTT

**Package**: `secubox-app-zigbee2mqtt` + `luci-app-zigbee2mqtt`

Zigbee to MQTT bridge.

![Zigbee](../../screenshots/router/zigbee.png)

#### Features

- 3000+ device support
- No proprietary hub
- OTA updates
- Device pairing
- Network map

---

### MagicMirror

**Package**: `secubox-app-magicmirror2` + `luci-app-magicmirror2`

Smart mirror platform.

![MagicMirror](../../screenshots/router/magicmirror.png)

#### Features

- Module ecosystem
- Calendar/Weather
- News feeds
- Voice control
- Remote config

---

## Utilities

### Torrent

**Package**: `secubox-app-qbittorrent` + `luci-app-torrent`

BitTorrent client.

![Torrent](../../screenshots/router/torrent.png)

#### Features

- Web interface
- RSS feeds
- Categories
- Speed limits
- VPN support

---

### Webradio

**Package**: `secubox-app-webradio` + `luci-app-webradio`

Internet radio streaming.

![Webradio](../../screenshots/router/webradio.png)

#### Features

- Station management
- MPD integration
- Lyrion integration
- Recording
- Schedule

---

### Mailserver

**Package**: `secubox-app-mailserver` + `luci-app-mailserver`

Full email server.

![Mailserver](../../screenshots/router/mailserver.png)

#### Features

- Postfix + Dovecot
- Webmail (Roundcube)
- DKIM signing
- Spam filtering
- Multiple domains

---

## Installation

### Via App Store

Navigate to **SecuBox > Apps** and browse the catalog.

### Via CLI

```bash
# Install app
opkg install secubox-app-jellyfin luci-app-jellyfin

# Start service
/etc/init.d/jellyfin enable
/etc/init.d/jellyfin start
```

### Container Apps

Most apps run in LXC containers:

```bash
# List containers
lxc-ls -f

# Start container
lxc-start -n jellyfin

# Console access
lxc-attach -n jellyfin
```

---

See also:
- [Publishing Modules](Publishing.md)
- [System Modules](System.md)
- [Architecture](../Architecture.md)

---

*SecuBox v1.0.0*
