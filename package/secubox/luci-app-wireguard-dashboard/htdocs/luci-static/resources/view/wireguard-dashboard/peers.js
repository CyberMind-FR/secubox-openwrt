'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require dom';
'require ui';
'require wireguard-dashboard/api as API';
'require wireguard-dashboard/qrcode as qrcode';

return view.extend({
	title: _('WireGuard Peers'),

	// Store private key in session storage for QR generation
	storePrivateKey: function(publicKey, privateKey) {
		try {
			var stored = sessionStorage.getItem('wg_peer_keys');
			var keys = stored ? JSON.parse(stored) : {};
			keys[publicKey] = privateKey;
			sessionStorage.setItem('wg_peer_keys', JSON.stringify(keys));
		} catch (e) {
			console.error('Failed to store private key:', e);
		}
	},

	// Retrieve stored private key
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

	load: function() {
		return Promise.all([
			API.getPeers(),
			API.getInterfaces()
		]);
	},

	render: function(data) {
		var self = this;
		// Handle RPC expect unwrapping - results may be array or object with .peers/.interfaces
		var peersData = data[0] || [];
		var interfacesData = data[1] || [];
		var peers = Array.isArray(peersData) ? peersData : (peersData.peers || []);
		var interfaces = Array.isArray(interfacesData) ? interfacesData : (interfacesData.interfaces || []);
		var activePeers = peers.filter(function(p) { return p.status === 'active'; }).length;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
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
					E('span', { 'class': 'peers-active-count', 'style': 'margin-left: auto; font-weight: bold;' },
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
			return API.getPeers().then(L.bind(function(data) {
				var newPeers = (data || {}).peers || [];
				var table = document.getElementById('peers-table');
				if (!table) return;

				var tbody = table.querySelector('tbody');
				if (!tbody) return;

				// Update existing rows
				newPeers.forEach(function(peer, idx) {
					var row = tbody.children[idx];
					if (!row) return;

					var cells = row.querySelectorAll('td');
					if (cells.length < 7) return;

					// Update status (cell 4)
					var statusColor = peer.status === 'active' ? '#28a745' :
					                  peer.status === 'idle' ? '#ffc107' : '#6c757d';
					var statusIcon = peer.status === 'active' ? '✓' :
					                 peer.status === 'idle' ? '~' : '✗';
					var statusSpan = cells[4].querySelector('.badge');
					if (statusSpan) {
						statusSpan.style.background = statusColor;
						statusSpan.textContent = statusIcon + ' ' + peer.status;
					}

					// Update last handshake (cell 5)
					cells[5].textContent = API.formatLastHandshake(peer.handshake_ago);

					// Update RX/TX (cell 6)
					var trafficDiv = cells[6].querySelector('div');
					if (trafficDiv) {
						trafficDiv.innerHTML = '<div>↓ ' + API.formatBytes(peer.rx_bytes) + '</div>' +
						                       '<div>↑ ' + API.formatBytes(peer.tx_bytes) + '</div>';
					}
				});

				// Update active count
				var activePeers = newPeers.filter(function(p) { return p.status === 'active'; }).length;
				var countSpan = document.querySelector('.peers-active-count');
				if (countSpan) {
					countSpan.textContent = _('Active: %d / %d').format(activePeers, newPeers.length);
				}
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

							var privkey = document.getElementById('peer-privkey').value;

							API.addPeer(iface, name, allowed_ips, pubkey, psk, endpoint, keepalive, privkey).then(function(result) {
								ui.hideModal();
								if (result.success) {
									// Store private key for QR generation
									self.storePrivateKey(pubkey, privkey);
									ui.addNotification(null, E('p', result.message || _('Peer added successfully')), 'info');

									// Offer to generate QR code immediately
									ui.showModal(_('Peer Created Successfully'), [
										E('p', {}, _('The peer has been added. Would you like to generate a QR code for mobile setup?')),
										E('div', { 'style': 'background: #d4edda; padding: 1em; border-radius: 4px; margin: 1em 0;' }, [
											E('strong', {}, _('Private Key Stored')),
											E('p', { 'style': 'margin: 0.5em 0 0 0; font-size: 0.9em;' },
												_('The private key has been temporarily stored in your browser session for QR generation.'))
										]),
										E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
											E('button', {
												'class': 'btn',
												'click': function() {
													ui.hideModal();
													window.location.reload();
												}
											}, _('Skip')),
											' ',
											E('button', {
												'class': 'btn cbi-button-action',
												'click': function() {
													ui.hideModal();
													// Find the interface for QR generation
													var ifaceObj = interfaces.find(function(i) { return i.name === iface; });
													self.promptForEndpointAndShowQR({
														public_key: pubkey,
														short_key: pubkey.substring(0, 8),
														allowed_ips: allowed_ips,
														interface: iface
													}, ifaceObj, privkey);
												}
											}, _('Generate QR Code'))
										])
									]);
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

	promptForEndpointAndShowQR: function(peer, ifaceObj, privateKey) {
		var self = this;
		var savedEndpoint = sessionStorage.getItem('wg_server_endpoint') || '';

		ui.showModal(_('Server Endpoint'), [
			E('p', {}, _('Enter the public IP or hostname of this WireGuard server:')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Server Endpoint')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'qr-server-endpoint',
						'class': 'cbi-input-text',
						'placeholder': 'vpn.example.com or 203.0.113.1',
						'value': savedEndpoint
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
						var endpoint = document.getElementById('qr-server-endpoint').value.trim();
						if (!endpoint) {
							ui.addNotification(null, E('p', _('Please enter server endpoint')), 'error');
							return;
						}
						sessionStorage.setItem('wg_server_endpoint', endpoint);
						ui.hideModal();
						self.generateAndShowQR(peer, ifaceObj, privateKey, endpoint);
					}
				}, _('Generate QR'))
			])
		]);
	},

	generateAndShowQR: function(peer, ifaceObj, privateKey, serverEndpoint) {
		var self = this;

		var buildLocalConfig = function(privKey) {
			return '[Interface]\n' +
				'PrivateKey = ' + privKey + '\n' +
				'Address = ' + (peer.allowed_ips || '10.0.0.2/32') + '\n' +
				'DNS = 1.1.1.1, 1.0.0.1\n\n' +
				'[Peer]\n' +
				'PublicKey = ' + (ifaceObj.public_key || '') + '\n' +
				'Endpoint = ' + serverEndpoint + ':' + (ifaceObj.listen_port || 51820) + '\n' +
				'AllowedIPs = 0.0.0.0/0, ::/0\n' +
				'PersistentKeepalive = 25';
		};

		// Try backend QR generation (it will look up stored key if privateKey is empty)
		API.generateQR(peer.interface, peer.public_key, privateKey || '', serverEndpoint).then(function(result) {
			if (result && result.qrcode && !result.error) {
				var config = result.config || buildLocalConfig(privateKey);
				self.displayQRModal(peer, result.qrcode, config, false);
			} else if (privateKey) {
				// Backend failed but we have a key - fall back to JavaScript QR generation
				var config = buildLocalConfig(privateKey);
				var svg = qrcode.generateSVG(config, 250);
				if (svg) {
					self.displayQRModal(peer, svg, config, true);
				} else {
					ui.addNotification(null, E('p', _('Failed to generate QR code')), 'error');
				}
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to generate QR code')), 'error');
			}
		}).catch(function(err) {
			if (privateKey) {
				// Fall back to JavaScript QR generation
				var config = buildLocalConfig(privateKey);
				var svg = qrcode.generateSVG(config, 250);
				if (svg) {
					self.displayQRModal(peer, svg, config, true);
				} else {
					ui.addNotification(null, E('p', _('Failed to generate QR code')), 'error');
				}
			} else {
				ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			}
		});
	},

	displayQRModal: function(peer, qrData, config, isSVG) {
		var qrElement;

		if (isSVG) {
			qrElement = E('div', { 'style': 'display: inline-block;' });
			qrElement.innerHTML = qrData;
		} else {
			qrElement = E('img', {
				'src': qrData,
				'alt': 'WireGuard QR Code',
				'style': 'max-width: 250px; max-height: 250px;'
			});
		}

		ui.showModal(_('WireGuard QR Code'), [
			E('div', { 'style': 'text-align: center;' }, [
				E('h4', {}, peer.interface + ' - ' + (peer.short_key || peer.public_key.substring(0, 8))),
				E('div', { 'style': 'background: white; padding: 20px; border-radius: 12px; display: inline-block; margin: 20px 0;' }, [
					qrElement
				]),
				E('p', { 'style': 'color: #666;' }, _('Scan with WireGuard app on your mobile device')),
				E('div', { 'style': 'display: flex; gap: 10px; justify-content: center; margin: 1em 0;' }, [
					E('button', {
						'class': 'btn',
						'click': function() {
							navigator.clipboard.writeText(config).then(function() {
								ui.addNotification(null, E('p', _('Configuration copied to clipboard')), 'info');
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
							a.download = peer.interface + '-peer.conf';
							a.click();
							URL.revokeObjectURL(url);
						}
					}, _('Download .conf'))
				]),
				E('details', { 'style': 'text-align: left; margin-top: 1em;' }, [
					E('summary', { 'style': 'cursor: pointer; color: #06b6d4;' }, _('Show configuration')),
					E('pre', { 'style': 'background: #f8f9fa; padding: 12px; border-radius: 8px; font-size: 11px; margin-top: 10px;' }, config)
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

	showPrivateKeyPrompt: function(peer, ifaceObj, callback) {
		var self = this;
		ui.showModal(_('Private Key Required'), [
			E('p', {}, _('To generate a QR code, the peer\'s private key is needed.')),
			E('p', { 'style': 'color: #666; font-size: 0.9em;' },
				_('The private key was not found on the server. This can happen for peers created before key persistence was enabled.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Private Key')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'manual-private-key',
						'class': 'cbi-input-text',
						'placeholder': 'Base64 private key (44 characters)',
						'style': 'font-family: monospace;'
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
						var key = document.getElementById('manual-private-key').value.trim();
						if (!key || key.length !== 44) {
							ui.addNotification(null, E('p', _('Please enter a valid private key (44 characters)')), 'error');
							return;
						}
						self.storePrivateKey(peer.public_key, key);
						ui.hideModal();
						callback(key);
					}
				}, _('Continue'))
			])
		]);
	},

	handleShowQR: function(peer, interfaces, ev) {
		var self = this;
		var privateKey = this.getStoredPrivateKey(peer.public_key);
		var ifaceObj = interfaces.find(function(i) { return i.name === peer.interface; }) || {};

		if (privateKey) {
			this.promptForEndpointAndShowQR(peer, ifaceObj, privateKey);
			return;
		}

		// Try backend with empty private key - it will look up the stored key
		var savedEndpoint = sessionStorage.getItem('wg_server_endpoint') || '';
		if (savedEndpoint) {
			API.generateQR(peer.interface, peer.public_key, '', savedEndpoint).then(function(result) {
				if (result && result.qrcode && !result.error) {
					self.displayQRModal(peer, result.qrcode, result.config, false);
				} else {
					self.showPrivateKeyPrompt(peer, ifaceObj, function(key) {
						self.promptForEndpointAndShowQR(peer, ifaceObj, key);
					});
				}
			}).catch(function() {
				self.showPrivateKeyPrompt(peer, ifaceObj, function(key) {
					self.promptForEndpointAndShowQR(peer, ifaceObj, key);
				});
			});
		} else {
			// No saved endpoint yet - need to prompt for endpoint first
			// Try a test call to see if backend has the key
			API.generateConfig(peer.interface, peer.public_key, '', 'test').then(function(result) {
				if (result && result.config && !result.error) {
					// Backend has the key, proceed with endpoint prompt
					self.promptForEndpointAndShowQR(peer, ifaceObj, '');
				} else {
					self.showPrivateKeyPrompt(peer, ifaceObj, function(key) {
						self.promptForEndpointAndShowQR(peer, ifaceObj, key);
					});
				}
			}).catch(function() {
				self.showPrivateKeyPrompt(peer, ifaceObj, function(key) {
					self.promptForEndpointAndShowQR(peer, ifaceObj, key);
				});
			});
		}
	},

	handleDownloadConfig: function(peer, interfaces, ev) {
		var self = this;
		var privateKey = this.getStoredPrivateKey(peer.public_key);
		var ifaceObj = interfaces.find(function(i) { return i.name === peer.interface; }) || {};

		var downloadConfig = function(config) {
			var blob = new Blob([config], { type: 'text/plain' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = peer.interface + '-' + (peer.short_key || 'peer') + '.conf';
			a.click();
			URL.revokeObjectURL(url);
			ui.addNotification(null, E('p', _('Configuration file downloaded')), 'info');
		};

		var showConfigModal = function(privKey) {
			var savedEndpoint = sessionStorage.getItem('wg_server_endpoint') || '';

			ui.showModal(_('Download Configuration'), [
				E('p', {}, _('Enter the server endpoint to generate the client configuration:')),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Server Endpoint')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'cfg-server-endpoint',
							'class': 'cbi-input-text',
							'placeholder': 'vpn.example.com or 203.0.113.1',
							'value': savedEndpoint
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
							var endpoint = document.getElementById('cfg-server-endpoint').value.trim();
							if (!endpoint) {
								ui.addNotification(null, E('p', _('Please enter server endpoint')), 'error');
								return;
							}
							sessionStorage.setItem('wg_server_endpoint', endpoint);
							ui.hideModal();

							if (privKey) {
								var config = '[Interface]\n' +
									'PrivateKey = ' + privKey + '\n' +
									'Address = ' + (peer.allowed_ips || '10.0.0.2/32') + '\n' +
									'DNS = 1.1.1.1, 1.0.0.1\n\n' +
									'[Peer]\n' +
									'PublicKey = ' + (ifaceObj.public_key || '') + '\n' +
									'Endpoint = ' + endpoint + ':' + (ifaceObj.listen_port || 51820) + '\n' +
									'AllowedIPs = 0.0.0.0/0, ::/0\n' +
									'PersistentKeepalive = 25';
								downloadConfig(config);
							} else {
								// Use backend to generate config (it has the stored key)
								API.generateConfig(peer.interface, peer.public_key, '', endpoint).then(function(result) {
									if (result && result.config && !result.error) {
										downloadConfig(result.config);
									} else {
										ui.addNotification(null, E('p', result.error || _('Failed to generate config')), 'error');
									}
								}).catch(function(err) {
									ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
								});
							}
						}
					}, _('Download'))
				])
			]);
		};

		if (!privateKey) {
			// Try backend first - it may have the stored key
			API.generateConfig(peer.interface, peer.public_key, '', 'test').then(function(result) {
				if (result && result.config && !result.error) {
					// Backend has the key, show config modal with backend-generated config
					showConfigModal('');
				} else {
					// Fallback to manual prompt
					self.showPrivateKeyPrompt(peer, ifaceObj, function(key) {
						showConfigModal(key);
					});
				}
			}).catch(function() {
				self.showPrivateKeyPrompt(peer, ifaceObj, function(key) {
					showConfigModal(key);
				});
			});
			return;
		}

		showConfigModal(privateKey);
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
