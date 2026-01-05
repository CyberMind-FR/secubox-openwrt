'use strict';
'require baseclass';

/**
 * Chart.js Utilities for SecuBox
 * Provides wrapper functions and cyberpunk-themed chart configurations
 */

return baseclass.extend({
	// Chart.js instance (loaded lazily)
	Chart: null,

	// Cyberpunk color palette
	colors: {
		primary: 'rgba(102, 126, 234, 1)',
		secondary: 'rgba(118, 75, 162, 1)',
		accent: 'rgba(6, 182, 212, 1)',
		success: 'rgba(16, 185, 129, 1)',
		warning: 'rgba(245, 158, 11, 1)',
		danger: 'rgba(239, 68, 68, 1)',
		info: 'rgba(59, 130, 246, 1)',
		cyber: 'rgba(0, 255, 65, 1)'
	},

	/**
	 * Load Chart.js library
	 */
	loadChartJS: function() {
		var self = this;

		if (this.Chart) {
			return Promise.resolve(this.Chart);
		}

		return new Promise(function(resolve, reject) {
			// Check if Chart is already loaded globally
			if (window.Chart) {
				self.Chart = window.Chart;
				resolve(window.Chart);
				return;
			}

			// Load Chart.js script
			var script = document.createElement('script');
			script.src = L.resource('secubox-theme/libs/chart.min.js');
			script.onload = function() {
				self.Chart = window.Chart;
				resolve(window.Chart);
			};
			script.onerror = function() {
				reject(new Error('Failed to load Chart.js'));
			};
			document.head.appendChild(script);
		});
	},

	/**
	 * Get default chart options (cyberpunk theme)
	 */
	getDefaultOptions: function() {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false  // Use custom legend
				},
				tooltip: {
					backgroundColor: 'rgba(10, 14, 37, 0.95)',
					titleColor: 'rgba(255, 255, 255, 0.9)',
					bodyColor: 'rgba(255, 255, 255, 0.7)',
					borderColor: 'rgba(102, 126, 234, 0.5)',
					borderWidth: 1,
					padding: 12,
					displayColors: true,
					boxPadding: 6
				}
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(255, 255, 255, 0.05)',
						borderColor: 'rgba(255, 255, 255, 0.1)'
					},
					ticks: {
						color: 'rgba(255, 255, 255, 0.6)',
						font: {
							size: 11
						}
					}
				},
				y: {
					grid: {
						color: 'rgba(255, 255, 255, 0.05)',
						borderColor: 'rgba(255, 255, 255, 0.1)'
					},
					ticks: {
						color: 'rgba(255, 255, 255, 0.6)',
						font: {
							size: 11
						}
					}
				}
			}
		};
	},

	/**
	 * Create a line chart
	 * @param {HTMLCanvasElement} canvas
	 * @param {Object} data - { labels: [], datasets: [{label, data}] }
	 * @param {Object} options - Additional options
	 */
	createLineChart: function(canvas, data, options) {
		var self = this;
		options = options || {};

		return this.loadChartJS().then(function(Chart) {
			var ctx = canvas.getContext('2d');

			// Process datasets - add cyberpunk styling
			data.datasets = data.datasets.map(function(dataset, index) {
				var color = self._getColorForIndex(index);
				return Object.assign({
					borderColor: color,
					backgroundColor: color.replace('1)', '0.1)'),
					borderWidth: 2,
					pointRadius: 3,
					pointHoverRadius: 5,
					pointBackgroundColor: color,
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					tension: 0.4,
					fill: true
				}, dataset);
			});

			var config = {
				type: 'line',
				data: data,
				options: self._mergeOptions(self.getDefaultOptions(), options)
			};

			return new Chart(ctx, config);
		});
	},

	/**
	 * Create a bar chart
	 * @param {HTMLCanvasElement} canvas
	 * @param {Object} data
	 * @param {Object} options
	 */
	createBarChart: function(canvas, data, options) {
		var self = this;
		options = options || {};

		return this.loadChartJS().then(function(Chart) {
			var ctx = canvas.getContext('2d');

			// Process datasets
			data.datasets = data.datasets.map(function(dataset, index) {
				var color = self._getColorForIndex(index);
				return Object.assign({
					backgroundColor: color.replace('1)', '0.7)'),
					borderColor: color,
					borderWidth: 1,
					borderRadius: 4
				}, dataset);
			});

			var config = {
				type: 'bar',
				data: data,
				options: self._mergeOptions(self.getDefaultOptions(), options)
			};

			return new Chart(ctx, config);
		});
	},

	/**
	 * Create a doughnut chart
	 * @param {HTMLCanvasElement} canvas
	 * @param {Object} data
	 * @param {Object} options
	 */
	createDoughnutChart: function(canvas, data, options) {
		var self = this;
		options = options || {};

		return this.loadChartJS().then(function(Chart) {
			var ctx = canvas.getContext('2d');

			// Generate colors for each data point
			var colors = data.labels.map(function(label, index) {
				return self._getColorForIndex(index);
			});

			data.datasets = data.datasets.map(function(dataset) {
				return Object.assign({
					backgroundColor: colors.map(function(c) { return c.replace('1)', '0.7)'); }),
					borderColor: colors,
					borderWidth: 2
				}, dataset);
			});

			var baseOptions = self.getDefaultOptions();
			delete baseOptions.scales;  // Doughnut doesn't use scales

			var config = {
				type: 'doughnut',
				data: data,
				options: self._mergeOptions(baseOptions, options)
			};

			return new Chart(ctx, config);
		});
	},

	/**
	 * Create a gauge chart (custom doughnut)
	 * @param {HTMLCanvasElement} canvas
	 * @param {Number} value - Percentage (0-100)
	 * @param {Object} options
	 */
	createGaugeChart: function(canvas, value, options) {
		var self = this;
		options = options || {};

		var data = {
			labels: ['Used', 'Available'],
			datasets: [{
				data: [value, 100 - value],
				backgroundColor: [
					this.colors.accent.replace('1)', '0.7)'),
					'rgba(255, 255, 255, 0.05)'
				],
				borderColor: [
					this.colors.accent,
					'rgba(255, 255, 255, 0.1)'
				],
				borderWidth: 2,
				circumference: 180,
				rotation: 270
			}]
		};

		return this.createDoughnutChart(canvas, data, Object.assign({
			cutout: '75%',
			plugins: {
				legend: {
					display: false
				},
				tooltip: {
					enabled: false
				}
			}
		}, options));
	},

	/**
	 * Create a sparkline (mini line chart)
	 * @param {HTMLCanvasElement} canvas
	 * @param {Array} data - Array of numbers
	 * @param {String} color - Color hex/rgba
	 */
	createSparkline: function(canvas, data, color) {
		var self = this;
		color = color || this.colors.accent;

		var chartData = {
			labels: data.map(function(v, i) { return i; }),
			datasets: [{
				data: data,
				borderColor: color,
				backgroundColor: color.replace('1)', '0.1)'),
				borderWidth: 2,
				pointRadius: 0,
				pointHoverRadius: 0,
				tension: 0.4,
				fill: true
			}]
		};

		var options = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: { enabled: false }
			},
			scales: {
				x: { display: false },
				y: { display: false }
			}
		};

		return this.createLineChart(canvas, chartData, options);
	},

	/**
	 * Destroy chart instance
	 * @param {Chart} chart
	 */
	destroyChart: function(chart) {
		if (chart && typeof chart.destroy === 'function') {
			chart.destroy();
		}
	},

	/**
	 * Update chart data
	 * @param {Chart} chart
	 * @param {Object} newData
	 */
	updateChart: function(chart, newData) {
		if (!chart) return;

		chart.data = newData;
		chart.update('none');  // Update without animation
	},

	// Private helpers

	_getColorForIndex: function(index) {
		var colorKeys = Object.keys(this.colors);
		var key = colorKeys[index % colorKeys.length];
		return this.colors[key];
	},

	_mergeOptions: function(defaults, overrides) {
		var result = {};

		for (var key in defaults) {
			if (defaults.hasOwnProperty(key)) {
				result[key] = defaults[key];
			}
		}

		for (var key in overrides) {
			if (overrides.hasOwnProperty(key)) {
				if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
					result[key] = this._mergeOptions(result[key] || {}, overrides[key]);
				} else {
					result[key] = overrides[key];
				}
			}
		}

		return result;
	}
});
