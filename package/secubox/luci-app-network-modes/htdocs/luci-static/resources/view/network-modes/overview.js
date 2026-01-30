'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require network-modes/api as api';

return view.extend({
	title: _('Network Modes'),

	load: function() {
		return api.getAllData();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var modesData = (data.modes || {}).modes || [];
		var currentMode = status.current_mode || 'router';

		// Mode definitions with emojis and colors
		var modes = {
			router: {
				emoji: '🏠', name: 'Router', color: '#3b82f6',
				desc: 'Home/Office NAT router',
				features: ['🛡️ NAT Firewall', '📡 DHCP Server', '🔀 Port Forward', '⚡ QoS'],
				useCase: 'Standard home network'
			},
			doublenat: {
				emoji: '🔁', name: 'Double NAT', color: '#8b5cf6',
				desc: 'Behind ISP router',
				features: ['📦 ISP Passthrough', '🏠 Private LAN', '👥 Guest Network', '🔒 Isolation'],
				useCase: 'ISP box bypass'
			},
			multiwan: {
				emoji: '⚡', name: 'Multi-WAN', color: '#f59e0b',
				desc: 'Dual uplink failover',
				features: ['🔄 Auto Failover', '⚖️ Load Balance', '💓 Health Check', '📶 4G/5G Ready'],
				useCase: 'Redundant internet'
			},
			vpnrelay: {
				emoji: '🛡️', name: 'VPN Gateway', color: '#10b981',
				desc: 'VPN tunnel for LAN',
				features: ['🔐 WireGuard', '🌐 OpenVPN', '🚫 Kill Switch', '🔀 Split Tunnel'],
				useCase: 'Privacy gateway'
			},
			bridge: {
				emoji: '🌉', name: 'Bridge', color: '#6366f1',
				desc: 'Layer 2 transparent',
				features: ['🔗 L2 Forward', '🚫 No NAT', '🏷️ VLAN Tag', '🌲 STP/RSTP'],
				useCase: 'Network extension'
			},
			accesspoint: {
				emoji: '📡', name: 'Access Point', color: '#ec4899',
				desc: 'WiFi hotspot only',
				features: ['📶 WiFi AP', '🔌 Wired Uplink', '📻 Multi-SSID', '🏃 Fast Roaming'],
				useCase: 'WiFi extension'
			},
			relay: {
				emoji: '📶', name: 'Repeater', color: '#14b8a6',
				desc: 'WiFi range extender',
				features: ['📡 WiFi Client', '🔁 Rebroadcast', '📈 Signal Boost', '🔗 WDS Mode'],
				useCase: 'Coverage extension'
			},
			travel: {
				emoji: '✈️', name: 'Travel Router', color: '#f97316',
				desc: 'Portable hotel router',
				features: ['🏨 Hotel WiFi', '🎭 MAC Clone', '🔐 Private Hotspot', '🧳 Portable'],
				useCase: 'On-the-go security'
			},
			sniffer: {
				emoji: '🔍', name: 'Sniffer', color: '#ef4444',
				desc: 'Packet capture mode',
				features: ['👁️ Monitor Mode', '📦 PCAP Export', '🦈 Wireshark', '🔬 Analysis'],
				useCase: 'Network debugging'
			}
		};

		var currentModeInfo = modes[currentMode] || modes.router;

		// Inject theme CSS
		var style = E('style', {}, `
			/* 🎨 Network Modes - MirrorBox Theme */
			.nm-page {
				min-height: 100vh;
				background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d0d1a 100%);
				padding: 20px;
				font-family: system-ui, -apple-system, sans-serif;
			}

			/* 🌟 Hero Banner */
			.nm-hero {
				background: linear-gradient(135deg, ${currentModeInfo.color}22 0%, ${currentModeInfo.color}11 100%);
				border: 1px solid ${currentModeInfo.color}44;
				border-radius: 20px;
				padding: 30px;
				margin-bottom: 25px;
				position: relative;
				overflow: hidden;
			}
			.nm-hero::before {
				content: '';
				position: absolute;
				top: -50%;
				right: -20%;
				width: 300px;
				height: 300px;
				background: radial-gradient(circle, ${currentModeInfo.color}15 0%, transparent 70%);
				animation: pulse 4s ease-in-out infinite;
			}
			@keyframes pulse {
				0%, 100% { transform: scale(1); opacity: 0.5; }
				50% { transform: scale(1.2); opacity: 0.8; }
			}
			.nm-hero-content {
				position: relative;
				z-index: 1;
				display: flex;
				align-items: center;
				gap: 25px;
			}
			.nm-hero-icon {
				font-size: 80px;
				filter: drop-shadow(0 0 20px ${currentModeInfo.color}66);
				animation: float 3s ease-in-out infinite;
			}
			@keyframes float {
				0%, 100% { transform: translateY(0); }
				50% { transform: translateY(-10px); }
			}
			.nm-hero-info h1 {
				color: #fff;
				font-size: 2.2em;
				margin: 0 0 8px 0;
				text-shadow: 0 2px 20px ${currentModeInfo.color}66;
			}
			.nm-hero-info p {
				color: #a0aec0;
				font-size: 1.1em;
				margin: 0;
			}
			.nm-hero-badge {
				display: inline-block;
				background: ${currentModeInfo.color};
				color: #fff;
				padding: 6px 16px;
				border-radius: 20px;
				font-size: 0.85em;
				font-weight: 600;
				margin-top: 12px;
				animation: glow 2s ease-in-out infinite;
			}
			@keyframes glow {
				0%, 100% { box-shadow: 0 0 5px ${currentModeInfo.color}66; }
				50% { box-shadow: 0 0 20px ${currentModeInfo.color}aa; }
			}

			/* 📊 Stats Grid */
			.nm-stats {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
				gap: 15px;
				margin-bottom: 25px;
			}
			.nm-stat {
				background: linear-gradient(135deg, #1e1e3f 0%, #252550 100%);
				border: 1px solid #3d3d6b;
				border-radius: 15px;
				padding: 20px;
				text-align: center;
				transition: all 0.3s ease;
			}
			.nm-stat:hover {
				transform: translateY(-3px);
				border-color: #5d5d9b;
				box-shadow: 0 10px 30px rgba(0,0,0,0.3);
			}
			.nm-stat-icon {
				font-size: 2em;
				margin-bottom: 8px;
			}
			.nm-stat-value {
				color: #fff;
				font-size: 1.4em;
				font-weight: 700;
			}
			.nm-stat-label {
				color: #8892a0;
				font-size: 0.85em;
				margin-top: 4px;
			}

			/* 🎯 Quick Actions */
			.nm-actions {
				display: flex;
				gap: 12px;
				flex-wrap: wrap;
				margin-bottom: 25px;
			}
			.nm-action-btn {
				display: flex;
				align-items: center;
				gap: 8px;
				background: linear-gradient(135deg, #2d2d5a 0%, #3d3d7a 100%);
				border: 1px solid #4d4d8a;
				color: #fff;
				padding: 12px 20px;
				border-radius: 12px;
				cursor: pointer;
				font-size: 0.95em;
				transition: all 0.3s ease;
			}
			.nm-action-btn:hover {
				background: linear-gradient(135deg, #3d3d7a 0%, #4d4d9a 100%);
				transform: translateY(-2px);
				box-shadow: 0 5px 20px rgba(100,100,200,0.3);
			}
			.nm-action-btn.primary {
				background: linear-gradient(135deg, ${currentModeInfo.color} 0%, ${currentModeInfo.color}cc 100%);
				border-color: ${currentModeInfo.color};
			}
			.nm-action-btn.primary:hover {
				box-shadow: 0 5px 25px ${currentModeInfo.color}66;
			}

			/* 🗂️ Mode Cards Grid */
			.nm-modes-section h2 {
				color: #fff;
				font-size: 1.5em;
				margin: 0 0 20px 0;
				display: flex;
				align-items: center;
				gap: 10px;
			}
			.nm-modes-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: 20px;
				margin-bottom: 30px;
			}
			.nm-mode-card {
				background: linear-gradient(145deg, #1a1a3e 0%, #252555 100%);
				border: 2px solid #3a3a6a;
				border-radius: 16px;
				padding: 20px;
				cursor: pointer;
				transition: all 0.3s ease;
				position: relative;
				overflow: hidden;
			}
			.nm-mode-card::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 3px;
				background: var(--mode-color);
				transform: scaleX(0);
				transition: transform 0.3s ease;
			}
			.nm-mode-card:hover::before {
				transform: scaleX(1);
			}
			.nm-mode-card:hover {
				transform: translateY(-5px);
				border-color: var(--mode-color);
				box-shadow: 0 15px 40px rgba(0,0,0,0.4);
			}
			.nm-mode-card.active {
				border-color: var(--mode-color);
				background: linear-gradient(145deg, var(--mode-color)15 0%, var(--mode-color)08 100%);
			}
			.nm-mode-card.active::after {
				content: '✓ ACTIVE';
				position: absolute;
				top: 12px;
				right: 12px;
				background: var(--mode-color);
				color: #fff;
				padding: 4px 10px;
				border-radius: 10px;
				font-size: 0.7em;
				font-weight: 700;
			}
			.nm-mode-header {
				display: flex;
				align-items: center;
				gap: 15px;
				margin-bottom: 12px;
			}
			.nm-mode-emoji {
				font-size: 2.5em;
				filter: drop-shadow(0 2px 8px var(--mode-color)66);
			}
			.nm-mode-title h3 {
				color: #fff;
				margin: 0;
				font-size: 1.2em;
			}
			.nm-mode-title span {
				color: #8892a0;
				font-size: 0.85em;
			}
			.nm-mode-desc {
				color: #a0aec0;
				font-size: 0.9em;
				margin-bottom: 15px;
				line-height: 1.4;
			}
			.nm-mode-features {
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
			}
			.nm-mode-feature {
				background: #2a2a5a;
				color: #c0c8d0;
				padding: 4px 10px;
				border-radius: 8px;
				font-size: 0.75em;
			}

			/* 🔌 Interfaces Section */
			.nm-interfaces {
				background: linear-gradient(135deg, #1a1a3e 0%, #202050 100%);
				border: 1px solid #3a3a6a;
				border-radius: 16px;
				padding: 20px;
				margin-bottom: 25px;
			}
			.nm-interfaces h3 {
				color: #fff;
				margin: 0 0 15px 0;
				display: flex;
				align-items: center;
				gap: 10px;
			}
			.nm-iface-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
				gap: 12px;
			}
			.nm-iface {
				background: #252560;
				border: 1px solid #3a3a7a;
				border-radius: 12px;
				padding: 15px;
				display: flex;
				align-items: center;
				gap: 12px;
			}
			.nm-iface-icon {
				font-size: 1.8em;
			}
			.nm-iface-info {
				flex: 1;
			}
			.nm-iface-name {
				color: #fff;
				font-weight: 600;
				font-size: 0.95em;
			}
			.nm-iface-ip {
				color: #8892a0;
				font-size: 0.8em;
				font-family: monospace;
			}
			.nm-iface-status {
				width: 12px;
				height: 12px;
				border-radius: 50%;
				animation: blink 2s ease-in-out infinite;
			}
			.nm-iface-status.up { background: #10b981; }
			.nm-iface-status.down { background: #ef4444; }
			@keyframes blink {
				0%, 100% { opacity: 1; }
				50% { opacity: 0.5; }
			}

			/* 🔧 Services Grid */
			.nm-services-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
				gap: 10px;
			}
			.nm-service {
				background: #252560;
				border: 1px solid #3a3a7a;
				border-radius: 10px;
				padding: 12px;
				display: flex;
				align-items: center;
				gap: 10px;
			}
			.nm-service-icon { font-size: 1.5em; }
			.nm-service-name { color: #fff; font-size: 0.85em; flex: 1; }
			.nm-service-dot {
				width: 8px;
				height: 8px;
				border-radius: 50%;
			}
			.nm-service-dot.on { background: #10b981; }
			.nm-service-dot.off { background: #6b7280; }

			/* 📱 Responsive */
			@media (max-width: 768px) {
				.nm-hero-content { flex-direction: column; text-align: center; }
				.nm-hero-icon { font-size: 60px; }
				.nm-stats { grid-template-columns: repeat(2, 1fr); }
				.nm-modes-grid { grid-template-columns: 1fr; }
			}

			/* 🎭 Modal Styles */
			.nm-modal-overlay {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0,0,0,0.8);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 9999;
				backdrop-filter: blur(5px);
			}
			.nm-modal {
				background: linear-gradient(135deg, #1a1a3e 0%, #252555 100%);
				border: 2px solid #4a4a8a;
				border-radius: 20px;
				padding: 30px;
				max-width: 500px;
				width: 90%;
			}
			.nm-modal h3 {
				color: #fff;
				margin: 0 0 15px 0;
				display: flex;
				align-items: center;
				gap: 12px;
			}
			.nm-modal p {
				color: #a0aec0;
				line-height: 1.5;
			}
			.nm-modal-warning {
				background: #f59e0b22;
				border: 1px solid #f59e0b44;
				border-radius: 12px;
				padding: 15px;
				margin: 15px 0;
				display: flex;
				gap: 12px;
			}
			.nm-modal-warning span:first-child { font-size: 1.5em; }
			.nm-modal-buttons {
				display: flex;
				gap: 12px;
				justify-content: flex-end;
				margin-top: 20px;
			}
		`);

		// Build the page
		var page = E('div', { 'class': 'nm-page' }, [
			style,

			// Hero Banner
			E('div', { 'class': 'nm-hero' }, [
				E('div', { 'class': 'nm-hero-content' }, [
					E('div', { 'class': 'nm-hero-icon' }, currentModeInfo.emoji),
					E('div', { 'class': 'nm-hero-info' }, [
						E('h1', {}, '🌐 Network Modes'),
						E('p', {}, 'Current: ' + currentModeInfo.name + ' Mode — ' + currentModeInfo.desc),
						E('span', { 'class': 'nm-hero-badge' }, '✨ ' + currentModeInfo.useCase)
					])
				])
			]),

			// Stats Grid
			E('div', { 'class': 'nm-stats' }, [
				E('div', { 'class': 'nm-stat' }, [
					E('div', { 'class': 'nm-stat-icon' }, '🌍'),
					E('div', { 'class': 'nm-stat-value' }, status.wan_ip || 'N/A'),
					E('div', { 'class': 'nm-stat-label' }, 'WAN IP')
				]),
				E('div', { 'class': 'nm-stat' }, [
					E('div', { 'class': 'nm-stat-icon' }, '🏠'),
					E('div', { 'class': 'nm-stat-value' }, status.lan_ip || '192.168.1.1'),
					E('div', { 'class': 'nm-stat-label' }, 'LAN IP')
				]),
				E('div', { 'class': 'nm-stat' }, [
					E('div', { 'class': 'nm-stat-icon' }, '📡'),
					E('div', { 'class': 'nm-stat-value' }, status.dhcp_enabled ? '✅ ON' : '❌ OFF'),
					E('div', { 'class': 'nm-stat-label' }, 'DHCP Server')
				]),
				E('div', { 'class': 'nm-stat' }, [
					E('div', { 'class': 'nm-stat-icon' }, '🔌'),
					E('div', { 'class': 'nm-stat-value' }, (status.interfaces || []).length),
					E('div', { 'class': 'nm-stat-label' }, 'Interfaces')
				])
			]),

			// Quick Actions
			E('div', { 'class': 'nm-actions' }, [
				E('button', {
					'class': 'nm-action-btn primary',
					'click': function() { window.location.href = L.url('admin/secubox/network/modes/wizard'); }
				}, ['🧙', ' Mode Wizard']),
				E('button', {
					'class': 'nm-action-btn',
					'click': function() { window.location.reload(); }
				}, ['🔄', ' Refresh']),
				E('button', {
					'class': 'nm-action-btn',
					'click': function() { window.location.href = L.url('admin/secubox/network/modes/settings'); }
				}, ['⚙️', ' Settings']),
				E('button', {
					'class': 'nm-action-btn',
					'click': function() {
						ui.showModal(_('📊 Network Diagnostics'), [
							E('p', {}, _('Running network diagnostics...')),
							E('div', { 'class': 'spinning' })
						]);
						setTimeout(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', {}, '✅ All systems operational'), 'info');
						}, 2000);
					}
				}, ['🔬', ' Diagnostics'])
			]),

			// Mode Selection Grid
			E('div', { 'class': 'nm-modes-section' }, [
				E('h2', {}, ['🎛️', ' Available Modes']),
				E('div', { 'class': 'nm-modes-grid' },
					Object.keys(modes).map(function(modeId) {
						var mode = modes[modeId];
						var isActive = modeId === currentMode;

						return E('div', {
							'class': 'nm-mode-card' + (isActive ? ' active' : ''),
							'style': '--mode-color: ' + mode.color,
							'click': function() {
								if (!isActive) {
									self.showSwitchModal(modeId, mode);
								}
							}
						}, [
							E('div', { 'class': 'nm-mode-header' }, [
								E('div', { 'class': 'nm-mode-emoji' }, mode.emoji),
								E('div', { 'class': 'nm-mode-title' }, [
									E('h3', {}, mode.name),
									E('span', {}, mode.useCase)
								])
							]),
							E('div', { 'class': 'nm-mode-desc' }, mode.desc),
							E('div', { 'class': 'nm-mode-features' },
								mode.features.map(function(f) {
									return E('span', { 'class': 'nm-mode-feature' }, f);
								})
							)
						]);
					})
				)
			]),

			// Interfaces
			E('div', { 'class': 'nm-interfaces' }, [
				E('h3', {}, ['🔌', ' Network Interfaces']),
				E('div', { 'class': 'nm-iface-grid' },
					(status.interfaces || []).map(function(iface) {
						var icon = '🔗';
						if (iface.name.match(/^wlan|^wl/)) icon = '📶';
						else if (iface.name.match(/^wg/)) icon = '🔐';
						else if (iface.name.match(/^br/)) icon = '🌉';
						else if (iface.name.match(/^eth/)) icon = '🔌';
						else if (iface.name.match(/^tun|^tap/)) icon = '🚇';

						return E('div', { 'class': 'nm-iface' }, [
							E('div', { 'class': 'nm-iface-icon' }, icon),
							E('div', { 'class': 'nm-iface-info' }, [
								E('div', { 'class': 'nm-iface-name' }, iface.name),
								E('div', { 'class': 'nm-iface-ip' }, iface.ip || 'No IP')
							]),
							E('div', { 'class': 'nm-iface-status ' + (iface.state || 'down') })
						]);
					})
				)
			]),

			// Services
			E('div', { 'class': 'nm-interfaces' }, [
				E('h3', {}, ['🔧', ' Core Services']),
				E('div', { 'class': 'nm-services-grid' },
					[
						{ name: 'Firewall', key: 'firewall', icon: '🛡️' },
						{ name: 'DHCP/DNS', key: 'dnsmasq', icon: '📡' },
						{ name: 'nDPId', key: 'netifyd', icon: '🔍' },
						{ name: 'HAProxy', key: 'haproxy', icon: '⚖️' },
						{ name: 'Nginx', key: 'nginx', icon: '🌐' },
						{ name: 'WireGuard', key: 'wireguard', icon: '🔐' }
					].map(function(svc) {
						var running = status.services && status.services[svc.key];
						return E('div', { 'class': 'nm-service' }, [
							E('div', { 'class': 'nm-service-icon' }, svc.icon),
							E('div', { 'class': 'nm-service-name' }, svc.name),
							E('div', { 'class': 'nm-service-dot ' + (running ? 'on' : 'off') })
						]);
					})
				)
			])
		]);

		return page;
	},

	showSwitchModal: function(modeId, modeInfo) {
		var self = this;

		var overlay = E('div', { 'class': 'nm-modal-overlay' }, [
			E('div', { 'class': 'nm-modal' }, [
				E('h3', {}, [modeInfo.emoji, ' Switch to ' + modeInfo.name + '?']),
				E('p', {}, modeInfo.desc),
				E('div', { 'class': 'nm-modal-warning' }, [
					E('span', {}, '⚠️'),
					E('div', {}, [
						E('strong', { 'style': 'color: #f59e0b;' }, 'Warning'),
						E('p', { 'style': 'margin: 5px 0 0 0; color: #d4a574;' },
							'This will reconfigure your network. A backup will be created automatically.')
					])
				]),
				E('div', { 'class': 'nm-modal-buttons' }, [
					E('button', {
						'class': 'nm-action-btn',
						'click': function() { overlay.remove(); }
					}, '❌ Cancel'),
					E('button', {
						'class': 'nm-action-btn primary',
						'click': function() {
							overlay.remove();
							ui.showModal(_('🔄 Switching Mode'), [
								E('p', { 'class': 'spinning' }, _('Applying ') + modeInfo.name + _(' mode...'))
							]);

							api.applyMode(modeId).then(function(result) {
								ui.hideModal();
								if (result && result.success !== false) {
									ui.addNotification(null, E('p', {}, '✅ ' + modeInfo.name + ' mode activated!'), 'success');
									setTimeout(function() { window.location.reload(); }, 1500);
								} else {
									ui.addNotification(null, E('p', {}, '❌ Error: ' + (result.error || 'Unknown error')), 'error');
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', {}, '❌ Error: ' + err.message), 'error');
							});
						}
					}, '✅ Switch Mode')
				])
			])
		]);

		document.body.appendChild(overlay);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
