# SecuBox Master-Link

Secure mesh onboarding for SecuBox appliances. A master node generates one-time join tokens, serves the secubox IPK bundle, and approves new peers via blockchain-backed trust. Supports gigogne (nested) hierarchy where approved nodes can become sub-masters.

## Overview

```
  MASTER (depth 0)
  ├── Peer A (depth 1)
  ├── Sub-Master B (depth 1)
  │   ├── Peer C (depth 2)
  │   └── Peer D (depth 2)
  └── Peer E (depth 1)
```

## Installation

```bash
opkg install secubox-master-link luci-app-master-link
```

## Configuration

```bash
# /etc/config/master-link

config master-link 'main'
    option enabled '1'
    option role 'master'          # master | peer | sub-master
    option upstream ''            # upstream master IP (peers/sub-masters)
    option depth '0'              # gigogne depth (0 = root master)
    option max_depth '3'          # max nesting depth
    option token_ttl '3600'       # token validity in seconds
    option auto_approve '0'       # auto-approve join requests
    option ipk_path '/www/secubox-feed/secubox-master-link_*.ipk'
```

## Join Protocol

1. **Master generates token** — one-time HMAC-SHA256 token with TTL
2. **New node opens landing page** — `http://<master>:7331/master-link/?token=...`
3. **New node downloads IPK** — token-validated download via `/api/master-link/ipk`
4. **New node sends join request** — fingerprint + address submitted to master
5. **Master approves** — TOFU key exchange, blockchain block recorded, peer added to mesh
6. **Optional: promote to sub-master** — approved peer can onboard its own peers

## CGI Endpoints

All served on port 7331 under `/api/master-link/`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/token` | POST | Local only | Generate join token |
| `/join` | POST | Token | Submit join request |
| `/approve` | POST | Local only | Approve/reject peer |
| `/status` | GET | Public/Local | Mesh status |
| `/ipk` | POST | Token | Download secubox IPK |

## RPCD API

```bash
ubus call luci.master_link status '{}'
ubus call luci.master_link peers '{}'
ubus call luci.master_link tree '{}'
ubus call luci.master_link token_generate '{}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"approve"}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"reject","reason":"..."}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"promote"}'
ubus call luci.master_link token_cleanup '{}'
```

## Blockchain Block Types

| Type | Description |
|------|-------------|
| `join_request` | New node requesting to join |
| `peer_approved` | Master approved peer |
| `peer_rejected` | Master rejected peer |
| `peer_promoted` | Peer promoted to sub-master |
| `token_generated` | Audit: token was created |

## Security

- **Tokens**: HMAC-SHA256, one-time use, time-limited (default 1h)
- **TOFU**: First join establishes trust via fingerprint exchange
- **Depth limiting**: `max_depth` prevents unbounded nesting
- **Chain integrity**: All actions recorded as blockchain blocks
- **Audit trail**: Token lifecycle and peer events queryable via chain

## Dependencies

- `secubox-p2p` — mesh networking and blockchain
- `openssl-util` — HMAC token generation
- `curl` — peer notification

## License

Apache-2.0
