'use strict';
'require baseclass';

return baseclass.extend({
	tabs: [
		{ id: 'overview', icon: '📊', label: _('Overview'), path: ['admin', 'secubox', 'services', 'vhosts', 'overview'] },
		{ id: 'vhosts', icon: '🗂️', label: _('Virtual Hosts'), path: ['admin', 'secubox', 'services', 'vhosts', 'vhosts'] },
		{ id: 'internal', icon: '🏠', label: _('Internal Services'), path: ['admin', 'secubox', 'services', 'vhosts', 'internal'] },
		{ id: 'certificates', icon: '🔐', label: _('Certificates'), path: ['admin', 'secubox', 'services', 'vhosts', 'certificates'] },
		{ id: 'ssl', icon: '⚙️', label: _('SSL/TLS'), path: ['admin', 'secubox', 'services', 'vhosts', 'ssl'] },
		{ id: 'redirects', icon: '↪️', label: _('Redirects'), path: ['admin', 'secubox', 'services', 'vhosts', 'redirects'] },
		{ id: 'logs', icon: '📜', label: _('Logs'), path: ['admin', 'secubox', 'services', 'vhosts', 'logs'] }
	],

	renderTabs: function(active) {
		return E('div', { 'class': 'sh-nav-tabs vhost-nav-tabs' },
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
	},

	getTabs: function() {
		return this.tabs.slice();
	}
});
