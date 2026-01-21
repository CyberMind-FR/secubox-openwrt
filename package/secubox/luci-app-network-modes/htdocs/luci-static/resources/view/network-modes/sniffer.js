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

function buildToggle(id, icon, title, desc, active) {
	return E('div', { 'class': 'nm-toggle' }, [
		E('div', { 'class': 'nm-toggle-info' }, [
			E('span', { 'class': 'nm-toggle-icon' }, icon),
			E('div', {}, [
				E('div', { 'class': 'nm-toggle-label' }, title),
				E('div', { 'class': 'nm-toggle-desc' }, desc)
			])
		]),
		E('div', {
			'class': 'nm-toggle-switch' + (active ? ' active' : ''),
			'id': id
		})
	]);
}

return view.extend({
	title: _('Sniffer Mode'),

	load: function() {
		return api.getSnifferConfig();
	},

	render: function(data) {
		var config = data || {};

		var hero = helpers.createHero({
			icon: '🔍',
			title: _('Sniffer / TAP Mode'),
			subtitle: _('Transparent monitoring bridge feeding Netifyd + pcaps. Ideal for SOC taps, troubleshooting, or security labs.'),
			gradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
			actions: [
				E('button', { 'class': 'nm-btn nm-btn-primary', 'type': 'button', 'data-action': 'sniffer-save' }, ['💾 ', _('Save Settings')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'sniffer-config' }, ['📝 ', _('Preview Config')])
			]
		});

		var stats = E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;' }, [
			helpers.createStatBadge({ label: _('Bridge'), value: (config.bridge_interface || 'br-snoop').toUpperCase() }),
			helpers.createStatBadge({ label: _('Netifyd'), value: config.netifyd_running ? _('Running') : _('Stopped') }),
			helpers.createStatBadge({ label: _('Promiscuous'), value: config.promiscuous ? _('Enabled') : _('Disabled') })
		]);

		var bridgeSection = helpers.createSection({
			title: _('Bridge Configuration'),
			icon: '🌉',
			body: [
				E('div', { 'class': 'nm-form-group' }, [
					E('label', { 'class': 'nm-form-label' }, _('Monitor Interface')),
					E('select', { 'class': 'nm-select', 'id': 'bridge-interface' },
						(config.available_interfaces || ['eth0', 'eth1']).map(function(iface) {
							return E('option', { 'value': iface, 'selected': iface === config.bridge_interface }, iface);
						})
					),
					E('div', { 'class': 'nm-form-hint' }, _('Use mirror/SPAN or inline tap'))
				]),
				buildToggle('toggle-promisc', '📡', _('Promiscuous Mode'), _('Capture all frames, not only bridged ones'), config.promiscuous)
			]
		});

		var netifySection = helpers.createSection({
			title: _('Netifyd & PCAP'),
			icon: '📊',
			badge: config.netifyd_running ? _('Running') : _('Stopped'),
			body: [
				buildToggle('toggle-netifyd', '🔬', _('Netifyd DPI'), _('Enable Deep Packet Inspection export'), config.netifyd_enabled),
				helpers.createList([
					{ title: _('pcap capture'), description: _('Optional tcpdump writes to /var/captures'), suffix: E('span', { 'class': 'nm-badge' }, _('pcap')) },
					{ title: _('Rotation & retention'), description: _('Configure rotation with network-modes settings tab'), suffix: E('span', { 'class': 'nm-badge' }, _('Storage')) }
				]),
				config.netifyd_running ?
					E('p', { 'style': 'margin-top:12px;color:#a5b4fc;' }, _('Netifyd analytics available in the Netifyd Dashboard.')) :
					E('p', { 'style': 'margin-top:12px;color:#94a3b8;' }, _('Start Netifyd to feed DPI data.'))
			]
		});

		var previewSection = helpers.createSection({
			title: _('Configuration Preview'),
			icon: '📝',
			body: [
				E('pre', { 'class': 'nm-config-preview' }, config.config_preview || '# No configuration preview available')
			]
		});

		var container = E('div', { 'class': 'network-modes-dashboard sniffer-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createNavigationTabs('sniffer'),
			hero,
			stats,
			bridgeSection,
			netifySection,
			previewSection
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindSnifferActions(container);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
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
