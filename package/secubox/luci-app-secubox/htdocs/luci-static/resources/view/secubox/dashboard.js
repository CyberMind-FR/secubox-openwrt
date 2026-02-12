'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require fs';
'require secubox/kiss-theme';

/**
 * SecuBox Dashboard - KISS Edition
 * Self-contained with inline CSS, no external dependencies
 */

var callSystemBoard = rpc.declare({ object: 'system', method: 'board', expect: {} });
var callSystemInfo = rpc.declare({ object: 'system', method: 'info', expect: {} });

var callDashboardData = rpc.declare({
	object: 'luci.secubox',
	method: 'get_dashboard_data',
	expect: {}
});

var callSystemHealth = rpc.declare({
	object: 'luci.secubox',
	method: 'get_system_health',
	expect: {}
});

var callGetModules = rpc.declare({
	object: 'luci.secubox',
	method: 'getModules',
	expect: {}
});

var callGetAlerts = rpc.declare({
	object: 'luci.secubox',
	method: 'get_alerts',
	expect: {}
});

var callPublicIPs = rpc.declare({
	object: 'luci.secubox',
	method: 'get_public_ips',
	expect: {}
});

// Utilities
function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
	if (!seconds) return '0m';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (d > 0) return d + 'd ' + h + 'h';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

function getBarColor(percent) {
	if (percent >= 90) return '#ef4444';
	if (percent >= 70) return '#f59e0b';
	return '#22c55e';
}

function getScoreColor(score) {
	if (score >= 80) return '#22c55e';
	if (score >= 60) return '#3b82f6';
	if (score >= 40) return '#f59e0b';
	return '#ef4444';
}

