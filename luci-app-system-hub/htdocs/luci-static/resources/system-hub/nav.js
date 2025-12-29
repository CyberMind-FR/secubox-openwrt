'use strict';
'require baseclass';

var tabs = [
	{ id: 'overview', icon: '📊', label: _('Overview'), path: ['admin', 'secubox', 'system', 'system-hub', 'overview'] },
	{ id: 'services', icon: '🧩', label: _('Services'), path: ['admin', 'secubox', 'system', 'system-hub', 'services'] },
	{ id: 'logs', icon: '📜', label: _('Logs'), path: ['admin', 'secubox', 'system', 'system-hub', 'logs'] },
	{ id: 'backup', icon: '💾', label: _('Backup'), path: ['admin', 'secubox', 'system', 'system-hub', 'backup'] },
	{ id: 'components', icon: '🧱', label: _('Components'), path: ['admin', 'secubox', 'system', 'system-hub', 'components'] },
	{ id: 'diagnostics', icon: '🧪', label: _('Diagnostics'), path: ['admin', 'secubox', 'system', 'system-hub', 'diagnostics'] },
	{ id: 'health', icon: '❤️', label: _('Health'), path: ['admin', 'secubox', 'system', 'system-hub', 'health'] },
	{ id: 'remote', icon: '📡', label: _('Remote'), path: ['admin', 'secubox', 'system', 'system-hub', 'remote'] },
	{ id: 'dev-status', icon: '🚀', label: _('Dev Status'), path: ['admin', 'secubox', 'system', 'system-hub', 'dev-status'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'system', 'system-hub', 'settings'] },
	{ id: 'network-modes', icon: '🌐', label: _('Network Modes'), path: ['admin', 'secubox', 'network', 'modes', 'overview'] },
	{ id: 'cdn-cache', icon: '📦', label: _('CDN Cache'), path: ['admin', 'secubox', 'network', 'cdn-cache', 'overview'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	ensureLuCITabsHidden: function() {
		if (typeof document === 'undefined')
			return;
		if (document.getElementById('system-hub-tabstyle'))
			return;
		var style = document.createElement('style');
		style.id = 'system-hub-tabstyle';
		style.textContent = `
body[data-page^="admin-secubox-system-system-hub"] .tabs,
body[data-page^="admin-secubox-system-system-hub"] #tabmenu,
body[data-page^="admin-secubox-system-system-hub"] .cbi-tabmenu,
body[data-page^="admin-secubox-system-system-hub"] .nav-tabs {
	display: none !important;
}
		`;
		document.head && document.head.appendChild(style);
	},

	renderTabs: function(active) {
		this.ensureLuCITabsHidden();
		return E('div', { 'class': 'sh-nav-tabs system-hub-nav-tabs' },
			this.getTabs().map(function(tab) {
				return E('a', {
					'class': 'sh-nav-tab' + (tab.id === active ? ' active' : ''),
					'href': L.url.apply(L, tab.path)
				}, [
					E('span', { 'class': 'sh-tab-icon' }, tab.icon),
					E('span', { 'class': 'sh-tab-label' }, tab.label)
				]);
			})
		);
	}
});
