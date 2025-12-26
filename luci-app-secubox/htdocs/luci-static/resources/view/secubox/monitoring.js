'use strict';
'require view';
'require ui';
'require dom';
'require secubox/api as API';
'require secubox/theme as Theme';
'require poll';

// Initialize theme
Theme.init();

return view.extend({
	cpuHistory: [],
	memoryHistory: [],
	diskHistory: [],
	networkHistory: [],
	maxDataPoints: 30, // Keep last 30 data points

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return API.getSystemHealth().then(function(data) {
			self.addDataPoint(data);
			return data;
		});
	},

	addDataPoint: function(health) {
		var timestamp = Date.now();

		// Add CPU data
		this.cpuHistory.push({
			time: timestamp,
			value: (health.cpu && health.cpu.percent) || 0
		});

		// Add Memory data
		this.memoryHistory.push({
			time: timestamp,
			value: (health.memory && health.memory.percent) || 0
		});

		// Add Disk data
		this.diskHistory.push({
			time: timestamp,
			value: (health.disk && health.disk.percent) || 0
		});

		// Add Network data (calculate rate)
		var netRx = (health.network && health.network.rx_bytes) || 0;
		var netTx = (health.network && health.network.tx_bytes) || 0;
		this.networkHistory.push({
			time: timestamp,
			rx: netRx,
			tx: netTx
		});

		// Keep only last N data points
		if (this.cpuHistory.length > this.maxDataPoints) {
			this.cpuHistory.shift();
		}
		if (this.memoryHistory.length > this.maxDataPoints) {
			this.memoryHistory.shift();
		}
		if (this.diskHistory.length > this.maxDataPoints) {
			this.diskHistory.shift();
		}
		if (this.networkHistory.length > this.maxDataPoints) {
			this.networkHistory.shift();
		}
	},

	render: function(data) {
		var self = this;
		var container = E('div', { 'class': 'secubox-monitoring-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/monitoring.css') })
		]);

		// Header
		container.appendChild(this.renderHeader());

		// Charts Grid
		var chartsGrid = E('div', { 'class': 'secubox-charts-grid' }, [
			this.renderChart('cpu', 'CPU Usage', '%'),
			this.renderChart('memory', 'Memory Usage', '%'),
			this.renderChart('disk', 'Disk Usage', '%'),
			this.renderChart('network', 'Network Traffic', 'B/s')
		]);

		container.appendChild(chartsGrid);

		// Current Stats Summary
		container.appendChild(this.renderCurrentStats());

		// Auto-refresh and update charts
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateCharts();
				self.updateCurrentStats();
			});
		}, 5); // Refresh every 5 seconds for monitoring

		return container;
	},

	renderHeader: function() {
		var latest = {
			cpu: this.cpuHistory[this.cpuHistory.length - 1] || { value: 0 },
			memory: this.memoryHistory[this.memoryHistory.length - 1] || { value: 0 },
			disk: this.diskHistory[this.diskHistory.length - 1] || { value: 0 }
		};

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '📊'),
					'System Monitoring'
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					'Real-time system performance metrics and historical trends')
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: ' + this.getColorForValue(latest.cpu.value) }, latest.cpu.value.toFixed(1) + '%'),
					E('div', { 'class': 'sh-stat-label' }, 'CPU')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: ' + this.getColorForValue(latest.memory.value) }, latest.memory.value.toFixed(1) + '%'),
					E('div', { 'class': 'sh-stat-label' }, 'Memory')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: ' + this.getColorForValue(latest.disk.value) }, latest.disk.value.toFixed(1) + '%'),
					E('div', { 'class': 'sh-stat-label' }, 'Disk')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value' }, this.cpuHistory.length),
					E('div', { 'class': 'sh-stat-label' }, 'Data Points')
				])
			])
		]);
	},

	getColorForValue: function(value) {
		if (value >= 90) return '#ef4444';
		if (value >= 75) return '#f59e0b';
		if (value >= 50) return '#3b82f6';
		return '#22c55e';
	},

	renderChart: function(type, title, unit) {
		return E('div', { 'class': 'secubox-chart-card' }, [
			E('h3', { 'class': 'secubox-chart-title' }, title),
			E('div', { 'class': 'secubox-chart-container' }, [
				E('svg', {
					'id': 'chart-' + type,
					'class': 'secubox-chart',
					'viewBox': '0 0 600 200',
					'preserveAspectRatio': 'none'
				})
			]),
			E('div', { 'class': 'secubox-chart-legend' }, [
				E('span', { 'id': 'current-' + type, 'class': 'secubox-current-value' }, '0' + unit),
				E('span', { 'class': 'secubox-chart-unit' }, 'Current')
			])
		]);
	},

	renderCurrentStats: function() {
		return E('div', { 'class': 'secubox-card' }, [
			E('h3', { 'class': 'secubox-card-title' }, '📋 Current Statistics'),
			E('div', { 'id': 'current-stats', 'class': 'secubox-stats-table' },
				this.renderStatsTable())
		]);
	},

	renderStatsTable: function() {
		var latest = {
			cpu: this.cpuHistory[this.cpuHistory.length - 1] || { value: 0 },
			memory: this.memoryHistory[this.memoryHistory.length - 1] || { value: 0 },
			disk: this.diskHistory[this.diskHistory.length - 1] || { value: 0 }
		};

		var stats = [
			{ label: 'CPU Usage', value: latest.cpu.value + '%', icon: '⚡' },
			{ label: 'Memory Usage', value: latest.memory.value + '%', icon: '💾' },
			{ label: 'Disk Usage', value: latest.disk.value + '%', icon: '💿' },
			{ label: 'Data Points', value: this.cpuHistory.length + ' / ' + this.maxDataPoints, icon: '📊' }
		];

		return E('div', { 'class': 'secubox-stats-grid' },
			stats.map(function(stat) {
				return E('div', { 'class': 'secubox-stat-item' }, [
					E('span', { 'class': 'secubox-stat-icon' }, stat.icon),
					E('div', { 'class': 'secubox-stat-details' }, [
						E('div', { 'class': 'secubox-stat-label' }, stat.label),
						E('div', { 'class': 'secubox-stat-value' }, stat.value)
					])
				]);
			})
		);
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

		if (!svg || data.length === 0) return;

		// Clear previous content
		svg.innerHTML = '';

		// Dimensions
		var width = 600;
		var height = 200;
		var padding = 10;

		// Find min/max for scaling
		var maxValue = Math.max(...data.map(d => d.value), 100);
		var minValue = 0;

		// Create grid lines
		for (var i = 0; i <= 4; i++) {
			var y = height - (height - 2 * padding) * (i / 4) - padding;
			svg.appendChild(E('line', {
				'x1': padding,
				'y1': y,
				'x2': width - padding,
				'y2': y,
				'stroke': '#e5e7eb',
				'stroke-width': '1',
				'stroke-dasharray': '4'
			}));
		}

		// Create path
		var points = data.map(function(d, i) {
			var x = padding + (width - 2 * padding) * (i / (this.maxDataPoints - 1 || 1));
			var y = height - padding - ((d.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
			return x + ',' + y;
		}, this).join(' ');

		// Draw area under the curve
		if (points) {
			var firstPoint = points.split(' ')[0];
			var lastPoint = points.split(' ')[points.split(' ').length - 1];
			var areaPoints = padding + ',' + (height - padding) + ' ' +
							points + ' ' +
							(lastPoint ? lastPoint.split(',')[0] : 0) + ',' + (height - padding);

			svg.appendChild(E('polygon', {
				'points': areaPoints,
				'fill': color,
				'fill-opacity': '0.1'
			}));
		}

		// Draw line
		svg.appendChild(E('polyline', {
			'points': points,
			'fill': 'none',
			'stroke': color,
			'stroke-width': '2',
			'stroke-linejoin': 'round',
			'stroke-linecap': 'round'
		}));

		// Draw dots for last few points
		data.slice(-5).forEach(function(d, i) {
			var idx = data.length - 5 + i;
			if (idx < 0) return;
			var x = padding + (width - 2 * padding) * (idx / (this.maxDataPoints - 1 || 1));
			var y = height - padding - ((d.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);

			svg.appendChild(E('circle', {
				'cx': x,
				'cy': y,
				'r': '3',
				'fill': color
			}));
		}, this);

		// Update current value
		if (currentEl && data.length > 0) {
			var unit = type === 'network' ? ' B/s' : '%';
			currentEl.textContent = data[data.length - 1].value.toFixed(1) + unit;
		}
	},

	drawNetworkChart: function() {
		// For network, we'll draw both RX and TX
		var svg = document.getElementById('chart-network');
		var currentEl = document.getElementById('current-network');

		if (!svg || this.networkHistory.length === 0) return;

		svg.innerHTML = '';

		var width = 600;
		var height = 200;
		var padding = 10;

		// Calculate rates (bytes per second)
		var rates = [];
		for (var i = 1; i < this.networkHistory.length; i++) {
			var prev = this.networkHistory[i - 1];
			var curr = this.networkHistory[i];
			var timeDiff = (curr.time - prev.time) / 1000; // seconds

			if (timeDiff > 0) {
				rates.push({
					rx: (curr.rx - prev.rx) / timeDiff,
					tx: (curr.tx - prev.tx) / timeDiff
				});
			}
		}

		if (rates.length === 0) return;

		var maxRate = Math.max(
			...rates.map(r => Math.max(r.rx, r.tx)),
			1024 // At least 1KB/s scale
		);

		// Draw RX line (green)
		var rxPoints = rates.map(function(r, i) {
			var x = padding + (width - 2 * padding) * (i / (rates.length - 1 || 1));
			var y = height - padding - (r.rx / maxRate) * (height - 2 * padding);
			return x + ',' + y;
		}).join(' ');

		svg.appendChild(E('polyline', {
			'points': rxPoints,
			'fill': 'none',
			'stroke': '#22c55e',
			'stroke-width': '2'
		}));

		// Draw TX line (blue)
		var txPoints = rates.map(function(r, i) {
			var x = padding + (width - 2 * padding) * (i / (rates.length - 1 || 1));
			var y = height - padding - (r.tx / maxRate) * (height - 2 * padding);
			return x + ',' + y;
		}).join(' ');

		svg.appendChild(E('polyline', {
			'points': txPoints,
			'fill': 'none',
			'stroke': '#3b82f6',
			'stroke-width': '2'
		}));

		// Update current value
		if (currentEl && rates.length > 0) {
			var lastRate = rates[rates.length - 1];
			currentEl.textContent = API.formatBytes(lastRate.rx + lastRate.tx) + '/s';
		}
	},

	updateCurrentStats: function() {
		var container = document.getElementById('current-stats');
		if (container) {
			dom.content(container, this.renderStatsTable());
		}

		// Update header stats
		var latest = {
			cpu: this.cpuHistory[this.cpuHistory.length - 1] || { value: 0 },
			memory: this.memoryHistory[this.memoryHistory.length - 1] || { value: 0 },
			disk: this.diskHistory[this.diskHistory.length - 1] || { value: 0 }
		};

		var statBadges = document.querySelectorAll('.sh-stat-value');
		if (statBadges.length >= 4) {
			statBadges[0].textContent = latest.cpu.value.toFixed(1) + '%';
			statBadges[0].style.color = this.getColorForValue(latest.cpu.value);
			statBadges[1].textContent = latest.memory.value.toFixed(1) + '%';
			statBadges[1].style.color = this.getColorForValue(latest.memory.value);
			statBadges[2].textContent = latest.disk.value.toFixed(1) + '%';
			statBadges[2].style.color = this.getColorForValue(latest.disk.value);
			statBadges[3].textContent = this.cpuHistory.length;
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
