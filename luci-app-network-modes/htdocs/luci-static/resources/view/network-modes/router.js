'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';

return view.extend({
	title: _('Router Mode'),
	
	load: function() {
		return api.getRouterConfig();
	},
	
	render: function(data) {
		var config = data || {};
		var wanConfig = config.wan || {};
		var lanConfig = config.lan || {};
		var fwConfig = config.firewall || {};
		var proxyConfig = config.proxy || {};
		var frontendConfig = config.https_frontend || {};
		var proxyStatus = proxyConfig.enabled ? (proxyConfig.type || 'squid') : 'disabled';
		var dohStatus = proxyConfig.dns_over_https ? _('Enabled') : _('Disabled');
		var vhosts = config.virtual_hosts || [];
		
		var view = E('div', { 'class': 'network-modes-dashboard' }, [
			// Header
			E('div', { 'class': 'nm-header' }, [
				E('div', { 'class': 'nm-logo' }, [
					E('div', { 'class': 'nm-logo-icon' }, '🌐'),
					E('div', { 'class': 'nm-logo-text' }, ['Router ', E('span', {}, 'Mode')])
				])
			]),
			
			// Description
			E('div', { 'class': 'nm-alert nm-alert-info' }, [
				E('span', { 'class': 'nm-alert-icon' }, '🌐'),
				E('div', {}, [
					E('div', { 'class': 'nm-alert-title' }, 'Full Router with Advanced Features'),
					E('div', { 'class': 'nm-alert-text' }, 
						'Complete router functionality with WAN management, NAT, firewall, ' +
						'web proxy, and HTTPS reverse proxy for multiple domains.')
				])
			]),
			
			// WAN Configuration
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🌍'),
						'WAN Configuration'
					])
					]),
					E('div', { 'class': 'nm-card-body' }, [
						E('div', { 'class': 'nm-alert nm-alert-info', 'style': 'margin-bottom: 12px;' }, [
							E('span', { 'class': 'nm-alert-icon' }, 'ℹ️'),
							E('div', {}, [
								E('div', { 'class': 'nm-alert-title' }, _('Proxy status')),
								E('div', { 'class': 'nm-alert-text' }, _('Type: ') + proxyStatus + ' • DoH: ' + dohStatus)
							])
						]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'WAN Interface'),
						E('input', { 
							'class': 'nm-input',
							'type': 'text',
							'value': wanConfig.interface || 'eth1',
							'id': 'wan-interface'
						})
					]),
					
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'WAN Protocol'),
						E('select', { 'class': 'nm-select', 'id': 'wan-protocol' },
							(config.available_wan_protocols || ['dhcp', 'static', 'pppoe']).map(function(proto) {
								return E('option', { 
									'value': proto,
									'selected': proto === wanConfig.protocol
								}, proto.toUpperCase());
							})
						)
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🔄'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'NAT / Masquerade'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Network Address Translation for LAN')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wanConfig.nat_enabled !== false ? ' active' : ''),
							'id': 'toggle-nat'
						})
					])
				])
			]),
			
			// Firewall
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🛡️'),
						'Firewall'
					]),
					E('div', { 'class': 'nm-card-badge' }, fwConfig.enabled ? 'Enabled' : 'Disabled')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🛡️'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Enable Firewall'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Protect network with firewall rules')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (fwConfig.enabled !== false ? ' active' : ''),
							'id': 'toggle-firewall'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🌊'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'SYN Flood Protection'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Prevent SYN flood DoS attacks')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (fwConfig.syn_flood ? ' active' : ''),
							'id': 'toggle-synflood'
						})
					]),
					
					E('div', { 'class': 'nm-wifi-grid', 'style': 'margin-top: 16px' }, [
						E('div', { 'class': 'nm-wifi-setting' }, [
							E('div', { 'class': 'nm-wifi-setting-label' }, 'WAN Input'),
							E('div', { 'class': 'nm-wifi-setting-value', 'style': 'font-size: 14px' }, fwConfig.input || 'REJECT')
						]),
						E('div', { 'class': 'nm-wifi-setting' }, [
							E('div', { 'class': 'nm-wifi-setting-label' }, 'WAN Output'),
							E('div', { 'class': 'nm-wifi-setting-value', 'style': 'font-size: 14px' }, fwConfig.output || 'ACCEPT')
						]),
						E('div', { 'class': 'nm-wifi-setting' }, [
							E('div', { 'class': 'nm-wifi-setting-label' }, 'WAN Forward'),
							E('div', { 'class': 'nm-wifi-setting-value', 'style': 'font-size: 14px' }, fwConfig.forward || 'REJECT')
						])
					])
				])
			]),
			
			// Proxy Configuration
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🦑'),
						'Web Proxy'
					]),
					E('div', { 'class': 'nm-card-badge' }, proxyConfig.enabled ? 'Active' : 'Disabled')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🦑'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Enable Proxy'),
								E('div', { 'class': 'nm-toggle-desc' }, 'HTTP/HTTPS caching proxy')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (proxyConfig.enabled ? ' active' : ''),
							'id': 'toggle-proxy'
						})
					]),
					
					E('div', { 'class': 'nm-form-group', 'style': 'margin-top: 16px' }, [
						E('label', { 'class': 'nm-form-label' }, 'Proxy Type'),
						E('select', { 'class': 'nm-select', 'id': 'proxy-type' }, [
							E('option', { 'value': 'squid', 'selected': proxyConfig.type === 'squid' }, 'Squid'),
							E('option', { 'value': 'tinyproxy', 'selected': proxyConfig.type === 'tinyproxy' }, 'TinyProxy'),
							E('option', { 'value': 'privoxy', 'selected': proxyConfig.type === 'privoxy' }, 'Privoxy')
						])
					]),
					
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'Proxy Port'),
						E('input', { 
							'class': 'nm-input',
							'type': 'number',
							'value': proxyConfig.port || 3128,
							'id': 'proxy-port'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '👁️'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Transparent Proxy'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Intercept traffic without client config')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (proxyConfig.transparent ? ' active' : ''),
							'id': 'toggle-transparent'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🔒'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'DNS over HTTPS'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Encrypt DNS queries')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (proxyConfig.dns_over_https ? ' active' : ''),
							'id': 'toggle-doh'
						})
					])
				])
			]),
			
			// HTTPS Frontend / Reverse Proxy
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🔐'),
						'HTTPS Reverse Proxy'
					]),
					E('div', { 'class': 'nm-card-badge' }, vhosts.length + ' virtual hosts')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-alert nm-alert-info', 'style': 'margin-bottom: 12px;' }, [
						E('span', { 'class': 'nm-alert-icon' }, frontendConfig.enabled ? '🟢' : '⚪'),
						E('div', {}, [
							E('div', { 'class': 'nm-alert-title' }, _('Frontend status: ') + (frontendConfig.enabled ? _('Enabled') : _('Disabled'))),
							E('div', { 'class': 'nm-alert-text' }, _('Type: ') + (frontendConfig.type || 'nginx') + ' • ' + _('Let\'s Encrypt: ') + (frontendConfig.letsencrypt ? _('Enabled') : _('Disabled')))
						])
					]),
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🌐'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Enable HTTPS Frontend'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Reverse proxy for multiple domains')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (frontendConfig.enabled ? ' active' : ''),
							'id': 'toggle-frontend'
						})
					]),
					
					E('div', { 'class': 'nm-form-group', 'style': 'margin-top: 16px' }, [
						E('label', { 'class': 'nm-form-label' }, 'Frontend Type'),
						E('select', { 'class': 'nm-select', 'id': 'frontend-type' }, [
							E('option', { 'value': 'nginx', 'selected': frontendConfig.type === 'nginx' }, 'Nginx'),
							E('option', { 'value': 'haproxy', 'selected': frontendConfig.type === 'haproxy' }, 'HAProxy'),
							E('option', { 'value': 'caddy', 'selected': frontendConfig.type === 'caddy' }, 'Caddy')
						])
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '📜'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Let\'s Encrypt'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Automatic SSL certificates')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (frontendConfig.letsencrypt ? ' active' : ''),
							'id': 'toggle-letsencrypt'
						})
					]),
					
					// Virtual Hosts Table
					vhosts.length > 0 ?
					E('div', { 'style': 'margin-top: 20px' }, [
						E('h4', { 'style': 'margin: 0 0 12px 0; font-size: 14px' }, 'Virtual Hosts'),
						E('table', { 'class': 'nm-vhost-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'Domain'),
									E('th', {}, 'Backend'),
									E('th', {}, 'Port'),
									E('th', {}, 'SSL'),
									E('th', {}, 'Actions')
								])
							]),
							E('tbody', {},
								vhosts.map(function(vhost) {
									return E('tr', {}, [
										E('td', { 'class': 'domain' }, vhost.domain),
										E('td', { 'class': 'mono' }, vhost.backend),
										E('td', { 'class': 'mono' }, vhost.port || 80),
										E('td', {}, [
											E('span', { 'class': 'nm-ssl-badge ' + (vhost.ssl ? 'enabled' : 'disabled') }, 
												vhost.ssl ? '🔒 HTTPS' : '⚠️ HTTP')
										]),
										E('td', {}, [
											E('button', { 'class': 'nm-btn', 'style': 'padding: 4px 8px; font-size: 12px' }, '🗑️')
										])
									]);
								})
							)
						])
					]) :
					E('p', { 'style': 'color: var(--nm-text-muted); font-size: 13px; margin-top: 16px' }, 
						'No virtual hosts configured. Add domains below.'),
					
					// Add Virtual Host
					E('div', { 'style': 'margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--nm-border)' }, [
						E('h4', { 'style': 'margin: 0 0 12px 0; font-size: 14px' }, 'Add Virtual Host'),
						E('div', { 'style': 'display: grid; grid-template-columns: 2fr 2fr 1fr 1fr auto; gap: 12px; align-items: end' }, [
							E('div', { 'class': 'nm-form-group', 'style': 'margin: 0' }, [
								E('label', { 'class': 'nm-form-label' }, 'Domain'),
								E('input', { 'class': 'nm-input', 'type': 'text', 'placeholder': 'example.com', 'id': 'new-domain' })
							]),
							E('div', { 'class': 'nm-form-group', 'style': 'margin: 0' }, [
								E('label', { 'class': 'nm-form-label' }, 'Backend'),
								E('input', { 'class': 'nm-input', 'type': 'text', 'placeholder': '127.0.0.1', 'id': 'new-backend' })
							]),
							E('div', { 'class': 'nm-form-group', 'style': 'margin: 0' }, [
								E('label', { 'class': 'nm-form-label' }, 'Port'),
								E('input', { 'class': 'nm-input', 'type': 'number', 'min': '1', 'max': '65535', 'value': '443', 'id': 'new-port' })
							]),
							E('div', { 'class': 'nm-form-group', 'style': 'margin: 0' }, [
								E('label', { 'class': 'nm-form-label' }, 'SSL'),
								E('select', { 'class': 'nm-select', 'id': 'new-ssl' }, [
									E('option', { 'value': '1' }, 'Yes'),
									E('option', { 'value': '0' }, 'No')
								])
							]),
							E('button', { 'class': 'nm-btn nm-btn-primary', 'style': 'height: 46px', 'type': 'button', 'data-action': 'router-add-vhost' }, '➕ Add')
						])
					])
				])
			]),
			
			// Actions
			E('div', { 'class': 'nm-btn-group' }, [
				E('button', { 'class': 'nm-btn nm-btn-primary', 'data-action': 'router-save', 'type': 'button' }, [
					E('span', {}, '💾'),
					'Save Settings'
				]),
				E('button', { 'class': 'nm-btn', 'data-action': 'router-wizard', 'type': 'button' }, [
					E('span', {}, '🧭'),
					'Open Mode Wizard'
				]),
				E('button', { 'class': 'nm-btn', 'data-action': 'router-config', 'type': 'button' }, [
					E('span', {}, '📝'),
					'Generate Config'
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
		
		this.bindRouterActions(view);
		
		return view;
	},
	
	bindRouterActions: function(container) {
		var saveBtn = container.querySelector('[data-action="router-save"]');
		var wizardBtn = container.querySelector('[data-action="router-wizard"]');
		var configBtn = container.querySelector('[data-action="router-config"]');
		var addVhostBtn = container.querySelector('[data-action="router-add-vhost"]');

		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveRouterSettings', container));
		if (wizardBtn)
			wizardBtn.addEventListener('click', ui.createHandlerFn(this, 'openWizard'));
		if (configBtn)
			configBtn.addEventListener('click', ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'router'));
		if (addVhostBtn)
			addVhostBtn.addEventListener('click', ui.createHandlerFn(this, 'addVirtualHost', container));
	},

	saveRouterSettings: function(container) {
		var payload = {
			wan_interface: container.querySelector('#wan-interface') ? container.querySelector('#wan-interface').value : 'eth1',
			wan_protocol: container.querySelector('#wan-protocol') ? container.querySelector('#wan-protocol').value : 'dhcp',
			nat_enabled: helpers.isToggleActive(container.querySelector('#toggle-nat')) ? 1 : 0,
			firewall_enabled: helpers.isToggleActive(container.querySelector('#toggle-firewall')) ? 1 : 0,
			proxy_enabled: helpers.isToggleActive(container.querySelector('#toggle-proxy')) ? 1 : 0,
			proxy_type: container.querySelector('#proxy-type') ? container.querySelector('#proxy-type').value : 'squid',
			proxy_port: container.querySelector('#proxy-port') ? parseInt(container.querySelector('#proxy-port').value, 10) || 3128 : 3128,
			transparent_proxy: helpers.isToggleActive(container.querySelector('#toggle-transparent')) ? 1 : 0,
			dns_over_https: helpers.isToggleActive(container.querySelector('#toggle-doh')) ? 1 : 0,
			https_frontend: helpers.isToggleActive(container.querySelector('#toggle-frontend')) ? 1 : 0,
			frontend_type: container.querySelector('#frontend-type') ? container.querySelector('#frontend-type').value : 'nginx',
			letsencrypt: helpers.isToggleActive(container.querySelector('#toggle-letsencrypt')) ? 1 : 0
		};

		return helpers.persistSettings('router', payload);
	},

	openWizard: function() {
		window.location.hash = '#admin/secubox/network/network-modes/wizard';
	},

	addVirtualHost: function(container) {
		var domain = container.querySelector('#new-domain').value.trim();
		var backend = container.querySelector('#new-backend').value.trim();
		var portValue = parseInt(container.querySelector('#new-port').value, 10);
		var sslValue = container.querySelector('#new-ssl').value === '1' ? 1 : 0;

		if (!domain || !backend) {
			ui.addNotification(null, E('p', {}, _('Domain and backend are required')), 'error');
			return;
		}

		ui.showModal(_('Adding virtual host...'), [
			E('p', { 'class': 'spinning' }, _('Saving virtual host entry'))
		]);

		return api.addVirtualHost({
			domain: domain,
			backend: backend,
			port: isNaN(portValue) ? 80 : portValue,
			ssl: sslValue
		}).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Virtual host added')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Failed to add virtual host')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	}
});
