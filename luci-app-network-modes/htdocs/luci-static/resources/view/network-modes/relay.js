'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';

return view.extend({
	title: _('Relay Mode'),
	
	load: function() {
		return api.getRelayConfig();
	},
	
	render: function(data) {
		var config = data || {};
		var wgConfig = config.wireguard || {};
		var optConfig = config.optimizations || {};
		
		var view = E('div', { 'class': 'network-modes-dashboard' }, [
			// Header
			E('div', { 'class': 'nm-header' }, [
				E('div', { 'class': 'nm-logo' }, [
					E('div', { 'class': 'nm-logo-icon', 'style': 'background: linear-gradient(135deg, #10b981, #34d399)' }, '🔄'),
					E('div', { 'class': 'nm-logo-text' }, ['Relay ', E('span', { 'style': 'background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' }, 'Mode')])
				])
			]),
			
			// Description
			E('div', { 'class': 'nm-alert nm-alert-info' }, [
				E('span', { 'class': 'nm-alert-icon' }, '🔄'),
				E('div', {}, [
					E('div', { 'class': 'nm-alert-title' }, 'Network Relay with WireGuard'),
					E('div', { 'class': 'nm-alert-text' }, 
						'Extend your network with relayd bridging and secure WireGuard tunneling. ' +
						'Optimized for LAN extension and VPN site-to-site connections.')
				])
			]),
			
			// Relay Configuration
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🔗'),
						'Relay Configuration'
					]),
					E('div', { 'class': 'nm-card-badge' }, config.relayd_available ? 'Relayd Available' : 'Relayd Not Installed')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'Relay Interface (Upstream)'),
						E('input', { 
							'class': 'nm-input',
							'type': 'text',
							'value': config.relay_interface || 'wlan0',
							'id': 'relay-interface'
						}),
						E('div', { 'class': 'nm-form-hint' }, 'Interface connected to the upstream network (e.g., wlan0 for WiFi client)')
					]),
					
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'LAN Interface'),
						E('input', { 
							'class': 'nm-input',
							'type': 'text',
							'value': config.lan_interface || 'eth0',
							'id': 'lan-interface'
						}),
						E('div', { 'class': 'nm-form-hint' }, 'Interface for local devices')
					])
				])
			]),
			
			// WireGuard Configuration
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🔐'),
						'WireGuard VPN'
					]),
					E('div', { 'class': 'nm-card-badge' }, (config.wg_interfaces || []).length + ' tunnels')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🔐'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Enable WireGuard'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Route traffic through WireGuard tunnel')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wgConfig.enabled ? ' active' : ''),
							'id': 'toggle-wg'
						})
					]),
					
					E('div', { 'class': 'nm-form-group', 'style': 'margin-top: 16px' }, [
						E('label', { 'class': 'nm-form-label' }, 'WireGuard Interface'),
						E('select', { 'class': 'nm-select', 'id': 'wg-interface' },
							(config.wg_interfaces || ['wg0']).length > 0 ?
							(config.wg_interfaces || ['wg0']).map(function(iface) {
								return E('option', { 
									'value': iface,
									'selected': iface === wgConfig.interface
								}, iface);
							}) :
							[E('option', { 'value': '' }, 'No WireGuard interfaces')]
						)
					]),
					
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'MTU'),
						E('input', { 
							'class': 'nm-input',
							'type': 'number',
							'value': wgConfig.mtu || 1420,
							'id': 'wg-mtu',
							'min': '1280',
							'max': '1500'
						}),
						E('div', { 'class': 'nm-form-hint' }, 'WireGuard tunnel MTU (recommended: 1420)')
					])
				])
			]),
			
			// Optimizations
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '⚡'),
						'Network Optimizations'
					])
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '📏'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'MTU Optimization'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Auto-adjust MTU for optimal throughput')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (optConfig.mtu_optimization ? ' active' : ''),
							'data-opt': 'mtu_optimization'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '✂️'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'MSS Clamping'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Fix TCP fragmentation issues')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (optConfig.mss_clamping ? ' active' : ''),
							'data-opt': 'mss_clamping'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🚀'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'TCP Optimization'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Enable TCP BBR and fast open')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (optConfig.tcp_optimization ? ' active' : ''),
							'data-opt': 'tcp_optimization'
						})
					]),
					
					E('div', { 'class': 'nm-form-group', 'style': 'margin-top: 16px' }, [
						E('label', { 'class': 'nm-form-label' }, 'Connection Tracking Max'),
						E('input', { 
							'class': 'nm-input',
							'type': 'number',
							'value': optConfig.conntrack_max || 16384,
							'id': 'conntrack-max',
							'min': '1024',
							'max': '262144'
						}),
						E('div', { 'class': 'nm-form-hint' }, 'Maximum tracked connections (higher = more memory)')
					])
				])
			]),
			
			// Actions
			E('div', { 'class': 'nm-btn-group' }, [
				E('button', { 'class': 'nm-btn nm-btn-primary' }, [
					E('span', {}, '💾'),
					'Save Settings'
				]),
				E('button', { 'class': 'nm-btn' }, [
					E('span', {}, '🔄'),
					'Apply & Restart'
				])
			])
		]);
		
		// Toggle handlers
		view.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});
		
		// Include CSS
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
