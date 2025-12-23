'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';

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
			sniffer: api.getModeInfo('sniffer'),
			accesspoint: api.getModeInfo('accesspoint'),
			relay: api.getModeInfo('relay'),
			router: api.getModeInfo('router')
		};
		
		var currentModeInfo = modeInfos[currentMode];
		
		var view = E('div', { 'class': 'network-modes-dashboard' }, [
			// Header
			E('div', { 'class': 'nm-header' }, [
				E('div', { 'class': 'nm-logo' }, [
					E('div', { 'class': 'nm-logo-icon' }, '⚙️'),
					E('div', { 'class': 'nm-logo-text' }, ['Network ', E('span', {}, 'Modes')])
				]),
				E('div', { 'class': 'nm-mode-badge ' + currentMode }, [
					E('span', { 'class': 'nm-mode-dot' }),
					currentModeInfo ? currentModeInfo.name : currentMode
				])
			]),
			
			// Status info
			E('div', { 'class': 'nm-alert nm-alert-info' }, [
				E('span', { 'class': 'nm-alert-icon' }, 'ℹ️'),
				E('div', {}, [
					E('div', { 'class': 'nm-alert-title' }, 'Current Mode: ' + (currentModeInfo ? currentModeInfo.name : currentMode)),
					E('div', { 'class': 'nm-alert-text' }, 
						'Last changed: ' + (status.last_change || 'Never') + ' • Uptime: ' + api.formatUptime(status.uptime))
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
