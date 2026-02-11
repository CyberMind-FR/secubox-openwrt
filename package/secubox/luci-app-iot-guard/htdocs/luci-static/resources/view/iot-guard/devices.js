'use strict';
'require view';
'require rpc';
'require ui';

var callGetDevices = rpc.declare({
	object: 'luci.iot-guard',
	method: 'get_devices',
	expect: {}
});

var callGetDevice = rpc.declare({
	object: 'luci.iot-guard',
	method: 'get_device',
	params: ['mac'],
	expect: {}
});

var callIsolateDevice = rpc.declare({
	object: 'luci.iot-guard',
	method: 'isolate_device',
	params: ['mac'],
	expect: {}
});

var callTrustDevice = rpc.declare({
	object: 'luci.iot-guard',
	method: 'trust_device',
	params: ['mac'],
	expect: {}
});

var callBlockDevice = rpc.declare({
	object: 'luci.iot-guard',
	method: 'block_device',
	params: ['mac'],
	expect: {}
});

var callScan = rpc.declare({
	object: 'luci.iot-guard',
	method: 'scan',
	expect: {}
});

// Risk level colors
var RISK_COLORS = {
	high: '#ff4444',
	medium: '#ffaa00',
	low: '#44cc44',
	unknown: '#888888'
};

return view.extend({
	handleScan: function() {
		return callScan().then(function() {
			ui.addNotification(null, E('p', 'Network scan started'), 'info');
			window.setTimeout(function() { window.location.reload(); }, 3000);
		});
	},

	handleIsolate: function(mac) {
		return callIsolateDevice(mac).then(function() {
			ui.addNotification(null, E('p', 'Device isolated: ' + mac), 'success');
			window.location.reload();
		});
	},

	handleTrust: function(mac) {
		return callTrustDevice(mac).then(function() {
			ui.addNotification(null, E('p', 'Device trusted: ' + mac), 'success');
			window.location.reload();
		});
	},

	handleBlock: function(mac) {
		if (!confirm('Block device ' + mac + '? This will prevent all network access.')) return;
		return callBlockDevice(mac).then(function() {
			ui.addNotification(null, E('p', 'Device blocked: ' + mac), 'success');
			window.location.reload();
		});
	},

	handleShowDetail: function(mac) {
		var self = this;
		callGetDevice(mac).then(function(device) {
			self.showDeviceModal(device);
		});
	},

	showDeviceModal: function(device) {
		var self = this;
		var riskColor = RISK_COLORS[device.risk_level] || RISK_COLORS.unknown;

		var cloudList = (device.cloud_deps || []).map(function(c) {
			return E('li', { 'style': 'margin: 5px 0;' }, [
				E('span', {}, c.domain),
				E('span', { 'style': 'color: #888; margin-left: 10px;' }, '(' + c.query_count + ' queries)')
			]);
		});

		var anomalyList = (device.anomalies || []).map(function(a) {
			var sevColor = a.severity === 'high' ? '#ff4444' : (a.severity === 'medium' ? '#ffaa00' : '#888');
			return E('li', { 'style': 'margin: 5px 0;' }, [
				E('span', { 'style': 'color: ' + sevColor + ';' }, '[' + a.severity + '] '),
				E('span', {}, a.type + ': ' + a.description)
			]);
		});

		var content = E('div', { 'style': 'max-width: 600px;' }, [
			E('table', { 'style': 'width: 100%;' }, [
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'MAC'),
					E('td', { 'style': 'padding: 5px;' }, device.mac)
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'IP'),
					E('td', { 'style': 'padding: 5px;' }, device.ip || '-')
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'Hostname'),
					E('td', { 'style': 'padding: 5px;' }, device.hostname || '-')
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'Vendor'),
					E('td', { 'style': 'padding: 5px;' }, device.vendor || '-')
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'Class'),
					E('td', { 'style': 'padding: 5px;' }, device.device_class)
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'Risk Level'),
					E('td', { 'style': 'padding: 5px; color: ' + riskColor + ';' }, device.risk_level + ' (' + device.risk_score + ')')
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'Zone'),
					E('td', { 'style': 'padding: 5px;' }, device.zone)
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'Status'),
					E('td', { 'style': 'padding: 5px;' },
						device.blocked ? 'Blocked' :
						device.isolated ? 'Isolated' :
						device.trusted ? 'Trusted' : 'Active')
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'First Seen'),
					E('td', { 'style': 'padding: 5px;' }, device.first_seen || '-')
				]),
				E('tr', {}, [
					E('td', { 'style': 'padding: 5px; font-weight: bold;' }, 'Last Seen'),
					E('td', { 'style': 'padding: 5px;' }, device.last_seen || '-')
				])
			]),

			cloudList.length > 0 ? E('div', { 'style': 'margin-top: 20px;' }, [
				E('h4', {}, 'Cloud Services (' + cloudList.length + ')'),
				E('ul', { 'style': 'max-height: 150px; overflow-y: auto;' }, cloudList)
			]) : '',

			anomalyList.length > 0 ? E('div', { 'style': 'margin-top: 20px;' }, [
				E('h4', {}, 'Recent Anomalies'),
				E('ul', {}, anomalyList)
			]) : '',

			E('div', { 'style': 'margin-top: 20px; display: flex; gap: 10px;' }, [
				!device.isolated && !device.blocked ?
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { ui.hideModal(); self.handleIsolate(device.mac); }
					}, 'Isolate') : '',
				!device.trusted && !device.blocked ?
					E('button', {
						'class': 'cbi-button',
						'click': function() { ui.hideModal(); self.handleTrust(device.mac); }
					}, 'Trust') : '',
				!device.blocked ?
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': function() { ui.hideModal(); self.handleBlock(device.mac); }
					}, 'Block') : ''
			])
		]);

		ui.showModal('Device: ' + (device.hostname || device.mac), [
			content,
			E('div', { 'class': 'right', 'style': 'margin-top: 20px;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close')
			])
		]);
	},

	load: function() {
		return callGetDevices();
	},

	render: function(data) {
		var devices = (data && data.devices) || [];
		var self = this;

		var rows = devices.map(function(d) {
			var riskColor = RISK_COLORS[d.risk_level] || RISK_COLORS.unknown;
			var status = d.blocked ? 'Blocked' : (d.isolated ? 'Isolated' : (d.trusted ? 'Trusted' : 'Active'));
			var statusColor = d.blocked ? '#ff4444' : (d.isolated ? '#ffaa00' : (d.trusted ? '#44cc44' : '#888'));

			return E('tr', { 'style': 'cursor: pointer;', 'click': function() { self.handleShowDetail(d.mac); } }, [
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, d.mac),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, d.ip || '-'),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, d.hostname || '-'),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, d.vendor ? (d.vendor.length > 25 ? d.vendor.substring(0, 22) + '...' : d.vendor) : '-'),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, d.device_class),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333; color: ' + riskColor + ';' }, d.risk_level),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333; text-align: center;' }, d.risk_score),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, d.zone),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333; color: ' + statusColor + ';' }, status),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, [
					!d.isolated && !d.blocked ? E('button', {
						'class': 'cbi-button cbi-button-action btn-sm',
						'style': 'padding: 2px 8px; font-size: 12px; margin-right: 5px;',
						'click': function(ev) { ev.stopPropagation(); self.handleIsolate(d.mac); }
					}, 'Isolate') : '',
					!d.blocked ? E('button', {
						'class': 'cbi-button cbi-button-negative btn-sm',
						'style': 'padding: 2px 8px; font-size: 12px;',
						'click': function(ev) { ev.stopPropagation(); self.handleBlock(d.mac); }
					}, 'Block') : ''
				])
			]);
		});

		return E('div', { 'class': 'cbi-map', 'style': 'padding: 20px;' }, [
			E('h2', {}, 'IoT Devices'),
			E('div', { 'style': 'margin-bottom: 20px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': L.bind(this.handleScan, this)
				}, 'Scan Network'),
				E('span', { 'style': 'margin-left: 15px; color: #888;' }, devices.length + ' devices')
			]),

			devices.length === 0 ?
				E('div', { 'style': 'padding: 30px; text-align: center; color: #888;' },
					'No devices found. Click "Scan Network" to discover IoT devices.') :
				E('table', { 'style': 'width: 100%; border-collapse: collapse;' }, [
					E('thead', {}, E('tr', { 'style': 'background: #222;' }, [
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'MAC'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'IP'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Hostname'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Vendor'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Class'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Risk'),
						E('th', { 'style': 'padding: 10px; text-align: center;' }, 'Score'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Zone'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Status'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Actions')
					])),
					E('tbody', {}, rows)
				])
		]);
	}
});
