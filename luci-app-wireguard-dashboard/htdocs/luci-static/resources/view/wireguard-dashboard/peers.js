'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require poll';
'require dom';
'require ui';
'require wireguard-dashboard.api as API';

return view.extend({
	title: _('WireGuard Peers'),

	load: function() {
		return Promise.all([
			API.getPeers(),
			API.getInterfaces()
		]);
	},

	render: function(data) {
		var self = this;
		var peers = (data[0] || {}).peers || [];
		var interfaces = (data[1] || {}).interfaces || [];
		var activePeers = peers.filter(function(p) { return p.status === 'active'; }).length;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('WireGuard Peers')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Manage WireGuard VPN peers - add, configure, and monitor connected devices.')),

			// Action Buttons
			E('div', { 'class': 'cbi-section', 'style': 'margin-bottom: 1em;' }, [
				E('div', { 'style': 'display: flex; gap: 1em; align-items: center;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleAddPeer, this, interfaces)
					}, '+ ' + _('Add New Peer')),
					E('span', { 'style': 'margin-left: auto; font-weight: bold;' },
						_('Active: %d / %d').format(activePeers, peers.length))
				])
			]),

			// Peers Table
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Configured Peers')),
				peers.length > 0 ?
				E('div', { 'class': 'table-wrapper' }, [
					E('table', { 'class': 'table', 'id': 'peers-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Interface')),
								E('th', {}, _('Public Key')),
								E('th', {}, _('Endpoint')),
								E('th', {}, _('Allowed IPs')),
								E('th', {}, _('Status')),
								E('th', {}, _('Last Handshake')),
								E('th', {}, _('RX / TX')),
								E('th', {}, _('Actions'))
							])
						]),
						E('tbody', {},
							peers.map(function(peer) {
								var statusColor = peer.status === 'active' ? '#28a745' :
								                  peer.status === 'idle' ? '#ffc107' : '#6c757d';
								var statusIcon = peer.status === 'active' ? '✓' :
								                 peer.status === 'idle' ? '~' : '✗';

								return E('tr', {}, [
									E('td', {}, [
										E('strong', {}, peer.interface)
									]),
									E('td', {}, [
										E('code', { 'style': 'font-size: 0.85em;' },
											peer.short_key + '...')
									]),
									E('td', {}, peer.endpoint !== '(none)' ? peer.endpoint : E('em', {}, 'roaming')),
									E('td', {}, [
										E('code', { 'style': 'font-size: 0.85em;' }, peer.allowed_ips || 'N/A')
									]),
									E('td', {}, [
										E('span', {
											'class': 'badge',
											'style': 'background: ' + statusColor + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
										}, statusIcon + ' ' + peer.status)
									]),
									E('td', {}, API.formatLastHandshake(peer.handshake_ago)),
									E('td', {}, [
										E('div', { 'style': 'font-size: 0.9em;' }, [
											E('div', {}, '↓ ' + API.formatBytes(peer.rx_bytes)),
											E('div', {}, '↑ ' + API.formatBytes(peer.tx_bytes))
										])
									]),
									E('td', {}, [
										E('button', {
											'class': 'cbi-button cbi-button-action',
											'style': 'margin: 2px;',
											'click': L.bind(self.handleShowQR, self, peer, interfaces)
										}, _('QR Code')),
										E('button', {
											'class': 'cbi-button cbi-button-apply',
											'style': 'margin: 2px;',
											'click': L.bind(self.handleDownloadConfig, self, peer, interfaces)
										}, _('Config')),
										E('button', {
											'class': 'cbi-button cbi-button-negative',
											'style': 'margin: 2px;',
											'click': L.bind(self.handleDeletePeer, self, peer)
										}, _('Delete'))
									])
								]);
							})
						)
					])
				]) :
				E('div', { 'style': 'text-align: center; padding: 3em; background: #f8f9fa; border-radius: 4px;' }, [
					E('div', { 'style': 'font-size: 3em; margin-bottom: 0.5em;' }, '👥'),
					E('h3', {}, _('No Peers Configured')),
					E('p', { 'style': 'color: #666;' },
						_('Add peers to allow devices to connect to your WireGuard VPN.')),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'margin-top: 1em;',
						'click': L.bind(this.handleAddPeer, this, interfaces)
					}, '+ ' + _('Add First Peer'))
				])
			])
		]);

		// Setup auto-refresh every 5 seconds
		poll.add(L.bind(function() {
			return API.getPeers().then(L.bind(function(newPeers) {
				// Update table dynamically
			}, this));
		}, this), 5);

		return view;
	},

	handleAddPeer: function(interfaces, ev) {
		var self = this;

		if (interfaces.length === 0) {
			ui.addNotification(null, E('p', _('No WireGuard interfaces found. Please create an interface first.')), 'error');
			return;
		}

		// Generate keys
		API.generateKeys().then(function(keys) {
			var selectedIface = interfaces[0].name;
			var generatedPrivKey = keys.private_key;
			var generatedPubKey = keys.public_key;
			var generatedPSK = keys.preshared_key;

			var formElements = [
				E('p', {}, _('Configure a new peer for your WireGuard VPN.')),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Interface')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'peer-interface', 'class': 'cbi-input-select' },
							interfaces.map(function(iface) {
								return E('option', { 'value': iface.name }, iface.name);
							})
						)
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Peer Name')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'peer-name',
							'class': 'cbi-input-text',
							'placeholder': 'my-phone',
							'value': 'peer_' + generatedPubKey.substring(0, 8)
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Public Key (generated)')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'peer-pubkey',
							'class': 'cbi-input-text',
							'value': generatedPubKey,
							'readonly': true
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Allowed IPs')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'peer-allowed-ips',
							'class': 'cbi-input-text',
							'placeholder': '10.0.0.2/32',
							'value': '10.0.0.2/32'
						}),
						E('div', { 'class': 'cbi-value-description' },
							_('IP address(es) allowed for this peer (comma-separated)'))
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Endpoint (optional)')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'peer-endpoint',
							'class': 'cbi-input-text',
							'placeholder': 'peer.example.com:51820'
						}),
						E('div', { 'class': 'cbi-value-description' },
							_('Endpoint for outbound connections (leave empty for road warrior)'))
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Persistent Keepalive')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'peer-keepalive',
							'class': 'cbi-input-text',
							'value': '25',
							'min': '0',
							'max': '300'
						}),
						E('div', { 'class': 'cbi-value-description' },
							_('Seconds between keepalive packets (0 = disabled, 25 recommended for NAT)'))
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'peer-use-psk',
							'checked': false
						}),
						' ' + _('Use Preshared Key (PSK)')
					]),
					E('div', { 'class': 'cbi-value-description' },
						_('Optional post-quantum security (recommended)'))
				]),

				E('input', { 'type': 'hidden', 'id': 'peer-privkey', 'value': generatedPrivKey }),
				E('input', { 'type': 'hidden', 'id': 'peer-psk', 'value': generatedPSK }),

				E('div', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
					E('strong', {}, _('Note:')),
					' ',
					_('After creating the peer, you can generate a QR code or download the client configuration.')
				]),

				E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
					E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, _('Cancel')),
					' ',
					E('button', {
						'class': 'btn cbi-button-action',
						'click': function() {
							var iface = document.getElementById('peer-interface').value;
							var name = document.getElementById('peer-name').value;
							var pubkey = document.getElementById('peer-pubkey').value;
							var allowed_ips = document.getElementById('peer-allowed-ips').value;
							var endpoint = document.getElementById('peer-endpoint').value || '';
							var keepalive = document.getElementById('peer-keepalive').value;
							var use_psk = document.getElementById('peer-use-psk').checked;
							var psk = use_psk ? document.getElementById('peer-psk').value : '';

							if (!name || !pubkey || !allowed_ips) {
								ui.addNotification(null, E('p', _('Please fill in all required fields')), 'error');
								return;
							}

							ui.hideModal();
							ui.showModal(_('Adding Peer'), [
								E('p', { 'class': 'spinning' }, _('Adding peer configuration...'))
							]);

							API.addPeer(iface, name, allowed_ips, pubkey, psk, endpoint, keepalive).then(function(result) {
								ui.hideModal();
								if (result.success) {
									ui.addNotification(null, E('p', result.message || _('Peer added successfully')), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', result.error || _('Failed to add peer')), 'error');
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
							});
						}
					}, _('Add Peer'))
				])
			];

			ui.showModal(_('Add New Peer'), formElements, 'cbi-modal');
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error generating keys: %s').format(err.message || err)), 'error');
		});
	},

	handleShowQR: function(peer, interfaces, ev) {
		var self = this;

		ui.showModal(_('Loading QR Code'), [
			E('p', { 'class': 'spinning' }, _('Generating QR code...'))
		]);

		// Prompt for server endpoint
		ui.hideModal();
		ui.showModal(_('Server Endpoint Required'), [
			E('p', {}, _('Enter the public IP or hostname of this WireGuard server:')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Server Endpoint')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'server-endpoint',
						'class': 'cbi-input-text',
						'placeholder': 'vpn.example.com or 203.0.113.1'
					})
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() {
						var endpoint = document.getElementById('server-endpoint').value;
						if (!endpoint) {
							ui.addNotification(null, E('p', _('Please enter server endpoint')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Generating QR Code'), [
							E('p', { 'class': 'spinning' }, _('Please wait...'))
						]);

						// Need to get private key from somewhere - this is tricky
						// In real implementation, you'd need to store it or ask user
						ui.addNotification(null, E('p', _('QR code generation requires the peer private key. Please use the config download option and scan manually.')), 'info');
						ui.hideModal();
					}
				}, _('Generate QR'))
			])
		]);
	},

	handleDownloadConfig: function(peer, interfaces, ev) {
		ui.showModal(_('Server Endpoint Required'), [
			E('p', {}, _('Enter the public IP or hostname of this WireGuard server:')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Server Endpoint')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'server-endpoint-cfg',
						'class': 'cbi-input-text',
						'placeholder': 'vpn.example.com or 203.0.113.1'
					})
				])
			]),
			E('div', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
				E('strong', {}, _('Note:')),
				' ',
				_('Configuration file requires the peer private key. This was generated when the peer was created.')
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	handleDeletePeer: function(peer, ev) {
		var self = this;

		ui.showModal(_('Delete Peer'), [
			E('p', {}, _('Are you sure you want to delete this peer?')),
			E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px; margin: 1em 0;' }, [
				E('strong', {}, _('Public Key:')),
				E('br'),
				E('code', {}, peer.public_key)
			]),
			E('p', { 'style': 'color: #dc3545;' },
				_('This action cannot be undone.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Deleting Peer'), [
							E('p', { 'class': 'spinning' }, _('Removing peer...'))
						]);

						API.removePeer(peer.interface, peer.public_key).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', result.message || _('Peer deleted successfully')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to delete peer')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
						});
					}
				}, _('Delete Peer'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
