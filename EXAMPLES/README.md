# SecuBox Code Examples

This directory contains practical code examples for SecuBox module development and integration.

## Available Examples

### help-button-integration.js
Comprehensive examples for integrating help/documentation buttons into SecuBox modules.

**What's Included:**
- Shared help utility module
- Module integration examples
- Multiple UI patterns (header, floating, quick actions)
- Context-sensitive help
- CSS styling examples

**Use Cases:**
- Adding help buttons to module dashboards
- Linking to website documentation
- Creating consistent help UX across modules

## Related Documentation

- **Integration Plan:** `../DOCS/HELP_INTEGRATION_PLAN.md`
- **Deployment Guide:** `../DOCS/WEBSITE_DEPLOYMENT_GUIDE.md`
- **LuCI Development:** `../DOCS/LUCI_DEVELOPMENT_REFERENCE.md`

## How to Use Examples

1. **Review the example code** to understand the pattern
2. **Copy relevant sections** to your module
3. **Customize** module names, URLs, and styling
4. **Test** on development router
5. **Deploy** using deployment scripts

## Integration Workflow

```bash
# 1. Deploy website to router
./secubox-tools/deploy-website.sh root@192.168.8.191

# 2. Add help button code to your module
# (see help-button-integration.js)

# 3. Build and deploy module
./secubox-tools/local-build.sh build luci-app-your-module
./secubox-tools/deploy-network-modes.sh root@192.168.8.191

# 4. Test in browser
open http://192.168.8.191/cgi-bin/luci/admin/secubox/your-module
```

## Common Patterns

### Pattern 1: Header Help Button
```javascript
'require secubox/help as Help';

E('div', { 'class': 'header' }, [
    E('h2', {}, 'Module Title'),
    Help.createHelpButton('module-name', 'header')
])
```

### Pattern 2: Floating Help Button
```javascript
E('a', {
    'class': 'sb-help-floating',
    'href': '/luci-static/secubox/demo-module.html',
    'target': '_blank'
}, [E('span', {}, '❓')])
```

### Pattern 3: Quick Action
```javascript
buttons.push(
    E('button', {
        'class': 'action-btn',
        'click': function() {
            window.open('/luci-static/secubox/demo-module.html', '_blank');
        }
    }, ['📖 Help'])
)
```

## Module-Specific Examples

Each module can have different help button placements:

| Module | Recommended Position | Example File |
|--------|---------------------|--------------|
| SecuBox Dashboard | Quick Actions | help-button-integration.js (Ex 3) |
| System Hub | Header Badge | help-button-integration.js (Ex 4) |
| Network Modes | Header Button | help-button-integration.js (Ex 2) |
| Other Modules | Floating Button | help-button-integration.js (Ex 5) |

## Testing Checklist

- [ ] Help button is visible
- [ ] Clicking opens correct documentation page
- [ ] Styling matches module theme
- [ ] Works in dark/light mode
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] Accessible via keyboard

## Contributing Examples

To add new examples:

1. Create descriptive JavaScript file
2. Include clear comments
3. Show complete, working code
4. Update this README
5. Test on actual router

## Support

For questions about examples:
- Review related documentation in `DOCS/`
- Check module source code in `luci-app-*/`
- Test on development router first

## Quick Reference

**Website Base URL:** `/luci-static/secubox/`

**Module Help Pages:**
- secubox → `index.html#modules`
- system-hub → `demo-secubox-hub.html`
- network-modes → `demo-network-modes.html`
- client-guardian → `demo-client-guardian.html`
- bandwidth-manager → `demo-bandwidth.html`
- traffic-shaper → `demo-traffic-shaper.html`
- (See help-button-integration.js for complete list)

**Help Utility Methods:**
- `Help.createHelpButton(module, position, options)`
- `Help.getHelpUrl(module)`
- `Help.openHelpModal(module)`
