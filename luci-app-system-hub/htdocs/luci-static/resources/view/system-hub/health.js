'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require system-hub/api as API';
'require system-hub/theme as Theme';

return view.extend({
	healthData: null,

	load: function() {
		return Promise.all([
			API.getHealth(),
			Theme.getTheme()
		]);
	},

	render: function(data) {
		this.healthData = data[0] || {};
		var theme = data[1];

		var container = E('div', { 'class': 'system-hub-health' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/overview.css') }),

			// Header with health score
			this.renderHeader(),

			// System Metrics Grid
			E('div', { 'class': 'sh-metrics-grid' }, [
				this.renderMetricCard('CPU', this.healthData.cpu),
				this.renderMetricCard('Memory', this.healthData.memory),
				this.renderMetricCard('Disk', this.healthData.disk),
				this.renderMetricCard('Temperature', this.healthData.temperature)
			]),

			// Network & Services Info
			E('div', { 'class': 'sh-info-grid' }, [
				this.renderNetworkCard(),
				this.renderServicesCard()
			]),

			// Recommendations
			this.healthData.recommendations && this.healthData.recommendations.length > 0
				? this.renderRecommendationsCard()
				: E('div'),

			// Actions
			this.renderActionsCard()
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return API.getHealth().then(L.bind(function(refreshData) {
				this.healthData = refreshData || {};
				this.updateDashboard();
			}, this));
		}, this), 30);

		return container;
	},

	renderHeader: function() {
		var score = this.healthData.score || 0;
		var scoreClass = score >= 80 ? 'excellent' : (score >= 60 ? 'good' : (score >= 40 ? 'warning' : 'critical'));
		var scoreLabel = score >= 80 ? 'Excellent' : (score >= 60 ? 'Bon' : (score >= 40 ? 'Attention' : 'Critique'));

		return E('div', { 'class': 'sh-overview-header' }, [
			E('div', { 'class': 'sh-overview-title' }, [
				E('h2', {}, [
					E('span', { 'class': 'sh-title-icon' }, '💚'),
					' Health Monitor'
				]),
				E('p', { 'class': 'sh-overview-subtitle' },
					'Surveillance en temps réel de la santé du système')
			]),
			E('div', { 'class': 'sh-overview-score' }, [
				E('div', { 'class': 'sh-score-circle sh-score-' + scoreClass }, [
					E('div', { 'class': 'sh-score-value' }, score),
					E('div', { 'class': 'sh-score-label' }, scoreLabel)
				])
			])
		]);
	},

	renderMetricCard: function(type, data) {
		if (!data) return E('div');

		var config = this.getMetricConfig(type, data);

		return E('div', { 'class': 'sh-metric-card sh-metric-' + config.status }, [
			E('div', { 'class': 'sh-metric-header' }, [
				E('span', { 'class': 'sh-metric-icon' }, config.icon),
				E('span', { 'class': 'sh-metric-title' }, config.title)
			]),
			E('div', { 'class': 'sh-metric-value' }, config.value),
			E('div', { 'class': 'sh-metric-progress' }, [
				E('div', {
					'class': 'sh-metric-progress-bar',
					'style': 'width: ' + config.percentage + '%; background: ' + config.color
				})
			]),
			E('div', { 'class': 'sh-metric-details' }, config.details)
		]);
	},

	getMetricConfig: function(type, data) {
		switch(type) {
			case 'CPU':
				return {
					icon: '🔥',
					title: 'CPU Usage',
					value: (data.usage || 0) + '%',
					percentage: data.usage || 0,
					status: data.status || 'ok',
					color: this.getStatusColor(data.usage || 0),
					details: 'Load: ' + (data.load_1m || '0') + ' • ' + (data.cores || 0) + ' cores'
				};
			case 'Memory':
				var usedMB = ((data.used_kb || 0) / 1024).toFixed(0);
				var totalMB = ((data.total_kb || 0) / 1024).toFixed(0);
				return {
					icon: '💾',
					title: 'Memory',
					value: (data.usage || 0) + '%',
					percentage: data.usage || 0,
					status: data.status || 'ok',
					color: this.getStatusColor(data.usage || 0),
					details: usedMB + ' MB / ' + totalMB + ' MB used'
				};
			case 'Disk':
				var usedGB = ((data.used_kb || 0) / 1024 / 1024).toFixed(1);
				var totalGB = ((data.total_kb || 0) / 1024 / 1024).toFixed(1);
				return {
					icon: '💿',
					title: 'Disk Space',
					value: (data.usage || 0) + '%',
					percentage: data.usage || 0,
					status: data.status || 'ok',
					color: this.getStatusColor(data.usage || 0),
					details: usedGB + ' GB / ' + totalGB + ' GB used'
				};
			case 'Temperature':
				return {
					icon: '🌡️',
					title: 'Temperature',
					value: (data.value || 0) + '°C',
					percentage: Math.min((data.value || 0), 100),
					status: data.status || 'ok',
					color: this.getTempColor(data.value || 0),
					details: 'Status: ' + (data.status || 'unknown')
				};
			default:
				return {
					icon: '📊',
					title: type,
					value: 'N/A',
					percentage: 0,
					status: 'unknown',
					color: '#64748b',
					details: 'No data'
				};
		}
	},

	getStatusColor: function(usage) {
		if (usage >= 90) return '#ef4444';
		if (usage >= 75) return '#f59e0b';
		if (usage >= 50) return '#3b82f6';
		return '#22c55e';
	},

	getTempColor: function(temp) {
		if (temp >= 80) return '#ef4444';
		if (temp >= 70) return '#f59e0b';
		if (temp >= 60) return '#3b82f6';
		return '#22c55e';
	},

	renderNetworkCard: function() {
		var wan_status = this.healthData.network ? this.healthData.network.wan_up : false;

		return E('div', { 'class': 'sh-info-card' }, [
			E('div', { 'class': 'sh-info-card-header' }, [
				E('h3', {}, [
					E('span', { 'style': 'margin-right: 8px;' }, '🌐'),
					'Network Status'
				])
			]),
			E('div', { 'class': 'sh-info-card-body' }, [
				E('div', { 'class': 'sh-info-list' }, [
					this.renderInfoRow('📡', 'WAN Connection',
						E('span', {
							'class': 'sh-status-badge sh-status-' + (wan_status ? 'ok' : 'error')
						}, wan_status ? '✓ Connected' : '✗ Disconnected')
					),
					this.renderInfoRow('🔌', 'Network Mode',
						this.healthData.network ? this.healthData.network.status : 'unknown'
					)
				])
			])
		]);
	},

	renderServicesCard: function() {
		var running = this.healthData.services ? this.healthData.services.running : 0;
		var failed = this.healthData.services ? this.healthData.services.failed : 0;
		var total = running + failed;

		return E('div', { 'class': 'sh-info-card' }, [
			E('div', { 'class': 'sh-info-card-header' }, [
				E('h3', {}, [
					E('span', { 'style': 'margin-right: 8px;' }, '⚙️'),
					'System Services'
				])
			]),
			E('div', { 'class': 'sh-info-card-body' }, [
				E('div', { 'class': 'sh-info-list' }, [
					this.renderInfoRow('▶️', 'Running',
						E('span', { 'class': 'sh-status-badge sh-status-ok' }, running + ' services')
					),
					this.renderInfoRow('⏹️', 'Failed',
						failed > 0
							? E('span', { 'class': 'sh-status-badge sh-status-error' }, failed + ' services')
							: E('span', { 'class': 'sh-status-badge sh-status-ok' }, 'None')
					),
					this.renderInfoRow('📊', 'Health Rate',
						total > 0 ? ((running / total * 100).toFixed(0) + '%') : 'N/A'
					)
				])
			])
		]);
	},

	renderRecommendationsCard: function() {
		return E('div', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('h3', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '💡'),
					'Recommendations'
				]),
				E('div', { 'class': 'sh-card-badge', 'style': 'background: #f59e0b;' },
					this.healthData.recommendations.length)
			]),
			E('div', { 'class': 'sh-card-body' },
				this.healthData.recommendations.map(function(rec) {
					return E('div', {
						'style': 'display: flex; gap: 12px; align-items: flex-start; padding: 14px; background: rgba(245, 158, 11, 0.1); border-radius: 10px; border-left: 3px solid #f59e0b; margin-bottom: 10px;'
					}, [
						E('span', { 'style': 'font-size: 24px;' }, '⚠️'),
						E('div', { 'style': 'flex: 1; color: var(--sh-text-primary);' }, rec)
					]);
				})
			)
		]);
	},

	renderActionsCard: function() {
		return E('div', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('h3', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '🛠️'),
					'Actions'
				])
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
					E('button', {
						'class': 'sh-btn sh-btn-primary',
						'click': L.bind(this.generateReport, this)
					}, [
						E('span', {}, '📋'),
						E('span', {}, 'Generate Report')
					]),
					E('button', {
						'class': 'sh-btn sh-btn-secondary',
						'click': function() {
							ui.addNotification(null, E('p', '⚠️ Email feature coming soon'), 'info');
						}
					}, [
						E('span', {}, '📧'),
						E('span', {}, 'Send Email')
					]),
					E('button', {
						'class': 'sh-btn sh-btn-secondary',
						'click': function() {
							ui.addNotification(null, E('p', '⚠️ PDF export coming soon'), 'info');
						}
					}, [
						E('span', {}, '📥'),
						E('span', {}, 'Download PDF')
					])
				])
			])
		]);
	},

	renderInfoRow: function(icon, label, value) {
		return E('div', { 'class': 'sh-info-row' }, [
			E('span', { 'class': 'sh-info-icon' }, icon),
			E('span', { 'class': 'sh-info-label' }, label),
			E('span', { 'class': 'sh-info-value' }, value)
		]);
	},

	updateDashboard: function() {
		var metricsGrid = document.querySelector('.sh-metrics-grid');
		if (metricsGrid) {
			dom.content(metricsGrid, [
				this.renderMetricCard('CPU', this.healthData.cpu),
				this.renderMetricCard('Memory', this.healthData.memory),
				this.renderMetricCard('Disk', this.healthData.disk),
				this.renderMetricCard('Temperature', this.healthData.temperature)
			]);
		}

		// Update health score
		var scoreValue = document.querySelector('.sh-score-value');
		var scoreCircle = document.querySelector('.sh-score-circle');
		if (scoreValue && scoreCircle) {
			var score = this.healthData.score || 0;
			var scoreClass = score >= 80 ? 'excellent' : (score >= 60 ? 'good' : (score >= 40 ? 'warning' : 'critical'));
			scoreValue.textContent = score;
			scoreCircle.className = 'sh-score-circle sh-score-' + scoreClass;
		}
	},

	generateReport: function() {
		ui.showModal(_('Generating Report'), [
			E('p', {}, 'Generating health report...'),
			E('div', { 'class': 'spinning' })
		]);

		setTimeout(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', '⚠️ Report generation feature coming soon'), 'info');
		}, 1000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
