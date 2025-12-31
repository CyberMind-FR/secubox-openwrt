# luci-app-secubox-bonus

SecuBox Bonus Content Package - Marketing and documentation website for SecuBox modules.

## Description

This package provides the official SecuBox documentation, demos, and marketing content as static HTML pages accessible through the router's web interface.

## Contents

- **Demo Pages** (16 modules): Interactive demonstrations of SecuBox modules
  - Auth Guardian, Bandwidth Manager, CDN Cache, Client Guardian
  - CrowdSec, KSM Manager, Media Flow, Netdata, Netifyd
  - Network Modes, SecuBox Hub, Traffic Shaper, VHost Manager, WireGuard

- **Blog Articles**: Setup guides and tutorials
  - Auth Guardian Setup Guide
  - Bandwidth Manager Guide
  - Local SaaS with VHost Manager

- **Marketing**: Campaign and landing pages

- **Internationalization**: Multi-language support (13 languages)
  - English, French, German, Spanish, Portuguese, Italian
  - Dutch, Russian, Arabic, Chinese, Japanese, Korean, Hindi

## Installation

### From Package

```bash
opkg update
opkg install luci-app-secubox-bonus
```

### From Source

```bash
make package/luci-app-secubox-bonus/compile
```

## Access

After installation, the content is available at:

```
http://<router-ip>/luci-static/secubox/
```

### URLs

- Main landing: `/luci-static/secubox/index.html`
- Demo pages: `/luci-static/secubox/demo-<module>.html`
- Blog articles: `/luci-static/secubox/blog/<article>.html`
- Campaign: `/luci-static/secubox/campaign.html`

## File Structure

```
/www/luci-static/secubox/
├── index.html                    # Main landing page
├── campaign.html                 # Marketing campaign
├── demo-*.html                   # Module demonstrations (16 files)
├── blog/                         # Tutorials and guides
│   ├── auth-guardian-setup.html
│   ├── bandwidth-manager-guide.html
│   └── local-saas-vhost.html
└── i18n/                         # Translations (13 languages)
    └── *.json
```

## Package Info

- **Version**: 0.1.0-1
- **License**: Apache-2.0
- **Maintainer**: CyberMind <contact@cybermind.fr>
- **Size**: ~500KB (36 files)
- **Dependencies**: luci-base

## Development

The source content is maintained in the `secubox-website` repository and synchronized to this package during builds.

### Update Content

To update the website content:

1. Update files in `~/CyberMindStudio/_files/secubox-website/`
2. Rebuild the package or use the deployment script:

```bash
./secubox-tools/deploy-website.sh root@192.168.8.205 ~/CyberMindStudio/_files/secubox-website
```

## Notes

- This package contains only static files (HTML, JS, JSON)
- No backend/RPCD components required
- No menu integration - content accessed via direct URLs
- Files are read-only and served by uhttpd
- Content updates require package reinstall or manual deployment

## See Also

- `luci-app-secubox` - SecuBox Hub (main control panel)
- `luci-theme-secubox` - SecuBox theme and UI components
- Documentation: https://secubox.cybermood.eu/
