# SecuBox Website Help/Info Button Integration Plan

**Version:** 1.0
**Date:** 2025-12-28
**Status:** Planning Phase

## Overview

This document outlines the strategy for integrating the SecuBox marketing/documentation website with the OpenWrt LuCI modules, providing seamless access to help documentation via help/info buttons in each module.

## Current Architecture

### Website Location
- **Remote URL:** `https://secubox.cybermood.eu/`
- **Local Router Path:** `/www/luci-static/secubox/`
- **Access URL:** `http://[router-ip]/luci-static/secubox/`

### Module Structure
All SecuBox modules follow a consistent pattern:
```
luci-app-{module-name}/
├── htdocs/luci-static/resources/
│   ├── view/{module-name}/
│   │   ├── overview.js (main dashboard)
│   │   └── *.js (other views)
│   └── {module-name}/
│       ├── api.js
│       ├── theme.js (optional)
│       └── *.css
```

### Key Modules
1. **luci-app-secubox** - Central control hub
2. **luci-app-system-hub** - System monitoring
3. **luci-app-network-modes** - Network configuration
4. **luci-app-client-guardian** - Client management
5. **luci-app-bandwidth-manager** - Traffic shaping
6. **luci-app-cdn-cache** - CDN caching
7. **luci-app-traffic-shaper** - QoS management
8. **luci-app-wireguard-dashboard** - VPN management
9. **luci-app-crowdsec-dashboard** - Security monitoring
10. **luci-app-netdata-dashboard** - Performance metrics

## Integration Strategy

### Phase 1: Shared Help Utilities (RECOMMENDED)

Create a centralized help button library that all modules can use.

#### Implementation Steps

1. **Create Shared Help Module**
   ```javascript
   // Location: luci-app-secubox/htdocs/luci-static/resources/secubox/help.js

   'use strict';
   'require baseclass';

   return baseclass.extend({
       /**
        * Create a help button element
        * @param {string} moduleName - Module identifier (e.g., 'network-modes')
        * @param {string} position - Button position: 'header', 'footer', 'floating'
        * @param {object} options - Custom options
        */
       createHelpButton: function(moduleName, position, options) {
           var opts = options || {};
           var helpUrl = this.getHelpUrl(moduleName);
           var buttonClass = 'sb-help-btn sb-help-' + position;

           return E('a', {
               'class': buttonClass,
               'href': helpUrl,
               'target': opts.target || '_blank',
               'title': opts.title || _('View Help & Documentation')
           }, [
               E('span', { 'class': 'sb-help-icon' }, opts.icon || '❓'),
               opts.showLabel !== false ? E('span', { 'class': 'sb-help-label' }, opts.label || _('Help')) : null
           ]);
       },

       /**
        * Get help URL for a module
        * @param {string} moduleName - Module identifier
        */
       getHelpUrl: function(moduleName) {
           var baseUrl = '/luci-static/secubox/';
           var moduleMap = {
               'secubox': 'index.html#modules',
               'system-hub': 'demo-secubox-hub.html',
               'network-modes': 'demo-network-modes.html',
               'client-guardian': 'demo-client-guardian.html',
               'bandwidth-manager': 'demo-bandwidth.html',
               'cdn-cache': 'demo-cdn-cache.html',
               'traffic-shaper': 'demo-traffic-shaper.html',
               'wireguard-dashboard': 'demo-wireguard.html',
               'crowdsec-dashboard': 'demo-crowdsec.html',
               'netdata-dashboard': 'demo-netdata.html',
               'netifyd-dashboard': 'demo-netifyd.html',
               'auth-guardian': 'demo-auth.html',
               'vhost-manager': 'demo-vhost.html',
               'ksm-manager': 'demo-ksm-manager.html',
               'media-flow': 'demo-media.html'
           };

           return baseUrl + (moduleMap[moduleName] || 'index.html');
       },

       /**
        * Open help in modal (for inline help)
        * @param {string} moduleName - Module identifier
        */
       openHelpModal: function(moduleName) {
           var helpUrl = this.getHelpUrl(moduleName);
           var iframe = E('iframe', {
               'src': helpUrl,
               'style': 'width: 100%; height: 70vh; border: none; border-radius: 8px;'
           });

           ui.showModal(_('Help & Documentation'), [
               E('div', { 'style': 'min-height: 70vh;' }, [iframe]),
               E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
                   E('button', {
                       'class': 'btn',
                       'click': ui.hideModal
                   }, _('Close'))
               ])
           ]);
       }
   });
   ```

