'use strict';
'require baseclass';

var tabs = [
	{ id: 'overview', icon: '📦', label: _('Overview'), path: ['admin', 'services', 'cdn-cache', 'overview'] },
	{ id: 'cache', icon: '💾', label: _('Cache'), path: ['admin', 'services', 'cdn-cache', 'cache'] },
	{ id: 'policies', icon: '🧭', label: _('Policies'), path: ['admin', 'services', 'cdn-cache', 'policies'] },
	{ id: 'statistics', icon: '📊', label: _('Statistics'), path: ['admin', 'services', 'cdn-cache', 'statistics'] },
	{ id: 'maintenance', icon: '🧹', label: _('Maintenance'), path: ['admin', 'services', 'cdn-cache', 'maintenance'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'services', 'cdn-cache', 'settings'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	renderTabs: function(active) {
		return E('div', { 'class': 'sh-nav-tabs cdn-nav-tabs' },
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
