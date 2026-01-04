'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require ui';
'require form';

return view.extend({
	load: function() {
		return Promise.all([
			API.getApps(),
			API.getModules()
		]);
	},

	render: function(data) {
		var apps = data[0].apps || [];
		var modules = data[1].modules || {};
		var self = this;

		var container = E('div', { 'class': 'secubox-apps-manager' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('h2', {}, 'Apps Manager'),
			E('p', {}, 'Browse and manage SecuBox applications from the catalog'),

			// Filters
			E('div', { 'class': 'app-filters' }, [
				E('input', {
					'type': 'text',
					'class': 'search-box',
					'placeholder': 'Search apps...',
					'keyup': function(ev) {
						self.filterApps(ev.target.value);
					}
				}),
				E('select', {
					'class': 'category-filter',
					'change': function(ev) {
						self.filterByCategory(ev.target.value);
					}
				}, [
					E('option', { 'value': '' }, 'All Categories'),
					E('option', { 'value': 'security' }, 'Security'),
					E('option', { 'value': 'network' }, 'Network'),
					E('option', { 'value': 'hosting' }, 'Hosting'),
					E('option', { 'value': 'productivity' }, 'Productivity')
				])
			]),

			// Apps grid
			E('div', { 'class': 'apps-grid', 'id': 'apps-grid' },
				apps.map(function(app) {
					var status = API.getAppStatus(app, modules);
					return self.renderAppCard(app, status);
				})
			)
		]);

		return container;
	},

	renderAppCard: function(app, status) {
		var self = this;

		return E('div', { 'class': 'app-card', 'data-category': app.category }, [
			E('div', { 'class': 'app-icon' }, app.icon || '📦'),
			E('div', { 'class': 'app-info' }, [
				E('h3', {}, app.name),
				E('p', { 'class': 'app-description' }, app.description),
				E('div', { 'class': 'app-meta' }, [
					E('span', { 'class': 'app-category' }, app.category),
					E('span', { 'class': 'app-version' }, 'v' + (app.version || '1.0')),
					Components.renderStatusBadge(status.status)
				])
			]),
			E('div', { 'class': 'app-actions' },
				status.installed ? [
					E('button', {
						'class': 'btn btn-sm btn-primary',
						'click': function() { self.configureApp(app); }
					}, 'Configure'),
					E('button', {
						'class': 'btn btn-sm btn-danger',
						'click': function() { self.removeApp(app); }
					}, 'Remove')
				] : [
					E('button', {
						'class': 'btn btn-sm btn-success',
						'click': function() { self.installApp(app); }
					}, 'Install')
				]
			)
		]);
	},

	installApp: function(app) {
		var self = this;
		ui.showModal('Install ' + app.name, [
			E('p', {}, 'Are you sure you want to install ' + app.name + '?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'btn btn-primary',
					'click': function() {
						ui.hideModal();
						ui.showModal('Installing...', [
							Components.renderLoader('Installing ' + app.name + '...')
						]);
						API.installApp(app.id).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', app.name + ' installed successfully'), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', 'Failed to install ' + app.name), 'error');
							}
						});
					}
				}, 'Install')
			])
		]);
	},

	removeApp: function(app) {
		var self = this;
		ui.showModal('Remove ' + app.name, [
			E('p', {}, 'Are you sure you want to remove ' + app.name + '?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'btn btn-danger',
					'click': function() {
						ui.hideModal();
						ui.showModal('Removing...', [
							Components.renderLoader('Removing ' + app.name + '...')
						]);
						API.removeApp(app.id).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', app.name + ' removed successfully'), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', 'Failed to remove ' + app.name), 'error');
							}
						});
					}
				}, 'Remove')
			])
		]);
	},

	configureApp: function(app) {
		window.location = L.url('admin/secubox/admin/settings');
	},

	filterApps: function(query) {
		var cards = document.querySelectorAll('.app-card');
		query = query.toLowerCase();
		cards.forEach(function(card) {
			var name = card.querySelector('h3').textContent.toLowerCase();
			var desc = card.querySelector('.app-description').textContent.toLowerCase();
			if (name.includes(query) || desc.includes(query)) {
				card.style.display = '';
			} else {
				card.style.display = 'none';
			}
		});
	},

	filterByCategory: function(category) {
		var cards = document.querySelectorAll('.app-card');
		cards.forEach(function(card) {
			if (!category || card.dataset.category === category) {
				card.style.display = '';
			} else {
				card.style.display = 'none';
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
