'use strict';
'require baseclass';
'require secubox/nav as SecuNav';

/**
 * CDN Cache Navigation
 * Uses SecuNav.renderCompactTabs() for consistent styling
 */

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

	/**
	 * Render CDN Cache navigation tabs
	 * Delegates to SecuNav.renderCompactTabs() for consistent styling
	 */
	renderTabs: function(active) {
		return SecuNav.renderCompactTabs(active, this.getTabs(), { className: 'cdn-nav-tabs' });
	},

	/**
	 * Render breadcrumb back to SecuBox
	 */
	renderBreadcrumb: function() {
		return SecuNav.renderBreadcrumb(_('CDN Cache'), '💾');
	}
});
