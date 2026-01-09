'use strict';
'require baseclass';

/**
 * CrowdSec Dashboard Navigation
 * SecuBox themed navigation tabs
 */

var tabs = [
	{ id: 'wizard', icon: '🚀', label: _('Setup Wizard'), path: ['admin', 'secubox', 'security', 'crowdsec', 'wizard'] },
	{ id: 'overview', icon: '📊', label: _('Overview'), path: ['admin', 'secubox', 'security', 'crowdsec', 'overview'] },
	{ id: 'decisions', icon: '⛔', label: _('Decisions'), path: ['admin', 'secubox', 'security', 'crowdsec', 'decisions'] },
	{ id: 'alerts', icon: '⚠️', label: _('Alerts'), path: ['admin', 'secubox', 'security', 'crowdsec', 'alerts'] },
	{ id: 'bouncers', icon: '🛡️', label: _('Bouncers'), path: ['admin', 'secubox', 'security', 'crowdsec', 'bouncers'] },
	{ id: 'waf', icon: '🔥', label: _('WAF/AppSec'), path: ['admin', 'secubox', 'security', 'crowdsec', 'waf'] },
	{ id: 'metrics', icon: '📈', label: _('Metrics'), path: ['admin', 'secubox', 'security', 'crowdsec', 'metrics'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'security', 'crowdsec', 'settings'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	ensureLuCITabsHidden: function() {
		if (typeof document === 'undefined')
			return;
		if (document.getElementById('crowdsec-tabstyle'))
			return;
		var style = document.createElement('style');
		style.id = 'crowdsec-tabstyle';
		style.textContent = `
/* Hide default LuCI tabs for CrowdSec */
body[data-page^="admin-secubox-security-crowdsec"] .tabs,
body[data-page^="admin-secubox-security-crowdsec"] #tabmenu,
body[data-page^="admin-secubox-security-crowdsec"] .cbi-tabmenu,
body[data-page^="admin-secubox-security-crowdsec"] .nav-tabs,
body[data-page^="admin-secubox-security-crowdsec"] ul.cbi-tabmenu {
	display: none !important;
}

/* CrowdSec Nav Tabs */
.cs-nav-tabs {
	display: flex;
	gap: 4px;
	margin-bottom: 24px;
	padding: 6px;
	background: var(--cs-bg-secondary);
	border-radius: var(--cs-radius-lg);
	border: 1px solid var(--cs-border);
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.cs-nav-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: var(--cs-radius);
	background: transparent;
	border: none;
	color: var(--cs-text-secondary);
	font-weight: 500;
	font-size: 13px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.2s ease;
	white-space: nowrap;
}

.cs-nav-tab:hover {
	color: var(--cs-text-primary);
	background: var(--cs-bg-tertiary);
}

.cs-nav-tab.active {
	color: var(--cs-accent-green);
	background: var(--cs-bg-tertiary);
	box-shadow: inset 0 -2px 0 var(--cs-accent-green);
}

.cs-tab-icon {
	font-size: 16px;
	line-height: 1;
}

.cs-tab-label {
	font-family: var(--cs-font-sans);
}

@media (max-width: 768px) {
	.cs-nav-tabs {
		padding: 4px;
	}
	.cs-nav-tab {
		padding: 8px 12px;
		font-size: 12px;
	}
	.cs-tab-label {
		display: none;
	}
	.cs-tab-icon {
		font-size: 18px;
	}
}
		`;
		document.head && document.head.appendChild(style);
	},

	renderTabs: function(active) {
		this.ensureLuCITabsHidden();
		return E('div', { 'class': 'cs-nav-tabs' },
			this.getTabs().map(function(tab) {
				return E('a', {
					'class': 'cs-nav-tab' + (tab.id === active ? ' active' : ''),
					'href': L.url.apply(L, tab.path)
				}, [
					E('span', { 'class': 'cs-tab-icon' }, tab.icon),
					E('span', { 'class': 'cs-tab-label' }, tab.label)
				]);
			})
		);
	}
});
