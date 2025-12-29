'use strict';
'require baseclass';
'require secubox-theme/cascade as Cascade';

var tabs = [
	{ id: 'dashboard', icon: '🚀', label: _('Dashboard'), path: ['admin', 'secubox', 'dashboard'] },
	{ id: 'modules', icon: '🧩', label: _('Modules'), path: ['admin', 'secubox', 'modules'] },
	{ id: 'wizard', icon: '✨', label: _('Wizard'), path: ['admin', 'secubox', 'wizard'] },
	{ id: 'monitoring', icon: '📡', label: _('Monitoring'), path: ['admin', 'secubox', 'monitoring'] },
	{ id: 'alerts', icon: '⚠️', label: _('Alerts'), path: ['admin', 'secubox', 'alerts'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'settings'] },
	{ id: 'help', icon: '✨', label: _('Bonus'), path: ['admin', 'secubox', 'help'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	renderTabs: function(active) {
		return Cascade.createLayer({
			id: 'secubox-main-nav',
			type: 'tabs',
			role: 'menu',
			depth: 1,
			className: 'sh-nav-tabs secubox-nav-tabs',
			items: this.getTabs().map(function(tab) {
				return {
					id: tab.id,
					label: tab.label,
					icon: tab.icon,
					href: L.url.apply(L, tab.path),
					state: tab.id === active ? 'active' : null
				};
			}),
			active: active,
			onSelect: function(item, ev) {
				if (item.href && ev && (ev.metaKey || ev.ctrlKey))
					return true;
				if (item.href) {
					location.href = item.href;
					return false;
				}
			}
		});
	}
});
