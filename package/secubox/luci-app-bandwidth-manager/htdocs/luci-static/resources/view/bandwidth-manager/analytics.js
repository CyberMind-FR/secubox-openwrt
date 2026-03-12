'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callGetAnalyticsSummary = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_analytics_summary',
	params: ['period'],
	expect: {}
});

var callGetHourlyData = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_hourly_data',
	params: ['days'],
	expect: { hourly_data: [] }
});

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	summary: {},
	hourlyData: [],
	selectedPeriod: '24h',

	load: function() {
		return Promise.all([
			callGetAnalyticsSummary('24h'),
			callGetHourlyData(7)
		]);
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var totalTraffic = (this.summary.total_rx_bytes || 0) + (this.summary.total_tx_bytes || 0);

		return [
			KissTheme.stat(this.formatBytes(this.summary.total_rx_bytes || 0), 'Download', c.green),
			KissTheme.stat(this.formatBytes(this.summary.total_tx_bytes || 0), 'Upload', c.blue),
			KissTheme.stat(this.summary.active_clients || 0, 'Active Clients', c.purple),
			KissTheme.stat(this.formatBytes(totalTraffic), 'Total Traffic', c.orange)
		];
	},

	renderPeriodSelector: function() {
		var self = this;
		var periods = [
			{ id: '1h', label: '1 Hour' },
			{ id: '6h', label: '6 Hours' },
			{ id: '24h', label: '24 Hours' },
			{ id: '7d', label: '7 Days' },
			{ id: '30d', label: '30 Days' }
		];

		return E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;' },
			periods.map(function(p) {
				var isActive = self.selectedPeriod === p.id;
				return E('button', {
					'class': 'kiss-btn' + (isActive ? ' kiss-btn-blue' : ''),
					'data-period': p.id,
					'click': function() {
						self.selectedPeriod = p.id;
						document.querySelectorAll('[data-period]').forEach(function(btn) {
							btn.classList.remove('kiss-btn-blue');
						});
						this.classList.add('kiss-btn-blue');
						self.pollData();
					}
				}, p.label);
			})
		);
	},

	renderAppBreakdown: function() {
		var self = this;
		var appBreakdown = this.summary.app_breakdown || [];

		if (appBreakdown.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No application data available');
		}

		var maxBytes = Math.max.apply(null, appBreakdown.map(function(a) { return a.bytes || 0; })) || 1;
		var colors = ['var(--kiss-blue)', 'var(--kiss-green)', 'var(--kiss-orange)', 'var(--kiss-purple)', 'var(--kiss-cyan)', 'var(--kiss-red)'];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
			appBreakdown.slice(0, 8).map(function(app, idx) {
				var percent = Math.round((app.bytes / maxBytes) * 100);
				var color = colors[idx % colors.length];

				return E('div', {}, [
					E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 4px;' }, [
						E('span', { 'style': 'font-size: 13px;' }, app.app || 'Unknown'),
						E('span', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, self.formatBytes(app.bytes || 0))
					]),
					E('div', {
						'style': 'height: 8px; background: var(--kiss-bg); border-radius: 4px; overflow: hidden;'
					}, [
						E('div', {
							'style': 'height: 100%; width: ' + percent + '%; background: ' + color + ';'
						})
					])
				]);
			})
		);
	},

	renderProtocolBreakdown: function() {
		var protocols = this.summary.protocol_breakdown || [];
		if (protocols.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No protocol data available');
		}

		var total = protocols.reduce(function(sum, p) { return sum + (p.bytes || 0); }, 0) || 1;
		var colors = ['var(--kiss-blue)', 'var(--kiss-green)', 'var(--kiss-orange)', 'var(--kiss-purple)', 'var(--kiss-cyan)'];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
			protocols.slice(0, 5).map(function(p, idx) {
				var percent = Math.round((p.bytes || 0) / total * 100);
				return E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
					E('div', {
						'style': 'width: 12px; height: 12px; background: ' + colors[idx] + '; border-radius: 2px;'
					}),
					E('span', { 'style': 'flex: 1;' }, p.protocol || 'Unknown'),
					E('span', { 'style': 'color: var(--kiss-muted);' }, percent + '%')
				]);
			})
		);
	},

	renderTopTalkers: function() {
		var self = this;
		var topTalkers = this.summary.top_talkers || [];

		if (topTalkers.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No usage data available');
		}

		var medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];

		var rows = topTalkers.map(function(client, idx) {
			return E('tr', {}, [
				E('td', {}, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
						E('span', { 'style': 'font-size: 18px;' }, medals[idx] || ''),
						E('div', {}, [
							E('div', { 'style': 'font-weight: 500;' }, client.hostname || 'Unknown'),
							E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, client.mac)
						])
					])
				]),
				E('td', {}, client.ip || '-'),
				E('td', { 'style': 'text-align: right; font-weight: 600;' }, self.formatMB(client.used_mb || 0))
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Device'),
					E('th', {}, 'IP'),
					E('th', { 'style': 'text-align: right;' }, 'Usage')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	renderSummaryStats: function() {
		var self = this;
		var rxTxRatio = this.summary.total_tx_bytes > 0 ?
			((this.summary.total_rx_bytes || 0) / (this.summary.total_tx_bytes || 1)).toFixed(1) + ':1' : 'N/A';
		var avgPerClient = this.summary.active_clients > 0 ?
			this.formatBytes(((this.summary.total_rx_bytes || 0) + (this.summary.total_tx_bytes || 0)) / this.summary.active_clients) : 'N/A';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('div', { 'style': 'padding: 12px; background: var(--kiss-bg); border-radius: 8px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 4px;' }, [
					E('span', { 'style': 'color: var(--kiss-muted);' }, 'Download/Upload Ratio'),
					E('span', { 'style': 'font-weight: 600;' }, rxTxRatio)
				]),
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Typical ratio is 5:1 to 10:1 for home networks')
			]),
			E('div', { 'style': 'padding: 12px; background: var(--kiss-bg); border-radius: 8px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 4px;' }, [
					E('span', { 'style': 'color: var(--kiss-muted);' }, 'Average per Client'),
					E('span', { 'style': 'font-weight: 600;' }, avgPerClient)
				]),
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Based on ' + (this.summary.active_clients || 0) + ' active devices')
			]),
			E('div', { 'style': 'padding: 12px; background: var(--kiss-bg); border-radius: 8px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 4px;' }, [
					E('span', { 'style': 'color: var(--kiss-muted);' }, 'Applications Detected'),
					E('span', { 'style': 'font-weight: 600;' }, (this.summary.app_breakdown || []).length.toString())
				]),
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Via Deep Packet Inspection')
			])
		]);
	},

	render: function(data) {
		var self = this;
		this.summary = data[0] || {};
		this.hourlyData = (data[1] && data[1].hourly_data) || [];

		poll.add(L.bind(this.pollData, this), 30);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Bandwidth Analytics'),
					KissTheme.badge(this.selectedPeriod, 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Traffic analysis, usage trends, and application breakdown')
			]),

			// Period Selector
			this.renderPeriodSelector(),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'analytics-stats', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Charts Row
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'id': 'analytics-charts', 'style': 'margin-bottom: 20px;' }, [
				KissTheme.card('Traffic by Application', E('div', { 'id': 'app-breakdown' }, this.renderAppBreakdown())),
				KissTheme.card('Traffic by Protocol', E('div', { 'id': 'protocol-breakdown' }, this.renderProtocolBreakdown()))
			]),

			// Details Row
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'id': 'analytics-details' }, [
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Top Bandwidth Users'),
						KissTheme.badge((this.summary.top_talkers || []).length + ' users', 'purple')
					]),
					E('div', { 'id': 'top-talkers' }, this.renderTopTalkers())
				),
				KissTheme.card('Analytics Summary', E('div', { 'id': 'summary-stats' }, this.renderSummaryStats()))
			])
		];

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/analytics');
	},

	pollData: function() {
		var self = this;
		return callGetAnalyticsSummary(this.selectedPeriod).then(function(data) {
			self.summary = data || {};
			self.updateDisplay();
		});
	},

	updateDisplay: function() {
		var statsEl = document.getElementById('analytics-stats');
		var appEl = document.getElementById('app-breakdown');
		var protoEl = document.getElementById('protocol-breakdown');
		var talkersEl = document.getElementById('top-talkers');
		var summaryEl = document.getElementById('summary-stats');

		if (statsEl) dom.content(statsEl, this.renderStats());
		if (appEl) dom.content(appEl, this.renderAppBreakdown());
		if (protoEl) dom.content(protoEl, this.renderProtocolBreakdown());
		if (talkersEl) dom.content(talkersEl, this.renderTopTalkers());
		if (summaryEl) dom.content(summaryEl, this.renderSummaryStats());
	},

	formatBytes: function(bytes) {
		if (!bytes || bytes === 0) return '0 B';
		var units = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = 0;
		while (bytes >= 1024 && i < units.length - 1) {
			bytes /= 1024;
			i++;
		}
		return bytes.toFixed(1) + ' ' + units[i];
	},

	formatMB: function(mb) {
		if (!mb || mb === 0) return '0 MB';
		if (mb >= 1024) {
			return (mb / 1024).toFixed(1) + ' GB';
		}
		return mb + ' MB';
	}
});
