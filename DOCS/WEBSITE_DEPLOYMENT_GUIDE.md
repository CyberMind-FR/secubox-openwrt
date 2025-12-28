# SecuBox Website Deployment Guide

**Version:** 1.0
**Date:** 2025-12-28

## Overview

This guide explains how to deploy the SecuBox marketing/documentation website to an OpenWrt router, making it accessible locally for help and documentation purposes.

## Prerequisites

- OpenWrt router with SSH access
- SecuBox website files (from `secubox-website` repository)
- Network connectivity to router
- Sufficient storage space on router (approx. 1-2 MB)

## Deployment Script

### Location
```
secubox-openwrt/secubox-tools/deploy-website.sh
```

### Usage

#### Basic Deployment
```bash
# Deploy to default router (192.168.1.1)
./secubox-tools/deploy-website.sh

# Deploy to specific router
./secubox-tools/deploy-website.sh root@192.168.8.191

# Deploy from specific website directory
./secubox-tools/deploy-website.sh root@192.168.8.191 /path/to/secubox-website
```

#### Full Example
```bash
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt

# Deploy website to router at 192.168.8.191
./secubox-tools/deploy-website.sh root@192.168.8.191 ../secubox-website
```

### What the Script Does

1. **Prepares Files** - Creates compressed archive excluding:
   - `.git` directory
   - `.claude` directory
   - Markdown files (*.md)
   - README and LICENSE files

2. **Creates Backup** - Backs up existing website if present

3. **Deploys Files** - Uploads and extracts to `/www/luci-static/secubox/`

4. **Sets Permissions** - Ensures proper file permissions:
   - Directories: 755
   - HTML files: 644
   - JavaScript files: 644
   - CSS files: 644

5. **Cleanup** - Removes temporary files

## Website Structure on Router

### Directory Layout
```
/www/luci-static/secubox/
├── index.html (main landing page)
├── campaign.html
├── demo-*.html (module demos)
├── dev-status-widget.js
├── i18n.js
├── i18n/
│   └── *.json (language files)
└── blog/
    └── *.html (blog posts)
```

### Access URLs

After deployment, the website is accessible at:

- **Local Router:** `http://[router-ip]/luci-static/secubox/`
- **Example:** `http://192.168.8.191/luci-static/secubox/`

#### Individual Pages
- Main: `http://192.168.8.191/luci-static/secubox/index.html`
- System Hub: `http://192.168.8.191/luci-static/secubox/demo-secubox-hub.html`
- Network Modes: `http://192.168.8.191/luci-static/secubox/demo-network-modes.html`
- Client Guardian: `http://192.168.8.191/luci-static/secubox/demo-client-guardian.html`
- etc.

## Deployment Workflow

### 1. Update Website Content

```bash
# Navigate to website directory
cd /home/reepost/CyberMindStudio/_files/secubox-website

# Edit files as needed
# Test locally if possible
```

### 2. Deploy to Router

```bash
# Navigate to OpenWrt directory
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt

# Deploy
./secubox-tools/deploy-website.sh root@192.168.8.191
```

### 3. Verify Deployment

```bash
# Check files on router
ssh root@192.168.8.191 "ls -la /www/luci-static/secubox/"

# Test access via browser
curl http://192.168.8.191/luci-static/secubox/index.html
```

## Manual Deployment (Alternative)

If the script doesn't work, you can deploy manually:

```bash
# 1. Create tarball
cd /path/to/secubox-website
tar czf /tmp/secubox-website.tar.gz \
  --exclude='.git' \
  --exclude='.claude' \
  --exclude='*.md' \
  .

# 2. Upload to router
scp /tmp/secubox-website.tar.gz root@192.168.8.191:/tmp/

# 3. Extract on router
ssh root@192.168.8.191 << 'EOF'
mkdir -p /www/luci-static/secubox
cd /www/luci-static/secubox
tar xzf /tmp/secubox-website.tar.gz
chmod 755 .
find . -type d -exec chmod 755 {} \;
find . -type f -name "*.html" -exec chmod 644 {} \;
find . -type f -name "*.js" -exec chmod 644 {} \;
rm /tmp/secubox-website.tar.gz
EOF

# 4. Cleanup
rm /tmp/secubox-website.tar.gz
```

## Troubleshooting

### Issue: "No route to host"
**Solution:** Verify router IP address is correct
```bash
ping 192.168.8.191
```

### Issue: "Permission denied"
**Solution:** Ensure SSH access is configured
```bash
# Test SSH connection
ssh root@192.168.8.191 "echo 'Connected'"
```

