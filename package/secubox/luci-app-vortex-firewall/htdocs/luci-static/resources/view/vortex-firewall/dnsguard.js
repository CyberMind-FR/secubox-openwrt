'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require secubox/kiss-theme';

var callDNSGuardStatus = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'dnsguard_status',
	expect: {}
});

var callDNSGuardAlerts = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'dnsguard_alerts',
	params: ['limit'],
	expect: { alerts: [] }
});

var callDNSGuardSync = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'dnsguard_sync',
	expect: {}
});

function typeColor(type) {
	var colors = {
		'dga': 'red',
		'dns_tunnel': 'orange',
		'tunneling': 'orange',
		'malware': 'red',
		'known_bad': 'purple',
		'suspicious_tld': 'orange',
		'tld_anomaly': 'orange',
		'rate_anomaly': 'cyan',
		'ai_detected': 'green'
	};
	return colors[type] || 'muted';
}

function confidenceBar(value) {
	var color = value >= 80 ? 'var(--kiss-red)' : value >= 60 ? 'var(--kiss-orange)' : 'var(--kiss-orange)';
	return E('div', { style: 'display:flex;align-items:center;gap:8px;' }, [
		E('div', {
			style: 'width:80px;height:8px;background:var(--kiss-bg);border-radius:4px;overflow:hidden;'
		}, [
			E('div', {
				style: 'height:100%;width:' + value + '%;background:' + color + ';'
			})
		]),
		E('span', { style: 'font-size:0.85em;color:var(--kiss-muted);' }, value + '%')
	]);
}

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callDNSGuardStatus(),
			callDNSGuardAlerts(50)
		]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var serviceColor = status.running ? c.green : (status.installed ? c.orange : c.red);
		return [
			KissTheme.stat(status.running ? 'Running' : (status.installed ? 'Stopped' : 'N/A'), 'Service', serviceColor),
			KissTheme.stat(status.alert_count || 0, 'Alerts', c.red),
			KissTheme.stat(status.pending_count || 0, 'Pending', c.orange),
			KissTheme.stat(status.vortex_imported || 0, 'Imported', c.green)
		];
	},

	renderDetectionTypes: function(types) {
		if (!types || Object.keys(types).length === 0) return '';

		var badges = Object.keys(types).map(function(type) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
				KissTheme.badge(type.replace('_', ' '), typeColor(type)),
				E('span', { 'style': 'font-weight: 600;' }, String(types[type]))
			]);
		});

		return KissTheme.card('Detection Types',
			E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 16px;' }, badges)
		);
	},

	renderAlertsTable: function(alerts) {
		if (!alerts || alerts.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' }, 'No alerts from DNS Guard');
		}

		var rows = alerts.map(function(alert) {
			return E('tr', {}, [
				E('td', { 'style': 'font-family: monospace; font-size: 0.9em;' }, alert.domain || '-'),
				E('td', {}, KissTheme.badge((alert.type || 'unknown').replace('_', ' '), typeColor(alert.type))),
				E('td', {}, confidenceBar(alert.confidence || 0)),
				E('td', { 'style': 'font-family: monospace; color: var(--kiss-muted);' }, alert.client || '-'),
				E('td', { 'style': 'font-size: 0.85em; color: var(--kiss-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' }, alert.reason || '-')
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Domain'),
					E('th', {}, 'Type'),
					E('th', {}, 'Confidence'),
					E('th', {}, 'Client'),
					E('th', {}, 'Reason')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var alerts = data[1] || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'DNS Guard Integration'),
					KissTheme.badge(status.running ? 'RUNNING' : 'OFFLINE', status.running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'AI-powered DNS threat detection integrated with Vortex Firewall')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// Detection Types
			this.renderDetectionTypes(status.detection_types),

			// Actions
			KissTheme.card('Actions',
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': ui.createHandlerFn(this, function() {
							return callDNSGuardSync().then(function(result) {
								if (result.success) {
									ui.addNotification(null, E('p', result.message), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', result.message), 'error');
								}
							});
						})
					}, 'Sync from DNS Guard'),
					status.vortex_last_sync ? E('span', {
						'style': 'color: var(--kiss-muted); font-size: 12px;'
					}, 'Last sync: ' + status.vortex_last_sync) : ''
				])
			),

			// Alerts Table
			KissTheme.card('Recent DNS Guard Alerts', this.renderAlertsTable(alerts)),

			// Info box
			E('div', {
				'style': 'margin-top: 20px; padding: 16px; background: linear-gradient(135deg, var(--kiss-purple), var(--kiss-blue)); border-radius: 8px;'
			}, [
				E('h4', { 'style': 'margin: 0 0 8px 0; color: white;' }, 'AI-Powered Detection'),
				E('p', { 'style': 'margin: 0; opacity: 0.9; font-size: 0.9em; color: white;' },
					'DNS Guard uses LocalAI to detect DGA domains, DNS tunneling, and other anomalies. Detections are automatically imported into Vortex Firewall for DNS-level blocking.')
			])
		];

		return KissTheme.wrap(content, 'admin/services/vortex-firewall/dnsguard');
	}
});
