'use strict';
'require view';
'require dom';
'require ui';
'require rpc';

var callGetEmulators = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_emulators',
	expect: {}
});

var callGetDevices = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_devices',
	expect: {}
});

function createCard(title, icon, enabled, content, borderColor) {
	return E('div', {
		'style': 'background:#12121a;border-radius:8px;padding:16px;margin-bottom:16px;' +
		         'border-left:4px solid ' + (borderColor || '#2a2a3a') + ';'
	}, [
		E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;' }, [
			E('div', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
				E('span', { 'style': 'font-size:1.2rem;' }, icon),
				E('span', { 'style': 'font-size:1rem;font-weight:600;color:#fff;' }, title)
			]),
			E('span', {
				'style': 'padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;' +
				         (enabled ? 'background:rgba(0,212,170,0.2);color:#00d4aa;' : 'background:rgba(128,128,144,0.2);color:#808090;')
			}, enabled ? 'Enabled' : 'Disabled')
		]),
		E('div', {}, content)
	]);
}

function createMetric(label, value, color) {
	return E('span', { 'style': 'margin-right:20px;' }, [
		E('span', { 'style': 'color:#808090;' }, label + ': '),
		E('strong', { 'style': 'color:' + (color || '#00d4aa') + ';' }, String(value))
	]);
}

function statusDot(running, label) {
	var color = running ? '#00d4aa' : '#ff4d4d';
	return E('span', { 'style': 'display:inline-flex;align-items:center;gap:4px;' }, [
		E('span', {
			'style': 'width:8px;height:8px;border-radius:50%;background:' + color + ';'
		}),
		E('span', { 'style': 'color:' + color + ';' }, label)
	]);
}

function deviceTable(devices, fields) {
	if (devices.length === 0) {
		return E('p', { 'style': 'color:#808090;font-style:italic;text-align:center;padding:16px;margin:0;' },
			'No devices discovered from this emulator.');
	}

	var headers = {
		'hostname': 'Name',
		'vendor': 'Model/Vendor',
		'device_type': 'Type',
		'mac': 'ID',
		'ip': 'IP'
	};

	return E('div', { 'style': 'overflow-x:auto;' }, [
		E('table', { 'style': 'width:100%;border-collapse:collapse;font-size:0.85rem;' }, [
			E('thead', {}, [
				E('tr', { 'style': 'border-bottom:1px solid #2a2a3a;' },
					fields.map(function(f) {
						return E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, headers[f] || f);
					})
				)
			]),
			E('tbody', {},
				devices.slice(0, 20).map(function(d) {
					return E('tr', { 'style': 'border-bottom:1px solid #1a1a24;' },
						fields.map(function(f) {
							var val = d[f] || '-';
							var style = 'padding:8px;color:#e0e0e0;';
							if (f === 'hostname') style = 'padding:8px;color:#00a0ff;font-weight:500;';
							if (f === 'device_type') style = 'padding:8px;color:#00d4aa;';
							return E('td', { 'style': style }, String(val));
						})
					);
				})
			)
		])
	]);
}

return view.extend({
	load: function() {
		return Promise.all([
			callGetEmulators().catch(function() { return {}; }),
			callGetDevices().catch(function() { return { devices: [] }; })
		]);
	},

	render: function(data) {
		var emuResult = data[0] || {};
		var devResult = data[1] || {};
		var devices = devResult.devices || [];

		var usbDevices = devices.filter(function(d) { return d.emulator_source === 'usb'; });
		var mqttDevices = devices.filter(function(d) { return d.emulator_source === 'mqtt'; });
		var zigbeeDevices = devices.filter(function(d) { return d.emulator_source === 'zigbee'; });

		var usb = emuResult.usb || {};
		var mqtt = emuResult.mqtt || {};
		var zigbee = emuResult.zigbee || {};

		var view = E('div', { 'style': 'max-width:1200px;margin:0 auto;padding:20px;' }, [
			// Header
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;' }, [
				E('div', {}, [
					E('h2', {
						'style': 'margin:0;font-size:1.5rem;background:linear-gradient(90deg,#00d4aa,#00a0ff);' +
						         '-webkit-background-clip:text;-webkit-text-fill-color:transparent;'
					}, 'Emulator Modules'),
					E('p', { 'style': 'margin:4px 0 0;color:#808090;font-size:14px;' },
						'Pluggable device discovery modules for USB, MQTT, and Zigbee peripherals')
				]),
				E('a', {
					'href': L.url('admin/secubox/device-intel/settings'),
					'style': 'padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;' +
					         'background:rgba(0,160,255,0.2);color:#00a0ff;border:1px solid rgba(0,160,255,0.3);'
				}, 'Configure')
			]),

			// USB Card
			createCard('USB Peripherals', '🔌', usb.enabled, [
				E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;' }, [
					createMetric('System USB devices', usb.device_count || 0, '#00a0ff'),
					createMetric('Discovered', usbDevices.length, '#00d4aa')
				]),
				deviceTable(usbDevices, ['hostname', 'vendor', 'device_type'])
			], usb.enabled ? '#00d4aa' : '#808090'),

			// MQTT Card
			createCard('MQTT Broker', '📡', mqtt.enabled, [
				E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:16px;margin-bottom:12px;align-items:center;' }, [
					E('span', { 'style': 'color:#e0e0e0;' },
						'Broker: ' + (mqtt.broker_host || '127.0.0.1') + ':' + (mqtt.broker_port || 1883)),
					statusDot(mqtt.broker_running, mqtt.broker_running ? 'Running' : 'Not Found'),
					createMetric('Clients discovered', mqttDevices.length, '#00d4aa')
				]),
				deviceTable(mqttDevices, ['hostname', 'vendor', 'device_type'])
			], mqtt.enabled ? '#00a0ff' : '#808090'),

			// Zigbee Card
			createCard('Zigbee Coordinator', '📻', zigbee.enabled, [
				E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:16px;margin-bottom:12px;align-items:center;' }, [
					E('span', { 'style': 'color:#e0e0e0;' }, 'Adapter: ' + (zigbee.adapter || 'zigbee2mqtt')),
					E('span', { 'style': 'color:#808090;' }, 'Dongle: ' + (zigbee.coordinator || '/dev/ttyUSB0')),
					statusDot(zigbee.dongle_present, zigbee.dongle_present ? 'Present' : 'Not Found'),
					createMetric('Paired devices', zigbeeDevices.length, '#00d4aa')
				]),
				deviceTable(zigbeeDevices, ['hostname', 'vendor', 'device_type'])
			], zigbee.enabled ? '#ffa500' : '#808090')
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
