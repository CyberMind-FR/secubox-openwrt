# LuCI App - Key Storage Manager (KSM)

**Version:** 0.4.0  
**Last Updated:** 2025-12-28  
**Status:** Active


Centralized cryptographic key management system for OpenWrt with hardware security module (HSM) support for Nitrokey and YubiKey devices.

## Overview

The Key Storage Manager provides a comprehensive solution for managing cryptographic keys, certificates, secrets, and SSH keys on OpenWrt. It supports both software-based key storage and hardware-backed cryptographic operations using USB security tokens.

### Features

- **Cryptographic Key Management**
  - Generate RSA, ECDSA, and Ed25519 keys
  - Import/export keys in PEM, DER, and PKCS#12 formats
  - Secure deletion with shred support
  - Key metadata tracking and organization

- **Hardware Security Module (HSM) Support**
  - Auto-detection of Nitrokey and YubiKey devices
  - On-chip key generation
  - PIN management and security
  - Hardware-backed cryptographic operations

- **Certificate Management**
  - Generate Certificate Signing Requests (CSR)
  - Import SSL/TLS certificates
  - Certificate chain verification
  - Expiration alerts (< 30 days)

- **Secrets Storage**
  - Encrypted storage for API keys, passwords, and tokens
  - Categorized secret organization
  - Automatic secret rotation (optional)
  - Access audit logging

- **SSH Key Management**
  - Generate SSH key pairs (RSA, ECDSA, Ed25519)
  - Deploy keys to remote hosts
  - Support for SSH certificates
  - Public key export and sharing

- **Audit Logging**
  - Comprehensive activity tracking
  - Export logs to CSV format
  - Filterable audit timeline
  - User action accountability

## Installation

### Dependencies

The module requires the following packages:

- `luci-base`
- `rpcd`
- `openssl-util`
- `gnupg2`
- `nitropy` (for Nitrokey support)
- `yubikey-manager` (for YubiKey support)
- `opensc` (smart card framework)
- `libccid` (USB CCID driver)
- `pcscd` (PC/SC daemon)

### Install from Package

```bash
# Transfer package to router
scp luci-app-ksm-manager_*.ipk root@192.168.1.1:/tmp/

# Install on router
ssh root@192.168.1.1
opkg update
opkg install /tmp/luci-app-ksm-manager_*.ipk

# Restart services
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### Build from Source

```bash
# In OpenWrt SDK
make package/luci-app-ksm-manager/compile V=s
make package/luci-app-ksm-manager/install

# Package will be in bin/packages/*/base/
```

## Initial Setup

### 1. Install HSM Drivers (if using hardware tokens)

For Nitrokey devices:

```bash
opkg install nitropy python3-pip
```

For YubiKey devices:

```bash
opkg install yubikey-manager
```

### 2. Configure USB Permissions

Ensure your user has access to USB devices:

```bash
# Add udev rules for Nitrokey
cat > /etc/udev/rules.d/60-nitrokey.rules <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="20a0", ATTR{idProduct}=="42b1", MODE="0660", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="20a0", ATTR{idProduct}=="42b2", MODE="0660", GROUP="plugdev"
EOF

# Add udev rules for YubiKey
cat > /etc/udev/rules.d/70-yubikey.rules <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", MODE="0660", GROUP="plugdev"
EOF

