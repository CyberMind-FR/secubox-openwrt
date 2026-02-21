'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

/**
 * SecuBox Monitoring - KISS Edition
 * Live system telemetry with inline CSS
 */

var callSystemHealth = rpc.declare({
	object: 'luci.secubox',
	method: 'get_system_health',
	expect: {}
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
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

return view.extend({
	health: {},
	history: { cpu: [], memory: [], disk: [], load: [] },
	maxPoints: 60,

	load: function() {
		var self = this;
		return callSystemHealth().then(function(data) {
			self.health = data || {};
			self.addDataPoint();
			return self.health;
		}).catch(function() { return {}; });
	},

	addDataPoint: function() {
		var h = this.health;
		var cpu = h.cpu || {};
		var memory = h.memory || {};
		var disk = h.disk || {};
		var now = Date.now();

		var cpuPct = cpu.usage_percent || cpu.percent || cpu.usage || 0;
		var memPct = memory.usage_percent || memory.percent || memory.usage || 0;
		var diskPct = disk.usage_percent || disk.percent || disk.usage || 0;

		var loadStr = cpu.load || h.load || '0';
		var loadAvg = Array.isArray(loadStr) ? loadStr[0] : (typeof loadStr === 'string' ? parseFloat(loadStr.split(' ')[0]) : loadStr);
		var cores = cpu.count || 4;
		var loadPct = Math.min(100, (parseFloat(loadAvg) / cores) * 100);

		this.history.cpu.push({ time: now, value: cpuPct });
		this.history.memory.push({ time: now, value: memPct });
		this.history.disk.push({ time: now, value: diskPct });
		this.history.load.push({ time: now, value: loadPct, raw: loadAvg });

		var self = this;
		['cpu', 'memory', 'disk', 'load'].forEach(function(k) {
			if (self.history[k].length > self.maxPoints) self.history[k].shift();
		});
	},

	render: function() {
		var self = this;

		poll.add(function() {
			return callSystemHealth().then(function(data) {
				self.health = data || {};
				self.addDataPoint();
				self.updateDisplay();
			});
		}, 5);

		var content = E('div', { 'class': 'sb-monitoring' }, [
			E('style', {}, this.getStyles()),
			this.renderHeader(),
			this.renderStatsGrid(),
			this.renderChartsGrid()
		]);

		return KissTheme.wrap(content, 'admin/secubox/monitoring');
	},

	renderHeader: function() {
		var h = this.health;
		var cpu = h.cpu || {};
		var memory = h.memory || {};
		var disk = h.disk || {};

		var cpuPct = cpu.usage_percent || cpu.percent || 0;
		var memPct = memory.usage_percent || memory.percent || 0;
		var diskPct = disk.usage_percent || disk.percent || 0;
		var uptime = h.uptime || 0;

		var chips = [
			{ icon: '🔥', label: 'CPU', value: cpuPct.toFixed(1) + '%', color: getBarColor(cpuPct) },
			{ icon: '💾', label: 'Memory', value: memPct.toFixed(1) + '%', color: getBarColor(memPct) },
			{ icon: '💿', label: 'Disk', value: diskPct.toFixed(1) + '%', color: getBarColor(diskPct) },
			{ icon: '⏱', label: 'Uptime', value: formatUptime(uptime) }
		];

		return E('div', { 'class': 'sb-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sb-title' }, '📡 System Monitoring'),
				E('p', { 'class': 'sb-subtitle' }, 'Live telemetry · 5s refresh')
			]),
			E('div', { 'class': 'sb-chips' }, chips.map(function(c) {
				return E('div', { 'class': 'sb-chip', 'data-chip': c.label.toLowerCase() }, [
					E('span', { 'class': 'sb-chip-icon' }, c.icon),
					E('div', {}, [
						E('span', { 'class': 'sb-chip-label' }, c.label),
						E('strong', { 'style': c.color ? 'color:' + c.color : '' }, c.value)
					])
				]);
			}))
		]);
	},

	renderStatsGrid: function() {
		var h = this.health;
		var cpu = h.cpu || {};
		var memory = h.memory || {};
		var disk = h.disk || {};
		var network = h.network || {};

		var loadStr = cpu.load || h.load || '0';
		var load = Array.isArray(loadStr) ? loadStr[0] : (typeof loadStr === 'string' ? loadStr.split(' ')[0] : loadStr);

		var stats = [
			{ icon: '⚡', label: 'CPU Usage', value: (cpu.usage_percent || cpu.percent || 0).toFixed(1) + '%', id: 'cpu' },
			{ icon: '💾', label: 'Memory Usage', value: (memory.usage_percent || memory.percent || 0).toFixed(1) + '%', id: 'memory' },
			{ icon: '💿', label: 'Disk Usage', value: (disk.usage_percent || disk.percent || 0).toFixed(1) + '%', id: 'disk' },
			{ icon: '📈', label: 'Load (1m)', value: load, id: 'load' },
			{ icon: '🌐', label: 'Network', value: network.wan_up ? 'Online' : 'Offline', id: 'network' },
			{ icon: '🕒', label: 'Data Points', value: this.history.cpu.length + '/' + this.maxPoints, id: 'points' }
		];

		return E('div', { 'class': 'sb-stats-grid' }, stats.map(function(s) {
			return E('div', { 'class': 'sb-stat-card' }, [
				E('span', { 'class': 'sb-stat-icon' }, s.icon),
				E('div', {}, [
					E('div', { 'class': 'sb-stat-value', 'data-stat': s.id }, s.value),
					E('div', { 'class': 'sb-stat-label' }, s.label)
				])
			]);
		}));
	},

	renderChartsGrid: function() {
		var charts = [
			{ id: 'cpu', label: 'CPU Usage', color: '#6366f1' },
			{ id: 'memory', label: 'Memory Usage', color: '#22c55e' },
			{ id: 'disk', label: 'Disk Usage', color: '#f59e0b' },
			{ id: 'load', label: 'System Load', color: '#ec4899' }
		];

		return E('div', { 'class': 'sb-charts-grid' }, charts.map(function(c) {
			return E('div', { 'class': 'sb-chart-card' }, [
				E('h4', {}, c.label),
				E('div', { 'class': 'sb-chart-container' }, [
					E('svg', {
						'id': 'chart-' + c.id,
						'class': 'sb-chart',
						'viewBox': '0 0 600 150',
						'preserveAspectRatio': 'none'
					})
				]),
				E('div', { 'class': 'sb-chart-footer' }, [
					E('span', { 'id': 'current-' + c.id }, '—'),
					E('span', { 'class': 'sb-chart-status' }, 'Live')
				])
			]);
		}));
	},

	updateDisplay: function() {
		this.updateHeaderChips();
		this.updateStatsGrid();
		this.updateCharts();
	},

	updateHeaderChips: function() {
		var h = this.health;
		var cpu = h.cpu || {};
		var memory = h.memory || {};
		var disk = h.disk || {};

		var updates = {
			'cpu': { value: (cpu.usage_percent || cpu.percent || 0).toFixed(1) + '%', color: getBarColor(cpu.usage_percent || 0) },
			'memory': { value: (memory.usage_percent || memory.percent || 0).toFixed(1) + '%', color: getBarColor(memory.usage_percent || 0) },
			'disk': { value: (disk.usage_percent || disk.percent || 0).toFixed(1) + '%', color: getBarColor(disk.usage_percent || 0) },
			'uptime': { value: formatUptime(h.uptime || 0) }
		};

		Object.keys(updates).forEach(function(key) {
			var chip = document.querySelector('[data-chip="' + key + '"] strong');
			if (chip) {
				chip.textContent = updates[key].value;
				if (updates[key].color) chip.style.color = updates[key].color;
			}
		});
	},

	updateStatsGrid: function() {
		var h = this.health;
		var cpu = h.cpu || {};
		var memory = h.memory || {};
		var disk = h.disk || {};
		var network = h.network || {};

		var loadStr = cpu.load || h.load || '0';
		var load = Array.isArray(loadStr) ? loadStr[0] : (typeof loadStr === 'string' ? loadStr.split(' ')[0] : loadStr);

		var updates = {
			'cpu': (cpu.usage_percent || cpu.percent || 0).toFixed(1) + '%',
			'memory': (memory.usage_percent || memory.percent || 0).toFixed(1) + '%',
			'disk': (disk.usage_percent || disk.percent || 0).toFixed(1) + '%',
			'load': load,
			'network': network.wan_up ? 'Online' : 'Offline',
			'points': this.history.cpu.length + '/' + this.maxPoints
		};

		Object.keys(updates).forEach(function(key) {
			var el = document.querySelector('[data-stat="' + key + '"]');
			if (el) el.textContent = updates[key];
		});
	},

	updateCharts: function() {
		var self = this;
		var charts = [
			{ id: 'cpu', data: this.history.cpu, color: '#6366f1' },
			{ id: 'memory', data: this.history.memory, color: '#22c55e' },
			{ id: 'disk', data: this.history.disk, color: '#f59e0b' },
			{ id: 'load', data: this.history.load, color: '#ec4899' }
		];

		charts.forEach(function(c) {
			self.drawChart(c.id, c.data, c.color);
		});
	},

	drawChart: function(id, data, color) {
		var svg = document.getElementById('chart-' + id);
		var currentEl = document.getElementById('current-' + id);
		if (!svg || data.length === 0) return;

		var width = 600, height = 150, padding = 10;
		var values = data.map(function(d) { return d.value; });
		var maxVal = Math.max(100, Math.max.apply(Math, values));

		var points = data.map(function(p, i) {
			var x = padding + (width - 2 * padding) * (i / Math.max(1, this.maxPoints - 1));
			var y = height - padding - ((p.value / maxVal) * (height - 2 * padding));
			return x + ',' + y;
		}, this).join(' ');

		svg.innerHTML = '';
		var polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		polyline.setAttribute('points', points);
		polyline.setAttribute('fill', 'none');
		polyline.setAttribute('stroke', color);
		polyline.setAttribute('stroke-width', '2');
		polyline.setAttribute('stroke-linejoin', 'round');
		polyline.setAttribute('stroke-linecap', 'round');
		svg.appendChild(polyline);

		if (currentEl) {
			var last = data[data.length - 1];
			currentEl.textContent = id === 'load' ? (last.raw || '0.00') : last.value.toFixed(1) + '%';
		}
	},

	getStyles: function() {
		return `
.sb-monitoring { max-width: 1400px; margin: 0 auto; padding: 20px; }
.sb-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-title { margin: 0; font-size: 24px; font-weight: 700; }
.sb-subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
.sb-chips { display: flex; gap: 12px; flex-wrap: wrap; }
.sb-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; }
.sb-chip-icon { font-size: 18px; }
.sb-chip-label { font-size: 11px; color: #666; display: block; }
.sb-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; }
.sb-stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-stat-icon { font-size: 24px; }
.sb-stat-value { font-size: 18px; font-weight: 700; }
.sb-stat-label { font-size: 12px; color: #666; }
.sb-charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.sb-chart-card { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-chart-card h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
.sb-chart-container { height: 120px; background: #f8f9fa; border-radius: 8px; overflow: hidden; }
.sb-chart { width: 100%; height: 100%; }
.sb-chart-footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; }
.sb-chart-status { color: #22c55e; font-weight: 500; }
@media (prefers-color-scheme: dark) {
  .sb-monitoring { color: #e5e7eb; }
  .sb-header, .sb-stat-card, .sb-chart-card { background: #1f2937; }
  .sb-chip { background: #374151; border-color: #4b5563; }
  .sb-chip-label, .sb-subtitle, .sb-stat-label { color: #9ca3af; }
  .sb-chart-container { background: #374151; }
}
`;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
