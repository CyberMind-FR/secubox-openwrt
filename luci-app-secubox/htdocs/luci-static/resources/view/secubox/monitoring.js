'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';

// Respect LuCI language/theme preferences
var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

return view.extend({
	cpuHistory: [],
	memoryHistory: [],
	diskHistory: [],
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

		this.cpuHistory.push({ time: timestamp, value: (health.cpu && health.cpu.percent) || 0 });
		this.memoryHistory.push({ time: timestamp, value: (health.memory && health.memory.percent) || 0 });
		this.diskHistory.push({ time: timestamp, value: (health.disk && health.disk.percent) || 0 });

		var netRx = (health.network && health.network.rx_bytes) || 0;
		var netTx = (health.network && health.network.tx_bytes) || 0;
		this.networkHistory.push({ time: timestamp, rx: netRx, tx: netTx });

		['cpuHistory', 'memoryHistory', 'diskHistory', 'networkHistory'].forEach(function(key) {
			if (this[key].length > this.maxDataPoints)
				this[key].shift();
		}, this);
	},

	render: function() {
		var container = E('div', { 'class': 'secubox-monitoring-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/monitoring.css') }),
			SecuNav.renderTabs('monitoring'),
			this.renderHero(),
			this.renderChartsGrid(),
			this.renderCurrentStatsCard()
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

		return container;
	},

	renderHero: function() {
		var snapshot = this.getLatestSnapshot();

		var badges = [
			this.renderHeroBadge('cpu', '🔥', _('CPU Usage'), snapshot.cpu.value.toFixed(1) + '%', snapshot.cpu.value),
			this.renderHeroBadge('memory', '💾', _('Memory Usage'), snapshot.memory.value.toFixed(1) + '%', snapshot.memory.value),
			this.renderHeroBadge('disk', '💿', _('Disk Usage'), snapshot.disk.value.toFixed(1) + '%', snapshot.disk.value),
			this.renderHeroBadge('uptime', '⏱', _('Uptime'), API.formatUptime(snapshot.uptime || 0))
		];

		return E('section', { 'class': 'sb-card secubox-monitoring-hero' }, [
			E('div', { 'class': 'sb-card-header' }, [
				E('div', {}, [
					E('h2', {}, _('Advanced System Monitoring')),
					E('p', { 'class': 'sb-card-subtitle' }, _('Live telemetry for CPU, memory, storage, and network throughput'))
				]),
				E('span', { 'class': 'sb-badge sb-badge-ghost' }, _('Last update: ') +
					(snapshot.timestamp ? new Date(snapshot.timestamp).toLocaleTimeString() : _('Initializing')))
			]),
			E('div', { 'class': 'secubox-monitoring-badges', 'id': 'secubox-monitoring-badges' }, badges)
		]);
	},

	renderHeroBadge: function(id, icon, label, value, percent) {
		var color = typeof percent === 'number' ? this.getColorForValue(percent) : null;
		return E('div', { 'class': 'secubox-hero-badge', 'data-metric': id }, [
			E('div', { 'class': 'secubox-hero-icon' }, icon),
			E('div', { 'class': 'secubox-hero-meta' }, [
				E('span', { 'class': 'secubox-hero-label' }, label),
				E('span', {
					'class': 'secubox-hero-value',
					'id': 'secubox-hero-' + id,
					'style': color ? 'color:' + color : ''
				}, value)
			])
		]);
	},

	renderChartsGrid: function() {
		return E('section', { 'class': 'secubox-charts-grid' }, [
			this.renderChartCard('cpu', _('CPU Usage'), '%', '#6366f1'),
			this.renderChartCard('memory', _('Memory Usage'), '%', '#22c55e'),
			this.renderChartCard('disk', _('Disk Usage'), '%', '#f59e0b'),
			this.renderChartCard('network', _('Network Throughput'), 'B/s', '#3b82f6')
		]);
	},

	renderChartCard: function(type, title, unit, accent) {
		return E('div', { 'class': 'secubox-chart-card' }, [
			E('h3', { 'class': 'secubox-chart-title' }, title),
			E('div', { 'class': 'secubox-chart-container' },
				E('svg', {
					'id': 'chart-' + type,
					'class': 'secubox-chart',
					'viewBox': '0 0 600 200',
					'preserveAspectRatio': 'none',
					'data-accent': accent
				})
			),
			E('div', { 'class': 'secubox-chart-legend' }, [
				E('span', { 'id': 'current-' + type, 'class': 'secubox-current-value' }, '0' + unit),
				E('span', { 'class': 'secubox-chart-unit' }, _('Live'))
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
		var load = (this.latestHealth.load && this.latestHealth.load[0]) || '0.00';

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
		this.drawNetworkChart();
	},

	drawChart: function(type, data, color) {
		var svg = document.getElementById('chart-' + type);
		var currentEl = document.getElementById('current-' + type);
		if (!svg || data.length === 0)
			return;

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
			currentEl.textContent = API.formatBytes(last.rx + last.tx) + '/s';
		}
	},

	updateCurrentStats: function() {
		var statsContainer = document.getElementById('current-stats');
		if (statsContainer)
			dom.content(statsContainer, this.renderStatsTable());

		this.updateHeroBadges(this.getLatestSnapshot());
	},

	updateHeroBadges: function(snapshot) {
		var badges = document.querySelectorAll('.secubox-hero-badge');
		if (!badges.length)
			return;

		var values = {
			cpu: snapshot.cpu.value.toFixed(1) + '%',
			memory: snapshot.memory.value.toFixed(1) + '%',
			disk: snapshot.disk.value.toFixed(1) + '%',
			uptime: API.formatUptime(snapshot.uptime || 0)
		};

		Object.keys(values).forEach(function(key) {
			var target = document.getElementById('secubox-hero-' + key);
			if (target) {
				target.textContent = values[key];
				if (key !== 'uptime') {
					var numeric = snapshot[key] && snapshot[key].value || 0;
					target.style.color = this.getColorForValue(numeric);
				}
			}
		}, this);
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
			return { summary: '0 B/s' };

		var last = this.networkHistory[this.networkHistory.length - 1];
		var prev = this.networkHistory[this.networkHistory.length - 2];
		var seconds = Math.max(1, (last.time - prev.time) / 1000);
		var rx = Math.max(0, (last.rx - prev.rx) / seconds);
		var tx = Math.max(0, (last.tx - prev.tx) / seconds);

		return {
			summary: API.formatBytes(rx) + '/s ↓ · ' + API.formatBytes(tx) + '/s ↑'
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
