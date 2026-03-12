"use strict";
"require view";
"require ui";
"require rpc";
"require secubox/kiss-theme";

var callGetPeers = rpc.declare({
	object: "luci.secubox-p2p",
	method: "get_peers",
	expect: { peers: [] }
});

return view.extend({
	peers: [],

	load: function() {
		var self = this;
		return callGetPeers().then(function(result) {
			self.peers = Array.isArray(result) ? result : (result.peers || []);
			return {};
		}).catch(function(err) {
			console.error("P2P Peers error:", err);
			return {};
		});
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var totalPeers = this.peers.length;
		var onlinePeers = this.peers.filter(function(p) { return p.status === 'online'; }).length;
		var offlinePeers = totalPeers - onlinePeers;

		return [
			KissTheme.stat(totalPeers, 'Total Peers', c.blue),
			KissTheme.stat(onlinePeers, 'Online', c.green),
			KissTheme.stat(offlinePeers, 'Offline', offlinePeers > 0 ? c.red : c.muted),
			KissTheme.stat(onlinePeers > 0 ? 'Active' : 'Idle', 'Mesh Status', onlinePeers > 0 ? c.cyan : c.muted)
		];
	},

	render: function() {
		var self = this;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'P2P Peers'),
					KissTheme.badge('Mesh', 'cyan')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Manage peer connections in the MirrorBox mesh network')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Actions
			E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-cyan',
					'click': function() { self.discoverPeers(); }
				}, 'Discover Peers'),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.addPeerManually(); }
				}, 'Add Peer')
			]),

			// Peers Table
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Connected Peers'),
					KissTheme.badge(this.peers.length + ' peers', 'blue')
				]),
				this.renderPeersTable()
			)
		];

		return KissTheme.wrap(content, 'admin/secubox/mirrorbox/peers');
	},

	renderPeersTable: function() {
		var self = this;

		if (!this.peers || this.peers.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No peers found. Click Discover to find peers.');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, 'Name'),
				E('th', { 'style': 'padding: 10px 12px;' }, 'Address'),
				E('th', { 'style': 'padding: 10px 12px;' }, 'Status'),
				E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, 'Actions')
			])),
			E('tbody', {}, this.peers.map(function(peer) {
				var isOnline = peer.status === 'online';
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, peer.name || peer.id),
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace;' }, peer.address || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, KissTheme.badge(peer.status || 'unknown', isOnline ? 'green' : 'red')),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': function() { self.removePeer(peer.id); }
						}, 'Remove')
					])
				]);
			}))
		]);
	},

	discoverPeers: function() {
		ui.showModal(_('Discovering Peers'), [
			E('p', { 'class': 'spinning' }, _('Scanning network for peers...'))
		]);
		setTimeout(function() {
			ui.hideModal();
			location.reload();
		}, 2000);
	},

	addPeerManually: function() {
		var addressInput;

		ui.showModal(_('Add Peer'), [
			E('p', { 'style': 'color: var(--kiss-muted);' }, _('Enter the peer address to connect')),
			E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin: 16px 0;' }, [
				E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Peer Address')),
				addressInput = E('input', {
					'type': 'text',
					'placeholder': '192.168.1.100 or peer.example.com',
					'style': 'width: 100%; padding: 10px 14px; background: var(--kiss-bg); ' +
						'border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
				})
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var address = addressInput.value.trim();
						if (!address) {
							ui.addNotification(null, E('p', _('Please enter a peer address')), 'error');
							return;
						}
						ui.hideModal();
						ui.addNotification(null, E('p', _('Manual add not implemented yet')), 'info');
					}
				}, _('Add')),
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	removePeer: function(peerId) {
		ui.showModal(_('Remove Peer'), [
			E('p', { 'style': 'color: var(--kiss-text);' }, _('Are you sure you want to remove this peer?')),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						ui.addNotification(null, E('p', _('Remove not implemented yet')), 'info');
					}
				}, _('Remove')),
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
