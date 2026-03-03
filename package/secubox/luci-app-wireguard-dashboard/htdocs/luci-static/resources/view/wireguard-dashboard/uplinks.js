'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require wireguard-dashboard/api as API';
'require secubox/kiss-theme';

return view.extend({
	title: _('WireGuard Uplinks'),
	pollInterval: 10,
	pollActive: true,

	load: function() {
		return Promise.all([
			API.getUplinkStatus(),
			API.getUplinks(),
			API.getPeers()
		]);
	},

	// Handle offer uplink
	handleOfferUplink: function(ev) {
		var self = this;

		ui.showModal(_('Offer Uplink'), [
			E('p', {}, _('Offer your internet connection to mesh peers as a backup uplink.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Bandwidth (Mbps)')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'number',
						'id': 'offer-bandwidth',
						'class': 'cbi-input-text',
						'value': '100',
						'min': '1',
						'max': '10000'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Latency (ms)')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'number',
						'id': 'offer-latency',
						'class': 'cbi-input-text',
						'value': '10',
						'min': '1',
						'max': '1000'
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
						var bandwidth = document.getElementById('offer-bandwidth').value;
						var latency = document.getElementById('offer-latency').value;

						ui.hideModal();
						ui.showModal(_('Offering Uplink'), [
							E('p', { 'class': 'spinning' }, _('Advertising uplink to mesh...'))
						]);

						API.offerUplink(bandwidth, latency).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', result.message || _('Uplink offered successfully')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to offer uplink')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
						});
					}
				}, _('Offer Uplink'))
			])
		]);
	},

	// Handle withdraw uplink
	handleWithdrawUplink: function(ev) {
		ui.showModal(_('Withdrawing Uplink'), [
			E('p', { 'class': 'spinning' }, _('Withdrawing uplink offer from mesh...'))
		]);

		API.withdrawUplink().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('Uplink withdrawn')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to withdraw uplink')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	// Handle add uplink from peer offer
	handleAddUplink: function(offer, ev) {
		var self = this;

		ui.showModal(_('Add Uplink'), [
			E('p', {}, _('Use this mesh peer as a backup internet uplink.')),
			E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px; margin: 1em 0;' }, [
				E('div', {}, [
					E('strong', {}, _('Node: ')),
					E('span', {}, offer.node_id || 'Unknown')
				]),
				E('div', {}, [
					E('strong', {}, _('Bandwidth: ')),
					E('span', {}, (offer.bandwidth || '?') + ' Mbps')
				]),
				E('div', {}, [
					E('strong', {}, _('Latency: ')),
					E('span', {}, (offer.latency || '?') + ' ms')
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Priority')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'number',
						'id': 'uplink-priority',
						'class': 'cbi-input-text',
						'value': '10',
						'min': '1',
						'max': '100'
					}),
					E('div', { 'class': 'cbi-value-description' }, _('Lower = higher priority for failover'))
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
						var priority = document.getElementById('uplink-priority').value;

						ui.hideModal();
						ui.showModal(_('Adding Uplink'), [
							E('p', { 'class': 'spinning' }, _('Creating uplink interface...'))
						]);

						API.addUplink(
							offer.public_key,
							offer.endpoint,
							'',  // local_pubkey (auto-generated)
							priority,
							'1',  // weight
							offer.node_id
						).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', result.message || _('Uplink added successfully')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to add uplink')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
						});
					}
				}, _('Add Uplink'))
			])
		]);
	},

	// Handle remove uplink
	handleRemoveUplink: function(uplink, ev) {
		var self = this;

		ui.showModal(_('Remove Uplink'), [
			E('p', {}, _('Are you sure you want to remove this uplink?')),
			E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px; margin: 1em 0;' }, [
				E('strong', {}, _('Interface: ')),
				E('code', {}, uplink.interface)
			]),
			E('p', { 'style': 'color: #dc3545;' }, _('This will disconnect the backup uplink.')),
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
						ui.showModal(_('Removing Uplink'), [
							E('p', { 'class': 'spinning' }, _('Removing uplink interface...'))
						]);

						API.removeUplink(uplink.interface).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', result.message || _('Uplink removed')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to remove uplink')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
						});
					}
				}, _('Remove'))
			])
		]);
	},

	// Handle test uplink
	handleTestUplink: function(uplink, ev) {
		ui.showModal(_('Testing Uplink'), [
			E('p', { 'class': 'spinning' }, _('Testing connectivity via %s...').format(uplink.interface))
		]);

		API.testUplink(uplink.interface, '8.8.8.8').then(function(result) {
			ui.hideModal();
			if (result.reachable) {
				ui.showModal(_('Uplink Test Result'), [
					E('div', { 'style': 'text-align: center; padding: 1em;' }, [
						E('div', { 'style': 'font-size: 4em; color: #28a745;' }, '✓'),
						E('h3', { 'style': 'color: #28a745;' }, _('Uplink Working')),
						E('p', {}, _('Latency: %s ms').format(result.latency_ms || '?'))
					]),
					E('div', { 'class': 'right' }, [
						E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close'))
					])
				]);
			} else {
				ui.showModal(_('Uplink Test Result'), [
					E('div', { 'style': 'text-align: center; padding: 1em;' }, [
						E('div', { 'style': 'font-size: 4em; color: #dc3545;' }, '✗'),
						E('h3', { 'style': 'color: #dc3545;' }, _('Uplink Unreachable')),
						E('p', {}, result.error || _('Target not reachable through this uplink'))
					]),
					E('div', { 'class': 'right' }, [
						E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close'))
					])
				]);
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	// Handle set priority
	handleSetPriority: function(uplink, ev) {
		var self = this;

		ui.showModal(_('Set Priority'), [
			E('p', {}, _('Set failover priority for this uplink.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Priority')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'number',
						'id': 'set-priority',
						'class': 'cbi-input-text',
						'value': uplink.priority || '10',
						'min': '1',
						'max': '100'
					}),
					E('div', { 'class': 'cbi-value-description' }, _('Lower = higher priority'))
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Weight')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'number',
						'id': 'set-weight',
						'class': 'cbi-input-text',
						'value': uplink.weight || '1',
						'min': '1',
						'max': '100'
					}),
					E('div', { 'class': 'cbi-value-description' }, _('Load balancing weight'))
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
						var priority = document.getElementById('set-priority').value;
						var weight = document.getElementById('set-weight').value;

						ui.hideModal();
						API.setUplinkPriority(uplink.interface, priority, weight).then(function(result) {
							if (result.success) {
								ui.addNotification(null, E('p', _('Priority updated')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to update priority')), 'error');
							}
						}).catch(function(err) {
							ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
						});
					}
				}, _('Save'))
			])
		]);
	},

	// Toggle failover
	handleToggleFailover: function(enabled, ev) {
		API.setUplinkFailover(enabled ? '1' : '0').then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', enabled ? _('Auto-failover enabled') : _('Auto-failover disabled')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to update failover setting')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return Promise.all([
				API.getUplinkStatus(),
				API.getUplinks()
			]).then(L.bind(function(results) {
				var status = results[0] || {};
				var uplinksData = results[1] || [];
				var uplinks = Array.isArray(uplinksData) ? uplinksData : (uplinksData.uplinks || []);

				// Update status badges
				var enabledBadge = document.querySelector('.uplink-enabled-badge');
				if (enabledBadge) {
					var enabled = status.enabled === '1' || status.enabled === 1;
					enabledBadge.className = 'badge uplink-enabled-badge ' + (enabled ? 'badge-success' : 'badge-secondary');
					enabledBadge.textContent = enabled ? 'Enabled' : 'Disabled';
				}

				var countBadge = document.querySelector('.uplink-count');
				if (countBadge) {
					countBadge.textContent = status.uplink_count || 0;
				}

				var offerBadge = document.querySelector('.offer-count');
				if (offerBadge) {
					var offers = status.peer_offers || [];
					offerBadge.textContent = offers.length;
				}

			}, this));
		}, this), this.pollInterval);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var uplinksData = data[1] || [];
		var peersData = data[2] || [];
		var uplinks = Array.isArray(uplinksData) ? uplinksData : (uplinksData.uplinks || []);
		var peers = Array.isArray(peersData) ? peersData : (peersData.peers || []);

		var enabled = status.enabled === '1' || status.enabled === 1;
		var offering = status.offering === '1' || status.offering === 1;
		var autoFailover = status.auto_failover === '1' || status.auto_failover === 1;
		var peerOffers = status.peer_offers || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('h2', {}, _('WireGuard Mesh Uplinks')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Use WireGuard mesh peers as backup internet uplinks with automatic failover via MWAN3.')),

			// Status Cards
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em; margin-bottom: 1em;' }, [
					// Uplink Status
					E('div', { 'style': 'background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5em; border-radius: 12px;' }, [
						E('div', { 'style': 'font-size: 0.9em; opacity: 0.9;' }, _('Uplink Status')),
						E('div', { 'style': 'font-size: 2em; font-weight: bold;' }, [
							E('span', { 'class': 'badge uplink-enabled-badge ' + (enabled ? 'badge-success' : 'badge-secondary'), 'style': 'font-size: 0.5em;' },
								enabled ? 'Enabled' : 'Disabled')
						]),
						E('div', { 'style': 'font-size: 0.85em; margin-top: 0.5em;' },
							autoFailover ? '✓ Auto-failover active' : '○ Manual mode')
					]),

					// Active Uplinks
					E('div', { 'style': 'background: linear-gradient(135deg, #11998e, #38ef7d); color: white; padding: 1.5em; border-radius: 12px;' }, [
						E('div', { 'style': 'font-size: 0.9em; opacity: 0.9;' }, _('Active Uplinks')),
						E('div', { 'style': 'font-size: 2.5em; font-weight: bold;' }, [
							E('span', { 'class': 'uplink-count' }, status.uplink_count || 0)
						]),
						E('div', { 'style': 'font-size: 0.85em; margin-top: 0.5em;' },
							_('Configured backup routes'))
					]),

					// Peer Offers
					E('div', { 'style': 'background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5em; border-radius: 12px;' }, [
						E('div', { 'style': 'font-size: 0.9em; opacity: 0.9;' }, _('Mesh Offers')),
						E('div', { 'style': 'font-size: 2.5em; font-weight: bold;' }, [
							E('span', { 'class': 'offer-count' }, peerOffers.length)
						]),
						E('div', { 'style': 'font-size: 0.85em; margin-top: 0.5em;' },
							_('Available from peers'))
					]),

					// Provider Status
					E('div', { 'style': 'background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5em; border-radius: 12px;' }, [
						E('div', { 'style': 'font-size: 0.9em; opacity: 0.9;' }, _('Provider Mode')),
						E('div', { 'style': 'font-size: 2em; font-weight: bold;' }, [
							E('span', {}, offering ? '📡 Offering' : '📴 Not Offering')
						]),
						E('div', { 'style': 'font-size: 0.85em; margin-top: 0.5em;' },
							offering ? _('Sharing uplink with mesh') : _('Not sharing uplink'))
					])
				])
			]),

			// Quick Actions
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 0.5em; margin-bottom: 1em;' }, [
					offering ?
						E('button', {
							'class': 'cbi-button cbi-button-negative',
							'click': L.bind(this.handleWithdrawUplink, this)
						}, '📴 ' + _('Stop Offering')) :
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': L.bind(this.handleOfferUplink, this)
						}, '📡 ' + _('Offer My Uplink')),

					autoFailover ?
						E('button', {
							'class': 'cbi-button',
							'click': L.bind(this.handleToggleFailover, this, false)
						}, '⏹ ' + _('Disable Auto-Failover')) :
						E('button', {
							'class': 'cbi-button cbi-button-apply',
							'click': L.bind(this.handleToggleFailover, this, true)
						}, '▶ ' + _('Enable Auto-Failover'))
				])
			]),

			// Active Uplinks Table
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Configured Uplinks')),
				uplinks.length > 0 ?
					E('div', { 'class': 'table-wrapper' }, [
						E('table', { 'class': 'table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, _('Interface')),
									E('th', {}, _('Peer')),
									E('th', {}, _('Endpoint')),
									E('th', {}, _('Priority')),
									E('th', {}, _('Status')),
									E('th', {}, _('Actions'))
								])
							]),
							E('tbody', {},
								uplinks.map(function(uplink) {
									var statusColor = uplink.status === 'active' ? '#28a745' :
									                  uplink.status === 'testing' ? '#ffc107' : '#6c757d';
									var statusIcon = uplink.status === 'active' ? '✓' :
									                 uplink.status === 'testing' ? '~' : '?';

									return E('tr', {}, [
										E('td', {}, [
											E('code', {}, uplink.interface || 'wgup?')
										]),
										E('td', {}, [
											E('code', { 'style': 'font-size: 0.85em;' },
												API.shortenKey(uplink.peer_pubkey, 12))
										]),
										E('td', {}, uplink.endpoint || '-'),
										E('td', {}, [
											E('span', { 'class': 'badge', 'style': 'background: #6c757d; color: white;' },
												'P' + (uplink.priority || 10) + ' W' + (uplink.weight || 1))
										]),
										E('td', {}, [
											E('span', {
												'class': 'badge',
												'style': 'background: ' + statusColor + '; color: white;'
											}, statusIcon + ' ' + (uplink.status || 'unknown'))
										]),
										E('td', {}, [
											E('button', {
												'class': 'cbi-button cbi-button-action',
												'style': 'margin: 2px; padding: 4px 8px;',
												'click': L.bind(self.handleTestUplink, self, uplink)
											}, '🔍 ' + _('Test')),
											E('button', {
												'class': 'cbi-button',
												'style': 'margin: 2px; padding: 4px 8px;',
												'click': L.bind(self.handleSetPriority, self, uplink)
											}, '⚙ ' + _('Priority')),
											E('button', {
												'class': 'cbi-button cbi-button-negative',
												'style': 'margin: 2px; padding: 4px 8px;',
												'click': L.bind(self.handleRemoveUplink, self, uplink)
											}, '✗ ' + _('Remove'))
										])
									]);
								})
							)
						])
					]) :
					E('div', { 'style': 'text-align: center; padding: 2em; background: #f8f9fa; border-radius: 8px;' }, [
						E('div', { 'style': 'font-size: 3em; margin-bottom: 0.5em;' }, '🔗'),
						E('h4', {}, _('No Uplinks Configured')),
						E('p', { 'style': 'color: #666;' },
							_('Add uplinks from mesh peer offers below, or wait for peers to advertise their uplinks.'))
					])
			]),

			// Available Peer Offers
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Available Peer Offers')),
				peerOffers.length > 0 ?
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1em;' },
						peerOffers.map(function(offer) {
							return E('div', {
								'style': 'background: white; border: 1px solid #ddd; border-radius: 12px; padding: 1.5em; ' +
								         'box-shadow: 0 2px 4px rgba(0,0,0,0.05);'
							}, [
								E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
									E('div', { 'style': 'font-weight: bold; font-size: 1.1em;' }, [
										'🌐 ',
										offer.node_id || 'Mesh Peer'
									]),
									E('span', {
										'class': 'badge',
										'style': 'background: #28a745; color: white;'
									}, 'Available')
								]),
								E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em; margin-bottom: 1em;' }, [
									E('div', {}, [
										E('div', { 'style': 'color: #666; font-size: 0.85em;' }, _('Bandwidth')),
										E('div', { 'style': 'font-weight: bold;' }, (offer.bandwidth || '?') + ' Mbps')
									]),
									E('div', {}, [
										E('div', { 'style': 'color: #666; font-size: 0.85em;' }, _('Latency')),
										E('div', { 'style': 'font-weight: bold;' }, (offer.latency || '?') + ' ms')
									])
								]),
								E('div', { 'style': 'font-size: 0.85em; color: #666; margin-bottom: 1em;' }, [
									E('code', {}, API.shortenKey(offer.public_key, 16) || 'N/A')
								]),
								E('button', {
									'class': 'cbi-button cbi-button-action',
									'style': 'width: 100%;',
									'click': L.bind(self.handleAddUplink, self, offer)
								}, '+ ' + _('Use as Uplink'))
							]);
						})
					) :
					E('div', { 'style': 'text-align: center; padding: 2em; background: #f8f9fa; border-radius: 8px;' }, [
						E('div', { 'style': 'font-size: 3em; margin-bottom: 0.5em;' }, '📡'),
						E('h4', {}, _('No Peer Offers Available')),
						E('p', { 'style': 'color: #666;' },
							_('Mesh peers can offer their internet connection as backup uplinks. ' +
							  'Offers will appear here when peers advertise via gossip protocol.'))
					])
			]),

			// Help Section
			E('div', { 'class': 'cbi-section', 'style': 'background: #e7f3ff; padding: 1.5em; border-radius: 8px; margin-top: 1em;' }, [
				E('h4', { 'style': 'margin-top: 0;' }, '💡 ' + _('How Mesh Uplinks Work')),
				E('ul', { 'style': 'margin: 0; padding-left: 1.5em;' }, [
					E('li', {}, _('Mesh peers can share their internet connection as backup uplinks')),
					E('li', {}, _('Traffic is routed through WireGuard tunnels to the offering peer')),
					E('li', {}, _('MWAN3 handles automatic failover when primary WAN fails')),
					E('li', {}, _('Offers are advertised via the P2P gossip protocol')),
					E('li', {}, _('Use priority settings to control failover order'))
				])
			])
		]);

		// Start polling
		this.startPolling();

		return KissTheme.wrap([view], 'admin/services/wireguard/uplinks');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
