'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require dom';
'require ui';
'require wireguard-dashboard.api as api';

return view.extend({
	title: _('WireGuard Traffic'),
	
	load: function() {
		return api.getTraffic();
	},
	
	render: function(data) {
		var traffic = data || {};
		var interfaces = traffic.interfaces || [];
		var totalRx = traffic.total_rx || 0;
		var totalTx = traffic.total_tx || 0;
		var totalTraffic = totalRx + totalTx;
		
		var view = E('div', { 'class': 'wireguard-dashboard' }, [
			// Header
			E('div', { 'class': 'wg-header' }, [
				E('div', { 'class': 'wg-logo' }, [
					E('div', { 'class': 'wg-logo-icon' }, '📊'),
					E('div', { 'class': 'wg-logo-text' }, ['Traffic ', E('span', {}, 'Statistics')])
				])
			]),
			
			// Total Stats
			E('div', { 'class': 'wg-quick-stats' }, [
				E('div', { 'class': 'wg-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #34d399)' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '📥'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Total Downloaded')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, api.formatBytes(totalRx)),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'All interfaces combined')
				]),
				E('div', { 'class': 'wg-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #0ea5e9, #38bdf8)' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '📤'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Total Uploaded')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, api.formatBytes(totalTx)),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'All interfaces combined')
				]),
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '📈'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Total Traffic')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, api.formatBytes(totalTraffic)),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'RX + TX combined')
				])
			]),
			
			// Per-interface traffic
			E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '🔗'),
						'Traffic by Interface'
					])
				]),
				E('div', { 'class': 'wg-card-body' },
					interfaces.length > 0 ?
					interfaces.map(function(iface) {
						var ifaceTotal = (iface.total_rx || 0) + (iface.total_tx || 0);
						var rxPct = totalTraffic > 0 ? ((iface.total_rx || 0) / totalTraffic * 100) : 0;
						var txPct = totalTraffic > 0 ? ((iface.total_tx || 0) / totalTraffic * 100) : 0;
						
						return E('div', { 'class': 'wg-interface-card', 'style': 'margin-bottom: 16px' }, [
							E('div', { 'class': 'wg-interface-header' }, [
								E('div', { 'class': 'wg-interface-name' }, [
									E('div', { 'class': 'wg-interface-icon' }, '🌐'),
									E('div', {}, [
										E('h3', {}, iface.name),
										E('p', {}, api.formatBytes(ifaceTotal) + ' total')
									])
								])
							]),
							E('div', { 'class': 'wg-traffic-bar' }, [
								E('div', { 'class': 'wg-traffic-bar-header' }, [
									E('span', { 'style': 'color: #10b981' }, '↓ ' + api.formatBytes(iface.total_rx || 0)),
									E('span', { 'style': 'color: #0ea5e9' }, '↑ ' + api.formatBytes(iface.total_tx || 0))
								]),
								E('div', { 'class': 'wg-traffic-bar-track' }, [
									E('div', { 'class': 'wg-traffic-bar-rx', 'style': 'width:' + rxPct + '%' }),
									E('div', { 'class': 'wg-traffic-bar-tx', 'style': 'width:' + txPct + '%' })
								])
							]),
							(iface.peers || []).length > 0 ? E('div', { 'class': 'wg-table-container', 'style': 'margin-top: 16px' }, [
								E('table', { 'class': 'wg-table' }, [
									E('thead', {}, [
										E('tr', {}, [
											E('th', {}, 'Peer'),
											E('th', {}, 'Downloaded'),
											E('th', {}, 'Uploaded'),
											E('th', {}, 'Total')
										])
									]),
									E('tbody', {},
										(iface.peers || []).map(function(peer) {
											var peerTotal = (peer.rx_bytes || 0) + (peer.tx_bytes || 0);
											return E('tr', {}, [
												E('td', { 'class': 'mono key' }, peer.short_key + '...'),
												E('td', { 'class': 'mono', 'style': 'color: #10b981' }, api.formatBytes(peer.rx_bytes || 0)),
												E('td', { 'class': 'mono', 'style': 'color: #0ea5e9' }, api.formatBytes(peer.tx_bytes || 0)),
												E('td', { 'class': 'mono' }, api.formatBytes(peerTotal))
											]);
										})
									)
								])
							]) : ''
						]);
					}) :
					E('div', { 'class': 'wg-empty' }, [
						E('div', { 'class': 'wg-empty-icon' }, '📊'),
						E('div', { 'class': 'wg-empty-text' }, 'No traffic data available')
					])
				)
			])
		]);
		
		// Include CSS
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('wireguard-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
