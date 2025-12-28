'use strict';
'require view';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';
'require secubox-theme/theme as Theme';

Theme.init({ theme: 'dark', language: 'en' });

return view.extend({
	title: _('Double NAT Mode'),

	load: function() {
		return api.getDoubleNatConfig();
	},

	render: function(data) {
		var cfg = data || {};
		var wan = cfg.wan || {};
		var lan = cfg.lan || {};

		var container = E('div', { 'class': 'network-modes-dashboard doublenat-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createHero({
				icon: '🔁',
				title: _('Double NAT'),
				subtitle: _('Operate behind an ISP router with a second isolated LAN, guest network, and hardened perimeter.'),
				actions: [
					E('button', {
						'class': 'nm-btn nm-btn-primary',
						'data-action': 'doublenat-save',
						'type': 'button'
					}, '💾 ' + _('Save Settings')),
					E('button', {
						'class': 'nm-btn',
						'type': 'button',
						'click': ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'doublenat')
					}, '📝 ' + _('Preview Config'))
				]
			}),
			this.renderWanSection(wan),
			this.renderLanSection(lan, cfg),
			this.renderSecuritySection(cfg)
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindActions(container);
		return container;
	},

	renderWanSection: function(wan) {
		return helpers.createSection({
			icon: '🌐',
			title: _('Upstream (ISP box)'),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WAN Interface')),
						E('input', {
							'class': 'nm-input',
							'id': 'dn-wan-interface',
							'value': wan.interface || 'eth1'
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Protocol')),
						E('select', { 'class': 'nm-select', 'id': 'dn-wan-proto' }, [
							E('option', { 'value': 'dhcp', 'selected': (wan.protocol || 'dhcp') === 'dhcp' }, _('DHCP Client')),
							E('option', { 'value': 'static', 'selected': wan.protocol === 'static' }, _('Static IP')),
							E('option', { 'value': 'pppoe', 'selected': wan.protocol === 'pppoe' }, _('PPPoE'))
						])
					])
				]),
				E('p', { 'class': 'nm-text-muted' }, _('Keep WAN as DHCP client to obtain an address from the ISP box. Use DMZ on the ISP router to point to SecuBox for best results.'))
			]
		});
	},

	renderLanSection: function(lan, cfg) {
		return helpers.createSection({
			icon: '🏠',
			title: _('LAN & Guest Segments'),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN Interface')),
						E('input', {
							'class': 'nm-input',
							'id': 'dn-lan-interface',
							'value': lan.interface || 'br-lan'
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN IP')),
						E('input', {
							'class': 'nm-input',
							'id': 'dn-lan-ip',
							'value': lan.ipaddr || '10.10.0.1'
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN Netmask')),
						E('input', {
							'class': 'nm-input',
							'id': 'dn-lan-netmask',
							'value': lan.netmask || '255.255.255.0'
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Guest bridge name')),
						E('input', {
							'class': 'nm-input',
							'id': 'dn-guest-bridge',
							'value': cfg.guest_network || 'br-guest'
						})
					])
				])
			]
		});
	},

	renderSecuritySection: function(cfg) {
		return helpers.createSection({
			icon: '🛡️',
			title: _('Security Hardening'),
			body: [
				E('div', { 'class': 'nm-toggle-list' }, [
					this.renderToggle(_('Disable UPnP on downstream LAN'), 'Prevents auto-forwarding from LAN devices', 'dn-upnp', cfg.upnp_enabled && cfg.upnp_enabled !== '0'),
					this.renderToggle(_('Isolate guest bridge'), 'Block traffic between guest and LAN networks', 'dn-isolate-guest', cfg.isolate_guest === 1 || cfg.isolate_guest === '1')
				]),
				E('div', { 'class': 'nm-form-group', 'style': 'margin-top: 16px;' }, [
					E('label', { 'class': 'nm-form-label' }, _('DMZ Host on ISP router')),
					E('input', {
						'class': 'nm-input',
						'id': 'dn-dmz-host',
						'value': cfg.dmz_host || '',
						'placeholder': _('192.168.1.254 (optional)')
					}),
					E('p', { 'class': 'nm-text-muted' }, _('Configure the ISP router DMZ to forward everything to this LAN IP.'))
				])
			]
		});
	},

	renderToggle: function(label, desc, id, active) {
		return E('div', { 'class': 'nm-toggle' }, [
			E('div', { 'class': 'nm-toggle-info' }, [
				E('span', { 'class': 'nm-toggle-icon' }, '⚙️'),
				E('div', {}, [
					E('div', { 'class': 'nm-toggle-label' }, label),
					E('div', { 'class': 'nm-toggle-desc' }, desc)
				])
			]),
			E('div', {
				'class': 'nm-toggle-switch' + (active ? ' active' : ''),
				'id': id
			})
		]);
	},

	bindActions: function(container) {
		var saveBtn = container.querySelector('[data-action="doublenat-save"]');
		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveDoubleNatSettings', container));
	},

	saveDoubleNatSettings: function(container) {
		var payload = {
			wan_interface: (container.querySelector('#dn-wan-interface') || {}).value,
			wan_protocol: (container.querySelector('#dn-wan-proto') || {}).value,
			lan_interface: (container.querySelector('#dn-lan-interface') || {}).value,
			lan_ip: (container.querySelector('#dn-lan-ip') || {}).value,
			lan_netmask: (container.querySelector('#dn-lan-netmask') || {}).value,
			guest_network: (container.querySelector('#dn-guest-bridge') || {}).value,
			isolate_guest: helpers.isToggleActive(container.querySelector('#dn-isolate-guest')) ? 1 : 0,
			upnp_enabled: helpers.isToggleActive(container.querySelector('#dn-upnp')) ? 1 : 0,
			dmz_host: (container.querySelector('#dn-dmz-host') || {}).value
		};

		return helpers.persistSettings('doublenat', payload);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
