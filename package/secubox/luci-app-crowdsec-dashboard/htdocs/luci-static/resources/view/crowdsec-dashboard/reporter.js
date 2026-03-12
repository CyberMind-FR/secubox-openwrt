'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'status',
	expect: { }
});

var callHistory = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'history',
	params: ['lines'],
	expect: { }
});

var callCheckIp = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'check_ip',
	params: ['ip'],
	expect: { }
});

var callReport = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'report',
	expect: { }
});

var callSetEnabled = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'set_enabled',
	params: ['enabled'],
	expect: { }
});

var callSetApiKey = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'set_api_key',
	params: ['api_key'],
	expect: { }
});

var callGetConfig = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'get_config',
	expect: { }
});

var callLogs = rpc.declare({
	object: 'luci.crowdsec-abuseipdb',
	method: 'logs',
	params: ['lines'],
	expect: { }
});

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
	refreshInterval: 30,

	load: function() {
		return Promise.all([
			callStatus(),
			callGetConfig(),
			callHistory(20),
			callLogs(30)
		]);
	},

	formatTimestamp: function(ts) {
		if (!ts || ts === 0) return 'Never';
		var d = new Date(ts * 1000);
		return d.toLocaleString();
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var enabled = status.enabled === true;
		var apiConfigured = status.api_key_configured === true;
		var statusColor = enabled && apiConfigured ? c.green : enabled ? c.orange : c.red;
		return [
			KissTheme.stat(enabled && apiConfigured ? 'Active' : enabled ? 'No Key' : 'Off', 'Status', statusColor),
			KissTheme.stat(status.pending_ips || 0, 'Pending', c.blue),
			KissTheme.stat(status.reported_today || 0, 'Today', c.green),
			KissTheme.stat(status.reported_total || 0, 'Total', c.purple)
		];
	},

	renderControls: function(status, config) {
		var self = this;
		var enabled = status.enabled === true;

		return KissTheme.card('Controls',
			E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
				E('button', {
					'class': enabled ? 'kiss-btn kiss-btn-red' : 'kiss-btn kiss-btn-green',
					'click': ui.createHandlerFn(this, function() {
						return callSetEnabled(!enabled).then(function() {
							ui.addNotification(null, E('p', enabled ? 'Reporter disabled' : 'Reporter enabled'));
							return self.refresh();
						});
					})
				}, enabled ? 'Disable' : 'Enable'),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'disabled': !enabled || !status.api_key_configured,
					'click': ui.createHandlerFn(this, function() {
						ui.showModal('Reporting...', [
							E('p', { 'class': 'spinning' }, 'Reporting blocked IPs to AbuseIPDB...')
						]);
						return callReport().then(function(res) {
							ui.hideModal();
							ui.addNotification(null, E('p', res.message || 'Report started'));
							setTimeout(function() { self.refresh(); }, 5000);
						});
					})
				}, 'Report Now')
			])
		);
	},

	renderApiKeyConfig: function(config) {
		var self = this;

		return KissTheme.card('API Key Configuration',
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, [
					'Get your free API key from ',
					E('a', { 'href': 'https://www.abuseipdb.com/account/api', 'target': '_blank', 'style': 'color: var(--kiss-cyan);' }, 'AbuseIPDB'),
					' (requires account registration)'
				]),
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center; flex-wrap: wrap;' }, [
					E('input', {
						'type': 'password',
						'id': 'api-key-input',
						'placeholder': 'Enter AbuseIPDB API key...',
						'style': 'flex: 1; min-width: 300px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() {
							var key = document.getElementById('api-key-input').value.trim();
							if (!key) {
								ui.addNotification(null, E('p', 'Please enter an API key'));
								return;
							}
							return callSetApiKey(key).then(function(res) {
								if (res.success) {
									document.getElementById('api-key-input').value = '';
									ui.addNotification(null, E('p', 'API key saved'));
									return self.refresh();
								}
							});
						}
					}, 'Save Key'),
					config.api_key_set ? E('span', { 'style': 'color: var(--kiss-green);' }, 'Key is configured') : ''
				])
			])
		);
	},

	renderCheckIp: function() {
		return KissTheme.card('Check IP Reputation',
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
					E('input', {
						'type': 'text',
						'id': 'check-ip-input',
						'placeholder': 'Enter IP to check...',
						'style': 'width: 200px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': function() {
							var ip = document.getElementById('check-ip-input').value.trim();
							var result = document.getElementById('check-result');
							if (!ip) {
								result.textContent = 'Please enter an IP';
								return;
							}
							result.innerHTML = '<span class="spinning">Checking...</span>';
							callCheckIp(ip).then(function(res) {
								if (res.success) {
									var scoreColor = res.confidence_score > 75 ? 'var(--kiss-red)' :
										res.confidence_score > 25 ? 'var(--kiss-orange)' : 'var(--kiss-green)';
									result.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; padding: 16px; background: var(--kiss-bg); border-radius: 8px; margin-top: 12px;">' +
										'<div><div style="font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;">Confidence Score</div><span style="font-size: 1.5em; color: ' + scoreColor + '">' + res.confidence_score + '%</span></div>' +
										'<div><div style="font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;">Total Reports</div>' + res.total_reports + '</div>' +
										'<div><div style="font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;">Country</div>' + res.country + '</div>' +
										'<div><div style="font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;">ISP</div>' + (res.isp || 'Unknown') + '</div>' +
										(res.domain ? '<div><div style="font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;">Domain</div>' + res.domain + '</div>' : '') +
										(res.last_reported ? '<div><div style="font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;">Last Reported</div>' + res.last_reported + '</div>' : '') +
										'</div>';
								} else {
									result.innerHTML = '<span style="color: var(--kiss-red)">Error: ' + (res.error || 'Check failed') + '</span>';
								}
							}).catch(function(e) {
								result.innerHTML = '<span style="color: var(--kiss-red)">Error: ' + e.message + '</span>';
							});
						}
					}, 'Check')
				]),
				E('div', { 'id': 'check-result' })
			])
		);
	},

	renderHistory: function(history) {
		var entries = (history && history.history) || [];

		if (entries.length === 0) {
			return KissTheme.card('Recent Reports',
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center;' }, 'No reports yet')
			);
		}

		var rows = entries.map(function(entry) {
			var score = parseInt(entry.score) || 0;
			var scoreColor = score > 75 ? 'red' : score > 25 ? 'orange' : 'green';
			return E('tr', {}, [
				E('td', { 'style': 'color: var(--kiss-muted);' }, entry.timestamp || '?'),
				E('td', { 'style': 'font-family: monospace;' }, entry.ip || '?'),
				E('td', {}, KissTheme.badge(entry.score || '?', scoreColor))
			]);
		});

		return KissTheme.card('Recent Reports',
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, 'Timestamp'),
						E('th', {}, 'IP Address'),
						E('th', {}, 'Score')
					])
				]),
				E('tbody', {}, rows)
			])
		);
	},

	renderLogs: function(logs) {
		var entries = (logs && logs.logs) || [];

		return KissTheme.card('Logs',
			E('div', {
				'style': 'background: var(--kiss-bg); color: var(--kiss-green); font-family: monospace; padding: 16px; border-radius: 6px; max-height: 250px; overflow-y: auto; font-size: 12px;'
			}, entries.length > 0 ?
				entries.map(function(line) {
					var color = 'var(--kiss-green)';
					if (line.indexOf('[ERROR]') >= 0) color = 'var(--kiss-red)';
					else if (line.indexOf('[WARN]') >= 0) color = 'var(--kiss-orange)';
					else if (line.indexOf('[INFO]') >= 0) color = 'var(--kiss-cyan)';
					else if (line.indexOf('[DEBUG]') >= 0) color = 'var(--kiss-muted)';
					return E('div', { 'style': 'color: ' + color + '; margin-bottom: 2px;' }, line);
				}) :
				E('div', { 'style': 'color: var(--kiss-muted);' }, 'No log entries')
			)
		);
	},

	refresh: function() {
		var self = this;
		return this.load().then(function(data) {
			var container = document.getElementById('reporter-container');
			if (container) {
				dom.content(container, self.renderContent(data));
			}
		});
	},

	renderContent: function(data) {
		var status = data[0] || {};
		var config = data[1] || {};
		var history = data[2] || {};
		var logs = data[3] || {};

		return [
			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// Controls
			this.renderControls(status, config),

			// API Key
			this.renderApiKeyConfig(config),

			// Check IP
			this.renderCheckIp(),

			// History
			this.renderHistory(history),

			// Logs
			this.renderLogs(logs)
		];
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};

		poll.add(function() {
			return self.refresh();
		}, this.refreshInterval);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'AbuseIPDB Reporter'),
					KissTheme.badge(status.enabled && status.api_key_configured ? 'ACTIVE' : 'INACTIVE',
						status.enabled && status.api_key_configured ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Report CrowdSec blocked IPs to AbuseIPDB community database for collaborative threat intelligence.')
			]),

			E('div', { 'id': 'reporter-container' }, this.renderContent(data))
		];

		return KissTheme.wrap(content, 'admin/secubox/crowdsec-dashboard/reporter');
	}
});
