'use strict';
'require view';
'require dom';
'require ui';
'require network-modes/api as api';
'require network-modes/helpers as helpers';
'require secubox/help as Help';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var nmLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: nmLang });

return view.extend({
	title: _('Travel Router Mode'),

	load: function() {
		return api.getTravelConfig();
	},

	render: function(data) {
		var config = data || {};
		var client = config.client || {};
		var hotspot = config.hotspot || {};
		var lan = config.lan || {};
		var interfaces = config.available_interfaces || ['wlan0', 'wlan1'];
		var radios = config.available_radios || ['radio0', 'radio1'];

		var hero = helpers.createHero({
			icon: '✈️',
			title: _('Travel Router'),
			subtitle: _('Clone the hotel uplink, stay behind your own encrypted hotspot, and keep a clean sandboxed LAN for all devices.'),
			gradient: 'linear-gradient(135deg,#fbbf24,#f97316)',
			actions: [
				Help.createHelpButton('network-modes', 'header', { icon: '📘', label: _('Travel guide'), modal: true }),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'travel-scan' }, ['🔍 ', _('Scan Uplink')]),
				E('button', { 'class': 'nm-btn nm-btn-primary', 'type': 'button', 'data-action': 'travel-save' }, ['💾 ', _('Save Settings')]),
				E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'travel-preview' }, ['📝 ', _('Preview Config')])
			]
		});

		var stats = E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;' }, [
			helpers.createStatBadge({ label: _('Client SSID'), value: client.ssid || _('Not set') }),
			helpers.createStatBadge({ label: _('Hotspot SSID'), value: hotspot.ssid || 'SecuBox-Travel' }),
			helpers.createStatBadge({ label: _('LAN Gateway'), value: lan.subnet || '10.77.0.1' }),
			helpers.createStatBadge({ label: _('MAC Clone'), value: client.clone_mac ? _('Active') : _('Off') })
		]);

		var uplinkSection = helpers.createSection({
			title: _('Client WiFi Uplink'),
			icon: '📡',
			badge: client.ssid ? _('Connected') : _('Pending'),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					this.renderSelectField(_('Client interface'), 'travel-client-iface', interfaces, client.interface || 'wlan1'),
					this.renderSelectField(_('Client radio'), 'travel-client-radio', radios, client.radio || 'radio1'),
					this.renderSelectField(_('Encryption'), 'travel-encryption', ['sae-mixed', 'sae', 'psk2', 'psk-mixed', 'none'], client.encryption || 'sae-mixed')
				]),
				E('div', { 'class': 'nm-form-group' }, [
					E('label', { 'class': 'nm-form-label' }, _('SSID / BSSID')),
					E('input', { 'class': 'nm-input', 'id': 'travel-client-ssid', 'value': client.ssid || '', 'placeholder': _('Hotel WiFi name') }),
					E('div', { 'class': 'nm-form-hint' }, _('Pick from scan results or enter manually'))
				]),
				E('div', { 'class': 'nm-form-group' }, [
					E('label', { 'class': 'nm-form-label' }, _('Password / Captive token')),
					E('input', { 'class': 'nm-input', 'type': 'password', 'id': 'travel-client-password', 'value': client.password || '' }),
					E('div', { 'class': 'nm-form-hint' }, _('Leave empty if using captive portal login'))
				]),
				E('div', { 'class': 'nm-form-group' }, [
					E('label', { 'class': 'nm-form-label' }, _('WAN MAC clone')),
					E('input', { 'class': 'nm-input', 'id': 'travel-mac-clone', 'value': client.clone_mac || '', 'placeholder': 'AA:BB:CC:DD:EE:FF' }),
					E('div', { 'class': 'nm-form-hint' }, _('Copy laptop/room-authorized MAC to bypass hotel locks'))
				]),
				E('div', { 'class': 'nm-btn-group' }, [
					E('button', { 'class': 'nm-btn', 'type': 'button', 'data-action': 'travel-scan' }, ['🔍 ', _('Scan networks')]),
					E('span', { 'id': 'travel-scan-status', 'class': 'nm-text-muted' }, _('Last scan: never'))
				]),
				E('div', { 'class': 'nm-scan-results', 'id': 'travel-scan-results' }, [
					E('div', { 'class': 'nm-empty' }, _('No scan results yet'))
				])
			]
		});

		var hotspotSection = helpers.createSection({
			title: _('Personal Hotspot'),
			icon: '🔥',
			badge: _('WPA3/WPA2'),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					this.renderSelectField(_('Hotspot radio'), 'travel-hotspot-radio', radios, hotspot.radio || 'radio0')
				]),
				E('div', { 'class': 'nm-form-group' }, [
					E('label', { 'class': 'nm-form-label' }, _('Hotspot SSID')),
					E('input', { 'class': 'nm-input', 'id': 'travel-hotspot-ssid', 'value': hotspot.ssid || 'SecuBox-Travel' })
				]),
				E('div', { 'class': 'nm-form-group' }, [
					E('label', { 'class': 'nm-form-label' }, _('Hotspot password')),
					E('input', { 'class': 'nm-input', 'id': 'travel-hotspot-password', 'value': hotspot.password || 'TravelSafe123!' })
				]),
				helpers.createList([
					{ title: _('Private WPA3 bubble'), description: _('Keep laptops/phones on isolated SSID'), suffix: E('span', { 'class': 'nm-badge' }, _('Secure')) },
					{ title: _('Dual-band'), description: _('Broadcast both 2.4/5 GHz when hardware supports it'), suffix: E('span', { 'class': 'nm-badge' }, _('Auto')) }
				])
			]
		});

		var lanSection = helpers.createSection({
			title: _('LAN & DHCP Sandbox'),
			icon: '🛡️',
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN Gateway IP')),
						E('input', { 'class': 'nm-input', 'id': 'travel-lan-ip', 'value': lan.subnet || '10.77.0.1' })
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('LAN Netmask')),
						E('input', { 'class': 'nm-input', 'id': 'travel-lan-mask', 'value': lan.netmask || '255.255.255.0' })
					])
				]),
				E('div', { 'class': 'nm-form-hint' }, _('Each trip receives an isolated /24 network with firewall & DNS-hardening.'))
			]
		});

		var container = E('div', { 'class': 'network-modes-dashboard travel-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createNavigationTabs('travel'),
			hero,
			stats,
			uplinkSection,
			hotspotSection,
			lanSection
		]);

		this.bindTravelActions(container);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	renderSelectField: function(label, id, options, selected) {
		return E('div', { 'class': 'nm-form-group' }, [
			E('label', { 'class': 'nm-form-label' }, label),
			E('select', { 'class': 'nm-select', 'id': id },
				options.map(function(opt) {
					return E('option', { 'value': opt, 'selected': opt === selected }, opt);
				})
			)
		]);
	},

	bindTravelActions: function(container) {
		var scanButtons = container.querySelectorAll('[data-action="travel-scan"]');
		Array.prototype.forEach.call(scanButtons, function(btn) {
			btn.addEventListener('click', ui.createHandlerFn(this, 'scanNetworks', container));
		}, this);

		var saveBtn = container.querySelector('[data-action="travel-save"]');
		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveTravelSettings', container));

		var previewBtn = container.querySelector('[data-action="travel-preview"]');
		if (previewBtn)
			previewBtn.addEventListener('click', ui.createHandlerFn(helpers, helpers.showGeneratedConfig, 'travel'));
	},

	scanNetworks: function(container) {
		var statusEl = container.querySelector('#travel-scan-status');
		if (statusEl)
			statusEl.textContent = _('Scanning...');

		return api.scanTravelNetworks().then(L.bind(function(result) {
			if (statusEl)
				statusEl.textContent = _('Last scan: ') + new Date().toLocaleTimeString();
			this.populateScanResults(container, (result && result.networks) || []);
		}, this)).catch(function(err) {
			if (statusEl)
				statusEl.textContent = _('Scan failed');
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	populateScanResults: function(container, networks) {
		var list = container.querySelector('#travel-scan-results');
		if (!list)
			return;

		list.innerHTML = '';

		if (!networks.length) {
			list.appendChild(E('div', { 'class': 'nm-empty' }, _('No networks detected')));
			return;
		}

		networks.slice(0, 8).forEach(L.bind(function(net) {
			var card = E('button', {
				'class': 'nm-scan-card',
				'type': 'button'
			}, [
				E('div', { 'class': 'nm-scan-ssid' }, net.ssid || _('Hidden SSID')),
				E('div', { 'class': 'nm-scan-meta' }, [
					E('span', {}, net.channel ? _('Ch. ') + net.channel : ''),
					E('span', {}, net.signal || ''),
					E('span', {}, net.encryption || '')
				])
			]);

			card.addEventListener('click', ui.createHandlerFn(this, 'selectScannedNetwork', container, net));
			list.appendChild(card);
		}, this));
	},

	selectScannedNetwork: function(container, network) {
		var ssidInput = container.querySelector('#travel-client-ssid');
		if (ssidInput)
			ssidInput.value = network.ssid || '';

		if (network.encryption) {
			var encSelect = container.querySelector('#travel-encryption');
			if (encSelect && Array.prototype.some.call(encSelect.options, function(opt) { return opt.value === network.encryption; }))
				encSelect.value = network.encryption;
		}
	},

	saveTravelSettings: function(container) {
		var payload = {
			client_interface: container.querySelector('#travel-client-iface') ? container.querySelector('#travel-client-iface').value : '',
			client_radio: container.querySelector('#travel-client-radio') ? container.querySelector('#travel-client-radio').value : '',
			hotspot_radio: container.querySelector('#travel-hotspot-radio') ? container.querySelector('#travel-hotspot-radio').value : '',
			ssid: container.querySelector('#travel-client-ssid') ? container.querySelector('#travel-client-ssid').value : '',
			password: container.querySelector('#travel-client-password') ? container.querySelector('#travel-client-password').value : '',
			encryption: container.querySelector('#travel-encryption') ? container.querySelector('#travel-encryption').value : 'sae-mixed',
			hotspot_ssid: container.querySelector('#travel-hotspot-ssid') ? container.querySelector('#travel-hotspot-ssid').value : '',
			hotspot_password: container.querySelector('#travel-hotspot-password') ? container.querySelector('#travel-hotspot-password').value : '',
			clone_mac: container.querySelector('#travel-mac-clone') ? container.querySelector('#travel-mac-clone').value : '',
			lan_subnet: container.querySelector('#travel-lan-ip') ? container.querySelector('#travel-lan-ip').value : '',
			lan_netmask: container.querySelector('#travel-lan-mask') ? container.querySelector('#travel-lan-mask').value : ''
		};

		return helpers.persistSettings('travel', payload);
	}
});
