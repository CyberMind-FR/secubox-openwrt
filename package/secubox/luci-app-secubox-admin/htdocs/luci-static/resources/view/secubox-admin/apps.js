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
			API.getModules(),
			L.resolveDefault(API.checkUpdates(), {})
		]);
	},

	render: function(data) {
		var apps = data[0].apps || [];
		var modules = data[1].modules || {};
		var updateInfo = data[2] || {};
		var self = this;

		// Create updates lookup map
		var updatesMap = {};
		if (updateInfo.updates) {
			updateInfo.updates.forEach(function(update) {
				updatesMap[update.app_id] = update;
			});
		}

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
				]),
				E('select', {
					'class': 'status-filter',
					'change': function(ev) {
						self.filterByStatus(ev.target.value);
					}
				}, [
					E('option', { 'value': '' }, 'All Apps'),
					E('option', { 'value': 'update-available' }, 'Updates Available'),
					E('option', { 'value': 'installed' }, 'Installed'),
					E('option', { 'value': 'not-installed' }, 'Not Installed')
				])
			]),

			// Apps grid
			E('div', { 'class': 'apps-grid', 'id': 'apps-grid' },
				apps.map(function(app) {
					var status = API.getAppStatus(app, modules);
					var updateAvailable = updatesMap[app.id];
					return self.renderAppCard(app, status, updateAvailable);
				})
			)
		]);

		return container;
	},

	renderAppCard: function(app, status, updateInfo) {
		var self = this;
		var hasUpdate = updateInfo && updateInfo.update_available;

		var cardClasses = 'app-card';
		if (status.installed) cardClasses += ' installed';
		if (hasUpdate) cardClasses += ' has-update';

		return E('div', {
			'class': cardClasses,
			'data-category': app.category,
			'data-update-status': hasUpdate ? 'update-available' : '',
			'data-install-status': status.installed ? 'installed' : 'not-installed'
		}, [
			E('div', { 'class': 'app-icon' }, app.icon || '📦'),
			E('div', { 'class': 'app-info' }, [
				E('div', { 'class': 'app-title-row' }, [
					E('h3', {}, app.name),
					hasUpdate ? E('span', { 'class': 'badge badge-warning update-badge' }, 'Update') : null
				]),
				E('p', { 'class': 'app-description' }, app.description),
				E('div', { 'class': 'app-meta' }, [
					E('span', { 'class': 'app-category' }, app.category),
					E('span', {
						'class': 'app-version' + (hasUpdate ? ' version-outdated' : ''),
						'title': hasUpdate ?
							'Installed: ' + updateInfo.installed_version + ' → Available: ' + updateInfo.catalog_version :
							''
					}, 'v' + (app.pkg_version || app.version || '1.0')),
					Components.renderStatusBadge(status.status)
				])
			]),
			E('div', { 'class': 'app-actions' },
				status.installed ? [
					hasUpdate ? E('button', {
						'class': 'btn btn-sm btn-warning',
						'click': function() { self.updateApp(app, updateInfo); }
					}, 'Update') : null,
					E('button', {
						'class': 'btn btn-sm btn-secondary',
						'click': function() { self.viewChangelog(app); }
					}, 'Changelog'),
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
						'class': 'btn btn-sm btn-secondary',
						'click': function() { self.viewChangelog(app); }
					}, 'Changelog'),
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

	filterByStatus: function(status) {
		var cards = document.querySelectorAll('.app-card');
		cards.forEach(function(card) {
			if (!status) {
				card.style.display = '';
			} else if (status === 'update-available') {
				card.style.display = card.dataset.updateStatus === 'update-available' ? '' : 'none';
			} else if (status === 'installed') {
				card.style.display = card.dataset.installStatus === 'installed' ? '' : 'none';
			} else if (status === 'not-installed') {
				card.style.display = card.dataset.installStatus === 'not-installed' ? '' : 'none';
			}
		});
	},

	updateApp: function(app, updateInfo) {
		var self = this;
		ui.showModal('Update ' + app.name, [
			E('p', {}, 'Update ' + app.name + ' from v' +
				updateInfo.installed_version + ' to v' + updateInfo.catalog_version + '?'),
			updateInfo.changelog ? E('div', { 'class': 'update-changelog' }, [
				E('h4', {}, 'What\'s New:'),
				E('div', {},
					Array.isArray(updateInfo.changelog) ?
						E('ul', {},
							updateInfo.changelog.map(function(item) {
								return E('li', {}, item);
							})
						) :
						E('p', {}, updateInfo.changelog)
				)
			]) : null,
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'btn btn-warning',
					'click': function() {
						ui.hideModal();
						ui.showModal('Updating...', [
							Components.renderLoader('Updating ' + app.name + '...')
						]);
						API.installApp(app.id).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', app.name + ' updated successfully'), 'success');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', 'Failed to update ' + app.name), 'error');
							}
						});
					}
				}, 'Update')
			])
		]);
	},

	viewChangelog: function(app) {
		ui.showModal('Changelog: ' + app.name, [
			E('p', { 'class': 'spinning' }, 'Loading changelog...')
		]);

		API.getChangelog(app.id, null, null).then(function(changelog) {
			var content = E('div', { 'class': 'changelog-viewer' });

			if (changelog && changelog.changelog) {
				var versions = Object.keys(changelog.changelog);
				versions.forEach(function(version) {
					var versionData = changelog.changelog[version];
					content.appendChild(E('div', { 'class': 'changelog-version' }, [
						E('h4', {}, 'Version ' + version),
						versionData.date ? E('p', { 'class': 'changelog-date' }, versionData.date) : null,
						E('ul', {},
							(versionData.changes || []).map(function(change) {
								return E('li', {}, change);
							})
						)
					]));
				});
			} else if (typeof changelog === 'string') {
				content.appendChild(E('pre', {}, changelog));
			} else {
				content.appendChild(E('p', {}, 'No changelog available'));
			}

			ui.showModal('Changelog: ' + app.name, [
				content,
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, 'Close')
				])
			]);
		}).catch(function(err) {
			ui.showModal('Changelog: ' + app.name, [
				E('p', {}, 'Failed to load changelog: ' + err.message),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, 'Close')
				])
			]);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
