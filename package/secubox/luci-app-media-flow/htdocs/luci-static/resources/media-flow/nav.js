'use strict';
'require baseclass';
'require secubox/nav as SecuNav';

/**
 * Media Flow Navigation
 * Uses SecuNav.renderCompactTabs() for consistent styling
 */

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

	/**
	 * Render Media Flow navigation tabs
	 * Delegates to SecuNav.renderCompactTabs() for consistent styling
	 */
	renderTabs: function(active) {
		return SecuNav.renderCompactTabs(active, this.getTabs(), { className: 'media-flow-nav-tabs' });
	},

	/**
	 * Render breadcrumb back to SecuBox
	 */
	renderBreadcrumb: function() {
		return SecuNav.renderBreadcrumb(_('Media Flow'), '🎬');
	}
});
