'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require secubox/kiss-theme';

/**
 * SecuBox Dashboard - KissTheme Edition
 * Dark themed dashboard using CrowdSec colorsets
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

function fmt(n) {
	n = parseInt(n) || 0;
	if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
	if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
	return String(n);
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

	renderStats: function() {
		var c = KissTheme.colors;
		var d = this.data.dashboard || {};
		var counts = d.counts || {};
		var modules = this.data.modules || [];
		var health = this.data.health || {};
		var score = (health.overall && health.overall.score) || health.score || 0;
		var alertCount = (this.data.alerts || []).length;
		var running = modules.filter(function(m) { return m.status === 'active' || m.running; }).length;
		var installed = modules.filter(function(m) { return m.installed || m.enabled; }).length;

		var stats = [
			{ label: 'Modules', value: counts.total || modules.length, color: c.blue },
			{ label: 'Installed', value: counts.installed || installed, color: c.purple },
			{ label: 'Active', value: counts.running || running, color: running > 0 ? c.green : c.muted },
			{ label: 'Health', value: score + '%', color: score >= 80 ? c.green : score >= 60 ? c.blue : score >= 40 ? c.orange : c.red },
			{ label: 'Alerts', value: alertCount, color: alertCount > 0 ? c.orange : c.muted }
		];

		return stats.map(function(st) {
			return KissTheme.stat(st.value, st.label, st.color);
		});
	},

	renderHealthMetrics: function() {
		var c = KissTheme.colors;
		var health = this.data.health || {};
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		var cpuLoad = cpu.load_1min || cpu.load_1m || '0.00';
		if (cpu.load && typeof cpu.load === 'string') {
			cpuLoad = cpu.load.split(' ')[0] || '0.00';
		}

		var metrics = [
			{
				id: 'cpu',
				label: 'CPU',
				percent: cpu.percent || cpu.usage_percent || cpu.usage || 0,
				detail: 'Load: ' + cpuLoad
			},
			{
				id: 'memory',
				label: 'Memory',
				percent: memory.percent || memory.usage_percent || memory.usage || 0,
				detail: formatBytes((memory.used_kb || 0) * 1024) + ' / ' + formatBytes((memory.total_kb || 0) * 1024)
			},
			{
				id: 'disk',
				label: 'Storage',
				percent: disk.percent || disk.usage_percent || disk.usage || 0,
				detail: formatBytes((disk.used_kb || 0) * 1024) + ' / ' + formatBytes((disk.total_kb || 0) * 1024)
			},
			{
				id: 'network',
				label: 'Network',
				percent: network.wan_up ? 100 : 0,
				detail: network.wan_up ? 'WAN Online' : 'WAN Offline'
			}
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, metrics.map(function(m) {
			var pct = Math.min(100, Math.max(0, m.percent));
			var barColor = pct >= 90 ? c.red : pct >= 70 ? c.orange : c.green;

			return E('div', {}, [
				E('div', { 'style': 'display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;' }, [
					E('span', { 'style': 'color: var(--kiss-text);' }, m.label),
					E('span', { 'style': 'color: var(--kiss-muted);', 'data-stat': m.id + '-detail' }, m.detail)
				]),
				E('div', { 'style': 'height: 8px; background: var(--kiss-line); border-radius: 4px; overflow: hidden;' }, [
					E('div', {
						'data-stat': m.id + '-bar',
						'style': 'height: 100%; width: ' + pct + '%; background: ' + barColor + '; border-radius: 4px; transition: width 0.3s;'
					})
				]),
				E('div', { 'style': 'text-align: right; font-size: 11px; color: var(--kiss-muted); margin-top: 4px;', 'data-stat': m.id + '-pct' }, pct + '%')
			]);
		}));
	},

	renderNetworkAddresses: function() {
		var c = KissTheme.colors;
		var ips = this.data.publicIPs || {};

		var addresses = [
			{ label: 'LAN', value: ips.lan_ipv4 || 'N/A', available: ips.lan_available },
			{ label: 'BR-WAN', value: ips.wan_ipv4 || 'N/A', available: ips.wan_available },
			{ label: 'Public IPv4', value: ips.public_ipv4 || 'N/A', available: ips.ipv4_available },
			{ label: 'Public IPv6', value: ips.public_ipv6 || 'N/A', available: ips.ipv6_available }
		];

		return E('div', { 'style': 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;' }, addresses.map(function(addr) {
			var displayValue = addr.value.length > 20 ? addr.value.substring(0, 17) + '...' : addr.value;
			return E('div', { 'style': 'background: var(--kiss-bg2); padding: 12px; border-radius: 8px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;' }, addr.label),
				E('div', {
					'style': 'font-family: monospace; font-size: 12px; color: ' + (addr.available ? c.cyan : c.muted) + ';',
					'title': addr.value,
					'data-stat': addr.label.toLowerCase().replace(/\s+/g, '-')
				}, displayValue)
			]);
		}));
	},

	renderModulesTable: function() {
		var c = KissTheme.colors;
		var modules = this.data.modules || [];
		var topModules = modules.slice(0, 8);

		if (topModules.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No modules found');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Module'),
				E('th', {}, 'Category'),
				E('th', {}, 'Status'),
				E('th', {}, 'Version')
			])),
			E('tbody', {}, topModules.map(function(mod) {
				var status = mod.status || 'unknown';
				var isActive = status === 'active' || mod.running;
				return E('tr', {}, [
					E('td', {}, [
						E('span', { 'style': 'margin-right: 8px;' }, mod.icon || '\u{1F4E6}'),
						mod.name || mod.id
					]),
					E('td', { 'style': 'color: var(--kiss-muted);' }, mod.category || '-'),
					E('td', {}, KissTheme.badge(isActive ? 'Active' : 'Inactive', isActive ? 'green' : 'red')),
					E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, mod.version || '-')
				]);
			}))
		]);
	},

	renderQuickActions: function() {
		var self = this;
		var c = KissTheme.colors;
		var actions = [
			{ id: 'restart_services', label: 'Restart Services', color: c.orange },
			{ id: 'update_packages', label: 'Update Packages', color: c.blue },
			{ id: 'view_logs', label: 'View Logs', color: c.purple },
			{ id: 'export_config', label: 'Export Config', color: c.green }
		];

		return E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px;' }, actions.map(function(action) {
			return E('button', {
				'class': 'kiss-btn',
				'style': 'border-color: ' + action.color + '; color: ' + action.color + ';',
				'click': function() { self.runAction(action.id); }
			}, action.label);
		}));
	},

	renderAlerts: function() {
		var c = KissTheme.colors;
		var alerts = (this.data.alerts || []).slice(0, 5);

		if (alerts.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, '\u{1F389}'),
				E('div', {}, 'No alerts in the last 24 hours')
			]);
		}

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 10px;' }, alerts.map(function(alert) {
			var sev = (alert.severity || 'info').toLowerCase();
			var color = sev === 'critical' ? c.red : sev === 'warning' ? c.orange : c.blue;
			return E('div', { 'style': 'padding: 12px; background: var(--kiss-bg2); border-radius: 6px; border-left: 3px solid ' + color + ';' }, [
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;' }, alert.timestamp || alert.time || ''),
				E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, [
					E('strong', {}, alert.title || alert.message || 'Alert'),
					alert.source ? E('span', { 'style': 'color: var(--kiss-muted); margin-left: 8px;' }, '\u2022 ' + alert.source) : ''
				])
			]);
		}));
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
		var c = KissTheme.colors;
		var d = this.data.dashboard || {};
		var status = d.status || {};
		var health = this.data.health || {};
		var score = (health.overall && health.overall.score) || health.score || 0;
		var modules = this.data.modules || [];
		var running = modules.filter(function(m) { return m.status === 'active' || m.running; }).length;

		// Start polling for live updates
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

		var content = [
			// Header with status
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px; flex-wrap: wrap;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'SecuBox Control Center'),
					KissTheme.badge('v' + (status.version || '0.0.0'), 'blue'),
					KissTheme.badge(running + '/' + modules.length + ' Active', running > 0 ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Security \u00B7 Network \u00B7 System automation')
			]),

			// Stats row
			E('div', { 'class': 'kiss-grid kiss-grid-5', 'style': 'margin-bottom: 20px;' }, this.renderStats()),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Left column
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 20px;' }, [
					// Modules panel with link
					KissTheme.card(E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Modules Overview'),
						E('a', {
							'href': L.url('admin/secubox/modules'),
							'style': 'font-size: 12px; color: var(--kiss-blue); text-decoration: none;'
						}, 'View All \u2192')
					]), this.renderModulesTable()),

					// System Health
					KissTheme.card('System Health', this.renderHealthMetrics())
				]),

				// Right column
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 20px;' }, [
					// Network Addresses
					KissTheme.card('Network Addresses', this.renderNetworkAddresses()),

					// Quick Actions
					KissTheme.card('Quick Actions', this.renderQuickActions()),

					// Alerts
					KissTheme.card('Alert Timeline', E('div', { 'id': 'secubox-alerts' }, this.renderAlerts()))
				])
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/dashboard');
	},

	updateLiveData: function() {
		var c = KissTheme.colors;
		var health = this.data.health || {};
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		var cpuLoad = cpu.load_1min || cpu.load_1m || '0.00';
		if (cpu.load && typeof cpu.load === 'string') {
			cpuLoad = cpu.load.split(' ')[0] || '0.00';
		}

		var metrics = {
			cpu: { pct: cpu.percent || cpu.usage_percent || cpu.usage || 0, detail: 'Load: ' + cpuLoad },
			memory: { pct: memory.percent || memory.usage_percent || memory.usage || 0, detail: formatBytes((memory.used_kb || 0) * 1024) + ' / ' + formatBytes((memory.total_kb || 0) * 1024) },
			disk: { pct: disk.percent || disk.usage_percent || disk.usage || 0, detail: formatBytes((disk.used_kb || 0) * 1024) + ' / ' + formatBytes((disk.total_kb || 0) * 1024) },
			network: { pct: network.wan_up ? 100 : 0, detail: network.wan_up ? 'WAN Online' : 'WAN Offline' }
		};

		Object.keys(metrics).forEach(function(key) {
			var m = metrics[key];
			var barColor = m.pct >= 90 ? c.red : m.pct >= 70 ? c.orange : c.green;
			var bar = document.querySelector('[data-stat="' + key + '-bar"]');
			var pct = document.querySelector('[data-stat="' + key + '-pct"]');
			var detail = document.querySelector('[data-stat="' + key + '-detail"]');
			if (bar) {
				bar.style.width = m.pct + '%';
				bar.style.background = barColor;
			}
			if (pct) pct.textContent = m.pct + '%';
			if (detail) detail.textContent = m.detail;
		});

		// Update alerts panel
		var alertsEl = document.getElementById('secubox-alerts');
		if (alertsEl) {
			alertsEl.innerHTML = '';
			alertsEl.appendChild(this.renderAlerts());
		}
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
