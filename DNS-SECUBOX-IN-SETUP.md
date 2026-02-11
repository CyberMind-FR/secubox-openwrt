# DNS Setup Guide: Register secubox.in as Master on secubox.maegia.tv

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step-by-Step Configuration](#step-by-step-configuration)
5. [Configuration Files](#configuration-files)
6. [Verification and Testing](#verification-and-testing)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)
9. [Maintenance](#maintenance)

## Overview

This guide provides comprehensive instructions for setting up `secubox.in` as a master DNS zone with `secubox.maegia.tv` configured as a slave/peer server. This setup enables redundant DNS service and load balancing between the two servers.

### Key Features
- **Master-Slave DNS Replication**: Automatic zone transfers from master to slave
- **High Availability**: Redundant DNS service across two servers
- **Automatic Updates**: Slave server receives updates when master zone changes
- **Load Balancing**: DNS queries can be distributed between servers

## Prerequisites

### Software Requirements
- BIND 9.x DNS server installed on both servers
- OpenWrt/LuCI environment (for SecuBox integration)
- Network connectivity between servers
- Root/administrative access to both servers

### Network Requirements
- Static IP addresses for both DNS servers
- Port 53 (TCP and UDP) open between servers
- Proper firewall configuration
- Network time synchronization (NTP)

### DNS Requirements
- Registered domain name (secubox.in)
- Authority to configure DNS for the domain
- Valid name server records registered with domain registrar

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DNS MASTER-SLAVE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐               ┌─────────────────┐              │
│  │  MASTER SERVER  │               │  SLAVE SERVER   │              │
│  │  (Primary)      │               │  (Secondary)    │              │
│  │                 │               │                 │              │
│  │  ┌───────────┐  │               │  ┌───────────┐  │              │
│  │  │ BIND DNS   │  │               │  │ BIND DNS   │  │              │
│  │  └───────────┘  │               │  └───────────┘  │              │
│  │                 │               │                 │              │
│  │  Zone File:     │               │  Zone File:     │              │
│  │  /etc/bind/     │               │  /etc/bind/     │              │
│  │  zones/master   │               │  zones/slave    │              │
│  └─────────────────┘               └─────────────────┘              │
│          │                                      │                   │
│          │ Zone Transfer (AXFR)                 │                   │
│          │─────────────────────────────────────>│                   │
│          │                                      │                   │
│          │ DNS NOTIFY (on changes)              │                   │
│          │<─────────────────────────────────────│                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     CLIENT REQUESTS                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│          │                                      │                   │
│          ▼                                      ▼                   │
│  ┌─────────────────┐               ┌─────────────────┐              │
│  │  DNS Queries     │               │  DNS Queries     │              │
│  │  (Port 53 UDP)   │               │  (Port 53 UDP)   │              │
│  └─────────────────┘               └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Configuration

### Step 1: Install Required Packages

On both servers, ensure BIND DNS is installed:

```bash
# On OpenWrt/SecuBox:
opkg update
opkg install bind-server bind-tools

# Enable and start BIND service:
/etc/init.d/named enable
/etc/init.d/named start
```

### Step 2: Configure Master Server

#### 2.1. Create Zone Directory
```bash
mkdir -p /etc/bind/zones
chown -R bind:bind /etc/bind/zones
```

#### 2.2. Add Zone Configuration to named.conf.local
Edit `/etc/bind/named.conf.local` and add:

```conf
zone "secubox.in" {
    type master;
    file "/etc/bind/zones/secubox.in.db";
    allow-transfer {
        192.168.1.0/24;
        10.0.0.0/8;
        # Add specific peer IP for secubox.maegia.tv
    };
    also-notify {
        # Add secubox.maegia.tv IP here
    };
};
```

#### 2.3. Create Zone File
Create `/etc/bind/zones/secubox.in.db` with the content from the configuration file.

### Step 3: Configure Slave Server (secubox.maegia.tv)

#### 3.1. Create Zone Directory
```bash
mkdir -p /etc/bind/zones
chown -R bind:bind /etc/bind/zones
```

#### 3.2. Add Slave Zone Configuration
Edit `/etc/bind/named.conf.local` and add:

```conf
zone "secubox.in" {
    type slave;
    masters { 192.168.1.100; };  # Master server IP
    file "/etc/bind/zones/secubox.in.slave";
};
```

### Step 4: Configure Firewall

Add these rules to `/etc/config/firewall`:

```conf
config rule
    option name             'Allow-DNS-Peers'
    option src              'lan'
    option dest             'lan'
    option proto            'tcp udp'
    option dest_port        '53'
    option target           'ACCEPT'

config rule
    option name             'Allow-Zone-Transfers'
    option src              'lan'
    option dest             'lan'
    option proto            'tcp'
    option dest_port        '53'
    option target           'ACCEPT'
```

### Step 5: Restart Services

```bash
# Restart BIND on both servers
/etc/init.d/named restart

# Restart firewall
/etc/init.d/firewall restart
```

## Configuration Files

### Master Server Files
1. **/etc/bind/named.conf.local** - Main BIND configuration
2. **/etc/bind/zones/secubox.in.db** - Zone file with all DNS records
3. **/etc/config/firewall** - Firewall rules

### Slave Server Files  
1. **/etc/bind/named.conf.local** - Slave BIND configuration
2. **/etc/bind/zones/secubox.in.slave** - Transferred zone file (auto-created)
3. **/etc/config/firewall** - Firewall rules

### Zone File Structure
The zone file contains:
- **SOA Record**: Start of Authority with serial number
- **NS Records**: Name server definitions
- **A Records**: IP address mappings
- **MX Records**: Mail server definitions
- **CNAME Records**: Aliases
- **TXT Records**: Text records for verification

## Verification and Testing

### Basic DNS Tests
```bash
# Test DNS resolution from master
dig @localhost secubox.in
dig @localhost www.secubox.in
dig @localhost mx secubox.in

# Test from slave
dig @secubox.maegia.tv secubox.in

# Test zone transfer
dig @localhost secubox.in AXFR
```

### Expected Results
- DNS queries should return correct IP addresses
- Zone transfer should show all records
- Slave should have identical records to master
- Both servers should respond to queries

### Monitoring Commands
```bash
# Check BIND status
/etc/init.d/named status

# Check DNS logs
tail -f /var/log/syslog | grep named

# Check zone loading
rndc status
```

## Troubleshooting

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Zone transfer fails | Firewall blocking | Check firewall rules, allow port 53 TCP |
| Slave not updating | No NOTIFY sent | Check also-notify configuration |
| DNS timeout | BIND not running | Check service status, restart BIND |
| Serial conflicts | Manual edit error | Increment serial number in SOA |
| Permission denied | Wrong file ownership | chown bind:bind /etc/bind/zones |
| Zone not loading | Syntax error | Check BIND logs, validate zone file |

### Debugging Commands
```bash
# Test zone file syntax
named-checkzone secubox.in /etc/bind/zones/secubox.in.db

# Test configuration syntax
named-checkconf

# Manual zone transfer test
rndc reload secubox.in

# Check zone status
rndc status
```

## Security Best Practices

### Zone Transfer Security
1. **Restrict allow-transfer**: Only allow transfers to trusted peers
2. **Use TSIG**: Implement Transaction SIGnatures for secure transfers
3. **IP Restrictions**: Use specific IPs instead of broad network ranges

### DNS Server Security
1. **Keep Updated**: Regularly update BIND software
2. **Chroot**: Run BIND in a chroot environment
3. **Minimal Privileges**: Run as non-root user
4. **Rate Limiting**: Implement query rate limiting

### Monitoring
1. **Log Monitoring**: Monitor /var/log/syslog for DNS errors
2. **Query Monitoring**: Track unusual query patterns
3. **Zone Change Alerts**: Monitor for unauthorized changes
4. **Service Monitoring**: Ensure DNS service availability

## Maintenance

### Updating DNS Records
1. Edit the zone file on the master server
2. Increment the serial number in SOA record
3. Reload the zone: `rndc reload secubox.in`
4. Verify changes propagated to slave

### Serial Number Format
Use YYYYMMDDNN format:
- YYYY: Year (2024)
- MM: Month (02)
- DD: Day (05)
- NN: Revision number (01)

Example: `2024020501`

### Backup Strategy
```bash
# Backup zone files regularly
cp /etc/bind/zones/secubox.in.db /backup/dns/secubox.in.db.$(date +%Y%m%d)

# Backup BIND configuration
cp /etc/bind/named.conf* /backup/dns/
```

## Integration with SecuBox

### DNS Provider Module
The SecuBox DNS Provider module can be used to manage this configuration:

1. Navigate to: **Network → DNS Providers**
2. Add new provider configuration
3. Select "BIND" as provider type
4. Enter zone details and server information
5. Save and apply configuration

### Monitoring in SecuBox
Use the System Hub to monitor DNS service status:
1. **System Hub → Services**: Check BIND service status
2. **System Hub → Health**: Monitor DNS-related metrics
3. **System Hub → Logs**: View DNS service logs

## Advanced Configuration

### TSIG Configuration
For secure zone transfers:

```conf
# Generate TSIG key
dnssec-keygen -a HMAC-SHA256 -b 256 -n USER dns-transfer

# Add to named.conf on both servers
key "dns-transfer" {
    algorithm hmac-sha256;
    secret "base64-key-from-K*.key-file";
};

# Update zone configuration
server 192.168.1.50 {
    keys { dns-transfer; };
};
```

### DNSSEC Implementation
For signed zones:

```bash
# Generate keys
dnssec-keygen -a RSASHA256 -b 2048 secubox.in
dnssec-keygen -f KSK -a RSASHA256 -b 4096 secubox.in

# Sign the zone
dnssec-signzone -A -3 $(head -c 1000 /dev/random | sha1sum | cut -b 1-16) -N increment -o secubox.in -t secubox.in.db
```

## Conclusion

This setup provides a robust, redundant DNS infrastructure for `secubox.in` with automatic synchronization between the master server and `secubox.maegia.tv` peer. The configuration follows DNS best practices and integrates well with the SecuBox ecosystem.

For production use, remember to:
1. Replace example IP addresses with actual server IPs
2. Implement proper security measures (TSIG, DNSSEC)
3. Set up monitoring and alerting
4. Regularly update and maintain the configuration
5. Test failover scenarios

## Additional Resources
- [BIND 9 Administrator Reference Manual](https://bind9.readthedocs.io/)
- [DNS and BIND by O'Reilly](https://www.oreilly.com/library/view/dns-and-bind/)
- [RFC 1034 - Domain Names Concepts](https://tools.ietf.org/html/rfc1034)
- [RFC 1035 - Domain Names Implementation](https://tools.ietf.org/html/rfc1035)