2. **Create Common CSS Styles**
   ```css
   /* Location: luci-app-secubox/htdocs/luci-static/resources/secubox/help.css */

   /* Base Help Button Styles */
   .sb-help-btn {
       display: inline-flex;
       align-items: center;
       gap: 0.5rem;
       padding: 0.5rem 1rem;
       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
       color: white;
       border-radius: 8px;
       text-decoration: none;
       font-weight: 500;
       transition: all 0.3s ease;
       border: 2px solid transparent;
       cursor: pointer;
   }

   .sb-help-btn:hover {
       transform: translateY(-2px);
       box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
       border-color: rgba(255, 255, 255, 0.3);
   }

   .sb-help-icon {
       font-size: 1.2em;
   }

   /* Header Position */
   .sb-help-header {
       margin-left: auto;
       padding: 0.4rem 0.8rem;
       font-size: 0.9em;
   }

   /* Footer Position */
   .sb-help-footer {
       margin-top: 2rem;
   }

   /* Floating Button (bottom-right) */
   .sb-help-floating {
       position: fixed;
       bottom: 2rem;
       right: 2rem;
       z-index: 1000;
       border-radius: 50%;
       width: 60px;
       height: 60px;
       padding: 0;
       justify-content: center;
       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
   }

   .sb-help-floating .sb-help-label {
       display: none;
   }

   .sb-help-floating .sb-help-icon {
       font-size: 1.8em;
   }

   /* Dark theme adjustments */
   [data-theme="dark"] .sb-help-btn {
       background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
   }
   ```

3. **Update Each Module**

   **Example: luci-app-network-modes/htdocs/luci-static/resources/view/network-modes/overview.js**
   ```javascript
   'use strict';
   'require view';
   'require dom';
   'require ui';
   'require network-modes.api as api';
   'require secubox/help as Help';  // ADD THIS

   return view.extend({
       title: _('Network Modes'),

       load: function() {
           return api.getAllData();
       },

       render: function(data) {
           var self = this;
           // ... existing code ...

           var view = E('div', { 'class': 'network-modes-dashboard' }, [
               // Load help CSS
               E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/help.css') }),

               // Header with help button
               E('div', { 'class': 'nm-header' }, [
                   E('div', { 'class': 'nm-logo' }, [
                       E('div', { 'class': 'nm-logo-icon' }, '🌐'),
                       E('div', { 'class': 'nm-logo-text' }, ['Network ', E('span', {}, 'Configuration')])
                   ]),
                   E('div', { 'class': 'nm-mode-badge ' + currentMode }, [
                       E('span', { 'class': 'nm-mode-dot' }),
                       currentModeInfo ? currentModeInfo.name : currentMode
                   ]),
                   // ADD HELP BUTTON
                   Help.createHelpButton('network-modes', 'header', {
                       icon: '📖',
                       label: _('Help')
                   })
               ]),

               // ... rest of the UI ...
           ]);

           return view;
       }
   });
   ```

### Phase 2: Alternative Approaches

#### Approach A: Floating Help Button
Add a global floating help button that appears on all SecuBox module pages.

**Pros:**
- Non-intrusive
- Consistent UX across all modules
- Easy to implement globally

**Cons:**
- May overlap with other floating elements
- Less discoverable

#### Approach B: Header Integration
Add help buttons to the header of each module dashboard.

**Pros:**
- Highly visible
- Natural placement
- Follows common UI patterns

**Cons:**
- Requires modifications to each module
- May clutter header on small screens

#### Approach C: Quick Actions Integration
Add help as a quick action in modules that have action panels (like SecuBox dashboard).

**Pros:**
- Fits existing UI pattern
- Grouped with other utilities
- Consistent with current design

**Cons:**
- Only works for modules with action panels
- Less prominent

## Recommended Implementation Plan

### Step 1: Create Foundation (Week 1)
1. Create `secubox/help.js` utility module
2. Create `secubox/help.css` stylesheet
3. Deploy to test router
4. Verify accessibility

### Step 2: Integrate Core Modules (Week 2)
Update these critical modules first:
1. `luci-app-secubox` (main dashboard)
2. `luci-app-system-hub`
3. `luci-app-network-modes`

