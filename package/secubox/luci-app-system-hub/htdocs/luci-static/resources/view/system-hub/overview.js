'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.system-hub',
	method: 'status',
	expect: {}
});

var callHealth = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_health',
	expect: {}
});

var callServices = rpc.declare({
	object: 'luci.system-hub',
	method: 'list_services',
	expect: {}
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	return d + 'd ' + h + 'h ' + m + 'm';
}

function getHealthColor(percent) {
	if (percent >= 80) return '#e74c3c';
	if (percent >= 60) return '#f39c12';
	return '#27ae60';
}

function getScoreColor(score) {
	if (score >= 80) return '#27ae60';
	if (score >= 60) return '#3498db';
	if (score >= 40) return '#f39c12';
	return '#e74c3c';
}

// Helper to extract health metrics from either get_health or status format
function extractHealth(health, status) {
	var h = health || {};
	var s = status || {};
	var sh = s.health || {};

	return {
		cpuLoad: (h.cpu && h.cpu.load_1m) || sh.cpu_load || '0.00',
		cpuUsage: (h.cpu && h.cpu.usage) || 0,
		memPercent: (h.memory && h.memory.usage) || sh.mem_percent || 0,
		memUsedKb: (h.memory && h.memory.used_kb) || sh.mem_used_kb || 0,
		memTotalKb: (h.memory && h.memory.total_kb) || sh.mem_total_kb || 0,
		diskPercent: (h.disk && h.disk.usage) || s.disk_percent || 0,
		temperature: (h.temperature && h.temperature.value) || 0,
		score: h.score || 0
	};
}

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callHealth().catch(function() { return {}; }),
			callServices().catch(function() { return { services: [] }; })
		]);
	},

	renderStatusCards: function(status, health) {
		var uptime = formatUptime(status.uptime || 0);
		var hostname = status.hostname || 'SecuBox';
		var model = status.model || 'Unknown';
		var metrics = extractHealth(health, status);
		var serviceCount = status.service_count || 0;

		return E('div', { 'class': 'sh-cards' }, [
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-icon', 'style': 'background:#3498db' }, '\uD83D\uDDA5'),
				E('div', { 'class': 'sh-card-content' }, [
					E('div', { 'class': 'sh-card-value', 'data-stat': 'hostname' }, hostname),
					E('div', { 'class': 'sh-card-label' }, model)
				])
			]),
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-icon', 'style': 'background:#27ae60' }, '\u23F1'),
				E('div', { 'class': 'sh-card-content' }, [
					E('div', { 'class': 'sh-card-value', 'data-stat': 'uptime' }, uptime),
					E('div', { 'class': 'sh-card-label' }, 'Uptime')
				])
			]),
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-icon', 'style': 'background:#9b59b6' }, '\uD83D\uDD27'),
				E('div', { 'class': 'sh-card-content' }, [
					E('div', { 'class': 'sh-card-value', 'data-stat': 'services' }, String(serviceCount)),
					E('div', { 'class': 'sh-card-label' }, 'Services')
				])
			]),
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-icon', 'style': 'background:#e74c3c' }, '\uD83D\uDD25'),
				E('div', { 'class': 'sh-card-content' }, [
					E('div', { 'class': 'sh-card-value', 'data-stat': 'cpu' }, metrics.cpuLoad),
					E('div', { 'class': 'sh-card-label' }, 'CPU Load')
				])
			]),
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-icon', 'style': 'background:#f39c12' }, '\uD83C\uDF21'),
				E('div', { 'class': 'sh-card-content' }, [
					E('div', { 'class': 'sh-card-value', 'data-stat': 'temp' }, metrics.temperature + '\u00B0C'),
					E('div', { 'class': 'sh-card-label' }, 'Temperature')
				])
			]),
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-icon', 'data-stat': 'score-icon', 'style': 'background:' + getScoreColor(metrics.score) }, '\u2764'),
				E('div', { 'class': 'sh-card-content' }, [
					E('div', { 'class': 'sh-card-value', 'data-stat': 'score' }, metrics.score),
					E('div', { 'class': 'sh-card-label' }, 'Health Score')
				])
			])
		]);
	},

	renderResourceBars: function(health, status) {
		var metrics = extractHealth(health, status);
		var memUsed = metrics.memUsedKb * 1024;
		var memTotal = metrics.memTotalKb * 1024;

		var resources = [
			{
				id: 'memory',
				label: 'Memory',
				percent: metrics.memPercent,
				detail: formatBytes(memUsed) + ' / ' + formatBytes(memTotal),
				icon: '\uD83D\uDCBE'
			},
			{
				id: 'disk',
				label: 'Storage',
				percent: metrics.diskPercent,
				detail: metrics.diskPercent + '% used',
				icon: '\uD83D\uDCBF'
			},
			{
				id: 'cpu',
				label: 'CPU Usage',
				percent: metrics.cpuUsage,
				detail: metrics.cpuUsage + '% active',
				icon: '\u2699'
			}
		];

		return E('div', { 'class': 'sh-section' }, [
			E('h3', {}, 'Resource Usage'),
			E('div', { 'class': 'sh-resources' },
				resources.map(function(r) {
					return E('div', { 'class': 'sh-resource' }, [
						E('div', { 'class': 'sh-resource-header' }, [
							E('span', {}, r.icon + ' ' + r.label),
							E('span', { 'data-stat': r.id + '-detail' }, r.detail)
						]),
						E('div', { 'class': 'sh-resource-bar' }, [
							E('div', {
								'class': 'sh-resource-fill',
								'data-stat': r.id + '-bar',
								'style': 'width:' + r.percent + '%;background:' + getHealthColor(r.percent)
							})
						]),
						E('div', { 'class': 'sh-resource-percent', 'data-stat': r.id + '-percent' }, r.percent + '%')
					]);
				})
			)
		]);
	},

	renderQuickActions: function() {
		return E('div', { 'class': 'sh-section' }, [
			E('h3', {}, '⚡ Quick Actions'),
			E('div', { 'class': 'sh-actions' }, [
				E('button', {
					'class': 'kiss-btn',
					'click': function() { window.location.href = L.url('admin/system/system'); }
				}, '⚙️ System Settings'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { window.location.href = L.url('admin/system/reboot'); }
				}, '🔄 Reboot'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { window.location.href = L.url('admin/system/flash'); }
				}, '📦 Backup/Flash'),
				E('a', {
					'href': L.url('admin/secubox/system/system-hub/health'),
					'class': 'kiss-btn',
					'style': 'text-decoration: none;'
				}, '❤️ Health Check')
			])
		]);
	},

	renderServicesTable: function(services) {
		var serviceList = (services && services.services) || [];
		var running = serviceList.filter(function(s) { return s.running; }).length;
		var total = serviceList.length;

		var topServices = serviceList.slice(0, 10);

		var rows = topServices.map(function(svc) {
			return E('tr', {}, [
				E('td', {}, svc.name || '-'),
				E('td', {}, E('span', {
					'class': 'sh-status-badge',
					'style': 'background:' + (svc.running ? '#27ae60' : '#e74c3c')
				}, svc.running ? 'Running' : 'Stopped')),
				E('td', {}, svc.enabled ? '\u2713' : '\u2717')
			]);
		});

		if (rows.length === 0) {
			rows.push(E('tr', {}, [
				E('td', { 'colspan': '3', 'style': 'text-align:center;color:#999' }, 'No services found')
			]));
		}

		return E('div', { 'class': 'sh-section' }, [
			E('h3', {}, 'Services (' + running + '/' + total + ' running)'),
			E('table', { 'class': 'table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Service'),
					E('th', {}, 'Status'),
					E('th', {}, 'Enabled')
				])),
				E('tbody', {}, rows)
			])
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var health = data[1] || {};
		var services = data[2] || {};

		var self = this;

		// Start polling for live updates
		poll.add(function() {
			return Promise.all([callStatus(), callHealth().catch(function() { return {}; })]).then(function(results) {
				var s = results[0] || {};
				var h = results[1] || {};
				var m = extractHealth(h, s);

				// Update cards
				var uptimeEl = document.querySelector('[data-stat="uptime"]');
				var cpuEl = document.querySelector('[data-stat="cpu"]');
				var servicesEl = document.querySelector('[data-stat="services"]');
				var tempEl = document.querySelector('[data-stat="temp"]');
				var scoreEl = document.querySelector('[data-stat="score"]');
				var scoreIcon = document.querySelector('[data-stat="score-icon"]');

				if (uptimeEl) uptimeEl.textContent = formatUptime(s.uptime || 0);
				if (cpuEl) cpuEl.textContent = m.cpuLoad;
				if (servicesEl) servicesEl.textContent = String(s.service_count || 0);
				if (tempEl) tempEl.textContent = m.temperature + '\u00B0C';
				if (scoreEl) scoreEl.textContent = m.score;
				if (scoreIcon) scoreIcon.style.background = getScoreColor(m.score);

				// Update resource bars
				var memUsed = m.memUsedKb * 1024;
				var memTotal = m.memTotalKb * 1024;

				var memBar = document.querySelector('[data-stat="memory-bar"]');
				var memPercentEl = document.querySelector('[data-stat="memory-percent"]');
				var memDetail = document.querySelector('[data-stat="memory-detail"]');
				var diskBar = document.querySelector('[data-stat="disk-bar"]');
				var diskPercentEl = document.querySelector('[data-stat="disk-percent"]');
				var diskDetail = document.querySelector('[data-stat="disk-detail"]');
				var cpuBar = document.querySelector('[data-stat="cpu-bar"]');
				var cpuPercentEl = document.querySelector('[data-stat="cpu-percent"]');
				var cpuDetail = document.querySelector('[data-stat="cpu-detail"]');

				if (memBar) {
					memBar.style.width = m.memPercent + '%';
					memBar.style.background = getHealthColor(m.memPercent);
				}
				if (memPercentEl) memPercentEl.textContent = m.memPercent + '%';
				if (memDetail) memDetail.textContent = formatBytes(memUsed) + ' / ' + formatBytes(memTotal);
				if (diskBar) {
					diskBar.style.width = m.diskPercent + '%';
					diskBar.style.background = getHealthColor(m.diskPercent);
				}
				if (diskPercentEl) diskPercentEl.textContent = m.diskPercent + '%';
				if (diskDetail) diskDetail.textContent = m.diskPercent + '% used';
				if (cpuBar) {
					cpuBar.style.width = m.cpuUsage + '%';
					cpuBar.style.background = getHealthColor(m.cpuUsage);
				}
				if (cpuPercentEl) cpuPercentEl.textContent = m.cpuUsage + '%';
				if (cpuDetail) cpuDetail.textContent = m.cpuUsage + '% active';
			});
		}, 5);

		// Additional KISS-compatible styles
		var extraStyles = `
.sh-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
.sh-card { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 12px; }
.sh-card-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; flex-shrink: 0; }
.sh-card-value { font-size: 18px; font-weight: 700; color: var(--kiss-text); }
.sh-card-label { font-size: 11px; color: var(--kiss-muted); }
.sh-section { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 20px; }
.sh-section h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: var(--kiss-text); }
.sh-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.sh-resources { display: flex; flex-direction: column; gap: 16px; }
.sh-resource-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: var(--kiss-muted); }
.sh-resource-bar { height: 10px; background: rgba(255,255,255,0.06); border-radius: 5px; overflow: hidden; }
.sh-resource-fill { height: 100%; transition: width 0.3s, background 0.3s; border-radius: 5px; }
.sh-resource-percent { font-size: 11px; color: var(--kiss-muted); margin-top: 4px; text-align: right; }
.sh-status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; color: #fff; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }
`;
		// Inject extra styles
		if (!document.querySelector('#sh-kiss-extra')) {
			var style = document.createElement('style');
			style.id = 'sh-kiss-extra';
			style.textContent = extraStyles;
			document.head.appendChild(style);
		}

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0 0 8px 0;' }, '📊 System Hub'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'Unified system monitoring and management dashboard')
			]),

			// Status Cards
			this.renderStatusCards(status, health),

			// Two column grid
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-bottom: 20px;' }, [
				this.renderResourceBars(health, status),
				this.renderQuickActions()
			]),

			// Services Table
			this.renderServicesTable(services)
		];

		return KissTheme.wrap(content, 'admin/secubox/system/system-hub');
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
