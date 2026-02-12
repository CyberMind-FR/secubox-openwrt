'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return Promise.all([
			api.getEmulators(),
			api.getDevices()
		]);
	},

	render: function(data) {
		var emuResult = data[0] || {};
		var devResult = data[1] || {};
		var devices = devResult.devices || [];

		var cssLink = E('link', {
			rel: 'stylesheet',
			href: L.resource('device-intel/common.css')
		});

		// Filter devices by emulator source
		var usbDevices = devices.filter(function(d) { return d.emulator_source === 'usb'; });
		var mqttDevices = devices.filter(function(d) { return d.emulator_source === 'mqtt'; });
		var zigbeeDevices = devices.filter(function(d) { return d.emulator_source === 'zigbee'; });

		// ── USB Card ──
		var usb = emuResult.usb || {};
		var usbCard = this.emuCard('USB Peripherals', usb.enabled, [
			E('div', { 'style': 'display:flex; gap:2em; margin-bottom:0.75em;' }, [
				E('span', {}, _('System USB devices: ') + E('strong', {}, String(usb.device_count || 0)).textContent),
				E('span', {}, _('Discovered: ') + E('strong', {}, String(usbDevices.length)).textContent)
			]),
			this.deviceMiniTable(usbDevices, ['hostname', 'vendor', 'device_type'])
		]);

		// ── MQTT Card ──
		var mqtt = emuResult.mqtt || {};
		var mqttCard = this.emuCard('MQTT Broker', mqtt.enabled, [
			E('div', { 'style': 'display:flex; gap:2em; margin-bottom:0.75em; flex-wrap:wrap;' }, [
				E('span', {}, _('Broker: ') + (mqtt.broker_host || '127.0.0.1') + ':' + (mqtt.broker_port || 1883)),
				E('span', {}, [
					_('Status: '),
					mqtt.broker_running
						? E('span', { 'style': 'color:#22c55e;' }, _('Running'))
						: E('span', { 'style': 'color:#ef4444;' }, _('Not Found'))
				]),
				E('span', {}, _('Clients discovered: ') + E('strong', {}, String(mqttDevices.length)).textContent)
			]),
			this.deviceMiniTable(mqttDevices, ['hostname', 'vendor', 'device_type'])
		]);

		// ── Zigbee Card ──
		var zigbee = emuResult.zigbee || {};
		var zigbeeCard = this.emuCard('Zigbee Coordinator', zigbee.enabled, [
			E('div', { 'style': 'display:flex; gap:2em; margin-bottom:0.75em; flex-wrap:wrap;' }, [
				E('span', {}, _('Adapter: ') + (zigbee.adapter || 'zigbee2mqtt')),
				E('span', {}, _('Dongle: ') + (zigbee.coordinator || '/dev/ttyUSB0')),
				E('span', {}, [
					_('Dongle: '),
					zigbee.dongle_present
						? E('span', { 'style': 'color:#22c55e;' }, _('Present'))
						: E('span', { 'style': 'color:#ef4444;' }, _('Not Found'))
				]),
				E('span', {}, _('Paired devices: ') + E('strong', {}, String(zigbeeDevices.length)).textContent)
			]),
			this.deviceMiniTable(zigbeeDevices, ['hostname', 'vendor', 'device_type'])
		]);

		var content = E('div', {}, [
			cssLink,
			E('h2', {}, _('Emulator Modules')),
			E('p', { 'style': 'color:#6c757d; margin-bottom:1em;' },
				_('Pluggable device discovery modules for USB, MQTT, and Zigbee peripherals.')),
			usbCard,
			mqttCard,
			zigbeeCard,
			E('div', { 'style': 'text-align:right; margin-top:1em;' },
				E('a', {
					'href': L.url('admin/secubox/device-intel/settings'),
					'class': 'cbi-button cbi-button-neutral'
				}, _('Configure Emulators')))
		]);

		return KissTheme.wrap(content, 'admin/secubox/services/device-intel/emulators');
	},

	emuCard: function(title, enabled, content) {
		return E('div', { 'class': 'di-emu-card' }, [
			E('h4', {}, [
				title,
				E('span', {
					'class': 'status ' + (enabled ? 'enabled' : 'disabled'),
					'style': 'margin-left:0.75em;'
				}, enabled ? _('Enabled') : _('Disabled'))
			])
		].concat(content));
	},

	deviceMiniTable: function(devices, fields) {
		if (devices.length === 0) {
			return E('p', { 'style': 'color:#6c757d; font-style:italic;' },
				_('No devices discovered from this emulator.'));
		}

		var headers = {
			'hostname': _('Name'),
			'vendor': _('Model/Vendor'),
			'device_type': _('Type'),
			'mac': _('ID'),
			'ip': _('IP')
		};

		return E('table', { 'class': 'di-device-table' }, [
			E('thead', {}, E('tr', {},
				fields.map(function(f) {
					return E('th', {}, headers[f] || f);
				})
			)),
			E('tbody', {},
				devices.slice(0, 20).map(function(d) {
					return E('tr', {},
						fields.map(function(f) {
							return E('td', {}, String(d[f] || '-'));
						})
					);
				})
			)
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
