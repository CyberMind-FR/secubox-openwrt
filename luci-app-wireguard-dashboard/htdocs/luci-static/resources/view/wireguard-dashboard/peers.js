'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require wireguard-dashboard.api as api';

return view.extend({
	title: _('WireGuard Peers'),
	
	load: function() {
		return api.getPeers();
	},
	
	render: function(data) {
		var peers = (data || {}).peers || [];
		var activePeers = peers.filter(function(p) { return p.status === 'active'; }).length;
		
		var view = E('div', { 'class': 'wireguard-dashboard' }, [
			// Header
			E('div', { 'class': 'wg-header' }, [
				E('div', { 'class': 'wg-logo' }, [
					E('div', { 'class': 'wg-logo-icon' }, '👥'),
					E('div', { 'class': 'wg-logo-text' }, ['Wire', E('span', {}, 'Guard'), ' Peers'])
				]),
				E('div', { 'class': 'wg-header-info' }, [
					E('div', { 'class': 'wg-status-badge' }, [
						E('span', { 'class': 'wg-status-dot' }),
						activePeers + '/' + peers.length + ' Active'
					])
				])
			]),
			
			// Peers Grid
			E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '📋'),
						'All Peers'
					]),
					E('div', { 'class': 'wg-card-badge' }, peers.length + ' configured')
				]),
				E('div', { 'class': 'wg-card-body' }, 
					peers.length > 0 ?
					E('div', { 'class': 'wg-peer-grid' },
						peers.map(function(peer) {
							return E('div', { 'class': 'wg-peer-card ' + (peer.status === 'active' ? 'active' : '') }, [
								E('div', { 'class': 'wg-peer-header' }, [
									E('div', { 'class': 'wg-peer-info' }, [
										E('div', { 'class': 'wg-peer-icon' }, 
											peer.status === 'active' ? '✅' : 
											peer.status === 'idle' ? '💤' : '👤'),
										E('div', {}, [
											E('p', { 'class': 'wg-peer-name' }, 'Peer ' + peer.short_key),
											E('p', { 'class': 'wg-peer-key' }, peer.interface)
										])
									]),
									E('span', { 'class': 'wg-peer-status ' + api.getPeerStatusClass(peer.status) }, peer.status)
								]),
								E('div', { 'class': 'wg-peer-details' }, [
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Public Key'),
										E('span', { 'class': 'wg-peer-detail-value' }, api.shortenKey(peer.public_key, 20))
									]),
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Endpoint'),
										E('span', { 'class': 'wg-peer-detail-value' }, peer.endpoint || '(roaming)')
									]),
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Allowed IPs'),
										E('span', { 'class': 'wg-peer-detail-value' }, peer.allowed_ips || 'N/A')
									]),
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Keepalive'),
										E('span', { 'class': 'wg-peer-detail-value' }, 
											peer.keepalive > 0 ? peer.keepalive + 's' : 'off')
									]),
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'Last Handshake'),
										E('span', { 'class': 'wg-peer-detail-value' }, api.formatHandshake(peer.handshake_ago))
									]),
									E('div', { 'class': 'wg-peer-detail' }, [
										E('span', { 'class': 'wg-peer-detail-label' }, 'PSK'),
										E('span', { 'class': 'wg-peer-detail-value' }, peer.preshared_key ? '✓ Set' : '✗ None')
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
					) :
					E('div', { 'class': 'wg-empty' }, [
						E('div', { 'class': 'wg-empty-icon' }, '👥'),
						E('div', { 'class': 'wg-empty-text' }, 'No peers configured'),
						E('p', {}, 'Add peers to your WireGuard interfaces')
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
