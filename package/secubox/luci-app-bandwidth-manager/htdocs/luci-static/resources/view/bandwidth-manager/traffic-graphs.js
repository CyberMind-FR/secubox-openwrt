'use strict';
'require view';
'require ui';
'require poll';
'require dom';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	realtimeData: [],
	maxDataPoints: 60,

	load: function() {
		return Promise.all([
			API.getHistoricalTraffic('24h', 'hour'),
			API.getTopTalkers('24h', 10),
			API.getProtocolBreakdown('24h'),
			API.getStatus()
		]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.total_rx ? this.formatBytes(status.total_rx) : '0', 'Download', c.green),
			KissTheme.stat(status.total_tx ? this.formatBytes(status.total_tx) : '0', 'Upload', c.blue),
			KissTheme.stat(status.active_clients || 0, 'Clients', c.purple),
			KissTheme.stat(status.rule_count || 0, 'Rules', c.cyan)
		];
	},

	renderRealtimeGraph: function() {
		return E('div', {
			'style': 'background: var(--kiss-bg); border-radius: 8px; padding: 16px;'
		}, [
			E('canvas', {
				'id': 'realtime-chart',
				'width': '800',
				'height': '200',
				'style': 'width: 100%; background: #0a0a0f; border-radius: 6px;'
			})
		]);
	},

	renderHistoricalGraph: function() {
		return E('div', {
			'style': 'background: var(--kiss-bg); border-radius: 8px; padding: 16px;'
		}, [
			E('canvas', {
				'id': 'historical-chart',
				'width': '800',
				'height': '300',
				'style': 'width: 100%; background: #0a0a0f; border-radius: 6px;'
			})
		]);
	},

	renderTopTalkers: function(topTalkers) {
		var self = this;

		if (topTalkers.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No data available');
		}

		var maxUsage = topTalkers[0].used_mb || 1;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
			topTalkers.map(function(talker, index) {
				var percent = (talker.used_mb / maxUsage) * 100;
				return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('span', { 'style': 'width: 24px; font-weight: 700; color: var(--kiss-purple);' }, '#' + (index + 1)),
					E('div', { 'style': 'flex: 1;' }, [
						E('div', { 'style': 'font-weight: 500;' }, talker.hostname || talker.mac),
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, talker.ip || '')
					]),
					E('div', { 'style': 'width: 120px;' }, [
						E('div', { 'style': 'height: 6px; background: var(--kiss-bg2); border-radius: 3px; overflow: hidden; margin-bottom: 4px;' }, [
							E('div', { 'style': 'height: 100%; width: ' + percent + '%; background: var(--kiss-purple);' })
						]),
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-align: right;' }, self.formatBytes(talker.used_mb * 1024 * 1024))
					])
				]);
			})
		);
	},

	renderProtocolLegend: function(protocols) {
		var self = this;
		var colors = ['var(--kiss-cyan)', 'var(--kiss-green)', 'var(--kiss-purple)', 'var(--kiss-orange)', 'var(--kiss-red)'];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
			protocols.map(function(proto, index) {
				return E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					E('span', { 'style': 'width: 12px; height: 12px; background: ' + colors[index % colors.length] + '; border-radius: 2px;' }),
					E('span', { 'style': 'flex: 1; font-size: 13px; text-transform: uppercase;' }, proto.protocol || 'Unknown'),
					E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' },
						proto.connections ? proto.connections + ' conn' : self.formatBytes(proto.bytes || 0))
				]);
			})
		);
	},

	render: function(data) {
		var self = this;
		var historical = (data[0] && data[0].data) || [];
		var topTalkers = (data[1] && data[1].talkers) || [];
		var protocols = (data[2] && data[2].protocols) || [];
		var status = data[3] || {};

		// Initialize realtime data
		for (var i = 0; i < this.maxDataPoints; i++) {
			this.realtimeData.push({ rx: 0, tx: 0 });
		}

		poll.add(L.bind(this.pollRealtime, this), 2);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Traffic Graphs'),
					E('div', { 'style': 'display: flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(34, 197, 94, 0.1); border-radius: 12px;' }, [
						E('span', { 'style': 'width: 8px; height: 8px; background: var(--kiss-green); border-radius: 50%; animation: pulse 2s infinite;' }),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-green);' }, 'Live')
					])
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Real-time and historical bandwidth visualization')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// Realtime Stats
			E('div', { 'style': 'display: flex; gap: 16px; margin-bottom: 20px;' }, [
				E('div', { 'style': 'flex: 1; background: var(--kiss-bg2); border-left: 4px solid var(--kiss-green); padding: 16px; border-radius: 8px;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('span', { 'style': 'font-size: 24px;' }, '\u2b07\ufe0f'),
						E('div', {}, [
							E('div', { 'id': 'realtime-download', 'style': 'font-size: 28px; font-weight: 700; color: var(--kiss-green);' }, '0'),
							E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Download (Mbps)')
						])
					])
				]),
				E('div', { 'style': 'flex: 1; background: var(--kiss-bg2); border-left: 4px solid var(--kiss-blue); padding: 16px; border-radius: 8px;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('span', { 'style': 'font-size: 24px;' }, '\u2b06\ufe0f'),
						E('div', {}, [
							E('div', { 'id': 'realtime-upload', 'style': 'font-size: 28px; font-weight: 700; color: var(--kiss-blue);' }, '0'),
							E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Upload (Mbps)')
						])
					])
				])
			]),

			// Realtime Graph
			KissTheme.card('Real-time Bandwidth', this.renderRealtimeGraph()),

			// Historical Graph
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Historical Traffic'),
					E('div', { 'id': 'period-selector', 'style': 'display: flex; gap: 8px;' }, [
						E('button', { 'class': 'kiss-btn kiss-btn-blue', 'data-period': '24h' }, '24h'),
						E('button', { 'class': 'kiss-btn', 'data-period': '7d', 'click': function() { self.changePeriod('7d', this); } }, '7d'),
						E('button', { 'class': 'kiss-btn', 'data-period': '30d', 'click': function() { self.changePeriod('30d', this); } }, '30d')
					])
				]),
				this.renderHistoricalGraph()
			),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Top Bandwidth Users'),
						KissTheme.badge(topTalkers.length + ' users', 'purple')
					]),
					E('div', { 'id': 'top-talkers' }, this.renderTopTalkers(topTalkers))
				),
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Protocol Distribution'),
						KissTheme.badge(protocols.length + ' protocols', 'cyan')
					]),
					E('div', { 'id': 'protocol-legend' }, this.renderProtocolLegend(protocols))
				)
			])
		];

		// Initialize charts after DOM is ready
		requestAnimationFrame(function() {
			self.initRealtimeChart();
			self.drawHistoricalChart(historical);
		});

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/traffic-graphs');
	},

	pollRealtime: function() {
		var self = this;
		return API.getRealtimeBandwidth().then(function(data) {
			if (data && typeof data.rx_mbps !== 'undefined') {
				var dlEl = document.getElementById('realtime-download');
				var ulEl = document.getElementById('realtime-upload');
				if (dlEl) dlEl.textContent = data.rx_mbps.toFixed(1);
				if (ulEl) ulEl.textContent = data.tx_mbps.toFixed(1);

				self.realtimeData.push({ rx: data.rx_mbps, tx: data.tx_mbps });
				if (self.realtimeData.length > self.maxDataPoints) {
					self.realtimeData.shift();
				}

				self.drawRealtimeChart();
			}
		});
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

		this.drawRealtimeChart();
	},

	drawRealtimeChart: function() {
		var canvas = document.getElementById('realtime-chart');
		if (!canvas) return;

		var ctx = canvas.getContext('2d');
		var width = canvas.width / window.devicePixelRatio;
		var height = canvas.height / window.devicePixelRatio;

		ctx.clearRect(0, 0, width, height);

		var maxVal = 10;
		this.realtimeData.forEach(function(d) {
			maxVal = Math.max(maxVal, d.rx, d.tx);
		});
		maxVal = Math.ceil(maxVal / 10) * 10;

		// Grid
		ctx.strokeStyle = 'rgba(255,255,255,0.1)';
		ctx.lineWidth = 1;
		for (var i = 0; i <= 4; i++) {
			var y = height - (height * i / 4);
			ctx.beginPath();
			ctx.moveTo(40, y);
			ctx.lineTo(width, y);
			ctx.stroke();

			ctx.fillStyle = 'rgba(255,255,255,0.5)';
			ctx.font = '11px monospace';
			ctx.textAlign = 'right';
			ctx.fillText((maxVal * i / 4).toFixed(0), 35, y + 4);
		}

		var self = this;

		// Download line
		ctx.strokeStyle = '#22c55e';
		ctx.lineWidth = 2;
		ctx.beginPath();
		this.realtimeData.forEach(function(d, i) {
			var x = 40 + (i / (self.maxDataPoints - 1)) * (width - 50);
			var y = height - (d.rx / maxVal) * height;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();

		// Upload line
		ctx.strokeStyle = '#3b82f6';
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
		ctx.fillStyle = '#22c55e';
		ctx.fillRect(width - 100, 10, 10, 10);
		ctx.fillStyle = 'rgba(255,255,255,0.7)';
		ctx.textAlign = 'left';
		ctx.fillText('Download', width - 85, 19);

		ctx.fillStyle = '#3b82f6';
		ctx.fillRect(width - 100, 26, 10, 10);
		ctx.fillStyle = 'rgba(255,255,255,0.7)';
		ctx.fillText('Upload', width - 85, 35);
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
		var self = this;

		ctx.clearRect(0, 0, width, height);

		if (data.length === 0) {
			ctx.fillStyle = 'rgba(255,255,255,0.5)';
			ctx.font = '14px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText('No historical data available', width / 2, height / 2);
			return;
		}

		var maxVal = 0;
		data.forEach(function(d) {
			maxVal = Math.max(maxVal, d.rx_bytes || 0, d.tx_bytes || 0);
		});
		if (maxVal === 0) maxVal = 1;

		var barWidth = (width - 60) / data.length - 2;

		data.forEach(function(d, i) {
			var x = 50 + i * ((width - 60) / data.length);
			var rxHeight = ((d.rx_bytes || 0) / maxVal) * (height - 50);
			var txHeight = ((d.tx_bytes || 0) / maxVal) * (height - 50);

			ctx.fillStyle = '#22c55e';
			ctx.fillRect(x, height - 30 - rxHeight, barWidth / 2 - 1, rxHeight);

			ctx.fillStyle = '#3b82f6';
			ctx.fillRect(x + barWidth / 2, height - 30 - txHeight, barWidth / 2 - 1, txHeight);
		});

		// Y-axis
		ctx.fillStyle = 'rgba(255,255,255,0.5)';
		ctx.font = '11px monospace';
		ctx.textAlign = 'right';
		for (var i = 0; i <= 4; i++) {
			var val = (maxVal * i / 4);
			var y = height - 30 - ((height - 50) * i / 4);
			ctx.fillText(self.formatBytes(val), 45, y + 4);
		}
	},

	changePeriod: function(period, btn) {
		var self = this;
		document.querySelectorAll('#period-selector button').forEach(function(b) {
			b.classList.remove('kiss-btn-blue');
		});
		btn.classList.add('kiss-btn-blue');

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
	}
});
