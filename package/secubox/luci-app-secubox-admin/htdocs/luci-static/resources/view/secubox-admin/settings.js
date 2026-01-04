'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require ui';

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(API.getApps(), { apps: [] }),
			L.resolveDefault(API.getModules(), { modules: {} })
		]);
	},

	render: function(data) {
		var apps = data[0].apps || [];
		var modules = data[1].modules || {};
		var self = this;

		// Filter to only show installed apps
		var installedApps = apps.filter(function(app) {
			var status = API.getAppStatus(app, modules);
			return status.installed;
		});

		var container = E('div', { 'class': 'secubox-settings' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('h2', {}, 'App Settings'),
			E('p', {}, 'Configure installed applications'),

			installedApps.length === 0 ?
				E('div', { 'class': 'alert alert-info' }, 'No installed apps') :
				E('div', { 'class': 'settings-list' },
					installedApps.map(function(app) {
						return self.renderAppSettings(app, modules);
					})
				)
		]);

		return container;
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
