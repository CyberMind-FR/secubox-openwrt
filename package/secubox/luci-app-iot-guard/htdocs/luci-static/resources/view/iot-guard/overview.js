'use strict';
'require view';
'require rpc';
'require poll';

var callStatus = rpc.declare({
	object: 'luci.iot-guard',
	method: 'status',
	expect: {}
});

var callGetDevices = rpc.declare({
	object: 'luci.iot-guard',
	method: 'get_devices',
	expect: {}
});

var callGetAnomalies = rpc.declare({
	object: 'luci.iot-guard',
	method: 'get_anomalies',
	params: ['limit'],
	expect: {}
});

var callScan = rpc.declare({
	object: 'luci.iot-guard',
	method: 'scan',
	expect: {}
});

// Device class icons (emoji-free)
var CLASS_ICONS = {
	camera: '[CAM]',
	thermostat: '[TMP]',
	lighting: '[LGT]',
	plug: '[PLG]',
	assistant: '[AST]',
	media: '[MED]',
	lock: '[LCK]',
	sensor: '[SNS]',
	diy: '[DIY]',
	mixed: '[MIX]',
	unknown: '[???]'
};

// Risk colors
var RISK_COLORS = {
	high: '#ff4444',
	medium: '#ffaa00',
	low: '#44cc44',
	unknown: '#888888'
};

