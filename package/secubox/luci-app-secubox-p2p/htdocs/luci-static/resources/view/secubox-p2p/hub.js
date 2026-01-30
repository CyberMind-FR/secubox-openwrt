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
	dnsConfig: {},
	wgConfig: {},
	haConfig: {},
	registry: {},
	health: {},

	// View state
	masterViewMode: 'master',
	masterViewTab: 'overview',

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.getPeers().catch(function() { return { peers: [] }; }),
			P2PAPI.getSettings().catch(function() { return {}; }),
			P2PAPI.getServices().catch(function() { return { services: [] }; }),
			P2PAPI.getDNSConfig().catch(function() { return {}; }),
			P2PAPI.getWireGuardConfig().catch(function() { return {}; }),
			P2PAPI.getHAProxyConfig().catch(function() { return {}; }),
			P2PAPI.getRegistry().catch(function() { return {}; }),
			P2PAPI.healthCheck().catch(function() { return {}; })
		]).then(function(results) {
			self.peers = results[0].peers || [];
			self.settings = results[1] || {};
			self.services = results[2].services || [];
			self.dnsConfig = results[3] || {};
			self.wgConfig = results[4] || {};
			self.haConfig = results[5] || {};
			self.registry = results[6] || {};
			self.health = results[7] || {};
			return {};
		});
	},

	render: function() {
		var self = this;

		var container = E('div', { 'class': 'p2p-hub-page' }, [
			E('style', {}, this.getStyles()),

			// Header
			E('div', { 'class': 'hub-header' }, [
				E('div', { 'class': 'hub-title' }, [
					E('span', { 'class': 'title-icon' }, '🌐'),
					'SecuBox P2P Hub'
				]),
				E('div', { 'class': 'hub-subtitle' },
					this.peers.length + ' peers connected • Mesh Federation Ready')
			]),

			// Quick Stats
			E('div', { 'class': 'stats-row' }, [
				this.renderStatCard('👥', this.peers.length, 'Peers', this.peers.filter(function(p) { return p.status === 'online'; }).length + ' online'),
				this.renderStatCard('📡', this.services.length, 'Services', 'Local'),
				this.renderStatCard('🌐', this.dnsConfig.enabled ? 'ON' : 'OFF', 'DNS Fed', this.dnsConfig.base_domain || 'sb.local'),
				this.renderStatCard('🔒', this.wgConfig.enabled ? 'ON' : 'OFF', 'WireGuard', this.wgConfig.network_cidr || '10.100.0.0/24'),
				this.renderStatCard('⚖️', this.haConfig.enabled ? 'ON' : 'OFF', 'HAProxy', this.haConfig.strategy || 'round-robin')
			]),

			// Main Content Grid
			E('div', { 'class': 'hub-grid' }, [
				// Master/Peer Overview
				this.renderMasterPanel(),

				// Network Matrix
				this.renderNetworkMatrix(),

				// DNS Federation
				this.renderDNSPanel(),

				// WireGuard Mesh
				this.renderWireGuardPanel(),

				// HAProxy
				this.renderHAProxyPanel(),

				// Hub Registry
				this.renderRegistryPanel(),

				// Services
				this.renderServicesPanel(),

				// Peers List
				this.renderPeersPanel()
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
			P2PAPI.healthCheck()
		]).then(function(results) {
			self.peers = results[0].peers || [];
			self.health = results[1] || {};
		}).catch(function() {});
	},

	renderStatCard: function(icon, value, label, sublabel) {
		return E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'stat-icon' }, icon),
			E('div', { 'class': 'stat-value' }, String(value)),
			E('div', { 'class': 'stat-label' }, label),
			sublabel ? E('div', { 'class': 'stat-sublabel' }, sublabel) : null
		]);
	},

	renderMasterPanel: function() {
		var self = this;
		var viewNodes = [{ id: 'master', name: 'Master (You)', icon: '👑' }];
		this.peers.forEach(function(p) {
			viewNodes.push({ id: p.id, name: p.name || p.id, icon: '🖥️' });
		});

		return E('div', { 'class': 'hub-panel master-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['🎛️ ', 'Master Control']),
				E('select', {
					'class': 'view-select',
					'change': function(e) { self.switchView(e.target.value); }
				}, viewNodes.map(function(n) {
					return E('option', { 'value': n.id }, n.icon + ' ' + n.name);
				}))
			]),

			// Tabs
			E('div', { 'class': 'panel-tabs' }, [
				this.renderTab('overview', '📊', 'Overview'),
				this.renderTab('services', '📡', 'Services'),
				this.renderTab('dns', '🌐', 'DNS'),
				this.renderTab('config', '⚙️', 'Config')
			]),

			// Content
			E('div', { 'id': 'master-content', 'class': 'panel-content' },
				this.renderTabContent(this.masterViewTab)),

			// Actions
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn primary', 'click': function() { self.syncAll(); } }, '🔄 Sync All'),
				E('button', { 'class': 'btn', 'click': function() { self.broadcastRestart(); } }, '🔁 Restart'),
				E('button', { 'class': 'btn', 'click': function() { self.showBroadcastModal(); } }, '📢 Broadcast')
			])
		]);
	},

	renderTab: function(id, icon, label) {
		var self = this;
		return E('button', {
			'class': 'tab' + (this.masterViewTab === id ? ' active' : ''),
			'click': function() { self.switchTab(id); }
		}, [icon + ' ' + label]);
	},

	renderTabContent: function(tab) {
		switch(tab) {
			case 'services':
				return E('div', { 'class': 'tab-content' }, [
					E('h4', {}, 'Local Services'),
					E('div', { 'class': 'services-list' },
						this.services.length > 0 ?
							this.services.map(function(s) {
								return E('div', { 'class': 'service-row' }, [
									E('span', { 'class': 'svc-name' }, s.name),
									E('span', { 'class': 'svc-port' }, s.port ? ':' + s.port : ''),
									E('span', { 'class': 'svc-status ' + s.status }, s.status)
								]);
							}) :
							E('div', { 'class': 'empty' }, 'No services detected')
					)
				]);

			case 'dns':
				return E('div', { 'class': 'tab-content' }, [
					E('h4', {}, 'DNS Configuration'),
					E('div', { 'class': 'config-grid' }, [
						E('div', {}, ['Primary: ', E('code', {}, this.dnsConfig.primary_dns || '127.0.0.1:53')]),
						E('div', {}, ['Domain: ', E('code', {}, this.dnsConfig.base_domain || 'sb.local')]),
						E('div', {}, ['Federation: ', E('span', { 'class': this.dnsConfig.enabled ? 'on' : 'off' }, this.dnsConfig.enabled ? 'Enabled' : 'Disabled')])
					])
				]);

			case 'config':
				return E('div', { 'class': 'tab-content' }, [
					E('h4', {}, 'System Configuration'),
					E('div', { 'class': 'config-grid' }, [
						E('div', {}, ['WireGuard: ', E('span', { 'class': this.wgConfig.enabled ? 'on' : 'off' }, this.wgConfig.enabled ? 'ON' : 'OFF')]),
						E('div', {}, ['HAProxy: ', E('span', { 'class': this.haConfig.enabled ? 'on' : 'off' }, this.haConfig.enabled ? 'ON' : 'OFF')]),
						E('div', {}, ['Sharing: ', E('span', { 'class': this.settings.sharing_enabled ? 'on' : 'off' }, this.settings.sharing_enabled ? 'ON' : 'OFF')])
					])
				]);

			default: // overview
				return E('div', { 'class': 'tab-content' }, [
					E('div', { 'class': 'overview-stats' }, [
						E('div', { 'class': 'ov-stat' }, [
							E('div', { 'class': 'ov-value' }, String(this.peers.filter(function(p) { return p.status === 'online'; }).length)),
							E('div', { 'class': 'ov-label' }, 'Online Peers')
						]),
						E('div', { 'class': 'ov-stat' }, [
							E('div', { 'class': 'ov-value' }, String(this.services.length)),
							E('div', { 'class': 'ov-label' }, 'Services')
						]),
						E('div', { 'class': 'ov-stat' }, [
							E('div', { 'class': 'ov-value' }, this.health.status === 'healthy' ? '✓' : '!'),
							E('div', { 'class': 'ov-label' }, 'Health')
						])
					])
				]);
		}
	},

	switchTab: function(tab) {
		this.masterViewTab = tab;
		var content = document.getElementById('master-content');
		if (content) dom.content(content, this.renderTabContent(tab));
		document.querySelectorAll('.panel-tabs .tab').forEach(function(t) {
			t.classList.toggle('active', t.textContent.toLowerCase().includes(tab));
		});
	},

	switchView: function(viewId) {
		this.masterViewMode = viewId;
		ui.addNotification(null, E('p', 'Switched to view: ' + viewId), 'info');
	},

	renderNetworkMatrix: function() {
		var self = this;
		return E('div', { 'class': 'hub-panel matrix-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['🕸️ ', 'Network Matrix']),
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

	renderDNSPanel: function() {
		var self = this;
		return E('div', { 'class': 'hub-panel dns-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['🌐 ', 'DNS Federation']),
				E('label', { 'class': 'toggle' }, [
					E('input', {
						'type': 'checkbox',
						'checked': this.dnsConfig.enabled,
						'change': function(e) { self.toggleDNS(e.target.checked); }
					}),
					E('span', { 'class': 'slider' })
				])
			]),
			E('div', { 'class': 'panel-body' }, [
				E('div', { 'class': 'info-row' }, ['Domain: ', E('code', {}, this.dnsConfig.base_domain || 'sb.local')]),
				E('div', { 'class': 'info-row' }, ['Zones: ', E('strong', {}, String(this.peers.length + 1))]),
				E('div', { 'class': 'info-row' }, ['Sync: ', E('span', {}, this.dnsConfig.sync_enabled ? 'Enabled' : 'Disabled')])
			])
		]);
	},

	renderWireGuardPanel: function() {
		var self = this;
		return E('div', { 'class': 'hub-panel wg-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['🔒 ', 'WireGuard Mesh']),
				E('label', { 'class': 'toggle' }, [
					E('input', {
						'type': 'checkbox',
						'checked': this.wgConfig.enabled,
						'change': function(e) { self.toggleWireGuard(e.target.checked); }
					}),
					E('span', { 'class': 'slider' })
				])
			]),
			E('div', { 'class': 'panel-body' }, [
				E('div', { 'class': 'info-row' }, ['Network: ', E('code', {}, this.wgConfig.network_cidr || '10.100.0.0/24')]),
				E('div', { 'class': 'info-row' }, ['Port: ', E('strong', {}, String(this.wgConfig.listen_port || 51820))]),
				E('div', { 'class': 'info-row' }, ['Peers: ', E('strong', {}, String(this.peers.length))])
			])
		]);
	},

	renderHAProxyPanel: function() {
		var self = this;
		return E('div', { 'class': 'hub-panel ha-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['⚖️ ', 'Load Balancer']),
				E('label', { 'class': 'toggle' }, [
					E('input', {
						'type': 'checkbox',
						'checked': this.haConfig.enabled,
						'change': function(e) { self.toggleHAProxy(e.target.checked); }
					}),
					E('span', { 'class': 'slider' })
				])
			]),
			E('div', { 'class': 'panel-body' }, [
				E('div', { 'class': 'info-row' }, ['Strategy: ', E('strong', {}, this.haConfig.strategy || 'round-robin')]),
				E('div', { 'class': 'info-row' }, ['Backends: ', E('strong', {}, String(this.peers.length + 1))]),
				E('div', { 'class': 'info-row' }, ['Health Check: ', E('span', {}, this.haConfig.health_check ? 'Yes' : 'No')])
			])
		]);
	},

	renderRegistryPanel: function() {
		var self = this;
		return E('div', { 'class': 'hub-panel registry-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['🔗 ', 'Hub Registry']),
				E('code', { 'class': 'url-badge' }, this.registry.base_url || 'sb.local')
			]),
			E('div', { 'class': 'panel-body' }, [
				E('div', { 'class': 'info-row' }, ['Cache: ', E('span', {}, this.registry.cache_enabled ? 'Enabled' : 'Disabled')]),
				E('div', { 'class': 'info-row' }, ['TTL: ', E('strong', {}, (this.registry.cache_ttl || 300) + 's')])
			]),
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn small', 'click': function() { self.showRegisterURLModal(); } }, '➕ Register URL')
			])
		]);
	},

	renderServicesPanel: function() {
		var self = this;
		return E('div', { 'class': 'hub-panel services-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['📡 ', 'Services']),
				E('span', { 'class': 'badge' }, this.services.length)
			]),
			E('div', { 'class': 'services-grid' },
				this.services.slice(0, 6).map(function(s) {
					return E('div', { 'class': 'service-card' }, [
						E('div', { 'class': 'svc-icon' }, s.name === 'dnsmasq' ? '🌐' : s.name === 'crowdsec' ? '🛡️' : '📡'),
						E('div', { 'class': 'svc-name' }, s.name),
						E('div', { 'class': 'svc-status ' + s.status }, s.status)
					]);
				})
			)
		]);
	},

	renderPeersPanel: function() {
		var self = this;
		return E('div', { 'class': 'hub-panel peers-panel' }, [
			E('div', { 'class': 'panel-header' }, [
				E('h3', {}, ['👥 ', 'Connected Peers']),
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
					E('div', { 'class': 'empty' }, 'No peers connected. Click Discover to find peers.')
			),
			E('div', { 'class': 'panel-actions' }, [
				E('button', { 'class': 'btn', 'click': function() { self.showAddPeerModal(); } }, '➕ Add Peer')
			])
		]);
	},

	// Actions
	syncAll: function() {
		P2PAPI.syncCatalog().then(function(result) {
			ui.addNotification(null, E('p', 'Synced with ' + (result.synced_peers || 0) + ' peers'), 'info');
		});
	},

	broadcastRestart: function() {
		P2PAPI.broadcastCommand('restart').then(function(result) {
			ui.addNotification(null, E('p', 'Restart broadcast sent'), 'info');
		});
	},

	discoverPeers: function() {
		var self = this;
		ui.addNotification(null, E('p', 'Discovering peers...'), 'info');
		P2PAPI.discover(5).then(function(result) {
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
		P2PAPI.setDNSConfig({ enabled: enabled }).then(function() {
			ui.addNotification(null, E('p', 'DNS Federation ' + (enabled ? 'enabled' : 'disabled')), 'info');
		});
	},

	toggleWireGuard: function(enabled) {
		P2PAPI.setWireGuardConfig({ enabled: enabled }).then(function() {
			ui.addNotification(null, E('p', 'WireGuard ' + (enabled ? 'enabled' : 'disabled')), 'info');
		});
	},

	toggleHAProxy: function(enabled) {
		P2PAPI.setHAProxyConfig({ enabled: enabled }).then(function() {
			ui.addNotification(null, E('p', 'HAProxy ' + (enabled ? 'enabled' : 'disabled')), 'info');
		});
	},

	showBroadcastModal: function() {
		var self = this;
		ui.showModal('Broadcast Command', [
			E('select', { 'id': 'broadcast-cmd', 'class': 'cbi-input-select' }, [
				E('option', { 'value': 'sync' }, 'Sync Configuration'),
				E('option', { 'value': 'restart' }, 'Restart Services'),
				E('option', { 'value': 'update' }, 'Update Packages'),
				E('option', { 'value': 'backup' }, 'Run Backup')
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em;' }, [
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
			E('div', {}, [
				E('label', {}, 'Peer Address'),
				E('input', { 'type': 'text', 'id': 'peer-addr', 'class': 'cbi-input-text', 'placeholder': '192.168.1.100' }),
				E('label', { 'style': 'margin-top:10px;display:block;' }, 'Peer Name (optional)'),
				E('input', { 'type': 'text', 'id': 'peer-name', 'class': 'cbi-input-text', 'placeholder': 'My Peer' })
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em;' }, [
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

	showRegisterURLModal: function() {
		ui.showModal('Register Short URL', [
			E('div', {}, [
				E('label', {}, 'Short URL'),
				E('input', { 'type': 'text', 'id': 'short-url', 'class': 'cbi-input-text', 'placeholder': 'my-service' }),
				E('label', { 'style': 'margin-top:10px;display:block;' }, 'Target URL'),
				E('input', { 'type': 'text', 'id': 'target-url', 'class': 'cbi-input-text', 'placeholder': 'http://192.168.1.1:8080' })
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var shortUrl = document.getElementById('short-url').value;
					var targetUrl = document.getElementById('target-url').value;
					if (shortUrl && targetUrl) {
						P2PAPI.registerURL(shortUrl, targetUrl).then(function(result) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'URL registered: ' + (result.registered_url || shortUrl)), 'info');
						});
					}
				} }, 'Register')
			])
		]);
	},

	getStyles: function() {
		return [
			'.p2p-hub-page { background: linear-gradient(135deg, #0a0a0f, #1a1a2e); min-height: 100vh; padding: 20px; color: #e0e0e0; }',
			'.hub-header { text-align: center; margin-bottom: 30px; }',
			'.hub-title { font-size: 28px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12px; }',
			'.title-icon { font-size: 36px; }',
			'.hub-subtitle { color: #888; margin-top: 8px; }',

			'.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 25px; }',
			'.stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 15px; text-align: center; }',
			'.stat-icon { font-size: 24px; margin-bottom: 8px; }',
			'.stat-value { font-size: 24px; font-weight: 700; }',
			'.stat-label { font-size: 12px; color: #888; }',
			'.stat-sublabel { font-size: 10px; color: #666; margin-top: 4px; }',

			'.hub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }',
			'.hub-panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; }',
			'.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }',
			'.panel-header h3 { margin: 0; font-size: 15px; display: flex; align-items: center; gap: 6px; }',
			'.panel-body { margin-bottom: 15px; }',
			'.panel-actions { display: flex; gap: 10px; flex-wrap: wrap; }',
			'.panel-tabs { display: flex; gap: 6px; margin-bottom: 15px; }',
			'.panel-content { min-height: 100px; }',

			'.badge { background: rgba(99,102,241,0.2); color: #818cf8; padding: 4px 10px; border-radius: 12px; font-size: 11px; }',
			'.url-badge { padding: 4px 8px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 12px; }',

			'.btn { padding: 8px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e0e0e0; cursor: pointer; font-size: 13px; transition: all 0.2s; }',
			'.btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); }',
			'.btn.primary { background: linear-gradient(135deg, #667eea, #764ba2); border: none; }',
			'.btn.small { padding: 6px 12px; font-size: 12px; }',
			'.btn-icon { background: none; border: none; cursor: pointer; opacity: 0.5; }',
			'.btn-icon:hover { opacity: 1; }',

			'.tab { padding: 8px 14px; background: rgba(0,0,0,0.2); border: 1px solid transparent; border-radius: 6px; color: #e0e0e0; cursor: pointer; font-size: 12px; }',
			'.tab.active { background: rgba(99,102,241,0.3); border-color: rgba(99,102,241,0.5); }',
			'.tab-content h4 { margin: 0 0 12px 0; font-size: 13px; }',

			'.toggle { position: relative; width: 44px; height: 24px; }',
			'.toggle input { opacity: 0; width: 0; height: 0; }',
			'.slider { position: absolute; cursor: pointer; inset: 0; background: rgba(255,255,255,0.1); border-radius: 12px; transition: 0.3s; }',
			'.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }',
			'input:checked + .slider { background: #667eea; }',
			'input:checked + .slider:before { transform: translateX(20px); }',

			'.view-select { padding: 6px 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #e0e0e0; font-size: 12px; }',

			'.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }',
			'.info-row:last-child { border-bottom: none; }',
			'code { padding: 2px 6px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 12px; }',

			'.matrix-view { height: 200px; display: flex; align-items: center; justify-content: center; position: relative; }',
			'.matrix-center { z-index: 2; }',
			'.matrix-ring { position: absolute; width: 100%; height: 100%; }',
			'.node { display: flex; flex-direction: column; align-items: center; font-size: 12px; }',
			'.node.master { background: linear-gradient(135deg, #667eea, #764ba2); padding: 12px 16px; border-radius: 12px; }',
			'.node.peer { position: absolute; top: 50%; left: 50%; width: 36px; height: 36px; margin: -18px; background: rgba(16,185,129,0.2); border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }',
			'.node.peer.offline { background: rgba(239,68,68,0.2); border-color: #ef4444; }',

			'.services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; }',
			'.service-card { padding: 12px; background: rgba(0,0,0,0.2); border-radius: 10px; text-align: center; }',
			'.service-card .svc-icon { font-size: 24px; margin-bottom: 6px; }',
			'.service-card .svc-name { font-size: 11px; font-weight: 500; }',
			'.service-card .svc-status { font-size: 10px; margin-top: 4px; }',
			'.svc-status.running { color: #10b981; }',

			'.services-list .service-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }',
			'.services-list .svc-name { flex: 1; }',
			'.services-list .svc-port { color: #888; font-size: 12px; }',
			'.services-list .svc-status { padding: 3px 8px; border-radius: 10px; font-size: 10px; }',
			'.services-list .svc-status.running { background: rgba(16,185,129,0.2); color: #10b981; }',

			'.peers-list { max-height: 300px; overflow-y: auto; }',
			'.peer-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }',
			'.peer-icon { font-size: 20px; }',
			'.peer-info { flex: 1; }',
			'.peer-name { font-weight: 500; }',
			'.peer-addr { font-size: 11px; color: #888; }',
			'.peer-status { width: 10px; height: 10px; border-radius: 50%; }',
			'.peer-status.online { background: #10b981; }',
			'.peer-status.offline { background: #ef4444; }',

			'.overview-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }',
			'.ov-stat { text-align: center; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px; }',
			'.ov-value { font-size: 28px; font-weight: 700; }',
			'.ov-label { font-size: 11px; color: #888; margin-top: 4px; }',

			'.config-grid { display: flex; flex-direction: column; gap: 8px; }',
			'.on { color: #10b981; }',
			'.off { color: #6b7280; }',
			'.empty { text-align: center; padding: 30px; color: #666; }',

			'.master-panel { grid-column: span 2; }',
			'@media (max-width: 768px) { .master-panel { grid-column: span 1; } }'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
