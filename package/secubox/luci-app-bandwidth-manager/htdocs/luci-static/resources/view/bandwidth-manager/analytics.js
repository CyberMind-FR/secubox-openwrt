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
	summary: {},
	hourlyData: [],
	selectedPeriod: '24h',

	load: function() {
		return Promise.all([
			callGetAnalyticsSummary('24h'),
			callGetHourlyData(7)
		]);
	},

	render: function(data) {
		var self = this;
		this.summary = data[0] || {};
		this.hourlyData = (data[1] && data[1].hourly_data) || [];

		document.body.setAttribute('data-secubox-app', 'bandwidth');

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'Bandwidth Analytics'),
			E('div', { 'class': 'cbi-map-descr' },
				'Traffic analysis, usage trends, and application breakdown'),

			// Period Selector
			E('div', { 'style': 'margin-bottom: 1.5rem;' }, [
				E('div', { 'style': 'display: flex; gap: 0.5rem; flex-wrap: wrap;' }, [
					this.renderPeriodButton('1h', '1 Hour'),
					this.renderPeriodButton('6h', '6 Hours'),
					this.renderPeriodButton('24h', '24 Hours', true),
					this.renderPeriodButton('7d', '7 Days'),
					this.renderPeriodButton('30d', '30 Days')
				])
			]),

			// Stats Grid
			E('div', { 'id': 'stats-container' }, [
				this.renderStatsGrid()
			]),

			// Charts Section
			E('div', { 'id': 'charts-container', 'style': 'margin-top: 1.5rem;' }, [
				this.renderCharts()
			]),

			// Top Talkers & App Breakdown
			E('div', { 'id': 'details-container', 'style': 'margin-top: 1.5rem;' }, [
				this.renderDetails()
			])
		]);

		poll.add(L.bind(this.pollData, this), 30);

		return KissTheme.wrap([view], 'admin/services/bandwidth-manager/analytics');
	},

	pollData: function() {
		var self = this;
		return callGetAnalyticsSummary(this.selectedPeriod).then(function(data) {
			self.summary = data || {};
			self.updateDisplay();
		});
	},

	updateDisplay: function() {
		var statsEl = document.getElementById('stats-container');
		var chartsEl = document.getElementById('charts-container');
		var detailsEl = document.getElementById('details-container');

		if (statsEl) {
			statsEl.innerHTML = '';
			statsEl.appendChild(this.renderStatsGrid());
		}
		if (chartsEl) {
			chartsEl.innerHTML = '';
			chartsEl.appendChild(this.renderCharts());
		}
		if (detailsEl) {
			detailsEl.innerHTML = '';
			detailsEl.appendChild(this.renderDetails());
		}
	},

	renderPeriodButton: function(period, label, isDefault) {
		var self = this;
		var isActive = this.selectedPeriod === period || (isDefault && !this.selectedPeriod);

		return E('button', {
			'class': 'cbi-button' + (isActive ? ' cbi-button-action' : ''),
			'style': 'padding: 0.5rem 1rem;',
			'click': function() {
				self.selectedPeriod = period;
				document.querySelectorAll('.cbi-button[data-period]').forEach(function(btn) {
					btn.classList.remove('cbi-button-action');
				});
				this.classList.add('cbi-button-action');
				self.pollData();
			},
			'data-period': period
		}, label);
	},

	renderStatsGrid: function() {
		var stats = [
			{
				icon: '\u2b07\ufe0f',
				label: 'Total Download',
				value: this.formatBytes(this.summary.total_rx_bytes || 0),
				color: '#22c55e'
			},
			{
				icon: '\u2b06\ufe0f',
				label: 'Total Upload',
				value: this.formatBytes(this.summary.total_tx_bytes || 0),
				color: '#3b82f6'
			},
			{
				icon: '\ud83d\udcf1',
				label: 'Active Clients',
				value: (this.summary.active_clients || 0).toString(),
				color: '#8b5cf6'
			},
			{
				icon: '\ud83d\udcc8',
				label: 'Total Traffic',
				value: this.formatBytes((this.summary.total_rx_bytes || 0) + (this.summary.total_tx_bytes || 0)),
				color: '#f59e0b'
			}
		];

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;'
		}, stats.map(function(stat) {
			return E('div', {
				'style': 'background: var(--cyber-bg-secondary, #141419); border: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08)); border-radius: 12px; padding: 1.25rem;'
			}, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;' }, [
					E('div', {
						'style': 'width: 40px; height: 40px; background: ' + stat.color + '20; color: ' + stat.color + '; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;'
					}, stat.icon),
					E('span', { 'style': 'font-size: 0.875rem; color: var(--cyber-text-secondary, #a1a1aa);' }, stat.label)
				]),
				E('div', { 'style': 'font-size: 1.75rem; font-weight: 700;' }, stat.value)
			]);
		}));
	},

	renderCharts: function() {
		var self = this;

		// Create a simple SVG bar chart for traffic distribution
		var appBreakdown = this.summary.app_breakdown || [];
		var maxBytes = Math.max.apply(null, appBreakdown.map(function(a) { return a.bytes || 0; })) || 1;

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;'
		}, [
			// Application Traffic Chart
			E('div', {
				'style': 'background: var(--cyber-bg-secondary, #141419); border: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08)); border-radius: 12px; padding: 1.25rem;'
			}, [
				E('h4', { 'style': 'margin: 0 0 1rem 0; font-size: 1rem;' }, 'Traffic by Application'),
				appBreakdown.length > 0 ?
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.75rem;' },
						appBreakdown.slice(0, 8).map(function(app, idx) {
							var percent = Math.round((app.bytes / maxBytes) * 100);
							var colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6'];
							var color = colors[idx % colors.length];

							return E('div', {}, [
								E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.25rem;' }, [
									E('span', { 'style': 'font-size: 0.875rem; color: var(--cyber-text-primary);' }, app.app || 'Unknown'),
									E('span', { 'style': 'font-size: 0.875rem; color: var(--cyber-text-secondary);' }, self.formatBytes(app.bytes || 0))
								]),
								E('div', {
									'style': 'height: 8px; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.05)); border-radius: 4px; overflow: hidden;'
								}, [
									E('div', {
										'style': 'height: 100%; width: ' + percent + '%; background: ' + color + '; transition: width 0.3s ease;'
									})
								])
							]);
						})
					) :
					E('div', {
						'style': 'padding: 2rem; text-align: center; color: var(--cyber-text-secondary);'
					}, 'No application data available')
			]),

			// Protocol Breakdown
			E('div', {
				'style': 'background: var(--cyber-bg-secondary, #141419); border: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08)); border-radius: 12px; padding: 1.25rem;'
			}, [
				E('h4', { 'style': 'margin: 0 0 1rem 0; font-size: 1rem;' }, 'Traffic by Protocol'),
				this.renderProtocolPieChart()
			])
		]);
	},

	renderProtocolPieChart: function() {
		var protocols = this.summary.protocol_breakdown || [];
		if (protocols.length === 0) {
			return E('div', {
				'style': 'padding: 2rem; text-align: center; color: var(--cyber-text-secondary);'
			}, 'No protocol data available');
		}

		var total = protocols.reduce(function(sum, p) { return sum + (p.bytes || 0); }, 0) || 1;
		var colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

		return E('div', { 'style': 'display: flex; align-items: center; gap: 2rem;' }, [
			// Simple donut representation
			E('div', {
				'style': 'width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(' +
					protocols.slice(0, 5).map(function(p, idx) {
						var startPercent = protocols.slice(0, idx).reduce(function(sum, pr) {
							return sum + ((pr.bytes || 0) / total * 100);
						}, 0);
						var endPercent = startPercent + ((p.bytes || 0) / total * 100);
						return colors[idx] + ' ' + startPercent + '% ' + endPercent + '%';
					}).join(', ') + '); position: relative;'
			}, [
				E('div', {
					'style': 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; background: var(--cyber-bg-secondary, #141419); border-radius: 50%;'
				})
			]),
			// Legend
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5rem;' },
				protocols.slice(0, 5).map(function(p, idx) {
					var percent = Math.round((p.bytes || 0) / total * 100);
					return E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem;' }, [
						E('div', {
							'style': 'width: 12px; height: 12px; background: ' + colors[idx] + '; border-radius: 2px;'
						}),
						E('span', { 'style': 'font-size: 0.875rem;' }, (p.protocol || 'Unknown') + ' (' + percent + '%)')
					]);
				})
			)
		]);
	},

	renderDetails: function() {
		var self = this;
		var topTalkers = this.summary.top_talkers || [];

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;'
		}, [
			// Top Talkers
			E('div', {
				'style': 'background: var(--cyber-bg-secondary, #141419); border: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08)); border-radius: 12px; overflow: hidden;'
			}, [
				E('div', {
					'style': 'padding: 1rem 1.25rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08));'
				}, [
					E('h4', { 'style': 'margin: 0; font-size: 1rem;' }, 'Top Bandwidth Users')
				]),
				topTalkers.length > 0 ?
					E('table', { 'class': 'table', 'style': 'width: 100%;' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', { 'style': 'padding: 0.75rem 1.25rem;' }, 'Device'),
								E('th', { 'style': 'padding: 0.75rem 1.25rem;' }, 'IP'),
								E('th', { 'style': 'padding: 0.75rem 1.25rem; text-align: right;' }, 'Usage')
							])
						]),
						E('tbody', {},
							topTalkers.map(function(client, idx) {
								var medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49', '', ''];
								return E('tr', {}, [
									E('td', { 'style': 'padding: 0.75rem 1.25rem;' }, [
										E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem;' }, [
											E('span', { 'style': 'font-size: 1.25rem;' }, medals[idx] || ''),
											E('div', {}, [
												E('div', { 'style': 'font-weight: 500;' }, client.hostname || 'Unknown'),
												E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-tertiary);' }, client.mac)
											])
										])
									]),
									E('td', { 'style': 'padding: 0.75rem 1.25rem;' }, client.ip || '-'),
									E('td', { 'style': 'padding: 0.75rem 1.25rem; text-align: right; font-weight: 600;' },
										self.formatMB(client.used_mb || 0))
								]);
							})
						)
					]) :
					E('div', {
						'style': 'padding: 2rem; text-align: center; color: var(--cyber-text-secondary);'
					}, 'No usage data available')
			]),

			// Quick Actions
			E('div', {
				'style': 'background: var(--cyber-bg-secondary, #141419); border: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08)); border-radius: 12px; padding: 1.25rem;'
			}, [
				E('h4', { 'style': 'margin: 0 0 1rem 0; font-size: 1rem;' }, 'Analytics Summary'),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 1rem;' }, [
					E('div', {
						'style': 'padding: 1rem; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.05)); border-radius: 8px;'
					}, [
						E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' }, [
							E('span', { 'style': 'color: var(--cyber-text-secondary);' }, 'Download/Upload Ratio'),
							E('span', { 'style': 'font-weight: 600;' },
								this.summary.total_tx_bytes > 0 ?
									((this.summary.total_rx_bytes || 0) / (this.summary.total_tx_bytes || 1)).toFixed(1) + ':1' :
									'N/A')
						]),
						E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-tertiary);' },
							'Typical ratio is 5:1 to 10:1 for home networks')
					]),
					E('div', {
						'style': 'padding: 1rem; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.05)); border-radius: 8px;'
					}, [
						E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' }, [
							E('span', { 'style': 'color: var(--cyber-text-secondary);' }, 'Average per Client'),
							E('span', { 'style': 'font-weight: 600;' },
								this.summary.active_clients > 0 ?
									this.formatBytes(((this.summary.total_rx_bytes || 0) + (this.summary.total_tx_bytes || 0)) / this.summary.active_clients) :
									'N/A')
						]),
						E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-tertiary);' },
							'Based on ' + (this.summary.active_clients || 0) + ' active devices')
					]),
					E('div', {
						'style': 'padding: 1rem; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.05)); border-radius: 8px;'
					}, [
						E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' }, [
							E('span', { 'style': 'color: var(--cyber-text-secondary);' }, 'Applications Detected'),
							E('span', { 'style': 'font-weight: 600;' },
								(this.summary.app_breakdown || []).length.toString())
						]),
						E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-tertiary);' },
							'Via Deep Packet Inspection')
					])
				])
			])
		]);
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
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
