'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require poll';
'require bandwidth-manager/api as API';

return L.view.extend({
	historyData: {},
	maxDataPoints: 60,

	load: function() {
		return API.getUsageRealtime();
	},

	render: function(clients) {
		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Real-time Usage')),
			E('div', { 'class': 'cbi-map-descr' }, _('Live bandwidth usage per client (updates every 5 seconds)'))
		]);

		// Real-time usage graph
		var graphContainer = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Network Traffic Graph')),
			E('canvas', {
				'id': 'usage-graph',
				'width': '800',
				'height': '300',
				'style': 'width: 100%; background: #f8f9fa; border-radius: 4px; padding: 10px;'
			})
		]);
		v.appendChild(graphContainer);

		var container = E('div', { 'id': 'usage-container', 'class': 'cbi-section' });
		v.appendChild(container);

		// Initial render
		this.renderUsageTable(container, clients);
		this.updateGraph(clients);

		// Auto-refresh every 5 seconds
		poll.add(L.bind(function() {
			return API.getUsageRealtime().then(L.bind(function(data) {
				this.renderUsageTable(container, data);
				this.updateGraph(data);
			}, this));
		}, this), 5);

		return v;
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
		var timestamp = Date.now();
		if (!this.historyData.timestamps) {
			this.historyData.timestamps = [];
			this.historyData.rx = [];
			this.historyData.tx = [];
		}

		this.historyData.timestamps.push(timestamp);
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

		// Draw grid and axes
		ctx.strokeStyle = '#dee2e6';
		ctx.lineWidth = 1;

		// Horizontal grid lines
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
		if (maxValue === 0) maxValue = 1024; // Minimum scale

		// Draw RX line (download - green)
		if (this.historyData.rx.length > 1) {
			ctx.strokeStyle = '#28a745';
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (var i = 0; i < this.historyData.rx.length; i++) {
				var x = 50 + ((width - 70) * (i / Math.max(this.historyData.rx.length - 1, 1)));
				var value = this.historyData.rx[i];
				var y = height - 40 - ((height - 60) * (value / maxValue));
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}

		// Draw TX line (upload - blue)
		if (this.historyData.tx.length > 1) {
			ctx.strokeStyle = '#007bff';
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (var i = 0; i < this.historyData.tx.length; i++) {
				var x = 50 + ((width - 70) * (i / Math.max(this.historyData.tx.length - 1, 1)));
				var value = this.historyData.tx[i];
				var y = height - 40 - ((height - 60) * (value / maxValue));
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}

		// Draw axes
		ctx.strokeStyle = '#495057';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(50, 20);
		ctx.lineTo(50, height - 20);
		ctx.lineTo(width - 20, height - 20);
		ctx.stroke();

		// Draw labels
		ctx.fillStyle = '#495057';
		ctx.font = '12px sans-serif';

		// Y-axis labels
		for (var i = 0; i <= 5; i++) {
			var y = (height - 40) * (i / 5) + 20;
			var value = maxValue * (1 - i / 5);
			ctx.fillText(this.formatBytes(value), 5, y + 5);
		}

		// Legend
		ctx.fillStyle = '#28a745';
		ctx.fillRect(width - 150, 30, 15, 15);
		ctx.fillStyle = '#495057';
		ctx.fillText('⬇ Download', width - 130, 42);

		ctx.fillStyle = '#007bff';
		ctx.fillRect(width - 150, 55, 15, 15);
		ctx.fillStyle = '#495057';
		ctx.fillText('⬆ Upload', width - 130, 67);

		// Current values
		ctx.font = '14px sans-serif';
		ctx.fillStyle = '#28a745';
		ctx.fillText('⬇ ' + this.formatBytes(totalRx), width - 150, 95);
		ctx.fillStyle = '#007bff';
		ctx.fillText('⬆ ' + this.formatBytes(totalTx), width - 150, 115);
	},

	renderUsageTable: function(container, clients) {
		L.dom.content(container, [
			E('h3', {}, _('Active Clients')),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Client')),
					E('th', { 'class': 'th' }, _('IP')),
					E('th', { 'class': 'th' }, _('MAC')),
					E('th', { 'class': 'th' }, _('Download')),
					E('th', { 'class': 'th' }, _('Upload')),
					E('th', { 'class': 'th' }, _('Total')),
					E('th', { 'class': 'th' }, _('Quota'))
				])
			].concat(clients.length > 0 ? clients.map(L.bind(function(client) {
				var total = (client.rx_bytes || 0) + (client.tx_bytes || 0);
				
				var quotaCell = _('None');
				if (client.has_quota) {
					var percent = client.limit_mb > 0 ? Math.floor((client.used_mb * 100) / client.limit_mb) : 0;
					var color = percent > 90 ? 'red' : (percent > 75 ? 'orange' : 'green');
					quotaCell = [
						E('div', {}, client.used_mb + ' / ' + client.limit_mb + ' MB'),
						E('div', { 'style': 'background: #eee; width: 80px; height: 8px; border-radius: 4px;' }, [
							E('div', {
								'style': 'background: ' + color + '; width: ' + Math.min(percent, 100) + '%; height: 100%; border-radius: 4px;'
							})
						])
					];
				}

				return E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, client.hostname),
					E('td', { 'class': 'td' }, client.ip),
					E('td', { 'class': 'td' }, E('code', {}, client.mac)),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'color: #28a745' }, '⬇ ' + this.formatBytes(client.rx_bytes))
					]),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'color: #dc3545' }, '⬆ ' + this.formatBytes(client.tx_bytes))
					]),
					E('td', { 'class': 'td' }, E('strong', {}, this.formatBytes(total))),
					E('td', { 'class': 'td' }, quotaCell)
				]);
			}, this)) : [
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td center', 'colspan': 7 }, 
						E('em', {}, _('No active clients')))
				])
			]))
		]);
	},

	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
