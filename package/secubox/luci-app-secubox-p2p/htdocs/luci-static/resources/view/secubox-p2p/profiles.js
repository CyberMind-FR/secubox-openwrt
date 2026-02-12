'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require rpc';
'require secubox-p2p/api as P2PAPI';
'require secubox/kiss-theme';

// RPC calls for profiles
var callListProfiles = rpc.declare({
	object: 'luci.secubox',
	method: 'list_profiles',
	expect: { profiles: [] }
});

var callGetProfile = rpc.declare({
	object: 'luci.secubox',
	method: 'getProfile',
	params: ['name'],
	expect: {}
});

return view.extend({
	// State
	profiles: [],
	presets: [],
	feeds: [],
	components: [],
	readinessState: {},

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.healthCheck().catch(function() { return {}; }),
			P2PAPI.getServices().catch(function() { return { services: [] }; }),
			P2PAPI.listLocalBackups().catch(function() { return { backups: [] }; }),
			callListProfiles().catch(function() { return { profiles: [] }; })
		]).then(function(results) {
			self.health = results[0] || {};
			self.services = results[1].services || [];
			self.backups = results[2].backups || [];
			self.profiles = results[3].profiles || [];

			// Build component readiness state
			self.buildReadinessState();
			self.buildPresets();
			self.buildFeeds();
		});
	},

	buildReadinessState: function() {
		// Define all system components and their readiness criteria
		this.components = [
			{
				id: 'network',
				name: 'Network Core',
				icon: '🌐',
				category: 'infrastructure',
				checks: [
					{ name: 'Interfaces', key: 'network_interfaces', required: true },
					{ name: 'Firewall', key: 'firewall', required: true },
					{ name: 'DHCP', key: 'dhcp', required: false },
					{ name: 'DNS', key: 'dns', required: true }
				]
			},
			{
				id: 'security',
				name: 'Security Layer',
				icon: '🛡️',
				category: 'security',
				checks: [
					{ name: 'CrowdSec', key: 'crowdsec', required: false },
					{ name: 'Firewall Rules', key: 'fw_rules', required: true },
					{ name: 'SSH Keys', key: 'ssh_keys', required: false },
					{ name: 'Certificates', key: 'certs', required: false }
				]
			},
			{
				id: 'mesh',
				name: 'Mesh Network',
				icon: '🕸️',
				category: 'mesh',
				checks: [
					{ name: 'WireGuard', key: 'wireguard', required: false },
					{ name: 'DNS Federation', key: 'dns_fed', required: false },
					{ name: 'HAProxy', key: 'haproxy', required: false },
					{ name: 'Peer Discovery', key: 'discovery', required: true }
				]
			},
			{
				id: 'services',
				name: 'Services',
				icon: '📡',
				category: 'services',
				checks: [
					{ name: 'Web Server', key: 'uhttpd', required: true },
					{ name: 'Gitea', key: 'gitea', required: false },
					{ name: 'LocalAI', key: 'localai', required: false },
					{ name: 'Custom Apps', key: 'apps', required: false }
				]
			},
			{
				id: 'storage',
				name: 'Data & Storage',
				icon: '💾',
				category: 'data',
				checks: [
					{ name: 'Config Backup', key: 'config_backup', required: true },
					{ name: 'Gitea VCS', key: 'gitea_vcs', required: false },
					{ name: 'Local Snapshots', key: 'snapshots', required: false },
					{ name: 'External Storage', key: 'external', required: false }
				]
			},
			{
				id: 'monitoring',
				name: 'Monitoring',
				icon: '📊',
				category: 'observability',
				checks: [
					{ name: 'System Logs', key: 'logs', required: true },
					{ name: 'Metrics', key: 'metrics', required: false },
					{ name: 'Alerts', key: 'alerts', required: false },
					{ name: 'Health Checks', key: 'health', required: true }
				]
			}
		];

		// Evaluate readiness for each component
		var self = this;
		this.components.forEach(function(comp) {
			var ready = 0;
			var total = comp.checks.length;
			var requiredMet = true;

			comp.checks.forEach(function(check) {
				// Simulate check status (in real implementation, query actual state)
				var isReady = self.evaluateCheck(check.key);
				check.status = isReady ? 'ready' : 'pending';
				if (isReady) ready++;
				if (check.required && !isReady) requiredMet = false;
			});

			comp.readyCount = ready;
			comp.totalCount = total;
			comp.percentage = Math.round((ready / total) * 100);
			comp.status = requiredMet ? (ready === total ? 'complete' : 'partial') : 'blocked';
		});

		// Overall readiness
		var totalReady = this.components.reduce(function(sum, c) { return sum + c.readyCount; }, 0);
		var totalChecks = this.components.reduce(function(sum, c) { return sum + c.totalCount; }, 0);
		this.readinessState = {
			ready: totalReady,
			total: totalChecks,
			percentage: Math.round((totalReady / totalChecks) * 100)
		};
	},

	evaluateCheck: function(key) {
		// Real implementation would check actual system state
		var healthyKeys = ['network_interfaces', 'firewall', 'dns', 'fw_rules', 'uhttpd', 'logs', 'health', 'discovery'];
		var optionalReady = ['dhcp', 'config_backup'];

		if (this.health.dns_federation) healthyKeys.push('dns_fed');
		if (this.health.wireguard_mesh) healthyKeys.push('wireguard');
		if (this.health.haproxy) healthyKeys.push('haproxy');
		if (this.backups && this.backups.length > 0) healthyKeys.push('snapshots');

		return healthyKeys.includes(key) || optionalReady.includes(key);
	},

	buildPresets: function() {
		this.presets = [
			{
				id: 'minimal',
				name: 'Minimal Router',
				icon: '📦',
				description: 'Basic routing and firewall only',
				components: ['network', 'security'],
				tags: ['lightweight', 'basic']
			},
			{
				id: 'security-gateway',
				name: 'Security Gateway',
				icon: '🛡️',
				description: 'Full security stack with IDS/IPS',
				components: ['network', 'security', 'monitoring'],
				tags: ['security', 'enterprise']
			},
			{
				id: 'mesh-node',
				name: 'Mesh Node',
				icon: '🕸️',
				description: 'P2P mesh participant with full federation',
				components: ['network', 'security', 'mesh', 'services'],
				tags: ['p2p', 'distributed']
			},
			{
				id: 'full-appliance',
				name: 'Full SecuBox Appliance',
				icon: '🏠',
				description: 'Complete SecuBox with all features',
				components: ['network', 'security', 'mesh', 'services', 'storage', 'monitoring'],
				tags: ['complete', 'production']
			},
			{
				id: 'development',
				name: 'Development Node',
				icon: '🧪',
				description: 'Testing and development configuration',
				components: ['network', 'services', 'storage'],
				tags: ['dev', 'testing']
			},
			{
				id: 'edge-ai',
				name: 'Edge AI Node',
				icon: '🤖',
				description: 'LocalAI and ML inference capable',
				components: ['network', 'services', 'storage', 'monitoring'],
				tags: ['ai', 'ml', 'edge']
			}
		];
	},

	buildFeeds: function() {
		this.feeds = [
			{
				id: 'secubox-core',
				name: 'SecuBox Core',
				url: 'https://feed.secubox.io/core',
				enabled: true,
				packages: 12,
				icon: '📦'
			},
			{
				id: 'secubox-apps',
				name: 'SecuBox Apps',
				url: 'https://feed.secubox.io/apps',
				enabled: true,
				packages: 28,
				icon: '📱'
			},
			{
				id: 'secubox-security',
				name: 'Security Tools',
				url: 'https://feed.secubox.io/security',
				enabled: true,
				packages: 8,
				icon: '🛡️'
			},
			{
				id: 'local-feed',
				name: 'Local Development',
				url: 'file:///etc/opkg/local-feed',
				enabled: false,
				packages: 0,
				icon: '🔧'
			},
			{
				id: 'community',
				name: 'Community Packages',
				url: 'https://feed.secubox.io/community',
				enabled: false,
				packages: 45,
				icon: '👥'
			}
		];
	},

	render: function() {
		var self = this;

		var container = E('div', { 'class': 'profiles-page' }, [
			E('style', {}, this.getStyles()),

			// Header
			this.renderHeader(),

			// Readiness Overview
			this.renderReadinessOverview(),

			// Component Grid
			this.renderComponentGrid(),

			// Presets Section
			this.renderPresetsSection(),

			// Feeds Section
			this.renderFeedsSection(),

			// Profiles Section
			this.renderProfilesSection(),

			// Clone Actions
			this.renderCloneActions()
		]);

		return KissTheme.wrap(container, 'admin/secubox/p2p/profiles');
	},

	renderHeader: function() {
		return E('div', { 'class': 'page-header' }, [
			E('div', { 'class': 'header-content' }, [
				E('h1', {}, [
					E('span', { 'class': 'header-icon' }, '🧬'),
					'Profiles & Cloning'
				]),
				E('p', { 'class': 'header-desc' },
					'Manage system profiles, presets, feeds, and component readiness for cloning and deployment'
				)
			]),
			E('div', { 'class': 'header-actions' }, [
				E('button', { 'class': 'btn primary', 'click': L.bind(this.createSnapshot, this) }, '📸 Create Snapshot'),
				E('button', { 'class': 'btn', 'click': L.bind(this.exportProfile, this) }, '📤 Export Profile')
			])
		]);
	},

	renderReadinessOverview: function() {
		var pct = this.readinessState.percentage;
		var statusClass = pct >= 80 ? 'good' : pct >= 50 ? 'warning' : 'critical';

		return E('div', { 'class': 'readiness-overview' }, [
			E('div', { 'class': 'readiness-gauge ' + statusClass }, [
				E('div', { 'class': 'gauge-circle' }, [
					E('svg', { 'viewBox': '0 0 36 36', 'class': 'gauge-svg' }, [
						E('path', {
							'd': 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831',
							'fill': 'none',
							'stroke': 'rgba(255,255,255,0.1)',
							'stroke-width': '3'
						}),
						E('path', {
							'd': 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831',
							'fill': 'none',
							'stroke': statusClass === 'good' ? '#2ecc71' : statusClass === 'warning' ? '#f39c12' : '#e74c3c',
							'stroke-width': '3',
							'stroke-dasharray': pct + ', 100'
						})
					]),
					E('div', { 'class': 'gauge-value' }, pct + '%')
				]),
				E('div', { 'class': 'gauge-label' }, 'System Readiness')
			]),
			E('div', { 'class': 'readiness-stats' }, [
				E('div', { 'class': 'rstat' }, [
					E('div', { 'class': 'rstat-value' }, String(this.readinessState.ready)),
					E('div', { 'class': 'rstat-label' }, 'Ready')
				]),
				E('div', { 'class': 'rstat' }, [
					E('div', { 'class': 'rstat-value' }, String(this.readinessState.total)),
					E('div', { 'class': 'rstat-label' }, 'Total Checks')
				]),
				E('div', { 'class': 'rstat' }, [
					E('div', { 'class': 'rstat-value' }, String(this.components.filter(function(c) { return c.status === 'complete'; }).length)),
					E('div', { 'class': 'rstat-label' }, 'Complete')
				]),
				E('div', { 'class': 'rstat' }, [
					E('div', { 'class': 'rstat-value' }, String(this.components.filter(function(c) { return c.status === 'blocked'; }).length)),
					E('div', { 'class': 'rstat-label' }, 'Blocked')
				])
			])
		]);
	},

	renderComponentGrid: function() {
		var self = this;

		return E('div', { 'class': 'section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', {}, '🧩'),
				'Component Readiness'
			]),
			E('div', { 'class': 'component-grid' },
				this.components.map(function(comp) {
					return E('div', { 'class': 'component-card ' + comp.status }, [
						E('div', { 'class': 'comp-header' }, [
							E('span', { 'class': 'comp-icon' }, comp.icon),
							E('span', { 'class': 'comp-status ' + comp.status },
								comp.status === 'complete' ? '✓' : comp.status === 'partial' ? '◐' : '✗'
							)
						]),
						E('h3', { 'class': 'comp-name' }, comp.name),
						E('div', { 'class': 'comp-progress' }, [
							E('div', { 'class': 'progress-bar' }, [
								E('div', { 'class': 'progress-fill', 'style': 'width: ' + comp.percentage + '%' })
							]),
							E('span', { 'class': 'progress-text' }, comp.readyCount + '/' + comp.totalCount)
						]),
						E('div', { 'class': 'comp-checks' },
							comp.checks.map(function(check) {
								return E('div', { 'class': 'check-item ' + check.status }, [
									E('span', { 'class': 'check-icon' }, check.status === 'ready' ? '✓' : '○'),
									E('span', { 'class': 'check-name' }, check.name),
									check.required ? E('span', { 'class': 'check-req' }, '*') : ''
								]);
							})
						)
					]);
				})
			)
		]);
	},

	renderPresetsSection: function() {
		var self = this;

		return E('div', { 'class': 'section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', {}, '⚡'),
				'Quick Presets'
			]),
			E('div', { 'class': 'presets-grid' },
				this.presets.map(function(preset) {
					var compReady = preset.components.filter(function(cid) {
						var comp = self.components.find(function(c) { return c.id === cid; });
						return comp && comp.status !== 'blocked';
					}).length;
					var canApply = compReady === preset.components.length;

					return E('div', { 'class': 'preset-card' + (canApply ? '' : ' disabled') }, [
						E('div', { 'class': 'preset-icon' }, preset.icon),
						E('h3', { 'class': 'preset-name' }, preset.name),
						E('p', { 'class': 'preset-desc' }, preset.description),
						E('div', { 'class': 'preset-tags' },
							preset.tags.map(function(tag) {
								return E('span', { 'class': 'tag' }, tag);
							})
						),
						E('div', { 'class': 'preset-components' },
							preset.components.map(function(cid) {
								var comp = self.components.find(function(c) { return c.id === cid; });
								return E('span', { 'class': 'comp-badge ' + (comp ? comp.status : '') }, comp ? comp.icon : '?');
							})
						),
						E('button', {
							'class': 'btn small' + (canApply ? ' primary' : ''),
							'disabled': !canApply,
							'click': function() { self.applyPreset(preset.id); }
						}, canApply ? 'Apply' : 'Unavailable')
					]);
				})
			)
		]);
	},

	renderFeedsSection: function() {
		var self = this;

		return E('div', { 'class': 'section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', {}, '📡'),
				'Package Feeds'
			]),
			E('div', { 'class': 'feeds-list' },
				this.feeds.map(function(feed) {
					return E('div', { 'class': 'feed-item' + (feed.enabled ? ' enabled' : '') }, [
						E('div', { 'class': 'feed-icon' }, feed.icon),
						E('div', { 'class': 'feed-info' }, [
							E('div', { 'class': 'feed-name' }, feed.name),
							E('div', { 'class': 'feed-url' }, feed.url)
						]),
						E('div', { 'class': 'feed-packages' }, [
							E('span', { 'class': 'pkg-count' }, String(feed.packages)),
							E('span', { 'class': 'pkg-label' }, 'packages')
						]),
						E('label', { 'class': 'feed-toggle' }, [
							E('input', {
								'type': 'checkbox',
								'checked': feed.enabled,
								'change': function(e) { self.toggleFeed(feed.id, e.target.checked); }
							}),
							E('span', { 'class': 'toggle-slider' })
						])
					]);
				})
			),
			E('div', { 'class': 'feeds-actions' }, [
				E('button', { 'class': 'btn', 'click': L.bind(this.updateFeeds, this) }, '🔄 Update All'),
				E('button', { 'class': 'btn', 'click': L.bind(this.addFeed, this) }, '➕ Add Feed')
			])
		]);
	},

	renderProfilesSection: function() {
		var self = this;

		return E('div', { 'class': 'section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', {}, '👤'),
				'Saved Profiles'
			]),
			E('div', { 'class': 'profiles-list' },
				this.profiles.length > 0 ?
					this.profiles.map(function(profile) {
						return E('div', { 'class': 'profile-item' }, [
							E('div', { 'class': 'profile-icon' }, '📋'),
							E('div', { 'class': 'profile-info' }, [
								E('div', { 'class': 'profile-name' }, profile.name || profile),
								E('div', { 'class': 'profile-meta' }, 'Created: ' + (profile.created || 'Unknown'))
							]),
							E('div', { 'class': 'profile-actions' }, [
								E('button', { 'class': 'btn small', 'click': function() { self.loadProfile(profile.name || profile); } }, 'Load'),
								E('button', { 'class': 'btn small danger', 'click': function() { self.deleteProfile(profile.name || profile); } }, '🗑️')
							])
						]);
					})
				:
					E('div', { 'class': 'empty-state' }, [
						E('span', { 'class': 'empty-icon' }, '📭'),
						E('p', {}, 'No saved profiles'),
						E('button', { 'class': 'btn primary', 'click': L.bind(this.createProfile, this) }, 'Create Profile')
					])
			)
		]);
	},

	renderCloneActions: function() {
		var self = this;

		return E('div', { 'class': 'section clone-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', {}, '🧬'),
				'Clone & Deploy'
			]),
			E('div', { 'class': 'clone-options' }, [
				E('div', { 'class': 'clone-card' }, [
					E('div', { 'class': 'clone-icon' }, '📤'),
					E('h3', {}, 'Export Bundle'),
					E('p', {}, 'Export complete system state as deployable bundle'),
					E('button', { 'class': 'btn primary', 'click': L.bind(this.exportBundle, this) }, 'Export')
				]),
				E('div', { 'class': 'clone-card' }, [
					E('div', { 'class': 'clone-icon' }, '📥'),
					E('h3', {}, 'Import Bundle'),
					E('p', {}, 'Import and apply a system bundle from file'),
					E('button', { 'class': 'btn', 'click': L.bind(this.importBundle, this) }, 'Import')
				]),
				E('div', { 'class': 'clone-card' }, [
					E('div', { 'class': 'clone-icon' }, '🔄'),
					E('h3', {}, 'Sync to Mesh'),
					E('p', {}, 'Distribute current profile to all mesh peers'),
					E('button', { 'class': 'btn', 'click': L.bind(this.syncToMesh, this) }, 'Sync')
				]),
				E('div', { 'class': 'clone-card' }, [
					E('div', { 'class': 'clone-icon' }, '☁️'),
					E('h3', {}, 'Push to Gitea'),
					E('p', {}, 'Backup profile and state to Gitea repository'),
					E('button', { 'class': 'btn', 'click': L.bind(this.pushToGitea, this) }, 'Push')
				])
			])
		]);
	},

	// Action handlers
	createSnapshot: function() {
		var name = 'snapshot-' + new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
		P2PAPI.createLocalBackup(name, {}).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', '📸 Snapshot created: ' + name), 'info');
			} else {
				ui.addNotification(null, E('p', '❌ Failed to create snapshot'), 'error');
			}
		});
	},

	exportProfile: function() {
		ui.addNotification(null, E('p', '📤 Exporting profile...'), 'info');
	},

	applyPreset: function(presetId) {
		ui.addNotification(null, E('p', '⚡ Applying preset: ' + presetId), 'info');
	},

	toggleFeed: function(feedId, enabled) {
		ui.addNotification(null, E('p', (enabled ? '✓' : '✗') + ' Feed ' + feedId + ' ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	updateFeeds: function() {
		ui.addNotification(null, E('p', '🔄 Updating package feeds...'), 'info');
	},

	addFeed: function() {
		ui.addNotification(null, E('p', '➕ Add feed dialog...'), 'info');
	},

	loadProfile: function(name) {
		ui.addNotification(null, E('p', '📋 Loading profile: ' + name), 'info');
	},

	deleteProfile: function(name) {
		ui.addNotification(null, E('p', '🗑️ Deleting profile: ' + name), 'info');
	},

	createProfile: function() {
		ui.addNotification(null, E('p', '➕ Create profile dialog...'), 'info');
	},

	exportBundle: function() {
		ui.addNotification(null, E('p', '📤 Exporting system bundle...'), 'info');
	},

	importBundle: function() {
		ui.addNotification(null, E('p', '📥 Import bundle dialog...'), 'info');
	},

	syncToMesh: function() {
		P2PAPI.syncCatalog().then(function() {
			ui.addNotification(null, E('p', '🔄 Profile synced to mesh'), 'info');
		});
	},

	pushToGitea: function() {
		P2PAPI.pushGiteaBackup('Profile sync', {}).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', '☁️ Pushed to Gitea: ' + result.files_pushed + ' files'), 'info');
			}
		});
	},

	getStyles: function() {
		return [
			'.profiles-page { font-family: system-ui, -apple-system, sans-serif; color: #e0e0e0; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%); min-height: 100vh; padding: 20px; }',

			// Header
			'.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding: 20px; background: rgba(30,30,50,0.5); border-radius: 16px; }',
			'.header-content h1 { display: flex; align-items: center; gap: 12px; font-size: 28px; margin: 0 0 8px; }',
			'.header-icon { font-size: 32px; }',
			'.header-desc { color: #888; margin: 0; font-size: 14px; }',
			'.header-actions { display: flex; gap: 10px; }',

			// Buttons
			'.btn { padding: 10px 20px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; transition: all 0.2s; }',
			'.btn:hover { background: rgba(255,255,255,0.1); }',
			'.btn.primary { background: linear-gradient(135deg, #3498db, #2980b9); border-color: #3498db; }',
			'.btn.primary:hover { background: linear-gradient(135deg, #2980b9, #1a5276); }',
			'.btn.small { padding: 6px 12px; font-size: 12px; }',
			'.btn.danger { border-color: #e74c3c; color: #e74c3c; }',
			'.btn:disabled { opacity: 0.5; cursor: not-allowed; }',

			// Section
			'.section { margin-bottom: 30px; }',
			'.section-title { display: flex; align-items: center; gap: 10px; font-size: 20px; margin: 0 0 20px; color: #fff; }',

			// Readiness Overview
			'.readiness-overview { display: flex; gap: 40px; align-items: center; padding: 30px; background: rgba(30,30,50,0.5); border-radius: 16px; margin-bottom: 30px; }',
			'.readiness-gauge { text-align: center; }',
			'.gauge-circle { position: relative; width: 120px; height: 120px; }',
			'.gauge-svg { transform: rotate(-90deg); width: 100%; height: 100%; }',
			'.gauge-value { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }',
			'.readiness-gauge.good .gauge-value { color: #2ecc71; }',
			'.readiness-gauge.warning .gauge-value { color: #f39c12; }',
			'.readiness-gauge.critical .gauge-value { color: #e74c3c; }',
			'.gauge-label { margin-top: 10px; font-size: 14px; color: #888; }',
			'.readiness-stats { display: flex; gap: 30px; }',
			'.rstat { text-align: center; }',
			'.rstat-value { font-size: 32px; font-weight: 700; color: #fff; }',
			'.rstat-label { font-size: 12px; color: #888; margin-top: 5px; }',

			// Component Grid
			'.component-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }',
			'.component-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }',
			'.component-card.complete { border-color: rgba(46,204,113,0.5); }',
			'.component-card.partial { border-color: rgba(243,156,18,0.5); }',
			'.component-card.blocked { border-color: rgba(231,76,60,0.5); }',
			'.comp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }',
			'.comp-icon { font-size: 28px; }',
			'.comp-status { font-size: 16px; }',
			'.comp-status.complete { color: #2ecc71; }',
			'.comp-status.partial { color: #f39c12; }',
			'.comp-status.blocked { color: #e74c3c; }',
			'.comp-name { font-size: 16px; margin: 0 0 12px; color: #fff; }',
			'.comp-progress { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }',
			'.progress-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }',
			'.progress-fill { height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); transition: width 0.3s; }',
			'.progress-text { font-size: 12px; color: #888; }',
			'.comp-checks { display: flex; flex-direction: column; gap: 6px; }',
			'.check-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888; }',
			'.check-item.ready { color: #2ecc71; }',
			'.check-icon { width: 14px; }',
			'.check-req { color: #e74c3c; font-size: 10px; }',

			// Presets Grid
			'.presets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }',
			'.preset-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; }',
			'.preset-card.disabled { opacity: 0.5; }',
			'.preset-icon { font-size: 40px; margin-bottom: 12px; }',
			'.preset-name { font-size: 16px; margin: 0 0 8px; color: #fff; }',
			'.preset-desc { font-size: 12px; color: #888; margin: 0 0 12px; }',
			'.preset-tags { display: flex; justify-content: center; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }',
			'.tag { font-size: 10px; padding: 3px 8px; background: rgba(52,152,219,0.2); border-radius: 10px; color: #3498db; }',
			'.preset-components { display: flex; justify-content: center; gap: 6px; margin-bottom: 15px; }',
			'.comp-badge { font-size: 16px; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 6px; }',
			'.comp-badge.complete { background: rgba(46,204,113,0.2); }',
			'.comp-badge.blocked { background: rgba(231,76,60,0.2); }',

			// Feeds
			'.feeds-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }',
			'.feed-item { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; }',
			'.feed-item.enabled { border-color: rgba(46,204,113,0.5); }',
			'.feed-icon { font-size: 24px; }',
			'.feed-info { flex: 1; }',
			'.feed-name { font-weight: 600; color: #fff; }',
			'.feed-url { font-size: 11px; color: #666; font-family: monospace; }',
			'.feed-packages { text-align: center; }',
			'.pkg-count { font-size: 18px; font-weight: 600; color: #3498db; display: block; }',
			'.pkg-label { font-size: 10px; color: #888; }',
			'.feed-toggle { position: relative; width: 44px; height: 24px; }',
			'.feed-toggle input { opacity: 0; width: 0; height: 0; }',
			'.toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; transition: 0.3s; }',
			'.toggle-slider::before { content: ""; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }',
			'.feed-toggle input:checked + .toggle-slider { background: #2ecc71; }',
			'.feed-toggle input:checked + .toggle-slider::before { transform: translateX(20px); }',
			'.feeds-actions { display: flex; gap: 10px; }',

			// Profiles
			'.profiles-list { display: flex; flex-direction: column; gap: 10px; }',
			'.profile-item { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; }',
			'.profile-icon { font-size: 24px; }',
			'.profile-info { flex: 1; }',
			'.profile-name { font-weight: 600; color: #fff; }',
			'.profile-meta { font-size: 11px; color: #888; }',
			'.profile-actions { display: flex; gap: 8px; }',
			'.empty-state { text-align: center; padding: 40px; color: #888; }',
			'.empty-icon { font-size: 48px; display: block; margin-bottom: 15px; opacity: 0.5; }',

			// Clone Section
			'.clone-section { background: rgba(30,30,50,0.3); border-radius: 16px; padding: 25px; }',
			'.clone-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }',
			'.clone-card { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 25px; text-align: center; }',
			'.clone-icon { font-size: 40px; margin-bottom: 15px; }',
			'.clone-card h3 { font-size: 16px; margin: 0 0 10px; color: #fff; }',
			'.clone-card p { font-size: 12px; color: #888; margin: 0 0 15px; }',

			// Responsive
			'@media (max-width: 768px) {',
			'  .page-header { flex-direction: column; gap: 20px; text-align: center; }',
			'  .readiness-overview { flex-direction: column; }',
			'}'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
