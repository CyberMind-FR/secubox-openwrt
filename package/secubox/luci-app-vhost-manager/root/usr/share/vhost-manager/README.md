# VHost Manager Templates

This directory contains pre-configured VHost templates for SecuBox appstore applications and common services.

## templates.json

VHost templates catalog synchronized with SecuBox appstore applications. Each template provides:

- **Domain**: Default local domain name
- **Backend**: Internal service URL and port
- **Category**: Service classification
- **Requirements**: SSL, authentication, WebSocket support
- **App ID**: Link to corresponding appstore application

## Structure

```json
{
  "templates": [
    {
      "id": "unique-id",
      "icon": "emoji",
      "name": "Service Name",
      "domain": "service.local",
      "backend": "http://127.0.0.1:port",
      "port": 8080,
      "category": "Category Name",
      "description": "Service description",
      "app_id": "secubox-app-id",
      "requires_ssl": true,
      "requires_auth": true,
      "websocket_support": false,
      "notes": "Optional configuration notes"
    }
  ],
  "categories": { ... },
  "metadata": { ... }
}
```

## Usage

Templates are automatically loaded by the VHost Manager internal services page at:
https://router-ip/cgi-bin/luci/admin/secubox/services/vhosts/internal

Users can:
1. Browse available service templates by category
2. See which services are already configured
3. Create new VHosts based on templates with one click
4. View recommended SSL and authentication settings

## Synchronization

This file is synchronized with:
- **SecuBox Appstore** (`/usr/share/secubox/appstore/apps.json`)
- **Network Modes** profiles pattern

When new apps are added to the appstore, corresponding VHost templates should be added here.

## Categories

- Core Services - Essential router management
- Monitoring & Analytics - System monitoring tools
- Security - Threat detection and security services
- Network Services - DNS, captive portal, ad blocking
- IoT & Home Automation - Smart home platforms
- Media & Entertainment - Streaming services
- AI & Machine Learning - LLM and AI tools
- Productivity & Collaboration - File sharing, email, calendars
- Hosting & Control Panels - Web hosting management

## Maintained by

CyberMind.fr - SecuBox Development Team
