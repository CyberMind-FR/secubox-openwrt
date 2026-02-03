# SecuBox Mail Server (docker-mailserver)

Full-featured mail server with SMTP, IMAP, POP3, spam filtering, antivirus, and automatic Let's Encrypt certificates. Runs docker-mailserver in a managed Docker container on OpenWrt.

## Installation

```bash
opkg install secubox-app-mailinabox
```

## Configuration

UCI config file: `/etc/config/mailinabox`

```bash
uci set mailinabox.main.enabled='1'
uci set mailinabox.main.hostname='mail.example.com'
uci set mailinabox.main.domain='example.com'
uci set mailinabox.main.ssl='letsencrypt'
uci commit mailinabox
```

## Usage

```bash
mailinaboxctl start              # Start mail server
mailinaboxctl stop               # Stop mail server
mailinaboxctl status             # Show service status
mailinaboxctl user add <email>   # Add mail user
mailinaboxctl user list          # List mail users
mailinaboxctl user del <email>   # Remove mail user
mailinaboxctl logs               # View mail logs
```

## Features

- SMTP (25/587), IMAP (993), POP3 (995)
- SpamAssassin spam filtering
- ClamAV antivirus scanning
- DKIM/SPF/DMARC support
- Automatic Let's Encrypt TLS certificates
- User and alias management via CLI

## Dependencies

- `dockerd`
- `docker`
- `containerd`

## License

Apache-2.0
