'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require secubox-admin.data-utils as DataUtils';
'require ui';
'require poll';

return view.extend({
	load: function() {
		console.log('[CATALOG-SOURCES-DEBUG] ========== LOAD START ==========');

		var getSourcesPromise = API.getCatalogSources().then(function(result) {
			console.log('[CATALOG-SOURCES-DEBUG] getCatalogSources() raw result:', result);
			console.log('[CATALOG-SOURCES-DEBUG] getCatalogSources() result type:', typeof result);
			console.log('[CATALOG-SOURCES-DEBUG] getCatalogSources() keys:', Object.keys(result || {}));
			console.log('[CATALOG-SOURCES-DEBUG] getCatalogSources() sources:', result.sources);
			return { sources: DataUtils.normalizeSources(result) };
		}).catch(function(err) {
			console.error('[CATALOG-SOURCES-DEBUG] getCatalogSources() ERROR:', err);
			console.error('[CATALOG-SOURCES-DEBUG] Error message:', err.message);
			console.error('[CATALOG-SOURCES-DEBUG] Error stack:', err.stack);
			return { sources: [] };
		});

		var checkUpdatesPromise = API.checkUpdates().then(function(result) {
			console.log('[CATALOG-SOURCES-DEBUG] checkUpdates() raw result:', result);
			return DataUtils.normalizeUpdates(result);
		}).catch(function(err) {
			console.error('[CATALOG-SOURCES-DEBUG] checkUpdates() ERROR:', err);
			return { updates: [], total_updates_available: 0 };
		});

		return Promise.all([
			L.resolveDefault(getSourcesPromise, { sources: [] }),
			L.resolveDefault(checkUpdatesPromise, { updates: [], total_updates_available: 0 })
		]).then(function(results) {
			console.log('[CATALOG-SOURCES-DEBUG] ========== ALL PROMISES RESOLVED ==========');
			console.log('[CATALOG-SOURCES-DEBUG] Result[0] (sources):', results[0]);
			console.log('[CATALOG-SOURCES-DEBUG] Result[1] (updates):', results[1]);
			console.log('[CATALOG-SOURCES-DEBUG] ========== LOAD COMPLETE ==========');
			return results;
		}).catch(function(err) {
			console.error('[CATALOG-SOURCES-DEBUG] ========== PROMISE.ALL ERROR ==========');
			console.error('[CATALOG-SOURCES-DEBUG] Error:', err);
			return [{ sources: [] }, { updates: [], total_updates_available: 0 }];
		});
	},

	render: function(data) {
		console.log('[CATALOG-SOURCES-DEBUG] ========== RENDER START ==========');
		console.log('[CATALOG-SOURCES-DEBUG] Render data (raw):', data);
		console.log('[CATALOG-SOURCES-DEBUG] Render data type:', typeof data);
		console.log('[CATALOG-SOURCES-DEBUG] Render data length:', data ? data.length : 'null');

		var sources = DataUtils.normalizeSources(data[0]);
		var updateInfo = DataUtils.normalizeUpdates(data[1]);
		var self = this;

		if (!sources.length) {
			console.log('[CATALOG-SOURCES-DEBUG] No sources returned, injecting defaults');
			sources = this.getDefaultSources();
		}

		console.log('[CATALOG-SOURCES-DEBUG] sources array:', sources);
		console.log('[CATALOG-SOURCES-DEBUG] sources count:', sources.length);
		console.log('[CATALOG-SOURCES-DEBUG] updateInfo:', updateInfo);
		console.log('[CATALOG-SOURCES-DEBUG] ========== RENDER PROCESSING ==========');

		var activeSource = sources.filter(function(s) { return s.active; })[0];
		var enabledCount = sources.filter(function(s) { return s.enabled; }).length;

		var container = E('div', { 'class': 'cyberpunk-mode secubox-catalog-sources' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/cyberpunk.css') }),

			// Cyberpunk header
			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '📡 CATALOG SOURCES'),
				E('div', { 'class': 'cyber-header-subtitle' },
					'Multi-source catalog system · ' + sources.length + ' sources configured')
			]),

			// Stats panel
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'SYSTEM STATUS'),
					E('span', { 'class': 'cyber-panel-badge' }, enabledCount + '/' + sources.length)
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-stats-grid' }, [
						E('div', { 'class': 'cyber-stat-card' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '📡'),
							E('div', { 'class': 'cyber-stat-value' }, sources.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Total Sources')
						]),
						E('div', { 'class': 'cyber-stat-card accent' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '✓'),
							E('div', { 'class': 'cyber-stat-value' }, enabledCount),
							E('div', { 'class': 'cyber-stat-label' }, 'Enabled')
						]),
						E('div', { 'class': 'cyber-stat-card warning' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '⚡'),
							E('div', { 'class': 'cyber-stat-value' }, updateInfo.total_updates_available || 0),
							E('div', { 'class': 'cyber-stat-label' }, 'Updates')
						]),
						E('div', { 'class': 'cyber-stat-card' + (activeSource ? '' : ' danger') }, [
							E('div', { 'class': 'cyber-stat-icon' }, '▸'),
							E('div', { 'class': 'cyber-stat-value', 'style': 'font-size: 14px;' },
								activeSource ? activeSource.name.toUpperCase() : 'NONE'),
							E('div', { 'class': 'cyber-stat-label' }, 'Active Source')
						])
					])
				])
			]),

			// Quick actions panel
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'QUICK ACTIONS')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-quick-actions' }, [
						E('button', {
							'class': 'cyber-action-btn',
							'click': function() {
								console.log('[CATALOG-SOURCES] Sync all sources');
								self.syncAllSources();
							}
						}, [
							E('span', { 'class': 'cyber-action-icon' }, '🔄'),
							E('span', { 'class': 'cyber-action-label' }, 'SYNC ALL SOURCES'),
							E('span', { 'class': 'cyber-action-arrow' }, '→')
						]),
						E('button', {
							'class': 'cyber-action-btn',
							'click': function() {
								console.log('[CATALOG-SOURCES] Refresh status');
								self.refreshPage();
							}
						}, [
							E('span', { 'class': 'cyber-action-icon' }, '↻'),
							E('span', { 'class': 'cyber-action-label' }, 'REFRESH STATUS'),
							E('span', { 'class': 'cyber-action-arrow' }, '→')
						])
					])
				])
			]),

			// Sources list
			E('div', { 'class': 'cyber-list', 'id': 'sources-container' },
				sources.length > 0 ?
					sources
						.sort(function(a, b) { return a.priority - b.priority; })
						.map(function(source) {
							console.log('[CATALOG-SOURCES] Rendering source:', source.name);
							return self.renderSourceCard(source);
						}) :
					[E('div', { 'class': 'cyber-panel' }, [
						E('div', { 'class': 'cyber-panel-body', 'style': 'text-align: center; padding: 40px;' }, [
							E('div', { 'style': 'font-size: 48px; margin-bottom: 20px;' }, '📡'),
							E('div', { 'style': 'color: var(--cyber-text-dim);' }, 'NO SOURCES CONFIGURED'),
							E('div', { 'style': 'color: var(--cyber-text-dim); font-size: 12px; margin-top: 10px;' },
								'Configure sources in /etc/config/secubox-appstore')
						])
					])]
			)
		]);

		// Auto-refresh every 30 seconds
		poll.add(function() {
			console.log('[CATALOG-SOURCES] Polling for updates...');
			return API.getCatalogSources().then(function(result) {
				var sourcesContainer = document.getElementById('sources-container');
				var normalized = DataUtils.normalizeSources(result);
				if (sourcesContainer) {
					console.log('[CATALOG-SOURCES] Poll update:', normalized.length, 'sources');
					sourcesContainer.innerHTML = '';
					if (normalized.length) {
						normalized
							.sort(function(a, b) { return a.priority - b.priority; })
							.forEach(function(source) {
								sourcesContainer.appendChild(self.renderSourceCard(source));
							});
					}
				}
			}).catch(function(err) {
				console.error('[CATALOG-SOURCES] Poll error:', err);
			});
		}, 30);

			return container;
	},

	getDefaultSources: function() {
		return [
			{
				name: 'github',
				display_name: 'GitHub Catalog',
				type: 'remote',
				url: 'https://raw.githubusercontent.com/CyberMind-FR/secubox-openwrt/refs/heads/master/package/secubox/secubox-core/root/usr/share/secubox/catalog.json',
				priority: 1,
				enabled: true,
				active: true,
				status: 'default'
			},
			{
				name: 'embedded',
				display_name: 'Embedded Catalog',
				type: 'embedded',
				path: '/usr/share/secubox/catalog.json',
				priority: 999,
				enabled: true,
				active: false,
				status: 'default'
			}
		];
	},

	renderSourceCard: function(source) {
		var self = this;
		var statusClass = this.getStatusClass(source.status);
		var statusDot = source.status === 'online' || source.status === 'available' ? 'online' : 'offline';

		var itemClass = 'cyber-list-item';
		if (source.active) itemClass += ' active';
		if (!source.enabled) itemClass += ' offline';

		return E('div', {
			'class': itemClass,
			'data-source': source.name
		}, [
			// Icon
			E('div', { 'class': 'cyber-list-icon' },
				source.type === 'remote' ? '🌐' :
				source.type === 'local' ? '💾' :
				source.type === 'embedded' ? '📦' : '❓'
			),

			// Content
			E('div', { 'class': 'cyber-list-content' }, [
				E('div', { 'class': 'cyber-list-title' }, [
					source.name.toUpperCase(),
					source.active ? E('span', { 'class': 'cyber-badge success' }, [
						E('span', { 'class': 'cyber-status-dot online' }),
						' ACTIVE'
					]) : null,
					!source.enabled ? E('span', { 'class': 'cyber-badge' }, [
						'DISABLED'
					]) : E('span', { 'class': 'cyber-badge info' }, [
						E('span', { 'class': 'cyber-status-dot ' + statusDot }),
						' ' + (source.status || 'UNKNOWN').toUpperCase()
					])
				]),
				E('div', { 'class': 'cyber-list-meta' }, [
					E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '🔢 '),
						'Priority: ' + source.priority
					]),
					E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '📋 '),
						source.type
					]),
					source.url ? E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '🔗 '),
						E('span', { 'style': 'max-width: 300px; overflow: hidden; text-overflow: ellipsis;' },
							source.url)
					]) : null,
					source.path ? E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '📁 '),
						source.path
					]) : null,
					source.last_success ? E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '⏱️ '),
						this.formatTimestamp(source.last_success)
					]) : null
				])
			]),

			// Actions
			E('div', { 'class': 'cyber-list-actions' }, [
				source.enabled ? E('button', {
					'class': 'cyber-btn primary',
					'click': function() {
						console.log('[CATALOG-SOURCES] Sync source:', source.name);
						self.syncSource(source.name);
					}
				}, '🔄 SYNC') : null,
				source.enabled ? E('button', {
					'class': 'cyber-btn',
					'click': function() {
						console.log('[CATALOG-SOURCES] Test source:', source.name);
						self.testSource(source.name);
					}
				}, '🧪 TEST') : null,
				!source.active && source.enabled ? E('button', {
					'class': 'cyber-btn warning',
					'click': function() {
						console.log('[CATALOG-SOURCES] Set active:', source.name);
						self.setActiveSource(source.name);
					}
				}, '▸ SET ACTIVE') : null,
				E('button', {
					'class': 'cyber-btn ' + (source.enabled ? 'danger' : ''),
					'click': function() {
						console.log('[CATALOG-SOURCES] Toggle source:', source.name, !source.enabled);
						self.toggleSource(source.name, !source.enabled);
					}
				}, source.enabled ? '⊗ DISABLE' : '⊕ ENABLE')
			])
		]);
	},

	getStatusClass: function(status) {
		switch(status) {
			case 'online':
			case 'success':
			case 'available':
				return 'status-success';
			case 'offline':
			case 'error':
				return 'status-error';
			default:
				return 'status-warning';
		}
	},

	formatTimestamp: function(timestamp) {
		if (!timestamp) return 'Never';
		var date = new Date(timestamp);
		var now = new Date();
		var diffMs = now - date;
		var diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return diffMins + 'm ago';

		var diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return diffHours + 'h ago';

		var diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return diffDays + 'd ago';

		return date.toLocaleDateString();
	},

	syncSource: function(sourceName) {
		console.log('[CATALOG-SOURCES] Syncing source:', sourceName);
		ui.showModal('Syncing Catalog', [
			Components.renderLoader('Syncing from source: ' + sourceName + '...')
		]);

		API.syncCatalog(sourceName).then(function(result) {
			console.log('[CATALOG-SOURCES] Sync result:', result);
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', 'Catalog synced successfully from: ' + sourceName), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Sync failed: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			console.error('[CATALOG-SOURCES] Sync error:', err);
			ui.hideModal();
			ui.addNotification(null, E('p', 'Sync error: ' + err.message), 'error');
		});
	},

	syncAllSources: function() {
		console.log('[CATALOG-SOURCES] Syncing all sources');
		ui.showModal('Syncing Catalogs', [
			Components.renderLoader('Syncing from all enabled sources...')
		]);

		API.syncCatalog(null).then(function(result) {
			console.log('[CATALOG-SOURCES] Sync all result:', result);
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', 'Catalogs synced successfully'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Sync failed: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			console.error('[CATALOG-SOURCES] Sync all error:', err);
			ui.hideModal();
			ui.addNotification(null, E('p', 'Sync error: ' + err.message), 'error');
		});
	},

	testSource: function(sourceName) {
		console.log('[CATALOG-SOURCES] Testing source:', sourceName);
		ui.addNotification(null, E('p', 'Testing source: ' + sourceName + '...'), 'info');
		this.syncSource(sourceName);
	},

	setActiveSource: function(sourceName) {
		console.log('[CATALOG-SOURCES] Setting active source:', sourceName);
		ui.showModal('Setting Active Source', [
			Components.renderLoader('Setting active source to: ' + sourceName + '...')
		]);

		API.setCatalogSource(sourceName).then(function(result) {
			console.log('[CATALOG-SOURCES] Set active result:', result);
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', 'Active source set to: ' + sourceName), 'success');
				return API.syncCatalog(sourceName);
			} else {
				throw new Error(result.error || 'Failed to set source');
			}
		}).then(function() {
			window.location.reload();
		}).catch(function(err) {
			console.error('[CATALOG-SOURCES] Set active error:', err);
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	toggleSource: function(sourceName, enable) {
		console.log('[CATALOG-SOURCES] Toggle source:', sourceName, enable);
		ui.addNotification(null,
			E('p', (enable ? 'Enabling' : 'Disabling') + ' source: ' + sourceName),
			'info'
		);
		// TODO: Implement UCI config update to enable/disable source
	},

	refreshPage: function() {
		console.log('[CATALOG-SOURCES] Refreshing page');
		window.location.reload();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
