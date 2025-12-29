'use strict';
'require view';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';
'require secubox-theme/theme as Theme';

var nmLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: nmLang });

return view.extend({
	title: _('VPN Relay Mode'),

	load: function() {
		return api.getVpnRelayConfig();
	},

	render: function(data) {
		var cfg = data || {};
		var vpn = cfg.vpn || {};
		var policy = cfg.policy || {};

		var container = E('div', { 'class': 'network-modes-dashboard vpnrelay-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createNavigationTabs('vpnrelay'),
			helpers.createHero({
				icon: '🛡️',
				title: _('VPN Relay'),
				subtitle: _('Route LAN traffic through WireGuard/OpenVPN tunnels with policy routing and kill-switch.'),
				actions: [
					E('button', {
						'class': 'nm-btn nm-btn-primary',
						'data-action': 'vpnrelay-save',
						'type': 'button'
					}, '💾 ' + _('Save Settings')),
					E('button', {
						'class': 'nm-btn',
						'type': 'button',
						'click': ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'vpnrelay')
					}, '📝 ' + _('Preview Config'))
				]
			}),
			this.renderVpnSection(vpn, cfg),
			this.renderPolicySection(policy)
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindActions(container);
		return container;
	},

	renderVpnSection: function(vpn, cfg) {
		var wgList = cfg.wireguard_interfaces || [];
		var ovpnList = cfg.openvpn_profiles || [];
		var ifaceList = cfg.available_interfaces || [];

		return helpers.createSection({
			icon: '🧩',
			title: _('VPN Transport'),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('VPN Type')),
						E('select', { 'class': 'nm-select', 'id': 'vpn-type' }, [
							E('option', { 'value': 'wireguard', 'selected': (vpn.type || 'wireguard') === 'wireguard' }, 'WireGuard'),
							E('option', { 'value': 'openvpn', 'selected': vpn.type === 'openvpn' }, 'OpenVPN')
						])
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('VPN Provider Label')),
						E('input', {
							'class': 'nm-input',
							'id': 'vpn-provider',
							'value': vpn.provider || ''
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WireGuard Interface')),
						E('select', { 'class': 'nm-select', 'id': 'vpn-wg-interface' },
							(wgList.length ? wgList : ['wg0']).map(function(iface) {
								return E('option', { 'value': iface, 'selected': (vpn.wg_interface || 'wg0') === iface }, iface);
							}))
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('OpenVPN Profile')),
						E('select', { 'class': 'nm-select', 'id': 'vpn-ovpn-profile' }, [
							E('option', { 'value': '' }, _('Select profile'))
						].concat((ovpnList || []).map(function(profile) {
							return E('option', { 'value': profile, 'selected': vpn.openvpn_profile === profile }, profile);
						})))
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Upstream Interface')),
						E('select', { 'class': 'nm-select', 'id': 'vpn-upstream' },
							(ifaceList.length ? ifaceList : ['wan']).map(function(iface) {
								return E('option', { 'value': iface, 'selected': (vpn.upstream_interface || 'wan') === iface }, iface);
							}))
					])
				])
			]
		});
	},

	renderPolicySection: function(policy) {
		return helpers.createSection({
			icon: '🧭',
			title: _('Routing & Security'),
			body: [
				E('div', { 'class': 'nm-toggle-list' }, [
					this.renderToggle(_('Policy routing / split tunnel'), 'Allow per-subnet/per-device rules', 'vpn-policy-routing', policy.policy_routing !== 0 && policy.policy_routing !== '0'),
					this.renderToggle(_('Force VPN DNS servers'), 'Override LAN DNS while VPN is active', 'vpn-dns-override', policy.dns_override !== 0 && policy.dns_override !== '0'),
					this.renderToggle(_('VPN kill switch'), 'Cut WAN access if tunnel drops', 'vpn-kill-switch', policy.kill_switch !== 0 && policy.kill_switch !== '0'),
					this.renderToggle(_('Allow LAN bypass'), 'Permit selected subnets to use WAN directly', 'vpn-lan-bypass', policy.lan_bypass === 1 || policy.lan_bypass === '1')
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
		var saveBtn = container.querySelector('[data-action="vpnrelay-save"]');
		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveVpnRelaySettings', container));
	},

	saveVpnRelaySettings: function(container) {
		var payload = {
			vpn_type: (container.querySelector('#vpn-type') || {}).value,
			vpn_provider: (container.querySelector('#vpn-provider') || {}).value,
			wg_interface: (container.querySelector('#vpn-wg-interface') || {}).value,
			openvpn_profile: (container.querySelector('#vpn-ovpn-profile') || {}).value,
			upstream_interface: (container.querySelector('#vpn-upstream') || {}).value,
			policy_routing: helpers.isToggleActive(container.querySelector('#vpn-policy-routing')) ? 1 : 0,
			dns_override: helpers.isToggleActive(container.querySelector('#vpn-dns-override')) ? 1 : 0,
			kill_switch: helpers.isToggleActive(container.querySelector('#vpn-kill-switch')) ? 1 : 0,
			lan_bypass: helpers.isToggleActive(container.querySelector('#vpn-lan-bypass')) ? 1 : 0
		};

		return helpers.persistSettings('vpnrelay', payload);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
