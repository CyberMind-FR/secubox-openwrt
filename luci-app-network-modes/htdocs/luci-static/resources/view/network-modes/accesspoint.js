'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';
'require secubox-theme/theme as Theme';

Theme.init({ theme: 'dark', language: 'en' });

function buildWifiToggle(flag, label, desc, active) {
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
			'data-setting': flag
		})
	]);
}

return view.extend({
	title: _('Access Point Mode'),

	load: function() {
		return api.getApConfig();
	},

	render: function(data) {
		var config = data || {};
		var wifiTweaks = config.wifi_tweaks || {};

		var hero = helpers.createHero({
			icon: '📡',
			title: _('Access Point Mode'),
			subtitle: _('Dedicated WiFi uplink bridge with roaming optimizations, band steering, and 802.11r/k/v enhancements.'),
			gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
			actions: [
				E('button', { 'class': 'nm-btn nm-btn-primary', 'type': 'button', 'data-action': 'ap-save' }, ['💾 ', _('Save & Apply')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'ap-config' }, ['📝 ', _('Preview Config')])
			]
		});

		var stats = E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;' }, [
			helpers.createStatBadge({ label: _('Channel'), value: config.wifi_channel || 'AUTO' }),
			helpers.createStatBadge({ label: _('Width'), value: config.wifi_htmode || 'VHT80' }),
			helpers.createStatBadge({ label: _('TX Power'), value: (config.wifi_txpower || 20) + ' dBm' }),
			helpers.createStatBadge({ label: _('PHY'), value: (config.wifi_phy || 'phy0').toUpperCase() })
		]);

		var radioSection = helpers.createSection({
			title: _('Radio Parameters'),
			icon: '📶',
			badge: (config.wifi_driver || 'mac80211').toUpperCase(),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('WiFi Channel')),
						E('select', { 'class': 'nm-select', 'id': 'wifi-channel' }, [
							E('option', { 'value': 'auto', 'selected': config.wifi_channel === 'auto' }, _('Auto')),
							E('optgroup', { 'label': _('2.4 GHz') },
								(config.available_channels_2g || [1, 6, 11]).map(function(ch) {
									return E('option', { 'value': ch, 'selected': Number(ch) === Number(config.wifi_channel) }, _('Channel ') + ch);
								})
							),
							E('optgroup', { 'label': _('5 GHz') },
								(config.available_channels_5g || [36, 40, 44, 48]).map(function(ch) {
									return E('option', { 'value': ch, 'selected': Number(ch) === Number(config.wifi_channel) }, _('Channel ') + ch);
								})
							)
						])
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Channel Width (HT mode)')),
						E('select', { 'class': 'nm-select', 'id': 'wifi-htmode' },
							(config.available_htmodes || ['HT20', 'HT40', 'VHT40', 'VHT80']).map(function(mode) {
								return E('option', { 'value': mode, 'selected': mode === config.wifi_htmode }, mode);
							})
						)
					])
				]),
				E('div', { 'class': 'nm-slider-container' }, [
					E('div', { 'class': 'nm-slider-header' }, [
						E('span', { 'class': 'nm-slider-label' }, _('Transmit Power')),
						E('span', { 'class': 'nm-slider-value', 'id': 'txpower-value' }, (config.wifi_txpower || 20) + ' dBm')
					]),
					E('input', {
						'type': 'range',
						'class': 'nm-slider',
						'id': 'wifi-txpower',
						'min': '1',
						'max': '30',
						'value': config.wifi_txpower || 20
					})
				])
			]
		});

		var optimSection = helpers.createSection({
			title: _('Roaming & Optimizations'),
			icon: '🚀',
			body: [
				buildWifiToggle('roaming_80211r', _('802.11r Fast BSS Transition'), _('Seamless roaming between APs'), wifiTweaks.roaming_80211r),
				buildWifiToggle('rrm_80211k', _('802.11k Radio Resource'), _('Neighbor reports for smart handovers'), wifiTweaks.rrm_80211k),
				buildWifiToggle('wnm_80211v', _('802.11v BSS Transition'), _('AP-assisted steering & WNM sleep'), wifiTweaks.wnm_80211v),
				buildWifiToggle('band_steering', _('Band Steering'), _('Prefer 5 GHz when possible'), wifiTweaks.band_steering),
				buildWifiToggle('airtime_fairness', _('Airtime Fairness'), _('Equal airtime for all clients'), wifiTweaks.airtime_fairness),
				buildWifiToggle('beamforming', _('Beamforming'), _('Directional signal shaping'), wifiTweaks.beamforming !== false)
			]
		});

		var bridgeSection = helpers.createSection({
			title: _('Bridging & Uplink'),
			icon: '🌉',
			body: [
				helpers.createList([
					{ title: _('Bridge LAN to upstream'), description: _('LAN + uplink ports merged in br-lan'), suffix: E('span', { 'class': 'nm-badge' }, 'L2 Bridge') },
					{ title: _('Disable NAT & DHCP'), description: _('Delegated gateway handles routing & IP leases'), suffix: E('span', { 'class': 'nm-badge' }, 'Policy') },
					{ title: _('Multicast optimizations'), description: _('IGMP/MLD snooping for IPTV/AP isolation'), suffix: E('span', { 'class': 'nm-badge' }, 'Optimized') }
				])
			]
		});

		var container = E('div', { 'class': 'network-modes-dashboard accesspoint-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			hero,
			stats,
			radioSection,
			optimSection,
			bridgeSection
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindAccessPointActions(container);
		return container;
	},

	bindAccessPointActions: function(container) {
		var slider = container.querySelector('#wifi-txpower');
		var valueDisplay = container.querySelector('#txpower-value');
		if (slider && valueDisplay) {
			slider.addEventListener('input', function() {
				valueDisplay.textContent = this.value + ' dBm';
			});
		}

		var saveBtn = container.querySelector('[data-action="ap-save"]');
		var configBtn = container.querySelector('[data-action="ap-config"]');

		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveAccessPointSettings', container));
		if (configBtn)
			configBtn.addEventListener('click', ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'accesspoint'));
	},

	saveAccessPointSettings: function(container) {
		var toggles = {};
		container.querySelectorAll('.nm-toggle-switch[data-setting]').forEach(function(toggle) {
			var key = toggle.getAttribute('data-setting');
			toggles[key] = helpers.isToggleActive(toggle);
		});

		var payload = {
			wifi_channel: container.querySelector('#wifi-channel') ? container.querySelector('#wifi-channel').value : 'auto',
			wifi_htmode: container.querySelector('#wifi-htmode') ? container.querySelector('#wifi-htmode').value : 'VHT80',
			wifi_txpower: container.querySelector('#wifi-txpower') ? parseInt(container.querySelector('#wifi-txpower').value, 10) : 20,
			roaming_enabled: toggles.roaming_80211r ? 1 : 0,
			band_steering: toggles.band_steering ? 1 : 0,
			rrm_enabled: toggles.rrm_80211k ? 1 : 0,
			wnm_enabled: toggles.wnm_80211v ? 1 : 0,
			airtime_fairness: toggles.airtime_fairness ? 1 : 0,
			beamforming: toggles.beamforming ? 1 : 0
		};

		return helpers.persistSettings('accesspoint', payload);
	}
});
