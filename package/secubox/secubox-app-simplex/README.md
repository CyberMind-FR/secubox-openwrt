# SecuBox SimpleX Chat Server

Privacy-first messaging relay server running in an Alpine LXC container. Provides SMP (SimpleX Messaging Protocol) and XFTP (file transfer) services with end-to-end encryption and post-quantum cryptography support.

## Installation

```bash
opkg install secubox-app-simplex
```

## Configuration

UCI config file: `/etc/config/simplex`

```bash
uci set simplex.main.enabled='1'
uci set simplex.main.smp_port='5223'
uci set simplex.main.xftp_port='443'
uci set simplex.main.domain='chat.example.com'
uci commit simplex
```

## Usage

```bash
simplexctl start       # Start SimpleX server (LXC)
simplexctl stop        # Stop SimpleX server
simplexctl status      # Show service status
simplexctl logs        # View server logs
simplexctl address     # Show server address for clients
simplexctl update      # Update SimpleX binaries
```

## HAProxy Integration

Drop-in HAProxy config is provided at `/usr/lib/secubox/haproxy.d/simplex.cfg` for TLS termination and routing through the SecuBox HAProxy instance.

## Features

- SMP relay for SimpleX Chat messaging
- XFTP relay for encrypted file transfers
- End-to-end encryption with post-quantum algorithms
- No user identifiers or metadata collection
- Alpine LXC container isolation

## Dependencies

- `lxc`
- `lxc-common`
- `wget`
- `openssl-util`
- `tar`

## License

Apache-2.0
