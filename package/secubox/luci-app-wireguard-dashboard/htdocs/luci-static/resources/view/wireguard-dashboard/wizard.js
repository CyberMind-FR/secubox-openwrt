'use strict';
'require view';
'require ui';
'require rpc';
'require form';
'require network';
'require wireguard-dashboard/api as api';

// Zone presets for peer creation
var ZONE_PRESETS = {
	'home-user': {
		name: 'Home User',
		icon: '🏠',
		color: '#22c55e',
		description: 'Family members with full network access',
		allowed_ips: '0.0.0.0/0, ::/0',
		dns: '1.1.1.1, 1.0.0.1',
		keepalive: 25,
		mtu: 1420,
		split_tunnel: false
	},
	'remote-worker': {
		name: 'Remote Worker',
		icon: '💼',
		color: '#3b82f6',
		description: 'Work from home with access to office resources',
		allowed_ips: '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16',
		dns: '${SERVER_IP}',
		keepalive: 25,
		mtu: 1420,
		split_tunnel: true
	},
	'mobile-device': {
		name: 'Mobile Device',
		icon: '📱',
		color: '#8b5cf6',
		description: 'Smartphones and tablets on the go',
		allowed_ips: '0.0.0.0/0, ::/0',
		dns: '1.1.1.1, 1.0.0.1',
		keepalive: 25,
		mtu: 1280,
		split_tunnel: false
	},
	'iot-device': {
		name: 'IoT Device',
		icon: '🔌',
		color: '#f59e0b',
		description: 'Smart home devices with limited access',
		allowed_ips: '${VPN_NETWORK}',
		dns: '${SERVER_IP}',
		keepalive: 60,
		mtu: 1420,
		split_tunnel: true
	},
	'guest': {
		name: 'Guest',
		icon: '👤',
		color: '#06b6d4',
		description: 'Temporary access for visitors',
		allowed_ips: '0.0.0.0/0, ::/0',
		dns: '1.1.1.1',
		keepalive: 25,
		mtu: 1420,
		split_tunnel: false,
		expires: true
	},
	'server': {
		name: 'Server/Site',
		icon: '🖥️',
		color: '#ef4444',
		description: 'Site-to-site connection to another network',
		allowed_ips: '${REMOTE_NETWORK}',
		dns: '',
		keepalive: 25,
		mtu: 1420,
		split_tunnel: true
	}
};

var TUNNEL_PRESETS = {
	'road-warrior': {
		name: 'Road Warrior (Remote Access)',
		icon: '🚗',
		description: 'Connect mobile users to your network from anywhere',
		listen_port: 51820,
		network: '10.10.0.0/24',
		server_ip: '10.10.0.1',
		peer_start_ip: 2,
		recommended_zones: ['home-user', 'remote-worker', 'mobile-device', 'guest']
	},
	'site-to-site': {
		name: 'Site-to-Site VPN',
		icon: '🏢',
		description: 'Connect two networks securely over the internet',
		listen_port: 51821,
		network: '10.20.0.0/24',
		server_ip: '10.20.0.1',
		peer_start_ip: 2,
		recommended_zones: ['server']
	},
	'iot-tunnel': {
		name: 'IoT Secure Tunnel',
		icon: '🔒',
		description: 'Isolated tunnel for smart home devices',
		listen_port: 51822,
		network: '10.30.0.0/24',
		server_ip: '10.30.0.1',
		peer_start_ip: 2,
		recommended_zones: ['iot-device']
	}
};

