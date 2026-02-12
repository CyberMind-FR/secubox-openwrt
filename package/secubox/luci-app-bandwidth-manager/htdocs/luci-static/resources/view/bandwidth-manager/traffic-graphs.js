'use strict';
'require view';
'require ui';
'require poll';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

// SecuBox Theme Colors
var COLORS = {
	cyan: '#06b6d4',
	emerald: '#10b981',
	rose: '#f43f5e',
	amber: '#f59e0b',
	violet: '#8b5cf6',
	blue: '#3b82f6',
	download: '#10b981',
	upload: '#06b6d4',
	grid: 'rgba(255,255,255,0.1)',
	text: '#999'
};

return L.view.extend({
	realtimeData: [],
	maxDataPoints: 60,
	pollInterval: null,

	load: function() {
		return Promise.all([
			API.getHistoricalTraffic('24h', 'hour'),
			API.getTopTalkers('24h', 10),
			API.getProtocolBreakdown('24h'),
			API.getStatus()
		]);
	},

	render: function(data) {
		var historical = (data[0] && data[0].data) || [];
		var topTalkers = (data[1] && data[1].talkers) || [];
		var protocols = (data[2] && data[2].protocols) || [];
		var status = data[3] || {};
		var self = this;

		var v = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('bandwidth-manager/dashboard.css') }),
			E('style', {}, this.getCustomStyles()),
			E('h2', {}, _('Traffic Graphs')),
			E('div', { 'class': 'cbi-map-descr' }, _('Real-time and historical bandwidth visualization'))
		]);

		// Real-time Bandwidth Section
		var realtimeSection = E('div', { 'class': 'cbi-section' }, [
			E('div', { 'class': 'section-header' }, [
				E('h3', {}, _('Real-time Bandwidth')),
				E('div', { 'class': 'live-indicator' }, [
					E('span', { 'class': 'live-dot' }),
					E('span', {}, _('Live'))
				])
			]),
			E('div', { 'class': 'realtime-stats' }, [
				E('div', { 'class': 'stat-card download' }, [
					E('div', { 'class': 'stat-icon' }, '⬇️'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value', 'id': 'realtime-download' }, '0'),
						E('div', { 'class': 'stat-label' }, _('Download (Mbps)'))
					])
				]),
				E('div', { 'class': 'stat-card upload' }, [
					E('div', { 'class': 'stat-icon' }, '⬆️'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value', 'id': 'realtime-upload' }, '0'),
						E('div', { 'class': 'stat-label' }, _('Upload (Mbps)'))
					])
				])
			]),
			E('div', { 'class': 'chart-container' }, [
				E('canvas', { 'id': 'realtime-chart', 'width': '800', 'height': '200' })
			])
		]);
		v.appendChild(realtimeSection);

		// Historical Traffic Section
		var historicalSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Historical Traffic')),
			E('div', { 'class': 'period-selector' }, [
				E('button', { 'class': 'period-btn active', 'data-period': '24h', 'click': function(e) { self.changePeriod(e, '24h'); } }, _('24 Hours')),
				E('button', { 'class': 'period-btn', 'data-period': '7d', 'click': function(e) { self.changePeriod(e, '7d'); } }, _('7 Days')),
				E('button', { 'class': 'period-btn', 'data-period': '30d', 'click': function(e) { self.changePeriod(e, '30d'); } }, _('30 Days'))
			]),
			E('div', { 'class': 'chart-container large' }, [
				E('canvas', { 'id': 'historical-chart', 'width': '800', 'height': '300' })
			])
		]);
		v.appendChild(historicalSection);

		// Top Talkers and Protocol Breakdown
		var analyticsRow = E('div', { 'class': 'analytics-row' }, [
			// Top Talkers
			E('div', { 'class': 'analytics-card' }, [
				E('h3', {}, _('Top Bandwidth Consumers')),
				E('div', { 'class': 'talkers-list', 'id': 'top-talkers' },
					topTalkers.length > 0 ?
						topTalkers.map(function(talker, index) {
							var maxUsage = topTalkers[0].used_mb || 1;
							var percent = (talker.used_mb / maxUsage) * 100;
							return E('div', { 'class': 'talker-item' }, [
								E('div', { 'class': 'talker-rank' }, '#' + (index + 1)),
								E('div', { 'class': 'talker-info' }, [
									E('div', { 'class': 'talker-name' }, talker.hostname || talker.mac),
									E('div', { 'class': 'talker-ip' }, talker.ip || '')
								]),
								E('div', { 'class': 'talker-usage' }, [
									E('div', { 'class': 'usage-bar-bg' }, [
										E('div', { 'class': 'usage-bar-fill', 'style': 'width: ' + percent + '%' })
									]),
									E('span', { 'class': 'usage-value' }, self.formatBytes(talker.used_mb * 1024 * 1024))
								])
							]);
						}) :
						[E('div', { 'class': 'empty-message' }, _('No data available'))]
				)
			]),

			// Protocol Breakdown
			E('div', { 'class': 'analytics-card' }, [
				E('h3', {}, _('Protocol Distribution')),
				E('div', { 'class': 'chart-container pie' }, [
					E('canvas', { 'id': 'protocol-chart', 'width': '250', 'height': '250' })
				]),
				E('div', { 'class': 'protocol-legend', 'id': 'protocol-legend' },
					protocols.map(function(proto, index) {
						var colors = [COLORS.cyan, COLORS.emerald, COLORS.violet, COLORS.amber, COLORS.rose];
						return E('div', { 'class': 'legend-item' }, [
							E('span', { 'class': 'legend-color', 'style': 'background: ' + colors[index % colors.length] }),
							E('span', { 'class': 'legend-label' }, proto.protocol || _('Unknown')),
							E('span', { 'class': 'legend-value' }, proto.connections ? proto.connections + ' conn' : self.formatBytes(proto.bytes || 0))
						]);
					})
				)
			])
		]);
		v.appendChild(analyticsRow);

		// Initialize charts after DOM is ready
		requestAnimationFrame(function() {
			self.initRealtimeChart();
			self.drawHistoricalChart(historical);
			self.drawProtocolChart(protocols);
			self.startRealtimePolling();
		});

		return KissTheme.wrap([v], 'admin/services/bandwidth-manager/traffic-graphs');
	},

	initRealtimeChart: function() {
		var canvas = document.getElementById('realtime-chart');
		if (!canvas) return;

		var ctx = canvas.getContext('2d');
		var rect = canvas.parentElement.getBoundingClientRect();
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = 200 * window.devicePixelRatio;
		canvas.style.width = rect.width + 'px';
		canvas.style.height = '200px';
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

		// Initialize with empty data
		for (var i = 0; i < this.maxDataPoints; i++) {
			this.realtimeData.push({ rx: 0, tx: 0 });
		}

		this.drawRealtimeChart();
	},

	drawRealtimeChart: function() {
		var canvas = document.getElementById('realtime-chart');
		if (!canvas) return;

		var ctx = canvas.getContext('2d');
		var width = canvas.width / window.devicePixelRatio;
		var height = canvas.height / window.devicePixelRatio;

		// Clear
		ctx.clearRect(0, 0, width, height);

		// Find max value for scaling
		var maxVal = 10;
		this.realtimeData.forEach(function(d) {
			maxVal = Math.max(maxVal, d.rx, d.tx);
		});
		maxVal = Math.ceil(maxVal / 10) * 10;

		// Draw grid
		ctx.strokeStyle = COLORS.grid;
		ctx.lineWidth = 1;
		for (var i = 0; i <= 4; i++) {
			var y = height - (height * i / 4);
			ctx.beginPath();
			ctx.moveTo(40, y);
			ctx.lineTo(width, y);
			ctx.stroke();

			ctx.fillStyle = COLORS.text;
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'right';
			ctx.fillText((maxVal * i / 4).toFixed(0), 35, y + 4);
		}

		// Draw download line
		ctx.strokeStyle = COLORS.download;
		ctx.lineWidth = 2;
		ctx.beginPath();
		var self = this;
		this.realtimeData.forEach(function(d, i) {
			var x = 40 + (i / (self.maxDataPoints - 1)) * (width - 50);
			var y = height - (d.rx / maxVal) * height;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();

		// Fill download area
		ctx.lineTo(width - 10, height);
		ctx.lineTo(40, height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
		ctx.fill();

		// Draw upload line
		ctx.strokeStyle = COLORS.upload;
		ctx.lineWidth = 2;
		ctx.beginPath();
		this.realtimeData.forEach(function(d, i) {
			var x = 40 + (i / (self.maxDataPoints - 1)) * (width - 50);
			var y = height - (d.tx / maxVal) * height;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();

		// Legend
		ctx.fillStyle = COLORS.download;
		ctx.fillRect(width - 120, 10, 12, 12);
		ctx.fillStyle = COLORS.text;
		ctx.textAlign = 'left';
		ctx.fillText(_('Download'), width - 105, 20);

		ctx.fillStyle = COLORS.upload;
		ctx.fillRect(width - 120, 28, 12, 12);
		ctx.fillStyle = COLORS.text;
		ctx.fillText(_('Upload'), width - 105, 38);
	},

	drawHistoricalChart: function(data) {
		var canvas = document.getElementById('historical-chart');
		if (!canvas) return;

		var ctx = canvas.getContext('2d');
		var rect = canvas.parentElement.getBoundingClientRect();
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = 300 * window.devicePixelRatio;
		canvas.style.width = rect.width + 'px';
		canvas.style.height = '300px';
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

		var width = rect.width;
		var height = 300;

		// Clear
		ctx.clearRect(0, 0, width, height);

		if (data.length === 0) {
			ctx.fillStyle = COLORS.text;
			ctx.font = '14px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(_('No historical data available'), width / 2, height / 2);
			return;
		}

		// Find max for scaling
		var maxVal = 0;
		data.forEach(function(d) {
			maxVal = Math.max(maxVal, d.rx_bytes || 0, d.tx_bytes || 0);
		});
		if (maxVal === 0) maxVal = 1;

		// Draw bars
		var barWidth = (width - 60) / data.length - 2;
		var self = this;

		data.forEach(function(d, i) {
			var x = 50 + i * ((width - 60) / data.length);
			var rxHeight = ((d.rx_bytes || 0) / maxVal) * (height - 50);
			var txHeight = ((d.tx_bytes || 0) / maxVal) * (height - 50);

			// Download bar
			ctx.fillStyle = COLORS.download;
			ctx.fillRect(x, height - 30 - rxHeight, barWidth / 2 - 1, rxHeight);

			// Upload bar
			ctx.fillStyle = COLORS.upload;
			ctx.fillRect(x + barWidth / 2, height - 30 - txHeight, barWidth / 2 - 1, txHeight);
		});

		// Y-axis labels
		ctx.fillStyle = COLORS.text;
		ctx.font = '11px sans-serif';
		ctx.textAlign = 'right';
		for (var i = 0; i <= 4; i++) {
			var val = (maxVal * i / 4);
			var y = height - 30 - ((height - 50) * i / 4);
			ctx.fillText(self.formatBytes(val), 45, y + 4);
		}

		// Legend
		ctx.fillStyle = COLORS.download;
		ctx.fillRect(width - 140, 10, 12, 12);
		ctx.fillStyle = COLORS.text;
		ctx.textAlign = 'left';
		ctx.fillText(_('Download'), width - 125, 20);

		ctx.fillStyle = COLORS.upload;
		ctx.fillRect(width - 140, 28, 12, 12);
		ctx.fillStyle = COLORS.text;
		ctx.fillText(_('Upload'), width - 125, 38);
	},

	drawProtocolChart: function(protocols) {
		var canvas = document.getElementById('protocol-chart');
		if (!canvas) return;

		var ctx = canvas.getContext('2d');
		canvas.width = 250 * window.devicePixelRatio;
		canvas.height = 250 * window.devicePixelRatio;
		canvas.style.width = '250px';
		canvas.style.height = '250px';
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

		var centerX = 125;
		var centerY = 125;
		var radius = 100;

		if (protocols.length === 0) {
			ctx.fillStyle = COLORS.text;
			ctx.font = '14px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(_('No data'), centerX, centerY);
			return;
		}

		// Calculate total
		var total = 0;
		protocols.forEach(function(p) {
			total += p.bytes || p.connections || 0;
		});
		if (total === 0) total = 1;

		// Draw pie slices
		var colors = [COLORS.cyan, COLORS.emerald, COLORS.violet, COLORS.amber, COLORS.rose, COLORS.blue];
		var startAngle = -Math.PI / 2;

		protocols.forEach(function(proto, i) {
			var value = proto.bytes || proto.connections || 0;
			var sliceAngle = (value / total) * 2 * Math.PI;

			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
			ctx.closePath();
			ctx.fillStyle = colors[i % colors.length];
			ctx.fill();

			startAngle += sliceAngle;
		});

		// Draw center circle (donut)
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
		ctx.fillStyle = '#15151a';
		ctx.fill();

		// Center text
		ctx.fillStyle = '#fff';
		ctx.font = 'bold 18px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(protocols.length, centerX, centerY - 5);
		ctx.font = '12px sans-serif';
		ctx.fillStyle = COLORS.text;
		ctx.fillText(_('Protocols'), centerX, centerY + 15);
	},

	startRealtimePolling: function() {
		var self = this;

		this.pollInterval = poll.add(function() {
			return API.getRealtimeBandwidth().then(function(data) {
				if (data && typeof data.rx_mbps !== 'undefined') {
					// Update stats display
					var dlEl = document.getElementById('realtime-download');
					var ulEl = document.getElementById('realtime-upload');
					if (dlEl) dlEl.textContent = data.rx_mbps.toFixed(1);
					if (ulEl) ulEl.textContent = data.tx_mbps.toFixed(1);

					// Add to chart data
					self.realtimeData.push({ rx: data.rx_mbps, tx: data.tx_mbps });
					if (self.realtimeData.length > self.maxDataPoints) {
						self.realtimeData.shift();
					}

					self.drawRealtimeChart();
				}
			});
		}, 2);
	},

	changePeriod: function(ev, period) {
		var self = this;

		// Update button states
		document.querySelectorAll('.period-btn').forEach(function(btn) {
			btn.classList.remove('active');
		});
		ev.target.classList.add('active');

		// Fetch new data
		API.getHistoricalTraffic(period, 'hour').then(function(result) {
			self.drawHistoricalChart(result.data || []);
		});
	},

	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	getCustomStyles: function() {
		return `
			.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
			.live-indicator { display: flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; font-size: 12px; color: #10b981; }
			.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
			@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
			.realtime-stats { display: flex; gap: 16px; margin-bottom: 20px; }
			.stat-card { display: flex; align-items: center; gap: 12px; flex: 1; background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 12px; padding: 16px 20px; }
			.stat-card.download { border-left: 4px solid #10b981; }
			.stat-card.upload { border-left: 4px solid #06b6d4; }
			.stat-icon { font-size: 28px; }
			.stat-info { }
			.stat-value { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
			.stat-label { font-size: 13px; color: #999; }
			.chart-container { background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 12px; padding: 16px; overflow: hidden; }
			.chart-container.large { min-height: 320px; }
			.chart-container.pie { display: flex; justify-content: center; padding: 20px; }
			.period-selector { display: flex; gap: 8px; margin-bottom: 16px; }
			.period-btn { padding: 8px 16px; border: 1px solid var(--bw-border, #25252f); background: var(--bw-light, #15151a); color: #999; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
			.period-btn:hover { border-color: #8b5cf6; color: #fff; }
			.period-btn.active { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-color: transparent; color: #fff; }
			.analytics-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-top: 24px; }
			.analytics-card { background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 12px; padding: 20px; }
			.analytics-card h3 { margin: 0 0 16px 0; font-size: 16px; color: #fff; }
			.talkers-list { display: flex; flex-direction: column; gap: 12px; }
			.talker-item { display: flex; align-items: center; gap: 12px; }
			.talker-rank { font-size: 14px; font-weight: 700; color: #8b5cf6; width: 30px; }
			.talker-info { flex: 1; min-width: 0; }
			.talker-name { font-size: 14px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.talker-ip { font-size: 12px; color: #666; font-family: monospace; }
			.talker-usage { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 100px; }
			.usage-bar-bg { width: 100%; height: 6px; background: var(--bw-dark, #0a0a0f); border-radius: 3px; overflow: hidden; }
			.usage-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%); border-radius: 3px; }
			.usage-value { font-size: 12px; color: #999; }
			.protocol-legend { margin-top: 16px; }
			.legend-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
			.legend-color { width: 12px; height: 12px; border-radius: 3px; }
			.legend-label { flex: 1; font-size: 13px; color: #ccc; text-transform: uppercase; }
			.legend-value { font-size: 13px; color: #666; }
			.empty-message { text-align: center; padding: 20px; color: #666; }
		`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
