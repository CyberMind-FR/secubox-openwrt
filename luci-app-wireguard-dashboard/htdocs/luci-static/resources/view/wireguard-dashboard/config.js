'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require ui';
'require wireguard-dashboard.api as api';

return view.extend({
	title: _('WireGuard Configuration'),
	
	load: function() {
		return api.getConfig();
	},
	
	render: function(data) {
		var interfaces = (data || {}).interfaces || [];
		
		var view = E('div', { 'class': 'wireguard-dashboard' }, [
			// Header
			E('div', { 'class': 'wg-header' }, [
				E('div', { 'class': 'wg-logo' }, [
					E('div', { 'class': 'wg-logo-icon' }, '⚙️'),
					E('div', { 'class': 'wg-logo-text' }, ['Config', E('span', {}, 'uration')])
				])
			]),
			
			// Configuration cards
			interfaces.length > 0 ?
			interfaces.map(function(iface) {
				return E('div', { 'class': 'wg-card', 'style': 'margin-bottom: 20px' }, [
					E('div', { 'class': 'wg-card-header' }, [
						E('div', { 'class': 'wg-card-title' }, [
							E('span', { 'class': 'wg-card-title-icon' }, '🌐'),
							'Interface: ' + iface.name
						]),
						E('div', { 'class': 'wg-card-badge' }, (iface.peers || []).length + ' peers')
					]),
					E('div', { 'class': 'wg-card-body' }, [
						// Interface config block
						E('div', { 'class': 'wg-config-block' }, [
							E('div', {}, [
								E('span', { 'class': 'wg-config-section' }, '[Interface]')
							]),
							E('div', {}, [
								E('span', { 'class': 'wg-config-key' }, 'PublicKey'),
								E('span', { 'class': 'wg-config-value' }, ' = ' + (iface.public_key || 'N/A'))
							]),
							E('div', {}, [
								E('span', { 'class': 'wg-config-key' }, 'ListenPort'),
								E('span', { 'class': 'wg-config-value' }, ' = ' + (iface.listen_port || 'N/A'))
							]),
							iface.uci_addresses ? E('div', {}, [
								E('span', { 'class': 'wg-config-key' }, 'Address'),
								E('span', { 'class': 'wg-config-value' }, ' = ' + iface.uci_addresses)
							]) : ''
						]),
						
						// Peers config
						(iface.peers || []).length > 0 ? E('div', { 'style': 'margin-top: 20px' },
							(iface.peers || []).map(function(peer, idx) {
								return E('div', { 'class': 'wg-config-block', 'style': idx > 0 ? 'margin-top: 12px' : '' }, [
									E('div', {}, [
										E('span', { 'class': 'wg-config-section' }, '[Peer]')
									]),
									E('div', {}, [
										E('span', { 'class': 'wg-config-key' }, 'PublicKey'),
										E('span', { 'class': 'wg-config-value' }, ' = ' + peer.public_key)
									]),
									peer.endpoint && peer.endpoint !== '(none)' ? E('div', {}, [
										E('span', { 'class': 'wg-config-key' }, 'Endpoint'),
										E('span', { 'class': 'wg-config-value' }, ' = ' + peer.endpoint)
									]) : '',
									E('div', {}, [
										E('span', { 'class': 'wg-config-key' }, 'AllowedIPs'),
										E('span', { 'class': 'wg-config-value' }, ' = ' + (peer.allowed_ips || '0.0.0.0/0'))
									]),
									peer.keepalive > 0 ? E('div', {}, [
										E('span', { 'class': 'wg-config-key' }, 'PersistentKeepalive'),
										E('span', { 'class': 'wg-config-value' }, ' = ' + peer.keepalive)
									]) : ''
								]);
							})
						) : ''
					])
				]);
			}) :
			E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-body' }, [
					E('div', { 'class': 'wg-empty' }, [
						E('div', { 'class': 'wg-empty-icon' }, '⚙️'),
						E('div', { 'class': 'wg-empty-text' }, 'No WireGuard interfaces configured'),
						E('p', {}, 'Create a WireGuard interface in Network > Interfaces')
					])
				])
			]),
			
			// Tunnel visualization
			interfaces.length > 0 ? E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '🔗'),
						'Tunnel Visualization'
					])
				]),
				E('div', { 'class': 'wg-card-body' }, [
					E('div', { 'class': 'wg-tunnel-viz' }, [
						E('div', { 'class': 'wg-tunnel-node' }, [
							E('div', { 'class': 'wg-tunnel-node-icon' }, '🏠'),
							E('div', { 'class': 'wg-tunnel-node-label' }, 'This Router')
						]),
						E('div', { 'class': 'wg-tunnel-line wg-tunnel-active' }),
						E('div', { 'class': 'wg-tunnel-node' }, [
							E('div', { 'class': 'wg-tunnel-node-icon' }, '🌐'),
							E('div', { 'class': 'wg-tunnel-node-label' }, 'Remote Peers')
						])
					])
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