# Reload udev rules
udevadm control --reload-rules
```

### 3. Initialize Keystore

Access the LuCI web interface:

1. Navigate to **Security → Key Storage Manager → Overview**
2. The keystore will be automatically initialized on first access
3. Configure settings in **Security → Key Storage Manager → Settings**

## Usage Guide

### Managing Keys

#### Generate a New Key

1. Go to **Keys** tab
2. Select key type (RSA, ECDSA, or Ed25519)
3. Choose key size (4096 bits recommended for RSA)
4. Enter a label for identification
5. Optionally set a passphrase for encryption
6. Click **Generate**

#### Import Existing Key

1. Go to **Keys** tab
2. Scroll to **Import Existing Key** section
3. Enter a label
4. Select format (PEM, DER, or PKCS#12)
5. Paste key data or upload file
6. Enter passphrase if encrypted
7. Click **Import**

#### Export Key

1. Find the key in the table
2. Click **Export**
3. Select format and whether to include private key
4. Click **Export** to download

### Using Hardware Security Modules

#### Initialize HSM Device

1. Connect Nitrokey or YubiKey via USB
2. Go to **HSM Devices** tab
3. Click **Scan for Devices**
4. Select detected device
5. Click **Initialize**
6. Set Admin PIN (6-32 characters)
7. Set User PIN (6-32 characters)

**Important:** Store PINs securely. Factory reset is required if forgotten.

#### Generate Key on HSM

1. Go to **HSM Devices** tab
2. Select initialized device
3. Click **Generate Key**
4. Choose key type and size
5. Enter label
6. Provide User PIN when prompted

Keys generated on-chip never leave the hardware device.

### Certificate Management

#### Generate Certificate Signing Request (CSR)

1. Go to **Certificates** tab
2. Select an existing key or generate new one
3. Enter Common Name (CN), e.g., `example.com`
4. Optionally add Organization, Country
5. Click **Generate**
6. Copy CSR and submit to Certificate Authority

#### Import Certificate

1. After receiving signed certificate from CA
2. Go to **Certificates** tab
3. Select associated key
4. Paste certificate data (PEM format)
5. Optionally include certificate chain
6. Click **Import**

#### Verify Certificate

1. Find certificate in table
2. Click **Verify**
3. Check validity status, chain validation, and expiration

### Managing Secrets

#### Store a Secret

1. Go to **Secrets** tab
2. Enter descriptive label (e.g., "GitHub API Key")
3. Select category (API Key, Password, Token, etc.)
4. Enter secret value
5. Enable auto-rotation if desired
6. Click **Add**

#### Retrieve Secret

1. Find secret in table
2. Click **View**
3. **Warning:** Access is logged
4. Copy secret to clipboard
5. Secret auto-hides after 30 seconds

#### Rotate Secret

1. Find secret in table
2. Click **Rotate**
3. Enter new secret value
4. Confirm rotation

### SSH Key Management

#### Generate SSH Key Pair

1. Go to **SSH Keys** tab
2. Enter label
3. Select key type (Ed25519 recommended)
4. Add optional comment
5. Click **Generate**
6. Copy public key for deployment

#### Deploy to Remote Host

1. Select SSH key from list
2. Click deploy section
3. Enter target hostname/IP
4. Enter target username
5. Click **Deploy**

Alternatively, manually copy public key to `~/.ssh/authorized_keys` on remote host.

### Audit Logs

#### View Activity

1. Go to **Audit Logs** tab
2. Review chronological activity timeline
3. Filter by date, user, action, or resource
4. Logs auto-refresh every 15 seconds

#### Export Logs

1. Click **Export Logs (CSV)**
2. CSV file downloads with all audit entries
3. Open in spreadsheet software for analysis

### Settings

#### Configure Keystore

1. Go to **Settings** tab
2. Set keystore path (default: `/etc/ksm/keystore.db`)
3. Configure auto-lock timeout
4. Enable/disable auto-backup
5. Set backup schedule (cron format)

#### Audit Settings

- Enable/disable audit logging
- Set retention period (default: 90 days)
- Choose log level (Info, Warning, Error)

#### Alert Settings

- Certificate expiration threshold (default: 30 days)
- Secret rotation reminders
- HSM disconnect alerts

#### Backup & Restore

**Create Backup:**
1. Click **Create Encrypted Backup**
2. Enter strong passphrase
3. Confirm passphrase
4. Download encrypted archive

**Restore Backup:**
1. Click **Restore from Backup**
2. Select backup file
3. Enter backup passphrase
4. Confirm restoration (overwrites existing data)

## Security Best Practices

### Key Management

1. **Use Strong Passphrases:** Minimum 16 characters with mixed case, numbers, and symbols
2. **Key Size:** Use 4096-bit RSA or Ed25519 for maximum security
3. **Secure Deletion:** Always enable "secure erase" when deleting sensitive keys
4. **Regular Rotation:** Rotate SSH keys and secrets every 90 days
5. **Hardware Storage:** Use HSM for production keys when possible

### HSM Usage

1. **PIN Complexity:** Use different Admin and User PINs (minimum 8 characters)
2. **PIN Storage:** Store PINs in password manager, not on device
3. **Backup Tokens:** Keep backup HSM device for disaster recovery
4. **Physical Security:** Secure HSM devices when not in use
5. **Retry Limits:** HSM locks after failed PIN attempts - plan accordingly

### Certificate Management

1. **Monitor Expiration:** Enable alerts for certificates expiring < 30 days
2. **Verify Chains:** Always verify certificate chain before deployment
3. **Renew Early:** Renew certificates 2 weeks before expiration
4. **Revocation:** Keep revocation procedures documented
5. **Intermediate CAs:** Store intermediate certificates with end-entity certs

### Secret Storage

1. **Access Logging:** Review audit logs regularly for unauthorized access
2. **Least Privilege:** Only grant secret access to necessary users
3. **Auto-Rotation:** Enable for API keys and tokens
4. **Encryption:** Secrets are encrypted with AES-256-GCM
5. **Backup Encryption:** Always encrypt backups with strong passphrase

## Troubleshooting

### HSM Not Detected

**Problem:** Nitrokey or YubiKey not appearing in device list

**Solutions:**
1. Check USB connection - try different port
2. Verify drivers installed: `lsusb` should show device
3. Check permissions: `ls -la /dev/hidraw*`
4. Restart pcscd: `/etc/init.d/pcscd restart`
5. Check udev rules in `/etc/udev/rules.d/`

### Permission Denied Errors

**Problem:** Cannot access /dev/hidraw* or keystore files

**Solutions:**
1. Add user to `plugdev` group: `usermod -a -G plugdev www-data`
2. Check file permissions: `ls -la /etc/ksm/`
3. Verify RPCD runs as correct user
4. Check ACL configuration in `/usr/share/rpcd/acl.d/`

### Keystore Locked

**Problem:** "Keystore locked" error when accessing keys

**Solutions:**
1. Unlock via Settings → Keystore → Unlock
2. Check auto-lock timeout setting
3. Verify keystore file exists: `/etc/ksm/keystore.db`
4. Check disk space: `df -h /etc/ksm`

### Certificate Verification Fails

**Problem:** Certificate chain validation errors

**Solutions:**
1. Ensure intermediate certificates imported
2. Check certificate order (end-entity → intermediate → root)
3. Verify certificate hasn't expired
4. Check system clock is correct: `date`
5. Update CA bundle: `opkg update && opkg upgrade ca-bundle`

### Backup Restoration Fails

**Problem:** Cannot restore from backup

**Solutions:**
1. Verify backup file integrity (check file size)
2. Ensure correct passphrase
3. Check available disk space
4. Try backup on different system for testing
5. Contact support if backup corrupt

## API Reference

### RPC Methods

The RPCD backend (`luci.ksm-manager`) provides 22 methods:

**Status & Info:**
- `status()` - Get service status
- `get_info()` - Get system information

**HSM Management:**
- `list_hsm_devices()` - List connected HSM devices
- `get_hsm_status(serial)` - Get HSM device status
- `init_hsm(serial, admin_pin, user_pin)` - Initialize HSM
- `generate_hsm_key(serial, key_type, key_size, label)` - Generate key on HSM

**Key Management:**
- `list_keys()` - List all keys
- `generate_key(type, size, label, passphrase)` - Generate new key
- `import_key(label, key_data, format, passphrase)` - Import key
- `export_key(id, format, include_private, passphrase)` - Export key
- `delete_key(id, secure_erase)` - Delete key

**Certificate Management:**
- `generate_csr(key_id, subject_dn, san_list)` - Generate CSR
- `import_certificate(key_id, cert_data, chain)` - Import certificate
- `list_certificates()` - List certificates
- `verify_certificate(cert_id)` - Verify certificate

**Secret Management:**
- `store_secret(label, secret_data, category, auto_rotate)` - Store secret
- `retrieve_secret(secret_id)` - Retrieve secret
- `list_secrets()` - List secrets
- `rotate_secret(secret_id, new_secret_data)` - Rotate secret

**SSH Management:**
- `generate_ssh_key(label, key_type, comment)` - Generate SSH key
- `deploy_ssh_key(key_id, target_host, target_user)` - Deploy SSH key

**Audit:**
- `get_audit_logs(limit, offset, filter_type)` - Get audit logs

## File Locations

- **Keystore Database:** `/etc/ksm/keystore.db`
- **Configuration:** `/etc/ksm/config.json`
- **Keys:** `/etc/ksm/keys/`
- **Certificates:** `/etc/ksm/certs/`
- **Secrets:** `/etc/ksm/secrets/`
- **Audit Log:** `/var/log/ksm-audit.log`
- **RPCD Backend:** `/usr/libexec/rpcd/luci.ksm-manager`

## Development

### Project Structure

```
luci-app-ksm-manager/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/ksm-manager/
│   │   ├── overview.js
│   │   ├── keys.js
│   │   ├── hsm.js
│   │   ├── certificates.js
│   │   ├── secrets.js
│   │   ├── ssh.js
│   │   ├── audit.js
│   │   └── settings.js
│   └── ksm-manager/
│       └── api.js
└── root/
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.ksm-manager
        └── share/
            ├── luci/menu.d/
            │   └── luci-app-ksm-manager.json
            └── rpcd/acl.d/
                └── luci-app-ksm-manager.json
