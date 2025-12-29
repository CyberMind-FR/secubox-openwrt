'use strict';
'require baseclass';

var tabs = [
	{ id: 'dashboard', icon: '🚀', label: _('Dashboard'), path: ['admin', 'secubox', 'dashboard'] },
	{ id: 'modules', icon: '🧩', label: _('Modules'), path: ['admin', 'secubox', 'modules'] },
	{ id: 'monitoring', icon: '📡', label: _('Monitoring'), path: ['admin', 'secubox', 'monitoring'] },
	{ id: 'alerts', icon: '⚠️', label: _('Alerts'), path: ['admin', 'secubox', 'alerts'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'settings'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	renderTabs: function(active) {
		return E('div', { 'class': 'sh-nav-tabs secubox-nav-tabs' },
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
