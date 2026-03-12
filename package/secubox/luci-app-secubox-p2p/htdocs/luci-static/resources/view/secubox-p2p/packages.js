'use strict';
'require view';
'require ui';
'require dom';
'require rpc';
'require poll';
'require secubox-p2p/api as P2PAPI';
'require secubox/kiss-theme';

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
		var colorType = source.type === 'local' ? 'green' : 'blue';
		var label = source.type === 'local' ? 'LOCAL' : source.node_name || source.address;
		return KissTheme.badge(label, colorType);
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var localCount = 0;
		var peerCount = 0;

		this.sources.forEach(function(s) {
			if (s.type === 'local') localCount = s.package_count || 0;
			else peerCount += s.package_count || 0;
		});

		return [
			KissTheme.stat(localCount, 'Local Packages', c.green),
			KissTheme.stat(peerCount, 'Peer Packages', c.blue),
			KissTheme.stat(this.sources.length, 'Feed Sources', c.purple),
			KissTheme.stat(this.allPackages.length, 'Unique Packages', c.orange)
		];
	},

	renderPackageRow: function(pkg) {
		var self = this;

		// Check if available locally
		var isLocal = pkg.sources.some(function(s) { return s.type === 'local'; });

		return E('tr', {}, [
			E('td', { 'style': 'padding: 10px 12px; font-weight: 500;' }, pkg.name),
			E('td', { 'style': 'padding: 10px 12px; font-family: monospace;' }, pkg.version),
			E('td', { 'style': 'padding: 10px 12px;' }, self.formatSize(pkg.size)),
			E('td', { 'style': 'padding: 10px 12px;' },
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 4px;' },
					pkg.sources.map(function(s) {
						return self.renderSourceBadge(s);
					})
				)
			),
			E('td', { 'style': 'padding: 10px 12px;' }, [
				isLocal ?
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 4px 10px; font-size: 12px;',
						'click': function() { self.installPackage(pkg.name); }
					}, _('Install')) :
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'padding: 4px 10px; font-size: 12px;',
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

	renderSettings: function() {
		var self = this;
		var settings = this.feedSettings;

		return KissTheme.card('Feed Settings',
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'share-feed',
						'checked': settings.share_feed
					}),
					E('span', { 'style': 'color: var(--kiss-muted);' }, _('Share local packages with mesh peers'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'auto-sync',
						'checked': settings.auto_sync
					}),
					E('span', { 'style': 'color: var(--kiss-muted);' }, _('Automatically sync catalogs from peers'))
				]),
				E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 8px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() { self.saveSettings(); }
					}, _('Save Settings'))
				])
			])
		);
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
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 32px;' },
				_('No packages found. Click "Sync Catalogs" to fetch from peers.'));
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, _('Package')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Version')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Size')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Available On')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Actions'))
			])),
			E('tbody', {}, this.allPackages.map(function(pkg) {
				return self.renderPackageRow(pkg);
			}))
		]);
	},

	render: function() {
		var self = this;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'P2P App Store'),
					KissTheme.badge('Packages', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Discover and install packages from local feed and mesh peers')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Packages Card
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Packages'),
					E('button', {
						'class': 'kiss-btn kiss-btn-cyan',
						'click': function() { self.syncCatalogs(); }
					}, _('Sync Catalogs'))
				]),
				E('div', { 'id': 'packages-content' }, this.renderPackagesTable())
			),

			// Settings
			this.renderSettings()
		];

		return KissTheme.wrap(content, 'admin/secubox/p2p/packages');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
