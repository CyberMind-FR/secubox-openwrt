'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require ui';
'require wireguard-dashboard.api as api';

return view.extend({
	title: _('QR Code Generator'),
	
	load: function() {
		return api.getConfig();
	},
	
	generateQRCode: function(text, size) {
		// Simple QR code SVG generator using a basic encoding
		// In production, this would use a proper QR library
		var qrSize = size || 200;
		var moduleCount = 25; // Simplified
		var moduleSize = qrSize / moduleCount;
		
		// Create a placeholder SVG that represents the QR structure
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + qrSize + ' ' + qrSize + '" width="' + qrSize + '" height="' + qrSize + '">';
		svg += '<rect width="100%" height="100%" fill="white"/>';
		
		// Simplified pattern - in real implementation, use proper QR encoding
		// Draw finder patterns (corners)
		var drawFinder = function(x, y) {
			var s = moduleSize * 7;
			svg += '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" fill="black"/>';
			svg += '<rect x="' + (x + moduleSize) + '" y="' + (y + moduleSize) + '" width="' + (s - moduleSize * 2) + '" height="' + (s - moduleSize * 2) + '" fill="white"/>';
			svg += '<rect x="' + (x + moduleSize * 2) + '" y="' + (y + moduleSize * 2) + '" width="' + (s - moduleSize * 4) + '" height="' + (s - moduleSize * 4) + '" fill="black"/>';
		};
		
		drawFinder(0, 0);
		drawFinder(qrSize - moduleSize * 7, 0);
		drawFinder(0, qrSize - moduleSize * 7);
		
		// Add some random-looking modules for visual effect
		var hash = 0;
		for (var i = 0; i < text.length; i++) {
			hash = ((hash << 5) - hash) + text.charCodeAt(i);
		}
		
		for (var row = 8; row < moduleCount - 8; row++) {
			for (var col = 8; col < moduleCount - 8; col++) {
				if (((hash + row * col) % 3) === 0) {
					svg += '<rect x="' + (col * moduleSize) + '" y="' + (row * moduleSize) + '" width="' + moduleSize + '" height="' + moduleSize + '" fill="black"/>';
				}
			}
		}
		
		svg += '</svg>';
		return svg;
	},
	
	render: function(data) {
		var self = this;
		var interfaces = (data || {}).interfaces || [];
		
		var view = E('div', { 'class': 'wireguard-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			// Header
			E('div', { 'class': 'wg-header' }, [
				E('div', { 'class': 'wg-logo' }, [
					E('div', { 'class': 'wg-logo-icon' }, '📱'),
					E('div', { 'class': 'wg-logo-text' }, ['QR ', E('span', {}, 'Generator')])
				])
			]),
			
			// Info banner
			E('div', { 'class': 'wg-info-banner' }, [
				E('span', { 'class': 'wg-info-icon' }, 'ℹ️'),
				E('div', {}, [
					E('strong', {}, 'Mobile Configuration'),
					E('p', {}, 'Generate QR codes to quickly configure WireGuard on mobile devices. ' +
						'The client config is generated as a template - you\'ll need to fill in the private key.')
				])
			]),
			
			// Interfaces with QR generation
			interfaces.length > 0 ?
			interfaces.map(function(iface) {
				return E('div', { 'class': 'wg-card' }, [
					E('div', { 'class': 'wg-card-header' }, [
						E('div', { 'class': 'wg-card-title' }, [
							E('span', { 'class': 'wg-card-title-icon' }, '🌐'),
							'Interface: ' + iface.name
						]),
						E('div', { 'class': 'wg-card-badge' }, (iface.peers || []).length + ' peers')
					]),
					E('div', { 'class': 'wg-card-body' }, [
						E('div', { 'class': 'wg-qr-grid' },
							(iface.peers || []).map(function(peer, idx) {
								// Generate client config template
								var clientConfig = '[Interface]\n' +
									'PrivateKey = <YOUR_PRIVATE_KEY>\n' +
									'Address = ' + (peer.allowed_ips || '10.0.0.' + (idx + 2) + '/32') + '\n' +
									'DNS = 1.1.1.1\n\n' +
									'[Peer]\n' +
									'PublicKey = ' + iface.public_key + '\n' +
									'Endpoint = <YOUR_SERVER_IP>:' + (iface.listen_port || 51820) + '\n' +
									'AllowedIPs = 0.0.0.0/0, ::/0\n' +
									'PersistentKeepalive = 25';
								
								return E('div', { 'class': 'wg-qr-card' }, [
									E('div', { 'class': 'wg-qr-header' }, [
										E('span', { 'class': 'wg-qr-icon' }, '👤'),
										E('div', {}, [
											E('h4', {}, 'Peer ' + (idx + 1)),
											E('code', {}, peer.public_key.substring(0, 16) + '...')
										])
									]),
									E('div', { 'class': 'wg-qr-code', 'data-config': clientConfig }, [
										E('div', { 'class': 'wg-qr-placeholder' }, [
											E('span', {}, '📱'),
											E('p', {}, 'QR Code Preview'),
											E('small', {}, 'Scan with WireGuard app')
										])
									]),
									E('div', { 'class': 'wg-qr-actions' }, [
										E('button', { 
											'class': 'wg-btn',
											'click': function() {
												// Copy config to clipboard
												navigator.clipboard.writeText(clientConfig).then(function() {
													ui.addNotification(null, E('p', {}, 'Configuration copied to clipboard!'), 'info');
												});
											}
										}, '📋 Copy Config'),
										E('button', { 
											'class': 'wg-btn wg-btn-primary',
											'click': function() {
												// Download config as file
												var blob = new Blob([clientConfig], { type: 'text/plain' });
												var url = URL.createObjectURL(blob);
												var a = document.createElement('a');
												a.href = url;
												a.download = iface.name + '-peer' + (idx + 1) + '.conf';
												a.click();
												URL.revokeObjectURL(url);
											}
										}, '💾 Download .conf')
									]),
									E('div', { 'class': 'wg-config-preview' }, [
										E('div', { 'class': 'wg-config-toggle', 'click': function(ev) {
											var pre = ev.target.parentNode.querySelector('pre');
											pre.style.display = pre.style.display === 'none' ? 'block' : 'none';
										}}, '▶ Show configuration'),
										E('pre', { 'style': 'display: none' }, clientConfig)
									])
								]);
							})
						)
					])
				]);
			}) :
			E('div', { 'class': 'wg-empty' }, [
				E('div', { 'class': 'wg-empty-icon' }, '📱'),
				E('div', { 'class': 'wg-empty-text' }, 'No WireGuard interfaces configured'),
				E('p', {}, 'Create an interface to generate QR codes for mobile clients')
			])
		]);
		
		// Additional CSS
		var css = `
			.wg-info-banner {
				display: flex;
				gap: 12px;
				padding: 16px;
				background: rgba(6, 182, 212, 0.1);
				border: 1px solid rgba(6, 182, 212, 0.3);
				border-radius: 10px;
				margin-bottom: 20px;
			}
			.wg-info-banner .wg-info-icon { font-size: 24px; }
			.wg-info-banner p { margin: 4px 0 0 0; font-size: 13px; color: var(--wg-text-secondary); }
			.wg-qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
			.wg-qr-card {
				background: var(--wg-bg-tertiary);
				border: 1px solid var(--wg-border);
				border-radius: 12px;
				padding: 20px;
			}
			.wg-qr-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 16px;
			}
			.wg-qr-icon { font-size: 28px; }
			.wg-qr-header h4 { margin: 0; font-size: 16px; }
			.wg-qr-header code { font-size: 10px; color: var(--wg-text-muted); }
			.wg-qr-code {
				background: white;
				border-radius: 12px;
				padding: 20px;
				display: flex;
				justify-content: center;
				margin-bottom: 16px;
			}
			.wg-qr-placeholder {
				text-align: center;
				color: #333;
			}
			.wg-qr-placeholder span { font-size: 48px; display: block; margin-bottom: 8px; }
			.wg-qr-placeholder p { margin: 0; font-weight: 600; }
			.wg-qr-placeholder small { font-size: 11px; color: #666; }
			.wg-qr-actions { display: flex; gap: 10px; margin-bottom: 12px; }
			.wg-config-preview { margin-top: 12px; }
			.wg-config-toggle {
				cursor: pointer;
				font-size: 12px;
				color: var(--wg-accent-cyan);
			}
			.wg-config-preview pre {
				margin-top: 10px;
				padding: 12px;
				background: var(--wg-bg-primary);
				border-radius: 8px;
				font-size: 11px;
				line-height: 1.6;
				overflow-x: auto;
				white-space: pre-wrap;
			}
		`;
		var style = E('style', {}, css);
		document.head.appendChild(style);
		
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('wireguard-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
