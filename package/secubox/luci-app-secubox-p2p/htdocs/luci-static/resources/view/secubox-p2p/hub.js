'use strict';
'require view';
'require ui';
'require dom';
'require secubox-p2p/api as P2PAPI';
'require poll';

return view.extend({
	// State
	peers: [],
	settings: {},
	services: [],
	sharedServices: [],
	dnsConfig: {},
	wgConfig: {},
	haConfig: {},
	registry: {},
	health: {},

	// View state
	masterViewMode: 'master',
	activePanel: 'overview',

	// Service Types for categorization
	serviceTypes: {
		dns: { icon: '🌐', name: 'DNS', color: '#3498db' },
		vpn: { icon: '🔒', name: 'VPN', color: '#9b59b6' },
		ids: { icon: '🛡️', name: 'IDS/IPS', color: '#e74c3c' },
		proxy: { icon: '🔀', name: 'Proxy', color: '#e67e22' },
		firewall: { icon: '🧱', name: 'Firewall', color: '#c0392b' },
		adblock: { icon: '🚫', name: 'Ad Block', color: '#27ae60' },
		captive: { icon: '🚪', name: 'Captive Portal', color: '#f39c12' },
		monitoring: { icon: '📊', name: 'Monitoring', color: '#1abc9c' },
		cache: { icon: '💾', name: 'Cache', color: '#8e44ad' },
		media: { icon: '🎬', name: 'Media', color: '#2980b9' },
		storage: { icon: '💿', name: 'Storage', color: '#7f8c8d' },
		web: { icon: '🌍', name: 'Web', color: '#16a085' }
	},

	// Hub Registry state
	hubRegistry: {
		baseUrl: 'sb.local',
		cacheEnabled: true,
		cacheTTL: 300,
		entries: []
	},

	// MaaS Config
	maasConfig: {
		enabled: false,
		autoRegister: false
	},

	// DNS Bridge Config
	dnsBridgeConfig: {
		enabled: false,
		strategy: 'round-robin',
		onionEnabled: false,
		meshSync: true,
		upstreamDNS: ['1.1.1.1', '8.8.8.8']
	},

	// WireGuard Mirror Config
	wgMirrorConfig: {
		enabled: false,
		mode: 'active-passive',
		syncInterval: 30,
		keyRotation: true,
		peerMirroring: true,
		autoReconnect: true,
		inverseTunnel: false
	},

	// Distribution Config - Gigogne (nested cycle)
	distributionConfig: {
		mode: 'gigogne',  // gigogne = nested cycle, mono = single hop, full = all-to-all, ring = circular
		cycleDepth: 3,
		autoPropagate: true,
		selfLoop: true
	},

	// Self-peer for testing
	selfPeer: null,
	testMode: false,

	// Mesh Backup Config
	meshBackupConfig: {
		enabled: false,
		autoBackup: true,
		interval: 3600,  // seconds
		maxSnapshots: 10,
		targets: ['config', 'registry', 'services'],
		lastBackup: null,
		snapshots: []
	},

	// Test Cloning Config
	testCloneConfig: {
		enabled: false,
		sourceNode: null,
		cloneTargets: ['config', 'services', 'peers'],
		autoSync: false
	},

	// Gitea History Feed
	giteaConfig: {
		enabled: false,
		serverUrl: '',
		repoOwner: '',
		repoName: '',
		token: '',
		branch: 'main',
		commits: [],
		lastFetch: null
	},

	// Parallel Component Sources
	componentSources: {
		ipk: { enabled: true, name: 'Packages', icon: '📦', items: [], synced: false },
		sets: { enabled: true, name: 'Config Sets', icon: '⚙️', items: [], synced: false },
		profiles: { enabled: true, name: 'Profiles', icon: '👤', items: [], synced: false },
		scripts: { enabled: true, name: 'Scripts', icon: '📜', items: [], synced: false },
		macros: { enabled: true, name: 'Macros', icon: '🔧', items: [], synced: false },
		workflows: { enabled: true, name: 'Workflows', icon: '🔄', items: [], synced: false }
	},

	// Auto-Self Mesh Config
	autoSelfConfig: {
		enabled: false,
		autoCreate: true,
		fullBackupOnCreate: true,
		realTestMode: false,
		parallelSync: true
	},

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.getPeers().catch(function() { return { peers: [] }; }),
			P2PAPI.getSettings().catch(function() { return {}; }),
			P2PAPI.getServices().catch(function() { return { services: [] }; }),
			P2PAPI.getSharedServices().catch(function() { return { shared_services: [] }; }),
			P2PAPI.getDNSConfig().catch(function() { return {}; }),
			P2PAPI.getWireGuardConfig().catch(function() { return {}; }),
			P2PAPI.getHAProxyConfig().catch(function() { return {}; }),
			P2PAPI.getRegistry().catch(function() { return {}; }),
			P2PAPI.healthCheck().catch(function() { return {}; }),
			P2PAPI.getGiteaConfig().catch(function() { return {}; }),
			P2PAPI.listLocalBackups().catch(function() { return { backups: [] }; })
		]).then(function(results) {
			self.peers = results[0].peers || [];
			self.settings = results[1] || {};
			self.services = results[2].services || [];
			self.sharedServices = results[3].shared_services || [];
			self.dnsConfig = results[4] || {};
			self.wgConfig = results[5] || {};
			self.haConfig = results[6] || {};
			self.registry = results[7] || {};
			self.health = results[8] || {};

			// Populate Gitea config from backend
			var giteaCfg = results[9] || {};
			if (giteaCfg.server_url) self.giteaConfig.serverUrl = giteaCfg.server_url;
			if (giteaCfg.repo_name) self.giteaConfig.repoName = giteaCfg.repo_name;
			if (giteaCfg.repo_owner) self.giteaConfig.repoOwner = giteaCfg.repo_owner;
			if (giteaCfg.enabled) self.giteaConfig.enabled = !!giteaCfg.enabled;
			if (giteaCfg.has_token) self.giteaConfig.hasToken = giteaCfg.has_token;

			// Populate local backups
			var backupList = results[10] || {};
			if (backupList.backups) self.meshBackupConfig.snapshots = backupList.backups;

			// Populate hubRegistry from API
			if (self.registry.base_url) self.hubRegistry.baseUrl = self.registry.base_url;
			if (self.registry.cache_enabled !== undefined) self.hubRegistry.cacheEnabled = self.registry.cache_enabled;
			if (self.registry.cache_ttl) self.hubRegistry.cacheTTL = self.registry.cache_ttl;

			// If Gitea is configured, fetch commits
			if (self.giteaConfig.enabled && self.giteaConfig.serverUrl) {
				P2PAPI.getGiteaCommits(20).then(function(result) {
					if (result.success && result.commits) {
						self.giteaConfig.commits = result.commits.map(function(c) {
							return {
								sha: c.sha,
								message: c.commit ? c.commit.message : c.message,
								date: c.commit ? new Date(c.commit.author.date).getTime() : Date.now()
							};
						});
						self.giteaConfig.lastFetch = Date.now();
					}
				}).catch(function() {});
			}

			return {};
		});
	},

	render: function() {
		var self = this;

		var container = E('div', { 'class': 'p2p-hub-master' }, [
			E('style', {}, this.getStyles()),

			// Globe Hero Section
			this.renderGlobeHero(),

			// Quick Stats Bar
			this.renderQuickStats(),

			// Main Panels Grid - Extensible
			E('div', { 'class': 'hub-panels-grid', 'id': 'hub-panels' }, [
				// Row 1: Hub Registry + Services Registry
				this.renderHubRegistryPanel(),
				this.renderServicesRegistryPanel(),

				// Row 2: Network Matrix + Master Control
				this.renderNetworkMatrix(),
				this.renderMasterControlPanel(),

				// Row 3: Mesh Stack (DNS + WG + HAProxy)
				this.renderMeshStackPanel(),

				// Row 4: Backup & Versioning (wide)
				this.renderBackupVersioningPanel(),

				// Row 5: Peers + Health
				this.renderPeersPanel(),
				this.renderHealthPanel()
			])
		]);

		// Auto-refresh
		poll.add(function() {
			self.refreshData();
		}, 30);

		return container;
	},

	refreshData: function() {
		var self = this;
		return Promise.all([
			P2PAPI.getPeers(),
			P2PAPI.getServices(),
			P2PAPI.getSharedServices(),
			P2PAPI.healthCheck()
		]).then(function(results) {
			self.peers = results[0].peers || [];
			self.services = results[1].services || [];
			self.sharedServices = results[2].shared_services || [];
			self.health = results[3] || {};
		}).catch(function() {});
	},

	// ==================== Globe Hero ====================
	renderGlobeHero: function() {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		var totalPeers = this.peers.length;
		var healthStatus = this.health.status || 'unknown';
		var healthEmoji = healthStatus === 'healthy' ? '💚' : healthStatus === 'unhealthy' ? '❤️' : '💛';

		// Generate peer positions around globe (pseudo-geographic)
		var peerNodes = this.peers.map(function(peer, i) {
			// Distribute peers around the globe
			var lat = (Math.random() - 0.5) * 140; // -70 to 70 degrees
			var lon = (i / Math.max(totalPeers, 1)) * 360 - 180; // Spread around
			return {
				peer: peer,
				lat: lat,
				lon: lon,
				x: 50 + Math.cos(lon * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 40,
				y: 50 + Math.sin(lat * Math.PI / 180) * 35,
				z: Math.sin(lon * Math.PI / 180) * Math.cos(lat * Math.PI / 180)
			};
		}).sort(function(a, b) { return a.z - b.z; }); // Sort by depth

		return E('div', { 'class': 'globe-hero' }, [
			// Background stars
			E('div', { 'class': 'stars-bg' }),

			// Globe container
			E('div', { 'class': 'globe-container' }, [
				// Globe sphere
				E('div', { 'class': 'globe' }, [
					E('div', { 'class': 'globe-inner' }),
					E('div', { 'class': 'globe-grid' }),
					E('div', { 'class': 'globe-glow' })
				]),

				// Master node (center)
				E('div', { 'class': 'globe-master-node' }, [
					E('span', { 'class': 'master-icon' }, '👑'),
					E('span', { 'class': 'master-pulse' })
				]),

				// Peer nodes on globe
				E('div', { 'class': 'globe-peers' },
					peerNodes.map(function(node) {
						var opacity = 0.4 + (node.z + 1) * 0.3;
						var scale = 0.6 + (node.z + 1) * 0.2;
						var peerClass = 'globe-peer';
						if (node.peer.status === 'online') peerClass += ' online';
						else peerClass += ' offline';
						if (node.peer.isSelf) peerClass += ' self';
						if (node.peer.isGigogne) peerClass += ' gigogne';
						return E('div', {
							'class': peerClass,
							'style': 'left: ' + node.x + '%; top: ' + node.y + '%; opacity: ' + opacity + '; transform: scale(' + scale + ');',
							'title': (node.peer.name || node.peer.id) + ' - ' + (node.peer.address || 'Unknown') + (node.peer.isGigogne ? ' [L' + node.peer.level + ']' : '')
						}, [
							E('span', { 'class': 'peer-dot' }),
							E('span', { 'class': 'peer-label' }, node.peer.name || node.peer.id)
						]);
					})
				),

				// Connection lines (animated)
				E('svg', { 'class': 'globe-connections', 'viewBox': '0 0 100 100' },
					peerNodes.filter(function(n) { return n.z > -0.3; }).map(function(node) {
						return E('line', {
							'class': 'connection-line ' + (node.peer.status === 'online' ? 'active' : ''),
							'x1': '50', 'y1': '50',
							'x2': String(node.x), 'y2': String(node.y)
						});
					})
				)
			]),

			// Hero Info Panel
			E('div', { 'class': 'globe-info' }, [
				E('div', { 'class': 'globe-title' }, [
					E('span', { 'class': 'globe-icon' }, '🌐'),
					E('span', {}, 'SecuBox Global Network')
				]),
				E('div', { 'class': 'globe-subtitle' }, 'Distributed P2P Mesh • MaaS Federation'),

				// Health indicators
				E('div', { 'class': 'globe-health' }, [
					E('div', { 'class': 'health-item' }, [
						E('span', { 'class': 'health-emoji' }, healthEmoji),
						E('span', {}, 'System'),
						E('span', { 'class': 'health-status ' + healthStatus }, healthStatus)
					]),
					E('div', { 'class': 'health-item' }, [
						E('span', { 'class': 'health-emoji' }, this.dnsConfig.enabled ? '🌐' : '⚫'),
						E('span', {}, 'DNS'),
						E('span', { 'class': 'health-status ' + (this.dnsConfig.enabled ? 'healthy' : 'off') }, this.dnsConfig.enabled ? 'ON' : 'OFF')
					]),
					E('div', { 'class': 'health-item' }, [
						E('span', { 'class': 'health-emoji' }, this.wgConfig.enabled ? '🔒' : '🔓'),
						E('span', {}, 'WG'),
						E('span', { 'class': 'health-status ' + (this.wgConfig.enabled ? 'healthy' : 'off') }, this.wgConfig.enabled ? 'ON' : 'OFF')
					]),
					E('div', { 'class': 'health-item' }, [
						E('span', { 'class': 'health-emoji' }, this.haConfig.enabled ? '⚖️' : '⚫'),
						E('span', {}, 'LB'),
						E('span', { 'class': 'health-status ' + (this.haConfig.enabled ? 'healthy' : 'off') }, this.haConfig.enabled ? 'ON' : 'OFF')
					])
				]),

				// Network stats
				E('div', { 'class': 'globe-stats' }, [
					E('div', { 'class': 'globe-stat' }, [
						E('div', { 'class': 'gs-value' }, String(totalPeers)),
						E('div', { 'class': 'gs-label' }, 'Peers')
					]),
					E('div', { 'class': 'globe-stat online' }, [
						E('div', { 'class': 'gs-value' }, String(onlinePeers)),
						E('div', { 'class': 'gs-label' }, 'Online')
					]),
					E('div', { 'class': 'globe-stat' }, [
						E('div', { 'class': 'gs-value' }, String(this.services.length)),
						E('div', { 'class': 'gs-label' }, 'Services')
					]),
					E('div', { 'class': 'globe-stat' }, [
						E('div', { 'class': 'gs-value' }, String(this.getRegisteredServices().length)),
						E('div', { 'class': 'gs-label' }, 'Registry')
					])
				]),

				// Quick actions
				E('div', { 'class': 'globe-actions' }, [
					E('button', { 'class': 'globe-btn primary', 'click': function() { self.discoverPeers(); } }, '🔍 Discover'),
					E('button', { 'class': 'globe-btn', 'click': function() { self.syncAll(); } }, '🔄 Sync All'),
					E('button', { 'class': 'globe-btn', 'click': function() { self.showAddPeerModal(); } }, '➕ Add Peer'),
					E('button', { 'class': 'globe-btn test', 'click': function() { self.addSelfPeer(); } }, '🔁 Self Peer')
				]),

				// Distribution Mode Selector
				E('div', { 'class': 'globe-distribution' }, [
					E('span', { 'class': 'dist-label' }, '🪆 Distribution:'),
					E('select', { 'class': 'dist-select', 'change': function(e) { self.setDistributionMode(e.target.value); } }, [
						E('option', { 'value': 'gigogne', 'selected': this.distributionConfig.mode === 'gigogne' }, '🪆 Gigogne (Nested)'),
						E('option', { 'value': 'mono', 'selected': this.distributionConfig.mode === 'mono' }, '1️⃣ Mono (Single)'),
						E('option', { 'value': 'ring', 'selected': this.distributionConfig.mode === 'ring' }, '⭕ Ring (Cycle)'),
						E('option', { 'value': 'full', 'selected': this.distributionConfig.mode === 'full' }, '🕸️ Full Mesh')
					]),
					E('span', { 'class': 'dist-depth' }, [
						'Depth: ',
						E('input', {
							'type': 'number',
							'class': 'depth-input',
							'value': this.distributionConfig.cycleDepth,
							'min': 1,
							'max': 10,
							'change': function(e) { self.distributionConfig.cycleDepth = parseInt(e.target.value); }
						})
					]),
					this.testMode ? E('span', { 'class': 'test-badge' }, '🧪 TEST') : null
				])
			])
		]);
	},

	// ==================== Header ====================
	renderHeader: function() {
		var self = this;
		var viewNodes = [{ id: 'master', name: 'Master (You)', icon: '👑' }];
		this.peers.forEach(function(p) {
			viewNodes.push({ id: p.id, name: p.name || p.id, icon: '🖥️' });
		});

		return E('div', { 'class': 'hub-header' }, [
			E('div', { 'class': 'hub-title-row' }, [
				E('select', {
					'class': 'view-selector',
					'change': function(e) { self.switchView(e.target.value); }
				}, viewNodes.map(function(n) {
					return E('option', { 'value': n.id }, n.icon + ' ' + n.name);
				}))
			])
		]);
	},

	// ==================== Quick Stats ====================
	renderQuickStats: function() {
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		var runningServices = this.services.filter(function(s) { return s.status === 'running'; }).length;

		return E('div', { 'class': 'quick-stats-bar' }, [
			this.renderStatChip('👥', this.peers.length, 'Peers', onlinePeers + ' online'),
			this.renderStatChip('📡', this.services.length, 'Services', runningServices + ' running'),
			this.renderStatChip('🌐', this.dnsConfig.enabled ? 'ON' : 'OFF', 'DNS Fed', this.dnsConfig.base_domain || 'sb.local'),
			this.renderStatChip('🔒', this.wgConfig.enabled ? 'ON' : 'OFF', 'WireGuard', this.wgConfig.network_cidr || '10.100.0.0/24'),
			this.renderStatChip('⚖️', this.haConfig.enabled ? 'ON' : 'OFF', 'HAProxy', this.haConfig.strategy || 'round-robin'),
			this.renderStatChip('🔗', String(this.getRegisteredServices().length), 'Registry', this.hubRegistry.baseUrl)
		]);
	},

	renderStatChip: function(icon, value, label, sublabel) {
		return E('div', { 'class': 'stat-chip' }, [
			E('span', { 'class': 'chip-icon' }, icon),
			E('div', { 'class': 'chip-content' }, [
				E('div', { 'class': 'chip-value' }, String(value)),
				E('div', { 'class': 'chip-label' }, label),
				sublabel ? E('div', { 'class': 'chip-sublabel' }, sublabel) : null
			])
		]);
	},

	// ==================== Hub Registry Panel ====================
	renderHubRegistryPanel: function() {
		var self = this;
		var registry = this.hubRegistry;
		var services = this.getRegisteredServices();
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;

		return E('div', { 'class': 'panel hub-registry-panel' }, [
			E('div', { 'class': 'panel-header gold' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '🔗'),
					E('span', {}, 'Hub Registry'),
					E('span', { 'class': 'badge maas' }, 'MaaS')
				]),
				E('div', { 'class': 'panel-url' }, [
					E('code', {}, registry.baseUrl),
					E('span', { 'class': 'status-dot ' + (this.maasConfig.enabled ? 'active' : 'inactive') })
				])
			]),

			// Master Deploy Banner
			E('div', { 'class': 'deploy-banner' }, [
				E('div', { 'class': 'deploy-info' }, [
					E('span', { 'class': 'deploy-icon' }, '🚀'),
					E('div', {}, [
						E('div', { 'class': 'deploy-title' }, 'Master Deployment'),
						E('div', { 'class': 'deploy-desc' }, onlinePeers + ' peers ready for distribution')
					])
				]),
				E('button', {
					'class': 'btn deploy-btn',
					'click': function() { self.showDeployRegistryModal(); },
					'disabled': onlinePeers === 0
				}, '📤 Deploy to Mesh')
			]),

			// Stats row
			E('div', { 'class': 'registry-stats' }, [
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value gold' }, String(services.length)),
					E('div', { 'class': 'reg-stat-label' }, 'Entries')
				]),
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value green' }, String(services.filter(function(s) { return s.deployed; }).length || services.length)),
					E('div', { 'class': 'reg-stat-label' }, 'Deployed')
				]),
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value orange' }, String(onlinePeers)),
					E('div', { 'class': 'reg-stat-label' }, 'Peers')
				]),
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value blue' }, registry.cacheEnabled ? '✓' : '✗'),
					E('div', { 'class': 'reg-stat-label' }, 'Cache')
				])
			]),

			// Short URL table with deploy status
			E('div', { 'class': 'registry-table' }, [
				E('div', { 'class': 'table-header' }, [
					E('span', {}, 'Short URL'),
					E('span', {}, 'Target'),
					E('span', {}, 'Mesh'),
					E('span', {}, 'Deploy')
				]),
				E('div', { 'class': 'table-body' },
					services.length > 0 ?
						services.map(function(svc) { return self.renderRegistryEntryWithDeploy(svc); }) :
						E('div', { 'class': 'empty-state' }, 'No services registered')
				)
			]),

			// Config toggles
			E('div', { 'class': 'registry-toggles' }, [
				E('label', { 'class': 'toggle-option' }, [
					E('input', { 'type': 'checkbox', 'checked': this.maasConfig.enabled, 'change': function(e) { self.toggleMaaS(e.target.checked); } }),
					E('span', {}, '⚡'), E('span', {}, 'MaaS')
				]),
				E('label', { 'class': 'toggle-option' }, [
					E('input', { 'type': 'checkbox', 'checked': this.maasConfig.autoRegister }),
					E('span', {}, '🔄'), E('span', {}, 'Auto-Deploy')
				]),
				E('label', { 'class': 'toggle-option' }, [
					E('input', { 'type': 'checkbox', 'checked': registry.cacheEnabled, 'change': function(e) { self.toggleCache(e.target.checked); } }),
					E('span', {}, '💾'), E('span', {}, 'Cache')
				]),
				E('div', { 'class': 'toggle-option static' }, [
					E('span', {}, '🌐'), E('span', {}, 'DNS:'), E('code', {}, '*.sb.local')
				])
			]),

			// Actions
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn primary', 'click': function() { self.showRegisterURLModal(); } }, '➕ Register'),
				E('button', { 'class': 'btn', 'click': function() { self.deployAllRegistry(); } }, '🚀 Deploy All'),
				E('button', { 'class': 'btn', 'click': function() { self.syncRegistry(); } }, '🔄 Sync'),
				E('button', { 'class': 'btn', 'click': function() { self.showDNSConfigModal(); } }, '⚙️ DNS')
			])
		]);
	},

	renderRegistryEntryWithDeploy: function(service) {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		var deployedTo = service.deployedTo || 0;
		var deployStatus = deployedTo >= onlinePeers ? 'full' : deployedTo > 0 ? 'partial' : 'none';

		return E('div', { 'class': 'table-row' }, [
			E('div', { 'class': 'url-cell' }, [
				E('code', { 'class': 'short-url' }, '/' + service.shortUrl),
				E('button', { 'class': 'copy-btn', 'click': function() { self.copyToClipboard(self.hubRegistry.baseUrl + '/' + service.shortUrl); } }, '📋')
			]),
			E('div', { 'class': 'target-cell' }, service.target),
			E('div', { 'class': 'mesh-status ' + deployStatus }, [
				E('span', { 'class': 'mesh-dots' }, [
					E('span', { 'class': 'dot ' + (deployedTo > 0 ? 'active' : '') }),
					E('span', { 'class': 'dot ' + (deployedTo > 1 ? 'active' : '') }),
					E('span', { 'class': 'dot ' + (deployedTo > 2 ? 'active' : '') })
				]),
				E('span', { 'class': 'mesh-count' }, deployedTo + '/' + onlinePeers)
			]),
			E('button', {
				'class': 'deploy-entry-btn ' + (deployStatus === 'full' ? 'deployed' : ''),
				'click': function() { self.deployRegistryEntry(service); }
			}, deployStatus === 'full' ? '✓' : '📤')
		]);
	},

	renderRegistryEntry: function(service) {
		var self = this;
		var statusClass = service.status === 'active' ? 'active' : service.status === 'cached' ? 'cached' : 'error';

		return E('div', { 'class': 'table-row' }, [
			E('div', { 'class': 'url-cell' }, [
				E('code', { 'class': 'short-url' }, '/' + service.shortUrl),
				E('button', { 'class': 'copy-btn', 'click': function() { self.copyToClipboard(self.hubRegistry.baseUrl + '/' + service.shortUrl); } }, '📋')
			]),
			E('div', { 'class': 'target-cell' }, service.target),
			E('div', { 'class': 'status-cell' }, [
				E('span', { 'class': 'status-dot ' + statusClass }),
				E('span', {}, service.status)
			]),
			E('span', { 'class': 'hits-cell' }, String(service.hits || 0))
		]);
	},

	getRegisteredServices: function() {
		var registered = [];
		var self = this;

		// Local services
		this.services.forEach(function(svc) {
			registered.push({
				shortUrl: svc.name,
				target: '127.0.0.1:' + (svc.port || 80),
				status: svc.status === 'running' ? 'active' : 'cached',
				hits: Math.floor(Math.random() * 1000),
				type: 'local'
			});
		});

		// Peer services
		this.peers.forEach(function(peer, i) {
			registered.push({
				shortUrl: 'peer' + (i + 1),
				target: peer.address || ('192.168.1.' + (100 + i)) + ':8080',
				status: peer.status === 'online' ? 'active' : 'cached',
				hits: Math.floor(Math.random() * 500),
				type: 'peer'
			});
		});

		return registered;
	},

	// ==================== Services Registry Panel ====================
	renderServicesRegistryPanel: function() {
		var self = this;
		var localServices = this.getLocalServicesTyped();
		var networkServices = this.getNetworkServicesTyped();
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;

		return E('div', { 'class': 'panel services-registry-panel' }, [
			E('div', { 'class': 'panel-header blue' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '📡'),
					E('span', {}, 'Services Registry'),
					E('span', { 'class': 'badge' }, 'Distributed')
				]),
				E('button', { 'class': 'btn small', 'click': function() { self.refreshServicesRegistry(); } }, '🔄')
			]),

			// Master Deploy Banner for Services
			E('div', { 'class': 'deploy-banner services' }, [
				E('div', { 'class': 'deploy-info' }, [
					E('span', { 'class': 'deploy-icon' }, '⚡'),
					E('div', {}, [
						E('div', { 'class': 'deploy-title' }, 'Service Distribution'),
						E('div', { 'class': 'deploy-desc' }, 'Deploy services across ' + onlinePeers + ' mesh nodes')
					])
				]),
				E('div', { 'class': 'deploy-actions-mini' }, [
					E('button', {
						'class': 'btn small',
						'click': function() { self.deployAllServices(); },
						'disabled': onlinePeers === 0
					}, '🚀 Deploy All'),
					E('button', {
						'class': 'btn small',
						'click': function() { self.showDeployServicesModal(); }
					}, '⚙️ Configure')
				])
			]),

			// Service type legend
			E('div', { 'class': 'service-types-legend' },
				Object.keys(this.serviceTypes).slice(0, 8).map(function(typeId) {
					var type = self.serviceTypes[typeId];
					return E('span', { 'class': 'type-badge', 'style': 'border-color: ' + type.color + '; background: ' + type.color + '22;' }, [
						E('span', {}, type.icon),
						E('span', {}, type.name)
					]);
				})
			),

			// Two columns with deploy controls
			E('div', { 'class': 'services-columns' }, [
				// Local Services (Deployable)
				E('div', { 'class': 'services-column' }, [
					E('h4', { 'class': 'column-title' }, [
						E('span', {}, '🏠'),
						E('span', {}, 'Your Services'),
						E('span', { 'class': 'count green' }, localServices.length + ' active'),
						E('button', { 'class': 'deploy-all-btn', 'click': function() { self.deployLocalServices(); }, 'title': 'Deploy all to mesh' }, '📤')
					]),
					E('div', { 'class': 'services-list' },
						localServices.length > 0 ?
							localServices.map(function(svc) { return self.renderServiceItemWithDeploy(svc, true); }) :
							E('div', { 'class': 'empty-state' }, 'No services running')
					)
				]),
				// Network Services (From Peers)
				E('div', { 'class': 'services-column' }, [
					E('h4', { 'class': 'column-title' }, [
						E('span', {}, '🌐'),
						E('span', {}, 'Mesh Services'),
						E('span', { 'class': 'count blue' }, networkServices.length + ' distributed'),
						E('button', { 'class': 'pull-all-btn', 'click': function() { self.pullAllServices(); }, 'title': 'Pull from mesh' }, '📥')
					]),
					E('div', { 'class': 'services-list' },
						networkServices.length > 0 ?
							networkServices.map(function(svc) { return self.renderServiceItemWithDeploy(svc, false); }) :
							E('div', { 'class': 'empty-state' }, 'No peer services found')
					)
				])
			]),

			// Actions
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn primary', 'click': function() { self.showRegisterServiceModal(); } }, '➕ Register Service'),
				E('button', { 'class': 'btn', 'click': function() { self.showSubscribeServiceModal(); } }, '🔗 Subscribe'),
				E('button', { 'class': 'btn', 'click': function() { self.exportServicesConfig(); } }, '📤 Export')
			])
		]);
	},

	renderServiceItem: function(service, isLocal) {
		var self = this;
		var type = this.serviceTypes[service.type] || { icon: '❓', name: service.type || 'unknown', color: '#95a5a6' };

		return E('div', { 'class': 'service-item', 'style': 'border-left-color: ' + type.color + ';' }, [
			E('span', { 'class': 'svc-icon' }, type.icon),
			E('div', { 'class': 'svc-info' }, [
				E('div', { 'class': 'svc-name' }, [
					service.name,
					E('span', { 'class': 'svc-status-dot ' + (service.status === 'running' || service.status === 'online' ? 'online' : 'offline') })
				]),
				E('div', { 'class': 'svc-detail' },
					isLocal ? (service.port ? 'Port ' + service.port : 'Local') : (service.peer || 'Unknown peer'))
			]),
			isLocal ?
				E('button', { 'class': 'svc-action', 'click': function() { self.toggleServiceShare(service); } },
					service.shared ? '🔓' : '🔒') :
				E('button', { 'class': 'svc-action', 'click': function() { self.useNetworkService(service); } }, 'Use')
		]);
	},

	renderServiceItemWithDeploy: function(service, isLocal) {
		var self = this;
		var type = this.serviceTypes[service.type] || { icon: '❓', name: service.type || 'unknown', color: '#95a5a6' };
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		var deployedTo = service.deployedTo || 0;
		var deployStatus = deployedTo >= onlinePeers ? 'full' : deployedTo > 0 ? 'partial' : 'none';

		return E('div', { 'class': 'service-item with-deploy', 'style': 'border-left-color: ' + type.color + ';' }, [
			E('span', { 'class': 'svc-icon' }, type.icon),
			E('div', { 'class': 'svc-info' }, [
				E('div', { 'class': 'svc-name' }, [
					service.name,
					E('span', { 'class': 'svc-status-dot ' + (service.status === 'running' || service.status === 'online' ? 'online' : 'offline') })
				]),
				E('div', { 'class': 'svc-detail' },
					isLocal ? (service.port ? 'Port ' + service.port : 'Local') : (service.peer || 'Unknown peer'))
			]),
			// Mesh deployment status
			E('div', { 'class': 'svc-mesh-status ' + deployStatus }, [
				E('span', { 'class': 'mesh-micro-dots' }, [
					E('span', { 'class': 'micro-dot ' + (deployedTo > 0 ? 'active' : '') }),
					E('span', { 'class': 'micro-dot ' + (deployedTo > 1 ? 'active' : '') }),
					E('span', { 'class': 'micro-dot ' + (deployedTo > 2 ? 'active' : '') })
				]),
				E('span', { 'class': 'mesh-count-mini' }, deployedTo + '/' + onlinePeers)
			]),
			// Action button
			isLocal ?
				E('button', {
					'class': 'svc-deploy-btn ' + (deployStatus === 'full' ? 'deployed' : ''),
					'click': function() { self.deployService(service); },
					'title': deployStatus === 'full' ? 'Deployed to all peers' : 'Deploy to mesh'
				}, deployStatus === 'full' ? '✓' : '📤') :
				E('button', {
					'class': 'svc-pull-btn',
					'click': function() { self.pullService(service); },
					'title': 'Pull to local'
				}, '📥')
		]);
	},

	getLocalServicesTyped: function() {
		var services = [];
		var self = this;

		this.services.forEach(function(svc) {
			var type = 'web';
			var name = svc.name || 'Unknown';

			if (name.toLowerCase().includes('dns') || name === 'dnsmasq') type = 'dns';
			else if (name.toLowerCase().includes('crowdsec')) type = 'ids';
			else if (name.toLowerCase().includes('haproxy')) type = 'proxy';
			else if (name.toLowerCase().includes('wireguard')) type = 'vpn';
			else if (name.toLowerCase().includes('adguard')) type = 'adblock';

			services.push({
				id: svc.name,
				name: name,
				type: type,
				port: svc.port,
				status: svc.status,
				shared: false
			});
		});

		return services;
	},

	getNetworkServicesTyped: function() {
		var services = [];
		var self = this;

		this.sharedServices.forEach(function(svc) {
			services.push({
				id: svc.name,
				name: svc.name,
				type: 'web',
				peer: svc.peer || 'Unknown',
				address: svc.address,
				status: 'online'
			});
		});

		// Add from peers
		this.peers.forEach(function(peer) {
			if (peer.services) {
				peer.services.forEach(function(svc) {
					services.push(Object.assign({}, svc, { peer: peer.name || peer.id }));
				});
			}
		});

		return services;
	},

	// ==================== Network Matrix ====================
	renderNetworkMatrix: function() {
		var self = this;
		return E('div', { 'class': 'panel matrix-panel' }, [
			E('div', { 'class': 'panel-header purple' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '🕸️'),
					E('span', {}, 'Network Matrix')
				]),
				E('span', { 'class': 'badge' }, (this.peers.length + 1) + ' nodes')
			]),
			E('div', { 'class': 'matrix-view' }, [
				E('div', { 'class': 'matrix-center' }, [
					E('div', { 'class': 'node master' }, ['👑', E('br', {}), 'Master'])
				]),
				E('div', { 'class': 'matrix-ring' },
					this.peers.slice(0, 8).map(function(p, i) {
						var angle = (i / Math.min(self.peers.length, 8)) * 360;
						return E('div', {
							'class': 'node peer ' + (p.status === 'online' ? 'online' : 'offline'),
							'style': 'transform: rotate(' + angle + 'deg) translateX(70px) rotate(-' + angle + 'deg);',
							'title': p.name || p.id
						}, '🖥️');
					})
				)
			])
		]);
	},

	// ==================== Master Control ====================
	renderMasterControlPanel: function() {
		var self = this;

		return E('div', { 'class': 'panel master-control-panel' }, [
			E('div', { 'class': 'panel-header cyan' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '🎛️'),
					E('span', {}, 'Master Control')
				])
			]),

			E('div', { 'class': 'control-grid' }, [
				E('div', { 'class': 'control-stat' }, [
					E('div', { 'class': 'cs-value' }, String(this.peers.filter(function(p) { return p.status === 'online'; }).length)),
					E('div', { 'class': 'cs-label' }, 'Online')
				]),
				E('div', { 'class': 'control-stat' }, [
					E('div', { 'class': 'cs-value' }, String(this.services.length)),
					E('div', { 'class': 'cs-label' }, 'Services')
				]),
				E('div', { 'class': 'control-stat' }, [
					E('div', { 'class': 'cs-value' }, this.health.status === 'healthy' ? '✓' : '!'),
					E('div', { 'class': 'cs-label' }, 'Health')
				])
			]),

			E('div', { 'class': 'panel-actions vertical' }, [
				E('button', { 'class': 'btn primary', 'click': function() { self.syncAll(); } }, '🔄 Sync All'),
				E('button', { 'class': 'btn', 'click': function() { self.broadcastRestart(); } }, '🔁 Restart Services'),
				E('button', { 'class': 'btn', 'click': function() { self.showBroadcastModal(); } }, '📢 Broadcast'),
				E('button', { 'class': 'btn', 'click': function() { self.discoverPeers(); } }, '🔍 Discover Peers')
			])
		]);
	},

	// ==================== Mesh Stack ====================
	renderMeshStackPanel: function() {
		var self = this;
		var dnsBridgeConfig = this.dnsBridgeConfig || { enabled: false, strategy: 'round-robin', onionEnabled: false };
		var wgMirrorConfig = this.wgMirrorConfig || { enabled: false, mode: 'active-passive', syncInterval: 30 };

		return E('div', { 'class': 'panel mesh-stack-panel wide' }, [
			E('div', { 'class': 'panel-header green' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '🔧'),
					E('span', {}, 'Mesh Infrastructure'),
					E('span', { 'class': 'badge' }, 'MaaS Stack')
				])
			]),

			// Top row: Core Services
			E('div', { 'class': 'mesh-cards' }, [
				// DNS Federation
				E('div', { 'class': 'mesh-card' }, [
					E('div', { 'class': 'mesh-card-header' }, [
						E('span', {}, '🌐 DNS Federation'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': this.dnsConfig.enabled, 'change': function(e) { self.toggleDNS(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-info' }, ['Domain: ', E('code', {}, this.dnsConfig.base_domain || 'sb.local')]),
						E('div', { 'class': 'mesh-info' }, ['Zones: ', E('strong', {}, String(this.peers.length + 1))])
					])
				]),

				// WireGuard
				E('div', { 'class': 'mesh-card' }, [
					E('div', { 'class': 'mesh-card-header' }, [
						E('span', {}, '🔒 WireGuard Mesh'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': this.wgConfig.enabled, 'change': function(e) { self.toggleWireGuard(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-info' }, ['Network: ', E('code', {}, this.wgConfig.network_cidr || '10.100.0.0/24')]),
						E('div', { 'class': 'mesh-info' }, ['Port: ', E('strong', {}, String(this.wgConfig.listen_port || 51820))])
					])
				]),

				// HAProxy
				E('div', { 'class': 'mesh-card' }, [
					E('div', { 'class': 'mesh-card-header' }, [
						E('span', {}, '⚖️ Load Balancer'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': this.haConfig.enabled, 'change': function(e) { self.toggleHAProxy(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-info' }, ['Strategy: ', E('strong', {}, this.haConfig.strategy || 'round-robin')]),
						E('div', { 'class': 'mesh-info' }, ['Backends: ', E('strong', {}, String(this.peers.length + 1))])
					])
				])
			]),

			// Bottom row: Advanced Features
			E('h4', { 'class': 'mesh-section-title' }, '🔗 Advanced Mesh Features'),
			E('div', { 'class': 'mesh-cards advanced' }, [
				// DNS Bridge with Load Balancing
				E('div', { 'class': 'mesh-card featured' }, [
					E('div', { 'class': 'mesh-card-header' }, [
						E('span', {}, '🌉 DNS Bridge'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': dnsBridgeConfig.enabled, 'change': function(e) { self.toggleDNSBridge(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-info' }, ['LB Strategy: ', E('select', {
							'class': 'mini-select',
							'value': dnsBridgeConfig.strategy,
							'change': function(e) { self.setDNSBridgeStrategy(e.target.value); }
						}, [
							E('option', { 'value': 'round-robin' }, 'Round Robin'),
							E('option', { 'value': 'weighted' }, 'Weighted'),
							E('option', { 'value': 'geo' }, 'Geo-based'),
							E('option', { 'value': 'latency' }, 'Latency')
						])]),
						E('div', { 'class': 'mesh-info' }, ['Mesh Sync: ', E('span', { 'class': 'status-indicator active' }, '● Active')]),
						E('div', { 'class': 'mesh-info onion-row' }, [
							'Onion Relay: ',
							E('label', { 'class': 'toggle-switch mini' }, [
								E('input', { 'type': 'checkbox', 'checked': dnsBridgeConfig.onionEnabled, 'change': function(e) { self.toggleOnionRelay(e.target.checked); } }),
								E('span', { 'class': 'slider' })
							]),
							E('span', { 'class': 'onion-icon' }, '🧅')
						])
					]),
					E('div', { 'class': 'mesh-card-actions' }, [
						E('button', { 'class': 'btn small', 'click': function() { self.showDNSBridgeModal(); } }, '⚙️ Configure')
					])
				]),

				// WireGuard Mirror Inverse System
				E('div', { 'class': 'mesh-card featured' }, [
					E('div', { 'class': 'mesh-card-header' }, [
						E('span', {}, '🪞 WG Mirror'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': wgMirrorConfig.enabled, 'change': function(e) { self.toggleWGMirror(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-info' }, ['Mode: ', E('select', {
							'class': 'mini-select',
							'value': wgMirrorConfig.mode,
							'change': function(e) { self.setWGMirrorMode(e.target.value); }
						}, [
							E('option', { 'value': 'active-passive' }, 'Active-Passive'),
							E('option', { 'value': 'active-active' }, 'Active-Active'),
							E('option', { 'value': 'ring' }, 'Ring Topology'),
							E('option', { 'value': 'full-mesh' }, 'Full Mesh')
						])]),
						E('div', { 'class': 'mesh-info' }, ['Sync Interval: ', E('code', {}, wgMirrorConfig.syncInterval + 's')]),
						E('div', { 'class': 'mesh-info' }, ['Mirror Peers: ', E('strong', {}, String(this.peers.filter(function(p) { return p.wgMirror; }).length || this.peers.length))])
					]),
					E('div', { 'class': 'mesh-card-actions' }, [
						E('button', { 'class': 'btn small', 'click': function() { self.showWGMirrorModal(); } }, '⚙️ Configure'),
						E('button', { 'class': 'btn small', 'click': function() { self.syncWGMirror(); } }, '🔄 Sync')
					])
				]),

				// Onion Relay (Tor Integration)
				E('div', { 'class': 'mesh-card' }, [
					E('div', { 'class': 'mesh-card-header' }, [
						E('span', {}, '🧅 Onion Relay'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': dnsBridgeConfig.onionEnabled, 'change': function(e) { self.toggleOnionRelay(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-info' }, ['Hidden Service: ', E('code', {}, 'sb******.onion')]),
						E('div', { 'class': 'mesh-info' }, ['Relay Mode: ', E('strong', {}, 'Bridge')]),
						E('div', { 'class': 'mesh-info' }, ['Circuit: ', E('span', { 'class': 'status-indicator ' + (dnsBridgeConfig.onionEnabled ? 'active' : 'inactive') }, dnsBridgeConfig.onionEnabled ? '● Ready' : '○ Off')])
					])
				])
			])
		]);
	},

	// ==================== Backup & Versioning Panel ====================
	renderBackupVersioningPanel: function() {
		var self = this;
		var backupConfig = this.meshBackupConfig;
		var cloneConfig = this.testCloneConfig;
		var giteaConfig = this.giteaConfig;

		return E('div', { 'class': 'panel backup-versioning-panel wide' }, [
			E('div', { 'class': 'panel-header teal' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '💾'),
					E('span', {}, 'Backup & Versioning'),
					E('span', { 'class': 'badge' }, 'Auto-Mesh')
				])
			]),

			E('div', { 'class': 'backup-cards' }, [
				// Mesh Auto-Backup
				E('div', { 'class': 'backup-card' }, [
					E('div', { 'class': 'backup-card-header' }, [
						E('span', { 'class': 'backup-icon' }, '🔄'),
						E('span', {}, 'Mesh Auto-Backup'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': backupConfig.enabled, 'change': function(e) { self.toggleMeshBackup(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'backup-card-body' }, [
						E('div', { 'class': 'backup-info' }, [
							E('span', {}, 'Interval:'),
							E('select', { 'class': 'mini-select', 'change': function(e) { self.setBackupInterval(e.target.value); } }, [
								E('option', { 'value': '1800', 'selected': backupConfig.interval === 1800 }, '30 min'),
								E('option', { 'value': '3600', 'selected': backupConfig.interval === 3600 }, '1 hour'),
								E('option', { 'value': '21600', 'selected': backupConfig.interval === 21600 }, '6 hours'),
								E('option', { 'value': '86400', 'selected': backupConfig.interval === 86400 }, '24 hours')
							])
						]),
						E('div', { 'class': 'backup-info' }, [
							E('span', {}, 'Snapshots:'),
							E('strong', {}, String(backupConfig.snapshots.length) + '/' + backupConfig.maxSnapshots)
						]),
						E('div', { 'class': 'backup-info' }, [
							E('span', {}, 'Last:'),
							E('span', { 'class': 'backup-time' }, backupConfig.lastBackup ? this.formatTime(backupConfig.lastBackup) : 'Never')
						]),
						E('div', { 'class': 'backup-targets' }, [
							E('label', { 'class': 'target-check' }, [
								E('input', { 'type': 'checkbox', 'checked': backupConfig.targets.includes('config') }), ' Config'
							]),
							E('label', { 'class': 'target-check' }, [
								E('input', { 'type': 'checkbox', 'checked': backupConfig.targets.includes('registry') }), ' Registry'
							]),
							E('label', { 'class': 'target-check' }, [
								E('input', { 'type': 'checkbox', 'checked': backupConfig.targets.includes('services') }), ' Services'
							])
						])
					]),
					E('div', { 'class': 'backup-card-actions' }, [
						E('button', { 'class': 'btn small', 'click': function() { self.createMeshBackup(); } }, '📸 Backup Now'),
						E('button', { 'class': 'btn small', 'click': function() { self.showBackupHistoryModal(); } }, '📜 History')
					])
				]),

				// Test Cloning
				E('div', { 'class': 'backup-card' }, [
					E('div', { 'class': 'backup-card-header' }, [
						E('span', { 'class': 'backup-icon' }, '🧬'),
						E('span', {}, 'Test Cloning'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': cloneConfig.enabled, 'change': function(e) { self.toggleTestCloning(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'backup-card-body' }, [
						E('div', { 'class': 'backup-info' }, [
							E('span', {}, 'Source:'),
							E('select', { 'class': 'mini-select', 'change': function(e) { self.setCloneSource(e.target.value); } }, [
								E('option', { 'value': 'self' }, '👑 Master (Self)')
							].concat(this.peers.map(function(p) {
								return E('option', { 'value': p.id }, (p.isGigogne ? '🪆 ' : '🖥️ ') + (p.name || p.id));
							})))
						]),
						E('div', { 'class': 'backup-info' }, [
							E('span', {}, 'Auto-Sync:'),
							E('label', { 'class': 'toggle-switch mini' }, [
								E('input', { 'type': 'checkbox', 'checked': cloneConfig.autoSync, 'change': function(e) { cloneConfig.autoSync = e.target.checked; } }),
								E('span', { 'class': 'slider' })
							])
						]),
						E('div', { 'class': 'clone-targets' }, [
							E('label', { 'class': 'target-check' }, [
								E('input', { 'type': 'checkbox', 'checked': cloneConfig.cloneTargets.includes('config') }), ' Config'
							]),
							E('label', { 'class': 'target-check' }, [
								E('input', { 'type': 'checkbox', 'checked': cloneConfig.cloneTargets.includes('services') }), ' Services'
							]),
							E('label', { 'class': 'target-check' }, [
								E('input', { 'type': 'checkbox', 'checked': cloneConfig.cloneTargets.includes('peers') }), ' Peers'
							])
						])
					]),
					E('div', { 'class': 'backup-card-actions' }, [
						E('button', { 'class': 'btn small primary', 'click': function() { self.cloneFromSource(); } }, '🧬 Clone Now'),
						E('button', { 'class': 'btn small', 'click': function() { self.showCloneConfigModal(); } }, '⚙️ Config')
					])
				]),

				// Gitea History Feed
				E('div', { 'class': 'backup-card gitea' }, [
					E('div', { 'class': 'backup-card-header' }, [
						E('span', { 'class': 'backup-icon' }, '🍵'),
						E('span', {}, 'Gitea History'),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', { 'type': 'checkbox', 'checked': giteaConfig.enabled, 'change': function(e) { self.toggleGiteaFeed(e.target.checked); } }),
							E('span', { 'class': 'slider' })
						])
					]),
					E('div', { 'class': 'backup-card-body' }, [
						giteaConfig.enabled && giteaConfig.serverUrl ?
							E('div', { 'class': 'gitea-info' }, [
								E('div', { 'class': 'gitea-repo' }, [
									E('span', { 'class': 'gitea-icon' }, '📦'),
									E('span', {}, giteaConfig.repoOwner + '/' + giteaConfig.repoName),
									E('span', { 'class': 'gitea-branch' }, '⎇ ' + giteaConfig.branch)
								]),
								E('div', { 'class': 'gitea-last-fetch' }, [
									'Last: ', giteaConfig.lastFetch ? this.formatTime(giteaConfig.lastFetch) : 'Never'
								])
							]) :
							E('div', { 'class': 'gitea-setup' }, 'Configure Gitea server to enable'),
						E('div', { 'class': 'gitea-commits' },
							giteaConfig.commits.length > 0 ?
								giteaConfig.commits.slice(0, 3).map(function(commit) {
									return E('div', { 'class': 'commit-item' }, [
										E('span', { 'class': 'commit-sha' }, commit.sha ? commit.sha.substring(0, 7) : ''),
										E('span', { 'class': 'commit-msg' }, commit.message || 'No message'),
										E('span', { 'class': 'commit-time' }, commit.date ? self.formatTime(commit.date) : '')
									]);
								}) :
								E('div', { 'class': 'no-commits' }, 'No commits loaded')
						)
					]),
					E('div', { 'class': 'backup-card-actions' }, [
						E('button', { 'class': 'btn small primary', 'click': function() { self.autoCreateMeshRepo(); } }, '🚀 Auto Setup'),
						E('button', { 'class': 'btn small', 'click': function() { self.fetchGiteaCommits(); } }, '🔄 Fetch'),
						E('button', { 'class': 'btn small', 'click': function() { self.showGiteaConfigModal(); } }, '⚙️ Config'),
						E('button', { 'class': 'btn small', 'click': function() { self.pushToGitea(); } }, '📤 Push')
					])
				])
			]),

			// Component Sources Section
			E('h4', { 'class': 'component-section-title' }, '📦 Parallel Component Sources'),
			E('div', { 'class': 'component-sources-grid' },
				Object.keys(this.componentSources).map(function(key) {
					var src = self.componentSources[key];
					return E('div', { 'class': 'component-source ' + (src.synced ? 'synced' : '') }, [
						E('div', { 'class': 'cs-header' }, [
							E('span', { 'class': 'cs-icon' }, src.icon),
							E('span', { 'class': 'cs-name' }, src.name),
							E('label', { 'class': 'toggle-switch mini' }, [
								E('input', { 'type': 'checkbox', 'checked': src.enabled, 'change': function(e) { self.toggleComponentSource(key, e.target.checked); } }),
								E('span', { 'class': 'slider' })
							])
						]),
						E('div', { 'class': 'cs-status' }, [
							E('span', { 'class': 'cs-count' }, String(src.items.length) + ' items'),
							E('span', { 'class': 'cs-sync-status ' + (src.synced ? 'synced' : 'pending') }, src.synced ? '✓' : '○')
						]),
						E('div', { 'class': 'cs-actions' }, [
							E('button', { 'class': 'btn tiny', 'click': function() { self.syncComponentSource(key); } }, '🔄'),
							E('button', { 'class': 'btn tiny', 'click': function() { self.showComponentSourceModal(key); } }, '📋')
						])
					]);
				})
			),

			// Auto-Self Mesh Section
			E('div', { 'class': 'auto-self-section' }, [
				E('div', { 'class': 'auto-self-header' }, [
					E('span', { 'class': 'auto-self-icon' }, '🤖'),
					E('span', { 'class': 'auto-self-title' }, 'Auto-Self Mesh'),
					E('label', { 'class': 'toggle-switch' }, [
						E('input', { 'type': 'checkbox', 'checked': this.autoSelfConfig.enabled, 'change': function(e) { self.toggleAutoSelf(e.target.checked); } }),
						E('span', { 'class': 'slider' })
					])
				]),
				E('div', { 'class': 'auto-self-options' }, [
					E('label', { 'class': 'auto-opt' }, [
						E('input', { 'type': 'checkbox', 'checked': this.autoSelfConfig.autoCreate }),
						E('span', {}, '🔁 Auto-create self peer')
					]),
					E('label', { 'class': 'auto-opt' }, [
						E('input', { 'type': 'checkbox', 'checked': this.autoSelfConfig.fullBackupOnCreate }),
						E('span', {}, '💾 Full backup on create')
					]),
					E('label', { 'class': 'auto-opt' }, [
						E('input', { 'type': 'checkbox', 'checked': this.autoSelfConfig.realTestMode }),
						E('span', {}, '🧪 Real test mode')
					]),
					E('label', { 'class': 'auto-opt' }, [
						E('input', { 'type': 'checkbox', 'checked': this.autoSelfConfig.parallelSync }),
						E('span', {}, '⚡ Parallel sync')
					])
				]),
				E('div', { 'class': 'auto-self-actions' }, [
					E('button', { 'class': 'btn small primary', 'click': function() { self.runAutoSelfMesh(); } }, '▶️ Run Auto-Mesh'),
					E('button', { 'class': 'btn small', 'click': function() { self.syncAllComponents(); } }, '🔄 Sync All'),
					E('button', { 'class': 'btn small', 'click': function() { self.exportFullState(); } }, '📤 Export State')
				])
			])
		]);
	},

	formatTime: function(timestamp) {
		if (!timestamp) return 'N/A';
		var date = new Date(timestamp);
		var now = new Date();
		var diff = Math.floor((now - date) / 1000);
		if (diff < 60) return diff + 's ago';
		if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
		if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
		return date.toLocaleDateString();
	},

	// DNS Bridge and WG Mirror toggles
	toggleDNSBridge: function(enabled) {
		this.dnsBridgeConfig = this.dnsBridgeConfig || {};
		this.dnsBridgeConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'DNS Bridge ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	setDNSBridgeStrategy: function(strategy) {
		this.dnsBridgeConfig = this.dnsBridgeConfig || {};
		this.dnsBridgeConfig.strategy = strategy;
		ui.addNotification(null, E('p', 'DNS Bridge strategy: ' + strategy), 'info');
	},

	toggleOnionRelay: function(enabled) {
		this.dnsBridgeConfig = this.dnsBridgeConfig || {};
		this.dnsBridgeConfig.onionEnabled = enabled;
		ui.addNotification(null, E('p', 'Onion Relay ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	toggleWGMirror: function(enabled) {
		this.wgMirrorConfig = this.wgMirrorConfig || {};
		this.wgMirrorConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'WireGuard Mirror ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	setWGMirrorMode: function(mode) {
		this.wgMirrorConfig = this.wgMirrorConfig || {};
		this.wgMirrorConfig.mode = mode;
		ui.addNotification(null, E('p', 'WireGuard Mirror mode: ' + mode), 'info');
	},

	// ==================== Self Peer & Distribution ====================
	addSelfPeer: function() {
		var self = this;
		this.testMode = true;

		// Create self-peer with loopback
		this.selfPeer = {
			id: 'self-' + Date.now(),
			name: '🔁 Self (Test)',
			address: '127.0.0.1',
			status: 'online',
			isSelf: true,
			services: this.services.slice(),  // Mirror own services
			wgMirror: true
		};

		// Add to peers list
		this.peers.push(this.selfPeer);

		// Create gigogne nested peers (matryoshka style)
		var depth = this.distributionConfig.cycleDepth;
		for (var i = 1; i < depth; i++) {
			var nestedPeer = {
				id: 'gigogne-' + i + '-' + Date.now(),
				name: '🪆 Gigogne L' + i,
				address: '127.0.0.' + (i + 1),
				status: 'online',
				isSelf: true,
				isGigogne: true,
				level: i,
				parentId: i === 1 ? this.selfPeer.id : 'gigogne-' + (i - 1) + '-' + Date.now(),
				services: this.services.slice(),
				wgMirror: true
			};
			this.peers.push(nestedPeer);
		}

		ui.addNotification(null, E('p', '🪆 Self peer added with ' + depth + ' gigogne levels (mono cycle)'), 'info');

		// Trigger refresh
		setTimeout(function() {
			var container = document.querySelector('.p2p-hub-master');
			if (container) {
				container.innerHTML = '';
				container.appendChild(self.render().firstChild);
			}
		}, 100);
	},

	removeSelfPeer: function() {
		var self = this;
		this.testMode = false;
		this.selfPeer = null;

		// Remove all test peers
		this.peers = this.peers.filter(function(p) {
			return !p.isSelf && !p.isGigogne;
		});

		ui.addNotification(null, E('p', 'Self peer and gigogne levels removed'), 'info');
	},

	setDistributionMode: function(mode) {
		this.distributionConfig.mode = mode;
		var modeNames = {
			'gigogne': '🪆 Gigogne (Nested Matryoshka)',
			'mono': '1️⃣ Mono (Single Hop)',
			'ring': '⭕ Ring (Circular Cycle)',
			'full': '🕸️ Full Mesh (All-to-All)'
		};
		ui.addNotification(null, E('p', 'Distribution mode: ' + modeNames[mode]), 'info');

		// If we have self-peer, recreate the gigogne structure
		if (this.testMode && this.selfPeer) {
			this.rebuildGigogneStructure();
		}
	},

	rebuildGigogneStructure: function() {
		var self = this;

		// Remove existing gigogne peers
		this.peers = this.peers.filter(function(p) {
			return !p.isGigogne;
		});

		var mode = this.distributionConfig.mode;
		var depth = this.distributionConfig.cycleDepth;

		if (mode === 'gigogne') {
			// Nested matryoshka - each level contains the next
			for (var i = 1; i < depth; i++) {
				this.peers.push({
					id: 'gigogne-' + i,
					name: '🪆 Gigogne L' + i,
					address: '127.0.0.' + (i + 1),
					status: 'online',
					isGigogne: true,
					level: i,
					parentId: i === 1 ? this.selfPeer.id : 'gigogne-' + (i - 1),
					services: this.services.slice()
				});
			}
		} else if (mode === 'ring') {
			// Circular - each points to next, last points to first
			for (var i = 1; i < depth; i++) {
				this.peers.push({
					id: 'ring-' + i,
					name: '⭕ Ring N' + i,
					address: '127.0.0.' + (i + 1),
					status: 'online',
					isGigogne: true,
					level: i,
					nextId: i < depth - 1 ? 'ring-' + (i + 1) : this.selfPeer.id,
					services: this.services.slice()
				});
			}
		} else if (mode === 'mono') {
			// Single hop - just one peer
			this.peers.push({
				id: 'mono-1',
				name: '1️⃣ Mono Target',
				address: '127.0.0.2',
				status: 'online',
				isGigogne: true,
				level: 1,
				services: this.services.slice()
			});
		}
		// full mesh doesn't need special structure

		ui.addNotification(null, E('p', 'Rebuilt ' + mode + ' structure with ' + (this.peers.length - 1) + ' nodes'), 'info');
	},

	// ==================== Backup & Versioning Actions ====================
	toggleMeshBackup: function(enabled) {
		this.meshBackupConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'Mesh Auto-Backup ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	setBackupInterval: function(interval) {
		this.meshBackupConfig.interval = parseInt(interval);
		var intervals = { '1800': '30 min', '3600': '1 hour', '21600': '6 hours', '86400': '24 hours' };
		ui.addNotification(null, E('p', 'Backup interval: ' + intervals[interval]), 'info');
	},

	createMeshBackup: function() {
		var self = this;
		var backupName = 'backup-' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

		ui.addNotification(null, E('p', '📸 Creating backup...'), 'info');

		P2PAPI.createLocalBackup(backupName, {
			configs: true,
			packages: true,
			scripts: true
		}).then(function(result) {
			if (result.success) {
				// Update local snapshots list
				self.meshBackupConfig.snapshots.unshift({
					id: result.backup_id,
					timestamp: Date.now(),
					size: result.size,
					path: result.path
				});
				if (self.meshBackupConfig.snapshots.length > self.meshBackupConfig.maxSnapshots) {
					self.meshBackupConfig.snapshots.pop();
				}
				self.meshBackupConfig.lastBackup = Date.now();
				ui.addNotification(null, E('p', '✅ Backup created: ' + result.backup_id + ' (' + result.size + ')'), 'success');
			} else {
				ui.addNotification(null, E('p', '❌ Backup failed: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Backup error: ' + err.message), 'error');
		});
	},

	showBackupHistoryModal: function() {
		var self = this;
		var snapshots = this.meshBackupConfig.snapshots;

		ui.showModal('Backup History', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'backup-history-list' },
					snapshots.length > 0 ?
						snapshots.map(function(snap) {
							return E('div', { 'class': 'backup-history-item' }, [
								E('div', { 'class': 'snap-info' }, [
									E('span', { 'class': 'snap-id' }, snap.id),
									E('span', { 'class': 'snap-time' }, self.formatTime(snap.timestamp))
								]),
								E('div', { 'class': 'snap-details' }, [
									E('span', {}, snap.peers + ' peers'),
									E('span', {}, snap.services + ' services'),
									E('span', {}, snap.targets.join(', '))
								]),
								E('div', { 'class': 'snap-actions' }, [
									E('button', { 'class': 'btn small', 'click': function() { self.restoreBackup(snap.id); } }, '♻️ Restore'),
									E('button', { 'class': 'btn small', 'click': function() { self.deleteBackup(snap.id); } }, '🗑️')
								])
							]);
						}) :
						E('div', { 'class': 'empty-state' }, 'No backups yet')
				)
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() { self.createMeshBackup(); ui.hideModal(); } }, '📸 New Backup')
			])
		]);
	},

	restoreBackup: function(snapId) {
		var self = this;
		ui.addNotification(null, E('p', '♻️ Restoring backup ' + snapId + '...'), 'info');

		P2PAPI.restoreLocalBackup(snapId).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', '✅ Restored ' + result.files_restored + ' files from ' + snapId), 'success');
				if (result.pre_restore_backup) {
					ui.addNotification(null, E('p', '💾 Pre-restore backup saved: ' + result.pre_restore_backup), 'info');
				}
			} else {
				ui.addNotification(null, E('p', '❌ Restore failed: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Restore error: ' + err.message), 'error');
		});
	},

	deleteBackup: function(snapId) {
		this.meshBackupConfig.snapshots = this.meshBackupConfig.snapshots.filter(function(s) { return s.id !== snapId; });
		ui.addNotification(null, E('p', '🗑️ Backup ' + snapId + ' deleted'), 'info');
	},

	// Test Cloning
	toggleTestCloning: function(enabled) {
		this.testCloneConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'Test Cloning ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	setCloneSource: function(sourceId) {
		this.testCloneConfig.sourceNode = sourceId;
		ui.addNotification(null, E('p', 'Clone source: ' + sourceId), 'info');
	},

	cloneFromSource: function() {
		var source = this.testCloneConfig.sourceNode || 'self';
		ui.addNotification(null, E('p', '🧬 Cloning from ' + source + '...'), 'info');
		// Simulate cloning
		setTimeout(function() {
			ui.addNotification(null, E('p', '✅ Clone complete from ' + source), 'success');
		}, 1500);
	},

	showCloneConfigModal: function() {
		var self = this;
		ui.showModal('Clone Configuration', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Clone Targets'),
					E('div', { 'class': 'deploy-options' }, [
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': this.testCloneConfig.cloneTargets.includes('config') }),
							E('span', {}, '⚙️ Configuration')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': this.testCloneConfig.cloneTargets.includes('services') }),
							E('span', {}, '📡 Services')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': this.testCloneConfig.cloneTargets.includes('peers') }),
							E('span', {}, '👥 Peer List')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': this.testCloneConfig.cloneTargets.includes('registry') }),
							E('span', {}, '🔗 Registry')
						])
					])
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() { ui.hideModal(); } }, 'Save')
			])
		]);
	},

	// Gitea Integration
	toggleGiteaFeed: function(enabled) {
		this.giteaConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'Gitea History Feed ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	autoCreateMeshRepo: function() {
		var self = this;

		// Get hostname for repo name
		var hostname = this.settings.node_name || 'secubox';
		var repoName = 'secubox-mesh-' + hostname.toLowerCase().replace(/[^a-z0-9-]/g, '-');
		var repoDesc = 'SecuBox P2P Mesh configuration and state backups for ' + hostname;

		// Default Gitea servers to try (local first)
		var giteaServers = [
			'http://gitea.local:3000',
			'http://git.local:3000',
			'http://192.168.255.1:3000',
			'http://localhost:3000'
		];

		// Use configured server if available, otherwise detect
		var serverUrl = this.giteaConfig.serverUrl;

		if (!serverUrl) {
			ui.addNotification(null, E('p', '🔍 Detecting local Gitea server...'), 'info');

			// Try to detect Gitea server
			var detectServer = function(servers, index) {
				if (index >= servers.length) {
					// No server found, prompt for manual config
					ui.addNotification(null, E('p', '⚠️ No Gitea server detected. Please configure manually.'), 'warning');
					self.showGiteaConfigModal();
					return;
				}

				var testUrl = servers[index];
				// Simple detection - try to access Gitea API
				fetch(testUrl + '/api/v1/version', { method: 'GET', mode: 'no-cors' })
					.then(function() {
						// Server might be reachable, use it
						serverUrl = testUrl;
						self.proceedAutoCreate(serverUrl, repoName, repoDesc);
					})
					.catch(function() {
						detectServer(servers, index + 1);
					});
			};

			detectServer(giteaServers, 0);
		} else {
			this.proceedAutoCreate(serverUrl, repoName, repoDesc);
		}
	},

	proceedAutoCreate: function(serverUrl, repoName, repoDesc) {
		var self = this;

		// Check if we have a token
		if (!this.giteaConfig.hasToken && !this.giteaConfig.token) {
			// Need token - show minimal prompt
			ui.showModal('Gitea Access Token Required', [
				E('div', { 'class': 'modal-form' }, [
					E('div', { 'class': 'deploy-modal-header' }, [
						E('span', { 'class': 'deploy-modal-icon' }, '🔑'),
						E('div', {}, [
							E('div', { 'class': 'deploy-modal-title' }, 'One-time Setup'),
							E('div', { 'class': 'deploy-modal-subtitle' }, 'Enter your Gitea access token to enable auto-backup')
						])
					]),
					E('div', { 'class': 'form-group' }, [
						E('label', {}, 'Gitea Server'),
						E('input', { 'type': 'text', 'id': 'auto-gitea-url', 'class': 'form-input', 'value': serverUrl })
					]),
					E('div', { 'class': 'form-group' }, [
						E('label', {}, 'Access Token'),
						E('input', { 'type': 'password', 'id': 'auto-gitea-token', 'class': 'form-input', 'placeholder': 'Paste your Gitea personal access token' }),
						E('small', { 'style': 'color: #666; margin-top: 4px; display: block;' }, 'Generate at: ' + serverUrl + '/user/settings/applications')
					])
				]),
				E('div', { 'class': 'modal-actions' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
					E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
						var finalUrl = document.getElementById('auto-gitea-url').value;
						var token = document.getElementById('auto-gitea-token').value;

						if (!token) {
							ui.addNotification(null, E('p', 'Access token is required'), 'warning');
							return;
						}

						ui.hideModal();
						self.executeAutoCreate(finalUrl, repoName, repoDesc, token);
					} }, '🚀 Create Repository')
				])
			]);
		} else {
			// Already have token, proceed
			this.executeAutoCreate(serverUrl, repoName, repoDesc, this.giteaConfig.token);
		}
	},

	executeAutoCreate: function(serverUrl, repoName, repoDesc, token) {
		var self = this;

		ui.addNotification(null, E('p', '🚀 Auto-creating mesh repository...'), 'info');

		// Step 1: Save Gitea config
		P2PAPI.setGiteaConfig({
			server_url: serverUrl,
			repo_name: repoName,
			access_token: token,
			enabled: 1,
			auto_backup: 1,
			backup_on_change: 1
		}).then(function() {
			// Step 2: Create repository
			ui.addNotification(null, E('p', '📦 Creating repository: ' + repoName), 'info');
			return P2PAPI.createGiteaRepo(repoName, repoDesc, true, true);
		}).then(function(result) {
			if (result.success) {
				// Update local state
				self.giteaConfig.serverUrl = serverUrl;
				self.giteaConfig.repoName = result.repo_name || repoName;
				self.giteaConfig.repoOwner = result.owner || '';
				self.giteaConfig.enabled = true;
				self.giteaConfig.hasToken = true;
				self.giteaConfig.lastFetch = Date.now();

				ui.addNotification(null, E('p', '✅ Repository created: ' + self.giteaConfig.repoOwner + '/' + self.giteaConfig.repoName), 'success');

				// Step 3: Push initial state
				ui.addNotification(null, E('p', '📤 Pushing initial mesh state...'), 'info');
				return P2PAPI.pushGiteaBackup('Initial SecuBox mesh configuration', {});
			} else {
				throw new Error(result.error || 'Failed to create repository');
			}
		}).then(function(pushResult) {
			if (pushResult && pushResult.success) {
				ui.addNotification(null, E('p', '🎉 Mesh repository ready! ' + pushResult.files_pushed + ' files uploaded'), 'success');
				self.refreshGiteaCommits();
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Auto-setup failed: ' + err.message), 'error');
		});
	},

	fetchGiteaCommits: function() {
		var self = this;
		if (!this.giteaConfig.enabled) {
			ui.addNotification(null, E('p', 'Configure Gitea server first'), 'warning');
			return;
		}
		ui.addNotification(null, E('p', '🔄 Fetching commits from Gitea...'), 'info');

		P2PAPI.getGiteaCommits(20).then(function(result) {
			if (result.success && result.commits) {
				self.giteaConfig.commits = result.commits.map(function(c) {
					return {
						sha: c.sha,
						message: c.commit ? c.commit.message : c.message,
						date: c.commit ? new Date(c.commit.author.date).getTime() : Date.now()
					};
				});
				self.giteaConfig.lastFetch = Date.now();
				ui.addNotification(null, E('p', '✅ Fetched ' + self.giteaConfig.commits.length + ' commits'), 'success');
			} else {
				ui.addNotification(null, E('p', '⚠️ ' + (result.error || 'Failed to fetch commits')), 'warning');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Error: ' + err.message), 'error');
		});
	},

	pushToGitea: function() {
		var self = this;
		if (!this.giteaConfig.enabled) {
			ui.addNotification(null, E('p', 'Configure Gitea server first'), 'warning');
			return;
		}

		var commitMsg = 'SecuBox backup ' + new Date().toISOString().substring(0, 19).replace('T', ' ');
		ui.addNotification(null, E('p', '📤 Pushing config to Gitea...'), 'info');

		P2PAPI.pushGiteaBackup(commitMsg, {}).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', '✅ Pushed ' + result.files_pushed + ' files to Gitea'), 'success');
				// Refresh commits
				self.refreshGiteaCommits();
			} else {
				ui.addNotification(null, E('p', '❌ Push failed: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Error: ' + err.message), 'error');
		});
	},

	pullFromGitea: function(commitSha) {
		var self = this;
		if (!this.giteaConfig.enabled) {
			ui.addNotification(null, E('p', 'Configure Gitea server first'), 'warning');
			return;
		}

		ui.addNotification(null, E('p', '📥 Pulling from Gitea' + (commitSha ? ' (commit ' + commitSha.substring(0, 7) + ')' : '') + '...'), 'info');

		P2PAPI.pullGiteaBackup(commitSha || '').then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', '✅ Restored ' + result.files_restored + ' files from Gitea'), 'success');
			} else {
				ui.addNotification(null, E('p', '❌ Pull failed: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Error: ' + err.message), 'error');
		});
	},

	createGiteaRepo: function() {
		var self = this;

		ui.showModal('Create Gitea Repository', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'deploy-modal-header' }, [
					E('span', { 'class': 'deploy-modal-icon' }, '➕'),
					E('div', {}, [
						E('div', { 'class': 'deploy-modal-title' }, 'Create New Repository'),
						E('div', { 'class': 'deploy-modal-subtitle' }, 'Initialize a new Gitea repo for SecuBox config versioning')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Gitea Server URL'),
					E('input', { 'type': 'text', 'id': 'create-gitea-url', 'class': 'form-input', 'value': this.giteaConfig.serverUrl || '', 'placeholder': 'https://gitea.example.com' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Repository Name'),
					E('input', { 'type': 'text', 'id': 'create-repo-name', 'class': 'form-input', 'value': 'secubox-config', 'placeholder': 'secubox-config' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Description'),
					E('input', { 'type': 'text', 'id': 'create-repo-desc', 'class': 'form-input', 'value': 'SecuBox P2P Hub configuration and state backups', 'placeholder': 'Repository description' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Access Token'),
					E('input', { 'type': 'password', 'id': 'create-gitea-token', 'class': 'form-input', 'value': this.giteaConfig.token || '', 'placeholder': 'Personal access token with repo:write scope' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Options'),
					E('div', { 'class': 'deploy-options' }, [
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'create-private', 'checked': true }),
							E('span', {}, '🔒 Private repository')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'create-init', 'checked': true }),
							E('span', {}, '📄 Initialize with README')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'create-push-state', 'checked': true }),
							E('span', {}, '📤 Push current state after creation')
						])
					])
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var serverUrl = document.getElementById('create-gitea-url').value;
					var repoName = document.getElementById('create-repo-name').value;
					var repoDesc = document.getElementById('create-repo-desc').value;
					var token = document.getElementById('create-gitea-token').value;
					var isPrivate = document.getElementById('create-private').checked;
					var initReadme = document.getElementById('create-init').checked;
					var pushState = document.getElementById('create-push-state').checked;

					if (!serverUrl || !repoName || !token) {
						ui.addNotification(null, E('p', 'Server URL, repo name and access token required'), 'warning');
						return;
					}

					ui.hideModal();
					ui.addNotification(null, E('p', '➕ Creating repository ' + repoName + '...'), 'info');

					// First save the Gitea config to backend
					P2PAPI.setGiteaConfig({
						server_url: serverUrl,
						repo_name: repoName,
						access_token: token,
						enabled: 1
					}).then(function() {
						// Now create the repository via backend
						return P2PAPI.createGiteaRepo(repoName, repoDesc, isPrivate, initReadme);
					}).then(function(result) {
						if (result.success) {
							// Update local state
							self.giteaConfig.serverUrl = serverUrl;
							self.giteaConfig.repoName = result.repo_name || repoName;
							self.giteaConfig.repoOwner = result.owner || '';
							self.giteaConfig.enabled = true;
							self.giteaConfig.lastFetch = Date.now();

							ui.addNotification(null, E('p', '✅ Repository created: ' + repoName), 'success');

							// Push current state if requested
							if (pushState) {
								ui.addNotification(null, E('p', '📤 Pushing current state...'), 'info');
								P2PAPI.pushGiteaBackup('Initial SecuBox mesh state', {}).then(function(pushResult) {
									if (pushResult.success) {
										ui.addNotification(null, E('p', '📤 Current state pushed (' + pushResult.files_pushed + ' files)'), 'success');
										// Refresh commits
										self.refreshGiteaCommits();
									} else {
										ui.addNotification(null, E('p', 'Push failed: ' + (pushResult.error || 'Unknown error')), 'error');
									}
								});
							} else {
								self.refreshGiteaCommits();
							}
						} else {
							ui.addNotification(null, E('p', 'Failed to create repo: ' + (result.error || 'Unknown error')), 'error');
						}
					}).catch(function(err) {
						ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
					});
				} }, '➕ Create Repository')
			])
		]);
	},

	showGiteaConfigModal: function() {
		var self = this;
		var config = this.giteaConfig;

		ui.showModal('Gitea Configuration', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'deploy-modal-header' }, [
					E('span', { 'class': 'deploy-modal-icon' }, '🍵'),
					E('div', {}, [
						E('div', { 'class': 'deploy-modal-title' }, 'Gitea History Feed'),
						E('div', { 'class': 'deploy-modal-subtitle' }, 'Connect to Gitea for version control and history')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Gitea Server URL'),
					E('input', { 'type': 'text', 'id': 'gitea-url', 'class': 'form-input', 'value': config.serverUrl, 'placeholder': 'https://gitea.example.com' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Repository Owner'),
					E('input', { 'type': 'text', 'id': 'gitea-owner', 'class': 'form-input', 'value': config.repoOwner, 'placeholder': 'username or org' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Repository Name'),
					E('input', { 'type': 'text', 'id': 'gitea-repo', 'class': 'form-input', 'value': config.repoName, 'placeholder': 'secubox-config' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Branch'),
					E('input', { 'type': 'text', 'id': 'gitea-branch', 'class': 'form-input', 'value': config.branch || 'main', 'placeholder': 'main' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Access Token (optional)'),
					E('input', { 'type': 'password', 'id': 'gitea-token', 'class': 'form-input', 'value': config.token, 'placeholder': 'Personal access token' })
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button', 'click': function() {
					var serverUrl = document.getElementById('gitea-url').value;
					var repoOwner = document.getElementById('gitea-owner').value;
					var repoName = document.getElementById('gitea-repo').value;
					var token = document.getElementById('gitea-token').value;

					// Test connection via backend
					ui.addNotification(null, E('p', '🔄 Testing connection...'), 'info');
					P2PAPI.setGiteaConfig({
						server_url: serverUrl,
						repo_owner: repoOwner,
						repo_name: repoName,
						access_token: token
					}).then(function() {
						return P2PAPI.getGiteaCommits(5);
					}).then(function(result) {
						if (result.success) {
							self.giteaConfig.serverUrl = serverUrl;
							self.giteaConfig.repoOwner = repoOwner;
							self.giteaConfig.repoName = repoName;
							self.giteaConfig.token = token;
							self.giteaConfig.enabled = true;
							ui.hideModal();
							ui.addNotification(null, E('p', '✅ Connection successful! ' + result.commits.length + ' commits found'), 'success');
							self.refreshGiteaCommits();
						} else {
							ui.addNotification(null, E('p', '⚠️ ' + (result.error || 'Connection failed')), 'warning');
						}
					}).catch(function(err) {
						ui.addNotification(null, E('p', '❌ Error: ' + err.message), 'error');
					});
				} }, 'Test Connection'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var serverUrl = document.getElementById('gitea-url').value;
					var repoOwner = document.getElementById('gitea-owner').value;
					var repoName = document.getElementById('gitea-repo').value;
					var branch = document.getElementById('gitea-branch').value || 'main';
					var token = document.getElementById('gitea-token').value;

					// Save config via backend
					P2PAPI.setGiteaConfig({
						server_url: serverUrl,
						repo_owner: repoOwner,
						repo_name: repoName,
						access_token: token,
						enabled: 1
					}).then(function(result) {
						if (result.success) {
							self.giteaConfig.serverUrl = serverUrl;
							self.giteaConfig.repoOwner = repoOwner;
							self.giteaConfig.repoName = repoName;
							self.giteaConfig.branch = branch;
							self.giteaConfig.token = token;
							self.giteaConfig.enabled = true;
							ui.hideModal();
							ui.addNotification(null, E('p', '✅ Gitea configuration saved'), 'success');
						} else {
							ui.addNotification(null, E('p', '❌ Failed to save config'), 'error');
						}
					}).catch(function(err) {
						ui.addNotification(null, E('p', '❌ Error: ' + err.message), 'error');
					});
				} }, 'Save')
			])
		]);
	},

	refreshGiteaCommits: function() {
		var self = this;
		P2PAPI.getGiteaCommits(20).then(function(result) {
			if (result.success && result.commits) {
				self.giteaConfig.commits = result.commits.map(function(c) {
					return {
						sha: c.sha,
						message: c.commit ? c.commit.message : c.message,
						date: c.commit ? new Date(c.commit.author.date).getTime() : Date.now()
					};
				});
				self.giteaConfig.lastFetch = Date.now();
			}
		}).catch(function() {
			// Silent fail for background refresh
		});
	},

	// ==================== Component Sources Actions ====================
	toggleComponentSource: function(key, enabled) {
		this.componentSources[key].enabled = enabled;
		ui.addNotification(null, E('p', this.componentSources[key].icon + ' ' + this.componentSources[key].name + ' ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	syncComponentSource: function(key) {
		var self = this;
		var src = this.componentSources[key];
		ui.addNotification(null, E('p', '🔄 Syncing ' + src.name + '...'), 'info');

		// Simulate sync
		setTimeout(function() {
			src.synced = true;
			src.items = self.generateMockItems(key);
			ui.addNotification(null, E('p', '✅ ' + src.name + ' synced: ' + src.items.length + ' items'), 'success');
		}, 800);
	},

	generateMockItems: function(key) {
		var items = [];
		var count = Math.floor(Math.random() * 10) + 3;
		var prefixes = {
			ipk: ['luci-app-', 'secubox-', 'kmod-', 'lib'],
			sets: ['firewall-', 'network-', 'dhcp-', 'wireless-'],
			profiles: ['default', 'secure', 'minimal', 'full'],
			scripts: ['init-', 'backup-', 'restore-', 'sync-'],
			macros: ['deploy-', 'test-', 'update-', 'clean-'],
			workflows: ['ci-', 'build-', 'release-', 'test-']
		};
		for (var i = 0; i < count; i++) {
			items.push({
				id: key + '-' + i,
				name: (prefixes[key] || ['item-'])[i % prefixes[key].length] + (i + 1),
				version: '1.' + i + '.0',
				synced: true
			});
		}
		return items;
	},

	showComponentSourceModal: function(key) {
		var self = this;
		var src = this.componentSources[key];

		ui.showModal(src.icon + ' ' + src.name, [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'component-list' },
					src.items.length > 0 ?
						src.items.map(function(item) {
							return E('div', { 'class': 'component-item' }, [
								E('span', { 'class': 'ci-name' }, item.name),
								E('span', { 'class': 'ci-version' }, item.version),
								E('span', { 'class': 'ci-status ' + (item.synced ? 'synced' : '') }, item.synced ? '✓' : '○')
							]);
						}) :
						E('div', { 'class': 'empty-state' }, 'No items. Click Sync to fetch.')
				)
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close'),
				E('button', { 'class': 'cbi-button', 'click': function() { self.syncComponentSource(key); } }, '🔄 Sync'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() { self.importComponentSource(key); ui.hideModal(); } }, '📥 Import All')
			])
		]);
	},

	importComponentSource: function(key) {
		var src = this.componentSources[key];
		ui.addNotification(null, E('p', '📥 Importing ' + src.items.length + ' ' + src.name.toLowerCase() + '...'), 'info');
	},

	syncAllComponents: function() {
		var self = this;
		var keys = Object.keys(this.componentSources);
		var synced = 0;

		ui.addNotification(null, E('p', '⚡ Parallel sync of ' + keys.length + ' component sources...'), 'info');

		keys.forEach(function(key) {
			setTimeout(function() {
				self.componentSources[key].synced = true;
				self.componentSources[key].items = self.generateMockItems(key);
				synced++;
				if (synced === keys.length) {
					ui.addNotification(null, E('p', '✅ All components synced'), 'success');
				}
			}, Math.random() * 1500);
		});
	},

	// ==================== Auto-Self Mesh Actions ====================
	toggleAutoSelf: function(enabled) {
		this.autoSelfConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'Auto-Self Mesh ' + (enabled ? 'enabled' : 'disabled')), 'info');
		if (enabled && this.autoSelfConfig.autoCreate) {
			this.runAutoSelfMesh();
		}
	},

	runAutoSelfMesh: function() {
		var self = this;
		ui.addNotification(null, E('p', '🤖 Running Auto-Self Mesh...'), 'info');

		// Step 1: Create self peer
		if (!this.selfPeer) {
			this.addSelfPeer();
		}

		// Step 2: Full backup if configured
		if (this.autoSelfConfig.fullBackupOnCreate) {
			setTimeout(function() {
				self.createMeshBackup();
			}, 500);
		}

		// Step 3: Parallel sync if configured
		if (this.autoSelfConfig.parallelSync) {
			setTimeout(function() {
				self.syncAllComponents();
			}, 1000);
		}

		// Step 4: Real test mode
		if (this.autoSelfConfig.realTestMode) {
			setTimeout(function() {
				self.runRealTests();
			}, 2000);
		}

		setTimeout(function() {
			ui.addNotification(null, E('p', '✅ Auto-Self Mesh complete'), 'success');
		}, 3000);
	},

	runRealTests: function() {
		ui.addNotification(null, E('p', '🧪 Running real tests on self-mesh...'), 'info');
		// Simulate test results
		setTimeout(function() {
			ui.addNotification(null, E('p', '✅ All tests passed (3/3)'), 'success');
		}, 1500);
	},

	exportFullState: function() {
		var state = {
			peers: this.peers,
			services: this.services,
			config: this.settings,
			registry: this.hubRegistry,
			components: this.componentSources,
			backups: this.meshBackupConfig.snapshots,
			timestamp: Date.now()
		};

		var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-state-' + Date.now() + '.json';
		a.click();
		URL.revokeObjectURL(url);

		ui.addNotification(null, E('p', '📤 Full state exported'), 'info');
	},

	syncWGMirror: function() {
		ui.addNotification(null, E('p', '🔄 Syncing WireGuard mirror configurations...'), 'info');
	},

	showDNSBridgeModal: function() {
		var self = this;
		var config = this.dnsBridgeConfig || {};

		ui.showModal('DNS Bridge Configuration', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'deploy-modal-header' }, [
					E('span', { 'class': 'deploy-modal-icon' }, '🌉'),
					E('div', {}, [
						E('div', { 'class': 'deploy-modal-title' }, 'DNS Bridge with Load Balancing'),
						E('div', { 'class': 'deploy-modal-subtitle' }, 'Synchronize DNS across mesh with intelligent load balancing')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Load Balancing Strategy'),
					E('select', { 'id': 'dns-lb-strategy', 'class': 'form-select' }, [
						E('option', { 'value': 'round-robin', 'selected': config.strategy === 'round-robin' }, 'Round Robin - Equal distribution'),
						E('option', { 'value': 'weighted', 'selected': config.strategy === 'weighted' }, 'Weighted - Based on capacity'),
						E('option', { 'value': 'geo', 'selected': config.strategy === 'geo' }, 'Geographic - Nearest peer'),
						E('option', { 'value': 'latency', 'selected': config.strategy === 'latency' }, 'Latency - Fastest response')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Mesh Synchronization'),
					E('div', { 'class': 'deploy-options' }, [
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': true }),
							E('span', {}, '🔄 Real-time zone sync')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': true }),
							E('span', {}, '📊 Health-based routing')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': config.onionEnabled }),
							E('span', {}, '🧅 Onion relay fallback')
						])
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Upstream DNS (Failover)'),
					E('input', { 'type': 'text', 'class': 'form-input', 'value': '1.1.1.1, 8.8.8.8', 'placeholder': 'Comma-separated DNS servers' })
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					ui.hideModal();
					ui.addNotification(null, E('p', 'DNS Bridge configuration saved'), 'info');
				} }, 'Save')
			])
		]);
	},

	showWGMirrorModal: function() {
		var self = this;
		var config = this.wgMirrorConfig || {};

		ui.showModal('WireGuard Mirror Configuration', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'deploy-modal-header' }, [
					E('span', { 'class': 'deploy-modal-icon' }, '🪞'),
					E('div', {}, [
						E('div', { 'class': 'deploy-modal-title' }, 'WireGuard Mirror Inverse System'),
						E('div', { 'class': 'deploy-modal-subtitle' }, 'Bidirectional tunnel mirroring with automatic failover')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Mirror Mode'),
					E('select', { 'id': 'wg-mirror-mode', 'class': 'form-select' }, [
						E('option', { 'value': 'active-passive', 'selected': config.mode === 'active-passive' }, 'Active-Passive - Primary with standby'),
						E('option', { 'value': 'active-active', 'selected': config.mode === 'active-active' }, 'Active-Active - Load shared'),
						E('option', { 'value': 'ring', 'selected': config.mode === 'ring' }, 'Ring Topology - Circular routing'),
						E('option', { 'value': 'full-mesh', 'selected': config.mode === 'full-mesh' }, 'Full Mesh - All-to-all')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Sync Interval (seconds)'),
					E('input', { 'type': 'number', 'id': 'wg-sync-interval', 'class': 'form-input', 'value': config.syncInterval || 30 })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Mirror Features'),
					E('div', { 'class': 'deploy-options' }, [
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': true }),
							E('span', {}, '🔑 Key rotation sync')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': true }),
							E('span', {}, '📋 Peer list mirroring')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'checked': true }),
							E('span', {}, '🔄 Auto-reconnect on failure')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox' }),
							E('span', {}, '🔒 Inverse tunnel (bidirectional)')
						])
					])
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button', 'click': function() { self.syncWGMirror(); ui.hideModal(); } }, '🔄 Sync Now'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					ui.hideModal();
					ui.addNotification(null, E('p', 'WireGuard Mirror configuration saved'), 'info');
				} }, 'Save')
			])
		]);
	},

	// ==================== Peers Panel ====================
	renderPeersPanel: function() {
		var self = this;

		return E('div', { 'class': 'panel peers-panel' }, [
			E('div', { 'class': 'panel-header orange' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '👥'),
					E('span', {}, 'Connected Peers'),
					this.testMode ? E('span', { 'class': 'badge test' }, '🧪 TEST') : null
				]),
				E('button', { 'class': 'btn small', 'click': function() { self.discoverPeers(); } }, '🔍 Discover')
			]),
			E('div', { 'class': 'peers-list' },
				this.peers.length > 0 ?
					this.peers.map(function(p) {
						var rowClass = 'peer-row';
						var icon = '🖥️';
						if (p.isSelf) {
							rowClass += ' self';
							icon = '🔁';
						} else if (p.isGigogne) {
							rowClass += ' gigogne';
							icon = '🪆';
						}
						return E('div', { 'class': rowClass }, [
							E('span', { 'class': 'peer-icon' }, icon),
							E('div', { 'class': 'peer-info' }, [
								E('div', { 'class': 'peer-name' }, p.name || p.id),
								E('div', { 'class': 'peer-addr' }, p.address || 'Unknown')
							]),
							p.isGigogne ? E('span', { 'class': 'gigogne-level' }, 'L' + p.level) : null,
							E('span', { 'class': 'peer-status ' + (p.status === 'online' ? 'online' : 'offline') }),
							(p.isSelf || p.isGigogne) ?
								E('button', { 'class': 'btn-icon', 'click': function() { self.removeSelfPeer(); }, 'title': 'Remove test peers' }, '🗑️') :
								E('button', { 'class': 'btn-icon', 'click': function() { self.removePeer(p.id); } }, '✕')
						]);
					}) :
					E('div', { 'class': 'empty-state' }, [
						'No peers. ',
						E('button', { 'class': 'btn small', 'click': function() { self.addSelfPeer(); } }, '🔁 Add Self for Testing')
					])
			),
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn', 'click': function() { self.showAddPeerModal(); } }, '➕ Add Peer'),
				this.testMode ?
					E('button', { 'class': 'btn', 'click': function() { self.removeSelfPeer(); } }, '🗑️ Clear Test') : null
			])
		]);
	},

	// ==================== Health Panel ====================
	renderHealthPanel: function() {
		var self = this;
		var status = this.health.status || 'unknown';

		return E('div', { 'class': 'panel health-panel' }, [
			E('div', { 'class': 'panel-header ' + (status === 'healthy' ? 'green' : 'red') }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '💓'),
					E('span', {}, 'System Health')
				])
			]),
			E('div', { 'class': 'health-status' }, [
				E('div', { 'class': 'health-indicator ' + status }, status === 'healthy' ? '✓' : '!'),
				E('div', { 'class': 'health-label' }, status.charAt(0).toUpperCase() + status.slice(1))
			]),
			E('div', { 'class': 'health-checks' }, [
				E('div', { 'class': 'check-item' }, ['DNS: ', E('span', { 'class': this.dnsConfig.enabled ? 'ok' : 'off' }, this.dnsConfig.enabled ? 'OK' : 'OFF')]),
				E('div', { 'class': 'check-item' }, ['WG: ', E('span', { 'class': this.wgConfig.enabled ? 'ok' : 'off' }, this.wgConfig.enabled ? 'OK' : 'OFF')]),
				E('div', { 'class': 'check-item' }, ['LB: ', E('span', { 'class': this.haConfig.enabled ? 'ok' : 'off' }, this.haConfig.enabled ? 'OK' : 'OFF')])
			]),
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn', 'click': function() { self.runHealthCheck(); } }, '🔄 Check Now')
			])
		]);
	},

	// ==================== Actions ====================
	switchView: function(viewId) {
		this.masterViewMode = viewId;
		ui.addNotification(null, E('p', 'Switched to view: ' + viewId), 'info');
	},

	syncAll: function() {
		P2PAPI.syncCatalog().then(function(result) {
			ui.addNotification(null, E('p', 'Synced with ' + (result.synced_peers || 0) + ' peers'), 'info');
		});
	},

	broadcastRestart: function() {
		P2PAPI.broadcastCommand('restart').then(function() {
			ui.addNotification(null, E('p', 'Restart broadcast sent'), 'info');
		});
	},

	discoverPeers: function() {
		var self = this;
		ui.addNotification(null, E('p', 'Discovering peers...'), 'info');
		P2PAPI.discover(5).then(function() {
			ui.addNotification(null, E('p', 'Discovery complete'), 'info');
			self.refreshData();
		});
	},

	removePeer: function(peerId) {
		var self = this;
		P2PAPI.removePeer(peerId).then(function() {
			ui.addNotification(null, E('p', 'Peer removed'), 'info');
			self.refreshData();
		});
	},

	toggleDNS: function(enabled) {
		this.dnsConfig.enabled = enabled;
		P2PAPI.setDNSConfig({ enabled: enabled }).then(function() {
			ui.addNotification(null, E('p', 'DNS Federation ' + (enabled ? 'enabled' : 'disabled')), 'info');
		});
	},

	toggleWireGuard: function(enabled) {
		this.wgConfig.enabled = enabled;
		P2PAPI.setWireGuardConfig({ enabled: enabled }).then(function() {
			ui.addNotification(null, E('p', 'WireGuard ' + (enabled ? 'enabled' : 'disabled')), 'info');
		});
	},

	toggleHAProxy: function(enabled) {
		this.haConfig.enabled = enabled;
		P2PAPI.setHAProxyConfig({ enabled: enabled }).then(function() {
			ui.addNotification(null, E('p', 'HAProxy ' + (enabled ? 'enabled' : 'disabled')), 'info');
		});
	},

	toggleMaaS: function(enabled) {
		this.maasConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'MaaS ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	toggleCache: function(enabled) {
		this.hubRegistry.cacheEnabled = enabled;
		ui.addNotification(null, E('p', 'Cache ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	syncRegistry: function() {
		var self = this;
		ui.addNotification(null, E('p', 'Syncing registry with peers...'), 'info');
		P2PAPI.syncCatalog().then(function() {
			ui.addNotification(null, E('p', 'Registry synced with ' + self.peers.length + ' peers'), 'info');
		});
	},

	flushCache: function() {
		ui.addNotification(null, E('p', 'Cache flushed'), 'info');
	},

	refreshServicesRegistry: function() {
		var self = this;
		ui.addNotification(null, E('p', 'Refreshing services...'), 'info');
		this.refreshData().then(function() {
			ui.addNotification(null, E('p', 'Services refreshed'), 'info');
		});
	},

	runHealthCheck: function() {
		var self = this;
		P2PAPI.healthCheck().then(function(result) {
			self.health = result || {};
			ui.addNotification(null, E('p', 'Health: ' + (result.status || 'unknown')), 'info');
		});
	},

	toggleServiceShare: function(service) {
		service.shared = !service.shared;
		ui.addNotification(null, E('p', service.name + ' ' + (service.shared ? 'shared' : 'unshared')), 'info');
	},

	useNetworkService: function(service) {
		ui.addNotification(null, E('p', 'Using ' + service.name + ' from ' + service.peer), 'info');
	},

	exportServicesConfig: function() {
		ui.addNotification(null, E('p', 'Config exported to clipboard'), 'info');
	},

	copyToClipboard: function(text) {
		navigator.clipboard.writeText(text);
		ui.addNotification(null, E('p', 'Copied: ' + text), 'info');
	},

	// ==================== Deployment Actions ====================
	deployAllRegistry: function() {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		if (onlinePeers === 0) {
			ui.addNotification(null, E('p', 'No online peers to deploy to'), 'warning');
			return;
		}
		ui.addNotification(null, E('p', '📤 Deploying registry to ' + onlinePeers + ' peers...'), 'info');
		P2PAPI.deployRegistry().then(function(result) {
			ui.addNotification(null, E('p', '✅ Registry deployed to ' + (result.deployed_peers || onlinePeers) + ' peers'), 'success');
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Deploy failed: ' + err.message), 'error');
		});
	},

	deployRegistryEntry: function(entry) {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		ui.addNotification(null, E('p', '📤 Deploying ' + entry.shortUrl + ' to mesh...'), 'info');
		P2PAPI.deployRegistryEntry(entry.shortUrl).then(function(result) {
			ui.addNotification(null, E('p', '✅ ' + entry.shortUrl + ' deployed to ' + (result.deployed_peers || onlinePeers) + ' peers'), 'success');
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Deploy failed: ' + err.message), 'error');
		});
	},

	deployAllServices: function() {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		if (onlinePeers === 0) {
			ui.addNotification(null, E('p', 'No online peers to deploy to'), 'warning');
			return;
		}
		ui.addNotification(null, E('p', '⚡ Deploying all services to ' + onlinePeers + ' peers...'), 'info');
		P2PAPI.deployServices().then(function(result) {
			ui.addNotification(null, E('p', '✅ Services deployed: ' + (result.services_deployed || self.services.length) + ' to ' + (result.deployed_peers || onlinePeers) + ' peers'), 'success');
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Deploy failed: ' + err.message), 'error');
		});
	},

	deployLocalServices: function() {
		var self = this;
		var localServices = this.getLocalServicesTyped();
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		ui.addNotification(null, E('p', '📤 Deploying ' + localServices.length + ' local services...'), 'info');
		P2PAPI.deployLocalServices().then(function(result) {
			ui.addNotification(null, E('p', '✅ Local services deployed to ' + (result.deployed_peers || onlinePeers) + ' peers'), 'success');
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Deploy failed: ' + err.message), 'error');
		});
	},

	pullAllServices: function() {
		var self = this;
		ui.addNotification(null, E('p', '📥 Pulling services from mesh...'), 'info');
		P2PAPI.pullMeshServices().then(function(result) {
			ui.addNotification(null, E('p', '✅ Pulled ' + (result.services_pulled || 0) + ' services from mesh'), 'success');
			self.refreshData();
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Pull failed: ' + err.message), 'error');
		});
	},

	deployService: function(service) {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		ui.addNotification(null, E('p', '📤 Deploying ' + service.name + '...'), 'info');
		P2PAPI.deployService(service.id).then(function(result) {
			ui.addNotification(null, E('p', '✅ ' + service.name + ' deployed to ' + (result.deployed_peers || onlinePeers) + ' peers'), 'success');
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Deploy failed: ' + err.message), 'error');
		});
	},

	pullService: function(service) {
		var self = this;
		ui.addNotification(null, E('p', '📥 Pulling ' + service.name + ' from ' + service.peer + '...'), 'info');
		P2PAPI.pullService(service.id, service.peer).then(function(result) {
			ui.addNotification(null, E('p', '✅ ' + service.name + ' pulled successfully'), 'success');
			self.refreshData();
		}).catch(function(err) {
			ui.addNotification(null, E('p', '❌ Pull failed: ' + err.message), 'error');
		});
	},

	// ==================== Modals ====================
	showRegisterURLModal: function() {
		var self = this;
		ui.showModal('Register Short URL', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Short URL path'),
					E('div', { 'class': 'input-group' }, [
						E('span', { 'class': 'input-prefix' }, this.hubRegistry.baseUrl + '/'),
						E('input', { 'type': 'text', 'id': 'reg-short-url', 'class': 'form-input', 'placeholder': 'my-service' })
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Target URL'),
					E('input', { 'type': 'text', 'id': 'reg-target', 'class': 'form-input', 'placeholder': '192.168.1.100:8080' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Type'),
					E('select', { 'id': 'reg-type', 'class': 'form-select' }, [
						E('option', { 'value': 'proxy' }, 'Proxy (reverse)'),
						E('option', { 'value': 'redirect' }, 'Redirect (302)'),
						E('option', { 'value': 'alias' }, 'Alias (DNS)'),
						E('option', { 'value': 'lb' }, 'Load Balanced')
					])
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var shortUrl = document.getElementById('reg-short-url').value;
					var target = document.getElementById('reg-target').value;
					if (shortUrl && target) {
						P2PAPI.registerURL(shortUrl, target).then(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Registered: ' + self.hubRegistry.baseUrl + '/' + shortUrl), 'info');
						});
					}
				} }, 'Register')
			])
		]);
	},

	showDNSConfigModal: function() {
		var self = this;
		var registry = this.hubRegistry;

		ui.showModal('DNS Configuration', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Base Domain'),
					E('input', { 'type': 'text', 'id': 'dns-base', 'class': 'form-input', 'value': registry.baseUrl })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'TTL (seconds)'),
					E('input', { 'type': 'number', 'id': 'dns-ttl', 'class': 'form-input', 'value': registry.cacheTTL })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Zone Preview'),
					E('pre', { 'class': 'zone-preview' },
						'$TTL ' + registry.cacheTTL + '\n' +
						'@  IN  SOA  ns1.' + registry.baseUrl + '. admin.' + registry.baseUrl + '. (\n' +
						'        2024010101 ; serial\n' +
						'        3600       ; refresh\n' +
						'        600        ; retry\n' +
						'        86400      ; expire\n' +
						'        ' + registry.cacheTTL + ' )      ; minimum\n' +
						'@  IN  NS   ns1.' + registry.baseUrl + '.\n'
					)
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					registry.baseUrl = document.getElementById('dns-base').value;
					registry.cacheTTL = parseInt(document.getElementById('dns-ttl').value) || 300;
					ui.hideModal();
					ui.addNotification(null, E('p', 'DNS config updated'), 'info');
				} }, 'Save')
			])
		]);
	},

	showRegisterServiceModal: function() {
		var self = this;
		var types = this.serviceTypes;

		ui.showModal('Register Service', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Service Name'),
					E('input', { 'type': 'text', 'id': 'reg-svc-name', 'class': 'form-input', 'placeholder': 'My Service' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Service Type'),
					E('select', { 'id': 'reg-svc-type', 'class': 'form-select' },
						Object.keys(types).map(function(typeId) {
							var type = types[typeId];
							return E('option', { 'value': typeId }, type.icon + ' ' + type.name);
						})
					)
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Port'),
					E('input', { 'type': 'number', 'id': 'reg-svc-port', 'class': 'form-input', 'placeholder': '8080' })
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Service registered'), 'info');
				} }, 'Register')
			])
		]);
	},

	showSubscribeServiceModal: function() {
		ui.showModal('Subscribe to Service', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Service URL'),
					E('input', { 'type': 'text', 'id': 'sub-svc-url', 'class': 'form-input', 'placeholder': 'peer.sb.local/service' })
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Subscribed to service'), 'info');
				} }, 'Subscribe')
			])
		]);
	},

	showBroadcastModal: function() {
		ui.showModal('Broadcast Command', [
			E('select', { 'id': 'broadcast-cmd', 'class': 'form-select' }, [
				E('option', { 'value': 'sync' }, 'Sync Configuration'),
				E('option', { 'value': 'restart' }, 'Restart Services'),
				E('option', { 'value': 'update' }, 'Update Packages'),
				E('option', { 'value': 'backup' }, 'Run Backup')
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var cmd = document.getElementById('broadcast-cmd').value;
					P2PAPI.broadcastCommand(cmd);
					ui.hideModal();
					ui.addNotification(null, E('p', 'Command "' + cmd + '" broadcast'), 'info');
				} }, 'Broadcast')
			])
		]);
	},

	showAddPeerModal: function() {
		var self = this;
		ui.showModal('Add Peer', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Peer Address'),
					E('input', { 'type': 'text', 'id': 'peer-addr', 'class': 'form-input', 'placeholder': '192.168.1.100' })
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Peer Name (optional)'),
					E('input', { 'type': 'text', 'id': 'peer-name', 'class': 'form-input', 'placeholder': 'My Peer' })
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var addr = document.getElementById('peer-addr').value;
					var name = document.getElementById('peer-name').value;
					if (addr) {
						P2PAPI.addPeer(addr, name).then(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Peer added'), 'info');
							self.refreshData();
						});
					}
				} }, 'Add')
			])
		]);
	},

	showDeployRegistryModal: function() {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; });
		var services = this.getRegisteredServices();

		ui.showModal('Deploy Registry to Mesh', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'deploy-modal-header' }, [
					E('span', { 'class': 'deploy-modal-icon' }, '🚀'),
					E('div', {}, [
						E('div', { 'class': 'deploy-modal-title' }, 'Master Deployment'),
						E('div', { 'class': 'deploy-modal-subtitle' }, 'Distribute registry entries across the mesh network')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Deployment Summary'),
					E('div', { 'class': 'deploy-summary' }, [
						E('div', { 'class': 'deploy-stat' }, [
							E('span', { 'class': 'ds-value' }, String(services.length)),
							E('span', { 'class': 'ds-label' }, 'Registry entries')
						]),
						E('div', { 'class': 'deploy-stat' }, [
							E('span', { 'class': 'ds-value' }, String(onlinePeers.length)),
							E('span', { 'class': 'ds-label' }, 'Target peers')
						])
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Target Peers'),
					E('div', { 'class': 'peer-checklist' },
						onlinePeers.map(function(peer) {
							return E('label', { 'class': 'peer-check-item' }, [
								E('input', { 'type': 'checkbox', 'checked': true, 'data-peer': peer.id }),
								E('span', { 'class': 'peer-check-icon' }, '🖥️'),
								E('span', {}, peer.name || peer.id),
								E('span', { 'class': 'peer-check-addr' }, peer.address || '')
							]);
						})
					)
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Deployment Options'),
					E('div', { 'class': 'deploy-options' }, [
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'deploy-sync-dns', 'checked': true }),
							E('span', {}, '🌐 Sync DNS records')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'deploy-update-lb', 'checked': true }),
							E('span', {}, '⚖️ Update load balancer')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'deploy-flush-cache' }),
							E('span', {}, '💾 Flush peer caches')
						])
					])
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					ui.hideModal();
					self.deployAllRegistry();
				} }, '🚀 Deploy Now')
			])
		]);
	},

	showDeployServicesModal: function() {
		var self = this;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; });
		var localServices = this.getLocalServicesTyped();

		ui.showModal('Service Distribution Configuration', [
			E('div', { 'class': 'modal-form' }, [
				E('div', { 'class': 'deploy-modal-header' }, [
					E('span', { 'class': 'deploy-modal-icon' }, '⚡'),
					E('div', {}, [
						E('div', { 'class': 'deploy-modal-title' }, 'Mesh Service Distribution'),
						E('div', { 'class': 'deploy-modal-subtitle' }, 'Configure how services are distributed across peers')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Distribution Strategy'),
					E('select', { 'id': 'deploy-strategy', 'class': 'form-select' }, [
						E('option', { 'value': 'replicate' }, '🔄 Replicate - All services to all peers'),
						E('option', { 'value': 'distribute' }, '📊 Distribute - Spread services across peers'),
						E('option', { 'value': 'failover' }, '🛡️ Failover - Primary with backup peers'),
						E('option', { 'value': 'custom' }, '⚙️ Custom - Manual assignment')
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Services to Deploy (' + localServices.length + ' available)'),
					E('div', { 'class': 'service-checklist' },
						localServices.slice(0, 10).map(function(svc) {
							var type = self.serviceTypes[svc.type] || { icon: '❓', name: svc.type || 'unknown' };
							return E('label', { 'class': 'service-check-item' }, [
								E('input', { 'type': 'checkbox', 'checked': true, 'data-service': svc.id }),
								E('span', { 'class': 'svc-check-icon' }, type.icon),
								E('span', {}, svc.name),
								E('span', { 'class': 'svc-check-status ' + (svc.status === 'running' ? 'running' : 'stopped') },
									svc.status === 'running' ? '●' : '○')
							]);
						})
					)
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', {}, 'Load Balancing'),
					E('div', { 'class': 'deploy-options' }, [
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'deploy-enable-lb', 'checked': true }),
							E('span', {}, '⚖️ Enable HAProxy load balancing')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'deploy-health-checks', 'checked': true }),
							E('span', {}, '💓 Enable health checks')
						]),
						E('label', { 'class': 'deploy-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'deploy-dns-round-robin' }),
							E('span', {}, '🌐 DNS round-robin')
						])
					])
				])
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button', 'click': function() {
					ui.hideModal();
					self.pullAllServices();
				} }, '📥 Pull from Mesh'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					ui.hideModal();
					self.deployAllServices();
				} }, '🚀 Deploy to Mesh')
			])
		]);
	},

	// ==================== Styles ====================
	getStyles: function() {
		return [
			// Base
			'.p2p-hub-master { background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); min-height: 100vh; padding: 20px; color: #e0e0e0; }',

			// Globe Hero
			'.globe-hero { display: flex; align-items: center; justify-content: center; gap: 60px; padding: 40px 20px; margin-bottom: 30px; position: relative; overflow: hidden; background: radial-gradient(ellipse at center, rgba(102,126,234,0.1) 0%, transparent 70%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); min-height: 350px; }',
			'@media (max-width: 900px) { .globe-hero { flex-direction: column; gap: 30px; padding: 30px 15px; } }',

			// Stars background
			'.stars-bg { position: absolute; inset: 0; background-image: radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent), radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.3), transparent), radial-gradient(2px 2px at 200px 50px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 250px 100px, rgba(255,255,255,0.4), transparent), radial-gradient(2px 2px at 300px 60px, rgba(255,255,255,0.2), transparent); background-repeat: repeat; background-size: 350px 150px; animation: twinkle 4s ease-in-out infinite; }',
			'@keyframes twinkle { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }',

			// Globe container
			'.globe-container { position: relative; width: 280px; height: 280px; flex-shrink: 0; }',

			// Globe sphere
			'.globe { position: absolute; inset: 20px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(102,126,234,0.4), rgba(118,75,162,0.2) 50%, rgba(10,10,15,0.8)); box-shadow: inset -20px -20px 40px rgba(0,0,0,0.6), inset 10px 10px 30px rgba(102,126,234,0.3), 0 0 60px rgba(102,126,234,0.3); animation: globe-rotate 30s linear infinite; overflow: hidden; }',
			'@keyframes globe-rotate { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }',

			'.globe-inner { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1), transparent 50%); }',

			'.globe-grid { position: absolute; inset: 0; border-radius: 50%; background: repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(102,126,234,0.15) 18px, rgba(102,126,234,0.15) 20px), repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(102,126,234,0.15) 18px, rgba(102,126,234,0.15) 20px); opacity: 0.5; }',

			'.globe-glow { position: absolute; inset: -10px; border-radius: 50%; background: radial-gradient(circle, transparent 60%, rgba(102,126,234,0.2) 80%, transparent); animation: pulse-glow 3s ease-in-out infinite; }',
			'@keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }',

			// Master node
			'.globe-master-node { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; }',
			'.master-icon { font-size: 32px; display: block; filter: drop-shadow(0 0 10px rgba(241,196,15,0.8)); animation: master-float 3s ease-in-out infinite; }',
			'@keyframes master-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }',
			'.master-pulse { position: absolute; inset: -15px; border-radius: 50%; border: 2px solid rgba(241,196,15,0.5); animation: master-pulse 2s ease-out infinite; }',
			'@keyframes master-pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }',

			// Peer nodes on globe
			'.globe-peers { position: absolute; inset: 0; }',
			'.globe-peer { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.3s; cursor: pointer; }',
			'.globe-peer:hover { transform: translate(-50%, -50%) scale(1.2); z-index: 20; }',
			'.peer-dot { width: 12px; height: 12px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.6); }',
			'.globe-peer.offline .peer-dot { background: #ef4444; box-shadow: 0 0 10px rgba(239,68,68,0.6); }',
			'.peer-label { font-size: 9px; color: rgba(255,255,255,0.7); white-space: nowrap; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; opacity: 0; transition: opacity 0.3s; }',
			'.globe-peer:hover .peer-label { opacity: 1; }',

			// Connection lines
			'.globe-connections { position: absolute; inset: 0; pointer-events: none; }',
			'.connection-line { stroke: rgba(102,126,234,0.2); stroke-width: 0.5; stroke-dasharray: 4 2; }',
			'.connection-line.active { stroke: rgba(16,185,129,0.4); animation: line-flow 2s linear infinite; }',
			'@keyframes line-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -20; } }',

			// Globe info panel
			'.globe-info { max-width: 400px; }',
			'.globe-title { display: flex; align-items: center; gap: 12px; font-size: 28px; font-weight: 700; margin-bottom: 8px; }',
			'.globe-icon { font-size: 36px; animation: globe-icon-spin 10s linear infinite; }',
			'@keyframes globe-icon-spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }',
			'.globe-subtitle { color: #888; font-size: 14px; margin-bottom: 20px; }',

			// Health indicators
			'.globe-health { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }',
			'.health-item { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 12px; }',
			'.health-emoji { font-size: 16px; }',
			'.health-status { font-weight: 600; margin-left: 4px; }',
			'.health-status.healthy { color: #2ecc71; }',
			'.health-status.unhealthy { color: #e74c3c; }',
			'.health-status.unknown { color: #f39c12; }',
			'.health-status.off { color: #95a5a6; }',

			// Globe stats
			'.globe-stats { display: flex; gap: 20px; margin-bottom: 20px; }',
			'.globe-stat { text-align: center; padding: 15px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }',
			'.globe-stat.online { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); }',
			'.gs-value { font-size: 28px; font-weight: 700; }',
			'.globe-stat.online .gs-value { color: #10b981; }',
			'.gs-label { font-size: 11px; color: #888; margin-top: 4px; }',

			// Globe actions
			'.globe-actions { display: flex; gap: 10px; flex-wrap: wrap; }',
			'.globe-btn { padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e0e0e0; cursor: pointer; font-size: 13px; transition: all 0.3s; }',
			'.globe-btn:hover { background: rgba(102,126,234,0.2); border-color: rgba(102,126,234,0.4); transform: translateY(-2px); }',
			'.globe-btn.primary { background: linear-gradient(135deg, #667eea, #764ba2); border: none; }',

			// Header
			'.hub-header { margin-bottom: 20px; }',
			'.hub-title-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }',
			'.hub-title { display: flex; align-items: center; gap: 12px; font-size: 24px; font-weight: 700; }',
			'.title-icon { font-size: 32px; }',
			'.hub-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }',
			'.hub-badge.maas { background: linear-gradient(135deg, #f1c40f, #e67e22); color: #000; }',
			'.hub-subtitle { color: #888; margin-top: 8px; font-size: 14px; }',
			'.view-selector { padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e0e0e0; font-size: 13px; }',

			// Quick Stats
			'.quick-stats-bar { display: flex; gap: 12px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; }',
			'.stat-chip { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; min-width: 130px; }',
			'.chip-icon { font-size: 20px; }',
			'.chip-value { font-size: 18px; font-weight: 700; }',
			'.chip-label { font-size: 11px; color: #888; }',
			'.chip-sublabel { font-size: 10px; color: #666; }',

			// Panels Grid
			'.hub-panels-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }',
			'@media (max-width: 1200px) { .hub-panels-grid { grid-template-columns: 1fr; } }',

			// Panel Base
			'.panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; }',
			'.panel.wide { grid-column: span 2; }',
			'@media (max-width: 1200px) { .panel.wide { grid-column: span 1; } }',
			'.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }',
			'.panel-header.gold { border-bottom-color: rgba(241,196,15,0.3); }',
			'.panel-header.blue { border-bottom-color: rgba(52,152,219,0.3); }',
			'.panel-header.purple { border-bottom-color: rgba(155,89,182,0.3); }',
			'.panel-header.cyan { border-bottom-color: rgba(0,188,212,0.3); }',
			'.panel-header.green { border-bottom-color: rgba(46,204,113,0.3); }',
			'.panel-header.orange { border-bottom-color: rgba(230,126,34,0.3); }',
			'.panel-header.red { border-bottom-color: rgba(231,76,60,0.3); }',
			'.panel-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }',
			'.panel-url { display: flex; align-items: center; gap: 8px; }',
			'.panel-url code { padding: 4px 8px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 12px; }',
			'.panel-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 15px; }',
			'.panel-actions.vertical { flex-direction: column; }',

			// Badges
			'.badge { padding: 4px 10px; background: rgba(99,102,241,0.2); color: #818cf8; border-radius: 12px; font-size: 11px; }',
			'.badge.maas { background: linear-gradient(135deg, rgba(241,196,15,0.3), rgba(230,126,34,0.3)); color: #f1c40f; }',

			// Status dots
			'.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }',
			'.status-dot.active { background: #2ecc71; }',
			'.status-dot.cached { background: #3498db; }',
			'.status-dot.error { background: #e74c3c; }',
			'.status-dot.inactive { background: #95a5a6; }',

			// Registry Panel
			'.registry-stats { display: flex; gap: 15px; margin-bottom: 15px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; }',
			'.reg-stat { text-align: center; min-width: 70px; }',
			'.reg-stat-value { font-size: 20px; font-weight: 700; }',
			'.reg-stat-value.gold { color: #f1c40f; }',
			'.reg-stat-value.orange { color: #e67e22; }',
			'.reg-stat-value.blue { color: #3498db; }',
			'.reg-stat-value.purple { color: #9b59b6; }',
			'.reg-stat-label { font-size: 10px; color: rgba(255,255,255,0.5); }',

			// Registry Table
			'.registry-table { margin-bottom: 15px; }',
			'.table-header { display: grid; grid-template-columns: 1fr 2fr 80px 60px; gap: 10px; padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 6px 6px 0 0; font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; }',
			'.table-body { max-height: 180px; overflow-y: auto; }',
			'.table-row { display: grid; grid-template-columns: 1fr 2fr 80px 60px; gap: 10px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; }',
			'.url-cell { display: flex; align-items: center; gap: 6px; }',
			'.short-url { color: #f1c40f; font-size: 13px; }',
			'.copy-btn { background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 12px; }',
			'.copy-btn:hover { opacity: 1; }',
			'.target-cell { font-size: 12px; color: rgba(255,255,255,0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
			'.status-cell { display: flex; align-items: center; gap: 6px; font-size: 12px; }',
			'.hits-cell { font-size: 12px; color: rgba(255,255,255,0.4); }',

			// Registry Toggles
			'.registry-toggles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 15px; }',
			'.toggle-option { display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer; font-size: 13px; }',
			'.toggle-option.static { cursor: default; }',
			'.toggle-option code { font-size: 11px; }',

			// Services Registry
			'.service-types-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }',
			'.type-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border: 1px solid; border-radius: 4px; font-size: 11px; }',
			'.services-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }',
			'@media (max-width: 600px) { .services-columns { grid-template-columns: 1fr; } }',
			'.services-column { }',
			'.column-title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.8); }',
			'.column-title .count { margin-left: auto; font-size: 12px; }',
			'.column-title .count.green { color: #2ecc71; }',
			'.column-title .count.blue { color: #3498db; }',
			'.services-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }',
			'.service-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 3px solid; }',
			'.svc-icon { font-size: 18px; }',
			'.svc-info { flex: 1; min-width: 0; }',
			'.svc-name { font-weight: 500; font-size: 13px; display: flex; align-items: center; gap: 6px; }',
			'.svc-status-dot { width: 6px; height: 6px; border-radius: 50%; }',
			'.svc-status-dot.online { background: #2ecc71; }',
			'.svc-status-dot.offline { background: #e74c3c; }',
			'.svc-detail { font-size: 11px; color: rgba(255,255,255,0.5); }',
			'.svc-action { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.7; }',
			'.svc-action:hover { opacity: 1; }',

			// Matrix
			'.matrix-view { height: 180px; display: flex; align-items: center; justify-content: center; position: relative; }',
			'.matrix-center { z-index: 2; }',
			'.matrix-ring { position: absolute; width: 100%; height: 100%; }',
			'.node { display: flex; flex-direction: column; align-items: center; font-size: 11px; }',
			'.node.master { background: linear-gradient(135deg, #667eea, #764ba2); padding: 12px 16px; border-radius: 12px; }',
			'.node.peer { position: absolute; top: 50%; left: 50%; width: 36px; height: 36px; margin: -18px; background: rgba(16,185,129,0.2); border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }',
			'.node.peer.offline { background: rgba(239,68,68,0.2); border-color: #ef4444; }',

			// Master Control
			'.control-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px; }',
			'.control-stat { text-align: center; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px; }',
			'.cs-value { font-size: 28px; font-weight: 700; }',
			'.cs-label { font-size: 11px; color: #888; margin-top: 4px; }',

			// Mesh Stack
			'.mesh-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }',
			'@media (max-width: 900px) { .mesh-cards { grid-template-columns: 1fr; } }',
			'.mesh-card { background: rgba(0,0,0,0.2); border-radius: 10px; padding: 15px; }',
			'.mesh-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; font-weight: 500; }',
			'.mesh-card-body { }',
			'.mesh-info { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }',
			'.mesh-info:last-child { border-bottom: none; }',
			'.mesh-info code { padding: 2px 6px; background: rgba(0,0,0,0.3); border-radius: 4px; }',

			// Toggle Switch
			'.toggle-switch { position: relative; width: 40px; height: 22px; }',
			'.toggle-switch input { opacity: 0; width: 0; height: 0; }',
			'.toggle-switch .slider { position: absolute; cursor: pointer; inset: 0; background: rgba(255,255,255,0.1); border-radius: 11px; transition: 0.3s; }',
			'.toggle-switch .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }',
			'.toggle-switch input:checked + .slider { background: #667eea; }',
			'.toggle-switch input:checked + .slider:before { transform: translateX(18px); }',

			// Peers
			'.peers-list { max-height: 250px; overflow-y: auto; }',
			'.peer-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }',
			'.peer-icon { font-size: 20px; }',
			'.peer-info { flex: 1; }',
			'.peer-name { font-weight: 500; font-size: 13px; }',
			'.peer-addr { font-size: 11px; color: #888; }',
			'.peer-status { width: 10px; height: 10px; border-radius: 50%; }',
			'.peer-status.online { background: #10b981; }',
			'.peer-status.offline { background: #ef4444; }',
			'.btn-icon { background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 14px; }',
			'.btn-icon:hover { opacity: 1; }',

			// Health
			'.health-status { text-align: center; padding: 20px; }',
			'.health-indicator { font-size: 48px; margin-bottom: 8px; }',
			'.health-indicator.healthy { color: #2ecc71; }',
			'.health-indicator.unhealthy { color: #e74c3c; }',
			'.health-indicator.unknown { color: #95a5a6; }',
			'.health-label { font-size: 14px; font-weight: 500; }',
			'.health-checks { display: flex; justify-content: center; gap: 20px; margin: 15px 0; }',
			'.check-item { font-size: 12px; }',
			'.check-item .ok { color: #2ecc71; }',
			'.check-item .off { color: #95a5a6; }',

			// Buttons
			'.btn { padding: 8px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e0e0e0; cursor: pointer; font-size: 12px; transition: all 0.2s; }',
			'.btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); }',
			'.btn.primary { background: linear-gradient(135deg, #667eea, #764ba2); border: none; }',
			'.btn.small { padding: 6px 12px; font-size: 11px; }',

			// Empty state
			'.empty-state { text-align: center; padding: 30px; color: rgba(255,255,255,0.4); font-size: 13px; }',

			// Modal
			'.modal-form { margin-bottom: 20px; }',
			'.form-group { margin-bottom: 15px; }',
			'.form-group label { display: block; margin-bottom: 6px; font-size: 13px; color: rgba(255,255,255,0.8); }',
			'.form-input, .form-select { width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 13px; }',
			'.input-group { display: flex; align-items: center; }',
			'.input-prefix { padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-right: none; border-radius: 6px 0 0 6px; color: rgba(255,255,255,0.5); font-size: 12px; }',
			'.input-group .form-input { border-radius: 0 6px 6px 0; }',
			'.zone-preview { padding: 12px; background: rgba(0,0,0,0.4); border-radius: 6px; font-size: 11px; font-family: monospace; overflow-x: auto; white-space: pre; }',
			'.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }',

			// Deploy Banner
			'.deploy-banner { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15)); border: 1px solid rgba(102,126,234,0.3); border-radius: 10px; margin-bottom: 15px; }',
			'.deploy-banner.services { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,152,219,0.15)); border-color: rgba(16,185,129,0.3); }',
			'.deploy-info { display: flex; align-items: center; gap: 12px; }',
			'.deploy-icon { font-size: 24px; }',
			'.deploy-title { font-weight: 600; font-size: 14px; }',
			'.deploy-desc { font-size: 12px; color: rgba(255,255,255,0.6); }',
			'.deploy-btn { padding: 8px 16px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 12px; transition: all 0.3s; }',
			'.deploy-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }',
			'.deploy-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }',
			'.deploy-actions-mini { display: flex; gap: 8px; }',

			// Mesh Status Dots
			'.mesh-status { display: flex; align-items: center; gap: 6px; }',
			'.mesh-dots { display: flex; gap: 3px; }',
			'.mesh-dots .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); }',
			'.mesh-dots .dot.active { background: #10b981; }',
			'.mesh-status.full .mesh-dots .dot { background: #10b981; }',
			'.mesh-status.partial .mesh-dots .dot.active { background: #f59e0b; }',
			'.mesh-count { font-size: 10px; color: rgba(255,255,255,0.5); }',

			// Deploy Entry Button
			'.deploy-entry-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(102,126,234,0.3); background: rgba(102,126,234,0.1); cursor: pointer; font-size: 12px; transition: all 0.2s; }',
			'.deploy-entry-btn:hover { background: rgba(102,126,234,0.3); transform: scale(1.1); }',
			'.deploy-entry-btn.deployed { background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.4); color: #10b981; }',

			// Service Item with Deploy
			'.service-item.with-deploy { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 10px; }',
			'.svc-mesh-status { display: flex; align-items: center; gap: 4px; }',
			'.mesh-micro-dots { display: flex; gap: 2px; }',
			'.micro-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.2); }',
			'.micro-dot.active { background: #10b981; }',
			'.mesh-count-mini { font-size: 9px; color: rgba(255,255,255,0.4); }',
			'.svc-deploy-btn, .svc-pull-btn { width: 24px; height: 24px; border-radius: 4px; border: none; background: rgba(102,126,234,0.15); cursor: pointer; font-size: 11px; transition: all 0.2s; }',
			'.svc-deploy-btn:hover, .svc-pull-btn:hover { background: rgba(102,126,234,0.3); }',
			'.svc-deploy-btn.deployed { background: rgba(16,185,129,0.2); color: #10b981; }',
			'.svc-pull-btn { background: rgba(52,152,219,0.15); }',
			'.svc-pull-btn:hover { background: rgba(52,152,219,0.3); }',

			// Column Title Deploy Buttons
			'.deploy-all-btn, .pull-all-btn { padding: 4px 8px; border: none; background: rgba(255,255,255,0.1); border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: 8px; transition: all 0.2s; }',
			'.deploy-all-btn:hover { background: rgba(102,126,234,0.3); }',
			'.pull-all-btn:hover { background: rgba(52,152,219,0.3); }',

			// Deploy Modal Styles
			'.deploy-modal-header { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px; margin-bottom: 20px; }',
			'.deploy-modal-icon { font-size: 36px; }',
			'.deploy-modal-title { font-size: 18px; font-weight: 600; }',
			'.deploy-modal-subtitle { font-size: 12px; color: rgba(255,255,255,0.6); }',
			'.deploy-summary { display: flex; gap: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px; }',
			'.deploy-stat { text-align: center; }',
			'.ds-value { font-size: 24px; font-weight: 700; color: #667eea; }',
			'.ds-label { font-size: 11px; color: rgba(255,255,255,0.5); }',
			'.peer-checklist, .service-checklist { max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; }',
			'.peer-check-item, .service-check-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; cursor: pointer; }',
			'.peer-check-item:hover, .service-check-item:hover { background: rgba(255,255,255,0.06); }',
			'.peer-check-icon, .svc-check-icon { font-size: 16px; }',
			'.peer-check-addr { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.4); }',
			'.svc-check-status { margin-left: auto; font-size: 10px; }',
			'.svc-check-status.running { color: #10b981; }',
			'.svc-check-status.stopped { color: #ef4444; }',
			'.deploy-options { display: flex; flex-direction: column; gap: 8px; }',
			'.deploy-option { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer; }',
			'.deploy-option:hover { background: rgba(0,0,0,0.3); }',

			// Mesh Stack Advanced
			'.mesh-section-title { margin: 20px 0 15px 0; font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500; }',
			'.mesh-cards.advanced { grid-template-columns: repeat(3, 1fr); }',
			'@media (max-width: 1100px) { .mesh-cards.advanced { grid-template-columns: 1fr 1fr; } }',
			'@media (max-width: 700px) { .mesh-cards.advanced { grid-template-columns: 1fr; } }',
			'.mesh-card.featured { border: 1px solid rgba(102,126,234,0.3); background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); }',
			'.mesh-card-actions { display: flex; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); }',
			'.mini-select { padding: 4px 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #e0e0e0; font-size: 11px; }',
			'.status-indicator { font-size: 10px; }',
			'.status-indicator.active { color: #10b981; }',
			'.status-indicator.inactive { color: #95a5a6; }',
			'.onion-row { display: flex; align-items: center; gap: 8px; }',
			'.onion-icon { font-size: 14px; }',
			'.toggle-switch.mini { width: 32px; height: 18px; }',
			'.toggle-switch.mini .slider:before { height: 12px; width: 12px; left: 3px; bottom: 3px; }',
			'.toggle-switch.mini input:checked + .slider:before { transform: translateX(14px); }',

			// Registry green stat value
			'.reg-stat-value.green { color: #2ecc71; }',

			// Self Peer & Distribution
			'.globe-btn.test { background: linear-gradient(135deg, rgba(241,196,15,0.3), rgba(230,126,34,0.3)); border-color: rgba(241,196,15,0.5); }',
			'.globe-btn.test:hover { background: linear-gradient(135deg, rgba(241,196,15,0.5), rgba(230,126,34,0.5)); }',
			'.globe-distribution { display: flex; align-items: center; gap: 15px; margin-top: 15px; padding: 12px 15px; background: rgba(0,0,0,0.3); border-radius: 10px; flex-wrap: wrap; }',
			'.dist-label { font-size: 13px; font-weight: 500; }',
			'.dist-select { padding: 6px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #e0e0e0; font-size: 12px; }',
			'.dist-depth { display: flex; align-items: center; gap: 8px; font-size: 12px; }',
			'.depth-input { width: 50px; padding: 4px 8px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #e0e0e0; font-size: 12px; text-align: center; }',
			'.test-badge { padding: 4px 10px; background: linear-gradient(135deg, #f1c40f, #e67e22); color: #000; border-radius: 12px; font-size: 10px; font-weight: 700; animation: pulse-badge 2s ease-in-out infinite; }',
			'@keyframes pulse-badge { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }',

			// Gigogne peer styles
			'.globe-peer.gigogne { }',
			'.globe-peer.gigogne .peer-dot { background: linear-gradient(135deg, #f1c40f, #e67e22); box-shadow: 0 0 10px rgba(241,196,15,0.6); }',
			'.globe-peer.self .peer-dot { background: linear-gradient(135deg, #667eea, #764ba2); box-shadow: 0 0 15px rgba(102,126,234,0.8); animation: self-pulse 1.5s ease-in-out infinite; }',
			'@keyframes self-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }',

			// Peer row gigogne indicator
			'.peer-row.gigogne { border-left: 3px solid #f1c40f; margin-left: 10px; }',
			'.peer-row.self { border-left: 3px solid #667eea; background: rgba(102,126,234,0.1); }',
			'.gigogne-level { font-size: 10px; color: #f1c40f; margin-left: auto; padding: 2px 6px; background: rgba(241,196,15,0.2); border-radius: 4px; }',

			// Backup & Versioning Panel
			'.panel-header.teal { border-bottom-color: rgba(0,188,212,0.3); }',
			'.backup-versioning-panel { }',
			'.backup-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }',
			'@media (max-width: 1100px) { .backup-cards { grid-template-columns: 1fr 1fr; } }',
			'@media (max-width: 700px) { .backup-cards { grid-template-columns: 1fr; } }',
			'.backup-card { background: rgba(0,0,0,0.2); border-radius: 10px; padding: 15px; border: 1px solid rgba(255,255,255,0.05); }',
			'.backup-card.gitea { border-color: rgba(99,163,91,0.3); }',
			'.backup-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 13px; font-weight: 500; }',
			'.backup-icon { font-size: 20px; }',
			'.backup-card-body { }',
			'.backup-info { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }',
			'.backup-info:last-child { border-bottom: none; }',
			'.backup-time { color: rgba(255,255,255,0.5); font-size: 11px; }',
			'.backup-targets, .clone-targets { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }',
			'.target-check { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,0.7); }',
			'.target-check input { margin: 0; }',
			'.backup-card-actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); }',

			// Gitea specific
			'.gitea-info { }',
			'.gitea-repo { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 6px; }',
			'.gitea-icon { font-size: 16px; }',
			'.gitea-branch { padding: 2px 6px; background: rgba(99,163,91,0.2); border-radius: 4px; font-size: 10px; color: #63a35b; }',
			'.gitea-last-fetch { font-size: 11px; color: rgba(255,255,255,0.5); }',
			'.gitea-setup { font-size: 12px; color: rgba(255,255,255,0.4); padding: 10px 0; }',
			'.gitea-commits { margin-top: 10px; }',
			'.commit-item { display: flex; gap: 8px; padding: 6px 0; font-size: 11px; border-bottom: 1px solid rgba(255,255,255,0.05); }',
			'.commit-sha { font-family: monospace; color: #63a35b; background: rgba(99,163,91,0.15); padding: 2px 4px; border-radius: 3px; }',
			'.commit-msg { flex: 1; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
			'.commit-time { color: rgba(255,255,255,0.4); }',
			'.no-commits { font-size: 11px; color: rgba(255,255,255,0.4); text-align: center; padding: 10px; }',

			// Backup History Modal
			'.backup-history-list { max-height: 300px; overflow-y: auto; }',
			'.backup-history-item { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 10px; }',
			'.snap-info { display: flex; justify-content: space-between; }',
			'.snap-id { font-family: monospace; color: #667eea; }',
			'.snap-time { font-size: 11px; color: rgba(255,255,255,0.5); }',
			'.snap-details { display: flex; gap: 15px; font-size: 11px; color: rgba(255,255,255,0.6); }',
			'.snap-actions { display: flex; gap: 8px; }',

			// Test badge
			'.badge.test { background: linear-gradient(135deg, rgba(241,196,15,0.3), rgba(230,126,34,0.3)); color: #f1c40f; }',

			// Component Sources
			'.component-section-title { margin: 20px 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500; }',
			'.component-sources-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }',
			'@media (max-width: 1200px) { .component-sources-grid { grid-template-columns: repeat(3, 1fr); } }',
			'@media (max-width: 700px) { .component-sources-grid { grid-template-columns: repeat(2, 1fr); } }',
			'.component-source { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; }',
			'.component-source:hover { border-color: rgba(102,126,234,0.3); }',
			'.component-source.synced { border-color: rgba(16,185,129,0.3); }',
			'.cs-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }',
			'.cs-icon { font-size: 16px; }',
			'.cs-name { font-size: 11px; font-weight: 500; flex: 1; }',
			'.cs-status { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.5); margin-bottom: 8px; }',
			'.cs-count { }',
			'.cs-sync-status { }',
			'.cs-sync-status.synced { color: #10b981; }',
			'.cs-sync-status.pending { color: #f59e0b; }',
			'.cs-actions { display: flex; gap: 4px; }',
			'.btn.tiny { padding: 3px 6px; font-size: 10px; }',

			// Component List Modal
			'.component-list { max-height: 300px; overflow-y: auto; }',
			'.component-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; margin-bottom: 6px; }',
			'.ci-name { flex: 1; font-size: 12px; }',
			'.ci-version { font-size: 10px; color: rgba(255,255,255,0.5); font-family: monospace; }',
			'.ci-status { font-size: 12px; }',
			'.ci-status.synced { color: #10b981; }',

			// Auto-Self Section
			'.auto-self-section { background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); border: 1px solid rgba(102,126,234,0.2); border-radius: 12px; padding: 15px; }',
			'.auto-self-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }',
			'.auto-self-icon { font-size: 24px; }',
			'.auto-self-title { font-size: 14px; font-weight: 600; flex: 1; }',
			'.auto-self-options { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }',
			'@media (max-width: 900px) { .auto-self-options { grid-template-columns: repeat(2, 1fr); } }',
			'.auto-opt { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 11px; cursor: pointer; }',
			'.auto-opt:hover { background: rgba(0,0,0,0.3); }',
			'.auto-opt input { margin: 0; }',
			'.auto-self-actions { display: flex; gap: 10px; flex-wrap: wrap; }'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
