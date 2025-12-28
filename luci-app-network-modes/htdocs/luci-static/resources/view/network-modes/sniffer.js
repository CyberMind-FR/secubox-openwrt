'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';

return view.extend({
	title: _('Sniffer Mode'),
	
	load: function() {
		return api.getSnifferConfig();
	},
	
	render: function(data) {
		var config = data || {};
		
		var view = E('div', { 'class': 'network-modes-dashboard' }, [
			// Header
			E('div', { 'class': 'nm-header' }, [
				E('div', { 'class': 'nm-logo' }, [
					E('div', { 'class': 'nm-logo-icon', 'style': 'background: linear-gradient(135deg, #8b5cf6, #a855f7)' }, '🔍'),
					E('div', { 'class': 'nm-logo-text' }, ['Sniffer ', E('span', { 'style': 'background: linear-gradient(135deg, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' }, 'Mode')])
				])
			]),
			
			// Description
			E('div', { 'class': 'nm-alert nm-alert-info' }, [
				E('span', { 'class': 'nm-alert-icon' }, '🔍'),
				E('div', {}, [
					E('div', { 'class': 'nm-alert-title' }, 'Transparent Network Analysis'),
					E('div', { 'class': 'nm-alert-text' }, 
						'Bridge mode without IP address. All traffic passes through for passive analysis with Netifyd. ' +
						'Ideal for DPI, traffic monitoring, and network forensics.')
				])
			]),
			
			// Configuration
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '⚙️'),
						'Bridge Configuration'
					])
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'Bridge Interface'),
						E('select', { 'class': 'nm-select', 'id': 'bridge-interface' },
							(config.available_interfaces || ['eth0', 'eth1']).map(function(iface) {
								return E('option', { 
									'value': iface,
									'selected': iface === config.bridge_interface 
								}, iface);
							})
						),
						E('div', { 'class': 'nm-form-hint' }, 'Primary interface for the transparent bridge')
					]),
					
					// Toggles
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🔍'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Netifyd Integration'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Enable Deep Packet Inspection')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (config.netifyd_enabled ? ' active' : ''),
							'id': 'toggle-netifyd'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '📡'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Promiscuous Mode'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Capture all network traffic')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (config.promiscuous ? ' active' : ''),
							'id': 'toggle-promisc'
						})
					])
				])
			]),
			
			// Netifyd Status
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '📊'),
						'Netifyd Status'
					]),
					E('div', { 'class': 'nm-card-badge' }, config.netifyd_running ? 'Running' : 'Stopped')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-interfaces-grid' }, [
						E('div', { 'class': 'nm-interface-card' }, [
							E('div', { 'class': 'nm-interface-icon' }, '🔍'),
							E('div', { 'class': 'nm-interface-info' }, [
								E('div', { 'class': 'nm-interface-name' }, 'Netifyd'),
								E('div', { 'class': 'nm-interface-ip' }, config.netifyd_running ? 'Active' : 'Inactive')
							]),
							E('div', { 'class': 'nm-interface-status ' + (config.netifyd_running ? 'up' : 'down') })
						])
					]),
					config.netifyd_running ? 
						E('p', { 'style': 'margin-top: 16px; font-size: 13px; color: var(--nm-text-secondary)' }, 
							'Netifyd is analyzing traffic. View results in the Netifyd Dashboard.') :
						E('p', { 'style': 'margin-top: 16px; font-size: 13px; color: var(--nm-text-muted)' }, 
							'Enable Netifyd to start Deep Packet Inspection.')
				])
			]),
			
			// Config Preview
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '📝'),
						'Configuration Preview'
					])
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('pre', { 'class': 'nm-config-preview' }, config.config_preview || '# No configuration preview available')
				])
			]),
			
			// Actions
			E('div', { 'class': 'nm-btn-group' }, [
				E('button', { 'class': 'nm-btn nm-btn-primary', 'data-action': 'sniffer-save', 'type': 'button' }, [
					E('span', {}, '💾'),
					'Save Settings'
				]),
				E('button', { 'class': 'nm-btn', 'data-action': 'sniffer-config', 'type': 'button' }, [
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
		
		this.bindSnifferActions(view);
		
		return view;
	},
	
	bindSnifferActions: function(container) {
		var saveBtn = container.querySelector('[data-action="sniffer-save"]');
		var applyBtn = container.querySelector('[data-action="sniffer-config"]');

		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveSnifferSettings', container));
		if (applyBtn)
			applyBtn.addEventListener('click', ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'sniffer'));
	},

	saveSnifferSettings: function(container) {
		var payload = {
			bridge_interface: container.querySelector('#bridge-interface') ? container.querySelector('#bridge-interface').value : '',
			netifyd_enabled: helpers.isToggleActive(container.querySelector('#toggle-netifyd')) ? 1 : 0,
			promiscuous: helpers.isToggleActive(container.querySelector('#toggle-promisc')) ? 1 : 0
		};

		return helpers.persistSettings('sniffer', payload);
	}
});
