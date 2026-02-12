'use strict';
'require view';
'require rpc';
'require poll';
'require secubox/kiss-theme';

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

// Device class icons
var CLASS_ICONS = {
	camera: '📷',
	thermostat: '🌡️',
	lighting: '💡',
	plug: '🔌',
	assistant: '🎤',
	media: '📺',
	lock: '🔒',
	sensor: '📡',
	diy: '🛠️',
	mixed: '🔗',
	unknown: '❓'
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
		var self = this;

		// Poll for updates
		poll.add(L.bind(function() {
			return callStatus().then(L.bind(function(status) {
				this.updateStats(status);
			}, this));
		}, this), 10);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0 0 8px 0;' }, '📡 IoT Guard'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'Device Isolation & Security Monitoring')
			]),

			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-auto', 'style': 'margin-bottom: 24px;' }, [
				this.renderStatCard('Devices', status.total_devices || 0, 'var(--kiss-blue)'),
				this.renderStatCard('Isolated', status.isolated || 0, 'var(--kiss-yellow)'),
				this.renderStatCard('Blocked', status.blocked || 0, 'var(--kiss-red)'),
				this.renderStatCard('High Risk', status.high_risk || 0, 'var(--kiss-red)'),
				this.renderStatCard('Anomalies', status.anomalies || 0, 'var(--kiss-orange)'),
				this.renderScoreCard('Security Score', status.security_score || 0)
			]),

			// Action buttons
			E('div', { 'class': 'kiss-card', 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': L.bind(this.handleScan, this)
				}, '🔍 Scan Network'),
				E('a', {
					'href': L.url('admin/secubox/services/iot-guard/devices'),
					'class': 'kiss-btn',
					'style': 'text-decoration: none;'
				}, '📋 View All Devices'),
				E('a', {
					'href': L.url('admin/secubox/services/iot-guard/settings'),
					'class': 'kiss-btn',
					'style': 'text-decoration: none;'
				}, '⚙️ Settings')
			]),

			// Device Grid by Risk
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, '🎯 Devices by Risk Level'),
				this.renderDeviceGrid(devices)
			]),

			// Recent Anomalies
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, '⚠️ Recent Anomalies'),
				this.renderAnomaliesTable(anomalies)
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/services/iot-guard');
	},

	renderStatCard: function(label, value, color) {
		return E('div', { 'class': 'kiss-stat', 'style': 'border-left: 3px solid ' + color + ';' }, [
			E('div', {
				'class': 'kiss-stat-value',
				'style': 'color: ' + color + ';',
				'data-stat': label.toLowerCase().replace(' ', '-')
			}, String(value)),
			E('div', { 'class': 'kiss-stat-label' }, label)
		]);
	},

	renderScoreCard: function(label, score) {
		var color = score >= 70 ? 'var(--kiss-green)' : (score >= 40 ? 'var(--kiss-yellow)' : 'var(--kiss-red)');
		return E('div', { 'class': 'kiss-stat', 'style': 'border-left: 3px solid ' + color + ';' }, [
			E('div', {
				'class': 'kiss-stat-value',
				'style': 'color: ' + color + ';',
				'data-stat': 'security-score'
			}, score + '%'),
			E('div', { 'class': 'kiss-stat-label' }, label)
		]);
	},

	renderDeviceGrid: function(devices) {
		var self = this;
		var RISK_COLORS = {
			high: 'var(--kiss-red)',
			medium: 'var(--kiss-yellow)',
			low: 'var(--kiss-green)',
			unknown: 'var(--kiss-muted)'
		};

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

			rows.push(E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('div', {
					'style': 'color: ' + RISK_COLORS[risk] + '; font-weight: 600; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'
				}, risk + ' Risk (' + groups[risk].length + ')'),
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 10px;' },
					groups[risk].slice(0, 12).map(function(d) {
						return self.renderDeviceChip(d, RISK_COLORS);
					})
				)
			]));
		});

		if (rows.length === 0) {
			return E('div', { 'style': 'color: var(--kiss-muted); padding: 30px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '📡'),
				E('p', {}, 'No IoT devices detected.'),
				E('p', { 'style': 'font-size: 12px;' }, 'Click "Scan Network" to discover devices.')
			]);
		}

		return E('div', {}, rows);
	},

	renderDeviceChip: function(device, RISK_COLORS) {
		var icon = CLASS_ICONS[device.device_class] || CLASS_ICONS.unknown;
		var color = RISK_COLORS[device.risk_level] || RISK_COLORS.unknown;

		var statusBadge = '';
		if (device.isolated) statusBadge = ' 🔸';
		else if (device.blocked) statusBadge = ' 🚫';
		else if (device.trusted) statusBadge = ' ✓';

		var label = device.hostname || device.ip || device.mac.substring(9);

		return E('a', {
			'href': L.url('admin/secubox/services/iot-guard/devices') + '?mac=' + encodeURIComponent(device.mac),
			'class': 'kiss-btn',
			'style': 'text-decoration: none; border-color: ' + color + '66;',
			'title': device.vendor + ' - ' + device.mac
		}, [
			E('span', {}, icon),
			E('span', {}, label.length > 15 ? label.substring(0, 12) + '...' : label),
			statusBadge ? E('span', { 'style': 'font-size: 10px;' }, statusBadge) : ''
		]);
	},

	renderAnomaliesTable: function(anomalies) {
		if (!anomalies || anomalies.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 30px; color: var(--kiss-green);' }, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '✅'),
				E('p', {}, 'No recent anomalies detected')
			]);
		}

		var rows = anomalies.map(function(a) {
			var sevColor = a.severity === 'high' ? 'var(--kiss-red)' : (a.severity === 'medium' ? 'var(--kiss-yellow)' : 'var(--kiss-muted)');
			return E('tr', {}, [
				E('td', { 'class': 'td' }, a.timestamp ? a.timestamp.substring(11, 16) : '-'),
				E('td', { 'class': 'td' }, a.hostname || a.mac),
				E('td', { 'class': 'td' }, a.type),
				E('td', { 'class': 'td', 'style': 'color: ' + sevColor + '; font-weight: 600;' }, a.severity),
				E('td', { 'class': 'td', 'style': 'color: var(--kiss-muted);' }, a.description)
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'class': 'th' }, 'Time'),
				E('th', { 'class': 'th' }, 'Device'),
				E('th', { 'class': 'th' }, 'Type'),
				E('th', { 'class': 'th' }, 'Severity'),
				E('th', { 'class': 'th' }, 'Description')
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
