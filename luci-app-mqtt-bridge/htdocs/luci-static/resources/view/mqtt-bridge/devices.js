'use strict';
'require view';
'require ui';
'require mqtt-bridge/api as API';
'require secubox-theme/theme as Theme';
'require mqtt-bridge/nav as Nav';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return Promise.all([
			API.listDevices(),
			API.getStatus()
		]);
	},

	render: function(payload) {
		var devices = (payload[0] && payload[0].devices) || [];
		var status = payload[1] || {};
		return E('div', { 'class': 'mqtt-bridge-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mqtt-bridge/common.css') }),
			Nav.renderTabs('devices'),
			this.renderStats(status),
			this.renderProfiles(status.profiles || []),
			E('div', { 'class': 'mb-card' }, [
				E('div', { 'class': 'mb-card-header' }, [
					E('div', { 'class': 'mb-card-title' }, [E('span', {}, '🔌'), _('USB & Sensors')]),
					E('button', {
						'class': 'mb-btn mb-btn-primary',
						'click': ui.createHandlerFn(this, 'startPairing')
					}, ['➕ ', _('Pair new device')])
				]),
				devices.length ? devices.map(this.renderDeviceRow.bind(this)) :
					E('p', { 'style': 'color:var(--mb-muted);' }, _('No devices detected yet. Plug a USB bridge or trigger pairing.'))
			])
		]);
	},

	renderProfiles: function(profiles) {
		var items = profiles || [];
		var cards = items.length ? items.map(this.renderProfile.bind(this)) :
			[E('p', { 'style': 'color:var(--mb-muted);' },
				_('No presets detected yet. Connect a Zigbee adapter or review the documentation below.'))];

		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '🛰️'), _('Zigbee & serial presets')])
			]),
			E('div', { 'class': 'mb-profile-grid' }, cards),
			E('div', { 'class': 'mb-profile-hint' }, [
				E('strong', {}, _('dmesg/logcat hints:')),
				E('pre', {}, '[ 6456.735692] usb 3-1.1: USB disconnect, device number 3\n' +
					'[ 6459.021458] usb 3-1.1: new full-speed USB device number 4 using xhci-hcd'),
				E('p', {}, _('Match the Bus/Device numbers to /dev/tty* and update the MQTT bridge config if needed.'))
			])
		]);
	},

	renderProfile: function(profile) {
		var detected = profile.detected;
		var meta = [
			(profile.vendor && profile.product) ? _('VID:PID ') + profile.vendor + ':' + profile.product : null,
			profile.bus ? _('Bus ') + profile.bus : null,
			profile.device ? _('Device ') + profile.device : null,
			profile.port ? _('Port ') + profile.port : null
		].filter(Boolean);

		return E('div', { 'class': 'mb-profile-card' }, [
			E('div', { 'class': 'mb-profile-header' }, [
				E('div', {}, [
					E('strong', {}, profile.label || _('USB profile')),
					E('div', { 'class': 'mb-profile-meta' }, meta.map(function(entry) {
						return E('span', {}, entry);
					}))
				]),
				E('span', {
					'class': 'mb-profile-status' + (detected ? ' online' : '')
				}, detected ? _('Detected') : _('Waiting'))
			]),
			profile.notes ? E('p', { 'class': 'mb-profile-notes' }, profile.notes) : null
		]);
	},

	renderStats: function(status) {
		var stats = status.device_stats || {};
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '📊'), _('Device stats')])
			]),
			E('div', { 'class': 'mb-grid' }, [
				this.stat(_('Paired devices'), stats.total || 0),
				this.stat(_('Online'), stats.online || 0),
				this.stat(_('USB adapters'), stats.usb || 0)
			])
		]);
	},

	stat: function(label, value) {
		return E('div', { 'class': 'mb-stat' }, [
			E('span', { 'class': 'mb-stat-label' }, label),
			E('div', { 'class': 'mb-stat-value' }, value)
		]);
	},

	renderDeviceRow: function(device) {
		return E('div', { 'class': 'mb-device-row' }, [
			E('div', { 'class': 'mb-device-info' }, [
				E('strong', {}, device.name || device.serial || _('Unknown device')),
				E('span', { 'style': 'color:var(--mb-muted);font-size:12px;' },
					(device.protocol || 'USB') + ' • ' + (device.port || 'N/A'))
			]),
			E('div', { 'style': 'display:flex;gap:8px;' }, [
				E('span', {
					'style': 'font-size:12px;text-transform:uppercase;color:' +
						(device.online ? '#22c55e' : '#f97316')
				}, device.online ? _('Online') : _('Paired / offline'))
			])
		]);
	},

	startPairing: function() {
		ui.showModal(_('Pairing'), [
			E('p', {}, _('Listening for device join requests…')),
			E('div', { 'class': 'spinning' })
		]);
		return API.triggerPairing().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Pairing window opened for 2 minutes.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Unable to start pairing')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	}
});
