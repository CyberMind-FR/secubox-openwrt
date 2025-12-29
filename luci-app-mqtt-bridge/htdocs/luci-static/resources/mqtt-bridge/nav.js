'use strict';
'require baseclass';
'require secubox-theme/cascade as Cascade';

var tabs = [
	{ id: 'overview', icon: '📡', label: _('Overview'), path: ['admin', 'secubox', 'network', 'mqtt-bridge', 'overview'] },
	{ id: 'devices', icon: '🔌', label: _('Devices'), path: ['admin', 'secubox', 'network', 'mqtt-bridge', 'devices'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'network', 'mqtt-bridge', 'settings'] }
];

return baseclass.extend({
	renderTabs: function(active) {
		return Cascade.createLayer({
			id: 'mqtt-nav',
			type: 'tabs',
			role: 'menu',
			depth: 1,
			className: 'sh-nav-tabs mqtt-nav-tabs',
			items: tabs.map(function(tab) {
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
