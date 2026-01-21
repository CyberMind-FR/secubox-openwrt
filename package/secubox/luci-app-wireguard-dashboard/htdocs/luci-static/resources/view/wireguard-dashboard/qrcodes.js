'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require ui';
'require wireguard-dashboard/api as api';
'require wireguard-dashboard/qrcode as qrcode';

return view.extend({
	title: _('QR Code Generator'),

	load: function() {
		return Promise.all([
			api.getConfig(),
			api.getInterfaces(),
			api.getPeers()
		]).then(function(results) {
			return {
				config: results[0] || {},
				interfaces: (results[1] || {}).interfaces || [],
				peers: (results[2] || {}).peers || []
			};
		});
	},

	getStoredPrivateKey: function(publicKey) {
		try {
			var stored = sessionStorage.getItem('wg_peer_keys');
			if (stored) {
				var keys = JSON.parse(stored);
				return keys[publicKey] || null;
			}
		} catch (e) {}
		return null;
	},

	generateQRForPeer: function(iface, peer, serverEndpoint) {
		var self = this;
		var privateKey = this.getStoredPrivateKey(peer.public_key);

		if (!privateKey) {
			ui.showModal(_('Private Key Required'), [
				E('p', {}, _('To generate a QR code, you need the peer\'s private key.')),
				E('p', {}, _('Private keys are only available immediately after peer creation for security reasons.')),
				E('div', { 'class': 'wg-form-group' }, [
					E('label', {}, _('Enter Private Key:')),
					E('input', {
						'type': 'text',
						'id': 'wg-private-key-input',
						'class': 'cbi-input-text',
						'placeholder': 'Base64 private key...',
						'style': 'width: 100%; font-family: monospace;'
					})
				]),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, _('Cancel')),
					' ',
					E('button', {
						'class': 'btn cbi-button-action',
						'click': function() {
							var input = document.getElementById('wg-private-key-input');
							var key = input ? input.value.trim() : '';
							if (key && key.length === 44) {
								ui.hideModal();
								self.showQRCode(iface, peer, key, serverEndpoint);
							} else {
								ui.addNotification(null, E('p', {}, _('Please enter a valid private key (44 characters, base64)')), 'error');
							}
						}
					}, _('Generate QR'))
				])
			]);
			return;
		}

		this.showQRCode(iface, peer, privateKey, serverEndpoint);
	},

	showQRCode: function(iface, peer, privateKey, serverEndpoint) {
		var self = this;

		// First try backend (uses qrencode if available)
		api.generateQR(iface.name, peer.public_key, privateKey, serverEndpoint).then(function(result) {
			if (result && result.qrcode && !result.error) {
				// Backend generated QR successfully
				self.displayQRModal(iface, peer, result.qrcode, result.config);
			} else {
				// Fall back to JavaScript QR generation
				self.generateJSQR(iface, peer, privateKey, serverEndpoint);
			}
		}).catch(function(err) {
			// Fall back to JavaScript QR generation
			self.generateJSQR(iface, peer, privateKey, serverEndpoint);
		});
	},

	generateJSQR: function(iface, peer, privateKey, serverEndpoint) {
		// Build WireGuard config
		var config = '[Interface]\n' +
			'PrivateKey = ' + privateKey + '\n' +
			'Address = ' + (peer.allowed_ips || '10.0.0.2/32') + '\n' +
			'DNS = 1.1.1.1, 1.0.0.1\n\n' +
			'[Peer]\n' +
			'PublicKey = ' + iface.public_key + '\n' +
			'Endpoint = ' + serverEndpoint + ':' + (iface.listen_port || 51820) + '\n' +
			'AllowedIPs = 0.0.0.0/0, ::/0\n' +
			'PersistentKeepalive = 25';

		var svg = qrcode.generateSVG(config, 250);
		if (svg) {
			this.displayQRModal(iface, peer, svg, config, true);
		} else {
			ui.addNotification(null, E('p', {}, _('Failed to generate QR code. Config may be too long.')), 'error');
		}
	},

	displayQRModal: function(iface, peer, qrData, config, isSVG) {
		var qrElement;

		if (isSVG) {
			qrElement = E('div', { 'class': 'wg-qr-image' });
			qrElement.innerHTML = qrData;
		} else {
			qrElement = E('img', {
				'src': qrData,
				'alt': 'WireGuard QR Code',
				'class': 'wg-qr-image'
			});
		}

		ui.showModal(_('WireGuard Configuration'), [
			E('div', { 'class': 'wg-qr-modal' }, [
				E('div', { 'class': 'wg-qr-header' }, [
					E('h4', {}, iface.name + ' - Peer ' + (peer.short_key || peer.public_key.substring(0, 8)))
				]),
				E('div', { 'class': 'wg-qr-container' }, [qrElement]),
				E('p', { 'class': 'wg-qr-hint' }, _('Scan with WireGuard app on your mobile device')),
				E('div', { 'class': 'wg-qr-actions' }, [
					E('button', {
						'class': 'btn',
						'click': function() {
							navigator.clipboard.writeText(config).then(function() {
								ui.addNotification(null, E('p', {}, _('Configuration copied to clipboard')), 'info');
							});
						}
					}, _('Copy Config')),
					E('button', {
						'class': 'btn cbi-button-action',
						'click': function() {
							var blob = new Blob([config], { type: 'text/plain' });
							var url = URL.createObjectURL(blob);
							var a = document.createElement('a');
							a.href = url;
							a.download = iface.name + '-peer.conf';
							a.click();
							URL.revokeObjectURL(url);
						}
					}, _('Download .conf'))
				]),
				E('details', { 'class': 'wg-config-details' }, [
					E('summary', {}, _('Show configuration')),
					E('pre', {}, config)
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Close'))
			])
		]);
	},

	render: function(data) {
		var self = this;
		var interfaces = data.interfaces || [];
		var configData = (data.config || {}).interfaces || [];
		var peers = data.peers || [];

		// Merge interface data with config data
		interfaces = interfaces.map(function(iface) {
			var cfg = configData.find(function(c) { return c.name === iface.name; }) || {};
			return Object.assign({}, iface, {
				peers: cfg.peers || [],
				public_key: cfg.public_key || iface.public_key
			});
		});

		var view = E('div', { 'class': 'wireguard-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),

			// Header
			E('div', { 'class': 'wg-header' }, [
				E('div', { 'class': 'wg-logo' }, [
					E('div', { 'class': 'wg-logo-icon' }, '📱'),
					E('div', { 'class': 'wg-logo-text' }, ['QR ', E('span', {}, 'Generator')])
				])
			]),

			// Server endpoint input
			E('div', { 'class': 'wg-card' }, [
				E('div', { 'class': 'wg-card-header' }, [
					E('div', { 'class': 'wg-card-title' }, [
						E('span', { 'class': 'wg-card-title-icon' }, '🌐'),
						_('Server Endpoint')
					])
				]),
				E('div', { 'class': 'wg-card-body' }, [
					E('p', { 'style': 'margin-bottom: 12px; color: var(--wg-text-secondary);' },
						_('Enter the public IP or hostname of this WireGuard server:')),
					E('div', { 'class': 'wg-form-row' }, [
						E('input', {
							'type': 'text',
							'id': 'wg-server-endpoint',
							'class': 'cbi-input-text',
							'placeholder': 'e.g., vpn.example.com or 203.0.113.1',
							'style': 'flex: 1;'
						}),
						E('button', {
							'class': 'wg-btn wg-btn-primary',
							'click': function() {
								var input = document.getElementById('wg-server-endpoint');
								if (input && input.value.trim()) {
									sessionStorage.setItem('wg_server_endpoint', input.value.trim());
									ui.addNotification(null, E('p', {}, _('Server endpoint saved')), 'info');
								}
							}
						}, _('Save'))
					])
				])
			]),

			// Interface cards
			interfaces.length > 0 ?
			E('div', { 'class': 'wg-interface-list' },
				interfaces.map(function(iface) {
					var ifacePeers = peers.filter(function(p) { return p.interface === iface.name; });

					return E('div', { 'class': 'wg-card' }, [
						E('div', { 'class': 'wg-card-header' }, [
							E('div', { 'class': 'wg-card-title' }, [
								E('span', { 'class': 'wg-card-title-icon' }, '🔐'),
								iface.name
							]),
							E('div', { 'class': 'wg-card-badge' }, ifacePeers.length + ' peers')
						]),
						E('div', { 'class': 'wg-card-body' }, [
							E('div', { 'class': 'wg-interface-info' }, [
								E('div', { 'class': 'wg-info-item' }, [
									E('span', { 'class': 'wg-info-label' }, _('Public Key:')),
									E('code', {}, (iface.public_key || 'N/A').substring(0, 20) + '...')
								]),
								E('div', { 'class': 'wg-info-item' }, [
									E('span', { 'class': 'wg-info-label' }, _('Listen Port:')),
									E('span', {}, iface.listen_port || 51820)
								])
							]),

							ifacePeers.length > 0 ?
							E('div', { 'class': 'wg-peer-list' },
								ifacePeers.map(function(peer) {
									return E('div', { 'class': 'wg-peer-item' }, [
										E('div', { 'class': 'wg-peer-info' }, [
											E('span', { 'class': 'wg-peer-icon' }, '👤'),
											E('div', {}, [
												E('strong', {}, peer.short_key || peer.public_key.substring(0, 8)),
												E('div', { 'class': 'wg-peer-ips' }, peer.allowed_ips || 'No IPs')
											])
										]),
										E('button', {
											'class': 'wg-btn wg-btn-primary',
											'click': function() {
												var endpoint = sessionStorage.getItem('wg_server_endpoint');
												if (!endpoint) {
													var input = document.getElementById('wg-server-endpoint');
													endpoint = input ? input.value.trim() : '';
												}
												if (!endpoint) {
													ui.addNotification(null, E('p', {}, _('Please enter the server endpoint first')), 'warning');
													return;
												}
												self.generateQRForPeer(iface, peer, endpoint);
											}
										}, '📱 ' + _('QR Code'))
									]);
								})
							) :
							E('div', { 'class': 'wg-empty-peers' }, _('No peers configured for this interface'))
						])
					]);
				})
			) :
			E('div', { 'class': 'wg-empty' }, [
				E('div', { 'class': 'wg-empty-icon' }, '📱'),
				E('div', { 'class': 'wg-empty-text' }, _('No WireGuard interfaces configured')),
				E('p', {}, _('Create a WireGuard interface to generate QR codes'))
			])
		]);

		// Restore saved endpoint
		setTimeout(function() {
			var saved = sessionStorage.getItem('wg_server_endpoint');
			if (saved) {
				var input = document.getElementById('wg-server-endpoint');
				if (input) input.value = saved;
			}
		}, 100);

		// Add CSS
		var css = `
			.wg-form-row {
				display: flex;
				gap: 10px;
				align-items: center;
			}
			.wg-interface-info {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
				gap: 12px;
				padding: 12px;
				background: var(--wg-bg-tertiary);
				border-radius: 8px;
				margin-bottom: 16px;
			}
			.wg-info-item {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			.wg-info-label {
				font-size: 12px;
				color: var(--wg-text-muted);
			}
			.wg-peer-list {
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			.wg-peer-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 12px;
				background: var(--wg-bg-tertiary);
				border: 1px solid var(--wg-border);
				border-radius: 8px;
			}
			.wg-peer-info {
				display: flex;
				align-items: center;
				gap: 12px;
			}
			.wg-peer-icon {
				font-size: 24px;
			}
			.wg-peer-ips {
				font-size: 12px;
				color: var(--wg-text-muted);
				font-family: monospace;
			}
			.wg-empty-peers {
				text-align: center;
				padding: 20px;
				color: var(--wg-text-muted);
			}
			.wg-qr-modal {
				text-align: center;
			}
			.wg-qr-container {
				background: white;
				padding: 20px;
				border-radius: 12px;
				display: inline-block;
				margin: 20px 0;
			}
			.wg-qr-image {
				max-width: 250px;
				max-height: 250px;
			}
			.wg-qr-hint {
				color: var(--wg-text-secondary);
				font-size: 14px;
			}
			.wg-qr-actions {
				display: flex;
				justify-content: center;
				gap: 10px;
				margin: 16px 0;
			}
			.wg-config-details {
				text-align: left;
				margin-top: 16px;
			}
			.wg-config-details summary {
				cursor: pointer;
				color: var(--wg-accent-cyan);
				margin-bottom: 8px;
			}
			.wg-config-details pre {
				background: var(--wg-bg-tertiary);
				padding: 12px;
				border-radius: 8px;
				font-size: 11px;
				overflow-x: auto;
				white-space: pre-wrap;
			}
			.wg-form-group {
				margin: 16px 0;
				text-align: left;
			}
			.wg-form-group label {
				display: block;
				margin-bottom: 8px;
				font-weight: 500;
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