```

### Running Tests

```bash
# Validate shell scripts
shellcheck root/usr/libexec/rpcd/luci.ksm-manager

# Validate JSON files
jsonlint root/usr/share/luci/menu.d/luci-app-ksm-manager.json
jsonlint root/usr/share/rpcd/acl.d/luci-app-ksm-manager.json

# Test RPCD methods
ubus call luci.ksm-manager status
ubus call luci.ksm-manager list_keys
```

## Contributing

Contributions are welcome! Please:

1. Follow OpenWrt coding standards
2. Test on actual hardware before submitting
3. Update documentation for new features
4. Include validation tests

## License

Copyright (C) 2025 SecuBox Project

Licensed under the Apache License, Version 2.0

## Support

- **Issues:** [GitHub Issues](https://github.com/secubox/luci-app-ksm-manager/issues)
- **Documentation:** [SecuBox Wiki](https://wiki.secubox.org)
- **Forum:** [OpenWrt Forum - SecuBox](https://forum.openwrt.org/tag/secubox)

## Changelog

### Version 1.0.0 (2025-01-XX)

- Initial release
- Full HSM support (Nitrokey, YubiKey)
- Cryptographic key management
- Certificate management with CSR generation
- Encrypted secrets storage
- SSH key management and deployment
- Comprehensive audit logging
- Backup and restore functionality
