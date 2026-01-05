'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require secubox-admin.data-utils as DataUtils';
'require ui';
'require form';

return view.extend({
	load: function() {
		console.log('[APPS-DEBUG] ========== LOAD START ==========');

		var getAppsPromise = API.getApps().then(function(result) {
			console.log('[APPS-DEBUG] getApps() raw result:', result);
			var apps = DataUtils.normalizeApps(result);
			var categories = DataUtils.extractCategories(result);
			console.log('[APPS-DEBUG] Normalized apps length:', apps.length);
			console.log('[APPS-DEBUG] Categories:', Object.keys(categories || {}));
			return { apps: apps, categories: categories };
		}).catch(function(err) {
			console.error('[APPS-DEBUG] getApps() ERROR:', err);
			console.error('[APPS-DEBUG] Error message:', err.message);
			console.error('[APPS-DEBUG] Error stack:', err.stack);
			return { apps: [], categories: {} };
		});

		var getModulesPromise = API.getModules().then(function(result) {
			console.log('[APPS-DEBUG] getModules() raw result:', result);
			var modules = DataUtils.normalizeModules(result);
			console.log('[APPS-DEBUG] Normalized modules keys:', Object.keys(modules || {}).length);
			return modules;
		}).catch(function(err) {
			console.error('[APPS-DEBUG] getModules() ERROR:', err);
			return {};
		});

		var checkUpdatesPromise = API.checkUpdates().then(function(result) {
			console.log('[APPS-DEBUG] checkUpdates() raw result:', result);
			return DataUtils.normalizeUpdates(result);
		}).catch(function(err) {
			console.error('[APPS-DEBUG] checkUpdates() ERROR:', err);
			return { updates: [], total_updates_available: 0 };
		});

		return Promise.all([
			L.resolveDefault(getAppsPromise, { apps: [], categories: {} }),
			L.resolveDefault(getModulesPromise, {}),
			L.resolveDefault(checkUpdatesPromise, { updates: [], total_updates_available: 0 })
		]).then(function(results) {
			console.log('[APPS-DEBUG] ========== ALL PROMISES RESOLVED ==========');
			console.log('[APPS-DEBUG] Apps length:', (results[0].apps || []).length);
			console.log('[APPS-DEBUG] Modules keys:', Object.keys(results[1] || {}).length);
			console.log('[APPS-DEBUG] Updates data:', results[2]);
			console.log('[APPS-DEBUG] ========== LOAD COMPLETE ==========');
			return results;
		}).catch(function(err) {
			console.error('[APPS-DEBUG] ========== PROMISE.ALL ERROR ==========');
			console.error('[APPS-DEBUG] Error:', err);
			return [{ apps: [], categories: {} }, {}, { updates: [] }];
		});
	},

	render: function(data) {
		console.log('[APPS-DEBUG] ========== RENDER START ==========');
		console.log('[APPS-DEBUG] Render data (raw):', data);
		console.log('[APPS-DEBUG] Render data type:', typeof data);
		console.log('[APPS-DEBUG] Render data length:', data ? data.length : 'null');

		var appsPayload = data[0] || {};
		var apps = DataUtils.normalizeApps(appsPayload.apps || appsPayload);
		var modules = DataUtils.normalizeModules(data[1]);
		var updateInfo = DataUtils.normalizeUpdates(data[2]);
		var categories = appsPayload.categories || {};
		var stats = DataUtils.buildAppStats(apps, modules, null, updateInfo, API.getAppStatus);
		var self = this;
		var categoryOptions = this.renderCategoryOptions(categories);

		this.cachedApps = apps;
		this.cachedModules = modules;
		this.cachedUpdates = updateInfo;
		this.cachedCategories = categories;
		this.activeFilters = this.activeFilters || { query: '', category: '', status: '' };

		console.log('[APPS-DEBUG] apps array:', apps);
		console.log('[APPS-DEBUG] apps count:', apps.length);
		console.log('[APPS-DEBUG] modules:', modules);
		console.log('[APPS-DEBUG] updateInfo:', updateInfo);
		console.log('[APPS-DEBUG] ========== RENDER PROCESSING ==========');

		// Create updates lookup map
		var updatesMap = {};
		if (updateInfo.updates) {
			updateInfo.updates.forEach(function(update) {
				updatesMap[update.app_id] = update;
			});
		}

		// Filter featured apps
		var featuredApps = apps.filter(function(app) {
			return app.featured === true;
		}).sort(function(a, b) {
			var priorityA = a.featured_priority || 999;
			var priorityB = b.featured_priority || 999;
			return priorityA - priorityB;
		});

		var container = E('div', { 'class': 'cyberpunk-mode secubox-apps-manager' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			// Cyberpunk header
			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '📦 APPS MANAGER'),
				E('div', { 'class': 'cyber-header-subtitle' },
					'Browse and manage SecuBox applications · ' + apps.length + ' apps available')
			]),

			this.renderStatsPanel(stats),

			// Featured Apps Section
			featuredApps.length > 0 ? E('div', { 'class': 'cyber-featured-section' }, [
				E('div', { 'class': 'cyber-featured-section-header' }, [
					E('div', {}, [
						E('div', { 'class': 'cyber-featured-section-title' }, 'Featured Apps'),
						E('div', { 'class': 'cyber-featured-section-subtitle' },
							'Handpicked apps recommended for your SecuBox')
					])
				]),
				E('div', { 'class': 'cyber-featured-apps-grid' },
					featuredApps.map(function(app) {
						var status = API.getAppStatus(app, modules);
						return self.renderFeaturedAppCard(app, status);
					})
				)
			]) : null,

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
						E('option', { 'value': '' }, '→ All Categories')
					].concat(categoryOptions)),
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

		var itemClass = 'cyber-list-item app-card';
		if (isInstalled) itemClass += ' active';

		return E('div', {
			'class': itemClass,
			'data-category': (app.category || '').toLowerCase(),
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

	renderStatsPanel: function(stats) {
		var tiles = [
			this.renderStatTile('📦', stats.totalApps, 'Registered', 'accent'),
			this.renderStatTile('✅', stats.installedCount, 'Installed', stats.installedCount === stats.totalApps ? 'success' : ''),
			this.renderStatTile('▶️', stats.runningCount, 'Running', stats.runningCount ? 'success' : 'muted'),
			this.renderStatTile('⚡', stats.updateCount, 'Updates', stats.updateCount ? 'warning' : 'muted'),
			this.renderStatTile('🧩', stats.widgetCount, 'Widgets', stats.widgetCount ? 'accent' : '')
		];

		return E('div', { 'class': 'cyber-panel' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('span', { 'class': 'cyber-panel-title' }, 'SYSTEM SNAPSHOT'),
				E('span', { 'class': 'cyber-panel-badge' }, stats.totalApps + ' apps')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-stats-grid' }, tiles)
			])
		]);
	},

	renderStatTile: function(icon, value, label, extraClass) {
		var tileClass = 'cyber-stat-card';
		if (extraClass) tileClass += ' ' + extraClass;

		return E('div', { 'class': tileClass }, [
			E('div', { 'class': 'cyber-stat-icon' }, icon),
			E('div', { 'class': 'cyber-stat-value' }, value.toString()),
			E('div', { 'class': 'cyber-stat-label' }, label)
		]);
	},

	renderFeaturedAppCard: function(app, status) {
		var self = this;
		var isInstalled = status && status.installed;

		// Get badge class
		var badgeClass = 'cyber-featured-badge';
		var badgeText = 'FEATURED';
		if (app.badges && app.badges.length > 0) {
			var badge = app.badges[0];
			if (badge === 'new') {
				badgeClass += ' cyber-featured-badge--new';
				badgeText = 'NEW';
			} else if (badge === 'popular') {
				badgeClass += ' cyber-featured-badge--popular';
				badgeText = 'POPULAR';
			} else if (badge === 'recommended') {
				badgeClass += ' cyber-featured-badge--recommended';
				badgeText = 'RECOMMENDED';
			}
		}

		return E('div', {
			'class': 'cyber-featured-app-card',
			'click': function() {
				if (!isInstalled) {
					self.installApp(app);
				}
			}
		}, [
			// Featured badge
			E('div', { 'class': badgeClass }, badgeText),

			// Header with icon and info
			E('div', { 'class': 'cyber-featured-app-header' }, [
				E('div', { 'class': 'cyber-featured-app-icon' }, app.icon || '📦'),
				E('div', { 'class': 'cyber-featured-app-info' }, [
					E('div', { 'class': 'cyber-featured-app-name' }, app.name),
					E('div', { 'class': 'cyber-featured-app-category' },
						(app.category || 'general').toUpperCase())
				])
			]),

			// Description
			E('div', { 'class': 'cyber-featured-app-description' }, app.description || 'No description available'),

			// Featured reason (why it's featured)
			app.featured_reason ? E('div', { 'class': 'cyber-featured-app-reason' },
				'💡 ' + app.featured_reason) : null,

			// Footer with tags and action
			E('div', { 'class': 'cyber-featured-app-footer' }, [
				E('div', { 'class': 'cyber-featured-app-tags' },
					(app.tags || []).slice(0, 2).map(function(tag) {
						return E('span', { 'class': 'cyber-featured-app-tag' }, tag);
					})
				),
				E('div', { 'class': 'cyber-featured-app-action' }, [
					isInstalled ? [
						E('span', { 'style': 'color: var(--cyber-success);' }, '✓ Installed'),
						' → ',
						E('span', {
							'style': 'cursor: pointer;',
							'click': function(ev) {
								ev.stopPropagation();
								self.configureApp(app);
							}
						}, 'Configure')
					] : [
						E('span', {}, 'Install now'),
						' →'
					]
				])
			])
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

	renderCategoryOptions: function(categories) {
		var options = [];
		if (!categories || typeof categories !== 'object') {
			return options;
		}

		Object.keys(categories).forEach(function(key) {
			var entry = categories[key] || {};
			var label = (entry.icon ? entry.icon + ' ' : '') + (entry.name || key);
			options.push(E('option', { 'value': key.toLowerCase() }, label));
		});

		return options;
	},

	applyFilters: function() {
		var cards = document.querySelectorAll('.app-card');
		var filters = this.activeFilters || { query: '', category: '', status: '' };

		Array.prototype.forEach.call(cards, function(card) {
			var titleEl = card.querySelector('.cyber-list-title');
			var contentEl = card.querySelector('.cyber-list-content');
			var nameText = titleEl ? titleEl.textContent.toLowerCase() : '';
			var descText = contentEl ? contentEl.textContent.toLowerCase() : '';
			var matchesQuery = true;
			if (filters.query) {
				matchesQuery = nameText.indexOf(filters.query) !== -1 ||
					descText.indexOf(filters.query) !== -1;
			}

			var cardCategory = (card.getAttribute('data-category') || '').toLowerCase();
			var matchesCategory = !filters.category || cardCategory === filters.category;

			var installStatus = (card.getAttribute('data-install-status') || '').toLowerCase();
			var updateStatus = (card.getAttribute('data-update-status') || '').toLowerCase();
			var matchesStatus = true;

			if (filters.status === 'update-available') {
				matchesStatus = updateStatus === 'update-available';
			} else if (filters.status === 'installed') {
				matchesStatus = installStatus === 'installed';
			} else if (filters.status === 'not-installed') {
				matchesStatus = installStatus === 'not-installed';
			}

			card.style.display = (matchesQuery && matchesCategory && matchesStatus) ? '' : 'none';
		});
	},

	filterApps: function(query) {
		this.activeFilters.query = (query || '').toLowerCase();
		this.applyFilters();
	},

	filterByCategory: function(category) {
		this.activeFilters.category = (category || '').toLowerCase();
		this.applyFilters();
	},

	filterByStatus: function(status) {
		this.activeFilters.status = (status || '').toLowerCase();
		this.applyFilters();
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
