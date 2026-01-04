'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require ui';
'require poll';

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(API.checkUpdates(), { updates: [] }),
			API.getApps(),
			API.getModules()
		]);
	},

	render: function(data) {
		var updateData = data[0] || {};
		var apps = data[1].apps || [];
		var modules = data[2].modules || {};
		var self = this;

		// Filter apps that have updates available
		var updatesAvailable = updateData.updates || [];
		var totalUpdates = updatesAvailable.length;

		var container = E('div', { 'class': 'secubox-updates' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('h2', {}, 'Available Updates'),
			E('p', {}, 'Review and install available updates for SecuBox applications'),

			// Summary header
			E('div', { 'class': 'updates-summary' }, [
				E('div', { 'class': 'summary-card' }, [
					E('div', { 'class': 'summary-icon' }, '📦'),
					E('div', { 'class': 'summary-info' }, [
						E('div', { 'class': 'summary-count' }, totalUpdates.toString()),
						E('div', { 'class': 'summary-label' }, totalUpdates === 1 ? 'Update Available' : 'Updates Available')
					])
				]),
				E('div', { 'class': 'summary-actions' }, [
					totalUpdates > 0 ? E('button', {
						'class': 'btn btn-primary',
						'click': function() {
							self.updateAllApps(updatesAvailable);
						}
					}, 'Update All') : null,
					E('button', {
						'class': 'btn btn-secondary',
						'click': function() {
							self.checkForUpdates();
						}
					}, 'Check for Updates')
				])
			]),

			// Updates list
			totalUpdates > 0 ?
				E('div', { 'class': 'updates-list', 'id': 'updates-list' },
					updatesAvailable.map(function(update) {
						// Find full app details from catalog
						var app = apps.find(function(a) { return a.id === update.app_id; });
						return self.renderUpdateCard(update, app);
					})
				) :
				E('div', { 'class': 'no-updates' }, [
					E('div', { 'class': 'no-updates-icon' }, '✓'),
					E('h3', {}, 'All applications are up to date'),
					E('p', {}, 'Check back later for new updates or click "Check for Updates" to refresh.')
				])
		]);

		// Auto-refresh every 60 seconds
		poll.add(function() {
			return API.checkUpdates().then(function(result) {
				var updatesList = document.getElementById('updates-list');
				if (updatesList && result.updates) {
					// Only update if count changed
					if (result.updates.length !== totalUpdates) {
						window.location.reload();
					}
				}
			});
		}, 60);

		return container;
	},

	renderUpdateCard: function(update, app) {
		var self = this;

		if (!app) {
			// App not found in catalog, show minimal info
			app = {
				id: update.app_id,
				name: update.app_id,
				description: 'Application from catalog',
				icon: '📦'
			};
		}

		return E('div', { 'class': 'update-card', 'data-app-id': update.app_id }, [
			// App header
			E('div', { 'class': 'update-header' }, [
				E('div', { 'class': 'app-icon-large' }, app.icon || '📦'),
				E('div', { 'class': 'app-title' }, [
					E('h3', {}, app.name),
					E('p', { 'class': 'app-category' }, app.category || 'Application')
				]),
				E('div', { 'class': 'update-badge' }, [
					E('span', { 'class': 'badge badge-warning' }, 'UPDATE AVAILABLE')
				])
			]),

			// Version info
			E('div', { 'class': 'version-info' }, [
				E('div', { 'class': 'version-row' }, [
					E('span', { 'class': 'version-label' }, 'Current Version:'),
					E('span', { 'class': 'version-value current' }, update.installed_version || 'Unknown')
				]),
				E('div', { 'class': 'version-arrow' }, '→'),
				E('div', { 'class': 'version-row' }, [
					E('span', { 'class': 'version-label' }, 'New Version:'),
					E('span', { 'class': 'version-value new' }, update.catalog_version || 'Unknown')
				])
			]),

			// Changelog section
			update.changelog ? E('div', { 'class': 'changelog-section' }, [
				E('h4', {}, 'What\'s New'),
				E('div', { 'class': 'changelog-content' },
					this.renderChangelog(update.changelog)
				)
			]) : null,

			// Update info
			E('div', { 'class': 'update-meta' }, [
				update.release_date ? E('div', { 'class': 'meta-item' }, [
					E('span', { 'class': 'meta-label' }, 'Release Date:'),
					E('span', { 'class': 'meta-value' }, update.release_date)
				]) : null,
				update.download_size ? E('div', { 'class': 'meta-item' }, [
					E('span', { 'class': 'meta-label' }, 'Download Size:'),
					E('span', { 'class': 'meta-value' }, API.formatBytes(update.download_size))
				]) : null
			]),

			// Actions
			E('div', { 'class': 'update-actions' }, [
				E('button', {
					'class': 'btn btn-primary',
					'click': function() {
						self.updateApp(update.app_id, app.name);
					}
				}, 'Update Now'),
				E('button', {
					'class': 'btn btn-secondary',
					'click': function() {
						self.viewFullChangelog(update.app_id, update.installed_version, update.catalog_version);
					}
				}, 'View Full Changelog'),
				E('button', {
					'class': 'btn btn-tertiary',
					'click': function() {
						self.skipUpdate(update.app_id);
					}
				}, 'Skip This Version')
			])
		]);
	},

	renderChangelog: function(changelog) {
		if (typeof changelog === 'string') {
			return E('p', {}, changelog);
		}

		if (Array.isArray(changelog)) {
			return E('ul', { 'class': 'changelog-list' },
				changelog.map(function(item) {
					return E('li', {}, item);
				})
			);
		}

		// Object with version keys
		var versions = Object.keys(changelog);
		if (versions.length > 0) {
			var latestVersion = versions[0];
			var changes = changelog[latestVersion].changes || [];
			return E('ul', { 'class': 'changelog-list' },
				changes.map(function(item) {
					return E('li', {}, item);
				})
			);
		}

		return E('p', {}, 'No changelog available');
	},

	updateApp: function(appId, appName) {
		ui.showModal(_('Updating Application'), [
			E('p', { 'class': 'spinning' }, _('Updating %s...').format(appName))
		]);

		API.installApp(appId).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null,
					E('p', _('%s updated successfully').format(appName)),
					'success'
				);
				// Refresh the page to show updated status
				setTimeout(function() {
					window.location.reload();
				}, 1000);
			} else {
				ui.addNotification(null,
					E('p', _('Update failed: %s').format(result.error || 'Unknown error')),
					'error'
				);
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null,
				E('p', _('Update error: %s').format(err.message)),
				'error'
			);
		});
	},

	updateAllApps: function(updates) {
		if (updates.length === 0) return;

		ui.showModal(_('Updating Applications'), [
			E('p', { 'class': 'spinning' }, _('Updating %d applications...').format(updates.length)),
			E('p', { 'id': 'update-progress' }, _('Preparing...'))
		]);

		var self = this;
		var currentIndex = 0;

		function updateNext() {
			if (currentIndex >= updates.length) {
				ui.hideModal();
				ui.addNotification(null,
					E('p', _('All applications updated successfully')),
					'success'
				);
				setTimeout(function() {
					window.location.reload();
				}, 1000);
				return;
			}

			var update = updates[currentIndex];
			var progressEl = document.getElementById('update-progress');
			if (progressEl) {
				progressEl.textContent = _('Updating %s (%d/%d)...')
					.format(update.app_id, currentIndex + 1, updates.length);
			}

			API.installApp(update.app_id).then(function(result) {
				currentIndex++;
				updateNext();
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null,
					E('p', _('Failed to update %s: %s').format(update.app_id, err.message)),
					'error'
				);
			});
		}

		updateNext();
	},

	viewFullChangelog: function(appId, fromVersion, toVersion) {
		API.getChangelog(appId, fromVersion, toVersion).then(function(changelog) {
			var content = E('div', { 'class': 'changelog-modal' }, [
				E('h3', {}, _('Changelog for %s').format(appId)),
				E('div', { 'class': 'version-range' },
					_('Changes from %s to %s').format(fromVersion, toVersion)
				),
				E('div', { 'class': 'changelog-full' },
					// Render full changelog
					typeof changelog === 'string' ?
						E('pre', {}, changelog) :
						JSON.stringify(changelog, null, 2)
				)
			]);

			ui.showModal(_('Full Changelog'), [
				content,
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'btn',
						'click': function() {
							ui.hideModal();
						}
					}, _('Close'))
				])
			]);
		}).catch(function(err) {
			ui.addNotification(null,
				E('p', _('Failed to load changelog: %s').format(err.message)),
				'error'
			);
		});
	},

	skipUpdate: function(appId) {
		// TODO: Implement skip version functionality
		// This would mark the version as skipped in metadata
		ui.addNotification(null,
			E('p', _('Skipped update for: %s').format(appId)),
			'info'
		);
	},

	checkForUpdates: function() {
		ui.showModal(_('Checking for Updates'), [
			E('p', { 'class': 'spinning' }, _('Checking for available updates...'))
		]);

		// Sync catalog first, then check for updates
		API.syncCatalog(null).then(function() {
			return API.checkUpdates();
		}).then(function(result) {
			ui.hideModal();
			ui.addNotification(null,
				E('p', _('Update check complete. Found %d updates.')
					.format((result.updates || []).length)),
				'success'
			);
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null,
				E('p', _('Update check failed: %s').format(err.message)),
				'error'
			);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
