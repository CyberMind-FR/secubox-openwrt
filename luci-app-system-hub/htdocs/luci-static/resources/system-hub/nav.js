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
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'system', 'system-hub', 'settings'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	renderTabs: function(active) {
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
