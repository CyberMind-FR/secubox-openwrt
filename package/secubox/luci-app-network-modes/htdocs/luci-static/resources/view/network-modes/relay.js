'use strict';
'require view';
'require dom';
'require ui';
'require network-modes/api as api';
'require network-modes/helpers as helpers';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var nmLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: nmLang });

function buildOptToggle(key, icon, label, desc, enabled) {
	return E('div', { 'class': 'nm-toggle' }, [
		E('div', { 'class': 'nm-toggle-info' }, [
			E('span', { 'class': 'nm-toggle-icon' }, icon),
			E('div', {}, [
				E('div', { 'class': 'nm-toggle-label' }, label),
				E('div', { 'class': 'nm-toggle-desc' }, desc)
			])
		]),
		E('div', {
			'class': 'nm-toggle-switch' + (enabled ? ' active' : ''),
			'data-opt': key
		})
	]);
}

return view.extend({
	title: _('Relay Mode'),

	load: function() {
		return api.getRelayConfig();
	},

	render: function(data) {
		var config = data || {};
		var wgConfig = config.wireguard || {};
		var optConfig = config.optimizations || {};

		var hero = helpers.createHero({
			icon: '🔁',
			title: _('Relay Mode'),
			subtitle: _('WiFi relay/bridge with optional WireGuard backhaul, MTU tuning, and TCP acceleration for remote sites.'),
			gradient: 'linear-gradient(135deg,#10b981,#34d399)',
			actions: [
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'relay-generate-keys' }, ['🔑 ', _('Generate Keys')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'relay-apply-wireguard' }, ['🚀 ', _('Deploy Tunnel')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'relay-apply-optimizations' }, ['⚙️ ', _('Apply Optimizations')]),
				E('button', { 'class': 'nm-btn nm-btn-primary', 'type': 'button', 'data-action': 'relay-save' }, ['💾 ', _('Save & Apply')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'relay-config' }, ['📝 ', _('Preview Config')])
			]
		});

		var stats = E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;' }, [
			helpers.createStatBadge({ label: _('Upstream'), value: (config.relay_interface || 'wlan0').toUpperCase() }),
			helpers.createStatBadge({ label: _('LAN Bridge'), value: (config.lan_interface || 'br-lan').toUpperCase() }),
			helpers.createStatBadge({ label: _('WireGuard'), value: wgConfig.enabled ? _('Enabled') : _('Disabled') }),
			helpers.createStatBadge({ label: _('Relayd'), value: config.relayd_available ? _('Available') : _('Missing') })
		]);

		var relaySection = helpers.createSection({
			title: _('Relay Interfaces'),
			icon: '🔗',
			badge: config.relayd_available ? _('Relayd ready') : _('Install relayd'),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Upstream Interface')),
						E('input', {
							'class': 'nm-input',
							'id': 'relay-interface',
							'value': config.relay_interface || 'wlan0'
						}),
						E('div', { 'class': 'nm-form-hint' }, _('STA client connected to upstream WiFi or WAN'))
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN Interface / Bridge')),
						E('input', {
							'class': 'nm-input',
							'id': 'lan-interface',
							'value': config.lan_interface || 'br-lan'
						}),
						E('div', { 'class': 'nm-form-hint' }, _('Bridge containing downstream Ethernet/WiFi AP'))
					])
				]),
				helpers.createList([
					{ title: _('Relayd pseudo-bridge'), description: _('Extends upstream DHCP/NAT to LAN devices'), suffix: E('span', { 'class': 'nm-badge' }, _('Layer 3+2')) },
					{ title: _('Per-mode backups'), description: _('Auto snapshot /etc/config/network before switching'), suffix: E('span', { 'class': 'nm-badge' }, _('Safety')) }
				])
			]
		});

		var wgSection = helpers.createSection({
			title: _('WireGuard Backhaul'),
			icon: '🔐',
			badge: (config.wg_interfaces || []).length + ' ' + _('interfaces'),
			body: [
				E('div', { 'style': 'margin-bottom:12px;' }, [
					E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'relay-generate-keys' }, '🔑 ' + _('Generate Keys')),
					' ',
					E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'relay-apply-wireguard' }, '🚀 ' + _('Deploy Interface'))
				]),
				E('div', { 'class': 'nm-toggle' }, [
					E('div', { 'class': 'nm-toggle-info' }, [
						E('span', { 'class': 'nm-toggle-icon' }, '🔐'),
						E('div', {}, [
							E('div', { 'class': 'nm-toggle-label' }, _('Enable WireGuard')),
							E('div', { 'class': 'nm-toggle-desc' }, _('Route relay traffic through secure tunnel'))
						])
					]),
					E('div', { 'class': 'nm-toggle-switch' + (wgConfig.enabled ? ' active' : ''), 'id': 'toggle-wg' })
				]),
				E('div', { 'class': 'nm-form-grid', 'style': 'margin-top:16px;' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WireGuard Interface')),
						E('select', { 'class': 'nm-select', 'id': 'wg-interface' },
							(config.wg_interfaces || ['wg0']).map(function(iface) {
								return E('option', {
									'value': iface,
									'selected': iface === wgConfig.interface
								}, iface);
							})
						)
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Tunnel MTU')),
						E('input', {
							'class': 'nm-input',
							'type': 'number',
							'id': 'wg-mtu',
							'value': wgConfig.mtu || 1420,
							'min': '1280',
							'max': '1500'
						})
					])
				])
			]
		});

		var optimSection = helpers.createSection({
			title: _('Performance Optimizations'),
			icon: '⚡',
			body: [
				buildOptToggle('mtu_optimization', '📏', _('MTU Optimization'), _('Auto-detect optimum MTU for relay path'), optConfig.mtu_optimization),
				buildOptToggle('mss_clamping', '✂️', _('MSS Clamping'), _('Prevent TCP fragmentation issues'), optConfig.mss_clamping),
				buildOptToggle('tcp_optimization', '🚀', _('TCP Acceleration'), _('Enable BBR and tcp_fastopen'), optConfig.tcp_optimization),
				E('div', { 'class': 'nm-form-group', 'style': 'margin-top:16px;' }, [
					E('label', { 'class': 'nm-form-label' }, _('Conntrack Max')),
					E('input', {
						'class': 'nm-input',
						'type': 'number',
						'id': 'conntrack-max',
						'value': optConfig.conntrack_max || 16384,
						'min': '1024',
						'max': '262144'
					}),
					E('div', { 'class': 'nm-form-hint' }, _('Increase for busy relays (RAM usage grows accordingly)'))
				]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'relay-apply-optimizations' }, '⚡ ' + _('Run Optimization Tasks'))
			]
		});

		var container = E('div', { 'class': 'network-modes-dashboard relay-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createNavigationTabs('relay'),
			hero,
			stats,
			relaySection,
			wgSection,
			optimSection
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindRelayActions(container);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	bindRelayActions: function(container) {
		var saveBtn = container.querySelector('[data-action="relay-save"]');
		var configBtn = container.querySelector('[data-action="relay-config"]');
		var generateBtn = container.querySelector('[data-action="relay-generate-keys"]');
		var deployBtn = container.querySelector('[data-action="relay-apply-wireguard"]');
		var optimizeBtn = container.querySelector('[data-action="relay-apply-optimizations"]');

		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveRelaySettings', container));
		if (configBtn)
			configBtn.addEventListener('click', ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'relay'));
		if (generateBtn)
			generateBtn.addEventListener('click', ui.createHandlerFn(this, 'generateWireguardKeys'));
		if (deployBtn)
			deployBtn.addEventListener('click', ui.createHandlerFn(this, 'deployWireguardInterface'));
		if (optimizeBtn)
			optimizeBtn.addEventListener('click', ui.createHandlerFn(this, 'applyOptimizations'));
	},

	saveRelaySettings: function(container) {
		var toggles = {};
		container.querySelectorAll('.nm-toggle-switch[data-opt]').forEach(function(toggle) {
			var key = toggle.getAttribute('data-opt');
			toggles[key] = helpers.isToggleActive(toggle);
		});

		var mtuValue = container.querySelector('#wg-mtu') ? parseInt(container.querySelector('#wg-mtu').value, 10) : 1420;
		var conntrackValue = container.querySelector('#conntrack-max') ? parseInt(container.querySelector('#conntrack-max').value, 10) : 16384;

		var payload = {
			wireguard_enabled: helpers.isToggleActive(container.querySelector('#toggle-wg')) ? 1 : 0,
			wireguard_interface: container.querySelector('#wg-interface') ? container.querySelector('#wg-interface').value : '',
			relay_interface: container.querySelector('#relay-interface') ? container.querySelector('#relay-interface').value : '',
			lan_interface: container.querySelector('#lan-interface') ? container.querySelector('#lan-interface').value : '',
			wireguard_mtu: isNaN(mtuValue) ? 1420 : mtuValue,
			mtu_optimization: toggles.mtu_optimization ? 1 : 0,
			mss_clamping: toggles.mss_clamping ? 1 : 0,
			tcp_optimization: toggles.tcp_optimization ? 1 : 0,
			conntrack_max: isNaN(conntrackValue) ? 16384 : conntrackValue
		};

		return helpers.persistSettings('relay', payload);
	},

	generateWireguardKeys: function() {
		ui.showModal(_('Generating WireGuard keys...'), [
			E('p', { 'class': 'spinning' }, _('wg genkey / wg pubkey'))
		]);

		return api.generateWireguardKeys().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('New keys generated')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Key generation failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	deployWireguardInterface: function() {
		ui.showModal(_('Deploying WireGuard interface...'), [
			E('p', { 'class': 'spinning' }, _('Writing /etc/config/network and reloading interfaces'))
		]);

		return api.applyWireguardConfig().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('WireGuard interface deployed')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Deployment failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	applyOptimizations: function() {
		ui.showModal(_('Applying optimizations...'), [
			E('p', { 'class': 'spinning' }, _('Configuring firewall MSS clamping and TCP BBR'))
		]);

		return Promise.all([
			api.applyMtuClamping(),
			api.enableTcpBbr()
		]).then(function(responses) {
			ui.hideModal();
			var errors = responses.filter(function(r) { return r && r.success === 0; });
			if (errors.length > 0) {
				ui.addNotification(null, E('p', {}, (errors[0].error || _('Optimization failed'))), 'error');
			} else {
				ui.addNotification(null, E('p', {}, _('Optimizations applied')), 'info');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	}
});
