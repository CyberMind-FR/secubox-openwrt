'use strict';
'require view';
'require dom';
'require poll';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	historyData: {},
	maxDataPoints: 60,

	load: function() {
		return API.getUsageRealtime();
	},

	renderStats: function(clients) {
		var c = KissTheme.colors;
		var totalRx = 0, totalTx = 0;
		clients.forEach(function(client) {
			totalRx += client.rx_bytes || 0;
			totalTx += client.tx_bytes || 0;
		});

		return [
			KissTheme.stat(this.formatBytes(totalRx), 'Download', c.green),
			KissTheme.stat(this.formatBytes(totalTx), 'Upload', c.blue),
			KissTheme.stat(clients.length, 'Active Clients', c.purple),
			KissTheme.stat(this.formatBytes(totalRx + totalTx), 'Total', c.cyan)
		];
	},

	renderGraph: function() {
		return E('div', {
			'style': 'background: var(--kiss-bg); border-radius: 8px; padding: 16px;'
		}, [
			E('canvas', {
				'id': 'usage-graph',
				'width': '800',
				'height': '250',
				'style': 'width: 100%; background: var(--kiss-bg2); border-radius: 6px;'
			})
		]);
	},

	renderClientsTable: function(clients) {
		var self = this;

		if (clients.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No active clients');
		}

		var rows = clients.map(function(client) {
			var total = (client.rx_bytes || 0) + (client.tx_bytes || 0);

			var quotaCell = E('span', { 'style': 'color: var(--kiss-muted);' }, 'None');
			if (client.has_quota) {
				var percent = client.limit_mb > 0 ? Math.floor((client.used_mb * 100) / client.limit_mb) : 0;
				var progressColor = percent > 90 ? 'var(--kiss-red)' : (percent > 75 ? 'var(--kiss-orange)' : 'var(--kiss-green)');
				quotaCell = E('div', {}, [
					E('div', { 'style': 'font-size: 12px; margin-bottom: 4px;' }, client.used_mb + ' / ' + client.limit_mb + ' MB'),
					E('div', { 'style': 'background: var(--kiss-bg); width: 80px; height: 6px; border-radius: 3px; overflow: hidden;' }, [
						E('div', {
							'style': 'background: ' + progressColor + '; width: ' + Math.min(percent, 100) + '%; height: 100%;'
						})
					])
				]);
			}

			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 500;' }, client.hostname || 'Unknown'),
				E('td', { 'style': 'font-family: monospace;' }, client.ip),
				E('td', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, client.mac),
				E('td', { 'style': 'color: var(--kiss-green);' }, '\u2b07 ' + self.formatBytes(client.rx_bytes || 0)),
				E('td', { 'style': 'color: var(--kiss-blue);' }, '\u2b06 ' + self.formatBytes(client.tx_bytes || 0)),
				E('td', { 'style': 'font-weight: 600;' }, self.formatBytes(total)),
				E('td', {}, quotaCell)
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Client'),
					E('th', {}, 'IP'),
					E('th', {}, 'MAC'),
					E('th', {}, 'Download'),
					E('th', {}, 'Upload'),
					E('th', {}, 'Total'),
					E('th', {}, 'Quota')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	render: function(clients) {
		var self = this;
		clients = clients || [];

		poll.add(L.bind(function() {
			return API.getUsageRealtime().then(L.bind(function(data) {
				this.updateDisplay(data);
				this.updateGraph(data);
			}, this));
		}, this), 5);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Real-time Usage'),
					KissTheme.badge('Live', 'green')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Live bandwidth usage per client (updates every 5 seconds)')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'usage-stats', 'style': 'margin: 20px 0;' },
				this.renderStats(clients)),

			// Graph
			KissTheme.card('Network Traffic Graph', this.renderGraph()),

			// Clients Table
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Active Clients'),
					KissTheme.badge(clients.length + ' clients', 'blue')
				]),
				E('div', { 'id': 'clients-table' }, this.renderClientsTable(clients))
			)
		];

		// Initial graph update
		setTimeout(function() {
			self.updateGraph(clients);
		}, 100);

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/usage');
	},

	updateDisplay: function(clients) {
		var statsEl = document.getElementById('usage-stats');
		var tableEl = document.getElementById('clients-table');

		if (statsEl) dom.content(statsEl, this.renderStats(clients));
		if (tableEl) dom.content(tableEl, this.renderClientsTable(clients));
	},

	updateGraph: function(clients) {
		var canvas = document.getElementById('usage-graph');
		if (!canvas) return;

		var ctx = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;

		// Calculate total bandwidth
		var totalRx = 0, totalTx = 0;
		clients.forEach(function(client) {
			totalRx += client.rx_bytes || 0;
			totalTx += client.tx_bytes || 0;
		});

		// Store history data
		if (!this.historyData.timestamps) {
			this.historyData.timestamps = [];
			this.historyData.rx = [];
			this.historyData.tx = [];
		}

		this.historyData.timestamps.push(Date.now());
		this.historyData.rx.push(totalRx);
		this.historyData.tx.push(totalTx);

		// Keep only last N data points
		if (this.historyData.timestamps.length > this.maxDataPoints) {
			this.historyData.timestamps.shift();
			this.historyData.rx.shift();
			this.historyData.tx.shift();
		}

		// Clear canvas
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#0d0d12';
		ctx.fillRect(0, 0, width, height);

		// Draw grid
		ctx.strokeStyle = 'rgba(255,255,255,0.1)';
		ctx.lineWidth = 1;

		for (var i = 0; i <= 5; i++) {
			var y = (height - 40) * (i / 5) + 20;
			ctx.beginPath();
			ctx.moveTo(50, y);
			ctx.lineTo(width - 20, y);
			ctx.stroke();
		}

		// Find max value for scaling
		var maxValue = 0;
		for (var i = 0; i < this.historyData.rx.length; i++) {
			maxValue = Math.max(maxValue, this.historyData.rx[i], this.historyData.tx[i]);
		}
		if (maxValue === 0) maxValue = 1024;

		// Draw RX line (download - green)
		if (this.historyData.rx.length > 1) {
			ctx.strokeStyle = '#22c55e';
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (var i = 0; i < this.historyData.rx.length; i++) {
				var x = 50 + ((width - 70) * (i / Math.max(this.historyData.rx.length - 1, 1)));
				var value = this.historyData.rx[i];
				var y = height - 40 - ((height - 60) * (value / maxValue));
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw TX line (upload - blue)
		if (this.historyData.tx.length > 1) {
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (var i = 0; i < this.historyData.tx.length; i++) {
				var x = 50 + ((width - 70) * (i / Math.max(this.historyData.tx.length - 1, 1)));
				var value = this.historyData.tx[i];
				var y = height - 40 - ((height - 60) * (value / maxValue));
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		// Draw axes
		ctx.strokeStyle = 'rgba(255,255,255,0.3)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(50, 20);
		ctx.lineTo(50, height - 20);
		ctx.lineTo(width - 20, height - 20);
		ctx.stroke();

		// Draw labels
		ctx.fillStyle = 'rgba(255,255,255,0.6)';
		ctx.font = '11px monospace';

		for (var i = 0; i <= 5; i++) {
			var y = (height - 40) * (i / 5) + 20;
			var value = maxValue * (1 - i / 5);
			ctx.fillText(this.formatBytes(value), 5, y + 4);
		}

		// Legend
		ctx.fillStyle = '#22c55e';
		ctx.fillRect(width - 140, 25, 12, 12);
		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.fillText('Download', width - 123, 35);

		ctx.fillStyle = '#3b82f6';
		ctx.fillRect(width - 140, 45, 12, 12);
		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.fillText('Upload', width - 123, 55);

		// Current values
		ctx.font = '12px monospace';
		ctx.fillStyle = '#22c55e';
		ctx.fillText('\u2b07 ' + this.formatBytes(totalRx), width - 140, 80);
		ctx.fillStyle = '#3b82f6';
		ctx.fillText('\u2b06 ' + this.formatBytes(totalTx), width - 140, 98);
	},

	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
});
