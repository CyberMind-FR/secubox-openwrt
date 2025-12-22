# Auth Guardian for OpenWrt

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
