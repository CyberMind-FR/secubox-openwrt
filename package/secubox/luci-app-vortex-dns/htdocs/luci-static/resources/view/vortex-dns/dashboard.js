'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require uci';
'require secubox/kiss-theme';

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

var callGetPublished = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'get_published',
	expect: { services: [] }
});

// Zone Management RPC calls
var callZoneList = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'zone_list',
	expect: { zones: [] }
});

var callZoneDump = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'zone_dump',
	params: ['domain'],
	expect: {}
});

var callZoneImport = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'zone_import',
	params: ['domain'],
	expect: {}
});

var callZoneExport = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'zone_export',
	params: ['domain'],
	expect: {}
});

var callZoneReload = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'zone_reload',
	params: ['domain'],
	expect: {}
});

// Secondary DNS RPC calls
var callSecondaryList = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'secondary_list',
	expect: { secondaries: [] }
});

var callSecondaryAdd = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'secondary_add',
	params: ['provider', 'domain'],
	expect: {}
});

var callSecondaryRemove = rpc.declare({
	object: 'luci.vortex-dns',
	method: 'secondary_remove',
	params: ['provider', 'domain'],
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callGetSlaves(),
			callGetPeers(),
			callGetPublished(),
			callZoneList(),
			callSecondaryList()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var slaves = data[1] || [];
		var peers = data[2] || [];
		var published = data[3] || [];
		var zones = data[4] || [];
		var secondaries = data[5] || [];

		var view = E('div', { 'style': 'max-width: 1200px;' }, [
			E('h2', {}, 'Vortex DNS'),
			E('div', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' },
				'Meshed multi-dynamic subdomain delegation system'),

			// Status Card
			E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
				E('h3', {}, 'Status'),
				E('div', { 'class': 'kiss-table' }, [
					E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('div', { 'style': 'padding: 10px 12px;' }, 'Mode'),
						E('div', { 'style': 'padding: 10px 12px;' }, this.renderModeBadge(status.mode))
					]),
					E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('div', { 'style': 'padding: 10px 12px;' }, 'Enabled'),
						E('div', { 'style': 'padding: 10px 12px;' }, status.enabled ?
							E('span', { 'class': 'badge success' }, 'Yes') :
							E('span', { 'class': 'badge warning' }, 'No'))
					]),
					E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('div', { 'style': 'padding: 10px 12px;' }, 'Sync Interval'),
						E('div', { 'style': 'padding: 10px 12px;' }, (status.sync_interval || 300) + 's')
					]),
					E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('div', { 'style': 'padding: 10px 12px;' }, 'Last Sync'),
						E('div', { 'style': 'padding: 10px 12px;' }, status.last_sync || 'Never')
					])
				])
			]),

			// Zones Section (NEW)
			this.renderZonesSection(zones),

			// Secondary DNS Section (NEW)
			this.renderSecondarySection(secondaries),

			// Master Section (if master mode)
			status.master ? this.renderMasterSection(status.master, slaves) : null,

			// Slave Section (if slave mode)
			status.slave ? this.renderSlaveSection(status.slave) : null,

			// Mesh Peers Section
			this.renderPeersSection(status.mesh, peers),

			// Published Services Section
			this.renderServicesSection(published, status.master),

			// Actions Section
			this.renderActionsSection(status)
		]);

		return KissTheme.wrap([view], 'admin/services/vortex-dns');
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

	// NEW: Zones Section
	renderZonesSection: function(zones) {
		var self = this;

		return E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('h3', {}, 'Authoritative Zones'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 6px 12px;',
					'click': function() { self.showImportZoneDialog(); }
				}, '+ Import Zone')
			]),
			E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px; margin-bottom: 12px;' },
				'DNS zones managed by this server as authoritative master'),

			zones.length > 0 ? E('table', { 'class': 'kiss-table', 'style': 'margin-top: 12px;' }, [
				E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Domain'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Records'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Status'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Actions')
				])
			].concat(zones.map(function(z) {
				var statusBadge;
				if (z.enabled && z.authoritative) {
					statusBadge = E('span', { 'class': 'badge success' }, 'Active');
				} else if (z.enabled) {
					statusBadge = E('span', { 'class': 'badge info' }, 'Enabled');
				} else {
					statusBadge = E('span', { 'class': 'badge warning' }, 'Disabled');
				}

				return E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('td', { 'style': 'padding: 10px 12px;' }, E('strong', {}, z.domain)),
					E('td', { 'style': 'padding: 10px 12px;' }, z.records || 0),
					E('td', { 'style': 'padding: 10px 12px;' }, statusBadge),
					E('td', { 'style': 'padding: 10px 12px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding: 2px 8px; margin-right: 4px;',
							'click': function() { self.showZoneContentDialog(z.domain); },
							'title': 'View zone file'
						}, 'View'),
						E('button', {
							'class': 'kiss-btn',
							'style': 'padding: 2px 8px; margin-right: 4px;',
							'click': function() { self.doZoneDump(z.domain); },
							'title': 'Re-dump zone from DNS'
						}, 'Dump'),
						E('button', {
							'class': 'kiss-btn kiss-btn-cyan',
							'style': 'padding: 2px 8px;',
							'click': function() { self.doZoneReload(z.domain); },
							'title': 'Reload zone in dnsmasq'
						}, 'Reload')
					])
				]);
			}))) : E('p', { 'style': 'color: #888; margin-top: 8px;' },
				'No zones configured. Click "Import Zone" to add a domain.')
		]);
	},

	// NEW: Secondary DNS Section
	renderSecondarySection: function(secondaries) {
		var self = this;

		return E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('h3', {}, 'Secondary DNS Providers'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 6px 12px;',
					'click': function() { self.showAddSecondaryDialog(); }
				}, '+ Add Secondary')
			]),
			E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px; margin-bottom: 12px;' },
				'External DNS providers configured as secondary servers (zone transfer via AXFR)'),

			secondaries.length > 0 ? E('table', { 'class': 'kiss-table', 'style': 'margin-top: 12px;' }, [
				E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Provider'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Status'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Actions')
				])
			].concat(secondaries.map(function(s) {
				return E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('td', { 'style': 'padding: 10px 12px;' }, E('strong', {}, s.provider.toUpperCase())),
					E('td', { 'style': 'padding: 10px 12px;' }, s.enabled ?
						E('span', { 'class': 'badge success' }, 'Configured') :
						E('span', { 'class': 'badge warning' }, 'Disabled')),
					E('td', { 'style': 'padding: 10px 12px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 2px 8px;',
							'click': function() { self.doSecondaryRemove(s.provider); }
						}, 'Remove')
					])
				]);
			}))) : E('div', { 'style': 'margin-top: 12px; padding: 16px; background: #1a1a2e; border-radius: 8px;' }, [
				E('p', { 'style': 'color: #888; margin: 0;' },
					'No secondary DNS providers configured.'),
				E('p', { 'style': 'color: #666; font-size: 0.9em; margin-top: 8px;' },
					'Secondary providers (OVH, Gandi) can mirror your zones via AXFR for redundancy.')
			])
		]);
	},

	renderMasterSection: function(master, slaves) {
		return E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
			E('h3', {}, 'Master Node'),
			E('div', { 'class': 'kiss-table' }, [
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'Wildcard Domain'),
					E('div', { 'style': 'padding: 10px 12px;' }, E('strong', {}, '*.' + (master.wildcard_domain || 'not set')))
				]),
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'DNS Provider'),
					E('div', { 'style': 'padding: 10px 12px;' }, master.dns_provider || 'not set')
				]),
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'Delegated Slaves'),
					E('div', { 'style': 'padding: 10px 12px;' }, master.slave_count || 0)
				])
			]),

			// Slaves Table
			slaves.length > 0 ? E('div', { 'style': 'margin-top: 16px;' }, [
				E('h4', {}, 'Delegated Zones'),
				E('table', { 'class': 'kiss-table' }, [
					E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Zone'),
						E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'FQDN'),
						E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Node IP'),
						E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Created')
					])
				].concat(slaves.map(function(s) {
					return E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('td', { 'style': 'padding: 10px 12px;' }, s.zone),
						E('td', { 'style': 'padding: 10px 12px;' }, s.fqdn),
						E('td', { 'style': 'padding: 10px 12px;' }, s.node),
						E('td', { 'style': 'padding: 10px 12px;' }, s.created)
					]);
				})))
			]) : null
		]);
	},

	renderSlaveSection: function(slave) {
		return E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
			E('h3', {}, 'Slave Node'),
			E('div', { 'class': 'kiss-table' }, [
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'Parent Master'),
					E('div', { 'style': 'padding: 10px 12px;' }, slave.parent_master || 'not set')
				]),
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'Delegated Zone'),
					E('div', { 'style': 'padding: 10px 12px;' }, E('strong', {}, slave.delegated_zone || 'pending'))
				])
			])
		]);
	},

	renderPeersSection: function(mesh, peers) {
		return E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
			E('h3', {}, 'Mesh Network'),
			E('div', { 'class': 'kiss-table' }, [
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'Gossip'),
					E('div', { 'style': 'padding: 10px 12px;' }, mesh && mesh.gossip_enabled ?
						E('span', { 'class': 'badge success' }, 'Enabled') :
						E('span', { 'class': 'badge warning' }, 'Disabled'))
				]),
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'First Peek'),
					E('div', { 'style': 'padding: 10px 12px;' }, mesh && mesh.first_peek ? 'Enabled' : 'Disabled')
				]),
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'Connected Peers'),
					E('div', { 'style': 'padding: 10px 12px;' }, (mesh && mesh.peer_count) || 0)
				]),
				E('div', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'padding: 10px 12px;' }, 'Published Services'),
					E('div', { 'style': 'padding: 10px 12px;' }, (mesh && mesh.published_count) || 0)
				])
			]),

			// Peers Table
			peers.length > 0 ? E('div', { 'style': 'margin-top: 16px;' }, [
				E('h4', {}, 'Connected Peers'),
				E('table', { 'class': 'kiss-table' }, [
					E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Name'),
						E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'IP'),
						E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Status')
					])
				].concat(peers.map(function(p) {
					return E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
						E('td', { 'style': 'padding: 10px 12px;' }, p.name || p.id),
						E('td', { 'style': 'padding: 10px 12px;' }, p.ip),
						E('td', { 'style': 'padding: 10px 12px;' }, p.online ?
							E('span', { 'class': 'badge success' }, 'Online') :
							E('span', { 'class': 'badge danger' }, 'Offline'))
					]);
				})))
			]) : E('p', { 'style': 'color: #888; margin-top: 8px;' }, 'No peers connected')
		]);
	},

	renderServicesSection: function(services, master) {
		var wildcard = master ? master.wildcard_domain : null;
		var nodePrefix = wildcard ? wildcard.split('.')[0] : null;

		// Deduplicate services by name
		var seen = {};
		var uniqueServices = [];
		(services || []).forEach(function(s) {
			if (!seen[s.name]) {
				seen[s.name] = true;
				uniqueServices.push(s);
			}
		});

		return E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
			E('h3', {}, 'Node Services'),
			E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px; margin-bottom: 12px;' },
				wildcard ? 'Services published on *.' + wildcard : 'Published services on this node'),

			uniqueServices.length > 0 ? E('table', { 'class': 'kiss-table' }, [
				E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Service'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Domain'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Node URL'),
					E('th', { 'style': 'padding: 10px 12px; font-weight: 600;' }, 'Actions')
				])
			].concat(uniqueServices.map(function(s) {
				var nodeUrl = nodePrefix ? 'https://' + s.name + '.' + wildcard : null;
				return E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
					E('td', { 'style': 'padding: 10px 12px;' }, E('strong', {}, s.name)),
					E('td', { 'style': 'padding: 10px 12px;' }, E('a', {
						'href': 'https://' + s.domain,
						'target': '_blank',
						'style': 'color: #00d4aa;'
					}, s.domain)),
					E('td', { 'style': 'padding: 10px 12px;' }, nodeUrl ? E('a', {
						'href': nodeUrl,
						'target': '_blank',
						'style': 'color: #888; font-size: 0.9em;'
					}, s.name + '.' + wildcard) : '-'),
					E('td', { 'style': 'padding: 10px 12px;' }, E('a', {
						'href': 'https://' + s.domain,
						'target': '_blank',
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'padding: 2px 8px; font-size: 0.85em;'
					}, 'Open'))
				]);
			}))) : E('p', { 'style': 'color: #888; margin-top: 8px;' },
				'No services published. Use "metablogizerctl emancipate" to publish sites.')
		]);
	},

	renderActionsSection: function(status) {
		var self = this;

		return E('div', { 'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px;' }, [
			E('h3', {}, 'Actions'),
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.doMeshSync(); }
				}, 'Sync Mesh'),

				status.mode === 'standalone' ? E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.showMasterInitDialog(); }
				}, 'Initialize as Master') : null,

				status.mode === 'standalone' ? E('button', {
					'class': 'kiss-btn',
					'click': function() { self.showSlaveJoinDialog(); }
				}, 'Join as Slave') : null,

				status.mode === 'master' ? E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.showDelegateDialog(); }
				}, 'Delegate Zone') : null
			])
		]);
	},

	// Zone Management Actions
	showImportZoneDialog: function() {
		var self = this;
		ui.showModal('Import DNS Zone', [
			E('p', {}, 'Import a zone from external DNS and become authoritative master:'),
			E('div', { 'style': 'margin: 16px 0;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px;' }, 'Domain:'),
				E('input', {
					'type': 'text',
					'id': 'import-domain',
					'placeholder': 'example.com',
					'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
				})
			]),
			E('div', { 'style': 'background: #0d1117; padding: 12px; border-radius: 4px; margin: 12px 0;' }, [
				E('p', { 'style': 'margin: 0; font-size: 0.9em; color: #888;' }, [
					E('strong', {}, 'What this does:'),
					E('br'),
					'1. Query public DNS for all records (A, MX, TXT, etc.)',
					E('br'),
					'2. Generate BIND format zone file in /srv/dns/zones/',
					E('br'),
					'3. Configure dnsmasq as authoritative server'
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'margin-left: 8px;',
					'click': function() {
						var domain = document.getElementById('import-domain').value.trim();
						if (domain) {
							ui.hideModal();
							self.doZoneImport(domain);
						} else {
							ui.addNotification(null, E('p', {}, 'Please enter a domain name'), 'warning');
						}
					}
				}, 'Import Zone')
			])
		]);
	},

	showZoneContentDialog: function(domain) {
		ui.showModal('Zone: ' + domain, [
			E('p', { 'class': 'spinning' }, 'Loading zone file...')
		]);

		callZoneExport(domain).then(function(res) {
			if (res.success && res.content) {
				ui.hideModal();
				ui.showModal('Zone: ' + domain, [
					E('div', { 'style': 'max-height: 60vh; overflow: auto;' }, [
						E('pre', {
							'style': 'background: #0d1117; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 0.85em; white-space: pre-wrap; color: #c9d1d9;'
						}, res.content)
					]),
					E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': function() {
								var blob = new Blob([res.content], { type: 'text/plain' });
								var a = document.createElement('a');
								a.href = URL.createObjectURL(blob);
								a.download = domain + '.zone';
								a.click();
							}
						}, 'Download'),
						E('button', {
							'class': 'kiss-btn',
							'style': 'margin-left: 8px;',
							'click': ui.hideModal
						}, 'Close')
					])
				]);
			} else {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, 'Failed to load zone: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed to load zone: ' + e.message), 'error');
		});
	},

	doZoneDump: function(domain) {
		ui.showModal('Dumping Zone', [
			E('p', { 'class': 'spinning' }, 'Querying DNS for ' + domain + '...')
		]);

		callZoneDump(domain).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'Zone dumped: ' + res.records + ' records in ' + res.file), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Dump failed: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Dump failed: ' + e.message), 'error');
		});
	},

	doZoneImport: function(domain) {
		ui.showModal('Importing Zone', [
			E('p', { 'class': 'spinning' }, 'Importing ' + domain + ' and configuring as authoritative...')
		]);

		callZoneImport(domain).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.showModal('Zone Imported', [
					E('p', {}, [
						'Successfully imported ',
						E('strong', {}, domain),
						' with ',
						E('strong', {}, res.records),
						' records.'
					]),
					E('div', { 'style': 'background: #0d1117; padding: 12px; border-radius: 4px; margin: 12px 0;' }, [
						E('p', { 'style': 'margin: 0; font-size: 0.9em;' }, [
							E('strong', {}, 'Zone file: '),
							res.file
						]),
						E('p', { 'style': 'margin: 8px 0 0 0; font-size: 0.9em;' }, [
							E('strong', {}, 'Test: '),
							E('code', {}, 'dig @127.0.0.1 ' + domain)
						])
					]),
					E('div', { 'class': 'right' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'click': function() { location.reload(); }
						}, 'OK')
					])
				]);
			} else {
				ui.addNotification(null, E('p', {}, 'Import failed: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Import failed: ' + e.message), 'error');
		});
	},

	doZoneReload: function(domain) {
		ui.showModal('Reloading Zone', [
			E('p', { 'class': 'spinning' }, 'Reloading ' + domain + ' in dnsmasq...')
		]);

		callZoneReload(domain).then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Zone reloaded: ' + (res.message || 'Success')), 'success');
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Reload failed: ' + e.message), 'error');
		});
	},

	// Secondary DNS Actions
	showAddSecondaryDialog: function() {
		var self = this;
		ui.showModal('Add Secondary DNS Provider', [
			E('p', {}, 'Configure an external DNS provider as secondary server:'),
			E('div', { 'style': 'margin: 16px 0;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px;' }, 'Provider:'),
				E('select', {
					'id': 'secondary-provider',
					'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
				}, [
					E('option', { 'value': 'ovh' }, 'OVH'),
					E('option', { 'value': 'gandi' }, 'Gandi'),
					E('option', { 'value': 'cloudflare' }, 'Cloudflare')
				])
			]),
			E('div', { 'style': 'margin: 16px 0;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px;' }, 'Domain:'),
				E('input', {
					'type': 'text',
					'id': 'secondary-domain',
					'placeholder': 'example.com',
					'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
				})
			]),
			E('div', { 'style': 'background: #0d1117; padding: 12px; border-radius: 4px; margin: 12px 0;' }, [
				E('p', { 'style': 'margin: 0; font-size: 0.9em; color: #888;' }, [
					E('strong', {}, 'Requirements:'),
					E('br'),
					'1. Domain must be imported as authoritative zone first',
					E('br'),
					'2. Provider API credentials must be configured',
					E('br'),
					'3. Provider will pull zones via AXFR'
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'margin-left: 8px;',
					'click': function() {
						var provider = document.getElementById('secondary-provider').value;
						var domain = document.getElementById('secondary-domain').value.trim();
						if (provider && domain) {
							ui.hideModal();
							self.doSecondaryAdd(provider, domain);
						} else {
							ui.addNotification(null, E('p', {}, 'Please fill all fields'), 'warning');
						}
					}
				}, 'Add Secondary')
			])
		]);
	},

	doSecondaryAdd: function(provider, domain) {
		ui.showModal('Configuring Secondary', [
			E('p', { 'class': 'spinning' }, 'Adding ' + provider.toUpperCase() + ' as secondary for ' + domain + '...')
		]);

		callSecondaryAdd(provider, domain).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', {}, provider.toUpperCase() + ' configured as secondary for ' + domain), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed: ' + e.message), 'error');
		});
	},

	doSecondaryRemove: function(provider) {
		var self = this;
		ui.showModal('Confirm Remove', [
			E('p', {}, 'Remove ' + provider.toUpperCase() + ' as secondary DNS provider?'),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'margin-left: 8px;',
					'click': function() {
						ui.hideModal();
						callSecondaryRemove(provider, '').then(function() {
							ui.addNotification(null, E('p', {}, provider.toUpperCase() + ' removed'), 'success');
							location.reload();
						}).catch(function(e) {
							ui.addNotification(null, E('p', {}, 'Failed: ' + e.message), 'error');
						});
					}
				}, 'Remove')
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
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
						'class': 'kiss-btn kiss-btn-green',
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
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
