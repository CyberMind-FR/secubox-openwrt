'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require netifyd-dashboard.api as api';

return view.extend({
	title: _('Netifyd Dashboard'),
	
	load: function() {
		return api.getAllData();
	},
	
	renderDonut: function(data, size) {
		size = size || 160;
		var total = data.reduce(function(sum, d) { return sum + d.value; }, 0);
		var colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
		
		var cumulative = 0;
		var paths = data.map(function(d, i) {
			var pct = d.value / total;
			var startAngle = cumulative * 2 * Math.PI;
			cumulative += pct;
			var endAngle = cumulative * 2 * Math.PI;
			
			var r = size / 2 - 10;
			var cx = size / 2;
			var cy = size / 2;
			
			var x1 = cx + r * Math.sin(startAngle);
			var y1 = cy - r * Math.cos(startAngle);
			var x2 = cx + r * Math.sin(endAngle);
			var y2 = cy - r * Math.cos(endAngle);
			
			var largeArc = pct > 0.5 ? 1 : 0;
			
			return E('path', {
				'd': 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z',
				'fill': colors[i % colors.length]
			});
		});
		
		return E('svg', { 'width': size, 'height': size, 'viewBox': '0 0 ' + size + ' ' + size }, [
			E('g', {}, paths),
			E('circle', { 'cx': size/2, 'cy': size/2, 'r': size/2 - 35, 'fill': '#111827' })
		]);
	},
	
	render: function(data) {
		var self = this;
		var status = data.status || {};
		var stats = data.stats || {};
		var apps = (data.applications || {}).applications || [];
		var protos = (data.protocols || {}).protocols || [];
		
		var totalFlows = stats.total_flows || 0;
		var tcpFlows = stats.tcp_flows || 0;
		var udpFlows = stats.udp_flows || 0;
		
		var protoData = [
			{ name: 'TCP', value: tcpFlows },
			{ name: 'UDP', value: udpFlows },
			{ name: 'Other', value: Math.max(0, totalFlows - tcpFlows - udpFlows) }
		].filter(function(p) { return p.value > 0; });
		
		var topApps = apps.slice(0, 6);
		var maxAppBytes = topApps.length > 0 ? Math.max.apply(null, topApps.map(function(a) { return a.bytes; })) : 1;
		
		var view = E('div', { 'class': 'netifyd-dashboard' }, [
			// Header
			E('div', { 'class': 'nf-header' }, [
				E('div', { 'class': 'nf-logo' }, [
					E('div', { 'class': 'nf-logo-icon' }, '🔍'),
					E('div', { 'class': 'nf-logo-text' }, ['Netif', E('span', {}, 'yd')])
				]),
				E('div', { 'class': 'nf-header-info' }, [
					E('div', { 
						'class': 'nf-status-badge ' + (status.running ? '' : 'offline') 
					}, [
						E('span', { 'class': 'nf-status-dot' }),
						status.running ? 'DPI Active' : 'Offline'
					]),
					E('div', { 'class': 'nf-version' }, 'v' + (status.version || '4.x'))
				])
			]),
			
			// Quick Stats
			E('div', { 'class': 'nf-quick-stats' }, [
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #8b5cf6' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '🔄'),
					E('div', { 'class': 'nf-quick-stat-value' }, totalFlows),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Active Flows'),
					E('div', { 'class': 'nf-quick-stat-sub' }, tcpFlows + ' TCP / ' + udpFlows + ' UDP')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #3b82f6' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '📱'),
					E('div', { 'class': 'nf-quick-stat-value' }, stats.applications || 0),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Applications'),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Detected by DPI')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #06b6d4' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '💻'),
					E('div', { 'class': 'nf-quick-stat-value' }, stats.devices || 0),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Devices'),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'On network')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #10b981' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '📥'),
					E('div', { 'class': 'nf-quick-stat-value' }, api.formatBytes(stats.total_rx_bytes || 0)),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Downloaded'),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Total RX')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #f59e0b' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '📤'),
					E('div', { 'class': 'nf-quick-stat-value' }, api.formatBytes(stats.total_tx_bytes || 0)),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Uploaded'),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Total TX')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #ec4899' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '🏷️'),
					E('div', { 'class': 'nf-quick-stat-value' }, stats.categories || 8),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Categories'),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Traffic types')
				])
			]),
			
			// Charts
			E('div', { 'class': 'nf-charts-grid' }, [
				// Protocol Distribution
				E('div', { 'class': 'nf-card' }, [
					E('div', { 'class': 'nf-card-header' }, [
						E('div', { 'class': 'nf-card-title' }, [
							E('span', { 'class': 'nf-card-title-icon' }, '📊'),
							'Protocol Distribution'
						]),
						E('div', { 'class': 'nf-card-badge' }, totalFlows + ' flows')
					]),
					E('div', { 'class': 'nf-card-body' }, [
						E('div', { 'class': 'nf-donut-container' }, [
							E('div', { 'class': 'nf-donut' }, [
								protoData.length > 0 ? this.renderDonut(protoData, 160) : '',
								E('div', { 'class': 'nf-donut-center' }, [
									E('div', { 'class': 'nf-donut-value' }, totalFlows),
									E('div', { 'class': 'nf-donut-label' }, 'Flows')
								])
							]),
							E('div', { 'class': 'nf-legend' }, 
								protoData.map(function(p, i) {
									var colors = ['#8b5cf6', '#3b82f6', '#06b6d4'];
									return E('div', { 'class': 'nf-legend-item' }, [
										E('div', { 'class': 'nf-legend-dot', 'style': 'background:' + colors[i] }),
										E('span', { 'class': 'nf-legend-name' }, p.name),
										E('span', { 'class': 'nf-legend-value' }, p.value)
									]);
								})
							)
						])
					])
				]),
				
				// Top Applications
				E('div', { 'class': 'nf-card' }, [
					E('div', { 'class': 'nf-card-header' }, [
						E('div', { 'class': 'nf-card-title' }, [
							E('span', { 'class': 'nf-card-title-icon' }, '📱'),
							'Top Applications'
						]),
						E('div', { 'class': 'nf-card-badge' }, apps.length + ' detected')
					]),
					E('div', { 'class': 'nf-card-body' }, [
						E('div', { 'class': 'nf-bar-chart' }, 
							topApps.map(function(app) {
								var pct = (app.bytes / maxAppBytes) * 100;
								return E('div', { 'class': 'nf-bar-item' }, [
									E('div', { 'class': 'nf-bar-label' }, [
										E('span', { 'class': 'nf-bar-label-icon' }, api.getAppIcon(app.name)),
										app.name
									]),
									E('div', { 'class': 'nf-bar-track' }, [
										E('div', { 'class': 'nf-bar-fill', 'style': 'width:' + pct + '%' })
									]),
									E('span', { 'class': 'nf-bar-value' }, api.formatBytes(app.bytes))
								]);
							})
						)
					])
				])
			])
		]);
		
		// Include CSS
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('netifyd-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
