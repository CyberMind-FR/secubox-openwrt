English | [Francais](README.fr.md) | [中文](README.zh.md)

# Auth Guardian for OpenWrt

**Version:** 0.4.0  
**Last Updated:** 2025-12-28  
**Status:** Active


Comprehensive authentication and session management system.

## Features

### 🎨 Captive Portal
- Customizable splash pages
- Logo and branding support
- Terms of service acceptance

### 🔑 OAuth Integration
- Google Sign-In
- GitHub Authentication
- Facebook Login
- Twitter/X Login

### 🎟️ Voucher System
- Generate access codes
- Time-limited validity
- Bandwidth restrictions

### 🍪 Session Management
- Secure cookies (HttpOnly, SameSite)
- Session timeout control
- Concurrent session limits

### ⏭️ Bypass Rules
- MAC whitelist
- IP whitelist
- Domain exceptions

## Installation

```bash
opkg update
opkg install luci-app-auth-guardian
```

## License

MIT License - CyberMind Security
