'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';
'require secubox-theme/theme as Theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

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
	title: _('DMZ Mode'),

	load: function() {
		return Promise.all([
			api.getDmzConfig(),
			api.getStatus()
		]);
	},

	render: function(payload) {
		var config = (payload && payload[0]) || {};
		var status = (payload && payload[1]) || {};
		var wan = config.wan || {};
		var lan = config.lan || {};
		var dmz = config.dmz || {};

		var hero = helpers.createHero({
			icon: '🛡️',
			title: _('Router + DMZ Mode'),
			subtitle: _('Create an isolated DMZ network that only reaches the WAN while keeping your LAN protected. Perfect for exposing servers without risking the internal network.'),
			gradient: 'linear-gradient(135deg,#1e293b,#0ea5e9)',
			meta: [
				{ label: _('WAN Interface'), value: wan.interface || 'eth1' },
				{ label: _('LAN Gateway'), value: lan.ip_address || '192.168.1.1' },
				{ label: _('DMZ Gateway'), value: dmz.ip_address || '192.168.50.1' }
			],
			actions: [
				E('button', { 'class': 'nm-btn nm-btn-primary', 'type': 'button', 'data-action': 'dmz-save' }, ['💾 ', _('Save Template')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'dmz-apply' }, ['🚀 ', _('Apply DMZ Mode')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'dmz-preview' }, ['📝 ', _('Preview Config')])
			]
		});

		var wanSection = helpers.createSection({
			title: _('WAN Settings'),
			icon: '🌍',
			badge: (wan.interface || 'eth1').toUpperCase(),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WAN Interface')),
						E('input', { 'class': 'nm-input', 'id': 'dmz-wan-if', 'value': wan.interface || 'eth1' })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WAN Protocol')),
						E('select', { 'class': 'nm-select', 'id': 'dmz-wan-proto' },
							(wan.protocols || ['dhcp', 'static', 'pppoe']).map(function(proto) {
								return E('option', {
									'value': proto,
									'selected': (proto === wan.protocol)
								}, proto.toUpperCase());
							})
						)
					])
				])
			]
		});

		var lanSection = helpers.createSection({
			title: _('LAN Network'),
			icon: '🏠',
			badge: lan.interface || 'br-lan',
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN Interface')),
						E('input', { 'class': 'nm-input', 'id': 'dmz-lan-if', 'value': lan.interface || 'br-lan' })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN IP Address')),
						E('input', { 'class': 'nm-input', 'id': 'dmz-lan-ip', 'value': lan.ip_address || '192.168.1.1' })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Netmask')),
						E('input', { 'class': 'nm-input', 'id': 'dmz-lan-mask', 'value': lan.netmask || '255.255.255.0' })
					])
				])
			]
		});

		var dmzSection = helpers.createSection({
			title: _('DMZ Segment'),
			icon: '🧱',
			badge: dmz.interface || 'eth2',
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('DMZ Interface')),
						E('input', { 'class': 'nm-input', 'id': 'dmz-if', 'value': dmz.interface || 'eth2' })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('DMZ IP Address')),
						E('input', { 'class': 'nm-input', 'id': 'dmz-ip', 'value': dmz.ip_address || '192.168.50.1' })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Netmask')),
						E('input', { 'class': 'nm-input', 'id': 'dmz-mask', 'value': dmz.netmask || '255.255.255.0' })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('DHCP Start')),
						E('input', { 'class': 'nm-input', 'type': 'number', 'id': 'dmz-dhcp-start', 'value': dmz.dhcp_start || 50 })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('DHCP Pool Size')),
						E('input', { 'class': 'nm-input', 'type': 'number', 'id': 'dmz-dhcp-limit', 'value': dmz.dhcp_limit || 80 })
					])
				]),
				E('div', { 'style': 'margin-top:12px;' }, [
					buildToggle('dmz-isolated-toggle', '🚧', _('Isolate DMZ from LAN'), _('Block DMZ clients from reaching the LAN'), dmz.isolated !== false)
				]),
				E('p', { 'class': 'nm-alert nm-alert-info', 'style': 'margin-top:12px;' }, _('DMZ clients will reach the WAN by default. Toggle isolation to prevent DMZ → LAN access.'))
			]
		});

		var container = E('div', { 'class': 'nm-container' }, [
			helpers.createNavigationTabs('dmz'),
			hero,
			wanSection,
			lanSection,
			dmzSection
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindActions(container);
		return container;
	},

	bindActions: function(container) {
		var saveBtn = container.querySelector('[data-action="dmz-save"]');
		var applyBtn = container.querySelector('[data-action="dmz-apply"]');
		var previewBtn = container.querySelector('[data-action="dmz-preview"]');

		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveSettings', container));
		if (applyBtn)
			applyBtn.addEventListener('click', ui.createHandlerFn(this, 'applyMode'));
		if (previewBtn)
			previewBtn.addEventListener('click', ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'dmz'));
	},

	saveSettings: function(container) {
		var payload = {
			wan_interface: (container.querySelector('#dmz-wan-if') || {}).value || 'eth1',
			wan_protocol: (container.querySelector('#dmz-wan-proto') || {}).value || 'dhcp',
			lan_interface: (container.querySelector('#dmz-lan-if') || {}).value || 'br-lan',
			lan_ip: (container.querySelector('#dmz-lan-ip') || {}).value || '192.168.1.1',
			lan_netmask: (container.querySelector('#dmz-lan-mask') || {}).value || '255.255.255.0',
			dmz_interface: (container.querySelector('#dmz-if') || {}).value || 'eth2',
			dmz_ip: (container.querySelector('#dmz-ip') || {}).value || '192.168.50.1',
			dmz_netmask: (container.querySelector('#dmz-mask') || {}).value || '255.255.255.0',
			dmz_dhcp_start: (container.querySelector('#dmz-dhcp-start') || {}).value || '50',
			dmz_dhcp_limit: (container.querySelector('#dmz-dhcp-limit') || {}).value || '80',
			dmz_isolated: helpers.isToggleActive(container.querySelector('#dmz-isolated-toggle')) ? 1 : 0
		};

		return helpers.persistSettings('dmz', payload);
	},

	applyMode: function() {
		ui.showModal(_('Applying DMZ mode'), [
			E('p', { 'class': 'spinning' }, _('Backing up current config and switching to DMZ mode...'))
		]);

		return api.applyMode('dmz').then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('DMZ mode applied. Confirm within rollback window.')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Unable to apply DMZ mode')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	}
});
