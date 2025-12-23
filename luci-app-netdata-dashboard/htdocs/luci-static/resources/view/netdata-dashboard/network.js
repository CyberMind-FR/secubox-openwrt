'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require netdata-dashboard.api as api';

return view.extend({
	title: _('Network'),
	
	load: function() {
		return api.getNetwork();
	},
	
	render: function(data) {
		var network = data || {};
		var interfaces = network.interfaces || [];
		
		var totalRx = 0, totalTx = 0;
		interfaces.forEach(function(iface) {
			totalRx += iface.rx_bytes || 0;
			totalTx += iface.tx_bytes || 0;
		});
		
		var view = E('div', { 'class': 'netdata-dashboard' }, [
			// Header
			E('div', { 'class': 'nd-header' }, [
				E('div', { 'class': 'nd-logo' }, [
					E('div', { 'class': 'nd-logo-icon' }, '🌐'),
					E('div', { 'class': 'nd-logo-text' }, ['Network ', E('span', {}, 'Stats')])
				]),
				E('div', { 'class': 'nd-header-info' }, [
					E('div', { 'class': 'nd-live-badge' }, [
						E('span', { 'class': 'nd-live-dot' }),
						'Live'
					])
				])
			]),
			
			// Quick Stats
			E('div', { 'class': 'nd-quick-stats' }, [
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value info' }, interfaces.length),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Interfaces')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value good' }, api.formatBytes(totalRx)),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Total RX')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value info' }, api.formatBytes(totalTx)),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Total TX')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value warning' }, network.conntrack_count || 0),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Connections')
				])
			]),
			
			// Connection Tracking
			network.conntrack_max ? E('div', { 'class': 'nd-chart-card' }, [
				E('div', { 'class': 'nd-chart-header' }, [
					E('div', { 'class': 'nd-chart-title' }, [
						E('span', { 'class': 'nd-chart-title-icon' }, '🔗'),
						'Connection Tracking'
					])
				]),
				E('div', { 'class': 'nd-chart-body' }, [
					E('div', { 'class': 'nd-connections' }, [
						E('div', { 'class': 'nd-connections-count' }, network.conntrack_count || 0),
						E('div', { 'class': 'nd-connections-max' }, '/ ' + network.conntrack_max + ' max')
					]),
					E('div', { 'style': 'margin-top:16px' }, [
						E('div', { 'class': 'nd-disk-bar' }, [
							E('div', { 
								'class': 'nd-disk-fill', 
								'style': 'width:' + Math.min(100, (network.conntrack_count / network.conntrack_max) * 100) + '%'
							})
						])
					])
				])
			]) : '',
			
			// Interfaces Table
			E('div', { 'class': 'nd-chart-card', 'style': 'margin-top:16px' }, [
				E('div', { 'class': 'nd-chart-header' }, [
					E('div', { 'class': 'nd-chart-title' }, [
						E('span', { 'class': 'nd-chart-title-icon' }, '📡'),
						'Network Interfaces'
					])
				]),
				E('div', { 'class': 'nd-chart-body', 'style': 'padding:0;overflow-x:auto' }, [
					E('table', { 'class': 'nd-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, 'Interface'),
								E('th', {}, 'IP Address'),
								E('th', {}, 'State'),
								E('th', {}, 'Speed'),
								E('th', {}, 'RX Bytes'),
								E('th', {}, 'TX Bytes'),
								E('th', {}, 'RX Packets'),
								E('th', {}, 'TX Packets'),
								E('th', {}, 'Errors')
							])
						]),
						E('tbody', {}, 
							interfaces.map(function(iface) {
								var state = iface.state || 'unknown';
								var stateClass = state === 'up' ? 'up' : (state === 'down' ? 'down' : 'unknown');
								return E('tr', {}, [
									E('td', { 'class': 'iface' }, iface.name),
									E('td', { 'class': 'mono' }, iface.ip || '-'),
									E('td', {}, E('span', { 'class': 'nd-status ' + stateClass }, state)),
									E('td', { 'class': 'mono' }, iface.speed > 0 ? iface.speed + ' Mbps' : '-'),
									E('td', { 'class': 'mono value' }, api.formatBytes(iface.rx_bytes || 0)),
									E('td', { 'class': 'mono' }, api.formatBytes(iface.tx_bytes || 0)),
									E('td', { 'class': 'mono' }, (iface.rx_packets || 0).toLocaleString()),
									E('td', { 'class': 'mono' }, (iface.tx_packets || 0).toLocaleString()),
									E('td', { 'class': 'mono' }, (iface.rx_errors || 0) + (iface.tx_errors || 0))
								]);
							})
						)
					])
				])
			]),
			
			// Per-Interface Details
			E('div', { 'class': 'nd-charts-grid', 'style': 'margin-top:16px' },
				interfaces.slice(0, 6).map(function(iface) {
					var rxPct = totalRx > 0 ? Math.round((iface.rx_bytes / totalRx) * 100) : 0;
					var txPct = totalTx > 0 ? Math.round((iface.tx_bytes / totalTx) * 100) : 0;
					
					return E('div', { 'class': 'nd-chart-card' }, [
						E('div', { 'class': 'nd-chart-header' }, [
							E('div', { 'class': 'nd-chart-title' }, [
								E('span', { 'class': 'nd-chart-title-icon' }, '📶'),
								iface.name
							]),
							E('span', { 'class': 'nd-status ' + (iface.state === 'up' ? 'up' : 'down') }, iface.state)
						]),
						E('div', { 'class': 'nd-chart-body' }, [
							E('div', { 'class': 'nd-network-stats' }, [
								E('div', { 'class': 'nd-network-direction' }, [
									E('div', { 'class': 'nd-network-icon' }, '📥'),
									E('div', { 'class': 'nd-network-value rx' }, api.formatBytes(iface.rx_bytes || 0)),
									E('div', { 'class': 'nd-network-label' }, 'Received')
								]),
								E('div', { 'class': 'nd-network-direction' }, [
									E('div', { 'class': 'nd-network-icon' }, '📤'),
									E('div', { 'class': 'nd-network-value tx' }, api.formatBytes(iface.tx_bytes || 0)),
									E('div', { 'class': 'nd-network-label' }, 'Transmitted')
								])
							]),
							E('div', { 'style': 'margin-top:16px' }, [
								E('div', { 'class': 'nd-bar-chart' }, [
									E('div', { 'class': 'nd-bar-item' }, [
										E('span', { 'class': 'nd-bar-label' }, 'Packets RX'),
										E('div', { 'class': 'nd-bar-track' }, [
											E('div', { 'class': 'nd-bar-fill', 'style': 'width:' + rxPct + '%' })
										]),
										E('span', { 'class': 'nd-bar-value' }, (iface.rx_packets || 0).toLocaleString())
									]),
									E('div', { 'class': 'nd-bar-item' }, [
										E('span', { 'class': 'nd-bar-label' }, 'Packets TX'),
										E('div', { 'class': 'nd-bar-track' }, [
											E('div', { 'class': 'nd-bar-fill', 'style': 'width:' + txPct + '%' })
										]),
										E('span', { 'class': 'nd-bar-value' }, (iface.tx_packets || 0).toLocaleString())
									])
								])
							]),
							iface.ip ? E('div', { 'style': 'margin-top:12px;font-size:12px;color:#8b949e' }, 'IP: ' + iface.ip) : ''
						])
					]);
				})
			)
		]);
		
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('netdata-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
