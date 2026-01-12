'use strict';
'require baseclass';

var tabs = [
	{ id: 'dashboard', icon: '📊', label: _('Dashboard'), path: ['admin', 'secubox', 'monitoring', 'mediaflow', 'dashboard'] },
	{ id: 'alerts', icon: '🔔', label: _('Alerts'), path: ['admin', 'secubox', 'monitoring', 'mediaflow', 'alerts'] },
	{ id: 'clients', icon: '👥', label: _('Clients'), path: ['admin', 'secubox', 'monitoring', 'mediaflow', 'clients'] },
	{ id: 'services', icon: '🎬', label: _('Services'), path: ['admin', 'secubox', 'monitoring', 'mediaflow', 'services'] },
	{ id: 'history', icon: '📜', label: _('History'), path: ['admin', 'secubox', 'monitoring', 'mediaflow', 'history'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	ensureLuCITabsHidden: function() {
		if (typeof document === 'undefined')
			return;
		if (document.getElementById('media-flow-tabstyle'))
			return;
		var style = document.createElement('style');
		style.id = 'media-flow-tabstyle';
		style.textContent = `
	body[data-page^="admin-secubox-monitoring-mediaflow"] .tabs,
	body[data-page^="admin-secubox-monitoring-mediaflow"] #tabmenu,
	body[data-page^="admin-secubox-monitoring-mediaflow"] .cbi-tabmenu,
	body[data-page^="admin-secubox-monitoring-mediaflow"] .nav-tabs {
	display: none !important;
}
		`;
		document.head && document.head.appendChild(style);
	},

	renderTabs: function(active) {
		this.ensureLuCITabsHidden();
		return E('div', { 'class': 'sh-nav-tabs media-flow-nav-tabs' },
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
