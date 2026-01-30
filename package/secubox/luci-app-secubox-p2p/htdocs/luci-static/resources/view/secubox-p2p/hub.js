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
			P2PAPI.healthCheck().catch(function() { return {}; })
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

			// Populate hubRegistry from API
			if (self.registry.base_url) self.hubRegistry.baseUrl = self.registry.base_url;
			if (self.registry.cache_enabled !== undefined) self.hubRegistry.cacheEnabled = self.registry.cache_enabled;
			if (self.registry.cache_ttl) self.hubRegistry.cacheTTL = self.registry.cache_ttl;

			return {};
		});
	},

	render: function() {
		var self = this;

		var container = E('div', { 'class': 'p2p-hub-master' }, [
			E('style', {}, this.getStyles()),

			// Header with view selector
			this.renderHeader(),

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

				// Row 4: Peers + Health
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

	// ==================== Header ====================
	renderHeader: function() {
		var self = this;
		var viewNodes = [{ id: 'master', name: 'Master (You)', icon: '👑' }];
		this.peers.forEach(function(p) {
			viewNodes.push({ id: p.id, name: p.name || p.id, icon: '🖥️' });
		});

		return E('div', { 'class': 'hub-header' }, [
			E('div', { 'class': 'hub-title-row' }, [
				E('div', { 'class': 'hub-title' }, [
					E('span', { 'class': 'title-icon' }, '🌐'),
					E('span', {}, 'SecuBox P2P Hub'),
					E('span', { 'class': 'hub-badge maas' }, 'MaaS')
				]),
				E('select', {
					'class': 'view-selector',
					'change': function(e) { self.switchView(e.target.value); }
				}, viewNodes.map(function(n) {
					return E('option', { 'value': n.id }, n.icon + ' ' + n.name);
				}))
			]),
			E('div', { 'class': 'hub-subtitle' },
				this.peers.length + ' peers • ' + this.services.length + ' services • Mesh Federation Ready')
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

			// Stats row
			E('div', { 'class': 'registry-stats' }, [
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value gold' }, String(services.length)),
					E('div', { 'class': 'reg-stat-label' }, 'Services')
				]),
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value orange' }, String(this.peers.length)),
					E('div', { 'class': 'reg-stat-label' }, 'Peers')
				]),
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value blue' }, registry.cacheEnabled ? '✓' : '✗'),
					E('div', { 'class': 'reg-stat-label' }, 'Cache')
				]),
				E('div', { 'class': 'reg-stat' }, [
					E('div', { 'class': 'reg-stat-value purple' }, registry.cacheTTL + 's'),
					E('div', { 'class': 'reg-stat-label' }, 'TTL')
				])
			]),

			// Short URL table
			E('div', { 'class': 'registry-table' }, [
				E('div', { 'class': 'table-header' }, [
					E('span', {}, 'Short URL'),
					E('span', {}, 'Target'),
					E('span', {}, 'Status'),
					E('span', {}, 'Hits')
				]),
				E('div', { 'class': 'table-body' },
					services.length > 0 ?
						services.map(function(svc) { return self.renderRegistryEntry(svc); }) :
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
					E('span', {}, '🔄'), E('span', {}, 'Auto-Register')
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
				E('button', { 'class': 'btn primary', 'click': function() { self.showRegisterURLModal(); } }, '➕ Register URL'),
				E('button', { 'class': 'btn', 'click': function() { self.syncRegistry(); } }, '🔄 Sync Peers'),
				E('button', { 'class': 'btn', 'click': function() { self.flushCache(); } }, '🗑️ Flush Cache'),
				E('button', { 'class': 'btn', 'click': function() { self.showDNSConfigModal(); } }, '⚙️ DNS Config')
			])
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

		return E('div', { 'class': 'panel services-registry-panel' }, [
			E('div', { 'class': 'panel-header blue' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '📡'),
					E('span', {}, 'Services Registry')
				]),
				E('button', { 'class': 'btn small', 'click': function() { self.refreshServicesRegistry(); } }, 'Refresh')
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

			// Two columns
			E('div', { 'class': 'services-columns' }, [
				// Local Services
				E('div', { 'class': 'services-column' }, [
					E('h4', { 'class': 'column-title' }, [
						E('span', {}, '🏠'),
						E('span', {}, 'Your Services'),
						E('span', { 'class': 'count green' }, localServices.length + ' active')
					]),
					E('div', { 'class': 'services-list' },
						localServices.length > 0 ?
							localServices.map(function(svc) { return self.renderServiceItem(svc, true); }) :
							E('div', { 'class': 'empty-state' }, 'No services running')
					)
				]),
				// Network Services
				E('div', { 'class': 'services-column' }, [
					E('h4', { 'class': 'column-title' }, [
						E('span', {}, '🌐'),
						E('span', {}, 'Network Services'),
						E('span', { 'class': 'count blue' }, networkServices.length + ' available')
					]),
					E('div', { 'class': 'services-list' },
						networkServices.length > 0 ?
							networkServices.map(function(svc) { return self.renderServiceItem(svc, false); }) :
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

		return E('div', { 'class': 'panel mesh-stack-panel wide' }, [
			E('div', { 'class': 'panel-header green' }, [
				E('div', { 'class': 'panel-title' }, [
					E('span', {}, '🔧'),
					E('span', {}, 'Mesh Infrastructure')
				])
			]),

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
					E('span', {}, 'Connected Peers')
				]),
				E('button', { 'class': 'btn small', 'click': function() { self.discoverPeers(); } }, '🔍 Discover')
			]),
			E('div', { 'class': 'peers-list' },
				this.peers.length > 0 ?
					this.peers.map(function(p) {
						return E('div', { 'class': 'peer-row' }, [
							E('span', { 'class': 'peer-icon' }, '🖥️'),
							E('div', { 'class': 'peer-info' }, [
								E('div', { 'class': 'peer-name' }, p.name || p.id),
								E('div', { 'class': 'peer-addr' }, p.address || 'Unknown')
							]),
							E('span', { 'class': 'peer-status ' + (p.status === 'online' ? 'online' : 'offline') }),
							E('button', { 'class': 'btn-icon', 'click': function() { self.removePeer(p.id); } }, '✕')
						]);
					}) :
					E('div', { 'class': 'empty-state' }, 'No peers. Click Discover to find peers.')
			),
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn', 'click': function() { self.showAddPeerModal(); } }, '➕ Add Peer')
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

	// ==================== Styles ====================
	getStyles: function() {
		return [
			// Base
			'.p2p-hub-master { background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); min-height: 100vh; padding: 20px; color: #e0e0e0; }',

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
			'.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
