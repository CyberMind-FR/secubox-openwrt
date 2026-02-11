'use strict';
'require baseclass';
'require secubox/nav as SecuNav';

/**
 * MQTT Bridge Navigation
 * Uses SecuNav.renderCompactTabs() for consistent styling
 */

var tabs = [
	{ id: 'overview', icon: '📡', label: _('Overview'), path: ['admin', 'secubox', 'network', 'mqtt-bridge', 'overview'] },
	{ id: 'devices', icon: '🔌', label: _('Devices'), path: ['admin', 'secubox', 'network', 'mqtt-bridge', 'devices'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'network', 'mqtt-bridge', 'settings'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	/**
	 * Render MQTT Bridge navigation tabs
	 * Delegates to SecuNav.renderCompactTabs() for consistent styling
	 */
	renderTabs: function(active) {
		return SecuNav.renderCompactTabs(active, this.getTabs(), { className: 'mqtt-nav-tabs' });
	},

	/**
	 * Render breadcrumb back to SecuBox
	 */
	renderBreadcrumb: function() {
		return SecuNav.renderBreadcrumb(_('MQTT Bridge'), '📡');
	}
});
