'use strict';

/**
 * Lightweight SVG sparkline chart component for WireGuard Dashboard
 * No external dependencies - pure SVG generation
 */

return {
	// Default options
	defaults: {
		width: 200,
		height: 50,
		strokeWidth: 2,
		fill: true,
		lineColor: '#0ea5e9',
		fillColor: 'rgba(14, 165, 233, 0.1)',
		gridColor: 'rgba(255, 255, 255, 0.1)',
		showGrid: false,
		animate: true
	},

	/**
	 * Generate SVG sparkline from data points
	 * @param {number[]} data - Array of numeric values
	 * @param {Object} opts - Chart options
	 * @returns {string} SVG markup string
	 */
	sparkline: function(data, opts) {
		opts = Object.assign({}, this.defaults, opts || {});

		if (!data || data.length < 2) {
			return this.emptyChart(opts);
		}

		var width = opts.width;
		var height = opts.height;
		var padding = 4;
		var chartWidth = width - padding * 2;
		var chartHeight = height - padding * 2;

		// Normalize data
		var max = Math.max.apply(null, data);
		var min = Math.min.apply(null, data);
		var range = max - min || 1;

		// Generate points
		var points = [];
		var step = chartWidth / (data.length - 1);
		for (var i = 0; i < data.length; i++) {
			var x = padding + i * step;
			var y = padding + chartHeight - ((data[i] - min) / range * chartHeight);
			points.push(x + ',' + y);
		}

		var pathData = 'M' + points.join(' L');

		// Build fill path (closed area under line)
		var fillPath = '';
		if (opts.fill) {
			fillPath = pathData +
				' L' + (padding + chartWidth) + ',' + (padding + chartHeight) +
				' L' + padding + ',' + (padding + chartHeight) + ' Z';
		}

		// Build SVG
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" ' +
			'width="' + width + '" height="' + height + '" class="wg-chart-sparkline">';

		// Grid lines
		if (opts.showGrid) {
			for (var g = 0; g < 4; g++) {
				var gy = padding + (chartHeight / 3) * g;
				svg += '<line x1="' + padding + '" y1="' + gy + '" x2="' + (width - padding) + '" y2="' + gy + '" ' +
					'stroke="' + opts.gridColor + '" stroke-width="1" stroke-dasharray="2,2"/>';
			}
		}

		// Fill area
		if (opts.fill && fillPath) {
			svg += '<path d="' + fillPath + '" fill="' + opts.fillColor + '" class="wg-chart-fill"/>';
		}

		// Line
		svg += '<path d="' + pathData + '" fill="none" stroke="' + opts.lineColor + '" ' +
			'stroke-width="' + opts.strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" ' +
			'class="wg-chart-line"';

		if (opts.animate) {
			var pathLength = this.estimatePathLength(data.length, chartWidth, chartHeight);
			svg += ' stroke-dasharray="' + pathLength + '" stroke-dashoffset="' + pathLength + '" ' +
				'style="animation: wg-chart-draw 1s ease-out forwards"';
		}
		svg += '/>';

		// End point dot
		var lastX = padding + (data.length - 1) * step;
		var lastY = padding + chartHeight - ((data[data.length - 1] - min) / range * chartHeight);
		svg += '<circle cx="' + lastX + '" cy="' + lastY + '" r="3" fill="' + opts.lineColor + '" class="wg-chart-dot"/>';

		svg += '</svg>';
		return svg;
	},

	/**
	 * Generate dual-line chart for RX/TX comparison
	 * @param {number[]} rxData - Download data points
	 * @param {number[]} txData - Upload data points
	 * @param {Object} opts - Chart options
	 * @returns {string} SVG markup string
	 */
	dualSparkline: function(rxData, txData, opts) {
		opts = Object.assign({}, this.defaults, {
			width: 300,
			height: 60,
			rxColor: '#10b981',
			txColor: '#0ea5e9',
			rxFill: 'rgba(16, 185, 129, 0.1)',
			txFill: 'rgba(14, 165, 233, 0.1)'
		}, opts || {});

		var width = opts.width;
		var height = opts.height;
		var padding = 4;
		var chartWidth = width - padding * 2;
		var chartHeight = height - padding * 2;

		// Combine for scale
		var allData = (rxData || []).concat(txData || []);
		if (allData.length < 2) {
			return this.emptyChart(opts);
		}

		var max = Math.max.apply(null, allData);
		var min = 0;
		var range = max - min || 1;

		var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" ' +
			'width="' + width + '" height="' + height + '" class="wg-chart-dual">';

		// Draw each line
		var datasets = [
			{ data: rxData, color: opts.rxColor, fill: opts.rxFill, label: 'RX' },
			{ data: txData, color: opts.txColor, fill: opts.txFill, label: 'TX' }
		];

		datasets.forEach(function(ds) {
			if (!ds.data || ds.data.length < 2) return;

			var step = chartWidth / (ds.data.length - 1);
			var points = [];
			for (var i = 0; i < ds.data.length; i++) {
				var x = padding + i * step;
				var y = padding + chartHeight - ((ds.data[i] - min) / range * chartHeight);
				points.push(x + ',' + y);
			}

			var pathData = 'M' + points.join(' L');

			// Fill
			if (opts.fill) {
				var fillPath = pathData +
					' L' + (padding + chartWidth) + ',' + (padding + chartHeight) +
					' L' + padding + ',' + (padding + chartHeight) + ' Z';
				svg += '<path d="' + fillPath + '" fill="' + ds.fill + '" opacity="0.5"/>';
			}

			// Line
			svg += '<path d="' + pathData + '" fill="none" stroke="' + ds.color + '" ' +
				'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
		});

		// Legend
		svg += '<text x="' + (width - 60) + '" y="12" font-size="10" fill="' + opts.rxColor + '">↓ RX</text>';
		svg += '<text x="' + (width - 30) + '" y="12" font-size="10" fill="' + opts.txColor + '">↑ TX</text>';

		svg += '</svg>';
		return svg;
	},

	/**
	 * Generate empty/placeholder chart
	 * @param {Object} opts - Chart options
	 * @returns {string} SVG markup string
	 */
	emptyChart: function(opts) {
		var width = opts.width || 200;
		var height = opts.height || 50;

		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" ' +
			'width="' + width + '" height="' + height + '" class="wg-chart-empty">' +
			'<line x1="10" y1="' + (height / 2) + '" x2="' + (width - 10) + '" y2="' + (height / 2) + '" ' +
			'stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4,4"/>' +
			'<text x="' + (width / 2) + '" y="' + (height / 2 + 4) + '" ' +
			'text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="10">No data</text>' +
			'</svg>';
	},

	/**
	 * Estimate path length for animation
	 */
	estimatePathLength: function(points, width, height) {
		return Math.sqrt(width * width + height * height) * 1.5;
	},

	/**
	 * Create chart container element
	 * @param {string} svgContent - SVG markup
	 * @param {string} title - Chart title
	 * @returns {HTMLElement} Container element
	 */
	createContainer: function(svgContent, title) {
		var container = document.createElement('div');
		container.className = 'wg-chart-container';

		if (title) {
			var titleEl = document.createElement('div');
			titleEl.className = 'wg-chart-title';
			titleEl.textContent = title;
			container.appendChild(titleEl);
		}

		var chartEl = document.createElement('div');
		chartEl.className = 'wg-chart-body';
		chartEl.innerHTML = svgContent;
		container.appendChild(chartEl);

		return container;
	},

	/**
	 * Traffic history ring buffer manager
	 */
	TrafficHistory: {
		maxPoints: 60,
		data: {},

		add: function(ifaceName, rx, tx) {
			if (!this.data[ifaceName]) {
				this.data[ifaceName] = { rx: [], tx: [], timestamps: [] };
			}

			var entry = this.data[ifaceName];
			entry.rx.push(rx);
			entry.tx.push(tx);
			entry.timestamps.push(Date.now());

			// Trim to max points
			if (entry.rx.length > this.maxPoints) {
				entry.rx.shift();
				entry.tx.shift();
				entry.timestamps.shift();
			}
		},

		get: function(ifaceName) {
			return this.data[ifaceName] || { rx: [], tx: [], timestamps: [] };
		},

		getRates: function(ifaceName) {
			var entry = this.data[ifaceName];
			if (!entry || entry.rx.length < 2) return { rx: [], tx: [] };

			var rxRates = [];
			var txRates = [];
			for (var i = 1; i < entry.rx.length; i++) {
				var timeDiff = (entry.timestamps[i] - entry.timestamps[i - 1]) / 1000;
				if (timeDiff > 0) {
					rxRates.push((entry.rx[i] - entry.rx[i - 1]) / timeDiff);
					txRates.push((entry.tx[i] - entry.tx[i - 1]) / timeDiff);
				}
			}
			return { rx: rxRates, tx: txRates };
		},

		clear: function(ifaceName) {
			if (ifaceName) {
				delete this.data[ifaceName];
			} else {
				this.data = {};
			}
		}
	}
};
