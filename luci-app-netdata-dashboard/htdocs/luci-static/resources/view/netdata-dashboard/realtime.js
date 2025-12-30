'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require dom';
'require ui';
'require netdata-dashboard.api as api';

return view.extend({
	title: _('Netdata Dashboard'),
	
	// Store history for sparklines
	history: {
		cpu: [],
		memory: [],
		network_rx: [],
		network_tx: []
	},
	maxHistory: 60,
	
	load: function() {
		return api.getAllData();
	},
	
	addToHistory: function(key, value) {
		this.history[key].push(value);
		if (this.history[key].length > this.maxHistory) {
			this.history[key].shift();
		}
	},
	
	renderGauge: function(percent, label, size) {
		size = size || 140;
		var radius = (size - 20) / 2;
		var circumference = 2 * Math.PI * radius;
		var offset = circumference - (percent / 100 * circumference);
		var statusClass = api.getStatusClass(percent);
		
		return E('div', { 'class': 'nd-gauge', 'style': 'width:' + size + 'px;height:' + size + 'px' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('svg', { 'class': 'nd-gauge-svg', 'width': size, 'height': size, 'viewBox': '0 0 ' + size + ' ' + size }, [
				E('circle', {
					'class': 'nd-gauge-bg',
					'cx': size/2, 'cy': size/2, 'r': radius
				}),
				E('circle', {
					'class': 'nd-gauge-fill ' + statusClass,
					'cx': size/2, 'cy': size/2, 'r': radius,
					'stroke-dasharray': circumference,
					'stroke-dashoffset': offset
				})
			]),
			E('div', { 'class': 'nd-gauge-text' }, [
				E('div', { 'class': 'nd-gauge-value ' + statusClass }, percent + '%'),
				E('div', { 'class': 'nd-gauge-label' }, label)
			])
		]);
	},
	
	renderSparkline: function(data, color, height) {
		height = height || 60;
		var width = 200;
		
		if (!data || data.length < 2) {
			return E('div', { 'class': 'nd-sparkline', 'style': 'height:' + height + 'px' });
		}
		
		var max = Math.max.apply(null, data) || 1;
		var min = Math.min.apply(null, data);
		var range = max - min || 1;
		
		var points = data.map(function(v, i) {
			var x = (i / (data.length - 1)) * width;
			var y = height - ((v - min) / range) * (height - 10) - 5;
			return x + ',' + y;
		});
		
		var areaPoints = '0,' + height + ' ' + points.join(' ') + ' ' + width + ',' + height;
		
		return E('svg', { 'class': 'nd-sparkline', 'width': width, 'height': height, 'viewBox': '0 0 ' + width + ' ' + height }, [
			E('defs', {}, [
				E('linearGradient', { 'id': 'sparkGrad-' + color, 'x1': '0%', 'y1': '0%', 'x2': '0%', 'y2': '100%' }, [
					E('stop', { 'offset': '0%', 'style': 'stop-color:' + color + ';stop-opacity:0.3' }),
					E('stop', { 'offset': '100%', 'style': 'stop-color:' + color + ';stop-opacity:0' })
				])
			]),
			E('polygon', { 'class': 'nd-sparkline-area', 'points': areaPoints, 'fill': 'url(#sparkGrad-' + color + ')' }),
			E('polyline', { 'class': 'nd-sparkline-line', 'points': points.join(' '), 'stroke': color, 'fill': 'none', 'stroke-width': '2' }),
			E('circle', { 'class': 'nd-sparkline-dot', 'cx': width, 'cy': points[points.length-1].split(',')[1], 'r': '3', 'fill': color })
		]);
	},
	
	render: function(data) {
		var self = this;
		var stats = data.stats || {};
		var system = data.system || {};
		var memory = data.memory || {};
		var network = data.network || {};
		var disk = data.disk || {};
		var sensors = data.sensors || {};
		
		// Add to history
		this.addToHistory('cpu', stats.cpu_percent || 0);
		this.addToHistory('memory', stats.memory_percent || 0);
		this.addToHistory('network_rx', stats.network_rx || 0);
		this.addToHistory('network_tx', stats.network_tx || 0);
		
		var cpuClass = api.getStatusClass(stats.cpu_percent || 0);
		var memClass = api.getStatusClass(stats.memory_percent || 0);
		var diskClass = api.getStatusClass(stats.disk_percent || 0);
		var temp = stats.temperature || 0;
		var tempClass = api.getTempClass(temp);
		
		var view = E('div', { 'class': 'netdata-dashboard' }, [
			// Header
			E('div', { 'class': 'nd-header' }, [
				E('div', { 'class': 'nd-logo' }, [
					E('div', { 'class': 'nd-logo-icon' }, '📊'),
					E('div', { 'class': 'nd-logo-text' }, ['Net', E('span', {}, 'data')])
				]),
				E('div', { 'class': 'nd-header-info' }, [
					E('div', { 'class': 'nd-hostname' }, system.hostname || 'OpenWrt'),
					E('div', { 'class': 'nd-live-badge' }, [
						E('span', { 'class': 'nd-live-dot' }),
						'Live'
					])
				])
			]),
			
			// Quick Stats
			E('div', { 'class': 'nd-quick-stats' }, [
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value ' + cpuClass }, (stats.cpu_percent || 0) + '%'),
					E('div', { 'class': 'nd-quick-stat-label' }, 'CPU')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value ' + memClass }, (stats.memory_percent || 0) + '%'),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Memory')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value ' + diskClass }, (stats.disk_percent || 0) + '%'),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Disk')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value info' }, stats.load || '0.00'),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Load')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value ' + tempClass }, temp + '°C'),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Temp')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value info' }, stats.processes || 0),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Processes')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value info' }, stats.connections || 0),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Connections')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value good' }, api.formatUptime(stats.uptime || 0)),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Uptime')
				])
			]),
			
			// Charts Grid
			E('div', { 'class': 'nd-charts-grid' }, [
				// CPU Gauge
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '⚡'),
							'CPU Usage'
						]),
						E('div', { 'class': 'nd-chart-value' }, (stats.cpu_percent || 0) + '%')
					]),
					E('div', { 'class': 'nd-chart-body', 'style': 'display:flex;align-items:center;justify-content:space-around' }, [
						this.renderGauge(stats.cpu_percent || 0, 'CPU', 140),
						E('div', { 'style': 'text-align:center' }, [
							this.renderSparkline(this.history.cpu, '#3fb950', 60),
							E('div', { 'style': 'margin-top:8px;font-size:11px;color:#8b949e' }, 'Last 60 samples')
						])
					])
				]),
				
				// Memory
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '🧠'),
							'Memory Usage'
						]),
						E('div', { 'class': 'nd-chart-value' }, api.formatKB(memory.used || 0) + ' / ' + api.formatKB(memory.total || 0))
					]),
					E('div', { 'class': 'nd-chart-body' }, [
						E('div', { 'class': 'nd-stacked-bar' }, [
							E('div', { 'class': 'nd-stacked-segment', 'style': 'width:' + (memory.pct_used || 0) + '%;background:#f85149' }),
							E('div', { 'class': 'nd-stacked-segment', 'style': 'width:' + (memory.pct_buffers || 0) + '%;background:#d29922' }),
							E('div', { 'class': 'nd-stacked-segment', 'style': 'width:' + (memory.pct_cached || 0) + '%;background:#3fb950' })
						]),
						E('div', { 'class': 'nd-stacked-legend' }, [
							E('div', { 'class': 'nd-legend-item' }, [
								E('span', { 'class': 'nd-legend-dot', 'style': 'background:#f85149' }),
								'Used: ' + api.formatKB(memory.used || 0)
							]),
							E('div', { 'class': 'nd-legend-item' }, [
								E('span', { 'class': 'nd-legend-dot', 'style': 'background:#d29922' }),
								'Buffers: ' + api.formatKB(memory.buffers || 0)
							]),
							E('div', { 'class': 'nd-legend-item' }, [
								E('span', { 'class': 'nd-legend-dot', 'style': 'background:#3fb950' }),
								'Cached: ' + api.formatKB(memory.cached || 0)
							]),
							E('div', { 'class': 'nd-legend-item' }, [
								E('span', { 'class': 'nd-legend-dot', 'style': 'background:#21262d' }),
								'Free: ' + api.formatKB(memory.free || 0)
							])
						]),
						E('div', { 'style': 'margin-top:16px;text-align:center' }, 
							this.renderSparkline(this.history.memory, '#58a6ff', 50)
						)
					])
				]),
				
				// Network
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '🌐'),
							'Network Traffic'
						])
					]),
					E('div', { 'class': 'nd-chart-body' }, [
						E('div', { 'class': 'nd-network-stats' }, [
							E('div', { 'class': 'nd-network-direction' }, [
								E('div', { 'class': 'nd-network-icon' }, '📥'),
								E('div', { 'class': 'nd-network-value rx' }, api.formatBytes(stats.network_rx || 0)),
								E('div', { 'class': 'nd-network-label' }, 'Received')
							]),
							E('div', { 'class': 'nd-network-direction' }, [
								E('div', { 'class': 'nd-network-icon' }, '📤'),
								E('div', { 'class': 'nd-network-value tx' }, api.formatBytes(stats.network_tx || 0)),
								E('div', { 'class': 'nd-network-label' }, 'Transmitted')
							])
						]),
						E('div', { 'style': 'margin-top:16px;display:flex;gap:20px;justify-content:center' }, [
							this.renderSparkline(this.history.network_rx, '#3fb950', 40),
							this.renderSparkline(this.history.network_tx, '#58a6ff', 40)
						])
					])
				]),
				
				// Disk
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '💾'),
							'Disk Usage'
						])
					]),
					E('div', { 'class': 'nd-chart-body' }, 
						(disk.filesystems || []).slice(0, 4).map(function(fs) {
							var pct = fs.pct_used || 0;
							var diskStatus = pct >= 90 ? 'danger' : (pct >= 70 ? 'warning' : '');
							return E('div', { 'class': 'nd-disk-item' }, [
								E('div', { 'class': 'nd-disk-header' }, [
									E('span', { 'class': 'nd-disk-mount' }, fs.mount),
									E('span', { 'class': 'nd-disk-size' }, api.formatKB(fs.used) + ' / ' + api.formatKB(fs.size))
								]),
								E('div', { 'class': 'nd-disk-bar' }, [
									E('div', { 'class': 'nd-disk-fill ' + diskStatus, 'style': 'width:' + pct + '%' })
								])
							]);
						})
					)
				])
			]),
			
			// System Info
			E('div', { 'class': 'nd-chart-card', 'style': 'margin-top:16px' }, [
				E('div', { 'class': 'nd-chart-header' }, [
					E('div', { 'class': 'nd-chart-title' }, [
						E('span', { 'class': 'nd-chart-title-icon' }, '🖥️'),
						'System Information'
					])
				]),
				E('div', { 'class': 'nd-chart-body' }, [
					E('div', { 'class': 'nd-info-grid' }, [
						E('div', { 'class': 'nd-info-item' }, [
							E('div', { 'class': 'nd-info-label' }, 'Hostname'),
							E('div', { 'class': 'nd-info-value' }, system.hostname || 'N/A')
						]),
						E('div', { 'class': 'nd-info-item' }, [
							E('div', { 'class': 'nd-info-label' }, 'Model'),
							E('div', { 'class': 'nd-info-value' }, system.model || 'N/A')
						]),
						E('div', { 'class': 'nd-info-item' }, [
							E('div', { 'class': 'nd-info-label' }, 'Kernel'),
							E('div', { 'class': 'nd-info-value' }, system.kernel || 'N/A')
						]),
						E('div', { 'class': 'nd-info-item' }, [
							E('div', { 'class': 'nd-info-label' }, 'Architecture'),
							E('div', { 'class': 'nd-info-value' }, system.arch || 'N/A')
						]),
						E('div', { 'class': 'nd-info-item' }, [
							E('div', { 'class': 'nd-info-label' }, 'OpenWrt Version'),
							E('div', { 'class': 'nd-info-value' }, system.version || 'N/A')
						]),
						E('div', { 'class': 'nd-info-item' }, [
							E('div', { 'class': 'nd-info-label' }, 'Uptime'),
							E('div', { 'class': 'nd-info-value' }, system.uptime_formatted || 'N/A')
						])
					])
				])
			])
		]);
		
		// Include CSS
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('netdata-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
