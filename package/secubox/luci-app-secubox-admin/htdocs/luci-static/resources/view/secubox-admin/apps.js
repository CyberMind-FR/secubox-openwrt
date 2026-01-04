'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require ui';
'require form';

return view.extend({
	load: function() {
		console.log('[APPS] Loading data...');
		return Promise.all([
			L.resolveDefault(API.getApps(), { apps: [] }),
			L.resolveDefault(API.getModules(), { modules: {} }),
			L.resolveDefault(API.checkUpdates(), { updates: [] })
		]).then(function(results) {
			console.log('[APPS] Data loaded:', {
				apps: results[0],
				modules: results[1],
				updates: results[2]
			});
			return results;
		}).catch(function(err) {
			console.error('[APPS] Load error:', err);
			return [{ apps: [] }, { modules: {} }, { updates: [] }];
		});
	},

	render: function(data) {
		console.log('[APPS] Rendering with data:', data);
		var apps = data[0].apps || [];
		var modules = data[1].modules || {};
		var updateInfo = data[2] || {};
		var self = this;

		console.log('[APPS] Apps count:', apps.length);
		console.log('[APPS] Updates:', updateInfo);

		// Create updates lookup map
		var updatesMap = {};
		if (updateInfo.updates) {
			updateInfo.updates.forEach(function(update) {
				updatesMap[update.app_id] = update;
			});
		}

		var container = E('div', { 'class': 'cyberpunk-mode secubox-apps-manager' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/cyberpunk.css') }),

			// Cyberpunk header
			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '📦 APPS MANAGER'),
				E('div', { 'class': 'cyber-header-subtitle' },
					'Browse and manage SecuBox applications · ' + apps.length + ' apps available')
			]),

			// Cyber filters panel
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'FILTERS'),
					E('span', { 'class': 'cyber-panel-badge' }, apps.length)
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('input', {
						'type': 'text',
						'class': 'cyber-input',
						'placeholder': 'Search apps...',
						'style': 'width: 100%; margin-bottom: 10px; padding: 8px; background: rgba(0,255,65,0.1); border: 1px solid var(--cyber-border); color: var(--cyber-text); font-family: inherit;',
						'keyup': function(ev) {
							console.log('[APPS] Search:', ev.target.value);
							self.filterApps(ev.target.value);
						}
					}),
					E('select', {
						'class': 'cyber-select',
						'style': 'width: 100%; margin-bottom: 10px; padding: 8px; background: rgba(0,255,65,0.1); border: 1px solid var(--cyber-border); color: var(--cyber-text); font-family: inherit;',
						'change': function(ev) {
							console.log('[APPS] Category filter:', ev.target.value);
							self.filterByCategory(ev.target.value);
						}
				}, [
						E('option', { 'value': '' }, '→ All Categories'),
						E('option', { 'value': 'security' }, '🔒 Security'),
						E('option', { 'value': 'network' }, '🌐 Network'),
						E('option', { 'value': 'hosting' }, '☁️ Hosting'),
						E('option', { 'value': 'productivity' }, '📊 Productivity'),
						E('option', { 'value': 'monitoring' }, '📡 Monitoring'),
						E('option', { 'value': 'storage' }, '💾 Storage')
					]),
					E('select', {
						'class': 'cyber-select',
						'style': 'width: 100%; padding: 8px; background: rgba(0,255,65,0.1); border: 1px solid var(--cyber-border); color: var(--cyber-text); font-family: inherit;',
						'change': function(ev) {
							console.log('[APPS] Status filter:', ev.target.value);
							self.filterByStatus(ev.target.value);
						}
					}, [
						E('option', { 'value': '' }, '→ All Apps'),
						E('option', { 'value': 'update-available' }, '⚡ Updates Available'),
						E('option', { 'value': 'installed' }, '✓ Installed'),
						E('option', { 'value': 'not-installed' }, '○ Not Installed')
					])
				])
			]),

			// Apps list (cyberpunk style)
			E('div', { 'class': 'cyber-list', 'id': 'apps-grid' },
				apps.length > 0 ?
					apps.map(function(app) {
						console.log('[APPS] Rendering app:', app.id, app);
						var status = API.getAppStatus(app, modules);
						var updateAvailable = updatesMap[app.id];
						return self.renderAppCard(app, status, updateAvailable);
					}) :
					[E('div', { 'class': 'cyber-panel' }, [
						E('div', { 'class': 'cyber-panel-body', 'style': 'text-align: center; padding: 40px;' }, [
							E('div', { 'style': 'font-size: 48px; margin-bottom: 20px;' }, '📦'),
							E('div', { 'style': 'color: var(--cyber-text-dim);' }, 'NO APPS FOUND'),
							E('div', { 'style': 'color: var(--cyber-text-dim); font-size: 12px; margin-top: 10px;' },
								'Check catalog sources or sync catalog')
						])
					])]
			)
		]);

		return container;
	},

	renderAppCard: function(app, status, updateInfo) {
		var self = this;
		var hasUpdate = updateInfo && updateInfo.update_available;
		var isInstalled = status && status.installed;

		console.log('[APPS] Rendering card for:', app.id, {isInstalled: isInstalled, hasUpdate: hasUpdate});

		var itemClass = 'cyber-list-item';
		if (isInstalled) itemClass += ' active';

		return E('div', {
			'class': itemClass,
			'data-category': app.category,
			'data-update-status': hasUpdate ? 'update-available' : '',
			'data-install-status': isInstalled ? 'installed' : 'not-installed'
		}, [
			// Icon
			E('div', { 'class': 'cyber-list-icon' }, app.icon || '📦'),

			// Content
			E('div', { 'class': 'cyber-list-content' }, [
				E('div', { 'class': 'cyber-list-title' }, [
					app.name,
					isInstalled ? E('span', { 'class': 'cyber-badge success' }, [
						E('span', { 'class': 'cyber-status-dot online' }),
						' INSTALLED'
					]) : null,
					hasUpdate ? E('span', { 'class': 'cyber-badge warning' }, [
						'⚡ UPDATE'
					]) : null
				]),
				E('div', { 'class': 'cyber-list-meta' }, [
					E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '📁 '),
						app.category || 'general'
					]),
					E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '🔖 '),
						'v' + (app.pkg_version || app.version || '1.0')
					]),
					hasUpdate ? E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '→ '),
						'v' + updateInfo.catalog_version
					]) : null
				])
			]),

			// Actions
			E('div', { 'class': 'cyber-list-actions' },
				isInstalled ? [
					hasUpdate ? E('button', {
						'class': 'cyber-btn warning',
						'click': function() {
							console.log('[APPS] Update app:', app.id);
							self.updateApp(app, updateInfo);
						}
					}, '⚡ UPDATE') : null,
					E('button', {
						'class': 'cyber-btn',
						'click': function() {
							console.log('[APPS] Configure app:', app.id);
							self.configureApp(app);
						}
					}, '⚙️ CONFIG'),
					E('button', {
						'class': 'cyber-btn danger',
						'click': function() {
							console.log('[APPS] Remove app:', app.id);
							self.removeApp(app);
						}
					}, '🗑️ REMOVE')
				] : [
					E('button', {
						'class': 'cyber-btn primary',
						'click': function() {
							console.log('[APPS] Install app:', app.id);
							self.installApp(app);
						}
					}, '⬇️ INSTALL')
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
