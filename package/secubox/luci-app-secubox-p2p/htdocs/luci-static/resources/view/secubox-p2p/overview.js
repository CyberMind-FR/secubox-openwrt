'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require rpc';
'require secubox-p2p/api as P2PAPI';
'require secubox/kiss-theme';

return view.extend({
	// System state
	health: {},
	peers: [],
	services: [],
	modules: [],

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.healthCheck().catch(function() { return {}; }),
			P2PAPI.getPeers().catch(function() { return { peers: [] }; }),
			P2PAPI.getServices().catch(function() { return { services: [] }; }),
			P2PAPI.getSettings().catch(function() { return {}; })
		]).then(function(results) {
			self.health = results[0] || {};
			self.peers = results[1].peers || [];
			self.services = results[2].services || [];
			var settings = results[3] || {};
			self.settings = {
				enabled: settings.enabled !== 0,
				discovery_enabled: settings.discovery_enabled !== 0,
				sharing_enabled: settings.sharing_enabled !== 0,
				auto_sync: settings.auto_sync !== 0
			};
		});
	},

	render: function() {
		var self = this;

		// Settings state
		this.settings = this.settings || {
			enabled: true,
			discovery_enabled: true,
			sharing_enabled: true,
			auto_sync: true
		};

		// Architecture modules definition
		this.modules = [
			{
				id: 'mesh-core',
				name: 'Mesh Core',
				icon: '🕸️',
				description: 'P2P Network Foundation',
				status: 'active',
				components: ['WireGuard VPN', 'mDNS Discovery', 'Peer Sync'],
				color: '#3498db'
			},
			{
				id: 'security-layer',
				name: 'Security Layer',
				icon: '🛡️',
				description: 'Threat Detection & Response',
				status: 'active',
				components: ['CrowdSec IDS', 'Firewall', 'Rate Limiting'],
				color: '#e74c3c'
			},
			{
				id: 'dns-federation',
				name: 'DNS Federation',
				icon: '🌐',
				description: 'Distributed Name Resolution',
				status: 'active',
				components: ['Local DNS', 'Mesh Sync', 'Split Horizon'],
				color: '#2ecc71'
			},
			{
				id: 'load-balancer',
				name: 'Load Balancer',
				icon: '⚖️',
				description: 'Traffic Distribution',
				status: 'active',
				components: ['HAProxy', 'Health Checks', 'Failover'],
				color: '#9b59b6'
			},
			{
				id: 'service-mesh',
				name: 'Service Mesh',
				icon: '📡',
				description: 'Microservices Orchestration',
				status: 'active',
				components: ['Service Discovery', 'Registry', 'Routing'],
				color: '#f39c12'
			},
			{
				id: 'identity-access',
				name: 'Identity & Access',
				icon: '🔐',
				description: 'Authentication Gateway',
				status: 'planned',
				components: ['SSO', 'RBAC', 'API Keys'],
				color: '#1abc9c'
			},
			{
				id: 'observability',
				name: 'Observability',
				icon: '📊',
				description: 'Metrics & Monitoring',
				status: 'active',
				components: ['Logs', 'Metrics', 'Alerts'],
				color: '#e67e22'
			},
			{
				id: 'data-plane',
				name: 'Data Plane',
				icon: '💾',
				description: 'Distributed Storage',
				status: 'planned',
				components: ['Config Sync', 'Gitea VCS', 'Backup'],
				color: '#34495e'
			},
			{
				id: 'edge-compute',
				name: 'Edge Compute',
				icon: '⚡',
				description: 'Local Processing',
				status: 'planned',
				components: ['Containers', 'Functions', 'AI/ML'],
				color: '#8e44ad'
			}
		];

		var container = E('div', { 'class': 'mirrorbox-overview' }, [
			E('style', {}, this.getStyles()),

			// Quick Actions Bar
			this.renderQuickActions(),

			// Hero Banner
			this.renderHeroBanner(),

			// Architecture Diagram
			this.renderArchitectureDiagram(),

			// Module Grid
			this.renderModuleGrid(),

			// Network Topology
			this.renderNetworkTopology(),

			// Quick Stats
			this.renderQuickStats(),

			// Future Roadmap
			this.renderRoadmap()
		]);

		return KissTheme.wrap(container, 'admin/secubox/mirrorbox/overview');
	},

	renderQuickActions: function() {
		var self = this;

		return E('div', { 'class': 'quick-actions-bar' }, [
			E('div', { 'class': 'actions-left' }, [
				E('button', {
					'class': 'action-btn primary',
					'click': function() { self.toggleP2P(); }
				}, [E('span', {}, '⚡'), ' P2P ', E('span', { 'class': 'status-dot ' + (self.settings.enabled ? 'on' : 'off') })]),
				E('button', {
					'class': 'action-btn',
					'click': function() { self.toggleDiscovery(); }
				}, [E('span', {}, '🔍'), ' Discovery ', E('span', { 'class': 'status-dot ' + (self.settings.discovery_enabled ? 'on' : 'off') })]),
				E('button', {
					'class': 'action-btn',
					'click': function() { self.toggleSharing(); }
				}, [E('span', {}, '📤'), ' Sharing ', E('span', { 'class': 'status-dot ' + (self.settings.sharing_enabled ? 'on' : 'off') })]),
				E('button', {
					'class': 'action-btn',
					'click': function() { self.toggleAutoSync(); }
				}, [E('span', {}, '🔄'), ' Auto-Sync ', E('span', { 'class': 'status-dot ' + (self.settings.auto_sync ? 'on' : 'off') })])
			]),
			E('div', { 'class': 'actions-right' }, [
				E('button', {
					'class': 'action-btn refresh',
					'click': function() { self.refreshData(); }
				}, [E('span', {}, '🔃'), ' Refresh']),
				E('button', {
					'class': 'action-btn scan',
					'click': function() { self.scanPeers(); }
				}, [E('span', {}, '📡'), ' Scan Peers']),
				E('a', {
					'class': 'action-btn settings',
					'href': L.url('admin/secubox/mirrorbox/settings')
				}, [E('span', {}, '⚙️'), ' Settings'])
			])
		]);
	},

	toggleP2P: function() {
		var self = this;
		this.settings.enabled = !this.settings.enabled;
		P2PAPI.setSettings({ enabled: this.settings.enabled ? 1 : 0 }).then(function() {
			ui.addNotification(null, E('p', {}, 'P2P ' + (self.settings.enabled ? 'enabled' : 'disabled')), 'info');
			self.render();
		});
	},

	toggleDiscovery: function() {
		var self = this;
		this.settings.discovery_enabled = !this.settings.discovery_enabled;
		P2PAPI.setSettings({ discovery_enabled: this.settings.discovery_enabled ? 1 : 0 }).then(function() {
			ui.addNotification(null, E('p', {}, 'Discovery ' + (self.settings.discovery_enabled ? 'enabled' : 'disabled')), 'info');
			self.render();
		});
	},

	toggleSharing: function() {
		var self = this;
		this.settings.sharing_enabled = !this.settings.sharing_enabled;
		P2PAPI.setSettings({ sharing_enabled: this.settings.sharing_enabled ? 1 : 0 }).then(function() {
			ui.addNotification(null, E('p', {}, 'Sharing ' + (self.settings.sharing_enabled ? 'enabled' : 'disabled')), 'info');
			self.render();
		});
	},

	toggleAutoSync: function() {
		var self = this;
		this.settings.auto_sync = !this.settings.auto_sync;
		P2PAPI.setSettings({ auto_sync: this.settings.auto_sync ? 1 : 0 }).then(function() {
			ui.addNotification(null, E('p', {}, 'Auto-Sync ' + (self.settings.auto_sync ? 'enabled' : 'disabled')), 'info');
			self.render();
		});
	},

	refreshData: function() {
		var self = this;
		ui.showModal(_('Refreshing...'), E('p', { 'class': 'spinning' }, _('Loading data...')));
		this.load().then(function() {
			ui.hideModal();
			self.render();
		});
	},

	scanPeers: function() {
		var self = this;
		ui.showModal(_('Scanning...'), E('p', { 'class': 'spinning' }, _('Discovering peers...')));
		P2PAPI.discoverPeers().then(function(result) {
			ui.hideModal();
			var count = (result && result.length) || 0;
			ui.addNotification(null, E('p', {}, 'Found ' + count + ' peer(s)'), 'info');
			self.load().then(function() { self.render(); });
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Scan failed: ' + (err.message || err)), 'error');
		});
	},

	renderHeroBanner: function() {
		return E('div', { 'class': 'hero-banner' }, [
			E('div', { 'class': 'hero-bg' }),
			E('div', { 'class': 'hero-content' }, [
				E('div', { 'class': 'hero-icon' }, '🌐'),
				E('h1', { 'class': 'hero-title' }, 'MirrorBox Network'),
				E('p', { 'class': 'hero-subtitle' }, 'Decentralized Infrastructure for the Future Internet'),
				E('div', { 'class': 'hero-badges' }, [
					E('span', { 'class': 'badge blue' }, '🕸️ P2P Mesh'),
					E('span', { 'class': 'badge green' }, '🛡️ Zero Trust'),
					E('span', { 'class': 'badge purple' }, '⚡ Edge-First'),
					E('span', { 'class': 'badge orange' }, '🔗 Blockchain-Ready')
				]),
				E('p', { 'class': 'hero-desc' },
					'A modular, self-healing network architecture that transforms edge devices into a unified, ' +
					'secure mesh infrastructure. Built for SOC admins who need visibility, control, and resilience.'
				)
			])
		]);
	},

	renderArchitectureDiagram: function() {
		return E('div', { 'class': 'architecture-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '🏗️'),
				'System Architecture'
			]),
			E('div', { 'class': 'arch-diagram' }, [
				// Layer 1: Edge
				E('div', { 'class': 'arch-layer edge' }, [
					E('div', { 'class': 'layer-label' }, 'Edge Layer'),
					E('div', { 'class': 'layer-nodes' }, [
						E('div', { 'class': 'arch-node' }, ['📱', E('span', {}, 'IoT')]),
						E('div', { 'class': 'arch-node' }, ['💻', E('span', {}, 'Clients')]),
						E('div', { 'class': 'arch-node' }, ['📡', E('span', {}, 'Sensors')])
					])
				]),
				E('div', { 'class': 'arch-connector' }, '⬇️'),

				// Layer 2: MirrorBox Mesh
				E('div', { 'class': 'arch-layer mesh' }, [
					E('div', { 'class': 'layer-label' }, 'MirrorBox Mesh Layer'),
					E('div', { 'class': 'layer-nodes' }, [
						E('div', { 'class': 'arch-node primary' }, ['👑', E('span', {}, 'P0 Genesis')]),
						E('div', { 'class': 'arch-node' }, ['🪆', E('span', {}, 'Gigogne L1')]),
						E('div', { 'class': 'arch-node' }, ['🪆', E('span', {}, 'Gigogne L2')]),
						E('div', { 'class': 'arch-node' }, ['🔗', E('span', {}, 'Peer N')])
					]),
					E('div', { 'class': 'mesh-links' }, [
						E('span', {}, '🔒 WireGuard'),
						E('span', {}, '🌐 DNS Fed'),
						E('span', {}, '⚖️ HAProxy')
					])
				]),
				E('div', { 'class': 'arch-connector' }, '⬇️'),

				// Layer 3: Services
				E('div', { 'class': 'arch-layer services' }, [
					E('div', { 'class': 'layer-label' }, 'Service Layer'),
					E('div', { 'class': 'layer-nodes' }, [
						E('div', { 'class': 'arch-node' }, ['🛡️', E('span', {}, 'Security')]),
						E('div', { 'class': 'arch-node' }, ['📊', E('span', {}, 'Monitor')]),
						E('div', { 'class': 'arch-node' }, ['💾', E('span', {}, 'Storage')]),
						E('div', { 'class': 'arch-node' }, ['🤖', E('span', {}, 'AI/ML')])
					])
				]),
				E('div', { 'class': 'arch-connector' }, '⬇️'),

				// Layer 4: Internet
				E('div', { 'class': 'arch-layer internet' }, [
					E('div', { 'class': 'layer-label' }, 'Internet / Cloud'),
					E('div', { 'class': 'layer-nodes' }, [
						E('div', { 'class': 'arch-node' }, ['☁️', E('span', {}, 'Cloud')]),
						E('div', { 'class': 'arch-node' }, ['🌍', E('span', {}, 'CDN')]),
						E('div', { 'class': 'arch-node' }, ['🔌', E('span', {}, 'APIs')])
					])
				])
			])
		]);
	},

	renderModuleGrid: function() {
		var self = this;

		return E('div', { 'class': 'modules-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '🧩'),
				'Modular Components'
			]),
			E('div', { 'class': 'modules-grid' },
				this.modules.map(function(mod) {
					return E('div', {
						'class': 'module-card ' + mod.status,
						'style': '--module-color: ' + mod.color
					}, [
						E('div', { 'class': 'module-header' }, [
							E('span', { 'class': 'module-icon' }, mod.icon),
							E('span', { 'class': 'module-status ' + mod.status },
								mod.status === 'active' ? '●' : '○')
						]),
						E('h3', { 'class': 'module-name' }, mod.name),
						E('p', { 'class': 'module-desc' }, mod.description),
						E('div', { 'class': 'module-components' },
							mod.components.map(function(comp) {
								return E('span', { 'class': 'component-tag' }, comp);
							})
						)
					]);
				})
			)
		]);
	},

	renderNetworkTopology: function() {
		var peersCount = this.peers.length || 0;
		var onlineCount = this.peers.filter(function(p) { return p.status === 'online'; }).length;

		return E('div', { 'class': 'topology-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '🗺️'),
				'Network Topology'
			]),
			E('div', { 'class': 'topology-container' }, [
				E('div', { 'class': 'topo-visual' }, [
					// Central hub
					E('div', { 'class': 'topo-hub' }, [
						E('div', { 'class': 'hub-core' }, '👑'),
						E('div', { 'class': 'hub-label' }, 'Genesis Node'),
						E('div', { 'class': 'hub-rings' }, [
							E('div', { 'class': 'ring ring-1' }),
							E('div', { 'class': 'ring ring-2' }),
							E('div', { 'class': 'ring ring-3' })
						])
					]),
					// Orbital nodes
					E('div', { 'class': 'topo-orbits' }, [
						E('div', { 'class': 'orbit-node n1' }, '🪆'),
						E('div', { 'class': 'orbit-node n2' }, '🪆'),
						E('div', { 'class': 'orbit-node n3' }, '🔗'),
						E('div', { 'class': 'orbit-node n4' }, '🔗'),
						E('div', { 'class': 'orbit-node n5' }, '📡'),
						E('div', { 'class': 'orbit-node n6' }, '📡')
					])
				]),
				E('div', { 'class': 'topo-stats' }, [
					E('div', { 'class': 'topo-stat' }, [
						E('div', { 'class': 'stat-value' }, String(peersCount)),
						E('div', { 'class': 'stat-label' }, 'Total Nodes')
					]),
					E('div', { 'class': 'topo-stat' }, [
						E('div', { 'class': 'stat-value green' }, String(onlineCount)),
						E('div', { 'class': 'stat-label' }, 'Online')
					]),
					E('div', { 'class': 'topo-stat' }, [
						E('div', { 'class': 'stat-value blue' }, '3'),
						E('div', { 'class': 'stat-label' }, 'Gigogne Depth')
					]),
					E('div', { 'class': 'topo-stat' }, [
						E('div', { 'class': 'stat-value purple' }, 'Full'),
						E('div', { 'class': 'stat-label' }, 'Mesh Mode')
					])
				])
			])
		]);
	},

	renderQuickStats: function() {
		var servicesCount = this.services.length || 0;
		var healthStatus = this.health.status || 'unknown';

		return E('div', { 'class': 'stats-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '📈'),
				'System Status'
			]),
			E('div', { 'class': 'stats-grid' }, [
				E('div', { 'class': 'stat-card health ' + healthStatus }, [
					E('div', { 'class': 'stat-icon' }, healthStatus === 'healthy' ? '💚' : '💛'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, healthStatus === 'healthy' ? 'Healthy' : 'Unknown'),
						E('div', { 'class': 'stat-label' }, 'System Health')
					])
				]),
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-icon' }, '🔒'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, this.health.wireguard_mesh ? 'Active' : 'Off'),
						E('div', { 'class': 'stat-label' }, 'WireGuard VPN')
					])
				]),
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-icon' }, '🌐'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, this.health.dns_federation ? 'Active' : 'Off'),
						E('div', { 'class': 'stat-label' }, 'DNS Federation')
					])
				]),
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-icon' }, '⚖️'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, this.health.haproxy ? 'Active' : 'Off'),
						E('div', { 'class': 'stat-label' }, 'Load Balancer')
					])
				]),
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-icon' }, '📡'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, String(servicesCount)),
						E('div', { 'class': 'stat-label' }, 'Active Services')
					])
				]),
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-icon' }, '🛡️'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, String(this.health.services_running || 0)),
						E('div', { 'class': 'stat-label' }, 'Security Services')
					])
				])
			])
		]);
	},

	renderRoadmap: function() {
		var roadmapItems = [
			{ phase: 'Phase 1', status: 'done', title: 'Core Mesh', items: ['P2P Discovery', 'WireGuard VPN', 'DNS Federation'] },
			{ phase: 'Phase 2', status: 'current', title: 'Service Mesh', items: ['HAProxy LB', 'Service Registry', 'Health Checks'] },
			{ phase: 'Phase 3', status: 'planned', title: 'Data Plane', items: ['Gitea VCS', 'Config Sync', 'Backup/Restore'] },
			{ phase: 'Phase 4', status: 'future', title: 'Edge AI', items: ['Local LLM', 'ML Inference', 'Smart Routing'] },
			{ phase: 'Phase 5', status: 'future', title: 'Web3 Ready', items: ['DID Identity', 'Token Economy', 'DAO Governance'] }
		];

		return E('div', { 'class': 'roadmap-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '🚀'),
				'Development Roadmap'
			]),
			E('div', { 'class': 'roadmap-timeline' },
				roadmapItems.map(function(item) {
					return E('div', { 'class': 'roadmap-item ' + item.status }, [
						E('div', { 'class': 'roadmap-marker' },
							item.status === 'done' ? '✓' :
							item.status === 'current' ? '●' : '○'
						),
						E('div', { 'class': 'roadmap-content' }, [
							E('div', { 'class': 'roadmap-phase' }, item.phase),
							E('h4', { 'class': 'roadmap-title' }, item.title),
							E('ul', { 'class': 'roadmap-items' },
								item.items.map(function(i) {
									return E('li', {}, i);
								})
							)
						])
					]);
				})
			)
		]);
	},

	getStyles: function() {
		return [
			// Base
			'.mirrorbox-overview { font-family: system-ui, -apple-system, sans-serif; color: #e0e0e0; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%); min-height: 100vh; padding: 0; }',

			// Quick Actions Bar
			'.quick-actions-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.1); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); }',
			'.actions-left, .actions-right { display: flex; gap: 10px; flex-wrap: wrap; }',
			'.action-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(52,73,94,0.6); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #e0e0e0; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; }',
			'.action-btn:hover { background: rgba(52,73,94,0.9); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }',
			'.action-btn.primary { background: linear-gradient(135deg, rgba(52,152,219,0.6), rgba(155,89,182,0.4)); border-color: rgba(52,152,219,0.5); }',
			'.action-btn.primary:hover { background: linear-gradient(135deg, rgba(52,152,219,0.8), rgba(155,89,182,0.6)); }',
			'.action-btn.refresh { background: rgba(46,204,113,0.3); border-color: rgba(46,204,113,0.4); }',
			'.action-btn.refresh:hover { background: rgba(46,204,113,0.5); }',
			'.action-btn.scan { background: rgba(241,196,15,0.3); border-color: rgba(241,196,15,0.4); }',
			'.action-btn.scan:hover { background: rgba(241,196,15,0.5); }',
			'.action-btn.settings { background: rgba(155,89,182,0.3); border-color: rgba(155,89,182,0.4); }',
			'.action-btn.settings:hover { background: rgba(155,89,182,0.5); }',
			'.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-left: 4px; }',
			'.status-dot.on { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }',
			'.status-dot.off { background: #e74c3c; box-shadow: 0 0 6px #e74c3c; }',

			// Hero Banner
			'.hero-banner { position: relative; padding: 60px 40px; text-align: center; overflow: hidden; }',
			'.hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(52,152,219,0.15) 0%, transparent 70%); }',
			'.hero-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }',
			'.hero-icon { font-size: 64px; margin-bottom: 20px; animation: pulse 2s infinite; }',
			'@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }',
			'.hero-title { font-size: 42px; font-weight: 700; margin: 0 0 10px; background: linear-gradient(135deg, #3498db, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }',
			'.hero-subtitle { font-size: 18px; color: #888; margin: 0 0 20px; }',
			'.hero-badges { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }',
			'.hero-badges .badge { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; }',
			'.badge.blue { background: rgba(52,152,219,0.2); border: 1px solid rgba(52,152,219,0.4); color: #3498db; }',
			'.badge.green { background: rgba(46,204,113,0.2); border: 1px solid rgba(46,204,113,0.4); color: #2ecc71; }',
			'.badge.purple { background: rgba(155,89,182,0.2); border: 1px solid rgba(155,89,182,0.4); color: #9b59b6; }',
			'.badge.orange { background: rgba(230,126,34,0.2); border: 1px solid rgba(230,126,34,0.4); color: #e67e22; }',
			'.hero-desc { font-size: 15px; color: #999; line-height: 1.6; max-width: 600px; margin: 0 auto; }',

			// Section Titles
			'.section-title { display: flex; align-items: center; gap: 12px; font-size: 24px; font-weight: 600; margin: 0 0 25px; padding: 0 40px; color: #fff; }',
			'.title-icon { font-size: 28px; }',

			// Architecture Diagram
			'.architecture-section { padding: 40px 0; background: rgba(0,0,0,0.2); }',
			'.arch-diagram { display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 30px; }',
			'.arch-layer { display: flex; flex-direction: column; align-items: center; padding: 20px 40px; border-radius: 16px; min-width: 500px; }',
			'.arch-layer.edge { background: linear-gradient(135deg, rgba(52,73,94,0.4), rgba(52,73,94,0.2)); border: 1px solid rgba(52,73,94,0.5); }',
			'.arch-layer.mesh { background: linear-gradient(135deg, rgba(52,152,219,0.3), rgba(155,89,182,0.2)); border: 2px solid rgba(52,152,219,0.5); }',
			'.arch-layer.services { background: linear-gradient(135deg, rgba(46,204,113,0.3), rgba(241,196,15,0.2)); border: 1px solid rgba(46,204,113,0.5); }',
			'.arch-layer.internet { background: linear-gradient(135deg, rgba(231,76,60,0.2), rgba(230,126,34,0.2)); border: 1px solid rgba(231,76,60,0.4); }',
			'.layer-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 15px; }',
			'.layer-nodes { display: flex; gap: 20px; justify-content: center; }',
			'.arch-node { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 20px; background: rgba(0,0,0,0.3); border-radius: 10px; font-size: 24px; }',
			'.arch-node span { font-size: 11px; color: #aaa; }',
			'.arch-node.primary { background: linear-gradient(135deg, rgba(241,196,15,0.3), rgba(230,126,34,0.2)); border: 1px solid rgba(241,196,15,0.5); }',
			'.mesh-links { display: flex; gap: 20px; margin-top: 15px; }',
			'.mesh-links span { font-size: 12px; color: #888; padding: 5px 12px; background: rgba(0,0,0,0.3); border-radius: 15px; }',
			'.arch-connector { font-size: 20px; opacity: 0.5; }',

			// Modules Grid
			'.modules-section { padding: 40px 0; }',
			'.modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 0 40px; }',
			'.module-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; transition: all 0.3s; border-left: 4px solid var(--module-color); }',
			'.module-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); border-color: var(--module-color); }',
			'.module-card.planned { opacity: 0.6; }',
			'.module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }',
			'.module-icon { font-size: 32px; }',
			'.module-status { font-size: 12px; }',
			'.module-status.active { color: #2ecc71; }',
			'.module-status.planned { color: #f39c12; }',
			'.module-name { font-size: 18px; font-weight: 600; margin: 0 0 8px; color: #fff; }',
			'.module-desc { font-size: 13px; color: #888; margin: 0 0 15px; }',
			'.module-components { display: flex; flex-wrap: wrap; gap: 6px; }',
			'.component-tag { font-size: 11px; padding: 4px 10px; background: rgba(255,255,255,0.05); border-radius: 12px; color: #aaa; }',

			// Network Topology
			'.topology-section { padding: 40px 0; background: rgba(0,0,0,0.2); }',
			'.topology-container { display: flex; gap: 40px; padding: 0 40px; align-items: center; justify-content: center; flex-wrap: wrap; }',
			'.topo-visual { position: relative; width: 300px; height: 300px; }',
			'.topo-hub { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2; }',
			'.hub-core { font-size: 48px; animation: pulse 2s infinite; }',
			'.hub-label { font-size: 12px; color: #888; margin-top: 5px; }',
			'.hub-rings { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }',
			'.ring { position: absolute; border: 1px solid rgba(52,152,219,0.3); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }',
			'.ring-1 { width: 120px; height: 120px; animation: ringPulse 3s infinite; }',
			'.ring-2 { width: 200px; height: 200px; animation: ringPulse 3s infinite 0.5s; }',
			'.ring-3 { width: 280px; height: 280px; animation: ringPulse 3s infinite 1s; }',
			'@keyframes ringPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }',
			'.topo-orbits { position: absolute; inset: 0; }',
			'.orbit-node { position: absolute; font-size: 24px; animation: orbit 20s linear infinite; }',
			'.orbit-node.n1 { top: 10%; left: 50%; }',
			'.orbit-node.n2 { top: 30%; right: 10%; }',
			'.orbit-node.n3 { bottom: 30%; right: 10%; }',
			'.orbit-node.n4 { bottom: 10%; left: 50%; }',
			'.orbit-node.n5 { bottom: 30%; left: 10%; }',
			'.orbit-node.n6 { top: 30%; left: 10%; }',
			'.topo-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }',
			'.topo-stat { background: rgba(30,30,50,0.6); border-radius: 12px; padding: 20px 30px; text-align: center; }',
			'.stat-value { font-size: 28px; font-weight: 700; color: #fff; }',
			'.stat-value.green { color: #2ecc71; }',
			'.stat-value.blue { color: #3498db; }',
			'.stat-value.purple { color: #9b59b6; }',
			'.stat-label { font-size: 12px; color: #888; margin-top: 5px; }',

			// Quick Stats
			'.stats-section { padding: 40px 0; }',
			'.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; padding: 0 40px; }',
			'.stat-card { display: flex; align-items: center; gap: 15px; background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }',
			'.stat-card .stat-icon { font-size: 32px; }',
			'.stat-card .stat-value { font-size: 18px; font-weight: 600; color: #fff; }',
			'.stat-card .stat-label { font-size: 12px; color: #888; }',
			'.stat-card.health.healthy { border-color: rgba(46,204,113,0.5); }',

			// Roadmap
			'.roadmap-section { padding: 40px 0; background: rgba(0,0,0,0.2); }',
			'.roadmap-timeline { display: flex; gap: 0; padding: 0 40px; overflow-x: auto; }',
			'.roadmap-item { flex: 1; min-width: 180px; position: relative; padding: 20px; }',
			'.roadmap-item::before { content: ""; position: absolute; top: 32px; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.1); }',
			'.roadmap-item.done::before { background: #2ecc71; }',
			'.roadmap-item.current::before { background: linear-gradient(90deg, #3498db, rgba(255,255,255,0.1)); }',
			'.roadmap-marker { width: 24px; height: 24px; border-radius: 50%; background: rgba(30,30,50,0.8); border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 12px; margin-bottom: 15px; position: relative; z-index: 1; }',
			'.roadmap-item.done .roadmap-marker { background: #2ecc71; border-color: #2ecc71; color: #fff; }',
			'.roadmap-item.current .roadmap-marker { background: #3498db; border-color: #3498db; color: #fff; animation: pulse 2s infinite; }',
			'.roadmap-phase { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 5px; }',
			'.roadmap-title { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 10px; }',
			'.roadmap-items { list-style: none; padding: 0; margin: 0; }',
			'.roadmap-items li { font-size: 12px; color: #888; padding: 3px 0; }',
			'.roadmap-items li::before { content: "→ "; color: #555; }',
			'.roadmap-item.done .roadmap-items li::before { color: #2ecc71; }',

			// Responsive
			'@media (max-width: 768px) {',
			'  .hero-title { font-size: 28px; }',
			'  .arch-layer { min-width: auto; width: 100%; }',
			'  .layer-nodes { flex-wrap: wrap; }',
			'  .topology-container { flex-direction: column; }',
			'}'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
