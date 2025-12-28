'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';
'require secubox-theme/theme as Theme';

Theme.init({ theme: 'dark', language: 'en' });

function buildToggle(id, icon, title, desc, enabled) {
	return E('div', { 'class': 'nm-toggle' }, [
		E('div', { 'class': 'nm-toggle-info' }, [
			E('span', { 'class': 'nm-toggle-icon' }, icon),
			E('div', {}, [
				E('div', { 'class': 'nm-toggle-label' }, title),
				E('div', { 'class': 'nm-toggle-desc' }, desc)
			])
		]),
		E('div', {
			'class': 'nm-toggle-switch' + (enabled ? ' active' : ''),
			'id': id
		})
	]);
}

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
		var vhosts = config.virtual_hosts || [];

		var heroActions = [
			E('button', { 'class': 'nm-btn nm-btn-primary', 'type': 'button', 'data-action': 'router-save' }, ['💾 ', _('Save & Apply')]),
			E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'router-config' }, ['📝 ', _('Preview Config')]),
			E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'router-wizard' }, ['🧭 ', _('Mode Wizard')])
		];

		var hero = helpers.createHero({
			icon: '🌐',
			title: _('Router Mode'),
			subtitle: _('Full router stack with NAT, firewall, transparent proxying, HTTPS reverse proxy, and virtual hosts.'),
			gradient: 'linear-gradient(135deg,#f97316,#fb923c)',
			actions: heroActions
		});

		var statsRow = E('div', {
			'style': 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;'
		}, [
			helpers.createStatBadge({ label: _('WAN Protocol'), value: (wanConfig.protocol || 'DHCP').toUpperCase() }),
			helpers.createStatBadge({ label: _('LAN Gateway'), value: lanConfig.ip_address || '192.168.1.1' }),
			helpers.createStatBadge({ label: _('Firewall'), value: fwConfig.enabled !== false ? _('Active') : _('Disabled') }),
			helpers.createStatBadge({ label: _('Proxy'), value: proxyConfig.enabled ? (proxyConfig.type || 'squid') : _('Disabled') })
		]);

		var wanSection = helpers.createSection({
			title: _('WAN Configuration'),
			icon: '🌍',
			badge: (wanConfig.interface || 'eth1').toUpperCase(),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WAN Interface')),
						E('input', {
							'class': 'nm-input',
							'id': 'wan-interface',
							'value': wanConfig.interface || 'eth1'
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WAN Protocol')),
						E('select', { 'class': 'nm-select', 'id': 'wan-protocol' },
							(config.available_wan_protocols || ['dhcp', 'static', 'pppoe']).map(function(proto) {
								return E('option', {
									'value': proto,
									'selected': proto === wanConfig.protocol
								}, proto.toUpperCase());
							})
						)
					])
				]),
				E('div', { 'style': 'margin-top:16px;' }, [
					buildToggle('toggle-nat', '🔄', _('NAT / Masquerade'), _('Enable source NAT for LAN subnets'), wanConfig.nat_enabled !== false)
				])
			]
		});

		var lanSection = helpers.createSection({
			title: _('LAN & DHCP'),
			icon: '🏠',
			badge: lanConfig.interface || 'br-lan',
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN IP Address')),
						E('input', {
							'class': 'nm-input',
							'id': 'lan-ip',
							'value': lanConfig.ip_address || ''
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Netmask')),
						E('input', {
							'class': 'nm-input',
							'id': 'lan-netmask',
							'value': lanConfig.netmask || '255.255.255.0'
						})
					])
				]),
				E('p', { 'class': 'nm-alert nm-alert-info', 'style': 'margin-top:16px;' }, _('DHCP pools and LAN VLAN splitting configured per mode.'))
			]
		});

		var firewallSection = helpers.createSection({
			title: _('Firewall & Security'),
			icon: '🛡️',
			badge: fwConfig.enabled !== false ? _('Enabled') : _('Disabled'),
			body: [
				buildToggle('toggle-firewall', '🛡️', _('Enable Firewall'), _('WAN/LAN isolation with automatic rules'), fwConfig.enabled !== false),
				buildToggle('toggle-synflood', '🌊', _('SYN Flood Protection'), _('Hardened TCP stack for DoS resilience'), fwConfig.syn_flood),
				E('div', { 'class': 'nm-wifi-grid', 'style': 'margin-top:16px;' }, [
					E('div', { 'class': 'nm-wifi-setting' }, [
						E('div', { 'class': 'nm-wifi-setting-label' }, _('WAN Input')),
						E('div', { 'class': 'nm-wifi-setting-value' }, fwConfig.input || 'REJECT')
					]),
					E('div', { 'class': 'nm-wifi-setting' }, [
						E('div', { 'class': 'nm-wifi-setting-label' }, _('WAN Output')),
						E('div', { 'class': 'nm-wifi-setting-value' }, fwConfig.output || 'ACCEPT')
					]),
					E('div', { 'class': 'nm-wifi-setting' }, [
						E('div', { 'class': 'nm-wifi-setting-label' }, _('Forwarding')),
						E('div', { 'class': 'nm-wifi-setting-value' }, fwConfig.forward || 'REJECT')
					])
				])
			]
		});

		var proxySection = helpers.createSection({
			title: _('Web Proxy & DoH'),
			icon: '🦑',
			badge: proxyConfig.enabled ? _('Active') : _('Disabled'),
			body: [
				buildToggle('toggle-proxy', '🦑', _('Enable Proxy'), _('HTTP/HTTPS caching with ACLs'), proxyConfig.enabled),
				E('div', { 'class': 'nm-form-grid', 'style': 'margin-top:16px;' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Proxy Type')),
						E('select', { 'class': 'nm-select', 'id': 'proxy-type' }, [
							E('option', { 'value': 'squid', 'selected': proxyConfig.type === 'squid' }, 'Squid'),
							E('option', { 'value': 'tinyproxy', 'selected': proxyConfig.type === 'tinyproxy' }, 'TinyProxy'),
							E('option', { 'value': 'privoxy', 'selected': proxyConfig.type === 'privoxy' }, 'Privoxy')
						])
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Proxy Port')),
						E('input', {
							'class': 'nm-input',
							'type': 'number',
							'id': 'proxy-port',
							'value': proxyConfig.port || 3128
						})
					])
				]),
				buildToggle('toggle-transparent', '👁️', _('Transparent Proxy'), _('Intercept traffic without client configuration'), proxyConfig.transparent),
				buildToggle('toggle-doh', '🔒', _('DNS over HTTPS'), _('Encrypt DNS queries through proxy stack'), proxyConfig.dns_over_https)
			]
		});

		var frontendSection = helpers.createSection({
			title: _('HTTPS Frontend & Virtual Hosts'),
			icon: '🔐',
			badge: vhosts.length + ' ' + _('hosts'),
			body: [
				buildToggle('toggle-frontend', '🌐', _('Enable HTTPS Frontend'), _('Reverse proxy TLS termination'), frontendConfig.enabled),
				E('div', { 'class': 'nm-form-grid', 'style': 'margin-top:16px;' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Frontend Type')),
						E('select', { 'class': 'nm-select', 'id': 'frontend-type' }, [
							E('option', { 'value': 'nginx', 'selected': frontendConfig.type === 'nginx' }, 'Nginx'),
							E('option', { 'value': 'haproxy', 'selected': frontendConfig.type === 'haproxy' }, 'HAProxy'),
							E('option', { 'value': 'caddy', 'selected': frontendConfig.type === 'caddy' }, 'Caddy')
						])
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Let\'s Encrypt')),
						buildToggle('toggle-letsencrypt', '📜', _('Automatic Certificates'), _('Issue/renew via ACME'), frontendConfig.letsencrypt)
					])
				]),
				vhosts.length ? helpers.createList(vhosts.map(function(vhost) {
					return {
						title: vhost.domain,
						description: (vhost.backend || '') + ':' + (vhost.port || 80),
						suffix: E('span', { 'class': 'nm-badge' }, vhost.ssl ? '🔒 HTTPS' : 'HTTP')
					};
				})) : E('p', { 'style': 'color: var(--nm-text-muted); margin: 16px 0;' }, _('No virtual hosts defined.')),
				E('div', { 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:16px;' }, [
					E('div', { 'class': 'nm-form-group', 'style': 'margin:0;' }, [
						E('label', { 'class': 'nm-form-label' }, _('Domain')),
						E('input', { 'class': 'nm-input', 'id': 'new-domain', 'placeholder': 'vpn.example.com' })
					]),
					E('div', { 'class': 'nm-form-group', 'style': 'margin:0;' }, [
						E('label', { 'class': 'nm-form-label' }, _('Backend')),
						E('input', { 'class': 'nm-input', 'id': 'new-backend', 'placeholder': '192.168.1.10' })
					]),
					E('div', { 'class': 'nm-form-group', 'style': 'margin:0;' }, [
						E('label', { 'class': 'nm-form-label' }, _('Port')),
						E('input', { 'class': 'nm-input', 'type': 'number', 'min': '1', 'max': '65535', 'id': 'new-port', 'value': '443' })
					]),
					E('div', { 'class': 'nm-form-group', 'style': 'margin:0;' }, [
						E('label', { 'class': 'nm-form-label' }, _('SSL')),
						E('select', { 'class': 'nm-select', 'id': 'new-ssl' }, [
							E('option', { 'value': '1' }, _('Yes')),
							E('option', { 'value': '0' }, _('No'))
						])
					]),
					E('button', { 'class': 'nm-btn nm-btn-primary', 'type': 'button', 'data-action': 'router-add-vhost' }, '➕ ' + _('Add Host'))
				])
			]
		});

		var container = E('div', { 'class': 'network-modes-dashboard router-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			hero,
			statsRow,
			wanSection,
			lanSection,
			firewallSection,
			proxySection,
			frontendSection
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindRouterActions(container);
		return container;
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
		var domainInput = container.querySelector('#new-domain');
		var backendInput = container.querySelector('#new-backend');
		if (!domainInput || !backendInput)
			return;

		var domain = domainInput.value.trim();
		var backend = backendInput.value.trim();
		var portValue = parseInt((container.querySelector('#new-port') || { value: '443' }).value, 10);
		var sslValue = (container.querySelector('#new-ssl') || { value: '1' }).value === '1' ? 1 : 0;

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
