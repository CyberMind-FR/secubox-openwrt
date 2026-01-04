'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require ui';
'require poll';

return view.extend({
	load: function() {
		console.log('[UPDATES] Loading data...');
		return Promise.all([
			L.resolveDefault(API.checkUpdates(), { updates: [] }),
			L.resolveDefault(API.getApps(), { apps: [] }),
			L.resolveDefault(API.getModules(), { modules: {} })
		]).then(function(results) {
			console.log('[UPDATES] Data loaded:', {
				updates: results[0],
				apps: results[1],
				modules: results[2]
			});
			return results;
		}).catch(function(err) {
			console.error('[UPDATES] Load error:', err);
			return [{ updates: [] }, { apps: [] }, { modules: {} }];
		});
	},

	render: function(data) {
		console.log('[UPDATES] Rendering with data:', data);
		var updateData = data[0] || {};
		var apps = data[1].apps || [];
		var modules = data[2].modules || {};
		var self = this;

		var updatesAvailable = updateData.updates || [];
		var totalUpdates = updatesAvailable.length;

		console.log('[UPDATES] Total updates available:', totalUpdates);

		var container = E('div', { 'class': 'cyberpunk-mode secubox-updates' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/cyberpunk.css') }),

			// Cyberpunk header
			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '⚡ AVAILABLE UPDATES'),
				E('div', { 'class': 'cyber-header-subtitle' },
					totalUpdates + ' update' + (totalUpdates !== 1 ? 's' : '') + ' available · Keep your system current')
			]),

			// Summary stats panel
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'UPDATE STATUS'),
					E('span', { 'class': 'cyber-panel-badge ' + (totalUpdates > 0 ? 'warning' : 'success') }, 
						totalUpdates > 0 ? totalUpdates + ' PENDING' : 'UP TO DATE')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-quick-actions' }, [
						totalUpdates > 0 ? E('button', {
							'class': 'cyber-action-btn',
							'click': function() {
								console.log('[UPDATES] Update all apps');
								self.updateAllApps(updatesAvailable);
							}
						}, [
							E('span', { 'class': 'cyber-action-icon' }, '⚡'),
							E('span', { 'class': 'cyber-action-label' }, 'UPDATE ALL (' + totalUpdates + ')'),
							E('span', { 'class': 'cyber-action-arrow' }, '→')
						]) : null,
						E('button', {
							'class': 'cyber-action-btn',
							'click': function() {
								console.log('[UPDATES] Check for updates');
								self.checkForUpdates();
							}
						}, [
							E('span', { 'class': 'cyber-action-icon' }, '🔍'),
							E('span', { 'class': 'cyber-action-label' }, 'CHECK FOR UPDATES'),
							E('span', { 'class': 'cyber-action-arrow' }, '→')
						])
					])
				])
			]),

			// Updates list
			totalUpdates > 0 ?
				E('div', { 'class': 'cyber-list', 'id': 'updates-list' },
					updatesAvailable.map(function(update) {
						var app = apps.find(function(a) { return a.id === update.app_id; });
						console.log('[UPDATES] Rendering update for:', update.app_id);
						return self.renderUpdateCard(update, app);
					})
				) :
				E('div', { 'class': 'cyber-panel' }, [
					E('div', { 'class': 'cyber-panel-body', 'style': 'text-align: center; padding: 40px;' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 20px;' }, '✓'),
						E('div', { 'style': 'color: var(--cyber-primary); font-size: 18px; margin-bottom: 10px;' }, 
							'ALL APPLICATIONS UP TO DATE'),
						E('div', { 'style': 'color: var(--cyber-text-dim); font-size: 12px;' },
							'Check back later or click "CHECK FOR UPDATES"')
					])
				])
		]);

		// Auto-refresh every 60s
		poll.add(function() {
			console.log('[UPDATES] Polling for updates...');
			return API.checkUpdates().then(function(result) {
				if ((result.updates || []).length !== totalUpdates) {
					console.log('[UPDATES] Update count changed, reloading');
					window.location.reload();
				}
			}).catch(function(err) {
				console.error('[UPDATES] Poll error:', err);
			});
		}, 60);

		return container;
	},

	renderUpdateCard: function(update, app) {
		var self = this;

		if (!app) {
			app = {
				id: update.app_id,
				name: update.app_id,
				description: 'Application',
				icon: '📦'
			};
		}

		return E('div', { 'class': 'cyber-list-item', 'data-app-id': update.app_id }, [
			E('div', { 'class': 'cyber-list-icon' }, app.icon || '📦'),
			E('div', { 'class': 'cyber-list-content' }, [
				E('div', { 'class': 'cyber-list-title' }, [
					app.name,
					E('span', { 'class': 'cyber-badge warning' }, '⚡ UPDATE')
				]),
				E('div', { 'class': 'cyber-list-meta' }, [
					E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '📊 '),
						'v' + (update.installed_version || '?') + ' → v' + (update.catalog_version || '?')
					]),
					E('span', { 'class': 'cyber-list-meta-item' }, [
						E('span', {}, '📁 '),
						app.category || 'application'
					])
				])
			]),
			E('div', { 'class': 'cyber-list-actions' }, [
				E('button', {
					'class': 'cyber-btn warning',
					'click': function() {
						console.log('[UPDATES] Update app:', update.app_id);
						self.updateApp(update.app_id, app.name);
					}
				}, '⚡ UPDATE'),
				E('button', {
					'class': 'cyber-btn',
					'click': function() {
						console.log('[UPDATES] View changelog:', update.app_id);
						self.viewFullChangelog(update.app_id, update.installed_version, update.catalog_version);
					}
				}, '📋 CHANGELOG')
			])
		]);
	},

	updateApp: function(appId, appName) {
		console.log('[UPDATES] Updating app:', appId);
		ui.showModal('Updating Application', [
			Components.renderLoader('Updating ' + appName + '...')
		]);

		API.installApp(appId).then(function(result) {
			console.log('[UPDATES] Update result:', result);
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', appName + ' updated successfully'), 'success');
				setTimeout(function() { window.location.reload(); }, 1000);
			} else {
				ui.addNotification(null, E('p', 'Update failed: ' + (result.error || 'Unknown')), 'error');
			}
		}).catch(function(err) {
			console.error('[UPDATES] Update error:', err);
			ui.hideModal();
			ui.addNotification(null, E('p', 'Update error: ' + err.message), 'error');
		});
	},

	updateAllApps: function(updates) {
		console.log('[UPDATES] Updating all apps:', updates.length);
		if (updates.length === 0) return;

		ui.showModal('Updating Applications', [
			Components.renderLoader('Updating ' + updates.length + ' applications...')
		]);

		var currentIndex = 0;
		function updateNext() {
			if (currentIndex >= updates.length) {
				ui.hideModal();
				ui.addNotification(null, E('p', 'All applications updated'), 'success');
				setTimeout(function() { window.location.reload(); }, 1000);
				return;
			}

			var update = updates[currentIndex];
			console.log('[UPDATES] Batch update:', update.app_id, '(' + (currentIndex + 1) + '/' + updates.length + ')');
			
			API.installApp(update.app_id).then(function() {
				currentIndex++;
				updateNext();
			}).catch(function(err) {
				console.error('[UPDATES] Batch update error:', err);
				ui.hideModal();
				ui.addNotification(null, E('p', 'Failed: ' + update.app_id), 'error');
			});
		}

		updateNext();
	},

	viewFullChangelog: function(appId, fromVersion, toVersion) {
		console.log('[UPDATES] Viewing changelog:', appId, fromVersion, '→', toVersion);
		API.getChangelog(appId, fromVersion, toVersion).then(function(changelog) {
			ui.showModal('Changelog: ' + appId, [
				E('pre', {}, JSON.stringify(changelog, null, 2)),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'btn', 'click': ui.hideModal }, 'Close')
				])
			]);
		}).catch(function(err) {
			console.error('[UPDATES] Changelog error:', err);
			ui.addNotification(null, E('p', 'Changelog failed: ' + err.message), 'error');
		});
	},

	checkForUpdates: function() {
		console.log('[UPDATES] Checking for updates');
		ui.showModal('Checking for Updates', [
			Components.renderLoader('Syncing catalog and checking for updates...')
		]);

		API.syncCatalog(null).then(function() {
			return API.checkUpdates();
		}).then(function(result) {
			console.log('[UPDATES] Check result:', result);
			ui.hideModal();
			ui.addNotification(null, E('p', 'Found ' + (result.updates || []).length + ' updates'), 'success');
			window.location.reload();
		}).catch(function(err) {
			console.error('[UPDATES] Check error:', err);
			ui.hideModal();
			ui.addNotification(null, E('p', 'Check failed: ' + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
