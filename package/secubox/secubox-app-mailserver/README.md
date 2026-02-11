# SecuBox Mail Server

Custom mail server (Postfix + Dovecot) running in LXC container with mesh backup support.

## Features

- **Postfix** - SMTP server with virtual domains
- **Dovecot** - IMAP/POP3 with LMTP delivery
- **Rspamd** - Spam filtering
- **OpenDKIM** - Email signing
- **Mesh Backup** - P2P backup sync with other SecuBox nodes
- **Webmail Integration** - Works with Roundcube container

## Installation

```bash
opkg install secubox-app-mailserver
```

## Quick Start

```bash
# 1. Configure domain
uci set mailserver.main.domain='example.com'
uci set mailserver.main.hostname='mail'
uci commit mailserver

# 2. Install container
mailctl install

# 3. Set up DNS records (MX, SPF, DMARC)
mailctl dns-setup

# 4. Get SSL certificate
mailctl ssl-setup

# 5. Add mail users
mailctl user add user@example.com

# 6. Enable and start
uci set mailserver.main.enabled=1
uci commit mailserver
/etc/init.d/mailserver start

# 7. Configure webmail
mailctl webmail configure
```

## CLI Reference

### Service Control

```bash
mailctl start      # Start mail server
mailctl stop       # Stop mail server
mailctl restart    # Restart mail server
mailctl status     # Show status
```

### User Management

```bash
mailctl user add user@domain.com    # Add user (prompts for password)
mailctl user del user@domain.com    # Delete user
mailctl user list                   # List all users
mailctl user passwd user@domain.com # Change password
```

### Aliases

```bash
mailctl alias add info@domain.com user@domain.com
mailctl alias list
```

### SSL Certificates

```bash
mailctl ssl-setup    # Obtain Let's Encrypt cert via DNS-01
mailctl ssl-status   # Show certificate info
```

### DNS Integration

```bash
mailctl dns-setup    # Create MX, SPF, DMARC records via dnsctl
```

### Mesh Backup

```bash
mailctl mesh backup              # Create backup for mesh sync
mailctl mesh restore <file>      # Restore from backup
mailctl mesh sync push           # Push to mesh peers
mailctl mesh sync pull           # Pull from mesh peers
mailctl mesh add-peer <peer_id>  # Add mesh peer
mailctl mesh peers               # List configured peers
mailctl mesh enable              # Enable mesh sync
mailctl mesh disable             # Disable mesh sync
```

### Webmail

```bash
mailctl webmail status      # Check Roundcube status
mailctl webmail configure   # Point Roundcube to this server
```

### Diagnostics

```bash
mailctl logs         # View mail logs (last 50 lines)
mailctl logs 100     # View last 100 lines
mailctl test user@external.com   # Send test email
```

## UCI Configuration

```
config mailserver 'main'
    option enabled '0'
    option hostname 'mail'
    option domain 'example.com'
    option postmaster 'postmaster'
    option data_path '/srv/mailserver'
    option container 'mailserver'

config ports 'ports'
    option smtp '25'
    option submission '587'
    option smtps '465'
    option imap '143'
    option imaps '993'
    option pop3 '110'
    option pop3s '995'

config features 'features'
    option spam_filter '1'
    option virus_scan '0'
    option dkim '1'
    option spf '1'
    option dmarc '1'
    option fail2ban '1'

config ssl 'ssl'
    option type 'letsencrypt'

config webmail 'webmail'
    option enabled '1'
    option container 'secubox-webmail'
    option port '8026'

config mesh 'mesh'
    option enabled '0'
    option backup_peers ''
    option sync_interval '3600'
```

## Data Structure

```
/srv/mailserver/
├── config/          # Postfix/Dovecot config
│   ├── vmailbox     # Virtual mailbox map
│   ├── valias       # Virtual alias map
│   └── users        # Dovecot user database
├── mail/            # Maildir storage
│   └── example.com/
│       └── user/
│           ├── cur/
│           ├── new/
│           └── tmp/
└── ssl/             # SSL certificates
    ├── fullchain.pem
    └── privkey.pem
```

## DNS Records Required

The `mailctl dns-setup` command creates these records via `dnsctl`:

| Type | Name | Value |
|------|------|-------|
| A | mail | `<public-ip>` |
| MX | @ | `10 mail.example.com.` |
| TXT | @ | `v=spf1 mx a:mail.example.com ~all` |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:postmaster@example.com` |
| TXT | mail._domainkey | `v=DKIM1; k=rsa; p=<public-key>` |

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 25 | SMTP | Mail transfer (server-to-server) |
| 587 | Submission | Mail submission (client-to-server) |
| 465 | SMTPS | Secure SMTP |
| 143 | IMAP | Mail access |
| 993 | IMAPS | Secure IMAP |
| 110 | POP3 | Mail download (optional) |
| 995 | POP3S | Secure POP3 (optional) |
| 4190 | Sieve | Mail filtering rules |

## Dependencies

- `lxc` - Container runtime
- `secubox-app-dns-provider` - DNS record management
- `acme` - SSL certificate automation (optional)
- `secubox-p2p` - Mesh backup sync (optional)
