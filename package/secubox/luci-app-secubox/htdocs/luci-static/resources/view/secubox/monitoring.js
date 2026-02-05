'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';
'require secubox-portal/header as SbHeader';

// Load theme resources
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/themes/cyberpunk.css')
}));

// Respect LuCI language/theme preferences
var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

return view.extend({
	cpuHistory: [],
	memoryHistory: [],
	diskHistory: [],
	loadHistory: [],
	networkHistory: [],
	maxDataPoints: 60,
	latestHealth: {},

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return API.getSystemHealth().then(function(data) {
			var health = data || {};
			self.latestHealth = health;
			self.addDataPoint(health);
			return health;
		});
	},

	addDataPoint: function(health) {
		var timestamp = Date.now();

		// API returns usage_percent, not percent
		this.cpuHistory.push({ time: timestamp, value: (health.cpu && (health.cpu.usage_percent || health.cpu.percent)) || 0 });
		this.memoryHistory.push({ time: timestamp, value: (health.memory && (health.memory.usage_percent || health.memory.percent)) || 0 });
		this.diskHistory.push({ time: timestamp, value: (health.disk && (health.disk.usage_percent || health.disk.percent)) || 0 });

		// System load - parse from string "2.14 1.86 1.70" or array, scale to percentage (assume 4 cores = 400% max)
		var loadStr = (health.cpu && health.cpu.load) || (health.load && (Array.isArray(health.load) ? health.load[0] : health.load)) || '0';
		var loadAvg = Array.isArray(loadStr) ? loadStr[0] : (typeof loadStr === 'string' ? parseFloat(loadStr.split(' ')[0]) : loadStr);
		var numCores = (health.cpu && health.cpu.count) || 4;
		var loadPercent = Math.min(100, (parseFloat(loadAvg) / numCores) * 100);
		this.loadHistory.push({ time: timestamp, value: loadPercent, raw: loadAvg });

		var netRx = (health.network && health.network.rx_bytes) || 0;
		var netTx = (health.network && health.network.tx_bytes) || 0;
		this.networkHistory.push({ time: timestamp, rx: netRx, tx: netTx });

		['cpuHistory', 'memoryHistory', 'diskHistory', 'loadHistory', 'networkHistory'].forEach(function(key) {
			if (this[key].length > this.maxDataPoints)
				this[key].shift();
		}, this);
	},

	render: function() {
		var container = E('div', { 'class': 'secubox-monitoring-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/core/variables.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/monitoring.css') }),
			SecuNav.renderTabs('monitoring'),
			this.renderHeader(),
			this.renderCurrentStatsCard(),
			this.renderChartsGrid()
		]);

		this.updateCharts();
		this.updateCurrentStats();

		var self = this;
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateCharts();
				self.updateCurrentStats();
			});
		}, 5);

		this.hideLegacyTabMenu();

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	renderHeader: function() {
		var snapshot = this.getLatestSnapshot();
		var rates = this.getNetworkRateSummary();

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '📡'),
					_('SecuBox Monitoring')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Live telemetry for CPU, memory, storage, and network throughput'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderHeaderChip('cpu', '🔥', _('CPU'), snapshot.cpu.value.toFixed(1) + '%', snapshot.cpu.value),
				this.renderHeaderChip('memory', '💾', _('Memory'), snapshot.memory.value.toFixed(1) + '%', snapshot.memory.value),
				this.renderHeaderChip('disk', '💿', _('Disk'), snapshot.disk.value.toFixed(1) + '%', snapshot.disk.value),
				this.renderHeaderChip('uptime', '⏱', _('Uptime'), API.formatUptime(snapshot.uptime || 0)),
				this.renderHeaderChip('net', '🌐', _('Network'), rates.summary)
			])
		]);
	},

	renderHeaderChip: function(id, icon, label, value, percent) {
		return E('div', { 'class': 'sh-header-chip' }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', { 'id': 'secubox-monitoring-chip-' + id, 'style': (typeof percent === 'number') ? ('color:' + this.getColorForValue(percent)) : '' }, value)
			])
		]);
	},

	renderChartsGrid: function() {
		return E('section', { 'class': 'secubox-charts-grid' }, [
			this.renderChartCard('cpu', _('CPU Usage'), '%', '#6366f1'),
			this.renderChartCard('memory', _('Memory Usage'), '%', '#22c55e'),
			this.renderChartCard('disk', _('Disk Usage'), '%', '#f59e0b'),
			this.renderChartCard('load', _('System Load'), '', '#ec4899')
		]);
	},

	renderChartCard: function(type, title, unit, accent) {
		return E('div', { 'class': 'secubox-chart-card' }, [
			E('h3', { 'class': 'secubox-chart-title' }, title),
			E('div', { 'class': 'secubox-chart-container' }, [
				E('div', { 'id': 'chart-empty-' + type, 'class': 'secubox-chart-empty' }, [
					E('span', { 'class': 'secubox-chart-empty-icon' }, '📊'),
					E('span', { 'class': 'secubox-chart-empty-text' }, _('Collecting data...')),
					E('div', { 'class': 'secubox-chart-empty-progress' }, [
						E('span', { 'class': 'secubox-chart-empty-dot' }),
						E('span', { 'class': 'secubox-chart-empty-dot' }),
						E('span', { 'class': 'secubox-chart-empty-dot' })
					])
				]),
				E('svg', {
					'id': 'chart-' + type,
					'class': 'secubox-chart',
					'viewBox': '0 0 600 200',
					'preserveAspectRatio': 'none',
					'data-accent': accent
				})
			]),
			E('div', { 'class': 'secubox-chart-legend' }, [
				E('span', { 'id': 'current-' + type, 'class': 'secubox-current-value' }, '—'),
				E('span', { 'id': 'unit-' + type, 'class': 'secubox-chart-unit' }, _('Waiting'))
			])
		]);
	},

	renderCurrentStatsCard: function() {
		return E('section', { 'class': 'sb-card' }, [
			E('div', { 'class': 'sb-card-header' }, [
				E('h2', {}, _('Current Statistics')),
				E('p', { 'class': 'sb-card-subtitle' }, _('Real-time snapshot of key resources'))
			]),
			E('div', { 'id': 'current-stats', 'class': 'secubox-stats-table' }, this.renderStatsTable())
		]);
	},

	renderStatsTable: function() {
		var snapshot = this.getLatestSnapshot();
		var rates = this.getNetworkRateSummary();
		// Load from cpu.load string "2.14 1.86 1.70" or load array
		var loadStr = (this.latestHealth.cpu && this.latestHealth.cpu.load) ||
		              (this.latestHealth.load && (Array.isArray(this.latestHealth.load) ? this.latestHealth.load[0] : this.latestHealth.load)) || '0.00';
		var load = typeof loadStr === 'string' ? loadStr.split(' ')[0] : loadStr;

		var stats = [
			{ label: _('CPU Usage'), value: snapshot.cpu.value.toFixed(1) + '%', icon: '⚡' },
			{ label: _('Memory Usage'), value: snapshot.memory.value.toFixed(1) + '%', icon: '💾' },
			{ label: _('Disk Usage'), value: snapshot.disk.value.toFixed(1) + '%', icon: '💿' },
			{ label: _('System Load (1m)'), value: load, icon: '📈' },
			{ label: _('Network RX/TX'), value: rates.summary, icon: '🌐' },
			{ label: _('Data Window'), value: this.cpuHistory.length + ' / ' + this.maxDataPoints, icon: '🕒' }
		];

		return stats.map(function(stat) {
			return E('div', { 'class': 'secubox-stat-item' }, [
				E('span', { 'class': 'secubox-stat-icon' }, stat.icon),
				E('div', { 'class': 'secubox-stat-details' }, [
					E('div', { 'class': 'secubox-stat-label' }, stat.label),
					E('div', { 'class': 'secubox-stat-value' }, stat.value)
				])
			]);
		});
	},

	updateCharts: function() {
		this.drawChart('cpu', this.cpuHistory, '#6366f1');
		this.drawChart('memory', this.memoryHistory, '#22c55e');
		this.drawChart('disk', this.diskHistory, '#f59e0b');
		this.drawLoadChart();
	},

	drawChart: function(type, data, color) {
		var svg = document.getElementById('chart-' + type);
		var emptyEl = document.getElementById('chart-empty-' + type);
		var currentEl = document.getElementById('current-' + type);
		var unitEl = document.getElementById('unit-' + type);

		if (!svg || data.length === 0) {
			if (emptyEl) emptyEl.style.display = 'flex';
			return;
		}

		// Hide empty state, show chart
		if (emptyEl) emptyEl.style.display = 'none';
		if (unitEl) unitEl.textContent = _('Live');

		var width = 600;
		var height = 200;
		var padding = 12;

		var values = data.map(function(d) { return d.value; });
		var maxValue = Math.max(100, Math.max.apply(Math, values));
		var minValue = 0;
		var pathPoints = data.map(function(point, idx) {
			var x = padding + (width - 2 * padding) * (idx / Math.max(1, this.maxDataPoints - 1));
			var y = height - padding - ((point.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
			return x + ',' + y;
		}, this).join(' ');

		svg.innerHTML = '';

		svg.appendChild(E('polyline', {
			'points': pathPoints,
			'fill': 'none',
			'stroke': color,
			'stroke-width': '2',
			'stroke-linejoin': 'round',
			'stroke-linecap': 'round'
		}));

		if (currentEl) {
			currentEl.textContent = (data[data.length - 1].value || 0).toFixed(1) + '%';
		}
	},

	drawNetworkChart: function() {
		var svg = document.getElementById('chart-network');
		var currentEl = document.getElementById('current-network');
		if (!svg || this.networkHistory.length < 2)
			return;

		var width = 600;
		var height = 200;
		var padding = 12;
		var rates = this.networkHistory.slice(1).map(function(point, idx) {
			var prev = this.networkHistory[idx];
			var seconds = Math.max(1, (point.time - prev.time) / 1000);
			return {
				time: point.time,
				rx: Math.max(0, (point.rx - prev.rx) / seconds),
				tx: Math.max(0, (point.tx - prev.tx) / seconds)
			};
		}, this);

		var maxRate = Math.max(1024, Math.max.apply(Math, rates.map(function(r) {
			return Math.max(r.rx, r.tx);
		})));

		function buildPoints(fn) {
			return rates.map(function(point, idx) {
				var x = padding + (width - 2 * padding) * (idx / Math.max(1, rates.length - 1));
				var y = height - padding - (fn(point) / maxRate) * (height - 2 * padding);
				return x + ',' + y;
			}).join(' ');
		}

		svg.innerHTML = '';
		svg.appendChild(E('polyline', {
			'points': buildPoints(function(p) { return p.rx; }),
			'fill': 'none',
			'stroke': '#22c55e',
			'stroke-width': '2'
		}));
		svg.appendChild(E('polyline', {
			'points': buildPoints(function(p) { return p.tx; }),
			'fill': 'none',
			'stroke': '#3b82f6',
			'stroke-width': '2'
		}));

		if (currentEl) {
			var last = rates[rates.length - 1];
			currentEl.textContent = API.formatBits(last.rx + last.tx);
		}
	},

	drawLoadChart: function() {
		var svg = document.getElementById('chart-load');
		var emptyEl = document.getElementById('chart-empty-load');
		var currentEl = document.getElementById('current-load');
		var unitEl = document.getElementById('unit-load');

		if (!svg || this.loadHistory.length === 0) {
			if (emptyEl) emptyEl.style.display = 'flex';
			return;
		}

		// Hide empty state, show chart
		if (emptyEl) emptyEl.style.display = 'none';
		if (unitEl) unitEl.textContent = _('Live');

		var width = 600;
		var height = 200;
		var padding = 12;

		var values = this.loadHistory.map(function(d) { return d.value; });
		var maxValue = Math.max(100, Math.max.apply(Math, values));
		var minValue = 0;
		var pathPoints = this.loadHistory.map(function(point, idx) {
			var x = padding + (width - 2 * padding) * (idx / Math.max(1, this.maxDataPoints - 1));
			var y = height - padding - ((point.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
			return x + ',' + y;
		}, this).join(' ');

		svg.innerHTML = '';

		svg.appendChild(E('polyline', {
			'points': pathPoints,
			'fill': 'none',
			'stroke': '#ec4899',
			'stroke-width': '2',
			'stroke-linejoin': 'round',
			'stroke-linecap': 'round'
		}));

		if (currentEl) {
			var lastPoint = this.loadHistory[this.loadHistory.length - 1];
			currentEl.textContent = (lastPoint.raw || '0.00');
		}
	},

	updateCurrentStats: function() {
		var statsContainer = document.getElementById('current-stats');
		if (statsContainer)
			dom.content(statsContainer, this.renderStatsTable());

		var snapshot = this.getLatestSnapshot();
		this.updateHeaderChips(snapshot);
	},

	updateHeaderChips: function(snapshot) {
		this.setHeaderChipValue('cpu', snapshot.cpu.value.toFixed(1) + '%', snapshot.cpu.value);
		this.setHeaderChipValue('memory', snapshot.memory.value.toFixed(1) + '%', snapshot.memory.value);
		this.setHeaderChipValue('disk', snapshot.disk.value.toFixed(1) + '%', snapshot.disk.value);
		this.setHeaderChipValue('uptime', API.formatUptime(snapshot.uptime || 0));
		var rates = this.getNetworkRateSummary();
		this.setHeaderChipValue('net', rates.summary);
	},

	setHeaderChipValue: function(id, text, percent) {
		var target = document.getElementById('secubox-monitoring-chip-' + id);
		if (!target)
			return;

		target.textContent = text;
		if (typeof percent === 'number')
			target.style.color = this.getColorForValue(percent);
		else
			target.style.color = '';
	},

	hideLegacyTabMenu: function() {
		window.requestAnimationFrame(function() {
			var menus = document.querySelectorAll('.main > .tabmenu, .main > .cbi-tabmenu');
			menus.forEach(function(menu) {
				menu.style.display = 'none';
			});
		});
	},

	getLatestSnapshot: function() {
		return {
			cpu: this.cpuHistory[this.cpuHistory.length - 1] || { value: 0 },
			memory: this.memoryHistory[this.memoryHistory.length - 1] || { value: 0 },
			disk: this.diskHistory[this.diskHistory.length - 1] || { value: 0 },
			uptime: (this.latestHealth && this.latestHealth.uptime) || 0,
			timestamp: (this.latestHealth && this.latestHealth.timestamp) || Date.now()
		};
	},

	getNetworkRateSummary: function() {
		if (this.networkHistory.length < 2)
			return { summary: '— ↓ · — ↑', rx: 0, tx: 0 };

		var last = this.networkHistory[this.networkHistory.length - 1];
		var prev = this.networkHistory[this.networkHistory.length - 2];
		var seconds = Math.max(1, (last.time - prev.time) / 1000);
		var rx = Math.max(0, (last.rx - prev.rx) / seconds);
		var tx = Math.max(0, (last.tx - prev.tx) / seconds);

		return {
			summary: API.formatBits(rx) + ' ↓ · ' + API.formatBits(tx) + ' ↑',
			rx: rx,
			tx: tx
		};
	},

	getColorForValue: function(value) {
		if (value >= 90) return '#ef4444';
		if (value >= 75) return '#f59e0b';
		if (value >= 50) return '#3b82f6';
		return '#22c55e';
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
