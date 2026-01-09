'use strict';
'require baseclass';

/**
 * Client Guardian Navigation
 * SecuBox themed navigation tabs
 */

var tabs = [
	{ id: 'overview', icon: '📊', label: _('Overview'), path: ['admin', 'secubox', 'security', 'guardian', 'overview'] },
	{ id: 'wizard', icon: '🚀', label: _('Setup Wizard'), path: ['admin', 'secubox', 'security', 'guardian', 'wizard'] },
	{ id: 'clients', icon: '👥', label: _('Clients'), path: ['admin', 'secubox', 'security', 'guardian', 'clients'] },
	{ id: 'zones', icon: '🏠', label: _('Zones'), path: ['admin', 'secubox', 'security', 'guardian', 'zones'] },
	{ id: 'captive', icon: '🚪', label: _('Captive Portal'), path: ['admin', 'secubox', 'security', 'guardian', 'captive'] },
	{ id: 'portal', icon: '🎨', label: _('Portal Config'), path: ['admin', 'secubox', 'security', 'guardian', 'portal'] },
	{ id: 'logs', icon: '📜', label: _('Logs'), path: ['admin', 'secubox', 'security', 'guardian', 'logs'] },
	{ id: 'alerts', icon: '🔔', label: _('Alerts'), path: ['admin', 'secubox', 'security', 'guardian', 'alerts'] },
	{ id: 'parental', icon: '👨‍👩‍👧', label: _('Parental'), path: ['admin', 'secubox', 'security', 'guardian', 'parental'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'security', 'guardian', 'settings'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	ensureLuCITabsHidden: function() {
		if (typeof document === 'undefined')
			return;
		if (document.getElementById('guardian-tabstyle'))
			return;
		var style = document.createElement('style');
		style.id = 'guardian-tabstyle';
		style.textContent = `
/* Hide default LuCI tabs for Client Guardian */
body[data-page^="admin-secubox-security-guardian"] .tabs,
body[data-page^="admin-secubox-security-guardian"] #tabmenu,
body[data-page^="admin-secubox-security-guardian"] .cbi-tabmenu,
body[data-page^="admin-secubox-security-guardian"] .nav-tabs,
body[data-page^="admin-secubox-security-guardian"] ul.cbi-tabmenu {
	display: none !important;
}

/* Guardian Nav Tabs */
.cg-nav-tabs {
	display: flex;
	gap: 4px;
	margin-bottom: 24px;
	padding: 6px;
	background: var(--cg-bg-secondary, #151b23);
	border-radius: 12px;
	border: 1px solid var(--cg-border, #2a3444);
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.cg-nav-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: 8px;
	background: transparent;
	border: none;
	color: var(--cg-text-secondary, #8b949e);
	font-weight: 500;
	font-size: 13px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.2s ease;
	white-space: nowrap;
}

.cg-nav-tab:hover {
	color: var(--cg-text-primary, #e6edf3);
	background: var(--cg-bg-tertiary, #1e2632);
}

.cg-nav-tab.active {
	color: var(--cg-accent, #6366f1);
	background: var(--cg-bg-tertiary, #1e2632);
	box-shadow: inset 0 -2px 0 var(--cg-accent, #6366f1);
}

.cg-tab-icon {
	font-size: 16px;
	line-height: 1;
}

.cg-tab-label {
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

@media (max-width: 768px) {
	.cg-nav-tabs {
		padding: 4px;
	}
	.cg-nav-tab {
		padding: 8px 12px;
		font-size: 12px;
	}
	.cg-tab-label {
		display: none;
	}
	.cg-tab-icon {
		font-size: 18px;
	}
}
		`;
		document.head && document.head.appendChild(style);
	},

	renderTabs: function(active) {
		this.ensureLuCITabsHidden();
		return E('div', { 'class': 'cg-nav-tabs' },
			this.getTabs().map(function(tab) {
				return E('a', {
					'class': 'cg-nav-tab' + (tab.id === active ? ' active' : ''),
					'href': L.url.apply(L, tab.path)
				}, [
					E('span', { 'class': 'cg-tab-icon' }, tab.icon),
					E('span', { 'class': 'cg-tab-label' }, tab.label)
				]);
			})
		);
	}
});
