'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require dom';
'require ui';
'require wireguard-dashboard/api as api';

return view.extend({
	title: _('WireGuard Dashboard'),
	pollInterval: 5,
	pollActive: true,
	selectedInterface: 'all',
	peerDescriptions: {},
	bandwidthRates: {},

	load: function() {
		return api.getAllData();
	},

	// Interface control actions
	handleInterfaceAction: function(iface, action) {
		var self = this;
		ui.showModal(_('Interface Control'), [
			E('p', { 'class': 'spinning' }, _('Executing %s on %s...').format(action, iface))
		]);

		api.interfaceControl(iface, action).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('Action completed')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Action failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	// Ping peer
	handlePingPeer: function(peerIp, peerName) {
		var self = this;
		if (!peerIp || peerIp === '(none)') {
			ui.addNotification(null, E('p', _('No endpoint IP available for this peer')), 'warning');
			return;
		}

		// Extract IP from endpoint (remove port)
		var ip = peerIp.split(':')[0];

		ui.showModal(_('Ping Peer'), [
			E('p', { 'class': 'spinning' }, _('Pinging %s (%s)...').format(peerName, ip))
		]);

		api.pingPeer(ip).then(function(result) {
			ui.hideModal();
			if (result.reachable) {
				ui.addNotification(null, E('p', _('Peer %s is reachable (RTT: %s ms)').format(peerName, result.rtt_ms)), 'info');
			} else {
				ui.addNotification(null, E('p', _('Peer %s is not reachable').format(peerName)), 'warning');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Ping failed: %s').format(err.message || err)), 'error');
		});
	},

	// Get peer display name
	getPeerName: function(peer) {
		if (this.peerDescriptions && this.peerDescriptions[peer.public_key]) {
			return this.peerDescriptions[peer.public_key];
		}
		return 'Peer ' + peer.short_key;
	},

	// Interface tab filtering
	setInterfaceFilter: function(ifaceName) {
		this.selectedInterface = ifaceName;
		var tabs = document.querySelectorAll('.wg-tab');
		tabs.forEach(function(tab) {
			tab.classList.toggle('active', tab.dataset.iface === ifaceName);
		});

		// Filter peer cards
		var peerCards = document.querySelectorAll('.wg-peer-card');
		peerCards.forEach(function(card) {
			if (ifaceName === 'all' || card.dataset.interface === ifaceName) {
				card.style.display = '';
			} else {
				card.style.display = 'none';
			}
		});

		// Filter interface cards
		var ifaceCards = document.querySelectorAll('.wg-interface-card');
		ifaceCards.forEach(function(card) {
			if (ifaceName === 'all' || card.dataset.iface === ifaceName) {
				card.style.display = '';
			} else {
				card.style.display = 'none';
			}
		});
	},

	renderInterfaceTabs: function(interfaces) {
		var self = this;
		var tabs = [
			E('button', {
				'class': 'wg-tab active',
				'data-iface': 'all',
				'click': function() { self.setInterfaceFilter('all'); }
			}, 'All Interfaces')
		];

		interfaces.forEach(function(iface) {
			tabs.push(E('button', {
				'class': 'wg-tab',
				'data-iface': iface.name,
				'click': function() { self.setInterfaceFilter(iface.name); }
			}, iface.name));
		});

		return E('div', { 'class': 'wg-interface-tabs' }, tabs);
	},

	// Update stats without full re-render
	updateStats: function(status) {
		var updates = [
			{ selector: '.wg-stat-interfaces', value: status.interface_count || 0 },
			{ selector: '.wg-stat-total-peers', value: status.total_peers || 0 },
			{ selector: '.wg-stat-active-peers', value: status.active_peers || 0 },
			{ selector: '.wg-stat-rx', value: api.formatBytes(status.total_rx || 0) },
			{ selector: '.wg-stat-tx', value: api.formatBytes(status.total_tx || 0) }
		];

		updates.forEach(function(u) {
			var el = document.querySelector(u.selector);
			if (el && el.textContent !== String(u.value)) {
				el.textContent = u.value;
				el.classList.add('wg-value-updated');
				setTimeout(function() { el.classList.remove('wg-value-updated'); }, 500);
			}
		});

		// Update status badge
		var badge = document.querySelector('.wg-status-badge');
		if (badge) {
			var isActive = status.interface_count > 0;
			badge.classList.toggle('offline', !isActive);
			badge.innerHTML = '<span class="wg-status-dot"></span>' + (isActive ? 'VPN Active' : 'No Tunnels');
		}
	},

	// Update peer cards
	updatePeers: function(peers) {
		var grid = document.querySelector('.wg-peer-grid');
		if (!grid) return;

		peers.slice(0, 6).forEach(function(peer, idx) {
			var card = grid.children[idx];
			if (!card) return;

			// Update status
			var statusEl = card.querySelector('.wg-peer-status');
			if (statusEl) {
				statusEl.textContent = peer.status;
				statusEl.className = 'wg-peer-status ' + api.getPeerStatusClass(peer.status);
			}

			// Update handshake
			var hsEl = card.querySelector('.wg-peer-detail-value[data-field="handshake"]');
			if (hsEl) {
				hsEl.textContent = api.formatHandshake(peer.handshake_ago);
			}

			// Update traffic
			var rxEl = card.querySelector('.wg-peer-traffic-value.rx');
			var txEl = card.querySelector('.wg-peer-traffic-value.tx');
			if (rxEl) rxEl.textContent = api.formatBytes(peer.rx_bytes);
			if (txEl) txEl.textContent = api.formatBytes(peer.tx_bytes);

			// Update active state
			card.classList.toggle('active', peer.status === 'active');
		});

		// Update badge count
		var activePeers = peers.filter(function(p) { return p.status === 'active'; }).length;
		var badge = document.querySelector('.wg-peers-badge');
		if (badge) {
			badge.textContent = activePeers + '/' + peers.length + ' active';
		}
	},

	// Update interface cards
	updateInterfaces: function(interfaces) {
		interfaces.forEach(function(iface) {
			var card = document.querySelector('.wg-interface-card[data-iface="' + iface.name + '"]');
			if (!card) return;

			// Update status
			var statusEl = card.querySelector('.wg-interface-status');
			if (statusEl) {
				statusEl.textContent = iface.state;
				statusEl.className = 'wg-interface-status ' + iface.state;
			}

			// Update traffic
			var trafficEl = card.querySelector('.wg-interface-traffic');
			if (trafficEl) {
				trafficEl.textContent = '↓' + api.formatBytes(iface.rx_bytes) + ' / ↑' + api.formatBytes(iface.tx_bytes);
			}
		});
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getAllData().then(L.bind(function(data) {
				var status = data.status || {};
				// Handle RPC expect unwrapping - may be array or object
				var interfacesData = data.interfaces || [];
				var peersData = data.peers || [];
				var interfaces = Array.isArray(interfacesData) ? interfacesData : (interfacesData.interfaces || []);
				var peers = Array.isArray(peersData) ? peersData : (peersData.peers || []);

				this.updateStats(status);
				this.updatePeers(peers);
				this.updateInterfaces(interfaces);
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		// Handle RPC expect unwrapping - may be array or object
		var interfacesData = data.interfaces || [];
		var peersData = data.peers || [];
		var interfaces = Array.isArray(interfacesData) ? interfacesData : (interfacesData.interfaces || []);
		var peers = Array.isArray(peersData) ? peersData : (peersData.peers || []);

		// Store peer descriptions
		this.peerDescriptions = data.descriptions || {};

		var activePeers = peers.filter(function(p) { return p.status === 'active'; }).length;
		
		var view = E('div', { 'class': 'wireguard-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			// Header
			E('div', { 'class': 'wg-header' }, [
				E('div', { 'class': 'wg-logo' }, [
					E('div', { 'class': 'wg-logo-icon' }, '🔐'),
					E('div', { 'class': 'wg-logo-text' }, ['Wire', E('span', {}, 'Guard')])
				]),
				E('div', { 'class': 'wg-header-info' }, [
					E('div', { 
						'class': 'wg-status-badge ' + (status.interface_count > 0 ? '' : 'offline')
					}, [
						E('span', { 'class': 'wg-status-dot' }),
						status.interface_count > 0 ? 'VPN Active' : 'No Tunnels'
					])
				])
			]),
			
			// Auto-refresh control
			E('div', { 'class': 'wg-refresh-control' }, [
				E('span', { 'class': 'wg-refresh-status' }, [
					E('span', { 'class': 'wg-refresh-indicator active' }),
					' Auto-refresh: ',
					E('span', { 'class': 'wg-refresh-state' }, 'Active')
				]),
				E('button', {
					'class': 'wg-btn wg-btn-sm',
					'id': 'wg-poll-toggle',
					'click': L.bind(function(ev) {
						var btn = ev.target;
						var indicator = document.querySelector('.wg-refresh-indicator');
						var state = document.querySelector('.wg-refresh-state');
						if (this.pollActive) {
							this.stopPolling();
							btn.textContent = '▶ Resume';
							indicator.classList.remove('active');
							state.textContent = 'Paused';
						} else {
							this.startPolling();
							btn.textContent = '⏸ Pause';
							indicator.classList.add('active');
							state.textContent = 'Active';
						}
					}, this)
				}, '⏸ Pause')
			]),

			// Interface tabs
			interfaces.length > 1 ? this.renderInterfaceTabs(interfaces) : '',

			// Quick Stats
			E('div', { 'class': 'wg-quick-stats' }, [
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '🌐'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Interfaces')
					]),
					E('div', { 'class': 'wg-quick-stat-value wg-stat-interfaces' }, status.interface_count || 0),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Active tunnels')
				]),
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '👥'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Total Peers')
					]),
					E('div', { 'class': 'wg-quick-stat-value wg-stat-total-peers' }, status.total_peers || 0),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Configured')
				]),
				E('div', { 'class': 'wg-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #34d399)' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '✅'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Active Peers')
					]),
					E('div', { 'class': 'wg-quick-stat-value wg-stat-active-peers' }, status.active_peers || 0),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Connected now')
				]),
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '📥'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Downloaded')
					]),
					E('div', { 'class': 'wg-quick-stat-value wg-stat-rx' }, api.formatBytes(status.total_rx || 0)),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Total received')
				]),
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '📤'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Uploaded')
					]),
					E('div', { 'class': 'wg-quick-stat-value wg-stat-tx' }, api.formatBytes(status.total_tx || 0)),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Total sent')
				])
			]),
			
			// Interfaces
			E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '🔗'),
						'WireGuard Interfaces'
					]),
					E('div', { 'class': 'wg-card-badge' }, interfaces.length + ' tunnel' + (interfaces.length !== 1 ? 's' : ''))
				]),
				E('div', { 'class': 'wg-card-body' }, 
					interfaces.length > 0 ?
					E('div', { 'class': 'wg-charts-grid' },
						interfaces.map(function(iface) {
							return E('div', { 'class': 'wg-interface-card', 'data-iface': iface.name }, [
								E('div', { 'class': 'wg-interface-header' }, [
									E('div', { 'class': 'wg-interface-name' }, [
										E('div', { 'class': 'wg-interface-icon' }, '🌐'),
										E('div', {}, [
											E('h3', {}, iface.name),
											E('p', {}, 'Listen port: ' + (iface.listen_port || 'N/A'))
										])
									]),
									E('span', { 'class': 'wg-interface-status ' + iface.state }, iface.state)
								]),
								E('div', { 'class': 'wg-interface-details' }, [
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'Public Key'),
										E('div', { 'class': 'wg-interface-detail-value' }, api.shortenKey(iface.public_key, 12))
									]),
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'IPv4 Address'),
										E('div', { 'class': 'wg-interface-detail-value' }, iface.ipv4_address || 'N/A')
									]),
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'MTU'),
										E('div', { 'class': 'wg-interface-detail-value' }, iface.mtu || 1420)
									]),
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'Traffic'),
										E('div', { 'class': 'wg-interface-detail-value wg-interface-traffic' },
											'↓' + api.formatBytes(iface.rx_bytes) + ' / ↑' + api.formatBytes(iface.tx_bytes))
									])
								]),
								// Interface control buttons
								E('div', { 'class': 'wg-interface-controls' }, [
									iface.state === 'up' ?
										E('button', {
											'class': 'wg-btn wg-btn-sm wg-btn-warning',
											'click': L.bind(self.handleInterfaceAction, self, iface.name, 'down'),
											'title': _('Bring interface down')
										}, '⏹ Stop') :
										E('button', {
											'class': 'wg-btn wg-btn-sm wg-btn-success',
											'click': L.bind(self.handleInterfaceAction, self, iface.name, 'up'),
											'title': _('Bring interface up')
										}, '▶ Start'),
									E('button', {
										'class': 'wg-btn wg-btn-sm',
										'click': L.bind(self.handleInterfaceAction, self, iface.name, 'restart'),
										'title': _('Restart interface')
									}, '🔄 Restart')
								])
							]);
						})
					) :
					E('div', { 'class': 'wg-empty' }, [
						E('div', { 'class': 'wg-empty-icon' }, '🔐'),
						E('div', { 'class': 'wg-empty-text' }, 'No WireGuard interfaces configured'),
						E('p', {}, 'Configure a WireGuard interface in Network settings')
					])
				)
			]),
			
			// Recent Peers
			peers.length > 0 ? E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '👥'),
						'Connected Peers'
					]),
					E('div', { 'class': 'wg-card-badge wg-peers-badge' }, activePeers + '/' + peers.length + ' active')
				]),
				E('div', { 'class': 'wg-card-body' }, [
					E('div', { 'class': 'wg-peer-grid' },
						peers.slice(0, 6).map(function(peer) {
							var peerName = self.getPeerName(peer);
							return E('div', { 'class': 'wg-peer-card ' + (peer.status === 'active' ? 'active' : ''), 'data-peer': peer.public_key, 'data-interface': peer.interface || '' }, [
								E('div', { 'class': 'wg-peer-header' }, [
									E('div', { 'class': 'wg-peer-info' }, [
										E('div', { 'class': 'wg-peer-icon' }, peer.status === 'active' ? '✅' : '👤'),
										E('div', {}, [
											E('p', { 'class': 'wg-peer-name' }, peerName),
											E('p', { 'class': 'wg-peer-key' }, api.shortenKey(peer.public_key, 16))
										])
									]),
									E('span', { 'class': 'wg-peer-status ' + api.getPeerStatusClass(peer.status) }, peer.status)
								]),
								E('div', { 'class': 'wg-peer-details' }, [
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Endpoint'),
										E('span', { 'class': 'wg-peer-detail-value' }, peer.endpoint || '(none)')
									]),
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Last Handshake'),
										E('span', { 'class': 'wg-peer-detail-value', 'data-field': 'handshake' }, api.formatHandshake(peer.handshake_ago))
									]),
									E('div', { 'class': 'wg-peer-detail', 'style': 'grid-column: span 2' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Allowed IPs'),
										E('span', { 'class': 'wg-peer-detail-value' }, peer.allowed_ips || 'N/A')
									])
								]),
								E('div', { 'class': 'wg-peer-traffic' }, [
									E('div', { 'class': 'wg-peer-traffic-item' }, [
										E('div', { 'class': 'wg-peer-traffic-icon' }, '📥'),
										E('div', { 'class': 'wg-peer-traffic-value rx' }, api.formatBytes(peer.rx_bytes)),
										E('div', { 'class': 'wg-peer-traffic-label' }, 'Received')
									]),
									E('div', { 'class': 'wg-peer-traffic-item' }, [
										E('div', { 'class': 'wg-peer-traffic-icon' }, '📤'),
										E('div', { 'class': 'wg-peer-traffic-value tx' }, api.formatBytes(peer.tx_bytes)),
										E('div', { 'class': 'wg-peer-traffic-label' }, 'Sent')
									])
								]),
								// Peer action buttons
								peer.endpoint && peer.endpoint !== '(none)' ?
									E('div', { 'class': 'wg-peer-actions' }, [
										E('button', {
											'class': 'wg-btn wg-btn-xs',
											'click': L.bind(self.handlePingPeer, self, peer.endpoint, peerName),
											'title': _('Ping peer')
										}, '📡 Ping')
									]) : ''
							]);
						})
					)
				])
			]) : ''
		]);

		// Include CSS
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('wireguard-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);

		// Start auto-refresh
		this.startPolling();

		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