return view.extend({
	data: {
		dashboard: {},
		health: {},
		modules: [],
		alerts: [],
		publicIPs: {},
		board: {},
		info: {}
	},

	load: function() {
		var self = this;
		return Promise.all([
			callSystemBoard().catch(function() { return {}; }),
			callSystemInfo().catch(function() { return {}; }),
			callDashboardData().catch(function() { return {}; }),
			callSystemHealth().catch(function() { return {}; }),
			callGetModules().catch(function() { return { modules: [] }; }),
			callGetAlerts().catch(function() { return { alerts: [] }; }),
			callPublicIPs().catch(function() { return {}; })
		]).then(function(results) {
			self.data = {
				board: results[0] || {},
				info: results[1] || {},
				dashboard: results[2] || {},
				health: results[3] || {},
				modules: (results[4] && results[4].modules) || [],
				alerts: (results[5] && results[5].alerts) || [],
				publicIPs: results[6] || {}
			};
			return self.data;
		});
	},

	renderHeader: function() {
		var d = this.data.dashboard || {};
		var status = d.status || {};
		var counts = d.counts || {};
		var health = this.data.health || {};
		var score = (health.overall && health.overall.score) || health.score || 0;
		var modules = this.data.modules || [];
		var running = modules.filter(function(m) { return m.status === 'active' || m.running; }).length;
		var alertCount = (this.data.alerts || []).length;

		var chips = [
			{ icon: '\uD83C\uDFF7', label: 'Version', value: status.version || '0.0.0' },
			{ icon: '\uD83D\uDCE6', label: 'Modules', value: modules.length },
			{ icon: '\uD83D\uDFE2', label: 'Running', value: running, color: running > 0 ? '#22c55e' : '' },
			{ icon: '\u26A0\uFE0F', label: 'Alerts', value: alertCount, color: alertCount > 0 ? '#f59e0b' : '' },
			{ icon: '\u2764\uFE0F', label: 'Health', value: score + '/100', color: getScoreColor(score) }
		];

		return E('div', { 'class': 'sb-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sb-title' }, '\uD83D\uDE80 SecuBox Control Center'),
				E('p', { 'class': 'sb-subtitle' }, 'Security \u00B7 Network \u00B7 System automation')
			]),
			E('div', { 'class': 'sb-chips' }, chips.map(function(chip) {
				return E('div', { 'class': 'sb-chip', 'style': chip.color ? 'border-color:' + chip.color : '' }, [
					E('span', { 'class': 'sb-chip-icon' }, chip.icon),
					E('div', {}, [
						E('span', { 'class': 'sb-chip-label' }, chip.label),
						E('strong', { 'style': chip.color ? 'color:' + chip.color : '' }, String(chip.value))
					])
				]);
			}))
		]);
	},

	renderStatsCards: function() {
		var d = this.data.dashboard || {};
		var counts = d.counts || {};
		var modules = this.data.modules || [];
		var health = this.data.health || {};
		var score = (health.overall && health.overall.score) || health.score || 0;
		var alertCount = (this.data.alerts || []).length;
		var running = modules.filter(function(m) { return m.status === 'active' || m.running; }).length;
		var installed = modules.filter(function(m) { return m.installed || m.enabled; }).length;

		var stats = [
			{ id: 'total', icon: '\uD83D\uDCE6', label: 'Total Modules', value: counts.total || modules.length },
			{ id: 'installed', icon: '\uD83D\uDCBE', label: 'Installed', value: counts.installed || installed },
			{ id: 'running', icon: '\uD83D\uDFE2', label: 'Active', value: counts.running || running },
			{ id: 'health', icon: '\u2764\uFE0F', label: 'Health Score', value: score + '/100' },
			{ id: 'alerts', icon: '\u26A0\uFE0F', label: 'Alerts', value: alertCount }
		];

		return E('div', { 'class': 'sb-stats' }, stats.map(function(stat) {
			return E('div', { 'class': 'sb-stat-card' }, [
				E('div', { 'class': 'sb-stat-icon' }, stat.icon),
				E('div', {}, [
					E('div', { 'class': 'sb-stat-value', 'data-stat': stat.id }, String(stat.value)),
					E('div', { 'class': 'sb-stat-label' }, stat.label)
				])
			]);
		}));
	},

	renderHealthPanel: function() {
		var health = this.data.health || {};
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		// Extract CPU load (handle both "1.83 1.95 1.69" string and load_1m field)
		var cpuLoad = cpu.load_1min || cpu.load_1m || '0.00';
		if (cpu.load && typeof cpu.load === 'string') {
			cpuLoad = cpu.load.split(' ')[0] || '0.00';
		}

		var metrics = [
			{
				id: 'cpu',
				icon: '\uD83D\uDD25',
				label: 'CPU',
				percent: cpu.percent || cpu.usage_percent || cpu.usage || 0,
				detail: 'Load: ' + cpuLoad
			},
			{
				id: 'memory',
				icon: '\uD83D\uDCBE',
				label: 'Memory',
				percent: memory.percent || memory.usage_percent || memory.usage || 0,
				detail: formatBytes((memory.used_kb || 0) * 1024) + ' / ' + formatBytes((memory.total_kb || 0) * 1024)
			},
			{
				id: 'disk',
				icon: '\uD83D\uDCBF',
				label: 'Storage',
				percent: disk.percent || disk.usage_percent || disk.usage || 0,
				detail: formatBytes((disk.used_kb || 0) * 1024) + ' / ' + formatBytes((disk.total_kb || 0) * 1024)
			},
			{
				id: 'network',
				icon: '\uD83C\uDF10',
				label: 'Network',
				percent: network.wan_up ? 100 : 0,
				detail: network.wan_up ? 'WAN Online' : 'WAN Offline'
			}
		];

		return E('div', { 'class': 'sb-panel' }, [
			E('h3', {}, '\uD83D\uDCCA System Health'),
			E('div', { 'class': 'sb-health-metrics' }, metrics.map(function(m) {
				var pct = Math.min(100, Math.max(0, m.percent));
				return E('div', { 'class': 'sb-metric' }, [
					E('div', { 'class': 'sb-metric-header' }, [
						E('span', {}, m.icon + ' ' + m.label),
						E('span', { 'data-stat': m.id + '-detail' }, m.detail)
					]),
					E('div', { 'class': 'sb-bar' }, [
						E('div', {
							'class': 'sb-bar-fill',
							'data-stat': m.id + '-bar',
							'style': 'width:' + pct + '%;background:' + getBarColor(pct)
						})
					]),
					E('span', { 'class': 'sb-metric-pct', 'data-stat': m.id + '-pct' }, pct + '%')
				]);
			}))
		]);
	},

	renderPublicIPsPanel: function() {
		var ips = this.data.publicIPs || {};
		var ipv4 = ips.ipv4 || 'N/A';
		var ipv6 = ips.ipv6 || 'N/A';
		var ipv6Display = ipv6.length > 24 ? ipv6.substring(0, 21) + '...' : ipv6;

		return E('div', { 'class': 'sb-panel' }, [
			E('h3', {}, '\uD83C\uDF10 Public IP Addresses'),
			E('div', { 'class': 'sb-ip-grid' }, [
				E('div', { 'class': 'sb-ip-box' }, [
					E('div', { 'class': 'sb-ip-icon' }, '\uD83C\uDF10'),
					E('div', { 'class': 'sb-ip-label' }, 'IPv4'),
					E('div', {
						'class': 'sb-ip-value',
						'data-stat': 'ipv4',
						'title': ipv4,
						'style': 'color:' + (ips.ipv4_available ? '#22c55e' : '#888')
					}, ipv4)
				]),
				E('div', { 'class': 'sb-ip-box' }, [
					E('div', { 'class': 'sb-ip-icon' }, '\uD83D\uDD37'),
					E('div', { 'class': 'sb-ip-label' }, 'IPv6'),
					E('div', {
						'class': 'sb-ip-value',
						'data-stat': 'ipv6',
						'title': ipv6,
						'style': 'color:' + (ips.ipv6_available ? '#22c55e' : '#888')
					}, ipv6Display)
				])
			])
		]);
	},

	renderModulesPanel: function() {
		var modules = this.data.modules || [];
		var topModules = modules.slice(0, 8);

		var rows = topModules.map(function(mod) {
			var status = mod.status || 'unknown';
			var isActive = status === 'active' || mod.running;
			return E('tr', {}, [
				E('td', {}, [
					E('span', { 'class': 'sb-mod-icon' }, mod.icon || '\uD83D\uDCE6'),
					mod.name || mod.id
				]),
				E('td', {}, mod.category || '-'),
				E('td', {}, E('span', {
					'class': 'sb-badge',
					'style': 'background:' + (isActive ? '#22c55e' : '#6b7280')
				}, isActive ? 'Active' : 'Inactive')),
				E('td', {}, mod.version || '-')
			]);
		});

		if (rows.length === 0) {
			rows.push(E('tr', {}, [
				E('td', { 'colspan': '4', 'style': 'text-align:center;color:#888' }, 'No modules found')
			]));
		}

		return E('div', { 'class': 'sb-panel sb-panel-wide' }, [
			E('div', { 'class': 'sb-panel-header' }, [
				E('h3', {}, '\uD83D\uDCE6 Modules Overview'),
				E('button', {
					'class': 'sb-link-btn',
					'click': function() { window.location.href = L.url('admin/secubox/modules'); }
				}, 'View All \u2192')
			]),
			E('table', { 'class': 'sb-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Module'),
					E('th', {}, 'Category'),
					E('th', {}, 'Status'),
					E('th', {}, 'Version')
				])),
				E('tbody', {}, rows)
			])
		]);
	},

	renderQuickActions: function() {
		var self = this;
		var actions = [
			{ id: 'restart_services', icon: '\uD83D\uDD04', label: 'Restart Services', color: '#f59e0b' },
			{ id: 'update_packages', icon: '\u2B06\uFE0F', label: 'Update Packages', color: '#3b82f6' },
			{ id: 'view_logs', icon: '\uD83D\uDCDC', label: 'View Logs', color: '#8b5cf6' },
			{ id: 'export_config', icon: '\uD83D\uDCE6', label: 'Export Config', color: '#22c55e' }
		];

		return E('div', { 'class': 'sb-panel' }, [
			E('h3', {}, '\u26A1 Quick Actions'),
			E('div', { 'class': 'sb-actions' }, actions.map(function(action) {
				return E('button', {
					'class': 'sb-action-btn',
					'style': 'border-color:' + action.color + ';color:' + action.color,
					'click': function() { self.runAction(action.id); }
				}, [
					E('span', {}, action.icon),
					E('span', {}, action.label)
				]);
			}))
		]);
	},

	renderAlertsPanel: function() {
		var alerts = (this.data.alerts || []).slice(0, 5);

		var items = alerts.map(function(alert) {
			var sev = (alert.severity || 'info').toLowerCase();
			var color = sev === 'critical' ? '#ef4444' : sev === 'warning' ? '#f59e0b' : '#3b82f6';
			return E('div', { 'class': 'sb-alert-item', 'style': 'border-left-color:' + color }, [
				E('div', { 'class': 'sb-alert-time' }, alert.timestamp || alert.time || ''),
				E('div', {}, [
					E('strong', {}, alert.title || alert.message || 'Alert'),
					alert.source ? E('span', { 'class': 'sb-alert-source' }, ' \u2022 ' + alert.source) : ''
				])
			]);
		});

		if (items.length === 0) {
			items.push(E('div', { 'class': 'sb-empty' }, [
				E('span', {}, '\uD83C\uDF89'),
				E('p', {}, 'No alerts in the last 24 hours')
			]));
		}

		return E('div', { 'class': 'sb-panel' }, [
			E('h3', {}, '\u26A0\uFE0F Alert Timeline'),
			E('div', { 'class': 'sb-alerts-list' }, items)
		]);
	},

	runAction: function(actionId) {
		ui.showModal('Executing...', [
			E('p', { 'class': 'spinning' }, 'Running ' + actionId + '...')
		]);

		return rpc.declare({
			object: 'luci.secubox',
			method: 'quick_action',
			params: ['action'],
			expect: {}
		})(actionId).then(function(result) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Action completed'), 'info');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Action failed: ' + (err.message || err)), 'error');
		});
	},

	render: function() {
		var self = this;

		// Start polling
		poll.add(function() {
			return Promise.all([
				callSystemHealth().catch(function() { return {}; }),
				callGetAlerts().catch(function() { return { alerts: [] }; }),
				callPublicIPs().catch(function() { return {}; })
			]).then(function(results) {
				self.data.health = results[0] || {};
				self.data.alerts = (results[1] && results[1].alerts) || [];
				self.data.publicIPs = results[2] || {};
				self.updateLiveData();
			});
		}, 15);

		var content = E('div', { 'class': 'sb-dashboard' }, [
			E('style', {}, this.getStyles()),
			this.renderHeader(),
			this.renderStatsCards(),
			E('div', { 'class': 'sb-grid' }, [
				E('div', { 'class': 'sb-col' }, [
					this.renderModulesPanel(),
					this.renderHealthPanel()
				]),
				E('div', { 'class': 'sb-col' }, [
					this.renderPublicIPsPanel(),
					this.renderQuickActions(),
					this.renderAlertsPanel()
				])
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/dashboard');
	},

	updateLiveData: function() {
		var health = this.data.health || {};
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		// Extract CPU load (handle both "1.83 1.95 1.69" string and load_1m field)
		var cpuLoad = cpu.load_1min || cpu.load_1m || '0.00';
		if (cpu.load && typeof cpu.load === 'string') {
			cpuLoad = cpu.load.split(' ')[0] || '0.00';
		}

		// Update health metrics
		var metrics = {
			cpu: { pct: cpu.percent || cpu.usage_percent || cpu.usage || 0, detail: 'Load: ' + cpuLoad },
			memory: { pct: memory.percent || memory.usage_percent || memory.usage || 0, detail: formatBytes((memory.used_kb || 0) * 1024) + ' / ' + formatBytes((memory.total_kb || 0) * 1024) },
			disk: { pct: disk.percent || disk.usage_percent || disk.usage || 0, detail: formatBytes((disk.used_kb || 0) * 1024) + ' / ' + formatBytes((disk.total_kb || 0) * 1024) },
			network: { pct: network.wan_up ? 100 : 0, detail: network.wan_up ? 'WAN Online' : 'WAN Offline' }
		};

		Object.keys(metrics).forEach(function(key) {
			var m = metrics[key];
			var bar = document.querySelector('[data-stat="' + key + '-bar"]');
			var pct = document.querySelector('[data-stat="' + key + '-pct"]');
			var detail = document.querySelector('[data-stat="' + key + '-detail"]');
			if (bar) {
				bar.style.width = m.pct + '%';
				bar.style.background = getBarColor(m.pct);
			}
			if (pct) pct.textContent = m.pct + '%';
			if (detail) detail.textContent = m.detail;
		});

		// Update public IPs
		var ips = this.data.publicIPs || {};
		var ipv4El = document.querySelector('[data-stat="ipv4"]');
		var ipv6El = document.querySelector('[data-stat="ipv6"]');
		if (ipv4El) {
			ipv4El.textContent = ips.ipv4 || 'N/A';
			ipv4El.style.color = ips.ipv4_available ? '#22c55e' : '#888';
		}
		if (ipv6El) {
			var ipv6 = ips.ipv6 || 'N/A';
			ipv6El.textContent = ipv6.length > 24 ? ipv6.substring(0, 21) + '...' : ipv6;
			ipv6El.style.color = ips.ipv6_available ? '#22c55e' : '#888';
		}

		// Update alerts count
		var alertsEl = document.querySelector('[data-stat="alerts"]');
		if (alertsEl) alertsEl.textContent = (this.data.alerts || []).length;

		// Update health score
		var score = (health.overall && health.overall.score) || health.score || 0;
		var healthEl = document.querySelector('[data-stat="health"]');
		if (healthEl) healthEl.textContent = score + '/100';
	},

	getStyles: function() {
		return [
			'.sb-dashboard { max-width: 1400px; margin: 0 auto; padding: 20px; }',
			'.sb-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }',
			'.sb-title { margin: 0; font-size: 24px; font-weight: 700; }',
			'.sb-subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }',
			'.sb-chips { display: flex; gap: 12px; flex-wrap: wrap; }',
			'.sb-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; }',
			'.sb-chip-icon { font-size: 18px; }',
			'.sb-chip-label { font-size: 11px; color: #666; display: block; }',
			'.sb-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }',
			'.sb-stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }',
			'.sb-stat-icon { font-size: 28px; }',
			'.sb-stat-value { font-size: 20px; font-weight: 700; }',
			'.sb-stat-label { font-size: 12px; color: #666; }',
			'.sb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }',
			'@media (max-width: 900px) { .sb-grid { grid-template-columns: 1fr; } }',
			'.sb-col { display: flex; flex-direction: column; gap: 20px; }',
			'.sb-panel { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }',
			'.sb-panel-wide { grid-column: span 1; }',
			'.sb-panel h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }',
			'.sb-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }',
			'.sb-panel-header h3 { margin: 0; }',
			'.sb-link-btn { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 13px; }',
			'.sb-health-metrics { display: flex; flex-direction: column; gap: 14px; }',
			'.sb-metric { }',
			'.sb-metric-header { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }',
			'.sb-bar { height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }',
			'.sb-bar-fill { height: 100%; border-radius: 5px; transition: width 0.3s, background 0.3s; }',
			'.sb-metric-pct { font-size: 12px; color: #666; display: block; text-align: right; margin-top: 4px; }',
			'.sb-ip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }',
			'.sb-ip-box { background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center; }',
			'.sb-ip-icon { font-size: 24px; margin-bottom: 8px; }',
			'.sb-ip-label { font-size: 12px; color: #888; margin-bottom: 4px; }',
			'.sb-ip-value { font-family: monospace; font-size: 13px; word-break: break-all; }',
			'.sb-table { width: 100%; border-collapse: collapse; }',
			'.sb-table th, .sb-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }',
			'.sb-table th { background: #f8f9fa; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #666; }',
			'.sb-table tbody tr:hover { background: #f8f9fa; }',
			'.sb-mod-icon { margin-right: 8px; }',
			'.sb-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; color: #fff; font-size: 11px; font-weight: 600; }',
			'.sb-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }',
			'.sb-action-btn { display: flex; align-items: center; gap: 8px; padding: 12px; background: transparent; border: 1px solid; border-radius: 8px; cursor: pointer; font-size: 13px; transition: background 0.2s; }',
			'.sb-action-btn:hover { background: rgba(0,0,0,0.03); }',
			'.sb-alerts-list { display: flex; flex-direction: column; gap: 10px; }',
			'.sb-alert-item { padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid; }',
			'.sb-alert-time { font-size: 11px; color: #888; margin-bottom: 4px; }',
			'.sb-alert-source { font-size: 12px; color: #888; }',
			'.sb-empty { text-align: center; padding: 24px; color: #888; }',
			'.sb-empty span { font-size: 32px; display: block; margin-bottom: 8px; }',
			'@media (prefers-color-scheme: dark) {',
			'  .sb-dashboard { color: #e5e7eb; }',
			'  .sb-header, .sb-stat-card, .sb-panel { background: #1f2937; }',
			'  .sb-chip { background: #374151; border-color: #4b5563; }',
			'  .sb-chip-label, .sb-stat-label, .sb-subtitle { color: #9ca3af; }',
			'  .sb-table th { background: #374151; color: #9ca3af; }',
			'  .sb-table td { border-color: #374151; }',
			'  .sb-table tbody tr:hover { background: #374151; }',
			'  .sb-ip-box, .sb-alert-item { background: #374151; }',
			'  .sb-bar { background: #374151; }',
			'  .sb-action-btn:hover { background: rgba(255,255,255,0.05); }',
			'}'
		].join('\n');
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
