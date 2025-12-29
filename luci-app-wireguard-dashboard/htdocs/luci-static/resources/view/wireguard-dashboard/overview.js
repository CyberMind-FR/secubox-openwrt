'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require dom';
'require ui';
'require wireguard-dashboard.api as api';

return view.extend({
	title: _('WireGuard Dashboard'),
	
	load: function() {
		return api.getAllData();
	},
	
	render: function(data) {
		var status = data.status || {};
		var interfaces = (data.interfaces || {}).interfaces || [];
		var peers = (data.peers || {}).peers || [];
		
		var activePeers = peers.filter(function(p) { return p.status === 'active'; }).length;
		
		var view = E('div', { 'class': 'wireguard-dashboard' }, [
			// Header
			E('div', { 'class': 'wg-header' }, [
				E('div', { 'class': 'wg-logo' }, [
					E('div', { 'class': 'wg-logo-icon' }, '🔐'),
					E('div', { 'class': 'wg-logo-text' }, ['Wire', E('span', {}, 'Guard')])
				]),
				E('div', { 'class': 'wg-header-info' }, [
					E('div', { 
						'class': 'wg-status-badge ' + (status.interface_count > 0 ? '' : 'offline')
					}, [
						E('span', { 'class': 'wg-status-dot' }),
						status.interface_count > 0 ? 'VPN Active' : 'No Tunnels'
					])
				])
			]),
			
			// Quick Stats
			E('div', { 'class': 'wg-quick-stats' }, [
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '🌐'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Interfaces')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, status.interface_count || 0),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Active tunnels')
				]),
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '👥'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Total Peers')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, status.total_peers || 0),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Configured')
				]),
				E('div', { 'class': 'wg-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #34d399)' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '✅'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Active Peers')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, status.active_peers || 0),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Connected now')
				]),
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '📥'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Downloaded')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, api.formatBytes(status.total_rx || 0)),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Total received')
				]),
				E('div', { 'class': 'wg-quick-stat' }, [
					E('div', { 'class': 'wg-quick-stat-header' }, [
						E('span', { 'class': 'wg-quick-stat-icon' }, '📤'),
						E('span', { 'class': 'wg-quick-stat-label' }, 'Uploaded')
					]),
					E('div', { 'class': 'wg-quick-stat-value' }, api.formatBytes(status.total_tx || 0)),
					E('div', { 'class': 'wg-quick-stat-sub' }, 'Total sent')
				])
			]),
			
			// Interfaces
			E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '🔗'),
						'WireGuard Interfaces'
					]),
					E('div', { 'class': 'wg-card-badge' }, interfaces.length + ' tunnel' + (interfaces.length !== 1 ? 's' : ''))
				]),
				E('div', { 'class': 'wg-card-body' }, 
					interfaces.length > 0 ?
					E('div', { 'class': 'wg-charts-grid' },
						interfaces.map(function(iface) {
							return E('div', { 'class': 'wg-interface-card' }, [
								E('div', { 'class': 'wg-interface-header' }, [
									E('div', { 'class': 'wg-interface-name' }, [
										E('div', { 'class': 'wg-interface-icon' }, '🌐'),
										E('div', {}, [
											E('h3', {}, iface.name),
											E('p', {}, 'Listen port: ' + (iface.listen_port || 'N/A'))
										])
									]),
									E('span', { 'class': 'wg-interface-status ' + iface.state }, iface.state)
								]),
								E('div', { 'class': 'wg-interface-details' }, [
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'Public Key'),
										E('div', { 'class': 'wg-interface-detail-value' }, api.shortenKey(iface.public_key, 12))
									]),
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'IPv4 Address'),
										E('div', { 'class': 'wg-interface-detail-value' }, iface.ipv4_address || 'N/A')
									]),
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'MTU'),
										E('div', { 'class': 'wg-interface-detail-value' }, iface.mtu || 1420)
									]),
									E('div', { 'class': 'wg-interface-detail' }, [
										E('div', { 'class': 'wg-interface-detail-label' }, 'Traffic'),
										E('div', { 'class': 'wg-interface-detail-value' }, 
											'↓' + api.formatBytes(iface.rx_bytes) + ' / ↑' + api.formatBytes(iface.tx_bytes))
									])
								])
							]);
						})
					) :
					E('div', { 'class': 'wg-empty' }, [
						E('div', { 'class': 'wg-empty-icon' }, '🔐'),
						E('div', { 'class': 'wg-empty-text' }, 'No WireGuard interfaces configured'),
						E('p', {}, 'Configure a WireGuard interface in Network settings')
					])
				)
			]),
			
			// Recent Peers
			peers.length > 0 ? E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '👥'),
						'Connected Peers'
					]),
					E('div', { 'class': 'wg-card-badge' }, activePeers + '/' + peers.length + ' active')
				]),
				E('div', { 'class': 'wg-card-body' }, [
					E('div', { 'class': 'wg-peer-grid' },
						peers.slice(0, 6).map(function(peer) {
							return E('div', { 'class': 'wg-peer-card ' + (peer.status === 'active' ? 'active' : '') }, [
								E('div', { 'class': 'wg-peer-header' }, [
									E('div', { 'class': 'wg-peer-info' }, [
										E('div', { 'class': 'wg-peer-icon' }, peer.status === 'active' ? '✅' : '👤'),
										E('div', {}, [
											E('p', { 'class': 'wg-peer-name' }, 'Peer ' + peer.short_key),
											E('p', { 'class': 'wg-peer-key' }, api.shortenKey(peer.public_key, 16))
										])
									]),
									E('span', { 'class': 'wg-peer-status ' + api.getPeerStatusClass(peer.status) }, peer.status)
								]),
								E('div', { 'class': 'wg-peer-details' }, [
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Endpoint'),
										E('span', { 'class': 'wg-peer-detail-value' }, peer.endpoint || '(none)')
									]),
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Last Handshake'),
										E('span', { 'class': 'wg-peer-detail-value' }, api.formatHandshake(peer.handshake_ago))
									]),
									E('div', { 'class': 'wg-peer-detail', 'style': 'grid-column: span 2' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Allowed IPs'),
										E('span', { 'class': 'wg-peer-detail-value' }, peer.allowed_ips || 'N/A')
									])
								]),
								E('div', { 'class': 'wg-peer-traffic' }, [
									E('div', { 'class': 'wg-peer-traffic-item' }, [
										E('div', { 'class': 'wg-peer-traffic-icon' }, '📥'),
										E('div', { 'class': 'wg-peer-traffic-value rx' }, api.formatBytes(peer.rx_bytes)),
										E('div', { 'class': 'wg-peer-traffic-label' }, 'Received')
									]),
									E('div', { 'class': 'wg-peer-traffic-item' }, [
										E('div', { 'class': 'wg-peer-traffic-icon' }, '📤'),
										E('div', { 'class': 'wg-peer-traffic-value tx' }, api.formatBytes(peer.tx_bytes)),
										E('div', { 'class': 'wg-peer-traffic-label' }, 'Sent')
									])
								])
							]);
						})
					)
				])
			]) : ''
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
