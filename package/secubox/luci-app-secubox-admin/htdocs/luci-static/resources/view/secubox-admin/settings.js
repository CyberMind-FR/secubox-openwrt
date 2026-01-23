'use strict';
'require view';
'require secubox-admin/api as API';
'require secubox-admin/components as Components';
'require secubox-admin/data-utils as DataUtils';
'require ui';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var ADMIN_NAV = [
	{ id: 'dashboard', icon: '🎛️', label: 'Control Panel' },
	{ id: 'cyber-dashboard', icon: '🔮', label: 'Cyber Console' },
	{ id: 'apps', icon: '📦', label: 'Apps Manager' },
	{ id: 'updates', icon: '🔄', label: 'Updates' },
	{ id: 'catalog-sources', icon: '📚', label: 'Catalog' },
	{ id: 'health', icon: '💚', label: 'Health' },
	{ id: 'logs', icon: '📋', label: 'Logs' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderAdminNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, ADMIN_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'admin', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(API.getApps(), []),
			L.resolveDefault(API.getModules(), {})
		]);
	},

	render: function(data) {
		var apps = DataUtils.normalizeApps(data[0]);
		var modules = DataUtils.normalizeModules(data[1]);
		var self = this;

		// Filter to only show installed apps
		var installedApps = apps.filter(function(app) {
			var status = API.getAppStatus(app, modules);
			return status.installed;
		});

		var container = E('div', { 'class': 'cyberpunk-mode secubox-settings' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '⚙️ APP SETTINGS'),
				E('div', { 'class': 'cyber-header-subtitle' }, 'Configure installed applications')
			]),

			installedApps.length === 0 ?
				E('div', { 'class': 'alert alert-info' }, 'No installed apps') :
				E('div', { 'class': 'settings-list' },
					installedApps.map(function(app) {
						return self.renderAppSettings(app, modules);
					})
				)
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('settings'));
		wrapper.appendChild(container);
		return wrapper;
	},

	renderAppSettings: function(app, modules) {
		var self = this;
		var status = API.getAppStatus(app, modules);

		return E('div', { 'class': 'settings-card card' }, [
			E('div', { 'class': 'settings-header' }, [
				E('div', { 'class': 'app-title' }, [
					E('span', { 'class': 'app-icon' }, app.icon || '📦'),
					E('h3', {}, app.name),
					Components.renderStatusBadge(status.status)
				]),
				E('div', { 'class': 'app-controls' }, [
					status.running ?
						E('button', {
							'class': 'btn btn-sm btn-warning',
							'click': function() { self.disableApp(app); }
						}, 'Stop') :
						E('button', {
							'class': 'btn btn-sm btn-success',
							'click': function() { self.enableApp(app); }
						}, 'Start'),
					E('button', {
						'class': 'btn btn-sm btn-primary',
						'click': function() { self.viewConfig(app); }
					}, 'View Config')
				])
			]),
			E('div', { 'class': 'settings-info' }, [
				E('p', {}, app.description),
				app.packages && app.packages.required ? E('p', { 'class': 'text-muted' }, [
					E('strong', {}, 'Packages: '),
					app.packages.required.join(', ')
				]) : E('div')
			])
		]);
	},

	enableApp: function(app) {
		var pkgName = app.packages && app.packages.required ? app.packages.required[0] : app.id;
		API.enableModule(pkgName).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', app.name + ' started'), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed to start ' + app.name), 'error');
			}
		});
	},

	disableApp: function(app) {
		var pkgName = app.packages && app.packages.required ? app.packages.required[0] : app.id;
		API.disableModule(pkgName).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', app.name + ' stopped'), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed to stop ' + app.name), 'error');
			}
		});
	},

	viewConfig: function(app) {
		ui.showModal(app.name + ' Configuration', [
			E('p', {}, 'Configuration for ' + app.name + ' can be found at:'),
			E('code', {}, '/etc/config/' + (app.id.replace('secubox-app-', ''))),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Close')
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
