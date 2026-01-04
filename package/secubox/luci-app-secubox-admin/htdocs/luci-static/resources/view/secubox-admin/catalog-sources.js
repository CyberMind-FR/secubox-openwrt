'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require ui';
'require poll';

return view.extend({
	load: function() {
		return Promise.all([
			API.getCatalogSources(),
			L.resolveDefault(API.checkUpdates(), {})
		]);
	},

	render: function(data) {
		var sources = data[0].sources || [];
		var updateInfo = data[1];
		var self = this;

		var container = E('div', { 'class': 'secubox-catalog-sources' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('h2', {}, 'Catalog Sources'),
			E('p', {}, 'Manage catalog sources with automatic fallback'),

			// Summary stats
			E('div', { 'class': 'source-summary' }, [
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-label' }, 'Total Sources'),
					E('div', { 'class': 'stat-value' }, sources.length.toString())
				]),
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-label' }, 'Active Source'),
					E('div', { 'class': 'stat-value' },
						sources.filter(function(s) { return s.active; })[0]?.name || 'None')
				]),
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-label' }, 'Updates Available'),
					E('div', { 'class': 'stat-value' },
						(updateInfo.total_updates_available || 0).toString())
				])
			]),

			// Sync controls
			E('div', { 'class': 'sync-controls' }, [
				E('button', {
					'class': 'btn btn-primary',
					'click': function() {
						self.syncAllSources();
					}
				}, 'Sync All Sources'),
				E('button', {
					'class': 'btn btn-secondary',
					'click': function() {
						self.refreshPage();
					}
				}, 'Refresh Status')
			]),

			// Sources list
			E('div', { 'class': 'sources-container', 'id': 'sources-container' },
				sources
					.sort(function(a, b) { return a.priority - b.priority; })
					.map(function(source) {
						return self.renderSourceCard(source);
					})
			)
		]);

		// Auto-refresh every 30 seconds
		poll.add(function() {
			return API.getCatalogSources().then(function(result) {
				var sourcesContainer = document.getElementById('sources-container');
				if (sourcesContainer) {
					var sources = result.sources || [];
					sourcesContainer.innerHTML = '';
					sources
						.sort(function(a, b) { return a.priority - b.priority; })
						.forEach(function(source) {
							sourcesContainer.appendChild(self.renderSourceCard(source));
						});
				}
			});
		}, 30);

		return container;
	},

	renderSourceCard: function(source) {
		var self = this;
		var statusClass = this.getStatusClass(source.status);
		var statusIcon = this.getStatusIcon(source.status);

		return E('div', {
			'class': 'source-card' + (source.active ? ' active-source' : ''),
			'data-source': source.name
		}, [
			// Source header
			E('div', { 'class': 'source-header' }, [
				E('div', { 'class': 'source-title' }, [
					E('h3', {}, source.name),
					source.active ? E('span', { 'class': 'badge badge-success' }, 'ACTIVE') : null
				]),
				E('div', { 'class': 'source-priority' },
					E('span', { 'class': 'priority-badge' }, 'Priority: ' + source.priority)
				)
			]),

			// Source info
			E('div', { 'class': 'source-info' }, [
				E('div', { 'class': 'info-row' }, [
					E('span', { 'class': 'label' }, 'Type:'),
					E('span', { 'class': 'value' }, source.type)
				]),
				source.url ? E('div', { 'class': 'info-row' }, [
					E('span', { 'class': 'label' }, 'URL:'),
					E('span', { 'class': 'value url-text' }, source.url)
				]) : null,
				source.path ? E('div', { 'class': 'info-row' }, [
					E('span', { 'class': 'label' }, 'Path:'),
					E('span', { 'class': 'value' }, source.path)
				]) : null,
				E('div', { 'class': 'info-row' }, [
					E('span', { 'class': 'label' }, 'Status:'),
					E('span', { 'class': 'value' }, [
						E('span', { 'class': 'status-indicator ' + statusClass }, statusIcon),
						E('span', {}, source.status || 'unknown')
					])
				]),
				source.last_success ? E('div', { 'class': 'info-row' }, [
					E('span', { 'class': 'label' }, 'Last Success:'),
					E('span', { 'class': 'value' }, this.formatTimestamp(source.last_success))
				]) : null
			]),

			// Source actions
			E('div', { 'class': 'source-actions' }, [
				E('button', {
					'class': 'btn btn-sm btn-primary',
					'click': function() {
						self.syncSource(source.name);
					},
					'disabled': !source.enabled
				}, 'Sync'),
				E('button', {
					'class': 'btn btn-sm btn-secondary',
					'click': function() {
						self.testSource(source.name);
					},
					'disabled': !source.enabled
				}, 'Test'),
				!source.active ? E('button', {
					'class': 'btn btn-sm btn-warning',
					'click': function() {
						self.setActiveSource(source.name);
					}
				}, 'Set Active') : null,
				E('button', {
					'class': 'btn btn-sm ' + (source.enabled ? 'btn-danger' : 'btn-success'),
					'click': function() {
						self.toggleSource(source.name, !source.enabled);
					}
				}, source.enabled ? 'Disable' : 'Enable')
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

	getStatusIcon: function(status) {
		switch(status) {
			case 'online':
			case 'success':
			case 'available':
				return '✓';
			case 'offline':
			case 'error':
				return '✗';
			default:
				return '?';
		}
	},

	formatTimestamp: function(timestamp) {
		if (!timestamp) return 'Never';
		var date = new Date(timestamp);
		var now = new Date();
		var diffMs = now - date;
		var diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return diffMins + ' minutes ago';

		var diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return diffHours + ' hours ago';

		var diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return diffDays + ' days ago';

		return date.toLocaleDateString();
	},

	syncSource: function(sourceName) {
		ui.showModal(_('Syncing Catalog'), [
			E('p', { 'class': 'spinning' }, _('Syncing from source: %s...').format(sourceName))
		]);

		API.syncCatalog(sourceName).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Catalog synced successfully from: %s').format(sourceName)), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Sync failed: %s').format(result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Sync error: %s').format(err.message)), 'error');
		});
	},

	syncAllSources: function() {
		ui.showModal(_('Syncing Catalogs'), [
			E('p', { 'class': 'spinning' }, _('Syncing from all enabled sources...'))
		]);

		API.syncCatalog(null).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Catalogs synced successfully')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Sync failed: %s').format(result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Sync error: %s').format(err.message)), 'error');
		});
	},

	testSource: function(sourceName) {
		ui.addNotification(null, E('p', _('Testing source: %s...').format(sourceName)), 'info');
		// Test is done by attempting a sync
		this.syncSource(sourceName);
	},

	setActiveSource: function(sourceName) {
		ui.showModal(_('Setting Active Source'), [
			E('p', { 'class': 'spinning' }, _('Setting active source to: %s...').format(sourceName))
		]);

		API.setCatalogSource(sourceName).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Active source set to: %s').format(sourceName)), 'success');
				// Trigger sync from new source
				return API.syncCatalog(sourceName);
			} else {
				throw new Error(result.error || 'Failed to set source');
			}
		}).then(function() {
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
		});
	},

	toggleSource: function(sourceName, enable) {
		ui.addNotification(null,
			E('p', _('%s source: %s').format(enable ? 'Enabling' : 'Disabling', sourceName)),
			'info'
		);
		// TODO: Implement UCI config update to enable/disable source
	},

	refreshPage: function() {
		window.location.reload();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
