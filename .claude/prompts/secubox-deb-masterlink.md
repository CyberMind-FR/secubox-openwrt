# SecuBox-Deb Master-Link API Implementation

## Overview

Implement the Master-Link mesh enrollment API for SecuBox-Deb (Debian/Ubuntu VM version). This allows the VM to act as a **master node** that can onboard OpenWrt peer nodes into the mesh network.

The API should be added to the existing P2P FastAPI service running at `/run/secubox/p2p.sock` and exposed via nginx at `https://<host>/api/v1/p2p/master-link/*`.

## Current State

- P2P service: `/usr/bin/uvicorn api.main:app --uds /run/secubox/p2p.sock`
- Token storage: `/var/lib/secubox/p2p/master-link/tokens.json`
- Peer storage: `/var/lib/secubox/p2p/master-link/peers.json`
- The existing VM already has partial master-link support

## Required API Endpoints

### 1. Status Endpoint
```
GET /master-link/status
```
Returns mesh status:
```json
{
  "enabled": true,
  "role": "master",
  "depth": 0,
  "max_depth": 3,
  "upstream": null,
  "fingerprint": "sb-<unique-id>",
  "hostname": "secubox-vm-x64",
  "auto_approve": false,
  "peers": {
    "pending": 0,
    "approved": 3,
    "rejected": 0,
    "total": 3
  },
  "active_tokens": 1
}
```

### 2. Generate Invite Token
```
POST /master-link/invite
Content-Type: application/json

{
  "auto_approve": true,
  "ttl": 3600
}
```
Returns:
```json
{
  "token": "abc123def456...",
  "hash": "sha256-hash-of-token",
  "expires": "2026-03-26T16:00:00Z",
  "expires_ts": 1774540800,
  "ttl": 3600,
  "auto_approve": true,
  "url": "https://192.168.255.200/master-link/?token=abc123def456..."
}
```

**Token Generation Logic:**
```python
import secrets
import hashlib
from datetime import datetime, timedelta

token = secrets.token_hex(16)  # 32 char hex string
token_hash = hashlib.sha256(token.encode()).hexdigest()
expires = datetime.now() + timedelta(seconds=ttl)
```

### 3. Join Endpoint (for peers)
```
POST /master-link/join
Content-Type: application/json

{
  "token": "abc123def456...",
  "fingerprint": "owrt-0050430d1918",
  "hostname": "C3BOX",
  "address": "192.168.255.1",
  "model": "Globalscale MOCHAbin"
}
```

**Validation Flow:**
1. Hash incoming token: `sha256(token)`
2. Find matching token in `tokens.json` by hash
3. Check token status is "active" and not expired
4. If `auto_approve` is true, immediately approve
5. Otherwise, queue for manual approval

**Success Response (auto-approved):**
```json
{
  "status": "approved",
  "fingerprint": "owrt-0050430d1918",
  "message": "Welcome to the mesh",
  "master_fingerprint": "sb-test123456",
  "depth": 1
}
```

**Success Response (pending):**
```json
{
  "status": "pending",
  "fingerprint": "owrt-0050430d1918",
  "message": "Awaiting master approval"
}
```

**Error Responses:**
```json
{"status": "error", "message": "Invalid or expired token"}
{"status": "error", "message": "Token already used"}
```

### 4. List Peers
```
GET /master-link/peers
```
Returns:
```json
{
  "peers": [
    {
      "fingerprint": "owrt-0050430d1918",
      "hostname": "C3BOX",
      "address": "192.168.255.1",
      "model": "Globalscale MOCHAbin",
      "status": "approved",
      "joined_at": "2026-03-26T14:00:32.721532",
      "depth": 1
    }
  ]
}
```

### 5. Approve/Reject Peer
```
POST /master-link/approve
Content-Type: application/json

{
  "fingerprint": "owrt-0050430d1918",
  "action": "approve"  // or "reject"
}
```

### 6. Cleanup Tokens
```
POST /master-link/cleanup
```
Removes expired and used tokens.

## Data Structures

### tokens.json
```json
[
  {
    "hash": "sha256-of-token",
    "type": "join",
    "created": "2026-03-26T11:44:54.033842",
    "expires": "2026-03-26T12:44:54.033842",
    "expires_ts": 1774529094,
    "ttl": 3600,
    "status": "active",  // active, used, expired
    "auto_approve": true,
    "peer_fp": null,     // filled when used
    "used_by": null,
    "used_at": null
  }
]
```

### peers.json
```json
[
  {
    "fingerprint": "owrt-0050430d1918",
    "hostname": "C3BOX",
    "address": "192.168.255.1",
    "model": "Globalscale MOCHAbin",
    "status": "approved",
    "token_hash": "abc123...",
    "joined_at": "2026-03-26T14:00:32.721532",
    "depth": 1,
    "last_seen": "2026-03-26T15:30:00.000000"
  }
]
```

## CLI Tools (for reference)

The OpenWrt side has these CLI tools that interact with this API:

### sbx-mesh-invite (on master)
Generates invite token and outputs join URL/command.

### sbx-mesh-join (on peer)
Joins a mesh by sending join request with token.

```bash
# On master (VM)
sbx-mesh-invite --ip 192.168.255.200
# Output: Token and join URL

# On peer (OpenWrt)
sbx-mesh-join 192.168.255.200 <token>
```

## Implementation Notes

1. **HTTPS Required**: The join endpoint uses HTTPS (port 443), not HTTP port 7331
2. **Self-signed Certs**: Peers use `--no-check-certificate` (wget) or `-k` (curl)
3. **Token Security**: Tokens are one-time use; mark as "used" immediately upon successful join
4. **Auto-approve**: When `auto_approve=true`, skip manual approval step
5. **Fingerprint**: Use unique device identifier (MAC-based for OpenWrt, random for VMs)

## Integration with Existing UI

The existing LuCI UI at `/admin/services/secubox-mesh` shows:
- Node status (Role, Fingerprint, Peers, Chain)
- ZKP Authentication section
- Generate Token / Cleanup Tokens buttons

These buttons should call the API endpoints above.

## File Locations (secubox-deb)

- API source: `/srv/secubox/api/routers/master_link.py` (to create)
- Data dir: `/var/lib/secubox/p2p/master-link/`
- Config: `/etc/secubox/master-link.yaml`
