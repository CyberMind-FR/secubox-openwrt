'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require form';

var callMeshnameStatus = rpc.declare({
	object: 'luci.meshname',
	method: 'status',
	expect: { }
});

var callMeshnameList = rpc.declare({
	object: 'luci.meshname',
	method: 'list',
	expect: { }
});

var callMeshnameAnnounce = rpc.declare({
	object: 'luci.meshname',
	method: 'announce',
	params: ['name', 'port'],
	expect: { }
});

var callMeshnameRevoke = rpc.declare({
	object: 'luci.meshname',
	method: 'revoke',
	params: ['name'],
	expect: { }
});

var callMeshnameResolve = rpc.declare({
	object: 'luci.meshname',
	method: 'resolve',
	params: ['domain'],
	expect: { }
});

var callMeshnameSync = rpc.declare({
	object: 'luci.meshname',
	method: 'sync',
	expect: { }
});

var callMeshnameGetConfig = rpc.declare({
	object: 'luci.meshname',
	method: 'get_config',
	expect: { }
});

var callMeshnameSetConfig = rpc.declare({
	object: 'luci.meshname',
	method: 'set_config',
	params: ['enabled', 'auto_announce', 'sync_interval', 'gossip_enabled'],
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			callMeshnameStatus(),
			callMeshnameList(),
			callMeshnameGetConfig()
		]);
	},

	formatIPv6: function(ipv6) {
		if (!ipv6) return '-';
		// Truncate long IPv6 for display
		if (ipv6.length > 25) {
			return ipv6.substring(0, 20) + '...';
		}
		return ipv6;
	},

	renderStatus: function(status) {
		var isRunning = status.running === '1';
		var isEnabled = status.enabled === '1';

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Meshname DNS Status'),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Service Status'),
					E('div', { 'class': 'td' }, [
						E('span', {
							'class': isRunning ? 'badge success' : 'badge warning',
							'style': 'padding: 4px 8px; border-radius: 4px; font-size: 12px; ' +
								(isRunning ? 'background: #28a745; color: white;' : 'background: #ffc107; color: black;')
						}, isRunning ? 'Running' : 'Stopped')
					])
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Yggdrasil IPv6'),
					E('div', { 'class': 'td' }, [
						E('code', {}, status.ygg_ipv6 || 'Not available')
					])
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Local Services'),
					E('div', { 'class': 'td' }, String(status.local_count || 0))
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Known Domains'),
					E('div', { 'class': 'td' }, String(status.domain_count || 0))
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Last Sync'),
					E('div', { 'class': 'td' }, status.last_sync || 'Never')
				])
			])
		]);
	},

	renderLocalServices: function(domains) {
		var self = this;
		var localServices = (domains.local || []);

		var rows = localServices.map(function(svc) {
			return E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td' }, [
					E('strong', {}, svc.fqdn)
				]),
				E('div', { 'class': 'td' }, [
					E('code', {}, self.formatIPv6(svc.ipv6))
				]),
				E('div', { 'class': 'td' }, svc.port > 0 ? String(svc.port) : '-'),
				E('div', { 'class': 'td' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'click': function() {
							self.handleRevoke(svc.name);
						}
					}, 'Revoke')
				])
			]);
		});

		if (rows.length === 0) {
			rows.push(E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td', 'colspan': '4', 'style': 'text-align: center; color: #666;' },
					'No local services announced')
			]));
		}

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Local Services'),
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr cbi-section-table-titles' }, [
						E('div', { 'class': 'th' }, 'Domain'),
						E('div', { 'class': 'th' }, 'IPv6'),
						E('div', { 'class': 'th' }, 'Port'),
						E('div', { 'class': 'th' }, 'Actions')
					])
				].concat(rows))
			]),
			E('div', { 'style': 'margin-top: 10px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.showAnnounceModal(); }
				}, 'Announce Service')
			])
		]);
	},

	renderRemoteDomains: function(domains) {
		var self = this;
		var remoteDomains = (domains.remote || []);

		var rows = remoteDomains.map(function(dom) {
			var originShort = dom.origin ? dom.origin.substring(0, 16) + '...' : 'unknown';
			return E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td' }, [
					E('strong', {}, dom.fqdn)
				]),
				E('div', { 'class': 'td' }, [
					E('code', {}, self.formatIPv6(dom.ipv6))
				]),
				E('div', { 'class': 'td' }, dom.port > 0 ? String(dom.port) : '-'),
				E('div', { 'class': 'td', 'title': dom.origin || '' }, originShort)
			]);
		});

		if (rows.length === 0) {
			rows.push(E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td', 'colspan': '4', 'style': 'text-align: center; color: #666;' },
					'No remote domains discovered yet')
			]));
		}

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Known Domains (from Mesh)'),
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr cbi-section-table-titles' }, [
						E('div', { 'class': 'th' }, 'Domain'),
						E('div', { 'class': 'th' }, 'IPv6'),
						E('div', { 'class': 'th' }, 'Port'),
						E('div', { 'class': 'th' }, 'Origin')
					])
				].concat(rows))
			]),
			E('div', { 'style': 'margin-top: 10px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleSync(); }
				}, 'Force Sync')
			])
		]);
	},

	renderResolveTest: function() {
		var self = this;
		var inputId = 'meshname-resolve-input';
		var resultId = 'meshname-resolve-result';

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Resolve Test'),
			E('div', { 'style': 'display: flex; gap: 10px; align-items: center;' }, [
				E('input', {
					'type': 'text',
					'id': inputId,
					'placeholder': 'Enter domain (e.g., myservice.ygg)',
					'style': 'flex: 1; padding: 8px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() {
						var domain = document.getElementById(inputId).value;
						if (domain) {
							self.handleResolve(domain, resultId);
						}
					}
				}, 'Resolve')
			]),
			E('div', { 'id': resultId, 'style': 'margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px; display: none;' })
		]);
	},

	showAnnounceModal: function() {
		var self = this;

		ui.showModal('Announce Service', [
			E('p', {}, 'Announce a local service with a .ygg domain:'),
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Service Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'meshname-announce-name',
							'placeholder': 'myservice',
							'style': 'width: 100%;'
						}),
						E('div', { 'class': 'cbi-value-description' }, 'Will be accessible as <name>.ygg')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Port (optional)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'meshname-announce-port',
							'placeholder': '8080',
							'style': 'width: 100%;'
						})
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var name = document.getElementById('meshname-announce-name').value;
						var port = document.getElementById('meshname-announce-port').value || '0';
						if (name) {
							self.handleAnnounce(name, parseInt(port));
						}
					}
				}, 'Announce')
			])
		]);
	},

	handleAnnounce: function(name, port) {
		var self = this;
		ui.hideModal();
		ui.showModal('Announcing...', [
			E('p', { 'class': 'spinning' }, 'Announcing ' + name + '.ygg...')
		]);

		callMeshnameAnnounce(name, port).then(function(result) {
			ui.hideModal();
			if (result.status === 'ok') {
				ui.addNotification(null, E('p', {}, 'Successfully announced ' + result.fqdn), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Error: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	handleRevoke: function(name) {
		var self = this;

		ui.showModal('Confirm Revoke', [
			E('p', {}, 'Are you sure you want to revoke ' + name + '.ygg?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						callMeshnameRevoke(name).then(function(result) {
							if (result.status === 'ok') {
								ui.addNotification(null, E('p', {}, 'Revoked ' + name + '.ygg'), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', {}, 'Error: ' + (result.error || 'Unknown error')), 'error');
							}
						});
					}
				}, 'Revoke')
			])
		]);
	},

	handleResolve: function(domain, resultId) {
		var resultDiv = document.getElementById(resultId);
		resultDiv.style.display = 'block';
		resultDiv.innerHTML = '<span class="spinning">Resolving...</span>';

		callMeshnameResolve(domain).then(function(result) {
			if (result.status === 'ok') {
				resultDiv.innerHTML = '<strong>' + result.domain + '</strong> resolves to: <code>' + result.ipv6 + '</code>';
				resultDiv.style.background = '#d4edda';
			} else {
				resultDiv.innerHTML = 'Cannot resolve: ' + (result.error || 'Unknown error');
				resultDiv.style.background = '#f8d7da';
			}
		}).catch(function(err) {
			resultDiv.innerHTML = 'Error: ' + err.message;
			resultDiv.style.background = '#f8d7da';
		});
	},

	handleSync: function() {
		ui.showModal('Syncing...', [
			E('p', { 'class': 'spinning' }, 'Synchronizing with mesh peers...')
		]);

		callMeshnameSync().then(function(result) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Sync initiated'), 'info');
			setTimeout(function() { window.location.reload(); }, 2000);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	render: function(data) {
		var status = data[0] || {};
		var domains = data[1] || { local: [], remote: [] };
		var config = data[2] || {};

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Meshname DNS'),
			E('div', { 'class': 'cbi-map-descr' },
				'Decentralized DNS for .ygg domains over Yggdrasil mesh network. ' +
				'Services announce themselves via gossip protocol.'),
			this.renderStatus(status),
			this.renderLocalServices(domains),
			this.renderRemoteDomains(domains),
			this.renderResolveTest()
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
