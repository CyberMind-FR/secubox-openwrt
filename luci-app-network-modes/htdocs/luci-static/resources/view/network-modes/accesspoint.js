'use strict';
'require view';
'require dom';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';

return view.extend({
	title: _('Access Point Mode'),
	
	load: function() {
		return api.getApConfig();
	},
	
	render: function(data) {
		var config = data || {};
		var wifiTweaks = config.wifi_tweaks || {};
		
		var view = E('div', { 'class': 'network-modes-dashboard' }, [
			// Header
			E('div', { 'class': 'nm-header' }, [
				E('div', { 'class': 'nm-logo' }, [
					E('div', { 'class': 'nm-logo-icon', 'style': 'background: linear-gradient(135deg, #06b6d4, #0ea5e9)' }, '📶'),
					E('div', { 'class': 'nm-logo-text' }, ['Access ', E('span', { 'style': 'background: linear-gradient(135deg, #06b6d4, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' }, 'Point')])
				])
			]),
			
			// Description
			E('div', { 'class': 'nm-alert nm-alert-info' }, [
				E('span', { 'class': 'nm-alert-icon' }, '📶'),
				E('div', {}, [
					E('div', { 'class': 'nm-alert-title' }, 'WiFi Access Point with Advanced Features'),
					E('div', { 'class': 'nm-alert-text' }, 
						'Transform your device into a high-performance WiFi access point with 802.11r/k/v ' +
						'roaming support, band steering, and optimized settings.')
				])
			]),
			
			// Current WiFi Settings
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '📡'),
						'WiFi Configuration'
					]),
					E('div', { 'class': 'nm-card-badge' }, config.wifi_driver || 'WiFi')
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-wifi-grid' }, [
						E('div', { 'class': 'nm-wifi-setting' }, [
							E('div', { 'class': 'nm-wifi-setting-label' }, 'Channel'),
							E('div', { 'class': 'nm-wifi-setting-value' }, config.wifi_channel || 'Auto')
						]),
						E('div', { 'class': 'nm-wifi-setting' }, [
							E('div', { 'class': 'nm-wifi-setting-label' }, 'HT Mode'),
							E('div', { 'class': 'nm-wifi-setting-value' }, config.wifi_htmode || 'VHT80')
						]),
						E('div', { 'class': 'nm-wifi-setting' }, [
							E('div', { 'class': 'nm-wifi-setting-label' }, 'TX Power'),
							E('div', { 'class': 'nm-wifi-setting-value' }, (config.wifi_txpower || 20) + ' dBm')
						]),
						E('div', { 'class': 'nm-wifi-setting' }, [
							E('div', { 'class': 'nm-wifi-setting-label' }, 'PHY'),
							E('div', { 'class': 'nm-wifi-setting-value' }, config.wifi_phy || 'phy0')
						])
					]),
					
					// Channel selection
					E('div', { 'class': 'nm-form-group', 'style': 'margin-top: 20px' }, [
						E('label', { 'class': 'nm-form-label' }, 'WiFi Channel'),
						E('select', { 'class': 'nm-select', 'id': 'wifi-channel' }, [
							E('option', { 'value': 'auto', 'selected': config.wifi_channel === 'auto' }, 'Auto'),
							E('optgroup', { 'label': '2.4 GHz' },
								(config.available_channels_2g || [1, 6, 11]).map(function(ch) {
									return E('option', { 'value': ch }, 'Channel ' + ch);
								})
							),
							E('optgroup', { 'label': '5 GHz' },
								(config.available_channels_5g || [36, 40, 44, 48, 149, 153, 157, 161]).map(function(ch) {
									return E('option', { 'value': ch }, 'Channel ' + ch);
								})
							)
						])
					]),
					
					// HT Mode selection
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, 'Channel Width (HT Mode)'),
						E('select', { 'class': 'nm-select', 'id': 'wifi-htmode' },
							(config.available_htmodes || ['HT20', 'HT40', 'VHT40', 'VHT80']).map(function(mode) {
								return E('option', { 
									'value': mode,
									'selected': mode === config.wifi_htmode
								}, mode);
							})
						)
					]),
					
					// TX Power slider
					E('div', { 'class': 'nm-slider-container' }, [
						E('div', { 'class': 'nm-slider-header' }, [
							E('span', { 'class': 'nm-slider-label' }, 'Transmit Power'),
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
				])
			]),
			
			// WiFi Tweaks
			E('div', { 'class': 'nm-card' }, [
				E('div', { 'class': 'nm-card-header' }, [
					E('div', { 'class': 'nm-card-title' }, [
						E('span', { 'class': 'nm-card-title-icon' }, '🚀'),
						'Advanced WiFi Features'
					])
				]),
				E('div', { 'class': 'nm-card-body' }, [
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🔄'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, '802.11r Fast BSS Transition'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Fast roaming between access points')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wifiTweaks.roaming_80211r ? ' active' : ''),
							'data-setting': 'roaming_80211r'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '📊'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, '802.11k Radio Resource Management'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Neighbor reports for better roaming decisions')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wifiTweaks.rrm_80211k ? ' active' : ''),
							'data-setting': 'rrm_80211k'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '📡'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, '802.11v BSS Transition Management'),
								E('div', { 'class': 'nm-toggle-desc' }, 'AP-assisted client steering')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wifiTweaks.wnm_80211v ? ' active' : ''),
							'data-setting': 'wnm_80211v'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '📶'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Band Steering'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Prefer 5GHz for capable clients')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wifiTweaks.band_steering ? ' active' : ''),
							'data-setting': 'band_steering'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '⚖️'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Airtime Fairness'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Equal airtime for all clients')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wifiTweaks.airtime_fairness ? ' active' : ''),
							'data-setting': 'airtime_fairness'
						})
					]),
					
					E('div', { 'class': 'nm-toggle' }, [
						E('div', { 'class': 'nm-toggle-info' }, [
							E('span', { 'class': 'nm-toggle-icon' }, '🎯'),
							E('div', {}, [
								E('div', { 'class': 'nm-toggle-label' }, 'Beamforming'),
								E('div', { 'class': 'nm-toggle-desc' }, 'Focus signal towards clients')
							])
						]),
						E('div', { 
							'class': 'nm-toggle-switch' + (wifiTweaks.beamforming !== false ? ' active' : ''),
							'data-setting': 'beamforming'
						})
					])
				])
			]),
			
			// Actions
			E('div', { 'class': 'nm-btn-group' }, [
				E('button', { 'class': 'nm-btn nm-btn-primary', 'data-action': 'ap-save', 'type': 'button' }, [
					E('span', {}, '💾'),
					'Save Settings'
				]),
				E('button', { 'class': 'nm-btn', 'data-action': 'ap-config', 'type': 'button' }, [
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
		
		this.bindAccessPointActions(view);
		
		return view;
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