return view.extend({
	title: _('WireGuard Setup Wizard'),
	currentStep: 1,
	totalSteps: 4,
	wizardData: {},

	load: function() {
		return Promise.all([
			api.getInterfaces(),
			api.getStatus(),
			this.getPublicIP()
		]);
	},

	getPublicIP: function() {
		// Try to get public IP
		return new Promise(function(resolve) {
			fetch('https://api.ipify.org?format=json')
				.then(function(r) { return r.json(); })
				.then(function(d) { resolve(d.ip); })
				.catch(function() { resolve(''); });
		});
	},

	render: function(data) {
		var self = this;
		var interfaces = (data[0] || {}).interfaces || [];
		var status = data[1] || {};
		var publicIP = data[2] || '';

		this.wizardData.publicIP = publicIP;
		this.wizardData.existingInterfaces = interfaces;

		var view = E('div', { 'class': 'wg-wizard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('wireguard-dashboard/dashboard.css') }),
			E('style', {}, this.getWizardCSS()),

			// Header
			E('div', { 'class': 'wg-wizard-header' }, [
				E('div', { 'class': 'wg-wizard-logo' }, '🔐'),
				E('h1', {}, _('WireGuard Setup Wizard')),
				E('p', {}, _('Create and configure secure VPN tunnels in minutes'))
			]),

			// Progress bar
			E('div', { 'class': 'wg-wizard-progress' }, [
				this.renderProgressStep(1, _('Tunnel Type'), true),
				this.renderProgressStep(2, _('Configuration'), false),
				this.renderProgressStep(3, _('Add Peers'), false),
				this.renderProgressStep(4, _('Complete'), false)
			]),

			// Wizard content
			E('div', { 'class': 'wg-wizard-content', 'id': 'wizard-content' }, [
				this.renderStep1()
			]),

			// Navigation
			E('div', { 'class': 'wg-wizard-nav' }, [
				E('button', {
					'class': 'wg-btn wg-btn-secondary',
					'id': 'btn-prev',
					'style': 'visibility: hidden;',
					'click': L.bind(this.prevStep, this)
				}, _('← Back')),
				E('button', {
					'class': 'wg-btn wg-btn-primary',
					'id': 'btn-next',
					'click': L.bind(this.nextStep, this)
				}, _('Continue →'))
			])
		]);

		return view;
	},

	renderProgressStep: function(num, label, active) {
		return E('div', { 'class': 'wg-progress-step ' + (active ? 'active' : ''), 'data-step': num }, [
			E('div', { 'class': 'wg-progress-num' }, num),
			E('div', { 'class': 'wg-progress-label' }, label)
		]);
	},

	renderStep1: function() {
		var self = this;
		var presets = Object.keys(TUNNEL_PRESETS).map(function(key) {
			var preset = TUNNEL_PRESETS[key];
			return E('div', {
				'class': 'wg-preset-card',
				'data-preset': key,
				'click': function() {
					document.querySelectorAll('.wg-preset-card').forEach(function(c) {
						c.classList.remove('selected');
					});
					this.classList.add('selected');
					self.wizardData.tunnelPreset = key;
				}
			}, [
				E('div', { 'class': 'wg-preset-icon' }, preset.icon),
				E('div', { 'class': 'wg-preset-info' }, [
					E('h3', {}, preset.name),
					E('p', {}, preset.description)
				]),
				E('div', { 'class': 'wg-preset-check' }, '✓')
			]);
		});

		return E('div', { 'class': 'wg-wizard-step' }, [
			E('h2', {}, _('Choose Tunnel Type')),
			E('p', { 'class': 'wg-step-desc' }, _('Select the type of VPN tunnel you want to create')),
			E('div', { 'class': 'wg-preset-grid' }, presets)
		]);
	},

	renderStep2: function() {
		var self = this;
		var preset = TUNNEL_PRESETS[this.wizardData.tunnelPreset] || TUNNEL_PRESETS['road-warrior'];

		return E('div', { 'class': 'wg-wizard-step' }, [
			E('h2', {}, _('Configure Tunnel')),
			E('p', { 'class': 'wg-step-desc' }, _('Set up your %s tunnel').format(preset.name)),

			E('div', { 'class': 'wg-config-grid' }, [
				// Left column - Basic config
				E('div', { 'class': 'wg-config-section' }, [
					E('h3', {}, '🌐 ' + _('Network Settings')),

					E('div', { 'class': 'wg-form-group' }, [
						E('label', {}, _('Interface Name')),
						E('input', {
							'type': 'text',
							'id': 'cfg-iface-name',
							'class': 'wg-input',
							'value': 'wg0',
							'placeholder': 'wg0'
						}),
						E('small', {}, _('Name for the WireGuard interface'))
					]),

					E('div', { 'class': 'wg-form-group' }, [
						E('label', {}, _('Listen Port')),
						E('input', {
							'type': 'number',
							'id': 'cfg-listen-port',
							'class': 'wg-input',
							'value': preset.listen_port,
							'min': 1024,
							'max': 65535
						}),
						E('small', {}, _('UDP port for incoming connections'))
					]),

					E('div', { 'class': 'wg-form-group' }, [
						E('label', {}, _('VPN Network')),
						E('input', {
							'type': 'text',
							'id': 'cfg-vpn-network',
							'class': 'wg-input',
							'value': preset.network,
							'placeholder': '10.10.0.0/24'
						}),
						E('small', {}, _('Internal network for VPN clients'))
					]),

					E('div', { 'class': 'wg-form-group' }, [
						E('label', {}, _('Server VPN IP')),
						E('input', {
							'type': 'text',
							'id': 'cfg-server-ip',
							'class': 'wg-input',
							'value': preset.server_ip,
							'placeholder': '10.10.0.1'
						}),
						E('small', {}, _('IP address of this server in VPN'))
					])
				]),

				// Right column - Endpoint
				E('div', { 'class': 'wg-config-section' }, [
					E('h3', {}, '🔗 ' + _('Public Endpoint')),

					E('div', { 'class': 'wg-form-group' }, [
						E('label', {}, _('Public IP / Hostname')),
						E('input', {
							'type': 'text',
							'id': 'cfg-public-endpoint',
							'class': 'wg-input',
							'value': this.wizardData.publicIP || '',
							'placeholder': 'vpn.example.com'
						}),
						E('small', {}, _('How clients will reach this server')),
						this.wizardData.publicIP ? E('div', { 'class': 'wg-detected' }, [
							E('span', {}, '✓ ' + _('Detected: ')),
							E('code', {}, this.wizardData.publicIP)
						]) : ''
					]),

					E('div', { 'class': 'wg-form-group' }, [
						E('label', {}, _('MTU')),
						E('input', {
							'type': 'number',
							'id': 'cfg-mtu',
							'class': 'wg-input',
							'value': 1420,
							'min': 1280,
							'max': 1500
						}),
						E('small', {}, _('Maximum transmission unit (1420 recommended)'))
					]),

					E('div', { 'class': 'wg-info-box' }, [
						E('strong', {}, '💡 ' + _('Firewall Note')),
						E('p', {}, _('Port %d/UDP will be opened automatically').format(preset.listen_port))
					])
				])
			])
		]);
	},

	renderStep3: function() {
		var self = this;
		var preset = TUNNEL_PRESETS[this.wizardData.tunnelPreset] || TUNNEL_PRESETS['road-warrior'];
		var recommendedZones = preset.recommended_zones || Object.keys(ZONE_PRESETS);

		var zoneCards = recommendedZones.map(function(zoneKey) {
			var zone = ZONE_PRESETS[zoneKey];
			return E('div', {
				'class': 'wg-zone-card',
				'data-zone': zoneKey,
				'style': '--zone-color: ' + zone.color,
				'click': function() {
					this.classList.toggle('selected');
					self.updateSelectedZones();
				}
			}, [
				E('div', { 'class': 'wg-zone-header' }, [
					E('span', { 'class': 'wg-zone-icon' }, zone.icon),
					E('span', { 'class': 'wg-zone-name' }, zone.name),
					E('span', { 'class': 'wg-zone-check' }, '✓')
				]),
				E('p', { 'class': 'wg-zone-desc' }, zone.description),
				E('div', { 'class': 'wg-zone-details' }, [
					zone.split_tunnel ?
						E('span', { 'class': 'wg-tag' }, _('Split Tunnel')) :
						E('span', { 'class': 'wg-tag full' }, _('Full Tunnel')),
					zone.expires ?
						E('span', { 'class': 'wg-tag temp' }, _('Temporary')) : ''
				])
			]);
		});

		return E('div', { 'class': 'wg-wizard-step' }, [
			E('h2', {}, _('Select Peer Zones')),
			E('p', { 'class': 'wg-step-desc' }, _('Choose which types of peers will connect to this tunnel')),

			E('div', { 'class': 'wg-zone-grid' }, zoneCards),

			E('div', { 'class': 'wg-peer-preview', 'id': 'peer-preview' }, [
				E('h3', {}, _('Peers to Create')),
				E('p', { 'class': 'wg-no-zones' }, _('Select zones above to add peer templates'))
			])
		]);
	},

	updateSelectedZones: function() {
		var selected = [];
		document.querySelectorAll('.wg-zone-card.selected').forEach(function(card) {
			selected.push(card.dataset.zone);
		});
		this.wizardData.selectedZones = selected;

		var preview = document.getElementById('peer-preview');
		if (selected.length === 0) {
			preview.innerHTML = '<h3>' + _('Peers to Create') + '</h3><p class="wg-no-zones">' + _('Select zones above to add peer templates') + '</p>';
			return;
		}

		var self = this;
		var peerList = selected.map(function(zoneKey, idx) {
			var zone = ZONE_PRESETS[zoneKey];
			var ipNum = (self.wizardData.peerStartIP || 2) + idx;
			var baseNet = (self.wizardData.vpnNetwork || '10.10.0').split('/')[0].replace(/\.\d+$/, '');

			return E('div', { 'class': 'wg-peer-item' }, [
				E('span', { 'class': 'wg-peer-icon', 'style': 'background: ' + zone.color }, zone.icon),
				E('div', { 'class': 'wg-peer-info' }, [
					E('input', {
						'type': 'text',
						'class': 'wg-peer-name-input',
						'value': zone.name + ' #1',
						'data-zone': zoneKey
					}),
					E('code', {}, baseNet + '.' + ipNum + '/32')
				])
			]);
		});

		preview.innerHTML = '';
		preview.appendChild(E('h3', {}, _('Peers to Create') + ' (' + selected.length + ')'));
		peerList.forEach(function(p) { preview.appendChild(p); });
	},

	renderStep4: function() {
		var self = this;

		return E('div', { 'class': 'wg-wizard-step wg-step-complete' }, [
			E('div', { 'class': 'wg-complete-icon' }, '✅'),
			E('h2', {}, _('Ready to Create Tunnel')),
			E('p', { 'class': 'wg-step-desc' }, _('Review your configuration and create the tunnel')),

			E('div', { 'class': 'wg-summary' }, [
				E('div', { 'class': 'wg-summary-section' }, [
					E('h3', {}, '🔐 ' + _('Tunnel Configuration')),
					E('table', { 'class': 'wg-summary-table' }, [
						E('tr', {}, [
							E('td', {}, _('Interface')),
							E('td', { 'id': 'sum-iface' }, this.wizardData.ifaceName || 'wg0')
						]),
						E('tr', {}, [
							E('td', {}, _('Listen Port')),
							E('td', { 'id': 'sum-port' }, this.wizardData.listenPort || '51820')
						]),
						E('tr', {}, [
							E('td', {}, _('VPN Network')),
							E('td', { 'id': 'sum-network' }, this.wizardData.vpnNetwork || '10.10.0.0/24')
						]),
						E('tr', {}, [
							E('td', {}, _('Endpoint')),
							E('td', { 'id': 'sum-endpoint' }, this.wizardData.publicEndpoint || '-')
						])
					])
				]),

				E('div', { 'class': 'wg-summary-section' }, [
					E('h3', {}, '👥 ' + _('Peers')),
					E('div', { 'class': 'wg-peer-badges', 'id': 'sum-peers' },
						(this.wizardData.selectedZones || []).map(function(zoneKey) {
							var zone = ZONE_PRESETS[zoneKey];
							return E('span', {
								'class': 'wg-peer-badge',
								'style': 'background: ' + zone.color
							}, zone.icon + ' ' + zone.name);
						})
					)
				])
			]),

			E('div', { 'class': 'wg-action-buttons' }, [
				E('button', {
					'class': 'wg-btn wg-btn-lg wg-btn-primary',
					'id': 'btn-create',
					'click': L.bind(this.createTunnel, this)
				}, '🚀 ' + _('Create Tunnel & Peers'))
			])
		]);
	},

	nextStep: function() {
		if (this.currentStep === 1) {
			if (!this.wizardData.tunnelPreset) {
				ui.addNotification(null, E('p', _('Please select a tunnel type')), 'warning');
				return;
			}
		}

		if (this.currentStep === 2) {
			// Save config values
			this.wizardData.ifaceName = document.getElementById('cfg-iface-name').value;
			this.wizardData.listenPort = document.getElementById('cfg-listen-port').value;
			this.wizardData.vpnNetwork = document.getElementById('cfg-vpn-network').value;
			this.wizardData.serverIP = document.getElementById('cfg-server-ip').value;
			this.wizardData.publicEndpoint = document.getElementById('cfg-public-endpoint').value;
			this.wizardData.mtu = document.getElementById('cfg-mtu').value;

			if (!this.wizardData.ifaceName || !this.wizardData.listenPort || !this.wizardData.vpnNetwork) {
				ui.addNotification(null, E('p', _('Please fill in all required fields')), 'warning');
				return;
			}
		}

		if (this.currentStep === 3) {
			if (!this.wizardData.selectedZones || this.wizardData.selectedZones.length === 0) {
				ui.addNotification(null, E('p', _('Please select at least one peer zone')), 'warning');
				return;
			}
		}

		if (this.currentStep < this.totalSteps) {
			this.currentStep++;
			this.updateWizard();
		}
	},

	prevStep: function() {
		if (this.currentStep > 1) {
			this.currentStep--;
			this.updateWizard();
		}
	},

	updateWizard: function() {
		var content = document.getElementById('wizard-content');
		var btnPrev = document.getElementById('btn-prev');
		var btnNext = document.getElementById('btn-next');

		// Update progress
		document.querySelectorAll('.wg-progress-step').forEach(function(step) {
			var stepNum = parseInt(step.dataset.step);
			step.classList.toggle('active', stepNum <= this.currentStep);
			step.classList.toggle('current', stepNum === this.currentStep);
		}.bind(this));

		// Update content
		content.innerHTML = '';
		switch (this.currentStep) {
			case 1: content.appendChild(this.renderStep1()); break;
			case 2: content.appendChild(this.renderStep2()); break;
			case 3: content.appendChild(this.renderStep3()); break;
			case 4: content.appendChild(this.renderStep4()); break;
		}

		// Update navigation
		btnPrev.style.visibility = this.currentStep > 1 ? 'visible' : 'hidden';
		btnNext.textContent = this.currentStep === this.totalSteps ? _('Finish') : _('Continue →');
		btnNext.style.display = this.currentStep === this.totalSteps ? 'none' : '';
	},

	createTunnel: function() {
		var self = this;

		ui.showModal(_('Creating Tunnel'), [
			E('p', { 'class': 'spinning' }, _('Generating keys and configuring tunnel...'))
		]);

		// First generate keys
		api.generateKeys().then(function(keys) {
			self.wizardData.privateKey = keys.private_key;
			self.wizardData.publicKey = keys.public_key;

			// Create interface via UCI
			return self.createInterface();
		}).then(function() {
			// Create peers
			return self.createPeers();
		}).then(function(results) {
			ui.hideModal();

			// Show success with QR codes
			self.showCompletionModal(results);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	createInterface: function() {
		var self = this;
		var data = this.wizardData;

		// Call backend to create interface
		return rpc.call('uci', 'add', {
			config: 'network',
			type: 'interface',
			name: data.ifaceName,
			values: {
				proto: 'wireguard',
				private_key: data.privateKey,
				listen_port: data.listenPort,
				addresses: [data.serverIP + '/' + data.vpnNetwork.split('/')[1]]
			}
		}).then(function() {
			return rpc.call('uci', 'commit', { config: 'network' });
		});
	},

	createPeers: function() {
		var self = this;
		var data = this.wizardData;
		var promises = [];
		var results = [];

		var baseNet = data.vpnNetwork.split('/')[0].replace(/\.\d+$/, '');

		(data.selectedZones || []).forEach(function(zoneKey, idx) {
			var zone = ZONE_PRESETS[zoneKey];
			var peerIP = baseNet + '.' + (2 + idx);

			promises.push(
				api.generateKeys().then(function(keys) {
					var peerData = {
						zone: zoneKey,
						zoneName: zone.name,
						zoneIcon: zone.icon,
						zoneColor: zone.color,
						publicKey: keys.public_key,
						privateKey: keys.private_key,
						presharedKey: keys.preshared_key,
						allowedIP: peerIP + '/32',
						serverPublicKey: data.publicKey,
						endpoint: data.publicEndpoint + ':' + data.listenPort,
						dns: zone.dns.replace('${SERVER_IP}', data.serverIP),
						mtu: zone.mtu || data.mtu,
						clientAllowedIPs: zone.split_tunnel ? data.vpnNetwork : '0.0.0.0/0, ::/0'
					};

					results.push(peerData);

					// Add peer to interface
					return api.addPeer(
						data.ifaceName,
						zone.name + '_' + (idx + 1),
						peerData.allowedIP,
						keys.public_key,
						keys.preshared_key,
						'',
						zone.keepalive.toString()
					);
				})
			);
		});

		return Promise.all(promises).then(function() {
			return results;
		});
	},

	showCompletionModal: function(peers) {
		var self = this;
		var data = this.wizardData;

		var peerCards = peers.map(function(peer) {
			var config = self.generateClientConfig(peer);

			return E('div', { 'class': 'wg-result-peer' }, [
				E('div', { 'class': 'wg-result-header', 'style': 'border-color: ' + peer.zoneColor }, [
					E('span', { 'class': 'wg-result-icon' }, peer.zoneIcon),
					E('span', { 'class': 'wg-result-name' }, peer.zoneName),
					E('code', {}, peer.allowedIP)
				]),
				E('div', { 'class': 'wg-result-actions' }, [
					E('button', {
						'class': 'wg-btn wg-btn-sm',
						'click': function() {
							navigator.clipboard.writeText(config);
							ui.addNotification(null, E('p', _('Configuration copied!')), 'info');
						}
					}, '📋 ' + _('Copy Config')),
					E('button', {
						'class': 'wg-btn wg-btn-sm wg-btn-primary',
						'click': function() {
							self.showQRModal(peer, config);
						}
					}, '📱 ' + _('QR Code'))
				])
			]);
		});

		ui.showModal(_('🎉 Tunnel Created Successfully!'), [
			E('div', { 'class': 'wg-completion' }, [
				E('p', {}, _('Your WireGuard tunnel "%s" is ready.').format(data.ifaceName)),
				E('div', { 'class': 'wg-result-grid' }, peerCards),
				E('div', { 'class': 'wg-completion-actions' }, [
					E('button', {
						'class': 'wg-btn wg-btn-primary',
						'click': function() {
							ui.hideModal();
							window.location.href = L.url('admin/secubox/network/wireguard/overview');
						}
					}, _('Go to Dashboard'))
				])
			])
		]);
	},

	generateClientConfig: function(peer) {
		return '[Interface]\n' +
			'PrivateKey = ' + peer.privateKey + '\n' +
			'Address = ' + peer.allowedIP + '\n' +
			'DNS = ' + peer.dns + '\n' +
			'MTU = ' + peer.mtu + '\n\n' +
			'[Peer]\n' +
			'PublicKey = ' + peer.serverPublicKey + '\n' +
			'PresharedKey = ' + peer.presharedKey + '\n' +
			'Endpoint = ' + peer.endpoint + '\n' +
			'AllowedIPs = ' + peer.clientAllowedIPs + '\n' +
			'PersistentKeepalive = 25';
	},

	showQRModal: function(peer, config) {
		var self = this;

		// Generate QR using JavaScript library
		var qrContainer = E('div', { 'class': 'wg-qr-container', 'id': 'qr-code' });

		ui.showModal(peer.zoneIcon + ' ' + peer.zoneName + ' - QR Code', [
			E('div', { 'style': 'text-align: center;' }, [
				qrContainer,
				E('p', { 'style': 'margin-top: 1em;' }, _('Scan with WireGuard app')),
				E('details', { 'style': 'margin-top: 1em; text-align: left;' }, [
					E('summary', {}, _('Show configuration')),
					E('pre', { 'style': 'font-size: 11px; background: #1e293b; padding: 12px; border-radius: 8px;' }, config)
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close'))
			])
		]);

		// Load QR library and generate
		if (typeof QRCode !== 'undefined') {
			new QRCode(qrContainer, {
				text: config,
				width: 256,
				height: 256
			});
		} else {
			qrContainer.innerHTML = '<p>' + _('QR library not loaded') + '</p>';
		}
	},

	getWizardCSS: function() {
		return `
			.wg-wizard {
				max-width: 900px;
				margin: 0 auto;
				padding: 20px;
			}

			.wg-wizard-header {
				text-align: center;
				margin-bottom: 30px;
			}

			.wg-wizard-logo {
				font-size: 48px;
				margin-bottom: 10px;
			}

			.wg-wizard-header h1 {
				font-size: 28px;
				margin: 0 0 8px;
				background: linear-gradient(135deg, #06b6d4, #6366f1);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}

			.wg-wizard-header p {
				color: var(--wg-text-secondary);
				margin: 0;
			}

			/* Progress */
			.wg-wizard-progress {
				display: flex;
				justify-content: space-between;
				margin-bottom: 30px;
				position: relative;
			}

			.wg-wizard-progress::before {
				content: '';
				position: absolute;
				top: 18px;
				left: 50px;
				right: 50px;
				height: 2px;
				background: var(--wg-border);
			}

			.wg-progress-step {
				display: flex;
				flex-direction: column;
				align-items: center;
				position: relative;
				z-index: 1;
			}

			.wg-progress-num {
				width: 36px;
				height: 36px;
				border-radius: 50%;
				background: var(--wg-bg-tertiary);
				border: 2px solid var(--wg-border);
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 600;
				transition: all 0.3s;
			}

			.wg-progress-step.active .wg-progress-num {
				background: linear-gradient(135deg, #06b6d4, #6366f1);
				border-color: transparent;
				color: white;
			}

			.wg-progress-step.current .wg-progress-num {
				box-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
			}

			.wg-progress-label {
				margin-top: 8px;
				font-size: 12px;
				color: var(--wg-text-muted);
			}

			/* Content */
			.wg-wizard-content {
				background: var(--wg-bg-secondary);
				border: 1px solid var(--wg-border);
				border-radius: 12px;
				padding: 30px;
				min-height: 400px;
			}

			.wg-wizard-step h2 {
				margin: 0 0 8px;
				font-size: 22px;
			}

			.wg-step-desc {
				color: var(--wg-text-secondary);
				margin: 0 0 24px;
			}

			/* Preset cards */
			.wg-preset-grid {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}

			.wg-preset-card {
				display: flex;
				align-items: center;
				gap: 16px;
				padding: 16px 20px;
				background: var(--wg-bg-tertiary);
				border: 2px solid var(--wg-border);
				border-radius: 10px;
				cursor: pointer;
				transition: all 0.2s;
			}

			.wg-preset-card:hover {
				border-color: var(--wg-accent-cyan);
			}

			.wg-preset-card.selected {
				border-color: var(--wg-accent-cyan);
				background: rgba(6, 182, 212, 0.1);
			}

			.wg-preset-icon {
				font-size: 32px;
			}

			.wg-preset-info {
				flex: 1;
			}

			.wg-preset-info h3 {
				margin: 0 0 4px;
				font-size: 16px;
			}

			.wg-preset-info p {
				margin: 0;
				font-size: 13px;
				color: var(--wg-text-secondary);
			}

			.wg-preset-check {
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: var(--wg-accent-cyan);
				color: white;
				display: flex;
				align-items: center;
				justify-content: center;
				opacity: 0;
				transition: opacity 0.2s;
			}

			.wg-preset-card.selected .wg-preset-check {
				opacity: 1;
			}

			/* Zone cards */
			.wg-zone-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
				gap: 12px;
				margin-bottom: 24px;
			}

			.wg-zone-card {
				padding: 16px;
				background: var(--wg-bg-tertiary);
				border: 2px solid var(--wg-border);
				border-radius: 10px;
				cursor: pointer;
				transition: all 0.2s;
			}

			.wg-zone-card:hover {
				border-color: var(--zone-color, var(--wg-accent-cyan));
			}

			.wg-zone-card.selected {
				border-color: var(--zone-color, var(--wg-accent-cyan));
				background: color-mix(in srgb, var(--zone-color, var(--wg-accent-cyan)) 10%, transparent);
			}

			.wg-zone-header {
				display: flex;
				align-items: center;
				gap: 8px;
				margin-bottom: 8px;
			}

			.wg-zone-icon {
				font-size: 20px;
			}

			.wg-zone-name {
				flex: 1;
				font-weight: 600;
			}

			.wg-zone-check {
				color: var(--zone-color, var(--wg-accent-cyan));
				opacity: 0;
			}

			.wg-zone-card.selected .wg-zone-check {
				opacity: 1;
			}

			.wg-zone-desc {
				font-size: 12px;
				color: var(--wg-text-secondary);
				margin: 0 0 8px;
			}

			.wg-zone-details {
				display: flex;
				gap: 6px;
				flex-wrap: wrap;
			}

			.wg-tag {
				font-size: 10px;
				padding: 2px 6px;
				border-radius: 4px;
				background: var(--wg-bg-secondary);
				color: var(--wg-text-muted);
			}

			.wg-tag.full { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
			.wg-tag.temp { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

			/* Config grid */
			.wg-config-grid {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 24px;
			}

			@media (max-width: 768px) {
				.wg-config-grid { grid-template-columns: 1fr; }
			}

			.wg-config-section h3 {
				font-size: 14px;
				margin: 0 0 16px;
				padding-bottom: 8px;
				border-bottom: 1px solid var(--wg-border);
			}

			.wg-form-group {
				margin-bottom: 16px;
			}

			.wg-form-group label {
				display: block;
				font-size: 13px;
				font-weight: 500;
				margin-bottom: 6px;
			}

			.wg-input {
				width: 100%;
				padding: 10px 12px;
				background: var(--wg-bg-primary);
				border: 1px solid var(--wg-border);
				border-radius: 6px;
				color: var(--wg-text-primary);
				font-size: 14px;
			}

			.wg-input:focus {
				border-color: var(--wg-accent-cyan);
				outline: none;
			}

			.wg-form-group small {
				display: block;
				margin-top: 4px;
				font-size: 11px;
				color: var(--wg-text-muted);
			}

			.wg-detected {
				margin-top: 8px;
				padding: 8px 12px;
				background: rgba(16, 185, 129, 0.1);
				border-radius: 6px;
				font-size: 12px;
				color: var(--wg-accent-green);
			}

			.wg-info-box {
				padding: 12px;
				background: rgba(6, 182, 212, 0.1);
				border-radius: 8px;
				font-size: 12px;
			}

			.wg-info-box strong {
				display: block;
				margin-bottom: 4px;
			}

			.wg-info-box p {
				margin: 0;
				color: var(--wg-text-secondary);
			}

			/* Peer preview */
			.wg-peer-preview {
				background: var(--wg-bg-primary);
				border-radius: 8px;
				padding: 16px;
			}

			.wg-peer-preview h3 {
				font-size: 14px;
				margin: 0 0 12px;
			}

			.wg-no-zones {
				color: var(--wg-text-muted);
				font-size: 13px;
				text-align: center;
				padding: 20px;
			}

			.wg-peer-item {
				display: flex;
				align-items: center;
				gap: 12px;
				padding: 10px;
				background: var(--wg-bg-secondary);
				border-radius: 6px;
				margin-bottom: 8px;
			}

			.wg-peer-icon {
				width: 32px;
				height: 32px;
				border-radius: 6px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 16px;
			}

			.wg-peer-info {
				flex: 1;
				display: flex;
				align-items: center;
				gap: 12px;
			}

			.wg-peer-name-input {
				flex: 1;
				background: transparent;
				border: 1px solid transparent;
				padding: 4px 8px;
				border-radius: 4px;
				color: var(--wg-text-primary);
			}

			.wg-peer-name-input:focus {
				border-color: var(--wg-border);
				background: var(--wg-bg-tertiary);
			}

			/* Complete step */
			.wg-step-complete {
				text-align: center;
			}

			.wg-complete-icon {
				font-size: 64px;
				margin-bottom: 16px;
			}

			.wg-summary {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 24px;
				margin: 24px 0;
				text-align: left;
			}

			.wg-summary-section {
				background: var(--wg-bg-tertiary);
				padding: 16px;
				border-radius: 8px;
			}

			.wg-summary-section h3 {
				font-size: 14px;
				margin: 0 0 12px;
			}

			.wg-summary-table {
				width: 100%;
				font-size: 13px;
			}

			.wg-summary-table td {
				padding: 6px 0;
				border-bottom: 1px solid var(--wg-border);
			}

			.wg-summary-table td:first-child {
				color: var(--wg-text-muted);
			}

			.wg-peer-badges {
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
			}

			.wg-peer-badge {
				padding: 6px 12px;
				border-radius: 20px;
				font-size: 12px;
				color: white;
			}

			.wg-action-buttons {
				margin-top: 24px;
			}

			.wg-btn-lg {
				padding: 14px 28px;
				font-size: 16px;
			}

			/* Result */
			.wg-result-grid {
				display: grid;
				gap: 12px;
				margin: 20px 0;
			}

			.wg-result-peer {
				background: var(--wg-bg-tertiary);
				border-radius: 8px;
				padding: 12px;
			}

			.wg-result-header {
				display: flex;
				align-items: center;
				gap: 12px;
				padding-bottom: 10px;
				margin-bottom: 10px;
				border-bottom: 2px solid;
			}

			.wg-result-icon {
				font-size: 24px;
			}

			.wg-result-name {
				flex: 1;
				font-weight: 600;
			}

			.wg-result-actions {
				display: flex;
				gap: 8px;
				justify-content: center;
			}

			/* Navigation */
			.wg-wizard-nav {
				display: flex;
				justify-content: space-between;
				margin-top: 24px;
			}

			.wg-btn-secondary {
				background: transparent;
				border: 1px solid var(--wg-border);
			}

			.wg-btn-secondary:hover {
				background: var(--wg-bg-tertiary);
			}
		`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
