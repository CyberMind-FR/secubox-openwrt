'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';
'require secubox/help as Help';
'require secubox-theme/theme as Theme';

// Initialize global theme respecting LuCI preferences
var nmLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: nmLang });

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

		// Build a full mode map using backend data + fallbacks
		var baseOrder = ['router', 'doublenat', 'multiwan', 'vpnrelay', 'bridge', 'accesspoint', 'relay', 'travel', 'sniffer'];
		var modeInfos = {};

		// Prime with RPC payload so description/icon/features stay in sync
		modesData.forEach(function(mode) {
			var fallback = api.getModeInfo(mode.id || '');
			modeInfos[mode.id] = Object.assign({}, fallback, {
				id: mode.id,
				name: mode.name || (fallback && fallback.name) || mode.id,
				icon: mode.icon || (fallback && fallback.icon) || '🌐',
				description: mode.description || (fallback && fallback.description) || '',
				features: Array.isArray(mode.features) && mode.features.length
					? mode.features
					: (fallback && fallback.features) || []
			});
		});

		// Ensure every known mode has a definition, even if RPC omitted it
		baseOrder.concat(['sniffer']).forEach(function(mode) {
			if (!modeInfos[mode]) {
				modeInfos[mode] = api.getModeInfo(mode);
			}
		});

		// Preserve RPC ordering but guarantee canonical fallback + sniffer tab
		var modeOrder = modesData.map(function(mode) { return mode.id; });
		baseOrder.forEach(function(mode) {
			if (modeOrder.indexOf(mode) === -1)
				modeOrder.push(mode);
		});
		if (modeOrder.indexOf('sniffer') === -1)
			modeOrder.push('sniffer');

		var currentModeInfo = modeInfos[currentMode] || api.getModeInfo(currentMode);
		
		var view = E('div', { 'class': 'network-modes-dashboard' }, [
			// Load global theme CSS
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/help.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createNavigationTabs('overview'),

			this.renderHeader(status, currentModeInfo),
			
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
								E('th', {}, 'Feature')
							].concat(baseOrder.map(function(modeId) {
								var info = modeInfos[modeId] || api.getModeInfo(modeId);
								return E('th', {
									'class': currentMode === modeId ? 'active-mode' : ''
								}, (info.icon || '') + ' ' + (info.name || modeId));
							})))
						]),
						E('tbody', {}, (function() {
								var comparisonRows = [
									{
										label: 'Use Case',
										values: {
											router: 'Home/Office',
											doublenat: 'Behind ISP box',
											multiwan: 'Dual uplinks',
											vpnrelay: 'VPN gateway',
											bridge: 'Layer 2 passthrough',
											accesspoint: 'WiFi Hotspot',
											relay: 'WiFi Extender',
											travel: 'Hotel / Travel kit',
											sniffer: 'Packet capture / TAP'
										}
									},
									{
										label: 'WAN Ports',
										values: {
											router: '1 port',
											doublenat: 'WAN DHCP',
											multiwan: '2 uplinks',
											vpnrelay: 'VPN tunnel',
											bridge: 'All bridged',
											accesspoint: '1 uplink',
											relay: 'WiFi uplink',
											travel: 'WiFi or USB',
											sniffer: 'Monitor source port'
										}
									},
									{
										label: 'LAN Ports',
										values: {
											router: 'Multiple',
											doublenat: 'LAN + Guest',
											multiwan: 'All ports',
											vpnrelay: 'Policy-based',
											bridge: 'All ports',
											accesspoint: 'All ports',
											relay: 'All ports',
											travel: 'All ports',
											sniffer: 'Mirror to capture'
										}
									},
									{
										label: 'WiFi Role',
										values: {
											router: 'Access Point',
											doublenat: 'Router',
											multiwan: 'Router',
											vpnrelay: 'Router',
											bridge: 'Optional AP',
											accesspoint: 'AP only',
											relay: 'Client + AP',
											travel: 'Client + AP',
											sniffer: 'Monitor mode'
										}
									},
									{
										label: 'DHCP Server',
										values: {
											router: 'Yes',
											doublenat: 'Yes',
											multiwan: 'Yes',
											vpnrelay: 'Optional',
											bridge: 'No',
											accesspoint: 'No',
											relay: 'Yes',
											travel: 'Yes',
											sniffer: 'No'
										}
									},
									{
										label: 'NAT',
										values: {
											router: 'Enabled',
											doublenat: 'Double layer',
											multiwan: 'Enabled',
											vpnrelay: 'VPN NAT',
											bridge: 'Disabled',
											accesspoint: 'Disabled',
											relay: 'Enabled',
											travel: 'Enabled',
											sniffer: 'Disabled'
										}
									}
							];

							return comparisonRows.map(function(row) {
								return E('tr', {}, [
									E('td', { 'class': 'feature-label' }, row.label)
								].concat(baseOrder.map(function(modeId) {
									return E('td', {
										'class': currentMode === modeId ? 'active-mode' : ''
									}, row.values[modeId] || '—');
								})));
							});
						})())
					])
				])
			]),

			// Mode Selection Grid
			E('div', { 'class': 'nm-modes-grid' },
				modeOrder.map(function(modeId) {
					var info = modeInfos[modeId];
					if (!info)
						return null;

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
							(info.features || []).map(function(f) {
								return E('span', { 'class': 'nm-mode-feature' }, [
									E('span', { 'class': 'nm-mode-feature-icon' }, '✓'),
									f
								]);
							})
						)
					]);
				}).filter(function(card) { return !!card; })
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

		renderHeader: function(status, currentModeInfo) {
		var modeName = currentModeInfo ? currentModeInfo.name : (status.current_mode || 'router');
		var stats = [
			{ label: _('Version'), value: status.version || _('Unknown'), icon: '🏷️' },
			{ label: _('Mode'), value: modeName, icon: '🧭' },
			{ label: _('WAN IP'), value: status.wan_ip || _('Unknown'), icon: '🌍' },
			{ label: _('LAN IP'), value: status.lan_ip || _('Unknown'), icon: '🏠' }
		];

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🌐'),
					_('Network Configuration')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Switch between curated router, bridge, relay, and travel modes.'))
			]),
			E('div', { 'class': 'sh-header-meta' }, stats.map(this.renderHeaderChip, this))
		]);
	},

	renderHeaderChip: function(stat) {
		return E('div', { 'class': 'sh-header-chip' }, [
			E('span', { 'class': 'sh-chip-icon' }, stat.icon || '•'),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, stat.label),
				E('strong', {}, stat.value || '-')
			])
		]);
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