### Issue: "Not enough space"
**Solution:** Check available storage
```bash
ssh root@192.168.8.191 "df -h /www"

# If needed, clear cache
ssh root@192.168.8.191 "rm -rf /tmp/luci-*"
```

### Issue: "Files not accessible via HTTP"
**Solution:** Check web server status
```bash
ssh root@192.168.8.191 "/etc/init.d/uhttpd status"
ssh root@192.168.8.191 "/etc/init.d/uhttpd restart"
```

### Issue: "404 Not Found"
**Solution:** Verify files exist and check permissions
```bash
ssh root@192.168.8.191 "ls -la /www/luci-static/secubox/ | head -20"
```

## Integration with Modules

Once deployed, modules can link to the help pages:

```javascript
// Example: Link to help in a module
var helpUrl = '/luci-static/secubox/demo-network-modes.html';
var helpButton = E('a', {
    'href': helpUrl,
    'target': '_blank',
    'class': 'btn'
}, 'Help');
```

See `HELP_INTEGRATION_PLAN.md` for detailed integration guide.

## Maintenance

### Updating Website

To update the website after making changes:

```bash
# 1. Edit files in secubox-website/
cd /home/reepost/CyberMindStudio/_files/secubox-website
# ... make changes ...

# 2. Redeploy
cd ../secubox-openwrt
./secubox-tools/deploy-website.sh root@192.168.8.191
```

### Rollback

If deployment fails, restore from backup:

```bash
ssh root@192.168.8.191 << 'EOF'
# Find latest backup
BACKUP=$(ls -t /tmp/secubox-website-backup-* | head -1)
if [ -n "$BACKUP" ]; then
  rm -rf /www/luci-static/secubox/*
  cp -a $BACKUP/* /www/luci-static/secubox/
  echo "Restored from $BACKUP"
fi
EOF
```

### Remove Website

To completely remove the website:

```bash
ssh root@192.168.8.191 "rm -rf /www/luci-static/secubox"
```

## Performance Optimization

### Enable Compression (Optional)

Configure uhttpd to serve compressed content:

```bash
ssh root@192.168.8.191 << 'EOF'
# Add gzip compression to uhttpd config
uci set uhttpd.main.compression='1'
uci commit uhttpd
/etc/init.d/uhttpd restart
EOF
```

### Cache Headers (Optional)

Add cache headers for static assets:

```bash
ssh root@192.168.8.191 << 'EOF'
# Create .htaccess-like configuration for caching
# (requires additional uhttpd configuration)
EOF
```

## Security Considerations

### Access Control

The website is publicly accessible on the router's LAN. To restrict access:

```bash
# Option 1: Firewall rules (restrict to specific IPs)
ssh root@192.168.8.191 << 'EOF'
# Add firewall rules as needed
EOF

# Option 2: HTTP authentication (requires uhttpd configuration)
```

### Content Security

- Website contains only static HTML/CSS/JavaScript
- No server-side execution
- No database connections
- No sensitive data exposure

## Automated Deployment

### Cron Job (Optional)

To auto-deploy on schedule:

```bash
# Add to router crontab
ssh root@192.168.8.191 "crontab -e"

# Add line (example: deploy daily at 3 AM):
# 0 3 * * * cd /tmp && wget http://server/secubox-website.tar.gz && tar xzf secubox-website.tar.gz -C /www/luci-static/secubox/
```

### Git Hook (Advanced)

Deploy automatically on git push:

```bash
# In secubox-website/.git/hooks/post-commit
#!/bin/bash
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt
./secubox-tools/deploy-website.sh root@192.168.8.191
```

## Monitoring

### Check Deployment Status

```bash
# Verify files
ssh root@192.168.8.191 "find /www/luci-static/secubox -type f | wc -l"

# Check disk usage
ssh root@192.168.8.191 "du -sh /www/luci-static/secubox"

# View access logs (if logging enabled)
ssh root@192.168.8.191 "logread | grep uhttpd"
```

## Related Documentation

- **Help Integration:** `HELP_INTEGRATION_PLAN.md`
- **Module Development:** `LUCI_DEVELOPMENT_REFERENCE.md`
- **Deployment Scripts:** `secubox-tools/deploy-*.sh`

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review router logs: `ssh root@router "logread"`
3. Test network connectivity
4. Verify file permissions

## Changelog

### v1.0 (2025-12-28)
- Initial deployment script
- Documentation created
- Tested on router 192.168.8.191
- Supports automatic website directory detection
