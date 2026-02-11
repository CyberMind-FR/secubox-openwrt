'use strict';
'require view';
'require ui';
'require dom';
'require rpc';
'require poll';
'require secubox-p2p/api as P2PAPI';

return view.extend({
	// State
	sources: [],
	allPackages: [],
	feedSettings: {},
	syncStats: {},
	loading: true,

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.getAllPackages(),
			P2PAPI.getFeedSettings()
		]).then(function(results) {
			var catalog = results[0] || {};
			self.sources = catalog.sources || [];
			self.syncStats = catalog.sync_stats || {};
			self.feedSettings = results[1] || {};
			self.loading = false;

			// Build unified package list with source attribution
			self.allPackages = [];
			self.sources.forEach(function(source) {
				var packages = source.packages || [];
				packages.forEach(function(pkg) {
					// Check if package already exists from another source
					var existing = self.allPackages.find(function(p) {
						return p.name === pkg.name;
					});

					if (existing) {
						existing.sources.push({
							type: source.type,
							address: source.address || 'local',
							node_name: source.node_name,
							version: pkg.version
						});
					} else {
						self.allPackages.push({
							name: pkg.name,
							version: pkg.version,
							size: pkg.size || 0,
							description: pkg.description || '',
							depends: pkg.depends || '',
							sources: [{
								type: source.type,
								address: source.address || 'local',
								node_name: source.node_name,
								version: pkg.version
							}]
						});
					}
				});
			});

			// Sort by name
			self.allPackages.sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});
		});
	},

	formatSize: function(bytes) {
		if (!bytes || bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / 1048576).toFixed(1) + ' MB';
	},

	renderSourceBadge: function(source) {
		var color = source.type === 'local' ? '#27ae60' : '#3498db';
		var label = source.type === 'local' ? 'LOCAL' : source.node_name || source.address;

		return E('span', {
			'style': 'display:inline-block; padding:2px 6px; margin:2px; border-radius:3px; font-size:11px; ' +
				'background-color:' + color + '; color:white;',
			'title': source.type === 'local' ? 'Available locally' : 'Available on ' + source.address
		}, label);
	},

	renderPackageRow: function(pkg) {
		var self = this;

		// Check if available locally
		var isLocal = pkg.sources.some(function(s) { return s.type === 'local'; });

		return E('tr', { 'class': 'tr' }, [
			E('td', { 'class': 'td', 'style': 'font-weight:500' }, pkg.name),
			E('td', { 'class': 'td' }, pkg.version),
			E('td', { 'class': 'td' }, self.formatSize(pkg.size)),
			E('td', { 'class': 'td' }, pkg.sources.map(function(s) {
				return self.renderSourceBadge(s);
			})),
			E('td', { 'class': 'td' }, [
				isLocal ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'style': 'padding:4px 8px; font-size:12px',
						'click': function() { self.installPackage(pkg.name); }
					}, _('Install')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'padding:4px 8px; font-size:12px',
						'click': function() { self.fetchPackage(pkg.name, pkg.sources[0].address); }
					}, _('Fetch'))
			])
		]);
	},

	installPackage: function(pkgName) {
		ui.showModal(_('Installing Package'), [
			E('p', { 'class': 'spinning' }, _('Installing ') + pkgName + '...')
		]);

		// Use opkg to install
		return L.resolveDefault(rpc.declare({
			object: 'luci',
			method: 'exec',
			params: ['command'],
			expect: { code: 0 }
		})({ command: 'opkg install ' + pkgName }), {}).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', _('Package installed successfully')));
			} else {
				ui.addNotification(null, E('p', _('Installation failed')), 'error');
			}
		});
	},

	fetchPackage: function(pkgName, peerAddr) {
		var self = this;

		ui.showModal(_('Fetching Package'), [
			E('p', { 'class': 'spinning' }, _('Fetching ') + pkgName + ' from peer...')
		]);

		return P2PAPI.fetchPackage(pkgName, peerAddr).then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', _('Package fetched successfully. You can now install it.')));
				self.load().then(function() {
					dom.content(document.getElementById('packages-content'), self.renderPackagesTable());
				});
			} else {
				ui.addNotification(null, E('p', _('Fetch failed: ') + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	syncCatalogs: function() {
		var self = this;

		ui.showModal(_('Syncing Catalogs'), [
			E('p', { 'class': 'spinning' }, _('Syncing package catalogs from all peers...'))
		]);

		return P2PAPI.syncPackageCatalog(true).then(function() {
			return self.load();
		}).then(function() {
			ui.hideModal();
			dom.content(document.getElementById('packages-content'), self.renderPackagesTable());
			ui.addNotification(null, E('p', _('Catalogs synced successfully')));
		});
	},

	renderStats: function() {
		var stats = this.syncStats;
		var localCount = 0;
		var peerCount = 0;

		this.sources.forEach(function(s) {
			if (s.type === 'local') localCount = s.package_count || 0;
			else peerCount += s.package_count || 0;
		});

		return E('div', { 'class': 'cbi-section', 'style': 'margin-bottom:1em' }, [
			E('div', { 'style': 'display:flex; gap:2em; flex-wrap:wrap' }, [
				E('div', { 'style': 'padding:1em; background:#f8f9fa; border-radius:8px; min-width:150px' }, [
					E('div', { 'style': 'font-size:24px; font-weight:bold; color:#27ae60' }, String(localCount)),
					E('div', { 'style': 'color:#666' }, _('Local Packages'))
				]),
				E('div', { 'style': 'padding:1em; background:#f8f9fa; border-radius:8px; min-width:150px' }, [
					E('div', { 'style': 'font-size:24px; font-weight:bold; color:#3498db' }, String(peerCount)),
					E('div', { 'style': 'color:#666' }, _('Peer Packages'))
				]),
				E('div', { 'style': 'padding:1em; background:#f8f9fa; border-radius:8px; min-width:150px' }, [
					E('div', { 'style': 'font-size:24px; font-weight:bold; color:#9b59b6' }, String(this.sources.length)),
					E('div', { 'style': 'color:#666' }, _('Feed Sources'))
				]),
				E('div', { 'style': 'padding:1em; background:#f8f9fa; border-radius:8px; min-width:150px' }, [
					E('div', { 'style': 'font-size:24px; font-weight:bold; color:#e67e22' }, String(this.allPackages.length)),
					E('div', { 'style': 'color:#666' }, _('Unique Packages'))
				])
			])
		]);
	},

	renderSettings: function() {
		var self = this;
		var settings = this.feedSettings;

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Feed Settings')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Share Feed')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'share-feed',
						'checked': settings.share_feed
					}),
					E('span', { 'style': 'margin-left:8px' }, _('Share local packages with mesh peers'))
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Auto Sync')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'auto-sync',
						'checked': settings.auto_sync
					}),
					E('span', { 'style': 'margin-left:8px' }, _('Automatically sync catalogs from peers'))
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', {
					'class': 'cbi-button cbi-button-save',
					'click': function() { self.saveSettings(); }
				}, _('Save Settings'))
			])
		]);
	},

	saveSettings: function() {
		var shareFeed = document.getElementById('share-feed').checked;
		var autoSync = document.getElementById('auto-sync').checked;

		P2PAPI.setFeedSettings(shareFeed, autoSync, 3600, true).then(function(res) {
			if (res && res.success) {
				ui.addNotification(null, E('p', _('Settings saved')));
			}
		});
	},

	renderPackagesTable: function() {
		var self = this;

		if (this.loading) {
			return E('p', { 'class': 'spinning' }, _('Loading packages...'));
		}

		if (this.allPackages.length === 0) {
			return E('p', { 'style': 'color:#666; text-align:center; padding:2em' },
				_('No packages found. Click "Sync Catalogs" to fetch from peers.'));
		}

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Package')),
				E('th', { 'class': 'th' }, _('Version')),
				E('th', { 'class': 'th' }, _('Size')),
				E('th', { 'class': 'th' }, _('Available On')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		].concat(this.allPackages.map(function(pkg) {
			return self.renderPackageRow(pkg);
		})));
	},

	render: function() {
		var self = this;

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('P2P App Store')),
			E('p', { 'style': 'color:#666; margin-bottom:1em' },
				_('Discover and install packages from local feed and mesh peers.')),

			this.renderStats(),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display:flex; justify-content:space-between; align-items:center; margin-bottom:1em' }, [
					E('h3', {}, _('Packages')),
					E('div', {}, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() { self.syncCatalogs(); }
						}, _('Sync Catalogs'))
					])
				]),
				E('div', { 'id': 'packages-content' }, this.renderPackagesTable())
			]),

			this.renderSettings()
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
