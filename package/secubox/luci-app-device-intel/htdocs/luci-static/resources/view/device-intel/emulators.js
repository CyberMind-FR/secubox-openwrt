'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';
'require secubox/kiss-theme';

/**
 * Device Intel - Emulator Modules - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	load: function() {
		return Promise.all([
			api.getEmulators(),
			api.getDevices()
		]);
	},

	render: function(data) {
		var self = this;
		var K = KissTheme;
		var emuResult = data[0] || {};
		var devResult = data[1] || {};
		var devices = devResult.devices || [];

		// Filter devices by emulator source
		var usbDevices = devices.filter(function(d) { return d.emulator_source === 'usb'; });
		var mqttDevices = devices.filter(function(d) { return d.emulator_source === 'mqtt'; });
		var zigbeeDevices = devices.filter(function(d) { return d.emulator_source === 'zigbee'; });

		var usb = emuResult.usb || {};
		var mqtt = emuResult.mqtt || {};
		var zigbee = emuResult.zigbee || {};

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' }, [
				K.E('div', {}, [
					K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
						K.E('span', {}, '🔌'),
						'Emulator Modules'
					]),
					K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
						'Pluggable device discovery modules for USB, MQTT, and Zigbee peripherals')
				]),
				K.E('a', {
					'href': L.url('admin/secubox/device-intel/settings'),
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 10px 16px; text-decoration: none;'
				}, '⚙️ Configure')
			]),

			// USB Card
			self.emuCard(K, '🔌 USB Peripherals', usb.enabled, [
				K.E('div', { 'style': 'display: flex; gap: 24px; margin-bottom: 16px; flex-wrap: wrap;' }, [
					K.E('span', {}, ['System USB devices: ', K.E('strong', {}, String(usb.device_count || 0))]),
					K.E('span', {}, ['Discovered: ', K.E('strong', { 'style': 'color: var(--kiss-green);' }, String(usbDevices.length))])
				]),
				self.deviceMiniTable(K, usbDevices, ['hostname', 'vendor', 'device_type'])
			]),

			// MQTT Card
			self.emuCard(K, '📡 MQTT Broker', mqtt.enabled, [
				K.E('div', { 'style': 'display: flex; gap: 24px; margin-bottom: 16px; flex-wrap: wrap;' }, [
					K.E('span', {}, 'Broker: ' + (mqtt.broker_host || '127.0.0.1') + ':' + (mqtt.broker_port || 1883)),
					K.E('span', {}, [
						'Status: ',
						mqtt.broker_running
							? K.E('span', { 'style': 'color: var(--kiss-green, #22c55e);' }, '● Running')
							: K.E('span', { 'style': 'color: var(--kiss-red, #ef4444);' }, '● Not Found')
					]),
					K.E('span', {}, ['Clients discovered: ', K.E('strong', { 'style': 'color: var(--kiss-green);' }, String(mqttDevices.length))])
				]),
				self.deviceMiniTable(K, mqttDevices, ['hostname', 'vendor', 'device_type'])
			]),

			// Zigbee Card
			self.emuCard(K, '📻 Zigbee Coordinator', zigbee.enabled, [
				K.E('div', { 'style': 'display: flex; gap: 24px; margin-bottom: 16px; flex-wrap: wrap;' }, [
					K.E('span', {}, 'Adapter: ' + (zigbee.adapter || 'zigbee2mqtt')),
					K.E('span', {}, 'Dongle: ' + (zigbee.coordinator || '/dev/ttyUSB0')),
					K.E('span', {}, [
						'Status: ',
						zigbee.dongle_present
							? K.E('span', { 'style': 'color: var(--kiss-green, #22c55e);' }, '● Present')
							: K.E('span', { 'style': 'color: var(--kiss-red, #ef4444);' }, '● Not Found')
					]),
					K.E('span', {}, ['Paired devices: ', K.E('strong', { 'style': 'color: var(--kiss-green);' }, String(zigbeeDevices.length))])
				]),
				self.deviceMiniTable(K, zigbeeDevices, ['hostname', 'vendor', 'device_type'])
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/services/device-intel/emulators');
	},

	emuCard: function(K, title, enabled, contentItems) {
		return K.E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 16px;' }, [
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;' }, [
				K.E('div', { 'class': 'kiss-card-title', 'style': 'margin: 0;' }, title),
				enabled
					? K.E('span', { 'style': 'background: var(--kiss-green, #22c55e); color: #000; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;' }, 'Enabled')
					: K.E('span', { 'style': 'background: var(--kiss-muted, #64748b); color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 12px;' }, 'Disabled')
			])
		].concat(contentItems));
	},

	deviceMiniTable: function(K, devices, fields) {
		if (devices.length === 0) {
			return K.E('p', { 'style': 'color: var(--kiss-muted); font-style: italic; text-align: center; padding: 20px;' },
				'No devices discovered from this emulator.');
		}

		var headers = {
			'hostname': 'Name',
			'vendor': 'Model/Vendor',
			'device_type': 'Type',
			'mac': 'ID',
			'ip': 'IP'
		};

		return K.E('table', { 'class': 'kiss-table' }, [
			K.E('thead', {}, K.E('tr', {},
				fields.map(function(f) {
					return K.E('th', {}, headers[f] || f);
				})
			)),
			K.E('tbody', {},
				devices.slice(0, 20).map(function(d) {
					return K.E('tr', {},
						fields.map(function(f) {
							return K.E('td', {}, String(d[f] || '-'));
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
