/**
 * SecuBox Help Button Integration Example
 *
 * This file demonstrates how to integrate help buttons into SecuBox modules
 * to link with the deployed website documentation.
 *
 * Version: 1.0
 * Date: 2025-12-28
 */

// ============================================================================
// EXAMPLE 1: Shared Help Utility (Recommended)
// ============================================================================

// File: luci-app-secubox/htdocs/luci-static/resources/secubox/help.js

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
            'title': opts.title || _('View Help & Documentation'),
            'style': opts.style || ''
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

// ============================================================================
// EXAMPLE 2: Module Integration (Network Modes)
// ============================================================================

// File: luci-app-network-modes/htdocs/luci-static/resources/view/network-modes/overview.js

'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require secubox/help as Help';  // ← ADD THIS LINE

return view.extend({
    title: _('Network Modes'),

    load: function() {
        return api.getAllData();
    },

    render: function(data) {
        var self = this;
        var status = data.status || {};
        var currentMode = status.current_mode || 'router';

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
                    currentMode
                ]),
                // ← ADD HELP BUTTON HERE
                Help.createHelpButton('network-modes', 'header', {
                    icon: '📖',
                    label: _('Help')
                })
            ]),

            // Rest of the dashboard...
        ]);

        return view;
    }
});

// ============================================================================
// EXAMPLE 3: SecuBox Dashboard Integration (Quick Actions)
// ============================================================================

// File: luci-app-secubox/htdocs/luci-static/resources/view/secubox/dashboard.js
// Add to renderQuickActions method

renderQuickActions: function() {
    var self = this;
    var actions = [
        { name: 'restart_rpcd', label: 'RPCD', icon: '🔄', color: '#6366f1' },
        { name: 'restart_uhttpd', label: 'Web Server', icon: '🌐', color: '#00ab44' },
        { name: 'restart_network', label: 'Network', icon: '📡', color: '#06b6d4' },
        { name: 'restart_firewall', label: 'Firewall', icon: '🛡️', color: '#ef4444' },
        { name: 'clear_cache', label: 'Clear Cache', icon: '🧹', color: '#f59e0b' },
        { name: 'backup_config', label: 'Backup', icon: '💾', color: '#8b5cf6' }
    ];

    var buttons = actions.map(function(action) {
        return E('button', {
            'class': 'secubox-action-btn',
            'style': 'border-color: ' + action.color,
            'click': function() {
                self.executeQuickAction(action.name, action.label);
            }
        }, [
            E('span', { 'class': 'secubox-action-icon' }, action.icon),
            E('span', { 'class': 'secubox-action-label' }, action.label)
        ]);
    });

    // ← ADD HELP BUTTON TO QUICK ACTIONS
    buttons.push(
        E('button', {
            'class': 'secubox-action-btn',
            'style': 'border-color: #667eea',
            'click': function() {
                window.open('/luci-static/secubox/index.html#modules', '_blank');
            }
        }, [
            E('span', { 'class': 'secubox-action-icon' }, '📖'),
            E('span', { 'class': 'secubox-action-label' }, _('Help'))
        ])
    );

    return E('div', { 'class': 'secubox-card' }, [
        E('h3', { 'class': 'secubox-card-title' }, '⚡ Quick Actions'),
        E('div', { 'class': 'secubox-actions-grid' }, buttons)
    ]);
},

// ============================================================================
// EXAMPLE 4: System Hub Integration (Header Badge Style)
// ============================================================================

// File: luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js
// Modify renderHeader method

renderHeader: function() {
    var score = this.healthData.score || 0;
    var scoreClass = score >= 80 ? 'excellent' : (score >= 60 ? 'good' : 'warning');
    var scoreLabel = score >= 80 ? 'Excellent' : (score >= 60 ? 'Good' : 'Warning');

    return E('div', { 'class': 'sh-dashboard-header' }, [
        E('div', { 'class': 'sh-dashboard-header-content' }, [
            E('div', {}, [
                E('h2', {}, '⚙️ System Control Center'),
                E('p', { 'class': 'sh-dashboard-subtitle' }, 'System Monitoring & Management Center')
            ]),
            E('div', { 'class': 'sh-dashboard-header-info' }, [
                E('div', { 'class': 'sh-header-badge-group' }, [
                    E('span', { 'class': 'sh-dashboard-badge sh-dashboard-badge-version' },
                        'v0.3.6'),
                    E('span', { 'class': 'sh-dashboard-badge' },
                        '⏱️ ' + (this.sysInfo.uptime_formatted || '0d 0h 0m')),
                    E('span', { 'class': 'sh-dashboard-badge' },
                        '🖥️ ' + (this.sysInfo.hostname || 'OpenWrt')),
                    // ← ADD HELP BADGE
                    E('a', {
                        'class': 'sh-dashboard-badge sh-help-badge',
                        'href': '/luci-static/secubox/demo-secubox-hub.html',
                        'target': '_blank',
                        'title': _('View Help')
                    }, '📖 Help')
                ]),
                this.renderHealthGauge(score, scoreClass, scoreLabel)
            ])
        ])
    ]);
},

// ============================================================================
// EXAMPLE 5: Floating Help Button (Global)
// ============================================================================

// Add to any module's render method for a floating help button

render: function(data) {
    var container = E('div', { 'class': 'module-dashboard' }, [
        // ... module content ...

        // ← ADD FLOATING HELP BUTTON
        E('a', {
            'class': 'sb-help-floating',
            'href': '/luci-static/secubox/demo-module.html',
            'target': '_blank',
            'title': _('Help & Documentation')
        }, [
            E('span', { 'class': 'sb-help-icon' }, '❓')
        ])
    ]);

    return container;
}

// ============================================================================
// EXAMPLE 6: Inline Modal Help
// ============================================================================

// Use Help.openHelpModal() for inline help

E('button', {
    'class': 'btn cbi-button-action',
    'click': function() {
        Help.openHelpModal('network-modes');
    }
}, [
    E('span', {}, '❓ '),
    _('Help')
])

// ============================================================================
// EXAMPLE 7: Context-Sensitive Help
// ============================================================================

// Different help URLs based on context

getContextualHelpUrl: function(context) {
    var baseUrl = '/luci-static/secubox/demo-network-modes.html';
    var anchors = {
        'sniffer': '#sniffer-mode',
        'accesspoint': '#access-point-mode',
        'relay': '#relay-mode',
        'router': '#router-mode'
    };

    return baseUrl + (anchors[context] || '');
}

// Then use it:
E('a', {
    'href': this.getContextualHelpUrl('sniffer'),
    'target': '_blank'
}, _('Learn about Sniffer Mode'))

// ============================================================================
// CSS INTEGRATION EXAMPLE
// ============================================================================

/*
File: luci-app-secubox/htdocs/luci-static/resources/secubox/help.css

Add to existing module CSS for consistent styling:
*/

/* Help Button Base */
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
}

/* Floating position */
.sb-help-floating {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 1000;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    padding: 0;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* System Hub badge style */
.sh-help-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: all 0.3s ease;
}

.sh-help-badge:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}