return view.extend({
	handleScan: function() {
		return callScan().then(function() {
			window.location.reload();
		});
	},

	load: function() {
		return Promise.all([
			callStatus(),
			callGetDevices(),
			callGetAnomalies(5)
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var devices = (data[1] && data[1].devices) || [];
		var anomalies = (data[2] && data[2].anomalies) || [];

		var view = E('div', { 'class': 'cbi-map', 'style': 'padding: 20px;' }, [
			// Header
			E('h2', { 'style': 'margin-bottom: 5px;' }, 'IoT Guard'),
			E('div', { 'style': 'color: #666; margin-bottom: 20px;' }, 'Device Isolation & Security Monitoring'),

			// Status Cards Row
			E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px;' }, [
				this.renderStatCard('Devices', status.total_devices || 0, '#4a9eff'),
				this.renderStatCard('Isolated', status.isolated || 0, '#ffaa00'),
				this.renderStatCard('Blocked', status.blocked || 0, '#ff4444'),
				this.renderStatCard('High Risk', status.high_risk || 0, '#ff4444'),
				this.renderStatCard('Anomalies', status.anomalies || 0, '#ff6600'),
				this.renderScoreCard('Security Score', status.security_score || 0)
			]),

			// Action buttons
			E('div', { 'style': 'margin-bottom: 25px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': L.bind(this.handleScan, this)
				}, 'Scan Network'),
				E('a', {
					'href': L.url('admin/secubox/services/iot-guard/devices'),
					'class': 'cbi-button',
					'style': 'margin-left: 10px;'
				}, 'View All Devices')
			]),

			// Device Grid by Risk
			E('h3', { 'style': 'margin-top: 25px; margin-bottom: 15px;' }, 'Devices by Risk Level'),
			this.renderDeviceGrid(devices),

			// Recent Anomalies
			E('h3', { 'style': 'margin-top: 30px; margin-bottom: 15px;' }, 'Recent Anomalies'),
			this.renderAnomaliesTable(anomalies)
		]);

		// Poll for updates
		poll.add(L.bind(function() {
			return callStatus().then(L.bind(function(status) {
				this.updateStats(status);
			}, this));
		}, this), 10);

		return view;
	},

	renderStatCard: function(label, value, color) {
		return E('div', {
			'style': 'background: linear-gradient(135deg, ' + color + '22, ' + color + '11); ' +
				'border: 1px solid ' + color + '44; border-radius: 8px; padding: 15px 20px; ' +
				'min-width: 120px; text-align: center;'
		}, [
			E('div', {
				'style': 'font-size: 28px; font-weight: bold; color: ' + color + ';',
				'data-stat': label.toLowerCase().replace(' ', '-')
			}, String(value)),
			E('div', { 'style': 'color: #666; font-size: 12px; margin-top: 5px;' }, label)
		]);
	},

	renderScoreCard: function(label, score) {
		var color = score >= 70 ? '#44cc44' : (score >= 40 ? '#ffaa00' : '#ff4444');
		return E('div', {
			'style': 'background: linear-gradient(135deg, ' + color + '22, ' + color + '11); ' +
				'border: 1px solid ' + color + '44; border-radius: 8px; padding: 15px 20px; ' +
				'min-width: 140px; text-align: center;'
		}, [
			E('div', {
				'style': 'font-size: 28px; font-weight: bold; color: ' + color + ';',
				'data-stat': 'security-score'
			}, score + '%'),
			E('div', { 'style': 'color: #666; font-size: 12px; margin-top: 5px;' }, label)
		]);
	},

	renderDeviceGrid: function(devices) {
		var groups = { high: [], medium: [], low: [], unknown: [] };

		devices.forEach(function(d) {
			var risk = d.risk_level || 'unknown';
			if (groups[risk]) {
				groups[risk].push(d);
			} else {
				groups.unknown.push(d);
			}
		});

		var rows = [];

		['high', 'medium', 'low'].forEach(function(risk) {
			if (groups[risk].length === 0) return;

			rows.push(E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('div', {
					'style': 'color: ' + RISK_COLORS[risk] + '; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;'
				}, risk + ' Risk (' + groups[risk].length + ')'),
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 10px;' },
					groups[risk].slice(0, 12).map(function(d) {
						return this.renderDeviceChip(d);
					}, this)
				)
			]));
		}, this);

		if (rows.length === 0) {
			return E('div', { 'style': 'color: #888; padding: 20px; text-align: center;' },
				'No IoT devices detected. Click "Scan Network" to discover devices.');
		}

		return E('div', {}, rows);
	},

	renderDeviceChip: function(device) {
		var icon = CLASS_ICONS[device.device_class] || CLASS_ICONS.unknown;
		var color = RISK_COLORS[device.risk_level] || RISK_COLORS.unknown;

		var statusBadge = '';
		if (device.isolated) statusBadge = ' [ISO]';
		else if (device.blocked) statusBadge = ' [BLK]';
		else if (device.trusted) statusBadge = ' [OK]';

		var label = device.hostname || device.ip || device.mac.substring(9);

		return E('a', {
			'href': L.url('admin/secubox/services/iot-guard/devices') + '?mac=' + encodeURIComponent(device.mac),
			'style': 'background: #1a1a2e; border: 1px solid ' + color + '66; border-radius: 6px; ' +
				'padding: 8px 12px; color: #eee; text-decoration: none; display: inline-flex; ' +
				'align-items: center; gap: 8px; font-size: 13px;',
			'title': device.vendor + ' - ' + device.mac
		}, [
			E('span', { 'style': 'color: ' + color + '; font-weight: bold;' }, icon),
			E('span', {}, label.length > 15 ? label.substring(0, 12) + '...' : label),
			statusBadge ? E('span', { 'style': 'color: #888; font-size: 11px;' }, statusBadge) : ''
		]);
	},

	renderAnomaliesTable: function(anomalies) {
		if (!anomalies || anomalies.length === 0) {
			return E('div', {
				'style': 'background: #0a2a0a; border: 1px solid #2a4a2a; border-radius: 8px; ' +
					'padding: 20px; text-align: center; color: #4a8a4a;'
			}, 'No recent anomalies detected');
		}

		var rows = anomalies.map(function(a) {
			var sevColor = a.severity === 'high' ? '#ff4444' : (a.severity === 'medium' ? '#ffaa00' : '#888');
			return E('tr', {}, [
				E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333;' }, a.timestamp ? a.timestamp.substring(11, 16) : '-'),
				E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333;' }, a.hostname || a.mac),
				E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333;' }, a.type),
				E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333; color: ' + sevColor + ';' }, a.severity),
				E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333; color: #888;' }, a.description)
			]);
		});

		return E('table', { 'style': 'width: 100%; border-collapse: collapse;' }, [
			E('thead', {}, E('tr', { 'style': 'background: #222;' }, [
				E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Time'),
				E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Device'),
				E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Type'),
				E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Severity'),
				E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Description')
			])),
			E('tbody', {}, rows)
		]);
	},

	updateStats: function(status) {
		var updates = {
			'devices': status.total_devices,
			'isolated': status.isolated,
			'blocked': status.blocked,
			'high-risk': status.high_risk,
			'anomalies': status.anomalies,
			'security-score': status.security_score + '%'
		};

		Object.keys(updates).forEach(function(key) {
			var el = document.querySelector('[data-stat="' + key + '"]');
			if (el) el.textContent = String(updates[key]);
		});
	}
});
