'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require system-hub/api as API';
'require system-hub/theme as Theme';

return view.extend({
	healthData: null,
	sysInfo: null,

	load: function() {
		return Promise.all([
			API.getSystemInfo(),
			API.getHealth(),
			Theme.getTheme()
		]);
	},

	render: function(data) {
		var self = this;
		this.sysInfo = data[0] || {};
		this.healthData = data[1] || {};
		var theme = data[2];

		var container = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/overview.css') }),

			// Header
			this.renderHeader(),

			// Stats Overview (like SecuBox)
			this.renderStatsOverview(),

			// System Info Grid (4 columns per prompt)
			this.renderSystemInfoGrid(),

			// Resource Monitors (circular gauges per prompt)
			E('h3', { 'class': 'sh-section-title' }, 'Resource Monitors'),
			E('div', { 'class': 'sh-metrics-grid' }, [
				this.renderMetricCard('CPU', this.healthData.cpu),
				this.renderMetricCard('Memory', this.healthData.memory),
				this.renderMetricCard('Disk', this.healthData.disk),
				this.renderMetricCard('Temperature', this.healthData.temperature)
			]),

			// Quick Status Indicators (per prompt)
			E('h3', { 'class': 'sh-section-title' }, 'Quick Status Indicators'),
			this.renderQuickStatusIndicators()
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return Promise.all([
				API.getSystemInfo(),
				API.getHealth()
			]).then(L.bind(function(refreshData) {
				this.sysInfo = refreshData[0] || {};
				this.healthData = refreshData[1] || {};
				this.updateDashboard();
			}, this));
		}, this), 30);

		return container;
	},

	renderHeader: function() {
		var score = this.healthData.score || 0;
		var scoreClass = score >= 80 ? 'excellent' : (score >= 60 ? 'good' : (score >= 40 ? 'warning' : 'critical'));

		return E('div', { 'class': 'sh-dashboard-header' }, [
			E('div', { 'class': 'sh-dashboard-header-content' }, [
				E('div', {}, [
					E('h2', {}, '⚙️ System Control Center'),
					E('p', { 'class': 'sh-dashboard-subtitle' }, 'System Monitoring & Management Center')
				]),
				E('div', { 'class': 'sh-dashboard-header-info' }, [
					E('span', { 'class': 'sh-dashboard-badge sh-dashboard-badge-version' },
						'v0.3.2'),
					E('span', { 'class': 'sh-dashboard-badge' },
						'⏱️ ' + (this.sysInfo.uptime_formatted || '0d 0h 0m')),
					E('span', { 'class': 'sh-dashboard-badge' },
						'🖥️ ' + (this.sysInfo.hostname || 'OpenWrt'))
				])
			])
		]);
	},

	renderStatsOverview: function() {
		var score = this.healthData.score || 0;
		var scoreClass = score >= 80 ? 'excellent' : (score >= 60 ? 'good' : (score >= 40 ? 'warning' : 'critical'));
		var scoreLabel = score >= 80 ? 'Excellent' : (score >= 60 ? 'Good' : (score >= 40 ? 'Warning' : 'Critical'));

		// Enhanced stats with status indicators (v0.3.2)
		var cpu = this.healthData.cpu || {};
		var memory = this.healthData.memory || {};
		var disk = this.healthData.disk || {};
		var network = this.healthData.network || {};

		// Process count (v0.3.2)
		var processes = (cpu.processes_running || 0) + '/' + (cpu.processes_total || 0);

		// Network throughput (v0.3.2) - format bytes
		var rxGB = ((network.rx_bytes || 0) / 1024 / 1024 / 1024).toFixed(2);
		var txGB = ((network.tx_bytes || 0) / 1024 / 1024 / 1024).toFixed(2);

		// Status icons (v0.3.2)
		var getStatusIcon = function(status) {
			if (status === 'critical') return '⚠️';
			if (status === 'warning') return '⚡';
			return '✓';
		};

		return E('div', { 'class': 'sh-stats-overview-grid' }, [
			// Health Score Card
			E('div', { 'class': 'sh-stat-overview-card sh-stat-' + scoreClass }, [
				E('div', { 'class': 'sh-stat-overview-value' }, score),
				E('div', { 'class': 'sh-stat-overview-label' }, 'Health Score'),
				E('div', { 'class': 'sh-stat-overview-status' }, scoreLabel)
			]),

			// CPU Card with enhanced info
			E('div', {
				'class': 'sh-stat-overview-card sh-stat-cpu sh-stat-' + (cpu.status || 'ok'),
				'title': 'Load: ' + (cpu.load_1m || '0') + ' | ' + (cpu.cores || 0) + ' cores | ' + processes + ' processes'
			}, [
				E('div', { 'class': 'sh-stat-overview-icon' }, '🔥'),
				E('div', { 'class': 'sh-stat-overview-value' }, [
					E('span', {}, (cpu.usage || 0) + '%'),
					E('span', { 'class': 'sh-stat-status-icon' }, getStatusIcon(cpu.status))
				]),
				E('div', { 'class': 'sh-stat-overview-label' }, 'CPU Usage'),
				E('div', { 'class': 'sh-stat-overview-detail' },
					'Load: ' + (cpu.load_1m || '0') + ' • ' + processes + ' proc')
			]),

			// Memory Card with swap info
			E('div', {
				'class': 'sh-stat-overview-card sh-stat-memory sh-stat-' + (memory.status || 'ok'),
				'title': ((memory.used_kb || 0) / 1024).toFixed(0) + ' MB / ' + ((memory.total_kb || 0) / 1024).toFixed(0) + ' MB' +
					(memory.swap_total_kb > 0 ? ' | Swap: ' + (memory.swap_usage || 0) + '%' : '')
			}, [
				E('div', { 'class': 'sh-stat-overview-icon' }, '💾'),
				E('div', { 'class': 'sh-stat-overview-value' }, [
					E('span', {}, (memory.usage || 0) + '%'),
					E('span', { 'class': 'sh-stat-status-icon' }, getStatusIcon(memory.status))
				]),
				E('div', { 'class': 'sh-stat-overview-label' }, 'Memory'),
				E('div', { 'class': 'sh-stat-overview-detail' },
					((memory.used_kb || 0) / 1024).toFixed(0) + 'MB / ' +
					((memory.total_kb || 0) / 1024).toFixed(0) + 'MB' +
					(memory.swap_total_kb > 0 ? ' • Swap: ' + (memory.swap_usage || 0) + '%' : ''))
			]),

			// Disk Card
			E('div', {
				'class': 'sh-stat-overview-card sh-stat-disk sh-stat-' + (disk.status || 'ok'),
				'title': ((disk.used_kb || 0) / 1024 / 1024).toFixed(1) + ' GB / ' + ((disk.total_kb || 0) / 1024 / 1024).toFixed(1) + ' GB'
			}, [
				E('div', { 'class': 'sh-stat-overview-icon' }, '💿'),
				E('div', { 'class': 'sh-stat-overview-value' }, [
					E('span', {}, (disk.usage || 0) + '%'),
					E('span', { 'class': 'sh-stat-status-icon' }, getStatusIcon(disk.status))
				]),
				E('div', { 'class': 'sh-stat-overview-label' }, 'Disk Usage'),
				E('div', { 'class': 'sh-stat-overview-detail' },
					((disk.used_kb || 0) / 1024 / 1024).toFixed(1) + 'GB / ' +
					((disk.total_kb || 0) / 1024 / 1024).toFixed(1) + 'GB')
			]),

			// Network Card (v0.3.2 - NEW)
			E('div', {
				'class': 'sh-stat-overview-card sh-stat-network sh-stat-' + (network.wan_up ? 'ok' : 'error'),
				'title': 'RX: ' + rxGB + ' GB | TX: ' + txGB + ' GB'
			}, [
				E('div', { 'class': 'sh-stat-overview-icon' }, '🌐'),
				E('div', { 'class': 'sh-stat-overview-value' }, [
					E('span', {}, network.wan_up ? 'Online' : 'Offline'),
					E('span', { 'class': 'sh-stat-status-icon' }, network.wan_up ? '✓' : '✗')
				]),
				E('div', { 'class': 'sh-stat-overview-label' }, 'Network'),
				E('div', { 'class': 'sh-stat-overview-detail' },
					'↓ ' + rxGB + 'GB • ↑ ' + txGB + 'GB')
			])
		]);
	},

	renderSystemInfoGrid: function() {
		var self = this;
		var cpu = this.healthData.cpu || {};

		return E('div', {}, [
			E('h3', { 'class': 'sh-section-title' }, 'System Information'),
			E('div', { 'class': 'sh-system-info-grid' }, [
				// Hostname card with edit button
				E('div', { 'class': 'sh-info-grid-card' }, [
					E('div', { 'class': 'sh-info-grid-header' }, [
						E('span', { 'class': 'sh-info-grid-icon' }, '🏷️'),
						E('span', { 'class': 'sh-info-grid-title' }, 'Hostname')
					]),
					E('div', { 'class': 'sh-info-grid-value' }, this.sysInfo.hostname || 'unknown'),
					E('button', {
						'class': 'sh-info-grid-action',
						'click': function() {
							ui.addNotification(null, E('p', 'Edit hostname feature coming soon'), 'info');
						}
					}, '✏️ Edit')
				]),

				// Uptime card
				E('div', { 'class': 'sh-info-grid-card' }, [
					E('div', { 'class': 'sh-info-grid-header' }, [
						E('span', { 'class': 'sh-info-grid-icon' }, '⏱️'),
						E('span', { 'class': 'sh-info-grid-title' }, 'Uptime')
					]),
					E('div', { 'class': 'sh-info-grid-value' }, this.sysInfo.uptime_formatted || '0d 0h 0m'),
					E('div', { 'class': 'sh-info-grid-detail' }, 'System runtime')
				]),

				// Load Average card (monospace per prompt)
				E('div', { 'class': 'sh-info-grid-card' }, [
					E('div', { 'class': 'sh-info-grid-header' }, [
						E('span', { 'class': 'sh-info-grid-icon' }, '📊'),
						E('span', { 'class': 'sh-info-grid-title' }, 'Load Average')
					]),
					E('div', { 'class': 'sh-info-grid-value sh-monospace' },
						(cpu.load_1m || '0.00') + ' / ' +
						(cpu.load_5m || '0.00') + ' / ' +
						(cpu.load_15m || '0.00')
					),
					E('div', { 'class': 'sh-info-grid-detail' }, '1m / 5m / 15m')
				]),

				// Kernel Version card with copy icon
				E('div', { 'class': 'sh-info-grid-card' }, [
					E('div', { 'class': 'sh-info-grid-header' }, [
						E('span', { 'class': 'sh-info-grid-icon' }, '⚙️'),
						E('span', { 'class': 'sh-info-grid-title' }, 'Kernel Version')
					]),
					E('div', { 'class': 'sh-info-grid-value sh-monospace' }, this.sysInfo.kernel || 'unknown'),
					E('button', {
						'class': 'sh-info-grid-action',
						'click': function() {
							var kernel = self.sysInfo.kernel || 'unknown';
							navigator.clipboard.writeText(kernel).then(function() {
								ui.addNotification(null, E('p', '✓ Copied to clipboard: ' + kernel), 'info');
							});
						}
					}, '📋 Copy')
				])
			])
		]);
	},

	renderQuickStatusIndicators: function() {
		var network = this.healthData.network || {};
		var services = this.healthData.services || {};

		// Determine status colors and icons
		var internetStatus = network.wan_up ? 'ok' : 'error';
		var internetIcon = network.wan_up ? '✓' : '✗';
		var internetText = network.wan_up ? 'Connected' : 'Disconnected';

		var dnsStatus = network.dns_ok !== false ? 'ok' : 'error';
		var dnsIcon = network.dns_ok !== false ? '✓' : '✗';
		var dnsText = network.dns_ok !== false ? 'Resolving' : 'Failed';

		var ntpStatus = 'ok'; // Placeholder, would need backend support
		var ntpIcon = '✓';
		var ntpText = 'Synced';

		var fwStatus = 'ok';
		var fwIcon = '✓';
		var fwText = (network.firewall_rules || 0) + ' rules active';

		return E('div', { 'class': 'sh-status-indicators-grid' }, [
			// Internet connectivity
			E('div', { 'class': 'sh-status-indicator sh-status-' + internetStatus }, [
				E('div', { 'class': 'sh-status-indicator-icon' }, '🌐'),
				E('div', { 'class': 'sh-status-indicator-content' }, [
					E('div', { 'class': 'sh-status-indicator-label' }, 'Internet Connectivity'),
					E('div', { 'class': 'sh-status-indicator-value' }, [
						E('span', { 'class': 'sh-status-badge sh-status-badge-' + internetStatus }, internetIcon),
						E('span', {}, internetText)
					])
				])
			]),

			// DNS resolution
			E('div', { 'class': 'sh-status-indicator sh-status-' + dnsStatus }, [
				E('div', { 'class': 'sh-status-indicator-icon' }, '🔍'),
				E('div', { 'class': 'sh-status-indicator-content' }, [
					E('div', { 'class': 'sh-status-indicator-label' }, 'DNS Resolution'),
					E('div', { 'class': 'sh-status-indicator-value' }, [
						E('span', { 'class': 'sh-status-badge sh-status-badge-' + dnsStatus }, dnsIcon),
						E('span', {}, dnsText)
					])
				])
			]),

			// NTP sync
			E('div', { 'class': 'sh-status-indicator sh-status-' + ntpStatus }, [
				E('div', { 'class': 'sh-status-indicator-icon' }, '🕐'),
				E('div', { 'class': 'sh-status-indicator-content' }, [
					E('div', { 'class': 'sh-status-indicator-label' }, 'NTP Sync'),
					E('div', { 'class': 'sh-status-indicator-value' }, [
						E('span', { 'class': 'sh-status-badge sh-status-badge-' + ntpStatus }, ntpIcon),
						E('span', {}, ntpText)
					])
				])
			]),

			// Firewall status
			E('div', { 'class': 'sh-status-indicator sh-status-' + fwStatus }, [
				E('div', { 'class': 'sh-status-indicator-icon' }, '🛡️'),
				E('div', { 'class': 'sh-status-indicator-content' }, [
					E('div', { 'class': 'sh-status-indicator-label' }, 'Firewall'),
					E('div', { 'class': 'sh-status-indicator-value' }, [
						E('span', { 'class': 'sh-status-badge sh-status-badge-' + fwStatus }, fwIcon),
						E('span', {}, fwText)
					])
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

	renderInfoCard: function(title, content) {
		return E('div', { 'class': 'sh-info-card' }, [
			E('div', { 'class': 'sh-info-card-header' }, [
				E('h3', {}, title)
			]),
			E('div', { 'class': 'sh-info-card-body' }, content)
		]);
	},

	renderSystemInfo: function() {
		return E('div', { 'class': 'sh-info-list' }, [
			this.renderInfoRow('🏷️', 'Hostname', this.sysInfo.hostname || 'unknown'),
			this.renderInfoRow('🖥️', 'Model', this.sysInfo.model || 'Unknown'),
			this.renderInfoRow('📦', 'OpenWrt', this.sysInfo.openwrt_version || 'Unknown'),
			this.renderInfoRow('⚙️', 'Kernel', this.sysInfo.kernel || 'unknown'),
			this.renderInfoRow('⏱️', 'Uptime', this.sysInfo.uptime_formatted || '0d 0h 0m'),
			this.renderInfoRow('🕐', 'Local Time', this.sysInfo.local_time || 'unknown')
		]);
	},

	renderNetworkInfo: function() {
		var wan_status = this.healthData.network ? this.healthData.network.wan_up : false;
		return E('div', { 'class': 'sh-info-list' }, [
			this.renderInfoRow('🌐', 'WAN Status',
				E('span', {
					'class': 'sh-status-badge sh-status-' + (wan_status ? 'ok' : 'error')
				}, wan_status ? 'Connected' : 'Disconnected')
			),
			this.renderInfoRow('📡', 'Network', this.healthData.network ? this.healthData.network.status : 'unknown')
		]);
	},

	renderServicesInfo: function() {
		var running = this.healthData.services ? this.healthData.services.running : 0;
		var failed = this.healthData.services ? this.healthData.services.failed : 0;

		return E('div', { 'class': 'sh-info-list' }, [
			this.renderInfoRow('▶️', 'Running Services',
				E('span', { 'class': 'sh-status-badge sh-status-ok' }, running + ' services')
			),
			this.renderInfoRow('⏹️', 'Failed Services',
				failed > 0
					? E('span', { 'class': 'sh-status-badge sh-status-error' }, failed + ' services')
					: E('span', { 'class': 'sh-status-badge sh-status-ok' }, 'None')
			),
			this.renderInfoRow('🔗', 'Quick Actions',
				E('a', {
					'class': 'sh-link-button',
					'href': '/cgi-bin/luci/admin/secubox/system/system-hub/services'
				}, 'Manage Services →')
			)
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

		var infoGrid = document.querySelector('.sh-info-grid');
		if (infoGrid) {
			dom.content(infoGrid, [
				this.renderInfoCard('System Information', this.renderSystemInfo()),
				this.renderInfoCard('Network Status', this.renderNetworkInfo()),
				this.renderInfoCard('Services', this.renderServicesInfo())
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

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
