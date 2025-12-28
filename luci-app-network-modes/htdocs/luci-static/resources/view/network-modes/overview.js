'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require secubox/help as Help';
'require secubox-theme/theme as Theme';

// Initialize global theme
Theme.init({ theme: 'dark', language: 'en' });

return view.extend({
	title: _('Network Modes'),

	load: function() {
		return api.getAllData();
	},
	
	handleModeSwitch: function(mode) {
		var self = this;
		ui.showModal(_('Switch Mode'), [
			E('p', {}, _('Are you sure you want to switch to ') + mode + _(' mode?')),
			E('p', { 'class': 'nm-alert nm-alert-warning' }, [
				E('span', { 'class': 'nm-alert-icon' }, '⚠️'),
				E('div', {}, [
					E('div', { 'class': 'nm-alert-title' }, _('Warning')),
					E('div', { 'class': 'nm-alert-text' }, _('This will change network configuration. A backup will be created.'))
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						ui.hideModal();
						return api.applyMode(mode).then(function(result) {
							if (result.success) {
								ui.addNotification(null, E('p', {}, result.message), 'success');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', {}, 'Error: ' + result.error), 'error');
							}
						});
					}
				}, _('Switch Mode'))
			])
		]);
	},
	
	render: function(data) {
		var self = this;
		var status = data.status || {};
		var modesData = (data.modes || {}).modes || [];
		var currentMode = status.current_mode || 'router';
		
		var modeInfos = {
			router: api.getModeInfo('router'),
			accesspoint: api.getModeInfo('accesspoint'),
			relay: api.getModeInfo('relay'),
			travel: api.getModeInfo('travel'),
			sniffer: api.getModeInfo('sniffer')
		};
		
		var currentModeInfo = modeInfos[currentMode];
		
		var view = E('div', { 'class': 'network-modes-dashboard' }, [
			// Load global theme CSS
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/help.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),

			// Header
			E('div', { 'class': 'nm-header' }, [
				E('div', { 'class': 'nm-logo' }, [
					E('div', { 'class': 'nm-logo-icon' }, '🌐'),
					E('div', { 'class': 'nm-logo-text' }, ['Network ', E('span', {}, 'Configuration')])
				]),
				E('div', { 'class': 'nm-mode-badge ' + currentMode }, [
					E('span', { 'class': 'nm-mode-dot' }),
					currentModeInfo ? currentModeInfo.name : currentMode
				]),
				Help.createHelpButton('network-modes', 'header', {
					icon: '📖',
					label: _('Help')
				})
			]),
			
			// Current Mode Display Card
			E('div', { 'class': 'nm-current-mode-card' }, [
				E('div', { 'class': 'nm-current-mode-header' }, [
					E('div', { 'class': 'nm-current-mode-icon' }, currentModeInfo ? currentModeInfo.icon : '🌐'),
					E('div', { 'class': 'nm-current-mode-info' }, [
						E('div', { 'class': 'nm-current-mode-label' }, 'Current Network Mode'),
						E('h2', { 'class': 'nm-current-mode-name' }, currentModeInfo ? currentModeInfo.name : currentMode)
					])
				]),
				E('div', { 'class': 'nm-current-mode-description' },
					currentModeInfo ? currentModeInfo.description : 'Unknown mode'),
				E('div', { 'class': 'nm-current-mode-config' }, [
					E('div', { 'class': 'nm-config-item' }, [
						E('span', { 'class': 'nm-config-label' }, 'WAN IP:'),
						E('span', { 'class': 'nm-config-value' }, status.wan_ip || 'N/A')
					]),
					E('div', { 'class': 'nm-config-item' }, [
						E('span', { 'class': 'nm-config-label' }, 'LAN IP:'),
						E('span', { 'class': 'nm-config-value' }, status.lan_ip || 'N/A')
					]),
					E('div', { 'class': 'nm-config-item' }, [
						E('span', { 'class': 'nm-config-label' }, 'DHCP Server:'),
						E('span', { 'class': 'nm-config-value' }, status.dhcp_enabled ? 'Enabled' : 'Disabled')
					])
				]),
				E('button', {
					'class': 'nm-change-mode-btn',
					'click': function() {
						window.location.hash = '#admin/secubox/network/network-modes/wizard';
					}
				}, '🔄 Change Mode')
			]),

			// Mode Comparison Table
			E('div', { 'class': 'nm-comparison-card' }, [
				E('h3', { 'class': 'nm-comparison-title' }, 'Mode Comparison Table'),
				E('div', { 'class': 'nm-comparison-table-wrapper' }, [
					E('table', { 'class': 'nm-comparison-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, 'Feature'),
								E('th', { 'class': currentMode === 'router' ? 'active-mode' : '' }, '🏠 Router'),
								E('th', { 'class': currentMode === 'bridge' ? 'active-mode' : '' }, '🌉 Bridge'),
								E('th', { 'class': currentMode === 'accesspoint' ? 'active-mode' : '' }, '📡 Access Point'),
								E('th', { 'class': currentMode === 'relay' ? 'active-mode' : '' }, '🔁 Repeater'),
								E('th', { 'class': currentMode === 'travel' ? 'active-mode' : '' }, '✈️ Travel Router')
							])
						]),
						E('tbody', {}, [
							E('tr', {}, [
								E('td', { 'class': 'feature-label' }, 'Use Case'),
								E('td', { 'class': currentMode === 'router' ? 'active-mode' : '' }, 'Home/Office'),
								E('td', { 'class': currentMode === 'bridge' ? 'active-mode' : '' }, 'L2 Forwarding'),
								E('td', { 'class': currentMode === 'accesspoint' ? 'active-mode' : '' }, 'WiFi Hotspot'),
								E('td', { 'class': currentMode === 'relay' ? 'active-mode' : '' }, 'WiFi Extender'),
								E('td', { 'class': currentMode === 'travel' ? 'active-mode' : '' }, 'Hotel / Travel kit')
							]),
							E('tr', {}, [
								E('td', { 'class': 'feature-label' }, 'WAN Ports'),
								E('td', { 'class': currentMode === 'router' ? 'active-mode' : '' }, '1+ ports'),
								E('td', { 'class': currentMode === 'bridge' ? 'active-mode' : '' }, 'All bridged'),
								E('td', { 'class': currentMode === 'accesspoint' ? 'active-mode' : '' }, '1 uplink'),
								E('td', { 'class': currentMode === 'relay' ? 'active-mode' : '' }, 'WiFi'),
								E('td', { 'class': currentMode === 'travel' ? 'active-mode' : '' }, 'WiFi or USB')
							]),
							E('tr', {}, [
								E('td', { 'class': 'feature-label' }, 'LAN Ports'),
								E('td', { 'class': currentMode === 'router' ? 'active-mode' : '' }, 'Multiple'),
								E('td', { 'class': currentMode === 'bridge' ? 'active-mode' : '' }, 'All ports'),
								E('td', { 'class': currentMode === 'accesspoint' ? 'active-mode' : '' }, 'All ports'),
								E('td', { 'class': currentMode === 'relay' ? 'active-mode' : '' }, 'All ports'),
								E('td', { 'class': currentMode === 'travel' ? 'active-mode' : '' }, 'All ports')
							]),
							E('tr', {}, [
								E('td', { 'class': 'feature-label' }, 'WiFi Role'),
								E('td', { 'class': currentMode === 'router' ? 'active-mode' : '' }, 'AP'),
								E('td', { 'class': currentMode === 'bridge' ? 'active-mode' : '' }, 'Optional AP'),
								E('td', { 'class': currentMode === 'accesspoint' ? 'active-mode' : '' }, 'AP only'),
								E('td', { 'class': currentMode === 'relay' ? 'active-mode' : '' }, 'Client + AP'),
								E('td', { 'class': currentMode === 'travel' ? 'active-mode' : '' }, 'Client + AP')
							]),
							E('tr', {}, [
								E('td', { 'class': 'feature-label' }, 'DHCP Server'),
								E('td', { 'class': currentMode === 'router' ? 'active-mode' : '' }, 'Yes'),
								E('td', { 'class': currentMode === 'bridge' ? 'active-mode' : '' }, 'No'),
								E('td', { 'class': currentMode === 'accesspoint' ? 'active-mode' : '' }, 'No'),
								E('td', { 'class': currentMode === 'relay' ? 'active-mode' : '' }, 'Yes'),
								E('td', { 'class': currentMode === 'travel' ? 'active-mode' : '' }, 'Yes')
							]),
							E('tr', {}, [
								E('td', { 'class': 'feature-label' }, 'NAT'),
								E('td', { 'class': currentMode === 'router' ? 'active-mode' : '' }, 'Enabled'),
								E('td', { 'class': currentMode === 'bridge' ? 'active-mode' : '' }, 'Disabled'),
								E('td', { 'class': currentMode === 'accesspoint' ? 'active-mode' : '' }, 'Disabled'),
								E('td', { 'class': currentMode === 'relay' ? 'active-mode' : '' }, 'Enabled'),
								E('td', { 'class': currentMode === 'travel' ? 'active-mode' : '' }, 'Enabled')
							])
						])
					])
				])
			]),

			// Mode Selection Grid
			E('div', { 'class': 'nm-modes-grid' },
				Object.keys(modeInfos).map(function(modeId) {
					var info = modeInfos[modeId];
					var isActive = modeId === currentMode;
					
					return E('div', { 
						'class': 'nm-mode-card ' + modeId + (isActive ? ' active' : ''),
						'click': function() {
							if (!isActive) {
								self.handleModeSwitch(modeId);
							}
						}
					}, [
						isActive ? E('div', { 'class': 'nm-mode-active-indicator' }, 'Active') : '',
						E('div', { 'class': 'nm-mode-header' }, [
							E('div', { 'class': 'nm-mode-icon' }, info.icon),
							E('div', { 'class': 'nm-mode-title' }, [
								E('h3', {}, info.name),
								E('p', {}, modeId.charAt(0).toUpperCase() + modeId.slice(1) + ' Mode')
							])
						]),
						E('div', { 'class': 'nm-mode-description' }, info.description),
						E('div', { 'class': 'nm-mode-features' },
							info.features.map(function(f) {
								return E('span', { 'class': 'nm-mode-feature' }, [
									E('span', { 'class': 'nm-mode-feature-icon' }, '✓'),
									f
								]);
							})
						)
					]);
				})
			),
			
			// Interfaces Status
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🔌'),
						'Network Interfaces'
					]),
					E('div', { 'class': 'nm-card-badge' }, (status.interfaces || []).length + ' interfaces')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-interfaces-grid' },
						(status.interfaces || []).map(function(iface) {
							var icon = '🔌';
							if (iface.name.startsWith('wlan') || iface.name.startsWith('wl')) icon = '📶';
							else if (iface.name.startsWith('wg')) icon = '🔐';
							else if (iface.name.startsWith('br')) icon = '🌉';
							else if (iface.name.startsWith('eth')) icon = '🔗';
							
							return E('div', { 'class': 'nm-interface-card' }, [
								E('div', { 'class': 'nm-interface-icon' }, icon),
								E('div', { 'class': 'nm-interface-info' }, [
									E('div', { 'class': 'nm-interface-name' }, iface.name),
									E('div', { 'class': 'nm-interface-ip' }, iface.ip || 'No IP')
								]),
								E('div', { 'class': 'nm-interface-status ' + iface.state })
							]);
						})
					)
				])
			]),
			
			// Services Status
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🔧'),
						'Services Status'
					])
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-interfaces-grid' },
						[
							{ name: 'Firewall', key: 'firewall', icon: '🛡️' },
							{ name: 'DHCP/DNS', key: 'dnsmasq', icon: '📡' },
							{ name: 'Netifyd', key: 'netifyd', icon: '🔍' },
							{ name: 'Nginx', key: 'nginx', icon: '🌐' },
							{ name: 'Squid', key: 'squid', icon: '🦑' }
						].map(function(svc) {
							var running = status.services && status.services[svc.key];
							return E('div', { 'class': 'nm-interface-card' }, [
								E('div', { 'class': 'nm-interface-icon' }, svc.icon),
								E('div', { 'class': 'nm-interface-info' }, [
									E('div', { 'class': 'nm-interface-name' }, svc.name),
									E('div', { 'class': 'nm-interface-ip' }, running ? 'Running' : 'Stopped')
								]),
								E('div', { 'class': 'nm-interface-status ' + (running ? 'up' : 'down') })
							]);
						})
					)
				])
			])
		]);
		
		// Include CSS
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
