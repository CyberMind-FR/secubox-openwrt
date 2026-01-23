'use strict';
'require baseclass';

/**
 * SecuBox Graph Utilities
 * Shared canvas drawing functions for bandwidth manager charts
 */

var THEME = {
	cyan: '#06b6d4',
	emerald: '#10b981',
	rose: '#f43f5e',
	amber: '#f59e0b',
	violet: '#8b5cf6',
	blue: '#3b82f6',
	download: '#10b981',
	upload: '#06b6d4',
	grid: 'rgba(255,255,255,0.1)',
	text: '#999',
	background: '#15151a',
	border: '#25252f'
};

return baseclass.extend({
	/**
	 * Draw a smooth bezier line chart
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 * @param {Array} data - Array of {x, y} points
	 * @param {Object} options - Drawing options
	 */
	drawBezierLine: function(ctx, data, options) {
		options = Object.assign({
			color: THEME.cyan,
			lineWidth: 2,
			fill: true,
			fillOpacity: 0.1,
			tension: 0.3
		}, options);

		if (data.length < 2) return;

		ctx.strokeStyle = options.color;
		ctx.lineWidth = options.lineWidth;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		ctx.beginPath();
		ctx.moveTo(data[0].x, data[0].y);

		for (var i = 1; i < data.length; i++) {
			var prev = data[i - 1];
			var curr = data[i];

			var cpx1 = prev.x + (curr.x - prev.x) * options.tension;
			var cpy1 = prev.y;
			var cpx2 = curr.x - (curr.x - prev.x) * options.tension;
			var cpy2 = curr.y;

			ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, curr.x, curr.y);
		}

		ctx.stroke();

		if (options.fill && options.height) {
			ctx.lineTo(data[data.length - 1].x, options.height);
			ctx.lineTo(data[0].x, options.height);
			ctx.closePath();

			var rgba = this.hexToRgba(options.color, options.fillOpacity);
			ctx.fillStyle = rgba;
			ctx.fill();
		}
	},

	/**
	 * Draw an area chart with gradient fill
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 * @param {Array} data - Array of values
	 * @param {Object} options - Drawing options
	 */
	drawAreaChart: function(ctx, data, options) {
		options = Object.assign({
			color: THEME.emerald,
			x: 0,
			y: 0,
			width: 400,
			height: 200,
			padding: 40
		}, options);

		if (data.length === 0) return;

		var maxVal = Math.max.apply(null, data) || 1;
		var stepX = (options.width - options.padding * 2) / (data.length - 1);
		var scaleY = (options.height - options.padding * 2) / maxVal;

		var points = data.map(function(val, i) {
			return {
				x: options.padding + i * stepX,
				y: options.height - options.padding - val * scaleY
			};
		});

		// Create gradient
		var gradient = ctx.createLinearGradient(0, options.padding, 0, options.height - options.padding);
		gradient.addColorStop(0, this.hexToRgba(options.color, 0.4));
		gradient.addColorStop(1, this.hexToRgba(options.color, 0));

		// Draw fill
		ctx.beginPath();
		ctx.moveTo(points[0].x, options.height - options.padding);
		points.forEach(function(p) {
			ctx.lineTo(p.x, p.y);
		});
		ctx.lineTo(points[points.length - 1].x, options.height - options.padding);
		ctx.closePath();
		ctx.fillStyle = gradient;
		ctx.fill();

		// Draw line
		this.drawBezierLine(ctx, points, {
			color: options.color,
			lineWidth: 2,
			fill: false
		});
	},

	/**
	 * Draw a bar chart
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 * @param {Array} data - Array of {label, value, color?}
	 * @param {Object} options - Drawing options
	 */
	drawBarChart: function(ctx, data, options) {
		options = Object.assign({
			x: 0,
			y: 0,
			width: 400,
			height: 200,
			padding: 40,
			barGap: 4,
			horizontal: false,
			colors: [THEME.cyan, THEME.emerald, THEME.violet, THEME.amber, THEME.rose]
		}, options);

		if (data.length === 0) return;

		var maxVal = Math.max.apply(null, data.map(function(d) { return d.value; })) || 1;

		if (options.horizontal) {
			var barHeight = (options.height - options.padding * 2 - options.barGap * (data.length - 1)) / data.length;

			data.forEach(function(item, i) {
				var barWidth = (item.value / maxVal) * (options.width - options.padding * 2 - 80);
				var y = options.padding + i * (barHeight + options.barGap);

				ctx.fillStyle = item.color || options.colors[i % options.colors.length];
				ctx.fillRect(options.padding + 60, y, barWidth, barHeight);

				// Label
				ctx.fillStyle = THEME.text;
				ctx.font = '12px sans-serif';
				ctx.textAlign = 'right';
				ctx.fillText(item.label || '', options.padding + 55, y + barHeight / 2 + 4);
			});
		} else {
			var barWidth = (options.width - options.padding * 2 - options.barGap * (data.length - 1)) / data.length;

			data.forEach(function(item, i) {
				var barHeight = (item.value / maxVal) * (options.height - options.padding * 2);
				var x = options.padding + i * (barWidth + options.barGap);

				ctx.fillStyle = item.color || options.colors[i % options.colors.length];
				ctx.fillRect(x, options.height - options.padding - barHeight, barWidth, barHeight);
			});
		}
	},

	/**
	 * Draw a pie/donut chart
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 * @param {Array} data - Array of {value, color?, label?}
	 * @param {Object} options - Drawing options
	 */
	drawPieChart: function(ctx, data, options) {
		options = Object.assign({
			x: 200,
			y: 200,
			radius: 100,
			innerRadius: 60,
			colors: [THEME.cyan, THEME.emerald, THEME.violet, THEME.amber, THEME.rose, THEME.blue]
		}, options);

		if (data.length === 0) return;

		var total = data.reduce(function(sum, item) { return sum + item.value; }, 0);
		if (total === 0) total = 1;

		var startAngle = -Math.PI / 2;

		data.forEach(function(item, i) {
			var sliceAngle = (item.value / total) * 2 * Math.PI;

			ctx.beginPath();
			ctx.moveTo(options.x, options.y);
			ctx.arc(options.x, options.y, options.radius, startAngle, startAngle + sliceAngle);
			ctx.closePath();

			ctx.fillStyle = item.color || options.colors[i % options.colors.length];
			ctx.fill();

			startAngle += sliceAngle;
		});

		// Draw inner circle for donut effect
		if (options.innerRadius > 0) {
			ctx.beginPath();
			ctx.arc(options.x, options.y, options.innerRadius, 0, 2 * Math.PI);
			ctx.fillStyle = THEME.background;
			ctx.fill();
		}
	},

	/**
	 * Draw chart grid lines
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 * @param {Object} options - Grid options
	 */
	drawGrid: function(ctx, options) {
		options = Object.assign({
			x: 0,
			y: 0,
			width: 400,
			height: 200,
			padding: 40,
			horizontalLines: 4,
			verticalLines: 0,
			color: THEME.grid
		}, options);

		ctx.strokeStyle = options.color;
		ctx.lineWidth = 1;

		// Horizontal lines
		for (var i = 0; i <= options.horizontalLines; i++) {
			var y = options.padding + i * (options.height - options.padding * 2) / options.horizontalLines;
			ctx.beginPath();
			ctx.moveTo(options.padding, y);
			ctx.lineTo(options.width - options.padding, y);
			ctx.stroke();
		}

		// Vertical lines
		if (options.verticalLines > 0) {
			for (var j = 0; j <= options.verticalLines; j++) {
				var x = options.padding + j * (options.width - options.padding * 2) / options.verticalLines;
				ctx.beginPath();
				ctx.moveTo(x, options.padding);
				ctx.lineTo(x, options.height - options.padding);
				ctx.stroke();
			}
		}
	},

	/**
	 * Draw axis labels
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 * @param {Array} labels - Array of label strings
	 * @param {Object} options - Label options
	 */
	drawAxisLabels: function(ctx, labels, options) {
		options = Object.assign({
			axis: 'x',
			x: 0,
			y: 0,
			width: 400,
			height: 200,
			padding: 40,
			color: THEME.text,
			fontSize: 11
		}, options);

		ctx.fillStyle = options.color;
		ctx.font = options.fontSize + 'px sans-serif';

		if (options.axis === 'x') {
			ctx.textAlign = 'center';
			var step = (options.width - options.padding * 2) / (labels.length - 1);
			labels.forEach(function(label, i) {
				ctx.fillText(label, options.padding + i * step, options.height - options.padding + 15);
			});
		} else {
			ctx.textAlign = 'right';
			var step = (options.height - options.padding * 2) / (labels.length - 1);
			labels.forEach(function(label, i) {
				ctx.fillText(label, options.padding - 5, options.height - options.padding - i * step + 4);
			});
		}
	},

	/**
	 * Animate a value change
	 * @param {number} from - Start value
	 * @param {number} to - End value
	 * @param {number} duration - Animation duration in ms
	 * @param {Function} callback - Called with current value
	 */
	animateValue: function(from, to, duration, callback) {
		var start = performance.now();
		var diff = to - from;

		function step(timestamp) {
			var progress = Math.min((timestamp - start) / duration, 1);
			var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
			var current = from + diff * eased;

			callback(current);

			if (progress < 1) {
				requestAnimationFrame(step);
			}
		}

		requestAnimationFrame(step);
	},

	/**
	 * Convert hex color to rgba
	 * @param {string} hex - Hex color
	 * @param {number} alpha - Alpha value 0-1
	 * @returns {string} RGBA color string
	 */
	hexToRgba: function(hex, alpha) {
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
	},

	/**
	 * Format bytes to human readable
	 * @param {number} bytes - Byte count
	 * @returns {string} Formatted string
	 */
	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	/**
	 * Format bits per second
	 * @param {number} bps - Bits per second
	 * @returns {string} Formatted string
	 */
	formatBps: function(bps) {
		if (bps === 0) return '0 bps';
		var k = 1000;
		var sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
		var i = Math.floor(Math.log(bps) / Math.log(k));
		return parseFloat((bps / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	/**
	 * Get theme colors
	 * @returns {Object} Theme color object
	 */
	getTheme: function() {
		return THEME;
	}
});
