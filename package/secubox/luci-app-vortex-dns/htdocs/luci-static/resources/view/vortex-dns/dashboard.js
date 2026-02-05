'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require uci';

var callStatus = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'status',
	expect: {}
});

var callGetSlaves = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'get_slaves',
	expect: { slaves: [] }
});

var callGetPeers = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'get_peers',
	expect: { peers: [] }
});

var callMasterInit = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'master_init',
	params: ['domain'],
	expect: {}
});

var callDelegate = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'delegate',
	params: ['node', 'zone'],
	expect: {}
});

var callSlaveJoin = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'slave_join',
	params: ['master', 'token'],
	expect: {}
});

var callMeshSync = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'mesh_sync',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callGetSlaves(),
			callGetPeers()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var slaves = data[1] || [];
		var peers = data[2] || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Vortex DNS'),
			E('div', { 'class': 'cbi-map-descr' },
				'Meshed multi-dynamic subdomain delegation system'),

			// Status Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Status'),
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Mode'),
						E('div', { 'class': 'td' }, this.renderModeBadge(status.mode))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Enabled'),
						E('div', { 'class': 'td' }, status.enabled ?
							E('span', { 'class': 'badge success' }, 'Yes') :
							E('span', { 'class': 'badge warning' }, 'No'))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Sync Interval'),
						E('div', { 'class': 'td' }, (status.sync_interval || 300) + 's')
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Last Sync'),
						E('div', { 'class': 'td' }, status.last_sync || 'Never')
					])
				])
			]),

			// Master Section (if master mode)
			status.master ? this.renderMasterSection(status.master, slaves) : null,

			// Slave Section (if slave mode)
			status.slave ? this.renderSlaveSection(status.slave) : null,

			// Mesh Peers Section
			this.renderPeersSection(status.mesh, peers),

			// Actions Section
			this.renderActionsSection(status)
		]);

		return view;
	},

	renderModeBadge: function(mode) {
		var colors = {
			'master': 'primary',
			'slave': 'info',
			'submaster': 'warning',
			'standalone': 'secondary'
		};
		return E('span', {
			'class': 'badge ' + (colors[mode] || 'secondary'),
			'style': 'padding: 4px 8px; border-radius: 4px; font-weight: bold;'
		}, (mode || 'standalone').toUpperCase());
	},

	renderMasterSection: function(master, slaves) {
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Master Node'),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Wildcard Domain'),
					E('div', { 'class': 'td' }, E('strong', {}, '*.' + (master.wildcard_domain || 'not set')))
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'DNS Provider'),
					E('div', { 'class': 'td' }, master.dns_provider || 'not set')
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Delegated Slaves'),
					E('div', { 'class': 'td' }, master.slave_count || 0)
				])
			]),

			// Slaves Table
			slaves.length > 0 ? E('div', { 'style': 'margin-top: 16px;' }, [
				E('h4', {}, 'Delegated Zones'),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Zone'),
						E('th', { 'class': 'th' }, 'FQDN'),
						E('th', { 'class': 'th' }, 'Node IP'),
						E('th', { 'class': 'th' }, 'Created')
					])
				].concat(slaves.map(function(s) {
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, s.zone),
						E('td', { 'class': 'td' }, s.fqdn),
						E('td', { 'class': 'td' }, s.node),
						E('td', { 'class': 'td' }, s.created)
					]);
				})))
			]) : null
		]);
	},

	renderSlaveSection: function(slave) {
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Slave Node'),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Parent Master'),
					E('div', { 'class': 'td' }, slave.parent_master || 'not set')
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Delegated Zone'),
					E('div', { 'class': 'td' }, E('strong', {}, slave.delegated_zone || 'pending'))
				])
			])
		]);
	},

	renderPeersSection: function(mesh, peers) {
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Mesh Network'),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Gossip'),
					E('div', { 'class': 'td' }, mesh && mesh.gossip_enabled ?
						E('span', { 'class': 'badge success' }, 'Enabled') :
						E('span', { 'class': 'badge warning' }, 'Disabled'))
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'First Peek'),
					E('div', { 'class': 'td' }, mesh && mesh.first_peek ? 'Enabled' : 'Disabled')
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Connected Peers'),
					E('div', { 'class': 'td' }, (mesh && mesh.peer_count) || 0)
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, 'Published Services'),
					E('div', { 'class': 'td' }, (mesh && mesh.published_count) || 0)
				])
			]),

			// Peers Table
			peers.length > 0 ? E('div', { 'style': 'margin-top: 16px;' }, [
				E('h4', {}, 'Connected Peers'),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Name'),
						E('th', { 'class': 'th' }, 'IP'),
						E('th', { 'class': 'th' }, 'Status')
					])
				].concat(peers.map(function(p) {
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, p.name || p.id),
						E('td', { 'class': 'td' }, p.ip),
						E('td', { 'class': 'td' }, p.online ?
							E('span', { 'class': 'badge success' }, 'Online') :
							E('span', { 'class': 'badge danger' }, 'Offline'))
					]);
				})))
			]) : E('p', { 'style': 'color: #888; margin-top: 8px;' }, 'No peers connected')
		]);
	},

	renderActionsSection: function(status) {
		var self = this;

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Actions'),
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() { self.doMeshSync(); }
				}, 'Sync Mesh'),

				status.mode === 'standalone' ? E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() { self.showMasterInitDialog(); }
				}, 'Initialize as Master') : null,

				status.mode === 'standalone' ? E('button', {
					'class': 'btn cbi-button-neutral',
					'click': function() { self.showSlaveJoinDialog(); }
				}, 'Join as Slave') : null,

				status.mode === 'master' ? E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() { self.showDelegateDialog(); }
				}, 'Delegate Zone') : null
			])
		]);
	},

	doMeshSync: function() {
		ui.showModal('Syncing...', [
			E('p', { 'class': 'spinning' }, 'Syncing with mesh peers...')
		]);

		callMeshSync().then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Mesh sync completed at ' + res.synced_at), 'success');
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Sync failed: ' + e.message), 'error');
		});
	},

	showMasterInitDialog: function() {
		var self = this;
		ui.showModal('Initialize as Master', [
			E('p', {}, 'Enter the wildcard domain to manage:'),
			E('input', {
				'type': 'text',
				'id': 'master-domain',
				'placeholder': 'secubox.io',
				'style': 'width: 100%; padding: 8px; margin: 8px 0;'
			}),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						var domain = document.getElementById('master-domain').value;
						if (domain) {
							self.doMasterInit(domain);
						}
					}
				}, 'Initialize')
			])
		]);
	},

	doMasterInit: function(domain) {
		ui.showModal('Initializing...', [
			E('p', { 'class': 'spinning' }, 'Initializing master for *.' + domain + '...')
		]);

		callMasterInit(domain).then(function(res) {
			ui.hideModal();
			ui.showModal('Master Initialized', [
				E('p', {}, 'Successfully initialized as master for *.' + domain),
				E('p', {}, [
					E('strong', {}, 'Enrollment Token: '),
					E('code', {}, res.token)
				]),
				E('p', {}, 'Slaves can join with: vortexctl slave join <this_ip> ' + res.token),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'btn cbi-button-positive',
						'click': function() { location.reload(); }
					}, 'OK')
				])
			]);
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed: ' + e.message), 'error');
		});
	},

	showSlaveJoinDialog: function() {
		var self = this;
		ui.showModal('Join as Slave', [
			E('p', {}, 'Enter master connection details:'),
			E('label', {}, 'Master IP:'),
			E('input', {
				'type': 'text',
				'id': 'master-ip',
				'placeholder': '192.168.1.1',
				'style': 'width: 100%; padding: 8px; margin: 8px 0;'
			}),
			E('label', {}, 'Enrollment Token:'),
			E('input', {
				'type': 'text',
				'id': 'master-token',
				'placeholder': 'token from master',
				'style': 'width: 100%; padding: 8px; margin: 8px 0;'
			}),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						var ip = document.getElementById('master-ip').value;
						var token = document.getElementById('master-token').value;
						if (ip && token) {
							self.doSlaveJoin(ip, token);
						}
					}
				}, 'Join')
			])
		]);
	},

	doSlaveJoin: function(master, token) {
		ui.showModal('Joining...', [
			E('p', { 'class': 'spinning' }, 'Joining master at ' + master + '...')
		]);

		callSlaveJoin(master, token).then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Successfully joined master'), 'success');
			location.reload();
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed: ' + e.message), 'error');
		});
	},

	showDelegateDialog: function() {
		var self = this;
		ui.showModal('Delegate Zone', [
			E('p', {}, 'Delegate a subzone to a slave node:'),
			E('label', {}, 'Slave Node IP:'),
			E('input', {
				'type': 'text',
				'id': 'delegate-node',
				'placeholder': '192.168.1.100',
				'style': 'width: 100%; padding: 8px; margin: 8px 0;'
			}),
			E('label', {}, 'Zone Name:'),
			E('input', {
				'type': 'text',
				'id': 'delegate-zone',
				'placeholder': 'node1',
				'style': 'width: 100%; padding: 8px; margin: 8px 0;'
			}),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						var node = document.getElementById('delegate-node').value;
						var zone = document.getElementById('delegate-zone').value;
						if (node && zone) {
							self.doDelegate(node, zone);
						}
					}
				}, 'Delegate')
			])
		]);
	},

	doDelegate: function(node, zone) {
		ui.showModal('Delegating...', [
			E('p', { 'class': 'spinning' }, 'Delegating ' + zone + ' to ' + node + '...')
		]);

		callDelegate(node, zone).then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Zone ' + zone + ' delegated to ' + node), 'success');
			location.reload();
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed: ' + e.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