Test on production router.

### Step 3: Roll Out to All Modules (Week 3)
Update remaining modules:
1. `luci-app-client-guardian`
2. `luci-app-bandwidth-manager`
3. `luci-app-cdn-cache`
4. `luci-app-traffic-shaper`
5. `luci-app-wireguard-dashboard`
6. `luci-app-crowdsec-dashboard`
7. `luci-app-netdata-dashboard`
8. Other modules

### Step 4: User Testing & Refinement (Week 4)
1. Gather user feedback
2. Adjust positioning/styling
3. Add localization if needed
4. Document for end users

## Module-to-Help Page Mapping

| Module | Help Page | Status |
|--------|-----------|--------|
| secubox | index.html#modules | Available |
| system-hub | demo-secubox-hub.html | Available |
| network-modes | demo-network-modes.html | Available |
| client-guardian | demo-client-guardian.html | Available |
| bandwidth-manager | demo-bandwidth.html | Available |
| cdn-cache | demo-cdn-cache.html | Available |
| traffic-shaper | demo-traffic-shaper.html | Available |
| wireguard-dashboard | demo-wireguard.html | Available |
| crowdsec-dashboard | demo-crowdsec.html | Available |
| netdata-dashboard | demo-netdata.html | Available |
| netifyd-dashboard | demo-netifyd.html | Available |
| auth-guardian | demo-auth.html | Available |
| vhost-manager | demo-vhost.html | Available |
| ksm-manager | demo-ksm-manager.html | Available |
| media-flow | demo-media.html | Available |

## Deployment Workflow

### Website Updates
```bash
# From secubox-openwrt directory
./secubox-tools/deploy-website.sh root@192.168.8.191 ../secubox-website
```

### Module Updates with Help Integration
```bash
# Build and deploy individual module
./secubox-tools/deploy-network-modes.sh root@192.168.8.191

# Or build all modules
./secubox-tools/local-build.sh build-all
```

## Testing Checklist

- [ ] Help button appears in module header
- [ ] Help button links to correct documentation page
- [ ] Help page opens in new tab (or modal if configured)
- [ ] Styling is consistent across all modules
- [ ] Button is responsive on mobile devices
- [ ] Dark/light theme support
- [ ] Localization support (if applicable)
- [ ] No JavaScript errors in console
- [ ] Works on both local router and remote deployment

## Future Enhancements

### Enhanced Features
1. **Context-Sensitive Help**
   - Different help URLs based on current page/section
   - Deep linking to specific documentation sections

2. **Inline Help Tooltips**
   - Hover tooltips for specific UI elements
   - Quick tips without leaving page

3. **Help Search**
   - Search box in help modal
   - Full-text search across documentation

4. **Interactive Tutorials**
   - Step-by-step walkthroughs
   - Guided tours for new users

5. **Changelog Integration**
   - Show "What's New" on version updates
   - Link to release notes

## Technical Considerations

### Performance
- Help resources are static files (no API calls)
- Minimal JavaScript overhead (~2KB)
- CSS loaded only when needed
- No impact on module core functionality

### Compatibility
- Works with LuCI 18.06+
- Compatible with all modern browsers
- Graceful degradation for older browsers

### Security
- All help content served from same origin
- No external dependencies
- No XSS risks (static HTML/CSS/JS)

### Maintenance
- Centralized help utility (single point of update)
- Module changes are minimal (1-3 lines per module)
- Website updates independent of module updates

## References

- **Deployment Script:** `secubox-tools/deploy-website.sh`
- **Module Template:** `secubox-tools/deploy-module-template.sh`
- **Website Repository:** `/home/reepost/CyberMindStudio/_files/secubox-website/`
- **Current Deployment:** `http://192.168.8.191/luci-static/secubox/`

## Questions & Decisions Needed

1. **Button Position:** Header, Floating, or both?
2. **Modal vs New Tab:** Should help open in modal or new tab?
3. **Mobile UX:** How should help button behave on small screens?
4. **Localization:** Support multiple languages for help content?
5. **Analytics:** Track help usage (privacy-respecting)?

## Approval Status

- [ ] Technical approach approved
- [ ] UI/UX design approved
- [ ] Implementation timeline approved
- [ ] Testing plan approved
- [ ] Deployment strategy approved
