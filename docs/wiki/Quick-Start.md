# SecuBox Quick Start Guide

Get SecuBox up and running in 10 minutes.

---

## Step 1: First Login

1. Connect to your SecuBox router via Ethernet
2. Open browser: `https://192.168.1.1` (or `192.168.255.1`)
3. Login with: `root` / `c3box`

![Login Screen](../screenshots/router/login.png)

---

## Step 2: Change Password

Navigate to **System > Administration** and change the root password.

---

## Step 3: Network Setup

### Configure WAN

Go to **Network > Interfaces > WAN**:
- Protocol: DHCP Client (or PPPoE/Static)
- Physical interface: eth1

### Configure LAN

Go to **Network > Interfaces > LAN**:
- IPv4 address: `192.168.255.1`
- Netmask: `255.255.255.0`
- DHCP: Enabled

---

## Step 4: Enable Security

### CrowdSec IDS/IPS

Navigate to **SecuBox > Security > CrowdSec Dashboard**:

1. Enable CrowdSec
2. Install default scenarios
3. Configure bouncer

![CrowdSec](../screenshots/router/crowdsec.png)

### WAF (Web Application Firewall)

Navigate to **SecuBox > Security > WAF Filters**:

1. Enable mitmproxy WAF
2. Configure filter rules
3. Set default action: Block

---

## Step 5: Mesh Network

### Enable Mesh Daemon

Navigate to **SecuBox > Mesh > Network**:

1. Enable mesh daemon
2. Set node name
3. Configure WireGuard peers

![Mesh](../screenshots/router/mesh.png)

### Add Peers

Use the QR code scanner or manual configuration:

```bash
# Generate peer config
secuboxctl peer add mynode 10.10.10.2
```

---

## Step 6: Service Exposure

### Tor Hidden Services

Navigate to **SecuBox > Privacy > Tor Shield**:

1. Enable Tor
2. Add hidden service
3. Note your .onion address

### DNS/SSL Exposure

Navigate to **SecuBox > Privacy > Exposure**:

1. Configure DNS provider (OVH, Gandi, Cloudflare)
2. Add domain
3. Request SSL certificate

---

## Step 7: Install Apps

Navigate to **SecuBox > Apps**:

Browse and install from the catalog:
- **Jellyfin** - Media server
- **Nextcloud** - Cloud storage
- **Gitea** - Git server
- **LocalAI** - Local LLM

---

## Common Tasks

### View Metrics

**SecuBox > Dashboard > Metrics**

![Metrics](../screenshots/router/metrics.png)

### Monitor Traffic

**SecuBox > Monitoring > Bandwidth Manager**

### Check Security

**SecuBox > Security > Security Threats**

### Manage VPN

**SecuBox > VPN > WireGuard Dashboard**

---

## CLI Quick Reference

```bash
# System status
secubox status

# Mesh network
secuboxctl status
secuboxctl peers

# WireGuard
wgctl status
wgctl peers

# HAProxy
haproxyctl vhost list
haproxyctl status

# CrowdSec
cscli decisions list
cscli alerts list
```

---

## Next Steps

- [Module Catalog](Modules.md) - Explore all 80+ modules
- [Architecture](Architecture.md) - Understand the system
- [Development](Development.md) - Extend SecuBox

---

*SecuBox v1.0.0*
